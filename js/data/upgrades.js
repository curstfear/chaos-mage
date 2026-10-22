// ---------- дерево прокачки ----------
// Прокачка между забегами за 💠 осколки хаоса (core/meta.js).
// Каждый навык дерева меняет характеристики забега P (см. pactStats): apply(P, уровень).
// pos: [столбец 0..2, строка 0..3] внутри своей ветки; req: [id навыка, нужный уровень] — откуда тянется линия.
// cost — цена первого уровня, каждый следующий дороже (upCost в core/meta.js).
const BRANCHES = {
  power:   { name: 'Сила',      icon: '⚔️', color: '#ff7a4a' },
  guard:   { name: 'Стойкость', icon: '🛡️', color: '#ff5a8a' },
  agility: { name: 'Ловкость',  icon: '💨', color: '#5fd3ff' },
  wisdom:  { name: 'Знания',    icon: '📜', color: '#ffd25a' }
};
const pct = v => Math.round(v * 100) + '%';
const UPGRADES = [
  // ⚔️ Сила
  { id: 'might', b: 'power', pos: [1, 0], icon: '🗡️', name: 'Мощь', max: 5, cost: 15,
    fx: l => `+${pct(0.06 * l)} к урону всех навыков`, apply: (P, l) => { P.dmg *= 1 + 0.06 * l; } },
  { id: 'haste', b: 'power', pos: [0, 1], req: ['might', 1], icon: '⏳', name: 'Скорочтение', max: 5, cost: 25,
    fx: l => `перезарядка навыков −${pct(0.04 * l)}`, apply: (P, l) => { P.cd *= 1 - 0.04 * l; } },
  { id: 'crit', b: 'power', pos: [2, 1], req: ['might', 1], icon: '🎯', name: 'Меткий глаз', max: 5, cost: 25,
    fx: l => `${pct(0.04 * l)} шанс критического удара`, apply: (P, l) => { P.crit += 0.04 * l; } },
  { id: 'reach', b: 'power', pos: [0, 2], req: ['haste', 2], icon: '🏹', name: 'Дальний полёт', max: 3, cost: 55,
    fx: l => `снаряды летят на ${pct(0.12 * l)} быстрее и дальше`, apply: (P, l) => { P.proj += 0.12 * l; } },
  { id: 'crush', b: 'power', pos: [2, 2], req: ['crit', 2], icon: '💥', name: 'Сокрушение', max: 3, cost: 55,
    fx: l => `криты бьют ×${(2 + 0.4 * l).toFixed(1)} вместо ×2`, apply: (P, l) => { P.critMul += 0.4 * l; } },
  { id: 'heart', b: 'power', pos: [1, 3], req: ['might', 5], icon: '❤️‍🔥', name: 'Сердце хаоса', max: 1, cost: 380,
    fx: () => '+25% к урону и +5% шанс крита', apply: P => { P.dmg *= 1.25; P.crit += 0.05; } },

  // 🛡️ Стойкость
  { id: 'vigor', b: 'guard', pos: [1, 0], icon: '💪', name: 'Крепкое тело', max: 5, cost: 15,
    fx: l => `+${12 * l} к здоровью`, apply: (P, l) => { P.hp += 12 * l; } },
  { id: 'regen', b: 'guard', pos: [0, 1], req: ['vigor', 1], icon: '🌿', name: 'Регенерация', max: 5, cost: 25,
    fx: l => `+${(0.3 * l).toFixed(1)} здоровья в секунду`, apply: (P, l) => { P.regen += 0.3 * l; } },
  { id: 'armor', b: 'guard', pos: [2, 1], req: ['vigor', 1], icon: '🧥', name: 'Мантия', max: 5, cost: 30,
    fx: l => `получаешь на ${pct(0.05 * l)} меньше урона`, apply: (P, l) => { P.armor *= 1 - 0.05 * l; } },
  { id: 'healer', b: 'guard', pos: [0, 2], req: ['regen', 2], icon: '💗', name: 'Целитель', max: 2, cost: 50,
    fx: l => `сердечки лечат на ${pct(0.5 * l)} больше`, apply: (P, l) => { P.heal += 0.5 * l; } },
  { id: 'iframes', b: 'guard', pos: [2, 2], req: ['armor', 2], icon: '✨', name: 'Заговорённый', max: 3, cost: 50,
    fx: l => `неуязвимость после удара дольше на ${pct(0.3 * l)}`, apply: (P, l) => { P.iframes += 0.3 * l; } },
  { id: 'second', b: 'guard', pos: [1, 3], req: ['vigor', 5], icon: '🕊️', name: 'Второе дыхание', max: 1, cost: 350,
    fx: () => 'раз за забег встаёшь после смерти с половиной здоровья', apply: P => { P.lives += 1; } },

  // 💨 Ловкость
  { id: 'swift', b: 'agility', pos: [1, 0], icon: '👢', name: 'Лёгкие сапоги', max: 5, cost: 15,
    fx: l => `+${pct(0.04 * l)} к скорости бега`, apply: (P, l) => { P.speed *= 1 + 0.04 * l; } },
  { id: 'dash', b: 'agility', pos: [0, 1], req: ['swift', 1], icon: '🌀', name: 'Вихрь', max: 4, cost: 25,
    fx: l => `рывок перезаряжается на ${pct(0.1 * l)} быстрее`, apply: (P, l) => { P.dashCd *= 1 - 0.1 * l; } },
  { id: 'magnet', b: 'agility', pos: [2, 1], req: ['swift', 1], icon: '🧲', name: 'Магнит', max: 4, cost: 20,
    fx: l => `кристаллы опыта притягиваются на ${pct(0.3 * l)} дальше`, apply: (P, l) => { P.magnet += 0.3 * l; } },
  { id: 'dodge', b: 'agility', pos: [0, 2], req: ['dash', 2], icon: '🍃', name: 'Уклонение', max: 3, cost: 60,
    fx: l => `${pct(0.06 * l)} шанс увернуться от удара`, apply: (P, l) => { P.dodge += 0.06 * l; } },
  { id: 'finder', b: 'agility', pos: [2, 2], req: ['magnet', 2], icon: '🔍', name: 'Ловец рун', max: 3, cost: 50,
    fx: l => `руны выпадают на ${pct(0.15 * l)} чаще`, apply: (P, l) => { P.rune *= 1 + 0.15 * l; } },
  { id: 'ghost', b: 'agility', pos: [1, 3], req: ['swift', 5], icon: '👻', name: 'Призрачный шаг', max: 1, cost: 350,
    fx: () => 'после рывка целую секунду тебя невозможно ранить', apply: P => { P.dashInv = 60; } },

  // 📜 Знания
  { id: 'study', b: 'wisdom', pos: [1, 0], icon: '📖', name: 'Прилежание', max: 5, cost: 15,
    fx: l => `+${pct(0.06 * l)} к получаемому опыту`, apply: (P, l) => { P.xp *= 1 + 0.06 * l; } },
  { id: 'greed', b: 'wisdom', pos: [0, 1], req: ['study', 1], icon: '💰', name: 'Алчность', max: 5, cost: 20,
    fx: l => `+${pct(0.1 * l)} осколков за забег`, apply: (P, l) => { P.shards *= 1 + 0.1 * l; } },
  { id: 'choice', b: 'wisdom', pos: [2, 1], req: ['study', 2], icon: '🃏', name: 'Широкий выбор', max: 1, cost: 80,
    fx: () => 'при новом уровне 4 руны на выбор вместо 3', apply: P => { P.choice += 1; } },
  { id: 'stash', b: 'wisdom', pos: [0, 2], req: ['greed', 1], icon: '🎒', name: 'Запас рун', max: 3, cost: 40,
    fx: l => `+${l} случайн${l === 1 ? 'ая руна' : 'ые руны'} в начале забега`, apply: (P, l) => { P.startRunes += l; } },
  { id: 'diplomat', b: 'wisdom', pos: [2, 2], req: ['choice', 1], icon: '🤝', name: 'Дипломат', max: 2, cost: 60,
    fx: l => `+${l} пакт${l === 1 ? '' : 'а'} на выбор перед забегом`, apply: (P, l) => { P.pactChoice += l; } },
  { id: 'mentor', b: 'wisdom', pos: [1, 3], req: ['study', 5], icon: '🧙', name: 'Наставник', max: 2, cost: 200,
    fx: l => `забег начинается сразу с ${l + 1}-го уровня`, apply: (P, l) => { P.startLv += l; } }
];
const UP = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
