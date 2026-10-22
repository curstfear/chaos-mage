// ---------- состояние ----------
let RUN = { seed: 1, biome: 'abyss', pact: null }, PACT = pactStats(null);
let player, enemies, projs, meteors, puddles, ebullets, gems, particles, amb, zaps, beams, slashes, nums, scheduled, banners;
let slots, compiled, cds, inventory, slotDmg, nearProps, nearSolids, groundPat;
let tick, kills, combo, comboTimer, bestCombo, level, xp, shake, bossTimer, bossCount, lastBoss, triggerBudget, detBudget;
let evTimer, ev, moonT, wind;
let pets = [], trail = [], toad = null, toadTimer = 0, wildTimer = 0, hasFeather = false, comboRuneCd = 0, mom = [];
let holes = [], weather = { type: 'clear', t: 0 }, gust = null, skyBolts = [], flash = 0, goldT = 0, goldTimer = 0, destroyed = 0;
const WEATHER = {
  clear: { icon: '☀️', name: 'Ясно' },
  rain:  { icon: '🌧', name: 'Дождь', desc: 'огонь слабее, яд сильнее' },
  storm: { icon: '⛈', name: 'Гроза', desc: 'молнии бьют с неба!' },
  gale:  { icon: '🌪', name: 'Буря', desc: 'порывы ветра сносят всех' }
};
const weatherName = t => t === 'rain' && RUN.biome === 'ice' ? '🌨 Снегопад' : `${WEATHER[t].icon} ${WEATHER[t].name}`;
const chunks = new Map();
const cam = { x: 0, y: 0 };
let state = 'menu'; // menu | pact | play | craft | pick | pause | dead
let lives = 0; // сколько раз ещё можно встать после смерти («Второе дыхание»)
function setState(s){ state = s; document.body.dataset.state = s; setMusicGain(); } // data-state нужен CSS: кнопки для пальцев видны только в бою

function newGame(){
  RUN = { seed: Math.random() * 1e9 | 0, biome: pick(Object.keys(BIOMES)), pact: null };
  PACT = pactStats(null);
  player = { x: 0, y: 0, vx: 0, vy: 0, r: 14, hp: 100, maxHp: 100, inv: 0, dash: 0, dashCd: 0, face: 0, onIce: false };
  enemies = []; projs = []; meteors = []; puddles = []; ebullets = []; gems = []; particles = []; amb = []; zaps = []; beams = []; slashes = [];
  nums = []; scheduled = []; banners = []; nearProps = []; nearSolids = []; holes = [];
  pets = []; trail = []; toad = null; hasFeather = false; comboRuneCd = 0; mom = new Array(NSLOTS).fill(0);
  toadTimer = Math.round(60 * rnd(200, 260)); wildTimer = Math.round(60 * rnd(140, 180));
  slots = Array.from({ length: NSLOTS }, () => ({ form: null, element: null, mods: [null, null, null] }));
  slots[0].form = 'bolt';
  inventory = [pick(ELS), pick(MODS.filter(m => m !== 'wild' && m !== 'resonance'))];
  slotDmg = new Array(NSLOTS).fill(0); cds = new Array(NSLOTS).fill(20);
  tick = 0; kills = 0; combo = 0; comboTimer = 0; bestCombo = 0; level = 1; xp = 0; shake = 0; bossTimer = 0; bossCount = 0; lastBoss = 'boss'; pendingLevels = 0;
  evTimer = 60 * 60; ev = null; moonT = 0; wind = { x: 1, y: 0 };
  weather = { type: 'clear', t: 60 * 75 }; gust = null; skyBolts = []; flash = 0;
  goldT = 0; goldTimer = Math.round(60 * rnd(150, 210)); destroyed = 0;
  weatherSound();
  chunks.clear();
  cam.x = 0; cam.y = 0;
  groundPat = null;
  recompile();
}
function choosePact(id){
  RUN.pact = id; PACT = pactStats(id);
  player.maxHp = player.hp = PACT.hp; player.r = PACT.r;
  if (id === 'unstable') inventory.push(pick(ELS), pick(MODS));
  if (id === 'alchemist'){
    slots[0].form = null;
    inventory = [pick(FORMS)];
    const all = Object.keys(RUNES);
    while (inventory.length < 6) inventory.push(pick(all));
  }
  if (id === 'wind'){ const a = rnd(0, TAU); wind = { x: Math.cos(a), y: Math.sin(a) }; }
  // бонусы прокачки, которые срабатывают в начале забега
  lives = PACT.lives;
  for (let i = 0; i < PACT.startRunes; i++) inventory.push(pick([...ELS, ...MODS]));
  if (PACT.startLv){ level += PACT.startLv; pendingLevels += PACT.startLv; }
  recompile();
  setState('play'); showModal(null);
  musicStart();
  banner(`${BIOMES[RUN.biome].icon} ${BIOMES[RUN.biome].name}`, '#ffffff');
  banner(id === 'alchemist' ? `Собери первый навык — ${KEY('craft')}` : `${KEY('craft')} — мастерская навыков`, '#ffd25a');
}
const unlocked = () => SLOT_UNLOCK.filter(l => level >= l).length;
// требования растут экспоненциально: каждый следующий уровень ~на 65% дороже
const xpNeed = () => Math.round(30 * Math.pow(1.65, level - 1) + level * 15);
