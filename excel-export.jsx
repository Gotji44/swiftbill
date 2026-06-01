/* ===================== Excel BOQ Export (xlsx-js-style) =====================
   สร้าง .xlsx ตาม template-schema.md — มีสี / เส้นขอบ / หัวตารางเด่น
   ใช้ xlsx-js-style (fork ของ SheetJS) เพื่อใส่สไตล์เซลล์ได้
   ทุกค่า hardcoded (ไม่มีสูตรในเซลล์) ตามมาตรฐาน template
================================================================== */

function generateBOQExcel(project, boqData) {
  const X = window.XLSX;
  if (!X) { alert('ไลบรารี Excel ยังโหลดไม่เสร็จ'); return; }

  const wb = X.utils.book_new();
  const items = boqData?.items || [];
  const sh    = boqData?.sheets || {};   // structured data from Claude

  // ── helpers ──────────────────────────────────────────────────
  const n2 = v => Math.round((Number(v)||0)*100)/100;
  const today = new Date().toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'});

  // ── Palette & cell styles ───────────────────────────────────
  const thin = c => ({ style:'thin', color:{ rgb:c } });
  const BORDER = c => ({ top:thin(c), bottom:thin(c), left:thin(c), right:thin(c) });
  const STYLE = {
    title:   { font:{bold:true,sz:14,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'1F4E79'}}, alignment:{horizontal:'left',vertical:'center',indent:1} },
    sub:     { font:{bold:true,sz:11,color:{rgb:'1F4E79'}}, fill:{fgColor:{rgb:'DDEBF7'}}, alignment:{horizontal:'left',vertical:'center',indent:1} },
    head:    { font:{bold:true,sz:10,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'2E75B6'}}, alignment:{horizontal:'center',vertical:'center',wrapText:true}, border:BORDER('9DC3E6') },
    cell:    { font:{sz:10,color:{rgb:'1A2A3A'}}, alignment:{vertical:'center'}, border:BORDER('BDD7EE') },
    cellAlt: { font:{sz:10,color:{rgb:'1A2A3A'}}, fill:{fgColor:{rgb:'F2F8FD'}}, alignment:{vertical:'center'}, border:BORDER('BDD7EE') },
    total:   { font:{bold:true,sz:10,color:{rgb:'7A5C00'}}, fill:{fgColor:{rgb:'FFE699'}}, alignment:{vertical:'center'}, border:BORDER('BF9000') },
    kvLabel: { font:{bold:true,sz:10,color:{rgb:'334155'}}, alignment:{vertical:'center'} },
    kvVal:   { font:{sz:10,color:{rgb:'1A2A3A'}}, alignment:{vertical:'center',wrapText:true} },
    note:    { font:{italic:true,sz:9,color:{rgb:'94A3B8'}}, alignment:{vertical:'center'} },
  };
  const RIGHT = { alignment:{horizontal:'right',vertical:'center'} };
  const numFmt = v => Number.isInteger(v) ? '#,##0' : '#,##0.00';

  // ── Row builders (role-tagged) ──────────────────────────────
  const T  = (...c) => ({ r:'title', c });
  const SB = (...c) => ({ r:'sub',   c });
  const H  = (c)    => ({ r:'head',  c });
  const D  = (c)    => ({ r:'data',  c });
  const TT = (c)    => ({ r:'total', c });
  const KV = (k,v)  => ({ r:'kv',    c:[k,v] });
  const NOTE = (...c) => ({ r:'note', c });
  const BL = () => ({ r:'blank', c:[] });

  // ── core: build worksheet + apply styles ────────────────────
  function setStyle(ws, r, c, style, z) {
    const addr = X.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { t:'s', v:'' };
    ws[addr].s = style;
    if (z) ws[addr].z = z;
  }
  function ensureRow(ws, r, ncol) {
    for (let c = 0; c < ncol; c++) {
      const addr = X.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t:'s', v:'' };
    }
    const range = X.utils.decode_range(ws['!ref']);
    if (r > range.e.r) range.e.r = r;
    if (ncol - 1 > range.e.c) range.e.c = ncol - 1;
    ws['!ref'] = X.utils.encode_range(range);
  }

  function buildAndStyle(wb, name, rows, colWidths) {
    const ncol = colWidths.length;
    const aoa  = rows.map(row => row.r === 'blank' ? [] : row.c);
    const ws   = X.utils.aoa_to_sheet(aoa);
    ws['!cols'] = colWidths.map(w => ({ wch:w }));

    const merges = [];
    const rowHeights = [];
    let zebra = 0;

    rows.forEach((row, ri) => {
      const role = row.r;
      if (role === 'head') zebra = 0;

      if (role === 'blank') { rowHeights[ri] = { hpt:6 }; return; }

      if (role === 'title') {
        merges.push({ s:{r:ri,c:0}, e:{r:ri,c:ncol-1} });
        rowHeights[ri] = { hpt:26 };
        ensureRow(ws, ri, ncol);
        for (let c=0;c<ncol;c++) setStyle(ws, ri, c, STYLE.title);
      }
      else if (role === 'sub') {
        merges.push({ s:{r:ri,c:0}, e:{r:ri,c:ncol-1} });
        rowHeights[ri] = { hpt:18 };
        ensureRow(ws, ri, ncol);
        for (let c=0;c<ncol;c++) setStyle(ws, ri, c, STYLE.sub);
      }
      else if (role === 'head') {
        rowHeights[ri] = { hpt:30 };
        ensureRow(ws, ri, ncol);
        for (let c=0;c<ncol;c++) setStyle(ws, ri, c, STYLE.head);
      }
      else if (role === 'data') {
        const base = (zebra % 2 === 1) ? STYLE.cellAlt : STYLE.cell;
        zebra++;
        ensureRow(ws, ri, ncol);
        for (let c=0;c<ncol;c++) {
          const v = row.c[c];
          if (typeof v === 'number') setStyle(ws, ri, c, {...base, ...RIGHT}, numFmt(v));
          else setStyle(ws, ri, c, base);
        }
      }
      else if (role === 'total') {
        rowHeights[ri] = { hpt:20 };
        ensureRow(ws, ri, ncol);
        for (let c=0;c<ncol;c++) {
          const v = row.c[c];
          if (typeof v === 'number') setStyle(ws, ri, c, {...STYLE.total, ...RIGHT}, numFmt(v));
          else setStyle(ws, ri, c, STYLE.total);
        }
      }
      else if (role === 'kv') {
        setStyle(ws, ri, 0, STYLE.kvLabel);
        setStyle(ws, ri, 1, STYLE.kvVal);
      }
      else if (role === 'note') {
        merges.push({ s:{r:ri,c:0}, e:{r:ri,c:ncol-1} });
        ensureRow(ws, ri, ncol);
        for (let c=0;c<ncol;c++) setStyle(ws, ri, c, STYLE.note);
      }
    });

    if (merges.length) ws['!merges'] = (ws['!merges']||[]).concat(merges);
    ws['!rows'] = rowHeights;
    X.utils.book_append_sheet(wb, ws, name);
    return ws;
  }

  // ── Sheet 01: ข้อมูลโครงการ ───────────────────────────────────
  buildAndStyle(wb, '01_ข้อมูลโครงการ', [
    T('ใบถอดปริมาณงานก่อสร้าง (BOQ)'),
    SB('สร้างโดย SwiftBill + Claude AI'),
    BL(),
    SB('ข้อมูลทั่วไป'),
    KV('ชื่อโครงการ',      project.name || '-'),
    KV('ที่ตั้งโครงการ',   project.location || '-'),
    KV('เจ้าของโครงการ',   '-'),
    KV('ผู้ออกแบบ',        '-'),
    KV('ผู้ควบคุมงาน',     '-'),
    KV('ผู้รับเหมา',       '-'),
    KV('วันที่เริ่มต้น',   '-'),
    KV('วันที่แล้วเสร็จ',  '-'),
    KV('ระยะเวลาก่อสร้าง', '-'),
    KV('เลขที่สัญญา',      '-'),
    BL(),
    SB('ข้อมูลอาคาร'),
    KV('ประเภทอาคาร',  boqData?.summary?.building_type || project.type || '-'),
    KV('จำนวนชั้น',    boqData?.summary?.floors || project.floors || '-'),
    KV('พื้นที่ใช้สอย', (project.area || '-') + (project.area ? ' ตร.ม.' : '')),
    BL(),
    SB('สรุปผลการวิเคราะห์'),
    KV('ผลการวิเคราะห์', boqData?.summary?.key_findings || '-'),
    BL(),
    KV('วันที่สร้างเอกสาร', today),
  ], [24, 52]);

  // ── Sheet 05: ฐานราก ─────────────────────────────────────────
  const footingRows = sh.footings || itemsToSheetRows(items, 'ฐานราก');
  const f_header1 = ['รหัส','ประเภท','B (m)','L (m)','T (m)','จำนวน','ลึกขุด (m)','หนา Lean','fc\'','เหล็กล่าง X','เหล็กล่าง Y','ปลอก/รัด','เสาเข็ม/ฐาน','หมายเหตุ'];
  const f_header2 = ['รหัส','พื้นที่ฐาน (ม²)','คสล./ฐาน (ม³)','คสล.รวม (ม³)','Lean (ม³)','ขุดดิน (ม³)','ทรายอัดแน่น (ม³)','ไม้แบบ (ม²)','เหล็กล่าง (kg)','เหล็กรัด (kg)','เหล็กรวม (kg)'];
  const f_data1 = footingRows.map(r => [
    r.code||'-', r.type||'เดี่ยว', r.B||'-', r.L||'-', r.T||'-',
    r.count||r.qty||0, r.depth||'-', r.lean_t||0.05, r.fc||240,
    r.rebar_x||r.rebar||'-', r.rebar_y||'-', r.ties||'-', r.piles||1, r.notes||''
  ]);
  const f_sums = calcFootingSummary(footingRows);
  const f_data2 = f_sums.map(r => [
    r.code, r.area_m2, r.concrete_per, r.concrete_m3, r.lean_m3,
    r.excavation_m3, r.sand_m3, r.formwork_m2, r.rebar_bot_kg, r.rebar_tie_kg, r.rebar_kg
  ]);
  const f_total = sumRow(f_data2, [1,2,3,4,5,6,7,8,9,10]);
  buildAndStyle(wb, '05_ฐานราก', [
    T('Sheet 05 — ฐานราก'),
    BL(),
    H(f_header1), ...f_data1.map(D),
    BL(),
    SB('สรุปปริมาณ (Summary)'),
    H(f_header2), ...f_data2.map(D),
    TT(['รวม','','',...f_total.slice(2)]),
  ], [8,10,6,6,6,7,8,8,7,14,14,12,10,20]);

  // ── Sheet 03: เสา ────────────────────────────────────────────
  const colRows = sh.columns || itemsToSheetRows(items, 'เสา');
  const c_header = ['รหัส','หน้าตัด B×D (m)','สูง (m)','จำนวน','fc\'','เหล็กยืน','ปลอก','ปริมาตร/ตัว (ม³)','ปริมาตรรวม (ม³)','ไม้แบบรวม (ม²)','น.น.เหล็กรวม (kg)'];
  const c_data = colRows.map(r => [
    r.code||'-', r.section||'-', n2(r.height)||'-', r.count||r.qty||0,
    r.fc||240, r.rebar_main||r.rebar||'-', r.ties||'-',
    n2(r.concrete_per || calcColVol(r)),
    n2(r.concrete_m3  || calcColVol(r)*(r.count||1)),
    n2(r.formwork_m2  || calcColForm(r)),
    n2(r.rebar_kg     || 0)
  ]);
  const c_total = sumRow(c_data, [7,8,9,10]);
  buildAndStyle(wb, '03_เสา', [
    T('Sheet 03 — เสา'),
    BL(),
    H(c_header), ...c_data.map(D),
    TT(['รวม','','','','','','','',...c_total.slice(7)]),
  ], [8,14,6,7,6,14,14,10,10,10,12]);

  // ── Sheet 04: คาน ────────────────────────────────────────────
  const beamRows = sh.beams || itemsToSheetRows(items, 'คาน');
  const b_header = ['รหัส','หน้าตัด B×D (m)','ยาว (m)','จำนวน','เหล็กบน','เหล็กล่าง','ปลอก','ปริมาตรรวม (ม³)','ไม้แบบรวม (ม²)','น.น.เหล็กรวม (kg)','หมายเหตุ'];
  const b_data = beamRows.map(r => [
    r.code||'-', r.section||'-', n2(r.length)||'-', r.count||r.qty||0,
    r.rebar_top||r.rebar||'-', r.rebar_bot||'-', r.ties||'-',
    n2(r.concrete_m3||r.volume||0),
    n2(r.formwork_m2||0),
    n2(r.rebar_kg||0),
    r.notes||''
  ]);
  const b_total = sumRow(b_data, [7,8,9]);
  buildAndStyle(wb, '04_คาน', [
    T('Sheet 04 — คาน'),
    BL(),
    H(b_header), ...b_data.map(D),
    TT(['รวม','','','','','','',b_total[7],b_total[8],b_total[9],'']),
  ], [8,14,6,7,14,14,16,10,10,12,20]);

  // ── Sheet 07: หลังคา ─────────────────────────────────────────
  const roofRows = sh.roof || itemsToSheetRows(items, 'หลังคา');
  const r_header = ['รหัส','ตำแหน่ง/อาคาร','พื้นที่ฉายราบ (ม²)','มุมลาด (°)','พื้นที่จริง (ม²)','จันทันเหล็ก (m)','แปเหล็ก (m)','Sag Rod (เส้น)','น.น.โครง (kg)','ฉนวน (ม²)','หมายเหตุ'];
  const r_data = roofRows.map(r => {
    const angle = r.angle_deg || 30;
    const actualArea = r.actual_area || n2((r.flat_area||r.volume||0) / Math.cos(angle*Math.PI/180));
    return [
      r.code||'-', r.location||r.name||'-',
      n2(r.flat_area||r.volume||0), angle, n2(actualArea),
      n2(r.rafter_m||0), n2(r.purlin_m||0), r.sag_rod||0,
      n2(r.weight_kg||r.rebar_kg||0), n2(actualArea), r.notes||''
    ];
  });
  const r_total = sumRow(r_data, [2,4,5,6,7,8,9]);
  // member breakdown (อกไก่/อะเส/จันทัน/ขื่อ/แป)
  const memberRows = sh.roof_members || [];
  const rm_header = ['ชนิดสมาชิก','หน้าตัด','น.น./ม. (กก./ม.)','ยาวต่อท่อน (m)','จำนวน (ท่อน/แนว)','ความยาวรวม (m)','น้ำหนักรวม (kg)','หมายเหตุ'];
  const rm_data = memberRows.map(m => {
    const uw = Number(m.unit_weight)||0;
    const totLen = Number(m.total_length_m) || (Number(m.length_each_m||0) * Number(m.count||0));
    const totWt = Number(m.total_weight_kg) || (totLen * uw);
    return [
      m.type||'-', m.section||'-', n2(uw),
      n2(m.length_each_m||0), m.count||0,
      n2(totLen), n2(totWt), m.notes||''
    ];
  });
  const rm_total = sumRow(rm_data, [5,6]);
  const roofLayout = [
    T('Sheet 07 — หลังคา (โครงเหล็กรูปพรรณ)'),
    BL(),
    H(r_header), ...r_data.map(D),
    TT(['รวม','',r_total[2],'',r_total[4],r_total[5],r_total[6],r_total[7],r_total[8],r_total[9],'']),
  ];
  if (rm_data.length > 0) {
    roofLayout.push(
      BL(),
      T('รายละเอียดสมาชิกโครงหลังคา (คำนวณความยาวจริงตามแบบ)'),
      H(rm_header), ...rm_data.map(D),
      TT(['รวม','','','','',n2(rm_total[5]),n2(rm_total[6]),''])
    );
  }
  buildAndStyle(wb, '07_หลังคา', roofLayout, [8,20,12,8,12,12,12,10,12,12,20]);

  // ── Sheet 08: พื้นสำเร็จ ─────────────────────────────────────
  const precastRows = sh.slabs_precast || itemsToSheetRows(items, 'พื้น', 'สำเร็จ');
  const sp_header = ['รหัส','ตำแหน่ง','ตำแหน่ง (กริด)','B (m)','L (m)','จำนวนช่อง','หนาแผ่น (m)','หนา Topping (m)','เหล็กเสริม Topping','fc\' Topping','น้ำหนักบรรทุก (กก./ม²)','พื้นที่รวม (ม²)','หมายเหตุ'];
  const sp_data = precastRows.map(r => [
    r.code||'-', r.location||r.name||'-', r.grid||r.gridline||'-',
    n2(r.B||0), n2(r.L||0), r.count||r.qty||1,
    r.plank_t||0.05, r.topping_t||0.05,
    r.topping_rebar||r.wiremesh||'-', r.fc||210, r.load_kg_m2||'-',
    n2(r.area_m2||r.volume||0), r.notes||''
  ]);
  const sp_totalArea = sp_data.reduce((s,r)=>s+(Number(r[11])||0),0);
  const sp_toppingT = (precastRows[0] && precastRows[0].topping_t) || 0.05;
  buildAndStyle(wb, '08_พื้นสำเร็จ', [
    T('Sheet 08 — พื้นสำเร็จรูป (Solid Plank)'),
    BL(),
    H(sp_header), ...sp_data.map(D),
    TT(['รวม','','','','','','','','','','',n2(sp_totalArea),'']),
    BL(),
    KV('คอนกรีตทับหน้า (Topping) หนา '+n2(sp_toppingT)+' ม.', n2(sp_totalArea*sp_toppingT)+' ม³'),
    KV('เหล็กเสริม Topping (ดูคอลัมน์ในตาราง)', n2(sp_totalArea)+' ม²'),
  ], [8,16,12,6,6,9,9,11,16,9,14,12,18]);

  // ── Sheet 09: พื้นหล่อในที่ ───────────────────────────────────
  const cipRows = sh.slabs_cip || itemsToSheetRows(items, 'พื้น', 'หล่อ');
  const sc_header = ['รหัส','ตำแหน่ง','ตำแหน่ง (กริด)','B (m)','L (m)','T (m)','จำนวน','เหล็กเสริมขนานด้านสั้น','เหล็กเสริมขนานด้านยาว','ปริมาตรรวม (ม³)','หมายเหตุ'];
  const sc_data = cipRows.map(r => [
    r.code||'-', r.location||r.name||'-', r.grid||r.gridline||'-',
    n2(r.B||0), n2(r.L||0), n2(r.T||0), r.count||r.qty||1,
    r.rebar_short||r.rebar||'-', r.rebar_long||r.rebar||'-',
    n2(r.concrete_m3||r.volume||0), r.notes||''
  ]);
  const sc_total = sc_data.reduce((s,r)=>s+(Number(r[9])||0),0);
  buildAndStyle(wb, '09_พื้นหล่อในที่', [
    T('Sheet 09 — พื้นหล่อในที่ (CIP)'),
    BL(),
    H(sc_header), ...sc_data.map(D),
    TT(['รวม','','','','','','','','',n2(sc_total),'']),
  ], [8,18,12,6,6,6,7,16,16,12,18]);

  // ── Sheet 11: สรุปรวม ─────────────────────────────────────────
  const totals = calcTotals(footingRows, colRows, beamRows, roofRows, precastRows, cipRows, items);
  const s_header = ['หมวด','รายการ','ปริมาณ','หน่วย','หมายเหตุ'];
  buildAndStyle(wb, '11_สรุปรวม', [
    T('Sheet 11 — สรุปรวมปริมาณงาน'),
    BL(),
    H(s_header),
    D(['1. งานดิน','ขุดดินฐานราก',                    n2(totals.excavation),'ม³','']),
    D(['','ทรายอัดแน่นใต้ Lean',                       n2(totals.sand),      'ม³','']),
    D(['2. คอนกรีตหยาบ','Lean Concrete 1:3:5',         n2(totals.lean),      'ม³','']),
    D(['3. คอนกรีตโครงสร้าง','ฐานราก',               n2(totals.c_footing), 'ม³','']),
    D(['','เสา',                                        n2(totals.c_column),  'ม³','']),
    D(['','คาน',                                        n2(totals.c_beam),    'ม³','']),
    D(['','พื้นหล่อในที่',                              n2(totals.c_slab_cip),'ม³','']),
    D(['','Topping พื้นสำเร็จ',                        n2(sp_totalArea*0.05),'ม³','หนา 5 ซม.']),
    TT(['','รวมคอนกรีตทั้งหมด',                         n2(totals.c_total),   'ม³','']),
    D(['4. เหล็กเสริม','ฐานราก',                      n2(totals.r_footing), 'kg','']),
    D(['','เสา',                                        n2(totals.r_column),  'kg','รวม lap/hook แล้ว']),
    D(['','คาน',                                        n2(totals.r_beam),    'kg','รวม lap/hook แล้ว']),
    TT(['','รวมเหล็กเสริม',                             n2(totals.r_total),   'kg','']),
    D(['5. พื้น','พื้นสำเร็จรูป (Solid Plank)',        n2(sp_totalArea),     'ม²','']),
    D(['','พื้นหล่อในที่',                              n2(totals.c_slab_cip/0.12||0),'ม²','ประมาณการ']),
    D(['','Wire Mesh #4@0.20',                          n2(sp_totalArea),     'ม²','']),
    D(['6. ไม้แบบ','ฐานราก',                          n2(totals.f_footing), 'ม²','']),
    D(['','เสา',                                        n2(totals.f_column),  'ม²','']),
    D(['','คาน',                                        n2(totals.f_beam),    'ม²','']),
    TT(['','รวมไม้แบบทั้งหมด',                          n2(totals.f_total),   'ม²','']),
    D(['7. หลังคา','พื้นที่ฉายราบ',                   n2(r_total[2]||0),    'ม²','']),
    D(['','พื้นที่จริง',                               n2(r_total[4]||0),    'ม²','']),
    D(['','น้ำหนักโครงเหล็ก',                         n2(r_total[8]||0),    'kg','']),
    D(['','Sag Rod',                                    r_total[7]||0,        'เส้น','']),
    BL(),
    SB('หมายเหตุ'),
    NOTE('1. ปริมาณนี้ยังไม่คำนวณราคา'),
    NOTE('2. น้ำหนักเหล็กรวมระยะดัดงอ + ระยะทาบแล้ว (lap=40D, hook=12D)'),
    NOTE('3. แนะนำ Wastage: เหล็ก +7%, คอนกรีต +5%, ไม้แบบ +10%'),
    NOTE(`4. ถอดโดย Claude AI จากแบบ "${project.name}" — ${today}`),
  ], [16,28,12,8,24]);

  // ── Sheet 13: สรุปวัสดุ (รวม Wastage) ────────────────────────
  const mat_header = ['ลำดับ','รายการวัสดุ','ปริมาณ (สุทธิ)','หน่วย','Wastage','ปริมาณสั่งซื้อ','หมายเหตุ'];
  const wasted = (v, pct) => n2(v*(1+pct/100));
  buildAndStyle(wb, '13_สรุปวัสดุ', [
    T('Sheet 13 — สรุปวัสดุสำหรับสั่งซื้อ (รวม Wastage)'),
    BL(),
    H(mat_header),
    D(['ก.','ทรายอัดแน่นใต้ Lean',  n2(totals.sand),            'ม³','5%', wasted(totals.sand,5),'']),
    D(['',  'ดินถมกลับ (ประมาณ)',    n2(totals.excavation*0.3),  'ม³','10%',wasted(totals.excavation*0.3,10),'']),
    D(['ข.','Lean Concrete 1:3:5',   n2(totals.lean),            'ม³','5%', wasted(totals.lean,5),'']),
    D(['',  "คอนกรีตผสมเสร็จ fc'=240 ksc",n2(totals.c_total),  'ม³','5%', wasted(totals.c_total,5),'ฐานราก+เสา+คาน']),
    D(['',  "คอนกรีตผสมเสร็จ fc'=210 ksc",n2(sp_totalArea*0.05),'ม³','5%',wasted(sp_totalArea*0.05,5),'Topping พื้นสำเร็จ']),
    D(['ค.','เหล็กข้ออ้อย SD40 (รวม)', n2(totals.r_total),      'kg','7%', wasted(totals.r_total,7),'DB10-DB25']),
    D(['',  'เหล็กกลม SR24 (ปลอก)',    n2(totals.r_total*0.15),  'kg','7%', wasted(totals.r_total*0.15,7),'RB6, RB9 ~15%']),
    D(['',  'ลวดผูก #18',              n2(totals.r_total*0.01),  'kg','10%',wasted(totals.r_total*0.01,10),'~1% ของเหล็ก']),
    D(['ง.','ไม้แบบเรียบ (ไม้อัด)',    n2(totals.f_total),        'ม²','10%',wasted(totals.f_total,10),'']),
    D(['',  'ไม้คร่าว 2"×3"',          n2(totals.f_total*1.2),   'เมตร','10%',wasted(totals.f_total*1.2,10),'~1.2 ม./ม²']),
    D(['',  'ตะปู',                    n2(totals.f_total*0.3),   'kg','10%',wasted(totals.f_total*0.3,10),'~0.3 kg/ม²']),
    D(['จ.','Solid Plank',             n2(sp_totalArea),          'ม²','3%', wasted(sp_totalArea,3),'']),
    D(['',  'Wire Mesh #4@0.20',       n2(sp_totalArea),          'ม²','5%', wasted(sp_totalArea,5),'']),
    D(['ฉ.','โครงเหล็กรูปพรรณ',       n2(r_total[8]||0),         'kg','5%', wasted(r_total[8]||0,5),'จันทัน+แป']),
    D(['',  'Sag Rod',                 r_total[7]||0,             'เส้น','10%',Math.ceil((r_total[7]||0)*1.1),'']),
    BL(),
    NOTE('Wastage: คอนกรีต +5%, เหล็ก +7%, ไม้แบบ +10%, พื้นสำเร็จ +3%'),
  ], [5,28,12,8,8,14,20]);

  // ── Save ─────────────────────────────────────────────────────
  const safe = (project.name||'BOQ').replace(/[\\/:*?"<>|]/g,'_');
  X.writeFile(wb, `BOQ_${safe}.xlsx`);
}

// ── Utility: แปลง items[] → rows สำหรับแต่ละ sheet ─────────────
function itemsToSheetRows(items, cat, subFilter) {
  const filtered = items.filter(it => {
    const c = (it.category||it.cat||'');
    const n = (it.name||'').toLowerCase();
    if (!c.includes(cat)) return false;
    if (subFilter && !n.includes(subFilter)) return false;
    return true;
  });
  return filtered.map(it => ({
    code:    it.code || '-',
    name:    it.name || '-',
    qty:     Number(it.qty)||0,
    unit:    it.unit || '-',
    volume:  Number(it.volume)||0,
    notes:   it.notes || '',
    rebar:   '-',
  }));
}

// ── Utility: คำนวณ summary ของ footing rows ─────────────────────
function calcFootingSummary(rows) {
  return rows.map(r => {
    const B = Number(r.B)||1, L = Number(r.L)||1, T = Number(r.T)||0.5;
    const n = Number(r.count||r.qty)||1;
    const lean_t = Number(r.lean_t)||0.05;
    const depth  = Number(r.depth)||1.2;
    const area   = n2(B*L);
    const cpf    = n2(B*L*T);
    const c_m3   = r.concrete_m3 ? n2(r.concrete_m3) : n2(cpf*n);
    const lean   = r.lean_m3    ? n2(r.lean_m3)    : n2((B+0.1)*(L+0.1)*lean_t*n);
    const excav  = r.excavation_m3 ? n2(r.excavation_m3) : n2((B+1)*(L+1)*depth*n);
    const form   = r.formwork_m2   ? n2(r.formwork_m2)   : n2(2*(B+L)*T*n);
    const rb_bot = r.rebar_kg  ? n2(r.rebar_kg)  : 0;
    const rb_tie = r.rebar_tie_kg  ? n2(r.rebar_tie_kg) : 0;
    return {
      code: r.code||'-', area_m2: area, concrete_per: cpf, concrete_m3: c_m3,
      lean_m3: lean, excavation_m3: excav, sand_m3: lean,
      formwork_m2: form, rebar_bot_kg: rb_bot, rebar_tie_kg: rb_tie,
      rebar_kg: n2(rb_bot+rb_tie)
    };
  });
}

function calcColVol(r) {
  const sec = (r.section||'0.3×0.4').split(/[×x]/);
  const B = Number(sec[0])||0.3, D = Number(sec[1])||0.4;
  const h = Number(r.height)||3.0, n = Number(r.count||r.qty)||1;
  return n2(B*D*h*n);
}
function calcColForm(r) {
  const sec = (r.section||'0.3×0.4').split(/[×x]/);
  const B = Number(sec[0])||0.3, D = Number(sec[1])||0.4;
  const h = Number(r.height)||3.0, n = Number(r.count||r.qty)||1;
  return n2(2*(B+D)*h*n);
}

// ── Utility: รวมค่าทุกหมวดสำหรับ Sheet 11 ─────────────────────
function calcTotals(footings, columns, beams, roof, precast, cip, items) {
  const sumField = (arr, f) => arr.reduce((s,r) => s+(Number(r[f])||0), 0);
  const fSums = calcFootingSummary(footings);

  // fallback จาก items ถ้าไม่มี structured data
  const getVol = (cat) => items.filter(i=>(i.category||i.cat||'').includes(cat)).reduce((s,i)=>s+(Number(i.volume)||0),0);

  return {
    excavation: n2(sumField(fSums,'excavation_m3') || getVol('ดิน')),
    sand:       n2(sumField(fSums,'sand_m3')),
    lean:       n2(sumField(fSums,'lean_m3')),
    c_footing:  n2(sumField(fSums,'concrete_m3') || getVol('ฐานราก')),
    c_column:   n2(columns.reduce((s,r)=>s+(Number(r.concrete_m3)||calcColVol(r)),0) || getVol('เสา')),
    c_beam:     n2(beams.reduce((s,r)=>s+(Number(r.concrete_m3)||Number(r.volume)||0),0) || getVol('คาน')),
    c_slab_cip: n2(cip.reduce((s,r)=>s+(Number(r.concrete_m3)||Number(r.volume)||0),0)),
    get c_total(){ return n2(this.c_footing+this.c_column+this.c_beam+this.c_slab_cip); },
    r_footing:  n2(sumField(fSums,'rebar_kg')),
    r_column:   n2(columns.reduce((s,r)=>s+(Number(r.rebar_kg)||0),0)),
    r_beam:     n2(beams.reduce((s,r)=>s+(Number(r.rebar_kg)||0),0)),
    get r_total(){ return n2(this.r_footing+this.r_column+this.r_beam); },
    f_footing:  n2(sumField(fSums,'formwork_m2')),
    f_column:   n2(columns.reduce((s,r)=>s+(Number(r.formwork_m2)||calcColForm(r)),0)),
    f_beam:     n2(beams.reduce((s,r)=>s+(Number(r.formwork_m2)||0),0)),
    get f_total(){ return n2(this.f_footing+this.f_column+this.f_beam); },
  };
}

// ── Utility: sum columns ────────────────────────────────────────
function sumRow(data, colIdxs) {
  const result = [];
  for (let i = 0; i < (data[0]?.length||0); i++) {
    if (colIdxs.includes(i)) {
      result.push(n2(data.reduce((s,r)=>s+(Number(r[i])||0),0)));
    } else {
      result.push('');
    }
  }
  return result;
}
function n2(v){ return Math.round((Number(v)||0)*100)/100; }

window.generateBOQExcel = generateBOQExcel;
