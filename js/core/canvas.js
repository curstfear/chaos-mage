// ---------- холст ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const dark = document.createElement('canvas'), dctx = dark.getContext('2d');
// W, H — размер видимой части мира в игровых единицах, а не в пикселях экрана.
// На маленьких экранах (телефон) ZOOM < 1: камера «отъезжает». Считается по площади экрана,
// поэтому стоя и боком маг одного размера, а видимая область просто повёрнута.
// SCALE — сколько физических пикселей холста приходится на одну игровую единицу.
// TXT — множитель для текста на холсте, чтобы цифры урона не становились мелкими при отдалении.
let W, H, DPR, ZOOM, SCALE, TXT, vignette;
// VH — настоящая высота экрана. iPhone, запущенный с главного экрана (строка состояния поверх игры),
// отдаёт innerHeight без выреза сверху, хотя рисовать можно до самого низа — иначе внизу чёрная полоса.
// Разницу отдаём в CSS как --appX: окна растягиваем на неё, а кнопки снизу опускаем.
const IOS_APP = navigator.standalone === true;
let VH = innerHeight;
function appHeight(){
  if (!IOS_APP) return innerHeight;
  const full = innerWidth > innerHeight ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
  return Math.max(innerHeight, full);
}
function resize(){
  VH = appHeight();
  document.documentElement.style.setProperty('--appX', VH - innerHeight + 'px');
  DPR = Math.min(devicePixelRatio || 1, 2);
  ZOOM = clamp(Math.sqrt(innerWidth * VH) / 800, 0.6, 1);
  SCALE = DPR * ZOOM; TXT = 1 / Math.sqrt(ZOOM);
  W = innerWidth / ZOOM; H = VH / ZOOM;
  cv.width = dark.width = Math.round(innerWidth * DPR); cv.height = dark.height = Math.round(VH * DPR);
  cv.style.width = innerWidth + 'px'; cv.style.height = VH + 'px';
  vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,.6)');
}
addEventListener('resize', resize); resize();
// после поворота телефона iOS ещё какое-то время отдаёт старый размер — перемеряем с задержкой
addEventListener('orientationchange', () => { setTimeout(resize, 120); setTimeout(resize, 500); });
if (window.visualViewport) visualViewport.addEventListener('resize', () => { if (cv.width !== Math.round(innerWidth * DPR) || cv.height !== Math.round(appHeight() * DPR)) resize(); });

const glowCache = {};
function glow(color){
  if (glowCache[color]) return glowCache[color];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color); gr.addColorStop(0.22, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return glowCache[color] = c;
}
