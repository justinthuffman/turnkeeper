/* ---------- The campaign's custom items and effects: definitions and the forms ----------
   Shared by the tracker (a player's Inventory tab, js/inventory.js) and the DM Screen (Campaign
   Items). A custom item (Grun's Greataxe) or effect (Bleeding: 2 slashing every turn) is saved for
   the whole campaign: campaigns/<c>/items and effectDefs, each {name, json, by, t}.
   The DM's items can be hidden from players (def.hidden): a hidden item isn't offered to players
   until the DM makes it visible (when the party loots it); one a player already has still works.
   Each page sets window.itemFormHost:
     campaign()   the campaign key            by()           who made it (shown on the DM Screen)
     dm           true on the DM Screen        flash(msg, err) a message near the form
     standardEffects()  [{name, key, standard, desc}] the page's built-in conditions and statuses
     db()         a promise of {saveDef, deleteDef} (the page's Firebase module)
     saved(name, wasNew), deleted(name)   what to redraw afterwards
   Uses js/data/equipment.js (EQUIPMENT, WEAPONS, ARMOR, ITEM_TYPES, equipmentByName,
   weaponPropsText). */
const ifEsc = s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
const ABILITY_AND_SKILL_NAMES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma',
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation',
  'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'];
const campaignDefs = {items:{}, effectDefs:{}};   // id → definition, from Firebase
// Raw records from the database → definitions
function parseDefs(raw){
  const out = {};
  Object.entries(raw || {}).forEach(([id, r])=>{ try{ const d = JSON.parse(r.json); if(d && r.name) out[id] = {...d, name:String(r.name), id, by:r.by || ''}; }catch(e){} });
  return out;
}
const host = ()=>window.itemFormHost || {};
const customItems = ()=>Object.values(campaignDefs.items);
// What players are offered: everything but the DM's hidden items (the DM sees them all)
const offeredItems = ()=>customItems().filter(d=>host().dm || !d.hidden);
// An item's full definition: a campaign custom item (built on its base) or a standard one
function itemDef(name){
  const n = String(name || '').toLowerCase();
  const c = customItems().find(x=>x.name.toLowerCase() === n);
  if(c){ const base = c.base ? equipmentByName(c.base) : null; return {...(base || {}), ...c, custom:true, baseName:c.base || ''}; }
  return equipmentByName(name);
}
// The same, for something a player is adding: a hidden item counts as unknown
function offeredDef(name){ const d = itemDef(name); return d && d.custom && d.hidden && !host().dm ? null : d; }
const isWeapon = d=>!!(d && d.type === 'Weapon' && d.category);
const isArmor = d=>!!(d && d.type === 'Armor');
const isShield = d=>!!(d && d.type === 'Shield');
const newId = ()=>'i' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
function itemAttrs(d, it){
  if(!d) return '';
  if(isWeapon(d)) return [d.dice && `${d.dice} ${d.dmgType}`, weaponPropsText(d), d.magic && `+${d.magic} magic`].filter(Boolean).join('; ');
  if(isArmor(d)) return [`AC ${d.ac}${d.dex ? (d.dexMax != null ? ` + Dex (max ${d.dexMax})` : ' + Dex') : ''}`, d.str && `Str ${d.str}`, d.stealthDis && 'stealth disadvantage', d.magic && `+${d.magic} magic`].filter(Boolean).join('; ');
  if(isShield(d)) return `+${2 + (parseInt(d.magic, 10) || 0)} AC`;
  return d.attrs || '';
}

/* ---------- Effects: the page's standard ones, and the campaign's custom ones ---------- */
// Effects from the 2014 rules that work like custom ones (damage each turn): always there
const BUILTIN_EFFECTS = [
  {name:"Alchemist's Fire", dmg:'1d4', dmgType:'fire', freq:'turn', duration:'removed', endKind:'check', endWhat:'Dexterity', endDC:10, desc:'An action on the check puts the fire out.'},
];
// Every effect definition by name: the built-in ones and the campaign's
const allEffectDefs = ()=>[...BUILTIN_EFFECTS.map(d=>({...d, builtin:true})), ...Object.values(campaignDefs.effectDefs)];
const effectList = ()=>[
  ...((host().standardEffects && host().standardEffects()) || []),
  ...allEffectDefs().map(d=>({...d, custom:true, desc:effectText(d)})),
];
function effectText(d){
  const parts = [];
  const when = d.freq === 'turn' ? ' at the start of each of its turns' : d.freq === 'once' ? ' once' : '';
  if(d.dmg) parts.push(d.kind === 'heal' ? `heals ${d.dmg}${when}` : `${d.dmg} ${d.dmgType || ''} damage${when}`.replace(/\s+/g, ' '));
  if(d.duration) parts.push(d.duration === 'healed' ? 'until healed' : d.duration === 'removed' ? 'until removed' : d.duration);
  if(d.endKind && d.endWhat) parts.push(`ends on a DC ${d.endDC || '?'} ${d.endWhat} ${d.endKind}`);
  if(d.desc) parts.push(d.desc);
  return parts.join('; ');
}
const effectsFor = names=>(names || []).map(n=>effectList().find(x=>x.name === n)).filter(Boolean);
const formFlash = (msg, err)=>{ if(host().flash) host().flash(msg, err); };

/* ---------- New or edited custom item (in #itemForm) ---------- */
let itemForm = null;
function openItemForm(d, isNew){
  itemForm = {id:d.id || null, isNew, onHit:[...(d.onHit || [])], whileEquipped:[...(d.whileEquipped || [])]};
  const f = document.getElementById('itemForm'); f.hidden = false;
  const types = ITEM_TYPES, bases = [...WEAPONS, ...ARMOR].map(x=>x.name).concat(Object.keys(AMMO_PIECES)), dm = !!host().dm;
  // The DM's new items start hidden (prepared ahead, shown when the party finds them)
  const hidden = isNew ? dm : !!d.hidden;
  f.innerHTML = `<div class="cs-sub">${isNew ? 'New item for the campaign' : 'Edit ' + ifEsc(d.name)}</div>`
    + `<p class="cs-none">${isNew ? (dm ? 'Describe it once. Hidden items stay out of the players’ lists until you make them visible.' : `“${ifEsc(d.name)}” isn’t on the lists yet. Describe it once and everyone in the campaign can pick it.`) : 'Changes show for everyone in the campaign.'}</p>`
    + `<div class="cs-grid">`
    + `<label class="cs-field"><span>Name</span><input id="if_name" type="text" maxlength="80" value="${ifEsc(d.name)}"></label>`
    + `<label class="cs-field"><span>Built on (weapon, armor or ammunition)</span><select id="if_base"><option value="">—</option>${bases.map(b=>`<option${b === (d.base || '') ? ' selected' : ''}>${ifEsc(b)}</option>`).join('')}</select></label>`
    + `<label class="cs-field"><span>Type</span><select id="if_type">${types.map(t=>`<option${t === (d.type || 'Adventuring Gear') ? ' selected' : ''}>${ifEsc(t)}</option>`).join('')}</select></label>`
    + `<label class="cs-field"><span>Cost</span><input id="if_cost" type="text" maxlength="30" value="${ifEsc(d.cost || '')}" placeholder="e.g. 150 gp"></label>`
    + `<label class="cs-field"><span>Weight (lb)</span><input id="if_weight" type="number" min="0" step="any" value="${d.weight ?? ''}"></label>`
    + `<label class="cs-field"><span>Magic bonus (+ to hit and damage, or AC)</span><input id="if_magic" type="number" min="0" max="5" value="${d.magic || ''}"></label>`
    + `<label class="cs-field cs-wide"><span>Attributes</span><input id="if_attrs" type="text" maxlength="200" value="${ifEsc(d.attrs || '')}" placeholder="Anything special about it"></label>`
    + `<label class="cs-field cs-wide"><span>Notes</span><textarea id="if_notes" rows="2" maxlength="1000">${ifEsc(d.notes || '')}</textarea></label>`
    + `<label class="cs-check"><input type="checkbox" id="if_attune"${d.attune ? ' checked' : ''}> Requires attunement</label>`
    + (dm ? `<label class="cs-check"><input type="checkbox" id="if_visible"${hidden ? '' : ' checked'}> Visible to players</label>` : '')
    + `</div><div id="ifWeapon"></div><div id="ifUse"></div><div id="itemFormFx"></div>`
    + `<div class="cs-add" style="max-width:none;"><button type="button" class="chip-btn" id="itemSave">${isNew && !dm ? 'Save and add to inventory' : 'Save'}</button><button type="button" class="chip-btn" id="itemCancel">Cancel</button>`
    + (isNew ? '' : `<button type="button" class="chip-btn item-del" id="itemDelete">Delete from campaign</button><span class="cs-none" id="itemDelMsg"></span>`) + `</div>`;
  itemForm.weapon = d;
  fillFromBase(d.base || '');
  drawItemFormWeapon();
  drawItemFormFx();
  f.scrollIntoView({block:'nearest'});
  document.getElementById('if_name').focus();
}
/* A weapon's own stats in the item form: what it inherits when it's built on a standard weapon,
   or its own (melee or ranged, simple or martial, damage, one-handed / two-handed / versatile,
   finesse, light, reach, range) when it isn't */
// Use and throw: a potion's healing, a flask's damage, how far it can be thrown, whether it's used up
function drawItemFormUse(){
  const box = document.getElementById('ifUse'); if(!box || !itemForm) return;
  const base = document.getElementById('if_base').value, type = base ? (equipmentByName(base) || {}).type : document.getElementById('if_type').value;
  // Special ammunition: what it fits and what it adds (the Magic bonus above adds to attack and damage)
  if(type === 'Ammunition'){
    const a = (itemForm.weapon && itemForm.weapon.ammo) || {};
    box.innerHTML = `<div class="cs-sub">Special ammunition</div><p class="cs-none">Chosen when attacking with a weapon that fires it, and used up when fired. Ordinary arrows aren’t counted.</p><div class="cs-grid">`
      + `<label class="cs-field"><span>Fits</span><select id="ia_fits">${AMMO_KINDS.map(([k, l])=>`<option value="${k}"${k === (a.fits || AMMO_PIECES[base] || 'arrow') ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`
      + `<label class="cs-field"><span>Extra damage (dice)</span><input id="ia_dmg" type="text" maxlength="20" value="${ifEsc(a.dmg || '')}" placeholder="e.g. 2d4"></label>`
      + `<label class="cs-field"><span>Extra damage type</span><select id="ia_type"><option value=""></option>${DAMAGE_TYPES.map(t=>`<option${t === a.dmgType ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div>`;
    return;
  }
  if(['Weapon', 'Armor', 'Shield'].includes(type)){ box.innerHTML = ''; return; }
  const u = (itemForm.weapon && itemForm.weapon.use) || {};
  box.innerHTML = `<div class="cs-sub">Use or throw</div><p class="cs-none">For things like potions and flasks: what Use Object and Throw do with it. Leave blank if it does neither.</p><div class="cs-grid">`
    + `<label class="cs-field"><span>Heals (dice)</span><input id="iu_heal" type="text" maxlength="20" value="${ifEsc(u.heal || '')}" placeholder="e.g. 2d4+2"></label>`
    + `<label class="cs-field"><span>Damage (dice)</span><input id="iu_dmg" type="text" maxlength="20" value="${ifEsc(u.dmg || '')}" placeholder="e.g. 2d6"></label>`
    + `<label class="cs-field"><span>Damage type</span><select id="iu_type"><option value=""></option>${DAMAGE_TYPES.map(t=>`<option${t === u.dmgType ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`
    + `<label class="cs-field"><span>Thrown up to (feet)</span><input id="iu_throw" type="text" maxlength="12" value="${ifEsc(u.throwRange || '')}" placeholder="e.g. 20 or 20/60"></label>`
    + `<label class="cs-field cs-wide"><span>Note</span><input id="iu_note" type="text" maxlength="200" value="${ifEsc(u.note || '')}"></label>`
    + `</div><label class="cs-check"><input type="checkbox" id="iu_used"${itemForm.weapon && itemForm.weapon.consumable === false ? '' : ' checked'}> Used up when used or thrown</label>`;
}
function readItemFormUse(){
  const g = id=>document.getElementById(id);
  if(g('ia_fits')){ const a = {fits:g('ia_fits').value, dmg:g('ia_dmg').value.trim().slice(0, 20), dmgType:g('ia_type').value}; Object.keys(a).forEach(k=>{ if(!a[k]) delete a[k]; }); return {ammo:a, consumable:true}; }
  if(!g('iu_heal')) return null;
  const u = {heal:g('iu_heal').value.trim().slice(0, 20), dmg:g('iu_dmg').value.trim().slice(0, 20), dmgType:g('iu_type').value, throwRange:g('iu_throw').value.trim().slice(0, 12), note:g('iu_note').value.trim().slice(0, 200)};
  Object.keys(u).forEach(k=>{ if(!u[k]) delete u[k]; });
  return Object.keys(u).length ? {use:u, consumable:g('iu_used').checked} : null;
}
function drawItemFormWeapon(){
  drawItemFormUse();
  const box = document.getElementById('ifWeapon'); if(!box || !itemForm) return;
  const base = document.getElementById('if_base').value, baseDef = base ? equipmentByName(base) : null;
  const type = baseDef ? baseDef.type : document.getElementById('if_type').value;
  if(baseDef && baseDef.type === 'Ammunition'){ box.innerHTML = ''; return; }
  if(baseDef){ box.innerHTML = `<p class="cs-none">Built on a ${ifEsc(baseDef.name)}: ${ifEsc(itemAttrs(baseDef))}.</p>`; return; }
  if(type !== 'Weapon'){ box.innerHTML = ''; return; }
  const w = itemForm.weapon || {}, hands = w.twoHanded ? 'two' : w.versatile ? 'versatile' : 'one';
  const opt = (v, l, cur)=>`<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`;
  box.innerHTML = `<div class="cs-sub">Weapon</div><div class="cs-grid">`
    + `<label class="cs-field"><span>Kind</span><select id="iw_cat">${['simple melee', 'martial melee', 'simple ranged', 'martial ranged'].map(c=>opt(c, c[0].toUpperCase() + c.slice(1), w.category || 'martial melee')).join('')}</select></label>`
    + `<label class="cs-field"><span>Damage dice</span><input id="iw_dice" type="text" maxlength="12" value="${ifEsc(w.dice || '1d8')}"></label>`
    + `<label class="cs-field"><span>Damage type</span><select id="iw_type">${DAMAGE_TYPES.map(t=>opt(t, t, w.dmgType || 'slashing')).join('')}</select></label>`
    + `<label class="cs-field"><span>Hands</span><select id="iw_hands">${opt('one', 'One-handed', hands)}${opt('two', 'Two-handed', hands)}${opt('versatile', 'Versatile (one or two)', hands)}</select></label>`
    + `<label class="cs-field"><span>Two-handed damage (versatile)</span><input id="iw_vers" type="text" maxlength="12" value="${ifEsc(w.versatile || '')}" placeholder="e.g. 1d10"></label>`
    + `<label class="cs-field"><span>Range (thrown or ranged)</span><input id="iw_range" type="text" maxlength="12" value="${ifEsc(w.range || '')}" placeholder="e.g. 20/60"></label>`
    + `</div><div class="cs-checks">${[['finesse', 'Finesse'], ['light', 'Light'], ['heavy', 'Heavy'], ['reach', 'Reach'], ['thrown', 'Thrown'], ['loading', 'Loading'], ['ammunition', 'Ammunition']]
      .map(([k, l])=>`<label class="cs-check"><input type="checkbox" id="iw_${k}"${w[k] ? ' checked' : ''}> ${l}</label>`).join('')}</div>`;
}
// The weapon fields as stats (for a weapon not built on a standard one)
function readItemFormWeapon(){
  const g = id=>document.getElementById(id);
  if(!g('iw_cat')) return null;
  const cat = g('iw_cat').value, hands = g('iw_hands').value, out = {category:cat, melee:/melee/.test(cat), ranged:/ranged/.test(cat), martial:/martial/.test(cat),
    dice:g('iw_dice').value.trim().slice(0, 12) || '1d4', dmgType:g('iw_type').value, twoHanded:hands === 'two'};
  if(hands === 'versatile') out.versatile = g('iw_vers').value.trim().slice(0, 12) || out.dice;
  const range = g('iw_range').value.trim().slice(0, 12); if(range) out.range = range;
  ['finesse', 'light', 'heavy', 'reach', 'thrown', 'loading', 'ammunition'].forEach(k=>{ if(g('iw_' + k).checked) out[k] = true; });
  return out;
}
function drawItemFormFx(){
  const box = document.getElementById('itemFormFx'); if(!box || !itemForm) return;
  const names = effectList().map(x=>x.name);
  const list = (key, label, hint)=>`<div class="cs-sub">${label}</div><p class="cs-none">${hint}</p><div class="cs-chips">${itemForm[key].length ? itemForm[key].map((n, i)=>`<span class="cs-chip">${ifEsc(n)}<button type="button" data-fx-del="${key}:${i}" aria-label="Remove ${ifEsc(n)}">&times;</button></span>`).join('') : '<span class="cs-none">None</span>'}</div>`
    + `<div class="cs-add"><input type="text" list="fxNames" id="fxIn_${key}" placeholder="Pick an effect…" aria-label="${label}"><button type="button" class="chip-btn" data-fx-add="${key}">Add</button></div>`;
  box.innerHTML = `<datalist id="fxNames">${names.map(n=>`<option value="${ifEsc(n)}"></option>`).join('')}</datalist>`
    + list('onHit', 'On Hit', 'What a hit does to the target (e.g. Bleeding, Paralyzed).')
    + list('whileEquipped', 'While Equipped', 'What it does to whoever has it equipped (e.g. Enlarged, Bless).')
    + `<div class="cs-add"><button type="button" class="chip-btn" id="fxNewBtn">New effect…</button></div><div id="fxForm" class="fx-form" hidden></div>`;
}
function itemFormFx(key){
  const input = document.getElementById('fxIn_' + key), name = input.value.trim(); if(!name) return;
  const known = effectList().find(x=>x.name.toLowerCase() === name.toLowerCase());
  if(!known){ openEffectForm(name, key); return; }
  if(!itemForm[key].includes(known.name)) itemForm[key].push(known.name);
  drawItemFormFx();
}
async function saveItemForm(){
  const v = id=>document.getElementById(id).value.trim();
  const name = v('if_name').slice(0, 80); if(!name){ document.getElementById('if_name').focus(); return; }
  const base = v('if_base'), baseDef = base ? equipmentByName(base) : null;
  const def = {type: baseDef ? baseDef.type : v('if_type'), base, cost:v('if_cost'), attrs:v('if_attrs'), notes:document.getElementById('if_notes').value.trim().slice(0, 1000),
    magic: parseInt(v('if_magic'), 10) || 0, attune: document.getElementById('if_attune').checked, onHit:itemForm.onHit, whileEquipped:itemForm.whileEquipped};
  const vis = document.getElementById('if_visible');
  if(vis ? !vis.checked : (itemForm.weapon && itemForm.weapon.hidden && !itemForm.isNew)) def.hidden = true;
  const wt = parseFloat(v('if_weight')); if(!isNaN(wt)) def.weight = wt; else if(baseDef) def.weight = baseDef.weight;
  if(!def.cost && baseDef) def.cost = baseDef.cost;
  if(!baseDef && def.type === 'Weapon') Object.assign(def, readItemFormWeapon() || {});
  Object.assign(def, readItemFormUse() || {});
  if(def.use && def.use.onHit === undefined && itemForm.onHit.length) def.use.onHit = itemForm.onHit;   // a thrown flask's On hit
  const clash = customItems().find(x=>x.name.toLowerCase() === name.toLowerCase() && x.id !== itemForm.id) || (!itemForm.id && equipmentByName(name));
  if(clash){ formFlash(clash.hidden && !host().dm ? `That name is taken in this campaign. Pick another.` : `There’s already an item called ${name}.`, true); return; }
  const id = itemForm.id || newId();
  try{
    await (await host().db()).saveDef(host().campaign(), 'items', id, name, def, host().by ? host().by() : '');
    campaignDefs.items[id] = {...def, name, id};   // show it now; the database update follows
    const wasNew = itemForm.isNew; closeItemForm();
    if(host().saved) host().saved(name, wasNew);
  }catch(err){ formFlash('Couldn’t save the item: ' + err.message, true); }
}
function closeItemForm(){ itemForm = null; const f = document.getElementById('itemForm'); if(f){ f.hidden = true; f.innerHTML = ''; } }
// Delete a custom item from the campaign (asks once). Anyone who has it keeps a plain entry with
// its name and no stats (the page's deleted() takes it out of the open character).
async function deleteItemForm(){
  if(!itemForm || !itemForm.id) return;
  const d = campaignDefs.items[itemForm.id], msg = document.getElementById('itemDelMsg');
  if(!itemForm.confirmDelete){ itemForm.confirmDelete = true; msg.textContent = `Delete ${d ? d.name : 'this item'} for everyone in the campaign? Click again to delete.`; return; }
  try{
    await (await host().db()).deleteDef(host().campaign(), 'items', itemForm.id);
    const name = d && d.name;
    delete campaignDefs.items[itemForm.id];
    closeItemForm();
    if(host().deleted) host().deleted(name);
  }catch(err){ formFlash('Couldn’t delete the item: ' + err.message, true); }
}

/* ---------- New custom effect: inside the item form (#fxForm), or on its own (#fxFormSolo) ---------- */
let fxFor = null, fxBox = null;
function openEffectForm(name, forList){
  fxFor = forList || null;
  fxBox = (itemForm && document.querySelector('#itemForm #fxForm')) || document.getElementById('fxFormSolo');
  const f = fxBox; if(!f) return; f.hidden = false;
  f.innerHTML = `<div class="cs-sub">New effect for the campaign</div><div class="cs-grid">`
    + `<label class="cs-field"><span>Name</span><input id="xf_name" type="text" maxlength="60" value="${ifEsc(name || '')}" placeholder="e.g. Bleeding"></label>`
    + `<label class="cs-field"><span>Hurts or heals</span><select id="xf_kind"><option value="">Damage</option><option value="heal">Healing</option></select></label>`
    + `<label class="cs-field"><span>Amount (dice or number)</span><input id="xf_dmg" type="text" maxlength="20" placeholder="e.g. 2 or 1d4"></label>`
    + `<label class="cs-field"><span>Damage type</span><select id="xf_type"><option value=""></option>${DAMAGE_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></label>`
    + `<label class="cs-field"><span>How often</span><select id="xf_freq"><option value="turn">Every turn (start of its turn)</option><option value="once">Once</option><option value="">Neither (no damage or healing)</option></select></label>`
    + `<label class="cs-field"><span>Lasts</span><select id="xf_dur"><option value="healed">Until healed</option><option value="1 minute (10 turns)">1 minute (10 turns)</option><option value="removed">Until removed</option><option value="custom">Other…</option></select></label>`
    + `<label class="cs-field"><span>Other duration</span><input id="xf_durText" type="text" maxlength="60" placeholder="e.g. 3 turns"></label>`
    + `<label class="cs-field"><span>Ends early on a</span><select id="xf_endKind"><option value="">—</option><option value="save">Saving throw</option><option value="check">Check</option></select></label>`
    + `<label class="cs-field"><span>Using (ability or skill)</span><input id="xf_endWhat" type="text" list="xfWhat" maxlength="30" placeholder="e.g. Constitution, Athletics"><datalist id="xfWhat">${ABILITY_AND_SKILL_NAMES.map(x=>`<option value="${x}"></option>`).join('')}</datalist></label>`
    + `<label class="cs-field"><span>DC</span><input id="xf_dc" type="number" min="1" max="30"></label>`
    + `<label class="cs-field cs-wide"><span>Description (optional)</span><input id="xf_desc" type="text" maxlength="200"></label>`
    + `</div><div class="cs-add" style="max-width:none;"><button type="button" class="chip-btn" id="fxSave">Save effect</button><button type="button" class="chip-btn" id="fxCancel">Cancel</button></div>`;
  document.getElementById(name ? 'xf_dmg' : 'xf_name').focus();
}
function closeEffectForm(){ if(fxBox){ fxBox.hidden = true; fxBox.innerHTML = ''; } fxBox = null; }
async function saveEffectForm(){
  const v = id=>document.getElementById(id).value.trim();
  const name = v('xf_name').slice(0, 60); if(!name){ document.getElementById('xf_name').focus(); return; }
  if(effectList().some(x=>x.name.toLowerCase() === name.toLowerCase())){ formFlash(`There’s already an effect called ${name}.`, true); return; }
  const dur = v('xf_dur') === 'custom' ? v('xf_durText') : v('xf_dur');
  const def = {kind:v('xf_kind'), dmg:v('xf_dmg'), dmgType:v('xf_kind') === 'heal' ? '' : v('xf_type'), freq:v('xf_dmg') ? v('xf_freq') : '', duration:dur, endKind:v('xf_endKind'), endWhat:v('xf_endWhat'), endDC:parseInt(v('xf_dc'), 10) || null, desc:v('xf_desc')};
  const id = newId();
  try{
    await (await host().db()).saveDef(host().campaign(), 'effectDefs', id, name, def, host().by ? host().by() : '');
    campaignDefs.effectDefs[id] = {...def, name, id};
    closeEffectForm();
    if(itemForm && fxFor && !itemForm[fxFor].includes(name)) itemForm[fxFor].push(name);
    drawItemFormFx();
    if(host().effectSaved) host().effectSaved(name);
  }catch(err){ formFlash('Couldn’t save the effect: ' + err.message, true); }
}

// The forms' buttons (on whichever page has them open)
document.addEventListener('click', e=>{
  const t = e.target.closest && e.target.closest('button'); if(!t || !window.itemFormHost) return;
  if(t.id === 'itemSave') saveItemForm();
  else if(t.id === 'itemCancel') closeItemForm();
  else if(t.id === 'itemDelete') deleteItemForm();
  else if(t.id === 'fxNewBtn') openEffectForm();
  else if(t.id === 'fxSave') saveEffectForm();
  else if(t.id === 'fxCancel') closeEffectForm();
  else if(t.dataset.fxAdd) itemFormFx(t.dataset.fxAdd);
  else if(t.dataset.fxDel){ const [list, i] = t.dataset.fxDel.split(':'); itemForm[list].splice(+i, 1); drawItemFormFx(); }
});
// Built on fills in the type (and locks it: the item is that kind), plus the cost and weight when
// they're blank or still the last base's
function fillFromBase(prev){
  const g = id=>document.getElementById(id), b = equipmentByName(g('if_base').value), was = prev ? equipmentByName(prev) : null;
  const type = g('if_type');
  if(b){ if(![...type.options].some(o=>o.value === b.type)) type.add(new Option(b.type)); type.value = b.type; }
  type.disabled = !!b;
  [['if_cost', 'cost'], ['if_weight', 'weight']].forEach(([id, k])=>{
    const f = g(id); if(f.value === '' || (was && String(was[k] ?? '') === f.value)) f.value = b ? (b[k] ?? '') : '';
  });
}
document.addEventListener('focusin', e=>{ if(itemForm && e.target.id === 'if_base') itemForm.prevBase = e.target.value; });
document.addEventListener('change', e=>{
  if(!itemForm || (e.target.id !== 'if_type' && e.target.id !== 'if_base')) return;
  if(e.target.id === 'if_base'){ fillFromBase(itemForm.prevBase || ''); itemForm.prevBase = e.target.value; }
  drawItemFormWeapon();
});
