// ---------- холст ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const dark = document.createElement('canvas'), dctx = dark.getContext('2d');
let W, H, DPR, vignette;
function resize(){
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = dark.width = W * DPR; cv.height = dark.height = H * DPR;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,.6)');
}
addEventListener('resize', resize); resize();

const glowCache = {};
function glow(color){
  if (glowCache[color]) return glowCache[color];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color); gr.addColorStop(0.22, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return glowCache[color] = c;
}
