/* ===================== SwiftBill shared components ===================== */
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

/* ---------- Icons (stroke, 1.8) ---------- */
function Icon({ name, size = 18, className = '', style }) {
  const p = {
    dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    scope: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    table: 'M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18',
    layers: 'M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
    money: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
    plus: 'M12 5v14 M5 12h14',
    chevR: 'M9 18l6-6-6-6',
    chevD: 'M6 9l6 6 6-6',
    chevU: 'M18 15l-6-6-6 6',
    chevL: 'M15 18l-6-6 6-6',
    check: 'M20 6 9 17l-5-5',
    x: 'M18 6 6 18 M6 6l12 12',
    building: 'M3 21h18 M5 21V7l8-4v18 M19 21V11l-6-4 M9 9v.01 M9 12v.01 M9 15v.01 M9 18v.01',
    pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-1z',
    cal: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18',
    trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
    plusC: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 8v8 M8 12h8',
    zoomIn: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3 M11 8v6 M8 11h6',
    zoomOut: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3 M8 11h6',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
    excel: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13l3 5 M12 13l-3 5',
    filter: 'M22 3H2l8 9.5V19l4 2v-8.5z',
    edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8',
    bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
    sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
    pie: 'M21 12A9 9 0 1 1 12 3v9z M21 12a9 9 0 0 0-9-9v9z',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5z',
    arrowR: 'M5 12h14 M13 5l7 7-7 7',
    ruler: 'M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z M7 17l1.5-1.5 M11 13l1.5-1.5 M15 9l1.5-1.5',
    panel: 'M3 3h18v18H3z M9 3v18',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
    cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z M12 12v5 M9 14l3-2 3 2',
    refresh: 'M23 4v6h-6 M1 20v-6h6 M3.5 9a9 9 0 0 1 14.9-3.4L23 10 M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
    bolt: 'M13 2 3 14h9l-1 8 10-12h-9z',
    cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
  }[name] || '';
  return (
    <svg className={'ic ' + className} style={style} width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {p.split(' M').map((seg, i) => <path key={i} d={(i ? 'M' : '') + seg} />)}
    </svg>);

}

/* ---------- Status badge ---------- */
function StatusBadge({ status }) {
  const s = STATUS[status];if (!s) return null;
  return <span className={'badge ' + s.cls}><span className="pin"></span>{s.th}</span>;
}

/* ---------- Toast system ---------- */
const ToastCtx = createContext(() => {});
function useToast() {return useContext(ToastCtx);}
function ToastHost({ children }) {
  const [list, setList] = useState([]);
  const push = (msg, icon = 'check') => {
    const id = Math.random().toString(36).slice(2);
    setList((l) => [...l, { id, msg, icon }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 2200);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">
        {list.map((t) =>
        <div className="toast" key={t.id}>
            <Icon name={t.icon} size={16} className="tk" style={{ color: '#34d399' }} />{t.msg}
          </div>
        )}
      </div>
    </ToastCtx.Provider>);

}

/* ---------- Modal ---------- */
function Modal({ title, sub, children, onClose, foot, wide }) {
  useEffect(() => {
    const h = (e) => {if (e.key === 'Escape') onClose();};
    window.addEventListener('keydown', h);return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <div className="scrim" onMouseDown={(e) => {if (e.target === e.currentTarget) onClose();}}>
      <div className={'modal scrollthin ' + (wide ? 'wide' : '')}>
        <div className="modal-head">
          <div>
            <div className="mt">{title}</div>
            {sub && <div className="ms">{sub}</div>}
          </div>
          <button className="minibtn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>);

}

/* ---------- Side modal (right drawer) ---------- */
function SideModal({ title, sub, children, onClose, foot }) {
  useEffect(() => {
    const h = (e) => {if (e.key === 'Escape') onClose();};
    window.addEventListener('keydown', h);return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <div className="side-scrim" onMouseDown={(e) => {if (e.target === e.currentTarget) onClose();}}>
      <div className="side-modal">
        <div className="side-modal-head">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div className="mt" style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
              {sub && <div className="ms" style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>}
            </div>
            <button className="minibtn" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
        </div>
        <div className="side-modal-body scrollthin">{children}</div>
        {foot && <div className="side-modal-foot">{foot}</div>}
      </div>
    </div>);

}

/* ---------- Sidebar ---------- */
function Sidebar({ screen, project, collapsed, onToggle, onNav, onExit, user, locked }) {
  const inProject = !!project;
  const launchBalloons = useBalloon();
  const prevCollapsed  = useRef(collapsed);
  useEffect(()=>{
    if(collapsed && !prevCollapsed.current) launchBalloons();
    prevCollapsed.current = collapsed;
  }, [collapsed]);

  // ดึงชื่อ/อักษรย่อจาก user จริง
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้');
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const userEmail = user?.email || '';

  if (collapsed) {
    const rail = (id, ic, label, disabled = false) => {
      const isLocked = locked;   // ระหว่าง AI ถอดปริมาณ ล็อกทุกเมนูรวมถึงแดชบอร์ด ป้องกันการขัดจังหวะ
      return (
        <button key={id}
          className={'rail-item ' + (screen === id ? 'active' : '') + (disabled || isLocked ? ' disabled' : '')}
          title={isLocked ? 'AI กำลังวิเคราะห์ กรุณารอ…' : label}
          onClick={() => !disabled && !isLocked && onNav(id)}>
          <Icon name={ic} size={20} />
        </button>
      );
    };

    return (
      <aside className="side collapsed">
        <button className="rail-logo" title="ขยายเมนู" onClick={onToggle}>
          <div className="side-logo">S</div>
        </button>
        {rail('dashboard', 'dashboard', 'แดชบอร์ด')}
        {inProject && <>
          <div className="rail-div"></div>
          {rail('upload', 'upload', 'อัปโหลดแบบ')}
          {rail('scope', 'scope', 'เลือกขอบเขต & ใบเสนอราคา')}
          {rail('results', 'table', 'ผลลัพธ์ปริมาณ')}
          {rail('pricing', 'money', 'ตรวจราคา', !project.pricing)}
        </>}
        <div className="side-spacer"></div>
        {rail('templates', 'bookmark', 'เทมเพลตราคาของฉัน')}
        <div className="rail-div"></div>
        <div className="avatar" title={displayName + ' · ' + userEmail}>{avatarLetter}</div>
      </aside>);
  }

  const item = (id, ic, label, sub = false, disabled = false) => {
    const isLocked = locked;   // ระหว่าง AI ถอดปริมาณ ล็อกทุกเมนูรวมถึงแดชบอร์ด ป้องกันการขัดจังหวะ
    return (
      <button className={'nav-item ' + (sub ? 'sub ' : '') + (screen === id ? 'active' : '') + (disabled || isLocked ? ' disabled' : '')}
        title={isLocked ? 'AI กำลังวิเคราะห์อยู่ กรุณารอจนเสร็จ' : undefined}
        onClick={() => !disabled && !isLocked && onNav(id)}>
        {!sub && <Icon name={ic} size={18} />}
        {sub && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'currentColor', opacity: .5, marginLeft: 6 }}></span>}
        <span style={{ flex: 1, textAlign: 'right' }}>{label}</span>
        {isLocked && sub && <span className="spin" style={{width:10,height:10,flex:'0 0 10px'}}></span>}
      </button>
    );
  };

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="side-logo">S</div>
        <div className="side-name">SwiftBill<small>ถอดแบบ · ประมาณราคา</small></div>
        <button className="side-collapse" title="ยุบเมนู" onClick={onToggle}><Icon name="chevR" size={18} /></button>
      </div>

      {item('dashboard', 'dashboard', 'แดชบอร์ด')}

      {inProject && <>
        <div className="side-sec">โปรเจกต์ที่เปิด</div>
        <div style={{ padding: '2px 12px 8px', fontSize: 13, color: '#7b8aa3', lineHeight: 1.4 }}>{project.name}</div>
        {item('upload', 'upload', 'อัปโหลดแบบ', true)}
        {item('scope', 'scope', 'เลือกขอบเขต & ใบเสนอราคา', true)}
        {item('results', 'table', 'ผลลัพธ์ปริมาณ', true)}
        {item('pricing', 'money', 'ตรวจราคา', true, !project.pricing)}
      </>}

      <div className="side-spacer"><CatRunner/></div>
      <div className="side-sec">เครื่องมือ</div>
      {item('templates', 'bookmark', 'เทมเพลตราคาของฉัน')}

      <div className="side-foot">
        <div className="side-user">
          <div className="avatar">{avatarLetter}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nm">{displayName}</div>
            <div className="rl" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{userEmail}</div>
          </div>
          <button className="minibtn" style={{ color: '#7b8aa3' }}
            title="ออกจากระบบ"
            onClick={() => onNav('logout')}><Icon name="logout" size={17} /></button>
        </div>
      </div>
    </aside>);
}

/* ---------- Topbar ---------- */
function Topbar({ crumbs, onToggleSidebar, user }) {
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้');
  const avatarLetter = displayName.charAt(0).toUpperCase();
  return (
    <header className="topbar">
      {onToggleSidebar && <button className="icon-btn" title="เมนู" onClick={onToggleSidebar}><Icon name="panel" size={19} /></button>}
      <div className="search">
        <Icon name="search" size={17} />
        <input placeholder="ค้นหาโปรเจกต์ รายการ หรือวัสดุ…" />
      </div>
      <div className="top-actions">
        {crumbs &&
        <div className="crumb">
            {crumbs.map((c, i) => <React.Fragment key={i}>
              {i > 0 && <Icon name="chevL" size={14} className="sep" />}
              {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
            </React.Fragment>)}
          </div>
        }
        <button className="icon-btn"><Icon name="bell" size={19} /><span className="dot"></span></button>
        <div className="avatar" style={{ width: 36, height: 36, gap: "0px" }} title={displayName}>{avatarLetter}</div>
      </div>
    </header>);
}

/* ---------- Confidence badge ---------- */
function ConfBadge({ c }) {
  if (!c) return <span className="conf conf-r">— ไม่พบ</span>;
  const b = confBand(c);
  return <span className={'conf conf-' + b}>{c}%</span>;
}

/* ===== Balloon animation ===== */
const BalloonCtx = createContext(()=>{});
function useBalloon(){ return useContext(BalloonCtx); }

function BalloonSVG({ color }){
  return (
    <svg width="38" height="54" viewBox="0 0 38 54" style={{display:'block'}}>
      <ellipse cx="19" cy="18" rx="17" ry="18" fill={color} opacity="0.92"/>
      <ellipse cx="12" cy="10" rx="4" ry="6" fill="white" opacity="0.22"/>
      <path d="M17 36 Q19 40 21 36" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M19 40 Q16 46 19 52" stroke="#bbb" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function PopBurst({ color }){
  const [out, setOut] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setOut(true),30); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{position:'relative',width:38,height:38}}>
      <div style={{
        position:'absolute',inset:0,borderRadius:'50%',background:color,
        transform: out?'scale(2.2)':'scale(0.4)',
        opacity: out?0:1,
        transition:'transform .4s ease-out, opacity .35s ease-out',
      }}/>
      {[0,45,90,135,180,225,270,315].map((ang,i)=>{
        const rad=ang*Math.PI/180, d=out?38+i*2:0;
        return (
          <div key={i} style={{
            position:'absolute',top:'50%',left:'50%',
            width:8,height:8,marginTop:-4,marginLeft:-4,
            borderRadius:'50%',background:i%2===0?color:'#fff',
            transform:`translate(${Math.cos(rad)*d}px,${Math.sin(rad)*d}px) scale(${out?0:1})`,
            opacity:out?0:1,
            transition:`transform ${.35+i*.025}s ease-out, opacity .45s ease-out`,
          }}/>
        );
      })}
    </div>
  );
}

function Balloon({ startX, delay, color, scale }){
  const totalMs = useRef(2300 + Math.random()*800).current;
  const popAt   = useRef(delay*1000 + totalMs*(0.60+Math.random()*0.22)).current;
  const [phase, setPhase] = useState('idle');

  useEffect(()=>{
    const t0 = setTimeout(()=>setPhase('rise'), delay*1000);
    const t1 = setTimeout(()=>setPhase('pop'),  popAt);
    const t2 = setTimeout(()=>setPhase('done'), popAt+700);
    return ()=>{ clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if(phase==='idle'||phase==='done') return null;

  return (
    <div style={{
      position:'fixed', left:startX+'%', bottom:'-65px',
      pointerEvents:'none', zIndex:9999,
      animation:`balloonRise ${totalMs/1000}s linear forwards`,
    }}>
      <div style={{transform:`scale(${scale})`, animation:'balloonWobble 1.5s ease-in-out infinite'}}>
        {phase==='rise' && <BalloonSVG color={color}/>}
        {phase==='pop'  && <PopBurst   color={color}/>}
      </div>
    </div>
  );
}

function BalloonHost({ children }){
  const [balloons, setBalloons] = useState([]);
  const launchRef = useRef(null);
  launchRef.current = ()=>{
    const COLORS=['#ef4444','#3b82f6','#f59e0b','#10b981','#8b5cf6','#ec4899','#f97316'];
    const count = 3+Math.floor(Math.random()*2);
    const batch = Array.from({length:count},(_,i)=>({
      id: Date.now()+i,
      startX: 8+Math.random()*82,
      delay:  i*0.35+Math.random()*0.15,
      color:  COLORS[Math.floor(Math.random()*COLORS.length)],
      scale:  0.82+Math.random()*0.36,
    }));
    setBalloons(b=>[...b,...batch]);
    setTimeout(()=>setBalloons(b=>b.filter(x=>!batch.find(n=>n.id===x.id))),5800);
  };
  const launch = useMemo(()=>()=>launchRef.current(),[]);
  return (
    <BalloonCtx.Provider value={launch}>
      {children}
      {ReactDOM.createPortal(
        <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999}}>
          {balloons.map(b=><Balloon key={b.id} startX={b.startX} delay={b.delay} color={b.color} scale={b.scale}/>)}
        </div>,
        document.body
      )}
    </BalloonCtx.Provider>
  );
}

Object.assign(window, { Icon, StatusBadge, ToastHost, useToast, Modal, SideModal, Sidebar, Topbar, ConfBadge,
  BalloonHost, useBalloon, useState, useEffect, useRef, useMemo });