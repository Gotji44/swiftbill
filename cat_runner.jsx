/* ===================== Cat Runner — sidebar idle animation ===================== */
/* White line-art cat that auto-runs and jumps over trees, Chrome-dino style. */
function CatRunner() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current,wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    let W = 220,H = 92,dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      W = wrap.clientWidth || 220;
      canvas.width = W * dpr;canvas.height = H * dpr;
      canvas.style.width = W + 'px';canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);ro.observe(wrap);

    const groundY = H - 20;
    const STROKE = 'rgba(255,255,255,0.92)';
    const FAINT = 'rgba(255,255,255,0.30)';

    // ---- state ----
    let speed = 1.9;
    let catY = 0; // vertical offset above ground (positive = up)
    let vy = 0;
    let onGround = true;
    let runPhase = 0;
    let frame = 0;
    let raf = 0;
    const G = 0.62,JUMP_V = 8.4;
    let obstacles = [];
    let nextSpawn = 60;
    const stars = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: 6 + Math.random() * 34, r: Math.random() * 0.9 + 0.4 }));

    const spawn = () => {
      const h = 14 + Math.floor(Math.random() * 3) * 4; // tree height
      obstacles.push({ x: W + 10, h, twin: Math.random() < 0.25 });
    };

    // ---- drawing ----
    function drawCat(x, baseY, phase, air) {
      ctx.save();
      ctx.translate(x, baseY);
      ctx.strokeStyle = STROKE;
      ctx.lineWidth = 1.7;
      ctx.lineJoin = 'round';ctx.lineCap = 'round';

      // legs (animated). When in air, tuck.
      const swing = air ? 0 : Math.sin(phase) * 3;
      const swing2 = air ? 0 : Math.sin(phase + Math.PI) * 3;
      const legY = -2;
      ctx.beginPath();
      // front legs
      ctx.moveTo(20, -9);ctx.lineTo(22 + (air ? 3 : swing), legY - (air ? 4 : 0));
      ctx.moveTo(16, -9);ctx.lineTo(15 + (air ? 4 : swing2), legY - (air ? 5 : 0));
      // back legs
      ctx.moveTo(4, -9);ctx.lineTo(2 + (air ? -3 : swing2), legY - (air ? 3 : 0));
      ctx.moveTo(8, -9);ctx.lineTo(9 + (air ? -2 : swing), legY - (air ? 4 : 0));
      ctx.stroke();

      // body (rounded back)
      ctx.beginPath();
      ctx.moveTo(2, -10);
      ctx.quadraticCurveTo(0, -20, 10, -20);
      ctx.lineTo(20, -20);
      ctx.quadraticCurveTo(27, -20, 26, -11); // toward chest
      ctx.stroke();
      // belly
      ctx.beginPath();
      ctx.moveTo(3, -9);ctx.lineTo(22, -9);
      ctx.stroke();

      // head (front-right)
      ctx.beginPath();
      ctx.moveTo(24, -20);
      ctx.quadraticCurveTo(33, -21, 33, -27); // forehead
      ctx.lineTo(33, -27);
      ctx.stroke();
      // face outline
      ctx.beginPath();
      ctx.moveTo(33, -27);
      ctx.quadraticCurveTo(38, -26, 37, -19); // nose/cheek
      ctx.quadraticCurveTo(36, -15, 28, -16); // chin to neck
      ctx.stroke();
      // ears
      ctx.beginPath();
      ctx.moveTo(27, -20);ctx.lineTo(26, -27);ctx.lineTo(31, -23); // left ear
      ctx.moveTo(33, -27);ctx.lineTo(35, -33);ctx.lineTo(38, -27); // right ear
      ctx.stroke();
      // eye + nose dot
      ctx.fillStyle = STROKE;
      ctx.beginPath();ctx.arc(34, -23, 0.95, 0, 7);ctx.fill();
      ctx.beginPath();ctx.arc(37.4, -20.4, 0.8, 0, 7);ctx.fill();
      // whisker
      ctx.beginPath();ctx.moveTo(37, -19);ctx.lineTo(42, -18.5);
      ctx.strokeStyle = FAINT;ctx.lineWidth = 1;ctx.stroke();

      // tail (curls up at back)
      ctx.strokeStyle = STROKE;ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(2, -13);
      const tw = Math.sin(phase * 0.8) * 2;
      ctx.quadraticCurveTo(-8, -16 + tw, -6, -26 + tw);
      ctx.quadraticCurveTo(-5, -31 + tw, -1, -29 + tw);
      ctx.stroke();

      ctx.restore();
    }

    function drawTree(x, h) {
      ctx.save();
      ctx.strokeStyle = STROKE;ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';ctx.lineCap = 'round';
      const baseY = groundY;
      // little pine: stacked triangles
      ctx.beginPath();
      ctx.moveTo(x, baseY - h); // top
      ctx.lineTo(x - 5, baseY - h * 0.45);
      ctx.lineTo(x - 2.5, baseY - h * 0.45);
      ctx.lineTo(x - 6, baseY);
      ctx.lineTo(x + 6, baseY);
      ctx.lineTo(x + 2.5, baseY - h * 0.45);
      ctx.lineTo(x + 5, baseY - h * 0.45);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);

      // stars (twinkle)
      frame++;
      ctx.fillStyle = FAINT;
      stars.forEach((s, i) => {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.01 + i));
        ctx.globalAlpha = tw * 0.5;
        ctx.beginPath();ctx.arc(s.x, s.y, s.r, 0, 7);ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ground (dashed)
      ctx.strokeStyle = FAINT;ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();ctx.moveTo(0, groundY + 0.5);ctx.lineTo(W, groundY + 0.5);ctx.stroke();
      ctx.setLineDash([]);

      // physics
      if (!onGround) {
        catY += vy;vy -= G;
        if (catY <= 0) {catY = 0;vy = 0;onGround = true;}
      }
      if (onGround) runPhase += 0.35;

      // obstacles
      nextSpawn--;
      if (nextSpawn <= 0) {spawn();nextSpawn = 80 + Math.floor(Math.random() * 70);}
      obstacles.forEach((o) => o.x -= speed);
      obstacles = obstacles.filter((o) => o.x > -14);

      // auto-jump when a tree approaches
      const catX = 38;
      for (const o of obstacles) {
        const d = o.x - catX;
        if (onGround && d < 34 && d > 6) {vy = JUMP_V;onGround = false;break;}
      }

      obstacles.forEach((o) => {
        drawTree(o.x, o.h);
        if (o.twin) drawTree(o.x + 9, o.h - 4);
      });

      drawCat(catX, groundY - catY, runPhase, !onGround);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {cancelAnimationFrame(raf);ro.disconnect();};
  }, []);

  return (
    <div ref={wrapRef} className="cat-runner" title="🐾">
      <canvas ref={canvasRef}></canvas>
      <div className="cat-runner-cap" style={{ fontFamily: "Times" }}>WORKING...</div>
    </div>);

}
window.CatRunner = CatRunner;