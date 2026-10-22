// ---------- общий рейтинг ----------
// GitHub Pages отдаёт только файлы, поэтому рекорды всех игроков хранятся в бесплатной базе Supabase.
// Как подключить — README.md, раздел «Общий рейтинг». Пока url/key пустые, работает только локальная таблица.
// key — публичный (anon / publishable) ключ: его можно класть в код, писать в базу он может только через
// функции из tools/leaderboard.sql, а они принимают лишь рост рекордов и только от владельца записи.
const ONLINE = { url: 'https://zqgkpmkbsjnthyiadteu.supabase.co', key: 'sb_publishable_NacQksmyfw5rNx99KhBz1Q_3nl7Moyt' };
const onlineOn = () => !!(ONLINE.url && ONLINE.key);

function rpc(fn, args){
  const h = { 'Content-Type': 'application/json', apikey: ONLINE.key };
  if (ONLINE.key.startsWith('eyJ')) h.Authorization = 'Bearer ' + ONLINE.key; // старый формат ключа (JWT)
  return fetch(`${ONLINE.url.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, { method: 'POST', headers: h, body: JSON.stringify(args) })
    .then(r => r.ok ? r.text().then(t => t ? JSON.parse(t) : null) : Promise.reject(new Error('HTTP ' + r.status)));
}
const uuid = () => crypto.randomUUID ? crypto.randomUUID()
  : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
// игрок: id виден всем (по нему подсвечиваем свою строку), secret знает только этот браузер
function onlinePlayer(){
  if (!META.player){ META.player = { id: uuid(), secret: uuid(), name: '', unsynced: 0 }; saveMeta(); }
  return META.player;
}
const playerName = () => onlinePlayer().name || 'Маг-' + onlinePlayer().id.slice(0, 4).toUpperCase();
// отправляем лучшие значения; сервер берёт максимум из старого и нового, поэтому повтор безопасен.
// Если сети не было — забеги копятся в unsynced и уйдут со следующей отправкой.
let submitting = null;
function submitScore(afterRun){
  const P = onlinePlayer();
  if (afterRun){ P.unsynced++; saveMeta(); }
  if (!onlineOn() || !META.best.score) return Promise.resolve(false);
  if (submitting) return submitting;
  const runs = P.unsynced, B = META.best;
  return submitting = rpc('submit_score', { p_id: P.id, p_secret: P.secret, p_name: playerName(), p_score: B.score, p_kills: B.kills, p_level: B.level, p_runs: runs })
    .then(() => { P.unsynced = Math.max(0, P.unsynced - runs); saveMeta(); return true; })
    .catch(() => false)
    .finally(() => { submitting = null; });
}
const fetchTop = () => rpc('top_scores', { lim: 50 });
const fetchMyRank = () => rpc('my_rank', { p_id: onlinePlayer().id });
