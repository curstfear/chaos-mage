// ---------- навыки ----------
function nextSlot(i){
  for (let k = 1; k <= NSLOTS; k++){ const j = (i + k + NSLOTS) % NSLOTS; if (compiled[j]) return j; }
  return -1;
}
function spawnProj(p){ if (projs.length < 900) projs.push(p); }
function cast(i, ox, oy, ang, depth, isEcho, Sover){
  let S = Sover || compiled[i]; if (!S) return;
  if (S.wild && !Sover){ const ex = []; for (let k = 0; k < 2 * S.wild; k++) ex.push(pick(SAFE_WILD)); S = compile(slots[i], ex); }
  if (S.el === 'chaos') S = { ...S, color: pick(CHAOS_COLORS) };
  if (S.el === 'blood' && depth === 0 && !isEcho && i >= 0) player.hp = Math.max(1, player.hp - 1);
  if (depth === 0) sfx.cast(S.form, S.el);
  // «Нарастание»: каждый свой каст копит бонус урона, ранение сбрасывает
  let dmgMul = 1;
  if (S.momentum && i >= 0){
    if (depth === 0 && !isEcho) mom[i] = Math.min(25, mom[i] + 1);
    dmgMul = Math.min(2, 1 + 0.04 * mom[i] * S.momentum);
  }
  const base = { dmg: S.dmg * dmgMul, color: S.color, el: S.el, slot: i, depth, pierce: S.pierce, bounce: S.bounce, homing: S.homing,
                 split: S.split, trigger: S.trigger, size: S.size, speed: S.speed, range: S.range, detonate: S.detonate, execute: S.execute,
                 mark: S.mark, berserk: S.berserk, gravity: S.gravity, child: false,
                 vampiric: S.vampiric, keen: S.keen, snowball: S.snowball, returner: S.returner, reflect: S.reflect, sniper: S.sniper, stun: S.stun,
                 // общий счётчик на весь каст: дыр не больше, чем рун «Гравитация»
                 gravGroup: S.gravity ? { n: 0 } : null };
  let ax, ay;
  if (depth === 0 && i >= 0) [ax, ay] = aimWorld();
  else { const t = nearest(ox, oy, 400); if (t){ ax = t.x; ay = t.y; } else { ax = ox + Math.cos(ang) * 150; ay = oy + Math.sin(ang) * 150; } }
  const dirs = S.mirror ? [0, Math.PI] : [0];
  for (const turn of dirs){
    const A = ang + turn;
    // точка прицела, отражённая для «Зеркала»
    const tx = turn ? 2 * ox - ax : ax, ty = turn ? 2 * oy - ay : ay;
    switch (S.form){
      case 'bolt': {
        const n = 1 + 2 * S.multi;
        for (let k = 0; k < n; k++){
          const a = A + (k - (n - 1) / 2) * 0.15;
          spawnProj({ ...base, kind: 'bolt', x: ox, y: oy, vx: Math.cos(a) * 9.5 * S.speed, vy: Math.sin(a) * 9.5 * S.speed, r: 6 * S.size,
                      life: 85 * S.range * (S.spiral ? 1.7 : 1), curve: S.spiral * 0.045, hit: new Set() });
        }
      } break;
      case 'nova': {
        const n = 12 + 6 * S.multi, off = rnd(0, TAU);
        for (let k = 0; k < n; k++){
          const a = off + k / n * TAU;
          spawnProj({ ...base, kind: 'bolt', x: ox, y: oy, vx: Math.cos(a) * 6.5 * S.speed, vy: Math.sin(a) * 6.5 * S.speed, r: 5 * S.size,
                      life: 52 * S.range * (S.spiral ? 1.7 : 1), curve: S.spiral * 0.04, hit: new Set() });
        }
      } break;
      case 'orbit': {
        const n = 3 + 2 * S.multi, off = rnd(0, TAU) + turn;
        for (let k = 0; k < n; k++)
          spawnProj({ ...base, kind: 'orb', anchor: depth > 0 || i < 0, ax: ox, ay: oy, ang: off + k / n * TAU, rad: (depth ? 55 : 78) * S.size * (turn ? 1.5 : 1),
                      dir: turn ? -1 : 1, x: ox, y: oy, r: 9 * S.size, life: depth ? 150 : S.cd + 2, hcd: new Map(), hit: new Set() });
      } break;
      case 'mine': {
        const n = 1 + S.multi;
        let mx = tx, my = ty; const d = Math.hypot(mx - ox, my - oy);
        if (d > 380){ mx = ox + (mx - ox) / d * 380; my = oy + (my - oy) / d * 380; }
        for (let k = 0; k < n; k++)
          spawnProj({ ...base, kind: 'mine', x: ox, y: oy, tx: mx + (k ? rnd(-70, 70) : 0), ty: my + (k ? rnd(-70, 70) : 0), armed: false, r: 8 * S.size, life: 420, hit: new Set() });
      } break;
      case 'meteor': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++)
          meteors.push({ ...base, x: tx + (k ? rnd(-90, 90) : 0), y: ty + (k ? rnd(-90, 90) : 0), t: 38 + k * 7, max: 38 + k * 7, rad: 95 * S.size });
      } break;
      case 'beam': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++) fireBeam(base, ox, oy, A + (k - (n - 1) / 2) * 0.2, 470 * S.range * Math.sqrt(S.size));
      } break;
      case 'boomerang': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++){
          const a = A + (k - (n - 1) / 2) * 0.28;
          spawnProj({ ...base, kind: 'boomer', x: ox, y: oy, vx: Math.cos(a) * 10 * S.speed, vy: Math.sin(a) * 10 * S.speed, out: 26 * S.range, back: false,
                      home: depth === 0 && i >= 0, ax: ox, ay: oy, r: 10 * S.size, life: 260, spin: 0, curve: S.spiral * 0.03, hit: new Set() });
        }
      } break;
      case 'turret': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++){
          const a = k / n * TAU + turn, d = n > 1 || turn ? 46 : 0;
          const t = { ...base, kind: 'turret', x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d, fire: 10 + k * 4, life: depth ? 160 : 300, r: 12, hit: new Set() };
          pushOut(t, 12); spawnProj(t);
        }
      } break;
      case 'tornado': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++)
          spawnProj({ ...base, kind: 'tornado', x: ox, y: oy, tx: tx + (k ? rnd(-120, 120) : 0), ty: ty + (k ? rnd(-120, 120) : 0),
                      life: (depth ? 150 : 240) * S.range, r: 46 * S.size, spin: rnd(0, TAU), hit: new Set() });
      } break;
      case 'slash': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++) doSlash(base, ox, oy, A + k / n * TAU, 115 * Math.sqrt(S.size) * Math.sqrt(S.range));
      } break;
      case 'spikes': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++){
          const a = A + (k - (n - 1) / 2) * 0.35;
          spawnProj({ ...base, kind: 'spikes', x: ox, y: oy, ox, oy, dx: Math.cos(a), dy: Math.sin(a), step: 0, steps: 8, next: 1, life: 99,
                      r: 30 * Math.sqrt(S.size), hit: new Set() });
        }
      } break;
      case 'saw': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++){
          const a = A + (k - (n - 1) / 2) * 0.3;
          spawnProj({ ...base, kind: 'saw', x: ox, y: oy, vx: Math.cos(a) * 4 * S.speed, vy: Math.sin(a) * 4 * S.speed,
                      r: 15 * S.size, life: 200 * S.range, spin: 0, hcd: new Map(), hit: new Set() });
        }
      } break;
      case 'starfall': {
        const n = 7 + 3 * S.multi, R = 150 * Math.sqrt(S.size);
        for (let k = 0; k < n; k++){
          const a = rnd(0, TAU), d = Math.sqrt(Math.random()) * R;
          // «Цепь» и «Раскол» срабатывают только от первой звезды, иначе звездопад запускает десяток цепочек
          meteors.push({ ...base, x: tx + Math.cos(a) * d, y: ty + Math.sin(a) * d, t: 12 + k * 5, max: 12 + k * 5, rad: 44 * S.size, size: 0.45 * S.size,
                         trigger: k ? 0 : base.trigger, split: k ? 0 : base.split });
        }
      } break;
      case 'wave': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++)
          spawnProj({ ...base, kind: 'wave', x: ox, y: oy, life: 30 + k * 10, max: 30 + k * 10, maxR: 230 * S.size * S.range, rr: 0, hit: new Set(), solidHit: new Set() });
      } break;
      case 'shotgun': {
        const n = 6 + 3 * S.multi;
        for (let k = 0; k < n; k++){
          const a = A + (k - (n - 1) / 2) * 0.11 + rnd(-0.04, 0.04), v = rnd(8, 11) * S.speed;
          spawnProj({ ...base, kind: 'bolt', x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 5 * S.size,
                      life: 30 * S.range * (S.spiral ? 1.7 : 1), curve: S.spiral * 0.05, hit: new Set() });
        }
      } break;
      case 'spark': {
        const n = 1 + S.multi, done = new Set();
        for (let k = 0; k < n; k++) sparkChain(base, ox, oy, 4 + S.bounce + S.pierce, done);
      } break;
      case 'lance': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++){
          const a = A + (k - (n - 1) / 2) * 0.12;
          spawnProj({ ...base, kind: 'bolt', lance: true, x: ox, y: oy, vx: Math.cos(a) * 13 * S.speed, vy: Math.sin(a) * 13 * S.speed, r: 9 * S.size,
                      life: 60 * S.range * (S.spiral ? 1.7 : 1), pierce: 999, curve: S.spiral * 0.03, hit: new Set() });
        }
      } break;
      case 'comet': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++){
          const a = A + (k - (n - 1) / 2) * 0.3;
          spawnProj({ ...base, kind: 'bolt', boom: 85 * S.size, x: ox, y: oy, vx: Math.cos(a) * 5 * S.speed, vy: Math.sin(a) * 5 * S.speed, r: 13 * S.size,
                      life: 75 * S.range * (S.spiral ? 1.7 : 1), curve: S.spiral * 0.03, hit: new Set() });
        }
      } break;
      case 'pulse': {
        if (turn) break;
        const n = 1 + S.multi, R = 150 * Math.sqrt(S.size) * S.range;
        doPulse(base, ox, oy, R);
        for (let k = 1; k < n; k++) scheduled.push({ t: 10 * k, fn: () => depth === 0 && i >= 0 ? doPulse(base, player.x, player.y, R) : doPulse(base, ox, oy, R) });
      } break;
      case 'vortex': {
        const n = 1 + S.multi;
        let mx = tx, my = ty; const d = Math.hypot(mx - ox, my - oy);
        if (d > 400){ mx = ox + (mx - ox) / d * 400; my = oy + (my - oy) / d * 400; }
        for (let k = 0; k < n && holes.length < 25; k++)
          holes.push({ x: mx + (k ? rnd(-110, 110) : 0), y: my + (k ? rnd(-110, 110) : 0), t: 90, r: 130 * S.size, chew: true, boomR: 110 * S.size,
                       color: S.color === PURE ? '#b46bff' : S.color, src: { ...base, gravity: 0, hit: new Set() } });
        sfx.hole();
      } break;
      case 'geyser': {
        const n = 3 + 2 * S.multi, done = new Set();
        for (let k = 0; k < n; k++){
          const t = nearest(tx, ty, 260 * S.range, done);
          let gx, gy;
          if (t){ done.add(t); gx = t.x; gy = t.y; } else { const a = rnd(0, TAU), dd = rnd(0, 120); gx = tx + Math.cos(a) * dd; gy = ty + Math.sin(a) * dd; }
          meteors.push({ ...base, geyser: true, x: gx, y: gy, t: 22 + k * 6, max: 22 + k * 6, rad: 48 * S.size, size: 0.6 * S.size,
                         trigger: k ? 0 : base.trigger, split: k ? 0 : base.split });
        }
      } break;
      case 'snake': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++){
          const a = A + (k - (n - 1) / 2) * 0.25;
          spawnProj({ ...base, kind: 'bolt', x: ox, y: oy, vx: Math.cos(a) * 7.5 * S.speed, vy: Math.sin(a) * 7.5 * S.speed, r: 7 * S.size,
                      life: 110 * S.range * (S.spiral ? 1.4 : 1), wig: 0.11, wt: k * 1.5, pierce: base.pierce + 3, curve: S.spiral * 0.03, hit: new Set() });
        }
      } break;
      case 'familiar': {
        const n = 1 + S.multi;
        for (let k = 0; k < n; k++)
          spawnProj({ ...base, kind: 'fam', x: ox, y: oy, ang: k / n * TAU + turn, mode: 'orbit', t: 20 + k * 12, life: depth ? 160 : 300,
                      r: 10 * S.size, home: depth === 0 && i >= 0, ax: ox, ay: oy, hcd: new Map(), hit: new Set() });
      } break;
    }
  }
  if (S.echo && !isEcho)
    for (let e = 0; e < S.echo; e++)
      scheduled.push({ t: 13 * (e + 1), fn: () => depth === 0 && i >= 0
        ? cast(i, player.x, player.y, player.face, 0, true)
        : cast(i, ox, oy, ang, depth, true, Sover) });
}
function fireBeam(src, ox, oy, a, len){
  const ex = ox + Math.cos(a) * len, ey = oy + Math.sin(a) * len, w = 9 * src.size, hits = [];
  for (const e of enemies){
    if (e.dead) continue;
    const t = clamp(((e.x - ox) * (ex - ox) + (e.y - oy) * (ey - oy)) / (len * len), 0, 1);
    if (Math.hypot(e.x - (ox + (ex - ox) * t), e.y - (oy + (ey - oy) * t)) < e.r + w) hits.push([t, e]);
  }
  hits.sort((p, q) => p[0] - q[0]);
  const s = { ...src, hit: new Set(hits.map(h => h[1])) };
  for (const [, e] of hits) hitEnemy(e, s, src.dmg, e.x, e.y);
  if (hits.length){ const last = hits[hits.length - 1][1]; onImpact(s, last.x, last.y); }
  for (const so of nearSolids.slice()){
    const t = clamp(((so.col.x - ox) * (ex - ox) + (so.col.y - oy) * (ey - oy)) / (len * len), 0, 1);
    if (Math.hypot(so.col.x - (ox + (ex - ox) * t), so.col.y - (oy + (ey - oy) * t)) < so.ext * 0.7 + w) damageSolid(so, src.dmg * 0.5);
  }
  beams.push({ x1: ox, y1: oy, x2: ex, y2: ey, w, color: src.color, life: 12 });
}
// «Искра»: прыгает от врага к врагу, каждый задет один раз за каст
function sparkChain(src, ox, oy, jumps, done){
  const s = { ...src, hit: done };
  let from = { x: ox, y: oy }, first = false;
  for (let k = 0; k <= jumps; k++){
    const t = nearest(from.x, from.y, k ? 190 : 320 * src.range, done); if (!t) break;
    done.add(t); zaps.push({ x1: from.x, y1: from.y, x2: t.x, y2: t.y, life: 10, c: src.color });
    hitEnemy(t, s, src.dmg, t.x, t.y);
    if (!first){ first = true; onImpact(s, t.x, t.y); }
    from = t;
  }
}
function doPulse(src, ox, oy, R){
  const s = { ...src, hit: new Set() };
  let first = null;
  near(ox, oy, R, (e, dx, dy) => {
    s.hit.add(e); hitEnemy(e, s, src.dmg, e.x, e.y);
    if (!first) first = e;
    if (!e.static && !e.boss){ const d = Math.hypot(dx, dy) || 1; e.x += dx / d * 12; e.y += dy / d * 12; }
  });
  if (first) onImpact(s, first.x, first.y);
  damageSolidsIn(ox, oy, R * 0.6, src.dmg);
  ring(ox, oy, R, src.color); ring(ox, oy, R * 0.6, src.color);
}
function doSlash(src, ox, oy, a, R){
  const s = { ...src, hit: new Set() };
  let fx = null, fy = 0;
  near(ox, oy, R, (e, dx, dy) => {
    let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) > 1.05) return;
    s.hit.add(e); hitEnemy(e, s, src.dmg, e.x, e.y);
    if (fx === null){ fx = e.x; fy = e.y; }
  });
  if (fx !== null) onImpact(s, fx, fy);
  for (const so of nearSolids.slice()){
    let da = Math.atan2(so.col.y - oy, so.col.x - ox) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) < 1.05 && Math.hypot(so.col.x - ox, so.col.y - oy) < R + so.ext * 0.6) damageSolid(so, src.dmg);
  }
  slashes.push({ x: ox, y: oy, a, R, color: src.color, life: 14 });
}
