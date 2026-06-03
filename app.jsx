/* ===================== App shell + router ===================== */
function TemplatesScreen(){
  const toast = useToast();
  const [tpls,setTpls] = useState(()=>TEMPLATES.map(t=>({...t})));
  return (
    <div className="content scrollthin">
      <div className="page-head">
        <div>
          <h1 className="page-title">เทมเพลตราคาของฉัน</h1>
          <div className="page-sub">ชุดราคาที่บันทึกไว้ ใช้ซ้ำในการประเมินราคาโปรเจกต์ใหม่</div>
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={17}/> สร้างเทมเพลต</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:18}}>
        {tpls.map(t=>(
          <div className="card" key={t.id} style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:42,height:42,borderRadius:11,background:'var(--primary-soft)',color:'var(--primary)',
                display:'flex',alignItems:'center',justifyContent:'center',flex:'0 0 42px'}}><Icon name="bookmark" size={20}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:15.5,display:'flex',alignItems:'center',gap:8}}>
                  {t.name}{t.def && <span className="badge b-green" style={{fontSize:11}}>ค่าเริ่มต้น</span>}
                </div>
                <div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:2}}>{t.items} รายการ · แก้ไขล่าสุด {t.updated}</div>
              </div>
            </div>
            <div style={{borderTop:'1px solid var(--border)',paddingTop:13,display:'flex',gap:8}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>toast('เปิดแก้ไขเทมเพลต')}><Icon name="edit" size={14}/> แก้ไข</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{ setTpls(ts=>[...ts,{...t,id:'c'+Date.now(),name:t.name+' (สำเนา)',def:false}]); toast('ทำสำเนาแล้ว ✓'); }}><Icon name="layers" size={14}/> ทำสำเนา</button>
              <button className="btn btn-ghost btn-sm del" style={{marginRight:'auto',color:'var(--ink-3)'}}
                onClick={()=>{ setTpls(ts=>ts.filter(x=>x.id!==t.id)); toast('ลบเทมเพลตแล้ว ✓'); }}><Icon name="trash" size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeliveryScreen({ project, boqData, onBack }){
  const toast = useToast();
  const [done,setDone] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setDone(true),1500); return ()=>clearTimeout(t); },[]);

  const hasReal = boqData && Array.isArray(boqData.items) && boqData.items.length>0;

  // สร้างไฟล์ Excel จริง (8 ชีท) จากผลถอดปริมาณ
  const downloadExcel = () => {
    const data = hasReal ? boqData : {
      items: (window.QUANTITIES||[]).map(q=>({
        category:q.cat, code:q.code, name:q.name,
        qty:q.qty, unit:q.unit, volume:q.vol, page_num:q.page, notes:''
      })),
      summary: {}
    };
    window.generateBOQExcel(project, data);
    toast('ดาวน์โหลด Excel แล้ว ✓','excel');
  };
  return (
    <div className="content scrollthin" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="card" style={{maxWidth:480,width:'100%',padding:'40px 36px',textAlign:'center'}}>
        {!done ? (
          <>
            <div className="spin" style={{width:32,height:32,margin:'0 auto 20px'}}></div>
            <div style={{fontSize:17,fontWeight:600}}>กำลังสร้างไฟล์ส่งออก…</div>
            <div style={{fontSize:13.5,color:'var(--ink-3)',marginTop:8,lineHeight:1.7}}>
              กำลังสร้างไฟล์ Excel…<br/>กำลังสร้างไฟล์ PDF…
            </div>
          </>
        ) : (
          <>
            <div style={{width:72,height:72,borderRadius:'50%',background:'var(--green-soft)',color:'var(--green)',
              display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}><Icon name="check" size={36}/></div>
            <div style={{fontSize:21,fontWeight:700}}>BOQ ของคุณพร้อมแล้ว 🎉</div>
            <div style={{fontSize:13.5,color:'var(--ink-3)',marginTop:6}}>{project.name}</div>
            <div style={{display:'flex',gap:12,marginTop:24}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={downloadExcel}><Icon name="excel" size={17}/> ดาวน์โหลด Excel</button>
              <button className="btn btn-navy" style={{flex:1}} onClick={()=>toast('กำลังดาวน์โหลด BOQ.pdf','file')}><Icon name="file" size={17}/> ดาวน์โหลด PDF</button>
            </div>
            <div className="badge b-green" style={{marginTop:18}}><Icon name="check" size={13}/> ส่งลิงก์ทาง Email และ LINE แล้ว</div>
            <div><button className="btn btn-ghost" style={{marginTop:20}} onClick={onBack}><Icon name="chevR" size={15}/> กลับสู่แดชบอร์ด</button></div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Root ---------- */
function App(){
  const toast = useToast();
  const [screen,setScreen] = useState('dashboard');
  const [project,setProject] = useState(null);
  const [sideCollapsed,setSideCollapsed] = useState(false);
  const [projects,setProjects] = useState([]);
  const [user,setUser] = useState(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [boqData,setBoqData] = useState(null);       // ข้อมูล BOQ จาก Claude
  const [uploadData,setUploadData] = useState(null); // {storagePath, fileName} จาก UploadScreen
  const [isAnalyzing,setIsAnalyzing] = useState(false); // ล็อก sidebar ระหว่าง AI วิเคราะห์
  const [isUploading,setIsUploading] = useState(false); // ล็อก sidebar ระหว่างอัปโหลดไฟล์

  // ตรวจสอบ session เมื่อเปิดแอป
  useEffect(()=>{
    const mapProject = (p) => ({ ...p, type: p.building_type, drawings: 0, tier: 'auto', date: p.created_at?.slice(0,10) || '' });

    // นำโปรเจกต์สาธิต (เสร็จสิ้นแล้ว) มาวางบนสุดเสมอ เพื่อให้ผู้ใช้เปิดดูแนวทางได้
    const withDemo = (list) => [ { ...window.DEMO_PROJECT }, ...list ];

    const init = async () => {
      const { data: { session } } = await window.supabase.auth.getSession();
      if(session?.user){
        setUser(session.user);
        const { data } = await window.getProjects(session.user.id);
        setProjects(withDemo((data || []).map(mapProject)));
      }
      setAuthLoading(false);
    };
    init();

    // ฟังการเปลี่ยนแปลง Auth state
    const { data: { subscription } } = window.supabase.auth.onAuthStateChange(async (event, session) => {
      if(session?.user){
        setUser(session.user);
        const { data } = await window.getProjects(session.user.id);
        setProjects(withDemo((data || []).map(mapProject)));
      } else {
        setUser(null);
        setProjects([]);
        setProject(null);
        setScreen('dashboard');
        setSideCollapsed(false);
      }
    });

    return () => subscription?.unsubscribe();
  },[]);

  // แสดง Loading spinner ขณะตรวจสอบ Auth
  if(authLoading){
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#eef1f6'}}>
        <div style={{textAlign:'center'}}>
          <div className="spin" style={{width:36,height:36,margin:'0 auto 14px'}}></div>
          <div style={{fontSize:14,color:'var(--ink-3)'}}>กำลังโหลด SwiftBill…</div>
        </div>
      </div>
    );
  }

  // ถ้ายังไม่ได้ Login ให้แสดง Auth Modal
  if(!user){
    return <AuthModal onSuccess={(u)=>setUser(u)}/>;
  }

  // อัปเดตสถานะโปรเจกต์: sync local state + ยิงไป Supabase (ยกเว้นโปรเจกต์สาธิต)
  const patchProject = (id, updates) => {
    setProjects(list=>list.map(x=>x.id===id?{...x,...updates}:x));
    setProject(pr=> pr && pr.id===id ? {...pr,...updates} : pr);
  };
  const setProjectStatus = (p, status, extra={}) => {
    if(!p) return;
    patchProject(p.id, { status, ...extra });
    if(!p.__demo){
      window.updateProject(p.id, { status, ...extra }).catch(e=>console.warn('อัปเดตสถานะไม่สำเร็จ:', e));
    }
  };

  const openProject = (p) => {
    setProject(p);
    setSideCollapsed(true);
    // โปรเจกต์สาธิต: โหลดผลถอดปริมาณตัวอย่างแล้วไปหน้าผลลัพธ์เลย
    if(p.__demo){ setBoqData(window.DEMO_BOQ); setScreen('results'); return; }
    if(p.status==='draft') setScreen('upload');
    else if(p.status==='quoted') setScreen('scope');
    else setScreen('results');
  };

  const nav = (id) => {
    if(id==='dashboard'){ setScreen('dashboard'); setSideCollapsed(false); return; }
    if(id==='templates'){ setScreen('templates'); return; }
    if(id==='logout'){
      window.supabase.auth.signOut();
      setUser(null); setProjects([]); setProject(null); setBoqData(null);
      setScreen('dashboard'); setSideCollapsed(false);
      return;
    }
    setScreen(id);
  };

  const backToDash = () => { setScreen('dashboard'); setSideCollapsed(false); };

  const createProject = async (p) => {
    try {
      // กันเซสชันหมดอายุ: รีเฟรช token ก่อน insert ไม่งั้น auth.uid() เป็น null → RLS ปฏิเสธ
      let { data: { session } } = await window.supabase.auth.getSession();
      const expSoon = session?.expires_at && (session.expires_at * 1000 < Date.now() + 60000);
      if(session && expSoon){
        const r = await window.supabase.auth.refreshSession();
        session = r.data?.session || null;
      }
      if(!session){
        alert('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        nav('logout');
        return;
      }

      // Map fields ให้ตรงกับ Supabase schema
      const projectData = {
        name:          p.name,
        location:      p.location,
        region:        p.region,
        building_type: p.type,        // code ใช้ "type" → DB ใช้ "building_type"
        floors:        p.floors,
        area:          p.area,
        status:        p.status || 'draft',
        pricing:       p.pricing !== undefined ? p.pricing : true,
      };

      console.log('Creating project with data:', projectData, 'user:', user?.id);
      const { data, error } = await window.createProject(projectData, user.id);

      if(error){
        console.error('Create project error:', error);
        const msg = error.message || error.hint || error.details || JSON.stringify(error);
        alert('สร้างโปรเจกต์ไม่สำเร็จ:\n\n' + msg);
        return;
      }

      if(!data) {
        alert('สร้างโปรเจกต์ไม่สำเร็จ: ไม่ได้รับข้อมูลกลับจากเซิร์ฟเวอร์ (อาจติด RLS policy)');
        return;
      }

      // เพิ่ม UI fields กลับเข้าไปสำหรับแสดงผล
      const projectUI = {
        ...data,
        type:     data.building_type,
        date:     p.date,
        drawings: 0,
        tier:     'auto',
      };

      console.log('Project created successfully:', projectUI);
      setProjects(list=>[projectUI, ...list]);
      toast('สร้างโปรเจกต์สำเร็จ ✓');
      openProject(projectUI);
    } catch(err) {
      console.error('Unexpected error in createProject:', err);
      alert('เกิดข้อผิดพลาด:\n\n' + (err?.message || JSON.stringify(err) || 'Unknown error'));
    }
  };

  const deleteProject = async (p) => {
    if(!p.__demo){
      const { error } = await window.deleteProject(p.id);
      if(error){
        // แสดง toast เตือนถ้าลบจาก Supabase ไม่สำเร็จ
        toast('ลบโปรเจกต์ไม่สำเร็จ: ' + (error.message || 'กรุณาลองใหม่'));
        console.error('deleteProject error:', error);
        return; // หยุดไม่เอาออกจาก UI ถ้า DB ยังลบไม่ได้
      }
    }
    setProjects(list=>list.filter(x=>x.id!==p.id));
    if(project && project.id===p.id){ setProject(null); setScreen('dashboard'); setSideCollapsed(false); }
  };

  const crumbsFor = () => {
    if(screen==='dashboard') return null;
    if(screen==='templates') return ['SwiftBill','เทมเพลตราคา'];
    const label = {upload:'อัปโหลดแบบ', scope:'ขอบเขต & ใบเสนอราคา', results:'ผลลัพธ์ปริมาณ', pricing:'ตรวจราคา', delivery:'ส่งออก'}[screen];
    return [project?.name||'โปรเจกต์', label];
  };

  return (
    <div className="app">
      <Sidebar screen={screen} project={['upload','scope','results','pricing'].includes(screen)?project:null}
        collapsed={sideCollapsed} onToggle={()=>setSideCollapsed(c=>!c)}
        onNav={nav} onExit={backToDash} user={user} locked={isAnalyzing || isUploading}/>
      <div className="main">
        <Topbar crumbs={crumbsFor()} onToggleSidebar={()=>setSideCollapsed(c=>!c)} user={user}/>
        {screen==='dashboard' && <Dashboard projects={projects} onOpen={openProject} onCreate={createProject} onDelete={deleteProject}/>}
        {screen==='upload' && <UploadScreen project={project}
          onUploadingChange={setIsUploading}
          onComplete={(data)=>{ setIsUploading(false); setUploadData(data); setProjectStatus(project,'quoted'); setScreen('scope'); }}/>}
        {screen==='scope' && <ScopeScreen project={project} uploadData={uploadData}
          onAnalyzingChange={(analyzing)=>{ setIsAnalyzing(analyzing); if(analyzing) setProjectStatus(project,'extracting'); }}
          onConfirm={(boqData, withPrice, analyzeSeconds)=>{ setIsAnalyzing(false); setBoqData(boqData);
            const upd = { pricing: withPrice };
            if(analyzeSeconds != null) upd.analyze_seconds = analyzeSeconds;
            patchProject(project.id, upd);
            if(analyzeSeconds != null && !project.__demo){
              window.updateProject(project.id, { analyze_seconds: analyzeSeconds })
                .catch(e=>console.warn('บันทึกเวลา AI ไม่สำเร็จ:', e));
            }
            setScreen('results'); }}/>}
        {screen==='results' && <ResultsScreen project={project} boqData={boqData}
          onConfirm={(editedSheets)=>{ if(editedSheets) setBoqData(bd=>({ ...bd, sheets:editedSheets })); if(project.pricing){ setScreen('pricing'); } else { setProjectStatus(project,'completed'); setScreen('delivery'); } }}/>}
        {screen==='pricing' && <PricingScreen project={project} onConfirm={()=>{ setProjectStatus(project,'completed'); setScreen('delivery'); }}/>}
        {screen==='delivery' && <DeliveryScreen project={project} boqData={boqData} onBack={backToDash}/>}
        {screen==='templates' && <TemplatesScreen/>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastHost><BalloonHost><App/></BalloonHost></ToastHost>
);
