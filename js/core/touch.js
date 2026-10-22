// ---------- сенсорное управление ----------
// Левая половина экрана — плавающий джойстик: где коснулся, там и центр.
// Правая половина — ручной прицел: веди пальцем, и навыки летят туда. Короткий тап справа — рывок.
// Если правую половину не трогать, навыки бьют по ближайшему врагу (updateAutoAim в core/input.js).
const STICK_R = 56;
const touchPads = { move: null, aim: null }; // активные касания: { id, x0, y0, t0, moved }

function padVector(p, e){
  let dx = e.clientX - p.x0, dy = e.clientY - p.y0;
  const d = Math.hypot(dx, dy);
  // палец ушёл дальше радиуса — центр едет следом, чтобы не приходилось возвращаться
  if (d > STICK_R){ p.x0 = e.clientX - dx / d * STICK_R; p.y0 = e.clientY - dy / d * STICK_R; dx = dx / d * STICK_R; dy = dy / d * STICK_R; }
  return [dx / STICK_R, dy / STICK_R, d];
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
  const side = e.clientX < innerWidth / 2 ? 'move' : 'aim';
  if (touchPads[side]) return;
  touchPads[side] = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false };
  cv.setPointerCapture(e.pointerId);
  if (side === 'move') showStick(touchPads.move, 0, 0);
});
cv.addEventListener('pointermove', e => {
  for (const side of ['move', 'aim']){
    const p = touchPads[side];
    if (!p || p.id !== e.pointerId) continue;
    const [x, y, d] = padVector(p, e);
    if (d > 10) p.moved = true;
    if (side === 'move'){
      const l = Math.hypot(x, y), k = l < 0.15 ? 0 : Math.min(1, (l - 0.15) / 0.75) / l; // мёртвая зона в центре
      stick.x = x * k; stick.y = y * k;
      showStick(p, x, y);
    } else if (p.moved){
      const l = Math.hypot(x, y) || 1;
      aimStick.x = x / l; aimStick.y = y / l; aimStick.on = true;
    }
  }
});
function releasePad(e){
  for (const side of ['move', 'aim']){
    const p = touchPads[side];
    if (!p || p.id !== e.pointerId) continue;
    touchPads[side] = null;
    if (side === 'move'){ stick.x = stick.y = 0; showStick(null); }
    else {
      aimStick.on = false;
      if (!p.moved && performance.now() - p.t0 < 250 && state === 'play') doDash();
    }
  }
}
cv.addEventListener('pointerup', releasePad);
cv.addEventListener('pointercancel', releasePad);
// любое окно поверх игры сбрасывает пальцы, иначе маг продолжит бежать сам
function resetTouch(){
  touchPads.move = touchPads.aim = null;
  stick.x = stick.y = 0; aimStick.on = false;
  showStick(null);
}

// экранные кнопки срабатывают на касание сразу, без задержки click
function tapButton(id, fn){
  $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
}
tapButton('tDash', () => { if (state === 'play') doDash(); });
tapButton('tCraft', () => { if (state === 'play') openCraft(); });
tapButton('tPause', () => { if (state === 'play') openPause(); });

// кнопки обновляются вместе с HUD: перезарядка рывка и сколько рун ждёт в мастерской
function updTouchUI(){
  if (!TOUCH) return;
  $('tDash').style.setProperty('--cd', player.dashCd > 0 ? player.dashCd / 48 : 0);
  const n = inventory.length ? String(inventory.length) : '';
  if ($('tCraftN').textContent !== n) $('tCraftN').textContent = n;
}

// телефон: при старте забега пробуем развернуть игру на весь экран (Android; iPhone так не умеет)
function goFullscreen(){
  if (!TOUCH || document.fullscreenElement) return;
  const el = document.documentElement;
  try { const r = el.requestFullscreen && el.requestFullscreen({ navigationUI: 'hide' }); if (r && r.catch) r.catch(() => {}); } catch (e) {}
}
