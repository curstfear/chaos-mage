// ---------- враги ----------
const ETYPES = {
  slime:   { r: 13, hp: 18,  spd: 1.15, dmg: 8,  xp: 1,  color: '#ff4f8b', sc: 2 },
  runner:  { r: 10, hp: 10,  spd: 2.3,  dmg: 6,  xp: 1,  color: '#ffb347', sc: 1.8 },
  brute:   { r: 26, hp: 110, spd: 0.75, dmg: 18, xp: 5,  color: '#c74bff', sc: 2.2 },
  shooter: { r: 15, hp: 34,  spd: 1.0,  dmg: 8,  xp: 3,  color: '#4bd6ff', sc: 1.8 },
  boss:    { r: 56, hp: 900, spd: 0.85, dmg: 30, xp: 60, color: '#ff2e4d', sc: 3, boss: true, name: 'Король демонов' },
  lich:    { r: 44, hp: 750, spd: 0.7,  dmg: 26, xp: 60, color: '#b46bff', sc: 3, boss: true, name: 'Лич' },
  slimeking: { r: 60, hp: 1300, spd: 0.6, dmg: 32, xp: 70, color: '#5aff8a', sc: 3.2, boss: true, name: 'Король слизней' },
  golem:   { r: 58, hp: 1700, spd: 0.5, dmg: 38, xp: 80, color: '#a89a8a', sc: 3, boss: true, name: 'Каменный голем' },
  reaper:  { r: 40, hp: 650, spd: 1.5,  dmg: 28, xp: 70, color: '#7a8aff', sc: 3, boss: true, name: 'Жнец' },
  queen:   { r: 46, hp: 1000, spd: 0.9, dmg: 26, xp: 70, color: '#ffcc33', sc: 3, boss: true, name: 'Королева роя' },
  clock:   { r: 48, hp: 1150, spd: 0.65, dmg: 28, xp: 75, color: '#7fe8ff', sc: 3, boss: true, name: 'Часовщик' },
  // бомбер подбегает и взрывается (и по своим тоже); щитоносец держит щит к магу
  bomber:  { r: 13, hp: 22,  spd: 1.7,  dmg: 0,  xp: 2,  color: '#ff8a3d', sc: 2 },
  shield:  { r: 17, hp: 70,  spd: 0.9,  dmg: 12, xp: 4,  color: '#c8d2e0', sc: 2 },
  wasp:    { r: 8,  hp: 7,   spd: 2.9,  dmg: 5,  xp: 1,  color: '#ffd23a', sc: 1.8 }, // свита Королевы роя
  crystal: { r: 16, hp: 35,  spd: 0,    dmg: 0,  xp: 4,  color: '#ffffff', sc: 2 },
  goblin:  { r: 14, hp: 260, spd: 2.5,  dmg: 0,  xp: 40, color: '#ffd700', sc: 2 }
};
const BOSSES = Object.keys(ETYPES).filter(k => ETYPES[k].boss);
// враги крепнут всё быстрее: линейно плюс квадратичный довесок к концу забега
// после 5-й минуты враги крепчают заметно быстрее, чтобы сильный билд не превращал забег в прогулку:
// к 7-й минуте здоровье +1×, к 10-й +6×, урон растёт вдвое быстрее прежнего
const LATE_SEC = 300;
const lateSec = () => Math.max(0, tick / 60 - LATE_SEC);
const hpScale = () => { const s = tick / 60, l = lateSec() / 120; return 1 + s / 70 + (s / 300) * (s / 300) + l * l; };
const dmgScale = () => 1 + tick / 60 / 400 + lateSec() / 240;
// руны с 5-й по 7-ю минуту постепенно падают реже, до 70% от обычного
const runeLate = () => Math.max(0.7, 1 - lateSec() / 120 * 0.3);
function spawnEnemy(type, x, y, elite, force){
  if (enemies.length >= 440 && !ETYPES[type].boss && type !== 'goblin' && !force) return null;
  if (x === undefined){
    // ищем точку за краем экрана, не внутри постройки
    for (let t = 0; t < 6; t++){
      const a = rnd(0, TAU), d = Math.hypot(W, H) / 2 + 60;
      x = player.x + Math.cos(a) * d; y = player.y + Math.sin(a) * d;
      if (!solidAt(x, y, 20)) break;
    }
  }
  const T = ETYPES[type], st = type === 'crystal';
  const hp = T.hp * (st ? 1 + tick / 60 / 240 : hpScale() * PACT.ehp) * (elite ? 4 : 1);
  const e = { type, ...T, color: st ? BIOMES[RUN.biome].crystal : T.color, r: T.r * (elite ? 1.3 : 1), xp: T.xp * (elite ? 4 : 1),
                 dmg: T.dmg * dmgScale() * (elite ? 1.3 : 1), spd: T.spd * (1 + Math.min(0.4, tick / 60 / 1500)), boss: !!T.boss, phase: 0, pt: 0,
                 x, y, hp, maxHp: hp, flash: 0, slow: 0, burn: 0, burnDmg: 0, mark: 0, iceT: 0, cd: rnd(60, 140), wob: rnd(0, TAU),
                 dead: false, static: st, elite: !!elite, life: type === 'goblin' ? 1300 : 0, side: Math.random() < 0.5 ? 1 : -1 };
  enemies.push(e);
  return e;
}
function spawner(){
  const sec = tick / 60;
  const every = Math.max(3, Math.round((36 - sec * 0.22) / PACT.spawn));
  if (tick % every === 0){
    const n = 1 + Math.floor(sec / 45);
    const eliteCh = sec > 120 ? Math.min(0.08, 0.015 + (sec - 120) / 15000) : 0;
    for (let k = 0; k < n; k++){
      const r = Math.random();
      spawnEnemy(sec > 60 && r < 0.1 ? 'brute' : sec > 90 && r < 0.2 ? 'shooter' : sec > 150 && r < 0.27 ? 'bomber'
                 : sec > 200 && r < 0.33 ? 'shield' : sec > 20 && r < 0.5 ? 'runner' : 'slime',
                 undefined, undefined, Math.random() < eliteCh);
    }
  }
  // боссы приходят раз в 90 с, после 8 минуты — по двое
  if (++bossTimer >= 60 * 90){
    bossTimer = 0; bossCount++;
    const first = bossCount === 1 ? 'boss' : pick(BOSSES.filter(b => b !== lastBoss));
    const list = [first];
    if (sec > 480) list.push(pick(BOSSES.filter(b => b !== first)));
    for (const b of list) spawnEnemy(b);
    lastBoss = first;
    banner('👑 ИДЁТ БОСС: ' + list.map(b => ETYPES[b].name).join(' и ') + '!', '#ff2e4d'); shake = 8; sfx.boss();
  }
}
// у каждого босса свой набор атак
function bossAttack(e, dx, dy, d){
  const P = player, ang = Math.atan2(dy, dx);
  const shoot = (a, sp, c, life) => ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: life || 220, c });
  if (e.type === 'boss'){
    if (--e.cd > 0) return;
    e.cd = 200;
    for (let k = 0; k < 18; k++) shoot(k / 18 * TAU + tick * 0.01, 3);
    for (let k = 0; k < 4; k++) spawnEnemy('slime', e.x + rnd(-40, 40), e.y + rnd(-40, 40));
  } else if (e.type === 'lich'){
    // спираль из трёх рукавов, телепорт к магу и призыв бесов
    if (e.phase > 0){ e.phase--; if (e.phase % 6 === 0) for (let k = 0; k < 3; k++) shoot(e.pt + k * TAU / 3, 2.8, '#c48bff'); e.pt += 0.22; return; }
    if (--e.cd > 0) return;
    e.cd = 150;
    const r = Math.random();
    if (r < 0.35 && d > 260){
      burst(e.x, e.y, 30, '#b46bff', 5);
      const a = rnd(0, TAU); e.x = P.x + Math.cos(a) * 230; e.y = P.y + Math.sin(a) * 230;
      burst(e.x, e.y, 30, '#b46bff', 5); ring(e.x, e.y, 70, '#b46bff');
    } else if (r < 0.7){ e.phase = 90; e.pt = rnd(0, TAU); }
    else for (let k = 0; k < 4; k++) spawnEnemy('runner', e.x + rnd(-50, 50), e.y + rnd(-50, 50), Math.random() < 0.25, true);
  } else if (e.type === 'slimeking'){
    // прыгает к магу, при приземлении — кольцо пуль и толчок
    if (e.phase > 0){
      e.phase--;
      e.x += e.jx; e.y += e.jy; e.hop = Math.sin(e.phase / 34 * Math.PI) * 60;
      if (e.phase === 0){
        e.hop = 0; shake = Math.max(shake, 9); ring(e.x, e.y, 140, '#5aff8a'); burst(e.x, e.y, 30, '#5aff8a', 6); sfx.boom(120);
        for (let k = 0; k < 16; k++) shoot(k / 16 * TAU, 3.2, '#7dff5a');
        if (Math.hypot(P.x - e.x, P.y - e.y) < 140 && P.inv <= 0) hurt(e.dmg * 0.6);
        for (let k = 0; k < 2; k++) spawnEnemy('slime', e.x + rnd(-50, 50), e.y + rnd(-50, 50), false, true);
      }
      return;
    }
    if (--e.cd > 0) return;
    e.cd = 170; e.phase = 34;
    const tx = P.x + rnd(-40, 40), ty = P.y + rnd(-40, 40);
    e.jx = (tx - e.x) / 34; e.jy = (ty - e.y) / 34;
    const jl = Math.hypot(e.jx, e.jy); if (jl > 11){ e.jx *= 11 / jl; e.jy *= 11 / jl; }
  } else if (e.type === 'golem'){
    // замирает, краснеет и бросается тараном; иногда швыряет камни во все стороны
    if (e.phase > 40){ e.phase--; e.charge = true; if (e.phase === 41){ e.jx = Math.cos(ang) * 8; e.jy = Math.sin(ang) * 8; } return; }
    if (e.phase > 0){
      e.phase--; e.x += e.jx; e.y += e.jy;
      if (tick % 3 === 0) particles.push({ x: e.x, y: e.y + e.r * 0.6, vx: rnd(-1, 1), vy: -1, life: 20, max: 20, color: '#a89a8a', r: 5 });
      for (const s of nearSolids.slice()) if (Math.hypot(s.col.x - e.x, s.col.y - e.y) < e.r + s.ext * 0.6) damageSolid(s, 999);
      if (e.phase === 0) e.charge = false;
      return;
    }
    if (--e.cd > 0) return;
    e.cd = 160;
    if (Math.random() < 0.55) e.phase = 80;
    else { for (let k = 0; k < 10; k++) shoot(k / 10 * TAU + rnd(-0.1, 0.1), 2.6, '#c8b89a', 260); shake = Math.max(shake, 5); }
  } else if (e.type === 'queen'){
    // носится зигзагом, выпускает рой ос, плюётся веером жал
    if (e.phase > 0){
      e.phase--; e.x += e.jx; e.y += e.jy;
      if (e.phase % 8 === 0){ const a = ang + (e.phase % 16 ? 0.9 : -0.9); e.jx = Math.cos(a) * 6.5; e.jy = Math.sin(a) * 6.5; }
      return;
    }
    if (--e.cd > 0) return;
    e.cd = 140;
    const r = Math.random();
    if (r < 0.4){ for (let k = 0; k < 6; k++) spawnEnemy('wasp', e.x + rnd(-40, 40), e.y + rnd(-40, 40), false, true); ring(e.x, e.y, 80, '#ffd23a'); }
    else if (r < 0.75) for (let k = -3; k <= 3; k++) shoot(ang + k * 0.14, 4.6, '#ffd23a');
    else { e.phase = 48; e.jx = Math.cos(ang) * 6.5; e.jy = Math.sin(ang) * 6.5; }
  } else if (e.type === 'clock'){
    // стрелки-спирали, «остановка времени» кольцом вокруг мага и перемотка назад
    e.hist = e.hist || [];
    if (tick % 10 === 0){ e.hist.push(e.x, e.y); if (e.hist.length > 48) e.hist.splice(0, 2); }
    if (e.phase > 0){ e.phase--; if (e.phase % 5 === 0) for (const k of [0, Math.PI]) shoot(e.pt + k, 3, '#7fe8ff'); e.pt += 0.11; return; }
    if (--e.cd > 0) return;
    e.cd = 170;
    const r = Math.random();
    if (r < 0.4){
      // пули замирают кольцом вокруг мага и через секунду летят внутрь
      const n = 12, R = 210;
      for (let k = 0; k < n; k++){
        const a = k / n * TAU;
        ebullets.push({ x: P.x + Math.cos(a) * R, y: P.y + Math.sin(a) * R, vx: -Math.cos(a) * 3.2, vy: -Math.sin(a) * 3.2, life: 260, wait: 70, c: '#7fe8ff' });
      }
      ring(P.x, P.y, R, '#7fe8ff'); [880, 660].forEach((f, k) => tone(f, 0.12, { type: 'square', vol: 0.04, delay: k * 0.25 }));
    } else if (r < 0.75){ e.phase = 100; e.pt = ang; }
    else if (e.hist.length >= 40){
      // перемотка: возвращается туда, где был 4 с назад, и чуть лечится
      burst(e.x, e.y, 24, '#7fe8ff', 5);
      e.x = e.hist[0]; e.y = e.hist[1]; e.hist = [];
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.04);
      burst(e.x, e.y, 24, '#7fe8ff', 5); ring(e.x, e.y, 80, '#7fe8ff'); tone(1200, 0.4, { vol: 0.04, to: 300 });
    } else e.cd = 20;
  } else if (e.type === 'reaper'){
    // веер прицельных серпов, иногда рывок сквозь мага
    if (e.phase > 0){ e.phase--; e.x += e.jx; e.y += e.jy; return; }
    if (--e.cd > 0) return;
    e.cd = 110;
    if (Math.random() < 0.3 && d < 420){ e.phase = 22; e.jx = Math.cos(ang) * 13; e.jy = Math.sin(ang) * 13; ring(e.x, e.y, 50, '#7a8aff'); }
    else for (let k = -2; k <= 2; k++) shoot(ang + k * 0.18, 4.2, '#9aa8ff');
  }
}
const ARROWS = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
function events(){
  weatherTick(); goldTick();
  if (tick === 36000) unlockSet('golden');
  if (--evTimer <= 0){ evTimer = Math.round(60 * rnd(70, 100)); startEvent(); }
  if (ev){ ev.t--; if (ev.type === 'meteors' && ev.t % 22 === 0) envMeteor(); if (ev.t <= 0) ev = null; }
  if (moonT > 0) moonT--;
  if (RUN.pact === 'moon' && tick % 3600 === 0){ moonT = 900; banner('🌕 Восходит кровавая луна!', '#ff3d5a'); sfx.event(); }
  if (RUN.pact === 'unstable' && tick % 2400 === 0) mutateRune();
  if (RUN.pact === 'wind' && tick % 1200 === 0){
    const a = rnd(0, TAU); wind = { x: Math.cos(a), y: Math.sin(a) };
    banner(`🌬️ Ветер сменился ${ARROWS[Math.round(a / (TAU / 8)) & 7]}`, '#c8fff0');
  }
}
function startEvent(){
  const opts = ['meteors', 'goblin', 'elite'];
  if (RUN.pact !== 'moon') opts.push('moon');
  const type = pick(opts);
  sfx.event();
  if (type === 'meteors'){ ev = { type, t: 600 }; banner('☄️ Метеоритный дождь! Берегись!', '#ff8a3d'); }
  else if (type === 'goblin'){ spawnEnemy('goblin'); banner('💰 Золотой гоблин! Догони его!', '#ffd700'); }
  else if (type === 'elite'){ for (let k = 0; k < 6; k++) spawnEnemy(pick(['slime', 'runner', 'brute', 'shooter', 'bomber', 'shield']), undefined, undefined, true); banner('⚔️ Элитная волна!', '#ff5a7a'); }
  else { moonT = 900; banner('🌕 Кровавая луна! Враги злее, опыт ×3', '#ff3d5a'); }
}
function envMeteor(){
  const P = player;
  meteors.push({ env: true, x: P.x + rnd(-450, 450), y: P.y + rnd(-320, 320), t: 55, max: 55, rad: 85, dmg: 25 + 15 * hpScale(),
                 color: '#ff8a3d', el: 'fire', slot: -1, depth: 9, size: 1, trigger: 0, split: 0 });
}
function mutateRune(){
  const spots = [];
  slots.forEach((s, i) => {
    if (i >= unlocked()) return;
    if (s.form) spots.push([i, 'form']);
    if (s.element) spots.push([i, 'el']);
    s.mods.forEach((m, j) => { if (m) spots.push([i, 'mod', j]); });
  });
  if (!spots.length) return;
  const [i, k, j] = pick(spots), s = slots[i];
  const old = k === 'form' ? s.form : k === 'el' ? s.element : s.mods[j];
  const nw = pick((k === 'form' ? FORMS : k === 'el' ? ELS : MODS).filter(r => r !== old));
  if (k === 'form') s.form = nw; else if (k === 'el') s.element = nw; else s.mods[j] = nw;
  recompile(); sfx.mutate();
  banner(`☢️ Мутация! ${RUNES[old].icon} → ${RUNES[nw].icon} ${RUNES[nw].name}`, '#9dff5a');
}
