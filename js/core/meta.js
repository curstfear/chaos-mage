// ---------- прогресс между забегами ----------
// 💠 осколки хаоса копятся за забеги и тратятся в дереве прокачки (data/upgrades.js).
const META = { shards: 0, up: {}, runs: 0, bestSec: 0, kills: 0 };
try { Object.assign(META, JSON.parse(localStorage.getItem('chaosMageMeta') || '{}')); } catch (e) {}
const saveMeta = () => { try { localStorage.setItem('chaosMageMeta', JSON.stringify(META)); } catch (e) {} };

const upLvl = id => META.up[id] || 0;
const levelCost = (u, l) => Math.round(u.cost * (1 + l * 0.75)); // цена перехода с уровня l на l+1
const upCost = u => levelCost(u, upLvl(u.id));
// max — вкачан до конца, locked — не выполнено условие, buy — можно купить, poor — не хватает осколков
function upState(u){
  if (upLvl(u.id) >= u.max) return 'max';
  if (u.req && upLvl(u.req[0]) < u.req[1]) return 'locked';
  return META.shards >= upCost(u) ? 'buy' : 'poor';
}
function buyUpgrade(id){
  const u = UP[id];
  if (upState(u) !== 'buy') return false;
  META.shards -= upCost(u); META.up[id] = upLvl(id) + 1;
  saveMeta();
  return true;
}
// сброс возвращает все потраченные осколки
function resetUpgrades(){
  for (const u of UPGRADES) for (let l = 0; l < upLvl(u.id); l++) META.shards += levelCost(u, l);
  META.up = {};
  saveMeta();
}

// бонусы прокачки поверх характеристик пакта (вызывается из pactStats)
function applyMeta(P){
  for (const u of UPGRADES){ const l = upLvl(u.id); if (l) u.apply(P, l); }
  return P;
}

// награда за забег: время, убийства, уровень и боссы
function runReward(){
  const sec = tick / 60;
  const parts = [
    ['⏱ за время', sec / 5],
    ['💀 за убийства', kills / 6],
    ['⭐ за уровень', (level - 1) * 5],
    ['👑 за боссов', bossCount * 30]
  ].map(([k, v]) => [k, Math.floor(v)]);
  const base = parts.reduce((s, [, v]) => s + v, 0);
  return { parts, total: Math.round(base * PACT.shards), bonus: PACT.shards > 1 ? Math.round(base * (PACT.shards - 1)) : 0 };
}
function finishRun(){
  const r = runReward();
  META.shards += r.total; META.runs++; META.kills += kills;
  META.bestSec = Math.max(META.bestSec, Math.floor(tick / 60));
  saveMeta();
  return r;
}
