// ---------- рисование ----------
function drawGround(){
  const S = biomeSprites(RUN.biome);
  if (!groundPat){
    groundPat = ctx.createPattern(S.tile, 'repeat');
    groundPat.setTransform(new DOMMatrix().scale(BSCALE));
  }
  ctx.fillStyle = groundPat;
  ctx.fillRect(cam.x - W / 2 - 40, cam.y - H / 2 - 40, W + 80, H + 80);
  chunkRange(cam.x - W / 2 - 40, cam.y - H / 2 - 40, cam.x + W / 2 + 40, cam.y + H / 2 + 40, (cx, cy) => {
    const ch = chunks.get(cx + ',' + cy); if (!ch) return;
    for (const d of ch.details){
      const img = S.details[d.k];
      if (d.flip){ ctx.save(); ctx.translate(d.x, d.y); ctx.scale(-1, 1); ctx.drawImage(img, -15, -24, 30, 24); ctx.restore(); }
      else ctx.drawImage(img, d.x - 15, d.y - 24, 30, 24);
    }
  });
}
function shadow(x, y, rx){
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.32, 0, 0, TAU); ctx.fill();
}
function drawProp(h){
  if (h.kind === 'lava'){
    ctx.globalAlpha = 0.55 + 0.1 * Math.sin(tick * 0.05 + h.seed * 9);
    ctx.drawImage(glow('#ff5a1f'), h.x - h.r * 1.3, h.y - h.r * 1.3, h.r * 2.6, h.r * 2.6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3a140a'; ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * 0.86, h.r * 0.6, h.seed * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * 0.78, h.r * 0.53, h.seed * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.ellipse(h.x - h.r * 0.1, h.y - h.r * 0.05, h.r * 0.45, h.r * 0.28, h.seed * 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe08a';
    for (let k = 0; k < 3; k++){
      const a = tick * 0.02 + k * 2.1 + h.seed * 7, b = (Math.sin(tick * 0.08 + k) + 1) * 0.5;
      ctx.globalAlpha = b; ctx.fillRect(h.x + Math.cos(a) * h.r * 0.4 - 3, h.y + Math.sin(a) * h.r * 0.25 - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
  } else if (h.kind === 'ice'){
    ctx.fillStyle = 'rgba(170,225,255,.16)'; ctx.strokeStyle = 'rgba(200,240,255,.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.75, h.seed * 3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(h.x - h.r * 0.4, h.y - h.r * 0.3, h.r * 0.3, 3); ctx.fillRect(h.x + h.r * 0.1, h.y + h.r * 0.15, h.r * 0.25, 3);
  } else if (h.kind === 'geyser'){
    const warn = h.t > 300 ? (h.t - 300) / 60 : 0;
    ctx.fillStyle = '#0b1a0c'; ctx.beginPath(); ctx.ellipse(h.x, h.y, 26, 16, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3e8a3a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#5ac83a'; ctx.beginPath(); ctx.ellipse(h.x, h.y, 14, 8, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.3 + warn * 0.5; ctx.drawImage(glow('#7dff5a'), h.x - 34, h.y - 34, 68, 68); ctx.globalAlpha = 1;
    if (warn > 0){
      ctx.strokeStyle = `rgba(125,255,90,${0.3 + warn * 0.6})`; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * warn, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  } else if (h.kind === 'well'){
    ctx.save(); ctx.translate(h.x, h.y);
    ctx.globalAlpha = 0.35; ctx.drawImage(glow('#7a4bff'), -h.r * 2, -h.r * 2, h.r * 4, h.r * 4); ctx.globalAlpha = 1;
    for (let k = 0; k < 3; k++){
      ctx.rotate(tick * 0.01 + k);
      ctx.strokeStyle = `rgba(180,107,255,${0.25 - k * 0.06})`; ctx.lineWidth = 3; ctx.setLineDash([16, 12]);
      ctx.beginPath(); ctx.arc(0, 0, h.r * (2.1 - k * 0.5), 0, TAU); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, h.r * 0.33, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,180,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, h.r * 0.35, 0, TAU); ctx.stroke();
    ctx.restore();
  } else if (h.kind === 'resonator'){
    const L = RESO_LEN, cx = Math.cos(h.ang || 0) * L, cy = Math.sin(h.ang || 0) * L;
    // предупреждение: пунктир наливается за секунду до выстрела
    if (h.t >= 230){
      const k = (h.t - 230) / 70;
      ctx.strokeStyle = `rgba(255,122,216,${0.2 + k * 0.6})`; ctx.lineWidth = 2 + k * 3; ctx.setLineDash([14, 10]);
      ctx.beginPath(); ctx.moveTo(h.x - cx, h.y - cy); ctx.lineTo(h.x + cx, h.y + cy); ctx.stroke(); ctx.setLineDash([]);
    }
    if (h.fire > 0){
      const a = h.fire / 14;
      ctx.lineCap = 'butt';
      ctx.strokeStyle = '#9ff0ff'; ctx.globalAlpha = a * 0.6; ctx.lineWidth = 30 * a;
      ctx.beginPath(); ctx.moveTo(h.x - cx, h.y - cy); ctx.lineTo(h.x + cx, h.y + cy); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = a; ctx.lineWidth = 8 * a;
      ctx.beginPath(); ctx.moveTo(h.x - cx, h.y - cy); ctx.lineTo(h.x + cx, h.y + cy); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.45 + 0.2 * Math.sin(tick * 0.1 + h.seed * 9);
    ctx.drawImage(glow(h.t >= 230 ? '#ff7ad8' : '#9ff0ff'), h.x - 60, h.y - 70, 120, 120);
    ctx.globalAlpha = 1;
    shadow(h.x, h.y + 6, 26);
    for (const [ox, hh, w, c, d] of [[-14, 30, 8, '#ff7ad8', '#b03a96'], [12, 34, 8, '#9ff0ff', '#3ab0d0'], [0, 50, 11, '#c8f6ff', '#5ac8e8']]){
      ctx.fillStyle = '#0e0820'; ctx.beginPath(); ctx.moveTo(h.x + ox, h.y - hh - 3); ctx.lineTo(h.x + ox - w - 3, h.y + 2); ctx.lineTo(h.x + ox + w + 3, h.y + 2); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(h.x + ox, h.y - hh); ctx.lineTo(h.x + ox - w, h.y); ctx.lineTo(h.x + ox + w, h.y); ctx.fill();
      ctx.fillStyle = d; ctx.beginPath(); ctx.moveTo(h.x + ox, h.y - hh); ctx.lineTo(h.x + ox, h.y); ctx.lineTo(h.x + ox + w, h.y); ctx.fill();
    }
  } else if (h.kind === 'quicksand'){
    ctx.save(); ctx.translate(h.x, h.y); ctx.scale(1, 0.62);
    ctx.fillStyle = 'rgba(120,80,40,.35)'; ctx.beginPath(); ctx.arc(0, 0, h.r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(90,58,28,.45)'; ctx.beginPath(); ctx.arc(0, 0, h.r * 0.55, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(50,30,14,.7)'; ctx.beginPath(); ctx.arc(0, 0, h.r * 0.22, 0, TAU); ctx.fill();
    // песок закручивается к центру
    ctx.strokeStyle = 'rgba(240,210,150,.4)'; ctx.lineWidth = 3; ctx.setLineDash([12, 14]);
    for (const [k, sp] of [[0.85, 0.012], [0.6, -0.018], [0.38, 0.026]]){
      ctx.rotate(tick * sp); ctx.beginPath(); ctx.arc(0, 0, h.r * k, 0, TAU); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
  } else if (h.kind === 'nest'){
    shadow(h.x, h.y + 10, 36);
    ctx.drawImage(SPR.nest, h.x - 39, h.y - 14, 78, 36);
    if (!h.used && !hasPet('dragon')){
      const k = h.prog / 720, wob = Math.sin(tick * (0.2 + k * 0.6)) * k * 0.35;
      ctx.save(); ctx.translate(h.x, h.y - 6); ctx.rotate(wob); ctx.drawImage(SPR.egg, -15, -34, 30, 35); ctx.restore();
      if (h.prog > 0){ ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(h.x, h.y, 56, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.stroke(); }
    }
  } else if (h.kind === 'altar'){
    if (!h.used){ ctx.globalAlpha = 0.3 + 0.15 * Math.sin(tick * 0.08); ctx.drawImage(glow('#ffd25a'), h.x - 70, h.y - 70, 140, 140); ctx.globalAlpha = 1; }
    shadow(h.x, h.y + 8, 34);
    ctx.globalAlpha = h.used ? 0.5 : 1;
    ctx.drawImage(SPR.altar, h.x - 36, h.y - 24, 72, 42);
    if (!h.used){
      const gy = h.y - 44 + Math.sin(tick * 0.07) * 4;
      ctx.drawImage(SPR.gem, h.x - 12, gy, 24, 34);
      if (h.prog > 0){ ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 12, -Math.PI / 2, -Math.PI / 2 + h.prog / 110 * TAU); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  } else if (h.kind === 'shrine'){
    if (!h.used){ ctx.globalAlpha = 0.3 + 0.15 * Math.sin(tick * 0.08); ctx.drawImage(glow('#ff6fa8'), h.x - 70, h.y - 70, 140, 140); ctx.globalAlpha = 1; }
    shadow(h.x, h.y + 8, 34);
    ctx.globalAlpha = h.used ? 0.5 : 1;
    ctx.drawImage(SPR.shrine, h.x - 36, h.y - 24, 72, 42);
    if (!h.used){
      const k = h.prog / SHRINE_T, s = 1 + Math.sin(tick * (0.1 + k * 0.3)) * (0.06 + k * 0.1);
      ctx.drawImage(SPR.heart, h.x - 16.5 * s, h.y - 56 + Math.sin(tick * 0.07) * 4, 33 * s, 30 * s);
      if (h.prog > 0){ ctx.strokeStyle = '#ff6fa8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 12, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
}
function drawSolid(s){
  const w = s.img.width * BSCALE, h = s.img.height * BSCALE;
  // если маг зашёл за постройку — она становится полупрозрачной
  const behind = player.y < s.y && player.y > s.y - h && Math.abs(player.x - s.x) < w / 2;
  s.fade += ((behind ? 0.45 : 1) - s.fade) * 0.15;
  if (s.hitT > 0) s.hitT--;
  const wob = s.hitT ? Math.sin(s.hitT * 2.2) * s.hitT * 0.5 : 0;
  shadow(s.x, s.y - 4, w * 0.42);
  ctx.globalAlpha = s.fade;
  const left = s.x - w / 2 + wob, top = s.y - h + 6;
  ctx.drawImage(s.hitT > 5 ? tinted(s.img, '#ffffff', 0.4) : s.img, left, top, w, h);
  const dmg = 1 - s.hp / s.maxHp;
  if (dmg > 0.12){
    ctx.strokeStyle = '#0b0618'; ctx.lineWidth = 3; ctx.lineJoin = 'miter';
    const n = Math.min(4, Math.ceil(dmg * 4.5));
    for (let k = 0; k < n; k++){
      const c = s.cracks[k];
      ctx.beginPath(); ctx.moveTo(left + c[0][0], top + c[0][1]);
      for (let j = 1; j < c.length; j++) ctx.lineTo(left + c[j][0], top + c[j][1]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
function drawEnemy(e){
  const T = ETYPES[e.type], sc = T.sc * e.r / T.r;
  let img;
  if (e.static) img = crystalSpr(e.color);
  else {
    const fr = SPR[e.type], spd = e.type === 'runner' ? 0.25 : e.boss ? 0.06 : 0.1;
    img = fr[Math.floor(tick * spd + e.wob * 3) % fr.length];
  }
  const w = img.width * sc, h = img.height * sc;
  const float = e.type === 'shooter' || e.type === 'runner' || e.type === 'wasp' ? Math.sin(tick * 0.08 + e.wob) * 3 - 8
              : e.type === 'lich' || e.type === 'reaper' || e.type === 'queen' || e.type === 'clock' ? Math.sin(tick * 0.06 + e.wob) * 5 - 14 : -(e.hop || 0);
  shadow(e.x, e.y + e.r * 0.75, w * 0.36);
  if (e.elite){ ctx.globalAlpha = 0.5 + 0.2 * Math.sin(tick * 0.2); ctx.drawImage(glow('#ffd25a'), e.x - w * 0.8, e.y - h * 0.8 + float, w * 1.6, h * 1.6); ctx.globalAlpha = 1; }
  if (e.flash > 0 || (e.fuse > 0 && e.fuse % 8 < 4)) img = tinted(img, e.fuse > 0 ? '#ff3d3d' : '#ffffff', 0.85);
  else if (e.charge) img = tinted(img, '#ff3d3d', 0.25 + 0.2 * Math.sin(tick * 0.5));
  else if (e.slow > 0 || e.iceT > 0) img = tinted(img, '#8fe8ff', 0.45);
  else if (e.wet > 0) img = tinted(img, '#4aa8ff', 0.3);
  else if (moonT > 0 && e.type !== 'goblin' && !e.static) img = tinted(img, '#ff1a3a', 0.35);
  else if (e.wild) img = tinted(img, '#9dff9a', 0.28);
  else if (e.acid > 0) img = tinted(img, '#c6ff3a', 0.1 + e.acid * 0.03);
  else if (goldT > 0 && !e.static) img = tinted(img, '#ffd700', 0.28);
  const flip = !e.static && (e.type === 'goblin' ? player.x > e.x : player.x < e.x);
  ctx.save(); ctx.translate(e.x, e.y + float);
  if (flip) ctx.scale(-1, 1);
  if (e.fly > 0) ctx.rotate(e.fly * 0.5); // «Бильярд»: враг кувыркается в полёте
  if (e.type === 'reaper') ctx.globalAlpha = 0.75 + 0.2 * Math.sin(tick * 0.1);
  ctx.drawImage(img, -w / 2, -h / 2 - (e.static ? 6 : 0), w, h);
  ctx.restore();
  ctx.globalAlpha = 1;
  // оглушение — звёздочки над головой; дикий зверь — лапка и кольцо приручения
  if (e.stunT > 0 || e.stun > 0)
    for (let k = 0; k < 3; k++){ const a = tick * 0.15 + k * TAU / 3; ctx.fillStyle = '#ffe95a'; ctx.fillRect(e.x + Math.cos(a) * e.r * 0.8 - 2, e.y - h / 2 - 6 + Math.sin(a) * 4 + float, 4, 4); }
  if (e.wild){
    ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🐾', e.x, e.y - h / 2 - 22 + float);
    if (e.stun > 0){
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 16, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 16, -Math.PI / 2, -Math.PI / 2 + e.tame / 180 * TAU); ctx.stroke();
    }
  }
  if (e.debt){
    // монетка над головой растёт вместе с долгом
    const k = Math.min(1, e.debt.sum / Math.max(1, e.maxHp)), y = e.y - h / 2 - 16 + float + Math.sin(tick * 0.2) * 2;
    ctx.font = `${Math.round(12 + k * 10)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🪙', e.x, y);
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 8, -Math.PI / 2, -Math.PI / 2 + e.debt.t / 180 * TAU); ctx.stroke();
  }
  if (e.mark > 0){ ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  if (e.hp < e.maxHp && (e.type === 'brute' || e.type === 'shield' || e.boss || e.type === 'shooter' || e.type === 'goblin' || e.elite || e.static || e.wild)){
    const bw = Math.max(30, e.r * 2), y = e.y - h / 2 - 10 + float;
    ctx.fillStyle = '#0b0618'; ctx.fillRect(e.x - bw / 2 - 2, y - 2, bw + 4, 8);
    ctx.fillStyle = '#3a1a2a'; ctx.fillRect(e.x - bw / 2, y, bw, 4);
    ctx.fillStyle = e.boss ? '#ff3d5a' : e.color; ctx.fillRect(e.x - bw / 2, y, bw * Math.max(0, e.hp / e.maxHp), 4);
  }
}
function drawPet(p){
  const fly = p.id === 'dragon' || p.id === 'phoenix' || p.id === 'owl';
  const fr = SPR.pet[p.id], img = fr[Math.floor(tick * (fly ? 0.15 : 0.08) + p.id.length) % fr.length];
  const sc = p.id === 'guard' ? 1.3 : p.id === 'healer' ? 1.4 : 2, w = img.width * sc, h = img.height * sc;
  const bob = fly ? Math.sin(tick * 0.08 + p.id.length) * 4 - 26 : 0;
  shadow(p.x, p.y + 8, w * 0.3);
  if (p.id === 'phoenix' || p.id === 'dragon'){
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45;
    ctx.drawImage(glow(p.id === 'phoenix' ? '#ff7a2e' : '#8fe08a'), p.x - w * 0.7, p.y + bob - h * 0.7, w * 1.4, h * 1.4);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  ctx.save(); ctx.translate(p.x, p.y + bob - h / 2 + 8);
  if (p.vx < -0.2) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function drawToad(T){
  const k = T.hop > 0 ? 1 - T.hop / 22 : 0, up = Math.sin(k * Math.PI) * 26;
  shadow(T.x, T.y + 10, 16);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.2 * Math.sin(tick * 0.2);
  ctx.drawImage(glow('#ffd700'), T.x - 34, T.y - 40 - up, 68, 68);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(SPR.pet.toad[T.hop > 0 ? 1 : 0], T.x - 18, T.y - 22 - up, 36, 28);
}
function drawSaw(p){
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5;
  ctx.drawImage(glow(p.color), p.x - p.r * 2.2, p.y - p.r * 2.2, p.r * 4.4, p.r * 4.4);
  ctx.globalAlpha = Math.min(1, p.life / 20); ctx.globalCompositeOperation = 'source-over';
  shadow(p.x, p.y + p.r, p.r);
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
  for (const [col, pad] of [['#0b0618', 3], ['#d8dee8', 0]]){
    ctx.fillStyle = col; ctx.beginPath();
    for (let k = 0; k <= 20; k++){ const a = k / 20 * TAU, rr = (k % 2 ? p.r : p.r * 0.8) + pad; k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.fill();
  }
  ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.38, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0b0618'; ctx.fillRect(-2, -2, 4, 4);
  ctx.restore(); ctx.globalAlpha = 1;
}
// новые формы: что лежит на земле (рисуется под всеми) и что стоит (сортируется по глубине)
const GROUND_KINDS = new Set(['puff', 'sigil', 'seed']), STAND_KINDS = new Set(['prism', 'bait', 'shade']);
function drawGroundProj(p){
  const fade = Math.min(1, p.life / 30, (p.max - p.life) / 10 + 0.2);
  if (p.kind === 'puff'){
    const c = p.color === PURE ? '#a07bff' : p.color;
    ctx.globalAlpha = 0.45 * fade; ctx.drawImage(glow(c), p.x - p.r * 1.5, p.y - p.r * 1.1, p.r * 3, p.r * 2.2);
    ctx.globalAlpha = 0.3 * fade; ctx.fillStyle = '#1a0a2a'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 0.8, p.r * 0.5, 0, 0, TAU); ctx.fill();
  } else if (p.kind === 'sigil'){
    const c = p.color === PURE ? '#ffe08a' : p.color, inside = player.inSigil;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.55);
    ctx.globalAlpha = fade * (inside ? 0.5 : 0.25); ctx.drawImage(glow(c), -p.r * 1.2, -p.r * 1.2, p.r * 2.4, p.r * 2.4);
    ctx.globalAlpha = fade; ctx.strokeStyle = c; ctx.lineWidth = inside ? 5 : 3;
    ctx.beginPath(); ctx.arc(0, 0, p.r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, p.r * 0.82, 0, TAU); ctx.stroke();
    ctx.rotate(p.spin);
    for (const off of [0, Math.PI]){ ctx.beginPath(); for (let k = 0; k <= 3; k++){ const a = off + k * TAU / 3; ctx.lineTo(Math.cos(a) * p.r * 0.8, Math.sin(a) * p.r * 0.8); } ctx.stroke(); }
    for (let k = 0; k < 12; k++){ const a = k * TAU / 12; ctx.fillStyle = k % 2 ? '#ffffff' : c; ctx.fillRect(Math.cos(a) * p.r * 0.91 - 3, Math.sin(a) * p.r * 0.91 - 3, 6, 6); }
    ctx.restore(); ctx.globalAlpha = 1;
  } else if (p.kind === 'seed'){
    // росток растёт с каждым убийством рядом, к концу набухает бутон
    const h = 14 + p.stage * 3, bounce = p.grow ? Math.sin(p.grow) * 4 : 0, ripe = 1 - p.life / p.max;
    ctx.globalAlpha = 0.18; ctx.strokeStyle = '#9dff7a'; ctx.lineWidth = 2; ctx.setLineDash([6, 10]);
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 170, 170 * 0.55, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.25 + ripe * 0.5; ctx.drawImage(glow('#9dff7a'), p.x - 30 - p.stage * 2, p.y - 30 - p.stage * 2, 60 + p.stage * 4, 60 + p.stage * 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 16, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#0b0618'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - h - bounce); ctx.stroke();
    ctx.strokeStyle = '#5ac83a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - h - bounce); ctx.stroke();
    for (let k = 0; k < Math.min(4, 1 + (p.stage >> 2)); k++){
      const y = p.y - 7 - k * h / 4, sd = k % 2 ? 1 : -1;
      ctx.fillStyle = '#0b0618'; ctx.beginPath(); ctx.ellipse(p.x + sd * 9, y, 10, 5, sd * 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7dff5a'; ctx.beginPath(); ctx.ellipse(p.x + sd * 9, y, 8, 3.5, sd * 0.5, 0, TAU); ctx.fill();
    }
    const bud = 6 + p.stage * 0.8 + ripe * 5;
    ctx.fillStyle = '#0b0618'; ctx.beginPath(); ctx.arc(p.x, p.y - h - bounce, bud + 2, 0, TAU); ctx.fill();
    ctx.fillStyle = p.stage >= 6 ? '#ff9ff3' : '#9dff7a'; ctx.beginPath(); ctx.arc(p.x, p.y - h - bounce, bud, 0, TAU); ctx.fill();
    if (p.stage) drawText('×' + p.stage, p.x, p.y + 14, 11, '#9dff7a');
  }
  ctx.globalAlpha = 1;
}
function drawStandProj(p){
  const fade = Math.min(1, p.life / 30);
  if (p.kind === 'prism'){
    const y = p.y - 34 + Math.sin(tick * 0.06) * 4;
    ctx.globalAlpha = fade * 0.15; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    shadow(p.x, p.y + 4, 16);
    ctx.globalCompositeOperation = 'lighter';
    for (const [c, k] of [['#ff7ad8', 0], ['#7fe8ff', 2.1], ['#ffe08a', 4.2]]){
      ctx.globalAlpha = fade * 0.5; ctx.drawImage(glow(c), p.x + Math.cos(tick * 0.04 + k) * 10 - 34, y + Math.sin(tick * 0.04 + k) * 6 - 34, 68, 68);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = fade;
    const w = 13 * Math.abs(Math.cos(p.spin)) + 5;
    for (const [pad, col] of [[3, '#0e0820'], [0, '#e8fbff']]){
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(p.x, y - 24 - pad); ctx.lineTo(p.x + w + pad, y); ctx.lineTo(p.x, y + 24 + pad); ctx.lineTo(p.x - w - pad, y); ctx.fill();
    }
    ctx.fillStyle = '#7fe8ff'; ctx.beginPath(); ctx.moveTo(p.x, y - 24); ctx.lineTo(p.x + w, y); ctx.lineTo(p.x, y + 24); ctx.fill();
    ctx.fillStyle = 'rgba(255,122,216,.6)'; ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x + w, y); ctx.lineTo(p.x, y + 24); ctx.fill();
  } else if (p.kind === 'bait'){
    const k = 1 - p.life / p.max, wob = Math.sin(tick * (0.15 + k * 0.5)) * k * 0.2;
    ctx.globalAlpha = 0.18; ctx.strokeStyle = '#ff9ff3'; ctx.lineWidth = 2; ctx.setLineDash([4, 10]);
    ctx.beginPath(); ctx.arc(p.x, p.y, p.boomR, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    shadow(p.x, p.y + 4, 14);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(wob);
    ctx.fillStyle = '#0e0820'; ctx.fillRect(-3, -30, 6, 32); ctx.fillStyle = '#f4ecd8'; ctx.fillRect(-1.5, -30, 3, 30);
    ctx.fillStyle = '#0e0820'; ctx.beginPath(); ctx.arc(0, -40, 17, 0, TAU); ctx.fill();
    for (let j = 0; j < 4; j++){ ctx.fillStyle = ['#ff4f8b', '#ffffff', '#7fe8ff', '#ffffff'][j]; ctx.beginPath(); ctx.arc(0, -40, 15, j * Math.PI / 2 + tick * 0.1, (j + 1) * Math.PI / 2 + tick * 0.1); ctx.lineTo(0, -40); ctx.fill(); }
    ctx.restore();
  } else if (p.kind === 'shade'){
    const appear = Math.min(1, (p.max - p.life) / 50);
    const img = SPR.mage[Math.floor(tick * 0.18) % 4], sc = 2, w = img.width * sc, h = img.height * sc;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 * fade * appear;
    ctx.drawImage(glow(p.color === PURE ? '#7a4bff' : p.color), p.x - w, p.y - h, w * 2, h * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.8 * fade * appear;
    ctx.drawImage(tinted(img, '#7a5cff', 0.65), p.x - w / 2, p.y - h / 2, w, h);
  }
  ctx.globalAlpha = 1;
}
// стрелки на краю экрана к целям питомцев, которые сейчас за кадром
function drawIndicators(){
  const tg = [];
  for (const e of enemies) if (e.wild) tg.push([e.x, e.y, '🐾']);
  if (toad) tg.push([toad.x, toad.y, '🐸']);
  for (const g of gems) if (g.chain) tg.push([g.x, g.y, '🔗']);
  for (const h of nearProps) if (h.kind === 'nest' && !h.used && !hasPet('dragon')) tg.push([h.x, h.y, '🥚']);
  for (const s of nearSolids) if (s.type === 'owltree' && !s.used && !hasPet('owl')) tg.push([s.x, s.y - 60, '🦉']);
  for (const [x, y, icon] of tg){
    const sx = x - cam.x + W / 2, sy = y - cam.y + H / 2;
    if (sx > 0 && sx < W && sy > 0 && sy < H) continue;
    const dx = sx - W / 2, dy = sy - H / 2, m = 50;
    const k = Math.min((W / 2 - m) / Math.abs(dx || 1), (H / 2 - m) / Math.abs(dy || 1));
    const px = W / 2 + dx * k, py = H / 2 + dy * k, a = Math.atan2(dy, dx);
    ctx.fillStyle = 'rgba(11,6,24,.85)'; ctx.beginPath(); ctx.arc(px, py, 19, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(px + Math.cos(a) * 26, py + Math.sin(a) * 26); ctx.rotate(a);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -7); ctx.lineTo(-4, 7); ctx.fill();
    ctx.restore();
    ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, px, py + 1);
  }
}
function drawFam(o){
  const bob = Math.sin(tick * 0.2 + o.ang * 3) * 3, s = o.r / 10;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6;
  ctx.drawImage(glow(o.color), o.x - 24 * s, o.y - 26 * s + bob, 48 * s, 48 * s);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, o.life / 30);
  shadow(o.x, o.y + 18 * s, 10 * s);
  ctx.save(); ctx.translate(o.x, o.y + bob);
  if (o.mode === 'dash' && o.tgt && o.tgt.x < o.x) ctx.scale(-1, 1);
  ctx.drawImage(o.color === PURE ? SPR.ghost : tinted(SPR.ghost, o.color, 0.45), -14 * s, -18 * s, 28 * s, 32 * s);
  ctx.restore(); ctx.globalAlpha = 1;
}
function drawPlayer(){
  const P = player, sc = 2 * P.r / 14;
  if (P.inv > 0 && P.dash <= 0 && Math.floor(P.inv / 4) % 2) return;
  const moving = Math.hypot(P.vx, P.vy) > 0.6;
  const img = SPR.mage[moving ? Math.floor(tick * 0.18) % 4 : 0];
  const w = img.width * sc, h = img.height * sc, bob = moving ? 0 : Math.sin(tick * 0.08) * 1.5;
  const flip = Math.cos(P.face) < 0;
  trailDraw(ctx, mageTrail, sc);
  shadow(P.x, P.y + h * 0.42, w * 0.38);
  for (const a of lookAuras(LOOK)){ ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + 0.1 * Math.sin(tick * 0.1); ctx.drawImage(glow(a), P.x - w * 0.9, P.y - h * 0.8, w * 1.8, h * 1.6); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // свечение посоха
  const orbX = P.x + (flip ? -1 : 1) * (18.5 - 11) * sc, orbY = P.y - h / 2 + 6 * sc + bob;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.55 + 0.15 * Math.sin(tick * 0.15); ctx.drawImage(glow(staffGlow(LOOK)), orbX - 26 * sc / 2, orbY - 26 * sc / 2, 26 * sc, 26 * sc);
  ctx.globalAlpha = 0.35; ctx.drawImage(glow('#9b7bff'), P.x - w, P.y - h * 0.7, w * 2, h * 1.4);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (P.shield){
    ctx.strokeStyle = `rgba(159,232,255,${0.55 + 0.25 * Math.sin(tick * 0.2)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(P.x, P.y, P.r * 2.1, 0, TAU); ctx.stroke();
  }
  ctx.save(); ctx.translate(P.x, P.y + bob);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(P.inv > 0 && P.dash <= 0 ? tinted(img, '#ff3d6e', 0.35) : img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function drawDarkness(ox, oy){
  if (!dark.width || !dark.height) return;
  dctx.setTransform(1, 0, 0, 1, 0, 0);
  dctx.globalCompositeOperation = 'source-over';
  dctx.fillStyle = 'rgba(0,0,0,0.94)'; dctx.fillRect(0, 0, dark.width, dark.height);
  dctx.globalCompositeOperation = 'destination-out';
  const L = glow('#ffffff'), sx = x => (x - cam.x + W / 2 + ox) * SCALE, sy = y => (y - cam.y + H / 2 + oy) * SCALE;
  const light = (x, y, r) => dctx.drawImage(L, sx(x) - r * SCALE, sy(y) - r * SCALE, r * 2 * SCALE, r * 2 * SCALE);
  light(player.x, player.y, 240);
  for (let i = 0; i < projs.length; i += Math.max(1, projs.length / 120 | 0)) light(projs[i].x, projs[i].y, 60);
  for (const p of particles) if (p.ring) light(p.x, p.y, p.r * 1.4);
  for (const b of beams) light((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2, 160);
  for (const h of nearProps) if (h.kind === 'lava' || h.kind === 'altar' || h.kind === 'shrine' || h.kind === 'resonator') light(h.x, h.y, h.kind === 'lava' ? h.r * 1.3 : 70);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(dark, 0, 0);
  // в темноте видны только злые глазки
  ctx.setTransform(SCALE, 0, 0, SCALE, SCALE * (W / 2 - cam.x + ox), SCALE * (H / 2 - cam.y + oy));
  ctx.fillStyle = '#ff3d5a';
  for (const e of enemies){
    if (e.static) continue;
    for (const s of [-1, 1]) ctx.fillRect(e.x + s * e.r * 0.35 - 2, e.y - e.r * 0.2 - 2, 4, 4);
  }
}
// дождь/снег/буря рисуются поверх мира в экранных координатах
function drawWeather(){
  const T = weather.type;
  if (T === 'rain' || T === 'storm'){
    ctx.fillStyle = T === 'storm' ? 'rgba(10,15,40,.28)' : 'rgba(20,30,60,.15)'; ctx.fillRect(0, 0, W, H);
    const snow = RUN.biome === 'ice', n = T === 'storm' ? 220 : 140;
    ctx.strokeStyle = snow ? 'rgba(235,245,255,.75)' : 'rgba(170,200,255,.38)'; ctx.lineWidth = snow ? 3 : 2;
    ctx.beginPath();
    for (let i = 0; i < n; i++){
      const x = ((i * 137.7 + tick * (snow ? 1.2 : 3)) % (W + 120)) - 60;
      const y = ((i * 71.9 + tick * (snow ? 2.2 : 16) * (0.8 + (i % 5) * 0.1)) % (H + 60)) - 30;
      if (snow){ ctx.moveTo(x, y); ctx.lineTo(x + 1, y + 1); } else { ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); }
    }
    ctx.stroke();
  } else if (T === 'gale'){ ctx.fillStyle = 'rgba(120,110,90,.1)'; ctx.fillRect(0, 0, W, H); }
  if (flash > 0){ ctx.fillStyle = `rgba(235,240,255,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
}
function drawText(text, x, y, size, color, align){
  size = Math.round(size * TXT); ctx.font = `700 ${size}px ${FONT}`; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 4); ctx.strokeStyle = '#0b0618'; ctx.lineJoin = 'round';
  const mw = W - 24; // длинный баннер на узком экране сжимается, а не обрезается
  ctx.strokeText(text, x, y, mw); ctx.fillStyle = color; ctx.fillText(text, x, y, mw);
}
function render(){
  const B = BIOMES[RUN.biome];
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = B.bg; ctx.fillRect(0, 0, W, H);
  const sh = Math.min(shake, 10) * SHAKE_MUL[SET.shake];
  const ox = sh ? rnd(-sh, sh) : 0, oy = sh ? rnd(-sh, sh) : 0;
  ctx.setTransform(SCALE, 0, 0, SCALE, SCALE * (W / 2 - cam.x + ox), SCALE * (H / 2 - cam.y + oy));
  drawGround();

  const vis = (x, y, m) => Math.abs(x - cam.x) < W / 2 + m && Math.abs(y - cam.y) < H / 2 + m;
  for (const h of nearProps) if (vis(h.x, h.y, h.kind === 'resonator' ? RESO_LEN : 250)) drawProp(h);
  for (const p of projs) if (GROUND_KINDS.has(p.kind) && vis(p.x, p.y, 200)) drawGroundProj(p);
  for (const d of puddles){
    ctx.globalAlpha = Math.min(1, d.t / 40) * 0.35;
    ctx.drawImage(glow('#7dff5a'), d.x - d.r * 1.4, d.y - d.r * 1.4, d.r * 2.8, d.r * 2.8);
  }
  ctx.globalAlpha = 1;
  for (const g of gems){
    if (g.kind === 'feather'){
      ctx.globalAlpha = 0.6; ctx.drawImage(glow('#ff7a2e'), g.x - 26, g.y - 26, 52, 52); ctx.globalAlpha = 1;
      ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪶', g.x, g.y + Math.sin(tick * 0.1) * 4);
      continue;
    }
    if (g.chain){
      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.15), y = g.y + Math.sin(tick * 0.1) * 3;
      // столб света до неба
      const beam = ctx.createLinearGradient(0, g.y - 220, 0, g.y);
      beam.addColorStop(0, 'rgba(127,232,255,0)'); beam.addColorStop(1, `rgba(127,232,255,${0.45 + 0.3 * pulse})`);
      ctx.fillStyle = beam; ctx.fillRect(g.x - 13 - 4 * pulse, g.y - 220, 26 + 8 * pulse, 220);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.3 * pulse})`; ctx.fillRect(g.x - 3, g.y - 200, 6, 200);
      ctx.globalAlpha = 0.6 + 0.3 * pulse;
      ctx.drawImage(glow('#7fe8ff'), g.x - 40, y - 40, 80, 80);
      ctx.globalAlpha = 1;
      // кольцо из звеньев крутится вокруг руны
      for (let k = 0; k < 8; k++){
        const a = tick * 0.06 + k * TAU / 8, lx = g.x + Math.cos(a) * 24, ly = y + Math.sin(a) * 24 * 0.55;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(a + Math.PI / 2);
        ctx.strokeStyle = k % 2 ? '#ffe08a' : '#7fe8ff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
      ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔗', g.x, y);
      continue;
    }
    if (g.kind === 'heart' || g.kind === 'rune'){
      if (g.kind === 'rune'){ ctx.globalAlpha = 0.5; ctx.drawImage(glow('#ffd25a'), g.x - 22, g.y - 22, 44, 44); ctx.globalAlpha = 1; }
      ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(g.kind === 'heart' ? '❤️' : RUNES[g.r].icon, g.x, g.y + Math.sin(tick * 0.1 + g.x) * 3);
      continue;
    }
    const s = g.kind === 'big' ? 7 : 5, c = g.kind === 'big' ? '#c48bff' : '#5ee0ff', l = g.kind === 'big' ? '#ead2ff' : '#d4f8ff';
    ctx.fillStyle = '#0b0618'; ctx.fillRect(g.x - s * 0.7 - 2, g.y - s - 2, s * 1.4 + 4, s * 2 + 4);
    ctx.fillStyle = c; ctx.fillRect(g.x - s * 0.7, g.y - s, s * 1.4, s * 2);
    ctx.fillStyle = l; ctx.fillRect(g.x - s * 0.7, g.y - s, s * 0.6, s * 0.8);
  }
  for (const m of meteors){
    const k = m.t / m.max;
    ctx.strokeStyle = m.env ? '#ff3d3d' : m.color; ctx.globalAlpha = 0.5 * (1 - k) + 0.2; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.arc(m.x, m.y, m.rad, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    if (m.env){ ctx.fillStyle = 'rgba(255,60,60,.08)'; ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  for (const h of holes){
    const k = Math.min(1, (90 - h.t) / 12, h.t / 10), r = h.r * 0.3 * k;
    ctx.save(); ctx.translate(h.x, h.y);
    ctx.globalAlpha = 0.5 * k; ctx.drawImage(glow(h.color), -h.r, -h.r, h.r * 2, h.r * 2);
    ctx.globalAlpha = k; ctx.rotate(tick * 0.15);
    ctx.strokeStyle = h.color; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffe0c0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r + 1.5, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // всё, что стоит на земле, рисуем по глубине: кто ниже на экране — тот ближе
  const list = [];
  for (const s of nearSolids) if (vis(s.x, s.y - 60, 220)) list.push([s.y, 0, s]);
  for (const e of enemies) if (vis(e.x, e.y, 120)) list.push([e.y + e.r * 0.75, 1, e]);
  for (const p of projs){
    if (STAND_KINDS.has(p.kind)) list.push([p.y + 6, 8, p]);
    else if (p.kind === 'turret') list.push([p.y, 2, p]);
    else if (p.kind === 'fam') list.push([p.y + 10, 4, p]);
    else if (p.kind === 'saw') list.push([p.y + p.r, 5, p]);
  }
  for (const p of pets) list.push([p.y + 8, 6, p]);
  if (toad) list.push([toad.y + 10, 7, toad]);
  list.push([player.y + player.r * 0.8, 3, player]);
  list.sort((a, b) => a[0] - b[0]);
  for (const [, t, o] of list){
    if (t === 0) drawSolid(o);
    else if (t === 1) drawEnemy(o);
    else if (t === 2){
      shadow(o.x, o.y + 4, 20);
      ctx.globalAlpha = Math.min(1, o.life / 30);
      ctx.drawImage(SPR.turret, o.x - 24, o.y - 60, 48, 66);
      ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow(o.color), o.x - 18, o.y - 52, 36, 36); ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    else if (t === 4) drawFam(o);
    else if (t === 5) drawSaw(o);
    else if (t === 6) drawPet(o);
    else if (t === 7) drawToad(o);
    else if (t === 8) drawStandProj(o);
    else drawPlayer();
  }
  for (const b of ebullets){
    if (b.wait > 0 && tick % 10 < 5) continue; // застывшие пули Часовщика мигают
    ctx.globalAlpha = 0.7; ctx.drawImage(glow(b.c || '#ff3d6e'), b.x - 14, b.y - 14, 28, 28); ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b0618'; ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
    ctx.fillStyle = '#ffd0dc'; ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
  }
  for (const p of particles) if (p.debris){
    ctx.globalAlpha = Math.min(1, p.life / 15);
    ctx.fillStyle = '#0b0618'; ctx.fillRect(p.x - p.r / 2 - 1.5, p.y - p.r / 2 - 1.5, p.r + 3, p.r + 3);
    ctx.fillStyle = p.color; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
  } else if (p.spike){
    // шип быстро вырастает из земли и уходит обратно
    const k = Math.min(1, (p.max - p.life) / 4) * Math.min(1, p.life / 8), h = p.h * k;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b0618'; ctx.beginPath(); ctx.moveTo(p.x - p.w - 2, p.y + 2); ctx.lineTo(p.x, p.y - h - 3); ctx.lineTo(p.x + p.w + 2, p.y + 2); ctx.fill();
    ctx.fillStyle = '#cfc4b0'; ctx.beginPath(); ctx.moveTo(p.x - p.w, p.y); ctx.lineTo(p.x, p.y - h); ctx.lineTo(p.x + p.w, p.y); ctx.fill();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(p.x - p.w * 0.35, p.y - h * 0.65); ctx.lineTo(p.x, p.y - h); ctx.lineTo(p.x + p.w * 0.35, p.y - h * 0.65); ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = 'lighter';
  // чем больше всего на экране, тем слабее свечение каждой частицы — иначе всё выгорает в белое
  const dens = clamp(420 / (particles.length + projs.length * 2 + 1), 0.18, 1);
  for (const a of amb){
    if (a.streak){
      ctx.globalAlpha = 0.4 * a.life / a.max; ctx.strokeStyle = a.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - a.vx * 3, a.y - a.vy * 3); ctx.stroke();
      continue;
    }
    ctx.globalAlpha = Math.min(1, a.life / 30, (a.max - a.life) / 20) * (a.snow ? 0.7 : 0.5);
    const r = a.r * 3; ctx.drawImage(glow(a.color), a.x - r, a.y - r, r * 2, r * 2);
  }
  for (const p of particles){
    if (p.debris || p.spike) continue;
    const a = p.life / p.max;
    if (p.ring){
      ctx.strokeStyle = p.color; ctx.globalAlpha = a * Math.max(dens, 0.4); ctx.lineWidth = 3 * a + 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.15 - a * 0.4), 0, TAU); ctx.stroke();
      continue;
    }
    ctx.globalAlpha = a * 0.7 * dens; const r = p.r * 3;
    ctx.drawImage(glow(p.color), p.x - r, p.y - r, r * 2, r * 2);
  }
  for (const p of projs){
    if (p.kind === 'turret' || p.kind === 'fam' || p.kind === 'saw' || p.kind === 'spikes' || GROUND_KINDS.has(p.kind) || STAND_KINDS.has(p.kind)) continue;
    if (p.kind === 'wave'){
      const a = p.life / p.max;
      ctx.strokeStyle = p.color; ctx.globalAlpha = 0.7 * a + 0.2; ctx.lineWidth = 10 * a + 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.rr), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      continue;
    }
    if (p.kind === 'tornado'){
      ctx.globalAlpha = 0.25 + 0.2 * dens;
      ctx.drawImage(glow(p.color), p.x - p.r * 1.6, p.y - p.r * 1.6, p.r * 3.2, p.r * 3.2);
      ctx.strokeStyle = p.color; ctx.lineWidth = 3;
      for (let k = 0; k < 4; k++){
        const yy = p.y - k * 12, rr = p.r * (0.35 + k * 0.22);
        ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(p.x + Math.sin(p.spin + k) * 6, yy, rr, rr * 0.3, 0, p.spin * 3 + k, p.spin * 3 + k + 4.5); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      continue;
    }
    if (p.card){
      // карта крутится в полёте, масть видно издалека
      const S = SUITS[p.card], s = p.r / 6;
      ctx.globalAlpha = 0.3 + 0.4 * dens; ctx.drawImage(glow(S.c), p.x - 18 * s, p.y - 18 * s, 36 * s, 36 * s);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin + tick * 0.25);
      ctx.fillStyle = '#0b0618'; ctx.fillRect(-7 * s, -10 * s, 14 * s, 20 * s);
      ctx.fillStyle = '#fbf6ff'; ctx.fillRect(-6 * s, -9 * s, 12 * s, 18 * s);
      ctx.fillStyle = p.card === 'spade' || p.card === 'club' ? '#1a1430' : S.c;
      ctx.font = `${Math.round(14 * s)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.g, 0, 1);
      ctx.restore(); ctx.globalCompositeOperation = 'lighter';
      continue;
    }
    const r = p.r * 3.2;
    ctx.globalAlpha = 0.35 + 0.5 * dens;
    ctx.drawImage(glow(p.color), p.x - r, p.y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    if (p.kind === 'boomer'){
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * p.size;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.8, 0, Math.PI * 0.9); ctx.stroke(); ctx.restore();
      continue;
    }
    if (p.lance){
      const sp = Math.hypot(p.vx, p.vy) || 1, L = p.r * 3.2;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(3, p.r * 0.6); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x - p.vx / sp * L, p.y - p.vy / sp * L); ctx.lineTo(p.x + p.vx / sp * L * 0.4, p.y + p.vy / sp * L * 0.4); ctx.stroke();
      continue;
    }
    if (p.billiard){
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#0b0618'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1430'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fbf6ff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.45, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1430'; ctx.font = `700 ${Math.round(p.r * 0.7)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('8', p.x, p.y + 1);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(p.x - p.r * 0.6, p.y - p.r * 0.6, p.r * 0.3, p.r * 0.3);
      ctx.globalCompositeOperation = 'lighter';
      continue;
    }
    if (p.kind === 'mine') ctx.globalAlpha = p.armed && tick % 20 < 10 ? 1 : 0.6;
    const cr = Math.max(2, p.r * 0.5);
    ctx.fillRect(p.x - cr, p.y - cr, cr * 2, cr * 2); ctx.globalAlpha = 1;
  }
  for (const m of meteors){
    if (m.geyser){
      // гейзер не падает с неба, а бурлит из-под земли
      const r = 14 * m.size * (1.6 - m.t / m.max);
      ctx.globalAlpha = 0.3 + 0.4 * dens; ctx.drawImage(glow(m.color), m.x - r * 3, m.y - r * 3, r * 6, r * 6); ctx.globalAlpha = 1;
      continue;
    }
    const k = m.t / m.max, mx = m.x - k * 260, my = m.y - k * 520, r = 18 * m.size;
    ctx.globalAlpha = 0.3 + 0.5 * dens;
    ctx.drawImage(glow(m.color), mx - r * 3, my - r * 3, r * 6, r * 6);
    ctx.strokeStyle = m.color; ctx.lineWidth = r * 0.9; ctx.lineCap = 'round'; ctx.globalAlpha = 0.25 + 0.25 * dens;
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx - 50, my - 100); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.fillRect(mx - r * 0.5, my - r * 0.5, r, r);
  }
  for (const b of beams){
    const a = b.life / 12;
    ctx.strokeStyle = b.color; ctx.lineCap = 'butt';
    ctx.globalAlpha = a * 0.5; ctx.lineWidth = b.w * 2.4 * a; ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.globalAlpha = a; ctx.lineWidth = Math.max(2, b.w * 0.5 * a); ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
  }
  for (const s of slashes){
    const a = s.life / 14, sweep = (1 - a) * 0.6;
    ctx.strokeStyle = s.color; ctx.globalAlpha = a * 0.8; ctx.lineWidth = 10 * a + 2; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.R * (0.75 + sweep * 0.3), s.a - 1.05 + sweep, s.a + 1.05 - sweep * 0.2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.R * (0.75 + sweep * 0.3), s.a - 0.9 + sweep, s.a + 0.9 - sweep * 0.2); ctx.stroke();
  }
  for (const T of ties){
    const a = Math.min(1, T.t / 30), mx = (T.a.x + T.b.x) / 2, my = (T.a.y + T.b.y) / 2 + Math.sin(tick * 0.12) * 8;
    const tc = T.src.color === PURE ? '#ff9ff3' : T.src.color;
    ctx.strokeStyle = tc; ctx.lineWidth = 8; ctx.globalAlpha = 0.55 * a;
    ctx.beginPath(); ctx.moveTo(T.a.x, T.a.y); ctx.quadraticCurveTo(mx, my, T.b.x, T.b.y); ctx.stroke();
    ctx.lineWidth = 3; ctx.globalAlpha = 0.9 * a;
    for (const o of [T.a, T.b]){ ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 6, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.globalAlpha = a;
    ctx.beginPath(); ctx.moveTo(T.a.x, T.a.y); ctx.quadraticCurveTo(mx, my, T.b.x, T.b.y); ctx.stroke();
    ctx.globalAlpha = a; ctx.drawImage(glow('#ff9ff3'), mx - 10, my / 2 + (T.a.y + T.b.y) / 4 - 10, 20, 20);
  }
  ctx.globalAlpha = 1;
  for (const z of zaps){
    ctx.strokeStyle = z.c || '#ffe95a'; ctx.globalAlpha = z.life / 10; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(z.x1, z.y1);
    for (let k = 1; k < 6; k++){ const t = k / 6; ctx.lineTo(z.x1 + (z.x2 - z.x1) * t + rnd(-9, 9), z.y1 + (z.y2 - z.y1) * t + rnd(-9, 9)); }
    ctx.lineTo(z.x2, z.y2); ctx.stroke();
  }
  for (const b of skyBolts){
    const a = b.life / 14;
    ctx.beginPath(); ctx.moveTo(b.x + 40, b.y - 700);
    for (let k = 1; k <= 10; k++){ const t = k / 10; ctx.lineTo(b.x + 40 * (1 - t) + (k < 10 ? Math.sin(b.seed * 50 + k * 7.3) * 22 : 0), b.y - 700 * (1 - t)); }
    ctx.strokeStyle = '#ffe95a'; ctx.globalAlpha = a * 0.6; ctx.lineWidth = 12; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = a; ctx.lineWidth = 4; ctx.stroke();
    ctx.globalAlpha = a * 0.7; ctx.drawImage(glow('#ffe95a'), b.x - 70, b.y - 70, 140, 140);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

  if (RUN.pact === 'dark') drawDarkness(ox, oy);

  for (const n of nums){
    ctx.globalAlpha = Math.min(1, n.t / 15);
    drawText(n.v, n.x, n.y, n.crit ? 18 : 14, n.color);
  }
  ctx.globalAlpha = 1;

  // экранный слой
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  if (moonT > 0){ ctx.fillStyle = `rgba(160,0,30,${0.12 + 0.04 * Math.sin(tick * 0.05)})`; ctx.fillRect(0, 0, W, H); }
  drawWeather();
  if (goldT > 0){ ctx.fillStyle = `rgba(255,190,40,${0.1 + 0.03 * Math.sin(tick * 0.06)})`; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  if (player.hp < player.maxHp * 0.3){ ctx.fillStyle = `rgba(255,30,60,${0.1 + Math.sin(tick * 0.15) * 0.05})`; ctx.fillRect(0, 0, W, H); }
  if (RUN.pact === 'wind'){
    ctx.save(); ctx.translate(W / 2, 40); ctx.rotate(Math.atan2(wind.y, wind.x));
    ctx.fillStyle = 'rgba(200,255,240,.6)'; ctx.fillRect(-12, -3, 18, 6); ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(4, -10); ctx.lineTo(4, 10); ctx.fill();
    ctx.restore();
  }
  drawIndicators();
  banners.forEach((b, i) => {
    ctx.globalAlpha = Math.min(1, b.t / 30);
    drawText(b.text, W / 2, H * 0.24 + i * 36 * TXT, 24, b.color);
  });
  ctx.globalAlpha = 1;
  // пиксельный прицел: на ПК под курсором, на телефоне — на цели автоприцела
  if (state === 'play' && (!TOUCH || autoTarget)){
    const [ax, ay] = aimWorld();
    const x = Math.round(TOUCH ? ax - cam.x + W / 2 : mouse.x), y = Math.round(TOUCH ? ay - cam.y + H / 2 : mouse.y);
    ctx.fillStyle = '#0b0618';
    for (const [dx, dy, w, h] of [[-11, -2, 8, 4], [3, -2, 8, 4], [-2, -11, 4, 8], [-2, 3, 4, 8]]) ctx.fillRect(x + dx - 1, y + dy - 1, w + 2, h + 2);
    ctx.fillStyle = '#ffe08a';
    for (const [dx, dy, w, h] of [[-10, -1, 6, 2], [4, -1, 6, 2], [-1, -10, 2, 6], [-1, 4, 2, 6]]) ctx.fillRect(x + dx, y + dy, w, h);
  }
}
