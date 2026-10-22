// ---------- шмотки мага ----------
// Маг собирается из семи слотов. Вещь достаётся одним из способов (src):
//   free — есть с самого начала, shop — покупается за 🪙 монеты (price),
//   ach — выдаётся за достижение (набор из ACH_SETS), roll — выпадает только в рулетке (rar — редкость).
// Внешний вид задают поля kind/c/… — их рисует js/sprites/mage.js, следы — js/render/trail.js.
const SLOTS = {
  hat:   { name: 'Шляпа',  icon: '🎩' },
  robe:  { name: 'Мантия', icon: '👘' },
  staff: { name: 'Посох',  icon: '🪄' },
  boots: { name: 'Сапоги', icon: '👢' },
  trail: { name: 'След',   icon: '✨' },
  eyes:  { name: 'Глаза',  icon: '👀' },
  beard: { name: 'Борода', icon: '🧔' }
};
// w — вес в рулетке (шанс = w / сумму). Шанс каждой вещи внутри редкости одинаковый, повторы не исключаются.
const RARITY = {
  junk:   { name: 'Хлам',        color: '#a08a5a', w: 38 },
  common: { name: 'Обычное',     color: '#c9c6d8', w: 30 },
  rare:   { name: 'Редкое',      color: '#4b9bff', w: 20 },
  epic:   { name: 'Эпическое',   color: '#c48bff', w: 9 },
  legend: { name: 'Легендарное', color: '#ffb020', w: 3 }
};
const ROLL_COST = 25;

const ITEMS = {
  // шляпы
  hat_wizard:   { slot: 'hat', name: 'Колпак мага', src: 'free', kind: 'wizard', c: ['#3b2a9a', '#2c1d6e'], band: '#ffd25a' },
  hat_none:     { slot: 'hat', name: 'Без шляпы', src: 'free', kind: 'none' },
  hat_red:      { slot: 'hat', name: 'Алый колпак', src: 'shop', price: 40, kind: 'wizard', c: ['#c0303a', '#801820'], band: '#ffd25a' },
  hat_witch:    { slot: 'hat', name: 'Ведьминская шляпа', src: 'shop', price: 60, kind: 'wizard', c: ['#2a2a34', '#16161e'], band: '#9b5aff' },
  hat_beanie:   { slot: 'hat', name: 'Шапка с помпоном', src: 'shop', price: 80, kind: 'beanie', c: ['#2fa0d0', '#1f6a96'], band: '#ffffff' },
  hat_hood:     { slot: 'hat', name: 'Капюшон', src: 'shop', price: 100, kind: 'hood', c: ['#3a5a2a', '#24401a'] },
  hat_top:      { slot: 'hat', name: 'Цилиндр', src: 'shop', price: 120, kind: 'top', c: ['#22202c', '#121018'], band: '#c0303a' },
  hat_viking:   { slot: 'hat', name: 'Шлем викинга', src: 'shop', price: 180, kind: 'viking', c: ['#9a9aaa', '#6a6a7a'] },
  hat_cap:      { slot: 'hat', name: 'Кепка', src: 'ach', kind: 'cap', c: ['#e0303a', '#a01820'] },
  hat_sombrero: { slot: 'hat', name: 'Сомбреро', src: 'ach', kind: 'sombrero', c: ['#f0c040', '#b88a20'], band: '#e0303a' },
  hat_crown:    { slot: 'hat', name: 'Корона', src: 'ach', kind: 'crown', c: ['#ffd25a', '#b8861e'], gems: ['#ff2e4d', '#4bd6ff'] },
  hat_pirate:   { slot: 'hat', name: 'Треуголка', src: 'ach', kind: 'pirate', c: ['#1a1a22', '#0c0c10'], band: '#c0392b' },
  hat_storm:    { slot: 'hat', name: 'Грозовой колпак', src: 'ach', kind: 'wizard', c: ['#22406e', '#16294a'], band: '#ffe95a', bolt: true },
  hat_golden:   { slot: 'hat', name: 'Золотой колпак', src: 'ach', kind: 'wizard', c: ['#ffd25a', '#c99a2a'], band: '#ffffff' },
  hat_bucket:   { slot: 'hat', name: 'Ведро', src: 'roll', rar: 'junk', kind: 'bucket', c: ['#9aa0aa', '#6a707a'] },
  hat_pot:      { slot: 'hat', name: 'Кастрюля', src: 'roll', rar: 'junk', kind: 'pot', c: ['#c8ccd4', '#8a909a'] },
  hat_cone:     { slot: 'hat', name: 'Дорожный конус', src: 'roll', rar: 'junk', kind: 'cone', c: ['#ff7a1a', '#c0500a'] },
  hat_foil:     { slot: 'hat', name: 'Шапочка из фольги', src: 'roll', rar: 'junk', kind: 'foil', c: ['#c8ccd4', '#8a909a'] },
  hat_beret:    { slot: 'hat', name: 'Берет', src: 'roll', rar: 'common', kind: 'beret', c: ['#c0303a', '#801820'] },
  hat_cowboy:   { slot: 'hat', name: 'Ковбойская шляпа', src: 'roll', rar: 'common', kind: 'cowboy', c: ['#9a6a3a', '#6a4420'], band: '#2a1a10' },
  hat_chef:     { slot: 'hat', name: 'Поварской колпак', src: 'roll', rar: 'common', kind: 'chef', c: ['#ffffff', '#d0d4e0'] },
  hat_mushroom: { slot: 'hat', name: 'Шляпка мухомора', src: 'roll', rar: 'rare', kind: 'mushroom', c: ['#e0303a', '#a01820'] },
  hat_party:    { slot: 'hat', name: 'Праздничный колпак', src: 'roll', rar: 'rare', kind: 'party', c: ['#4bd6ff', '#ff4f8b'], band: '#ffe95a' },
  hat_halo:     { slot: 'hat', name: 'Нимб', src: 'roll', rar: 'rare', kind: 'halo', c: ['#ffe95a', '#e0b020'], aura: '#fff3a0' },
  hat_horns:    { slot: 'hat', name: 'Рога демона', src: 'roll', rar: 'epic', kind: 'horns', c: ['#c0303a', '#801820'] },
  hat_cosmic:   { slot: 'hat', name: 'Звёздный колпак', src: 'roll', rar: 'epic', kind: 'wizard', c: ['#16206a', '#0c1244'], band: '#ffe95a', stars: true },
  hat_chaos:    { slot: 'hat', name: 'Корона хаоса', src: 'roll', rar: 'legend', kind: 'crown', c: ['#9b5aff', '#5a2aa0'], gems: ['#7dff5a', '#ff4f8b'], aura: '#c48bff' },

  // мантии: c — основной, тень, блик; pat — узор
  robe_classic: { slot: 'robe', name: 'Мантия мага', src: 'free', c: ['#4a35b0', '#35248a', '#6a52e0'], trim: '#ffd25a' },
  robe_forest:  { slot: 'robe', name: 'Лесная мантия', src: 'shop', price: 60, c: ['#2f8a4a', '#1f5a30', '#4fc070'], trim: '#ffd25a' },
  robe_ash:     { slot: 'robe', name: 'Пепельная мантия', src: 'shop', price: 60, c: ['#6a6a7a', '#4a4a58', '#8a8a9c'], trim: '#c9c6d8' },
  robe_pink:    { slot: 'robe', name: 'Розовая мантия', src: 'shop', price: 90, c: ['#e05aa0', '#a83a76', '#ff8ac8'], trim: '#ffffff' },
  robe_snow:    { slot: 'robe', name: 'Снежная мантия', src: 'shop', price: 90, c: ['#e8eef8', '#b8c4d8', '#ffffff'], trim: '#4bd6ff' },
  robe_necro:   { slot: 'robe', name: 'Мантия некроманта', src: 'shop', price: 140, c: ['#2a1a2a', '#140c14', '#4a2a3a'], trim: '#7dff5a' },
  robe_street:  { slot: 'robe', name: 'Уличная куртка', src: 'ach', c: ['#2f6fd0', '#1f4c96', '#5a96f0'], trim: '#ffffff' },
  robe_fiesta:  { slot: 'robe', name: 'Пончо фиесты', src: 'ach', c: ['#e05a2a', '#a83a16', '#ff8a50'], trim: '#2fd07a' },
  robe_king:    { slot: 'robe', name: 'Королевская мантия', src: 'ach', c: ['#8a1a44', '#5a102c', '#b83a64'], trim: '#ffd25a' },
  robe_pirate:  { slot: 'robe', name: 'Пиратский камзол', src: 'ach', c: ['#2e2e3c', '#1a1a24', '#4a4a60'], trim: '#c0392b' },
  robe_storm:   { slot: 'robe', name: 'Грозовая мантия', src: 'ach', c: ['#1e3a6a', '#122648', '#3a62a0'], trim: '#7fe8ff' },
  robe_golden:  { slot: 'robe', name: 'Золотая мантия', src: 'ach', c: ['#e8b84a', '#a8781e', '#ffe08a'], trim: '#ffffff' },
  robe_sack:    { slot: 'robe', name: 'Мешок из-под картошки', src: 'roll', rar: 'junk', c: ['#a88a5a', '#7a6038', '#c8a878'], trim: '#5a4020', pat: 'patch' },
  robe_trash:   { slot: 'robe', name: 'Мусорный пакет', src: 'roll', rar: 'junk', c: ['#2a2a2e', '#151518', '#4a4a52'], trim: '#3a3a40' },
  robe_pajama:  { slot: 'robe', name: 'Пижама', src: 'roll', rar: 'common', c: ['#7ab0e8', '#4a80c0', '#a8d0ff'], trim: '#ffffff', pat: 'stripes', pc: '#ffffff' },
  robe_polka:   { slot: 'robe', name: 'Платье в горошек', src: 'roll', rar: 'common', c: ['#e04a4a', '#a02a2a', '#ff7a7a'], trim: '#ffffff', pat: 'dots', pc: '#ffffff' },
  robe_starry:  { slot: 'robe', name: 'Звёздная ночь', src: 'roll', rar: 'rare', c: ['#1a2a6a', '#101a44', '#2a3a8a'], trim: '#ffe08a', pat: 'stars', pc: '#ffe95a' },
  robe_chess:   { slot: 'robe', name: 'Шахматная мантия', src: 'roll', rar: 'rare', c: ['#e8e8f0', '#b8b8c8', '#ffffff'], trim: '#c0303a', pat: 'checker', pc: '#2a2a34' },
  robe_lava:    { slot: 'robe', name: 'Лавовая мантия', src: 'roll', rar: 'epic', c: ['#3a1a10', '#200c08', '#5a2a18'], trim: '#ff8a2a', pat: 'cracks', pc: '#ff7a1a', aura: '#ff6a2a' },
  robe_rainbow: { slot: 'robe', name: 'Радужная мантия', src: 'roll', rar: 'legend', c: ['#ff4f4f', '#c03030', '#ff8a8a'], trim: '#ffffff', pat: 'rainbow', aura: '#ff9ff3' },

  // посохи: kind — навершие, c — его цвет, glow — свечение (по умолчанию c), wood — древко
  staff_classic: { slot: 'staff', name: 'Посох мага', src: 'free', kind: 'orb', c: '#7fe8ff' },
  staff_branch:  { slot: 'staff', name: 'Живая ветка', src: 'shop', price: 40, kind: 'branch', c: '#4fc070', wood: ['#8a5a2a', '#5a3416'] },
  staff_fire:    { slot: 'staff', name: 'Огненный посох', src: 'shop', price: 50, kind: 'orb', c: '#ff6a2a' },
  staff_crystal: { slot: 'staff', name: 'Кристальный посох', src: 'shop', price: 90, kind: 'crystal', c: '#c48bff' },
  staff_moon:    { slot: 'staff', name: 'Лунный посох', src: 'shop', price: 120, kind: 'moon', c: '#ffe08a', wood: ['#c8ccd4', '#8a909a'] },
  staff_skull:   { slot: 'staff', name: 'Посох с черепом', src: 'shop', price: 150, kind: 'skull', c: '#e8e0c8', glow: '#7dff5a', wood: ['#3a2a2a', '#1a1010'] },
  staff_street:  { slot: 'staff', name: 'Розовый посох', src: 'ach', kind: 'orb', c: '#ff8aa0' },
  staff_fiesta:  { slot: 'staff', name: 'Солнечный посох', src: 'ach', kind: 'orb', c: '#ffe95a' },
  staff_king:    { slot: 'staff', name: 'Скипетр', src: 'ach', kind: 'orb', c: '#ff4f8b', wood: ['#ffd25a', '#b8861e'] },
  staff_pirate:  { slot: 'staff', name: 'Пиратский посох', src: 'ach', kind: 'orb', c: '#7dff5a' },
  staff_storm:   { slot: 'staff', name: 'Громовой кристалл', src: 'ach', kind: 'crystal', c: '#ffe95a' },
  staff_golden:  { slot: 'staff', name: 'Золотой посох', src: 'ach', kind: 'orb', c: '#ffffff', wood: ['#ffd25a', '#b8861e'] },
  staff_carrot:  { slot: 'staff', name: 'Морковка', src: 'roll', rar: 'junk', kind: 'carrot', c: '#4fc070', glow: '#ff9a3a', wood: ['#ff8a2a', '#c0601a'] },
  staff_plunger: { slot: 'staff', name: 'Вантуз', src: 'roll', rar: 'junk', kind: 'plunger', c: '#c0303a', wood: ['#d8a870', '#a07840'] },
  staff_fish:    { slot: 'staff', name: 'Вобла', src: 'roll', rar: 'junk', kind: 'fish', c: '#c8c0a8', glow: '#9fd0ff' },
  staff_candy:   { slot: 'staff', name: 'Леденец', src: 'roll', rar: 'common', kind: 'candy', c: '#e0303a', glow: '#ff8aa0' },
  staff_fork:    { slot: 'staff', name: 'Вилка', src: 'roll', rar: 'common', kind: 'fork', c: '#c8ccd4', glow: '#ffffff', wood: ['#c8ccd4', '#8a909a'] },
  staff_star:    { slot: 'staff', name: 'Звёздный жезл', src: 'roll', rar: 'rare', kind: 'star', c: '#ffe95a', wood: ['#4bd6ff', '#2a8ab0'] },
  staff_heart:   { slot: 'staff', name: 'Жезл любви', src: 'roll', rar: 'rare', kind: 'heart', c: '#ff4f8b', wood: ['#ff9fc8', '#c06a90'] },
  staff_eye:     { slot: 'staff', name: 'Всевидящее око', src: 'roll', rar: 'epic', kind: 'eye', c: '#c0303a', glow: '#ff4f4f', wood: ['#4a2a5a', '#2a1436'] },
  staff_void:    { slot: 'staff', name: 'Осколок бездны', src: 'roll', rar: 'epic', kind: 'crystal', c: '#3a1a6a', glow: '#9b5aff', wood: ['#2a2036', '#14101c'] },
  staff_sun:     { slot: 'staff', name: 'Посох солнца', src: 'roll', rar: 'legend', kind: 'sun', c: '#ffe95a', glow: '#ffb020', wood: ['#ffd25a', '#b8861e'], aura: '#ffb020' },

  // сапоги: c — цвет, top — верхний ряд, dot — пятнышко, wide — шире обычного, wings — крылышки
  boots_classic: { slot: 'boots', name: 'Сапоги мага', src: 'free', c: '#2a1a50' },
  boots_brown:   { slot: 'boots', name: 'Кожаные сапоги', src: 'shop', price: 30, c: '#6a4020', top: '#8a5a30' },
  boots_red:     { slot: 'boots', name: 'Красные сапоги', src: 'shop', price: 30, c: '#a02a2a', top: '#d04a4a' },
  boots_sneak:   { slot: 'boots', name: 'Кроссовки', src: 'shop', price: 80, c: '#f0f0f0', dot: '#e0303a' },
  boots_gold:    { slot: 'boots', name: 'Золотые сапоги', src: 'shop', price: 200, c: '#e8b84a', top: '#fff3a0' },
  boots_bare:    { slot: 'boots', name: 'Босиком', src: 'roll', rar: 'junk', c: '#f2c9a0', top: '#e0b088' },
  boots_socks:   { slot: 'boots', name: 'Носки с сандалиями', src: 'roll', rar: 'junk', c: '#8a6a40', top: '#ffffff' },
  boots_slipper: { slot: 'boots', name: 'Тапочки-зайцы', src: 'roll', rar: 'common', c: '#ffb0d0', top: '#ffffff', wide: true },
  boots_rubber:  { slot: 'boots', name: 'Резиновые сапоги', src: 'roll', rar: 'common', c: '#3a9a3a', top: '#5ac05a' },
  boots_ice:     { slot: 'boots', name: 'Ледяные сапоги', src: 'roll', rar: 'rare', c: '#9fe8ff', top: '#ffffff' },
  boots_fire:    { slot: 'boots', name: 'Огненные сапоги', src: 'roll', rar: 'epic', c: '#ff5a1a', top: '#ffe95a' },
  boots_wings:   { slot: 'boots', name: 'Крылатые сандалии', src: 'roll', rar: 'legend', c: '#ffd25a', top: '#fff3a0', wings: true, aura: '#ffffff' },

  // следы: kind — вид частиц (render/trail.js), icon — значок на карточке
  trail_none:    { slot: 'trail', name: 'Без следа', src: 'free', kind: 'none', icon: '🚫' },
  trail_sparks:  { slot: 'trail', name: 'Искры', src: 'shop', price: 60, kind: 'sparks', icon: '✨' },
  trail_leaves:  { slot: 'trail', name: 'Листопад', src: 'shop', price: 80, kind: 'leaves', icon: '🍃' },
  trail_bubbles: { slot: 'trail', name: 'Пузыри', src: 'shop', price: 100, kind: 'bubbles', icon: '🫧' },
  trail_snow:    { slot: 'trail', name: 'Снежинки', src: 'shop', price: 100, kind: 'snow', icon: '❄️' },
  trail_poop:    { slot: 'trail', name: 'Какашки', src: 'roll', rar: 'junk', kind: 'poop', icon: '💩' },
  trail_flies:   { slot: 'trail', name: 'Мухи', src: 'roll', rar: 'junk', kind: 'flies', icon: '🪰' },
  trail_notes:   { slot: 'trail', name: 'Ноты', src: 'roll', rar: 'common', kind: 'notes', icon: '🎵' },
  trail_hearts:  { slot: 'trail', name: 'Сердечки', src: 'roll', rar: 'rare', kind: 'hearts', icon: '💖' },
  trail_fire:    { slot: 'trail', name: 'Огненный след', src: 'roll', rar: 'rare', kind: 'fire', icon: '🔥' },
  trail_coins:   { slot: 'trail', name: 'Дождь монет', src: 'roll', rar: 'epic', kind: 'coins', icon: '🪙' },
  trail_stars:   { slot: 'trail', name: 'Звездопад', src: 'roll', rar: 'epic', kind: 'stars', icon: '🌟' },
  trail_rainbow: { slot: 'trail', name: 'Радуга', src: 'roll', rar: 'legend', kind: 'rainbow', icon: '🌈' },

  // глаза
  eyes_dots:    { slot: 'eyes', name: 'Обычные', src: 'free', kind: 'dots' },
  eyes_happy:   { slot: 'eyes', name: 'Добрые', src: 'shop', price: 30, kind: 'happy' },
  eyes_angry:   { slot: 'eyes', name: 'Злые', src: 'shop', price: 30, kind: 'angry' },
  eyes_glasses: { slot: 'eyes', name: 'Очки', src: 'shop', price: 60, kind: 'glasses' },
  eyes_shades:  { slot: 'eyes', name: 'Тёмные очки', src: 'shop', price: 120, kind: 'shades' },
  eyes_cyclops: { slot: 'eyes', name: 'Циклоп', src: 'roll', rar: 'junk', kind: 'cyclops' },
  eyes_googly:  { slot: 'eyes', name: 'Глаза-вертушки', src: 'roll', rar: 'junk', kind: 'googly' },
  eyes_sleepy:  { slot: 'eyes', name: 'Сонные', src: 'roll', rar: 'common', kind: 'sleepy' },
  eyes_monocle: { slot: 'eyes', name: 'Монокль', src: 'roll', rar: 'rare', kind: 'monocle' },
  eyes_hearts:  { slot: 'eyes', name: 'Влюблённые', src: 'roll', rar: 'rare', kind: 'hearts' },
  eyes_glow:    { slot: 'eyes', name: 'Светящиеся', src: 'roll', rar: 'epic', kind: 'glow', c: '#7fe8ff' },
  eyes_chaos:   { slot: 'eyes', name: 'Глаза хаоса', src: 'roll', rar: 'legend', kind: 'chaos', aura: '#ff4f8b' },

  // бороды: c — цвет и тень
  beard_long:    { slot: 'beard', name: 'Седая борода', src: 'free', kind: 'long', c: ['#ecebf5', '#c9c6d8'] },
  beard_none:    { slot: 'beard', name: 'Без бороды', src: 'free', kind: 'none' },
  beard_mous:    { slot: 'beard', name: 'Усы', src: 'shop', price: 40, kind: 'mustache', c: ['#ecebf5', '#c9c6d8'] },
  beard_short:   { slot: 'beard', name: 'Короткая борода', src: 'shop', price: 40, kind: 'short', c: ['#ecebf5', '#c9c6d8'] },
  beard_black:   { slot: 'beard', name: 'Чёрная борода', src: 'shop', price: 80, kind: 'long', c: ['#2a2230', '#14101a'] },
  beard_ginger:  { slot: 'beard', name: 'Рыжая борода', src: 'shop', price: 80, kind: 'long', c: ['#e0702a', '#a84a14'] },
  beard_braid:   { slot: 'beard', name: 'Борода викинга', src: 'shop', price: 150, kind: 'braid', c: ['#d0a050', '#9a7030'] },
  beard_sponge:  { slot: 'beard', name: 'Мочалка', src: 'roll', rar: 'junk', kind: 'sponge', c: ['#8ad06a', '#4a8a3a'] },
  beard_stubble: { slot: 'beard', name: 'Щетина', src: 'roll', rar: 'junk', kind: 'stubble', c: ['#8a7a7a', '#6a5a5a'] },
  beard_goatee:  { slot: 'beard', name: 'Козлиная бородка', src: 'roll', rar: 'common', kind: 'goatee', c: ['#5a3a2a', '#3a2418'] },
  beard_shoe:    { slot: 'beard', name: 'Усы-подкова', src: 'roll', rar: 'common', kind: 'horseshoe', c: ['#2a2230', '#14101a'] },
  beard_santa:   { slot: 'beard', name: 'Борода Деда Мороза', src: 'roll', rar: 'rare', kind: 'santa', c: ['#ffffff', '#d0d4e0'] },
  beard_fire:    { slot: 'beard', name: 'Огненная борода', src: 'roll', rar: 'epic', kind: 'fire', c: ['#ff9a2a', '#ff4a1a'] },
  beard_rainbow: { slot: 'beard', name: 'Радужная борода', src: 'roll', rar: 'legend', kind: 'rainbow', c: ['#ff4f4f', '#c03030'], aura: '#7fe8ff' }
};
for (const id in ITEMS) ITEMS[id].id = id;
const DEFAULT_LOOK = { hat: 'hat_wizard', robe: 'robe_classic', staff: 'staff_classic', boots: 'boots_classic', trail: 'trail_none', eyes: 'eyes_dots', beard: 'beard_long' };

// достижения выдают наборы вещей (вызов unlockSet в игровой логике)
const ACH_SETS = {
  street: { name: 'Уличный маг', how: 'Убей 500 врагов за один забег', items: ['hat_cap', 'robe_street', 'staff_street'] },
  fiesta: { name: 'Фиеста', how: 'Набери комбо ×100', items: ['hat_sombrero', 'robe_fiesta', 'staff_fiesta'] },
  king:   { name: 'Король хаоса', how: 'Победи босса', items: ['hat_crown', 'robe_king', 'staff_king'] },
  pirate: { name: 'Пират рун', how: 'Разрушь 20 построек за один забег', items: ['hat_pirate', 'robe_pirate', 'staff_pirate'] },
  storm:  { name: 'Повелитель бури', how: 'Переживи грозу до конца', items: ['hat_storm', 'robe_storm', 'staff_storm'] },
  golden: { name: 'Золотой маг', how: 'Продержись 10 минут', items: ['hat_golden', 'robe_golden', 'staff_golden'] }
};
for (const s in ACH_SETS) for (const id of ACH_SETS[s].items) ITEMS[id].how = ACH_SETS[s].how;
