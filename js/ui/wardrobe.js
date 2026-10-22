// ---------- гардероб ----------
// Вкладки по слотам, карточки вещей и примерочная: нажатая вещь сразу видна на маге,
// своя — надевается, магазинная — покупается за 🪙, остальные подсказывают, где их достать.
let wardSlot = 'hat', wardSel = null;
const coinsTxt = () => `🪙 ${META.coins}`;
const rarColor = it => it.rar ? RARITY[it.rar].color : it.src === 'ach' ? 'var(--gold)' : '#4a3a86';
// у шляп, глаз и бород на карточке крупно видна голова
const HEAD_SLOTS = ['hat', 'eyes', 'beard'];
function itemThumb(it){
  if (it.slot === 'trail') return `<div class="wthumb"><span class="ti">${it.icon}</span></div>`;
  return `<div class="wthumb"><img class="${HEAD_SLOTS.includes(it.slot) ? 'head ' + it.slot : ''}" src="${tryOn(it.id)}" alt=""></div>`;
}
function itemStatus(it){
  if (WARD.on[it.slot] === it.id) return '✔ надето';
  if (owns(it.id)) return it.src === 'roll' && WARD.own[it.id] > 1 ? `есть · выпало ×${WARD.own[it.id]}` : 'нажми — надеть';
  if (it.src === 'shop') return `🪙 ${it.price}`;
  if (it.src === 'ach') return '🔒 ' + it.how;
  return '🎰 только в рулетке';
}
function openWardrobe(){ wardSel = null; renderWard(); showModal('wardM'); sfx.click(); }
function renderWard(){
  $('wardCoins').textContent = coinsTxt();
  $('slotTabs').innerHTML = Object.entries(SLOTS).map(([id, S]) =>
    `<button class="ttab${id === wardSlot ? ' on' : ''}" data-s="${id}" style="--bc:var(--gold)">${S.icon}<span>${S.name}</span></button>`).join('');
  const list = Object.values(ITEMS).filter(it => it.slot === wardSlot);
  // порядок: бесплатные, магазин по цене, награды, рулетка от хлама к легендам
  const ord = it => ({ free: 0, shop: 1, ach: 2, roll: 3 })[it.src] * 1e4 + (it.price || 0) + (it.rar ? Object.keys(RARITY).indexOf(it.rar) * 100 : 0);
  list.sort((a, b) => ord(a) - ord(b));
  $('wardUI').innerHTML = list.map(it => {
    const cls = (WARD.on[it.slot] === it.id ? ' on' : '') + (owns(it.id) ? '' : ' locked') + (wardSel === it.id ? ' sel' : '');
    return `<div class="wcard${cls}" data-i="${it.id}" style="--tc:${rarColor(it)}">${itemThumb(it)}<b>${it.name}</b>` +
      (it.rar ? `<i class="rar" style="color:${RARITY[it.rar].color}">${RARITY[it.rar].name}</i>` : '') +
      `<small>${itemStatus(it)}</small></div>`;
  }).join('');
  document.querySelectorAll('#slotTabs .ttab').forEach(el => el.onclick = () => { wardSlot = el.dataset.s; wardSel = null; renderWard(); sfx.click(); });
  document.querySelectorAll('#wardUI .wcard').forEach(el => el.onclick = () => {
    const id = el.dataset.i;
    wardSel = id;
    if (owns(id) && WARD.on[ITEMS[id].slot] !== id){ equip(id); sfx.rune(); } else sfx.click();
    renderWard();
  });
  renderWardInfo();
}
function renderWardInfo(){
  const it = ITEMS[wardSel || WARD.on[wardSlot]], have = owns(it.id), on = WARD.on[it.slot] === it.id;
  const tag = it.rar ? `<small style="color:${RARITY[it.rar].color}">${RARITY[it.rar].name} · ${SLOTS[it.slot].name.toLowerCase()}</small>`
    : `<small style="color:var(--dim)">${SLOTS[it.slot].name}</small>`;
  let body = '';
  if (on) body = '<div class="tiLine nx">Надето ✔</div>';
  else if (have) body = `<button class="pbtn" id="wardAct">НАДЕТЬ</button>`;
  else if (it.src === 'shop'){
    body = `<button class="pbtn" id="wardAct"${META.coins >= it.price ? '' : ' disabled'}>КУПИТЬ · 🪙 ${it.price}</button>` +
      (META.coins < it.price ? `<div class="tiReq">Не хватает 🪙 ${it.price - META.coins} — монеты дают за каждый забег</div>` : '');
  } else if (it.src === 'ach') body = `<div class="tiReq">🔒 Награда за достижение: ${it.how}</div>`;
  else body = `<div class="tiLine">Выпадает только в рулетке.</div><button class="pbtn alt" id="wardGoRoll">🎰 К РУЛЕТКЕ</button>`;
  $('wardInfo').innerHTML = `<div class="tiHead"><div><b>${it.name}</b>${tag}</div></div>` +
    (it.rar && have ? `<div class="tiLine">Выпадало: <b>×${WARD.own[it.id]}</b></div>` : '') +
    (!have ? '<div class="tiHint">Примерка — так это будет выглядеть.</div>' : '') + body;
  if ($('wardAct')) $('wardAct').onclick = () => {
    if (!have){ if (!buyItem(it.id)) return; sfx.gold(); }
    equip(it.id); if (have) sfx.rune(); renderWard();
  };
  if ($('wardGoRoll')) $('wardGoRoll').onclick = () => openRoll('wardM');
}
$('wardBtn').onclick = () => openWardrobe();
$('wardRoll').onclick = () => openRoll('wardM');
$('wardClose').onclick = () => { showModal('menuM'); renderMenu(); sfx.click(); };

// примерочная: маг шагает на месте, след уезжает назад. Рисуется каждый кадр, пока гардероб открыт.
const wardTrail = [];
let wardT = 0, prevKey = '', prevFrames = null;
function drawWardPrev(){
  if (!$('wardM').classList.contains('show')) return;
  const c = $('wardPrev'), r = c.getBoundingClientRect();
  if (!r.width) return;
  const pw = Math.round(r.width * DPR), ph = Math.round(r.height * DPR);
  if (c.width !== pw || c.height !== ph){ c.width = pw; c.height = ph; }
  const on = wardSel ? { ...WARD.on, [ITEMS[wardSel].slot]: wardSel } : WARD.on;
  const key = Object.values(on).join('|');
  if (key !== prevKey){ prevKey = key; prevFrames = mageFrames(lookOf(on)); wardTrail.length = 0; }
  const L = lookOf(on), g = c.getContext('2d');
  const k = Math.max(2, Math.floor(Math.min(ph * 0.8 / 26, pw * 0.7 / 22))); // пиксель спрайта в пикселях холста
  const cx = pw / 2, feet = ph * 0.9;
  wardT++;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, pw, ph); g.imageSmoothingEnabled = false;
  g.drawImage(glow('rgba(140,90,255,.45)'), cx - 16 * k, feet - 20 * k, 32 * k, 26 * k);
  for (const a of lookAuras(L)){ g.globalAlpha = 0.35; g.drawImage(glow(a), cx - 15 * k, feet - 28 * k, 30 * k, 30 * k); }
  g.globalAlpha = 1;
  trailEmit(wardTrail, L.trail.kind, cx - 3 * k, feet - k, k, wardT);
  trailStep(wardTrail, k);
  for (const p of wardTrail) p.x -= 0.6 * k;
  trailDraw(g, wardTrail, k);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, feet, 7 * k, 1.8 * k, 0, 0, TAU); g.fill();
  const img = prevFrames[Math.floor(wardT / 9) % 4];
  g.drawImage(img, cx - 11 * k, feet - 25 * k, 22 * k, 26 * k);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + 0.15 * Math.sin(wardT * 0.08);
  g.drawImage(glow(staffGlow(L)), cx + 7.5 * k - 5 * k, feet - 19 * k - 5 * k, 10 * k, 10 * k);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
