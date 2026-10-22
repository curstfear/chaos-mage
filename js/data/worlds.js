// ---------- миры и пакты ----------
const BIOMES = {
  abyss: { name: 'Неоновая бездна',  icon: '🌌', bg: '#0a0816', hazard: 'well',   crystal: '#b46bff', amb: '#b9a4ff', desc: 'Гравитационные колодцы затягивают всех к чёрной дыре.' },
  lava:  { name: 'Пылающие пустоши', icon: '🌋', bg: '#140806', hazard: 'lava',   crystal: '#ff9a3d', amb: '#ff8a3d', desc: 'Лавовые озёра жгут и врагов, и тебя.' },
  ice:   { name: 'Ледяная пустошь',  icon: '🧊', bg: '#0a1a2a', hazard: 'ice',    crystal: '#8fe3ff', amb: '#ffffff', desc: 'На льду скользко, а враги на нём вязнут.' },
  swamp: { name: 'Ядовитые топи',    icon: '🍄', bg: '#0a130a', hazard: 'geyser', crystal: '#7dff5a', amb: '#9dff7a', desc: 'Ядовитые гейзеры извергаются каждые несколько секунд.' },
  caves: { name: 'Кристальные пещеры', icon: '💎', bg: '#0c0a1e', hazard: 'resonator', crystal: '#ff7ad8', amb: '#9ff0ff', desc: 'Кристаллы-резонаторы то и дело бьют лучом насквозь — и по врагам, и по тебе.' },
  desert: { name: 'Зыбучие дюны',    icon: '🏜️', bg: '#2a1e10', hazard: 'quicksand', crystal: '#ffd27a', amb: '#e8c88a', desc: 'Зыбучие пески вязнут под ногами и тянут на дно. Ветер несёт песок.' }
};
const PACTS = {
  glass:     { icon: '🔮', name: 'Стеклянная пушка',  desc: 'Весь урон ×2, но здоровье всего 50.' },
  giant:     { icon: '🗿', name: 'Великан',            desc: 'Ты огромный: здоровье ×2.5, но ты медленнее и в тебя проще попасть.' },
  tiny:      { icon: '🐭', name: 'Кроха',              desc: 'Ты крошечный и шустрый, но здоровье 60.' },
  swarm:     { icon: '🐜', name: 'Рой',                desc: 'Врагов вдвое больше, опыта за каждого ×1.5.' },
  unstable:  { icon: '☢️', name: 'Нестабильные руны',  desc: 'Каждые 40 с одна вставленная руна мутирует в другую. Старт с +2 рунами.' },
  dark:      { icon: '🌑', name: 'Вечная ночь',        desc: 'Темнота. Видно только вокруг тебя и вспышки магии. Опыт ×1.5.' },
  wild:      { icon: '🎲', name: 'Дикий мир',          desc: 'Примерно каждое 20-е убийство вызывает случайное безумное заклинание.' },
  vampire:   { icon: '🦇', name: 'Голод',              desc: 'Здоровье постоянно тает, но каждое убийство лечит.' },
  echo:      { icon: '📢', name: 'Мир-эхо',            desc: 'Все навыки получают бесплатное Эхо, но враги на 60% живучее.' },
  wind:      { icon: '🌬️', name: 'Ветер перемен',     desc: 'Сильный ветер сносит всех и всё и меняет направление каждые 20 с.' },
  greed:     { icon: '💰', name: 'Жадность',           desc: 'Руны падают в 4 раза чаще, но опыта вдвое меньше.' },
  moon:      { icon: '🌕', name: 'Кровавая луна',      desc: 'Каждую минуту восходит луна: враги звереют, опыт ×3.' },
  alchemist: { icon: '🧪', name: 'Алхимик',            desc: 'Начинаешь без навыка, зато с 6 случайными рунами.' }
};
function pactStats(id){
  const P = { dmg: 1, hp: 85, r: 14, speed: 1, spawn: 1, xp: 1, rune: 1, ehp: 1,
    // то, что меняет только прокачка (data/upgrades.js)
    cd: 1, proj: 1, crit: 0, critMul: 2, armor: 1, regen: 0, heal: 1, iframes: 1, lives: 0,
    magnet: 1, dashCd: 1, dashInv: 16, dodge: 0, shards: 1, choice: 0, pactChoice: 0, startRunes: 0, startLv: 0 };
  if (id === 'glass'){ P.dmg = 2; P.hp = 50; }
  if (id === 'giant'){ P.hp = 250; P.r = 26; P.speed = 0.8; }
  if (id === 'tiny'){ P.hp = 60; P.r = 8; P.speed = 1.3; }
  if (id === 'swarm'){ P.spawn = 2; P.xp = 1.5; }
  if (id === 'dark') P.xp = 1.5;
  if (id === 'echo') P.ehp = 1.6;
  if (id === 'greed'){ P.rune = 4; P.xp = 0.5; }
  return applyMeta(P);
}
