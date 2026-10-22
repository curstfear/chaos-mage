// ---------- пиксельные спрайты ----------
// спрайт рисуется попиксельно в маленький буфер, потом обводится и растягивается без сглаживания
function PB(w, h){ return { w, h, px: new Array(w * h).fill(null) }; }
const okOn = (b, i, on) => on === undefined ? true : on === true ? !!b.px[i] : b.px[i] === on;
function pset(b, x, y, c, on){ x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < b.w && y < b.h && okOn(b, y * b.w + x, on)) b.px[y * b.w + x] = c; }
function disc(b, cx, cy, rx, ry, c, on){
  for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++){
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1) pset(b, x, y, c, on);
  }
}
function rect(b, x0, y0, w, h, c, on){ for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pset(b, x, y, c, on); }
function tri(b, ax, ay, bx, by, cx, cy, c, on){
  const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.ceil(Math.max(ax, bx, cx)), y0 = Math.floor(Math.min(ay, by, cy)), y1 = Math.ceil(Math.max(ay, by, cy));
  const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
    const p = [x + 0.5, y + 0.5], d1 = s(p[0], p[1], ax, ay, bx, by), d2 = s(p[0], p[1], bx, by, cx, cy), d3 = s(p[0], p[1], cx, cy, ax, ay);
    const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
    if (!(neg && pos)) pset(b, x, y, c, on);
  }
}
function line(b, x0, y0, x1, y1, c, on){
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) | 0;
  for (let k = 0; k <= n; k++) pset(b, Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c, on);
}
function outline(b, c){
  const out = b.px.slice();
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++){
    const i = y * b.w + x; if (b.px[i]) continue;
    if ((x > 0 && b.px[i - 1]) || (x < b.w - 1 && b.px[i + 1]) || (y > 0 && b.px[i - b.w]) || (y < b.h - 1 && b.px[i + b.w])) out[i] = c;
  }
  b.px = out;
}
function toCanvas(b){
  const c = document.createElement('canvas'); c.width = b.w; c.height = b.h;
  const g = c.getContext('2d');
  for (let i = 0; i < b.px.length; i++) if (b.px[i]){ g.fillStyle = b.px[i]; g.fillRect(i % b.w, i / b.w | 0, 1, 1); }
  return c;
}
// шар со светотенью: тёмный низ справа, светлый блик слева сверху
function ball(b, cx, cy, rx, ry, base, dark, light){
  disc(b, cx, cy, rx, ry, dark);
  disc(b, cx - rx * 0.12, cy - ry * 0.16, rx * 0.88, ry * 0.84, base, dark);
  if (light) disc(b, cx - rx * 0.38, cy - ry * 0.42, rx * 0.32, ry * 0.26, light, base);
}
function hex2rgb(h){ const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(h, to, t){
  const a = hex2rgb(h), b = hex2rgb(to);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const OUT = '#0e0820';
function eye2(b, x, y, pupil){ rect(b, x - 1, y - 1, 2, 2, '#ffffff'); pset(b, x, y, pupil || '#1a0820'); }

// костюмы мага: открываются за достижения и хранятся в браузере между забегами
const COSTUMES = {
  classic: { name: 'Классический маг', how: 'есть с самого начала', robe: ['#4a35b0', '#35248a', '#6a52e0'], trim: '#ffd25a', hat: 'wizard', hatC: ['#3b2a9a', '#2c1d6e'], band: '#ffd25a', orb: '#7fe8ff' },
  street:  { name: 'Уличный маг', how: 'Убей 500 врагов за один забег', robe: ['#2f6fd0', '#1f4c96', '#5a96f0'], trim: '#ffffff', hat: 'cap', hatC: ['#e0303a', '#a01820'], orb: '#ff8aa0' },
  fiesta:  { name: 'Фиеста', how: 'Набери комбо ×100', robe: ['#e05a2a', '#a83a16', '#ff8a50'], trim: '#2fd07a', hat: 'sombrero', hatC: ['#f0c040', '#b88a20'], band: '#e0303a', orb: '#ffe95a' },
  king:    { name: 'Король хаоса', how: 'Победи босса', robe: ['#8a1a44', '#5a102c', '#b83a64'], trim: '#ffd25a', hat: 'crown', orb: '#ff4f8b' },
  pirate:  { name: 'Пират рун', how: 'Разрушь 20 построек за один забег', robe: ['#2e2e3c', '#1a1a24', '#4a4a60'], trim: '#c0392b', hat: 'pirate', hatC: ['#1a1a22', '#0c0c10'], orb: '#7dff5a' },
  storm:   { name: 'Повелитель бури', how: 'Переживи грозу до конца', robe: ['#1e3a6a', '#122648', '#3a62a0'], trim: '#7fe8ff', hat: 'wizard', hatC: ['#22406e', '#16294a'], band: '#ffe95a', orb: '#ffe95a', bolt: true },
  golden:  { name: 'Золотой маг', how: 'Продержись 10 минут', robe: ['#e8b84a', '#a8781e', '#ffe08a'], trim: '#ffffff', hat: 'wizard', hatC: ['#ffd25a', '#c99a2a'], band: '#ffffff', orb: '#ffffff' }
};
const WARD = { unlocked: ['classic'], selected: 'classic' };
try {
  const s = JSON.parse(localStorage.getItem('chaosMageCostumes') || '{}');
  if (Array.isArray(s.unlocked)) WARD.unlocked = [...new Set(['classic', ...s.unlocked.filter(k => COSTUMES[k])])];
  if (COSTUMES[s.selected] && WARD.unlocked.includes(s.selected)) WARD.selected = s.selected;
} catch (e) {}
const saveWard = () => { try { localStorage.setItem('chaosMageCostumes', JSON.stringify(WARD)); } catch (e) {} };

function mageSprite(f, C){
  const b = PB(22, 26), walk = [0, 1, 0, -1][f], [rb, rd, rl] = C.robe;
  line(b, 18, 8, 18, 24, '#7a4a22'); line(b, 19, 9, 19, 24, '#5a3416');
  tri(b, 11, 11, 3, 23, 19, 23, rb); rect(b, 5, 17, 13, 6, rb);
  tri(b, 11, 11, 11.5, 23, 19, 23, rd, rb);
  line(b, 6, 18, 5, 22, rl, rb);
  rect(b, 3, 22, 17, 1, C.trim, true); line(b, 11, 15, 11, 21, C.trim, true);
  rect(b, 6 + walk, 23, 3, 2, '#2a1a50'); rect(b, 13 - walk, 23, 3, 2, '#2a1a50');
  disc(b, 11, 11, 3.6, 3.4, '#f2c9a0');
  disc(b, 11, 13.5, 3.4, 2, '#ecebf5'); tri(b, 8, 13, 14, 13, 11, 18.5, '#ecebf5'); line(b, 12, 14, 12, 17, '#c9c6d8', '#ecebf5');
  if (C.hat === 'crown') disc(b, 11, 8, 3.8, 1.8, '#ecebf5');
  pset(b, 10, 10, '#1a1030'); pset(b, 13, 10, '#1a1030');
  if (C.hat === 'wizard'){
    const [hc, hd] = C.hatC;
    disc(b, 11, 8, 8.5, 1.9, hd);
    tri(b, 5.5, 8, 16.5, 8, 14, 1, hc); tri(b, 11, 8, 16.5, 8, 14, 1, hd, hc);
    pset(b, 15, 0, hc); pset(b, 16, 0, hc); pset(b, 16, 1, hc);
    line(b, 7, 6, 15, 6, C.band, true); pset(b, 11, 3, '#ffe9a0'); pset(b, 12, 4, C.band);
    if (C.bolt) for (const [x, y] of [[13, 1], [12, 2], [13, 3], [12, 4], [11, 5]]) pset(b, x, y, '#ffe95a', true);
  } else if (C.hat === 'cap'){
    const [hc, hd] = C.hatC;
    disc(b, 11, 8, 4.8, 3, hc); rect(b, 6, 8, 11, 2, hc); rect(b, 12, 8, 7, 2, hd);
    pset(b, 11, 5, '#ffffff'); line(b, 8, 7, 9, 6, '#ff6a72', hc);
  } else if (C.hat === 'sombrero'){
    const [hc, hd] = C.hatC;
    disc(b, 11, 8.5, 10.5, 1.8, hd); disc(b, 11, 8.2, 10, 1.3, hc, hd);
    disc(b, 11, 5.5, 4.2, 3.2, hc); rect(b, 7, 6, 9, 1, C.band, hc);
    for (const x of [2, 6, 16, 20]) pset(b, x, 8, C.band);
  } else if (C.hat === 'crown'){
    rect(b, 7, 5, 9, 3, '#ffd25a');
    tri(b, 7, 5, 8, 1.5, 9.5, 5, '#ffd25a'); tri(b, 9.5, 5, 11.5, 0.5, 13.5, 5, '#ffd25a'); tri(b, 13.5, 5, 15, 1.5, 16, 5, '#ffd25a');
    rect(b, 7, 7, 9, 1, '#b8861e'); pset(b, 11, 6, '#ff2e4d'); pset(b, 8, 6, '#4bd6ff'); pset(b, 14, 6, '#4bd6ff');
  } else if (C.hat === 'pirate'){
    const [hc, hd] = C.hatC;
    disc(b, 11, 7.6, 8.5, 2.1, hc); tri(b, 5, 7.6, 17, 7.6, 11, 1.5, hc); tri(b, 11, 1.5, 17, 7.6, 11, 7.6, hd, hc);
    rect(b, 4, 7, 15, 1, C.trim, true);
    for (const [x, y] of [[10, 4], [11, 4], [12, 4], [11, 5], [10, 6], [12, 6]]) pset(b, x, y, '#ffffff');
  }
  disc(b, 18, 15, 1.7, 1.6, '#f2c9a0');
  disc(b, 18.5, 6, 2.5, 2.5, C.orb); pset(b, 17, 5, '#ffffff');
  outline(b, OUT);
  return toCanvas(b);
}
function slimeSprite(f){
  const b = PB(20, 18), sq = f ? 1 : 0;
  ball(b, 10, 11 + sq * 0.6, 8.6 + sq, 6.4 - sq, '#ff4f8b', '#c22e66', '#ff9cc0');
  disc(b, 4, 15.5, 1.6, 1.3, '#c22e66'); disc(b, 16, 15.5, 1.6, 1.3, '#c22e66');
  pset(b, 5, 8, '#ffffff'); pset(b, 6, 7, '#ffffff');
  eye2(b, 7, 10); eye2(b, 13, 10);
  line(b, 5, 7, 8, 8, '#2a0d1a'); line(b, 15, 7, 12, 8, '#2a0d1a');
  line(b, 8, 13, 12, 13, '#2a0d1a'); pset(b, 9, 14, '#ffffff'); pset(b, 11, 14, '#ffffff');
  outline(b, OUT);
  return toCanvas(b);
}
function impSprite(f){
  const b = PB(24, 18), up = f ? -3 : 2;
  tri(b, 9, 8, 1, 4 + up, 4, 13, '#a8461a'); tri(b, 15, 8, 23, 4 + up, 20, 13, '#a8461a');
  line(b, 9, 8, 2, 5 + up, '#6a2a0a'); line(b, 15, 8, 22, 5 + up, '#6a2a0a');
  tri(b, 9, 5, 8, 0, 11, 5, '#f3e6c8'); tri(b, 15, 5, 16, 0, 13, 5, '#f3e6c8');
  ball(b, 12, 9, 5, 4.6, '#ff9a3d', '#c25a1e', '#ffc27a');
  line(b, 12, 13, 14, 17, '#c25a1e'); pset(b, 15, 17, '#c25a1e');
  pset(b, 10, 9, '#fff27a'); pset(b, 14, 9, '#fff27a'); pset(b, 10, 8, '#3a0d05'); pset(b, 14, 8, '#3a0d05');
  line(b, 10, 11, 14, 11, '#3a0d05'); pset(b, 11, 12, '#ffffff'); pset(b, 13, 12, '#ffffff');
  outline(b, OUT);
  return toCanvas(b);
}
function bruteSprite(f){
  const b = PB(32, 32), sw = f ? 1 : -1;
  rect(b, 10, 25, 5, 6, '#5e1f8a'); rect(b, 18, 25, 5, 6, '#5e1f8a'); rect(b, 9, 30, 7, 2, '#3a1258'); rect(b, 17, 30, 7, 2, '#3a1258');
  ball(b, 5, 16 + sw, 3.8, 5.5, '#9b3bd6', '#6a2296', '#c27aff'); ball(b, 27, 16 - sw, 3.8, 5.5, '#9b3bd6', '#6a2296', '#c27aff');
  ball(b, 16, 16, 10.5, 10, '#9b3bd6', '#6a2296', '#c27aff');
  disc(b, 16, 20, 5.8, 4.2, '#b86ae6', '#9b3bd6');
  tri(b, 9, 8, 5, 1, 12, 7, '#f3e6c8'); tri(b, 23, 8, 27, 1, 20, 7, '#f3e6c8'); pset(b, 5, 1, '#ffffff'); pset(b, 27, 1, '#ffffff');
  rect(b, 10, 12, 4, 2, '#ffffff'); rect(b, 18, 12, 4, 2, '#ffffff'); pset(b, 13, 13, '#1a0820'); pset(b, 18, 13, '#1a0820');
  line(b, 9, 10, 14, 11, '#2a0a3a'); line(b, 23, 10, 18, 11, '#2a0a3a');
  rect(b, 11, 16, 10, 3, '#2a0a14'); pset(b, 11, 15, '#ffffff'); pset(b, 20, 15, '#ffffff'); pset(b, 13, 18, '#ffffff'); pset(b, 17, 18, '#ffffff');
  disc(b, 4, 22 + sw, 2.6, 2.3, '#7a2aaa'); disc(b, 28, 22 - sw, 2.6, 2.3, '#7a2aaa');
  outline(b, OUT);
  return toCanvas(b);
}
function eyeSprite(f){
  const b = PB(24, 26), w = f ? 1 : -1;
  for (const k of [-5, 0, 5]){
    line(b, 12 + k, 15, 12 + k + w * (k ? 1 : -1), 20, '#2a6a8a'); line(b, 12 + k + w * (k ? 1 : -1), 20, 12 + k, 25, '#2a6a8a');
    line(b, 13 + k, 15, 13 + k + w * (k ? 1 : -1), 20, '#1d4f6a');
  }
  ball(b, 12, 11, 9, 9, '#2c8fb5', '#1d5f80', '#5fd0f0');
  disc(b, 12, 11.5, 6, 5.4, '#f4f1ff'); disc(b, 12, 13, 6, 3.6, '#d8d0ee', '#f4f1ff');
  disc(b, 12.5, 12, 3.4, 3.4, '#4bd6ff'); disc(b, 13, 12, 1.7, 2, '#0a0a1a'); pset(b, 11, 10, '#ffffff');
  line(b, 6, 6, 18, 7, '#123e55'); line(b, 6, 7, 18, 8, '#1d5f80', '#f4f1ff');
  outline(b, OUT);
  return toCanvas(b);
}
function bossSprite(f){
  const b = PB(46, 46), sw = f ? 1 : -1;
  tri(b, 23, 15, 1, 6 + sw, 6, 36, '#5a0a1a'); tri(b, 23, 15, 45, 6 + sw, 40, 36, '#5a0a1a');
  line(b, 23, 15, 3, 8 + sw, '#3a0612'); line(b, 23, 15, 43, 8 + sw, '#3a0612');
  rect(b, 15, 37, 6, 8, '#7a0f22'); rect(b, 25, 37, 6, 8, '#7a0f22');
  ball(b, 23, 25, 15.5, 14.5, '#d6243e', '#8a0f22', '#ff6a7e');
  tri(b, 13, 15, 4, 1, 17, 11, '#f3e6c8'); tri(b, 33, 15, 42, 1, 29, 11, '#f3e6c8');
  rect(b, 15, 8, 16, 4, '#ffd25a'); tri(b, 15, 8, 16.5, 2, 19, 8, '#ffd25a'); tri(b, 21, 8, 23, 0.5, 25, 8, '#ffd25a'); tri(b, 27, 8, 29.5, 2, 31, 8, '#ffd25a');
  rect(b, 15, 11, 16, 1, '#b8861e'); pset(b, 23, 9, '#ff2e4d'); pset(b, 18, 9, '#4bd6ff'); pset(b, 28, 9, '#4bd6ff');
  rect(b, 15, 19, 5, 3, '#fff27a'); rect(b, 26, 19, 5, 3, '#fff27a'); pset(b, 18, 20, '#ff2e4d'); pset(b, 27, 20, '#ff2e4d');
  line(b, 13, 16, 20, 18, '#2a0008'); line(b, 33, 16, 26, 18, '#2a0008');
  rect(b, 15, 27, 16, 5, '#2a0008');
  for (let k = 0; k < 8; k++){ pset(b, 15 + k * 2, 27, '#ffffff'); pset(b, 16 + k * 2, 31, '#ffffff'); }
  ball(b, 7, 29 + sw, 4.2, 5.5, '#d6243e', '#8a0f22'); ball(b, 39, 29 - sw, 4.2, 5.5, '#d6243e', '#8a0f22');
  for (const x of [4, 7, 10]) pset(b, x, 35 + sw, '#f3e6c8'); for (const x of [36, 39, 42]) pset(b, x, 35 - sw, '#f3e6c8');
  outline(b, '#1a0006');
  return toCanvas(b);
}
function lichSprite(f){
  const b = PB(34, 40), sw = f ? 1 : -1;
  // балахон
  tri(b, 17, 8, 3, 38, 31, 38, '#3a1a5e'); tri(b, 17, 8, 17, 38, 31, 38, '#26103e', '#3a1a5e');
  for (const x of [4, 9, 14, 19, 24, 29]) tri(b, x, 36, x + 2.5, 40, x + 5, 36, '#3a1a5e');
  line(b, 8, 30, 26, 30, '#ffd25a', true);
  // капюшон и череп
  ball(b, 17, 12, 8.5, 9, '#4a2478', '#2a1048');
  disc(b, 17, 14, 5.6, 5.6, '#e8e0f0'); rect(b, 13, 18, 9, 3, '#e8e0f0');
  rect(b, 13, 12, 3, 3, '#0a0012'); rect(b, 19, 12, 3, 3, '#0a0012'); pset(b, 14, 13, '#c48bff'); pset(b, 20, 13, '#c48bff');
  pset(b, 17, 16, '#0a0012'); for (let x = 14; x <= 20; x += 2) pset(b, x, 19, '#0a0012');
  // посох с кристаллом
  line(b, 30, 6 + sw, 30, 38, '#5a3416'); disc(b, 30, 5 + sw, 3, 3.4, '#c48bff'); pset(b, 29, 4 + sw, '#ffffff');
  ball(b, 6, 22 - sw, 2.4, 2.4, '#e8e0f0', '#a8a0b8');
  outline(b, '#0a0012');
  return toCanvas(b);
}
function slimeKingSprite(f){
  const b = PB(44, 38), sq = f ? 1.2 : 0;
  ball(b, 22, 24 + sq * 0.6, 20 + sq, 13 - sq, '#3ad66a', '#1f8a40', '#9dffb4');
  disc(b, 9, 31, 3, 2.4, '#1f8a40'); disc(b, 35, 31, 3, 2.4, '#1f8a40'); disc(b, 22, 34, 3, 2, '#1f8a40');
  for (const [x, y] of [[12, 20], [30, 26], [18, 29]]) disc(b, x, y, 1.6, 1.6, '#7dffa0', '#3ad66a');
  // корона
  rect(b, 14, 9, 16, 4, '#ffd25a'); tri(b, 14, 9, 15.5, 3, 18, 9, '#ffd25a'); tri(b, 19.5, 9, 22, 1.5, 24.5, 9, '#ffd25a'); tri(b, 26, 9, 28.5, 3, 30, 9, '#ffd25a');
  rect(b, 14, 12, 16, 1, '#b8861e'); pset(b, 22, 10, '#ff2e4d'); pset(b, 17, 10, '#4bd6ff'); pset(b, 27, 10, '#4bd6ff');
  rect(b, 13, 19, 4, 4, '#ffffff'); rect(b, 27, 19, 4, 4, '#ffffff'); rect(b, 15, 20, 2, 2, '#0a2010'); rect(b, 27, 20, 2, 2, '#0a2010');
  line(b, 11, 16, 17, 18, '#0a2010'); line(b, 33, 16, 27, 18, '#0a2010');
  rect(b, 16, 26, 12, 3, '#0a2010'); pset(b, 18, 26, '#ffffff'); pset(b, 25, 26, '#ffffff');
  outline(b, OUT);
  return toCanvas(b);
}
function golemSprite(f){
  const b = PB(44, 44), sw = f ? 1 : -1;
  rect(b, 12, 34, 7, 9, '#6a5e52'); rect(b, 25, 34, 7, 9, '#6a5e52');
  ball(b, 6, 24 + sw, 5.5, 8, '#8a7e70', '#5a4e44', '#b0a494'); ball(b, 38, 24 - sw, 5.5, 8, '#8a7e70', '#5a4e44', '#b0a494');
  ball(b, 22, 24, 14, 13, '#8a7e70', '#5a4e44', '#b0a494');
  ball(b, 22, 10, 8, 7, '#9a8e80', '#5a4e44', '#c0b4a4');
  // трещины и светящиеся руны
  line(b, 14, 18, 18, 26, '#4a3e34'); line(b, 30, 20, 27, 30, '#4a3e34'); line(b, 20, 30, 24, 34, '#4a3e34');
  rect(b, 18, 9, 3, 2, '#ffb84a'); rect(b, 24, 9, 3, 2, '#ffb84a');
  for (const [x, y] of [[22, 20], [21, 22], [23, 22], [22, 24]]) pset(b, x, y, '#ffb84a');
  disc(b, 6, 32 + sw, 4, 3.4, '#6a5e52'); disc(b, 38, 32 - sw, 4, 3.4, '#6a5e52');
  for (const [x, y] of [[10, 12], [33, 14], [16, 36]]) disc(b, x, y, 2, 1.6, '#4f8a3a');
  outline(b, OUT);
  return toCanvas(b);
}
function reaperSprite(f){
  const b = PB(40, 40), sw = f ? 1 : -1;
  // коса
  line(b, 32, 4, 32, 38, '#4a3a2a'); line(b, 33, 4, 33, 38, '#2e2418');
  tri(b, 33, 4, 12, 2 + sw, 18, 8 + sw, '#d8e0ff'); line(b, 33, 4, 14, 3 + sw, '#ffffff');
  // плащ
  tri(b, 18, 10, 4, 38, 30, 38, '#1e2448'); tri(b, 18, 10, 18, 38, 30, 38, '#141834', '#1e2448');
  for (const x of [5, 11, 17, 23]) tri(b, x, 36, x + 3, 40, x + 6, 36, '#1e2448');
  ball(b, 18, 13, 7.5, 8, '#2a3264', '#141834');
  disc(b, 18, 15, 4.6, 4.8, '#05050f');
  pset(b, 16, 14, '#9aa8ff'); pset(b, 20, 14, '#9aa8ff'); pset(b, 16, 15, '#5a6aff'); pset(b, 20, 15, '#5a6aff');
  ball(b, 30, 22 - sw, 2.6, 2.6, '#e8e0f0', '#a8a0b8');
  line(b, 8, 26, 28, 26, '#7a8aff', true);
  outline(b, '#05050f');
  return toCanvas(b);
}
function goblinSprite(f){
  const b = PB(22, 22), w = f ? 1 : -1;
  ball(b, 15, 9, 5.2, 5.2, '#ffd700', '#c9a000', '#fff2a0'); rect(b, 14, 3, 3, 2, '#8a6a00'); pset(b, 15, 9, '#8a6a00'); pset(b, 15, 8, '#8a6a00'); pset(b, 15, 10, '#8a6a00');
  rect(b, 6 + w, 18, 2, 4, '#3e6a1e'); rect(b, 10 - w, 18, 2, 4, '#3e6a1e');
  ball(b, 9, 15, 4.6, 4, '#6b4a2a', '#4a3018');
  tri(b, 5, 8, 0, 5, 5, 10, '#7bc043'); tri(b, 13, 8, 18, 5, 13, 10, '#7bc043');
  ball(b, 9, 9, 4.7, 4.2, '#7bc043', '#4f8a22', '#a8e070');
  pset(b, 7, 8, '#fff27a'); pset(b, 11, 8, '#fff27a'); line(b, 7, 11, 11, 11, '#1a0a00'); pset(b, 8, 11, '#ffffff'); pset(b, 10, 11, '#ffffff');
  outline(b, OUT);
  return toCanvas(b);
}
// бомба на ножках с горящим фитилём
function bomberSprite(f){
  const b = PB(20, 24), st = f ? 1 : -1;
  line(b, 7, 19, 6 + st, 23, '#2a1a10'); line(b, 13, 19, 14 - st, 23, '#2a1a10');
  ball(b, 10, 13, 8, 8, '#3a3446', '#1e1a28', '#7a7290');
  rect(b, 8, 3, 4, 3, '#5a5470'); line(b, 10, 3, 12 + st, 0, '#c8a070');
  pset(b, 12 + st, 0, '#ffe08a'); pset(b, 13 + st, 0, '#ff8a3d'); pset(b, 12 + st, 1, '#ff8a3d');
  eye2(b, 7, 12, '#ff3d3d'); eye2(b, 13, 12, '#ff3d3d');
  line(b, 7, 16, 13, 16, '#0a0812');
  outline(b, OUT);
  return toCanvas(b);
}
// рыцарь-щитоносец: щит всегда смотрит на мага (спрайт повёрнут вправо)
function shieldSprite(f){
  const b = PB(26, 30), st = f ? 1 : -1;
  rect(b, 8, 24, 3, 5 + st, '#4a4a5a'); rect(b, 14, 24, 3, 5 - st, '#4a4a5a');
  rect(b, 6, 12, 13, 13, '#8a92a8'); rect(b, 13, 12, 6, 13, '#6a7288', '#8a92a8'); line(b, 6, 18, 18, 18, '#4a5068');
  ball(b, 12, 7, 6, 6, '#a8b0c4', '#6a7288', '#e0e6f2'); rect(b, 9, 7, 7, 2, '#1a1a24'); pset(b, 14, 7, '#ff3d3d');
  line(b, 12, 0, 12, 2, '#ff3d5a'); line(b, 11, 1, 13, 1, '#ff3d5a');
  // большой щит спереди
  rect(b, 18, 8, 7, 18, '#c8a050'); rect(b, 19, 9, 5, 16, '#e8c870', '#c8a050'); line(b, 21, 10, 21, 23, '#a87a30'); line(b, 19, 15, 24, 15, '#a87a30');
  pset(b, 21, 15, '#ff3d5a');
  outline(b, OUT);
  return toCanvas(b);
}
function waspSprite(f){
  const b = PB(16, 14);
  disc(b, 5, f ? 2.5 : 3.5, 3.6, 2.2, 'rgba(220,240,255,.85)'); disc(b, 11, f ? 2.5 : 3.5, 3.6, 2.2, 'rgba(220,240,255,.85)');
  ball(b, 8, 8, 5, 4, '#ffd23a', '#c89a10', '#fff0a0');
  for (const x of [6, 9]) line(b, x, 5, x, 11, '#1a1408', '#ffd23a');
  tri(b, 13, 7, 16, 8, 13, 10, '#1a1408'); eye2(b, 4, 7, '#1a0808');
  outline(b, OUT);
  return toCanvas(b);
}
function queenSprite(f){
  const b = PB(44, 40), w = f ? 2 : 0;
  // крылья
  disc(b, 11, 10 - w, 10, 6, 'rgba(220,240,255,.75)'); disc(b, 33, 10 - w, 10, 6, 'rgba(220,240,255,.75)');
  disc(b, 13, 17 + w, 7, 4, 'rgba(200,230,255,.6)'); disc(b, 31, 17 + w, 7, 4, 'rgba(200,230,255,.6)');
  // брюшко в полоску и грудь
  ball(b, 22, 29, 10, 9, '#ffcc33', '#c8901a', '#fff0a0');
  for (const y of [25, 29, 33]) line(b, 13, y, 31, y, '#2a1a08', '#ffcc33');
  tri(b, 19, 37, 22, 40, 25, 37, '#2a1a08');
  ball(b, 22, 17, 7, 6, '#4a3410', '#2a1a08', '#7a5a20');
  ball(b, 22, 9, 6, 5, '#ffcc33', '#c8901a', '#fff0a0');
  rect(b, 17, 9, 4, 3, '#2a0a1a'); rect(b, 23, 9, 4, 3, '#2a0a1a'); pset(b, 18, 10, '#ff4f8b'); pset(b, 24, 10, '#ff4f8b');
  // корона и усики
  rect(b, 18, 2, 8, 2, '#ffd25a'); for (const x of [18, 21, 24]) tri(b, x, 2, x + 1, -1, x + 2, 2, '#ffd25a');
  line(b, 19, 4, 15, 0, '#2a1a08'); line(b, 25, 4, 29, 0, '#2a1a08');
  outline(b, OUT);
  return toCanvas(b);
}
// Часовщик: парящий циферблат в мантии со стрелками
function clockSprite(f){
  const b = PB(42, 46), sw = f ? 1 : -1;
  tri(b, 21, 18, 6, 44, 36, 44, '#1e3a5a'); tri(b, 21, 18, 21, 44, 36, 44, '#142840', '#1e3a5a');
  for (const x of [7, 13, 19, 25, 31]) tri(b, x, 42, x + 2.5, 46, x + 5, 42, '#1e3a5a');
  line(b, 12, 34, 30, 34, '#7fe8ff', true);
  // циферблат вместо головы
  disc(b, 21, 15, 13, 13, '#c8a050'); disc(b, 21, 15, 11, 11, '#f4ecd8');
  for (let k = 0; k < 12; k++){ const a = k / 12 * TAU; pset(b, 21 + Math.cos(a) * 9, 15 + Math.sin(a) * 9, k % 3 ? '#8a7a60' : '#1a1a24'); }
  line(b, 21, 15, 21, 7, '#1a1a24'); line(b, 21, 15, 21 + 6 * sw, 18, '#1a1a24'); pset(b, 21, 15, '#ff3d5a');
  disc(b, 21, 1.5, 2.5, 2, '#c8a050');
  // маятник в руке
  line(b, 37, 22, 37 + sw * 2, 34, '#c8a050'); disc(b, 37 + sw * 2, 35, 2.5, 2.5, '#7fe8ff');
  outline(b, '#0a0012');
  return toCanvas(b);
}
function crystalSprite(col){
  const b = PB(22, 24), dk = mix(col, '#000000', 0.4), lt = mix(col, '#ffffff', 0.5);
  tri(b, 2, 22, 4.5, 10, 8, 22, col); tri(b, 4.5, 10, 8, 22, 5, 22, dk, col);
  tri(b, 14, 22, 18.5, 8, 21, 22, col); tri(b, 18.5, 8, 21, 22, 18.5, 22, dk, col);
  tri(b, 6.5, 22, 11, 1, 15.5, 22, col); tri(b, 11, 1, 15.5, 22, 11, 22, dk, col); line(b, 9, 19, 10.5, 4, lt);
  rect(b, 1, 21, 21, 3, '#2a2638'); rect(b, 1, 21, 21, 1, '#3e3852');
  pset(b, 10, 3, '#ffffff'); pset(b, 4, 12, '#ffffff');
  outline(b, OUT);
  return toCanvas(b);
}
function altarSprite(){
  const b = PB(24, 14);
  disc(b, 12, 9, 11.5, 4.6, '#3a3456'); disc(b, 12, 8, 10.5, 3.8, '#5a5480', '#3a3456');
  rect(b, 5, 3, 14, 5, '#4a4470'); rect(b, 5, 3, 14, 1, '#7a72a8'); rect(b, 15, 3, 4, 5, '#2e2a4c', '#4a4470');
  pset(b, 8, 5, '#ffd25a'); pset(b, 12, 5, '#ffd25a'); pset(b, 16, 5, '#ffd25a');
  outline(b, OUT);
  return toCanvas(b);
}
function gemSprite(){
  const b = PB(10, 14);
  tri(b, 5, 0, 0, 6, 10, 6, '#ffe08a'); tri(b, 0, 6, 10, 6, 5, 14, '#e8b84a'); tri(b, 5, 0, 10, 6, 5, 6, '#c99a2a', '#ffe08a');
  tri(b, 5, 6, 10, 6, 5, 14, '#9c6a1c', '#e8b84a'); pset(b, 3, 4, '#ffffff');
  outline(b, OUT);
  return toCanvas(b);
}
