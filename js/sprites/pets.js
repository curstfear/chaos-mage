// ---------- питомцы: спрайты ----------
function dragonSprite(f){
  const b = PB(22, 18), up = f ? -3 : 1;
  tri(b, 9, 8, 3, 1 + up, 12, 7, '#2e7a36'); tri(b, 9, 8, 5, 3 + up, 11, 8, '#4fbf5a', '#2e7a36');
  line(b, 6, 12, 1, 9, '#2e7a36'); pset(b, 0, 8, '#ff7a2e');
  ball(b, 9, 12, 5.5, 4, '#4fbf5a', '#2e7a36', '#8fe08a');
  disc(b, 9, 13.5, 3.2, 1.6, '#ffe08a', '#4fbf5a');
  rect(b, 6, 15, 2, 2, '#2e7a36'); rect(b, 11, 15, 2, 2, '#2e7a36');
  ball(b, 16, 8, 4.2, 3.6, '#4fbf5a', '#2e7a36', '#8fe08a');
  rect(b, 18, 9, 3, 2, '#4fbf5a'); pset(b, 20, 9, '#1a1030');
  tri(b, 14, 5, 13, 2, 16, 5, '#f3e6c8'); pset(b, 17, 7, '#ffffff'); pset(b, 17, 8, '#1a1030');
  outline(b, OUT); return toCanvas(b);
}
function toadSprite(f){
  const b = PB(18, 14), sq = f ? 1 : 0;
  rect(b, 1, 11 - sq, 4, 2, '#c9a000'); rect(b, 13, 11 - sq, 4, 2, '#c9a000');
  ball(b, 9, 9 + sq * 0.5, 7, 4.5 - sq, '#ffd700', '#c9a000', '#fff2a0');
  for (const x of [5.5, 12.5]){ disc(b, x, 4.5, 2.4, 2.2, '#ffd700'); disc(b, x, 4.3, 1.4, 1.4, '#ffffff'); pset(b, Math.floor(x), 4, '#1a1030'); }
  line(b, 6, 10, 12, 10, '#7a5a00'); pset(b, 8, 7, '#e8a000'); pset(b, 11, 8, '#e8a000');
  outline(b, OUT); return toCanvas(b);
}
function phoenixSprite(f){
  const b = PB(22, 20), up = f ? -4 : 1;
  tri(b, 10, 9, 1, 3 + up, 8, 12, '#ff4a2e'); tri(b, 12, 9, 21, 3 + up, 14, 12, '#ff4a2e');
  tri(b, 10, 9, 3, 5 + up, 8, 11, '#ffb347', '#ff4a2e'); tri(b, 12, 9, 19, 5 + up, 14, 11, '#ffb347', '#ff4a2e');
  for (const [x, l] of [[9, 5], [11, 6], [13, 4]]) line(b, x, 14, x - 1, Math.min(19, 14 + l), '#ffd25a');
  ball(b, 11, 11, 4, 3.6, '#ff7a2e', '#c43a12', '#ffd25a');
  ball(b, 13, 6, 3, 2.8, '#ff7a2e', '#c43a12', '#ffd25a');
  tri(b, 15, 6, 18, 7, 15, 8, '#ffd25a'); pset(b, 14, 5, '#1a1030');
  pset(b, 12, 2, '#ffd25a'); pset(b, 13, 3, '#ffd25a'); pset(b, 11, 3, '#ff2e4d');
  outline(b, OUT); return toCanvas(b);
}
function owlSprite(f){
  const b = PB(16, 18);
  tri(b, 3, 5, 2, 0, 6, 4, '#5a3820'); tri(b, 13, 5, 14, 0, 10, 4, '#5a3820');
  ball(b, 8, 10, 6, 7, '#8a5a3a', '#5a3820', '#b07a50');
  disc(b, 8, 12.5, 3.6, 3.6, '#d8b890', '#8a5a3a');
  for (const [x, y] of [[7, 11], [9, 12], [7, 14], [9, 14]]) pset(b, x, y, '#a07a50');
  if (f){ line(b, 4, 7, 7, 7, '#1a1030'); line(b, 9, 7, 12, 7, '#1a1030'); }
  else for (const x of [5.5, 10.5]){ disc(b, x, 7, 2.3, 2.3, '#ffffff'); disc(b, x, 7, 1.4, 1.4, '#ffd25a'); pset(b, Math.floor(x), 7, '#1a1030'); }
  tri(b, 7, 9, 9, 9, 8, 11, '#ffb347');
  rect(b, 5, 17, 2, 1, '#ffb347'); rect(b, 9, 17, 2, 1, '#ffb347');
  outline(b, OUT); return toCanvas(b);
}
function nestSprite(){
  const b = PB(26, 12);
  disc(b, 13, 7, 12.5, 4.5, '#5a3a1e'); disc(b, 13, 5.5, 10, 2.6, '#2a1a0e', '#5a3a1e');
  for (const [x0, y0, x1, y1] of [[2, 7, 10, 9], [9, 10, 20, 8], [15, 6, 24, 8], [4, 9, 8, 4], [18, 10, 24, 6]]) line(b, x0, y0, x1, y1, '#a07a48');
  outline(b, OUT); return toCanvas(b);
}
function eggSprite(){
  const b = PB(12, 14);
  ball(b, 6, 7.5, 4.8, 6, '#f2ead8', '#c8bca0', '#ffffff');
  for (const [x, y] of [[4, 5], [7, 8], [5, 10], [8, 4]]) disc(b, x, y, 1, 1, '#6abf6a', true);
  outline(b, OUT); return toCanvas(b);
}
// древо совы: большое дерево с дуплом и фонариками; без совы — пустое дупло
function owlTreeSprite(P, biome, empty){
  const b = PB(36, 48);
  const leaf = P.leaf || '#5a2a1a', leafD = P.leafD || '#3a1a10', leafL = P.leafL || '#7a3a20';
  rect(b, 13, 22, 10, 25, P.bark); rect(b, 19, 22, 4, 25, P.barkD, P.bark); disc(b, 18, 46.5, 8, 2, P.bark);
  line(b, 13, 30, 7, 26, P.bark); line(b, 22, 28, 29, 24, P.bark);
  ball(b, 9, 16, 9, 8, leaf, leafD, leafL); ball(b, 27, 16, 9, 8, leaf, leafD, leafL); ball(b, 18, 10, 13, 10, leaf, leafD, leafL);
  if (biome === 'ice'){ disc(b, 18, 2.5, 8, 2, P.snow, true); disc(b, 8, 9, 5, 1.5, P.snow, true); disc(b, 28, 9, 5, 1.5, P.snow, true); }
  disc(b, 18, 31, 3.6, 4.4, '#140a06');
  if (!empty){ pset(b, 17, 30, '#ffd25a'); pset(b, 19, 30, '#ffd25a'); tri(b, 14, 27, 15, 24, 16, 27, '#5a3820'); tri(b, 20, 27, 21, 24, 22, 27, '#5a3820'); }
  for (const [x, y] of [[6, 20], [30, 21], [12, 12]]){ line(b, x, y, x, y + 3, '#4a3a2a'); rect(b, x - 1, y + 4, 3, 3, '#ffd25a'); }
  for (const [x, y] of [[15, 38], [20, 35], [16, 41]]) pset(b, x, y, P.glow);
  outline(b, OUT); return toCanvas(b);
}
function ghostSprite(){
  const b = PB(14, 16);
  disc(b, 7, 6, 5.6, 5.6, '#eef6ff'); rect(b, 1, 6, 12, 8, '#eef6ff');
  for (const x of [1, 2, 5, 6, 9, 10]) pset(b, x, 13, null);
  rect(b, 9, 3, 4, 10, '#c6d6ee', '#eef6ff');
  rect(b, 4, 5, 2, 3, '#1a1030'); rect(b, 8, 5, 2, 3, '#1a1030'); pset(b, 4, 5, '#ffffff'); pset(b, 8, 5, '#ffffff');
  pset(b, 3, 9, '#ffb0c8'); pset(b, 10, 9, '#ffb0c8'); rect(b, 6, 9, 2, 1, '#1a1030');
  outline(b, OUT);
  return toCanvas(b);
}
function turretSprite(){
  const b = PB(16, 22);
  rect(b, 3, 8, 10, 13, '#3a3456'); rect(b, 9, 8, 4, 13, '#24203a', '#3a3456'); rect(b, 3, 8, 1, 13, '#5a5480', '#3a3456');
  rect(b, 1, 6, 14, 3, '#4a4470'); rect(b, 1, 6, 14, 1, '#7a72a8');
  for (const x of [1, 5, 9, 13]) rect(b, x, 4, 2, 2, '#4a4470');
  rect(b, 6, 13, 4, 4, '#1a1030');
  outline(b, OUT);
  return toCanvas(b);
}
