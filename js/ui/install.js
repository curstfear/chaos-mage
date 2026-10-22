// ---------- установка на главный экран ----------
// Игра — PWA: с иконки на главном экране открывается на весь экран, как обычное приложение, и работает без сети.
const STANDALONE = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
if ('serviceWorker' in navigator && location.protocol !== 'file:'){
  navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => {
    // первый заход идёт мимо service worker — докладываем в кэш всё, что страница уже загрузила
    const urls = [location.href.split('#')[0], ...performance.getEntriesByType('resource').map(r => r.name)];
    caches.open('chaos-mage').then(c => urls.forEach(u => c.add(u).catch(() => {})));
  }).catch(() => {});
}
// Android/Chrome сам предлагает установку — придерживаем предложение до нажатия на кнопку
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; updInstallBtn(); });
addEventListener('appinstalled', () => { installEvt = null; updInstallBtn(); });
function updInstallBtn(){
  $('installBtn').hidden = STANDALONE || !(installEvt || TOUCH);
}
$('installBtn').onclick = () => {
  sfx.click();
  if (installEvt){ installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; updInstallBtn(); }); return; }
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const how = $('installHow');
  how.innerHTML = ios
    ? 'Нажми <b>«Поделиться»</b> <span style="white-space:nowrap">(квадрат со стрелкой)</span> внизу Safari → <b>«На экран „Домой“»</b>.'
    : 'Открой меню браузера <b>⋮</b> → <b>«Добавить на главный экран»</b> или <b>«Установить приложение»</b>.';
  how.hidden = !how.hidden;
};
