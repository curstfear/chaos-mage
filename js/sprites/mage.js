// ---------- маг из шмоток ----------
// Спрайт 22×26 собирается слоями: древко посоха → мантия → сапоги → лицо → борода → глаза → шляпа → рука → навершие.
// Маг смотрит вправо, поэтому черты лица сдвинуты на пиксель вправо от центра головы (глаза — x 10 и 13).
const SKIN = '#f2c9a0', PUPIL = '#1a1030';
const RAINBOW = ['#ff4f4f', '#ff9a3a', '#ffe95a', '#4fe08a', '#4bb0ff', '#9b6aff'];
const inE = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
// верхняя половина эллипса (купол шапки), чтобы не залезать на лицо
function dome(b, cx, cy, rx, ry, c, on){
  for (let y = Math.floor(cy - ry); y + 0.5 <= cy; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (inE(x, y, cx, cy, rx, ry)) pset(b, x, y, c, on);
}
function recolor(b, test, fn){
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++){ const i = y * b.w + x; if (b.px[i] && test(b.px[i])) b.px[i] = fn(x, y); }
}
// рисунок из строк: X — цвет c
function stamp(b, x0, y0, rows, c){ rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'X') pset(b, x0 + x, y0 + y, c); })); }

function staffShaft(b, S){
  const [w, wd] = S.wood || ['#7a4a22', '#5a3416'];
  if (S.kind === 'candy'){
    for (let y = 7; y <= 24; y++){ pset(b, 18, y, y % 3 ? '#ffffff' : S.c); pset(b, 19, y, (y + 1) % 3 ? '#d8d8e4' : mix(S.c, '#000000', 0.3)); }
    return;
  }
  line(b, 18, 8, 18, 24, w); line(b, 19, 9, 19, 24, wd);
}
function staffTop(b, S){
  const c = S.c, d = mix(c, '#000000', 0.3), l = mix(c, '#ffffff', 0.55);
  switch (S.kind){
    case 'orb': disc(b, 18.5, 6, 2.5, 2.5, c); pset(b, 17, 5, '#ffffff'); break;
    case 'crystal': tri(b, 18.5, 1, 15.8, 5.5, 21.2, 5.5, c); tri(b, 15.8, 5.5, 21.2, 5.5, 18.5, 9.5, d); pset(b, 18, 3, l); pset(b, 17, 5, l); break;
    case 'moon': disc(b, 18.5, 5.5, 2.9, 2.9, c); disc(b, 19.9, 4.4, 2.2, 2.2, null, c); pset(b, 17, 6, l); break;
    case 'skull': disc(b, 18.5, 5, 2.6, 2.4, c); rect(b, 17, 7, 3, 2, c); pset(b, 17, 5, PUPIL); pset(b, 19, 5, PUPIL); pset(b, 18, 6, '#8a7a60'); pset(b, 18, 8, d); break;
    case 'branch': line(b, 18, 8, 18, 5, (S.wood || [])[0] || '#8a5a2a'); disc(b, 16.6, 6.2, 1.8, 1.2, c); disc(b, 20.2, 5.2, 1.6, 1.2, d); disc(b, 18.5, 3.2, 1.3, 1.7, c); pset(b, 18, 2, l); break;
    case 'carrot': line(b, 18, 7, 16, 3, c); line(b, 18, 7, 18, 2, d); line(b, 18, 7, 20, 3, c); break;
    case 'plunger': disc(b, 18.5, 5.5, 3, 2.3, c); rect(b, 15, 7, 7, 1, d); pset(b, 17, 4, l); break;
    case 'fish': disc(b, 18.5, 5, 1.8, 3.3, c); tri(b, 16.2, 0, 20.8, 0, 18.5, 2.5, d); pset(b, 18, 6, PUPIL); line(b, 17, 3, 17, 5, d, c); break;
    case 'candy': for (const [x, y, k] of [[18, 6, 0], [18, 5, 1], [18, 4, 0], [19, 3, 1], [20, 3, 0], [21, 4, 1], [21, 5, 0]]) pset(b, x, y, k ? '#ffffff' : c); break;
    case 'fork': rect(b, 16, 6, 5, 2, c); for (const x of [16, 18, 20]) line(b, x, 5, x, 1, x === 20 ? d : c); break;
    case 'star': stamp(b, 16, 2, ['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.'], c); pset(b, 18, 3, l); break;
    case 'heart': stamp(b, 16, 3, ['XX.XX', 'XXXXX', 'XXXXX', '.XXX.', '..X..'], c); pset(b, 16, 3, l); pset(b, 20, 5, d); break;
    case 'eye': disc(b, 18.5, 5.5, 2.9, 2, '#ffffff'); disc(b, 18.5, 5.5, 1.4, 1.4, c); pset(b, 18, 5, PUPIL); break;
    case 'sun': for (const [x, y] of [[18, 1], [15, 5], [21, 5], [16, 2], [20, 2], [16, 8], [20, 8]]) pset(b, x, y, d); disc(b, 18.5, 5.5, 2.4, 2.4, c); pset(b, 17, 4, '#ffffff'); break;
  }
}
function robeDraw(b, R){
  const [rb, rd, rl] = R.c;
  tri(b, 11, 11, 3, 23, 19, 23, rb); rect(b, 5, 17, 13, 6, rb);
  tri(b, 11, 11, 11.5, 23, 19, 23, rd, rb);
  line(b, 6, 18, 5, 22, rl, rb);
  // узор ложится только на ткань; на теневой стороне — темнее
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= b.w || y >= b.h) return;
    const i = y * b.w + x, p = b.px[i];
    if (p === rb || p === rl) b.px[i] = c; else if (p === rd) b.px[i] = mix(c, '#000000', 0.3);
  };
  const seg = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) put(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c); };
  const all = fn => { for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) fn(x, y); };
  switch (R.pat){
    case 'stripes': all((x, y) => { if (y % 2 && y > 12) put(x, y, R.pc); }); break;
    case 'dots': for (const [x, y] of [[9, 14], [13, 15], [7, 17], [11, 18], [15, 19], [9, 21], [5, 21], [17, 21], [13, 21]]) put(x, y, R.pc); break;
    case 'stars':
      for (const [x, y] of [[9, 14], [6, 19], [13, 17], [16, 21], [10, 20]]) put(x, y, R.pc);
      for (const [x, y] of [[7, 16], [12, 21], [16, 18], [11, 15], [14, 13]]) put(x, y, mix(R.pc, '#ffffff', 0.6));
      break;
    case 'checker': all((x, y) => { if (((x >> 1) + (y >> 1)) % 2) put(x, y, R.pc); }); break;
    case 'patch':
      for (const [x, y] of [[6, 19], [7, 19], [6, 20], [7, 20]]) put(x, y, '#6a8a4a');
      for (const [x, y] of [[14, 16], [15, 16], [14, 17], [15, 17]]) put(x, y, '#b0603a');
      put(8, 18, '#5a4020'); put(13, 18, '#5a4020'); put(10, 15, '#5a4020');
      break;
    case 'cracks': for (const s of [[6, 22, 8, 18], [8, 18, 10, 19], [13, 21, 15, 17], [15, 17, 17, 18], [10, 13, 11, 16]]) seg(...s, R.pc); break;
    case 'rainbow': all((x, y) => put(x, y, RAINBOW[(Math.floor((y - 11) / 2) + 60) % 6])); break;
  }
  rect(b, 3, 22, 17, 1, R.trim, true); line(b, 11, 15, 11, 21, R.trim, true);
}
function bootsDraw(b, B, walk){
  const w = B.wide ? 4 : 3;
  for (const x of [6 + walk - (B.wide ? 1 : 0), 13 - walk]){
    rect(b, x, 23, w, 2, B.c);
    if (B.top) rect(b, x, 23, w, 1, B.top);
    if (B.dot) pset(b, x + 1, 23, B.dot);
  }
  if (B.wings) for (const [x, y] of [[5 + walk, 23], [4 + walk, 22], [3 + walk, 22], [16 - walk, 23], [17 - walk, 22], [18 - walk, 22]]) pset(b, x, y, '#ffffff');
}
function beardDraw(b, B){
  if (B.kind === 'none'){ pset(b, 11, 13, '#b06050'); pset(b, 12, 13, '#b06050'); return; }
  const [c, d] = B.c;
  switch (B.kind){
    case 'long': case 'braid': case 'sponge': case 'fire': case 'rainbow':
      disc(b, 11, 13.5, 3.4, 2, c); tri(b, 8, 13, 14, 13, 11, 18.5, c); line(b, 12, 14, 12, 17, d, c);
      break;
    case 'short': disc(b, 11, 13.5, 3.4, 2, c); line(b, 12, 13, 12, 14, d, c); break;
    case 'santa': disc(b, 11, 14, 4.4, 2.6, c); tri(b, 7, 14, 15, 14, 11, 20.5, c); line(b, 12, 15, 12, 19, d, c); line(b, 9, 12, 14, 12, c); break;
    case 'goatee': pset(b, 11, 13, '#b06050'); tri(b, 10, 13.6, 14, 13.6, 12, 17, c); pset(b, 12, 15, d); break;
    case 'stubble': pset(b, 11, 13, '#b06050'); for (const [x, y] of [[8, 12], [10, 14], [12, 14], [14, 12], [9, 13], [13, 13], [11, 15]]) pset(b, x, y, c); break;
    case 'mustache': case 'horseshoe': line(b, 9, 12, 14, 12, c); pset(b, 9, 13, d); pset(b, 14, 13, d); break;
  }
  if (B.kind === 'horseshoe'){ line(b, 9, 13, 9, 16, c); line(b, 14, 13, 14, 16, c); }
  if (B.kind === 'braid'){ line(b, 11, 18, 11, 21, c); rect(b, 10, 16, 3, 1, '#ffd25a', true); pset(b, 11, 20, '#ffd25a'); }
  if (B.kind === 'sponge') for (const [x, y] of [[9, 13], [12, 14], [10, 15], [13, 13], [11, 17], [10, 12]]) pset(b, x, y, d, c);
  if (B.kind === 'fire'){
    recolor(b, p => p === c, (x, y) => y <= 13 ? '#ffe95a' : y <= 15 ? c : d);
    for (const [x, y] of [[10, 19], [12, 19]]) pset(b, x, y, d);
  }
  if (B.kind === 'rainbow') recolor(b, p => p === c || p === d, (x, y) => RAINBOW[(y - 11 + 60) % 6]);
}
function eyesDraw(b, E){
  const dark = (x, y) => pset(b, x, y, PUPIL);
  switch (E.kind){
    case 'dots': dark(10, 10); dark(13, 10); break;
    case 'happy': dark(10, 10); dark(13, 10); pset(b, 9, 11, '#ff8a9a'); pset(b, 14, 11, '#ff8a9a'); break;
    case 'angry': for (const [x, y] of [[9, 10], [14, 10]]) pset(b, x, y, PUPIL); for (const [x, y] of [[10, 10], [13, 10], [10, 11], [13, 11]]) pset(b, x, y, '#d01818'); break;
    case 'sleepy': dark(9, 10); dark(10, 10); dark(13, 10); dark(14, 10); break;
    case 'glasses': line(b, 8, 10, 15, 10, '#3a2a1a'); for (const x of [9, 13]) pset(b, x, 10, '#cfefff'); dark(10, 10); dark(14, 10); break;
    case 'shades': line(b, 8, 10, 15, 10, '#101018'); rect(b, 9, 11, 2, 1, '#101018'); rect(b, 13, 11, 2, 1, '#101018'); pset(b, 9, 10, '#6a6a8a'); pset(b, 13, 10, '#6a6a8a'); break;
    case 'cyclops': rect(b, 9, 10, 6, 2, '#ffffff'); rect(b, 11, 10, 2, 2, PUPIL); break;
    case 'googly': rect(b, 9, 10, 2, 2, '#ffffff'); rect(b, 13, 10, 2, 2, '#ffffff'); dark(9, 11); dark(14, 10); break;
    case 'monocle': dark(10, 10); dark(13, 10); for (const [x, y] of [[12, 10], [14, 10], [12, 11], [13, 11], [14, 11]]) pset(b, x, y, '#ffd25a'); line(b, 14, 12, 15, 14, '#ffd25a'); break;
    case 'hearts': for (const x of [9, 13]){ rect(b, x, 10, 2, 2, '#ff4f8b'); pset(b, x, 10, '#ffb0d0'); } break;
    case 'glow': for (const x of [9, 13]){ rect(b, x, 10, 2, 1, E.c); pset(b, x + 1, 10, '#ffffff'); } break;
    case 'chaos': rect(b, 9, 10, 2, 1, '#ff4f8b'); rect(b, 13, 10, 2, 1, '#7fe8ff'); pset(b, 10, 11, '#9b5aff'); pset(b, 13, 11, '#9b5aff'); break;
  }
}
function hatDraw(b, H, hair){
  const [hc, hd] = H.c || [];
  const bald = () => { rect(b, 7, 9, 1, 3, hair); rect(b, 14, 9, 1, 2, hair); pset(b, 10, 8, '#ffe0c0'); };
  switch (H.kind){
    case 'none': bald(); break;
    case 'wizard':
      disc(b, 11, 8, 8.5, 1.9, hd);
      tri(b, 5.5, 8, 16.5, 8, 14, 1, hc); tri(b, 11, 8, 16.5, 8, 14, 1, hd, hc);
      pset(b, 15, 0, hc); pset(b, 16, 0, hc); pset(b, 16, 1, hc);
      line(b, 7, 6, 15, 6, H.band, true); pset(b, 11, 3, '#ffe9a0'); pset(b, 12, 4, H.band);
      if (H.bolt) for (const [x, y] of [[13, 1], [12, 2], [13, 3], [12, 4], [11, 5]]) pset(b, x, y, '#ffe95a', true);
      if (H.stars) for (const [x, y] of [[9, 5], [13, 2], [12, 7], [4, 8], [17, 8], [10, 4]]) pset(b, x, y, x === 10 ? '#ffffff' : '#ffe95a', true);
      break;
    case 'cap':
      disc(b, 11, 8, 4.8, 3, hc); rect(b, 6, 8, 11, 2, hc); rect(b, 12, 8, 7, 2, hd);
      pset(b, 11, 5, '#ffffff'); line(b, 8, 7, 9, 6, mix(hc, '#ffffff', 0.35), hc);
      break;
    case 'sombrero':
      disc(b, 11, 8.5, 10.5, 1.8, hd); disc(b, 11, 8.2, 10, 1.3, hc, hd);
      disc(b, 11, 5.5, 4.2, 3.2, hc); rect(b, 7, 6, 9, 1, H.band, hc);
      for (const x of [2, 6, 16, 20]) pset(b, x, 8, H.band);
      break;
    case 'crown': {
      const [g1, g2] = H.gems;
      disc(b, 11, 8, 3.8, 1.8, hair);
      rect(b, 7, 5, 9, 3, hc);
      tri(b, 7, 5, 8, 1.5, 9.5, 5, hc); tri(b, 9.5, 5, 11.5, 0.5, 13.5, 5, hc); tri(b, 13.5, 5, 15, 1.5, 16, 5, hc);
      rect(b, 7, 7, 9, 1, hd); pset(b, 11, 6, g1); pset(b, 8, 6, g2); pset(b, 14, 6, g2);
      break;
    }
    case 'pirate':
      disc(b, 11, 7.6, 8.5, 2.1, hc); tri(b, 5, 7.6, 17, 7.6, 11, 1.5, hc); tri(b, 11, 1.5, 17, 7.6, 11, 7.6, hd, hc);
      rect(b, 4, 7, 15, 1, H.band, true);
      for (const [x, y] of [[10, 4], [11, 4], [12, 4], [11, 5], [10, 6], [12, 6]]) pset(b, x, y, '#ffffff');
      break;
    case 'top':
      disc(b, 11, 8.2, 6.5, 1.2, hd); rect(b, 7, 1, 9, 7, hc); rect(b, 14, 1, 2, 7, hd);
      rect(b, 7, 6, 9, 1, H.band); line(b, 8, 2, 8, 5, mix(hc, '#ffffff', 0.25));
      break;
    case 'beanie':
      dome(b, 11, 8.5, 4.9, 5, hc); rect(b, 6, 7, 11, 2, hd);
      for (const x of [7, 9, 11, 13, 15]) pset(b, x, 7, mix(hd, '#000000', 0.25));
      disc(b, 11, 3, 1.7, 1.5, H.band);
      break;
    case 'hood':
      for (let y = 2; y <= 14; y++) for (let x = 3; x <= 18; x++)
        if (inE(x, y, 11, 10, 5.6, 6.6) && !inE(x, y, 11.6, 11.4, 3.3, 3.6)) pset(b, x, y, x < 11 ? hc : hd);
      tri(b, 6, 6, 9, 4, 3, 1.5, hc);
      break;
    case 'viking':
      line(b, 6, 7, 4, 5, '#f3e6c8'); line(b, 5, 7, 3, 5, '#f3e6c8'); line(b, 3, 5, 3, 2, '#d8c8a0');
      line(b, 16, 7, 18, 5, '#f3e6c8'); line(b, 17, 7, 19, 5, '#f3e6c8'); line(b, 19, 5, 19, 2, '#d8c8a0');
      dome(b, 11, 8.5, 4.7, 4.5, hc); rect(b, 6, 8, 11, 1, hd);
      for (const x of [7, 11, 15]) pset(b, x, 8, '#ffd25a');
      pset(b, 9, 5, '#ffffff');
      break;
    case 'bucket':
      for (let y = 1; y <= 7; y++){ const half = 3 + (y - 1) * 0.45; for (let x = Math.round(11.5 - half); x < Math.round(11.5 + half); x++) pset(b, x, y, x > 12 ? hd : hc); }
      rect(b, 6, 8, 11, 1, hd); line(b, 9, 2, 9, 6, '#d8dce4');
      pset(b, 6, 4, '#4a4a54'); pset(b, 17, 4, '#4a4a54');
      break;
    case 'pot':
      rect(b, 7, 4, 9, 4, hc); line(b, 15, 4, 15, 7, hd); rect(b, 6, 8, 11, 1, hd);
      rect(b, 4, 5, 2, 1, '#2a2a34'); rect(b, 17, 5, 2, 1, '#2a2a34'); line(b, 8, 5, 8, 6, '#ffffff');
      break;
    case 'cone':
      tri(b, 7, 8.5, 16, 8.5, 11.5, 0, hc);
      for (let x = 0; x < b.w; x++){ pset(b, x, 3, '#ffffff', hc); pset(b, x, 6, '#ffffff', hc); }
      rect(b, 5, 8, 13, 1, hd);
      break;
    case 'foil':
      tri(b, 6.5, 8.5, 16.5, 8.5, 11.5, 0.5, hc);
      for (const [x, y] of [[10, 3], [12, 5], [9, 6], [14, 7], [11, 7]]) pset(b, x, y, '#f4f6fb', hc);
      for (const [x, y] of [[12, 2], [10, 5], [13, 6], [8, 7], [11, 4]]) pset(b, x, y, hd, hc);
      break;
    case 'beret': disc(b, 10.5, 7, 5.5, 2, hc); pset(b, 11, 4, hd); line(b, 6, 8, 15, 8, hd, hc); break;
    case 'cowboy':
      disc(b, 11, 8.5, 9.5, 1.6, hd); pset(b, 1, 7, hd); pset(b, 20, 7, hd);
      rect(b, 7, 3, 9, 5, hc); pset(b, 11, 3, hd); rect(b, 14, 3, 2, 5, hd); rect(b, 7, 7, 9, 1, H.band);
      break;
    case 'chef':
      rect(b, 8, 4, 7, 4, hc); disc(b, 11.5, 3, 4.6, 2.6, hc); disc(b, 13.6, 3.2, 2, 1.6, hd, hc); rect(b, 8, 7, 7, 1, hd);
      break;
    case 'mushroom':
      dome(b, 11, 9, 8, 6.5, hc);
      for (const [x, y] of [[7, 6], [10, 4], [14, 5], [16, 7], [11, 7], [5, 8], [13, 3]]) pset(b, x, y, '#ffffff', hc);
      line(b, 3, 8, 19, 8, '#f0e0c8', true);
      break;
    case 'party':
      tri(b, 8, 8.5, 15, 8.5, 11.5, 0.5, hc);
      for (let y = 0; y < 9; y++) for (let x = 0; x < b.w; x++) if ((x + y) % 3 === 0) pset(b, x, y, hd, hc);
      disc(b, 11.5, 0.8, 1.3, 1, H.band);
      break;
    case 'halo':
      bald();
      disc(b, 11.5, 3.5, 4.6, 1.5, hc); disc(b, 11.5, 3.5, 2.8, 0.6, null, hc);
      for (const x of [14, 15]) pset(b, x, 4, hd, hc);
      break;
    case 'horns':
      disc(b, 11, 8.4, 3.8, 1.4, hair === '#ecebf5' ? '#2a2230' : hair);
      tri(b, 6, 8.6, 8.8, 8.6, 5, 1.5, hc); line(b, 7, 7, 6, 4, hd, hc);
      tri(b, 13.2, 8.6, 16, 8.6, 17, 1.5, hc); line(b, 15, 7, 16, 4, hd, hc);
      break;
  }
}
function mageSprite(f, L){
  const b = PB(22, 26), walk = [0, 1, 0, -1][f];
  staffShaft(b, L.staff);
  robeDraw(b, L.robe);
  bootsDraw(b, L.boots, walk);
  disc(b, 11, 11, 3.6, 3.4, SKIN);
  beardDraw(b, L.beard);
  eyesDraw(b, L.eyes);
  hatDraw(b, L.hat, L.beard.kind === 'none' ? '#ecebf5' : L.beard.kind === 'rainbow' ? '#ff4f4f' : L.beard.c[0]);
  disc(b, 18, 15, 1.7, 1.6, SKIN);
  staffTop(b, L.staff);
  outline(b, OUT);
  return toCanvas(b);
}
const mageFrames = L => [0, 1, 2, 3].map(f => mageSprite(f, L));
// свечения от вещей: посох всегда, редкие вещи добавляют ауру
const staffGlow = L => L.staff.glow || L.staff.c;
const lookAuras = L => Object.values(L).map(it => it.aura).filter(Boolean);
// картинка мага для карточек гардероба и рулетки; on — id вещей по слотам
const lookCache = {};
function lookPreview(on){
  const key = Object.keys(SLOTS).map(s => on[s]).join('|');
  return lookCache[key] || (lookCache[key] = mageSprite(0, lookOf(on)).toDataURL());
}
const tryOn = id => lookPreview({ ...WARD.on, [ITEMS[id].slot]: id });
