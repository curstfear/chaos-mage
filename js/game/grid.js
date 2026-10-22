// ---------- сетка для поиска врагов ----------
const GRID = 80, grid = new Map();
const gkey = (gx, gy) => (gx + 30000) * 60000 + (gy + 30000);
function buildGrid(){
  grid.clear();
  for (const e of enemies){
    if (e.dead) continue;
    const k = gkey(Math.floor(e.x / GRID), Math.floor(e.y / GRID));
    let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(e);
  }
}
function near(x, y, r, fn){
  const R = r + 70;
  const x0 = Math.floor((x - R) / GRID), x1 = Math.floor((x + R) / GRID), y0 = Math.floor((y - R) / GRID), y1 = Math.floor((y + R) / GRID);
  for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++){
    const a = grid.get(gkey(gx, gy)); if (!a) continue;
    for (const e of a){
      if (e.dead) continue;
      const dx = e.x - x, dy = e.y - y, rr = r + e.r;
      if (dx * dx + dy * dy < rr * rr) fn(e, dx, dy);
    }
  }
}
function nearest(x, y, r, exclude){
  let best = null, bd = Infinity;
  near(x, y, r, (e, dx, dy) => { if (exclude && exclude.has(e)) return; const d = dx * dx + dy * dy; if (d < bd){ bd = d; best = e; } });
  return best;
}
