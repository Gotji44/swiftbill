/* ===================== Upload drawings (Step 1) =====================
   Flow: อัปโหลด → [เลือกหน้า] → Scope → AI วิเคราะห์ → Results
   Phase 'file'    — file picker
   Phase 'loading' — pdf.js rendering thumbnails
   Phase 'picking' — user picks pages (pdf-lib will extract before upload)
   Phase uploading (boolean) — XHR upload progress
================================================================== */
function UploadScreen({ project, onComplete, onUploadingChange }){
  const toast = useToast();
  const [files,setFiles]           = useState([]);
  const [drag,setDrag]             = useState(false);
  const [uploading,setUploading]   = useState(false);
  const [uploadStep,setUploadStep] = useState(0);   // 0=idle 1=reading 2=uploading 3=done
  const [uploadPercent,setUploadPercent] = useState(0);
  const [uploadedMB,setUploadedMB] = useState(0);
  const [totalMB,setTotalMB]       = useState(0);
  const [elapsed,setElapsed]       = useState(0);
  const [error,setError]           = useState('');

  // page-picker state
  const [phase,setPhase]               = useState('file');  // 'file'|'loading'|'picking'
  const [pages,setPages]               = useState([]);      // [{idx,num,dataUrl,selected}]
  const [thumbProgress,setThumbProgress] = useState(0);
  const [totalPageCount,setTotalPageCount] = useState(0);
  const pdfBufRef = useRef(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(()=>{
    if(uploadStep===2){
      setElapsed(0);
      timerRef.current = setInterval(()=>setElapsed(e=>e+1),1000);
    } else {
      clearInterval(timerRef.current);
    }
    return ()=>clearInterval(timerRef.current);
  },[uploadStep]);

  const fmtTime = (s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const STEPS = ['อ่านและตรวจสอบไฟล์','อัปโหลดไฟล์ขึ้น Cloud'];

  const addFiles = (arr) => {
    setFiles(f=>[...f, ...arr.map(x=>({
      id: Math.random().toString(36).slice(2),
      name: x.name,
      size: x.size < 1000 ? x.size : x.size/1048576,
      raw: x.raw || null
    }))]);
  };
  const onPick = (e) => {
    const arr = [...e.target.files].map(f=>({name:f.name,size:f.size,raw:f}));
    if(arr.length) addFiles(arr);
    e.target.value = '';
  };
  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const arr = [...e.dataTransfer.files].map(f=>({name:f.name,size:f.size,raw:f}));
    if(arr.length) addFiles(arr);
  };
  const remove = (id) => {
    setFiles(f=>f.filter(x=>x.id!==id));
    setPhase('file'); setPages([]); pdfBufRef.current=null;
  };

  // ── dynamic script loader (โหลดเฉพาะเมื่อต้องการ) ──
  const loadScript = (src) => new Promise((resolve,reject)=>{
    if(document.querySelector(`script[src="${src}"]`)){ resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = ()=>reject(new Error('โหลด library ล้มเหลว: '+src));
    document.head.appendChild(s);
  });

  // ── โหลด thumbnail ด้วย pdf.js ──
  const loadThumbnails = async () => {
    const pdfFile = files.find(f=>f.name.toLowerCase().endsWith('.pdf') && f.raw);
    if(!pdfFile){ handleUpload(null); return; }  // ไม่มีไฟล์จริง → ข้าม

    setPhase('loading');
    setError('');
    setThumbProgress(0);
    setTotalPageCount(0);

    try {
      await loadScript('https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js');

      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

      const buf = await pdfFile.raw.arrayBuffer();
      pdfBufRef.current = buf;

      const pdf = await pdfjsLib.getDocument({data: buf}).promise;
      const count = pdf.numPages;
      setTotalPageCount(count);

      const results = [];
      for(let i=1; i<=count; i++){
        setThumbProgress(i);
        const page   = await pdf.getPage(i);
        const vp0    = page.getViewport({scale:1});
        const scale  = 140 / vp0.width;
        const vp     = page.getViewport({scale});
        const canvas = document.createElement('canvas');
        canvas.width  = vp.width;
        canvas.height = vp.height;
        await page.render({canvasContext: canvas.getContext('2d'), viewport: vp}).promise;
        results.push({idx:i-1, num:i, dataUrl:canvas.toDataURL('image/jpeg',0.7), selected:true});
        if(i%5===0 || i===count) setPages([...results]);
      }

      setPages(results);
      setPhase('picking');

    } catch(err){
      console.error('thumbnail error:',err);
      setError('โหลด thumbnail ไม่ได้ ('+err.message+') — กด "อัปโหลดเต็มไฟล์" เพื่อข้ามขั้นตอนนี้');
      setPhase('file');
    }
  };

  const togglePage  = (idx) => setPages(ps=>ps.map(p=>p.idx===idx?{...p,selected:!p.selected}:p));
  const selectAll   = ()    => setPages(ps=>ps.map(p=>({...p,selected:true})));
  const clearAll    = ()    => setPages(ps=>ps.map(p=>({...p,selected:false})));

  // ── XHR upload (รับ blob ที่จะส่ง — ถ้า null ใช้ไฟล์ original) ──
  const handleUpload = async (blobOverride) => {
    setUploading(true);
    onUploadingChange && onUploadingChange(true);
    setError('');

    try {
      const pdfFile = files.find(f=>f.name.toLowerCase().endsWith('.pdf') && f.raw);

      if(!pdfFile){
        toast('ไปยังขั้นตอนเลือกขอบเขตงาน');
        onComplete({ storagePath: null, fileName: files[0]?.name || 'drawing.pdf' });
        return;
      }

      setUploadStep(1);
      await new Promise(r=>setTimeout(r,400));

      const safeName = pdfFile.name
        .replace(/[^\x00-\x7F]/g,'')
        .replace(/\s+/g,'_')
        .replace(/[^a-zA-Z0-9._-]/g,'')
        || 'drawing.pdf';
      const storagePath = `${Date.now()}_${safeName}`;

      const uploadBlob = blobOverride || pdfFile.raw;
      const fileMB = uploadBlob.size / 1048576;
      setTotalMB(fileMB);
      setUploadPercent(0);
      setUploadedMB(0);
      setUploadStep(2);

      const { data:{ session } } = await window.supabase.auth.getSession();
      const token = session?.access_token;
      if(!token) throw new Error('ไม่พบ session กรุณา login ใหม่');

      await new Promise((resolve,reject)=>{
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress',(e)=>{
          if(e.lengthComputable){
            setUploadPercent(Math.round((e.loaded/e.total)*100));
            setUploadedMB(e.loaded/1048576);
          }
        });
        xhr.addEventListener('load',()=>{
          if(xhr.status>=200 && xhr.status<300){ resolve(); }
          else{
            try{ const res=JSON.parse(xhr.responseText); reject(new Error('อัปโหลดล้มเหลว: '+(res.error||res.message||xhr.status))); }
            catch{ reject(new Error('อัปโหลดล้มเหลว: HTTP '+xhr.status)); }
          }
        });
        xhr.addEventListener('error',()=>reject(new Error('อัปโหลดล้มเหลว: ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')));
        xhr.addEventListener('abort',()=>reject(new Error('อัปโหลดถูกยกเลิก')));

        const SUPABASE_URL = 'https://zokzcjbvjcxfjpcjsegx.supabase.co';
        xhr.open('POST',`${SUPABASE_URL}/storage/v1/object/drawings/${storagePath}`);
        xhr.setRequestHeader('Authorization',`Bearer ${token}`);
        xhr.setRequestHeader('Content-Type','application/pdf');
        xhr.setRequestHeader('x-upsert','true');
        xhr.send(uploadBlob);
      });

      setUploadStep(3);
      await new Promise(r=>setTimeout(r,500));

      const nPages = pages.filter(p=>p.selected).length || 0;
      const pageNote = nPages > 0 && nPages < (totalPageCount||nPages)
        ? ` (${nPages}/${totalPageCount} หน้า)` : '';
      toast('อัปโหลดสำเร็จ ✓'+pageNote+' ไปยังขั้นตอนเลือกขอบเขตงาน');
      onComplete({ storagePath, fileName: pdfFile.name });

    } catch(err){
      setError(err.message||'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setUploading(false);
      onUploadingChange && onUploadingChange(false);
      setUploadStep(0);
    }
  };

  // ── ตัดหน้าด้วย pdf-lib แล้ว upload ──
  const handleUploadSelected = async () => {
    const selected = pages.filter(p=>p.selected);
    if(selected.length===0){ setError('กรุณาเลือกอย่างน้อย 1 หน้า'); return; }
    setError('');

    // เลือกทุกหน้า → ไม่ต้องตัด ส่ง original ได้เลย
    if(selected.length===pages.length){ handleUpload(null); return; }

    try {
      await loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
      const { PDFDocument } = window.PDFLib;
      const originalPdf  = await PDFDocument.load(pdfBufRef.current);
      const newPdf       = await PDFDocument.create();
      const indices      = selected.map(p=>p.idx);
      const copiedPages  = await newPdf.copyPagesFrom(originalPdf, indices);
      copiedPages.forEach(p=>newPdf.addPage(p));
      const bytes = await newPdf.save();
      const blob  = new Blob([bytes],{type:'application/pdf'});
      handleUpload(blob);
    } catch(err){
      setError('แยกหน้าไม่สำเร็จ: '+err.message+' — ลองกด "อัปโหลดเต็มไฟล์" ได้');
    }
  };

  // ════════════════════════════════
  //  UI: uploading progress (เดิม)
  // ════════════════════════════════
  if(uploading){
    const isUploading = uploadStep===2;
    const speedKBs    = elapsed>0 ? (uploadedMB*1024)/elapsed : 0;
    const remaining   = speedKBs>0 ? Math.max(0,Math.ceil(((totalMB-uploadedMB)*1024)/speedKBs)) : null;

    return (
      <div className="content scrollthin" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className="card" style={{maxWidth:460,width:'100%',padding:'36px 32px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
            <div style={{fontSize:18,fontWeight:700}}>กำลังอัปโหลดไฟล์แบบ</div>
            {isUploading && (
              <span className="badge b-blue mono" style={{fontSize:12}}>
                <span className="spin" style={{width:10,height:10}}></span> {fmtTime(elapsed)}
              </span>
            )}
          </div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:24}}>{files.length} ไฟล์ · {project.name}</div>

          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {STEPS.map((s,i)=>{
              const done = i<uploadStep-1 || uploadStep>STEPS.length;
              const cur  = i===uploadStep-1;
              return (
                <div key={i} style={{opacity:i>uploadStep-1?0.35:1,transition:'opacity .3s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:13}}>
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
                      {cur && i===1 && totalMB>0 && (
                        <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}} className="mono">
                          {uploadedMB.toFixed(1)} / {totalMB.toFixed(1)} MB
                          {remaining!==null && remaining>0 &&
                            <span style={{marginLeft:8,color:'var(--ink-4)'}}>เหลือ ~{fmtTime(remaining)}</span>}
                        </div>
                      )}
                    </div>
                    {done && <Icon name="check" size={15} style={{color:'var(--green)'}}/>}
                  </div>

                  {cur && i===1 && (
                    <div style={{marginTop:10,marginLeft:45}}>
                      <div style={{height:6,borderRadius:3,background:'var(--border)',overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:3,
                          background:uploadPercent===100?'var(--green)':'var(--primary)',
                          width:(uploadPercent||2)+'%',transition:'width .4s ease'}}/>
                      </div>
                      <div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:5,display:'flex',justifyContent:'space-between'}} className="mono">
                        <span>{uploadPercent}%</span>
                        {speedKBs>0 && <span>{speedKBs<1024?speedKBs.toFixed(0)+' KB/s':(speedKBs/1024).toFixed(1)+' MB/s'}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isUploading && (
            <div style={{marginTop:20,padding:'10px 14px',background:'var(--primary-soft)',
              borderRadius:8,fontSize:12.5,color:'var(--primary)'}}>
              📡 กำลังส่งข้อมูลขึ้น Cloud — กรุณาอย่าปิดหน้าต่างนี้
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════
  //  UI: กำลังโหลด thumbnail
  // ════════════════════════════════
  if(phase==='loading'){
    const pct = totalPageCount>0 ? Math.round((thumbProgress/totalPageCount)*100) : 20;
    return (
      <div className="content scrollthin" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className="card" style={{maxWidth:420,width:'100%',padding:'40px 32px',textAlign:'center'}}>
          <span className="spin" style={{width:28,height:28,display:'inline-block',marginBottom:16}}/>
          <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>กำลังโหลด thumbnail...</div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:16}}>
            {thumbProgress > 0 ? `${thumbProgress}${totalPageCount?'/'+totalPageCount:''} หน้า` : 'กำลังเปิดไฟล์...'}
          </div>
          <div style={{height:5,borderRadius:3,background:'var(--border)',overflow:'hidden'}}>
            <div style={{height:'100%',background:'var(--primary)',width:pct+'%',transition:'width .3s'}}/>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════
  //  UI: เลือกหน้า (page picker)
  // ════════════════════════════════
  if(phase==='picking'){
    const selected   = pages.filter(p=>p.selected);
    const allSel     = selected.length===pages.length;
    const savedPages = pages.length - selected.length;

    return (
      <div className="content scrollthin" style={{maxWidth:900,margin:'0 auto'}}>
        <div className="page-head" style={{marginBottom:16,flexWrap:'wrap',gap:10}}>
          <div>
            <h1 className="page-title">เลือกหน้าที่จะส่งให้ AI</h1>
            <div className="page-sub">
              {files.find(f=>f.raw)?.name} · {pages.length} หน้าทั้งหมด · {(files.find(f=>f.raw)?.size||0).toFixed(1)} MB
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            <button className="btn btn-soft btn-sm" onClick={selectAll}>เลือกทั้งหมด</button>
            <button className="btn btn-ghost btn-sm" onClick={clearAll}>ล้างทั้งหมด</button>
          </div>
        </div>

        <div style={{background:'var(--primary-soft)',padding:'10px 14px',borderRadius:8,
          fontSize:13,color:'var(--primary)',marginBottom:16,lineHeight:1.6}}>
          💡 <b>ติ๊กเฉพาะหน้าแบบโครงสร้าง</b> (ฐานราก · เสา · คาน · พื้น · หลังคา) แล้วกด "อัปโหลดหน้าที่เลือก"<br/>
          ตัดหน้าที่ไม่เกี่ยว AI ใช้เวลาน้อยลงและประหยัด credit<br/>
          ⏱️ <b>แบบที่สมาชิกเยอะ:</b> เลือกหน้าน้อยลง หรือแยกเลือกหมวดทีละ 2–3 หมวดต่อรอบ เพื่อให้แต่ละรอบเสร็จใน ~2 นาที (ระบบจำกัดเวลาประมวลผล ~150 วิ./รอบ)
        </div>

        {error && (
          <div style={{marginBottom:12,padding:'10px 14px',background:'#fef2f2',border:'1px solid #fecaca',
            borderRadius:8,fontSize:13,color:'#dc2626'}}>⚠️ {error}</div>
        )}

        {/* ── thumbnail grid ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10,marginBottom:20}}>
          {pages.map(p=>(
            <div key={p.idx} onClick={()=>togglePage(p.idx)}
              style={{cursor:'pointer',borderRadius:8,overflow:'hidden',position:'relative',
                border:p.selected?'2.5px solid var(--primary)':'2px solid var(--border)',
                transition:'border .12s,opacity .12s',
                opacity:p.selected?1:0.4}}>
              <img src={p.dataUrl} style={{width:'100%',display:'block'}} alt={`หน้า ${p.num}`}/>
              {/* checkbox indicator */}
              <div style={{position:'absolute',top:5,right:5,
                width:20,height:20,borderRadius:'50%',
                background:p.selected?'var(--primary)':'rgba(255,255,255,.85)',
                border:'1.5px solid '+(p.selected?'var(--primary)':'var(--border)'),
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                {p.selected && <Icon name="check" size={11} style={{color:'#fff'}}/>}
              </div>
              {/* page number */}
              <div style={{position:'absolute',bottom:0,left:0,right:0,
                background:'rgba(0,0,0,.45)',padding:'3px 0',
                fontSize:11,color:'#fff',textAlign:'center'}} className="mono">
                {p.num}
              </div>
            </div>
          ))}
        </div>

        {/* ── footer summary + buttons ── */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',
          gap:12,padding:'14px 18px',background:'var(--surface-2)',borderRadius:10,marginBottom:24,
          border:'1px solid var(--border)'}}>
          <div style={{fontSize:13.5}}>
            เลือก <b style={{color:'var(--primary)'}}>{selected.length}</b> / {pages.length} หน้า
            {!allSel && selected.length>0 && (
              <span style={{marginLeft:10,color:'var(--green)',fontSize:12.5,fontWeight:600}}>
                ✓ ตัดออก {savedPages} หน้า — AI เร็วขึ้นและประหยัด credit
              </span>
            )}
            {allSel && (
              <span style={{marginLeft:10,color:'var(--ink-3)',fontSize:12}}>เลือกครบ ส่งไฟล์เต็ม</span>
            )}
          </div>
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            <button className="btn btn-ghost btn-sm"
              onClick={()=>{setPhase('file');setPages([]);pdfBufRef.current=null;}}>
              ← กลับ
            </button>
            <button className="btn btn-soft btn-sm" onClick={()=>handleUpload(null)}
              title="อัปโหลดไฟล์ PDF เต็มๆ โดยไม่ตัดหน้า">
              อัปโหลดเต็มไฟล์
            </button>
            <button className="btn btn-primary" disabled={selected.length===0}
              onClick={handleUploadSelected}>
              <Icon name="upload" size={15}/> อัปโหลด {selected.length} หน้า <Icon name="arrowR" size={15}/>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════
  //  UI: file picker (default)
  // ════════════════════════════════
  return (
    <div className="content scrollthin" style={{maxWidth:760,margin:'0 auto'}}>
      <div className="page-head" style={{marginBottom:18}}>
        <div>
          <h1 className="page-title">อัปโหลดแบบก่อสร้าง</h1>
          <div className="page-sub">{project.name} · รองรับไฟล์ PDF · AI จะวิเคราะห์หลังจากเลือกขอบเขตงาน</div>
        </div>
      </div>

      <input ref={inputRef} type="file" multiple accept=".pdf" style={{display:'none'}} onChange={onPick}/>

      <div className={'dropzone '+(drag?'over':'')}
        onClick={()=>inputRef.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true);}}
        onDragLeave={()=>setDrag(false)}
        onDrop={onDrop}>
        <div className="dz-ic"><Icon name="cloud" size={34}/></div>
        <div className="dz-t">ลากไฟล์ PDF มาวางที่นี่ หรือ <span style={{color:'var(--primary)'}}>เลือกไฟล์</span></div>
        <div className="dz-s">PDF · สูงสุด 32 MB ต่อไฟล์ · เลือกหน้าที่ต้องการก่อนส่งให้ AI</div>
      </div>

      {error && (
        <div style={{marginTop:16,padding:'12px 16px',background:'#fef2f2',border:'1px solid #fecaca',
          borderRadius:8,fontSize:13.5,color:'#dc2626'}}>⚠️ {error}</div>
      )}

      {files.length>0 && (
        <div className="card" style={{marginTop:18,overflow:'hidden'}}>
          <div style={{padding:'13px 18px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:14,
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>ไฟล์ที่เลือก ({files.length})</span>
            <button className="btn btn-ghost btn-sm"
              onClick={()=>{setFiles([]);setPhase('file');setPages([]);pdfBufRef.current=null;}}>
              ล้างทั้งหมด
            </button>
          </div>
          {files.map(f=>(
            <div key={f.id} style={{display:'flex',alignItems:'center',gap:13,padding:'12px 18px',
              borderBottom:'1px solid var(--border)'}}>
              <div style={{width:38,height:38,borderRadius:9,flex:'0 0 38px',
                display:'flex',alignItems:'center',justifyContent:'center',
                background:'var(--primary-soft)',color:'var(--primary)'}}>
                <Icon name="file" size={19}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',
                  textOverflow:'ellipsis'}}>{f.name}</div>
                <div style={{fontSize:12,color:'var(--ink-4)'}} className="mono">
                  {f.size.toFixed(1)} MB
                  {f.raw?<span style={{marginLeft:8,color:'var(--green)'}}>● พร้อมอัปโหลด</span>
                        :<span style={{marginLeft:8,color:'var(--ink-4)'}}>ตัวอย่าง</span>}
                </div>
              </div>
              <button className="minibtn del" onClick={()=>remove(f.id)}><Icon name="trash" size={15}/></button>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        {/* ปุ่มรอง: ข้ามการเลือกหน้า อัปโหลดเต็มไฟล์เลย */}
        {files.some(f=>f.raw) && (
          <button className="btn btn-soft" disabled={files.length===0}
            onClick={()=>handleUpload(null)}
            title="อัปโหลดไฟล์เต็มๆ โดยไม่ผ่านขั้นตอนเลือกหน้า">
            อัปโหลดเต็มไฟล์
          </button>
        )}
        {/* ปุ่มหลัก: เปิด page picker */}
        <button className="btn btn-primary btn-lg" disabled={files.length===0} onClick={loadThumbnails}>
          <Icon name="file" size={17}/> เลือกหน้าที่จะส่ง <Icon name="arrowR" size={17}/>
        </button>
      </div>
    </div>
  );
}
window.UploadScreen = UploadScreen;
