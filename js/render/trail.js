// ---------- след за магом (слот «След» в гардеробе) ----------
// Одна и та же система для боя (мировые координаты), меню и примерочной (экранные пиксели).
// k — сколько единиц холста в одном пикселе спрайта мага, скорости частиц — в пикселях спрайта за шаг.
// Частица: x, y, vx, vy, life, max, c — цвет квадратика, s — размер, e — эмодзи, ring — пузырь,
// wob — покачивание, g — тяжесть, fly — кружит на месте, band — полоса радуги.
const TRAILS = {
  sparks:  { every: 2,  make: () => ({ c: pick(['#ffe08a', '#ffd25a', '#fff3a0']), s: 1, vy: -0.15, life: 26 }) },
  leaves:  { every: 6,  make: () => ({ c: pick(['#4fc070', '#8ad06a', '#d0a040']), s: 1.5, vy: 0.05, wob: 1, life: 50 }) },
  bubbles: { every: 5,  make: () => ({ ring: '#9fe8ff', s: rnd(1, 2), vy: -0.25, wob: 1, life: 45 }) },
  snow:    { every: 3,  make: () => ({ c: pick(['#ffffff', '#cfefff']), s: rnd(0.6, 1.2), vy: 0.08, wob: 1, life: 50 }) },
  poop:    { every: 40, make: () => ({ e: '💩', s: 3.5, life: 160 }) },
  flies:   { every: 9,  make: () => ({ c: '#141414', s: 0.8, fly: rnd(0, 6), life: 70 }) },
  notes:   { every: 10, make: () => ({ e: pick(['♪', '♫']), c: pick(['#ffe08a', '#ff9ff3', '#7fe8ff']), s: 3.5, vy: -0.25, wob: 1, life: 50 }) },
  hearts:  { every: 9,  make: () => ({ e: pick(['💖', '💗', '💕']), s: 2.6, vy: -0.22, wob: 1, life: 50 }) },
  fire:    { every: 1,  make: () => ({ c: pick(['#ff4a1a', '#ff9a2a', '#ffe95a']), s: rnd(1, 1.8), vy: -0.3, life: 22 }) },
  coins:   { every: 8,  make: () => ({ e: '🪙', s: 2.4, vy: -0.7, g: 0.045, life: 40 }) },
  stars:   { every: 4,  make: () => ({ c: pick(['#ffe95a', '#ffffff', '#9fe8ff']), star: 1, s: rnd(1, 2), vy: -0.1, life: 40 }) },
  rainbow: { every: 1,  make: () => ({ band: 1, s: 1, life: 34 }) }
};
const mageTrail = []; // след в бою; очищается в newGame()
function trailEmit(list, kind, x, y, k, t){
  const T = TRAILS[kind];
  if (!T || t % T.every || list.length > 160) return;
  const p = Object.assign({ x: x + (kind === 'rainbow' ? 0 : rnd(-2.5, 2.5) * k), y: y + (kind === 'rainbow' ? 0 : rnd(-1, 1) * k), vx: 0, vy: 0 }, T.make());
  p.max = p.life;
  list.push(p);
}
function trailStep(list, k){
  for (const p of list){
    p.life--;
    if (p.g) p.vy += p.g;
    p.x += (p.vx + (p.wob ? Math.sin(p.life * 0.15) * 0.15 : 0)) * k; p.y += p.vy * k;
  }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
}
function trailDraw(g, list, k){
  for (const p of list){
    const a = Math.min(1, p.life / p.max * 1.6);
    g.globalAlpha = a;
    if (p.band){
      for (let j = 0; j < 6; j++){ g.fillStyle = RAINBOW[j]; g.fillRect(p.x - k * 0.6, p.y - (j + 1) * k * 0.9, k * 1.2, k * 0.9); }
    } else if (p.e){
      g.font = `${Math.round(p.s * k * 1.6)}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (p.c) g.fillStyle = p.c;
      g.fillText(p.e, p.x, p.y);
    } else if (p.ring){
      g.strokeStyle = p.ring; g.lineWidth = Math.max(1, k * 0.35);
      g.beginPath(); g.arc(p.x, p.y, p.s * k, 0, TAU); g.stroke();
    } else if (p.fly !== undefined){
      const a2 = p.life * 0.35 + p.fly;
      g.fillStyle = p.c; g.fillRect(p.x + Math.cos(a2) * 3 * k, p.y - 4 * k + Math.sin(a2 * 1.7) * 2 * k, p.s * k, p.s * k);
    } else {
      const s = p.s * k * (p.star ? 0.6 + 0.4 * Math.sin(p.life * 0.5) : 1);
      g.fillStyle = p.c; g.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
  }
  g.globalAlpha = 1;
}
