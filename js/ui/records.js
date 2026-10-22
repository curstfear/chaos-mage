// ---------- рекорды ----------
// «Все игроки» — общий рейтинг из Supabase (core/online.js), «Мои забеги» — 10 лучших забегов этого браузера.
// Место в таблице и есть рейтинг: сортировка по рекордным очкам.
let recTab = 'me';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtDate = t => new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
function openRecords(){
  recTab = onlineOn() ? 'all' : 'me';
  renderRecords(); showModal('recM'); sfx.click();
  if (onlineOn()) submitScore(false).then(() => { if (recTab === 'all') renderRecords(); }); // заодно досылаем забеги, сыгранные без сети
}
function renderRecords(){
  $('recTabs').innerHTML = onlineOn()
    ? [['all', '🌍 Все игроки'], ['me', '👤 Мои забеги']].map(([id, t]) => `<button class="ttab${id === recTab ? ' on' : ''}" data-r="${id}" style="--bc:var(--gold)">${t}</button>`).join('')
    : '';
  document.querySelectorAll('#recTabs .ttab').forEach(el => el.onclick = () => { recTab = el.dataset.r; renderRecords(); sfx.click(); });
  const B = META.best;
  $('recBest').innerHTML = `Твои рекорды: 🏆 <b>${B.score}</b> очков · 💀 <b>${B.kills}</b> убито · ⭐ <b>${B.level}</b> уровень`;
  $('nameRow').hidden = recTab !== 'all';
  if (recTab === 'me') return renderMyRuns();
  $('nameIn').value = onlinePlayer().name;
  $('nameIn').placeholder = playerName();
  $('recTable').innerHTML = '<div class="recNote">Загружаю рейтинг…</div>';
  Promise.all([fetchTop(), fetchMyRank().catch(() => null)]).then(([rows, rank]) => {
    if (recTab !== 'all') return;
    const me = onlinePlayer().id;
    const body = rows.map((r, i) => `<tr${r.id === me ? ' class="me"' : ''}><td>${medal(i + 1)}</td><td class="nm">${esc(r.name)}</td><td>${r.score}</td><td>${r.kills}</td><td>${r.level}</td></tr>`).join('');
    const mine = rank && !rows.some(r => r.id === me) ? `<div class="recNote">Ты на <b>${rank}</b> месте</div>` : '';
    $('recTable').innerHTML = rows.length
      ? `<table class="rtab"><tr><th>Место</th><th>Игрок</th><th>🏆 Очки</th><th>💀 Убито</th><th>⭐ Ур.</th></tr>${body}</table>${mine}`
      : '<div class="recNote">Пока пусто — сыграй забег и стань первым!</div>';
  }).catch(() => {
    if (recTab === 'all') $('recTable').innerHTML = '<div class="recNote">Не получилось загрузить рейтинг — нет сети? Твои рекорды отправятся позже сами.</div>';
  });
}
const medal = n => ['🥇', '🥈', '🥉'][n - 1] || n;
function renderMyRuns(){
  const rows = META.top;
  $('recTable').innerHTML = rows.length
    ? `<table class="rtab"><tr><th>Место</th><th>🏆 Очки</th><th>💀 Убито</th><th>⭐ Ур.</th><th>⏱</th><th>Мир</th></tr>` +
      rows.map((r, i) => `<tr><td>${medal(i + 1)}</td><td>${r.score}</td><td>${r.kills}</td><td>${r.level}</td><td>${fmtTime(r.sec)}</td>` +
        `<td title="${fmtDate(r.at)}">${BIOMES[r.biome] ? BIOMES[r.biome].icon : ''}</td></tr>`).join('') + '</table>' +
      (onlineOn() ? '' : '<div class="recNote">Общий рейтинг всех игроков пока не подключён — здесь только твои забеги.</div>')
    : '<div class="recNote">Ещё нет забегов. Сыграй — и здесь появятся твои рекорды.</div>';
}
function saveName(){
  const n = $('nameIn').value.replace(/\s+/g, ' ').trim().slice(0, 16);
  onlinePlayer().name = n; saveMeta();
  $('nameIn').blur();
  submitScore(false).then(() => renderRecords());
  sfx.click();
}
$('nameSave').onclick = saveName;
$('nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });
$('recBtn').onclick = openRecords;
$('recClose').onclick = () => { showModal('menuM'); renderMenu(); sfx.click(); };
