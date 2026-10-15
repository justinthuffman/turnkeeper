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
// Details: the same fields as the sheet's Character Details (js/char-sheet.js DETAIL_GROUPS), plus treasure
const DETAIL_TEXT = [['age', 'Age'], ['height', 'Height'], ['weight', 'Weight'], ['eyes', 'Eyes'], ['skin', 'Skin'], ['hair', 'Hair']];
const DETAIL_AREAS = [['look', 'Appearance', 3], ['traits', 'Personality traits', 3], ['ideals', 'Ideals', 2], ['bonds', 'Bonds', 2], ['flaws', 'Flaws', 2],
  ['backstory', 'Backstory', 5], ['allies', 'Allies & organizations', 3], ['symbol', 'Symbol (allies & organizations)', 0], ['extraFeatures', 'Additional features & traits', 3], ['treasure', 'Treasure', 2]];
// assignBy: each method's own assignment (standard array and rolled scores), so switching methods keeps both;
// rolls: kept once rolled (no rerolls), whichever method is picked
// level: the starting level (the DM says which); hpHow: 'average' or 'roll' for levels after 1st, with
// hpRolls[i] the roll for level i + 2 (kept once rolled: no rerolls, and no switching to the average)
const blank = ()=>({bringTo:'', step:'race', raceGroup:'', race:'', ancestry:'', asiPick:[], cls:'', subclass:'', level:1, hpHow:'', hpRolls:[], method:'', assignBy:{array:{}, roll:{}}, points:{str:8, dex:8, con:8, int:8, wis:8, cha:8}, rolls:null,
  bg:'', langs:[], tools:[], skills:[], extraSkills:[], expertise:[], equip:{}, picks:{}, cantrips:[], spells:[], book:[],
  name:'', alignment:'', portrait:'', portraitFit:null, ...Object.fromEntries([...DETAIL_TEXT, ...DETAIL_AREAS].map(([k])=>[k, '']))});
let S = (()=>{ try{ return {...blank(), ...(JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') || {})}; }catch(e){ return blank(); } })();
if(S.race && !S.raceGroup) S.raceGroup = (raceGroupOf(S.race) || {}).name || '';   // a draft from before races had subraces
if(S.assign){ if(S.method === 'array' || S.method === 'roll') S.assignBy[S.method] = S.assign; delete S.assign; }   // a draft from before assignBy
const assign = ()=>S.assignBy[S.method] || (S.assignBy[S.method] = {});
const save = ()=>{ try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(S)); }catch(e){} };

// Which campaign it's for: {key, name, settings}, from an invite link (?join=) or the player's campaigns
const ctx = {camps:[], camp:null, join:null, user:null};
const settings = ()=>(ctx.camp && ctx.camp.settings) || {};
function allowedMethods(){
  const a = settings().abilities;
  const ok = ABILITY_METHODS.filter(([k])=>!a || a[k] !== false);
  return ok.length ? ok : ABILITY_METHODS;
}
// Variant Human is an optional rule: offered only when the campaign's DM turns it on
const variantHumanOk = ()=>settings().variantHuman === true;

/* ---------- Worked out from the draft ---------- */
const raceB = ()=>RACE_BUILD[S.race] || null, clsB = ()=>CLASS_BUILD[S.cls] || null, bgB = ()=>BACKGROUNDS[S.bg] || null;
function arrayValues(){ return S.method === 'roll' ? (S.rolls || []).map(r=>r.total) : STANDARD_ARRAY; }
function baseScores(){
  if(S.method === 'pointBuy') return {...S.points};
  const vals = arrayValues(), out = {};
  ABIL.forEach(a=>{ const i = assign()[a]; out[a] = i === undefined || i === '' || vals[i] === undefined ? null : vals[i]; });
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
// Spells at the starting level (js/data/levels.js has the class tables): {cantripList, spellList (1st level
// and up, to the highest the character can cast), cantrips, known, book, prepared, maxLevel, ability} or null.
// Paladins and Rangers cast from level 2. (Eldritch Knights and Arcane Tricksters pick theirs on the Spells tab.)
const SPELL_ABILITY = {bard:'cha', cleric:'wis', druid:'wis', paladin:'cha', ranger:'wis', sorcerer:'cha', warlock:'cha', wizard:'int'};
function spellPlan(){
  const lim = SPELL_LIMITS[S.cls], L = S.level || 1; if(!lim || !clsB()) return null;
  if((S.cls === 'paladin' || S.cls === 'ranger') && L < 2) return null;
  const maxLevel = maxSpellLevelAt(S.cls, S.subclass, L);
  let all = SPELL_DATA[S.cls] && SPELL_DATA[S.cls].length ? SPELL_DATA[S.cls]
    : (CLASS_SPELL_NAMES[S.cls] || []).flatMap((names, lvl)=>names.map(n=>({...(findSpell(n) || {}), name:n, level:lvl})));
  // A warlock's patron adds its expanded spells to the list
  const entry = CLASS_FEATURES[S.cls], sub = entry && S.subclass ? entry.subclasses[S.subclass] || [] : [];
  const extra = sub.filter(t=>t.expanded).flatMap(t=>t.tiers || []).map(x=>findSpell(x.name)).filter(sp=>sp && !all.some(s=>s.name === sp.name));
  all = [...all, ...extra].filter(s=>s.level <= maxLevel).sort((a, b)=>a.level - b.level || a.name.localeCompare(b.name));
  const ability = SPELL_ABILITY[S.cls], score = finalScores()[ability];
  return {cantripList:all.filter(s=>s.level === 0), spellList:all.filter(s=>s.level >= 1), maxLevel, ability,
    cantrips:lim.cantrips ? lim.cantrips(L) : 0, known:lim.known ? lim.known(L) : 0, book:S.cls === 'wizard' ? wizardBookAt(L) : 0,
    prepared:lim.prepared ? Math.max(1, (score === null ? 0 : mod(score)) + (lim.half ? Math.floor(L / 2) : L)) : 0};
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
    if(!S.raceGroup) out.push('Pick a race.');
    else if(!r) out.push('Pick a subrace.');
    else if(S.race === 'Dragonborn' && !S.ancestry) out.push('Pick your draconic ancestry.');
    else if(r.pick && S.asiPick.length !== r.pick) out.push(`Pick ${r.pick} ability scores for +1.`);
  }
  if(step === 'class'){
    if(!c) out.push('Pick a class.');
    else if(subclassNow() && !S.subclass) out.push(`Pick your ${CLASS_FEATURES[S.cls].subclassLabel}.`);
    if(c && (S.level || 1) > 1 && !S.hpHow) out.push('Pick how to work out hit points after 1st level.');
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
      if(p.known && S.spells.length !== p.known) out.push(`Pick ${p.known} spells known.`);
      if(p.book && S.book.length !== p.book) out.push(`Pick ${p.book} spells for your spellbook.`);
      if(p.prepared && S.spells.length !== Math.min(p.prepared, p.book || 99)) out.push(`Prepare ${Math.min(p.prepared, p.book || 99)} spells.`);
    }
  }
  if(step === 'details' && !S.name.trim()) out.push('Give your character a name.');
  if(step === 'review') visibleSteps().filter(([k])=>k !== 'review').forEach(([k, l])=>missing(k).forEach(m=>out.push(`${l}: ${m}`)));
  return out;
}

/* ---------- Drawing ---------- */
// A race's subraces this campaign offers (Variant Human only when the DM turns it on)
const subsOf = g=>g.subs.filter(([n])=>n !== 'Variant Human' || variantHumanOk());
function focusSelector(el){
  if(el.id) return '#' + CSS.escape(el.id);
  const attr = [...el.attributes].find(x=>x.name.startsWith('data-')); if(!attr) return null;
  return `${el.tagName.toLowerCase()}[${attr.name}="${CSS.escape(attr.value)}"]` + (el.type === 'radio' ? `[value="${CSS.escape(el.value)}"]` : '');
}
function render(){
  // A draft's Variant Human, where this campaign doesn't use it, goes back to the standard human
  if(S.race === 'Variant Human' && !variantHumanOk()){ S.race = 'Human'; S.asiPick = []; S.extraSkills = []; }
  const steps = visibleSteps();
  if(!steps.some(([k])=>k === S.step)) S.step = 'race';
  hideTip(true);
  // Keep the keyboard where it was across the redraw (the same box, found by its id or data attribute)
  const a = document.activeElement, again = a && $('body').contains(a) ? focusSelector(a) : null;
  $('steps').innerHTML = steps.map(([k, l], i)=>`<button type="button" class="step${k === S.step ? ' on' : ''}${k !== 'review' && !missing(k).length ? ' done' : ''}" data-step="${k}"><span>${i + 1}</span>${l}</button>`).join('');
  $('body').innerHTML = ({race:renderRace, class:renderClass, abilities:renderAbilities, background:renderBackground, skills:renderSkills,
    equipment:renderEquipment, spells:renderSpells, details:renderDetails, review:renderReview})[S.step]();
  renderSummary();
  if(again){ const el = $('body').querySelector(again); if(el) el.focus({preventScroll:true}); }
  const i = steps.findIndex(([k])=>k === S.step);
  $('back').hidden = i === 0; $('next').hidden = i === steps.length - 1;
  const todo = S.step === 'review' ? [] : missing(S.step);
  $('todo').textContent = todo.join(' ');
  save();
}
const sel = (attr, value, options, blankLabel)=>`<select ${attr}>${blankLabel !== undefined ? `<option value="">${esc(blankLabel)}</option>` : ''}${options.map(o=>{ const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
const asiText = asi=>Object.entries(asi).map(([a, n])=>`${ABIL_NAME[a]} +${n}`).join(', ');
// An item's name with its description on hover (click holds it), and a list of items with their descriptions
const itemTip = (name, label)=>itemInfo(name) ? `<span class="tipname" data-tip="${esc(name)}">${esc(label || name)}</span>` : esc(label || name);
const itemLines = list=>`<ul class="items">${list.map(([n, q])=>`<li><b>${esc(n)}${q > 1 ? ` ×${q}` : ''}</b>${itemInfo(n) ? ` <span>${esc(itemInfo(n))}</span>` : ''}</li>`).join('')}</ul>`;

/* The character so far: a card beside the steps (above them on a phone) that fills in as picks are made */
function renderSummary(){
  const c = clsB(), fin = finalScores(), hp = hpMax(), r = raceB();
  const who = [S.race, c && c.name].filter(Boolean).join(' ');
  const portrait = safePortrait(S.portrait);
  $('summary').innerHTML = `<div class="sum-head">${charIconHtml(null, '', 'sum-portrait', {portrait, portraitFit:S.portraitFit, cls:c ? c.name : '', name:S.name || '?'})}<div><b>${esc(S.name.trim() || 'New character')}</b>`
    + `<small>${who ? 'Level ' + (S.level || 1) + ' ' + esc(who) : 'Pick a race and class'}${S.subclass ? ` · ${esc(S.subclass)}` : ''}</small></div></div>`
    + (S.bg || S.alignment ? `<p class="sum-line">${[S.bg, S.alignment].filter(Boolean).map(esc).join(' · ')}</p>` : '')
    + `<div class="sum-scores">${ABIL.map(a=>`<span><small>${a.toUpperCase()}</small><b>${fin[a] ?? '—'}</b><i>${fin[a] === null ? '' : fmt(mod(fin[a]))}</i></span>`).join('')}</div>`
    + `<p class="sum-line">${[hp ? `HP ${hp}` : '', r ? `Speed ${r.speed} ft` : '', c ? `Hit die d${c.hd}` : ''].filter(Boolean).join(' · ') || '&nbsp;'}</p>`
    + (allSkills().length ? `<p class="sum-line"><span>Skills</span> ${allSkills().map(s=>S.expertise.includes(s) ? s + '*' : s).map(esc).join(', ')}</p>` : '')
    + ([...S.langs, ...S.tools].filter(Boolean).length ? `<p class="sum-line"><span>Picked</span> ${[...S.langs, ...S.tools].filter(Boolean).map(esc).join(', ')}</p>` : '')
    + (spellPlan() && [...S.cantrips, ...S.book, ...S.spells].length ? `<p class="sum-line"><span>Spells</span> ${[...new Set([...S.cantrips, ...S.book, ...S.spells])].map(esc).join(', ')}</p>` : '');
}

function renderRace(){
  const r = raceB();
  const g = RACE_GROUPS.find(x=>x.name === S.raceGroup), subs = g ? subsOf(g) : [];
  let h = `<h2>Race</h2><div class="cards">${RACE_GROUPS.map(x=>`<button type="button" class="pick${S.raceGroup === x.name ? ' on' : ''}" data-rgroup="${esc(x.name)}"><b>${esc(x.name)}</b><small>${esc(x.blurb)}</small></button>`).join('')}</div>`;
  if(subs.length > 1){
    h += `<h3>${esc(g.name)}: Subrace</h3><div class="cards">${subs.map(([name, label])=>{ const b = RACE_BUILD[name];
      return `<button type="button" class="pick${S.race === name ? ' on' : ''}" data-race="${esc(name)}"><b>${esc(label || name)}</b><small>${esc(b.pick ? (asiText(b.asi) ? asiText(b.asi) + ', ' : '') + `+1 to ${b.pick} scores of your choice` : asiText(b.asi))} · ${b.speed} ft</small></button>`; }).join('')}</div>`;
  }
  if(r){
    const traits = traitsForRace(raceKeyFrom(S.race));
    h += `<div class="box"><h3>${esc(S.race)}</h3><p class="note">${esc(r.size)} · speed ${r.speed} ft${r.hpPerLevel ? ' · +1 hit point per level' : ''}${r.fixedSkills ? ' · proficient in ' + r.fixedSkills.join(', ') : ''}${r.skills ? ` · ${r.skills} skill${r.skills === 1 ? '' : 's'} of your choice (Skills step)` : ''}</p>`
      + (r.pick ? `<p>Pick ${r.pick} ability scores for +1${r.asi.cha ? ' (not Charisma)' : ''}:</p><div class="chips">${ABIL.filter(a=>!r.asi[a]).map(a=>`<label class="chip"><input type="checkbox" data-asipick="${a}"${S.asiPick.includes(a) ? ' checked' : ''}> ${ABIL_NAME[a]}</label>`).join('')}</div>` : '')
      + (traits.length ? `<ul class="traits">${traits.map(t=>`<li><b>${esc(t.name)}</b> ${esc(t.desc || '')}</li>`).join('')}</ul>` : `<p class="note">${esc((RACIAL_TRAITS[raceKeyFrom(S.race)] || {}).none || '')}</p>`)
      + (S.race === 'Dragonborn' ? `<p><label>Draconic Ancestry ${sel('data-ancestry', S.ancestry, DRAGON_ANCESTRIES.map(a=>[a.name, `${a.name} (${a.type}, ${a.area}, ${a.save.toUpperCase()} save)`]), 'Pick your dragon…')}</label></p>` : '')
      + (r.note ? `<p class="note">${esc(r.note)}</p>` : '') + `</div>`;
  }
  return h;
}
function renderClass(){
  const c = clsB(), L = S.level || 1;
  let h = `<h2>Class</h2><div class="cards">${Object.entries(CLASS_BUILD).map(([k, b])=>`<button type="button" class="pick${S.cls === k ? ' on' : ''}" data-cls="${k}"><b>${b.name}</b><small>d${b.hd} · ${b.saves.map(a=>ABIL_NAME[a]).join(', ')}</small></button>`).join('')}</div>`;
  h += `<p class="levelpick"><label>Starting level ${sel('data-level', L, Array.from({length:20}, (_, i)=>i + 1))}</label> <span class="note">Level 1 unless your DM says otherwise.</span></p>`;
  if(c){
    const entry = CLASS_FEATURES[S.cls], dmgOk = settings().dmgSubclasses === true;
    const sub = S.subclass && entry ? entry.subclasses[S.subclass] || [] : [];
    const feats = entry ? [...entry.base, ...sub].filter(f=>f.level <= L).sort((a, b)=>a.level - b.level) : [];
    h += `<div class="box"><h3>${c.name}${L > 1 ? ` · Level ${L}` : ''}</h3><p class="note">Hit die d${c.hd} · saving throws: ${c.saves.map(a=>ABIL_NAME[a]).join(', ')} · ${c.skills.n} skills${SPELL_LIMITS[S.cls] ? ' · casts spells' : ''}</p>`;
    if(subclassNow()){
      const subs = Object.keys(entry.subclasses).filter(s=>!DMG_SUBCLASSES.includes(s) || dmgOk);
      h += `<p><label>${entry.subclassLabel} ${sel('data-sub', S.subclass, subs, 'Pick one…')}</label></p>`;
    } else if(entry) h += `<p class="note">You pick your ${esc(entry.subclassLabel)} at level ${entry.subclassLevel}.</p>`;
    // Hit points after 1st level: the average, or a roll for each level (kept once rolled)
    if(L > 1){
      const rolled = S.hpHow === 'roll' && S.hpRolls.length >= L - 1;
      h += `<h3>Hit Points After 1st Level</h3><p class="note">1st level gets the full d${c.hd}. For each level after that, take the average (${hpAverage(c.hd)}) or roll the d${c.hd}; Constitution is added either way.</p>`
        + `<div class="chips"><label class="chip"><input type="radio" name="hpHow" data-hphow="average"${S.hpHow === 'average' ? ' checked' : ''}${S.hpRolls.length ? ' disabled' : ''}> Take the average</label>`
        + `<label class="chip"><input type="radio" name="hpHow" data-hphow="roll"${S.hpHow === 'roll' ? ' checked' : ''}> Roll</label></div>`
        + (S.hpHow === 'roll' ? (rolled ? `<div class="rolls">${S.hpRolls.slice(0, L - 1).map((d, i)=>`<span class="rollset"><small>Lv ${i + 2}</small><b>${d}</b></span>`).join('')}</div><p class="note">Rolled, so these stay (no rerolls).</p>`
          : `<p><button type="button" class="btn" id="rollHp">Roll d${c.hd} for level${L > 2 ? 's 2 to ' + L : ' 2'}</button></p>`) : '')
        + (hpMax() ? `<p class="note">Hit point maximum: <b>${hpMax()}</b>.</p>` : S.hpHow && finalScores().con === null ? `<p class="note">Your total shows once your ability scores are set.</p>` : '');
    }
    h += feats.length ? `<h3>Features${L > 1 ? ' up to level ' + L : ''}</h3><ul class="traits">${feats.map(f=>`<li>${L > 1 ? `<small class="lv">Lv ${f.level}</small> ` : ''}<b>${esc(f.name)}</b> ${esc(f.desc || '')}${f.choose || f.picks ? ' <i>(pick it in the Build box when the character opens)</i>' : ''}</li>`).join('')}</ul>` : '';
    if(L > 1) h += `<p class="note">Ability Score Improvements, feats and other choices for levels after 1st are picked in the sheet’s Build box when the character opens; it highlights each one.</p>`;
    h += `</div>`;
  }
  return h;
}
function renderAbilities(){
  const methods = allowedMethods();
  if(S.method && !methods.some(([k])=>k === S.method)) S.method = '';
  if(!S.method && methods.length === 1) S.method = methods[0][0];
  let h = `<h2>Ability Scores</h2>${ctx.camp ? `<p class="note">${esc(ctx.camp.name)} allows: ${methods.map(m=>m[1]).join(', ')}.</p>` : ''}
    <div class="chips">${methods.map(([k, l])=>`<label class="chip"><input type="radio" name="method" data-method="${k}"${S.method === k ? ' checked' : ''}> ${l}</label>`).join('')}</div>`;
  if(!S.method) return h;
  const bonus = raceBonus(), fin = finalScores();
  if(S.method === 'roll'){
    h += S.rolls ? `<div class="rolls">${S.rolls.map(r=>`<span class="rollset">${r.dice.map((d, j)=>`<i class="${j === r.drop ? 'drop' : ''}">${d}</i>`).join('')}<b>${r.total}</b></span>`).join('')}</div><p class="note">These are your rolls: they stay if you switch methods and come back (no rerolls).</p>`
      : `<p><button type="button" class="btn" id="rollScores">Roll 4d6 six times</button> <span class="note">Each set drops its lowest die. You roll once, but you can still switch to another method afterwards.</span></p>`;
    if(!S.rolls) return h;
  }
  const vals = arrayValues(), A = assign(), used = Object.values(A).filter(v=>v !== '' && v !== undefined).map(String);
  h += `<table class="abil"><tr><th></th><th>${S.method === 'pointBuy' ? 'Points' : 'Score'}</th><th>Race</th><th>Total</th><th>Mod</th></tr>`
    + ABIL.map(a=>{
      const cell = S.method === 'pointBuy'
        ? `<button type="button" class="mini" data-pb="${a}" data-d="-1"${S.points[a] <= 8 ? ' disabled' : ''}>−</button> <b>${S.points[a]}</b> <button type="button" class="mini" data-pb="${a}" data-d="1"${S.points[a] >= 15 || POINT_BUY_COST[S.points[a] + 1] - POINT_BUY_COST[S.points[a]] > POINT_BUY_TOTAL - pointsSpent() ? ' disabled' : ''}>+</button>`
        : sel(`data-assign="${a}"`, A[a] ?? '', vals.map((v, i)=>[i, v]).filter(([i])=>!used.includes(String(i)) || String(A[a]) === String(i)), '—');
      return `<tr><th>${ABIL_NAME[a]}</th><td>${cell}</td><td>${bonus[a] ? '+' + bonus[a] : ''}</td><td><b>${fin[a] ?? '—'}</b></td><td>${fin[a] === null ? '' : fmt(mod(fin[a]))}</td></tr>`;
    }).join('') + `</table>`;
  if(S.method === 'pointBuy') h += `<p class="note">Points left: <b>${POINT_BUY_TOTAL - pointsSpent()}</b> of 27 (scores 8 to 15 before your race’s bonus).</p>`;
  if(clsB()) h += `<p class="note">${clsB().name}s rely on ${({barbarian:'Strength', bard:'Charisma', cleric:'Wisdom', druid:'Wisdom', fighter:'Strength or Dexterity', monk:'Dexterity and Wisdom', paladin:'Strength and Charisma', ranger:'Dexterity and Wisdom', rogue:'Dexterity', sorcerer:'Charisma', warlock:'Charisma', wizard:'Intelligence'})[S.cls]}.</p>`;
  return h;
}
function renderBackground(){
  const bg = bgB(), li = languageInfo(), tc = toolChoices(), info = BACKGROUND_INFO[S.bg];
  let h = `<h2>Background</h2><p>${sel('data-bg', S.bg, Object.keys(BACKGROUNDS), 'Pick a background…')}</p>`;
  if(bg){
    h += `<div class="box"><h3>${esc(S.bg)}</h3>${info ? `<p>${esc(info[0])}</p>` : ''}`
      + `<p class="note"><b>Skills:</b> ${bg.skills.join(', ')}${bg.languages ? ` · <b>Languages:</b> ${bg.languages} of your choice` : ''}${bg.vehicles ? ` · <b>Vehicles:</b> ${bg.vehicles.join(', ')}` : ''} · <b>Starting gold:</b> ${BACKGROUND_GEAR[S.bg].gold} gp</p>`
      + (bg.tools ? `<p class="note"><b>Tools:</b></p>${itemLines(bg.tools.map(t=>[t, 1]))}` : '')
      + `<p class="note"><b>Feature: ${esc(bg.feature)}.</b> ${info ? esc(info[1]) : ''}</p></div>`;
  }
  h += `<h3>Languages</h3><p class="note">You speak ${li.known.join(', ')}.${li.extra ? ` Pick ${li.extra} more:` : ''}</p>`;
  for(let i = 0; i < li.extra; i++) h += `<p>${sel(`data-lang="${i}"`, S.langs[i] || '', LANGUAGES.filter(l=>!li.known.includes(l) && (!S.langs.includes(l) || S.langs[i] === l)), 'Pick a language…')}</p>`;
  if(tc.length){
    h += `<h3>Tools</h3>` + tc.map((t, i)=>`<div class="toolpick"><label>${esc(t.label)} ${sel(`data-tool="${i}"`, S.tools[i] || '', t.kinds.flatMap(k=>WEAPON_PICKS[k].list().map(x=>x.name)).filter(n=>!S.tools.includes(n) || S.tools[i] === n), 'Pick one…')}</label>`
      + `<p class="note">${esc(S.tools[i] ? itemInfo(S.tools[i]) : t.kinds.map(k=>ITEM_TYPE_INFO[{gaming:'Gaming Set', instrument:'Musical Instrument', artisan:"Artisan's Tools"}[k]]).join(' Or: '))}</p></div>`).join('');
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
  const slotSel = key=>{ const p = slots.find(x=>x.key === key); if(!p) return '';
    return `<div class="slotpick">${sel(`data-epick="${key}"`, S.picks[key] || '', WEAPON_PICKS[p.kind].list().map(x=>x.name), `Pick ${WEAPON_PICKS[p.kind].label}…`)}${S.picks[key] ? `<span class="note">${esc(itemInfo(S.picks[key]))}</span>` : ''}</div>`; };
  let h = `<h2>Equipment</h2><p class="note">Hover over (or tap) an underlined item to see what it is.</p><h3>${c.name}</h3>`;
  c.choices.forEach((group, i)=>{
    const chosen = group[S.equip[i] || 0];
    h += `<div class="choice">${group.map((o, j)=>`<label class="chip"><input type="radio" name="eq${i}" data-equip="${i}" value="${j}"${(S.equip[i] || 0) === j ? ' checked' : ''}> ${o.items.length === 1 && !o.pick.length ? itemTip(o.items[0][0], o.label) : esc(o.label)}</label>`).join('<span class="or">or</span>')}`
      + (chosen.items.length ? itemLines(chosen.items) : '')
      + slots.filter(p=>p.key.startsWith(`c${i}:${S.equip[i] || 0}:`)).map(p=>slotSel(p.key)).join('') + `</div>`;
  });
  h += `<h3>Also from your class</h3>${c.fixed.length ? itemLines(c.fixed) : ''}${slots.filter(p=>p.key.startsWith('f:')).map(p=>slotSel(p.key)).join('')}`;
  if(bg) h += `<h3>From your background (${esc(S.bg)})</h3>${itemLines(bg.items)}${slots.filter(p=>p.key.startsWith('b:')).map(p=>slotSel(p.key)).join('')}<p class="note">And ${bg.gold} gp.</p>`;
  else h += `<p class="note">Pick a background to add its equipment.</p>`;
  h += `<p class="note">Armor, a shield and weapons go on (equipped) automatically. Change them any time in the Inventory tab.</p>`;
  return h;
}
// Spells: the box with the checkbox picks it; hovering the name shows the spell, clicking the name holds that open
function spellOf(s){ return {...s, desc:s.desc || (typeof DESCRIPTIONS === 'object' && DESCRIPTIONS[s.name]) || ''}; }
function renderSpells(){
  const p = spellPlan(); if(!p) return '';
  const row = (s, attr, list, n, on)=>`<span class="chip spell"><input type="checkbox" ${attr}="${esc(s.name)}" aria-label="${esc(s.name)}"${on ? ' checked' : ''}${!on && list.length >= n ? ' disabled' : ''}> <span class="sname" data-sp="${esc(s.name)}">${esc(s.name)}</span></span>`;
  // Spells by level (1st, 2nd…), each group with its own heading
  const byLevel = (list, attr, picked, n)=>[...new Set(list.map(s=>s.level))].map(lv=>`${p.maxLevel > 1 ? `<h4>${ORD[lv] || lv + 'th'} level</h4>` : ''}<div class="chips">${list.filter(s=>s.level === lv).map(s=>row(s, attr, picked, n, picked.includes(s.name))).join('')}</div>`).join('');
  let h = `<h2>Spells</h2><p class="note">Hover over a spell’s name to see what it does; click the name to keep it open (with a link to the full rules). Tick the box to pick it. Your spellcasting ability is ${ABIL_NAME[p.ability]}${p.maxLevel > 1 ? `, and you can cast spells up to ${ORD[p.maxLevel] || p.maxLevel + 'th'} level` : ''}.</p>`;
  if(p.cantrips) h += `<h3>Cantrips: pick ${p.cantrips}</h3><div class="chips">${p.cantripList.map(s=>row(s, 'data-cantrip', S.cantrips, p.cantrips, S.cantrips.includes(s.name))).join('')}</div>`;
  if(p.known) h += `<h3>Spells known: pick ${p.known}</h3>` + byLevel(p.spellList, 'data-spell', S.spells, p.known);
  if(p.book){
    h += `<h3>Spellbook: pick ${p.book}</h3>` + byLevel(p.spellList, 'data-book', S.book, p.book);
    S.spells = S.spells.filter(n=>S.book.includes(n));
    const n = Math.min(p.prepared, p.book);
    h += `<h3>Prepared today: pick ${n}</h3><p class="note">From your spellbook (Intelligence modifier + your level). You can change these after a long rest.</p>`
      + (p.spellList.some(s=>S.book.includes(s.name)) ? byLevel(p.spellList.filter(s=>S.book.includes(s.name)), 'data-spell', S.spells, n) : '<p class="note">Fill your spellbook first.</p>');
  } else if(p.prepared){
    h += `<h3>Prepared today: pick ${p.prepared}</h3><p class="note">${ABIL_NAME[p.ability]} modifier + ${S.cls === 'paladin' ? 'half your level' : 'your level'}. You can change these after a long rest.${S.cls === 'cleric' ? ' Your domain spells are always prepared on top of these.' : S.cls === 'paladin' ? ' Your oath spells are always prepared on top of these.' : ''}</p>`
      + byLevel(p.spellList, 'data-spell', S.spells, p.prepared);
  }
  return h;
}
// A portrait: a picture uploaded here (shrunk to a small image) or a link to one (https only)
const safePortrait = safePortraitUrl;   // js/char-icons.js
function renderDetails(){
  const input = (k, label, max)=>`<label class="field"><span>${label}</span><input data-f="${k}" maxlength="${max || 40}" value="${esc(S[k])}"></label>`;
  const area = (k, label, rows)=>rows ? `<label class="field"><span>${label}</span><textarea data-f="${k}" rows="${rows}" maxlength="4000">${esc(S[k])}</textarea></label>` : input(k, label, 80);
  const portrait = safePortrait(S.portrait);
  return `<h2>Details</h2>${input('name', 'Name')}<label class="field"><span>Alignment</span>${sel('data-f="alignment"', S.alignment, ALIGNMENTS, '—')}</label>`
    + `<h3>Portrait</h3>${portraitEditorHtml({portrait:S.portrait, fit:S.portraitFit, cls:clsB() ? clsB().name : '', name:S.name})}`
    + `<h3>Appearance</h3><p class="note">Size: ${raceB() ? esc(raceB().size) : 'set by your race'}</p><div class="grid3">${DETAIL_TEXT.map(([k, l])=>input(k, l)).join('')}</div>`
    + DETAIL_AREAS.slice(0, 1).map(([k, l, r])=>area(k, l, r)).join('')
    + `<h3>Personality</h3>` + DETAIL_AREAS.slice(1, 5).map(([k, l, r])=>area(k, l, r)).join('')
    + `<h3>Story</h3>` + DETAIL_AREAS.slice(5).map(([k, l, r])=>area(k, l, r)).join('')
    + `<p class="note">All of this can be changed later on the sheet’s Details tab.</p>`;
}
// Hit points for each level: 1st is the full hit die; each later level the average or a roll. All plus
// Constitution (and Dwarven Toughness), at least 1 a level. [{level, die, hp}]
function hpLevels(){
  const c = clsB(), con = finalScores().con; if(!c || con === null) return null;
  const extra = mod(con) + ((raceB() && raceB().hpPerLevel) || 0), out = [{level:1, die:c.hd, hp:Math.max(1, c.hd + extra)}];
  for(let l = 2; l <= (S.level || 1); l++){
    const die = S.hpHow === 'roll' ? S.hpRolls[l - 2] : S.hpHow === 'average' ? hpAverage(c.hd) : null;
    if(die === null || die === undefined) return null;
    out.push({level:l, die, hp:Math.max(1, die + extra)});
  }
  return out;
}
function hpMax(){ const h = hpLevels(); return h ? h.reduce((n, x)=>n + x.hp, 0) : null; }
const subclassNow = ()=>{ const e = CLASS_FEATURES[S.cls]; return !!e && (S.level || 1) >= e.subclassLevel; };
function renderReview(){
  const todo = missing('review'), fin = finalScores(), c = clsB(), p = spellPlan();
  let h = `<h2>Review</h2>`;
  if(todo.length) h += `<div class="box warn"><b>Still to do:</b><ul>${todo.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`;
  h += `<div class="box"><h3>${esc(S.name || 'Unnamed')}</h3><p>Level ${S.level || 1} ${esc(S.race || '?')} ${esc(c ? c.name : '?')}${S.subclass ? ` (${esc(S.subclass)})` : ''} · ${esc(S.bg || 'no background')}${S.alignment ? ' · ' + esc(S.alignment) : ''}</p>`
    + `<p class="scores">${ABIL.map(a=>`<span><small>${a.toUpperCase()}</small><b>${fin[a] ?? '—'}</b>${fin[a] === null ? '' : fmt(mod(fin[a]))}</span>`).join('')}</p>`
    + `<p>Hit points ${hpMax() ?? '—'} · speed ${raceB() ? raceB().speed : '—'} ft · saving throws ${c ? c.saves.map(a=>ABIL_NAME[a]).join(', ') : '—'}</p>`
    + `<p>Skills: ${allSkills().map(s=>S.expertise.includes(s) ? s + ' (expertise)' : s).join(', ') || '—'}</p>`
    + (S.langs.length || S.tools.length ? `<p>Picked: ${[...S.langs, ...S.tools].filter(Boolean).join(', ')}</p>` : '')
    + `<p>Equipment: ${equipmentList().map(([n, q])=>q > 1 ? `${n} ×${q}` : n).join(', ')}${S.bg ? `, ${BACKGROUND_GEAR[S.bg].gold} gp` : ''}</p>`
    + (p ? `<p>Spells: ${[...S.cantrips, ...(p.book ? S.book : S.spells)].join(', ')}</p>` : '') + `</div>`;
  if(!ctx.join && ctx.camps.length){
    if(S.bringTo && !ctx.camps.some(c=>c.key === S.bringTo)) S.bringTo = '';
    h += `<h3>Campaign</h3><p class="note">A character plays in one campaign at a time, and you play one character in each.</p><div class="chips" style="flex-direction:column; align-items:flex-start">`
      + `<label class="chip"><input type="radio" name="bringTo" data-bring=""${S.bringTo ? '' : ' checked'}> Not in a campaign yet</label>`
      + ctx.camps.map(c=>`<label class="chip"><input type="radio" name="bringTo" data-bring="${esc(c.key)}"${S.bringTo === c.key ? ' checked' : ''}> Bring it to ${esc(c.name)}${c.charName ? ` (instead of ${esc(c.charName)}, who stays yours)` : ''}</label>`).join('') + `</div>`;
  }
  h += `<p class="note">${ctx.join ? `Once it’s made, it joins <b>${esc(ctx.join.name)}</b>.` : S.bringTo ? '' : ctx.camps.length ? 'You can bring it into a campaign later from the hub.' : 'It won’t be in a campaign yet: join one with your DM’s invite link.'} Anything the sheet’s Build box asks for (like a Fighting Style) you pick when it opens.${(S.level || 1) > 1 ? ` Starting at level ${S.level}: your Ability Score Improvements and other level choices are waiting in the Build box, and your DM may give extra gear or gold.` : ''}</p>`
    + `<p><button type="button" class="btn" id="createGo"${todo.length ? ' disabled' : ''}>Create ${esc(S.name || 'the character')}</button></p><div class="msg" id="createMsg" aria-live="polite"></div>`;
  return h;
}

/* ---------- The popup (as on the sheet) ----------
   Hovering a spell's name (or an underlined item) shows what it is. Clicking the name holds the box
   in place, so its link can be clicked; clicking anywhere else, or Escape, lets it go. */
let tipHeld = false;
function tipHtml(el){
  if(el.dataset.sp){
    const p = spellPlan(), s = p && [...p.cantripList, ...p.spellList].find(x=>x.name === el.dataset.sp); if(!s) return '';
    const sp = spellOf(s);
    return `<b>${esc(sp.name)}</b><div class="meta">${esc(sp.school || '')}${sp.time ? ' &middot; ' + esc(sp.time) : ''}${sp.ritual ? ' (Ritual)' : ''}${sp.range ? `<br>Range: ${esc(sp.range)} &middot; Duration: ${esc(sp.duration)}<br>Components: ${esc(sp.comp)}` : ''}</div>`
      + `<div class="meta" style="margin-top:6px; color:var(--ink);">${esc(sp.desc)}</div>`
      + `<div class="tip-link"><a href="https://dnd5e.wikidot.com/spell:${slugify(sp.name)}" target="_blank" rel="noopener">Full rules on dnd5e.wikidot.com ↗</a><span class="tip-hint">Click the spell to keep this open</span></div>`;
  }
  if(el.dataset.tip) return `<b>${esc(el.dataset.tip)}</b><div class="meta">${esc(itemInfo(el.dataset.tip))}</div>`;
  return '';
}
function showTip(e, el){
  if(tipHeld) return;
  const html = tipHtml(el); if(!html) return;
  const t = $('tooltip'); t.innerHTML = html; t.style.display = 'block'; moveTip(e);
}
function moveTip(e){
  if(tipHeld) return;
  const t = $('tooltip'), pad = 14, rect = t.getBoundingClientRect(), w = rect.width || 280, h = rect.height || 80;
  let x = e.clientX + pad, y = e.clientY + pad;
  if(x + w + pad > innerWidth) x = Math.max(pad, e.clientX - w - pad);
  if(y + h + pad > innerHeight) y = Math.max(pad, e.clientY - h - pad);
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
function hideTip(force){
  if(tipHeld && force !== true) return;
  tipHeld = false; const t = $('tooltip'); if(t){ t.classList.remove('tip-held'); t.style.display = 'none'; }
}
const tipTarget = e=>e.target.closest && e.target.closest('[data-sp], [data-tip]');
document.addEventListener('mouseover', e=>{ const el = tipTarget(e); if(el) showTip(e, el); });
document.addEventListener('mousemove', e=>{ if(tipTarget(e)) moveTip(e); });
document.addEventListener('mouseout', e=>{ const el = tipTarget(e); if(el && !el.contains(e.relatedTarget)) hideTip(); });
document.addEventListener('click', e=>{
  const el = tipTarget(e);
  // Hold it open (an item named inside an option's label picks the option instead: its description shows below it)
  if(el && !el.closest('label')){ tipHeld = false; showTip(e, el); tipHeld = true; $('tooltip').classList.add('tip-held'); return; }
  if(tipHeld && !$('tooltip').contains(e.target)) hideTip(true);
}, true);
document.addEventListener('keydown', e=>{ if(tipHeld && e.key === 'Escape') hideTip(true); });

/* ---------- Changes ---------- */
const toggle = (list, v, on, max)=>{ const l = list.filter(x=>x !== v); if(on && l.length < (max ?? 99)) l.push(v); return l; };
function d4d6(){ const r = new Uint32Array(4); crypto.getRandomValues(r); const dice = [...r].map(x=>1 + x % 6); const drop = dice.indexOf(Math.min(...dice)); return {dice, drop, total:dice.reduce((s, d)=>s + d, 0) - dice[drop]}; }
document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.dataset.step){ S.step = b.dataset.step; render(); scrollTo(0, 0); return; }
  if(b.id === 'next' || b.id === 'back'){ const st = visibleSteps(), i = st.findIndex(([k])=>k === S.step); S.step = st[Math.max(0, Math.min(st.length - 1, i + (b.id === 'next' ? 1 : -1)))][0]; render(); scrollTo(0, 0); return; }
  if(b.dataset.rgroup){ if(S.raceGroup !== b.dataset.rgroup){ const g = RACE_GROUPS.find(x=>x.name === b.dataset.rgroup), subs = subsOf(g); S.raceGroup = g.name; S.race = subs.length === 1 ? subs[0][0] : ''; S.ancestry = ''; S.asiPick = []; S.langs = []; } render(); return; }
  if(b.dataset.race){ if(S.race !== b.dataset.race){ S.race = b.dataset.race; S.asiPick = []; S.langs = []; } render(); return; }
  if(b.dataset.cls){ if(S.cls !== b.dataset.cls){ S.cls = b.dataset.cls; S.subclass = ''; S.hpHow = ''; S.hpRolls = []; S.skills = []; S.expertise = []; S.equip = {}; S.picks = {}; S.cantrips = []; S.spells = []; S.book = []; S.tools = []; } render(); return; }
  if(b.dataset.pb){ const a = b.dataset.pb; S.points[a] = Math.max(8, Math.min(15, S.points[a] + +b.dataset.d)); render(); return; }
  if(b.id === 'rollHp'){ const c = clsB(); while(S.hpRolls.length < (S.level || 1) - 1){ const r = new Uint32Array(1); crypto.getRandomValues(r); S.hpRolls.push(1 + r[0] % c.hd); } render(); return; }
  if(b.id === 'rollScores'){ if(!S.rolls){ S.rolls = Array.from({length:6}, d4d6); S.assignBy.roll = {}; } render(); return; }
  if(b.id === 'startOver'){ if(confirm('Start over? This clears everything you’ve picked.')){ S = blank(); render(); } return; }
  if(b.id === 'createGo') createCharacter();
});
document.addEventListener('change', e=>{
  const t = e.target, d = t.dataset;
  if(d.asipick){ S.asiPick = toggle(S.asiPick, d.asipick, t.checked, raceB().pick); }
  else if(d.sub !== undefined){ S.subclass = t.value; }
  else if(d.level !== undefined){ S.level = Math.min(20, Math.max(1, +t.value || 1)); if(!subclassNow()) S.subclass = ''; }
  else if(d.hphow){ if(!(d.hphow === 'average' && S.hpRolls.length)) S.hpHow = d.hphow; }
  else if(d.ancestry !== undefined){ S.ancestry = t.value; }
  else if(d.bring !== undefined){ S.bringTo = d.bring; }
  else if(d.method){ S.method = d.method; }   // each method keeps its own scores
  else if(d.assign){ assign()[d.assign] = t.value === '' ? '' : +t.value; }
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
  else if(d.f && t.tagName !== 'SELECT'){ S[d.f] = t.value; save(); return; }   // typed text: already saved as it was typed; no redraw (Tab moves on)
  else if(d.f){ S[d.f] = t.value; }
  else return;
  render();
});
// Portrait: picked and lined up in the class coin (js/portrait-fit.js)
wirePortraitEditor({
  get:()=>({portrait:S.portrait, fit:S.portraitFit, cls:clsB() ? clsB().name : '', name:S.name}),
  set:ch=>{ if('portrait' in ch) S.portrait = ch.portrait; if('fit' in ch) S.portraitFit = ch.fit; render(); },
});
// Typing in Details saves without redrawing (so the cursor stays put)
document.addEventListener('input', e=>{ const k = e.target.dataset && e.target.dataset.f; if(k && e.target.tagName !== 'SELECT'){ S[k] = e.target.value; save(); renderSummary(); $('todo').textContent = missing(S.step).join(' '); } });

/* ---------- Creating it ---------- */
// kv keys the way js/char-store.js keeps them: no "dndTracker:", the character as "@", percent-encoded
const kvKey = k=>encodeURIComponent(k).replace(/\./g, '%2E');
let newItemN = 0;
const itemId = ()=>'i' + Date.now().toString(36) + (newItemN++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);
function buildRecord(){
  const c = clsB(), fin = finalScores(), p = spellPlan(), hp = hpMax();
  const skills = {}; allSkills().forEach(s=>skills[s] = S.expertise.includes(s) ? 'e' : 'p');
  const core = {name:S.name.trim().slice(0, 40), race:S.race, cls:c.name, level:S.level || 1, scores:fin, saves:[...c.saves], skills,
    hpMax:hp, hpCur:hp, speed:raceB().speed, ac:10 + mod(fin.dex),
    details:{background:S.bg, alignment:S.alignment, xp:XP_FOR[(S.level || 1) - 1], ...Object.fromEntries([...DETAIL_TEXT, ...DETAIL_AREAS].map(([k])=>[k, String(S[k] || '').trim()]).filter(([, v])=>v))}};
  if(safePortrait(S.portrait)){ core.portrait = safePortrait(S.portrait); core.portraitFit = clampFit(S.portraitFit); }
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
  if((S.level || 1) > 1) kv[kvKey('levels:@')] = JSON.stringify(Object.fromEntries(hpLevels().slice(1).map(x=>[x.level, {hp:x.hp, how:S.hpHow, die:x.die}])));   // js/level-up.js
  if(S.race === 'Dragonborn' && S.ancestry) kv[kvKey('choice:@:Draconic Ancestry')] = S.ancestry;   // the sheet's Build box choice
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
    const {db, user, fb:{ref, push, set, update, serverTimestamp}} = await tkRequireUser();
    const {core, kv} = buildRecord();
    const r = push(ref(db, CHARS)), camp = !ctx.join && ctx.camps.find(c=>c.key === S.bringTo);
    await set(r, {owner:user.uid, core, kv, t:serverTimestamp(), ...(camp ? {campaign:camp.key} : {})});
    if(camp){
      const patch = {[`${CAMP(camp.key)}/members/${user.uid}/char`]:r.key};
      if(camp.char && camp.char !== r.key) patch[`${CHARS}/${camp.char}/campaign`] = null;
      try{ await update(ref(db), patch); }
      catch(err){
        console.warn('Bringing it to the campaign:', err);
        await set(ref(db, `${CHARS}/${r.key}/campaign`), null).catch(()=>{});
        alert(`${core.name} is made, but couldn’t be brought into ${camp.name}. You can do it from the hub.`);
      }
    }
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
    for(const k of ['abilities', 'dmgSubclasses', 'variantHuman']){ try{ out[k] = (await get(ref(db, `${CAMP(key)}/settings/${k}`))).val(); }catch(e){} }
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
        const char = (await get(ref(db, `${CAMP(k)}/members/${user.uid}/char`)).catch(()=>null))?.val();
        const charName = typeof char === 'string' ? (await get(ref(db, `${CHARS}/${char}/core/name`)).catch(()=>null))?.val() : null;
        ctx.camps.push({key:k, name:meta && typeof meta.name === 'string' ? meta.name.slice(0, 80) : k, char:typeof char === 'string' ? char : null, charName:typeof charName === 'string' ? charName.slice(0, 40) : ''});
      }
      if(ctx.camps.length){ ctx.camp = {...ctx.camps[0], settings:await readSettings(ctx.camps[0].key)}; }
    }
  }catch(err){ console.warn('The campaign:', err); }
  $('forWhat').textContent = ctx.join ? `For ${ctx.join.name}` : ctx.camp ? `Rules from ${ctx.camp.name}` : 'Not in a campaign yet';
  render();
})();
