// ---------- мир: чанки, постройки, опасности ----------
const CHUNK = 720, BSCALE = 3;
function chunkRng(cx, cy){
  let s = (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663) ^ RUN.seed) >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function makeSolid(type, x, y){
  const C = BUILD[type].col, img = biomeSprites(RUN.biome).build[type];
  const col = C.c ? { shape: 'c', x, y: y - C.c * 0.4, r: C.c } : { shape: 'r', x, y: y - C.r[1] / 2, w: C.r[0], h: C.r[1] };
  const ext = C.c ? C.c : Math.hypot(C.r[0], C.r[1]) / 2;
  // трещины заранее: ломаные внутри спрайта, проявляются по мере урона
  const w = img.width * BSCALE, h = img.height * BSCALE;
  const cracks = [0, 1, 2, 3].map(() => {
    let cx = rnd(0.35, 0.65) * w, cy = rnd(0.3, 0.6) * h; const pts = [[cx, cy]];
    for (let k = 0; k < 4; k++){ cx += rnd(-12, 12); cy += rnd(4, 12); pts.push([cx, cy]); }
    return pts;
  });
  return { type, x, y, img, col, ext, fade: 1, hp: BUILD[type].hp, maxHp: BUILD[type].hp, hitT: 0, cracks };
}
// свободно ли место: не пересекается ли круг с постройками чанка
function freeSpot(list, x, y, r){
  for (const s of list) if (Math.hypot(s.col.x - x, s.col.y - y) < s.ext + r) return false;
  return true;
}
function genChunk(cx, cy){
  const R = chunkRng(cx, cy), x0 = cx * CHUNK, y0 = cy * CHUNK, ch = { props: [], details: [], solids: [] };
  chunks.set(cx + ',' + cy, ch);
  const set = BUILD_SETS[RUN.biome], total = set.reduce((s, b) => s + b[1], 0);
  const ns = 3 + (R() * 4 | 0);
  for (let k = 0; k < ns; k++){
    let w = R() * total, type = set[0][0];
    for (const [t, wt] of set){ if ((w -= wt) < 0){ type = t; break; } }
    for (let tr = 0; tr < 8; tr++){
      const x = x0 + 70 + R() * (CHUNK - 140), y = y0 + 70 + R() * (CHUNK - 140);
      if (Math.hypot(x, y) < 280) continue; // площадка вокруг старта всегда свободна
      const s = makeSolid(type, x, y);
      if (!freeSpot(ch.solids, s.col.x, s.col.y, s.ext + 70)) continue;
      ch.solids.push(s); break;
    }
  }
  const home = cx === 0 && cy === 0;
  const place = (r, tries) => {
    for (let t = 0; t < tries; t++){
      const x = x0 + R() * CHUNK, y = y0 + R() * CHUNK;
      if (freeSpot(ch.solids, x, y, r) && Math.hypot(x, y) > (home ? 220 : 0)) return [x, y];
    }
    return null;
  };
  const nh = home ? 0 : 1 + (R() * 2 | 0);
  for (let k = 0; k < nh; k++){
    const r = 60 + R() * 60, p = place(r + 20, 8);
    if (p) ch.props.push({ kind: BIOMES[RUN.biome].hazard, x: p[0], y: p[1], r, t: R() * 360 | 0, seed: R() });
  }
  if (!home && R() < 0.16){ const p = place(60, 8); if (p) ch.props.push({ kind: 'altar', x: p[0], y: p[1], r: 34, prog: 0, used: false }); }
  if (!home && R() < 0.06){ const p = place(60, 8); if (p) ch.props.push({ kind: 'shrine', x: p[0], y: p[1], r: 34, prog: 0, used: false }); }
  // редкие места для питомцев: гнездо драконыша и древо совы
  if (!home && R() < 0.08){ const p = place(70, 8); if (p) ch.props.push({ kind: 'nest', x: p[0], y: p[1], r: 40, prog: 0, used: false }); }
  if (!home && R() < 0.07){
    for (let tr = 0; tr < 8; tr++){
      const x = x0 + 90 + R() * (CHUNK - 180), y = y0 + 90 + R() * (CHUNK - 180), s = makeSolid('owltree', x, y);
      if (!freeSpot(ch.solids, s.col.x, s.col.y, s.ext + 90)) continue;
      ch.solids.push(s); break;
    }
  }
  const nc = 2 + (R() * 3 | 0);
  for (let k = 0; k < nc; k++){
    const p = place(40, 6);
    if (p && Math.hypot(p[0] - player.x, p[1] - player.y) > 140) spawnEnemy('crystal', p[0], p[1]);
  }
  const nd = 26 + (R() * 20 | 0);
  for (let k = 0; k < nd; k++) ch.details.push({ x: x0 + R() * CHUNK, y: y0 + R() * CHUNK, k: R() < 0.55 ? 0 : R() < 0.6 ? 1 : R() < 0.5 ? 2 : 3, flip: R() < 0.5 });
}
function chunkRange(x0, y0, x1, y1, fn){
  for (let cx = Math.floor(x0 / CHUNK); cx <= Math.floor(x1 / CHUNK); cx++)
    for (let cy = Math.floor(y0 / CHUNK); cy <= Math.floor(y1 / CHUNK); cy++) fn(cx, cy);
}
function ensureChunks(){
  chunkRange(cam.x - W / 2 - 300, cam.y - H / 2 - 300, cam.x + W / 2 + 300, cam.y + H / 2 + 300, (cx, cy) => {
    if (!chunks.has(cx + ',' + cy)) genChunk(cx, cy);
  });
  nearProps = []; nearSolids = [];
  chunkRange(player.x - 1300, player.y - 1300, player.x + 1300, player.y + 1300, (cx, cy) => {
    const ch = chunks.get(cx + ',' + cy); if (!ch) return;
    for (const p of ch.props) nearProps.push(p);
    for (const s of ch.solids) nearSolids.push(s);
  });
}
// выталкивает круг (o.x, o.y, rad) из построек; true — если упёрся
function pushOut(o, rad){
  let hit = false;
  for (const s of nearSolids){
    const c = s.col;
    if (Math.abs(o.x - c.x) > s.ext + rad || Math.abs(o.y - c.y) > s.ext + rad) continue;
    if (c.shape === 'c'){
      const dx = o.x - c.x, dy = o.y - c.y, rr = c.r + rad, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr){ const d = Math.sqrt(d2) || 0.01; o.x = c.x + dx / d * rr; o.y = c.y + dy / d * rr; hit = true; }
    } else {
      const hw = c.w / 2, hh = c.h / 2, nx = clamp(o.x, c.x - hw, c.x + hw), ny = clamp(o.y, c.y - hh, c.y + hh);
      const dx = o.x - nx, dy = o.y - ny, d2 = dx * dx + dy * dy;
      if (d2 < rad * rad){
        if (d2 > 0.0001){ const d = Math.sqrt(d2); o.x = nx + dx / d * rad; o.y = ny + dy / d * rad; }
        else {
          const px = hw + rad - Math.abs(o.x - c.x), py = hh + rad - Math.abs(o.y - c.y);
          if (px < py) o.x += Math.sign(o.x - c.x || 1) * px; else o.y += Math.sign(o.y - c.y || 1) * py;
        }
        hit = true;
      }
    }
  }
  return hit;
}
function solidHit(x, y, rad){
  for (const s of nearSolids){
    const c = s.col;
    if (Math.abs(x - c.x) > s.ext + rad || Math.abs(y - c.y) > s.ext + rad) continue;
    if (c.shape === 'c'){ if (Math.hypot(x - c.x, y - c.y) < c.r + rad) return s; }
    else if (Math.abs(x - c.x) < c.w / 2 + rad && Math.abs(y - c.y) < c.h / 2 + rad) return s;
  }
  return null;
}
const solidAt = (x, y, rad) => !!solidHit(x, y, rad);
function damageSolid(s, amt){
  if (s.dead) return;
  s.hp -= amt; s.hitT = 8;
  if (s.hp <= 0) destroySolid(s);
}
// постройка рушится: обломки, пыль, щебень на месте и немного добычи
function destroySolid(s){
  s.dead = true; destroyed++;
  const ch = chunks.get(Math.floor(s.x / CHUNK) + ',' + Math.floor(s.y / CHUNK));
  if (ch){ ch.solids = ch.solids.filter(o => o !== s); ch.details.push({ x: s.x, y: s.y - 4, k: 4, flip: Math.random() < 0.5 }); }
  nearSolids = nearSolids.filter(o => o !== s);
  const P = PAL[RUN.biome], cols = [P.stone, P.stoneD, P.stoneL, P.bark, P.rock, P.rockL];
  const w = s.img.width * BSCALE, h = s.img.height * BSCALE;
  for (let i = 0; i < 40 && particles.length < 2300; i++)
    particles.push({ debris: true, x: s.x + rnd(-w / 2, w / 2) * 0.8, y: s.y - rnd(0, h * 0.8), vx: rnd(-3, 3), vy: rnd(-5, -1),
                     life: rnd(35, 60), max: 60, color: pick(cols), r: rnd(3, 7), floor: s.y + rnd(-12, 12) });
  burst(s.x, s.y - 30, 18, '#d8d0c0', 4);
  shake = Math.min(10, shake + 4);
  sfx.crumble();
  for (let k = 0; k < 3; k++) gems.push({ x: s.x + rnd(-30, 30), y: s.y + rnd(-10, 10), v: 2, kind: 'xp' });
  if (Math.random() < 0.025 * PACT.rune * (hasPet('toad') ? 1.5 : 1) * runeLate()) dropRune(s.x, s.y, randomRune([...ELS, ...MODS]));
  if (destroyed >= 20) unlockSet('pirate');
}
// урон по постройкам в круге (взрывы, молнии, смерчи)
function damageSolidsIn(x, y, rad, amt){
  for (const s of nearSolids.slice()) if (Math.hypot(s.col.x - x, s.col.y - y) < rad + s.ext * 0.6) damageSolid(s, amt);
}
const RESO_LEN = 420; // длина луча резонатора в каждую сторону
const SHRINE_T = 600; // 10 с у святилища жизни
function hazards(){
  const P = player;
  P.onIce = false; P.inSand = false;
  for (const h of nearProps){
    const pd = Math.hypot(P.x - h.x, P.y - h.y) || 1;
    if (h.kind === 'lava'){
      if (tick % 15 === 0) near(h.x, h.y, h.r * 0.8, e => { if (e.static) return; damage(e, 5 * hpScale(), '#ff7a2e', -1); e.burn = Math.max(e.burn, 60); e.burnDmg = Math.max(e.burnDmg, 3); });
      if (pd < h.r * 0.8 && P.inv <= 0 && P.dash <= 0) hurt(7);
      if (Math.random() < 0.06) particles.push({ x: h.x + rnd(-h.r, h.r) * 0.6, y: h.y + rnd(-h.r, h.r) * 0.4, vx: 0, vy: -rnd(0.5, 1.5), life: 30, max: 30, color: '#ff8a3d', r: 2.5 });
    } else if (h.kind === 'ice'){
      if (pd < h.r) P.onIce = true;
      if (tick % 10 === 0) near(h.x, h.y, h.r, e => { e.iceT = 12; });
    } else if (h.kind === 'geyser'){
      h.t = (h.t + 1) % 360;
      if (h.t === 0){
        near(h.x, h.y, h.r, e => { if (!e.static) damage(e, 12 + 14 * hpScale(), '#7dff5a', -1); });
        if (pd < h.r && P.inv <= 0) hurt(12);
        if (puddles.length < 90) puddles.push({ x: h.x, y: h.y, r: h.r * 0.8, t: 240, dmg: 3, slot: -1 });
        burst(h.x, h.y, 40, '#7dff5a', 7); ring(h.x, h.y, h.r, '#7dff5a');
        if (pd < 700) sfx.geyser();
      }
    } else if (h.kind === 'well'){
      near(h.x, h.y, h.r * 2.2, (e, dx, dy) => { if (e.static || e.boss) return; const d = Math.hypot(dx, dy) || 1; e.x -= dx / d * 1.1; e.y -= dy / d * 1.1; });
      if (tick % 10 === 0) near(h.x, h.y, h.r * 0.35, e => { if (!e.static) damage(e, 6 * hpScale(), '#b46bff', -1); });
      if (pd < h.r * 2.2){ P.x += (h.x - P.x) / pd * 0.45; P.y += (h.y - P.y) / pd * 0.45; if (pd < h.r * 0.35 && P.inv <= 0) hurt(6); }
    } else if (h.kind === 'resonator'){
      // резонатор: 1 с показывает направление пунктиром, потом бьёт лучом насквозь в обе стороны
      if (h.ang === undefined) h.ang = h.seed * Math.PI;
      h.t = (h.t + 1) % 300;
      if (h.t === 230) h.ang = rnd(0, Math.PI);
      if (h.fire > 0) h.fire--;
      if (h.t === 0){
        h.fire = 14;
        const L = RESO_LEN, cx = Math.cos(h.ang), cy = Math.sin(h.ang), onLine = (x, y, r) => {
          const t = clamp((x - h.x) * cx + (y - h.y) * cy, -L, L);
          return Math.hypot(x - (h.x + cx * t), y - (h.y + cy * t)) < r;
        };
        near(h.x, h.y, L, e => { if (!e.static && onLine(e.x, e.y, e.r + 14)) damage(e, 16 * hpScale(), '#9ff0ff', -1); });
        if (onLine(P.x, P.y, P.r + 10) && P.inv <= 0 && P.dash <= 0) hurt(14);
        if (pd < 800 && can('reso', 100)){ tone(1800, 0.25, { type: 'sawtooth', vol: 0.04, to: 400 }); tone(2400, 0.2, { vol: 0.03 }); }
      }
    } else if (h.kind === 'quicksand'){
      // зыбучий песок: вязнешь, тебя тянет к центру, а в центре ранит
      if (pd < h.r){
        P.inSand = true;
        P.x += (h.x - P.x) / pd * 0.35; P.y += (h.y - P.y) / pd * 0.35;
        if (pd < h.r * 0.3 && P.inv <= 0 && P.dash <= 0) hurt(5);
      }
      near(h.x, h.y, h.r, (e, dx, dy) => {
        if (e.static || e.boss) return;
        e.sand = 4;
        const d = Math.hypot(dx, dy) || 1; e.x -= dx / d * 0.5; e.y -= dy / d * 0.5;
      });
      if (tick % 15 === 0) near(h.x, h.y, h.r * 0.3, e => { if (!e.static) damage(e, 4 * hpScale(), '#c49a5e', -1); });
    } else if (h.kind === 'nest' && !h.used && !hasPet('dragon')){
      // высиживание: стой в гнезде 12 с, вокруг сбегается всё больше врагов
      if (pd < 60){
        if (h.prog === 0) banner('🥚 Высиживай яйцо 12 с — не уходи из гнезда!', '#ffe08a');
        h.prog++;
        if (h.prog % 50 === 0) for (let k = 0; k < 2 + Math.floor(h.prog / 240); k++) spawnEnemy(pick(['slime', 'runner', 'brute']));
        if (h.prog % 60 === 0) tone(300 + h.prog, 0.1, { type: 'triangle', vol: 0.04 });
        if (h.prog >= 720){ h.used = true; addPet('dragon', h.x, h.y); burst(h.x, h.y - 20, 40, '#8fe08a', 6); }
      } else h.prog = Math.max(0, h.prog - 1);
    } else if (h.kind === 'altar' && !h.used){
      if (pd < h.r + P.r){
        h.prog++;
        if (h.prog % 22 === 0) tone(400 + h.prog * 6, 0.12, { vol: 0.04 });
        if (h.prog >= 110){ h.used = true; sfx.rune(); burst(h.x, h.y, 40, '#ffd25a', 6); openPick('altar'); }
      } else h.prog = Math.max(0, h.prog - 2);
    } else if (h.kind === 'shrine' && !h.used){
      // святилище жизни: простой у него 10 с — получишь лишнее возрождение
      if (pd < h.r + P.r){
        if (h.prog === 0) banner('💗 Стой у святилища 10 с — получишь возрождение', '#ff8fb8');
        h.prog++;
        if (h.prog % 60 === 0) tone(300 + h.prog / 2, 0.12, { type: 'triangle', vol: 0.04 });
        if (h.prog >= SHRINE_T){ h.used = true; lives++; sfx.level(); burst(h.x, h.y, 40, '#ff6fa8', 6); banner('💗 +1 ВОЗРОЖДЕНИЕ', '#ff8fb8'); }
      } else h.prog = Math.max(0, h.prog - 2);
    }
  }
}
