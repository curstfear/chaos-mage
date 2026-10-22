// ---------- урон ----------
// руна на земле. «Цепь» — главная руна для комбо, поэтому её видно издалека: столб света, звон и баннер
function dropRune(x, y, r){
  const g = { x, y, kind: 'rune', r };
  if (r === 'trigger'){
    g.chain = true;
    banner('🔗 ВЫПАЛА ЦЕПЬ!', '#7fe8ff');
    sfx.chain(); ring(x, y, 90, '#7fe8ff'); ring(x, y, 150, '#ffe08a');
  }
  gems.push(g);
}
// случайная руна с чуть повышенным шансом «Цепи» (~5% вместо ~2.5%)
const randomRune = list => Math.random() < 0.025 ? 'trigger' : pick(list);
let shareLock = false; // чтобы урон по «Привязи» не гонялся туда-обратно бесконечно
function damage(e, amt, color, slot, crit){
  if (e.dead) return;
  e.hp -= amt; e.flash = 5;
  if (e.debt) e.debt.sum += amt * 0.5;
  if (e.tie && !e.tie.dead && !shareLock){ shareLock = true; damage(e.tie, amt / 3, '#ff9ff3', slot); shareLock = false; }
  if (slot >= 0) slotDmg[slot] += amt;
  if (nums.length < 140) nums.push({ x: e.x + rnd(-8, 8), y: e.y - e.r, v: Math.round(amt) + (crit ? '!' : ''), t: crit ? 55 : 40, color, crit });
  if (crit) sfx.crit(); else sfx.hit();
  // дикого зверя нельзя убить: на 15% здоровья он падает оглушённым
  if (e.wild && e.hp < e.maxHp * 0.15){
    e.hp = e.maxHp * 0.15;
    if (!e.stun){ e.stun = 900; e.tame = 0; banner('😵 Зверь оглушён! Постой рядом 3 с, чтобы приручить', '#9dff9a'); }
    return;
  }
  if (e.hp <= 0) kill(e);
}
function hitEnemy(e, src, dmg, x, y){
  if (e.dead) return;
  let d = dmg, crit = false;
  if (src.berserk) d *= 1 + Math.min(1, src.berserk * (1 - player.hp / player.maxHp));
  if (e.mark > 0) d *= 1.5;
  const el = src.el === 'chaos' ? pick(CHAOS_ELS) : src.el;
  if (weather.type === 'rain' && el === 'fire') d *= 0.6;
  if (weather.type === 'storm' && el === 'lightning') d *= 1.5;
  if (weather.type === 'gale' && el === 'wind') d *= 1.5;
  if (el === 'crystal' && Math.random() < 0.25){ d *= 3; crit = true; }
  if (el === 'holy' && (e.elite || e.boss || e.type === 'goblin' || e.wild)) d *= 1.8;
  if (el === 'fire' && hasPet('dragon')) d *= 1.15;
  if (e.acid) d *= 1 + e.acid * 0.08;
  if (e.wet > 0 && (el === 'lightning' || el === 'ice')) d *= 1.5;
  if (src.sniper) d *= 1 + Math.min(1, Math.hypot(e.x - player.x, e.y - player.y) / 500) * src.sniper;
  if (src.keen && Math.random() < 0.2 * src.keen){ d *= 2; crit = true; }
  if (PACT.crit && !crit && Math.random() < PACT.crit){ d *= PACT.critMul; crit = true; }
  if (src.execute && !e.static && e.hp - d < e.maxHp * (e.boss ? 0.05 : 0.2)){ d = Math.max(d, e.hp); crit = true; }
  // щитоносец держит щит к магу: удар с его стороны почти не проходит
  if (e.type === 'shield' && Math.hypot(x - e.x, y - e.y) > 3 && (x - e.x) * (player.x - e.x) + (y - e.y) * (player.y - e.y) > 0){
    d *= 0.25; crit = false;
    if (can('blk', 60)) tone(1200, 0.05, { type: 'square', vol: 0.025, to: 800 });
    particles.push({ x: (x + e.x) / 2, y: (y + e.y) / 2, vx: rnd(-2, 2), vy: rnd(-2, 2), life: 10, max: 10, color: '#ffffff', r: 3 });
  }
  if (src.mark) e.mark = 240;
  e.lastSrc = src;
  damage(e, d, src.color, src.slot, crit);
  if (src.vampiric) player.hp = Math.min(player.maxHp, player.hp + Math.min(2, d * 0.03 * src.vampiric));
  // масти «Колоды»
  if (src.card === 'heart') player.hp = Math.min(player.maxHp, player.hp + 0.6);
  else if (src.card === 'diamond') gainXp(0.3 * PACT.xp);
  if (e.dead) return;
  if (src.card === 'club' && !e.boss && !e.static){ e.slow = Math.max(e.slow, 90); if (Math.random() < 0.35) e.stunT = Math.max(e.stunT || 0, 30); }
  // «Бильярд»: враг улетает по ходу удара
  if (src.billiard && !e.boss && !e.static){
    let dx = e.x - x, dy = e.y - y;
    if (Math.hypot(dx, dy) < 2){ dx = e.x - player.x; dy = e.y - player.y; }
    const dd = Math.hypot(dx, dy) || 1;
    e.fly = 22; e.fvx = dx / dd * 11; e.fvy = dy / dd * 11;
    e.fsrc = { ...src, billiard: false, card: null, trigger: 0, split: 0, gravity: 0, triggered: true, dmg: src.dmg * 0.7, hit: new Set([e]) };
  }
  if (src.stun && !e.static && !e.boss && Math.random() < 0.25 * src.stun) e.stunT = Math.max(e.stunT || 0, 36);
  if (el === 'water'){
    e.wet = 240;
    if (!e.static && !e.boss){ let dx = e.x - x, dy = e.y - y; if (Math.hypot(dx, dy) < 2){ dx = e.x - player.x; dy = e.y - player.y; } const dd = Math.hypot(dx, dy) || 1; e.x += dx / dd * 6; e.y += dy / dd * 6; }
  }
  else if (el === 'star'){
    if (Math.random() < 0.2 && meteors.length < 120)
      meteors.push({ ...src, el: null, color: '#fff27a', x: e.x, y: e.y, t: 16, max: 16, rad: 42 * src.size, size: 0.4 * src.size, dmg: dmg * 0.8,
                     trigger: 0, split: 0, gravity: 0, detonate: 0, triggered: true, geyser: false });
  }
  else if (el === 'acid'){ e.acid = Math.min(10, (e.acid || 0) + 1); e.acidT = 300; }
  else if (el === 'earth'){ if (!e.static && !e.boss && Math.random() < 0.35) e.stunT = 42; }
  else if (el === 'fire'){ e.burn = weather.type === 'rain' ? 60 : 180; e.burnDmg = Math.max(e.burnDmg, dmg * 0.18); }
  else if (el === 'ice') e.slow = 130;
  else if (el === 'lightning'){
    const done = new Set([e]);
    let from = e;
    for (let k = 0; k < 2; k++){
      const t = nearest(from.x, from.y, 170, done); if (!t) break;
      done.add(t); zaps.push({ x1: from.x, y1: from.y, x2: t.x, y2: t.y, life: 10 });
      damage(t, dmg * 0.6, '#ffe95a', src.slot); from = t;
    }
    sfx.zap();
  }
  else if (el === 'poison'){ if (puddles.length < 70) puddles.push({ x, y, r: 42 * src.size * (weather.type === 'rain' ? 1.3 : 1), t: weather.type === 'rain' ? 330 : 210, dmg: Math.max(2, dmg * 0.2), slot: src.slot }); }
  else if (el === 'void'){
    near(x, y, 130, (o, dx, dy) => { if (o.static) return; const dd = Math.hypot(dx, dy) || 1; o.x -= dx / dd * Math.min(18, dd * 0.4); o.y -= dy / dd * Math.min(18, dd * 0.4); });
    player.hp = Math.min(player.maxHp, player.hp + 0.4);
  }
  else if (el === 'wind' && !e.static){
    let dx = e.x - x, dy = e.y - y;
    if (Math.hypot(dx, dy) < 2){ dx = e.x - player.x; dy = e.y - player.y; }
    const dd = Math.hypot(dx, dy) || 1, k = e.boss ? 3 : 16;
    e.x += dx / dd * k; e.y += dy / dd * k;
  }
}
function onImpact(src, x, y){
  // «Гравитация»: мини-чёрная дыра в точке удара, один раз на снаряд
  if (src.gravity && !src.child && !src.gravDone && holes.length < 25 && (!src.gravGroup || src.gravGroup.n < src.gravity)){
    src.gravDone = true;
    if (src.gravGroup) src.gravGroup.n++;
    holes.push({ x, y, t: 90, r: 110 * src.size, color: src.color === PURE ? '#b46bff' : src.color,
                 src: { ...src, dmg: src.dmg * (0.6 + 0.4 * src.gravity), gravity: 0, trigger: 0, split: 0, triggered: true, hit: new Set() } });
    sfx.hole();
  }
  if (src.split && !src.child && !src.splitDone){
    src.splitDone = true;
    const n = 3 * src.split, off = rnd(0, TAU);
    for (let k = 0; k < n; k++){
      const a = off + k / n * TAU;
      spawnProj({ ...src, kind: 'bolt', x, y, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, r: 4 * src.size, life: 32, curve: 0,
                  dmg: src.dmg * 0.5, child: true, split: 0, trigger: 0, pierce: 0, bounce: 0, hit: new Set(src.hit || []) });
    }
  }
  if (src.trigger && !src.triggered && src.depth < 3 && triggerBudget > 0 && src.slot >= 0){
    src.triggered = true; triggerBudget--;
    const nx = nextSlot(src.slot);
    if (nx >= 0){
      const t = nearest(x, y, 400, src.hit);
      cast(nx, x, y, t ? Math.atan2(t.y - y, t.x - x) : rnd(0, TAU), src.depth + 1, false);
      ring(x, y, 26, '#ffd25a');
    }
  }
}
function explode(src, x, y, rad){
  near(x, y, rad, e => hitEnemy(e, src, src.dmg, x, y));
  damageSolidsIn(x, y, rad, src.dmg);
  onImpact(src, x, y);
  ring(x, y, rad, src.color);
  burst(x, y, 26, src.color, 6);
  shake = Math.min(10, shake + rad / 45);
  sfx.boom(rad);
}
// «Рассрочка»: накопленный долг выплачивается одним большим ударом
function payDebt(e){
  const D = e.debt; e.debt = null;
  if (D.sum < 1) return;
  damage(e, D.sum, '#ffd700', D.slot, true);
  burst(e.x, e.y, 14, '#ffd700', 4); ring(e.x, e.y, 40, '#ffd700');
  if (can('debt', 80)) [1319, 1760].forEach((f, k) => tone(f, 0.15, { vol: 0.04, delay: k * 0.05 }));
}
// бомбер: взрыв ранит всех врагов рядом, а мага — только если взорвался сам, а не от твоего удара
function bomberBlast(e, hurtsPlayer){
  if (e.blown) return;
  e.blown = true;
  const R = 90;
  near(e.x, e.y, R, o => { if (o !== e && !o.static) damage(o, o.boss ? o.maxHp * 0.03 : Math.max(20, o.maxHp * 0.35), '#ff8a3d', -1); });
  if (hurtsPlayer && Math.hypot(player.x - e.x, player.y - e.y) < R && player.inv <= 0) hurt(22 * dmgScale());
  ring(e.x, e.y, R, '#ff8a3d'); burst(e.x, e.y, 30, '#ff8a3d', 7); burst(e.x, e.y, 12, '#ffe08a', 5);
  shake = Math.max(shake, 5); sfx.boom(R);
}
function kill(e){
  e.dead = true;
  const src = e.lastSrc;
  if (e.type === 'bomber') bomberBlast(e, false);
  // долг умершего не пропадает: взрывается по соседям
  if (e.debt && e.debt.sum > 1){
    const D = e.debt; e.debt = null;
    near(e.x, e.y, 110, o => { if (!o.static) damage(o, D.sum * 0.6, '#ffd700', D.slot, true); });
    ring(e.x, e.y, 110, '#ffd700'); burst(e.x, e.y, 24, '#ffd700', 6);
  }
  // каждое убийство рядом растит семена «Урожая»
  if (!e.static) for (const p of projs) if (p.kind === 'seed' && p.stage < 12 && Math.hypot(p.x - e.x, p.y - e.y) < 170){
    p.stage++; p.grow = 12;
    particles.push({ x: e.x, y: e.y, vx: (p.x - e.x) / 12, vy: (p.y - e.y) / 12, life: 12, max: 12, color: '#9dff7a', r: 3 });
  }
  if (!e.static){
    kills++; combo++; comboTimer = 110;
    score += e.boss ? 10 : e.elite ? 3 : 1; // очки на рекорд: обычный враг, элитный, босс
    if (combo > bestCombo) bestCombo = combo;
    sfx.kill(combo);
    if (kills === 500) unlockSet('street');
    if (combo === 100) unlockSet('fiesta');
    if (combo % 200 === 0 && comboRuneCd <= 0) chaosBurst();
  } else sfx.crystal();
  burst(e.x, e.y, e.boss ? 80 : e.static ? 22 : 12, e.color, e.boss ? 9 : 4);
  const xpv = e.xp * PACT.xp * (moonT > 0 ? 3 : 1) * (goldT > 0 ? 2 : 1) * (src && src.el === 'gold' ? 2 : 1);
  if (gems.length < 500) gems.push({ x: e.x, y: e.y, v: xpv, kind: e.xp >= 4 ? 'big' : 'xp' });
  else gainXp(xpv);
  if (!e.static && Math.random() < 0.012) gems.push({ x: e.x + 10, y: e.y, kind: 'heart' });
  let runeCh = e.static ? 0.06 : e.elite ? 0.15 : 0.001;
  runeCh *= PACT.rune * (hasPet('toad') ? 1.5 : 1) * runeLate();
  if (src && src.el === 'gold') runeCh += 0.01;
  const nr = e.type === 'goblin' ? 2 : e.boss ? 1 : Math.random() < runeCh ? 1 : 0;
  for (let k = 0; k < nr; k++){
    const r = e.boss ? pick([...FORMS, 'trigger', 'echo', 'split', 'detonate']) : randomRune([...ELS, ...MODS]);
    dropRune(e.x + rnd(-15, 15), e.y + rnd(-15, 15), r);
  }
  if (e.type === 'brute') for (let k = 0; k < 3; k++) spawnEnemy('slime', e.x + rnd(-15, 15), e.y + rnd(-15, 15));
  if (e.type === 'slimeking') for (let k = 0; k < 6; k++) spawnEnemy('slime', e.x + rnd(-40, 40), e.y + rnd(-40, 40), k < 2, true);
  if (e.boss){
    shake = 10; banner(`👑 ${e.name} повержен!`, '#ff5a7a'); unlockSet('king');
    if (!hasPet('phoenix') && !hasFeather) gems.push({ x: e.x, y: e.y - 20, kind: 'feather' });
  }
  if (e.type === 'goblin') banner('💰 Гоблин пойман! Руны твои!', '#ffd700');
  if (src){
    if (src.detonate && detBudget > 0 && src.depth < 4){
      detBudget--;
      explode({ ...src, dmg: src.dmg * 0.5, depth: src.depth + 1, trigger: 0, split: 0, triggered: true }, e.x, e.y, 55 * src.size);
    }
    if (src.el === 'blood') player.hp = Math.min(player.maxHp, player.hp + 1);
    if (src.el === 'bone' && !src.child && projs.length < 700){
      const off = rnd(0, TAU);
      for (let k = 0; k < 3; k++){
        const a = off + k / 3 * TAU;
        spawnProj({ ...src, kind: 'bolt', x: e.x, y: e.y, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, r: 4 * (src.size || 1), life: 30, curve: 0,
                    dmg: src.dmg * 0.4, child: true, split: 0, trigger: 0, pierce: 0, bounce: 0, boom: 0, wig: 0, lance: false, hit: new Set([e]) });
      }
    }
  }
  if (RUN.pact === 'vampire' && !e.static) player.hp = Math.min(player.maxHp, player.hp + 1.5);
  if (RUN.pact === 'wild' && !e.static && Math.random() < 0.05) wildCast(e.x, e.y);
}
// каждые 200 комбо — одна руна рядом с магом, но не чаще раза в 45 с
function chaosBurst(){
  const P = player;
  comboRuneCd = 60 * 45;
  banner(`🔥 КОМБО ×${combo}! Держи руну!`, '#ffe08a');
  sfx.rune();
  dropRune(P.x + rnd(-70, 70), P.y + rnd(-70, 70), randomRune([...FORMS, ...ELS, ...MODS]));
  ring(P.x, P.y, 160, '#7fe8ff'); ring(P.x, P.y, 240, '#ffe08a');
}
function weatherTick(){
  if (--weather.t <= 0){
    const prev = weather.type;
    const type = prev === 'clear' ? pick(['rain', 'storm', 'gale']) : 'clear';
    weather = { type, t: Math.round(60 * (type === 'clear' ? rnd(70, 110) : rnd(45, 70))) };
    if (prev === 'storm' && player.hp > 0) unlockSet('storm');
    banner(type === 'clear' ? '☀️ Небо прояснилось' : `${weatherName(type)}: ${WEATHER[type].desc}`, type === 'clear' ? '#ffe08a' : '#a8d8ff');
    sfx.event(); weatherSound();
  }
  if (weather.type === 'storm' && Math.random() < 1 / 100) lightningStrike();
  if (weather.type === 'gale'){
    if (!gust && Math.random() < 1 / 180){ const a = rnd(0, TAU); gust = { x: Math.cos(a), y: Math.sin(a), t: 80 }; sfx.gust(); }
    if (gust){
      gust.t--;
      const f = Math.sin(gust.t / 80 * Math.PI) * 3.2;
      for (const e of enemies) if (!e.static && !e.boss){ e.x += gust.x * f; e.y += gust.y * f; }
      player.x += gust.x * f * 0.35; player.y += gust.y * f * 0.35;
      for (const p of projs) if (p.kind === 'bolt'){ p.vx += gust.x * 0.08; p.vy += gust.y * 0.08; }
      if (amb.length < 220) for (let k = 0; k < 3; k++)
        amb.push({ x: cam.x + rnd(-W / 2, W / 2) - gust.x * W / 3, y: cam.y + rnd(-H / 2, H / 2) - gust.y * H / 3, vx: gust.x * 16, vy: gust.y * 16, life: 40, max: 40, r: 1.5, color: '#e8f4ff', streak: true });
      if (gust.t <= 0) gust = null;
    }
  }
}
// молния с неба: бьёт врагов, постройки, а иногда и рядом с магом
function lightningStrike(){
  const P = player;
  const cand = enemies.filter(e => !e.static && Math.abs(e.x - P.x) < W / 2 && Math.abs(e.y - P.y) < H / 2);
  let x, y;
  if (cand.length && Math.random() < 0.8){ const t = pick(cand); x = t.x; y = t.y; }
  else { x = P.x + rnd(-W / 2.5, W / 2.5); y = P.y + rnd(-H / 2.5, H / 2.5); }
  skyBolts.push({ x, y, life: 14, seed: Math.random() });
  flash = 1;
  const src = { dmg: 30 + 20 * hpScale(), color: '#ffe95a', el: 'lightning', slot: -1, depth: 9, size: 1, trigger: 0, split: 0 };
  near(x, y, 70, e => hitEnemy(e, src, src.dmg, x, y));
  damageSolidsIn(x, y, 50, 90);
  if (Math.hypot(P.x - x, P.y - y) < 60 && P.inv <= 0) hurt(10);
  burst(x, y, 20, '#ffe95a', 6); ring(x, y, 70, '#ffe95a');
  shake = Math.min(10, shake + 3);
  sfx.thunder();
}
