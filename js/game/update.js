// ---------- обновление ----------
function update(){
  tick++; triggerBudget = 30; detBudget = 40;
  const P = player;
  ensureChunks();
  hazards();
  // игрок
  const [mx, my] = moveDir();
  if (P.dash > 0){ P.dash--; if (tick % 2 === 0) particles.push({ x: P.x, y: P.y, vx: 0, vy: 0, life: 16, max: 16, color: '#ffd25a', r: 10 }); }
  else {
    const k = P.onIce ? 0.035 : 0.25, sp = 3.4 * PACT.speed;
    P.vx += (mx * sp - P.vx) * k; P.vy += (my * sp - P.vy) * k;
  }
  P.x += P.vx; P.y += P.vy;
  if (RUN.pact === 'wind'){ P.x += wind.x * 0.9; P.y += wind.y * 0.9; }
  if (pushOut(P, P.r * 0.8) && P.dash > 0) sfx.thud();
  if (P.dashCd > 0) P.dashCd--; if (P.inv > 0) P.inv--;
  if (RUN.pact === 'vampire') P.hp -= 1.2 / 60; else P.hp = Math.min(P.maxHp, P.hp + 0.012 + PACT.regen / 60);
  if (TOUCH) updateAutoAim();
  const [ax, ay] = aimWorld(); P.face = Math.atan2(ay - P.y, ax - P.x);

  spawner(); events();
  petsTick(); wildTick(); toadTick(); owlTick();
  if (comboRuneCd > 0) comboRuneCd--;
  buildGrid();

  // навыки стреляют сами
  const un = unlocked();
  for (let i = 0; i < un; i++){
    if (!compiled[i]) continue;
    if (--cds[i] <= 0){ cds[i] = compiled[i].cd; cast(i, P.x, P.y, P.face, 0, false); }
  }
  for (const s of scheduled) if (--s.t === 0) s.fn();
  scheduled = scheduled.filter(s => s.t > 0);

  // снаряды
  for (const p of projs){
    p.life--;
    if (p.kind === 'orb'){
      p.ang += 0.075 * (p.dir || 1);
      const cx = p.anchor ? p.ax : P.x, cy = p.anchor ? p.ay : P.y;
      p.x = cx + Math.cos(p.ang) * p.rad; p.y = cy + Math.sin(p.ang) * p.rad;
      near(p.x, p.y, p.r, e => {
        if (tick - (p.hcd.get(e) || -99) < 22) return;
        p.hcd.set(e, tick); p.hit.add(e);
        hitEnemy(e, p, p.dmg, p.x, p.y); onImpact(p, p.x, p.y);
      });
      if (p.triggered && tick % 40 === 0) p.triggered = false;
      if (tick % 3 === 0) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 14, max: 14, color: p.color, r: p.r * 0.6 });
    } else if (p.kind === 'mine'){
      if (!p.armed){
        const ox = p.x, oy = p.y;
        p.x += (p.tx - p.x) * 0.14; p.y += (p.ty - p.y) * 0.14;
        if (solidAt(p.x, p.y, p.r)){ p.x = ox; p.y = oy; p.armed = true; }
        if (Math.hypot(p.tx - p.x, p.ty - p.y) < 3) p.armed = true;
      } else if (nearest(p.x, p.y, 40 * p.size)) p.life = 0;
      if (p.life <= 0) explode(p, p.x, p.y, 72 * p.size);
    } else if (p.kind === 'boomer'){
      if (!p.back){
        p.out--; p.vx *= 0.975; p.vy *= 0.975;
        if (p.out <= 0){ p.back = true; p.hit.clear(); }
      } else {
        const hx = p.home ? P.x : p.ax, hy = p.home ? P.y : p.ay;
        const dx = hx - p.x, dy = hy - p.y, d = Math.hypot(dx, dy) || 1, sp = Math.min(13, Math.hypot(p.vx, p.vy) + 0.5);
        p.vx += (dx / d * sp - p.vx) * 0.2; p.vy += (dy / d * sp - p.vy) * 0.2;
        if (d < 18) p.life = 0;
      }
      if (p.curve){ const c = Math.cos(p.curve), s = Math.sin(p.curve); [p.vx, p.vy] = [p.vx * c - p.vy * s, p.vx * s + p.vy * c]; }
      p.x += p.vx; p.y += p.vy; p.spin += 0.45;
      const bh = !p.back && solidHit(p.x, p.y, p.r * 0.5);
      if (bh){ damageSolid(bh, p.dmg); p.back = true; p.hit.clear(); sfx.thud(); burst(p.x, p.y, 5, '#ffffff', 2); }
      near(p.x, p.y, p.r, e => { if (p.hit.has(e)) return; p.hit.add(e); hitEnemy(e, p, p.dmg, p.x, p.y); onImpact(p, p.x, p.y); });
      if (tick % 2 === 0) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 10, max: 10, color: p.color, r: p.r * 0.5 });
    } else if (p.kind === 'turret'){
      if (--p.fire <= 0){
        p.fire = 18;
        const t = nearest(p.x, p.y, 380);
        if (t){
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          spawnProj({ ...p, kind: 'bolt', x: p.x, y: p.y - 30, vx: Math.cos(a) * 9 * p.speed, vy: Math.sin(a) * 9 * p.speed,
                      r: 4.5 * p.size, life: 70, curve: 0, hit: new Set() });
          sfx.turretShot();
        }
      }
    } else if (p.kind === 'spikes'){
      // шипы вырастают по одному каждые 3 кадра, каждый враг получает удар от линии один раз
      if (--p.next <= 0){
        p.next = 3;
        const dist = 40 + p.step * 42 * (p.range || 1), x = p.ox + p.dx * dist, y = p.oy + p.dy * dist;
        let first = false;
        near(x, y, p.r, e => { if (p.hit.has(e)) return; p.hit.add(e); hitEnemy(e, p, p.dmg, x, y); first = true; });
        if (first) onImpact(p, x, y);
        damageSolidsIn(x, y, p.r * 0.5, p.dmg);
        particles.push({ spike: true, x, y, vx: 0, vy: 0, life: 22, max: 22, color: p.color, h: 26 * p.size, w: 9 * Math.sqrt(p.size) });
        for (let k = 0; k < 3; k++) particles.push({ debris: true, x: x + rnd(-10, 10), y, vx: rnd(-2, 2), vy: rnd(-4, -1), life: 25, max: 25, color: '#8a7a6a', r: rnd(2, 4), floor: y + 4 });
        if (++p.step >= p.steps) p.life = 0;
      }
    } else if (p.kind === 'saw'){
      p.spin += 0.5;
      const ox = p.x, oy = p.y;
      p.x += p.vx; p.y += p.vy;
      const hs = solidHit(p.x, p.y, p.r * 0.6);
      if (hs){
        damageSolid(hs, p.dmg * 2);
        const fx = solidAt(ox + p.vx, oy, p.r * 0.6), fy = solidAt(ox, oy + p.vy, p.r * 0.6);
        if (fx) p.vx = -p.vx;
        if (fy) p.vy = -p.vy;
        if (!fx && !fy){ p.vx = -p.vx; p.vy = -p.vy; }
        p.x = ox; p.y = oy; sfx.thud();
      }
      near(p.x, p.y, p.r, e => {
        if (tick - (p.hcd.get(e) || -99) < 10) return;
        p.hcd.set(e, tick); p.hit.add(e);
        hitEnemy(e, p, p.dmg, p.x, p.y); onImpact(p, p.x, p.y);
      });
      if (p.triggered && tick % 40 === 0) p.triggered = false;
      if (tick % 2 === 0) particles.push({ x: p.x + rnd(-p.r, p.r) * 0.5, y: p.y + p.r * 0.6, vx: rnd(-2, 2), vy: rnd(-2, 0), life: 12, max: 12, color: '#ffe08a', r: 1.5 });
    } else if (p.kind === 'wave'){
      p.rr = 12 + (p.maxR - 12) * (1 - p.life / p.max);
      near(p.x, p.y, p.rr + 24, (e, dx, dy) => {
        if (p.hit.has(e)) return;
        const d = Math.hypot(dx, dy);
        if (Math.abs(d - p.rr) > 24 + e.r * 0.5) return;
        p.hit.add(e); hitEnemy(e, p, p.dmg, e.x, e.y);
        if (!p.first){ p.first = true; onImpact(p, e.x, e.y); }
        if (!e.static && !e.boss){ e.x += dx / (d || 1) * 18; e.y += dy / (d || 1) * 18; }
      });
      for (const s of nearSolids.slice())
        if (!p.solidHit.has(s) && Math.abs(Math.hypot(s.col.x - p.x, s.col.y - p.y) - p.rr) < 24 + s.ext * 0.5){ p.solidHit.add(s); damageSolid(s, p.dmg); }
    } else if (p.kind === 'fam'){
      // дух кружит возле хозяина и время от времени бросается на ближайшего врага
      const hx = p.home ? P.x : p.ax, hy = p.home ? P.y : p.ay;
      if (p.mode === 'orbit'){
        p.ang += 0.06;
        const tx = hx + Math.cos(p.ang) * 55, ty = hy + Math.sin(p.ang) * 40 - 20;
        p.x += (tx - p.x) * 0.15; p.y += (ty - p.y) * 0.15;
        if (--p.t <= 0){ const t = nearest(p.x, p.y, 320); if (t){ p.mode = 'dash'; p.tgt = t; p.t = 30; } else p.t = 15; }
      } else {
        const t = p.tgt;
        if (!t || t.dead){ p.mode = 'orbit'; p.t = 10; }
        else { const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1; p.x += dx / d * 9 * p.speed; p.y += dy / d * 9 * p.speed; }
        if (--p.t <= 0){ p.mode = 'orbit'; p.t = 25; }
      }
      near(p.x, p.y, p.r, e => {
        if (tick - (p.hcd.get(e) || -99) < 28) return;
        p.hcd.set(e, tick); p.hit.add(e);
        hitEnemy(e, p, p.dmg, p.x, p.y); onImpact(p, p.x, p.y);
        if (p.mode === 'dash' && e === p.tgt){ p.mode = 'orbit'; p.t = 25; }
      });
      if (p.triggered && tick % 40 === 0) p.triggered = false;
      if (tick % 3 === 0) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0.4, life: 16, max: 16, color: p.color, r: 3 });
    } else if (p.kind === 'tornado'){
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      if (d > 10){ p.x += dx / d * 1.7; p.y += dy / d * 1.7; } else { p.tx = p.x + rnd(-160, 160); p.ty = p.y + rnd(-160, 160); }
      if (pushOut(p, p.r * 0.4)){ p.tx = p.x + rnd(-160, 160); p.ty = p.y + rnd(-160, 160); }
      p.spin += 0.2;
      near(p.x, p.y, p.r * 1.7, (e, ex, ey) => { if (e.static || e.boss) return; const dd = Math.hypot(ex, ey) || 1; e.x -= ex / dd * 1.4; e.y -= ey / dd * 1.4; });
      if (tick % 12 === 0){
        let any = false;
        near(p.x, p.y, p.r, e => { p.hit.add(e); hitEnemy(e, p, p.dmg, e.x, e.y); any = true; });
        if (any) onImpact(p, p.x, p.y);
        damageSolidsIn(p.x, p.y, p.r, p.dmg);
        if (tick % 60 === 0){ p.triggered = false; p.hit.clear(); }
      }
      for (let k = 0; k < 2; k++){
        const a = p.spin * 2 + rnd(0, TAU), rr = rnd(0.2, 1) * p.r;
        particles.push({ x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr * 0.5 - rnd(0, 40), vx: -Math.sin(a) * 2, vy: Math.cos(a) * 0.8 - 0.6, life: 20, max: 20, color: p.color, r: 2.2 });
      }
    } else {
      if (p.homing){
        if (!p.tgt || p.tgt.dead || tick % 8 === 0) p.tgt = nearest(p.x, p.y, 360, p.hit);
        if (p.tgt){
          const sp = Math.hypot(p.vx, p.vy), cur = Math.atan2(p.vy, p.vx);
          let want = Math.atan2(p.tgt.y - p.y, p.tgt.x - p.x) - cur;
          want = Math.atan2(Math.sin(want), Math.cos(want));
          const a = cur + clamp(want, -0.12 * p.homing, 0.12 * p.homing);
          p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        }
      }
      if (p.curve){ const c = Math.cos(p.curve), s = Math.sin(p.curve); [p.vx, p.vy] = [p.vx * c - p.vy * s, p.vx * s + p.vy * c]; }
      // «Змейка»: курс качается туда-сюда
      if (p.wig){ p.wt += 0.18; const w = Math.cos(p.wt) * p.wig, c = Math.cos(w), s = Math.sin(w); [p.vx, p.vy] = [p.vx * c - p.vy * s, p.vx * s + p.vy * c]; }
      if (RUN.pact === 'wind'){ p.vx += wind.x * 0.05; p.vy += wind.y * 0.05; }
      // «Снежный ком»: растёт в полёте, но не больше чем втрое
      if (p.snowball){ if (!p.r0) p.r0 = p.r; if (p.r < p.r0 * 3){ const g = 1 + 0.012 * p.snowball; p.r *= g; p.dmg *= g; } }
      // «Возврат»: в конце полёта разворачивается к магу
      if (p.returner && !p.returned && p.life <= 1){ p.returned = true; p.life = 80; p.hit.clear(); }
      if (p.returned){
        const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy) || 1, sp = Math.max(7, Math.hypot(p.vx, p.vy));
        p.vx = dx / d * sp; p.vy = dy / d * sp;
        if (d < 20) p.life = 0;
      }
      p.x += p.vx; p.y += p.vy;
      // снаряд разбивается о постройку, а с «Отражением» отскакивает
      const hs = solidHit(p.x, p.y, p.r * 0.4);
      if (hs){
        damageSolid(hs, p.dmg);
        if (p.reflect && (p.refl || 0) < 4 * p.reflect){
          p.refl = (p.refl || 0) + 1; p.dmg *= 1.2;
          const ox = p.x - p.vx, oy = p.y - p.vy;
          const fx = solidAt(ox + p.vx, oy, p.r * 0.4), fy = solidAt(ox, oy + p.vy, p.r * 0.4);
          if (fx) p.vx = -p.vx;
          if (fy) p.vy = -p.vy;
          if (!fx && !fy){ p.vx = -p.vx; p.vy = -p.vy; }
          p.x = ox; p.y = oy;
          burst(p.x, p.y, 5, p.color, 2); sfx.thud();
        } else { p.life = 0; burst(p.x, p.y, 6, p.color, 2.5); onImpact(p, p.x - p.vx, p.y - p.vy); continue; }
      }
      near(p.x, p.y, p.r, e => {
        if (p.life <= 0 || p.hit.has(e)) return;
        p.hit.add(e);
        hitEnemy(e, p, p.dmg, p.x, p.y); onImpact(p, p.x, p.y);
        if (p.bounce > 0){
          p.bounce--;
          const t = nearest(p.x, p.y, 320, p.hit);
          if (t){ const sp = Math.hypot(p.vx, p.vy), a = Math.atan2(t.y - p.y, t.x - p.x); p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.life = Math.max(p.life, 40); }
        } else if (p.pierce > 0) p.pierce--;
        else p.life = 0;
      });
      if (tick % 2 === 0) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 12, max: 12, color: p.color, r: p.r * 0.7 });
    }
  }
  // «Комета» взрывается там, где закончила полёт
  for (const p of projs) if (p.boom && p.life <= 0 && !p.boomed){ p.boomed = true; explode({ ...p, boom: 0 }, p.x, p.y, p.boom); }
  projs = projs.filter(p => p.life > 0);

  for (const m of meteors) if (--m.t === 0){
    explode(m, m.x, m.y, m.rad);
    if (m.geyser) for (let k = 0; k < 12; k++) particles.push({ x: m.x + rnd(-10, 10), y: m.y, vx: rnd(-1, 1), vy: rnd(-9, -4), life: 26, max: 26, color: m.color, r: rnd(2, 4) });
    if (m.env && Math.hypot(P.x - m.x, P.y - m.y) < m.rad && P.inv <= 0) hurt(12);
  }
  meteors = meteors.filter(m => m.t > 0);

  for (const h of holes){
    h.t--;
    near(h.x, h.y, h.r, (e, dx, dy) => {
      if (e.static || e.boss) return;
      const d = Math.hypot(dx, dy) || 1, f = Math.min(d, 2.6);
      e.x -= dx / d * f; e.y -= dy / d * f;
    });
    if (Math.random() < 0.5){ const a = rnd(0, TAU); particles.push({ x: h.x + Math.cos(a) * h.r, y: h.y + Math.sin(a) * h.r, vx: -Math.cos(a) * 4, vy: -Math.sin(a) * 4, life: 22, max: 22, color: h.color, r: 2 }); }
    if (h.chew && tick % 15 === 0) near(h.x, h.y, h.r * 0.45, e => hitEnemy(e, h.src, h.src.dmg * 0.15, e.x, e.y));
    if (h.t <= 0) explode(h.src, h.x, h.y, h.boomR || 75 * h.src.size);
  }
  holes = holes.filter(h => h.t > 0);

  for (const d of puddles){
    d.t--;
    if (tick % 15 === 0) near(d.x, d.y, d.r, e => { if (!e.static) damage(e, d.dmg, '#7dff5a', d.slot); });
  }
  puddles = puddles.filter(d => d.t > 0);

  // враги
  const moonMul = moonT > 0 ? 1.35 : 1;
  for (const e of enemies){
    if (e.dead) continue;
    if (e.flash > 0) e.flash--;
    if (e.slow > 0) e.slow--;
    if (e.mark > 0) e.mark--;
    if (e.iceT > 0) e.iceT--;
    if (e.acidT > 0 && --e.acidT === 0) e.acid = 0;
    if (e.wet > 0) e.wet--;
    if (e.burn > 0){
      e.burn--;
      if (e.burn % 20 === 0) damage(e, e.burnDmg, '#ff7a2e', -1);
      if (Math.random() < 0.3) particles.push({ x: e.x + rnd(-e.r, e.r) * 0.6, y: e.y, vx: 0, vy: -1.2, life: 20, max: 20, color: '#ff7a2e', r: 2.5 });
    }
    if (e.dead || e.static){
      if (e.static && Math.hypot(P.x - e.x, P.y - e.y) > 2400) e.dead = true;
      continue;
    }
    // дикий зверь оглушён: стоит на месте, рядом с ним идёт приручение
    if (e.stun > 0){
      e.stun--;
      if (Math.hypot(P.x - e.x, P.y - e.y) < 80 + e.r){ e.tame++; if (e.tame % 30 === 0) tone(400 + e.tame * 4, 0.1, { vol: 0.04 }); }
      else e.tame = Math.max(0, e.tame - 2);
      if (e.tame >= 180){ e.dead = true; addPet(e.type === 'brute' ? 'guard' : 'healer', e.x, e.y); burst(e.x, e.y, 30, '#9dff9a', 5); }
      else if (e.stun === 0){ e.dead = true; banner('💨 Зверь очнулся и сбежал…', '#a99cc9'); burst(e.x, e.y, 15, '#ffffff', 4); }
      continue;
    }
    if (e.stunT > 0){ e.stunT--; continue; }
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (e.boss){
      bossAttack(e, dx, dy, d);
      // во время особой атаки босс ходит сам
      if (e.phase > 0){
        e.moving = true;
        if (e.dmg > 0 && d < e.r + P.r && P.inv <= 0 && !e.hop) hurt(e.dmg * (moonT > 0 ? 1.3 : 1) * (goldT > 0 ? 1.5 : 1));
        continue;
      }
    }
    const sp = e.spd * (e.slow > 0 ? 0.45 : 1) * (e.iceT > 0 ? 0.6 : 1) * (e.wet > 0 ? 0.8 : 1) * moonMul;
    let ux = dx / d, uy = dy / d;
    if (e.type === 'shooter' && d < 260){ ux = -ux * 0.6; uy = -uy * 0.6; }
    if (e.type === 'goblin'){ ux = -ux + Math.sin(tick * 0.05 + e.wob) * 0.6; uy = -uy + Math.cos(tick * 0.05 + e.wob) * 0.6; if (--e.life <= 0 || d > 1500){ e.dead = true; banner('💨 Гоблин сбежал…', '#a99cc9'); continue; } }
    e.x += ux * sp; e.y += uy * sp;
    if (RUN.pact === 'wind' && !e.boss){ e.x += wind.x * 0.7; e.y += wind.y * 0.7; }
    // упёрся в постройку — обходим её боком
    if (!e.boss && pushOut(e, e.r * 0.8)){ e.x += -uy * sp * e.side; e.y += ux * sp * e.side; }
    e.moving = sp > 0;
    if (e.type === 'shooter' && --e.cd <= 0){ e.cd = Math.max(80, 140 - tick / 60 / 6); ebullets.push({ x: e.x, y: e.y, vx: dx / d * 3.6, vy: dy / d * 3.6, life: 200 }); }
    if (d > 1600 && e.type !== 'goblin'){ const a = rnd(0, TAU), r = Math.hypot(W, H) / 2 + 60; e.x = P.x + Math.cos(a) * r; e.y = P.y + Math.sin(a) * r; }
    if (e.dmg > 0 && d < e.r + P.r && P.inv <= 0) hurt(e.dmg * (moonT > 0 ? 1.3 : 1) * (goldT > 0 ? 1.5 : 1));
  }
  // расталкиваем врагов, чтобы не слипались
  for (const e of enemies){
    if (e.dead || e.static) continue;
    near(e.x, e.y, e.r, (o, dx, dy) => {
      if (o === e || o.static) return;
      const d = Math.hypot(dx, dy) || 0.01, push = (e.r + o.r - d) * 0.25;
      if (push > 0){ o.x += dx / d * push; o.y += dy / d * push; }
    });
  }
  // толкотня, ветер и колодцы могли вдавить врагов в стены — выталкиваем ещё раз
  for (const e of enemies) if (!e.dead && !e.static && !e.boss) pushOut(e, e.r * 0.8);
  enemies = enemies.filter(e => !e.dead);

  for (const b of ebullets){
    b.x += b.vx; b.y += b.vy; b.life--;
    if (solidAt(b.x, b.y, 3)){ b.life = 0; burst(b.x, b.y, 4, '#ff3d6e', 2); continue; }
    if (Math.hypot(b.x - P.x, b.y - P.y) < P.r + 5 && P.inv <= 0){ hurt((goldT > 0 ? 15 : 10) * dmgScale()); b.life = 0; }
  }
  ebullets = ebullets.filter(b => b.life > 0);

  // кристаллы опыта и подарки
  for (const g of gems){
    const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy) || 1;
    if (d < (hasPet('toad') ? 300 : 140) * PACT.magnet || g.pull){ g.pull = true; g.ps = (g.ps || 0) + 0.4; const s = Math.min(14, 3 + g.ps); g.x += dx / d * s; g.y += dy / d * s; }
    if (d < P.r + 10){
      g.taken = true;
      if (g.kind === 'heart'){ const h = Math.round(20 * PACT.heal); P.hp = Math.min(P.maxHp, P.hp + h); banner(`+${h} ❤️`, '#ff5a7a'); sfx.rune(); }
      else if (g.kind === 'feather'){ hasFeather = true; banner('🪶 Перо феникса! Если погибнешь — возродишься', '#ff8a3d'); sfx.rune(); }
      else if (g.kind === 'rune'){ inventory.push(g.r); banner(`🎁 Руна: ${RUNES[g.r].icon} ${RUNES[g.r].name}! ${KEY('craft')} — вставить`, '#ffd25a'); sfx.rune(); }
      else { gainXp(g.v); sfx.gem(); }
    }
  }
  gems = gems.filter(g => !g.taken);

  for (const p of particles){
    if (p.debris){ p.vy += 0.35; p.x += p.vx; p.y += p.vy; if (p.y > p.floor){ p.y = p.floor; p.vy *= -0.3; p.vx *= 0.6; } }
    else if (!p.ring){ p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; }
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
  if (particles.length > 2400) particles.splice(0, particles.length - 2400);
  spawnAmbient();
  for (const a of amb){
    a.life--;
    if (a.wob !== undefined){ a.wob += 0.03; a.x += Math.sin(a.wob) * 0.4; }
    a.x += a.vx + (RUN.pact === 'wind' ? wind.x * 1.5 : 0); a.y += a.vy + (RUN.pact === 'wind' ? wind.y * 1.5 : 0);
    if (a.snow && a.y > cam.y + H / 2 + 20) a.life = 0;
  }
  amb = amb.filter(a => a.life > 0);
  for (const z of zaps) z.life--; zaps = zaps.filter(z => z.life > 0);
  for (const b of beams) b.life--; beams = beams.filter(b => b.life > 0);
  for (const s of slashes) s.life--; slashes = slashes.filter(s => s.life > 0);
  for (const n of nums){ n.t--; n.y -= 0.7; } nums = nums.filter(n => n.t > 0);
  for (const b of banners) b.t--; banners = banners.filter(b => b.t > 0);

  if (comboTimer > 0 && --comboTimer === 0) combo = 0;
  if (flash > 0) flash = flash < 0.02 ? 0 : flash * 0.85;
  for (const b of skyBolts) b.life--;
  skyBolts = skyBolts.filter(b => b.life > 0);
  cam.x += (P.x - cam.x) * 0.12; cam.y += (P.y - cam.y) * 0.12;
  if (shake > 0) shake *= 0.85;
  if (shake < 0.3) shake = 0;

  if (P.hp <= 0){ if (hasFeather) revive(); else if (lives > 0) secondWind(); else { die(); return; } }
  if (pendingLevels > 0 && state === 'play') openPick('level');
}
function hurt(d){
  if (PACT.dodge && Math.random() < PACT.dodge){
    player.inv = 20; sfx.dash();
    nums.push({ x: player.x, y: player.y - player.r - 10, v: 'уклон!', t: 40, color: '#9dffb0' });
    return;
  }
  if (hasPet('guard')) d *= 0.75;
  d *= PACT.armor;
  mom.fill(0);
  player.hp -= d; player.inv = Math.round(40 * PACT.iframes); shake = Math.max(shake, 6);
  burst(player.x, player.y, 14, '#ff3d6e', 5);
  sfx.hurt();
}
// «Второе дыхание» из прокачки
function secondWind(){
  const P = player;
  lives--;
  P.hp = P.maxHp * 0.5; P.inv = 150;
  burst(P.x, P.y, 60, '#ffffff', 8);
  banner('🕊️ ВТОРОЕ ДЫХАНИЕ!', '#ffffff');
  sfx.level();
}
function die(){
  setState('dead');
  const R = finishRun();
  const sec = Math.floor(tick / 60);
  const best = slotDmg.indexOf(Math.max(...slotDmg));
  $('deadStats').innerHTML = `<span>⏱ Время</span><b>${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}</b>
    <span>⭐ Уровень</span><b>${level}</b><span>💀 Убито</span><b>${kills}</b><span>🔥 Комбо</span><b>${bestCombo}</b><span>🏚 Разрушено</span><b>${destroyed}</b><span>🐾 Питомцы</span><b>${pets.map(p => PETS[p.id].icon).join('') || '—'}</b><span>🎽 Костюмы</span><b>${WARD.unlocked.length}/${Object.keys(COSTUMES).length}</b>
    <span style="grid-column:1/-1;margin-top:6px;color:var(--dim)">${BIOMES[RUN.biome].icon} ${BIOMES[RUN.biome].name} · ${PACTS[RUN.pact].icon} ${PACTS[RUN.pact].name}</span>
    <span style="grid-column:1/-1;color:var(--dim)">Лучший навык: <b style="float:none">${skillName(slots[best])}</b> — ${Math.round(slotDmg[best])} урона</span>`;
  $('deadReward').innerHTML = `<div class="rwTotal">💠 +${R.total} <small>осколков хаоса</small></div>` +
    `<div class="rwParts">${R.parts.filter(([, v]) => v > 0).map(([k, v]) => `<span>${k} +${v}</span>`).join('')}` +
    (R.bonus ? `<span>💰 алчность +${R.bonus}</span>` : '') + `</div><div class="rwHave">теперь у тебя 💠 ${META.shards}</div>`;
  tone(300, 1.2, { type: 'sawtooth', vol: 0.08, to: 60 });
  showModal('deadM');
}
