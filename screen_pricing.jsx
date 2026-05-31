/* ===================== Pricing review (Step 15/17/18) ===================== */
function PricingScreen({ project, onConfirm }){
  const toast = useToast();
  const [matches,setMatches] = useState(()=>MATCHES.map(m=>({...m})));
  const [filter,setFilter] = useState('all');
  const [editId,setEditId] = useState(null);
  const [matSrc,setMatSrc] = useState('gov');
  const [laborSrc,setLaborSrc] = useState('gov');
  const [pct,setPct] = useState({...PCT});
  const [advOpen,setAdvOpen] = useState(false);
  const [saveTpl,setSaveTpl] = useState(false);
  const [confirmOpen,setConfirmOpen] = useState(false);

  const bandFilter = (m) => {
    if(filter==='all') return true;
    if(filter==='g') return m.conf>=90;
    if(filter==='y') return m.conf>=70 && m.conf<90;
    if(filter==='r') return m.conf<70;
  };
  const visible = matches.filter(bandFilter);
  const counts = {
    all: matches.length,
    g: matches.filter(m=>m.conf>=90).length,
    y: matches.filter(m=>m.conf>=70&&m.conf<90).length,
    r: matches.filter(m=>m.conf<70).length,
  };

  // ---- cost rollup ----
  const matTotal = matches.reduce((a,m)=> a + (m.matId ? (m.ovr??m.price) * (MATCH_QTY[m.id]||0) : 0), 0);
  const laborTotal = LABOR.reduce((a,l)=>a+l.amt,0);
  const direct = matTotal + laborTotal;
  const overhead = direct * pct.overhead/100;
  const profit = direct * pct.profit/100;
  const beforeVat = direct + overhead + profit;
  const vat = beforeVat * pct.vat/100;
  const grand = beforeVat + vat;

  const applyOverride = (id, data) => {
    setMatches(ms=>ms.map(m=>m.id===id?{...m,...data}:m));
    setEditId(null); toast('อัปเดตการจับคู่แล้ว ✓');
  };

  const filterChips = [
    {id:'all', th:'แสดงทั้งหมด', n:counts.all},
    {id:'g', th:'ตรงดี', n:counts.g},
    {id:'y', th:'ควรตรวจ', n:counts.y},
    {id:'r', th:'ต้องจับคู่เอง', n:counts.r},
  ];

  return (
    <div className="content scrollthin">
      <div className="page-head" style={{marginBottom:16}}>
        <div>
          <h1 className="page-title">ตรวจสอบการจับคู่ราคา</h1>
          <div className="page-sub">{project.name} · จับคู่วัสดุ {matches.filter(m=>m.matId).length}/{matches.length} รายการกับฐานข้อมูลราคา</div>
        </div>
        <button className="btn btn-ghost" onClick={()=>setSaveTpl(true)}>
          <Icon name="bookmark" size={16}/> บันทึกเป็นเทมเพลต
        </button>
      </div>

      {/* price source config (Step 15) */}
      <div className="card" style={{padding:'16px 20px',marginBottom:20}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
          <div className="field" style={{margin:0}}>
            <label>แหล่งราคาวัสดุ</label>
            <select className="sel" value={matSrc} onChange={e=>setMatSrc(e.target.value)}>
              {PRICE_SOURCES.map(s=><option key={s.id} value={s.id}>{s.th}</option>)}</select>
          </div>
          <div className="field" style={{margin:0}}>
            <label>แหล่งราคาค่าแรง</label>
            <select className="sel" value={laborSrc} onChange={e=>setLaborSrc(e.target.value)}>
              {PRICE_SOURCES.map(s=><option key={s.id} value={s.id}>{s.th}</option>)}</select>
          </div>
          <div className="field" style={{margin:0}}>
            <label>พื้นที่ <span className="hintl">(จากข้อมูลโปรเจกต์)</span></label>
            <select className="sel" defaultValue={project.region}>
              {['กทม','ภาคเหนือ','ภาคอีสาน','ภาคใต้','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก'].map(r=><option key={r}>{r}</option>)}</select>
          </div>
        </div>
        <div style={{borderTop:'1px solid var(--border)',marginTop:14,paddingTop:12}}>
          <button className="nav-item" style={{color:'var(--ink-2)',padding:'4px 0',width:'auto',background:'none'}}
            onClick={()=>setAdvOpen(a=>!a)}>
            <Icon name={advOpen?'chevD':'chevR'} size={15}/> ปรับเปอร์เซ็นต์ (overhead / กำไร / VAT)
          </button>
          {advOpen && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,180px)',gap:18,marginTop:12}}>
              {[['overhead','ค่าดำเนินการ'],['profit','กำไร'],['vat','ภาษีมูลค่าเพิ่ม']].map(([k,l])=>(
                <div className="field" key={k} style={{margin:0}}>
                  <label>{l}</label>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <input className="inp mono" type="number" style={{width:90}} value={pct[k]}
                      onChange={e=>setPct({...pct,[k]:Math.max(0,parseFloat(e.target.value)||0)})}/>
                    <span style={{color:'var(--ink-3)'}}>%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:24,alignItems:'start'}}>
        {/* match table */}
        <div>
          <div className="chips" style={{marginBottom:14}}>
            {filterChips.map(c=>(
              <button key={c.id} className={'chip '+(filter===c.id?'active':'')} onClick={()=>setFilter(c.id)}>
                {c.id!=='all' && <span style={{width:8,height:8,borderRadius:'50%',
                  background:c.id==='g'?'var(--green)':c.id==='y'?'#eab308':'var(--red)'}}></span>}
                {c.th}<span className="ct">{c.n}</span>
              </button>
            ))}
          </div>

          <div className="ptable-wrap">
            <table className="ptable">
              <thead><tr>
                <th>รายการที่ถอดได้</th><th></th><th>จับคู่กับ</th><th>ราคา/หน่วย</th><th>ที่มา</th><th>ความมั่นใจ</th>
              </tr></thead>
              <tbody>
                {visible.map(m=>{
                  const mat = matById(m.matId);
                  const src = srcById(m.src);
                  const band = m.conf>=90?'green':m.conf>=70?'amber':'red';
                  const price = m.ovr ?? m.price;
                  return (
                    <tr key={m.id} className="prow" onClick={()=>setEditId(m.id)}>
                      <td><span className={'ribbon rb-'+band}></span><span className="raw">{m.raw}</span></td>
                      <td className="arrow"><Icon name="arrowR" size={15}/></td>
                      <td>
                        {mat ? <><div className="matname">{mat.name}</div><div className="matspec">{mat.spec} · {mat.unit}</div></>
                          : <span className="badge b-red"><Icon name="info" size={12}/> ยังไม่จับคู่</span>}
                      </td>
                      <td className="pprice">
                        {mat ? <>{baht(price, price<100?2:0)} {m.ovr!=null && <span className="badge b-amber" style={{marginRight:4}}>แก้ไข</span>}</> : '—'}
                      </td>
                      <td>{src ? <span className={'badge '+src.cls}>{src.short}</span> : <span style={{color:'var(--ink-4)'}}>—</span>}</td>
                      <td><ConfBadge c={m.conf}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12,fontSize:12.5,color:'var(--ink-3)'}}>
            <Icon name="info" size={14}/> คลิกที่แถวเพื่อเปลี่ยนวัสดุ แก้ไขราคา หรือเปลี่ยนแหล่งที่มา
          </div>
        </div>

        {/* summary (Step 18) */}
        <div className="quote">
          <div className="sum-card">
            <div className="sh">สรุปต้นทุน (Step 18)</div>
            <div className="sline"><div className="l"><small>{matches.filter(m=>m.matId).length} รายการ</small>ค่าวัสดุรวม</div><div className="v">{baht(matTotal)}</div></div>
            <div className="sline"><div className="l"><small>{LABOR.length} หมวด</small>ค่าแรงรวม</div><div className="v">{baht(laborTotal)}</div></div>
            <div className="sline sub"><div className="l">รวมต้นทุนตรง</div><div className="v">{baht(direct)}</div></div>
            <div className="sline"><div className="l"><small>{pct.overhead}%</small>ค่าดำเนินการ</div><div className="v">{baht(overhead)}</div></div>
            <div className="sline"><div className="l"><small>{pct.profit}%</small>กำไร</div><div className="v">{baht(profit)}</div></div>
            <div className="sline"><div className="l"><small>{pct.vat}%</small>ภาษีมูลค่าเพิ่ม</div><div className="v">{baht(vat)}</div></div>
            <div className="sgrand"><div className="l">รวมทั้งสิ้น</div><div className="v">{baht(grand)}</div></div>
          </div>

          {/* mini composition bar */}
          <div className="card" style={{padding:16,marginTop:14}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>สัดส่วนต้นทุน</div>
            <div style={{display:'flex',height:12,borderRadius:6,overflow:'hidden',marginBottom:12}}>
              <div style={{width:(matTotal/grand*100)+'%',background:'var(--primary)'}}></div>
              <div style={{width:(laborTotal/grand*100)+'%',background:'var(--cyan)'}}></div>
              <div style={{width:((overhead+profit)/grand*100)+'%',background:'var(--orange)'}}></div>
              <div style={{width:(vat/grand*100)+'%',background:'var(--ink-4)'}}></div>
            </div>
            {[['ค่าวัสดุ','var(--primary)',matTotal],['ค่าแรง','var(--cyan)',laborTotal],['OH+กำไร','var(--orange)',overhead+profit],['VAT','var(--ink-4)',vat]].map(([l,c,v])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:8,fontSize:12.5,padding:'3px 0'}}>
                <span style={{width:9,height:9,borderRadius:3,background:c,flex:'0 0 9px'}}></span>
                <span style={{color:'var(--ink-2)',whiteSpace:'nowrap'}}>{l}</span>
                <span className="mono" style={{marginRight:'auto',color:'var(--ink-4)'}}></span>
                <span className="mono" style={{color:'var(--ink)'}}>{baht(v)}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-lg" style={{width:'100%',marginTop:14}} onClick={()=>setConfirmOpen(true)}>
            ยืนยันราคา <Icon name="arrowR" size={17}/>
          </button>
        </div>
      </div>

      {/* override side modal */}
      {editId && <OverrideModal m={matches.find(x=>x.id===editId)} onClose={()=>setEditId(null)} onSave={applyOverride}/>}
      {saveTpl && <SaveTemplateModal count={matches.filter(m=>m.matId).length} onClose={()=>setSaveTpl(false)}
        onSave={(nm)=>{ setSaveTpl(false); toast('บันทึกเทมเพลต "'+nm+'" แล้ว ✓','bookmark'); }}/>}
      {confirmOpen && (
        <Modal title="ยืนยันราคาสุดท้าย?" onClose={()=>setConfirmOpen(false)}
          foot={<><button className="btn btn-ghost" onClick={()=>setConfirmOpen(false)}>ขอแก้ราคา</button>
            <button className="btn btn-primary" onClick={()=>{ setConfirmOpen(false); onConfirm(); }}>ยืนยัน → ส่งออก</button></>}>
          <div style={{textAlign:'center',padding:'6px 0'}}>
            <div style={{fontSize:13,color:'var(--ink-3)'}}>ยอดรวมทั้งสิ้น</div>
            <div className="mono" style={{fontSize:34,fontWeight:700,color:'var(--ink)',margin:'6px 0'}}>{baht(grand)}</div>
            <div style={{fontSize:13,color:'var(--ink-2)'}}>หลังยืนยัน ระบบจะสร้างไฟล์ Excel และ PDF</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function OverrideModal({ m, onClose, onSave }){
  const [matId,setMatId] = useState(m.matId);
  const [src,setSrc] = useState(m.src||'gov');
  const [ovr,setOvr] = useState(m.ovr ?? '');
  const [reason,setReason] = useState('');
  const [q,setQ] = useState('');
  const mat = matById(matId);
  const results = CATALOG.filter(c => !q || (c.name+c.spec).toLowerCase().includes(q.toLowerCase()));

  return (
    <SideModal title="แก้ไขการจับคู่" sub={m.raw} onClose={onClose}
      foot={<><button className="btn btn-ghost" style={{flex:1}} onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" style={{flex:1}}
          onClick={()=>onSave(m.id,{ matId, src, ovr: ovr===''?null:parseFloat(ovr),
            conf: matId===m.matId ? m.conf : 100 })}>บันทึก</button></>}>
      <div className="field">
        <label>จับคู่กับวัสดุ</label>
        <div className="search" style={{padding:'9px 12px',background:'var(--surface-2)',borderRadius:10,border:'1px solid var(--border-2)'}}>
          <Icon name="search" size={15}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาวัสดุในแคตตาล็อก…"/>
        </div>
        <div className="dd scrollthin">
          {results.map(c=>(
            <div key={c.id} className={'dd-item '+(matId===c.id?'sel':'')} onClick={()=>{setMatId(c.id);setOvr('');}}>
              <span>{c.name} <span style={{color:'var(--ink-3)'}}>{c.spec}</span></span>
              <span className="sp">{baht(c.price, c.price<100?2:0)}/{c.unit}</span>
            </div>
          ))}
          {results.length===0 && <div className="dd-item" style={{color:'var(--ink-4)'}}>ไม่พบวัสดุ</div>}
        </div>
      </div>

      <div className="field">
        <label>แหล่งราคา</label>
        <select className="sel" value={src} onChange={e=>setSrc(e.target.value)}>
          {PRICE_SOURCES.map(s=><option key={s.id} value={s.id}>{s.th}</option>)}</select>
      </div>

      <div className="field">
        <label>แก้ไขราคา/หน่วย <span className="hintl">{mat?`(ค่าตั้งต้น ${baht(mat.price,mat.price<100?2:0)})`:''}</span></label>
        <input className="inp mono" type="number" value={ovr} placeholder={mat?String(mat.price):'0'}
          onChange={e=>setOvr(e.target.value)}/>
      </div>

      {ovr!=='' && ovr!=null && (
        <div className="field">
          <label>เหตุผลในการแก้ราคา</label>
          <textarea className="ta" value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="เช่น ใช้ราคาจากใบเสนอราคาผู้ค้าจริง"></textarea>
        </div>
      )}
    </SideModal>
  );
}

function SaveTemplateModal({ count, onClose, onSave }){
  const [nm,setNm] = useState('ราคา รับเหมา '+new Date().getFullYear()+543);
  return (
    <Modal title="บันทึกเป็นเทมเพลตราคา" sub={`บันทึกราคาทั้งหมด ${count} รายการเพื่อใช้ซ้ำ`} onClose={onClose}
      foot={<><button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={!nm.trim()} onClick={()=>onSave(nm)}>บันทึกเทมเพลต</button></>}>
      <div className="field"><label>ชื่อเทมเพลต</label>
        <input className="inp" value={nm} onChange={e=>setNm(e.target.value)} autoFocus/></div>
      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12.5,color:'var(--ink-3)'}}>
        <Icon name="info" size={14}/> เทมเพลตจะปรากฏในเมนู “เทมเพลตราคาของฉัน”
      </div>
    </Modal>
  );
}
window.PricingScreen = PricingScreen;
