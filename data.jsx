/* ===================== SwiftBill mock data ===================== */

// ---- Status registry (state machine) ----
const STATUS = {
  draft:          { th:'ร่าง',            cls:'b-gray',   prog:8 },
  quoted:         { th:'รอชำระเงิน',      cls:'b-blue',   prog:18 },
  paid:           { th:'ชำระแล้ว',         cls:'b-blue',   prog:28 },
  extracting:     { th:'กำลังถอดปริมาณ',  cls:'b-amber',  prog:42 },
  qc:             { th:'กำลังตรวจสอบ',     cls:'b-amber',  prog:52 },
  qty_review:     { th:'รอตรวจปริมาณ',     cls:'b-purple', prog:64 },
  eng_review:     { th:'วิศวกรกำลังตรวจ',  cls:'b-purple', prog:70 },
  pricing:        { th:'รอตรวจราคา',       cls:'b-orange', prog:82 },
  pricing_review: { th:'ตรวจราคา',         cls:'b-orange', prog:88 },
  completed:      { th:'เสร็จสิ้น',         cls:'b-green',  prog:100 },
  cancelled:      { th:'ยกเลิก',           cls:'b-gray',   prog:0 },
  expired:        { th:'หมดอายุ',          cls:'b-gray',   prog:0 },
};

const BUILDING_TYPE = {
  residential:'บ้านพักอาศัย', commercial:'อาคารพาณิชย์',
  industrial:'โรงงานอุตสาหกรรม', infrastructure:'งานโครงสร้างพื้นฐาน',
};

// ---- Projects ----
const PROJECTS = [
  { id:'p1', name:'อาคารพาณิชย์ 4 ชั้น สีลม', type:'commercial', region:'กทม',
    location:'กรุงเทพฯ', floors:4, area:1850, status:'qty_review', date:'02 เม.ย. 2569',
    drawings:6, pricing:true, tier:'engineer' },
  { id:'p2', name:'โครงการบ้านพักอาศัย 2 ชั้น', type:'residential', region:'ภาคกลาง',
    location:'นนทบุรี', floors:2, area:320, status:'extracting', date:'15 พ.ค. 2569',
    drawings:3, pricing:false, tier:'auto' },
  { id:'p3', name:'คอนโดมิเนียม 12 ชั้น พัทยา', type:'residential', region:'ภาคตะวันออก',
    location:'ชลบุรี', floors:12, area:9400, status:'quoted', date:'20 พ.ค. 2569',
    drawings:11, pricing:true, tier:'engineer' },
  { id:'p4', name:'โรงงานผลิตอาหาร อยุธยา', type:'industrial', region:'ภาคกลาง',
    location:'พระนครศรีอยุธยา', floors:1, area:5200, status:'pricing', date:'08 พ.ค. 2569',
    drawings:8, pricing:true, tier:'auto' },
  { id:'p5', name:'อาคารสำนักงาน 8 ชั้น เชียงใหม่', type:'commercial', region:'ภาคเหนือ',
    location:'เชียงใหม่', floors:8, area:6100, status:'completed', date:'15 มี.ค. 2569',
    drawings:9, pricing:true, tier:'engineer' },
  { id:'p6', name:'วิลล่าริมหาด เกาะสมุย', type:'residential', region:'ภาคใต้',
    location:'สุราษฎร์ธานี', floors:2, area:540, status:'draft', date:'25 พ.ค. 2569',
    drawings:0, pricing:false, tier:'auto' },
];

// ---- Scope work items (Step 5 section A) ----
const SCOPE_ITEMS = [
  { id:'footing', th:'ฐานราก', icon:'▢', cat:'ฐานราก', base:2200, color:'--indigo' },
  { id:'column',  th:'เสา',    icon:'▮', cat:'เสา',    base:2600, color:'--cyan' },
  { id:'beam',    th:'คาน',    icon:'▬', cat:'คาน',    base:3100, color:'--amber' },
  { id:'slab',    th:'พื้น',   icon:'▤', cat:'พื้น',   base:2400, color:'--purple' },
  { id:'stair',   th:'บันได',  icon:'◿', cat:'บันได',  base:1500, color:'--orange' },
  { id:'roof',    th:'หลังคา', icon:'◹', cat:'หลังคา', base:2800, color:'--green' },
];

// ---- Category color map (results accordion / bboxes) ----
const CAT_COLOR = {
  'ฐานราก':'#6366f1', 'เสา':'#0891b2', 'คาน':'#b45309',
  'พื้น':'#9333ea', 'บันได':'#ea580c', 'หลังคา':'#15803d',
};

// ---- Pre-extracted quantities (Step 11) ----
// bbox: percentage coords on the drawing (x,y,w,h)
let QUANTITIES = [
  // ฐานราก
  { id:'q1', cat:'ฐานราก', code:'F1', name:'ฐานรากเข็มเดี่ยว 1.50×1.50 ม.', qty:2, unit:'จุด', vol:2.70, page:3, bbox:{x:18,y:62,w:9,h:11} },
  { id:'q2', cat:'ฐานราก', code:'F1', name:'ฐานรากเข็มเดี่ยว 1.50×1.50 ม.', qty:2, unit:'จุด', vol:2.70, page:3, bbox:{x:62,y:62,w:9,h:11} },
  { id:'q3', cat:'ฐานราก', code:'F2', name:'ฐานรากเข็มกลุ่ม 2.00×2.00 ม.', qty:2, unit:'จุด', vol:4.80, page:3, bbox:{x:18,y:24,w:10,h:12} },
  { id:'q4', cat:'ฐานราก', code:'F2', name:'ฐานรากเข็มกลุ่ม 2.00×2.00 ม.', qty:2, unit:'จุด', vol:4.80, page:3, bbox:{x:61,y:24,w:10,h:12} },
  // เสา
  { id:'q5', cat:'เสา', code:'C1', name:'เสา ค.ส.ล. 0.30×0.40 ม.', qty:4, unit:'ต้น', vol:1.92, page:4, bbox:{x:20,y:26,w:5,h:8} },
  { id:'q6', cat:'เสา', code:'C1', name:'เสา ค.ส.ล. 0.30×0.40 ม.', qty:4, unit:'ต้น', vol:1.92, page:4, bbox:{x:63,y:26,w:5,h:8} },
  { id:'q7', cat:'เสา', code:'C2', name:'เสา ค.ส.ล. 0.40×0.40 ม.', qty:2, unit:'ต้น', vol:1.28, page:4, bbox:{x:41,y:45,w:6,h:9} },
  // คาน
  { id:'q8',  cat:'คาน', code:'B1', name:'คานพื้น GB1 0.20×0.40 ม.', qty:3, unit:'ตัว', vol:1.44, page:5, bbox:{x:24,y:30,w:30,h:5} },
  { id:'q9',  cat:'คาน', code:'B2', name:'คานชั้น 2 B2 0.20×0.45 ม.', qty:3, unit:'ตัว', vol:1.62, page:5, bbox:{x:24,y:52,w:30,h:5} },
  { id:'q10', cat:'คาน', code:'B3', name:'คานหลังคา RB3 0.20×0.35 ม.', qty:2, unit:'ตัว', vol:0.84, page:5, bbox:{x:24,y:72,w:30,h:5} },
  // พื้น
  { id:'q11', cat:'พื้น', code:'S1', name:'พื้นวางบนดิน 0.10 ม.', qty:1, unit:'ผืน', vol:18.50, page:6, bbox:{x:30,y:30,w:38,h:18} },
  { id:'q12', cat:'พื้น', code:'S2', name:'พื้นชั้น 2 Post-tension 0.12 ม.', qty:1, unit:'ผืน', vol:22.20, page:6, bbox:{x:30,y:52,w:38,h:16} },
  { id:'q13', cat:'พื้น', code:'S3', name:'พื้นห้องน้ำ 0.10 ม.', qty:1, unit:'ผืน', vol:3.40, page:6, bbox:{x:30,y:72,w:14,h:10} },
  // บันได
  { id:'q14', cat:'บันได', code:'ST1', name:'บันได ค.ส.ล. 2 ช่วง', qty:1, unit:'ตัว', vol:2.10, page:7, bbox:{x:46,y:40,w:14,h:24} },
  // หลังคา
  { id:'q15', cat:'หลังคา', code:'RF1', name:'โครงหลังคาเหล็ก + เมทัลชีท', qty:1, unit:'หลัง', vol:1.0, page:8, bbox:{x:22,y:20,w:48,h:40} },
];

// audit trail samples
const AUDIT = {
  q1:[ {by:'ระบบ', t:'10:24', act:'ถอดจากแบบ S-03 อัตโนมัติ'},
       {by:'ระบบ', t:'10:24', act:'ตั้งค่า fc′ = 240 ksc (default)'} ],
  q5:[ {by:'ระบบ', t:'10:25', act:'ถอดจากแบบ S-04 อัตโนมัติ'},
       {by:'คุณ', t:'11:02', act:'แก้จำนวน 3 → 4 ต้น'} ],
};

// ---- Assumption log (Step 8 / Step 11 drawer) ----
const ASSUMPTIONS = [
  { tag:'fc′', txt:"ใช้ค่า fc′ = 240 ksc เป็นค่า default (ไม่ระบุในแบบ)" },
  { tag:'ฐานราก', txt:"ฐานราก F2 ใช้ขนาดเดียวกับแบบขยายมาตรฐาน (ขาด detail เฉพาะจุด)" },
  { tag:'เหล็ก', txt:"เหล็กปลอกเสา C1 ใช้ RB9@0.15 ตามหมายเหตุทั่วไป" },
  { tag:'พื้น', txt:"พื้น S2 สมมติเป็นระบบ Post-tension ตามสัญลักษณ์ในแปลน" },
  { tag:'หน่วย', txt:"แปลงหน่วยความยาวคานจาก มม. เป็น ม. อัตโนมัติ" },
  { tag:'cover', txt:"ระยะหุ้มคอนกรีต (covering) ใช้ 2.5 ซม. สำหรับงานในร่ม" },
];

// ---- Price sources (Step 15) ----
const PRICE_SOURCES = [
  { id:'gov',    th:'ราคากลางกรมบัญชีกลาง (Q1/2569)', short:'กรมบัญชีกลาง', cls:'b-blue' },
  { id:'market', th:'ราคาตลาดอ้างอิง (ม.ค. 2569)',    short:'ราคาตลาด',     cls:'b-cyan' },
  { id:'abc',    th:'Vendor: บ.วัสดุก่อสร้าง ABC',     short:'ABC',          cls:'b-purple' },
];

// ---- Material catalog (~30) ----
const CATALOG = [
  { id:'m1',  name:'คอนกรีตผสมเสร็จ', spec:"fc′ 210 ksc", unit:'ลบ.ม.', price:1850 },
  { id:'m2',  name:'คอนกรีตผสมเสร็จ', spec:"fc′ 240 ksc", unit:'ลบ.ม.', price:1980 },
  { id:'m3',  name:'คอนกรีตผสมเสร็จ', spec:"fc′ 280 ksc", unit:'ลบ.ม.', price:2240 },
  { id:'m4',  name:'เหล็กข้ออ้อย SD40', spec:'DB10', unit:'กก.', price:24.5 },
  { id:'m5',  name:'เหล็กข้ออ้อย SD40', spec:'DB12', unit:'กก.', price:24.0 },
  { id:'m6',  name:'เหล็กข้ออ้อย SD40', spec:'DB16', unit:'กก.', price:23.8 },
  { id:'m7',  name:'เหล็กข้ออ้อย SD40', spec:'DB20', unit:'กก.', price:23.6 },
  { id:'m8',  name:'เหล็กข้ออ้อย SD40', spec:'DB25', unit:'กก.', price:23.5 },
  { id:'m9',  name:'เหล็กกลม SR24', spec:'RB6', unit:'กก.', price:25.2 },
  { id:'m10', name:'เหล็กกลม SR24', spec:'RB9', unit:'กก.', price:24.8 },
  { id:'m11', name:'ปูนซีเมนต์ปอร์ตแลนด์', spec:'Type I 50 กก.', unit:'ถุง', price:185 },
  { id:'m12', name:'หินย่อย', spec:'#3/4"', unit:'ลบ.ม.', price:480 },
  { id:'m13', name:'ทรายหยาบ', spec:'งานคอนกรีต', unit:'ลบ.ม.', price:420 },
  { id:'m14', name:'ไม้แบบ', spec:'ไม้อัด 10 มม.', unit:'ตร.ม.', price:135 },
  { id:'m15', name:'เมทัลชีท', spec:'หนา 0.35 มม.', unit:'ตร.ม.', price:265 },
  { id:'m16', name:'เหล็กรูปพรรณ', spec:'C-100×50', unit:'กก.', price:32 },
];

// ---- Pricing review matches (Step 17) ----
let MATCHES = [
  { id:'x1', raw:'คอนกรีต fc=240 เสา/คาน', matId:'m2', price:1980, src:'gov',    conf:96, ovr:null },
  { id:'x2', raw:'คอนกรีต 210 พื้นวางบนดิน', matId:'m1', price:1850, src:'gov',    conf:94, ovr:null },
  { id:'x3', raw:'เหล็ก DB16 เสริมหลัก',     matId:'m6', price:23.8, src:'market', conf:91, ovr:null },
  { id:'x4', raw:'เหล็ก DB12 เสริมคาน',      matId:'m5', price:24.0, src:'market', conf:90, ovr:null },
  { id:'x5', raw:'DB20 เสริมฐานราก',         matId:'m7', price:23.6, src:'gov',    conf:88, ovr:null },
  { id:'x6', raw:'เหล็กปลอก RB9 @15',        matId:'m10',price:24.8, src:'market', conf:82, ovr:null },
  { id:'x7', raw:'ปลอก RB6 บันได',           matId:'m9', price:25.2, src:'gov',    conf:78, ovr:null },
  { id:'x8', raw:'ไม้แบบหล่อคาน-เสา',        matId:'m14',price:135,  src:'abc',    conf:73, ovr:null },
  { id:'x9', raw:'metal sheet 0.35 หลังคา',  matId:'m15',price:265,  src:'abc',    conf:68, ovr:null },
  { id:'x10',raw:'เหล็ก C-100 โครงหลังคา',   matId:'m16',price:32,   src:'abc',    conf:64, ovr:null },
  { id:'x11',raw:'คอนกรีต 280 post-tension', matId:null, price:0,    src:null,     conf:0,  ovr:null },
  { id:'x12',raw:'sand fill ใต้พื้น',         matId:null, price:0,    src:null,     conf:0,  ovr:null },
];

// quantity for each match (for cost rollup)
const MATCH_QTY = { x1:18.6, x2:18.5, x3:2840, x4:1960, x5:1240, x6:880, x7:210, x8:96, x9:142, x10:1280, x11:22.2, x12:6.5 };

// labor categories (Step 18)
const LABOR = [
  { th:'งานฐานราก', amt:42000 }, { th:'งานเสา-คาน', amt:68000 },
  { th:'งานพื้น', amt:54000 }, { th:'งานบันได', amt:12000 },
  { th:'งานหลังคา', amt:38000 }, { th:'งานเบ็ดเตล็ด', amt:18000 },
];

// pricing percentages
const PCT = { overhead:7, profit:10, vat:7 };

// ---- User pricing templates ----
const TEMPLATES = [
  { id:'t1', name:'ราคา รับเหมา ABC ปี 2569', items:16, def:true,  updated:'12 พ.ค. 2569' },
  { id:'t2', name:'ราคา ผู้ค้าภาคเหนือ',      items:14, def:false, updated:'28 เม.ย. 2569' },
];

// ---- ตัวอย่างโปรเจกต์ที่เสร็จสิ้นแล้ว (Demo / แนวทางอ้างอิง) ----
// โปรเจกต์นี้ฝังไว้ฝั่ง client เป็น "ตัวอย่างสำเร็จรูป" ให้ผู้ใช้เปิดดูแนวทางการถอดปริมาณได้
// __demo:true → จะไม่ยิงไปอัปเดต/ลบใน Supabase
const DEMO_PROJECT = {
  id:'demo-1',
  name:'ตัวอย่าง · บ้านพักอาศัย 2 ชั้น (โครงการสาธิต)',
  type:'residential', region:'ภาคกลาง', location:'นนทบุรี',
  floors:2, area:285, status:'completed', date:'10 พ.ค. 2569',
  drawings:8, pricing:false, tier:'engineer', __demo:true,
};

// ผลถอดปริมาณตัวอย่าง — โครงสร้างเดียวกับที่ Edge Function ส่งกลับ (items[] + sheets{})
const DEMO_BOQ = {
  summary: {
    total_items: 16,
    drawing_sheets: 8,
    building_type: 'บ้านพักอาศัย ค.ส.ล. 2 ชั้น',
    floors: 2,
    key_findings: 'ถอดปริมาณจากแบบโครงสร้าง 8 แผ่น (S-01 ถึง S-08) ครอบคลุมฐานราก เสา คาน พื้น บันได และหลังคา · ใช้ค่า fc′=240 ksc ตามหมายเหตุทั่วไป · เหล็กเสริม SD40 (DB) และ SR24 (RB) · ยังไม่รวมค่าเผื่อ (เหล็ก +7%, คอนกรีต +5%, ไม้แบบ +10%) และยังไม่จับคู่ราคา',
  },
  items: [
    // ── ฐานราก ──
    { category:'ฐานราก', code:'F1-CON', name:'คอนกรีตฐานราก F1 1.50×1.50×0.50 ม. fc′=240', qty:4, unit:'จุด', volume:4.50, page_num:3, notes:'1.50×1.50×0.50 × 4 จุด = 4.50 ลบ.ม. (ยังไม่รวมค่าเผื่อ)' },
    { category:'ฐานราก', code:'F1-RB',  name:'เหล็กเสริมฐานราก F1 DB12', qty:4, unit:'จุด', volume:0, page_num:3, notes:'DB12 W=12²/162=0.888 กก./ม. · ตะแกรง 8×8 เส้น + ทาบ 40D · รวม ≈ 96 กก.' },
    { category:'ฐานราก', code:'F2-CON', name:'คอนกรีตฐานราก F2 2.00×2.00×0.60 ม. fc′=240', qty:2, unit:'จุด', volume:4.80, page_num:3, notes:'2.00×2.00×0.60 × 2 จุด = 4.80 ลบ.ม.' },

    // ── เสา ──
    { category:'เสา', code:'C1-CON', name:'คอนกรีตเสา C1 0.30×0.40 ม. สูง 3.20 ม. fc′=240', qty:8, unit:'ต้น', volume:3.07, page_num:4, notes:'0.30×0.40×3.20 × 8 ต้น = 3.07 ลบ.ม.' },
    { category:'เสา', code:'C1-RB',  name:'เหล็กยืนเสา C1 4-DB16 + ปลอก RB9@0.15', qty:8, unit:'ต้น', volume:0, page_num:4, notes:'DB16 W=1.578 กก./ม. · 4 เส้น × (3.20+ทาบ40D) × 8 ต้น ≈ 168 กก. + ปลอก' },
    { category:'เสา', code:'C2-CON', name:'คอนกรีตเสา C2 0.40×0.40 ม. สูง 3.20 ม. fc′=240', qty:4, unit:'ต้น', volume:2.05, page_num:4, notes:'0.40×0.40×3.20 × 4 ต้น = 2.05 ลบ.ม.' },

    // ── คาน ──
    { category:'คาน', code:'GB1-CON', name:'คอนกรีตคานคอดิน GB1 0.20×0.40 ม.', qty:6, unit:'ตัว', volume:2.64, page_num:5, notes:'0.20×0.40×5.50 × 6 ตัว = 2.64 ลบ.ม.' },
    { category:'คาน', code:'B2-CON',  name:'คอนกรีตคานชั้น 2 B2 0.20×0.45 ม.', qty:6, unit:'ตัว', volume:2.97, page_num:5, notes:'0.20×0.45×5.50 × 6 ตัว = 2.97 ลบ.ม.' },
    { category:'คาน', code:'B2-RB',   name:'เหล็กเสริมคาน B2 บน 2-DB16 ล่าง 3-DB16', qty:6, unit:'ตัว', volume:0, page_num:5, notes:'DB16 W=1.578 · 5 เส้น × (5.50+ทาบ40D+งอ12D) × 6 ตัว ≈ 285 กก.' },
    { category:'คาน', code:'RB3-CON', name:'คอนกรีตคานหลังคา RB3 0.20×0.35 ม.', qty:4, unit:'ตัว', volume:1.40, page_num:5, notes:'0.20×0.35×5.00 × 4 ตัว = 1.40 ลบ.ม.' },

    // ── พื้น ──
    { category:'พื้น', code:'S1-CON', name:'พื้นวางบนดิน S1 หนา 0.10 ม. fc′=240', qty:1, unit:'ผืน', volume:8.50, page_num:6, notes:'85 ตร.ม. × 0.10 = 8.50 ลบ.ม. · เสริม WireMesh 4 มม.@0.20' },
    { category:'พื้น', code:'S2-CON', name:'พื้นชั้น 2 S2 หนา 0.12 ม. fc′=240', qty:1, unit:'ผืน', volume:9.60, page_num:6, notes:'80 ตร.ม. × 0.12 = 9.60 ลบ.ม. · เสริม DB10@0.20 สองทาง' },

    // ── บันได ──
    { category:'บันได', code:'ST1-CON', name:'บันได ค.ส.ล. 2 ช่วง 17 ลูกตั้ง', qty:1, unit:'ตัว', volume:2.10, page_num:7, notes:'แม่บันได+ลูกขั้น ≈ 2.10 ลบ.ม. · fc′=240' },

    // ── หลังคา ──
    { category:'หลังคา', code:'RF1', name:'โครงหลังคาเหล็ก C-100×50 + เมทัลชีท 0.35 มม.', qty:1, unit:'หลัง', volume:0, page_num:8, notes:'พื้นที่ลาดเอียง 98.1 ตร.ม. (ระนาบ 85 ตร.ม. × cos30°) · เหล็กรูปพรรณ ≈ 850 กก.' },
    { category:'หลังคา', code:'RF1-MS', name:'แผ่นเมทัลชีทมุงหลังคา', qty:98, unit:'ตร.ม.', volume:0, page_num:8, notes:'พื้นที่จริงตามความลาด 98.1 ตร.ม.' },
  ],
  sheets: {
    footings: [
      { code:'F1', type:'เดี่ยว', B:1.5, L:1.5, T:0.5, count:4, depth:1.2, lean_t:0.05, fc:240, rebar_x:'8Ø12mm', rebar_y:'8Ø12mm', ties:'-', piles:1, notes:'', concrete_m3:4.5, formwork_m2:12.0, rebar_kg:96.0, lean_m3:0.45, excavation_m3:43.2 },
      { code:'F2', type:'เดี่ยว', B:2.0, L:2.0, T:0.6, count:2, depth:1.2, lean_t:0.05, fc:240, rebar_x:'10Ø16mm', rebar_y:'10Ø16mm', ties:'-', piles:4, notes:'ฐานเข็มกลุ่ม', concrete_m3:4.8, formwork_m2:9.6, rebar_kg:128.0, lean_m3:0.4, excavation_m3:38.4 },
    ],
    columns: [
      { code:'C1', section:'0.30×0.40', height:3.2, count:8, fc:240, rebar_main:'4Ø16mm', ties:'Ø9@0.15m', concrete_m3:3.07, formwork_m2:35.84, rebar_kg:168.0 },
      { code:'C2', section:'0.40×0.40', height:3.2, count:4, fc:240, rebar_main:'8Ø16mm', ties:'Ø9@0.15m', concrete_m3:2.05, formwork_m2:20.48, rebar_kg:172.0 },
    ],
    beams: [
      { code:'GB1', section:'0.20×0.40', length:5.5, count:6, rebar_top:'2Ø16mm', rebar_bot:'2Ø16mm', ties:'Ø9@0.15m', concrete_m3:2.64, formwork_m2:33.0, rebar_kg:198.0, notes:'คานคอดิน' },
      { code:'B2',  section:'0.20×0.45', length:5.5, count:6, rebar_top:'2Ø16mm', rebar_bot:'3Ø16mm', ties:'Ø9@0.10-0.15m', concrete_m3:2.97, formwork_m2:36.3, rebar_kg:285.0, notes:'คานชั้น 2' },
      { code:'RB3', section:'0.20×0.35', length:5.0, count:4, rebar_top:'2Ø12mm', rebar_bot:'2Ø12mm', ties:'Ø6@0.20m', concrete_m3:1.40, formwork_m2:18.0, rebar_kg:88.0, notes:'คานหลังคา' },
    ],
    slabs_cip: [
      { code:'S1', location:'พื้นวางบนดิน', B:8.5, L:10.0, T:0.10, count:1, rebar:'WireMesh 4mm@0.20', concrete_m3:8.50, notes:'85 ตร.ม.' },
      { code:'S2', location:'พื้นชั้น 2', B:8.0, L:10.0, T:0.12, count:1, rebar:'DB10@0.20 สองทาง', concrete_m3:9.60, notes:'80 ตร.ม.' },
    ],
    slabs_precast: [],
    roof: [
      { code:'RF1', location:'หลังคาจั่วหลัก', flat_area:85.0, angle_deg:30, actual_area:98.1, rafter_m:120.0, purlin_m:240.0, sag_rod:18, weight_kg:850.0, notes:'C-100×50 + เมทัลชีท 0.35 มม.' },
    ],
  },
};

// ---- helpers ----
const fmt = (n, dec=0) => Number(n).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const baht = (n, dec=0) => '฿' + fmt(n, dec);
const matById = id => CATALOG.find(m=>m.id===id);
const srcById = id => PRICE_SOURCES.find(s=>s.id===id);
const confBand = c => c>=90 ? 'g' : c>=70 ? 'y' : 'r';
const confLabel = c => c>=90 ? 'ตรงดี' : c>=70 ? 'ควรตรวจ' : 'ต้องจับคู่เอง';

Object.assign(window, {
  STATUS, BUILDING_TYPE, PROJECTS, SCOPE_ITEMS, CAT_COLOR, QUANTITIES, AUDIT,
  ASSUMPTIONS, PRICE_SOURCES, CATALOG, MATCHES, MATCH_QTY, LABOR, PCT, TEMPLATES,
  DEMO_PROJECT, DEMO_BOQ,
  fmt, baht, matById, srcById, confBand, confLabel,
});
