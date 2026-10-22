// игровая логика всегда идёт ровно 60 шагов в секунду, независимо от частоты монитора:
// на 120/144 Гц шаги просто делаются реже кадров, а на слабом компе догоняются
const STEP = 1000 / 60;
let frame = 0, lastT = 0, acc = 0;
function loop(now){
  let dt = lastT ? now - lastT : STEP;
  lastT = now;
  if (dt > 250) dt = 250; // вкладка была в фоне — не пытаемся «наверстать» минуты
  acc += dt;
  let steps = 0;
  while (acc >= STEP - 0.5 && steps < 4){
    if (state === 'play') update();
    acc -= STEP; steps++;
  }
  if (steps === 4) acc = 0;
  if (state !== 'play') acc = 0;
  if (state === 'menu') drawMenu(); else if (player) render();
  if (player && ++frame % 4 === 0){ updHud(); drawPortrait(); }
  requestAnimationFrame(loop);
}
newGame(); goMenu();
requestAnimationFrame(loop);
