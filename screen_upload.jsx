/* ===================== Upload drawings (Step 1 — อัปโหลดเท่านั้น) =====================
   Flow ใหม่: อัปโหลด → Scope → AI วิเคราะห์ → Results
   ขั้นตอนนี้ทำแค่ upload ไฟล์ไปยัง Supabase Storage แล้วส่ง storagePath ไปหน้า Scope
================================================================== */
function UploadScreen({ project, onComplete }){
  const toast = useToast();
  const [files,setFiles] = useState([]);
  const [drag,setDrag] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [uploadStep,setUploadStep] = useState(0); // 0=idle 1=reading 2=uploading 3=done
  const [uploadPercent,setUploadPercent] = useState(0);  // เปอร์เซ็นต์อัปโหลดจริง (0–100)
  const [uploadedMB,setUploadedMB] = useState(0);        // MB ที่อัปโหลดไปแล้ว
  const [totalMB,setTotalMB] = useState(0);              // ขนาดไฟล์ทั้งหมด MB
  const [elapsed,setElapsed] = useState(0);              // วินาทีที่ใช้อัปโหลด
  const [error,setError] = useState('');
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // จับเวลาขณะกำลังอัปโหลด
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

  const remove = (id) => setFiles(f=>f.filter(x=>x.id!==id));

  // อัปโหลดไฟล์ → Supabase Storage แล้วไปหน้า Scope
  const handleUpload = async () => {
    setUploading(true);
    setError('');

    try {
      const pdfFile = files.find(f=>f.name.toLowerCase().endsWith('.pdf') && f.raw);

      if(!pdfFile) {
        // ไม่มีไฟล์จริง → ข้ามไปหน้า scope เลย (mock flow)
        toast('ไปยังขั้นตอนเลือกขอบเขตงาน');
        onComplete({ storagePath: null, fileName: files[0]?.name || 'drawing.pdf' });
        return;
      }

      // Step 1: อ่านไฟล์
      setUploadStep(1);
      await new Promise(r=>setTimeout(r,400));

      // sanitize ชื่อไฟล์ (รองรับภาษาไทย)
      const safeName = pdfFile.name
        .replace(/[^\x00-\x7F]/g,'')
        .replace(/\s+/g,'_')
        .replace(/[^a-zA-Z0-9._-]/g,'')
        || 'drawing.pdf';
      const storagePath = `${Date.now()}_${safeName}`;

      // Step 2: อัปโหลด (ใช้ XHR เพื่อ progress จริง — fetch() ไม่รองรับ upload progress)
      const fileMB = pdfFile.raw.size / 1048576;
      setTotalMB(fileMB);
      setUploadPercent(0);
      setUploadedMB(0);
      setUploadStep(2);

      // ดึง session token สำหรับ Authorization header
      const { data: { session } } = await window.supabase.auth.getSession();
      const token = session?.access_token;
      if(!token) throw new Error('ไม่พบ session กรุณา login ใหม่');

      // XHR upload → ได้ progress event จริง
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if(e.lengthComputable){
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadPercent(pct);
            setUploadedMB(e.loaded / 1048576);
          }
        });

        xhr.addEventListener('load', () => {
          if(xhr.status >= 200 && xhr.status < 300){
            resolve();
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              reject(new Error('อัปโหลดไฟล์ไม่สำเร็จ: ' + (res.error || res.message || xhr.status)));
            } catch {
              reject(new Error('อัปโหลดไฟล์ไม่สำเร็จ: HTTP ' + xhr.status));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('อัปโหลดล้มเหลว: ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')));
        xhr.addEventListener('abort', () => reject(new Error('อัปโหลดถูกยกเลิก')));

        const SUPABASE_URL = 'https://zokzcjbvjcxfjpcjsegx.supabase.co';
        xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/drawings/${storagePath}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'application/pdf');
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.send(pdfFile.raw);
      });

      setUploadStep(3);
      await new Promise(r=>setTimeout(r,500));

      toast('อัปโหลดสำเร็จ ✓ ไปยังขั้นตอนเลือกขอบเขตงาน');
      onComplete({ storagePath, fileName: pdfFile.name });

    } catch(err) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setUploading(false);
      setUploadStep(0);
    }
  };

  // หน้าระหว่างอัปโหลด
  if(uploading){
    const isUploading = uploadStep === 2;
    const speedKBs = elapsed > 0 ? (uploadedMB * 1024) / elapsed : 0;
    const remaining = speedKBs > 0 ? Math.max(0, Math.ceil(((totalMB - uploadedMB) * 1024) / speedKBs)) : null;

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
              const done = i < uploadStep-1 || uploadStep > STEPS.length;
              const cur  = i === uploadStep-1;
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
                      {/* แสดง MB detail เฉพาะขั้นอัปโหลด */}
                      {cur && i===1 && totalMB>0 && (
                        <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}} className="mono">
                          {uploadedMB.toFixed(1)} / {totalMB.toFixed(1)} MB
                          {remaining!==null && remaining>0 && <span style={{marginLeft:8,color:'var(--ink-4)'}}>เหลือ ~{fmtTime(remaining)}</span>}
                        </div>
                      )}
                    </div>
                    {done && <Icon name="check" size={15} style={{color:'var(--green)'}}/>}
                  </div>

                  {/* Progress bar จริงขณะอัปโหลด */}
                  {cur && i===1 && (
                    <div style={{marginTop:10,marginLeft:45}}>
                      <div style={{height:6,borderRadius:3,background:'var(--border)',overflow:'hidden'}}>
                        <div style={{
                          height:'100%',borderRadius:3,
                          background: uploadPercent===100 ? 'var(--green)' : 'var(--primary)',
                          width: (uploadPercent||2)+'%',
                          transition:'width .4s ease',
                        }}/>
                      </div>
                      <div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:5,display:'flex',justifyContent:'space-between'}} className="mono">
                        <span>{uploadPercent}%</span>
                        {speedKBs>0 && <span>{speedKBs<1024 ? speedKBs.toFixed(0)+' KB/s' : (speedKBs/1024).toFixed(1)+' MB/s'}</span>}
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
        <div className="dz-s">PDF · สูงสุด 32 MB ต่อไฟล์ · Claude AI จะวิเคราะห์ตามขอบเขตที่เลือก</div>
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
            <button className="btn btn-ghost btn-sm" onClick={()=>setFiles([])}>ล้างทั้งหมด</button>
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
        <button className="btn btn-primary btn-lg" disabled={files.length===0} onClick={handleUpload}>
          <Icon name="upload" size={17}/> อัปโหลดและเลือกขอบเขต <Icon name="arrowR" size={17}/>
        </button>
      </div>
    </div>
  );
}
window.UploadScreen = UploadScreen;
