// ---------- ввод ----------
const keys = {}, mouse = { x: 0, y: 0 };
// TOUCH — играем пальцами: джойстик, автоприцел и экранные кнопки (core/touch.js).
// Переключается само: коснулись экрана — сенсорный режим, повели мышью — обычный.
let TOUCH = false;
function setTouch(on){
  if (TOUCH === on) return;
  TOUCH = on; document.body.classList.toggle('touch', on); // CSS прячет/показывает подсказки и кнопки
}
setTouch(matchMedia('(hover: none) and (pointer: coarse)').matches);
addEventListener('pointerdown', e => setTouch(e.pointerType !== 'mouse'), true);
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  setTouch(false); mouse.x = e.clientX / ZOOM; mouse.y = e.clientY / ZOOM;
});
// подпись управления в текстах: на ПК клавиша, на телефоне значок кнопки
const KEY = name => (TOUCH ? { craft: '🔮', pause: '⏸' } : { craft: 'TAB', pause: 'Esc' })[name];

addEventListener('keydown', e => {
  if (e.code === 'Tab'){ e.preventDefault(); if (state === 'play') openCraft(); else if (state === 'craft') closeModal(); return; }
  if (e.code === 'Escape'){ if (state === 'play') openPause(); else if (state === 'craft' || state === 'pause') closeModal(); return; }
  if (e.code === 'KeyM'){ SET.sound = !SET.sound; saveSet(); applySound(); renderOpts(); }
  if (e.code === 'Space'){ e.preventDefault(); if (state === 'play') doDash(); }
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { if (state === 'play') openPause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') openPause(); });

// направление бега: клавиатура или джойстик, длина вектора от 0 до 1
const stick = { x: 0, y: 0 }, lastMove = { x: 1, y: 0 };
function moveDir(){
  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let my = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const md = Math.hypot(mx, my);
  if (md){ mx /= md; my /= md; } else { mx = stick.x; my = stick.y; }
  if (mx || my){ const l = Math.hypot(mx, my); lastMove.x = mx / l; lastMove.y = my / l; }
  return [mx, my];
}

// прицел: на ПК — курсор; на телефоне только автоприцел по ближайшему врагу
let autoAim = [0, 0], autoTarget = null;
const AUTO_AIM_R = 520;
function updateAutoAim(){
  const P = player;
  let best = null, bd = AUTO_AIM_R * AUTO_AIM_R;
  for (const e of enemies){
    if (e.hp <= 0) continue;
    const d = (e.x - P.x) ** 2 + (e.y - P.y) ** 2;
    if (d < bd){ bd = d; best = e; }
  }
  autoTarget = best;
  autoAim = best ? [best.x, best.y] : [P.x + lastMove.x * 200, P.y + lastMove.y * 200];
}
function aimWorld(){
  if (!TOUCH) return [mouse.x - W / 2 + cam.x, mouse.y - H / 2 + cam.y];
  return autoAim;
}

// рывок: по направлению бега; если стоишь — к точке tx,ty (тап на телефоне) или к прицелу
function doDash(tx, ty){
  if (player.dashCd > 0) return;
  let [dx, dy] = moveDir();
  if (!dx && !dy){ const [ax, ay] = tx === undefined ? aimWorld() : [tx, ty]; dx = ax - player.x; dy = ay - player.y; }
  const d = Math.hypot(dx, dy) || 1;
  player.vx = dx / d * 13; player.vy = dy / d * 13;
  player.dash = 11; player.dashCd = 48; player.inv = Math.max(player.inv, 16);
  sfx.dash();
}
