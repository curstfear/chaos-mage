// ---------- постройки и декор ----------
const PAL = {
  abyss: { stone: '#4a4470', stoneD: '#2e2a4c', stoneL: '#6e66a0', glow: '#c48bff', leaf: '#5b3bb0', leafD: '#3a2280', leafL: '#9b7bff', bark: '#3a2a4a', barkD: '#24182e',
           roof: '#3a2a6a', roofD: '#261a4a', wall: '#4a4470', wallD: '#2e2a4c', rock: '#3a3456', rockD: '#24203a', rockL: '#5a5480',
           ground: ['#141026', '#100c1e', '#1a1532', '#221a40'], tuft: '#5a3aa0', flower: '#c48bff' },
  lava:  { stone: '#3a2a26', stoneD: '#221816', stoneL: '#5a4038', glow: '#ff8a3d', leaf: null, bark: '#2a1a16', barkD: '#140c0a',
           roof: '#4a1e14', roofD: '#2e120c', wall: '#3a2a26', wallD: '#221816', rock: '#2e2220', rockD: '#1a1210', rockL: '#4e3a34',
           ground: ['#1c100d', '#140a08', '#24160f', '#2c1a12'], tuft: '#4a2a1a', flower: '#ff7a2e' },
  ice:   { stone: '#7aa8c8', stoneD: '#4a7898', stoneL: '#b8e0f5', glow: '#8fe3ff', leaf: '#1f5a4a', leafD: '#123a30', leafL: '#2f7a62', bark: '#4a3020', barkD: '#2e1c12',
           roof: '#5a4a6a', roofD: '#3a2e4a', wall: '#6a5a4a', wallD: '#4a3a2e', rock: '#5a7a94', rockD: '#3a5670', rockL: '#9ac0dc',
           ground: ['#16304a', '#11263c', '#1c3a58', '#24486a'], tuft: '#cfe8ff', flower: '#ffffff', snow: '#eaf6ff' },
  swamp: { stone: '#4a5a44', stoneD: '#2e3a2a', stoneL: '#6a7e60', glow: '#9dff5a', leaf: '#2f6a2a', leafD: '#1a4218', leafL: '#4a9a3a', bark: '#3a2a1a', barkD: '#22180e',
           roof: '#2f5a2a', roofD: '#1e3c1a', wall: '#5a4228', wallD: '#3a2a18', rock: '#3e4a3a', rockD: '#262e24', rockL: '#5a6a52',
           ground: ['#142012', '#0e180c', '#1a2a16', '#20321a'], tuft: '#3a7a2a', flower: '#d16bff' }
};
function treeSprite(P, biome){
  const b = PB(28, 40);
  rect(b, 12, 24, 5, 15, P.bark); rect(b, 15, 24, 2, 15, P.barkD, P.bark); disc(b, 14.5, 38.5, 5, 1.6, P.bark);
  if (biome === 'ice'){
    for (const [y, w] of [[30, 13], [22, 11], [14, 8]]){
      tri(b, 14, y - 13, 14 - w, y, 14 + w, y, P.leaf); tri(b, 14, y - 13, 14, y, 14 + w, y, P.leafD, P.leaf);
      line(b, 14 - w, y, 14 + w, y, P.snow); line(b, 14 - w + 2, y - 1, 14 - 2, y - 1, P.snow, P.leaf);
    }
    pset(b, 14, 1, P.snow); pset(b, 14, 2, P.snow);
  } else if (biome === 'lava'){
    line(b, 14, 26, 6, 12, P.bark); line(b, 15, 24, 22, 10, P.bark); line(b, 14, 20, 14, 6, P.bark); line(b, 8, 15, 4, 13, P.bark); line(b, 20, 13, 25, 9, P.bark);
    line(b, 15, 26, 7, 12, P.barkD); for (const [x, y] of [[6, 12], [22, 10], [14, 6], [4, 13], [25, 9], [10, 18]]) pset(b, x, y, '#ff8a3d');
  } else if (biome === 'swamp'){
    line(b, 14, 26, 5, 10, P.bark); line(b, 15, 25, 24, 12, P.bark); line(b, 14, 22, 15, 5, P.bark); line(b, 6, 11, 2, 14, P.bark);
    for (const [x, y, l] of [[5, 10, 6], [9, 16, 4], [24, 12, 7], [20, 16, 3], [15, 5, 5]]) line(b, x, y, x, y + l, P.leafL);
    ball(b, 15, 6, 5, 3, P.leaf, P.leafD, P.leafL);
  } else {
    ball(b, 9, 16, 7, 6, P.leaf, P.leafD, P.leafL); ball(b, 20, 15, 7, 6, P.leaf, P.leafD, P.leafL); ball(b, 14, 9, 9, 7.5, P.leaf, P.leafD, P.leafL);
    for (const [x, y] of [[8, 15], [19, 17], [14, 7], [21, 12], [11, 20]]) pset(b, x, y, P.glow);
  }
  outline(b, OUT);
  return toCanvas(b);
}
function pillarSprite(P, biome){
  const b = PB(14, 38);
  rect(b, 1, 32, 12, 5, P.stoneD); rect(b, 1, 32, 12, 1, P.stoneL);
  rect(b, 3, 7, 8, 25, P.stone); rect(b, 8, 7, 3, 25, P.stoneD, P.stone); rect(b, 3, 7, 1, 25, P.stoneL, P.stone);
  line(b, 6, 8, 6, 31, P.stoneD, P.stone);
  rect(b, 1, 3, 12, 4, P.stone); rect(b, 1, 3, 12, 1, P.stoneL); rect(b, 1, 6, 12, 1, P.stoneD);
  pset(b, 1, 3, null); pset(b, 2, 3, null); pset(b, 12, 3, null);
  line(b, 4, 18, 6, 21, P.stoneD, P.stone);
  for (const y of [13, 15, 17]) pset(b, 7, y, P.glow);
  if (biome === 'ice') rect(b, 1, 2, 11, 2, P.snow);
  if (biome === 'swamp') for (const [x, y] of [[3, 10], [4, 11], [9, 26], [10, 27], [3, 29]]) pset(b, x, y, P.leafL);
  outline(b, OUT);
  return toCanvas(b);
}
function obeliskSprite(P){
  const b = PB(16, 46);
  tri(b, 8, 0, 3, 7, 13, 7, P.stone); tri(b, 8, 0, 13, 7, 8, 7, P.stoneD, P.stone);
  tri(b, 3, 7, 13, 7, 14, 40, P.stone); tri(b, 3, 7, 2, 40, 14, 40, P.stone); tri(b, 8, 7, 13, 7, 14, 40, P.stoneD, P.stone); tri(b, 8, 7, 8, 40, 14, 40, P.stoneD, P.stone);
  rect(b, 0, 40, 16, 5, P.stoneD); rect(b, 0, 40, 16, 1, P.stoneL);
  for (let y = 10; y < 36; y += 4){ pset(b, 6, y, P.glow); pset(b, 7, y + 1, P.glow); pset(b, 6, y + 2, P.glow); }
  outline(b, OUT);
  return toCanvas(b);
}
function houseSprite(P, biome){
  const b = PB(42, 42);
  rect(b, 6, 19, 30, 21, P.wall); rect(b, 21, 19, 15, 21, P.wallD, P.wall); rect(b, 6, 19, 1, 21, P.stoneL, P.wall);
  for (let y = 23; y < 40; y += 4) line(b, 6, y, 35, y, P.wallD, true);
  for (let y = 19; y < 40; y += 8){ line(b, 13, y, 13, y + 3, P.wallD, true); line(b, 28, y + 4, 28, y + 7, P.wallD, true); }
  if (biome === 'ice'){ tri(b, 1, 18, 21, 1, 41, 18, P.snow); tri(b, 3, 20, 21, 4, 39, 20, P.roof); tri(b, 21, 4, 39, 20, 21, 20, P.roofD, P.roof); }
  else { tri(b, 1, 20, 21, 2, 41, 20, P.roof); tri(b, 21, 2, 41, 20, 21, 20, P.roofD, P.roof); }
  line(b, 2, 20, 40, 20, P.roofD);
  rect(b, 28, 4, 4, 9, P.stoneD); rect(b, 28, 4, 4, 1, P.stoneL);
  rect(b, 18, 29, 7, 11, '#1a0f0a'); rect(b, 18, 29, 7, 1, P.stoneL); pset(b, 23, 35, '#ffd25a');
  rect(b, 9, 24, 6, 5, P.glow); rect(b, 28, 24, 5, 5, P.glow); line(b, 12, 24, 12, 28, P.wallD); line(b, 9, 26, 14, 26, P.wallD);
  if (biome === 'swamp') for (const [x, y] of [[8, 16], [9, 15], [30, 14], [16, 9], [34, 18]]) pset(b, x, y, P.leafL);
  if (biome === 'lava'){ pset(b, 10, 14, null); pset(b, 11, 14, null); pset(b, 11, 13, null); for (const [x, y] of [[30, 2], [29, 1], [31, 0]]) pset(b, x, y, '#ff8a3d'); }
  if (biome === 'abyss') rect(b, 19, 30, 5, 9, P.glow, '#1a0f0a');
  outline(b, OUT);
  return toCanvas(b);
}
function wallSprite(P, biome){
  const b = PB(38, 22), hs = [14, 17, 19, 19, 18, 13, 9, 12, 16, 19, 19, 17, 15, 18, 19, 19, 16, 11, 14];
  for (let i = 0; i < 19; i++){ const h = hs[i]; rect(b, i * 2, 21 - h, 2, h, P.stone); rect(b, i * 2, 21 - h, 2, 1, P.stoneL); }
  for (let y = 20; y > 2; y -= 4){ line(b, 0, y, 37, y, P.stoneD, P.stone); for (let x = (y % 8 ? 2 : 6); x < 38; x += 8) line(b, x, y - 3, x, y - 1, P.stoneD, P.stone); }
  rect(b, 0, 20, 38, 2, P.stoneD);
  if (biome === 'ice') for (let i = 0; i < 19; i++) rect(b, i * 2, 21 - hs[i] - 1, 2, 2, P.snow);
  if (biome === 'swamp') for (const [x, y, l] of [[5, 8, 5], [17, 4, 7], [27, 6, 4], [33, 5, 6]]) line(b, x, y, x, y + l, P.leafL, true);
  if (biome === 'lava') for (const [x, y] of [[9, 16], [10, 17], [24, 12], [25, 13]]) pset(b, x, y, '#ff7a2e', true);
  outline(b, OUT);
  return toCanvas(b);
}
function rockSprite(P, biome){
  const b = PB(26, 18);
  ball(b, 7, 12, 6, 5, P.rock, P.rockD, P.rockL); ball(b, 19, 12, 6.5, 5.5, P.rock, P.rockD, P.rockL); ball(b, 13, 9, 8, 7, P.rock, P.rockD, P.rockL);
  line(b, 10, 8, 13, 11, P.rockD, true);
  if (biome === 'ice'){ disc(b, 12, 3.5, 6, 2, P.snow, true); disc(b, 19, 7.5, 4, 1.4, P.snow, true); }
  if (biome === 'swamp'){ disc(b, 10, 4, 4, 2, P.leaf, true); disc(b, 19, 8, 3, 1.5, P.leafL, true); }
  if (biome === 'lava') line(b, 9, 12, 17, 14, '#ff7a2e', true);
  if (biome === 'abyss') for (const [x, y] of [[12, 6], [13, 7], [18, 11]]) pset(b, x, y, P.glow);
  outline(b, OUT);
  return toCanvas(b);
}
function totemSprite(P){
  const b = PB(16, 36);
  rect(b, 6, 12, 4, 23, P.bark); rect(b, 8, 12, 2, 23, P.barkD, P.bark);
  line(b, 3, 14, 13, 14, P.bark); for (const x of [3, 13]){ line(b, x, 14, x, 18, '#e8e0d0'); }
  ball(b, 8, 7, 6.2, 6, '#e8e0d0', '#a89c88', '#ffffff');
  rect(b, 5, 6, 2, 3, '#140c0a'); rect(b, 9, 6, 2, 3, '#140c0a'); pset(b, 5, 7, P.glow); pset(b, 10, 7, P.glow);
  rect(b, 5, 11, 6, 2, '#a89c88'); for (const x of [5, 7, 9]) pset(b, x, 11, '#140c0a');
  outline(b, OUT);
  return toCanvas(b);
}
function mushroomSprite(P){
  const b = PB(32, 34);
  rect(b, 13, 15, 6, 18, '#e8dcc8'); rect(b, 17, 15, 2, 18, '#b8a890', '#e8dcc8'); disc(b, 16, 32.5, 6, 1.6, '#e8dcc8');
  ball(b, 16, 11, 15, 9, '#7a3aa0', '#4a1e66', '#a86ad0');
  rect(b, 2, 15, 28, 2, '#2a1038', true);
  for (const [x, y, r] of [[9, 7, 1.8], [18, 5, 2.2], [24, 10, 1.6], [12, 12, 1.4]]) disc(b, x, y, r, r, '#c8ff6a', true);
  outline(b, OUT);
  return toCanvas(b);
}
function snowmanSprite(){
  const b = PB(22, 30);
  ball(b, 11, 23, 8, 6.5, '#f2f8ff', '#b8cde0', '#ffffff'); ball(b, 11, 13, 6, 5, '#f2f8ff', '#b8cde0', '#ffffff'); ball(b, 11, 6, 4.5, 4, '#f2f8ff', '#b8cde0', '#ffffff');
  rect(b, 7, 0, 8, 3, '#1a1a24'); rect(b, 5, 3, 12, 1, '#1a1a24');
  pset(b, 9, 5, '#1a1a24'); pset(b, 13, 5, '#1a1a24'); line(b, 11, 7, 14, 7, '#ff8a3d');
  rect(b, 6, 9, 10, 2, '#d6243e'); rect(b, 13, 11, 2, 4, '#d6243e');
  line(b, 5, 13, 0, 9, '#4a3020'); line(b, 17, 13, 21, 8, '#4a3020');
  for (const y of [12, 15, 21, 24]) pset(b, 11, y, '#1a1a24');
  outline(b, OUT);
  return toCanvas(b);
}
function detailSprite(P, biome, k){
  const b = PB(10, 8);
  if (k === 0){
    for (const [x, h] of [[2, 4], [4, 6], [6, 5], [8, 3]]) line(b, x, 7, x + (x > 5 ? 1 : -1), 7 - h, biome === 'lava' ? '#3a1a10' : P.tuft);
  } else if (k === 1){
    disc(b, 3, 5, 2, 1.6, P.rock); disc(b, 7, 6, 1.5, 1.2, P.rockL); pset(b, 2, 4, P.rockL);
  } else if (k === 2){
    line(b, 1, 6, 8, 3, '#d8d0c0'); pset(b, 1, 5, '#d8d0c0'); pset(b, 8, 2, '#d8d0c0'); pset(b, 0, 6, '#d8d0c0'); pset(b, 9, 3, '#d8d0c0');
  } else if (k === 3){
    line(b, 5, 7, 5, 3, P.tuft); disc(b, 5, 2.5, 1.6, 1.6, P.flower); pset(b, 5, 2, '#ffffff');
  } else {
    // обломки разрушенной постройки
    disc(b, 3, 5.5, 2.8, 2, P.stone); disc(b, 7, 6, 2.4, 1.7, P.stoneD); disc(b, 5, 3.5, 1.8, 1.4, P.stoneL); pset(b, 8, 4, P.bark); pset(b, 1, 7, P.stoneL);
  }
  outline(b, 'rgba(0,0,0,0.55)');
  return toCanvas(b);
}
function groundTile(P, biome){
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), [b0, b1, b2, b3] = P.ground;
  g.fillStyle = b0; g.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 260; i++){ g.fillStyle = Math.random() < 0.6 ? b1 : b2; g.fillRect(Math.random() * 32 | 0, Math.random() * 32 | 0, 1 + (Math.random() < 0.3), 1); }
  for (let i = 0; i < 14; i++){ g.fillStyle = b3; g.fillRect(Math.random() * 32 | 0, Math.random() * 32 | 0, 1, 1); }
  if (biome === 'abyss'){ g.fillStyle = '#08060f'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 16, 32, 1); g.fillRect(0, 0, 1, 16); g.fillRect(16, 16, 1, 16); }
  if (biome === 'lava') for (let k = 0; k < 2; k++){ let x = Math.random() * 32, y = Math.random() * 32; g.fillStyle = '#ff5a1f'; for (let s = 0; s < 5; s++){ g.fillRect(x | 0, y | 0, 1, 1); x += rnd(-1, 2); y += rnd(-1, 1.5); } }
  if (biome === 'ice'){ g.fillStyle = '#2e5a80'; for (let k = 0; k < 3; k++){ const x = Math.random() * 32 | 0, y = Math.random() * 32 | 0; g.fillRect(x, y, 4, 1); } }
  return c;
}
// какие постройки стоят в каком мире: [вид, вес]
const BUILD_SETS = {
  abyss: [['tree', 3], ['rock', 3], ['pillar', 3], ['obelisk', 2], ['wall', 2], ['house', 1]],
  lava:  [['tree', 3], ['rock', 4], ['pillar', 2], ['totem', 2], ['wall', 2], ['house', 1]],
  ice:   [['tree', 5], ['rock', 3], ['snowman', 1], ['pillar', 1], ['wall', 2], ['house', 1]],
  swamp: [['tree', 4], ['mushroom', 3], ['rock', 2], ['totem', 2], ['wall', 1], ['house', 1]]
};
// коллайдер у основания: c — круг (радиус), r — прямоугольник (ширина, глубина)
const BUILD = {
  tree:     { sprite: treeSprite,     col: { c: 15 },        hp: 140 },
  rock:     { sprite: rockSprite,     col: { c: 30 },        hp: 320 },
  pillar:   { sprite: pillarSprite,   col: { c: 18 },        hp: 220 },
  obelisk:  { sprite: obeliskSprite,  col: { c: 20 },        hp: 300 },
  wall:     { sprite: wallSprite,     col: { r: [108, 26] }, hp: 260 },
  house:    { sprite: houseSprite,    col: { r: [92, 44] },  hp: 450 },
  totem:    { sprite: totemSprite,    col: { c: 12 },        hp: 120 },
  mushroom: { sprite: mushroomSprite, col: { c: 14 },        hp: 120 },
  snowman:  { sprite: snowmanSprite,  col: { c: 18 },        hp: 60 },
  owltree:  { sprite: owlTreeSprite,  col: { c: 20 },        hp: Infinity }
};
const SPR = {};
function buildSprites(){
  SPR.mage = [0, 1, 2, 3].map(f => mageSprite(f, COSTUMES[WARD.selected]));
  SPR.slime = [0, 1].map(slimeSprite);
  SPR.runner = [0, 1].map(impSprite);
  SPR.brute = [0, 1].map(bruteSprite);
  SPR.shooter = [0, 1].map(eyeSprite);
  SPR.boss = [0, 1].map(bossSprite);
  SPR.lich = [0, 1].map(lichSprite); SPR.slimeking = [0, 1].map(slimeKingSprite);
  SPR.golem = [0, 1].map(golemSprite); SPR.reaper = [0, 1].map(reaperSprite);
  SPR.goblin = [0, 1].map(goblinSprite);
  SPR.altar = altarSprite(); SPR.gem = gemSprite(); SPR.turret = turretSprite(); SPR.ghost = ghostSprite();
  SPR.nest = nestSprite(); SPR.egg = eggSprite();
  SPR.pet = {
    healer: [0, 1].map(f => tinted(slimeSprite(f), '#4fe08a', 0.55)),
    guard: [0, 1].map(f => tinted(bruteSprite(f), '#4b8bff', 0.45)),
    dragon: [0, 1].map(dragonSprite), toad: [0, 1].map(toadSprite), owl: [0, 0, 0, 1].map(owlSprite), phoenix: [0, 1].map(phoenixSprite)
  };
  SPR.crystal = {}; SPR.biome = {};
}
function biomeSprites(biome){
  if (SPR.biome[biome]) return SPR.biome[biome];
  const P = PAL[biome], S = { build: {}, details: [0, 1, 2, 3, 4].map(k => detailSprite(P, biome, k)) };
  for (const k in BUILD) S.build[k] = BUILD[k].sprite(P, biome);
  S.tile = groundTile(P, biome);
  S.owlEmpty = owlTreeSprite(P, biome, true);
  return SPR.biome[biome] = S;
}
const crystalSpr = col => SPR.crystal[col] || (SPR.crystal[col] = crystalSprite(col));
function setCostume(id){ WARD.selected = id; saveWard(); SPR.mage = [0, 1, 2, 3].map(f => mageSprite(f, COSTUMES[id])); }
const previewCache = {};
const costumePreview = id => previewCache[id] || (previewCache[id] = mageSprite(0, COSTUMES[id]).toDataURL());
const tintCache = new Map();
function tinted(img, color, a){
  let m = tintCache.get(img); if (!m){ m = {}; tintCache.set(img, m); }
  const k = color + a; if (m[k]) return m[k];
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return m[k] = c;
}
buildSprites();
