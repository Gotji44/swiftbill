/* ===================== Results view (Step 11/12/13) ===================== */

// ── คอลัมน์ของแต่ละ sheet — ให้ตรงกับ Excel (excel-export.jsx) ───────────
// num = ทศนิยม 2 ตำแหน่ง · int = จำนวนเต็ม · ไม่ระบุ = ข้อความ · alt = field สำรอง
// derived = ช่องที่คำนวณอัตโนมัติจากสูตร (แก้มือไม่ได้) ส่วนช่องอื่นแก้ได้
const SB_SHEET_COLS = {
  footings: { label:'ฐานราก', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ประเภท'}, {k:'shape',label:'รูปทรง'},
    {k:'B',label:'B (m)',num:1}, {k:'L',label:'L (m)',num:1}, {k:'B2',label:'B2 บน (m)',num:1}, {k:'T',label:'T (m)',num:1},
    {k:'count',label:'จำนวน',int:1,alt:'qty'}, {k:'depth',label:'ลึกขุด (m)',num:1},
    {k:'lean_t',label:'หนา Lean (m)',num:1}, {k:'sand_t',label:'หนา ทราย (m)',num:1},
    {k:'fc',label:"fc'",int:1},
    {k:'rebar_x',label:'เหล็กล่าง X',alt:'rebar',steel:1}, {k:'rebar_y',label:'เหล็กล่าง Y',steel:1},
    {k:'piles',label:'เสาเข็ม/ฐาน',int:1},
    {k:'concrete_m3',label:'คสล.รวม (ม³)',num:1,derived:1}, {k:'formwork_m2',label:'ไม้แบบ (ม²)',num:1,derived:1},
    {k:'rebar_kg',label:'เหล็กรวม (kg)',num:1},
  ]},
  columns: { label:'เสา', cols:[
    {k:'code',label:'รหัส'}, {k:'section',label:'หน้าตัด B×D (m)'},
    {k:'height',label:'สูง (m)',num:1}, {k:'count',label:'จำนวน',int:1,alt:'qty'},
    {k:'fc',label:"fc'",int:1}, {k:'rebar_main',label:'เหล็กยืน',alt:'rebar',steel:1}, {k:'ties',label:'ปลอก',steel:1},
    {k:'concrete_per',label:'ปริมาตร/ตัว (ม³)',num:1,derived:1,
      derive:(r)=> Number(r.concrete_per) || (Number(r.concrete_m3||0)/(Number(r.count||r.qty)||1))},
    {k:'concrete_m3',label:'ปริมาตรรวม (ม³)',num:1,derived:1},
    {k:'formwork_m2',label:'ไม้แบบรวม (ม²)',num:1,derived:1}, {k:'rebar_kg',label:'น.น.เหล็กรวม (kg)',num:1},
  ]},
  beams: { label:'คาน', cols:[
    {k:'code',label:'รหัส'}, {k:'section',label:'หน้าตัด B×D (m)'},
    {k:'grid',label:'ตำแหน่ง (กริด)',alt:'gridline'}, {k:'length',label:'ยาว (m)',num:1},
    {k:'count',label:'จำนวน',int:1,alt:'qty'}, {k:'rebar_top',label:'เหล็กบน',alt:'rebar',steel:1},
    {k:'rebar_bot',label:'เหล็กล่าง',steel:1}, {k:'ties',label:'ปลอก',steel:1},
    {k:'concrete_m3',label:'ปริมาตรรวม (ม³)',num:1,derived:1,alt:'volume'},
    {k:'formwork_m2',label:'ไม้แบบรวม (ม²)',num:1,derived:1}, {k:'rebar_kg',label:'น.น.เหล็กรวม (kg)',num:1},
    {k:'notes',label:'หมายเหตุ'},
  ]},
  roof: { label:'หลังคา', cols:[
    {k:'code',label:'รหัส'}, {k:'location',label:'ตำแหน่ง/อาคาร',alt:'name'},
    {k:'flat_area',label:'พื้นที่ฉายราบ (ม²)',num:1,alt:'volume'}, {k:'angle_deg',label:'มุมลาด (°)',int:1},
    {k:'actual_area',label:'พื้นที่จริง (ม²)',num:1,derived:1}, {k:'rafter_m',label:'จันทันเหล็ก (m)',num:1},
    {k:'purlin_m',label:'แปเหล็ก (m)',num:1}, {k:'sag_rod',label:'Sag Rod (เส้น)',int:1},
    {k:'weight_kg',label:'น.น.โครง (kg)',num:1,alt:'rebar_kg'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  slabs_cip: { label:'พื้นหล่อในที่ (CIP)', cols:[
    {k:'code',label:'รหัส'}, {k:'location',label:'ตำแหน่ง',alt:'name'},
    {k:'grid',label:'ตำแหน่ง (กริด)',alt:'gridline'},
    {k:'B',label:'B (m)',num:1}, {k:'L',label:'L (m)',num:1}, {k:'T',label:'T (m)',num:1},
    {k:'count',label:'จำนวน',int:1,alt:'qty'}, {k:'rebar_short',label:'เหล็กขนานด้านสั้น',alt:'rebar',steel:1},
    {k:'rebar_long',label:'เหล็กขนานด้านยาว',steel:1}, {k:'concrete_m3',label:'ปริมาตรรวม (ม³)',num:1,derived:1,alt:'volume'},
    {k:'notes',label:'หมายเหตุ'},
  ]},
  slabs_precast: { label:'พื้นสำเร็จรูป (Solid Plank)', cols:[
    {k:'code',label:'รหัส'}, {k:'location',label:'ตำแหน่ง',alt:'name'},
    {k:'grid',label:'ตำแหน่ง (กริด)',alt:'gridline'},
    {k:'B',label:'B (m)',num:1}, {k:'L',label:'L (m)',num:1}, {k:'count',label:'จำนวนช่อง',int:1,alt:'qty'},
    {k:'plank_t',label:'หนาแผ่น (m)',num:1}, {k:'topping_t',label:'หนา Topping (m)',num:1},
    {k:'topping_rebar',label:'เหล็กเสริม Topping',alt:'wiremesh',steel:1}, {k:'fc',label:"fc' Topping",int:1},
    {k:'load_kg_m2',label:'น้ำหนักบรรทุก (กก./ม²)',int:1}, {k:'area_m2',label:'พื้นที่รวม (ม²)',num:1,derived:1,alt:'volume'},
    {k:'notes',label:'หมายเหตุ'},
  ]},
  // ── งานสถาปัตย์ ──────────────────────────────────────────────
  walls: { label:'ผนัง', cols:[
    {k:'code',label:'รหัส'}, {k:'material',label:'วัสดุ'}, {k:'location',label:'ตำแหน่ง',alt:'name'},
    {k:'length',label:'ยาว (m)',num:1}, {k:'height',label:'สูง (m)',num:1}, {k:'count',label:'จำนวนแนว',int:1,alt:'qty'},
    {k:'gross_m2',label:'พื้นที่รวม (ม²)',num:1}, {k:'openings_m2',label:'หักช่องเปิด (ม²)',num:1},
    {k:'net_m2',label:'สุทธิ (ม²)',num:1}, {k:'plaster_sides',label:'ฉาบ (หน้า)',int:1},
    {k:'plaster_m2',label:'ฉาบปูน (ม²)',num:1}, {k:'notes',label:'หมายเหตุ'},
  ]},
  doors: { label:'ประตู', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ชนิด'}, {k:'material',label:'วัสดุ'},
    {k:'W',label:'กว้าง (m)',num:1}, {k:'H',label:'สูง (m)',num:1}, {k:'frame',label:'วงกบ'},
    {k:'count',label:'จำนวน (ชุด)',int:1,alt:'qty'}, {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  windows: { label:'หน้าต่าง', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ชนิด'}, {k:'material',label:'วัสดุ'},
    {k:'W',label:'กว้าง (m)',num:1}, {k:'H',label:'สูง (m)',num:1}, {k:'frame',label:'วงกบ'},
    {k:'count',label:'จำนวน (ชุด)',int:1,alt:'qty'}, {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  floor_finishes: { label:'พื้นผิว (วัสดุปูพื้น)', cols:[
    {k:'room',label:'ห้อง',alt:'name'}, {k:'material',label:'วัสดุ'},
    {k:'B',label:'B (m)',num:1}, {k:'L',label:'L (m)',num:1}, {k:'area_m2',label:'พื้นที่ (ม²)',num:1,alt:'volume'},
    {k:'skirting_m',label:'บัวเชิงผนัง (m)',num:1}, {k:'skirting_material',label:'วัสดุบัว'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  ceilings: { label:'ฝ้าเพดาน', cols:[
    {k:'room',label:'ห้อง',alt:'name'}, {k:'material',label:'วัสดุ'},
    {k:'level',label:'ระดับฝ้า (m)',num:1}, {k:'area_m2',label:'พื้นที่ (ม²)',num:1,alt:'volume'},
    {k:'cornice_m',label:'บัวฝ้า (m)',num:1}, {k:'notes',label:'หมายเหตุ'},
  ]},
  // ── งานสุขาภิบาล ──────────────────────────────────────────────
  sanitary_ware: { label:'สุขภัณฑ์', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ชนิด'}, {k:'material',label:'สเปก/วัสดุ'},
    {k:'count',label:'จำนวน (ชุด)',int:1,alt:'qty'}, {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  water_pipes: { label:'ท่อน้ำดี', cols:[
    {k:'code',label:'รหัส'}, {k:'system',label:'ระบบ'}, {k:'material',label:'วัสดุ/ชั้น'},
    {k:'dia',label:'ขนาด Ø'}, {k:'length_m',label:'ยาว (m)',num:1,alt:'volume'}, {k:'basis',label:'ที่มา'},
    {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  drain_pipes: { label:'ท่อน้ำทิ้ง-โสโครก', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ชนิด'}, {k:'material',label:'วัสดุ/ชั้น'},
    {k:'dia',label:'ขนาด Ø'}, {k:'length_m',label:'ยาว (m)',num:1,alt:'volume'}, {k:'basis',label:'ที่มา'},
    {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  sani_tanks: { label:'บ่อ-ถังบำบัด', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ชนิด'}, {k:'size',label:'ขนาด/ความจุ'},
    {k:'count',label:'จำนวน',int:1,alt:'qty'}, {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  // ── งานไฟฟ้า ──────────────────────────────────────────────────
  luminaires: { label:'ดวงโคม', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ชนิดโคม'}, {k:'lamp',label:'หลอด/สเปก'},
    {k:'mount',label:'การติดตั้ง'}, {k:'count',label:'จำนวน (ชุด)',int:1,alt:'qty'},
    {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  outlets_switches: { label:'เต้ารับ-สวิตช์', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ชนิด'}, {k:'rating',label:'พิกัด (A)'},
    {k:'count',label:'จำนวน (จุด)',int:1,alt:'qty'}, {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  wiring: { label:'สายไฟ-ท่อร้อยสาย', cols:[
    {k:'code',label:'รหัส'}, {k:'row_type',label:'ชนิดแถว'}, {k:'circuit',label:'วงจร'},
    {k:'point_type',label:'ชนิดจุด'}, {k:'points',label:'จุด',int:1},
    {k:'conductor',label:'สายไฟ (สเปก)',alt:'wire_ref'}, {k:'size',label:'ขนาด'},
    {k:'conduit',label:'ท่อร้อยสาย',alt:'conduit_ref'},
    {k:'route_m',label:'แนวท่อ (m)',num:1}, {k:'n_cond',label:'เส้น',int:1},
    {k:'conduit_m',label:'ท่อรวม (m)',num:1,derived:1}, {k:'wire_m',label:'สายรวม (m)',num:1,derived:1},
    {k:'basis',label:'ที่มา'}, {k:'notes',label:'หมายเหตุ'},
  ]},
  panels: { label:'ตู้-แผงจ่ายไฟ', cols:[
    {k:'code',label:'รหัส'}, {k:'type',label:'ชนิด'}, {k:'rating',label:'พิกัด'},
    {k:'ways',label:'จำนวนช่อง',int:1}, {k:'count',label:'จำนวน (ตู้)',int:1,alt:'qty'},
    {k:'location',label:'ตำแหน่ง'}, {k:'notes',label:'หมายเหตุ'},
  ]},
};
// หมวด (CAT_COLOR) → sheet ที่เกี่ยวข้อง
const SB_CAT_SHEETS = {
  'ฐานราก': ['footings'], 'เสา': ['columns'], 'คาน': ['beams'],
  'พื้น': ['slabs_cip','slabs_precast'], 'หลังคา': ['roof'],
  'ผนัง': ['walls'], 'ประตู-หน้าต่าง': ['doors','windows'],
  'พื้นผิว': ['floor_finishes'], 'ฝ้าเพดาน': ['ceilings'],
  'สุขภัณฑ์': ['sanitary_ware'], 'ท่อน้ำดี': ['water_pipes'],
  'ท่อน้ำทิ้ง-โสโครก': ['drain_pipes'], 'บ่อ-ถังบำบัด': ['sani_tanks'],
  'ดวงโคม': ['luminaires'], 'เต้ารับ-สวิตช์': ['outlets_switches'],
  'สายไฟ-ท่อร้อยสาย': ['wiring'], 'ตู้-แผงจ่ายไฟ': ['panels'],
};
// คอลัมน์ทั่วไป (สำหรับหมวดที่ไม่มี sheet เฉพาะ เช่น บันได)
const SB_GENERIC_COLS = [
  {k:'code',label:'รหัส'}, {k:'name',label:'รายการ',alt:'notes'},
  {k:'qty',label:'จำนวน',int:1}, {k:'unit',label:'หน่วย'},
];

// ── สูตรเรขาคณิตอัตโนมัติ (mirror excel-export.jsx) — เหล็ก (rebar_kg/weight_kg) แก้มือ ──
const sbR2 = (n) => Math.round((Number(n)||0)*100)/100;
const sbSection = (s) => { const p=String(s||'0.3×0.4').split(/[×x]/); return [Number(p[0])||0, Number(p[1])||0]; };
// พื้นที่ฐานรากตามรูปทรง (ต้องตรงกับ footArea ใน excel-export.jsx)
const sbFootArea = (r) => {
  const B=+r.B||0, L=+r.L||0, B2=+r.B2||0;
  if(+r.area_m2 > 0) return +r.area_m2;
  const s = String(r.shape||'').replace(/\s/g,'');
  if(s.includes('สามเหลี่ยมตัดมุม')||s.includes('คางหมู')) return 0.5*(B+(B2||B*0.5))*L;
  if(s.includes('สามเหลี่ยม')) return 0.5*B*L;
  if(s.includes('วงกลม')||s.includes('กลม')) return Math.PI*(B/2)*(L/2);
  return B*L;
};
const SB_RECOMPUTE = {
  footings:(r)=>{ const B=+r.B||0,L=+r.L||0,T=+r.T||0,n=+(r.count??r.qty)||0,d=+r.depth||0,lt=+r.lean_t||0.05,st=+r.sand_t||0.05;
    const A=sbFootArea(r);
    r.concrete_m3=sbR2(A*T*n); r.formwork_m2=sbR2(2*(B+L)*T*n);
    r.excavation_m3=sbR2((B+1)*(L+1)*d*n); r.lean_m3=sbR2((B+0.1)*(L+0.1)*lt*n); r.sand_m3=sbR2((B+0.1)*(L+0.1)*st*n); },
  columns:(r)=>{ const [B,D]=sbSection(r.section); const h=+r.height||0,n=+(r.count??r.qty)||0;
    r.concrete_per=sbR2(B*D*h); r.concrete_m3=sbR2(B*D*h*n); r.formwork_m2=sbR2(2*(B+D)*h*n); },
  beams:(r)=>{ const [B,D]=sbSection(r.section); const L=+r.length||0,n=+(r.count??r.qty)||0;
    r.concrete_m3=sbR2(B*D*L*n); r.formwork_m2=sbR2((2*D+B)*L*n); },
  slabs_cip:(r)=>{ const B=+r.B||0,L=+r.L||0,T=+r.T||0,n=+(r.count??r.qty)||1;
    r.concrete_m3=sbR2(B*L*T*n); },
  slabs_precast:(r)=>{ const B=+r.B||0,L=+r.L||0,n=+(r.count??r.qty)||1; r.area_m2=sbR2(B*L*n); },
  roof:(r)=>{ const fa=+r.flat_area||+r.volume||0,a=+r.angle_deg||30;
    r.actual_area=sbR2(fa/Math.cos(a*Math.PI/180)); },
  // งานไฟฟ้า — สายป้อน (feeder): ท่อ = route_m, สาย = route_m × จำนวนเส้น (แก้ #3 ท่อ≠สาย); แถว point ไม่คิดความยาว
  wiring:(r)=>{ if((r.row_type||'')==='feeder'){ const rt=+r.route_m||0, nc=+r.n_cond||0;
    r.conduit_m=sbR2(rt); r.wire_m=sbR2(rt*nc); } },
};

function sbCell(row, col){
  if(col.derive){
    const dv = col.derive(row);
    if(col.int){ const n=Number(dv); return isNaN(n)?'-':String(Math.round(n)); }
    const n=Number(dv); return isNaN(n)?'-':fmt(n,2);
  }
  let v = row[col.k];
  if((v===undefined||v===null||v==='') && col.alt) v = row[col.alt];
  if(v===undefined||v===null||v==='') return col.num||col.int ? '0' : '-';
  if(col.int){ const n=Number(v); return isNaN(n)?String(v):String(Math.round(n)); }
  if(col.num){ const n=Number(v); return isNaN(n)?String(v):fmt(n,2); }
  return String(v);
}
// ค่าดิบสำหรับช่องแก้ไข (ไม่ฟอร์แมต ให้พิมพ์ได้ง่าย)
function sbRaw(row, col){
  let v = row[col.k];
  if((v===undefined||v===null||v==='') && col.alt) v = row[col.alt];
  return (v===undefined||v===null) ? '' : v;
}

// สร้างกลุ่มตามหมวด อ่านจาก sheets (editable) + fallback items สำหรับหมวดที่ไม่มี sheet
// แต่ละ row แนบ _sk (sheet key) + _idx (ตำแหน่งใน array จริง) เพื่อใช้แก้ไข
function sbBuildGroups(sheets, items, search){
  sheets = sheets || {};
  items = Array.isArray(items) ? items : [];
  const q = (search||'').toLowerCase();
  const matchRow = (r) => !q ||
    String(r.code||'').toLowerCase().includes(q) ||
    String(r.location||r.name||'').toLowerCase().includes(q);
  const out = [];
  for(const cat of Object.keys(CAT_COLOR)){
    const keys = SB_CAT_SHEETS[cat];
    const blocks = [];
    if(keys){
      for(const sk of keys){
        const def = SB_SHEET_COLS[sk];
        const all = Array.isArray(sheets[sk]) ? sheets[sk] : [];
        const rows = all.map((r,idx)=>({ ...r, _sk:sk, _idx:idx })).filter(matchRow);
        if(rows.length) blocks.push({ key:sk, label: keys.length>1 ? def.label : null, cols:def.cols, rows, editable:true });
      }
    } else {
      // หมวดไม่มี sheet เฉพาะ → ดึงจาก items (อ่านอย่างเดียว)
      const rows = items
        .filter(it => String(it.category||'').includes(cat))
        .map((it,i)=>({ code:it.code||('R'+(i+1)), name:it.name||it.notes, qty:it.qty, unit:it.unit, notes:it.notes }))
        .filter(matchRow);
      if(rows.length) blocks.push({ key:'generic_'+cat, label:null, cols:SB_GENERIC_COLS, rows, editable:false });
    }
    const count = blocks.reduce((a,b)=>a+b.rows.length,0);
    if(count){
      const units = blocks.reduce((a,b)=>a + b.rows.reduce((s,r)=>s + (Number(r.count||r.qty)||0),0), 0);
      const vol = blocks.reduce((a,b)=>a + b.rows.reduce((s,r)=>s + (Number(r.concrete_m3||r.volume||r.area_m2)||0),0), 0);
      out.push({ cat, color:CAT_COLOR[cat], blocks, count, units, vol });
    }
  }
  return out;
}

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

  // ── โหมดตารางตาม sheet (คอลัมน์ตรงกับ Excel + แก้ค่าได้ + สูตรอัตโนมัติ) ──
  // สำเนาแก้ไขได้ของ sheets (clone จาก AI) — เป็น source of truth ของหน้านี้
  const [sheetState,setSheetState] = useState(()=>
    boqData?.sheets ? JSON.parse(JSON.stringify(boqData.sheets)) : null);
  const [dirty,setDirty] = useState(false);

  const sheetGroups = sbBuildGroups(sheetState, boqData?.items, search);
  const useSheets = sheetGroups.length > 0;
  const visSheetGroups = sheetGroups.filter(g => catF==='all' || g.cat===catF);
  const sheetTotalCount = sheetGroups.reduce((a,g)=>a+g.count,0);
  const sheetTotalUnits = sheetGroups.reduce((a,g)=>a+g.units,0);
  const sheetCatCount = (c) => { const g=sheetGroups.find(x=>x.cat===c); return g?g.count:0; };

  // แก้ค่าช่อง input → อัปเดต sheetState + คำนวณสูตรเรขาคณิตใหม่
  const editCell = (sk, idx, col, value) => {
    // เก็บค่าดิบ (string) เพื่อให้พิมพ์ทศนิยมได้ลื่น — สูตร recompute ใช้ Number() แปลงเอง
    setSheetState(prev=>{
      const arr = (prev[sk]||[]).slice();
      const old = arr[idx];
      const row = { ...old, [col.k]: value };
      // แก้ "จำนวน" → scale เหล็กตามสัดส่วน (เหล็กเป็นค่าแก้มือ ไม่อยู่ในสูตรเรขาคณิต)
      // ให้เหมือน reconcile ฝั่ง Edge Function: ปรับ count แล้วปริมาณเหล็กสเกลตาม
      if(col.k==='count' || col.k==='qty'){
        const oldN = Number(old.count ?? old.qty) || 0;
        const newN = Number(value) || 0;
        if(oldN>0 && newN>0 && newN!==oldN){
          const f = newN/oldN;
          ['rebar_kg','weight_kg','rebar_bot_kg','rebar_tie_kg'].forEach(k=>{
            const cur = Number(row[k]);
            if(row[k]!=null && row[k]!=='' && !isNaN(cur)) row[k] = sbR2(cur*f);
          });
        }
      }
      if(SB_RECOMPUTE[sk]) SB_RECOMPUTE[sk](row);
      arr[idx] = row;
      return { ...prev, [sk]: arr };
    });
    setDirty(true);
  };

  // แถวว่างใหม่สำหรับ sheet (เติมคีย์ตาม cols + recompute สูตร)
  const sbBlankRow = (sk) => {
    const row = {};
    (SB_SHEET_COLS[sk]?.cols||[]).forEach(c=>{ row[c.k]=''; });
    row.code=''; row.count=1;
    if(SB_RECOMPUTE[sk]) SB_RECOMPUTE[sk](row);
    return row;
  };
  // เพิ่มแถวว่างท้ายชีต
  const addSheetRow = (sk) => {
    setSheetState(prev=>{ const arr=(prev[sk]||[]).slice(); arr.push(sbBlankRow(sk)); return {...prev,[sk]:arr}; });
    setDirty(true);
  };
  // แตกแถว = คัดลอกแถวนี้แทรกถัดลงไป (ใช้แยกคานหนึ่งรหัสเป็นหลายช่วง แล้วแก้ length/count แต่ละแถว)
  const dupSheetRow = (sk, idx, e) => {
    if(e) e.stopPropagation();
    setSheetState(prev=>{ const arr=(prev[sk]||[]).slice(); const copy=JSON.parse(JSON.stringify(arr[idx]||{})); arr.splice(idx+1,0,copy); return {...prev,[sk]:arr}; });
    setDirty(true);
  };
  // ลบแถว
  const delSheetRow = (sk, idx, e) => {
    if(e) e.stopPropagation();
    setSheetState(prev=>{ const arr=(prev[sk]||[]).slice(); arr.splice(idx,1); return {...prev,[sk]:arr}; });
    setDirty(true);
  };

  // selection สำหรับโหมด sheet (อ้างด้วย code)
  const [selCode,setSelCode] = useState(null);
  const [selCat,setSelCat] = useState(null);
  const selectSheetRow = (cat, code) => {
    setSelCode(code); setSelCat(cat);
    const it = (boqData?.items||[]).find(i => code && String(i.code||'').includes(String(code)));
    if(it?.page_num) setPage(it.page_num);
  };

  const selRow = rows.find(r => r.id === sel);
  // ส่ง highlightCode ไป DrawingPlan เฉพาะ row ที่ไม่มี bbox เดิม (AI/Demo rows)
  // row ที่มี bbox อยู่แล้วจะใช้ระบบ .bbox overlay overlay ตามเดิม
  const svgHighlight = useSheets ? selCode : ((selRow && !selRow.bbox) ? selRow.code : null);
  const svgHighlightCat = useSheets ? selCat : ((selRow && !selRow.bbox) ? selRow.cat : null);

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
            ทั้งหมด<span className="ct">{useSheets ? sheetTotalCount : rows.length}</span>
          </button>
          {cats.map(c=>{
            const n = useSheets ? sheetCatCount(c) : rows.filter(r=>r.cat===c).length;
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
          {!useSheets && <button className="btn btn-soft" onClick={()=>setAddOpen(true)}><Icon name="plus" size={16}/> เพิ่มรายการ</button>}
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
            {useSheets && (
              <div style={{padding:'8px 14px',fontSize:12,color:'var(--ink-3)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',borderBottom:'1px solid var(--border)'}}>
                <Icon name="info" size={13}/>
                <span>คลิกที่ช่องเพื่อแก้ไขได้ · ช่องที่มี <b style={{color:'var(--primary)'}}>ƒ</b> คำนวณอัตโนมัติจากสูตร (คอนกรีต/ไม้แบบ/พื้นที่) · ปุ่มท้ายแถว = แตกแถว/ลบ · ปุ่ม “เพิ่มแถว” ใต้ตาราง (เช่น แยกคานหนึ่งรหัสเป็นหลายช่วง)</span>
                {dirty && <span className="badge b-orange" style={{fontSize:11}}>แก้ไขแล้ว — ค่าจะไหลไป Excel เมื่อยืนยัน</span>}
              </div>
            )}
            {/* ── โหมด sheet: คอลัมน์ตรงกับ Excel ── */}
            {useSheets && visSheetGroups.length===0 &&
              <div className="empty"><div className="eic"><Icon name="search" size={26}/></div><div>ไม่พบรายการที่ตรงกับการค้นหา</div></div>}
            {useSheets && visSheetGroups.map(g=>(
              <div className="acc" key={g.cat}>
                <div className={'acc-head '+(openG[g.cat]?'open':'')} onClick={()=>setOpenG(o=>({...o,[g.cat]:!o[g.cat]}))}>
                  <span className="acc-cat" style={{background:g.color}}></span>
                  <span className="nm">{g.cat}</span>
                  <span className="ct">{g.units} หน่วย · {g.count} รายการ</span>
                  {g.vol>0 && <span className="vol">รวม {fmt(g.vol,2)} ลบ.ม.</span>}
                  <Icon name="chevR" size={16} className="chev"/>
                </div>
                {openG[g.cat] && g.blocks.map(b=>(
                  <div key={b.key}>
                    {b.label && <div style={{padding:'8px 14px 2px',fontSize:12.5,fontWeight:600,color:'var(--ink-3)'}}>{b.label}</div>}
                    <div style={{overflowX:'auto'}}>
                      <table className="qtable">
                        <thead><tr>{b.cols.map(c=><th key={c.k} style={{textAlign:c.num||c.int?'right':'left',whiteSpace:'nowrap'}}>{c.label}{c.derived?<span title="คำนวณอัตโนมัติ" style={{color:'var(--primary)',marginLeft:3}}>ƒ</span>:''}</th>)}{b.editable && <th style={{width:58}}></th>}</tr></thead>
                        <tbody>
                          {b.rows.map((r,ri)=>(
                            <tr key={r.code+'-'+ri} className={'qrow '+(selCode===r.code&&selCat===g.cat?'on':'')}
                              onClick={()=>selectSheetRow(g.cat, r.code)}>
                              {b.cols.map((c,ci)=>{
                                const editable = b.editable && !c.derived;
                                const alignNum = c.num||c.int;
                                return (
                                  <td key={c.k} className={ci===0?'code':''}
                                    style={alignNum?{textAlign:'right',whiteSpace:'nowrap'}:{whiteSpace:c.k==='notes'?'normal':'nowrap'}}>
                                    {editable
                                      ? <input className={'cell-edit'+(alignNum?' num':'')} type={alignNum?'number':'text'}
                                          value={c.steel ? addSteelType(sbRaw(r,c)) : sbRaw(r,c)} onChange={e=>editCell(r._sk,r._idx,c,e.target.value)}
                                          onFocus={()=>selectSheetRow(g.cat, r.code)}/>
                                      : c.derived
                                        ? <span className="cell-derived" title="คำนวณอัตโนมัติจากสูตร">{sbCell(r,c)}</span>
                                        : sbCell(r,c)}
                                  </td>
                                );
                              })}
                              {b.editable && (
                                <td className="row-act" onClick={e=>e.stopPropagation()}>
                                  <button className="ra-btn" title="แตกแถว (คัดลอกแถวนี้ — ใช้แยกคานเป็นหลายช่วง)" onClick={e=>dupSheetRow(r._sk,r._idx,e)}><Icon name="layers" size={14}/></button>
                                  <button className="ra-btn del" title="ลบแถวนี้" onClick={e=>delSheetRow(r._sk,r._idx,e)}><Icon name="trash" size={14}/></button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {b.editable && (
                      <div style={{padding:'4px 14px 12px'}}>
                        <button className="add-row-btn" onClick={()=>addSheetRow(b.key)}>
                          <Icon name="plus" size={13}/> เพิ่มแถว{b.label?' ('+b.label+')':''}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* ── โหมดเดิม (fallback ไม่มี sheets): items ── */}
            {!useSheets && grouped.length===0 && <div className="empty"><div className="eic"><Icon name="search" size={26}/></div><div>ไม่พบรายการที่ตรงกับการค้นหา</div></div>}
            {!useSheets && grouped.map(g=>{
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

          {/* cost breakdown drawer — ค่าใช้จ่าย AI ต่อการถอด 1 ครั้ง */}
          {isReal && boqData?.summary?._cost && (
            <CostDrawer cost={boqData.summary._cost} />
          )}

          {/* sticky confirm bar */}
          <div className="confirm-bar">
            <div className="info"><b>{useSheets ? sheetTotalCount : rows.length}</b> รายการ · จากแบบ <b>{project.drawings}</b> ฉบับ · รวม {useSheets ? sheetTotalUnits : totalRows} หน่วย</div>
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
            <button className="btn btn-primary" onClick={()=>{ setConfirmOpen(false); onConfirm(useSheets ? sheetState : undefined); }}>ยืนยัน {project.pricing?'→ ประเมินราคา':'→ ส่งออก'}</button></>}>
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

// ── ค่าใช้จ่าย AI ต่อการถอด 1 ครั้ง (จาก summary._cost ที่ Edge Function คำนวณจาก token จริง) ──
function CostDrawer({ cost }){
  const [open,setOpen] = useState(false);
  const baht = (n)=> '฿'+(Number(n)||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  const perCat = Array.isArray(cost.per_category) ? cost.per_category : [];
  return (
    <div className="drawer">
      <div className={'drawer-head '+(open?'open':'')} onClick={()=>setOpen(o=>!o)}>
        <Icon name="money" size={15}/>
        <span>ค่าใช้จ่าย AI ครั้งนี้ — {baht(cost.total_thb)} <small style={{color:'var(--ink-4)'}}>(~${(Number(cost.total_usd)||0).toFixed(3)})</small></span>
        <Icon name="chevU" size={15} className="chev"/>
      </div>
      {open && (
        <div className="drawer-body scrollthin" style={{fontSize:13}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px 18px',marginBottom:10,color:'var(--ink-3)'}}>
            <span>input (PDF+prompt): <b className="mono">{(cost.input_tokens||0).toLocaleString()}</b> tok</span>
            <span>output: <b className="mono">{(cost.output_tokens||0).toLocaleString()}</b> tok</span>
            <span>โมเดล: {cost.model}</span>
          </div>
          <div className="logline">
            <span className="tk">🌐</span>
            <span><span className="em">[ต้นทุนกลาง]</span> ค่าอ่าน PDF+prompt {baht(cost.shared_input_thb)} — แชร์ทุกหมวด (ถ้าแยกถอดทีละหมวดจะเสียก้อนนี้ซ้ำทุกครั้ง)</span>
          </div>
          {perCat.map((c,i)=>(
            <div className="logline" key={i}>
              <span className="tk">📊</span>
              <span><span className="em">[{c.category}]</span> {c.rows} รายการ · output ~{baht(c.thb_est)}</span>
            </div>
          ))}
          <div style={{marginTop:8,fontSize:12,color:'var(--ink-4)',lineHeight:1.6}}>
            {cost._note}
          </div>
        </div>
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
