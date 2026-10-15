/* ---------- The character creator (V6 stage 2): a new level 1 character ----------
   Steps: Race, Class, Abilities, Background, Skills, Equipment, Spells (casters), Details, Review.
   The creator saves a record the character sheet already reads (characters/<id>: owner, core, kv),
   so everything the sheet works out for itself (features, proficiencies, automatic languages and
   tools, attacks, AC from worn armor) is left to it. Choices the sheet's Build box asks for
   (Fighting Style, Draconic Ancestry, a Variant Human's feat, the High Elf cantrip…) are made there
   when the character first opens.
   The campaign the character is for (an invite link's, or one the player is in) sets which
   ability score methods are allowed (Campaign settings) and whether the DMG subclasses are.
   A draft is kept in this browser until the character is created (or Start over). */
const $ = id=>document.getElementById(id);
const esc = s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABIL_NAME = {str:'Strength', dex:'Dexterity', con:'Constitution', int:'Intelligence', wis:'Wisdom', cha:'Charisma'};
const SKILLS = {'Acrobatics':'dex', 'Animal Handling':'wis', 'Arcana':'int', 'Athletics':'str', 'Deception':'cha', 'History':'int', 'Insight':'wis',
  'Intimidation':'cha', 'Investigation':'int', 'Medicine':'wis', 'Nature':'int', 'Perception':'wis', 'Performance':'cha', 'Persuasion':'cha',
  'Religion':'int', 'Sleight of Hand':'dex', 'Stealth':'dex', 'Survival':'wis'};
const ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
const mod = s=>Math.floor((s - 10) / 2), fmt = n=>(n >= 0 ? '+' : '') + n;
const ORD = ['', '1st', '2nd', '3rd'];

/* ---------- The draft ---------- */
const DRAFT_KEY = 'dndTracker:creatorDraft';
const blank = ()=>({step:'race', race:'', asiPick:[], cls:'', subclass:'', method:'', assign:{}, points:{str:8, dex:8, con:8, int:8, wis:8, cha:8}, rolls:null,
  bg:'', langs:[], tools:[], skills:[], extraSkills:[], expertise:[], equip:{}, picks:{}, cantrips:[], spells:[], book:[],
  name:'', alignment:'', traits:'', ideals:'', bonds:'', flaws:''});
let S = (()=>{ try{ return {...blank(), ...(JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') || {})}; }catch(e){ return blank(); } })();
const save = ()=>{ try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(S)); }catch(e){} };

// Which campaign it's for: {key, name, settings}, from an invite link (?join=) or the player's campaigns
const ctx = {camps:[], camp:null, join:null, user:null};
const settings = ()=>(ctx.camp && ctx.camp.settings) || {};
function allowedMethods(){
  const a = settings().abilities;
  const ok = ABILITY_METHODS.filter(([k])=>!a || a[k] !== false);
  return ok.length ? ok : ABILITY_METHODS;
}

/* ---------- Worked out from the draft ---------- */
const raceB = ()=>RACE_BUILD[S.race] || null, clsB = ()=>CLASS_BUILD[S.cls] || null, bgB = ()=>BACKGROUNDS[S.bg] || null;
function arrayValues(){ return S.method === 'roll' ? (S.rolls || []).map(r=>r.total) : STANDARD_ARRAY; }
function baseScores(){
  if(S.method === 'pointBuy') return {...S.points};
  const vals = arrayValues(), out = {};
  ABIL.forEach(a=>{ const i = S.assign[a]; out[a] = i === undefined || i === '' || vals[i] === undefined ? null : vals[i]; });
  return out;
}
function raceBonus(){
  const r = raceB(), out = Object.fromEntries(ABIL.map(a=>[a, 0])); if(!r) return out;
  Object.entries(r.asi).forEach(([a, n])=>out[a] += n);
  if(r.pick) S.asiPick.slice(0, r.pick).forEach(a=>out[a] += 1);
  return out;
}
function finalScores(){
  const b = baseScores(), r = raceBonus();
  return Object.fromEntries(ABIL.map(a=>[a, b[a] === null ? null : Math.min(20, b[a] + r[a])]));
}
const pointsSpent = ()=>ABIL.reduce((n, a)=>n + (POINT_BUY_COST[S.points[a]] ?? 99), 0);
// Skills: background and race give some; a class picks from its list; a race may add any (and an
// overlap between background and race gives a free pick of any skill instead, as the PHB says)
function fixedSkills(){
  const bg = bgB(), r = raceB(), list = [...(bg ? bg.skills : []), ...((r && r.fixedSkills) || [])];
  return [...new Set(list)];
}
function freePicks(){
  const bg = bgB(), r = raceB();
  const overlap = bg && r && r.fixedSkills ? bg.skills.filter(s=>r.fixedSkills.includes(s)).length : 0;
  return ((r && r.skills) || 0) + overlap;
}
const classSkillOptions = ()=>{ const c = clsB(); return !c ? [] : c.skills.from === 'any' ? Object.keys(SKILLS) : c.skills.from; };
function allSkills(){ return [...new Set([...fixedSkills(), ...S.skills, ...S.extraSkills])]; }
// Languages: the race's (and Common) are automatic; race and background may add picks
function languageInfo(){
  const known = S.race ? raceLanguages(S.race).languages : ['Common'];
  const extra = (S.race ? raceLanguages(S.race).extra : 0) + ((bgB() && bgB().languages) || 0);
  return {known, extra};
}
// Tool proficiencies "of your choice" from background and class: [{label, kinds, n}]
function toolChoices(){
  const out = [], add = (text, from)=>{
    const t = text.toLowerCase(), n = /^three/.test(t) ? 3 : 1;
    const kinds = [/gaming/.test(t) && 'gaming', /artisan/.test(t) && 'artisan', /instrument/.test(t) && 'instrument'].filter(Boolean);
    for(let i = 0; i < n; i++) out.push({label:`${from}: ${text}`, kinds});
  };
  ((bgB() && bgB().choose) || []).forEach(t=>add(t, S.bg));
  ((S.cls && classLanguagesTools(S.cls, S.subclass, 1).choose) || []).forEach(t=>add(t, clsB().name));
  return out;
}
// Spells at level 1: {list, cantrips, known, book, prepared} or null
function spellPlan(){
  const c = clsB(); if(!c || !c.spells) return null;
  const all = SPELL_DATA[S.cls] && SPELL_DATA[S.cls].length ? SPELL_DATA[S.cls]
    : (CLASS_SPELL_NAMES[S.cls] || []).slice(0, 2).flatMap((names, lvl)=>names.map(n=>({...(findSpell(n) || {}), name:n, level:lvl})));
  const score = finalScores()[c.spells.ability];
  return {cantripList:all.filter(s=>s.level === 0), spellList:all.filter(s=>s.level === 1), cantrips:c.spells.cantrips,
    known:c.spells.known || 0, book:c.spells.book || 0, prepared:c.spells.prepared ? Math.max(1, (score === null ? 0 : mod(score)) + 1) : 0, ability:c.spells.ability};
}
// Starting equipment: [[name, qty]] from class choices, fixed items and the background
function pickSlots(){
  const c = clsB(), out = []; if(!c) return out;
  c.choices.forEach((group, i)=>{ const o = group[S.equip[i] || 0]; (o.pick || []).forEach(([kind, n])=>{ for(let j = 0; j < n; j++) out.push({key:`c${i}:${S.equip[i] || 0}:${kind}:${j}`, kind}); }); });
  (c.fixedPick || []).forEach(([kind, n])=>{ for(let j = 0; j < n; j++) out.push({key:`f:${kind}:${j}`, kind}); });
  const bg = BACKGROUND_GEAR[S.bg]; ((bg && bg.pick) || []).forEach(([kind, n])=>{ for(let j = 0; j < n; j++) out.push({key:`b:${kind}:${j}`, kind}); });
  return out;
}
function equipmentList(){
  const c = clsB(), bg = BACKGROUND_GEAR[S.bg], out = [];
  if(c){ c.choices.forEach((group, i)=>out.push(...group[S.equip[i] || 0].items)); out.push(...c.fixed); }
  pickSlots().forEach(p=>{ if(S.picks[p.key]) out.push([S.picks[p.key], 1]); });
  if(bg) out.push(...bg.items);
  return out;
}

/* ---------- What's still missing, per step ---------- */
const STEPS = [['race', 'Race'], ['class', 'Class'], ['abilities', 'Abilities'], ['background', 'Background'], ['skills', 'Skills'],
  ['equipment', 'Equipment'], ['spells', 'Spells'], ['details', 'Details'], ['review', 'Review']];
const visibleSteps = ()=>STEPS.filter(([k])=>k !== 'spells' || spellPlan());
function missing(step){
  const out = [], r = raceB(), c = clsB();
  if(step === 'race'){
    if(!r) out.push('Pick a race.');
    else if(r.pick && S.asiPick.length !== r.pick) out.push(`Pick ${r.pick} ability scores for +1.`);
  }
  if(step === 'class'){
    if(!c) out.push('Pick a class.');
    else if(LEVEL1_SUBCLASS.includes(S.cls) && !S.subclass) out.push(`Pick your ${CLASS_FEATURES[S.cls].subclassLabel}.`);
  }
  if(step === 'abilities'){
    if(!S.method) out.push('Pick how to make your ability scores.');
    else if(S.method === 'pointBuy'){ if(pointsSpent() > POINT_BUY_TOTAL) out.push('You’ve spent more than 27 points.'); }
    else if(S.method === 'roll' && !S.rolls) out.push('Roll your scores.');
    else if(ABIL.some(a=>baseScores()[a] === null)) out.push('Give every ability a score.');
  }
  if(step === 'background'){
    if(!bgB()) out.push('Pick a background.');
    const li = languageInfo(); if(S.langs.filter(Boolean).length < li.extra) out.push(`Pick ${li.extra} language${li.extra === 1 ? '' : 's'}.`);
    if(toolChoices().some((t, i)=>!S.tools[i])) out.push('Pick your tools.');
  }
  if(step === 'skills' && c){
    if(S.skills.filter(s=>!fixedSkills().includes(s)).length !== c.skills.n) out.push(`Pick ${c.skills.n} class skills.`);
    if(S.extraSkills.filter(s=>!fixedSkills().includes(s) && !S.skills.includes(s)).length !== freePicks()) out.push(`Pick ${freePicks()} more skill${freePicks() === 1 ? '' : 's'}.`);
    if(c.expertise && S.expertise.filter(s=>allSkills().includes(s)).length !== c.expertise) out.push(`Pick ${c.expertise} skills for Expertise.`);
  }
  if(step === 'skills' && !c) out.push('Pick a class first.');
  if(step === 'equipment'){ if(!c) out.push('Pick a class first.'); else if(pickSlots().some(p=>!S.picks[p.key])) out.push('Finish picking your equipment.'); }
  if(step === 'spells'){
    const p = spellPlan();
    if(p){
      if(S.cantrips.length !== p.cantrips) out.push(`Pick ${p.cantrips} cantrips.`);
      if(p.known && S.spells.length !== p.known) out.push(`Pick ${p.known} 1st-level spells.`);
      if(p.book && S.book.length !== p.book) out.push(`Pick ${p.book} spells for your spellbook.`);
      if(p.prepared && S.spells.length !== Math.min(p.prepared, p.book || 99)) out.push(`Prepare ${Math.min(p.prepared, p.book || 99)} spells.`);
    }
  }
  if(step === 'details' && !S.name.trim()) out.push('Give your character a name.');
  if(step === 'review') visibleSteps().filter(([k])=>k !== 'review').forEach(([k, l])=>missing(k).forEach(m=>out.push(`${l}: ${m}`)));
  return out;
}

/* ---------- Drawing ---------- */
function render(){
  const steps = visibleSteps();
  if(!steps.some(([k])=>k === S.step)) S.step = 'race';
  $('steps').innerHTML = steps.map(([k, l], i)=>`<button type="button" class="step${k === S.step ? ' on' : ''}${k !== 'review' && !missing(k).length ? ' done' : ''}" data-step="${k}"><span>${i + 1}</span>${l}</button>`).join('');
  $('body').innerHTML = ({race:renderRace, class:renderClass, abilities:renderAbilities, background:renderBackground, skills:renderSkills,
    equipment:renderEquipment, spells:renderSpells, details:renderDetails, review:renderReview})[S.step]();
  const i = steps.findIndex(([k])=>k === S.step);
  $('back').hidden = i === 0; $('next').hidden = i === steps.length - 1;
  const todo = S.step === 'review' ? [] : missing(S.step);
  $('todo').textContent = todo.join(' ');
  save();
}
const sel = (attr, value, options, blankLabel)=>`<select ${attr}>${blankLabel !== undefined ? `<option value="">${esc(blankLabel)}</option>` : ''}${options.map(o=>{ const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
const asiText = asi=>Object.entries(asi).map(([a, n])=>`${ABIL_NAME[a]} +${n}`).join(', ');

function renderRace(){
  const r = raceB();
  let h = `<h2>Race</h2><div class="cards">${PHB_RACES.map(name=>{ const b = RACE_BUILD[name];
    return `<button type="button" class="pick${S.race === name ? ' on' : ''}" data-race="${esc(name)}"><b>${esc(name)}</b><small>${esc(b.pick ? (asiText(b.asi) ? asiText(b.asi) + ', ' : '') + `+1 to ${b.pick} others` : asiText(b.asi))} · ${b.speed} ft</small></button>`; }).join('')}</div>`;
  if(r){
    const traits = traitsForRace(raceKeyFrom(S.race));
    h += `<div class="box"><h3>${esc(S.race)}</h3><p class="note">${esc(r.size)} · speed ${r.speed} ft${r.hpPerLevel ? ' · +1 hit point per level' : ''}${r.fixedSkills ? ' · proficient in ' + r.fixedSkills.join(', ') : ''}${r.skills ? ` · ${r.skills} skill${r.skills === 1 ? '' : 's'} of your choice (Skills step)` : ''}</p>`
      + (r.pick ? `<p>Pick ${r.pick} ability scores for +1${r.asi.cha ? ' (not Charisma)' : ''}:</p><div class="chips">${ABIL.filter(a=>!r.asi[a]).map(a=>`<label class="chip"><input type="checkbox" data-asipick="${a}"${S.asiPick.includes(a) ? ' checked' : ''}> ${ABIL_NAME[a]}</label>`).join('')}</div>` : '')
      + (traits.length ? `<ul class="traits">${traits.map(t=>`<li><b>${esc(t.name)}</b> ${esc(t.desc || '')}</li>`).join('')}</ul>` : `<p class="note">${esc((RACIAL_TRAITS[raceKeyFrom(S.race)] || {}).none || '')}</p>`)
      + (r.note ? `<p class="note">${esc(r.note)}</p>` : '') + `</div>`;
  }
  return h;
}
function renderClass(){
  const c = clsB();
  let h = `<h2>Class</h2><div class="cards">${Object.entries(CLASS_BUILD).map(([k, b])=>`<button type="button" class="pick${S.cls === k ? ' on' : ''}" data-cls="${k}"><b>${b.name}</b><small>d${b.hd} · ${b.saves.map(a=>ABIL_NAME[a]).join(', ')}</small></button>`).join('')}</div>`;
  if(c){
    const entry = CLASS_FEATURES[S.cls], dmgOk = settings().dmgSubclasses === true;
    const feats = entry ? entry.base.filter(f=>f.level === 1) : [];
    h += `<div class="box"><h3>${c.name}</h3><p class="note">Hit die d${c.hd} · saving throws: ${c.saves.map(a=>ABIL_NAME[a]).join(', ')} · ${c.skills.n} skills${c.spells ? ' · casts spells' : ''}</p>`;
    if(LEVEL1_SUBCLASS.includes(S.cls)){
      const subs = Object.keys(entry.subclasses).filter(s=>!DMG_SUBCLASSES.includes(s) || dmgOk);
      h += `<p><label>${entry.subclassLabel} ${sel('data-sub', S.subclass, subs, 'Pick one…')}</label></p>`;
      const sf = S.subclass ? (entry.subclasses[S.subclass] || []).filter(f=>f.level === 1) : [];
      feats.push(...sf);
    } else if(entry) h += `<p class="note">You pick your ${esc(entry.subclassLabel)} at level ${entry.subclassLevel}.</p>`;
    h += feats.length ? `<ul class="traits">${feats.map(f=>`<li><b>${esc(f.name)}</b> ${esc(f.desc || '')}${f.choose ? ' <i>(pick it in the Build box when the character opens)</i>' : ''}</li>`).join('')}</ul>` : '';
    h += `</div>`;
  }
  return h;
}
function renderAbilities(){
  const methods = allowedMethods();
  if(S.method && !methods.some(([k])=>k === S.method)) S.method = '';
  if(!S.method && methods.length === 1) S.method = methods[0][0];
  let h = `<h2>Ability Scores</h2>${ctx.camp ? `<p class="note">${esc(ctx.camp.name)} allows: ${methods.map(m=>m[1]).join(', ')}.</p>` : ''}
    <div class="chips">${methods.map(([k, l])=>`<label class="chip"><input type="radio" name="method" data-method="${k}"${S.method === k ? ' checked' : ''}${S.method === 'roll' && S.rolls && k !== 'roll' ? ' disabled' : ''}> ${l}</label>`).join('')}</div>`;
  if(S.method === 'roll' && S.rolls) h += `<p class="note">You’ve rolled, so these are your scores. (Start over to begin again.)</p>`;
  if(!S.method) return h;
  const base = baseScores(), bonus = raceBonus(), fin = finalScores();
  if(S.method === 'roll'){
    h += S.rolls ? `<div class="rolls">${S.rolls.map((r, i)=>`<span class="rollset">${r.dice.map((d, j)=>`<i class="${j === r.drop ? 'drop' : ''}">${d}</i>`).join('')}<b>${r.total}</b></span>`).join('')}</div>`
      : `<p><button type="button" class="btn" id="rollScores">Roll 4d6 six times</button> <span class="note">Each set drops its lowest die. You roll once.</span></p>`;
    if(!S.rolls) return h;
  }
  const vals = arrayValues(), used = Object.values(S.assign).filter(v=>v !== '' && v !== undefined).map(String);
  h += `<table class="abil"><tr><th></th><th>${S.method === 'pointBuy' ? 'Points' : 'Score'}</th><th>Race</th><th>Total</th><th>Mod</th></tr>`
    + ABIL.map(a=>{
      const cell = S.method === 'pointBuy'
        ? `<button type="button" class="mini" data-pb="${a}" data-d="-1"${S.points[a] <= 8 ? ' disabled' : ''}>−</button> <b>${S.points[a]}</b> <button type="button" class="mini" data-pb="${a}" data-d="1"${S.points[a] >= 15 || POINT_BUY_COST[S.points[a] + 1] - POINT_BUY_COST[S.points[a]] > POINT_BUY_TOTAL - pointsSpent() ? ' disabled' : ''}>+</button>`
        : sel(`data-assign="${a}"`, S.assign[a] ?? '', vals.map((v, i)=>[i, v]).filter(([i])=>!used.includes(String(i)) || String(S.assign[a]) === String(i)), '—');
      return `<tr><th>${ABIL_NAME[a]}</th><td>${cell}</td><td>${bonus[a] ? '+' + bonus[a] : ''}</td><td><b>${fin[a] ?? '—'}</b></td><td>${fin[a] === null ? '' : fmt(mod(fin[a]))}</td></tr>`;
    }).join('') + `</table>`;
  if(S.method === 'pointBuy') h += `<p class="note">Points left: <b>${POINT_BUY_TOTAL - pointsSpent()}</b> of 27 (scores 8 to 15 before your race’s bonus).</p>`;
  if(clsB()) h += `<p class="note">${clsB().name}s rely on ${({barbarian:'Strength', bard:'Charisma', cleric:'Wisdom', druid:'Wisdom', fighter:'Strength or Dexterity', monk:'Dexterity and Wisdom', paladin:'Strength and Charisma', ranger:'Dexterity and Wisdom', rogue:'Dexterity', sorcerer:'Charisma', warlock:'Charisma', wizard:'Intelligence'})[S.cls]}.</p>`;
  return h;
}
function renderBackground(){
  const bg = bgB(), li = languageInfo(), tc = toolChoices();
  let h = `<h2>Background</h2><p>${sel('data-bg', S.bg, Object.keys(BACKGROUNDS), 'Pick a background…')}</p>`;
  if(bg) h += `<div class="box"><p class="note">Skills: ${bg.skills.join(', ')}${bg.tools ? ' · tools: ' + bg.tools.join(', ') : ''}${bg.vehicles ? ' · ' + bg.vehicles.join(', ') : ''} · feature: ${esc(bg.feature)} · starting gold ${BACKGROUND_GEAR[S.bg].gold} gp</p></div>`;
  h += `<h3>Languages</h3><p class="note">You speak ${li.known.join(', ')}.${li.extra ? ` Pick ${li.extra} more:` : ''}</p>`;
  for(let i = 0; i < li.extra; i++) h += `<p>${sel(`data-lang="${i}"`, S.langs[i] || '', LANGUAGES.filter(l=>!li.known.includes(l) && (!S.langs.includes(l) || S.langs[i] === l)), 'Pick a language…')}</p>`;
  if(tc.length){
    h += `<h3>Tools</h3>` + tc.map((t, i)=>`<p><label>${esc(t.label)} ${sel(`data-tool="${i}"`, S.tools[i] || '', t.kinds.flatMap(k=>WEAPON_PICKS[k].list().map(x=>x.name)).filter(n=>!S.tools.includes(n) || S.tools[i] === n), 'Pick one…')}</label></p>`).join('');
  }
  return h;
}
function renderSkills(){
  const c = clsB(); if(!c) return '<h2>Skills</h2><p class="note">Pick a class first.</p>';
  const fixed = fixedSkills(), free = freePicks();
  S.skills = S.skills.filter(s=>!fixed.includes(s)); S.extraSkills = S.extraSkills.filter(s=>!fixed.includes(s) && !S.skills.includes(s));
  const box = (name, list, pickedList, n, attr)=>`<div class="chips">${list.map(s=>{
    const has = fixed.includes(s), on = pickedList.includes(s), other = !on && (S.skills.includes(s) || S.extraSkills.includes(s));
    return `<label class="chip${has ? ' fixed' : ''}"><input type="checkbox" ${attr}="${esc(s)}"${has || on || other ? ' checked' : ''}${has || other || (!on && pickedList.length >= n) ? ' disabled' : ''}> ${esc(s)} <small>${SKILLS[s].toUpperCase()}</small></label>`; }).join('')}</div>`;
  let h = `<h2>Skills</h2>${fixed.length ? `<p class="note">From your race and background: ${fixed.join(', ')}.</p>` : ''}`
    + `<h3>${c.name}: pick ${c.skills.n}</h3>` + box(c.name, classSkillOptions(), S.skills, c.skills.n, 'data-skill');
  if(free) h += `<h3>Any skill: pick ${free}</h3><p class="note">${raceB() && raceB().skills ? `Your race gives ${raceB().skills}.` : ''}${free > ((raceB() && raceB().skills) || 0) ? ' Your race and background both give the same skill, so you pick another.' : ''}</p>` + box('', Object.keys(SKILLS), S.extraSkills, free, 'data-xskill');
  if(c.expertise){
    const prof = allSkills(); S.expertise = S.expertise.filter(s=>prof.includes(s));
    h += `<h3>Expertise: pick ${c.expertise}</h3><p class="note">Double your proficiency bonus for these skills. (Thieves’ tools can be an Expertise choice too: tell your DM and mark it on the sheet.)</p><div class="chips">${prof.map(s=>`<label class="chip"><input type="checkbox" data-exp="${esc(s)}"${S.expertise.includes(s) ? ' checked' : ''}${!S.expertise.includes(s) && S.expertise.length >= c.expertise ? ' disabled' : ''}> ${esc(s)}</label>`).join('')}</div>`;
  }
  return h;
}
function renderEquipment(){
  const c = clsB(); if(!c) return '<h2>Equipment</h2><p class="note">Pick a class first.</p>';
  const slots = pickSlots(), bg = BACKGROUND_GEAR[S.bg];
  const slotSel = key=>{ const p = slots.find(x=>x.key === key); return p ? sel(`data-epick="${key}"`, S.picks[key] || '', WEAPON_PICKS[p.kind].list().map(x=>x.name), `Pick ${WEAPON_PICKS[p.kind].label}…`) : ''; };
  let h = `<h2>Equipment</h2><h3>${c.name}</h3>`;
  c.choices.forEach((group, i)=>{
    h += `<div class="choice">${group.map((o, j)=>`<label class="chip"><input type="radio" name="eq${i}" data-equip="${i}" value="${j}"${(S.equip[i] || 0) === j ? ' checked' : ''}> ${esc(o.label)}</label>`).join('<span class="or">or</span>')}`
      + `<div>${slots.filter(p=>p.key.startsWith(`c${i}:${S.equip[i] || 0}:`)).map(p=>slotSel(p.key)).join(' ')}</div></div>`;
  });
  const fixed = c.fixed.map(([n, q])=>q > 1 ? `${n} ×${q}` : n);
  h += `<p class="note">Also: ${fixed.join(', ') || 'nothing else'}${(c.fixedPick || []).length ? ', and' : '.'}</p>${slots.filter(p=>p.key.startsWith('f:')).map(p=>slotSel(p.key)).join(' ')}`;
  if(bg) h += `<h3>${esc(S.bg)}</h3><p class="note">${bg.items.map(([n, q])=>q > 1 ? `${n} ×${q}` : n).join(', ')}, and ${bg.gold} gp.</p>${slots.filter(p=>p.key.startsWith('b:')).map(p=>slotSel(p.key)).join(' ')}`;
  else h += `<p class="note">Pick a background to add its equipment.</p>`;
  h += `<p class="note">Armor, a shield and weapons go on (equipped) automatically. Change them any time in the Inventory tab.</p>`;
  return h;
}
function renderSpells(){
  const p = spellPlan(); if(!p) return '';
  const row = (s, attr, list, n, on)=>`<label class="chip spell" title="${esc([s.school, s.time, s.range, s.desc || (typeof DESCRIPTIONS === 'object' && DESCRIPTIONS[s.name]) || ''].filter(Boolean).join(' · '))}"><input type="checkbox" ${attr}="${esc(s.name)}"${on ? ' checked' : ''}${!on && list.length >= n ? ' disabled' : ''}> ${esc(s.name)}</label>`;
  let h = `<h2>Spells</h2><p class="note">Hover (or long-press) a spell to see what it does. Your spellcasting ability is ${ABIL_NAME[p.ability]}.</p>`
    + `<h3>Cantrips: pick ${p.cantrips}</h3><div class="chips">${p.cantripList.map(s=>row(s, 'data-cantrip', S.cantrips, p.cantrips, S.cantrips.includes(s.name))).join('')}</div>`;
  if(p.known) h += `<h3>1st-level spells known: pick ${p.known}</h3><div class="chips">${p.spellList.map(s=>row(s, 'data-spell', S.spells, p.known, S.spells.includes(s.name))).join('')}</div>`;
  if(p.book){
    h += `<h3>Spellbook: pick ${p.book}</h3><div class="chips">${p.spellList.map(s=>row(s, 'data-book', S.book, p.book, S.book.includes(s.name))).join('')}</div>`;
    S.spells = S.spells.filter(n=>S.book.includes(n));
    const n = Math.min(p.prepared, p.book);
    h += `<h3>Prepared today: pick ${n}</h3><p class="note">From your spellbook (Intelligence modifier + 1). You can change these after a long rest.</p><div class="chips">${p.spellList.filter(s=>S.book.includes(s.name)).map(s=>row(s, 'data-spell', S.spells, n, S.spells.includes(s.name))).join('') || '<span class="note">Fill your spellbook first.</span>'}</div>`;
  } else if(p.prepared){
    h += `<h3>Prepared today: pick ${p.prepared}</h3><p class="note">${ABIL_NAME[p.ability]} modifier + 1. You can change these after a long rest.${S.cls === 'cleric' ? ' Your domain spells are always prepared on top of these.' : ''}</p><div class="chips">${p.spellList.map(s=>row(s, 'data-spell', S.spells, p.prepared, S.spells.includes(s.name))).join('')}</div>`;
  }
  return h;
}
function renderDetails(){
  const f = (k, label, rows)=>`<label class="field"><span>${label}</span>${rows ? `<textarea data-f="${k}" rows="${rows}" maxlength="1000">${esc(S[k])}</textarea>` : `<input data-f="${k}" maxlength="40" value="${esc(S[k])}">`}</label>`;
  return `<h2>Details</h2>${f('name', 'Name')}<label class="field"><span>Alignment</span>${sel('data-f="alignment"', S.alignment, ALIGNMENTS, '—')}</label>`
    + f('traits', 'Personality traits', 3) + f('ideals', 'Ideals', 2) + f('bonds', 'Bonds', 2) + f('flaws', 'Flaws', 2)
    + `<p class="note">You can fill in the rest (appearance, backstory, allies) on the sheet’s Details tab.</p>`;
}
function hpMax(){ const c = clsB(), con = finalScores().con; return c && con !== null ? Math.max(1, c.hd + mod(con) + ((raceB() && raceB().hpPerLevel) || 0)) : null; }
function renderReview(){
  const todo = missing('review'), fin = finalScores(), c = clsB(), p = spellPlan();
  let h = `<h2>Review</h2>`;
  if(todo.length) h += `<div class="box warn"><b>Still to do:</b><ul>${todo.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`;
  h += `<div class="box"><h3>${esc(S.name || 'Unnamed')}</h3><p>Level 1 ${esc(S.race || '?')} ${esc(c ? c.name : '?')}${S.subclass ? ` (${esc(S.subclass)})` : ''} · ${esc(S.bg || 'no background')}${S.alignment ? ' · ' + esc(S.alignment) : ''}</p>`
    + `<p class="scores">${ABIL.map(a=>`<span><small>${a.toUpperCase()}</small><b>${fin[a] ?? '—'}</b>${fin[a] === null ? '' : fmt(mod(fin[a]))}</span>`).join('')}</p>`
    + `<p>Hit points ${hpMax() ?? '—'} · speed ${raceB() ? raceB().speed : '—'} ft · saving throws ${c ? c.saves.map(a=>ABIL_NAME[a]).join(', ') : '—'}</p>`
    + `<p>Skills: ${allSkills().map(s=>S.expertise.includes(s) ? s + ' (expertise)' : s).join(', ') || '—'}</p>`
    + (S.langs.length || S.tools.length ? `<p>Picked: ${[...S.langs, ...S.tools].filter(Boolean).join(', ')}</p>` : '')
    + `<p>Equipment: ${equipmentList().map(([n, q])=>q > 1 ? `${n} ×${q}` : n).join(', ')}${S.bg ? `, ${BACKGROUND_GEAR[S.bg].gold} gp` : ''}</p>`
    + (p ? `<p>Spells: ${[...S.cantrips, ...(p.book ? S.book : S.spells)].join(', ')}</p>` : '') + `</div>`;
  h += `<p class="note">${ctx.join ? `Once it’s made, it joins <b>${esc(ctx.join.name)}</b>.` : 'It won’t be in a campaign yet: join one with your DM’s invite link.'} Anything the sheet’s Build box asks for (like a Fighting Style) you pick when it opens.</p>`
    + `<p><button type="button" class="btn" id="createGo"${todo.length ? ' disabled' : ''}>Create ${esc(S.name || 'the character')}</button></p><div class="msg" id="createMsg" aria-live="polite"></div>`;
  return h;
}

/* ---------- Changes ---------- */
const toggle = (list, v, on, max)=>{ const l = list.filter(x=>x !== v); if(on && l.length < (max ?? 99)) l.push(v); return l; };
function d4d6(){ const r = new Uint32Array(4); crypto.getRandomValues(r); const dice = [...r].map(x=>1 + x % 6); const drop = dice.indexOf(Math.min(...dice)); return {dice, drop, total:dice.reduce((s, d)=>s + d, 0) - dice[drop]}; }
document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.dataset.step){ S.step = b.dataset.step; render(); scrollTo(0, 0); return; }
  if(b.id === 'next' || b.id === 'back'){ const st = visibleSteps(), i = st.findIndex(([k])=>k === S.step); S.step = st[Math.max(0, Math.min(st.length - 1, i + (b.id === 'next' ? 1 : -1)))][0]; render(); scrollTo(0, 0); return; }
  if(b.dataset.race){ if(S.race !== b.dataset.race){ S.race = b.dataset.race; S.asiPick = []; S.langs = []; } render(); return; }
  if(b.dataset.cls){ if(S.cls !== b.dataset.cls){ S.cls = b.dataset.cls; S.subclass = ''; S.skills = []; S.expertise = []; S.equip = {}; S.picks = {}; S.cantrips = []; S.spells = []; S.book = []; S.tools = []; } render(); return; }
  if(b.dataset.pb){ const a = b.dataset.pb; S.points[a] = Math.max(8, Math.min(15, S.points[a] + +b.dataset.d)); render(); return; }
  if(b.id === 'rollScores'){ if(!S.rolls){ S.rolls = Array.from({length:6}, d4d6); S.assign = {}; } render(); return; }
  if(b.id === 'startOver'){ if(confirm('Start over? This clears everything you’ve picked.')){ S = blank(); render(); } return; }
  if(b.id === 'createGo') createCharacter();
});
document.addEventListener('change', e=>{
  const t = e.target, d = t.dataset;
  if(d.asipick){ S.asiPick = toggle(S.asiPick, d.asipick, t.checked, raceB().pick); }
  else if(d.sub !== undefined){ S.subclass = t.value; }
  else if(d.method){ S.method = d.method; S.assign = {}; }
  else if(d.assign){ S.assign[d.assign] = t.value === '' ? '' : +t.value; }
  else if(d.bg !== undefined){ S.bg = t.value; S.langs = []; S.tools = []; S.picks = Object.fromEntries(Object.entries(S.picks).filter(([k])=>!k.startsWith('b:'))); }
  else if(d.lang){ S.langs[+d.lang] = t.value; }
  else if(d.tool){ S.tools[+d.tool] = t.value; }
  else if(d.skill){ S.skills = toggle(S.skills, d.skill, t.checked, clsB().skills.n); }
  else if(d.xskill){ S.extraSkills = toggle(S.extraSkills, d.xskill, t.checked, freePicks()); }
  else if(d.exp){ S.expertise = toggle(S.expertise, d.exp, t.checked, clsB().expertise); }
  else if(d.equip){ S.equip[+d.equip] = +t.value; }
  else if(d.epick){ S.picks[d.epick] = t.value; }
  else if(d.cantrip){ S.cantrips = toggle(S.cantrips, d.cantrip, t.checked, spellPlan().cantrips); }
  else if(d.book){ S.book = toggle(S.book, d.book, t.checked, spellPlan().book); }
  else if(d.spell){ const p = spellPlan(); S.spells = toggle(S.spells, d.spell, t.checked, p.known || Math.min(p.prepared, p.book || 99)); }
  else if(d.f){ S[d.f] = t.value; }
  else return;
  render();
});
// Typing in Details saves without redrawing (so the cursor stays put)
document.addEventListener('input', e=>{ const k = e.target.dataset && e.target.dataset.f; if(k && e.target.tagName !== 'SELECT'){ S[k] = e.target.value; save(); $('todo').textContent = missing(S.step).join(' '); } });

/* ---------- Creating it ---------- */
// kv keys the way js/char-store.js keeps them: no "dndTracker:", the character as "@", percent-encoded
const kvKey = k=>encodeURIComponent(k).replace(/\./g, '%2E');
let newItemN = 0;
const itemId = ()=>'i' + Date.now().toString(36) + (newItemN++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);
function buildRecord(){
  const c = clsB(), fin = finalScores(), p = spellPlan(), hp = hpMax();
  const skills = {}; allSkills().forEach(s=>skills[s] = S.expertise.includes(s) ? 'e' : 'p');
  const core = {name:S.name.trim().slice(0, 40), race:S.race, cls:c.name, level:1, scores:fin, saves:[...c.saves], skills,
    hpMax:hp, hpCur:hp, speed:raceB().speed, ac:10 + mod(fin.dex),
    details:{background:S.bg, alignment:S.alignment, traits:S.traits.trim(), ideals:S.ideals.trim(), bonds:S.bonds.trim(), flaws:S.flaws.trim(), xp:0}};
  const langs = S.langs.filter(Boolean), tools = S.tools.filter(Boolean);
  if(langs.length) core.languages = langs;
  if(tools.length) core.profs = {tools};
  // Inventory (one line per item, with its quantity) and what's worn and held
  const items = [], equip = {melee:{}, ranged:{}, applied:[]};
  equipmentList().forEach(([name, qty])=>{
    const def = equipmentByName(name), same = items.find(x=>x.name === (def ? def.name : name));
    if(same) same.qty += qty; else items.push({id:itemId(), name:def ? def.name : name, qty, notes:''});
  });
  const defOf = it=>equipmentByName(it.name) || {};
  const armor = items.find(it=>defOf(it).ac && defOf(it).name !== 'Shield'), shield = items.find(it=>defOf(it).name === 'Shield');
  const melee = items.find(it=>defOf(it).melee && !(defOf(it).thrown && /Javelin|Dart/.test(it.name))) || items.find(it=>defOf(it).melee);
  const ranged = items.find(it=>defOf(it).ranged && !defOf(it).melee);
  if(armor) equip.armor = armor.id;
  if(melee){ if(defOf(melee).twoHanded){ equip.melee.L = equip.melee.R = melee.id; } else equip.melee.R = melee.id; }
  if(shield && !(melee && defOf(melee).twoHanded)){ equip.shield = shield.id; equip.shieldHand = 'L'; equip.melee.L = shield.id; }
  if(ranged){ if(defOf(ranged).twoHanded){ equip.ranged.L = equip.ranged.R = ranged.id; } else equip.ranged.R = ranged.id; }
  const kv = {
    [kvKey('inv:@')]:JSON.stringify({items}),
    [kvKey('equip:@')]:JSON.stringify(equip),
    [kvKey('gold:@')]:JSON.stringify({log:[{t:Date.now(), d:BACKGROUND_GEAR[S.bg].gold, note:`Starting gold (${S.bg})`}]}),
  };
  if(S.subclass) kv[kvKey('subclass:@')] = S.subclass;
  if(p){
    const prepared = [...S.cantrips, ...S.spells];
    if(prepared.length) kv[kvKey('prepared:@')] = JSON.stringify(prepared);
    if(p.book) kv[kvKey('spellbook:@')] = JSON.stringify(Object.fromEntries(S.book.map(n=>[n, 'free'])));
  }
  return {core, kv};
}
async function createCharacter(){
  const msg = $('createMsg'), btn = $('createGo');
  if(missing('review').length) return;
  btn.disabled = true; msg.textContent = 'Creating…'; msg.className = 'msg';
  try{
    const {db, user, fb:{ref, push, set, serverTimestamp}} = await tkRequireUser();
    const {core, kv} = buildRecord();
    const r = push(ref(db, CHARS));
    await set(r, {owner:user.uid, core, kv, t:serverTimestamp()});
    try{ localStorage.removeItem(DRAFT_KEY); }catch(e){}
    location.href = ctx.join ? `index.html?join=${encodeURIComponent(ctx.join.code)}&pick=${encodeURIComponent(r.key)}` : `turnkeeper.html?char=${encodeURIComponent(r.key)}`;
  }catch(err){
    console.warn('Creating the character:', err);
    msg.textContent = 'Couldn’t create the character. Check your connection and try again.'; msg.className = 'msg err'; btn.disabled = false;
  }
}

/* ---------- Start: signed in, and which campaign it's for ---------- */
(async ()=>{
  const {db, user, fb:{ref, get}} = await tkRequireUser();
  ctx.user = user;
  const params = new URLSearchParams(location.search), code = params.get('join');
  const readSettings = async key=>{
    const out = {};
    for(const k of ['abilities', 'dmgSubclasses']){ try{ out[k] = (await get(ref(db, `${CAMP(key)}/settings/${k}`))).val(); }catch(e){} }
    return out;
  };
  try{
    if(code && /^[A-Za-z0-9]{8,40}$/.test(code)){
      const inv = (await get(ref(db, `${DBROOT}invites/${code}`))).val();
      if(inv && inv.key){ ctx.join = {code, key:inv.key, name:String(inv.name || 'your campaign').slice(0, 80)}; ctx.camp = {key:inv.key, name:ctx.join.name, settings:await readSettings(inv.key)}; }
    }
    if(!ctx.camp){
      const mine = (await get(ref(db, `${USERS}/${user.uid}/campaigns`))).val() || {};
      for(const k of Object.keys(mine).filter(k=>mine[k] === 'player')){
        const meta = (await get(ref(db, `${CAMP(k)}/meta`)).catch(()=>null))?.val();
        ctx.camps.push({key:k, name:meta && typeof meta.name === 'string' ? meta.name.slice(0, 80) : k});
      }
      if(ctx.camps.length){ ctx.camp = {...ctx.camps[0], settings:await readSettings(ctx.camps[0].key)}; }
    }
  }catch(err){ console.warn('The campaign:', err); }
  $('forWhat').textContent = ctx.join ? `For ${ctx.join.name}` : ctx.camp ? `Rules from ${ctx.camp.name}` : 'Not in a campaign yet';
  render();
})();
