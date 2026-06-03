/* ===================== Animal Runner — sidebar idle animation ===================== */
/* White line-art animal that auto-runs and jumps over trees, Chrome-dino style.    */
/* Switchable characters: cat / dog / bear / rabbit / turtle / lion / penguin / elephant */

const RUNNER_ANIMALS = [
  { id: 'cat',      emoji: '🐱', label: 'แมว' },
  { id: 'dog',      emoji: '🐶', label: 'หมา' },
  { id: 'bear',     emoji: '🐻', label: 'หมี' },
  { id: 'rabbit',   emoji: '🐰', label: 'กระต่าย' },
  { id: 'turtle',   emoji: '🐢', label: 'เต่า' },
  { id: 'lion',     emoji: '🦁', label: 'สิงโต' },
  { id: 'penguin',  emoji: '🐧', label: 'เพนกวิน' },
  { id: 'elephant', emoji: '🐘', label: 'ช้าง' },
];

function CatRunner() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const [animalId, setAnimalId] = useState(() => {
    try { return localStorage.getItem('sb_runner_animal') || 'cat'; } catch (e) { return 'cat'; }
  });
  const animalRef = useRef(animalId);

  const pick = (id) => {
    animalRef.current = id;
    setAnimalId(id);
    try { localStorage.setItem('sb_runner_animal', id); } catch (e) {}
  };
  const cycle = () => {
    const i = RUNNER_ANIMALS.findIndex(a => a.id === animalRef.current);
    pick(RUNNER_ANIMALS[(i + 1) % RUNNER_ANIMALS.length].id);
  };

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    let W = 220, H = 92, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      W = wrap.clientWidth || 220;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    const groundY = H - 20;
    const STROKE = 'rgba(255,255,255,0.92)';
    const FAINT = 'rgba(255,255,255,0.30)';
    const BEAK = 'rgba(255,183,94,0.95)';

    // ---- per-animal tuning ----
    const CFG = {
      cat:      { speed: 1.9, inc: 0.35, scale: 1.00, jump: 8.4 },
      dog:      { speed: 2.1, inc: 0.40, scale: 1.00, jump: 8.6 },
      bear:     { speed: 1.5, inc: 0.28, scale: 1.06, jump: 7.8 },
      rabbit:   { speed: 2.4, inc: 0.52, scale: 0.94, jump: 9.4 },
      turtle:   { speed: 1.0, inc: 0.22, scale: 1.00, jump: 6.6 },
      lion:     { speed: 1.9, inc: 0.34, scale: 1.04, jump: 8.4 },
      penguin:  { speed: 1.4, inc: 0.30, scale: 0.98, jump: 7.6 },
      elephant: { speed: 1.3, inc: 0.26, scale: 1.12, jump: 7.4 },
    };

    // ---- state ----
    let catY = 0, vy = 0, onGround = true, runPhase = 0, frame = 0, raf = 0;
    const G = 0.62;
    let obstacles = [];
    let nextSpawn = 60;
    const stars = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: 6 + Math.random() * 34, r: Math.random() * 0.9 + 0.4 }));

    const spawn = () => {
      const h = 14 + Math.floor(Math.random() * 3) * 4;
      obstacles.push({ x: W + 10, h, twin: Math.random() < 0.25 });
    };

    // small helpers (origin already translated to ground-contact point, facing right)
    const dot = (x, y, r) => { ctx.fillStyle = STROKE; ctx.beginPath(); ctx.arc(x, y, r || 0.9, 0, 7); ctx.fill(); };
    const sw = (phase, air, amp) => air ? 0 : Math.sin(phase) * (amp || 3);
    const sw2 = (phase, air, amp) => air ? 0 : Math.sin(phase + Math.PI) * (amp || 3);

    // generic 4-leg walker
    function legs4(phase, air, xs, topY, footY, dx) {
      const a = sw(phase, air), b = sw2(phase, air);
      ctx.beginPath();
      ctx.moveTo(xs[0], topY); ctx.lineTo(xs[0] + (air ? -dx : b), footY - (air ? 3 : 0));
      ctx.moveTo(xs[1], topY); ctx.lineTo(xs[1] + (air ? -dx : a), footY - (air ? 4 : 0));
      ctx.moveTo(xs[2], topY); ctx.lineTo(xs[2] + (air ? dx : b), footY - (air ? 4 : 0));
      ctx.moveTo(xs[3], topY); ctx.lineTo(xs[3] + (air ? dx : a), footY - (air ? 5 : 0));
      ctx.stroke();
    }

    // ================= ANIMALS =================
    function drawCat(phase, air) {
      legs4(phase, air, [4, 8, 16, 20], -9, -2, 3);
      // body
      ctx.beginPath();
      ctx.moveTo(2, -10); ctx.quadraticCurveTo(0, -20, 10, -20); ctx.lineTo(20, -20);
      ctx.quadraticCurveTo(27, -20, 26, -11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -9); ctx.lineTo(22, -9); ctx.stroke();
      // head
      ctx.beginPath(); ctx.moveTo(24, -20); ctx.quadraticCurveTo(33, -21, 33, -27); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(33, -27);
      ctx.quadraticCurveTo(38, -26, 37, -19); ctx.quadraticCurveTo(36, -15, 28, -16); ctx.stroke();
      // ears
      ctx.beginPath();
      ctx.moveTo(27, -20); ctx.lineTo(26, -27); ctx.lineTo(31, -23);
      ctx.moveTo(33, -27); ctx.lineTo(35, -33); ctx.lineTo(38, -27); ctx.stroke();
      dot(34, -23, 0.95); dot(37.4, -20.4, 0.8);
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(37, -19); ctx.lineTo(42, -18.5); ctx.stroke();
      // tail
      ctx.strokeStyle = STROKE; ctx.lineWidth = 1.7;
      const tw = Math.sin(phase * 0.8) * 2;
      ctx.beginPath(); ctx.moveTo(2, -13);
      ctx.quadraticCurveTo(-8, -16 + tw, -6, -26 + tw);
      ctx.quadraticCurveTo(-5, -31 + tw, -1, -29 + tw); ctx.stroke();
    }

    function drawDog(phase, air) {
      legs4(phase, air, [4, 8, 17, 21], -9, -1, 3.5);
      // body
      ctx.beginPath();
      ctx.moveTo(2, -10); ctx.quadraticCurveTo(0, -19, 11, -19); ctx.lineTo(21, -19);
      ctx.quadraticCurveTo(28, -19, 27, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -9); ctx.lineTo(24, -9); ctx.stroke();
      // head + snout
      ctx.beginPath(); ctx.moveTo(25, -19); ctx.quadraticCurveTo(33, -22, 34, -25);
      ctx.quadraticCurveTo(36, -27, 44, -23); ctx.lineTo(42, -16);
      ctx.quadraticCurveTo(40, -14, 30, -15); ctx.stroke();
      // floppy ear
      ctx.beginPath(); ctx.moveTo(31, -24); ctx.quadraticCurveTo(27, -22, 28, -13);
      ctx.quadraticCurveTo(31, -15, 32, -20); ctx.stroke();
      dot(36, -22, 0.95); dot(43.5, -22, 0.85); // eye + nose
      // wagging tail (up)
      const tw = Math.sin(phase * 1.2) * 4;
      ctx.beginPath(); ctx.moveTo(2, -13);
      ctx.quadraticCurveTo(-6, -18, -8 + tw, -27 + tw * 0.4); ctx.stroke();
    }

    function drawBear(phase, air) {
      legs4(phase, air, [3, 8, 18, 23], -8, -1, 2.6);
      // bulky body
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.quadraticCurveTo(-3, -24, 13, -25); ctx.lineTo(20, -25);
      ctx.quadraticCurveTo(31, -25, 30, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(27, -8); ctx.stroke();
      // round head at front
      ctx.beginPath(); ctx.arc(33, -19, 7.5, 0, 7); ctx.stroke();
      // round ears
      ctx.beginPath(); ctx.arc(28, -25, 2.6, 0, 7); ctx.arc(38, -25, 2.6, 0, 7); ctx.stroke();
      // snout
      ctx.beginPath(); ctx.ellipse(39, -17, 3.2, 2.4, 0, 0, 7); ctx.stroke();
      dot(31, -21, 1); dot(35, -21, 1); dot(39.5, -17.5, 1.1);
    }

    function drawRabbit(phase, air) {
      // big hind + small front legs
      const a = sw(phase, air, 2.5), b = sw2(phase, air, 2.5);
      ctx.beginPath();
      ctx.moveTo(6, -8); ctx.quadraticCurveTo(3, -3, 9 + (air ? -3 : b), -1); // hind
      ctx.moveTo(18, -8); ctx.lineTo(19 + (air ? 3 : a), -1);                 // front
      ctx.moveTo(15, -8); ctx.lineTo(16 + (air ? 3 : b), -1);
      ctx.stroke();
      // compact body
      ctx.beginPath();
      ctx.moveTo(4, -8); ctx.quadraticCurveTo(2, -18, 12, -18); ctx.lineTo(18, -18);
      ctx.quadraticCurveTo(24, -18, 23, -9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(20, -8); ctx.stroke();
      // head
      ctx.beginPath(); ctx.arc(26, -17, 5, 0, 7); ctx.stroke();
      // long ears
      const ew = Math.sin(phase * 0.6) * 1.2;
      ctx.beginPath();
      ctx.moveTo(24, -21); ctx.quadraticCurveTo(21 + ew, -32, 24 + ew, -33);
      ctx.quadraticCurveTo(26 + ew, -31, 25, -21); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(28, -21); ctx.quadraticCurveTo(28 - ew, -32, 31 - ew, -32);
      ctx.quadraticCurveTo(32 - ew, -30, 29, -21); ctx.stroke();
      dot(28, -17, 1); dot(30.5, -16, 0.8); // eye + nose
      // cotton tail
      ctx.fillStyle = FAINT; ctx.beginPath(); ctx.arc(3, -11, 2.4, 0, 7); ctx.fill();
    }

    function drawTurtle(phase, air) {
      // stubby legs shuffling
      const a = sw(phase, air, 1.6), b = sw2(phase, air, 1.6);
      ctx.beginPath();
      ctx.moveTo(2, -5); ctx.lineTo(1 + b, -1);
      ctx.moveTo(9, -5); ctx.lineTo(9 + a, -1);
      ctx.moveTo(17, -5); ctx.lineTo(17 + b, -1);
      ctx.moveTo(23, -5); ctx.lineTo(24 + a, -1);
      ctx.stroke();
      // shell dome
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-2, -5);
      ctx.quadraticCurveTo(0, -19, 13, -19); ctx.quadraticCurveTo(26, -19, 27, -5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(27, -5); ctx.stroke();
      // shell pattern
      ctx.lineWidth = 1; ctx.strokeStyle = FAINT;
      ctx.beginPath();
      ctx.moveTo(13, -19); ctx.lineTo(13, -5);
      ctx.moveTo(5, -7); ctx.lineTo(7, -15); ctx.moveTo(21, -7); ctx.lineTo(19, -15);
      ctx.stroke();
      ctx.strokeStyle = STROKE; ctx.lineWidth = 1.7;
      // head poking right
      ctx.beginPath(); ctx.moveTo(27, -12);
      ctx.quadraticCurveTo(34, -13, 34, -8); ctx.quadraticCurveTo(34, -5, 28, -6); ctx.stroke();
      dot(32, -10, 0.9);
      // little tail
      ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(-6, -6); ctx.stroke();
    }

    function drawLion(phase, air) {
      legs4(phase, air, [4, 8, 16, 20], -9, -2, 3);
      // body
      ctx.beginPath();
      ctx.moveTo(2, -10); ctx.quadraticCurveTo(0, -20, 10, -20); ctx.lineTo(20, -20);
      ctx.quadraticCurveTo(27, -20, 26, -11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -9); ctx.lineTo(22, -9); ctx.stroke();
      // mane (radiating)
      ctx.strokeStyle = STROKE; ctx.lineWidth = 1.2;
      for (let i = 0; i < 12; i++) {
        const ang = i / 12 * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(32 + Math.cos(ang) * 6, -24 + Math.sin(ang) * 6);
        ctx.lineTo(32 + Math.cos(ang) * 10, -24 + Math.sin(ang) * 10);
        ctx.stroke();
      }
      ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.arc(33, -23, 5.2, 0, 7); ctx.stroke(); // face
      dot(33, -23, 1); dot(36, -22, 1); dot(34.6, -20, 0.8); // eyes + nose
      // tuft tail
      const tw = Math.sin(phase * 0.9) * 2;
      ctx.beginPath(); ctx.moveTo(2, -13);
      ctx.quadraticCurveTo(-7, -16 + tw, -7, -24 + tw); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-7, -24 + tw); ctx.lineTo(-9, -29 + tw);
      ctx.moveTo(-7, -24 + tw); ctx.lineTo(-5, -29 + tw);
      ctx.moveTo(-7, -24 + tw); ctx.lineTo(-7, -30 + tw); ctx.stroke();
    }

    function drawPenguin(phase, air) {
      ctx.save();
      const rot = air ? 0 : Math.sin(phase) * 0.07;
      ctx.rotate(rot);
      // body
      ctx.beginPath(); ctx.ellipse(14, -16, 9, 15, 0, 0, 7); ctx.stroke();
      // belly
      ctx.beginPath(); ctx.ellipse(15, -14, 5.2, 11, 0, -0.5, 3.6); ctx.stroke();
      dot(17, -27, 1); // eye
      // beak
      ctx.fillStyle = BEAK;
      ctx.beginPath(); ctx.moveTo(22, -26); ctx.lineTo(28, -25); ctx.lineTo(22, -23); ctx.closePath(); ctx.fill();
      // flippers
      ctx.strokeStyle = STROKE;
      const fl = sw(phase, air, 3);
      ctx.beginPath(); ctx.moveTo(6, -20); ctx.quadraticCurveTo(0, -12 + fl, 3, -6 + fl); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, -19); ctx.quadraticCurveTo(28, -12 - fl, 25, -6 - fl); ctx.stroke();
      // feet
      ctx.fillStyle = BEAK;
      const ft = sw(phase, air, 2);
      [10, 18].forEach((fx, i) => {
        const o = i ? ft : -ft;
        ctx.beginPath(); ctx.moveTo(fx - 3, -1); ctx.lineTo(fx + 4 + o, -1); ctx.lineTo(fx, -4); ctx.closePath(); ctx.fill();
      });
      ctx.restore();
    }

    function drawElephant(phase, air) {
      ctx.lineWidth = 2;
      legs4(phase, air, [2, 8, 18, 24], -10, -1, 2.4);
      // big body
      ctx.beginPath();
      ctx.moveTo(-2, -10); ctx.quadraticCurveTo(-5, -27, 13, -28); ctx.lineTo(22, -28);
      ctx.quadraticCurveTo(33, -27, 31, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(28, -9); ctx.stroke();
      // head merges front
      ctx.beginPath(); ctx.moveTo(31, -24);
      ctx.quadraticCurveTo(42, -24, 42, -14); ctx.stroke();
      // big ear
      ctx.beginPath(); ctx.moveTo(31, -25);
      ctx.quadraticCurveTo(28, -16, 33, -12); ctx.quadraticCurveTo(35, -18, 34, -24); ctx.stroke();
      // trunk
      const tr = Math.sin(phase * 0.7) * 1.5;
      ctx.beginPath(); ctx.moveTo(42, -16);
      ctx.quadraticCurveTo(46, -12, 45 + tr, -5); ctx.quadraticCurveTo(45 + tr, -2, 42 + tr, -2); ctx.stroke();
      // tusk
      ctx.beginPath(); ctx.moveTo(40, -11); ctx.lineTo(43, -7); ctx.stroke();
      dot(37, -19, 1.1); // eye
      // tiny tail
      ctx.beginPath(); ctx.moveTo(-2, -13); ctx.lineTo(-6, -8); ctx.stroke();
      ctx.lineWidth = 1.7;
    }

    const DRAW = {
      cat: drawCat, dog: drawDog, bear: drawBear, rabbit: drawRabbit,
      turtle: drawTurtle, lion: drawLion, penguin: drawPenguin, elephant: drawElephant,
    };

    function drawAnimal(id, x, baseY, phase, air) {
      const cfg = CFG[id] || CFG.cat;
      ctx.save();
      ctx.translate(x, baseY);
      if (cfg.scale !== 1) ctx.scale(cfg.scale, cfg.scale);
      ctx.strokeStyle = STROKE; ctx.lineWidth = 1.7; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      (DRAW[id] || drawCat)(phase, air);
      ctx.restore();
    }

    function drawTree(x, h) {
      ctx.save();
      ctx.strokeStyle = STROKE; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const baseY = groundY;
      ctx.beginPath();
      ctx.moveTo(x, baseY - h);
      ctx.lineTo(x - 5, baseY - h * 0.45); ctx.lineTo(x - 2.5, baseY - h * 0.45);
      ctx.lineTo(x - 6, baseY); ctx.lineTo(x + 6, baseY);
      ctx.lineTo(x + 2.5, baseY - h * 0.45); ctx.lineTo(x + 5, baseY - h * 0.45);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      const id = animalRef.current;
      const cfg = CFG[id] || CFG.cat;

      // stars
      frame++;
      ctx.fillStyle = FAINT;
      stars.forEach((s, i) => {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.01 + i));
        ctx.globalAlpha = tw * 0.5;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ground
      ctx.strokeStyle = FAINT; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(0, groundY + 0.5); ctx.lineTo(W, groundY + 0.5); ctx.stroke();
      ctx.setLineDash([]);

      // physics
      if (!onGround) { catY += vy; vy -= G; if (catY <= 0) { catY = 0; vy = 0; onGround = true; } }
      if (onGround) runPhase += cfg.inc;

      // obstacles
      nextSpawn--;
      if (nextSpawn <= 0) { spawn(); nextSpawn = 80 + Math.floor(Math.random() * 70); }
      obstacles.forEach((o) => o.x -= cfg.speed);
      obstacles = obstacles.filter((o) => o.x > -14);

      const catX = 38;
      for (const o of obstacles) {
        const d = o.x - catX;
        if (onGround && d < 34 && d > 6) { vy = cfg.jump; onGround = false; break; }
      }

      obstacles.forEach((o) => { drawTree(o.x, o.h); if (o.twin) drawTree(o.x + 9, o.h - 4); });
      drawAnimal(id, catX, groundY - catY, runPhase, !onGround);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className="cat-runner">
      <div ref={wrapRef} className="cat-runner-stage" title="คลิกเพื่อเปลี่ยนตัวละคร" onClick={cycle}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="cat-runner-cap" style={{ fontFamily: 'Times' }}>WORKING...</div>
      <div className="runner-pick">
        {RUNNER_ANIMALS.map(a => (
          <button key={a.id}
            className={'runner-emoji' + (a.id === animalId ? ' on' : '')}
            title={a.label} onClick={() => pick(a.id)}>{a.emoji}</button>
        ))}
      </div>
    </div>);
}
window.CatRunner = CatRunner;
