// ---------- главное меню ----------
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function goMenu(){ setState('menu'); renderMenu(); showModal('menuM'); }
function renderMenu(){
  $('menuShards').textContent = `💠 ${META.shards}`;
  $('menuStats').innerHTML = META.runs
    ? `Забегов: <b>${META.runs}</b> · Рекорд: <b>${fmtTime(META.bestSec)}</b> · Убито: <b>${META.kills}</b>`
    : 'Первый забег ждёт тебя!';
  $('treeBtn').classList.toggle('glow', UPGRADES.some(u => upState(u) === 'buy')); // есть что купить
}
// звук можно включить только после касания — включаем на первом же нажатии в меню
addEventListener('pointerdown', () => audioInit(), { once: true, capture: true });
const backToMenu = () => { showModal('menuM'); renderMenu(); sfx.click(); };
$('playBtn').onclick = startRun;
$('treeBtn').onclick = () => openTree();
$('wardBtn').onclick = () => openWardrobe('menuM');
$('setBtn').onclick = () => { renderOpts(); showModal('setM'); sfx.click(); };
$('helpBtn').onclick = () => { showModal('helpM'); sfx.click(); };
$('setClose').onclick = backToMenu;
$('helpClose').onclick = backToMenu;
$('treeClose').onclick = backToMenu;
$('pactBack').onclick = () => { goMenu(); sfx.click(); };
$('menuBtn').onclick = () => { goMenu(); sfx.click(); };
$('deadTree').onclick = () => { goMenu(); openTree(); };
$('endRunBtn').onclick = () => { showModal(null); die(); };

// ---------- дерево прокачки ----------
// На широком экране видны все четыре ветки, на узком — одна, переключается вкладками.
let treeSel = null, treeTab = 'power', resetArmed = false;
function openTree(){ treeSel = null; resetArmed = false; renderTree(); showModal('treeM'); sfx.click(); }
function renderTree(){
  $('treeShards').textContent = `💠 ${META.shards}`;
  $('treeTabs').innerHTML = Object.entries(BRANCHES).map(([id, B]) =>
    `<button class="ttab${id === treeTab ? ' on' : ''}" data-b="${id}" style="--bc:${B.color}">${B.icon}<span>${B.name}</span></button>`).join('');
  $('treeUI').innerHTML = Object.entries(BRANCHES).map(([bid, B]) => {
    const ups = UPGRADES.filter(u => u.b === bid);
    const lines = ups.filter(u => u.req).map(u => {
      const p = UP[u.req[0]], lit = upLvl(p.id) >= u.req[1];
      return `<line x1="${p.pos[0] + 0.5}" y1="${p.pos[1] + 0.5}" x2="${u.pos[0] + 0.5}" y2="${u.pos[1] + 0.5}"${lit ? ' class="lit"' : ''}/>`;
    }).join('');
    const nodes = ups.map(u => `<button class="node st-${upState(u)}${treeSel === u.id ? ' sel' : ''}" data-u="${u.id}" ` +
      `style="grid-column:${u.pos[0] + 1};grid-row:${u.pos[1] + 1}" aria-label="${u.name}"><span class="ni">${u.icon}</span>` +
      `<span class="nl">${upLvl(u.id)}/${u.max}</span></button>`).join('');
    return `<div class="branch${bid === treeTab ? ' on' : ''}" style="--bc:${B.color}"><div class="bh">${B.icon} ${B.name}</div>` +
      `<div class="bgrid"><svg class="edges" viewBox="0 0 3 4" preserveAspectRatio="none">${lines}</svg>${nodes}</div></div>`;
  }).join('');
  document.querySelectorAll('.ttab').forEach(el => el.onclick = () => { treeTab = el.dataset.b; treeSel = null; renderTree(); sfx.click(); });
  document.querySelectorAll('.node').forEach(el => el.onclick = () => {
    treeSel = treeSel === el.dataset.u ? null : el.dataset.u;
    if (treeSel) treeTab = UP[treeSel].b;
    renderTree(); sfx.click();
  });
  $('treeReset').textContent = resetArmed ? 'ТОЧНО СБРОСИТЬ?' : 'СБРОСИТЬ';
  $('treeReset').disabled = !Object.keys(META.up).length;
  renderTreeInfo();
}
function renderTreeInfo(){
  if (!treeSel){ $('treeInfo').innerHTML = statsHTML(); return; }
  const u = UP[treeSel], l = upLvl(u.id), st = upState(u), B = BRANCHES[u.b];
  $('treeInfo').innerHTML =
    `<div class="tiHead"><span class="ni" style="--bc:${B.color}">${u.icon}</span><div><b>${u.name}</b>` +
    `<small style="color:${B.color}">${B.name} · уровень ${l}/${u.max}</small></div></div>` +
    (l ? `<div class="tiLine">Сейчас: <b>${u.fx(l)}</b></div>` : '') +
    (l < u.max ? `<div class="tiLine">${l ? 'Следующий уровень' : 'Даёт'}: <b class="nx">${u.fx(l + 1)}</b></div>` : '<div class="tiLine nx">Вкачано до конца ✔</div>') +
    (st === 'locked' ? `<div class="tiReq">🔒 Сначала вкачай «${UP[u.req[0]].name}» до ${u.req[1]} уровня</div>` : '') +
    (l < u.max ? `<button class="pbtn" id="buyBtn"${st === 'buy' ? '' : ' disabled'}>КУПИТЬ · 💠 ${upCost(u)}</button>` +
      (st === 'poor' ? `<div class="tiReq">Не хватает 💠 ${upCost(u) - META.shards}</div>` : '') : '');
  if ($('buyBtn')) $('buyBtn').onclick = () => {
    if (!buyUpgrade(u.id)) return;
    sfx.level(); resetArmed = false; renderTree();
  };
}
// «Характеристики»: итоговые числа мага со всей прокачкой
function statsHTML(){
  const P = pactStats(null), d = v => v > 0 ? `+${pct(v)}` : v < 0 ? `−${pct(-v)}` : '—';
  const rows = [
    ['🗡️', 'Урон навыков', d(P.dmg - 1)], ['⏳', 'Перезарядка', d(P.cd - 1)],
    ['🎯', 'Шанс крита', P.crit ? `${pct(P.crit)} ×${P.critMul.toFixed(1)}` : '—'], ['🏹', 'Полёт снарядов', d(P.proj - 1)],
    ['❤️', 'Здоровье', P.hp], ['🌿', 'Регенерация', P.regen ? `+${P.regen.toFixed(1)}/с` : '—'],
    ['🧥', 'Защита', d(1 - P.armor)], ['🍃', 'Уклонение', P.dodge ? pct(P.dodge) : '—'],
    ['👢', 'Скорость', d(P.speed - 1)], ['🌀', 'Перезарядка рывка', d(P.dashCd - 1)],
    ['🧲', 'Сбор опыта', d(P.magnet - 1)], ['📖', 'Опыт', d(P.xp - 1)],
    ['💰', 'Осколки', d(P.shards - 1)], ['🃏', 'Рун на выбор', 3 + P.choice],
    ['🤝', 'Пактов на выбор', 3 + P.pactChoice], ['🎒', 'Рун на старте', P.startRunes ? `+${P.startRunes}` : '—'],
    ['🧙', 'Стартовый уровень', 1 + P.startLv], ['🕊️', 'Второе дыхание', P.lives ? 'есть' : '—']
  ];
  return `<div class="tiTitle">📊 Характеристики мага</div><div class="tiHint">Нажми на навык в дереве, чтобы прокачать его.</div>` +
    `<div class="statGrid">${rows.map(([i, k, v]) => `<span>${i} ${k}</span><b${v === '—' ? ' class="off"' : ''}>${v}</b>`).join('')}</div>`;
}
$('treeReset').onclick = () => {
  if (!resetArmed){ resetArmed = true; renderTree(); return; }
  resetUpgrades(); resetArmed = false; treeSel = null; renderTree(); sfx.rune();
};
