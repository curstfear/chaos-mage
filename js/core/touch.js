// ---------- сенсорное управление ----------
// Палец в любом месте экрана — плавающий джойстик: где коснулся, там и центр.
// Короткий тап без движения — рывок: в сторону тапа или, если другим пальцем бежишь, по направлению бега.
// Целиться на телефоне не нужно: навыки сами бьют ближайшего врага (updateAutoAim в core/input.js).
const STICK_R = 56, TAP_MS = 250, TAP_MOVE = 10;
const fingers = new Map(); // id касания → { x0, y0, t0, moved }
let stickId = null;        // какой палец сейчас ведёт джойстик

function padVector(p, e){
  let dx = e.clientX - p.x0, dy = e.clientY - p.y0;
  const d = Math.hypot(dx, dy);
  // палец ушёл дальше радиуса — центр едет следом, чтобы не приходилось возвращаться
  if (d > STICK_R){ p.x0 = e.clientX - dx / d * STICK_R; p.y0 = e.clientY - dy / d * STICK_R; dx = dx / d * STICK_R; dy = dy / d * STICK_R; }
  return [dx / STICK_R, dy / STICK_R];
}
function showStick(p, kx, ky){
  const base = $('stickBase'), knob = $('stickKnob');
  if (!p){ base.classList.remove('on'); return; }
  base.classList.add('on');
  base.style.transform = `translate(${p.x0}px,${p.y0}px)`;
  knob.style.transform = `translate(${kx * STICK_R}px,${ky * STICK_R}px)`;
}

cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' || state !== 'play') return;
  e.preventDefault();
  fingers.set(e.pointerId, { x0: e.clientX, y0: e.clientY, sx: e.clientX, sy: e.clientY, t0: performance.now(), moved: false });
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', e => {
  const p = fingers.get(e.pointerId);
  if (!p) return;
  if (!p.moved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > TAP_MOVE){
    p.moved = true;
    if (stickId === null) stickId = e.pointerId; // джойстиком становится первый палец, который поехал
  }
  if (stickId !== e.pointerId) return;
  const [x, y] = padVector(p, e);
  const l = Math.hypot(x, y), k = l < 0.15 ? 0 : Math.min(1, (l - 0.15) / 0.75) / l; // мёртвая зона в центре
  stick.x = x * k; stick.y = y * k;
  showStick(p, x, y);
});
function releaseFinger(e){
  const p = fingers.get(e.pointerId);
  if (!p) return;
  fingers.delete(e.pointerId);
  if (stickId === e.pointerId){ stickId = null; stick.x = stick.y = 0; showStick(null); }
  else if (e.type === 'pointerup' && !p.moved && performance.now() - p.t0 < TAP_MS && state === 'play')
    doDash(p.sx / ZOOM - W / 2 + cam.x, p.sy / ZOOM - H / 2 + cam.y);
}
cv.addEventListener('pointerup', releaseFinger);
cv.addEventListener('pointercancel', releaseFinger);
// любое окно поверх игры сбрасывает пальцы, иначе маг продолжит бежать сам
function resetTouch(){
  fingers.clear(); stickId = null;
  stick.x = stick.y = 0;
  showStick(null);
}

// защита страницы от жестов браузера: на iPhone CSS touch-action помогает не везде,
// поэтому глушим отскок, щипок, двойной тап и меню долгого нажатия ещё и здесь.
// Прокрутку пропускаем только внутри окна или его прокручиваемой части (.scroll), если ей действительно есть куда.
document.addEventListener('touchmove', e => {
  const box = e.target.closest && e.target.closest('.scroll, .box');
  if (e.cancelable && (!box || box.scrollHeight <= box.clientHeight)) e.preventDefault();
}, { passive: false });
for (const ev of ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu', 'selectstart'])
  document.addEventListener(ev, e => e.preventDefault(), { passive: false });
addEventListener('scroll', () => { if (scrollX || scrollY) scrollTo(0, 0); });

// экранные кнопки срабатывают на касание сразу, без задержки click
function tapButton(id, fn){
  $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
}
tapButton('tCraft', () => { if (state === 'play') openCraft(); });
tapButton('tPause', () => { if (state === 'play') openPause(); });

// кнопки обновляются вместе с HUD: сколько рун ждёт в мастерской
function updTouchUI(){
  if (!TOUCH) return;
  const n = inventory.length ? String(inventory.length) : '';
  if ($('tCraftN').textContent !== n) $('tCraftN').textContent = n;
}

// телефон: при старте забега пробуем развернуть игру на весь экран (Android; iPhone так не умеет)
function goFullscreen(){
  if (!TOUCH || document.fullscreenElement) return;
  const el = document.documentElement;
  try { const r = el.requestFullscreen && el.requestFullscreen({ navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } catch (e) {}
}
