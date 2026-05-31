/* ===================== Structural drawing placeholder ===================== */
function DrawingPlan({ page, highlightCode, highlightCat }){
  // SVG coordinate grid
  const cols = [120, 300, 480, 600];   // x grid lines (1..4)
  const ry   = [120, 250, 400];        // y grid lines (A..C)
  const gx = ['1','2','3','4'], gy = ['A','B','C'];

  // ── Highlight map: รหัสโครงสร้าง → ตำแหน่งบน SVG ──────────────────
  // pts = จุดกึ่งกลางของ element นั้น (เสา/ฐานราก)
  // segs = เส้นคาน [{x1,y1,x2,y2}]
  // rect = พื้นที่เต็ม (พื้น/หลังคา/บันได) {x,y,w,h}
  const HL = {
    // ── ฐานราก ──
    F1: { type:'footing', pts:[{x:120,y:120},{x:600,y:120},{x:120,y:400},{x:600,y:400}] },
    F2: { type:'footing', pts:[{x:300,y:120},{x:480,y:120},{x:300,y:400},{x:480,y:400}] },
    // ── เสา ──
    C1: { type:'column', pts:[
      {x:120,y:120},{x:300,y:120},{x:480,y:120},{x:600,y:120},
      {x:120,y:250},{x:600,y:250},
      {x:120,y:400},{x:300,y:400},{x:480,y:400},{x:600,y:400}
    ]},
    C2: { type:'column', pts:[{x:300,y:250},{x:480,y:250}] },
    // ── คาน ──
    GB1: { type:'beam', segs:[
      {x1:120,y1:250,x2:600,y2:250},
      {x1:120,y1:400,x2:600,y2:400},
    ]},
    B2: { type:'beam', segs:[
      {x1:120,y1:120,x2:600,y2:120},
      {x1:120,y1:250,x2:600,y2:250},
    ]},
    RB3: { type:'beam', segs:[
      {x1:120,y1:120,x2:600,y2:120},
    ]},
    // ── พื้น ──
    S1: { type:'slab', rect:{x:120,y:255,w:480,h:145} },
    S2: { type:'slab', rect:{x:120,y:125,w:480,h:125} },
    // ── บันได ──
    ST1: { type:'stair', rect:{x:355,y:190,w:95,h:160} },
    // ── หลังคา ──
    RF1: { type:'roof', rect:{x:115,y:115,w:490,h:295} },
  };

  // แปลงรหัสจาก row (เช่น "C1-CON", "C1-RB") → base code ใน HL (เช่น "C1")
  const base = highlightCode
    ? (Object.keys(HL)
        .sort((a,b) => b.length - a.length)   // match longest key first (e.g. "GB1" before "B1")
        .find(k =>
          highlightCode === k ||
          (highlightCode.startsWith(k) && highlightCode[k.length] === '-')
        ) || null)
    : null;
  // ── Fallback ตามหมวดงาน ────────────────────────────────────────
  // ถ้าหารหัสตรงใน HL ไม่เจอ (เช่น AI ส่งรหัส F3/C5/B7 ที่ไม่มีในแบบสาธิต)
  // ให้ไฮไลท์ "สมาชิกทั้งหมวด" แทน เพื่อให้ผู้ใช้เห็นตำแหน่งโดยประมาณเสมอ
  const CAT_FALLBACK = {
    'ฐานราก': { type:'footing', pts:[
      {x:120,y:120},{x:300,y:120},{x:480,y:120},{x:600,y:120},
      {x:120,y:250},{x:600,y:250},
      {x:120,y:400},{x:300,y:400},{x:480,y:400},{x:600,y:400},
    ]},
    'เสา': { type:'column', pts:[
      {x:120,y:120},{x:300,y:120},{x:480,y:120},{x:600,y:120},
      {x:120,y:250},{x:300,y:250},{x:480,y:250},{x:600,y:250},
      {x:120,y:400},{x:300,y:400},{x:480,y:400},{x:600,y:400},
    ]},
    'คาน': { type:'beam', segs:[
      {x1:120,y1:120,x2:600,y2:120},
      {x1:120,y1:250,x2:600,y2:250},
      {x1:120,y1:400,x2:600,y2:400},
    ]},
    'พื้น':   { type:'slab',  rect:{x:120,y:125,w:480,h:275} },
    'บันได':  { type:'stair', rect:{x:355,y:190,w:95,h:160} },
    'หลังคา': { type:'roof',  rect:{x:115,y:115,w:490,h:295} },
  };
  // approx = true เมื่อใช้ fallback (จะแสดง badge "≈ ตำแหน่งโดยประมาณ")
  const baseHl = base ? HL[base] : null;
  const approx = !baseHl && !!highlightCat && !!CAT_FALLBACK[highlightCat];
  const hl = baseHl || (approx ? CAT_FALLBACK[highlightCat] : null);
  // ป้ายโค้ดที่มุมซ้ายบน: ใช้ base ถ้าเจอ ไม่งั้นใช้รหัสดิบที่คลิก (highlightCode)
  const badgeCode = base || (hl ? highlightCode : null);

  const OG  = '#f97316';        // orange-500
  const OGA = '#f9731628';      // orange transparent fill

  return (
    <svg width="720" height="540" viewBox="0 0 720 540" style={{display:'block'}}>
      <defs>
        {/* glow filter สำหรับ highlight */}
        <filter id="og-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <pattern id="eg" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#eef2f7" strokeWidth="1"/>
        </pattern>
      </defs>

      {/* พื้นหลัง */}
      <rect width="720" height="540" fill="#ffffff"/>
      <rect x="60" y="60" width="600" height="400" fill="url(#eg)"/>
      <rect x="60" y="60" width="600" height="400" fill="none" stroke="#cfd8e6" strokeWidth="1.5"/>

      {/* ── highlight: พื้น / หลังคา / บันได (วาดใต้ grid lines) ── */}
      {hl && (hl.type==='slab' || hl.type==='roof' || hl.type==='stair') && (
        <rect className="svg-hl"
          x={hl.rect.x} y={hl.rect.y} width={hl.rect.w} height={hl.rect.h}
          fill={OGA} stroke={OG} strokeWidth="2.5"
          strokeDasharray={hl.type==='stair' ? '0' : '8 4'} rx="3"/>
      )}

      {/* ── grid lines (vertical) ── */}
      {cols.map((x,i)=>(
        <g key={'c'+i}>
          <line x1={x} y1="42" x2={x} y2="470" stroke="#c2ccdb" strokeWidth="1" strokeDasharray="5 4"/>
          <circle cx={x} cy="34" r="13" fill="#fff" stroke="#9aa7bd" strokeWidth="1.3"/>
          <text x={x} y="39" textAnchor="middle" fontSize="13" fill="#5b6b80" fontFamily="monospace">{gx[i]}</text>
        </g>
      ))}
      {/* ── grid lines (horizontal) ── */}
      {ry.map((y,i)=>(
        <g key={'r'+i}>
          <line x1="48" y1={y} x2="652" y2={y} stroke="#c2ccdb" strokeWidth="1" strokeDasharray="5 4"/>
          <circle cx="40" cy={y} r="13" fill="#fff" stroke="#9aa7bd" strokeWidth="1.3"/>
          <text x="40" y={y+5} textAnchor="middle" fontSize="13" fill="#5b6b80" fontFamily="monospace">{gy[i]}</text>
        </g>
      ))}

      {/* ── highlight: คาน (วาดก่อน beam จริงเพื่อให้ glow อยู่ด้านหลัง) ── */}
      {hl?.type==='beam' && hl.segs.map((s,i)=>(
        <line key={'hb'+i} className="svg-hl"
          x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={OG} strokeWidth="12" strokeLinecap="round" filter="url(#og-glow)"/>
      ))}

      {/* ── beams (ทับ beam-highlight) ── */}
      {ry.map((y,ri)=> cols.slice(0,-1).map((x,ci)=>(
        <line key={'bh'+ri+ci} x1={x} y1={y} x2={cols[ci+1]} y2={y} stroke="#7c8aa3" strokeWidth="3"/>
      )))}
      {cols.map((x,ci)=> ry.slice(0,-1).map((y,ri)=>(
        <line key={'bv'+ci+ri} x1={x} y1={y} x2={x} y2={ry[ri+1]} stroke="#7c8aa3" strokeWidth="3"/>
      )))}

      {/* ── columns (สี่เหลี่ยมดำ ที่ทุก grid intersection) ── */}
      {cols.map((x)=> ry.map((y)=>(
        <rect key={'col'+x+y} x={x-9} y={y-9} width="18" height="18" fill="#0f1b2d"/>
      )))}

      {/* ── highlight: เสา (orange ring รอบ column square) ── */}
      {hl?.type==='column' && hl.pts.map((p,i)=>(
        <rect key={'hc'+i} className="svg-hl"
          x={p.x-18} y={p.y-18} width="36" height="36"
          fill={OGA} stroke={OG} strokeWidth="2.5" rx="5" filter="url(#og-glow)"/>
      ))}

      {/* ── highlight: ฐานราก (orange circle) ── */}
      {hl?.type==='footing' && hl.pts.map((p,i)=>(
        <circle key={'hf'+i} className="svg-hl"
          cx={p.x} cy={p.y} r="24"
          fill={OGA} stroke={OG} strokeWidth="2.5" filter="url(#og-glow)"/>
      ))}

      {/* ── code badge ที่มุมซ้ายบนของ drawing เมื่อมี highlight ── */}
      {badgeCode && (
        <g>
          <rect x="66" y="66" width={badgeCode.length*8+22} height="22" rx="4" fill={OG}/>
          <text x="77" y="81.5" fontSize="12" fill="#fff" fontFamily="monospace" fontWeight="bold">{badgeCode}</text>
          {approx && (
            <g>
              <rect x={66+badgeCode.length*8+28} y="66" width="118" height="22" rx="4" fill="#fff" stroke={OG} strokeWidth="1.3"/>
              <text x={66+badgeCode.length*8+36} y="81.5" fontSize="11" fill={OG} fontFamily="monospace">≈ ตำแหน่งโดยประมาณ</text>
            </g>
          )}
        </g>
      )}

      {/* ── dimension line ── */}
      <line x1="60" y1="495" x2="660" y2="495" stroke="#9aa7bd" strokeWidth="1"/>
      <text x="360" y="512" textAnchor="middle" fontSize="12" fill="#8a97a8" fontFamily="monospace">18.00 m</text>

      {/* ── title block ── */}
      <g>
        <rect x="470" y="468" width="190" height="62" fill="#f8fafc" stroke="#cfd8e6"/>
        <line x1="470" y1="490" x2="660" y2="490" stroke="#cfd8e6"/>
        <text x="480" y="483" fontSize="11" fill="#475569" fontFamily="monospace">โครงการ: อาคารพาณิชย์ 4 ชั้น</text>
        <text x="480" y="506" fontSize="10" fill="#8a97a8" fontFamily="monospace">แผ่น S-0{page}</text>
        <text x="480" y="521" fontSize="10" fill="#8a97a8" fontFamily="monospace">มาตราส่วน 1:100</text>
      </g>
    </svg>
  );
}
window.DrawingPlan = DrawingPlan;
