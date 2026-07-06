/* ===================== Scope + Tier + Pricing → AI Analyze ===================== */

// Map scope id → ชื่อหมวดภาษาไทย (ตรงกับ category ที่ Edge Function ต้องการ)
const SCOPE_CAT = {
  footing:'ฐานราก', column:'เสา', beam:'คาน',
  slab:'พื้น', stair:'บันได', roof:'หลังคา',
  wall:'ผนัง', door_window:'ประตู-หน้าต่าง', floor_finish:'พื้นผิว', ceiling:'ฝ้าเพดาน',
};

// ---- สายงาน (discipline) — เลือกได้ทีละโหมด เพราะ Edge Function ใช้ prompt คนละก้อน ----
const DISC_OPTS = [
  { id:'str',  th:'งานโครงสร้าง', d:'ฐานราก เสา คาน พื้น บันได หลังคา' },
  { id:'arch', th:'งานสถาปัตย์',  d:'ผนัง ประตู-หน้าต่าง พื้นผิว ฝ้า' },
];
const DISC_DEFAULT_SCOPE = {
  str:  ['footing','column','beam','slab','stair'],
  arch: ['wall','door_window','floor_finish','ceiling'],
};

const ANALYZE_STEPS = [
  'อ่านและตรวจสอบไฟล์แบบ',
  'ส่งแบบให้ AI วิเคราะห์',
  'ถอดปริมาณตามขอบเขตที่เลือก',
  'จัดรูปแบบผลลัพธ์ BOQ',
];

// ── ข้อความ "AI กำลังทำอะไร" ระหว่างถอดปริมาณ (หมุนตามหมวดที่เลือก) ──────
// หมายเหตุ: เป็นข้อความบ่งชี้ตามลำดับงานจริง ไม่ใช่ progress สดจาก Claude
// (Edge Function เรียก Claude ครั้งเดียวจบ จึงไม่มี progress ระดับหมวดให้ดึง)
const SCOPE_STAGE_MSGS = {
  footing: ['กำลังอ่าน Schedule ฐานราก (F1, F2…)', 'ถอดปริมาณคอนกรีตฐานราก', 'คำนวณเหล็กเสริม งานขุดดิน และทรายรองพื้น'],
  column:  ['กำลังวิเคราะห์ขนาดและตำแหน่งเสา', 'ถอดปริมาณคอนกรีตเสา', 'คำนวณเหล็กยืนและเหล็กปลอกเสา'],
  beam:    ['กำลังอ่านผังคานและ Beam Schedule', 'ถอดปริมาณคอนกรีตคาน', 'คำนวณเหล็กเสริมและเหล็กปลอกคาน'],
  slab:    ['กำลังวิเคราะห์พื้น (หล่อในที่ / สำเร็จรูป)', 'ถอดปริมาณพื้นและท้องพื้น'],
  stair:   ['กำลังถอดปริมาณบันได'],
  roof:    ['กำลังวิเคราะห์โครงหลังคา', 'ถอดปริมาณงานหลังคาและวัสดุมุง'],
  wall:         ['กำลังไล่วัดผนังทีละแนวจากผังพื้น', 'หักช่องเปิดประตู-หน้าต่างออกจากผนัง', 'คำนวณพื้นที่ก่อและฉาบปูน'],
  door_window:  ['กำลังอ่านตารางประตู-หน้าต่าง (D1, W1…)', 'นับจำนวนบานจากผังทุกชั้น', 'กระทบยอดจำนวนบานกับตาราง'],
  floor_finish: ['กำลังอ่าน Room Finish Schedule', 'ถอดพื้นที่วัสดุปูพื้นรายห้อง', 'คำนวณบัวเชิงผนัง'],
  ceiling:      ['กำลังอ่านผังฝ้าเพดานและระดับฝ้า', 'ถอดพื้นที่ฝ้ารายห้อง'],
};
const SCOPE_STAGE_ORDER = ['footing','column','beam','slab','stair','roof','wall','door_window','floor_finish','ceiling'];
const STAGE_SECS = 7;   // เปลี่ยนข้อความทุก ~7 วิ

// สร้างลำดับข้อความตามหมวดที่เลือก (เรียงตามลำดับการถอดแบบจริง)
function buildAnalyzeStages(scopeIds){
  const intro = ['กำลังอ่านสารบัญแบบและ Schedule รวม', 'กำลังจับคู่ผัง (Plan) กับ Schedule'];
  const body = SCOPE_STAGE_ORDER
    .filter(id => scopeIds.includes(id))
    .flatMap(id => SCOPE_STAGE_MSGS[id] || []);
  return [...intro, ...body, 'กำลังตรวจทานความถูกต้องของปริมาณทั้งหมด…'];
}

// ── จำแนก error ดิบ → { title, hint } ภาษาคน (ปัญหา + วิธีแก้) ──────────
function classifyAnalyzeError(err, elapsed){
  const raw = (err && err.message ? err.message : String(err || '')).toLowerCase();
  // เวลานานเกิน ~120 วิ หรือ AbortError = timeout (ไม่ใช่ user cancel เพราะจัดการก่อนเรียกฟังก์ชันนี้แล้ว)
  const looksTimeout = err?.name === 'AbortError' || /timeout|timed out|gateway|504|408|deadline/i.test(raw) || (elapsed >= 120);
  if(/failed to fetch|networkerror|load failed|err_network|connection/.test(raw)){
    return { title:'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
      hint:'ตรวจสอบสัญญาณอินเทอร์เน็ตแล้วกด “ลองใหม่” · หากยังไม่ได้ แสดงว่าเซิร์ฟเวอร์อาจกำลังปรับปรุง' };
  }
  if(looksTimeout){
    return { title:'AI ใช้เวลาประมวลผลนานเกินกำหนด',
      hint:'แบบอาจมีหลายแผ่นหรือไฟล์ใหญ่ · ลองลดขอบเขตงาน (เลือกหมวดน้อยลง) หรือแยกอัปโหลดทีละไฟล์ แล้วกด “ลองใหม่”' };
  }
  // API key ผิด/หมดเครดิต = ปัญหาบัญชีฝั่งเรา ผู้ใช้ retry เองไม่หาย ต้องแจ้งแอดมิน
  //   (เช็คก่อน gateway/overload เพราะ error ห่อว่า "claude api ..." เสมอ)
  // Anthropic 401/403 = key ผิด/หมดอายุ (บางครั้ง body ว่าง เหลือแค่ "claude api http=401")
  //   ต่างจาก session-401 ของ Supabase (ไม่มีคำว่า "claude api") — เช็คก่อนกิ่ง session
  if(/invalid x-api-key|authentication_error|api[_ ]?key|credit balance|billing|claude api http=40[13]/.test(raw)){
    return { title:'ระบบ AI ตั้งค่าไม่พร้อม',
      hint:'คีย์ API หรือเครดิตของระบบมีปัญหา — กรุณาแจ้งผู้ดูแลระบบ (retry เองไม่ช่วย)' };
  }
  // 5xx/502/520/522/524 = เซิร์ฟเวอร์ AI ต้นทาง (Anthropic/Cloudflare) ขัดข้องชั่วคราว
  if(/http=5\d\d|502|503|504|520|521|522|523|524|bad gateway|gateway|cloudflare/.test(raw)){
    return { title:'เซิร์ฟเวอร์ AI ต้นทางขัดข้องชั่วคราว',
      hint:'ระบบ Claude ฝั่งผู้ให้บริการมีปัญหาชั่วขณะ (มักหายใน 1–2 นาที) · รอสักครู่แล้วกด “ลองใหม่”' };
  }
  if(/(^|[^0-9])401([^0-9]|$)|403|unauthorized|forbidden|jwt|session/.test(raw)){
    return { title:'เซสชันหมดอายุ',
      hint:'กรุณาออกจากระบบแล้วเข้าใหม่ จากนั้นลองอีกครั้ง' };
  }
  if(/anthropic|claude|overloaded|rate|429|529/.test(raw)){
    return { title:'บริการ AI ไม่พร้อมใช้งานชั่วคราว',
      hint:'ระบบ AI กำลังมีคำขอจำนวนมาก · รอสักครู่แล้วกด “ลองใหม่”' };
  }
  if(/no file|storage|ไฟล์|not found|404/.test(raw)){
    return { title:'อ่านไฟล์แบบไม่สำเร็จ',
      hint:'ไฟล์อาจอัปโหลดไม่สมบูรณ์ · กรุณากลับไปอัปโหลดไฟล์ใหม่' };
  }
  return { title:'เกิดข้อผิดพลาดระหว่างวิเคราะห์',
    hint:(err && err.message) ? err.message : 'กรุณากด “ลองใหม่” อีกครั้ง' };
}

function ScopeScreen({ project, uploadData, onConfirm, onAnalyzingChange }){
  const toast = useToast();
  const [disc,setDisc] = useState(null);   // สายงาน: null=ยังไม่เลือก · str โครงสร้าง / arch สถาปัตย์
  const [scope,setScope] = useState([]);   // เริ่มว่าง — หมวดย่อยจะโผล่หลังเลือกสายงาน (กรอบแดง→เขียว)
  // สลับสายงาน → รีเซ็ต scope เป็นค่าเริ่มต้นของสายนั้น (หมวดสองสายผสมกันไม่ได้ — prompt คนละก้อน)
  const switchDisc = (id)=>{ if(id!==disc){ setDisc(id); setScope(DISC_DEFAULT_SCOPE[id]); } };
  const [tier,setTier] = useState('engineer');
  const [pricing,setPricing] = useState('qty_only'); // ค่าเริ่มต้น: ถอดปริมาณอย่างเดียว (ยังไม่จับคู่ราคา)
  const [showQuote,setShowQuote] = useState(false);
  // analyzing phase
  const [phase,setPhase] = useState('select');   // 'select' | 'analyzing'
  const [analyzeStep,setAnalyzeStep] = useState(0);
  const [analyzeMsg,setAnalyzeMsg] = useState('');
  const [analyzeErr,setAnalyzeErr] = useState(null);   // { title, hint } | null
  const [elapsed,setElapsed] = useState(0);   // วินาทีที่ใช้ไประหว่างวิเคราะห์
  const abortRef = useRef(null);               // AbortController ของ client fetch ปัจจุบัน
  const cancelledRef = useRef(false);          // true = ผู้ใช้กดยกเลิกเอง (ไม่ใช่ timeout)
  const pollCancelRef = useRef(null);          // ฟังก์ชันยกเลิก poll ทันที (set ระหว่าง poll phase)

  // CLIENT-SIDE TIMEOUT = 45 วิ สำหรับขั้น "ส่งแบบ/สร้าง job" (async path ตอบ ~2s)
  // ถ้าค้างเกินนี้ = server ไม่ตอบ → fail เร็วพร้อมข้อความ แทนที่จะค้างเงียบ
  const CLIENT_TIMEOUT = 45_000;
  const POLL_MAX_WAIT_MS = 3*60*1000;          // รอ poll สูงสุด 3 นาที (backend abort 145 วิ. + เผื่อเขียนผล/reaper) — free-plan worker ตายที่ ~150 วิ.
  const POLL_QUERY_TIMEOUT = 8_000;            // ตัด query แต่ละรอบที่ค้างเกิน 8 วิ

  // จับเวลาขณะ AI กำลังถอดปริมาณ
  useEffect(()=>{
    if(phase!=='analyzing') return;
    setElapsed(0);
    const t = setInterval(()=>setElapsed(e=>e+1), 1000);
    return ()=>clearInterval(t);
  },[phase]);
  const fmtTime = (s)=>{ const n=Math.max(0,Math.floor(s)); return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`; };

  // ยกเลิกการวิเคราะห์กลางคัน (ปุ่ม Cancel)
  const cancelAnalyze = () => {
    cancelledRef.current = true;
    abortRef.current?.abort();      // ยกเลิก fetch แรก (ถ้ายังอยู่)
    pollCancelRef.current?.();      // ยกเลิก poll ทันที ไม่ต้องรอรอบถัดไป
  };

  const toggleScope = id => setScope(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);

  // ── AI วิเคราะห์หลังอนุมัติ scope ──────────────────────────
  const startAnalyze = async () => {
    // เคลียร์งานเก่าที่อาจค้างก่อนเริ่มรอบใหม่ (กันรีทรายแล้ว poll/fetch เดิมค้างทับ)
    abortRef.current?.abort();
    pollCancelRef.current?.();
    pollCancelRef.current = null;
    abortRef.current = null;

    setPhase('analyzing');
    setAnalyzeErr(null);
    setAnalyzeStep(0);
    cancelledRef.current = false;
    onAnalyzingChange && onAnalyzingChange(true);
    const withPrice = pricing === 'with_price'; // ส่งกลับให้ App อัปเดต project.pricing
    const t0 = Date.now();   // จับเวลาเริ่ม เพื่อประเมิน timeout ใน catch

    try {
      setAnalyzeStep(0);
      await new Promise(r=>setTimeout(r,500));

      // ถ้าไม่มีไฟล์จริง → mock flow
      if(!uploadData?.storagePath) {
        setAnalyzeStep(1); await new Promise(r=>setTimeout(r,600));
        setAnalyzeStep(2); await new Promise(r=>setTimeout(r,800));
        setAnalyzeStep(3); await new Promise(r=>setTimeout(r,500));
        toast('วิเคราะห์แบบสำเร็จ ✓');
        onAnalyzingChange && onAnalyzingChange(false);
        onConfirm(null, withPrice);
        return;
      }

      setAnalyzeStep(1);
      setAnalyzeMsg('กำลังส่งแบบให้ Claude AI...');
      await new Promise(r=>setTimeout(r,300));

      // ดึง token แบบทนทาน (getSession อาจค้างจาก auth-lock bug ของ supabase-js →
      // getAccessTokenFast fallback อ่านจาก localStorage แทนการ fail)
      const withTimeout = (p, ms, label) => Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error(label)), ms)),
      ]);
      let accessToken = await window.getAccessTokenFast();
      if(!accessToken) throw new Error('session expired — ไม่พบเซสชันผู้ใช้ กรุณารีเฟรชหน้าเว็บแล้วลองใหม่');
      // best-effort: รีเฟรช token ถ้าใกล้หมดอายุ (กันรอบวิเคราะห์ที่นานทำให้ JWT หมดอายุ → 401)
      // ถ้าขั้นนี้ค้าง/ล้ม ก็ใช้ token เดิมต่อ ไม่ทำให้ทั้งงานล้ม
      try {
        const r0 = await withTimeout(window.supabase.auth.getSession(), 4000, 'to');
        const s = r0?.data?.session;
        if(s?.expires_at && s.expires_at * 1000 < Date.now() + 120000){
          const r = await withTimeout(window.supabase.auth.refreshSession(), 8000, 'to');
          if(r?.data?.session?.access_token) accessToken = r.data.session.access_token;
        }
      } catch(authErr) { /* ใช้ accessToken เดิมต่อ */ }
      const selectedScope = scope.map(id => SCOPE_CAT[id]).filter(Boolean);

      const aiT0 = Date.now();   // จับเวลาเฉพาะส่วน AI ถอดปริมาณ (ตั้งแต่ส่งแบบจนได้ผล)

      // สร้าง AbortController สำหรับ client-side timeout
      const clientAC = new AbortController();
      abortRef.current = clientAC;
      const clientTimer = setTimeout(() => clientAC.abort('client_timeout'), CLIENT_TIMEOUT);

      let submitRes;
      try {
        submitRes = await fetch('https://zokzcjbvjcxfjpcjsegx.supabase.co/functions/v1/analyze-drawing', {
          method: 'POST',
          signal: clientAC.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': 'sb_publishable_nL-wFMwEzKss2HZOylspIA_9ypFMEWv'
          },
          body: JSON.stringify({
            storagePath:   uploadData.storagePath,
            fileName:      uploadData.fileName,
            projectName:   project.name,
            selectedScope,
            discipline:    disc === 'arch' ? 'arch' : 'structural',
          })
        });
      } finally {
        clearTimeout(clientTimer);
        abortRef.current = null;
      }

      if(!submitRes.ok){
        let detail = '';
        try { const e = await submitRes.json(); detail = e.error || e.message || ''; }
        catch(_) { detail = `HTTP ${submitRes.status}`; }
        throw new Error(detail || `ส่งคำขอไม่สำเร็จ (HTTP ${submitRes.status})`);
      }

      const submitResult = await submitRes.json();

      // ── Async job path: ได้ job_id → poll DB ──────────────────────
      if(submitResult.job_id){
        const stages = buildAnalyzeStages(scope);   // ลำดับข้อความตามหมวดที่เลือก
        setAnalyzeStep(2);
        setAnalyzeMsg(stages[0]);
        const jobId = submitResult.job_id;
        const POLL_INTERVAL = 5000;          // poll ทุก 5 วิ

        const boqData = await new Promise((resolve, reject) => {
          const pollStart = Date.now();
          let stopped = false;          // กันไม่ให้ settle ซ้ำ
          let pollTimer = null;
          let onVisible = null;         // listener กลับมา foreground → poll ทันที (เคลียร์ใน finish)
          let consecErr = 0;            // นับ query ที่ล้มต่อเนื่อง (กัน blip ชั่วคราว)
          const MAX_CONSEC_ERR = 6;     // ล้มติดกัน ~30 วิ ค่อยยอมแพ้ (ไม่เด้งกลับทันทีจาก blip เดียว)

          // ปิดงานครั้งเดียว: เคลียร์ timer/watchdog + ปลด cancel ref แล้วค่อย settle
          const finish = (fn, val) => {
            if(stopped) return;
            stopped = true;
            clearTimeout(pollTimer);
            clearTimeout(watchdog);
            if(onVisible) document.removeEventListener('visibilitychange', onVisible);
            if(pollCancelRef.current === cancelPoll) pollCancelRef.current = null;
            fn(val);
          };

          // ปุ่มยกเลิกเรียกอันนี้ → หยุด poll ทันที ไม่ต้องรอรอบถัดไป
          const cancelPoll = () => finish(reject, new Error('user_cancel_poll'));
          pollCancelRef.current = cancelPoll;

          // ‼️ เช็คสถานะผ่าน fetch() ตรง ๆ ไป REST endpoint — ไม่ผ่าน supabase-js
          // เพราะ client library ค้างได้ (auth/fetch-lock) และ .abortSignal() ปลดล็อกไม่จริง
          // → ทำให้ poll/กู้ผลค้างถาวรทั้งที่งานเสร็จแล้ว. fetch + AbortController ตัดการค้างได้ชัวร์
          const fetchJob = async () => {
            const ac = new AbortController();
            const tid = setTimeout(() => ac.abort(), POLL_QUERY_TIMEOUT);
            try {
              const res = await fetch(
                `https://zokzcjbvjcxfjpcjsegx.supabase.co/rest/v1/analysis_jobs?id=eq.${jobId}&select=status,result,error_msg`,
                { headers: {
                    apikey: 'sb_publishable_nL-wFMwEzKss2HZOylspIA_9ypFMEWv',
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json'
                  }, signal: ac.signal }
              );
              if(!res.ok) throw new Error('HTTP ' + res.status);
              const arr = await res.json();
              return Array.isArray(arr) ? (arr[0] || null) : null;
            } finally { clearTimeout(tid); }
          };

          // ก่อนยอมแพ้ (watchdog/query fail) เช็คสถานะครั้งสุดท้าย — กันกรณีแท็บถูก throttle
          // ทำให้ poll พลาดจังหวะ done ทั้งที่งานเสร็จแล้ว → ถ้า done ให้ resolve ไม่ reject ทิ้งผลลัพธ์
          const giveUpOrRescue = async (rejectErr) => {
            if(stopped) return;
            try {
              const job = await fetchJob();
              if(stopped) return;
              if(job?.status === 'done')  { finish(resolve, job.result); return; }
              if(job?.status === 'error') { finish(reject, new Error(job.error_msg || 'AI ประมวลผลไม่สำเร็จ')); return; }
            } catch(_) { /* เช็คสุดท้ายล้ม → ยอมแพ้ด้วย error เดิม */ }
            finish(reject, rejectErr);
          };

          // WATCHDOG แข็ง: หยุดแน่นอนเมื่อเกินเวลาสูงสุด แม้ query รอบใดรอบหนึ่งจะค้าง
          const watchdog = setTimeout(
            () => giveUpOrRescue(new Error('timeout — AI ใช้เวลานานเกินกำหนด กรุณาลดขอบเขตงานแล้วลองใหม่')),
            POLL_MAX_WAIT_MS
          );

          const poll = async () => {
            if(stopped) return;
            try {
              const job = await fetchJob();
              if(stopped) return;
              consecErr = 0;   // อ่านสำเร็จ → รีเซ็ตตัวนับ
              if(job?.status === 'done')  { finish(resolve, job.result); return; }
              if(job?.status === 'error') { finish(reject, new Error(job.error_msg || 'AI ประมวลผลไม่สำเร็จ')); return; }
              const waited = Math.floor((Date.now()-pollStart)/1000);
              const idx = Math.min(Math.floor(waited/STAGE_SECS), stages.length-1);
              setAnalyzeMsg(stages[idx]);
            } catch(e){
              // query รอบนี้ค้าง/พลาด → ไม่ล้มทั้งกระบวนการ ปล่อยให้รอบถัดไปลองใหม่ จน watchdog ตัดเอง
              if(stopped) return;
              consecErr++;
              if(consecErr >= MAX_CONSEC_ERR){
                giveUpOrRescue(new Error('ตรวจสถานะ job ไม่สำเร็จซ้ำหลายครั้ง — ' + (e?.message || 'network')));
                return;
              }
              console.warn(`poll iteration failed (${consecErr}/${MAX_CONSEC_ERR}) จะลองใหม่:`, e);
            }
            // นัดรอบถัดไปเสมอ (ตราบใดยังไม่ stopped) — watchdog เป็นตัวคุมเพดานเวลา
            pollTimer = setTimeout(poll, POLL_INTERVAL);
          };
          pollTimer = setTimeout(poll, POLL_INTERVAL);

          // เมื่อแท็บถูกพับไว้เบื้องหลัง setTimeout จะถูก throttle (poll ช้า/พลาด)
          // → พอกลับมา foreground ให้ยิง poll ทันที ไม่ต้องรอรอบ 5 วิ.ที่อาจถูกหน่วง
          onVisible = () => {
            if(stopped || document.visibilityState !== 'visible') return;
            clearTimeout(pollTimer);
            poll();
          };
          document.addEventListener('visibilitychange', onVisible);
        });

        setAnalyzeStep(3);
        const warnA = boqData?.summary?._warning;
        setAnalyzeMsg(`พบ ${boqData?.items?.length || 0} รายการ`);
        if(warnA) console.warn('analysis warning:', warnA);
        toast(warnA ? '⚠️ วิเคราะห์เสร็จ แต่ข้อมูลบางส่วนอาจไม่ครบ — ดูคำแนะนำในผลลัพธ์' : 'วิเคราะห์แบบสำเร็จ ✓');
        onAnalyzingChange && onAnalyzingChange(false);
        onConfirm(boqData, withPrice, Math.round((Date.now()-aiT0)/1000));
        return; // ออกจาก try block
      }

      // ── Sync fallback path (local dev / runtime เก่า) ──────────
      const boqData = submitResult.data;
      setAnalyzeStep(3);
      const warnS = boqData?.summary?._warning;
      setAnalyzeMsg(`พบ ${boqData?.items?.length || 0} รายการ`);
      await new Promise(r=>setTimeout(r,700));
      if(warnS) console.warn('analysis warning:', warnS);
      toast(warnS ? '⚠️ วิเคราะห์เสร็จ แต่ข้อมูลบางส่วนอาจไม่ครบ — ดูคำแนะนำในผลลัพธ์' : 'วิเคราะห์แบบสำเร็จ ✓');
      onAnalyzingChange && onAnalyzingChange(false);
      onConfirm(boqData, withPrice, Math.round((Date.now()-aiT0)/1000));

    } catch(err) {
      const secs = (Date.now() - t0) / 1000;
      const wasCancel = cancelledRef.current;
      cancelledRef.current = false;
      if(wasCancel){
        setAnalyzeErr({ title:'ยกเลิกการวิเคราะห์แล้ว', hint:'กดปุ่ม "ลองใหม่" เพื่อเริ่มต้นใหม่' });
      } else {
        setAnalyzeErr(classifyAnalyzeError(err, secs));
      }
      setPhase('select');
      onAnalyzingChange && onAnalyzingChange(false);
      console.error('analyze error:', err);
    }
  };

  // ---- quote math ----
  const baseFee = 6000;
  const scopeFee = scope.reduce((a,id)=> a + (SCOPE_ITEMS.find(s=>s.id===id)?.base||0), 0);
  const engFee = tier==='engineer' ? 8500 : 0;
  const priceFee = pricing==='with_price' ? 5500 : 0;
  const total = baseFee + scopeFee + engFee + priceFee;

  const tiers = [
    { id:'auto', icon:'sparkle', t:'Auto', d:'ใช้ระบบอัตโนมัติ ราคาประหยัด', meta:'⏱ 1–2 ชั่วโมง', color:'--cyan' },
    { id:'engineer', icon:'shield', t:'Auto + วิศวกรตรวจ', d:'มีวิศวกรลงนามรับรองผล', meta:'⏱ 1–2 วัน · +฿8,500', color:'--purple' },
  ];
  const pricings = [
    { id:'qty_only', icon:'table', t:'ถอดปริมาณอย่างเดียว', d:'BOQ ปริมาณงานครบถ้วน แม่นยำ ยังไม่จับคู่ราคา', meta:'แนะนำ · เน้นความเที่ยงตรง', color:'--cyan' },
    { id:'with_price', icon:'money', t:'ปริมาณ + ราคา', d:'เพิ่มการจับคู่ราคาภายหลัง (optional)', meta:'+฿5,500', color:'--orange' },
  ];

  // ── หน้าระหว่าง AI วิเคราะห์ ──────────────────────────────
  if(phase==='analyzing'){
    return (
      <div className="content scrollthin" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className="card" style={{maxWidth:500,width:'100%',padding:'36px 32px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:4}}>
            <div style={{fontSize:18,fontWeight:700}}>AI กำลังวิเคราะห์แบบก่อสร้าง</div>
            <span className="badge b-amber mono" style={{fontSize:12.5,flex:'0 0 auto'}}>
              <span className="spin" style={{width:11,height:11}}></span> {fmtTime(elapsed)}
            </span>
          </div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:24}}>
            {scope.map(id=>SCOPE_CAT[id]).filter(Boolean).join(' · ')} · {project.name}
            {uploadData?.fileName && (
              <div style={{marginTop:4,display:'flex',alignItems:'center',gap:6,color:'var(--ink-4)'}}>
                <Icon name="file" size={13}/> {uploadData.fileName}
              </div>
            )}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {ANALYZE_STEPS.map((s,i)=>{
              const done = i<analyzeStep;
              const cur  = i===analyzeStep;
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:13,
                  opacity:i>analyzeStep?0.35:1,transition:'opacity .3s'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',flex:'0 0 32px',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    background:done?'var(--green-soft)':cur?'var(--primary-soft)':'var(--surface-2)',
                    color:done?'var(--green)':'var(--primary)',
                    border:'1.5px solid '+(done?'var(--green-soft)':cur?'var(--primary-soft)':'var(--border)')}}>
                    {done?<Icon name="check" size={15}/>
                         :cur?<span className="spin" style={{width:14,height:14}}></span>
                         :<span className="mono" style={{fontSize:12,color:'var(--ink-4)'}}>{i+1}</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14.5,fontWeight:cur||done?600:400,
                      color:done?'var(--green)':cur?'var(--ink)':'var(--ink-3)'}}>{s}</div>
                    {cur&&analyzeMsg&&<div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{analyzeMsg}</div>}
                  </div>
                  {done&&<Icon name="check" size={15} style={{color:'var(--green)'}}/>}
                </div>
              );
            })}
          </div>
          {/* ── info / warning box ── */}
          {elapsed < 90 ? (
            <div style={{marginTop:24,padding:'12px 16px',background:'var(--primary-soft)',borderRadius:8,
              fontSize:13,color:'var(--primary)',lineHeight:1.7}}>
              ⏳ Claude AI กำลังอ่านแบบตามขอบเขตที่เลือก อาจใช้เวลา 30–90 วินาที<br/>
              <b>เมื่อถอดปริมาณเสร็จ ระบบจะพาไปหน้า "ผลลัพธ์ปริมาณ" ให้อัตโนมัติ</b>
            </div>
          ) : (
            <div style={{marginTop:24,padding:'14px 16px',background:'#fffbeb',border:'1px solid #fcd34d',
              borderRadius:8,fontSize:13,color:'#92400e',lineHeight:1.7}}>
              ⚠️ <b>ใช้เวลานานกว่าปกติ</b> — ไฟล์อาจมีหลายแผ่นหรือซับซ้อน<br/>
              ระบบจะหยุดเองภายใน {fmtTime(POLL_MAX_WAIT_MS/1000 - elapsed)} นาที<br/>
              <b>หากหมดเวลา ให้กดลองใหม่ได้เลย — รอบที่ 2 จะเร็วขึ้นมากและประหยัด credit เพราะระบบใช้แคชไฟล์เดิม (ภายใน 1 ชม.)</b>
            </div>
          )}

          {/* ── ปุ่มยกเลิก (แสดงหลัง 15 วิ) ── */}
          {elapsed >= 15 && (
            <button className="btn btn-ghost" style={{width:'100%',marginTop:14,color:'var(--ink-3)'}}
              onClick={cancelAnalyze}>
              <Icon name="x" size={15}/> ยกเลิกการวิเคราะห์
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="content scrollthin" style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:28,alignItems:'start'}}>
      <div>
        <div className="page-head" style={{marginBottom:18}}>
          <div>
            <h1 className="page-title">เลือกขอบเขตงาน & ระดับบริการ</h1>
            <div className="page-sub">{project.name} · ปรับตัวเลือกด้านล่าง ใบเสนอราคาจะอัปเดตอัตโนมัติ</div>
          </div>
        </div>

        {/* Section A */}
        <div className="sec">
          <div className="sec-head">
            <div className="sec-num">A</div>
            <div className="sec-title">เลือกขอบเขตงาน</div>
            <div className="sec-req">{disc ? `เลือกอย่างน้อย 1 รายการ · เลือกแล้ว ${scope.length}` : 'เริ่มจากเลือกสายงาน'}</div>
          </div>
          {/* สายงาน: โครงสร้าง / สถาปัตย์ — สลับแล้วรายการหมวดด้านล่างเปลี่ยนตาม */}
          <div style={{display:'flex',gap:10,marginBottom:14}}>
            {DISC_OPTS.map(o=>{
              const on = disc===o.id;
              return (
                <button key={o.id} onClick={()=>switchDisc(o.id)}
                  style={{flex:1,textAlign:'left',cursor:'pointer',padding:'10px 14px',borderRadius:10,
                    border:'1.5px solid '+(on?'var(--primary)':'var(--border)'),
                    background:on?'var(--primary-soft)':'var(--surface)',
                    color:on?'var(--primary)':'var(--ink-3)'}}>
                  <div style={{fontSize:14,fontWeight:700}}>{o.th}</div>
                  <div style={{fontSize:11.5,marginTop:2,opacity:.85}}>{o.d}</div>
                </button>
              );
            })}
          </div>
          {/* หมวดย่อยจะแสดงหลังเลือกสายงานด้านบนแล้วเท่านั้น — ลดความรกตา ใช้ง่ายขึ้น */}
          {disc ? (
            <div className="opt-grid cols3">
              {SCOPE_ITEMS.filter(it=>(it.disc||'str')===disc).map(it=>{
                const on = scope.includes(it.id);
                return (
                  <div key={it.id} className={'opt '+(on?'sel':'')} onClick={()=>toggleScope(it.id)}>
                    <div className="opt-ic" style={on?{color:`var(${it.color})`}:{}}>{it.icon}</div>
                    <div className="opt-body">
                      <div className="opt-t">{it.th}</div>
                      <div className="opt-d">เริ่ม {baht(it.base)}</div>
                    </div>
                    <div className="opt-check"><Icon name="check" size={14}/></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{padding:'22px 16px',textAlign:'center',color:'var(--ink-3)',fontSize:13.5,
              border:'1.5px dashed var(--border)',borderRadius:12,background:'var(--surface)'}}>
              👆 เลือกสายงานด้านบนก่อน เพื่อแสดงหมวดงานย่อยให้เลือก
            </div>
          )}
        </div>

        {/* Section B */}
        <div className="sec">
          <div className="sec-head">
            <div className="sec-num">B</div>
            <div className="sec-title">ระดับบริการ</div>
            <div className="sec-req">เลือก 1 รายการ</div>
          </div>
          <div className="opt-grid cols2">
            {tiers.map(it=>{
              const on = tier===it.id;
              return (
                <div key={it.id} className={'opt '+(on?'sel':'')} onClick={()=>setTier(it.id)}>
                  <div className="opt-ic" style={on?{color:`var(${it.color})`}:{}}><Icon name={it.icon} size={20}/></div>
                  <div className="opt-body">
                    <div className="opt-t">{it.t}</div>
                    <div className="opt-d">{it.d}</div>
                    <div style={{marginTop:7,fontSize:12,color:`var(${it.color})`,fontWeight:600}}>{it.meta}</div>
                  </div>
                  <div className="opt-check round"><Icon name="check" size={13}/></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section C */}
        <div className="sec">
          <div className="sec-head">
            <div className="sec-num">C</div>
            <div className="sec-title">รูปแบบผลลัพธ์</div>
            <div className="sec-req">ค่าเริ่มต้น: ถอดปริมาณอย่างเดียว</div>
          </div>
          <div className="opt-grid cols2">
            {pricings.map(it=>{
              const on = pricing===it.id;
              return (
                <div key={it.id} className={'opt '+(on?'sel':'')} onClick={()=>setPricing(it.id)}>
                  <div className="opt-ic" style={on?{color:`var(${it.color})`}:{}}><Icon name={it.icon} size={20}/></div>
                  <div className="opt-body">
                    <div className="opt-t">{it.t}</div>
                    <div className="opt-d">{it.d}</div>
                    <div style={{marginTop:7,fontSize:12,color:`var(${it.color})`,fontWeight:600}}>{it.meta}</div>
                  </div>
                  <div className="opt-check round"><Icon name="check" size={13}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live quote rail */}
      <div className="quote">
        <div className="quote-card">
          <div className="qh">
            <div className="t">ใบเสนอราคา (ประมาณการ)</div>
            <div className="s">อัปเดตตามตัวเลือกแบบเรียลไทม์</div>
          </div>
          <div className="qline">
            <div className="lbl">ค่าบริการพื้นฐาน</div>
            <div className="val tnum">{baht(baseFee)}</div>
          </div>
          <div className="qline">
            <div className="lbl">ขอบเขตงานที่เลือก <small>{scope.length} รายการ</small></div>
            <div className="val tnum">{baht(scopeFee)}</div>
          </div>
          <div className={'qline '+(engFee?'':'muted')}>
            <div className="lbl">วิศวกรรับรอง</div>
            <div className="val tnum">{engFee?baht(engFee):'—'}</div>
          </div>
          <div className={'qline '+(priceFee?'':'muted')}>
            <div className="lbl">โมดูลประเมินราคา</div>
            <div className="val tnum">{priceFee?baht(priceFee):'—'}</div>
          </div>
          <div className="qtotal">
            <div className="lbl">ยอดรวม</div>
            <div className="val">{baht(total)}</div>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" style={{width:'100%',marginTop:14}}
          disabled={scope.length===0}
          onClick={()=>setShowQuote(true)}>
          ดูใบเสนอราคา <Icon name="arrowR" size={17}/>
        </button>
        <button className="btn btn-ghost" style={{width:'100%',marginTop:10}}>บันทึกไว้ก่อน</button>
        <p style={{fontSize:11.5,color:'var(--ink-4)',textAlign:'center',marginTop:12,lineHeight:1.5}}>
          ราคายังไม่รวมภาษีมูลค่าเพิ่ม · ยืนยันก่อนชำระเงิน
        </p>
      </div>

      {analyzeErr && (
        <div style={{marginTop:16,padding:'14px 16px',background:'#fef2f2',border:'1px solid #fecaca',
          borderRadius:10,gridColumn:'1/-1',display:'flex',gap:12,alignItems:'flex-start'}}>
          <div style={{fontSize:18,lineHeight:1.2,flex:'0 0 auto'}}>⚠️</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:'#dc2626'}}>{analyzeErr.title}</div>
            <div style={{fontSize:13,color:'#b91c1c',marginTop:3,lineHeight:1.6}}>{analyzeErr.hint}</div>
          </div>
          <div style={{display:'flex',gap:8,flex:'0 0 auto'}}>
            <button className="btn btn-soft btn-sm" onClick={()=>setAnalyzeErr(null)}>ปิด</button>
            <button className="btn btn-primary btn-sm" onClick={startAnalyze}>
              <Icon name="refresh" size={14}/> ลองใหม่
            </button>
          </div>
        </div>
      )}

      {showQuote && (
        <QuoteModal total={total} lines={{baseFee,scopeFee,engFee,priceFee,scopeN:scope.length,tier,pricing}}
          onClose={()=>setShowQuote(false)}
          onApprove={()=>{
            setShowQuote(false);
            toast('อนุมัติใบเสนอราคาสำเร็จ ✓ กำลังส่งแบบให้ AI…','check');
            setTimeout(startAnalyze, 400);
          }}/>
      )}
    </div>
  );
}

function QuoteModal({ total, lines, onClose, onApprove }){
  const [paying,setPaying] = useState(false);
  const foot = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>บันทึกไว้ก่อน</button>
      <button className="btn btn-primary" disabled={paying} onClick={()=>{ setPaying(true); setTimeout(onApprove,1100); }}>
        {paying ? <><span className="spin"></span> กำลังประมวลผล…</> : <>อนุมัติ + ชำระเงิน</>}
      </button>
    </>
  );
  return (
    <Modal title="สรุปใบเสนอราคา" sub="ตรวจสอบรายละเอียดก่อนยืนยัน" onClose={onClose} foot={foot}>
      <div style={{border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
        <div className="qline"><div className="lbl">ค่าบริการพื้นฐาน</div><div className="val tnum">{baht(lines.baseFee)}</div></div>
        <div className="qline"><div className="lbl">ขอบเขตงานที่เลือก <small>{lines.scopeN} รายการ</small></div><div className="val tnum">{baht(lines.scopeFee)}</div></div>
        {lines.engFee>0 && <div className="qline"><div className="lbl">วิศวกรรับรอง</div><div className="val tnum">{baht(lines.engFee)}</div></div>}
        {lines.priceFee>0 && <div className="qline"><div className="lbl">โมดูลประเมินราคา</div><div className="val tnum">{baht(lines.priceFee)}</div></div>}
        <div className="qtotal"><div className="lbl">ยอดรวมสุทธิ</div><div className="val">{baht(total)}</div></div>
      </div>
      {/* mock card form */}
      <div style={{marginTop:18}}>
        <div className="field"><label>หมายเลขบัตร</label>
          <input className="inp mono" value="4242 4242 4242 4242" readOnly/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="field"><label>วันหมดอายุ</label><input className="inp mono" value="12 / 28" readOnly/></div>
          <div className="field"><label>CVC</label><input className="inp mono" value="•••" readOnly/></div>
        </div>
      </div>
    </Modal>
  );
}
window.ScopeScreen = ScopeScreen;
