// ---------- гардероб: какие вещи есть у мага и что на нём надето ----------
// own: id вещи → сколько раз она досталась (рулетка честная: одна и та же вещь может выпасть много раз).
const WARD = { own: {}, on: { ...DEFAULT_LOOK } };
for (const id in ITEMS) if (ITEMS[id].src === 'free') WARD.own[id] = 1;
try {
  const s = JSON.parse(localStorage.getItem('chaosMageWardrobe') || 'null');
  if (s){ Object.assign(WARD.own, s.own); Object.assign(WARD.on, s.on); }
  else {
    // перенос со старых целых костюмов: открытый костюм = его набор вещей, надетый — надеваем
    const old = JSON.parse(localStorage.getItem('chaosMageCostumes') || '{}');
    for (const k of old.unlocked || []) if (ACH_SETS[k]) for (const id of ACH_SETS[k].items) WARD.own[id] = 1;
    if (ACH_SETS[old.selected]) for (const id of ACH_SETS[old.selected].items) WARD.on[ITEMS[id].slot] = id;
  }
} catch (e) {}
for (const id in WARD.own) if (!ITEMS[id]) delete WARD.own[id];
for (const sl in SLOTS){ const id = WARD.on[sl]; if (!ITEMS[id] || ITEMS[id].slot !== sl || !WARD.own[id]) WARD.on[sl] = DEFAULT_LOOK[sl]; }
const saveWard = () => { try { localStorage.setItem('chaosMageWardrobe', JSON.stringify(WARD)); } catch (e) {} };
const owns = id => !!WARD.own[id];

// LOOK — надетые вещи по слотам (сами объекты из ITEMS); по нему рисуется маг
const lookOf = on => Object.fromEntries(Object.keys(SLOTS).map(sl => [sl, ITEMS[on[sl]]]));
let LOOK = lookOf(WARD.on);
function equip(id){
  if (!owns(id)) return;
  WARD.on[ITEMS[id].slot] = id; saveWard();
  LOOK = lookOf(WARD.on); SPR.mage = mageFrames(LOOK);
}
function buyItem(id){
  const it = ITEMS[id];
  if (it.src !== 'shop' || owns(id) || META.coins < it.price) return false;
  META.coins -= it.price; saveMeta();
  WARD.own[id] = 1; saveWard();
  return true;
}
// рулетка: сначала редкость по весам, потом любая вещь этой редкости — без учёта того, что уже есть
const ROLL_POOL = {};
for (const id in ITEMS) if (ITEMS[id].src === 'roll') (ROLL_POOL[ITEMS[id].rar] = ROLL_POOL[ITEMS[id].rar] || []).push(id);
function randomRollItem(){
  const total = Object.values(RARITY).reduce((s, r) => s + r.w, 0);
  let x = Math.random() * total, rar = 'junk';
  for (const k in RARITY){ x -= RARITY[k].w; if (x < 0){ rar = k; break; } }
  return pick(ROLL_POOL[rar]);
}
function rollItem(){
  if (META.coins < ROLL_COST) return null;
  META.coins -= ROLL_COST; saveMeta();
  const id = randomRollItem();
  WARD.own[id] = (WARD.own[id] || 0) + 1; saveWard();
  return id;
}
// достижение выдаёт набор вещей
function unlockSet(k){
  const S = ACH_SETS[k];
  if (S.items.every(owns)) return;
  for (const id of S.items) WARD.own[id] = 1;
  saveWard();
  banner(`🎉 Новые шмотки: ${S.name}! (гардероб — в главном меню)`, '#ffe08a');
  sfx.level();
}
