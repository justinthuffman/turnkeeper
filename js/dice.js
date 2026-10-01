/* ---------- Dice core: shared by turnkeeper.html and dm.html ----------
   Reads dice (readDice: "1d20+5 adv", "2d6ro<3+3", "(2d6,2d6)kh1", "1d20mi10+7"), describes them in plain
   words, rolls them with the browser's secure random numbers, and shows the roll: a card with
   the total and every die, and 3D dice (@3d-dice/dice-box-threejs, MIT) told where to land so
   every screen shows the same faces. Each page sets window.onDiceRoll(button) to roll a row. */
const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100];
const SHOWN_SIDES = [4, 6, 8, 10, 12, 20];   // the 3D library's dice (d100 is counted, not shown)
const diceEsc = s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Returns {terms, mode} or null if the dice can't be read
function readDice(text){
  let s = String(text || '').trim().replace(/^!(tk|r|roll)\s+/i, '');
  let mode = '';
  const word = s.match(/[\s,]+(?:with\s+)?(adv|dis|advantage|disadvantage)\s*$/i);
  if(word){ mode = word[1].slice(0, 3).toLowerCase(); s = s.slice(0, word.index); }
  s = s.replace(/\s+/g, '').replace(/−/g, '-');
  if(!s || s.length > 120) return null;
  const terms = [];
  let i = 0, count = 0;
  while(i < s.length){
    let sign = 1;
    if(s[i] === '+' || s[i] === '-'){ sign = s[i] === '-' ? -1 : 1; i++; }
    else if(terms.length) return null;
    const rest = s.slice(i);
    if(rest[0] === '('){   // Savage Attacker: (2d6,2d6)kh1 rolls both and keeps the higher
      const close = rest.indexOf(')'), k = close > 0 && /^k([hl])1/i.exec(rest.slice(close + 1));
      if(!k) return null;
      const opts = rest.slice(1, close).split(',').map(o=>readDice(o));
      if(opts.length < 2 || opts.some(o=>!o || o.mode)) return null;
      terms.push({sign, kind:'group', opts:opts.map(o=>o.terms), keep:k[1].toLowerCase()});
      i += close + 1 + k[0].length; continue;
    }
    const d = /^(\d*)d(\d+)((?:mi\d+|ro<\d+|k[hl]\d+)*)/i.exec(rest);
    if(d){
      const n = d[1] === '' ? 1 : +d[1], sides = +d[2], mods = d[3] || '';
      if(n < 1 || n > 100 || !DICE_SIDES.includes(sides) || (count += n) > 100) return null;
      const mi = /mi(\d+)/i.exec(mods), ro = /ro<(\d+)/i.exec(mods), k = /k([hl])(\d+)/i.exec(mods);
      terms.push({sign, kind:'dice', n, sides, min:mi ? +mi[1] : 0, ro:ro ? +ro[1] : 0, keep:k ? {hl:k[1].toLowerCase(), n:+k[2]} : null});
      i += d[0].length; continue;
    }
    const num = /^\d+/.exec(rest);
    if(!num || +num[0] > 9999) return null;
    terms.push({sign, kind:'num', v:+num[0]});
    i += num[0].length;
  }
  // Advantage / disadvantage: the first single d20 becomes two, keeping the higher or lower
  const d20 = mode && terms.find(t=>t.kind === 'dice' && t.n === 1 && t.sides === 20 && !t.keep);
  if(d20){ d20.n = 2; d20.keep = {hl:mode === 'adv' ? 'h' : 'l', n:1}; d20.mode = mode; }
  else mode = '';   // nothing for it to apply to (no single d20)
  return terms.length ? {terms, mode} : null;
}
// What a roll will do, in words: "1d20 + 5 + 1d4, with disadvantage" ({html, text})
function describeDice(text){
  const p = readDice(text);
  if(!p) return {html:diceEsc(text), text:String(text || '')};
  const one = t=>{
    if(t.kind === 'num') return String(t.v);
    if(t.kind === 'group') return `the ${t.keep === 'h' ? 'better' : 'worse'} of ${t.opts.map(o=>o.map((x, j)=>(j ? (x.sign < 0 ? ' − ' : ' + ') : '') + one(x)).join('')).join(' or ')}`;
    const extra = [];
    if(t.ro) extra.push(t.ro === 2 ? 'reroll 1s once' : t.ro === 3 ? 'reroll 1s and 2s once' : `reroll under ${t.ro} once`);
    if(t.min) extra.push(t.min === 2 ? '1s count as 2' : `${t.min - 1} or lower counts as ${t.min}`);
    if(t.keep && !t.mode) extra.push(`keep the ${t.keep.hl === 'h' ? 'highest' : 'lowest'} ${t.keep.n}`);
    const s = `${t.mode ? 1 : t.n}d${t.sides}`;
    return extra.length ? `${s} (${extra.join(', ')})` : s;
  };
  const out = p.terms.map((t, i)=>(i ? (t.sign < 0 ? ' − ' : ' + ') : (t.sign < 0 ? '−' : '')) + one(t)).join('');
  const mode = p.mode === 'adv' ? 'with advantage' : p.mode === 'dis' ? 'with disadvantage' : '';
  return {html:`<b>${diceEsc(out)}</b>${mode ? ', ' + mode : ''}`, text:out + (mode ? ', ' + mode : '')};
}
function dieRoll(sides){   // a fair secure roll from 1 to sides
  const a = new Uint32Array(1), limit = Math.floor(0x100000000 / sides) * sides;
  do crypto.getRandomValues(a); while(a[0] >= limit);
  return a[0] % sides + 1;
}
// Every die rolled is listed ({s: sides, v: face, c: counts as, x: dropped}); nat is the kept
// d20 of the roll's first d20 term when it's a 20 or a 1, else 0
function rollTerms(terms){
  let total = 0, nat = 0;
  const dice = [];
  terms.forEach(t=>{
    if(t.kind === 'num'){ total += t.sign * t.v; return; }
    if(t.kind === 'group'){
      const outs = t.opts.map(rollTerms);
      const best = outs.reduce((b, o, j)=>(t.keep === 'h' ? o.total > outs[b].total : o.total < outs[b].total) ? j : b, 0);
      outs.forEach((o, j)=>o.dice.forEach(d=>dice.push(j === best ? d : {...d, x:true})));
      total += t.sign * outs[best].total; return;
    }
    const mine = Array.from({length:t.n}, ()=>{
      let v = dieRoll(t.sides);
      if(t.ro && v < t.ro) v = dieRoll(t.sides);   // reroll once (Great Weapon Fighting), keep the new one
      const d = {s:t.sides, v};
      if(t.min && v < t.min) d.c = t.min;           // counts as at least this (Reliable Talent, Elemental Adept)
      return d;
    });
    if(t.keep){
      const order = mine.map((d, j)=>j).sort((a, b)=>{ const va = mine[a].c || mine[a].v, vb = mine[b].c || mine[b].v; return t.keep.hl === 'h' ? vb - va : va - vb; });
      order.slice(t.keep.n).forEach(j=>{ mine[j].x = true; });
    }
    mine.forEach(d=>{ if(!d.x) total += t.sign * (d.c || d.v); });
    if(!nat && t.sides === 20 && (t.n === 1 || (t.keep && t.keep.n === 1))){
      const kept = mine.find(d=>!d.x);
      nat = kept && (kept.v === 20 || kept.v === 1) ? kept.v : -1;   // only the first d20 counts
    }
    dice.push(...mine);
  });
  return {total, dice, nat:Math.max(nat, 0)};
}
function rollId(){ const a = new Uint32Array(2); crypto.getRandomValues(a); return a[0].toString(36) + a[1].toString(36); }

/* A roll row: what will roll (in words), Roll, and ✎ to change the dice first */
function rollRow(dice, label, desc, attrs, crit){
  dice = String(dice || '').trim();
  const what = String(label || desc || 'roll'), d = describeDice(dice);
  return `<div class="roll-cmd-row" data-dice="${diceEsc(dice)}"><span class="roll-what">${d.html}</span>`
    + `<button type="button" class="roll-btn" data-roll="${diceEsc(what)}"${attrs || ''} aria-label="Roll ${diceEsc(what.toLowerCase())}: ${diceEsc(d.text)}">Roll</button>`
    + `<button type="button" class="dice-edit" title="Change the dice before rolling" aria-label="Change the dice">✎</button>`
    + (desc || crit ? `<span class="roll-cmd-desc">${crit ? '<b class="crit-tag">CRIT</b> ' : ''}${diceEsc(desc || '')}</span>` : '') + `</div>`;
}
const rowDice = row=>{ const inp = row.querySelector('.roll-edit'); return inp ? inp.value.trim() : (row.dataset.dice || ''); };
document.addEventListener('click', e=>{
  const ed = e.target.closest && e.target.closest('.dice-edit'); if(!ed) return;
  const row = ed.closest('.roll-cmd-row'), what = row && row.querySelector('.roll-what');
  if(!what || what.querySelector('.roll-edit')) return;
  what.innerHTML = `<input class="roll-edit" type="text" spellcheck="false" autocomplete="off" aria-label="Dice to roll" value="${diceEsc(row.dataset.dice)}">`;
  const inp = what.querySelector('input'); inp.focus(); inp.select();
});
document.addEventListener('keydown', e=>{
  if(e.key !== 'Enter' || !e.target.matches || !e.target.matches('.roll-edit')) return;
  e.preventDefault();
  const b = e.target.closest('.roll-cmd-row').querySelector('button[data-roll]'); if(b) b.click();
});
// Capture phase, so the roll happens before a page's own click handling of the same button
document.addEventListener('click', e=>{ const b = e.target.closest && e.target.closest('button[data-roll]'); if(b && window.onDiceRoll) window.onDiceRoll(b); }, true);
// Shown under a row when the roll can't happen
function rowWarn(row, msg){
  const old = row.querySelector('.roll-wait'); if(old) old.remove();
  if(!msg) return;
  const w = document.createElement('div'); w.className = 'roll-wait'; w.textContent = msg; row.appendChild(w);
}

/* Dice looks: a ready-made set, or your own colors, texture and material; plus the dice size
   and the tray they land in. Everyone sees a roll in the roller's look. */
const DICE_PRESETS = [['bronze','Thylean Bronze'],['bloodmoon','Blood Moon'],['starynight','Starry Night'],['astralsea','Astral Sea'],['dragons','Here be Dragons'],
  ['glitterparty','Glitter Party'],['inspired','Inspired'],['pinkdreams','Pink Dreams'],['breebaby','Pastel Sunset'],['rainbow','Rainbow'],['black','Black'],['white','White'],
  ['fire','Fire'],['ice','Ice'],['lightning','Lightning'],['thunder','Thunder'],['acid','Acid'],['poison','Poison'],['radiant','Radiant'],['necrotic','Necrotic'],
  ['psychic','Psychic'],['force','Force'],['water','Water'],['earth','Earth'],['air','Air']];
const DICE_TEXTURES = ['none','marble','wood','stone','metal','cloudy','fire','water','ice','paper','speckles','glitter','stars','stainedglass','skulls','dragon','lizard','leopard','tiger','cheetah','astral','bronze01','bronze03'];
const DICE_MATERIALS = ['glass','plastic','metal','wood','none'];
const DICE_SIZES = [['small', 'Small', 62], ['medium', 'Medium', 80], ['large', 'Large', 100]];   // the library's baseScale
const TRAY_SHAPES = [['hex', 'Hexagon'], ['square', 'Square'], ['rect', 'Rectangle'], ['oct', 'Octagon'], ['round', 'Round']];
// Floors and rims are drawn in code (SVG noise over gradients): nothing to download. A floor
// also sets the sound the dice make landing on it.
const trayNoise = (freq, oct, op)=>`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${oct}' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='${op}'/></svg>`)}")`;
const TRAY_FLOORS = {
  greenfelt:{name:'Green felt', sound:'felt', bg:`${trayNoise(0.9, 2, 0.28)}, radial-gradient(ellipse at 50% 40%, #2f7a45, #164a29 75%)`},
  bluefelt:{name:'Blue felt', sound:'felt', bg:`${trayNoise(0.9, 2, 0.28)}, radial-gradient(ellipse at 50% 40%, #2c5a8c, #142b4c 75%)`},
  velvet:{name:'Red velvet', sound:'felt', bg:`${trayNoise(1.4, 2, 0.22)}, radial-gradient(ellipse at 35% 30%, #a3202e, #5c0b16 55%, #3a0610 90%)`},
  leather:{name:'Dark leather', sound:'felt', bg:`${trayNoise(0.35, 3, 0.35)}, ${trayNoise(1.2, 1, 0.18)}, radial-gradient(ellipse at 50% 40%, #5a3a24, #2e1c10 80%)`},
  tavern:{name:'Tavern table', sound:'wood_table', bg:`${trayNoise('0.015 0.35', 3, 0.45)}, repeating-linear-gradient(90deg, transparent 0 calc(25% - 2px), rgba(0,0,0,0.55) calc(25% - 2px) 25%), linear-gradient(90deg, #7a4b26, #8e5a2e 30%, #6f4220 60%, #855330)`},
  stone:{name:'Stone', sound:'metal', bg:`${trayNoise(0.05, 4, 0.5)}, ${trayNoise(0.6, 2, 0.2)}, radial-gradient(ellipse at 50% 40%, #8a8a86, #4e4f4e 80%)`},
};
const TRAY_RIMS = {
  darkwood:{name:'Dark wood', bg:`${trayNoise('0.02 0.5', 3, 0.5)}, linear-gradient(135deg, #4a2a14, #2a170a 50%, #3d220f)`},
  lightwood:{name:'Light wood', bg:`${trayNoise('0.02 0.5', 3, 0.4)}, linear-gradient(135deg, #b8864f, #8c5f33 50%, #a77845)`},
  iron:{name:'Iron', bg:`${trayNoise(0.8, 2, 0.25)}, linear-gradient(135deg, #6f747a, #2f3236 45%, #575c61 60%, #26282b)`},
  gold:{name:'Gold trim', bg:'linear-gradient(135deg, #f7e08a, #b8862b 35%, #fff2b5 50%, #9a6d1d 70%, #e6c25a)'},
};
const DEFAULT_DICE = {preset:'bronze', bg:'#8a1c12', fg:'#ffffff', tex:'none', mat:'glass', size:'medium', shape:'hex', floor:'greenfelt', rim:'darkwood', pic:'', fit:'fit'};
// Only known values get through (styles come from other players over the network)
function safeDiceStyle(s){
  s = s && typeof s === 'object' ? s : {};
  const hex = v=>typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v), D = DEFAULT_DICE;
  return {preset:DICE_PRESETS.some(p=>p[0] === s.preset) ? s.preset : (s.preset === '' ? '' : D.preset),
    bg:hex(s.bg) ? s.bg : D.bg, fg:hex(s.fg) ? s.fg : D.fg,
    tex:DICE_TEXTURES.includes(s.tex) ? s.tex : 'none', mat:DICE_MATERIALS.includes(s.mat) ? s.mat : 'glass',
    size:DICE_SIZES.some(x=>x[0] === s.size) ? s.size : D.size, shape:TRAY_SHAPES.some(x=>x[0] === s.shape) ? s.shape : D.shape,
    floor:TRAY_FLOORS[s.floor] ? s.floor : D.floor, rim:TRAY_RIMS[s.rim] ? s.rim : D.rim,
    pic:safeUrl(s.pic), fit:s.fit === 'fill' ? 'fill' : 'fit'};
}
// Throw strength (the library's strength): how hard the dice leave your hand
const THROW_MIN = 0.4, THROW_MAX = 2.2, THROW_DEFAULT = 1;
const safeThrow = v=>typeof v === 'number' && Number.isFinite(v) ? Math.min(THROW_MAX, Math.max(THROW_MIN, Math.round(v * 10) / 10)) : THROW_DEFAULT;
const throwSlider = (id, value)=>`<label class="throw-pick" title="How hard you throw the dice (the numbers aren’t affected)">Throw <small>gentle</small><input type="range" id="${id}" min="${THROW_MIN}" max="${THROW_MAX}" step="0.1" value="${safeThrow(value)}" aria-label="Throw strength, gentle to hard"><small>hard</small></label>`;
// Dice sounds on this device: on/off and volume (the DM can also mute them for the campaign)
const DICE_SOUND_KEY = 'dndTracker:diceSound';
function diceSoundPrefs(){ try{ const v = JSON.parse(localStorage.getItem(DICE_SOUND_KEY) || 'null'); return {on:!v || v.on !== false, vol:v && Number.isFinite(v.vol) ? Math.min(100, Math.max(0, v.vol)) : 70}; }catch(e){ return {on:true, vol:70}; } }
function setDiceSoundPrefs(p){ try{ localStorage.setItem(DICE_SOUND_KEY, JSON.stringify(p)); }catch(e){} }
const diceOpts = (list, cur)=>list.map(([k, n])=>`<option value="${k}"${cur === k ? ' selected' : ''}>${n}</option>`).join('');
function diceStyleMenuHtml(st, note){
  const snd = diceSoundPrefs();
  return `<div class="ds-head">Dice</div>`
    + `<label for="dsPreset">Set</label><select id="dsPreset"><option value="">My own (below)</option>${diceOpts(DICE_PRESETS, st.preset)}</select>`
    + `<label for="dsBg">Dice color</label><div class="ds-row-full" style="grid-column:auto"><input type="color" id="dsBg" value="${st.bg}"><label for="dsFg">Numbers</label><input type="color" id="dsFg" value="${st.fg}"></div>`
    + `<label for="dsTex">Texture</label><select id="dsTex">${DICE_TEXTURES.map(t=>`<option${st.tex === t ? ' selected' : ''}>${t}</option>`).join('')}</select>`
    + `<label for="dsMat">Material</label><select id="dsMat">${DICE_MATERIALS.map(m=>`<option${st.mat === m ? ' selected' : ''}>${m}</option>`).join('')}</select>`
    + `<label for="dsSize">Size</label><select id="dsSize">${diceOpts(DICE_SIZES, st.size)}</select>`
    + `<div class="ds-note">Colors and texture are used when Set is “My own”. ${note}</div>`
    + `<div class="ds-head">Tray</div>`
    + `<label for="dsShape">Shape</label><select id="dsShape">${diceOpts(TRAY_SHAPES, st.shape)}</select>`
    + `<label for="dsFloor">Floor</label><select id="dsFloor">${diceOpts(Object.entries(TRAY_FLOORS).map(([k, f])=>[k, f.name]), st.floor)}</select>`
    + `<label for="dsRim">Rim</label><select id="dsRim">${diceOpts(Object.entries(TRAY_RIMS).map(([k, r])=>[k, r.name]), st.rim)}</select>`
    + `<label for="dsPic">Picture</label><input type="url" id="dsPic" value="${diceEsc(st.pic)}" placeholder="https://… (optional)">`
    + `<label for="dsFit">Picture fit</label><select id="dsFit">${diceOpts([['fit', 'Fit (whole picture)'], ['fill', 'Fill the floor']], st.fit)}</select>`
    + `<div class="ds-note">A picture sits on the floor, centered; the floor still sets the sound.</div>`
    + `<div class="ds-head">On this device</div>`
    + `<label class="ds-row-full"><input type="checkbox" id="dsSound"${snd.on ? ' checked' : ''}> Dice sounds</label>`
    + `<label for="dsVol">Sound volume</label><input type="range" id="dsVol" min="0" max="100" value="${snd.vol}">`
    + `<label class="ds-row-full"><input type="checkbox" id="dsFx"${critFxOn() ? ' checked' : ''}> Show crit GIFs</label>`
    + `<div class="ds-row-full"><button type="button" class="flow-btn" id="dsTry">Try them</button><span class="ds-note" style="grid-column:auto">A practice roll only you see.</span></div>`;
}
document.addEventListener('change', e=>{ if(e.target.id === 'dsFx') setCritFxOn(e.target.checked); });
document.addEventListener('input', e=>{
  if(e.target.id === 'dsSound' || e.target.id === 'dsVol') setDiceSoundPrefs({on:document.getElementById('dsSound').checked, vol:+document.getElementById('dsVol').value});
});
const readDiceStyleMenu = ()=>{ const v = id=>document.getElementById(id).value;
  return safeDiceStyle({preset:v('dsPreset'), bg:v('dsBg'), fg:v('dsFg'), tex:v('dsTex'), mat:v('dsMat'), size:v('dsSize'), shape:v('dsShape'), floor:v('dsFloor'), rim:v('dsRim'), pic:v('dsPic').trim(), fit:v('dsFit')}); };
function tryDice(name, style, strength){
  const r = rollTerms(readDice('1d20+1d12+1d10+1d8+1d6+1d4').terms);
  showRoll({name, label:'Trying your dice', notation:'one of each', total:r.total, dice:r.dice, nat:0, style, throw:strength}, {note:'Practice roll: only you see this.'});
}

/* 3D dice in a tray, loaded the first time a roll is shown. One dice box for the page: before
   each roll it takes on the roller's tray (shape, floor, rim, picture), dice look and size. */
const DICE_LIB = 'https://cdn.jsdelivr.net/npm/@3d-dice/dice-box-threejs@0.0.12/';
let diceBoxP = null, diceLook = '', diceHideTimer = null, dicePlaySeq = 0, trayWalls = [];

function diceBox(){
  if(!diceBoxP) diceBoxP = (async()=>{
    const {default:DiceBox} = await import(DICE_LIB + '+esm');
    const layer = document.getElementById('diceLayer');
    layer.innerHTML = `<div class="tray" id="diceTray"><div class="tray-rim"></div><div class="tray-floor"></div><div class="tray-pic"></div><div class="tray-shade"></div><div class="tray-dice" id="trayDice"></div></div>`;
    layer.hidden = false;   // stays in the page from now on (the library sizes itself from the tray)
    sizeTray(DEFAULT_DICE.shape);
    const box = new DiceBox('#trayDice', {assetPath:DICE_LIB + 'public/', theme_surface:'green-felt', theme_colorset:'white', theme_material:'glass', sounds:false, baseScale:80});
    await box.initialize();
    // The throw. The library starts the dice at the box's edge (outside a hexagon's or
    // octagon's angled walls, so they hit a wall in mid-air) with a random speed that swamps its
    // own strength setting. Start them inside the tray instead, and set their speed and spin
    // from the Throw slider (box.throwPower), with a little variety.
    const startThrow = box.startClickThrow.bind(box);
    box.startClickThrow = notation=>{
      const v = startThrow(notation), p = box.throwPower || THROW_DEFAULT;
      const base = Math.max(box.display.containerWidth, box.display.containerHeight) * 1.6;   // a medium throw crosses the tray
      if(v && v.vectors) v.vectors.forEach(x=>{
        x.pos.x *= 0.5; x.pos.y *= 0.5;
        const m = Math.hypot(x.velocity.x, x.velocity.y) || 1, speed = base * p * (0.85 + Math.random() * 0.3);
        x.velocity.x = x.velocity.x / m * speed; x.velocity.y = x.velocity.y / m * speed;
        const a = Math.hypot(x.angle.x, x.angle.y, x.angle.z) || 1, spin = 10 * p * (0.8 + Math.random() * 0.4);
        x.angle.x = x.angle.x / a * spin; x.angle.y = x.angle.y / a * spin; x.angle.z = x.angle.z / a * spin;
      });
      return v;
    };
    return box;
  })().catch(err=>{ console.warn('3D dice unavailable:', err); diceBoxP = null; return null; });
  return diceBoxP;
}
// Tray size for a shape: width / height (a hexagon is 2 : √3), fitting the screen
const TRAY_RATIO = {hex:2 / Math.sqrt(3), square:1, rect:1.5, oct:1, round:1};
function sizeTray(shape){
  const tray = document.getElementById('diceTray');
  const maxW = Math.min(520, innerWidth - 56), maxH = Math.max(200, innerHeight * 0.5);
  let w = maxW, h = w / TRAY_RATIO[shape];
  if(h > maxH){ h = maxH; w = h * TRAY_RATIO[shape]; }
  w = Math.round(w); h = Math.round(h);
  tray.style.width = w + 'px'; tray.style.height = h + 'px'; tray.dataset.shape = shape;
  return {w, h};
}
// Walls along a hexagon's or octagon's angled edges (round is 16 sides). The library only has
// four, a rectangle at 93% of the half-width and half-height; these are flat planes at the same
// distance, facing inward.
function trayShapeWalls(box, shape){
  trayWalls.forEach(b=>box.world.removeBody(b)); trayWalls = [];
  const sample = box.box_body.topWall; if(!sample) return;
  const Body = sample.constructor, Plane = sample.shapes[0].constructor, V = sample.position.constructor;
  const a = (shape === 'hex' ? box.display.containerHeight : box.display.containerWidth) * 0.93;   // apothem
  const angles = shape === 'hex' ? [30, 150, 210, 330] : shape === 'oct' ? [45, 135, 225, 315]
    : shape === 'round' ? Array.from({length:16}, (_, i)=>i * 22.5).filter(d=>d % 90) : [];
  angles.forEach(deg=>{
    const r = deg * Math.PI / 180, out = new V(Math.cos(r), Math.sin(r), 0);
    const wall = new Body({mass:0, shape:new Plane(), material:sample.material});
    wall.quaternion.setFromVectors(new V(0, 0, 1), new V(-out.x, -out.y, 0));
    wall.position.set(out.x * a, out.y * a, 0);
    box.world.addBody(wall); trayWalls.push(wall);
  });
}
// The roller's tray: shape and size (walls follow), floor, rim, picture, dice size, and sound
async function setTray(box, st, strength){
  const tray = document.getElementById('diceTray');
  const {w, h} = sizeTray(st.shape);
  tray.style.setProperty('--floorBg', TRAY_FLOORS[st.floor].bg);
  tray.style.setProperty('--rimBg', TRAY_RIMS[st.rim].bg);
  const pic = tray.querySelector('.tray-pic');
  pic.style.backgroundImage = st.pic ? `url("${st.pic.replace(/["\\]/g, '')}")` : 'none';
  pic.dataset.fit = st.fit;
  const scale = (DICE_SIZES.find(x=>x[0] === st.size) || DICE_SIZES[1])[2];
  if(box.DiceFactory.baseScale !== scale){   // the dice shapes are rebuilt at the new size
    freeDice(box); box.clearDice();
    Object.values(box.DiceFactory.geometries).forEach(g=>g && g.dispose && g.dispose());
    box.DiceFactory.geometries = {}; box.DiceFactory.baseScale = scale; box.baseScale = scale;
  }
  box.setDimensions(new box.dimensions.constructor(w, h));
  trayShapeWalls(box, st.shape);
  box.throwPower = safeThrow(strength);   // used by the throw (see diceBox)
  const snd = diceSoundPrefs();
  box.sounds = snd.on && critSettings.diceSound && snd.vol > 0; box.volume = snd.vol;   // the DM can mute dice for the campaign
  box.surface = TRAY_FLOORS[st.floor].sound;
  if(box.sounds) await box.loadSounds().catch(()=>{});   // fetched once per floor sound
}
// The library never frees what it draws: each look's face pictures stay cached and each roll
// leaves its dice behind. Free them here, or memory climbs with every roll and look.
function freeDice(box){
  box.diceList.forEach(die=>{
    [].concat(die.material).forEach(m=>m && m.dispose());
    if(die.geometry !== box.DiceFactory.geometries[die.notation.type]) die.geometry.dispose();   // a forced face copies the shape
  });
}
function freeLooks(box){
  const f = box.DiceFactory;
  Object.values(f.materials_cache).forEach(c=>{ if(c.composite) c.composite.dispose(); if(c.bump) c.bump.dispose(); });
  f.materials_cache = {};
  const sets = box.DiceColors.colorsets;
  Object.keys(sets).forEach(k=>{ if(k.startsWith('custom ') && k !== (box.colorData && box.colorData.name)) delete sets[k]; });
}
// Custom looks are named by their settings: the library keeps the first set under each name
async function setDiceLook(box, style){
  const st = safeDiceStyle(style), key = JSON.stringify([st.preset, st.bg, st.fg, st.tex, st.mat]);
  if(key === diceLook) return false;
  diceLook = key;
  if(st.preset) await box.updateConfig({theme_customColorset:null, theme_colorset:st.preset, theme_material:st.mat});
  else await box.updateConfig({theme_customColorset:{name:`custom ${st.bg} ${st.fg} ${st.tex} ${st.mat}`, background:st.bg, foreground:st.fg, texture:st.tex, material:st.mat}, theme_material:st.mat});
  freeLooks(box);
  return true;
}
async function play3d(roll){
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const shown = roll.dice.filter(d=>SHOWN_SIDES.includes(d.s)).slice(0, 24);
  if(!shown.length) return;
  const seq = ++dicePlaySeq, box = await diceBox();
  if(!box || seq !== dicePlaySeq) return;
  const st = safeDiceStyle(roll.style);
  await setDiceLook(box, st);
  if(seq !== dicePlaySeq) return;
  freeDice(box);
  await setTray(box, st, roll.throw);
  if(seq !== dicePlaySeq) return;
  const layer = document.getElementById('diceLayer');
  layer.style.transition = 'none'; layer.style.opacity = '1'; layer.dataset.on = '1';
  return box.roll(shown.map(d=>'1d' + d.s).join('+') + '@' + shown.map(d=>d.v).join(',')).catch(err=>console.warn('3D dice:', err));   // settles when the dice land
}
function clearDice(){
  const layer = document.getElementById('diceLayer');
  layer.style.transition = 'opacity 0.6s'; layer.style.opacity = '0'; delete layer.dataset.on;
  const seq = dicePlaySeq;
  setTimeout(async()=>{
    if(seq !== dicePlaySeq || !diceBoxP) return;
    const box = await diceBoxP;
    if(box && seq === dicePlaySeq){ freeDice(box); box.clearDice(); }
  }, 700);
}
// Re-skin the dice and tray on screen (changing your dice style while they're showing)
async function restyleDice(style, strength){
  if(!diceBoxP) return;
  const box = await diceBoxP; if(!box) return;
  const st = safeDiceStyle(style);
  if(document.getElementById('diceLayer').style.opacity === '1'){
    const tray = document.getElementById('diceTray'), {w, h} = sizeTray(st.shape);
    tray.style.setProperty('--floorBg', TRAY_FLOORS[st.floor].bg); tray.style.setProperty('--rimBg', TRAY_RIMS[st.rim].bg);
    const pic = tray.querySelector('.tray-pic'); pic.style.backgroundImage = st.pic ? `url("${st.pic.replace(/["\\]/g, '')}")` : 'none'; pic.dataset.fit = st.fit;
    box.setDimensions(new box.dimensions.constructor(w, h)); trayShapeWalls(box, st.shape);
  }
  if(!(await setDiceLook(box, st))) return;
  const f = box.DiceFactory;
  box.diceList.forEach(die=>{
    [].concat(die.material).forEach(m=>m && m.dispose());
    f.setMaterialInfo();
    die.material = f.createMaterials(f.get(die.notation.type), box.baseScale / 2, 1);
  });
  box.renderer.render(box.scene, box.camera);
}

/* The result card: who rolled what, the total, every die (dropped ones struck through) */
function showRoll(roll, opts){
  const card = document.getElementById('diceCard');
  const chips = roll.dice.slice(0, 60).map(d=>`<span class="dc-die${d.x ? ' x' : ''}${!d.x && d.s === 20 && (d.v === 20 || d.v === 1) ? ' n' + d.v : ''}" title="d${d.s}${d.x ? ', dropped' : ''}${d.c ? `, counts as ${d.c}` : ''}">${d.v}${d.c ? '→' + d.c : ''}<small> d${d.s}</small></span>`).join('');
  card.innerHTML = `<button type="button" class="dc-close" aria-label="Close">&times;</button>`
    + `<div class="dc-head"><span class="dc-who">${diceEsc(roll.name || 'Someone')}</span><span class="dc-what">${diceEsc(roll.label || 'Roll')}</span></div>`
    + `<div class="dc-total">${roll.total}<small>${diceEsc(roll.notation || '')}</small></div>`
    + (chips ? `<div class="dc-dice">${chips}</div>` : '')
    + (roll.nat ? `<div class="dc-nat n${roll.nat}">${natWords(roll)}!</div>` : '')
    + (opts && opts.note ? `<div class="dc-what">${diceEsc(opts.note)}</div>` : '');
  card.hidden = false; rollShownAt = Date.now();
  const landed = play3d(roll);
  // A crit's GIF shows once the dice have landed (or after a few seconds if they can't be shown)
  if(roll.fx) Promise.race([landed, new Promise(ok=>setTimeout(ok, 5000))]).then(()=>showCritFx(roll.fx));
  clearTimeout(diceHideTimer);
  diceHideTimer = setTimeout(hideRoll, 12000);
}
// Attack rolls crit (2014 rules); other d20 rolls just come up a natural 20 or 1
const natWords = roll=>roll.kind === 'hit' ? (roll.nat === 20 ? 'Critical Hit' : 'Critical Miss') : `Natural ${roll.nat}`;
function hideRoll(){ clearTimeout(diceHideTimer); document.getElementById('diceCard').hidden = true; dicePlaySeq++; clearDice(); }   // dicePlaySeq++: a roll still setting up doesn't show
// Clicking anywhere outside the tray and the card puts the roll away (not the click that made
// the roll, and not one on a crit GIF, which closes itself)
let rollShownAt = 0;
document.addEventListener('click', e=>{
  if(document.getElementById('diceCard').hidden || Date.now() - rollShownAt < 400) return;
  if(e.target.closest && e.target.closest('#diceCard, #diceTray, #critFx')) return;
  hideRoll();
});
document.getElementById('diceCard').addEventListener('click', e=>{ if(e.target.closest('.dc-close')) hideRoll(); });
// A roll from the database (untrusted): only known shapes and values get through
function cleanRoll(r){
  const dice = (Array.isArray(r.dice) ? r.dice : Object.values(r.dice || {})).slice(0, 60)
    .filter(d=>d && DICE_SIDES.includes(d.s) && Number.isInteger(d.v) && d.v >= 1 && d.v <= d.s)
    .map(d=>({s:d.s, v:d.v, ...(Number.isInteger(d.c) ? {c:d.c} : {}), ...(d.x === true ? {x:true} : {})}));
  return {id:String(r.id || ''), name:String(r.name || ''), label:String(r.label || ''), notation:String(r.notation || ''),
    total:typeof r.total === 'number' && Number.isFinite(r.total) ? r.total : 0, dice, nat:r.nat === 20 || r.nat === 1 ? r.nat : 0, style:safeDiceStyle(r.style),
    kind:CRIT_ROWS.some(x=>x[0] === r.kind) ? r.kind : '', fx:cleanFx(r.fx), throw:safeThrow(r.throw)};
}
// Make a roll from a row's dice: {roll} or {error}
function makeRoll(text, name, label, style, kind, strength){
  const parsed = readDice(text);
  if(!parsed) return {error:'Turnkeeper can’t read those dice. Try something like 1d20+5, 2d6+3 or 1d20+4 adv.'};
  const r = rollTerms(parsed.terms);
  return {roll:{id:rollId(), name:String(name || '').slice(0, 60), label:String(label || 'Roll').slice(0, 80),
    notation:describeDice(text).text.slice(0, 120), total:r.total, dice:r.dice.slice(0, 60), nat:r.nat, style:safeDiceStyle(style), kind:kind || '', throw:safeThrow(strength)}};
}

/* ---------- Crit GIFs (Campaign settings on the DM Screen) ----------
   campaigns/<campaign>/settings: {sound, gifs:{<row>:{useHit, success:{links, flavor}, fail:{…}}}}.
   The roller picks one GIF or clip and one flavor line (pickCritFx) and sends them with the
   roll, so every screen shows the same one, after the dice land. Rows fall back to To Hit
   (ticked "use the To Hit pool", or nothing in their own pool), never to another row. */
const CRIT_ROWS = [['hit', 'To Hit', 'Critical Hit', 'Critical Miss'], ['death', 'Death saves', 'Natural 20', 'Natural 1'],
  ['init', 'Initiative', 'Natural 20', 'Natural 1'], ['save', 'Saving throws', 'Natural 20', 'Natural 1'],
  ['check', 'Ability checks', 'Natural 20', 'Natural 1'], ['skill', 'Skills', 'Natural 20', 'Natural 1']];
// A link from the database: https only, and a sane length (set as a src, never as HTML)
function safeUrl(u){
  if(typeof u !== 'string' || u.length > 400) return '';
  try{ const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; }catch(e){ return ''; }
}
const isClip = u=>/\.(mp4|webm)(\?|#|$)/i.test(u);
function cleanCritSettings(raw){
  raw = raw && typeof raw === 'object' ? raw : {};
  const gifs = {}, src = raw.gifs && typeof raw.gifs === 'object' ? raw.gifs : {};
  const list = (o, f)=>Object.entries(o && typeof o === 'object' ? o : {}).map(([id, v])=>({id:String(id), v:f(v)})).filter(x=>x.v);
  CRIT_ROWS.forEach(([k])=>{
    const r = src[k] && typeof src[k] === 'object' ? src[k] : {};
    const side = s=>({links:list(s && s.links, safeUrl), flavor:list(s && s.flavor, v=>typeof v === 'string' ? v.slice(0, 80) : '')});
    gifs[k] = {useHit:k !== 'hit' && r.useHit === true, success:side(r.success), fail:side(r.fail)};
  });
  return {sound:raw.sound === true, diceSound:raw.diceSound !== false, gifs};
}
let critSettings = cleanCritSettings(null);
// What a crit shows: {gif, text, side} or null. who replaces {who} in flavor text.
function pickCritFx(kind, nat, who){
  if(!(nat === 20 || nat === 1) || !CRIT_ROWS.some(x=>x[0] === kind)) return null;
  const side = nat === 20 ? 'success' : 'fail', hit = critSettings.gifs.hit[side], row = critSettings.gifs[kind];
  const from = key=>(!row.useHit && row[side][key].length ? row[side][key] : hit[key]);
  const any = a=>a.length ? a[dieRoll(a.length) - 1].v : '';
  const gif = any(from('links')), text = any(from('flavor')).replace(/\{who\}/gi, who || 'Someone');
  return gif || text ? {gif, text:text.slice(0, 80), side} : null;
}
function cleanFx(fx){
  if(!fx || typeof fx !== 'object') return null;
  const gif = safeUrl(fx.gif), text = typeof fx.text === 'string' ? fx.text.slice(0, 80) : '';
  return gif || text ? {gif, text, side:fx.side === 'fail' ? 'fail' : 'success'} : null;
}
// Each viewer can turn crit GIFs off on their own device
const CRIT_FX_KEY = 'dndTracker:critFx';
const critFxOn = ()=>{ try{ return localStorage.getItem(CRIT_FX_KEY) !== 'off'; }catch(e){ return true; } };
function setCritFxOn(on){ try{ localStorage.setItem(CRIT_FX_KEY, on ? 'on' : 'off'); }catch(e){} }
// The flavor text as an animated banner right above the centered GIF; shown until the viewer
// clicks outside it or the ✕. Reduced motion: the same banner, still, and no GIF.
function critBanner(text){
  const banner = document.createElement('div'); banner.className = 'cf-banner';
  const panel = document.createElement('div'); panel.className = 'cf-panel';
  const h = document.createElement('p'); h.className = 'cf-text';
  // Each letter pops in after the one before; words never split across lines
  let i = 0;
  text.split(/(\s+)/).forEach(part=>{
    if(!part) return;
    if(/^\s+$/.test(part)){ h.appendChild(document.createTextNode(' ')); return; }
    const w = document.createElement('span'); w.className = 'w';
    [...part].forEach(ch=>{
      const l = document.createElement('span'); l.className = 'l'; l.textContent = ch;
      l.style.animationDelay = `${0.25 + i * 0.03}s, ${i * 0.04}s, ${i * 0.06}s`; i++;
      w.appendChild(l);
    });
    h.appendChild(w);
  });
  panel.appendChild(h); banner.appendChild(panel);
  // Sparkles (or embers) around the banner's edges
  for(let k = 0; k < 16; k++){
    const s = document.createElement('i'); s.className = 'cf-spark';
    const r = ()=>Math.random(), top = r() < 0.5;
    s.style.setProperty('--x', `${top ? r() * 100 : (r() < 0.5 ? -2 : 98)}%`);
    s.style.setProperty('--y', `${top ? (r() < 0.5 ? -10 : 90) : r() * 100}%`);
    s.style.setProperty('--s', `${8 + r() * 14}px`);
    s.style.setProperty('--d', `${1.4 + r() * 1.6}s`);
    s.style.setProperty('--delay', `${r() * 2}s`);
    s.style.setProperty('--dx', `${(r() - 0.5) * 60}px`);
    s.style.setProperty('--dy', `${(r() - 0.5) * 50}px`);
    banner.appendChild(s);
  }
  return banner;
}
function showCritFx(fx){
  if(!fx || !critFxOn()) return;
  hideCritFx();
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'crit-fx' + (fx.side === 'fail' ? ' fail' : ''); wrap.id = 'critFx';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', fx.text || (fx.side === 'fail' ? 'Natural 1' : 'Natural 20'));
  const stage = document.createElement('div'); stage.className = 'cf-stage';
  if(fx.text) stage.appendChild(critBanner(fx.text));
  const box = document.createElement('div'); box.className = 'cf-box';
  if(fx.gif && !still){
    let media;
    if(isClip(fx.gif)){
      media = document.createElement('video');
      media.loop = true; media.playsInline = true; media.muted = !critSettings.sound;
      media.src = fx.gif;
      // Browsers only play sound after the viewer has clicked on the page: fall back to muted
      media.play().catch(()=>{ media.muted = true; media.play().catch(()=>{}); });
    } else { media = document.createElement('img'); media.alt = ''; media.src = fx.gif; }
    box.appendChild(media);
  }
  const x = document.createElement('button'); x.type = 'button'; x.className = 'cf-close'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
  box.appendChild(x); stage.appendChild(box); wrap.appendChild(stage);
  wrap.addEventListener('click', e=>{ if(e.target === wrap || e.target === x) hideCritFx(); });
  document.body.appendChild(wrap);
  x.focus({preventScroll:true});
}
function hideCritFx(){ const el = document.getElementById('critFx'); if(el){ const v = el.querySelector('video'); if(v) v.pause(); el.remove(); } }
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') hideCritFx(); });
