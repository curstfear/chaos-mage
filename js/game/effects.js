// ---------- эффекты ----------
function burst(x, y, n, color, sp){
  for (let i = 0; i < n && particles.length < 2200; i++){
    const a = rnd(0, TAU), s = rnd(0.5, sp);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(18, 42), max: 42, color, r: rnd(1.5, 3.5) });
  }
}
function ring(x, y, r, color){ particles.push({ ring: true, x, y, r, life: 18, max: 18, color }); }
function banner(text, color){ banners.push({ text, color, t: 170 }); if (banners.length > 3) banners.shift(); }
function spawnAmbient(){
  const B = RUN.biome, x0 = cam.x - W / 2, y0 = cam.y - H / 2;
  if (amb.length > 150) return;
  if (B === 'lava' && Math.random() < 0.5) amb.push({ x: x0 + rnd(0, W), y: y0 + rnd(0, H), vx: rnd(-0.3, 0.3), vy: -rnd(0.4, 1.3), life: 120, max: 120, r: rnd(1, 2.4), color: pick(['#ff7a2e', '#ffb347']) });
  if (B === 'ice' && Math.random() < 0.7) amb.push({ x: x0 + rnd(-100, W), y: y0 - 10, vx: rnd(0.2, 0.7), vy: rnd(0.8, 1.6), life: 600, max: 600, r: rnd(1, 2.2), color: '#ffffff', snow: true });
  if (B === 'swamp' && Math.random() < 0.3) amb.push({ x: x0 + rnd(0, W), y: y0 + rnd(0, H), vx: 0, vy: -0.2, life: 200, max: 200, r: rnd(1.2, 2.5), color: '#9dff7a', wob: rnd(0, TAU) });
  if (B === 'caves' && Math.random() < 0.35) amb.push({ x: x0 + rnd(0, W), y: y0 + rnd(0, H), vx: 0, vy: -0.1, life: 70, max: 70, r: rnd(0.8, 1.8), color: pick(['#9ff0ff', '#ff7ad8']) });
  if (B === 'desert' && Math.random() < 0.6) amb.push({ streak: true, x: x0 - 40, y: y0 + rnd(0, H), vx: rnd(6, 10), vy: rnd(-0.5, 0.8), life: 160, max: 160, color: '#e8c88a' });
  if (B === 'forge' && Math.random() < 0.35) amb.push({ x: x0 + rnd(0, W), y: y0 + rnd(0, H), vx: rnd(-0.6, 0.6), vy: -rnd(0.6, 1.8), life: 50, max: 50, r: rnd(1, 2), color: pick(['#ffb347', '#ffe08a', '#ff7a2e']) });
  if (B === 'abyss' && Math.random() < 0.3) amb.push({ x: x0 + rnd(0, W), y: y0 + rnd(0, H), vx: 0, vy: 0, life: 90, max: 90, r: rnd(1, 2), color: '#b9a4ff' });
  if (goldT > 0 && Math.random() < 0.6) amb.push({ x: x0 + rnd(0, W), y: y0 + rnd(0, H), vx: 0, vy: -0.5, life: 70, max: 70, r: rnd(1.2, 2.6), color: '#ffd700' });
}
