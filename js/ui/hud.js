// ---------- интерфейс ----------
const portrait = $('portrait').getContext('2d');
function updHud(){
  const P = player;
  $('hpFill').style.width = `calc(${Math.max(0, P.hp / P.maxHp * 100)}% - 4px)`;
  $('hpTxt').textContent = Math.max(0, Math.ceil(P.hp)) + '/' + P.maxHp;
  $('xpFill').style.width = `calc(${Math.min(100, xp / xpNeed() * 100)}% - 4px)`;
  $('lvTxt').textContent = level;
  $('xpTxt').textContent = Math.floor(xp) + '/' + xpNeed();
  const sec = Math.floor(tick / 60);
  $('timer').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  // на телефоне руны в рюкзаке и так видны на кнопке мастерской
  $('stat').textContent = `🏆 ${score}   💀 ${kills}` + (TOUCH ? '' : `   🎒 ${inventory.length}`);
  const tags = [`${BIOMES[RUN.biome].icon} ${BIOMES[RUN.biome].name}`];
  if (RUN.pact) tags.push(`${PACTS[RUN.pact].icon} ${PACTS[RUN.pact].name}`);
  if (moonT > 0) tags.push(`🌕 луна ${Math.ceil(moonT / 60)} с`);
  if (ev && ev.type === 'meteors') tags.push(`☄️ дождь ${Math.ceil(ev.t / 60)} с`);
  if (weather.type !== 'clear') tags.push(`${weatherName(weather.type)} ${Math.ceil(weather.t / 60)} с`);
  if (goldT > 0) tags.push(`✨ золотой час ${Math.ceil(goldT / 60)} с`);
  $('tags').innerHTML = tags.join('<br>');
  const pi = pets.map(p => PETS[p.id].icon).join('') + (hasFeather ? '🪶' : '');
  if ($('petsUI').textContent !== pi) $('petsUI').textContent = pi;
  const un = unlocked();
  $('skillbar').innerHTML = slots.map((s, i) => {
    if (i >= un) return `<div class="sk locked"><div class="ic">🔒</div><div class="lv">УР${SLOT_UNLOCK[i]}</div></div>`;
    const c = compiled[i];
    if (!c) return `<div class="sk"><span class="n">${i + 1}</span><div class="ic" style="opacity:.5">➕</div><div class="lv">${KEY('craft')}</div></div>`;
    const mods = s.mods.filter(Boolean).map(r => RUNES[r].icon).join('');
    const left = Math.max(0, cds[i] / c.cd);
    return `<div class="sk" style="--sc:${c.color}"><span class="n">${i + 1}</span><div class="ic">${RUNES[s.form].icon}</div>` +
      (s.element ? `<div class="el">${RUNES[s.element].icon}</div>` : '') + (mods ? `<div class="md">${mods}</div>` : '') +
      `<div class="cd" style="background:conic-gradient(rgba(8,4,20,.72) ${left}turn,transparent 0)"></div></div>`;
  }).join('');
  updTouchUI();
}
function drawPortrait(){
  const img = SPR.mage[Math.floor(performance.now() / 160) % 4];
  portrait.imageSmoothingEnabled = false; portrait.clearRect(0, 0, 44, 52);
  portrait.drawImage(img, 0, 0, 44, 52);
}
