const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const $ = id => document.getElementById(id);
const FONT = '"Pixelify Sans", ui-monospace, monospace';
