/* ===================== Dashboard ===================== */
function fmtDur(s){
  if(s == null) return '';
  if(s < 60) return s + ' วินาที';
  const m = Math.floor(s/60), r = s%60;
  return r ? `${m} นาที ${r} วินาที` : `${m} นาที`;
}
function Dashboard({ projects, onOpen, onCreate, onDelete }){
  const [filter,setFilter] = useState('all');
  const [q,setQ] = useState('');
  const [createOpen,setCreateOpen] = useState(false);
  const [delProj,setDelProj] = useState(null);

  const filters = [
    { id:'all', th:'ทั้งหมด' },
    { id:'active', th:'กำลังดำเนินการ' },
    { id:'quoted', th:'รอชำระเงิน' },
    { id:'completed', th:'เสร็จสิ้น' },
    { id:'draft', th:'ร่าง' },
  ];
  const inGroup = (st, f) => {
    if(f==='all') return true;
    if(f==='active') return ['paid','extracting','qc','qty_review','eng_review','pricing','pricing_review'].includes(st);
    return st===f;
  };
  const list = projects.filter(p=>inGroup(p.status,filter) &&
    (!q || p.name.includes(q) || p.location.includes(q)));

  const counts = {
    all: projects.length,
    active: projects.filter(p=>inGroup(p.status,'active')).length,
    quoted: projects.filter(p=>p.status==='quoted').length,
    completed: projects.filter(p=>p.status==='completed').length,
    draft: projects.filter(p=>p.status==='draft').length,
  };

  return (
    <div className="content scrollthin">
      <div className="page-head">
        <div>
          <h1 className="page-title">โปรเจกต์ของฉัน</h1>
          <div className="page-sub">{projects.length} โปรเจกต์ทั้งหมด · ดับเบิลคลิกการ์ดเพื่อเปิด</div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={()=>setCreateOpen(true)}><Icon name="plus" size={18}/> สร้างโปรเจกต์ใหม่</button>
      </div>

      {/* summary stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {ic:'layers', n:projects.length, l:'โปรเจกต์ทั้งหมด', c:'--primary'},
          {ic:'sparkle', n:counts.active, l:'กำลังดำเนินการ', c:'--cyan'},
          {ic:'inbox', n:counts.quoted, l:'รอชำระเงิน', c:'--orange'},
          {ic:'shield', n:counts.completed, l:'เสร็จสิ้นแล้ว', c:'--green'},
        ].map((s,i)=>(
          <div className="card" key={i} style={{padding:'18px 20px',display:'flex',alignItems:'center',gap:15}}>
            <div style={{width:44,height:44,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',
              background:`color-mix(in srgb, var(${s.c}) 12%, white)`, color:`var(${s.c})`}}>
              <Icon name={s.ic} size={22}/>
            </div>
            <div>
              <div className="num" style={{fontSize:26,fontWeight:700,lineHeight:1}}>{s.n}</div>
              <div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:3}}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* filters */}
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20,flexWrap:'wrap'}}>
        <div className="chips">
          {filters.map(f=>(
            <button key={f.id} className={'chip '+(filter===f.id?'active':'')} onClick={()=>setFilter(f.id)}>
              {f.th}<span className="ct">{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="search" style={{marginLeft:'auto',maxWidth:280,padding:'8px 14px'}}>
          <Icon name="search" size={16}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาในรายการ…"/>
        </div>
      </div>

      {/* grid */}
      {list.length===0 ? (
        <div className="empty">
          <div className="eic"><Icon name="inbox" size={30}/></div>
          <div>
            <div style={{fontWeight:600,color:'var(--ink-2)',fontSize:16}}>ไม่พบโปรเจกต์</div>
            <div style={{marginTop:4}}>ลองเปลี่ยนตัวกรอง หรือสร้างโปรเจกต์ใหม่</div>
          </div>
        </div>
      ) : (
        <div className="proj-grid">
          {list.map(p=>(
            <div className="proj-card" key={p.id} onDoubleClick={()=>onOpen(p)} onClick={e=>{}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <StatusBadge status={p.status}/>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  {p.pricing && <span className="badge b-blue" title="รวมการประเมินราคา"><Icon name="money" size={13}/> มีราคา</span>}
                  <button className="minibtn del card-del" title="ลบโปรเจกต์"
                    onClick={e=>{e.stopPropagation(); setDelProj(p);}}><Icon name="trash" size={15}/></button>
                </div>
              </div>
              <h3>{p.name}</h3>
              <div className="proj-meta">
                <div className="row"><Icon name="building" size={15} className="ic"/>{BUILDING_TYPE[p.type]} · {p.floors} ชั้น</div>
                <div className="row"><Icon name="pin" size={15} className="ic"/>{p.location}</div>
                <div className="row"><Icon name="cal" size={15} className="ic"/>{p.date} · {fmt(p.area)} ตร.ม.</div>
                {p.analyze_seconds != null && <div className="row"><Icon name="clock" size={15} className="ic"/>AI ถอดปริมาณ {fmtDur(p.analyze_seconds)}</div>}
              </div>
              <div>
                <div className="proj-prog"><span style={{width:STATUS[p.status].prog+'%'}}></span></div>
              </div>
              <div className="proj-foot">
                <span className="hint">ดับเบิลคลิกเพื่อเปิด</span>
                <button className="btn btn-soft btn-sm" onClick={e=>{e.stopPropagation();onOpen(p);}}>เปิด <Icon name="chevL" size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && <CreateProjectModal onClose={()=>setCreateOpen(false)} onCreate={(p)=>{ setCreateOpen(false); onCreate(p); }}/>}
      {delProj && (
        <Modal title="ลบโปรเจกต์นี้?" sub="การลบไม่สามารถย้อนกลับได้" onClose={()=>setDelProj(null)}
          foot={<><button className="btn btn-ghost" onClick={()=>setDelProj(null)}>ยกเลิก</button>
            <button className="btn btn-primary" style={{background:'var(--red)'}} onClick={()=>{ const x=delProj; setDelProj(null); onDelete(x); }}>ลบโปรเจกต์</button></>}>
          <div style={{fontSize:14,color:'var(--ink-2)',lineHeight:1.6}}>
            ยืนยันการลบ <b style={{color:'var(--ink)'}}>{delProj.name}</b> ออกจากระบบ? ข้อมูลและผลลัพธ์ทั้งหมดจะถูกลบถาวร
          </div>
        </Modal>
      )}
    </div>
  );
}
window.Dashboard = Dashboard;

/* ---------- Create project (Step 2) ---------- */
function CreateProjectModal({ onClose, onCreate }){
  const REGIONS = ['กทม','ภาคเหนือ','ภาคอีสาน','ภาคใต้','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก'];
  const REGION_LOC = {'กทม':'กรุงเทพฯ','ภาคเหนือ':'เชียงใหม่','ภาคอีสาน':'ขอนแก่น','ภาคใต้':'ภูเก็ต','ภาคกลาง':'นนทบุรี','ภาคตะวันออก':'ชลบุรี','ภาคตะวันตก':'กาญจนบุรี'};
  const TYPES = [
    {id:'residential', th:'บ้านพักอาศัย', ic:'building'},
    {id:'commercial', th:'อาคารพาณิชย์', ic:'grid'},
    {id:'industrial', th:'โรงงานอุตสาหกรรม', ic:'layers'},
    {id:'infrastructure', th:'โครงสร้างพื้นฐาน', ic:'ruler'},
  ];
  // ประเภทงานที่ต้องการ — UI เท่านั้น (ยังไม่ลิงก์หลังบ้าน) ไว้ให้ต่อยอดภายหลัง
  const WORKTYPES = [
    {id:'structure', th:'งานโครงสร้าง', ic:'layers'},
    {id:'architecture', th:'งานสถาปัตยกรรม', ic:'ruler'},
    {id:'electrical', th:'งานไฟฟ้า', ic:'bolt'},
    {id:'mechanical', th:'งานเครื่องกล', ic:'cog'},
    {id:'sanitary', th:'งานสุขาภิบาล', ic:'droplet'},
    {id:'landscape', th:'งานออกแบบภูมิทัศน์', ic:'leaf'},
  ];
  const [f,setF] = useState({ name:'', location:'', region:'กทม', type:'commercial', floors:1, area:'' });
  const [work,setWork] = useState(['structure']);   // เลือกได้หลายอย่าง (default: งานโครงสร้าง)
  const toggleWork = id => setWork(w => w.includes(id) ? w.filter(x=>x!==id) : [...w,id]);
  const [nda,setNda] = useState(false);
  const set = (k,v)=>setF(s=>({...s,[k]:v}));
  const ok = f.name.trim() && f.location.trim() && f.area && nda;

  const todayTh = () => {
    const M=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const d=new Date(); return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()+543}`;
  };
  const submit = () => {
    onCreate({
      id:'np'+Date.now(), name:f.name.trim(), type:f.type, region:f.region,
      location:f.location.trim(), floors:Number(f.floors)||1, area:Number(f.area)||0,
      status:'draft', date:todayTh(), drawings:0, pricing:true, tier:'auto',
    });
  };

  const foot = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
      <button className="btn btn-primary" disabled={!ok} onClick={submit}>สร้างโปรเจกต์ <Icon name="arrowR" size={16}/></button>
    </>
  );
  return (
    <Modal title="สร้างโปรเจกต์ใหม่" sub="กรอกข้อมูลโครงการเพื่อเริ่มถอดแบบ" onClose={onClose} foot={foot} wide>
      <div className="field">
        <label>ชื่อโครงการ</label>
        <input className="inp" value={f.name} autoFocus placeholder="เช่น อาคารสำนักงาน 5 ชั้น สีลม" onChange={e=>set('name',e.target.value)}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14}}>
        <div className="field"><label>ที่ตั้ง</label>
          <input className="inp" value={f.location} placeholder="เขต/จังหวัด" onChange={e=>set('location',e.target.value)}/></div>
        <div className="field"><label>ภูมิภาค</label>
          <select className="sel" value={f.region} onChange={e=>{set('region',e.target.value); if(!f.location) set('location',REGION_LOC[e.target.value]);}}>
            {REGIONS.map(r=><option key={r}>{r}</option>)}</select></div>
      </div>
      <div className="field">
        <label>ประเภทอาคาร</label>
        <div className="opt-grid cols2" style={{gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          {TYPES.map(t=>(
            <div key={t.id} className={'opt '+(f.type===t.id?'sel':'')} style={{padding:13}} onClick={()=>set('type',t.id)}>
              <div className="opt-ic" style={{width:34,height:34,flex:'0 0 34px'}}><Icon name={t.ic} size={17}/></div>
              <div className="opt-body"><div className="opt-t" style={{fontSize:14}}>{t.th}</div></div>
              <div className="opt-check round" style={{width:20,height:20}}><Icon name="check" size={12}/></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="field"><label>จำนวนชั้น</label>
          <input className="inp mono" type="number" min="1" value={f.floors} onChange={e=>set('floors',e.target.value)}/></div>
        <div className="field"><label>พื้นที่รวมโดยประมาณ <span className="hintl">(ตร.ม.)</span></label>
          <input className="inp mono" type="number" min="0" value={f.area} placeholder="0" onChange={e=>set('area',e.target.value)}/></div>
      </div>
      <div className="field">
        <label>ประเภทงานที่ต้องการ <span className="hintl">(เลือกได้หลายรายการ)</span></label>
        <div className="opt-grid cols2" style={{gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          {WORKTYPES.map(w=>(
            <div key={w.id} className={'opt '+(work.includes(w.id)?'sel':'')} style={{padding:13}} onClick={()=>toggleWork(w.id)}>
              <div className="opt-ic" style={{width:34,height:34,flex:'0 0 34px'}}><Icon name={w.ic} size={17}/></div>
              <div className="opt-body"><div className="opt-t" style={{fontSize:14}}>{w.th}</div></div>
              <div className="opt-check round" style={{width:20,height:20}}><Icon name="check" size={12}/></div>
            </div>
          ))}
        </div>
      </div>
      {/* NDA */}
      <div onClick={()=>setNda(v=>!v)} style={{display:'flex',gap:12,alignItems:'flex-start',padding:14,borderRadius:12,
        border:'1px solid '+(nda?'var(--primary)':'var(--border-2)'),background:nda?'var(--primary-soft)':'var(--surface-2)',cursor:'pointer',marginTop:4}}>
        <div className="opt-check" style={{background:nda?'var(--primary)':'#fff',borderColor:nda?'var(--primary)':'var(--border-2)'}}><Icon name="check" size={13}/></div>
        <div style={{fontSize:13.5,color:'var(--ink-2)',lineHeight:1.5}}>
          ฉันยอมรับ <b style={{color:'var(--ink)'}}>ข้อตกลงการรักษาความลับ (NDA)</b> ของแบบและข้อมูลทั้งหมด
          <a onClick={e=>e.stopPropagation()} style={{color:'var(--primary)',marginRight:6,cursor:'pointer'}}> · อ่านข้อตกลงฉบับเต็ม</a>
        </div>
      </div>
    </Modal>
  );
}
