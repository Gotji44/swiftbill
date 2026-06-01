/* ===================== Results view (Step 11/12/13) ===================== */
// แปลงผลลัพธ์ BOQ จาก Claude (boqData.items) → rows ของตาราง
function mapBoqToRows(boqData){
  if(!boqData || !Array.isArray(boqData.items) || boqData.items.length===0) return null;
  // หมวดที่ระบบรู้จัก (ตรงกับ CAT_COLOR)
  const KNOWN = Object.keys(CAT_COLOR);
  const normCat = (c) => {
    if(!c) return 'ฐานราก';
    const s = String(c);
    const hit = KNOWN.find(k => s.includes(k));
    return hit || KNOWN[0];
  };
  return boqData.items.map((it,i)=>({
    id: 'ai'+i,
    cat: normCat(it.category),
    code: it.code || ('R-'+(i+1)),
    name: it.name || it.notes || 'รายการงาน',
    qty: Number(it.qty)||0,
    unit: it.unit || 'หน่วย',
    vol: Number(it.volume)||0,
    page: Number(it.page_num)||1,
    bbox: null,            // Claude ไม่ได้ส่งพิกัด → ไม่มีกรอบบนแบบ
    notes: it.notes || '',
  }));
}

function ResultsScreen({ project, boqData, onConfirm }){
  const toast = useToast();
  const aiRows = mapBoqToRows(boqData);
  const isReal = !!aiRows;
  const [rows,setRows] = useState(()=> aiRows || QUANTITIES.map(r=>({...r})));
  const [sel,setSel] = useState(null);
  const [openG,setOpenG] = useState(()=>{ const o={}; Object.keys(CAT_COLOR).forEach(c=>o[c]=true); return o; });
  const [search,setSearch] = useState('');
  const [catF,setCatF] = useState('all');
  const [zoom,setZoom] = useState(1);
  const [page,setPage] = useState(3);
  const [drawer,setDrawer] = useState(true);
  const [addOpen,setAddOpen] = useState(false);
  const [delId,setDelId] = useState(null);
  const [auditId,setAuditId] = useState(null);
  const [confirmOpen,setConfirmOpen] = useState(false);
  // เตือนเมื่อ AI ถอดข้อมูลได้ไม่ครบ (ผลลัพธ์ถูกตัดเพราะยาวเกินขีดจำกัด)
  const partialWarning = boqData?.summary?._warning || null;
  const [warnOpen,setWarnOpen] = useState(true);

  // resizable split
  const splitRef = useRef(null);
  const dragRef = useRef(false);
  const [rightW,setRightW] = useState(54); // percent of split width
  useEffect(()=>{
    const move = (e)=>{
      if(!dragRef.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      let pct = (rect.right - e.clientX) / rect.width * 100;
      setRightW(Math.max(32, Math.min(72, pct)));
    };
    const up = ()=>{ if(dragRef.current){ dragRef.current=false; document.body.style.cursor=''; document.body.style.userSelect=''; } };
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
    return ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
  },[]);
  const startDrag = ()=>{ dragRef.current=true; document.body.style.cursor='col-resize'; document.body.style.userSelect='none'; };

  const cats = Object.keys(CAT_COLOR);
  const pages = [...new Set(rows.map(r=>r.page))].sort((a,b)=>a-b);
  const visRows = rows.filter(r =>
    (catF==='all'||r.cat===catF) &&
    (!search || r.code.toLowerCase().includes(search.toLowerCase()) || r.name.includes(search)));

  const grouped = cats.map(c=>({ cat:c, items:visRows.filter(r=>r.cat===c) })).filter(g=>g.items.length);
  const pageBoxes = rows.filter(r=>r.page===page && r.bbox);

  const selRow = rows.find(r => r.id === sel);
  // ส่ง highlightCode ไป DrawingPlan เฉพาะ row ที่ไม่มี bbox เดิม (AI/Demo rows)
  // row ที่มี bbox อยู่แล้วจะใช้ระบบ .bbox overlay overlay ตามเดิม
  const svgHighlight = (selRow && !selRow.bbox) ? selRow.code : null;
  const svgHighlightCat = (selRow && !selRow.bbox) ? selRow.cat : null;

  const selectRow = r => {
    setSel(r.id);
    setPage(r.page);
  };
  const selectBox = r => { setSel(r.id); };

  const editQty = (id,val) => {
    const v = val==='' ? '' : Math.max(0, parseFloat(val)||0);
    setRows(rs=>rs.map(r=>r.id===id?{...r,qty:v}:r));
  };
  const commitEdit = () => toast('บันทึกแล้ว ✓');

  const addRow = (data) => {
    setRows(rs=>[...rs,{ id:'n'+Date.now(), bbox:null, page, vol:0, ...data }]);
    setAddOpen(false); toast('เพิ่มรายการแล้ว ✓');
  };
  const doDelete = () => { setRows(rs=>rs.filter(r=>r.id!==delId)); setDelId(null); toast('ลบรายการแล้ว ✓'); };

  const totalRows = rows.reduce((a,r)=>a+(Number(r.qty)||0),0);

  return (
    <div className="content flush">
      {/* top toolbar */}
      <div style={{padding:'14px 22px',borderBottom:'1px solid var(--border)',background:'var(--surface)',
        display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
        <div style={{marginLeft:0}}>
          <div style={{fontWeight:600,fontSize:16,display:'flex',alignItems:'center',gap:8}}>
            ผลลัพธ์ปริมาณงาน
            {isReal && <span className="badge b-green" style={{fontSize:11}}><Icon name="check" size={12}/> ถอดด้วย Claude AI</span>}
          </div>
          <div style={{fontSize:12.5,color:'var(--ink-3)'}}>{project.name}</div>
        </div>
        <div className="chips" style={{marginLeft:18}}>
          <button className={'chip '+(catF==='all'?'active':'')} onClick={()=>setCatF('all')}>
            ทั้งหมด<span className="ct">{rows.length}</span>
          </button>
          {cats.map(c=>{
            const n = rows.filter(r=>r.cat===c).length;
            if(!n) return null;
            return <button key={c} className={'chip '+(catF===c?'active':'')} onClick={()=>setCatF(c)}>
              <span style={{width:8,height:8,borderRadius:3,background:CAT_COLOR[c]}}></span>{c}<span className="ct">{n}</span>
            </button>;
          })}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:10,alignItems:'center'}}>
          <div className="search" style={{padding:'9px 14px',width:280}}>
            <Icon name="search" size={16}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหารหัสหรือชื่อรายการ…"/>
          </div>
          <button className="btn btn-soft" onClick={()=>setAddOpen(true)}><Icon name="plus" size={16}/> เพิ่มรายการ</button>
        </div>
      </div>

      {/* ── แถบเตือนข้อมูลไม่ครบ (ผลลัพธ์ถูกตัดเพราะแบบยาว/ซับซ้อน) ── */}
      {partialWarning && warnOpen && (
        <div style={{padding:'11px 22px',background:'#fffbeb',borderBottom:'1px solid #fcd34d',
          display:'flex',alignItems:'flex-start',gap:12,fontSize:13,color:'#92400e',lineHeight:1.6}}>
          <span style={{fontSize:16,flex:'0 0 auto'}}>⚠️</span>
          <div style={{flex:1}}>
            <b>ข้อมูลบางส่วนอาจไม่ครบ</b> — {partialWarning}
          </div>
          <button className="btn btn-ghost btn-sm" style={{flex:'0 0 auto',color:'#92400e'}}
            onClick={()=>setWarnOpen(false)}>ปิด</button>
        </div>
      )}

      <div className="split" ref={splitRef}>
        {/* LEFT: drawing viewer */}
        <div className="split-l">
          <div className="viewer-bar">
            <span className="vt"><Icon name="file" size={15} style={{verticalAlign:'-3px',marginLeft:4}}/> แบบ S-0{page} · โครงสร้าง</span>
            <div style={{marginLeft:'auto'}}></div>
            <div className="zoomctl">
              <button onClick={()=>setZoom(z=>Math.max(.6,+(z-.15).toFixed(2)))}><Icon name="zoomOut" size={16}/></button>
              <span className="zv">{Math.round(zoom*100)}%</span>
              <button onClick={()=>setZoom(z=>Math.min(2,+(z+.15).toFixed(2)))}><Icon name="zoomIn" size={16}/></button>
            </div>
          </div>
          <div className="viewer-stage scrollthin">
            <div className="drawing" style={{transform:`scale(${zoom})`}}>
              <DrawingPlan page={page} highlightCode={svgHighlight} highlightCat={svgHighlightCat}/>
              {pageBoxes.map(r=>(
                <div key={r.id} className={'bbox '+(sel===r.id?'on':'')}
                  style={{left:r.bbox.x+'%',top:r.bbox.y+'%',width:r.bbox.w+'%',height:r.bbox.h+'%'}}
                  onClick={()=>selectBox(r)} title={r.code+' · '+r.name}>
                  <span className="tag">{r.code}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pagebar">
            <button className="minibtn" disabled={page<=pages[0]} onClick={()=>setPage(p=>Math.max(pages[0],p-1))}><Icon name="chevR" size={16}/></button>
            <span>แผ่น S-0{page} · {pages.indexOf(page)+1} / {pages.length}</span>
            <button className="minibtn" disabled={page>=pages[pages.length-1]} onClick={()=>setPage(p=>Math.min(pages[pages.length-1],p+1))}><Icon name="chevL" size={16}/></button>
          </div>
        </div>

        {/* draggable divider */}
        <div className="gutter" onMouseDown={startDrag} title="ลากเพื่อปรับขนาด"><span className="grip"></span></div>

        {/* RIGHT: quantity table */}
        <div className="split-r" style={{width:rightW+'%'}}>
          <div className="qbody scrollthin">
            {grouped.length===0 && <div className="empty"><div className="eic"><Icon name="search" size={26}/></div><div>ไม่พบรายการที่ตรงกับการค้นหา</div></div>}
            {grouped.map(g=>{
              const tVol = g.items.reduce((a,r)=>a+r.vol*(Number(r.qty)||0)/(r.qty||1),0);
              const tQty = g.items.reduce((a,r)=>a+(Number(r.qty)||0),0);
              const sumVol = g.items.reduce((a,r)=>a+r.vol,0);
              return (
                <div className="acc" key={g.cat}>
                  <div className={'acc-head '+(openG[g.cat]?'open':'')} onClick={()=>setOpenG(o=>({...o,[g.cat]:!o[g.cat]}))}>
                    <span className="acc-cat" style={{background:CAT_COLOR[g.cat]}}></span>
                    <span className="nm">{g.cat}</span>
                    <span className="ct">{tQty} หน่วย · {g.items.length} รายการ</span>
                    <span className="vol">รวม {fmt(sumVol,2)} ลบ.ม.</span>
                    <Icon name="chevR" size={16} className="chev"/>
                  </div>
                  {openG[g.cat] && (
                    <table className="qtable">
                      <thead><tr>
                        <th>รหัส</th><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>ที่มา</th><th></th>
                      </tr></thead>
                      <tbody>
                        {g.items.map(r=>(
                          <tr key={r.id} className={'qrow '+(sel===r.id?'on':'')} onClick={()=>selectRow(r)}>
                            <td className="code">{r.code}</td>
                            <td>{r.name}</td>
                            <td onClick={e=>e.stopPropagation()}>
                              <input className="qedit" value={r.qty} onChange={e=>editQty(r.id,e.target.value)} onBlur={commitEdit}/>
                            </td>
                            <td style={{color:'var(--ink-3)'}}>{r.unit}</td>
                            <td onClick={e=>{e.stopPropagation(); selectRow(r);}}>
                              {r.bbox
                                ? <span className="src">S-0{r.page} ↗</span>
                                : <span className="src" style={{opacity:.7}}>↗ ดูแบบ</span>}
                            </td>
                            <td onClick={e=>e.stopPropagation()}>
                              <div className="rowact">
                                <button className="minibtn" title="ประวัติการแก้ไข" onClick={()=>setAuditId(r.id)}><Icon name="clock" size={15}/></button>
                                <button className="minibtn del" title="ลบ" onClick={()=>setDelId(r.id)}><Icon name="trash" size={15}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>

          {/* assumption drawer */}
          <div className="drawer">
            <div className={'drawer-head '+(drawer?'open':'')} onClick={()=>setDrawer(d=>!d)}>
              <Icon name="info" size={15}/>
              <span>Assumption Log — สมมติฐานที่ระบบใช้ ({isReal ? rows.filter(r=>r.notes).length : ASSUMPTIONS.length})</span>
              <Icon name="chevU" size={15} className="chev"/>
            </div>
            {drawer && (
              <div className="drawer-body scrollthin">
                {isReal && boqData?.summary?.key_findings && (
                  <div className="logline">
                    <span className="tk">🤖</span>
                    <span><span className="em">[Claude AI]</span> {boqData.summary.key_findings}</span>
                  </div>
                )}
                {isReal
                  ? rows.filter(r=>r.notes).map((r,i)=>(
                      <div className="logline" key={i}>
                        <span className="tk">📝</span>
                        <span><span className="em">[{r.code}]</span> {r.notes}</span>
                      </div>
                    ))
                  : ASSUMPTIONS.map((a,i)=>(
                      <div className="logline" key={i}>
                        <span className="tk">📝</span>
                        <span><span className="em">[{a.tag}]</span> {a.txt}</span>
                      </div>
                    ))}
              </div>
            )}
          </div>

          {/* sticky confirm bar */}
          <div className="confirm-bar">
            <div className="info"><b>{rows.length}</b> รายการ · จากแบบ <b>{project.drawings}</b> ฉบับ · รวม {totalRows} หน่วย</div>
            <button className="btn btn-primary" onClick={()=>setConfirmOpen(true)}>ยืนยันปริมาณ <Icon name="arrowR" size={16}/></button>
          </div>
        </div>
      </div>

      {/* modals */}
      {addOpen && <AddRowModal cats={cats} onClose={()=>setAddOpen(false)} onAdd={addRow}/>}
      {delId && (
        <Modal title="ลบรายการนี้?" sub="การลบไม่สามารถย้อนกลับได้" onClose={()=>setDelId(null)}
          foot={<><button className="btn btn-ghost" onClick={()=>setDelId(null)}>ยกเลิก</button>
            <button className="btn btn-primary" style={{background:'var(--red)'}} onClick={doDelete}>ลบรายการ</button></>}>
          <div style={{fontSize:14,color:'var(--ink-2)'}}>
            ยืนยันการลบ <b style={{color:'var(--ink)'}}>{rows.find(r=>r.id===delId)?.code} · {rows.find(r=>r.id===delId)?.name}</b> ออกจากรายการปริมาณ
          </div>
        </Modal>
      )}
      {auditId && <AuditModal id={auditId} row={rows.find(r=>r.id===auditId)} onClose={()=>setAuditId(null)}/>}
      {confirmOpen && (
        <Modal title="ยืนยันปริมาณทั้งหมด?" onClose={()=>setConfirmOpen(false)}
          foot={<><button className="btn btn-ghost" onClick={()=>setConfirmOpen(false)}>กลับไปแก้ไข</button>
            <button className="btn btn-primary" onClick={()=>{ setConfirmOpen(false); onConfirm(); }}>ยืนยัน {project.pricing?'→ ประเมินราคา':'→ ส่งออก'}</button></>}>
          <div style={{fontSize:14,color:'var(--ink-2)',lineHeight:1.6}}>
            ยืนยันปริมาณทั้งหมด <b style={{color:'var(--ink)'}}>{rows.length} รายการ</b>?
            หลังยืนยันจะไม่สามารถแก้ไขในขั้นนี้ได้
            {project.pricing
              ? <div style={{marginTop:12}} className="badge b-orange"><Icon name="money" size={13}/> ขั้นต่อไป: ประเมินราคา</div>
              : <div style={{marginTop:12}} className="badge b-green"><Icon name="excel" size={13}/> ขั้นต่อไป: ส่งออกไฟล์</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}

function AddRowModal({ cats, onClose, onAdd }){
  const [f,setF] = useState({ cat:cats[0], code:'', name:'', qty:1, unit:'ต้น' });
  const ok = f.code.trim() && f.name.trim();
  return (
    <Modal title="เพิ่มรายการปริมาณ" sub="กรอกข้อมูลรายการใหม่" onClose={onClose}
      foot={<><button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={!ok} onClick={()=>onAdd(f)}>เพิ่มรายการ</button></>}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="field"><label>หมวดงาน</label>
          <select className="sel" value={f.cat} onChange={e=>setF({...f,cat:e.target.value})}>
            {cats.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="field"><label>รหัส</label>
          <input className="inp" value={f.code} onChange={e=>setF({...f,code:e.target.value})} placeholder="เช่น C3"/></div>
      </div>
      <div className="field"><label>รายการ</label>
        <input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="รายละเอียดรายการ"/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="field"><label>จำนวน</label>
          <input className="inp mono" type="number" value={f.qty} onChange={e=>setF({...f,qty:e.target.value})}/></div>
        <div className="field"><label>หน่วย</label>
          <input className="inp" value={f.unit} onChange={e=>setF({...f,unit:e.target.value})}/></div>
      </div>
    </Modal>
  );
}

function AuditModal({ id, row, onClose }){
  const trail = AUDIT[id] || [{by:'ระบบ', t:'10:24', act:'ถอดจากแบบอัตโนมัติ'}];
  return (
    <Modal title="ประวัติการแก้ไข" sub={row ? row.code+' · '+row.name : ''} onClose={onClose}
      foot={<button className="btn btn-ghost" onClick={onClose}>ปิด</button>}>
      <div style={{display:'flex',flexDirection:'column',gap:0}}>
        {trail.map((t,i)=>(
          <div key={i} style={{display:'flex',gap:13,paddingBottom:16,position:'relative'}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{width:11,height:11,borderRadius:'50%',background:i===trail.length-1?'var(--primary)':'var(--border-2)',flex:'0 0 11px',marginTop:4}}></div>
              {i<trail.length-1 && <div style={{width:2,flex:1,background:'var(--border)'}}></div>}
            </div>
            <div>
              <div style={{fontSize:13.5,color:'var(--ink)'}}>{t.act}</div>
              <div style={{fontSize:12,color:'var(--ink-4)',marginTop:2}}>{t.by} · {t.t} น.</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
window.ResultsScreen = ResultsScreen;
