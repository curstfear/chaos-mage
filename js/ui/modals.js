// ---------- модалки ----------
function showModal(id){ document.querySelectorAll('.modal').forEach(m => m.classList.toggle('show', m.id === id)); for (const k in keys) keys[k] = false; resetTouch(); }
function closeModal(){ showModal(null); setState('play'); if (pendingLevels > 0) openPick('level'); }
function openCraft(){ setState('craft'); selRune = -1; sortInv(); renderCraft(); showModal('craftM'); sfx.click(); }
function openPause(){
  setState('pause');
  $('pauseInfo').innerHTML = `${BIOMES[RUN.biome].icon} ${BIOMES[RUN.biome].name}<br>${RUN.pact ? PACTS[RUN.pact].icon + ' Пакт: ' + PACTS[RUN.pact].name : ''}` +
    `<br>Погода: ${weatherName(weather.type)}`;
  renderOpts(); renderPetList(); showModal('pauseM');
}
// кнопки настроек есть и в паузе, и в меню — у всех data-opt
const OPTS = {
  sound: { text: () => `🔊 Звук: ${SET.sound ? 'вкл' : 'выкл'}`, toggle: () => { SET.sound = !SET.sound; applySound(); } },
  music: { text: () => `🎵 Музыка: ${SET.music ? 'вкл' : 'выкл'}`, toggle: () => { SET.music = !SET.music; setMusicGain(); } },
  shake: { text: () => `📳 Тряска экрана: ${SHAKE_NAME[SET.shake]}`, toggle: () => { SET.shake = (SET.shake + 1) % 3; } }
};
function renderOpts(){ document.querySelectorAll('[data-opt]').forEach(el => el.textContent = OPTS[el.dataset.opt].text()); }
document.querySelectorAll('[data-opt]').forEach(el => el.onclick = () => { OPTS[el.dataset.opt].toggle(); saveSet(); renderOpts(); sfx.click(); });
function startRun(){
  audioInit(); goFullscreen(); newGame(); setState('pact'); sfx.click();
  const B = BIOMES[RUN.biome];
  $('biomeInfo').innerHTML = `Мир этого забега: <b style="color:var(--gold2)">${B.icon} ${B.name}</b><small>${B.desc}</small>`;
  const opts = Object.keys(PACTS).sort(() => Math.random() - 0.5).slice(0, 3 + PACT.pactChoice);
  $('pactCards').innerHTML = opts.map(id => { const P = PACTS[id];
    return `<div class="card" data-p="${id}" style="--tc:var(--gold)"><div class="ic">${P.icon}</div><div class="ty" style="color:var(--gold)">пакт</div><b>${P.name}</b><p>${P.desc}</p></div>`; }).join('');
  document.querySelectorAll('#pactCards .card').forEach(el => el.onclick = () => { sfx.rune(); choosePact(el.dataset.p); });
  showModal('pactM');
}
$('againBtn').onclick = startRun;
$('craftClose').onclick = closeModal;
$('resumeBtn').onclick = closeModal;

// сова: выбрать 3 руны в дар
let owlTree = null, owlSel = new Set();
function openOwl(s){ owlTree = s; owlSel = new Set(); setState('pick'); sortInv(); renderOwl(); showModal('owlM'); tone(600, 0.3, { vol: 0.05 }); }
function renderOwl(){
  $('owlInv').innerHTML = inventory.map((r, i) =>
    `<div class="rune${owlSel.has(i) ? ' sel' : ''}" style="--tc:${TYPE_COLOR[RUNES[r].type]}" data-ri="${i}" title="${RUNES[r].name}">${RUNES[r].icon}</div>`).join('');
  document.querySelectorAll('#owlInv .rune').forEach(el => el.onclick = () => {
    const i = +el.dataset.ri;
    if (owlSel.has(i)) owlSel.delete(i); else if (owlSel.size < 3) owlSel.add(i);
    sfx.click(); renderOwl();
  });
  $('owlGive').textContent = `ОТДАТЬ ${owlSel.size}/3`;
  $('owlGive').disabled = owlSel.size !== 3;
}
$('owlGive').onclick = () => {
  if (owlSel.size !== 3) return;
  inventory = inventory.filter((r, i) => !owlSel.has(i));
  owlTree.used = true; owlTree.img = biomeSprites(RUN.biome).owlEmpty;
  showModal(null); setState('play');
  addPet('owl', owlTree.x, owlTree.y - 60);
};
$('owlLeave').onclick = () => { showModal(null); setState('play'); sfx.click(); };
function renderPetList(){
  $('petList').innerHTML = '<b>🐾 Питомцы</b>' + Object.entries(PETS).map(([id, P]) => hasPet(id)
    ? `<div>${P.icon} <b>${P.name}</b> — ${P.desc}</div>`
    : `<div class="off">🔒 ${P.name}: ${P.how}</div>`).join('') + (hasFeather ? '<div>🪶 У тебя перо феникса — смерть не будет концом</div>' : '');
}

// мастерская
let selRune = -1;
function sortInv(){ inventory.sort((a, b) => TYPE_ORDER[RUNES[a].type] - TYPE_ORDER[RUNES[b].type] || RUNES[a].name.localeCompare(RUNES[b].name)); }
function socketHTML(si, kind, idx, rune){
  const R = rune && RUNES[rune], label = kind === 'form' ? 'форма' : kind === 'el' ? 'стихия' : 'мод';
  return `<div class="sock t-${kind}${R ? ' filled' : ''}" data-s="${si}" data-k="${kind}" data-i="${idx}" data-r="${rune || ''}">${R ? R.icon : ''}<small>${label}</small></div>`;
}
function renderCraft(){
  const un = unlocked();
  $('slotsUI').innerHTML = slots.map((s, i) => {
    if (i >= un) return `<div class="slot locked"><div class="hd"><b>Слот ${i + 1}</b><small>🔒 откроется на ${SLOT_UNLOCK[i]} уровне</small></div></div>`;
    const c = compiled[i];
    const stats = c ? `${c.dmg ? 'урон ' + c.dmg.toFixed(0) : 'поддержка'} · раз в ${(c.cd / 60).toFixed(2)} с<br>всего ${Math.round(slotDmg[i])}` : 'вставь форму';
    return `<div class="slot"><div class="hd"><b>${i + 1}. ${skillName(s)}</b><small>${stats}</small></div><div class="sockets">` +
      socketHTML(i, 'form', 0, s.form) + socketHTML(i, 'el', 0, s.element) + '<span class="vsep"></span>' +
      s.mods.map((m, j) => socketHTML(i, 'mod', j, m)).join('') + '</div></div>';
  }).join('');
  $('invUI').innerHTML = inventory.length ? inventory.map((r, i) =>
    `<div class="rune${i === selRune ? ' sel' : ''}" style="--tc:${TYPE_COLOR[RUNES[r].type]}" data-ri="${i}">${RUNES[r].icon}</div>`).join('')
    : '<div style="color:var(--dim);font-size:14px">Пусто. Руны дают за уровни, алтари, кристаллы, элиту и боссов.</div>';
  if (selRune >= 0){
    const t = RUNES[inventory[selRune]].type;
    document.querySelectorAll(`.sock.t-${t}`).forEach(el => el.classList.add('ok'));
  }
  document.querySelectorAll('.rune').forEach(el => {
    const r = inventory[+el.dataset.ri];
    el.onmouseenter = () => tip(r);
    el.onclick = () => { selRune = selRune === +el.dataset.ri ? -1 : +el.dataset.ri; sfx.click(); renderCraft(); tip(r); };
  });
  document.querySelectorAll('.sock').forEach(el => {
    el.onmouseenter = () => { if (el.dataset.r) tip(el.dataset.r); };
    el.onclick = () => clickSocket(+el.dataset.s, el.dataset.k, +el.dataset.i, el);
  });
}
function tip(r){
  const R = RUNES[r];
  $('tip').innerHTML = `<b>${R.icon} ${R.name} <span style="color:${TYPE_COLOR[R.type]};font-weight:500;font-size:12px">· ${TYPE_NAME[R.type]}</span></b>${R.desc}`;
}
function clickSocket(si, kind, idx, el){
  const s = slots[si];
  const get = () => kind === 'form' ? s.form : kind === 'el' ? s.element : s.mods[idx];
  const set = v => { if (kind === 'form') s.form = v; else if (kind === 'el') s.element = v; else s.mods[idx] = v; };
  const cur = get();
  if (selRune >= 0){
    const r = inventory[selRune];
    if (RUNES[r].type !== kind){
      el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad');
      $('tip').innerHTML = `<b>Не туда 🙃</b>${RUNES[r].name} — это ${TYPE_NAME[RUNES[r].type]}, ставь её в ячейку «${TYPE_NAME[RUNES[r].type]}».`;
      return;
    }
    inventory.splice(selRune, 1);
    if (cur) inventory.push(cur);
    set(r); selRune = -1;
  } else if (cur){
    inventory.push(cur); set(null);
  } else return;
  sfx.rune();
  recompile(); cds[si] = Math.min(cds[si], 15);
  sortInv(); renderCraft();
}

// выбор руны: уровень или алтарь
let pendingLevels = 0;
function rollRunes(){
  const pool = [], out = [];
  const needForm = slots.slice(0, unlocked()).some(s => !s.form) && !inventory.some(r => RUNES[r].type === 'form');
  if (needForm) out.push(pick(FORMS));
  for (const k of FORMS) pool.push(k);
  for (const k of ELS) pool.push(k, k);
  for (const k of MODS) pool.push(k, k);
  pool.push('trigger', 'trigger', 'trigger'); // «Цепь» — основа комбо, предлагается чаще остальных
  while (out.length < 3 + PACT.choice){ const r = pick(pool); if (!out.includes(r)) out.push(r); }
  return out;
}
function openPick(kind){
  setState('pick');
  const opts = rollRunes();
  if (kind === 'level'){
    const lv = level - pendingLevels + 1;
    $('pickTitle').innerHTML = 'НОВЫЙ УРОВЕНЬ!<span class="badge">ПАУЗА</span>';
    $('pickSub').innerHTML = `Уровень ${lv}. Выбери руну — потом вставь её в мастерской (${KEY('craft')}).` +
      (SLOT_UNLOCK.includes(lv) ? '<br><b style="color:var(--gold2)">🔓 Открыт новый слот навыка!</b>' : '');
    sfx.level();
  } else {
    $('pickTitle').innerHTML = 'АЛТАРЬ РУН<span class="badge">ПАУЗА</span>';
    $('pickSub').innerHTML = 'Древний алтарь предлагает дар. Выбери руну.';
  }
  $('cards').innerHTML = opts.map(r => { const R = RUNES[r];
    return `<div class="card" data-r="${r}" style="--tc:${TYPE_COLOR[R.type]}"><div class="ic">${R.icon}</div><div class="ty" style="color:${TYPE_COLOR[R.type]}">${TYPE_NAME[R.type]}</div><b>${R.name}</b><p>${R.desc}</p></div>`; }).join('');
  document.querySelectorAll('#cards .card').forEach(el => el.onclick = () => {
    inventory.push(el.dataset.r); sfx.rune();
    if (kind === 'level') pendingLevels--;
    showModal(null); setState('play');
    if (pendingLevels > 0) openPick('level');
    else banner(`+ ${RUNES[el.dataset.r].icon} ${RUNES[el.dataset.r].name} · ${KEY('craft')} — вставить`, '#ffd25a');
  });
  showModal('pickM');
}
