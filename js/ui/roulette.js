// ---------- рулетка ----------
// Лента из случайных вещей прокручивается и останавливается на выигрыше. Выигрыш решается заранее
// честным броском rollItem() (core/wardrobe.js) — лента только показывает его. Никаких гарантий и защиты от повторов.
const REEL_N = 46, REEL_WIN = 40;
let REEL_MS = 5200; // смоук-тест укорачивает
let rolling = false, rollWon = null, rollBack = 'menuM';
function openRoll(back){
  rollBack = back || 'menuM'; rollWon = null;
  $('rollRes').innerHTML = ''; reelFill(null); renderRoll(); showModal('rollM'); sfx.click();
}
function renderRoll(){
  $('rollCoins').textContent = coinsTxt();
  $('rollBtn').textContent = `КРУТИТЬ · 🪙 ${ROLL_COST}`;
  $('rollBtn').disabled = rolling || META.coins < ROLL_COST;
  $('rollWear').hidden = !rollWon || rolling || WARD.on[ITEMS[rollWon].slot] === rollWon;
  const total = Object.values(RARITY).reduce((s, r) => s + r.w, 0);
  $('rollOdds').innerHTML = Object.entries(RARITY).map(([k, R]) =>
    `<span style="color:${R.color}">${R.name} <b>${Math.round(R.w / total * 1000) / 10}%</b> <small>· ${ROLL_POOL[k].length} шт.</small></span>`).join('') +
    (META.coins < ROLL_COST && !rolling ? `<div class="tiReq">Не хватает 🪙 ${ROLL_COST - META.coins} — монеты дают за каждый забег</div>` : '');
}
const reelTile = id => { const it = ITEMS[id]; return `<div class="rtile" style="--tc:${RARITY[it.rar].color}">${itemThumb(it)}</div>`; };
function reelFill(win){
  const ids = Array.from({ length: REEL_N }, randomRollItem);
  if (win) ids[REEL_WIN] = win;
  const T = $('reelTrack');
  T.innerHTML = ids.map(reelTile).join('');
  T.style.transition = 'none'; T.style.transform = 'translateX(0)';
}
function spin(){
  if (rolling) return;
  const id = rollItem();
  if (!id) return;
  rolling = true; rollWon = id;
  $('rollRes').innerHTML = '';
  reelFill(id); renderRoll();
  const T = $('reelTrack'), tiles = T.children, view = $('reel').clientWidth;
  const step = tiles[1].offsetLeft - tiles[0].offsetLeft, tw = tiles[0].offsetWidth;
  const target = tiles[REEL_WIN].offsetLeft + tw / 2 - view / 2 + rnd(-0.38, 0.38) * tw;
  void T.offsetWidth; // применяем сброс до запуска анимации
  T.style.transition = `transform ${REEL_MS}ms cubic-bezier(.08,.62,.12,1)`;
  T.style.transform = `translateX(${-target}px)`;
  // щелчок на каждой проехавшей плитке
  let last = -1;
  const tickSound = () => {
    if (!rolling) return;
    const x = -new DOMMatrixReadOnly(getComputedStyle(T).transform).m41, i = Math.floor((x + view / 2) / step);
    if (i !== last){ last = i; tone(1500 + rnd(-80, 80), 0.025, { type: 'square', vol: 0.02 }); }
    requestAnimationFrame(tickSound);
  };
  requestAnimationFrame(tickSound);
  setTimeout(() => spinDone(id), REEL_MS + 80);
}
function spinDone(id){
  rolling = false;
  const it = ITEMS[id], R = RARITY[it.rar], n = WARD.own[id];
  $('reelTrack').children[REEL_WIN].classList.add('win');
  $('rollRes').innerHTML = `<div class="rwin" style="--tc:${R.color}">${itemThumb(it)}<div><i style="color:${R.color}">${R.name} · ${SLOTS[it.slot].name.toLowerCase()}</i>` +
    `<b>${it.name}</b><small>${n > 1 ? `Повтор — у тебя таких уже ×${n}` : 'Новинка! Теперь она в гардеробе'}</small></div></div>`;
  if (it.rar === 'legend') sfx.gold();
  else if (it.rar === 'epic') sfx.chain();
  else if (it.rar === 'rare') sfx.level();
  else if (it.rar === 'junk') tone(300, 0.5, { type: 'sawtooth', vol: 0.05, to: 120 });
  else sfx.rune();
  renderRoll();
}
$('rollBtn').onclick = spin;
$('rollWear').onclick = () => { if (rollWon){ equip(rollWon); sfx.rune(); renderRoll(); } };
$('rollMenuBtn').onclick = () => openRoll('menuM');
$('rollClose').onclick = () => {
  if (rolling) return;
  if (rollBack === 'wardM'){ renderWard(); showModal('wardM'); } else { showModal('menuM'); renderMenu(); }
  sfx.click();
};
