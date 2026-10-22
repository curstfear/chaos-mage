// ---------- компиляция навыков ----------
function compile(s, extra){
  if (!s.form) return null;
  const F = RUNES[s.form], m = {};
  for (const k of s.mods) if (k) m[k] = (m[k] || 0) + 1;
  if (extra) for (const k of extra) m[k] = (m[k] || 0) + 1;
  if (RUN.pact === 'echo') m.echo = (m.echo || 0) + 1;
  const n = k => m[k] || 0, el = s.element;
  const elMul = el === 'fire' ? 1.2 : el === 'blood' ? 1.6 : 1;
  return {
    form: s.form, el, color: el ? RUNES[el].color : PURE,
    dmg: F.dmg * Math.pow(1.5, n('giant')) * Math.pow(1.6, n('overload')) * elMul * PACT.dmg * 0.85,
    cd: Math.max(6, Math.round(F.cd * Math.pow(0.6, n('rapid')) * Math.pow(0.85, n('swift')) * Math.pow(1.3, n('overload')) * PACT.cd)),
    size: Math.pow(1.5, n('giant')),
    speed: Math.pow(1.5, n('swift')) * (el === 'wind' ? 1.3 : 1) * PACT.proj, range: Math.pow(1.3, n('swift')) * PACT.proj,
    multi: n('multi'), pierce: n('pierce') * 2, bounce: n('bounce') * 2, homing: n('homing'), split: n('split'), echo: n('echo'),
    trigger: n('trigger'), mirror: n('mirror'), spiral: n('spiral'), detonate: n('detonate'), execute: n('execute'),
    mark: n('mark'), berserk: n('berserk'), resonance: n('resonance'), wild: n('wild'), gravity: n('gravity'),
    vampiric: n('vampiric'), keen: n('keen'), snowball: n('snowball'), returner: n('returner'), reflect: n('reflect'), momentum: n('momentum'),
    sniper: n('sniper'), stun: n('stun')
  };
}
function recompile(){
  const un = unlocked();
  compiled = slots.map((s, i) => i < un ? compile(s) : null);
  compiled.forEach((c, i) => {
    if (c && c.resonance && c.el){
      const same = compiled.filter((o, j) => o && j !== i && o.el === c.el).length;
      c.dmg *= 1 + 0.25 * c.resonance * same;
    }
  });
}
function skillName(s){
  if (!s.form) return 'Пустой навык';
  const F = RUNES[s.form], gi = { m: 0, n: 1, f: 2 }[F.g];
  const adj = s.element ? RUNES[s.element].adj[gi] : ['Чистый', 'Чистое', 'Чистая'][gi];
  return `${adj} ${F.name.toLowerCase()}`;
}
const SAFE_WILD = MODS.filter(m => !['wild', 'trigger', 'echo', 'resonance'].includes(m));
