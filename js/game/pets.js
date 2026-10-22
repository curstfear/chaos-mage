// ---------- питомцы ----------
const PETS = {
  healer:  { name: 'Слизняш-лекарь',    icon: '💚', desc: 'каждые 6 с лечит тебя на 8 ❤️',                        how: 'оглуши дикого слизня 🐾 и постой рядом 3 с' },
  guard:   { name: 'Огр-телохранитель', icon: '🛡️', desc: '−25% урона по тебе, лупит врагов рядом',               how: 'оглуши дикого огра 🐾 и постой рядом 3 с' },
  dragon:  { name: 'Драконыш',           icon: '🐉', desc: 'плюётся огнём, огонь +15%',                           how: 'найди гнездо 🥚 и высиди яйцо 12 с, отбиваясь от стаи' },
  toad:    { name: 'Жаба удачи',         icon: '🐸', desc: 'руны чаще ×1.5, опыт тянется издалека',                how: 'поймай золотую жабу — только рывком (Пробел)' },
  owl:     { name: 'Сова-мудрец',        icon: '🦉', desc: 'опыт +30%',                                           how: 'найди древо совы и отдай ей 3 руны' },
  phoenix: { name: 'Феникс',             icon: '🔥', desc: 'лечит 1 ❤️ в секунду',                                how: 'подбери перо 🪶 с босса и погибни с ним' }
};
const hasPet = id => pets.some(p => p.id === id);
function addPet(id, x, y){
  if (hasPet(id)) return;
  pets.push({ id, x: x ?? player.x, y: y ?? player.y, vx: 0, cd: 90 });
  banner(`${PETS[id].icon} Новый питомец: ${PETS[id].name}!`, '#9dff9a');
  sfx.level();
}
// питомцы идут за магом «паровозиком» по его следу и делают каждый своё
function petsTick(){
  const P = player;
  trail.unshift(P.x, P.y); if (trail.length > 240) trail.length = 240;
  pets.forEach((p, i) => {
    const idx = Math.min(trail.length / 2 - 1, 14 + i * 13) | 0;
    const tx = trail[idx * 2], ty = trail[idx * 2 + 1], ox = p.x;
    p.x += (tx - p.x) * 0.12; p.y += (ty - p.y) * 0.12; p.vx = p.x - ox;
    if (p.id === 'phoenix') P.hp = Math.min(P.maxHp, P.hp + 1 / 60);
    if (--p.cd > 0) return;
    if (p.id === 'healer'){
      p.cd = 360;
      if (P.hp < P.maxHp){ P.hp = Math.min(P.maxHp, P.hp + 8); nums.push({ x: P.x, y: P.y - 34, v: '+8 ❤️', t: 50, color: '#7dff9a', crit: true }); ring(P.x, P.y, 46, '#7dff9a'); }
    } else if (p.id === 'guard'){
      const t = nearest(p.x, p.y, 110);
      if (!t){ p.cd = 10; return; }
      p.cd = 50;
      damage(t, 10 + level * 3, '#4bb6ff', -1);
      if (!t.dead && !t.static && !t.boss){ const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1; t.x += dx / d * 26; t.y += dy / d * 26; }
      burst(t.x, t.y, 8, '#4bb6ff', 3); sfx.thud();
    } else if (p.id === 'dragon'){
      const t = nearest(p.x, p.y, 420);
      if (!t){ p.cd = 20; return; }
      p.cd = 120;
      const a = Math.atan2(t.y - p.y + 26, t.x - p.x);
      spawnProj({ kind: 'bolt', x: p.x, y: p.y - 26, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, r: 8, life: 70, dmg: 14 + level * 2.5,
                  color: '#ff7a2e', el: 'fire', slot: -1, depth: 3, size: 1.2, speed: 1, curve: 0, hit: new Set() });
      tone(300, 0.15, { type: 'sawtooth', vol: 0.03, to: 120 });
    } else p.cd = 9999;
  });
}
// дикий зверь: раз в ~3 мин, его нельзя убить — только оглушить и приручить
function wildTick(){
  if (--wildTimer > 0) return;
  wildTimer = Math.round(60 * rnd(150, 200));
  const opts = [];
  if (!hasPet('healer')) opts.push('slime');
  if (!hasPet('guard')) opts.push('brute');
  if (!opts.length || enemies.some(e => e.wild)) return;
  const e = spawnEnemy(pick(opts), undefined, undefined, false, true);
  if (!e) return;
  e.wild = true; e.hp = e.maxHp = e.maxHp * 10; e.r *= 1.25; e.xp = 0;
  banner('🐾 Рядом бродит дикий зверь! Оглуши его и приручи', '#9dff9a'); sfx.event();
}
// золотая жаба: прыгает прочь, поймать можно только рывком
function toadTick(){
  const P = player;
  if (!toad){
    if (hasPet('toad') || --toadTimer > 0) return;
    toadTimer = Math.round(60 * rnd(240, 300));
    const a = rnd(0, TAU);
    toad = { x: P.x + Math.cos(a) * 420, y: P.y + Math.sin(a) * 420, sx: 0, sy: 0, tx: 0, ty: 0, hop: 0, wait: 30, t: 1500 };
    pushOut(toad, 14);
    banner('🐸 Золотая жаба! Поймай её рывком (Пробел)', '#ffd700'); sfx.event();
    return;
  }
  const T = toad; T.t--;
  if (T.hop > 0){ T.hop--; const k = 1 - T.hop / 22; T.x = T.sx + (T.tx - T.sx) * k; T.y = T.sy + (T.ty - T.sy) * k; }
  else if (--T.wait <= 0){
    const d = Math.hypot(T.x - P.x, T.y - P.y), len = d < 200 ? 140 : 90;
    let a = Math.atan2(T.y - P.y, T.x - P.x) + rnd(-1.2, 1.2);
    if (d > 600) a += Math.PI; // слишком далеко ускакала — прыгает обратно, чтобы не потеряться
    for (let k = 0; k < 6 && solidAt(T.x + Math.cos(a) * len, T.y + Math.sin(a) * len, 14); k++) a += 1;
    T.sx = T.x; T.sy = T.y; T.tx = T.x + Math.cos(a) * len; T.ty = T.y + Math.sin(a) * len;
    T.hop = 22; T.wait = Math.round(rnd(25, 55));
    if (d < 450) tone(rnd(500, 700), 0.08, { type: 'square', vol: 0.025, to: 300 });
  }
  if (P.dash > 0 && Math.hypot(T.x - P.x, T.y - P.y) < P.r + 22){ addPet('toad', T.x, T.y); burst(T.x, T.y, 30, '#ffd700', 6); toad = null; return; }
  if (T.t <= 0){ banner('💨 Жаба ускакала…', '#a99cc9'); toad = null; }
}
// древо совы: постой рядом — сова попросит 3 руны
function owlTick(){
  const P = player;
  for (const s of nearSolids){
    if (s.type !== 'owltree' || s.used) continue;
    if (s.cool > 0) s.cool--;
    if (hasPet('owl') || Math.hypot(P.x - s.x, P.y - s.y + 10) > 100){ s.prog = 0; continue; }
    if (inventory.length < 3){
      if (!(s.cool > 0)){ banner('🦉 «Принеси мне 3 руны, и я стану твоим учителем»', '#ffe08a'); s.cool = 400; }
      continue;
    }
    if (s.cool > 0) continue;
    s.prog = (s.prog || 0) + 1;
    if (s.prog >= 45){ s.prog = 0; s.cool = 300; openOwl(s); return; }
  }
}
// перо феникса: если погибнуть с ним — маг возрождается, а феникс остаётся
function revive(){
  const P = player;
  hasFeather = false;
  P.hp = P.maxHp * 0.5; P.inv = 150;
  explode({ dmg: 80 + level * 10, color: '#ff7a2e', el: 'fire', slot: -1, depth: 9, size: 2, trigger: 0, split: 0, triggered: true }, P.x, P.y, 280);
  burst(P.x, P.y, 80, '#ffd25a', 9);
  banner('🔥 ФЕНИКС ВОЗРОДИЛ ТЕБЯ!', '#ff8a3d');
  addPet('phoenix', P.x, P.y);
}
function goldTick(){
  if (goldT > 0){ if (--goldT === 0) banner('✨ Золотой час закончился', '#ffe08a'); }
  else if (--goldTimer <= 0){
    goldTimer = Math.round(60 * rnd(200, 260)); goldT = 1200;
    banner('✨ ЗОЛОТОЙ ЧАС! Опыт ×2, но враги бьют больнее', '#ffd700'); sfx.gold();
  }
}
function wildCast(x, y){
  const s = { form: pick(FORMS), element: pick(ELS), mods: [pick(SAFE_WILD), pick(SAFE_WILD), null] };
  const S = compile(s); S.trigger = 0; S.echo = 0; S.wild = 0;
  nums.push({ x, y: y - 24, v: '🎲 ' + skillName(s), t: 70, color: '#ffd25a', crit: true });
  cast(-1, x, y, rnd(0, TAU), 1, true, S);
}
function gainXp(v){
  xp += v * (hasPet('owl') ? 1.3 : 1);
  while (xp >= xpNeed()){ xp -= xpNeed(); level++; pendingLevels++; recompile(); }
}
