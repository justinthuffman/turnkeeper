/* ---------- V5: Inventory, Equipment, and attacks from equipped weapons ----------
   Inventory  line items (Item, Type, Cost, Weight, Attributes, Notes, Qty) from the 2014 lists
              (js/data/equipment.js) or the campaign's custom items. A name that isn't on either
              list opens "New item": it's saved for the whole campaign (campaigns/<c>/items), so
              anyone can pick it later (Grun's Greataxe), but only added to this character.
   Equipment  melee and ranged slot pairs (Left, Right), armor, and a shield (which fills a melee
              hand). Two-handed weapons fill both slots of their pair; a versatile weapon held in
              both melee hands uses its bigger die.
   Attacks    worked out from equipped weapons by the 2014 rules: Strength for melee, Dexterity for
              ranged, the better for finesse; proficiency (class, race, or the Proficiencies list)
              on the attack roll; damage = the die + the same modifier. With nothing equipped, the
              character's imported attacks are used.
   Effects    "On hit" (on the target) and "While equipped" (on the wielder). The standard
              conditions and the tracker's magic statuses are always listed; custom ones
              (Bleeding: 2 slashing every turn until healed) are saved for the campaign
              (campaigns/<c>/effectDefs). A standard status worn "While equipped" is switched on
              in Status while the item is equipped.
   Saved with the character: kv "inv:@" {items:[{id, name, qty, notes, attuned}]} and "equip:@"
   {melee:{L, R}, ranged:{L, R}, armor, shield, applied:[status keys turned on by gear]}. */
const campaignDefs = {items:{}, effectDefs:{}};   // id → definition, from Firebase
window.tkDefsUpdate = (part, raw)=>{
  const out = {};
  Object.entries(raw || {}).forEach(([id, r])=>{ try{ const d = JSON.parse(r.json); if(d && r.name) out[id] = {...d, name:String(r.name), id, by:r.by || ''}; }catch(e){} });
  campaignDefs[part] = out;
  if(typeof csDb === 'function' && csDb()){ renderInventory(); renderEquipment(); }
};
const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
const customItems = ()=>Object.values(campaignDefs.items);
// An item's full definition: a campaign custom item (built on its base) or a standard one
function itemDef(name){
  const n = String(name || '').toLowerCase();
  const c = customItems().find(x=>x.name.toLowerCase() === n);
  if(c){ const base = c.base ? equipmentByName(c.base) : null; return {...(base || {}), ...c, custom:true, baseName:c.base || ''}; }
  return equipmentByName(name);
}
const isWeapon = d=>!!(d && d.type === 'Weapon' && d.category);
const isArmor = d=>!!(d && d.type === 'Armor');
const isShield = d=>!!(d && d.type === 'Shield');

/* Inventory and equipment, saved with the character */
const invKey = ()=>`dndTracker:inv:${currentCharId}`, equipKey = ()=>`dndTracker:equip:${currentCharId}`;
function readJSON(key, fallback){ try{ return JSON.parse(storageGet(key) || 'null') || fallback; }catch(e){ return fallback; } }
const invItems = ()=>readJSON(invKey(), {items:[]}).items || [];
const saveInv = items=>storageSet(invKey(), JSON.stringify({items}));
const equipState = ()=>({melee:{}, ranged:{}, applied:[], ...readJSON(equipKey(), {})});
const saveEquip = e=>storageSet(equipKey(), JSON.stringify(e));
const newId = ()=>'i' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

/* ---------- Proficiencies (2014): class and race, plus the Proficiencies list ---------- */
const CLASS_PROFS = {
  barbarian:{weapons:['simple', 'martial'], armor:['light', 'medium', 'shields']},
  bard:{weapons:['simple', 'Hand Crossbow', 'Longsword', 'Rapier', 'Shortsword'], armor:['light']},
  cleric:{weapons:['simple'], armor:['light', 'medium', 'shields']},
  druid:{weapons:['Club', 'Dagger', 'Dart', 'Javelin', 'Mace', 'Quarterstaff', 'Scimitar', 'Sickle', 'Sling', 'Spear'], armor:['light', 'medium', 'shields']},
  fighter:{weapons:['simple', 'martial'], armor:['light', 'medium', 'heavy', 'shields']},
  monk:{weapons:['simple', 'Shortsword'], armor:[]},
  paladin:{weapons:['simple', 'martial'], armor:['light', 'medium', 'heavy', 'shields']},
  ranger:{weapons:['simple', 'martial'], armor:['light', 'medium', 'shields']},
  rogue:{weapons:['simple', 'Hand Crossbow', 'Longsword', 'Rapier', 'Shortsword'], armor:['light']},
  sorcerer:{weapons:['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light Crossbow'], armor:[]},
  warlock:{weapons:['simple'], armor:['light']},
  wizard:{weapons:['Dagger', 'Dart', 'Sling', 'Quarterstaff', 'Light Crossbow'], armor:[]},
};
const RACE_PROFS = {
  elf:{weapons:['Longsword', 'Shortsword', 'Shortbow', 'Longbow']}, woodelf:{weapons:['Longsword', 'Shortsword', 'Shortbow', 'Longbow']},
  drow:{weapons:['Rapier', 'Shortsword', 'Hand Crossbow']},
};
function profSet(kind){
  const out = new Set();
  const add = list=>(list || []).forEach(x=>out.add(String(x).toLowerCase().replace(/ (weapons|armor)$/, '')));
  add((CLASS_PROFS[cf.classKey] || {})[kind]); add((RACE_PROFS[rt.raceKey] || {})[kind]);
  add(((currentCore && currentCore.profs) || {})[kind === 'weapons' ? 'weapons' : 'armor']);
  add(featProfGrants()[kind]);   // Weapon Master, Lightly/Moderately/Heavily Armored
  return out;
}
// What class, race and feats give, for the Proficiencies panel ("From your class: …")
function grantedProfs(){
  const cap = s=>String(s)[0].toUpperCase() + String(s).slice(1);
  const words = list=>(list || []).map(x=>x === 'simple' || x === 'martial' ? cap(x) + ' weapons' : ['light', 'medium', 'heavy'].includes(x) ? cap(x) + ' armor' : x === 'shields' ? 'Shields' : x);
  const cls = CLASS_PROFS[cf.classKey] || {}, race = RACE_PROFS[rt.raceKey] || {}, feats = featProfGrants();
  return [
    ['Your class', [...words(cls.armor), ...words(cls.weapons)]],
    ['Your race', [...words(race.armor), ...words(race.weapons)]],
    ['Feats', [...words(feats.armor), ...feats.weapons, ...feats.skills, ...feats.tools, ...feats.languages]],
  ].filter(([, l])=>l.length);
}
function weaponProficient(w){
  const s = profSet('weapons'), base = (w.baseName || w.name || '').toLowerCase();
  return s.has(w.martial ? 'martial' : 'simple') || s.has(base) || s.has(base + 's') || s.has(String(w.name).toLowerCase());
}
const armorProficient = d=>profSet('armor').has(isShield(d) ? 'shields' : d.category);

/* ---------- Equipped slots ---------- */
const handLabel = h=>h === 'L' ? 'Left' : 'Right';
function equippedList(){
  const e = equipState(), items = invItems(), out = [], seen = new Set();
  const push = (slot, id)=>{ const it = items.find(x=>x.id === id); if(it && !seen.has(slot + id)){ seen.add(slot + id); out.push({slot, it, def:itemDef(it.name)}); } };
  ['L', 'R'].forEach(h=>{ if(e.melee[h]) push('melee', e.melee[h]); if(e.ranged[h]) push('ranged', e.ranged[h]); });
  if(e.armor) push('armor', e.armor);
  if(e.shield) push('shield', e.shield);
  return out;
}
// Hands a melee weapon is held in (1 or 2): two-handed, or one item in both melee hands
function handsFor(e, pair, id){ return (e[pair].L === id && e[pair].R === id) ? 2 : 1; }
function equipItem(id, slot, hand){
  const e = equipState(), it = invItems().find(x=>x.id === id), d = it && itemDef(it.name); if(!d) return;
  // Empty a hand. Whatever held it comes off: a two-handed (or two-hand-held) item frees both
  // hands, and a shield in a melee hand comes off its shield slot too.
  const freeHand = (pair, h)=>{
    const x = e[pair][h]; if(!x) return;
    if(e[pair].L === x && e[pair].R === x){ delete e[pair].L; delete e[pair].R; } else delete e[pair][h];
    if(pair === 'melee' && x === e.shield){ delete e.shield; delete e.shieldHand; }
  };
  unequipQuiet(id, e);
  if(slot === 'armor') e.armor = id;
  else if(slot === 'shield'){ freeHand('melee', hand); e.shield = id; e.shieldHand = hand; e.melee[hand] = id; }
  else if(d.twoHanded || hand === 'both'){ freeHand(slot, 'L'); freeHand(slot, 'R'); e[slot].L = id; e[slot].R = id; }
  else { freeHand(slot, hand); e[slot][hand] = id; }
  saveEquip(e); afterGearChange();
}
function unequip(id){ unequipQuiet(id); afterGearChange(); }
// Redraw everything that depends on gear (attacks, AC, statuses worn while equipped)
function afterGearChange(){ const y = scrollY; applyCore(currentCore, currentCharId); scrollTo(0, y); }

/* ---------- Attacks from equipped weapons ---------- */
function weaponAttackFor(it, d, hands, scores){
  const mod = a=>abilityMod(scores[a] ?? 10);
  const abil = d.finesse ? (mod('dex') >= mod('str') ? 'dex' : 'str') : d.ranged ? 'dex' : 'str';
  const m = mod(abil), magic = parseInt(d.magic, 10) || 0, prof = weaponProficient(d);
  const dice = hands === 2 && d.versatile ? d.versatile : d.dice;
  const props = weaponPropsText(d);
  const kind = `${d.martial ? 'Martial' : 'Simple'} ${d.melee ? 'Melee' : 'Ranged'} Weapon Attack.`;
  const dmg = dice ? (/d/.test(dice) ? `${dice}${m + magic ? fmtMod(m + magic) : ''}` : String(Math.max(0, (parseInt(dice, 10) || 0) + m + magic))) : '0';
  return {
    name: it.name + (hands === 2 && d.versatile ? ' (two hands)' : ''),
    bonus: fmtMod(m + (prof ? proficiencyBonus() : 0) + magic),
    damage: `${dmg} ${d.dmgType || ''} · ${kind}${props ? ' ' + props : ''}`.replace(/\s+·/, ' ·'),
    onHit: effectsFor(d.onHit), notProficient: !prof, itemId: it.id,
  };
}
// The attacks for the page (state.attacks), from the record's base scores (feats are added later)
function equippedAttacks(core){
  if(!csDb()) return null;
  const e = equipState(), items = invItems(), out = [], done = new Set();
  ['melee', 'ranged'].forEach(pair=>['R', 'L'].forEach(h=>{
    const id = e[pair][h]; if(!id || done.has(id) || id === e.shield) return; done.add(id);
    const it = items.find(x=>x.id === id), d = it && itemDef(it.name);
    if(isWeapon(d)) out.push(weaponAttackFor(it, d, pair === 'melee' ? handsFor(e, pair, id) : (d.twoHanded ? 2 : 1), core.scores || {}));
  }));
  return out.length ? out : null;
}

/* ---------- Armor Class from equipped armor and shield (2014) ---------- */
function equippedAC(core){
  if(!csDb()) return null;
  const e = equipState(), items = invItems(), get = id=>{ const it = items.find(x=>x.id === id); return it ? itemDef(it.name) : null; };
  const armor = e.armor ? get(e.armor) : null, shield = e.shield ? get(e.shield) : null;
  if(!armor && !shield) return null;
  const dex = abilityMod((core.scores || {}).dex ?? 10);
  let ac = armor ? armor.ac + (armor.dex ? (armor.dexMax != null ? Math.min(dex, armor.dexMax) : dex) : 0) + (parseInt(armor.magic, 10) || 0) : 10 + dex;
  if(shield) ac += 2 + (parseInt(shield.magic, 10) || 0);
  return ac;
}

/* ---------- Effects: standard statuses, and the campaign's custom ones ---------- */
const effectList = ()=>[
  ...STATUS_DEFS.map(s=>({name:s.name, key:s.key, standard:true, desc:s.desc})),
  ...Object.values(campaignDefs.effectDefs).map(d=>({...d, custom:true, desc:effectText(d)})),
];
function effectText(d){
  const parts = [];
  if(d.dmg) parts.push(`${d.dmg} ${d.dmgType || ''} damage${d.freq === 'turn' ? ' at the start of each of its turns' : d.freq === 'once' ? ' once' : ''}`.replace(/\s+/g, ' '));
  if(d.duration) parts.push(d.duration === 'healed' ? 'until healed' : d.duration === 'removed' ? 'until removed' : d.duration);
  if(d.endKind && d.endWhat) parts.push(`ends on a DC ${d.endDC || '?'} ${d.endWhat} ${d.endKind}`);
  if(d.desc) parts.push(d.desc);
  return parts.join('; ');
}
const effectsFor = names=>(names || []).map(n=>effectList().find(x=>x.name === n)).filter(Boolean);

// A standard status worn "While equipped" is switched on in Status while its item is equipped
function syncGearStatuses(){
  if(!csDb()) return;
  const e = equipState(), want = new Set();
  equippedList().forEach(({def})=>effectsFor(def && def.whileEquipped).forEach(x=>{ if(x.standard && STATUS_BY_KEY[x.key]) want.add(x.key); }));
  const st = statusState(); let changed = false;
  want.forEach(k=>{ if(!st.on[k]){ st.on[k] = true; changed = true; } });
  (e.applied || []).forEach(k=>{ if(!want.has(k) && st.on[k]){ delete st.on[k]; changed = true; } });
  const applied = [...want];
  if(JSON.stringify(applied) !== JSON.stringify(e.applied || [])){ e.applied = applied; saveEquip(e); }
  if(changed){ saveTrack(); renderStatus(); renderResources(); }
}

/* ---------- Inventory panel ---------- */
const weightOn = ()=>campaignTracks('weight');
function itemAttrs(d, it){
  if(!d) return '';
  if(isWeapon(d)) return [d.dice && `${d.dice} ${d.dmgType}`, weaponPropsText(d), d.magic && `+${d.magic} magic`].filter(Boolean).join('; ');
  if(isArmor(d)) return [`AC ${d.ac}${d.dex ? (d.dexMax != null ? ` + Dex (max ${d.dexMax})` : ' + Dex') : ''}`, d.str && `Str ${d.str}`, d.stealthDis && 'stealth disadvantage', d.magic && `+${d.magic} magic`].filter(Boolean).join('; ');
  if(isShield(d)) return `+${2 + (parseInt(d.magic, 10) || 0)} AC`;
  return d.attrs || '';
}
// "Equipped: Right hand" next to an item in the list (equipping is done in Equipment above)
function equippedTag(it, e){
  const where = [];
  if(e.armor === it.id) where.push('worn');
  ['melee', 'ranged'].forEach(p=>{ const hs = ['L', 'R'].filter(h=>e[p][h] === it.id); if(hs.length) where.push(hs.length === 2 ? 'both hands' : HAND_NAME[hs[0]].toLowerCase()); });
  return where.length ? `<div class="inv-tag">Equipped: ${where.join(', ')}</div>` : '';
}
function equipButtons(it, d, e){
  if(isArmor(d)) return e.armor === it.id ? `<button type="button" class="chip-btn on" data-unequip="${it.id}">Worn</button>` : `<button type="button" class="chip-btn" data-equip="${it.id}" data-slot="armor">Wear</button>`;
  if(isShield(d)) return e.shield === it.id ? `<button type="button" class="chip-btn on" data-unequip="${it.id}">Shield (${handLabel(e.shieldHand)})</button>`
    : ['L', 'R'].map(h=>`<button type="button" class="chip-btn" data-equip="${it.id}" data-slot="shield" data-hand="${h}">${handLabel(h)} hand</button>`).join('');
  if(!isWeapon(d)) return '';
  const pair = d.melee ? 'melee' : 'ranged', where = ['L', 'R'].filter(h=>e[pair][h] === it.id);
  if(where.length) return `<button type="button" class="chip-btn on" data-unequip="${it.id}">${where.length === 2 ? 'Both hands' : handLabel(where[0]) + ' hand'}</button>`;
  if(d.twoHanded) return `<button type="button" class="chip-btn" data-equip="${it.id}" data-slot="${pair}" data-hand="both">Equip (both hands)</button>`;
  return ['L', 'R'].map(h=>`<button type="button" class="chip-btn" data-equip="${it.id}" data-slot="${pair}" data-hand="${h}">${handLabel(h)}</button>`).join('')
    + (d.versatile && d.melee ? `<button type="button" class="chip-btn" data-equip="${it.id}" data-slot="${pair}" data-hand="both" title="Versatile: ${d.versatile} in two hands">Both</button>` : '');
}
// The list in groups by type (Weapons, Armor, Adventuring Gear, Tools…), each sorted by name
const INV_GROUP_ORDER = ['Weapons', 'Armor', 'Shields', 'Ammunition', 'Potions', 'Adventuring Gear', 'Equipment Packs', 'Tools', 'Spellcasting Focuses', 'Gemstones', 'Magic Items', 'Treasure', 'Other'];
function invGroupOf(d){
  const t = (d && d.type) || 'Other';
  if(t === 'Weapon') return 'Weapons';
  if(t === 'Shield') return 'Shields';
  if(t === 'Potion') return 'Potions';
  if(t === 'Equipment Pack') return 'Equipment Packs';
  if(t === 'Gemstone') return 'Gemstones';
  if(t === 'Magic Item') return 'Magic Items';
  if(/Tool|Gaming Set|Musical Instrument/.test(t)) return 'Tools';
  if(/Focus|Holy Symbol/.test(t)) return 'Spellcasting Focuses';
  return INV_GROUP_ORDER.includes(t) ? t : (t === 'Adventuring Gear' ? t : 'Other');
}
function invGroups(items){
  const groups = {};
  items.forEach(it=>{ const g = invGroupOf(itemDef(it.name)); (groups[g] = groups[g] || []).push(it); });
  return Object.keys(groups).sort((a, b)=>INV_GROUP_ORDER.indexOf(a) - INV_GROUP_ORDER.indexOf(b))
    .map(g=>[g, groups[g].sort((a, b)=>a.name.localeCompare(b.name))]);
}
function renderInventory(){
  const panel = document.getElementById('invPanel'); if(!panel) return;
  panel.hidden = !csDb(); if(!csDb()) return;
  const items = invItems(), e = equipState(), w = weightOn();
  const names = [...new Set([...customItems().map(x=>x.name), ...EQUIPMENT.map(x=>x.name)])];
  document.getElementById('invNames').innerHTML = names.map(n=>`<option value="${csEsc(n)}"></option>`).join('');
  const total = items.reduce((n, it)=>{ const d = itemDef(it.name); return n + (d && d.weight ? d.weight * (it.qty || 1) : 0); }, 0);
  document.getElementById('invTotals').textContent = items.length ? `${items.length} item${items.length === 1 ? '' : 's'}${w ? ` · ${Math.round(total * 100) / 100} lb carried` : ''}` : '';
  document.getElementById('invTable').innerHTML = items.length ? `<table class="inv"><thead><tr><th>Item</th><th>Type</th><th>Cost</th>${w ? '<th>Weight</th>' : ''}<th>Attributes</th><th>Notes</th><th>Qty</th><th></th></tr></thead><tbody>`
    + invGroups(items).map(([group, list])=>`<tr class="inv-group"><th colspan="${w ? 8 : 7}">${csEsc(group)}</th></tr>` + list.map(it=>{
      const d = itemDef(it.name) || {type:'Other', cost:'', weight:0};
      const fx = [...effectsFor(d.onHit).map(x=>`On hit: ${x.name}`), ...effectsFor(d.whileEquipped).map(x=>`While equipped: ${x.name}`)];
      return `<tr><td><b>${csEsc(it.name)}</b>${d.custom ? ` <small class="inv-custom" title="A custom item for this campaign${d.baseName ? ', built on a ' + csEsc(d.baseName) : ''}">custom</small>` : ''}${d.attune ? ` <label class="inv-attune"><input type="checkbox" data-attune="${it.id}"${it.attuned ? ' checked' : ''}> attuned</label>` : ''}${equippedTag(it, e)}</td>`
        + `<td>${csEsc(d.type)}</td><td>${csEsc(d.cost)}</td>${w ? `<td>${d.weight ? d.weight + ' lb' : '—'}</td>` : ''}`
        + `<td>${csEsc(itemAttrs(d, it))}${fx.length ? `<div class="inv-fx">${fx.map(csEsc).join('<br>')}</div>` : ''}${d.notes ? `<div class="inv-defnote">${csEsc(d.notes)}</div>` : ''}</td>`
        + `<td><input type="text" class="inv-note" data-inv-note="${it.id}" value="${csEsc(it.notes || '')}" placeholder="Your notes" aria-label="Notes for ${csEsc(it.name)}"></td>`
        + `<td>${isWeapon(d) || isArmor(d) || isShield(d) ? '<span class="cs-none">—</span>' : `<input type="number" class="inv-qty" data-inv-qty="${it.id}" min="0" value="${it.qty ?? 1}" aria-label="How many ${csEsc(it.name)}">`}</td>`
        + `<td>${d.custom ? `<button type="button" class="sel-toggle" data-edit-item="${csEsc(d.id)}">Edit</button> ` : ''}<button type="button" class="sel-toggle" data-inv-del="${it.id}" aria-label="Remove ${csEsc(it.name)}">Remove</button></td></tr>`;
    }).join('')).join('') + `</tbody></table>`
    : `<p class="cs-none">Nothing yet. Type an item's name above (from the Player's Handbook lists, or anything new), then Add.</p>`;
}
function addToInventory(name, qty){
  const items = invItems(), n = Math.max(1, parseInt(qty, 10) || 1);
  const same = items.find(x=>x.name.toLowerCase() === name.toLowerCase() && !isWeapon(itemDef(x.name)) && !isArmor(itemDef(x.name)) && !isShield(itemDef(x.name)));
  if(same) same.qty = (same.qty || 1) + n;   // stack plain gear; weapons and armor stay separate (each can be equipped)
  else items.push({id:newId(), name:(itemDef(name) || {name}).name || name, qty:n, notes:''});
  saveInv(items); renderInventory(); renderEquipment();   // the Equipment dropdowns list the inventory
}
document.addEventListener('click', e=>{
  const t = e.target.closest && e.target.closest('button'); if(!t || !csDb()) return;
  if(t.id === 'invAddBtn'){
    const input = document.getElementById('invName'), name = input.value.trim().slice(0, 80); if(!name) return;
    if(itemDef(name)){ addToInventory(name, document.getElementById('invQty').value); input.value = ''; document.getElementById('invQty').value = 1; input.focus(); }
    else openItemForm({name}, true);
  }
  else if(t.dataset.invDel){ const id = t.dataset.invDel; unequipQuiet(id); saveInv(invItems().filter(x=>x.id !== id)); afterGearChange(); }
  else if(t.dataset.equip) equipItem(t.dataset.equip, t.dataset.slot, t.dataset.hand);
  else if(t.dataset.unequip) unequip(t.dataset.unequip);
  else if(t.dataset.editItem){ const d = campaignDefs.items[t.dataset.editItem]; if(d) openItemForm(d, false); }
  else if(t.id === 'itemSave') saveItemForm();
  else if(t.id === 'itemCancel') closeItemForm();
  else if(t.id === 'fxNewBtn') openEffectForm();
  else if(t.id === 'fxSave') saveEffectForm();
  else if(t.id === 'fxCancel') document.getElementById('fxForm').hidden = true;
  else if(t.dataset.fxAdd){ itemFormFx(t.dataset.fxAdd); }
  else if(t.dataset.fxDel){ const [list, i] = t.dataset.fxDel.split(':'); itemForm[list].splice(+i, 1); drawItemFormFx(); }
});
// Take an item out of every slot (pass an equip state to change it without saving)
function unequipQuiet(id, state){
  const e = state || equipState();
  ['melee', 'ranged'].forEach(p=>['L', 'R'].forEach(h=>{ if(e[p][h] === id) delete e[p][h]; }));
  if(e.armor === id) delete e.armor;
  if(e.shield === id){ delete e.shield; delete e.shieldHand; }
  if(!state) saveEquip(e);
}
document.addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.id === 'invName'){ e.preventDefault(); document.getElementById('invAddBtn').click(); } });
document.addEventListener('change', e=>{
  const t = e.target; if(!csDb() || !t.dataset) return;
  if(t.dataset.invNote || t.dataset.invQty || t.dataset.attune){
    const items = invItems(), it = items.find(x=>x.id === (t.dataset.invNote || t.dataset.invQty || t.dataset.attune)); if(!it) return;
    if(t.dataset.invNote) it.notes = t.value.slice(0, 300);
    if(t.dataset.invQty) it.qty = Math.max(0, parseInt(t.value, 10) || 0);
    if(t.dataset.attune){
      if(t.checked && items.filter(x=>x.attuned).length >= 3){ t.checked = false; csFlash('You can be attuned to at most three magic items at once.', true); return; }
      it.attuned = t.checked;
    }
    saveInv(items); if(t.dataset.attune) renderInventory();
  }
});

/* ---------- New or edited custom item (saved for the whole campaign) ---------- */
let itemForm = null;
function openItemForm(d, isNew){
  itemForm = {id:d.id || null, isNew, onHit:[...(d.onHit || [])], whileEquipped:[...(d.whileEquipped || [])]};
  const f = document.getElementById('itemForm'); f.hidden = false;
  const types = ITEM_TYPES, bases = [...WEAPONS, ...ARMOR].map(x=>x.name);
  f.innerHTML = `<div class="cs-sub">${isNew ? 'New item for the campaign' : 'Edit ' + csEsc(d.name)}</div>`
    + `<p class="cs-none">${isNew ? `“${csEsc(d.name)}” isn’t on the lists yet. Describe it once and everyone in the campaign can pick it.` : 'Changes show for everyone in the campaign.'}</p>`
    + `<div class="cs-grid">`
    + `<label class="cs-field"><span>Name</span><input id="if_name" type="text" maxlength="80" value="${csEsc(d.name)}"></label>`
    + `<label class="cs-field"><span>Type</span><select id="if_type">${types.map(t=>`<option${t === (d.type || 'Adventuring Gear') ? ' selected' : ''}>${csEsc(t)}</option>`).join('')}</select></label>`
    + `<label class="cs-field"><span>Built on (weapons and armor)</span><select id="if_base"><option value="">—</option>${bases.map(b=>`<option${b === (d.base || '') ? ' selected' : ''}>${csEsc(b)}</option>`).join('')}</select></label>`
    + `<label class="cs-field"><span>Cost</span><input id="if_cost" type="text" maxlength="30" value="${csEsc(d.cost || '')}" placeholder="e.g. 150 gp"></label>`
    + `<label class="cs-field"><span>Weight (lb)</span><input id="if_weight" type="number" min="0" step="any" value="${d.weight ?? ''}"></label>`
    + `<label class="cs-field"><span>Magic bonus (+ to hit and damage, or AC)</span><input id="if_magic" type="number" min="0" max="5" value="${d.magic || ''}"></label>`
    + `<label class="cs-field cs-wide"><span>Attributes</span><input id="if_attrs" type="text" maxlength="200" value="${csEsc(d.attrs || '')}" placeholder="Anything special about it"></label>`
    + `<label class="cs-field cs-wide"><span>Notes</span><textarea id="if_notes" rows="2" maxlength="1000">${csEsc(d.notes || '')}</textarea></label>`
    + `<label class="cs-check"><input type="checkbox" id="if_attune"${d.attune ? ' checked' : ''}> Requires attunement</label>`
    + `</div><div id="ifWeapon"></div><div id="itemFormFx"></div>`
    + `<div class="cs-add" style="max-width:none;"><button type="button" class="chip-btn" id="itemSave">${isNew ? 'Save and add to inventory' : 'Save'}</button><button type="button" class="chip-btn" id="itemCancel">Cancel</button></div>`;
  itemForm.weapon = d;
  drawItemFormWeapon();
  drawItemFormFx();
  f.scrollIntoView({block:'nearest'});
}
/* A weapon's own stats in the item form: what it inherits when it's built on a standard weapon,
   or its own (melee or ranged, simple or martial, damage, one-handed / two-handed / versatile,
   finesse, light, reach, range) when it isn't */
function drawItemFormWeapon(){
  const box = document.getElementById('ifWeapon'); if(!box || !itemForm) return;
  const base = document.getElementById('if_base').value, baseDef = base ? equipmentByName(base) : null;
  const type = baseDef ? baseDef.type : document.getElementById('if_type').value;
  if(baseDef){ box.innerHTML = `<p class="cs-none">Built on a ${csEsc(baseDef.name)}: ${csEsc(itemAttrs(baseDef))}.</p>`; return; }
  if(type !== 'Weapon'){ box.innerHTML = ''; return; }
  const w = itemForm.weapon || {}, hands = w.twoHanded ? 'two' : w.versatile ? 'versatile' : 'one';
  const opt = (v, l, cur)=>`<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`;
  box.innerHTML = `<div class="cs-sub">Weapon</div><div class="cs-grid">`
    + `<label class="cs-field"><span>Kind</span><select id="iw_cat">${['simple melee', 'martial melee', 'simple ranged', 'martial ranged'].map(c=>opt(c, c[0].toUpperCase() + c.slice(1), w.category || 'martial melee')).join('')}</select></label>`
    + `<label class="cs-field"><span>Damage dice</span><input id="iw_dice" type="text" maxlength="12" value="${csEsc(w.dice || '1d8')}"></label>`
    + `<label class="cs-field"><span>Damage type</span><select id="iw_type">${DAMAGE_TYPES.map(t=>opt(t, t, w.dmgType || 'slashing')).join('')}</select></label>`
    + `<label class="cs-field"><span>Hands</span><select id="iw_hands">${opt('one', 'One-handed', hands)}${opt('two', 'Two-handed', hands)}${opt('versatile', 'Versatile (one or two)', hands)}</select></label>`
    + `<label class="cs-field"><span>Two-handed damage (versatile)</span><input id="iw_vers" type="text" maxlength="12" value="${csEsc(w.versatile || '')}" placeholder="e.g. 1d10"></label>`
    + `<label class="cs-field"><span>Range (thrown or ranged)</span><input id="iw_range" type="text" maxlength="12" value="${csEsc(w.range || '')}" placeholder="e.g. 20/60"></label>`
    + `</div><div class="cs-checks">${[['finesse', 'Finesse'], ['light', 'Light'], ['heavy', 'Heavy'], ['reach', 'Reach'], ['thrown', 'Thrown'], ['loading', 'Loading'], ['ammunition', 'Ammunition']]
      .map(([k, l])=>`<label class="cs-check"><input type="checkbox" id="iw_${k}"${w[k] ? ' checked' : ''}> ${l}</label>`).join('')}</div>`;
}
document.addEventListener('change', e=>{ if(itemForm && (e.target.id === 'if_type' || e.target.id === 'if_base')) drawItemFormWeapon(); });
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
  const list = (key, label, hint)=>`<div class="cs-sub">${label}</div><p class="cs-none">${hint}</p><div class="cs-chips">${itemForm[key].length ? itemForm[key].map((n, i)=>`<span class="cs-chip">${csEsc(n)}<button type="button" data-fx-del="${key}:${i}" aria-label="Remove ${csEsc(n)}">&times;</button></span>`).join('') : '<span class="cs-none">None</span>'}</div>`
    + `<div class="cs-add"><input type="text" list="fxNames" id="fxIn_${key}" placeholder="Pick an effect…" aria-label="${label}"><button type="button" class="chip-btn" data-fx-add="${key}">Add</button></div>`;
  box.innerHTML = `<datalist id="fxNames">${names.map(n=>`<option value="${csEsc(n)}"></option>`).join('')}</datalist>`
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
  const wt = parseFloat(v('if_weight')); if(!isNaN(wt)) def.weight = wt; else if(baseDef) def.weight = baseDef.weight;
  if(!def.cost && baseDef) def.cost = baseDef.cost;
  if(!baseDef && def.type === 'Weapon') Object.assign(def, readItemFormWeapon() || {});
  const clash = customItems().find(x=>x.name.toLowerCase() === name.toLowerCase() && x.id !== itemForm.id) || (!itemForm.id && equipmentByName(name));
  if(clash){ csFlash(`There’s already an item called ${name}.`, true); return; }
  const id = itemForm.id || newId();
  try{
    await (await tkDbReady()).saveDef(charStore.campaign, 'items', id, name, def, savedName(currentCharId));
    campaignDefs.items[id] = {...def, name, id};   // show it now; the database update follows
    const wasNew = itemForm.isNew; closeItemForm();
    if(wasNew){ addToInventory(name, 1); document.getElementById('invName').value = ''; }
    afterGearChange();
  }catch(err){ csFlash('Couldn’t save the item: ' + err.message, true); }
}
function closeItemForm(){ itemForm = null; const f = document.getElementById('itemForm'); f.hidden = true; f.innerHTML = ''; }

/* ---------- New custom effect (saved for the whole campaign) ---------- */
let fxFor = null;
function openEffectForm(name, forList){
  fxFor = forList || null;
  const f = document.getElementById('fxForm'); f.hidden = false;
  f.innerHTML = `<div class="cs-sub">New effect for the campaign</div><div class="cs-grid">`
    + `<label class="cs-field"><span>Name</span><input id="xf_name" type="text" maxlength="60" value="${csEsc(name || '')}" placeholder="e.g. Bleeding"></label>`
    + `<label class="cs-field"><span>Damage (dice or number)</span><input id="xf_dmg" type="text" maxlength="20" placeholder="e.g. 2 or 1d4"></label>`
    + `<label class="cs-field"><span>Damage type</span><select id="xf_type"><option value=""></option>${DAMAGE_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></label>`
    + `<label class="cs-field"><span>How often</span><select id="xf_freq"><option value="turn">Every turn (start of its turn)</option><option value="once">Once</option><option value="">No damage</option></select></label>`
    + `<label class="cs-field"><span>Lasts</span><select id="xf_dur"><option value="healed">Until healed</option><option value="1 minute (10 turns)">1 minute (10 turns)</option><option value="removed">Until removed</option><option value="custom">Other…</option></select></label>`
    + `<label class="cs-field"><span>Other duration</span><input id="xf_durText" type="text" maxlength="60" placeholder="e.g. 3 turns"></label>`
    + `<label class="cs-field"><span>Ends early on a</span><select id="xf_endKind"><option value="">—</option><option value="save">Saving throw</option><option value="check">Check</option></select></label>`
    + `<label class="cs-field"><span>Using (ability or skill)</span><input id="xf_endWhat" type="text" list="xfWhat" maxlength="30" placeholder="e.g. Constitution, Athletics"><datalist id="xfWhat">${[...Object.values(ABILITY_FULL), ...Object.keys(SKILL_ABILITY)].map(x=>`<option value="${x}"></option>`).join('')}</datalist></label>`
    + `<label class="cs-field"><span>DC</span><input id="xf_dc" type="number" min="1" max="30"></label>`
    + `<label class="cs-field cs-wide"><span>Description (optional)</span><input id="xf_desc" type="text" maxlength="200"></label>`
    + `</div><div class="cs-add" style="max-width:none;"><button type="button" class="chip-btn" id="fxSave">Save effect</button><button type="button" class="chip-btn" id="fxCancel">Cancel</button></div>`;
  document.getElementById(name ? 'xf_dmg' : 'xf_name').focus();
}
async function saveEffectForm(){
  const v = id=>document.getElementById(id).value.trim();
  const name = v('xf_name').slice(0, 60); if(!name){ document.getElementById('xf_name').focus(); return; }
  if(effectList().some(x=>x.name.toLowerCase() === name.toLowerCase())){ csFlash(`There’s already an effect called ${name}.`, true); return; }
  const dur = v('xf_dur') === 'custom' ? v('xf_durText') : v('xf_dur');
  const def = {dmg:v('xf_dmg'), dmgType:v('xf_type'), freq:v('xf_dmg') ? v('xf_freq') : '', duration:dur, endKind:v('xf_endKind'), endWhat:v('xf_endWhat'), endDC:parseInt(v('xf_dc'), 10) || null, desc:v('xf_desc')};
  const id = newId();
  try{
    await (await tkDbReady()).saveDef(charStore.campaign, 'effectDefs', id, name, def, savedName(currentCharId));
    campaignDefs.effectDefs[id] = {...def, name, id};
    document.getElementById('fxForm').hidden = true;
    if(itemForm && fxFor && !itemForm[fxFor].includes(name)) itemForm[fxFor].push(name);
    drawItemFormFx();
  }catch(err){ csFlash('Couldn’t save the effect: ' + err.message, true); }
}

/* ---------- Equipment (Inventory tab): Armor, Melee and Ranged dropdowns ----------
   Armor: what you wear. Melee and Ranged: your main hand first (Right unless the character is
   left-handed, in Edit Character), then your other hand, each with its attack numbers. A
   two-handed weapon in the main hand greys out the other hand; a versatile one can be held in both
   (its bigger die). Shields go in the off hand. Each dropdown lists only what's in your inventory:
   equipment is what you're wearing or holding, out of what you carry. */
const mainHand = ()=>(currentCore && currentCore.hand === 'L') ? 'L' : 'R';
const offHand = ()=>mainHand() === 'R' ? 'L' : 'R';
const HAND_NAME = {L:'Left hand', R:'Right hand'};
// Equipped armor and shield for Character Summary's Armor list (pinnable like attacks)
function equippedArmorItems(){
  if(!csDb()) return [];
  const e = equipState(), items = invItems(), out = [];
  [e.armor, e.shield].forEach(id=>{
    const it = items.find(x=>x.id === id), d = it && itemDef(it.name); if(!d) return;
    out.push({name:csEsc(it.name), desc:csEsc(itemAttrs(d)) + (armorProficient(d) ? '' : ' &middot; not proficient')});
  });
  const ac = equippedAC(currentCore);
  if(out.length && ac !== null) out[0].desc += ` &middot; AC ${ac} in total`;
  return out;
}
const slotFits = (kind, d)=>!!d && (kind === 'armor' ? isArmor(d) : kind === 'melee' ? (isWeapon(d) && d.melee)
  : kind === 'meleeOff' ? ((isWeapon(d) && d.melee) || isShield(d)) : (isWeapon(d) && d.ranged));
// A slot's dropdown: only what's in the inventory (add things in the list below first)
function slotOptions(kind, current){
  const items = invItems(), seen = {};
  const own = items.filter(it=>slotFits(kind, itemDef(it.name))).map(it=>{
    seen[it.name] = (seen[it.name] || 0) + 1;
    return {id:it.id, label:it.name + (items.filter(x=>x.name === it.name).length > 1 ? ` (${seen[it.name]})` : '')};
  });
  const none = {armor:'No armor in your inventory', ranged:'No ranged weapons in your inventory'}[kind] || 'No melee weapons in your inventory';
  return `<option value="">${own.length ? '— None —' : none}</option>` + own.map(o=>`<option value="inv:${o.id}"${o.id === current ? ' selected' : ''}>${csEsc(o.label)}</option>`).join('');
}
// The line under a slot: an armor's attributes, or a weapon's attack (the page's own attack, so
// feats and magic are included)
function slotStats(id, offhand){
  if(!id) return '';
  const it = invItems().find(x=>x.id === id), d = it && itemDef(it.name); if(!d) return '';
  if(isShield(d) || isArmor(d)) return `<div class="gear-stats">${csEsc(itemAttrs(d))}${armorProficient(d) ? '' : ' · <b>not proficient</b>'}</div>`;
  const a = state.attacks.find(x=>x.itemId === id); if(!a) return '';
  const p = parseWeaponDamage(a.damage);
  let dmg = a.damage.split(' · ')[0];
  if(offhand && p && p.mod > 0) dmg = dmg.replace(/[+]\s*\d+/, '');   // two-weapon fighting: no positive modifier on off-hand damage
  const fx = (a.onHit || []).map(x=>`On hit: ${csEsc(x.name)}`);
  return `<div class="gear-stats"><b>${csEsc(a.bonus)}</b> to hit · <b>${csEsc(dmg)}</b>${weaponPropsText(d) ? ' · ' + csEsc(weaponPropsText(d)) : ''}${a.notProficient ? ' · not proficient' : ''}`
    + (offhand ? `<div class="gear-note">Off-hand attack: a bonus action after you attack with your main hand. Two-weapon fighting needs light weapons in both hands, and adds no ability modifier to the damage unless it's negative.</div>` : '')
    + (fx.length ? `<div class="gear-note">${fx.join(' · ')}</div>` : '') + `</div>`;
}
// Proficiencies with armor or weapons, from class, race and feats ("Your class: Light armor, …")
function grantedLine(kind){
  const isArmorProf = x=>/armor|Shields/.test(x), isWeaponProf = x=>/weapons/.test(x) || WEAPONS.some(w=>w.name === x);
  return (typeof grantedProfs === 'function' ? grantedProfs() : []).map(([from, l])=>{
    const mine = l.filter(kind === 'armor' ? isArmorProf : isWeaponProf);
    return mine.length ? `${from}: ${mine.join(', ')}` : '';
  }).filter(Boolean).join(' · ');
}
function renderEquipment(){
  const panel = document.getElementById('gearPanel'); if(!panel) return;
  panel.hidden = !csDb(); if(!csDb()) return;
  const e = equipState(), mh = mainHand(), oh = offHand(), items = invItems();
  const defOf = id=>id ? itemDef((items.find(x=>x.id === id) || {}).name) : null;
  const both = pair=>!!(e[pair][mh] && e[pair][mh] === e[pair][oh]);
  const sel = (pair, which, id, kind, disabled)=>`<select data-gear="${pair}" data-which="${which}"${disabled ? ' disabled' : ''} aria-label="${pair} ${which}">${slotOptions(kind, id)}</select>`;
  const pairHtml = (pair, label)=>{
    const mainId = e[pair][mh], blocked = both(pair), offId = blocked ? null : e[pair][oh], md = defOf(mainId);
    // A versatile weapon: one hand or two (two needs the other hand free)
    const grip = pair === 'melee' && md && md.versatile && !md.twoHanded
      ? (offId ? `<div class="gear-note">Versatile: empty your other hand to hold it in two hands (${csEsc(md.versatile)}).</div>`
        : `<div class="gear-grip" role="radiogroup" aria-label="How you hold it"><label><input type="radio" name="grip_${mainId}" data-grip="${mainId}" value="1"${blocked ? '' : ' checked'}> One hand (${csEsc(md.dice)})</label>`
          + `<label><input type="radio" name="grip_${mainId}" data-grip="${mainId}" value="2"${blocked ? ' checked' : ''}> Two hands (${csEsc(md.versatile)})</label></div>`) : '';
    return `<div class="gear-group"><div class="cs-sub">${label}</div>`
      + `<div class="gear-row"><span class="gear-hand">${HAND_NAME[mh]} <small>(main)</small></span><div>${sel(pair, 'main', mainId, pair, false)}${grip}${slotStats(mainId, false)}</div></div>`
      + `<div class="gear-row${blocked ? ' gear-off' : ''}"><span class="gear-hand">${HAND_NAME[oh]}</span><div>${sel(pair, 'off', offId, pair === 'melee' ? 'meleeOff' : pair, blocked)}`
      + (blocked ? `<div class="gear-note">${csEsc(md ? md.name : 'Your weapon')} takes both hands.</div>` : slotStats(offId, !!(offId && !isShield(defOf(offId))))) + `</div></div></div>`;
  };
  const ac = equippedAC(currentCore), armor = defOf(e.armor), notes = [];
  if(armor && armor.str && (currentCore.scores || {}).str < armor.str) notes.push(`${armor.name} needs Strength ${armor.str}: your speed drops by 10 feet.`);
  if(armor && armor.stealthDis) notes.push(`${armor.name}: disadvantage on Stealth checks.`);
  if(armor && !armorProficient(armor)) notes.push(`Not proficient with ${armor.category} armor: disadvantage on Strength and Dexterity checks, saves and attacks, and you can't cast spells.`);
  equippedList().forEach(({it, def})=>effectsFor(def && def.whileEquipped).forEach(x=>notes.push(`While equipped, ${it.name}: ${x.name}${x.desc ? ' (' + x.desc + ')' : ''}.`)));
  document.getElementById('gearBody').innerHTML =
    `<div class="gear-group"><div class="cs-sub">Armor</div><div class="gear-row"><span class="gear-hand">Worn</span><div>${sel('armor', 'main', e.armor, 'armor', false)}${slotStats(e.armor)}</div></div>`
    + `<p class="eq-ac">${ac !== null ? `Armor Class: <b>${ac}</b>` : `No armor or shield: AC ${csEsc(currentCore.ac ?? '—')} (set in Edit Character).`}</p>`
    + (notes.length ? `<ul class="eq-notes">${notes.map(n=>`<li>${csEsc(n)}</li>`).join('')}</ul>` : '') + `</div>`
    + pairHtml('melee', 'Melee') + pairHtml('ranged', 'Ranged');
}
// A dropdown pick: equip it (adding it to the inventory first if it's new), or empty the slot
function newInventoryItem(name){ const items = invItems(), id = newId(); items.push({id, name, qty:1, notes:''}); saveInv(items); return id; }
document.addEventListener('change', e=>{
  const t = e.target; if(!csDb() || !t.dataset) return;
  if(t.dataset.grip){ equipItem(t.dataset.grip, 'melee', t.value === '2' ? 'both' : mainHand()); return; }
  if(!t.dataset.gear) return;
  const pair = t.dataset.gear, v = t.value;
  const id = v.startsWith('new:') ? newInventoryItem(v.slice(4)) : v.startsWith('inv:') ? v.slice(4) : null;
  const st = equipState();
  if(pair === 'armor'){
    if(st.armor) unequipQuiet(st.armor, st);
    saveEquip(st);
    if(id) equipItem(id, 'armor'); else afterGearChange();
    return;
  }
  const hand = t.dataset.which === 'main' ? mainHand() : offHand();
  if(!id){
    const x = st[pair][hand];
    if(x){
      if(st[pair].L === x && st[pair].R === x){ delete st[pair].L; delete st[pair].R; } else delete st[pair][hand];
      if(x === st.shield){ delete st.shield; delete st.shieldHand; }
    }
    saveEquip(st); afterGearChange(); return;
  }
  const d = itemDef((invItems().find(x=>x.id === id) || {}).name);
  if(isShield(d)) equipItem(id, 'shield', hand);
  else equipItem(id, pair, d && d.twoHanded ? 'both' : hand);
});

/* Armor & Weapon Proficiencies (Details tab): what class, race and feats give, plus any extras */
function renderArmsProfs(){
  const panel = document.getElementById('armsPanel'); if(!panel) return;
  panel.hidden = !csDb(); if(!csDb()) return;
  document.getElementById('armsBody').innerHTML =
    `<p class="cs-none">${csEsc(grantedLine('armor') || 'No armor proficiencies from class, race or feats.')}</p>${chipEditorHtml('armor', 'Extra armor proficiencies', profValues('armor'), ARMOR_PROFS)}`
    + `<p class="cs-none">${csEsc(grantedLine('weapons') || 'No weapon proficiencies from class, race or feats.')}</p>${chipEditorHtml('weapons', 'Extra weapon proficiencies', profValues('weapons'), [...WEAPON_PROF_GROUPS, ...WEAPONS.map(w=>w.name)])}`;
}
window.renderGear = ()=>{ renderInventory(); renderEquipment(); renderArmsProfs(); syncGearStatuses(); };
