// ---------- звук ----------
const SND = { ctx: null, last: {} };
let noiseBuf;
// iPhone по умолчанию глушит Web Audio переключателем «Без звука» — просим играть как медиа
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
function audioInit(){
  if (SND.ctx){ audioWake(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const C = SND.ctx = new AC();
  audioWake();
  const comp = C.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 6; comp.connect(C.destination);
  SND.master = C.createGain(); SND.master.gain.value = SET.sound ? 0.7 : 0; SND.master.connect(comp);
  SND.fx = C.createGain(); SND.fx.gain.value = 0.6; SND.fx.connect(SND.master);
  SND.mus = C.createGain(); SND.mus.gain.value = 0; SND.mus.connect(SND.master);
  noiseBuf = C.createBuffer(1, C.sampleRate, C.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
// телефон отпускает звук только внутри касания (и не любого: на iPhone и Android это отпускание пальца),
// а после сворачивания снова его замораживает — поэтому будим на каждом нажатии, пока не заиграет
function audioWake(){
  const C = SND.ctx;
  if (!C || C.state === 'running') return;
  try { const r = C.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
  // старому Safari мало resume(): нужен хоть один звук, запущенный из самого касания
  const s = C.createBufferSource(); s.buffer = C.createBuffer(1, 1, 22050); s.connect(C.destination); s.start(0);
}
for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'])
  addEventListener(ev, audioInit, { capture: true, passive: true });
document.addEventListener('visibilitychange', () => {
  if (!SND.ctx) return;
  if (!document.hidden) return audioWake();
  try { const r = SND.ctx.suspend(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
});
function can(k, ms){ const t = performance.now(); if (SND.last[k] && t - SND.last[k] < ms) return false; SND.last[k] = t; return true; }
function tone(f, dur, o = {}){
  if (!SND.ctx) return;
  const C = SND.ctx, t = C.currentTime + (o.delay || 0), osc = C.createOscillator(), g = C.createGain(), v = o.vol || 0.1;
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(o.bus || SND.fx); osc.start(t); osc.stop(t + dur + 0.05);
}
function noise(dur, o = {}){
  if (!SND.ctx) return;
  const C = SND.ctx, t = C.currentTime + (o.delay || 0), src = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain(), v = o.vol || 0.1;
  src.buffer = noiseBuf; src.loop = true;
  f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 1000, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  f.Q.value = o.q || 1;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(o.bus || SND.fx); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
}
const EL_P = { fire: 0.8, ice: 1.5, lightning: 1.25, poison: 0.9, void: 0.6, blood: 0.7, gold: 1.35, chaos: 1, wind: 1.1, crystal: 1.6, holy: 1.8, acid: 0.85, earth: 0.5, water: 0.9, star: 1.7, bone: 0.65 };
const sfx = {
  cast(form, el){
    if (!can('c' + form, 75)) return;
    const p = (EL_P[el] || 1) * rnd(0.95, 1.05);
    switch (form){
      case 'bolt': tone(880 * p, 0.09, { type: 'triangle', vol: 0.05, to: 330 * p }); break;
      case 'nova': noise(0.25, { type: 'bandpass', f: 600 * p, to: 3000 * p, vol: 0.09, q: 2 }); tone(300 * p, 0.2, { vol: 0.04, to: 600 * p }); break;
      case 'orbit': tone(660 * p, 0.3, { vol: 0.04 }); tone(990 * p, 0.3, { vol: 0.03, delay: 0.05 }); break;
      case 'mine': tone(240 * p, 0.06, { type: 'square', vol: 0.03 }); break;
      case 'meteor': tone(1500 * p, 0.45, { vol: 0.04, to: 180 * p }); break;
      case 'beam': tone(180 * p, 0.16, { type: 'sawtooth', vol: 0.05, to: 120 * p }); tone(1200 * p, 0.12, { vol: 0.03, to: 2400 * p }); break;
      case 'boomerang': noise(0.22, { type: 'bandpass', f: 900 * p, to: 400 * p, vol: 0.08, q: 4 }); break;
      case 'turret': tone(520 * p, 0.12, { type: 'square', vol: 0.03, to: 780 * p }); break;
      case 'tornado': noise(0.5, { type: 'lowpass', f: 300, to: 1200, vol: 0.08 }); break;
      case 'slash': noise(0.12, { type: 'highpass', f: 2000, to: 600, vol: 0.1 }); break;
      case 'familiar': tone(500 * p, 0.35, { vol: 0.05, to: 900 * p }); tone(750 * p, 0.35, { vol: 0.03, delay: 0.08, to: 1300 * p }); break;
      case 'spikes': noise(0.35, { type: 'lowpass', f: 400, to: 90, vol: 0.1 }); tone(90 * p, 0.25, { type: 'triangle', vol: 0.05, to: 50 }); break;
      case 'saw': tone(180 * p, 0.25, { type: 'square', vol: 0.03, to: 280 * p }); break;
      case 'starfall': [1568, 1976, 2349].forEach((f, k) => tone(f * p, 0.25, { vol: 0.025, delay: k * 0.06 })); break;
      case 'wave': noise(0.45, { type: 'bandpass', f: 300, to: 1600, vol: 0.09, q: 1.2 }); break;
      case 'shotgun': noise(0.14, { type: 'lowpass', f: 2400, to: 300, vol: 0.12 }); tone(160 * p, 0.1, { type: 'square', vol: 0.03, to: 80 }); break;
      case 'spark': tone(1800 * p, 0.08, { type: 'square', vol: 0.025, to: 2600 * p }); noise(0.08, { type: 'highpass', f: 3000, vol: 0.05 }); break;
      case 'lance': noise(0.2, { type: 'bandpass', f: 1400, to: 500, vol: 0.09, q: 3 }); tone(220 * p, 0.2, { type: 'sawtooth', vol: 0.03, to: 110 * p }); break;
      case 'comet': tone(300 * p, 0.4, { type: 'triangle', vol: 0.05, to: 120 * p }); noise(0.3, { type: 'lowpass', f: 800, to: 200, vol: 0.06 }); break;
      case 'pulse': tone(120 * p, 0.25, { vol: 0.07, to: 60 * p }); noise(0.2, { type: 'bandpass', f: 500, to: 2000, vol: 0.06, q: 1.5 }); break;
      case 'vortex': tone(400 * p, 0.6, { type: 'sawtooth', vol: 0.03, to: 60 * p }); break;
      case 'geyser': noise(0.35, { type: 'bandpass', f: 600, to: 2400, vol: 0.08, q: 1 }); break;
      case 'snake': tone(700 * p, 0.18, { type: 'triangle', vol: 0.04, to: 900 * p }); tone(500 * p, 0.12, { vol: 0.02, delay: 0.06 }); break;
      case 'deck': noise(0.06, { type: 'highpass', f: 3000, vol: 0.06 }); tone(1400 * p, 0.04, { type: 'square', vol: 0.015 }); break;
      case 'billiard': tone(1900 * p, 0.05, { type: 'triangle', vol: 0.06 }); tone(950 * p, 0.08, { type: 'triangle', vol: 0.03, delay: 0.02 }); break;
      case 'trail': noise(0.18, { type: 'lowpass', f: 500, to: 200, vol: 0.03 }); break;
      case 'debt': [1568, 2093].forEach((f, k) => tone(f * p, 0.08, { type: 'square', vol: 0.02, delay: k * 0.04 })); break;
      case 'tether': tone(330 * p, 0.3, { type: 'sawtooth', vol: 0.03, to: 660 * p }); break;
      case 'seed': tone(400 * p, 0.15, { type: 'triangle', vol: 0.04, to: 700 * p }); break;
      case 'prism': [1047, 1319, 1568, 2093].forEach((f, k) => tone(f * p, 0.4, { vol: 0.03, delay: k * 0.05 })); break;
      case 'bait': [784, 988, 1175].forEach((f, k) => tone(f * p, 0.18, { type: 'square', vol: 0.025, delay: k * 0.07 })); break;
      case 'sigil': tone(220 * p, 0.8, { type: 'triangle', vol: 0.06, att: 0.05 }); tone(330 * p, 0.8, { vol: 0.04, att: 0.1, delay: 0.1 }); break;
      case 'shadow': tone(180 * p, 0.6, { type: 'sawtooth', vol: 0.04, to: 90 * p }); break;
      case 'swarm': tone(220 * p, 0.35, { type: 'sawtooth', vol: 0.025, to: 240 * p }); tone(330 * p, 0.3, { type: 'square', vol: 0.012, delay: 0.04 }); break;
      case 'hail': noise(0.4, { type: 'highpass', f: 3500, to: 1800, vol: 0.06 }); break;
    }
  },
  turretShot(){ if (can('ts', 60)) tone(1100, 0.05, { type: 'square', vol: 0.02, to: 700 }); },
  hit(){ if (can('hit', 35)) tone(rnd(1300, 1700), 0.03, { type: 'triangle', vol: 0.025 }); },
  crit(){ if (can('crit', 60)) tone(2200, 0.08, { vol: 0.04, to: 3200 }); },
  kill(c){
    if (!can('kill', 45)) return;
    const scale = [0, 2, 4, 7, 9], n = scale[c % 5] + 12 * (Math.floor(c / 5) % 3);
    tone(330 * Math.pow(2, n / 12), 0.12, { type: 'triangle', vol: 0.045 });
  },
  boom(r){ if (!can('boom', 70)) return; const v = Math.min(0.2, 0.06 + r / 900); noise(0.4, { type: 'lowpass', f: 900, to: 80, vol: v }); tone(110, 0.3, { vol: v * 0.8, to: 38 }); },
  zap(){ if (can('zap', 50)) tone(rnd(1400, 2000), 0.06, { type: 'square', vol: 0.025, to: 600 }); },
  gem(){ if (can('gem', 40)) tone(rnd(1500, 1900), 0.06, { vol: 0.03, to: 2400 }); },
  hurt(){ tone(200, 0.25, { type: 'sawtooth', vol: 0.09, to: 60 }); noise(0.15, { vol: 0.07, f: 500 }); },
  dash(){ noise(0.2, { type: 'highpass', f: 600, to: 3000, vol: 0.08 }); },
  level(){ [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.07, delay: i * 0.07 })); },
  rune(){ [784, 988, 1319].forEach((f, i) => tone(f, 0.3, { vol: 0.06, delay: i * 0.06 })); },
  boss(){ tone(90, 1.4, { type: 'sawtooth', vol: 0.1, to: 45 }); tone(95, 1.4, { type: 'sawtooth', vol: 0.07, to: 47 }); noise(1, { f: 200, vol: 0.08 }); },
  event(){ tone(220, 0.6, { type: 'sawtooth', vol: 0.06, att: 0.08 }); tone(330, 0.6, { type: 'sawtooth', vol: 0.05, att: 0.08, delay: 0.15 }); },
  crystal(){ if (can('cr', 60)) [1800, 2400].forEach((f, i) => tone(f, 0.25, { vol: 0.04, delay: i * 0.04 })); },
  click(){ tone(700, 0.04, { vol: 0.04 }); },
  thud(){ if (can('thud', 90)) tone(140, 0.07, { type: 'triangle', vol: 0.03, to: 80 }); },
  geyser(){ if (can('gy', 150)) noise(0.6, { type: 'lowpass', f: 400, to: 1500, vol: 0.08 }); },
  mutate(){ tone(300, 0.5, { type: 'square', vol: 0.04, to: 900 }); tone(900, 0.5, { type: 'square', vol: 0.03, to: 300 }); },
  crumble(){ if (!can('crum', 80)) return; noise(0.6, { type: 'lowpass', f: 700, to: 120, vol: 0.16 }); tone(90, 0.35, { type: 'triangle', vol: 0.08, to: 45 }); },
  thunder(){ noise(0.12, { type: 'highpass', f: 1500, vol: 0.15 }); noise(1.8, { type: 'lowpass', f: 400, to: 60, vol: 0.22, delay: 0.05, att: 0.03 }); },
  gust(){ noise(1.2, { type: 'bandpass', f: 300, to: 900, vol: 0.09, q: 1.5, att: 0.3 }); },
  gold(){ [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.4, { type: 'triangle', vol: 0.06, delay: i * 0.08 })); },
  // выпала/подобрана «Цепь»: звенящий перелив вверх
  chain(){ [659, 880, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.06, delay: i * 0.05 })); tone(3136, 0.6, { vol: 0.025, delay: 0.25 }); },
  hole(){ if (can('hole', 120)) tone(140, 0.7, { type: 'sawtooth', vol: 0.05, to: 40 }); }
};
// фоновая музыка: низкий гул + случайные ноты из лада мира
const MUSIC = {
  abyss: [110, [220, 261.6, 329.6, 392, 440, 523.3]],
  lava:  [73.4, [146.8, 155.6, 196, 220, 233.1, 293.7]],
  ice:   [130.8, [261.6, 329.6, 370, 392, 493.9, 523.3]],
  swamp: [98, [196, 233.1, 261.6, 293.7, 349.2, 392]],
  caves: [116.5, [233.1, 277.2, 311.1, 349.2, 415.3, 466.2]],
  desert: [82.4, [164.8, 174.6, 207.7, 220, 246.9, 261.6]]
};
let musicNodes = [], arpTimer = null, wNode = null;
function musicStart(){
  if (!SND.ctx) return;
  musicStop();
  const [root, scale] = MUSIC[RUN.biome], C = SND.ctx;
  const filt = C.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500; filt.connect(SND.mus);
  const lfo = C.createOscillator(), lg = C.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 300; lfo.connect(lg); lg.connect(filt.frequency); lfo.start();
  musicNodes.push(lfo, filt);
  for (const [f, type, v] of [[root, 'sawtooth', 0.05], [root * 1.5, 'triangle', 0.05], [root * 2.004, 'sawtooth', 0.03]]){
    const o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.value = f; g.gain.value = v;
    o.connect(g); g.connect(filt); o.start(); musicNodes.push(o);
  }
  arpTimer = setInterval(() => {
    if (state !== 'play' || !SET.music) return;
    if (Math.random() < 0.6) tone(pick(scale) * (Math.random() < 0.3 ? 2 : 1), 0.6, { type: 'triangle', vol: 0.035, att: 0.01, bus: SND.mus });
  }, 280);
  setMusicGain();
}
function musicStop(){
  for (const n of musicNodes){ try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }
  musicNodes = []; clearInterval(arpTimer);
}
function setMusicGain(){
  if (!SND.ctx) return;
  SND.mus.gain.setTargetAtTime(SET.music ? (state === 'play' ? 0.55 : 0.22) : 0, SND.ctx.currentTime, 0.3);
  if (wNode) wNode.g.gain.setTargetAtTime(state === 'play' ? wNode.v : 0, SND.ctx.currentTime, 0.3);
}
function applySound(){ if (SND.ctx) SND.master.gain.setTargetAtTime(SET.sound ? 0.7 : 0, SND.ctx.currentTime, 0.05); }
// непрерывный шум погоды: дождь шелестит, буря гудит
function weatherSound(){
  if (!SND.ctx) return;
  if (wNode){ const n = wNode; n.g.gain.setTargetAtTime(0, SND.ctx.currentTime, 0.5); setTimeout(() => { try { n.src.stop(); } catch (e) {} }, 2500); wNode = null; }
  const type = weather.type; if (type === 'clear') return;
  const C = SND.ctx, src = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain(), v = type === 'storm' ? 0.07 : 0.045;
  src.buffer = noiseBuf; src.loop = true;
  f.type = type === 'gale' ? 'lowpass' : 'bandpass'; f.frequency.value = type === 'gale' ? 500 : 2500; f.Q.value = type === 'gale' ? 1 : 0.6;
  g.gain.value = 0; g.gain.setTargetAtTime(state === 'play' ? v : 0, C.currentTime, 1);
  src.connect(f); f.connect(g); g.connect(SND.fx); src.start();
  wNode = { src, g, v };
}
