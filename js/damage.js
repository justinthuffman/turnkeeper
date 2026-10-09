/* ---------- Damage by type: resistance, vulnerability and immunity (2014 rules) ----------
   A damage roll can be made of typed parts ("1d8+3 piercing", "2d4 fire"). Each type is added up,
   then the target's defenses change it: resistance halves it (rounded down), vulnerability doubles
   it, immunity makes it 0. Many monsters resist bludgeoning, piercing and slashing only from
   non-magical attacks: a magic weapon or ammunition gets past that.
   Shared by the tracker (rolling), the roll card (js/dice.js, every screen) and the DM Screen.
   Defenses travel as short tokens: "fire", or "slashing~" for "from non-magical attacks only". */
const DAMAGE_TYPE_LIST = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
// Each type's color on the roll card
const DAMAGE_COLORS = {acid:'#9be04a', bludgeoning:'#c9b79c', cold:'#8fd3ff', fire:'#ff6a2a', force:'#c48bff', lightning:'#7fb8ff', necrotic:'#9a6bd6',
  piercing:'#d8d0c0', poison:'#5fd35f', psychic:'#ff7ad9', radiant:'#ffe27a', slashing:'#e0a0a0', thunder:'#a0b8ff'};
// A stat block's lists ("fire", "bludgeoning, piercing, and slashing from nonmagical attacks") → tokens
function defenseTokens(list){
  const out = [];
  (Array.isArray(list) ? list : String(list || '').split(/[;\n]/)).forEach(entry=>{
    const s = String(typeof entry === 'string' ? entry : (entry && entry.name) || '').toLowerCase();
    const onlyMundane = /nonmagical|non-magical|not magical/.test(s);
    DAMAGE_TYPE_LIST.forEach(t=>{ if(new RegExp('\\b' + t + '\\b').test(s)) out.push(t + (onlyMundane ? '~' : '')); });
  });
  return [...new Set(out)];
}
// Does a token list cover this type, for an attack that is or isn't magical?
const defends = (tokens, type, magical)=>(tokens || []).some(k=>k === type || (k === type + '~' && !magical && ['bludgeoning', 'piercing', 'slashing'].includes(type)));
/* Roll typed parts against a target's defenses ({res, vul, imm} token lists, or null for none).
   parts: [{expr, type}]. Returns {total, parts:[{t, n, f, a}], math, dice:[...], nat:0}. a is
   'r' resisted, 'v' vulnerable, 'i' immune, '' unchanged. */
function rollTypedDamage(parts, def, magical){
  const groups = {}, order = [], dice = [];
  parts.forEach(p=>{
    const parsed = readDice(p.expr); if(!parsed) return;
    const r = rollTerms(parsed.terms), t = DAMAGE_TYPE_LIST.includes(p.type) ? p.type : '';
    dice.push(...r.dice);
    const kept = r.dice.filter(d=>!d.x).map(d=>d.c ?? d.v), flat = r.total - kept.reduce((n, v)=>n + v, 0);
    const shown = kept.length ? `${kept.join('+')}${flat ? (flat > 0 ? '+' : '−') + Math.abs(flat) : ''}` : String(r.total);
    if(!groups[t]){ groups[t] = {n:0, bits:[]}; order.push(t); }
    groups[t].n += r.total;
    // "1d8+3", "2d6+5" (Great Weapon Fighting's rerolls and Savage Attacker's best-of-two shown plainly)
    const plain = String(p.expr).replace(/\s+/g, '').replace(/ro<\d+|mi\d+/g, '').replace(/^\((.+?),.+?\)kh1/, '$1 best of two');
    groups[t].bits.push(`${plain} (${kept.length > 1 || flat ? `${shown}=${r.total}` : r.total})`);
  });
  const out = order.map(t=>{
    const n = Math.max(0, groups[t].n);
    const a = !def || !t ? '' : defends(def.imm, t, magical) ? 'i' : defends(def.vul, t, magical) ? 'v' : defends(def.res, t, magical) ? 'r' : '';
    const f = a === 'i' ? 0 : a === 'v' ? n * 2 : a === 'r' ? Math.floor(n / 2) : n;
    return {t, n, f, a, bits:groups[t].bits};
  });
  const total = out.reduce((s, p)=>s + p.f, 0);
  const word = {r:'½ resistant', v:'×2 vulnerable', i:'immune → 0'};
  const math = out.map(p=>`${p.bits.join(' + ')}${p.t ? ' ' + p.t : ''}${p.a ? ` ${word[p.a]}${p.a !== 'i' ? ` (${p.f})` : ''}` : ''}`).join(' + ') + ` = ${total}`;
  return {total, parts:out.map(({t, n, f, a})=>({t, n, f, a})), math:math.slice(0, 200), dice:dice.slice(0, 60), nat:0};
}
// The roll card's lines for a typed roll: each type in its color; a changed amount grows into the
// new one with Resistant, Vulnerable or Immune beside it
function damagePartsHtml(roll){
  const word = {r:'Resistant', v:'Vulnerable', i:'Immune'};
  return `<div class="dc-parts">${roll.parts.map(p=>{
    const c = DAMAGE_COLORS[p.t] || 'var(--ink)';
    return `<span class="dc-part${p.a ? ' changed' : ''}" style="--dc:${c}">${p.a ? `<span class="dp-was">${p.n}</span><span class="dp-now">${p.f}</span>` : `<span class="dp-now">${p.n}</span>`}`
      + ` ${p.t || 'damage'}${p.a ? ` <em>${word[p.a]}</em>` : ''}</span>`;
  }).join('')}</div>${roll.math ? `<div class="dc-math">${diceEsc(roll.math)}</div>` : ''}`;
}
// A roll from the database: only known shapes get through (js/dice.js cleanRoll)
function cleanParts(parts){
  return (Array.isArray(parts) ? parts : Object.values(parts || {})).slice(0, 8)
    .filter(p=>p && Number.isInteger(p.n) && Number.isInteger(p.f))
    .map(p=>({t:DAMAGE_TYPE_LIST.includes(p.t) ? p.t : '', n:p.n, f:p.f, a:['r', 'v', 'i'].includes(p.a) ? p.a : ''}));
}
