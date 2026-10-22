// ---------- сцена главного меню ----------
// Маг стоит на рунном круге в центре #menuStage (место под него оставляет вёрстка меню),
// вокруг по эллипсу кружат руны, вверх летят искры. Рисуется в экранных пикселях, без камеры.
const MENU_RUNES = ['bolt', 'fire', 'ice', 'lightning', 'meteor', 'poison', 'beam', 'chaos'].filter(r => RUNES[r]);
const menuSparks = [];
const menuStars = Array.from({ length: 70 }, (_, i) => ({ x: (i * 0.6180339) % 1, y: (i * 0.4142135 + 0.13) % 1, p: i * 1.7, s: 1 + i % 3 }));

function drawMenu(){
  const t = performance.now() / 1000, w = innerWidth, h = innerHeight;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;

  // фон: тёмно-фиолетовое небо и мерцающие звёзды
  const bg = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, Math.max(w, h) * 0.75);
  bg.addColorStop(0, '#2a1a5a'); bg.addColorStop(0.55, '#130b2c'); bg.addColorStop(1, '#07060f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for (const s of menuStars){
    ctx.globalAlpha = 0.25 + 0.35 * (1 + Math.sin(t * 1.5 + s.p)) / 2;
    ctx.fillStyle = s.s === 3 ? '#ffe08a' : '#b9a4ff';
    ctx.fillRect(Math.round(s.x * w), Math.round(s.y * h), s.s, s.s);
  }
  ctx.globalAlpha = 1;

  const st = $('menuStage').getBoundingClientRect();
  if (!st.width || !st.height || !SPR.mage) return;
  const k = clamp(Math.floor(Math.min(st.height * 0.6 / 26, st.width * 0.5 / 22)), 2, 11); // размер пикселя мага
  const cx = Math.round(st.left + st.width / 2), feet = Math.round(st.top + st.height * 0.5 + 12 * k);
  const R = 17 * k, ry = R * 0.3;

  // свечение и рунный круг под ногами
  ctx.drawImage(glow('rgba(140,90,255,.55)'), cx - R * 1.6, feet - R * 1.1, R * 3.2, R * 2.2);
  ctx.save(); ctx.translate(cx, feet); ctx.scale(1, 0.3);
  ctx.lineWidth = Math.max(2, k * 0.6) / 0.3 * 0.3;
  for (const [rr, a] of [[R, 0.9], [R * 0.78, 0.5]]){
    ctx.strokeStyle = `rgba(255,224,138,${a})`; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
  }
  // вращающаяся звезда внутри круга
  ctx.rotate(t * 0.25); ctx.strokeStyle = 'rgba(196,139,255,.7)'; ctx.beginPath();
  for (let i = 0; i <= 5; i++){ const a = i * TAU * 2 / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78); }
  ctx.stroke(); ctx.restore();

  // руны на орбите: задние рисуем до мага, передние — после
  const orbit = MENU_RUNES.map((r, i) => {
    const a = t * 0.6 + i * TAU / MENU_RUNES.length;
    return { r, x: cx + Math.cos(a) * R * 1.25, y: feet - 13 * k + Math.sin(a) * ry * 1.6 + Math.sin(t * 2 + i) * k, front: Math.sin(a) > 0 };
  });
  const drawRune = o => {
    ctx.globalAlpha = o.front ? 1 : 0.55;
    ctx.drawImage(glow(RUNES[o.r].color || '#c48bff'), o.x - 3 * k, o.y - 3 * k, 6 * k, 6 * k);
    ctx.font = `${Math.round(3.2 * k)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(RUNES[o.r].icon, o.x, o.y);
    ctx.globalAlpha = 1;
  };
  orbit.filter(o => !o.front).forEach(drawRune);

  // маг: лёгкое покачивание и огонёк на посохе
  const bob = Math.round(Math.sin(t * 2.2) * k * 0.5);
  const mx = cx - 11 * k, my = feet - 25 * k + bob;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cx, feet, 7 * k, 2 * k, 0, 0, TAU); ctx.fill();
  ctx.drawImage(SPR.mage[0], mx, my, 22 * k, 26 * k);
  const pulse = 1 + 0.15 * Math.sin(t * 4);
  ctx.drawImage(glow('rgba(127,232,255,.8)'), mx + 18.5 * k - 5 * k * pulse, my + 8 * k - 5 * k * pulse, 10 * k * pulse, 10 * k * pulse);

  orbit.filter(o => o.front).forEach(drawRune);

  // искры поднимаются из круга
  if (menuSparks.length < 60 && Math.random() < 0.5){
    const a = rnd(0, TAU), d = rnd(0.3, 1) * R;
    menuSparks.push({ x: cx + Math.cos(a) * d, y: feet + Math.sin(a) * d * 0.3, vy: -rnd(0.3, 1) * k * 0.25, life: 1, c: pick(['#ffe08a', '#c48bff', '#7fe8ff']) });
  }
  for (const p of menuSparks){
    p.y += p.vy; p.x += Math.sin(t * 3 + p.y * 0.05) * 0.3; p.life -= 0.008;
    ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(2, k * 0.5), Math.max(2, k * 0.5));
  }
  for (let i = menuSparks.length - 1; i >= 0; i--) if (menuSparks[i].life <= 0) menuSparks.splice(i, 1);
  ctx.globalAlpha = 1;
}
