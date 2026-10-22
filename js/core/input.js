// ---------- ввод ----------
const keys = {}, mouse = { x: 0, y: 0 };
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener('keydown', e => {
  if (e.code === 'Tab'){ e.preventDefault(); if (state === 'play') openCraft(); else if (state === 'craft') closeModal(); return; }
  if (e.code === 'Escape'){ if (state === 'play') openPause(); else if (state === 'craft' || state === 'pause') closeModal(); return; }
  if (e.code === 'KeyM'){ SET.sound = !SET.sound; saveSet(); applySound(); renderOpts(); }
  if (e.code === 'Space'){ e.preventDefault(); if (state === 'play') doDash(); }
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { if (state === 'play') openPause(); });
const aimWorld = () => [mouse.x - W / 2 + cam.x, mouse.y - H / 2 + cam.y];

function doDash(){
  if (player.dashCd > 0) return;
  let dx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), dy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
  if (!dx && !dy){ const [ax, ay] = aimWorld(); dx = ax - player.x; dy = ay - player.y; }
  const d = Math.hypot(dx, dy) || 1;
  player.vx = dx / d * 13; player.vy = dy / d * 13;
  player.dash = 11; player.dashCd = 48; player.inv = Math.max(player.inv, 16);
  sfx.dash();
}
