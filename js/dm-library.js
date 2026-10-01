/* ---------- DM Screen: saved monsters and encounters ----------
   The DM's own monsters (key villains, homebrew, tweaked SRD monsters) with full stat blocks,
   and encounters (groups of saved and SRD monsters) that load into Initiative in one click.
   Saved per campaign in Firebase at campaigns/<campaign>/dm/{monsters,encounters}
   (window.dmLibraryWrite in dm.html's module script), so they follow the DM to any device.
   Uses dm.html's globals: $, esc, campaign, combat, newCombatant, saveCombat, renderInit,
   renderEncounter, addParty, logLine, setInitMsg, srdMonster, loadSrdIndex, srdIndex, crText,
   CR_XP, abilMod, rollExpr, toNum, d20, nextNumber, fmtMod, rollRow. */
let library = {monsters:{}, encounters:{}};
const LIB_MAX_ATTACKS = 12, LIB_MAX_ITEMS = 20;

// What comes back from the database is checked field by field (rendered with esc)
function cleanLibrary(raw){
  raw = raw && typeof raw === 'object' ? raw : {};
  const str = (v, n)=>typeof v === 'string' ? v.slice(0, n) : '';
  const num = v=>typeof v === 'number' && Number.isFinite(v) ? v : null;
  const list = o=>Array.isArray(o) ? o : Object.values(o && typeof o === 'object' ? o : {});
  const monsters = {}, encounters = {};
  Object.entries(raw.monsters && typeof raw.monsters === 'object' ? raw.monsters : {}).forEach(([id, m])=>{
    if(!m || typeof m !== 'object' || !str(m.name, 60)) return;
    monsters[id] = {name:str(m.name, 60), ac:num(m.ac), hp:str(m.hp, 20), init:num(m.init) ?? 0, cr:CR_XP[m.cr] !== undefined ? m.cr : '',
      srd:str(m.srd, 60), notes:str(m.notes, 2000),
      attacks:list(m.attacks).slice(0, LIB_MAX_ATTACKS).filter(a=>a && str(a.name, 60)).map(a=>({name:str(a.name, 60), hit:num(a.hit), dmg:str(a.dmg, 40), type:str(a.type, 20)}))};
  });
  Object.entries(raw.encounters && typeof raw.encounters === 'object' ? raw.encounters : {}).forEach(([id, e])=>{
    if(!e || typeof e !== 'object' || !str(e.name, 60)) return;
    encounters[id] = {name:str(e.name, 60), party:e.party === true,
      items:list(e.items).slice(0, LIB_MAX_ITEMS).filter(i=>i && (i.src === 'srd' || i.src === 'custom') && str(i.ref, 60))
        .map(i=>({src:i.src, ref:str(i.ref, 60), name:str(i.name, 60), count:Math.max(1, Math.min(30, num(i.count) || 1))}))};
  });
  return {monsters, encounters};
}
const byName = (a, b)=>a[1].name.localeCompare(b[1].name);
const srdName = index=>String(index || '').split('-').map(w=>w.charAt(0).toUpperCase() + w.slice(1)).join(' ');   // "bugbear" → "Bugbear"
const libMsg = (text, err)=>{ const m = $('libMsg'); m.textContent = text || ''; m.className = 'msg' + (err ? ' err' : ''); };
function libWrite(path, value, add){
  if(!window.dmLibraryWrite){ libMsg('Not connected: monsters and encounters can’t be saved right now.', true); return Promise.resolve(null); }
  return window.dmLibraryWrite(campaign.key, path, value, add).then(r=>r || true, err=>{ libMsg(`Couldn’t save: ${err.message}`, true); return null; });
}

/* ---------- Adding monsters to Initiative ---------- */
// One kind of monster, count of them: HP rolled from dice or fixed, initiative rolled (once for
// the group when groupInit, as the DMG allows). Used by the Add form, saved monsters and encounters.
function addMonsterGroup({base, count, ac, hp, initMod, cr, srd, custom, rollHp, groupInit}){
  count = Math.max(1, Math.min(30, count || 1));
  const shared = groupInit ? d20() + initMod : null;
  const start = nextNumber(base);
  const single = count === 1 && start === 0 && !combat.list.some(c=>c.name === base);
  for(let i = 1; i <= count; i++){
    let h;
    if(srd && rollHp && srd.obj) h = rollExpr(srd.obj.hit_points_roll || srd.obj.hit_dice) ?? srd.obj.hit_points;
    else if(/d/i.test(hp || '')) h = rollExpr(hp);    // dice: each one rolls
    else h = toNum(hp);
    combat.list.push(newCombatant({kind:'monster', name:single ? base : `${base} ${start + i}`, initMod, dex:initMod,
      init:shared ?? (d20() + initMod), ac, hp:h, max:h, srd:srd ? srd.index : null, custom:custom || null, cr}));
  }
  logLine(`Added ${count} × ${base}`);
}
function addSavedMonster(id, count){
  const m = library.monsters[id]; if(!m) return;
  addMonsterGroup({base:m.name, count, ac:m.ac, hp:m.hp, initMod:m.init, cr:m.cr || null, srd:m.srd ? {index:m.srd} : null, custom:id, groupInit:$('mGroup').checked});
}
async function loadEncounter(id){
  const e = library.encounters[id]; if(!e) return;
  libMsg(`Loading ${e.name}…`);
  const missing = [];
  for(const it of e.items){
    if(it.src === 'custom'){
      if(library.monsters[it.ref]) addSavedMonster(it.ref, it.count); else missing.push(it.name || 'a deleted monster');
    } else {
      try{
        const m = await srdMonster(it.ref);
        addMonsterGroup({base:m.name, count:it.count, ac:m.armor_class && m.armor_class[0] ? m.armor_class[0].value : null, hp:String(m.hit_points),
          initMod:abilMod(m.dexterity), cr:crText(m.challenge_rating), srd:{index:m.index, obj:m}, rollHp:$('mRollHp').checked, groupInit:$('mGroup').checked});
      }catch(err){ missing.push(it.name || it.ref); }
    }
  }
  if(e.party) addParty();
  saveCombat(); renderInit(); renderEncounter();
  libMsg(missing.length ? `Loaded ${e.name}, but couldn’t add: ${missing.join(', ')}.` : `Loaded ${e.name} into Initiative.`, !!missing.length);
  setInitMsg(`${e.name} is in Initiative with initiative rolled. Change any number by typing over it.`);
  $('initPanel').scrollIntoView({behavior:'smooth', block:'start'});
}

/* ---------- The panel ---------- */
function encounterSummary(e){
  return e.items.map(i=>`${i.count} × ${i.src === 'custom' ? (library.monsters[i.ref] ? library.monsters[i.ref].name : `${i.name} (deleted)`) : i.name}`).join(', ') + (e.party ? ', and the party' : '');
}
function renderLibrary(){
  const mons = Object.entries(library.monsters).sort(byName), encs = Object.entries(library.encounters).sort(byName);
  $('libMonsters').innerHTML = mons.length ? mons.map(([id, m])=>`<div class="lib-row" data-id="${esc(id)}">
      <div class="lib-main"><b>${esc(m.name)}</b><span class="lib-sub">${[m.cr ? `CR ${esc(m.cr)}` : '', m.ac !== null ? `AC ${m.ac}` : '', m.hp ? `HP ${esc(m.hp)}` : '', `Init ${fmtMod(m.init)}`, m.attacks.length ? `${m.attacks.length} attack${m.attacks.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}</span></div>
      <div class="lib-btns"><input type="number" class="lib-count" min="1" max="30" value="1" aria-label="How many ${esc(m.name)}"><button type="button" data-lib="add">Add</button>
        <button type="button" class="ghost" data-lib="view">Stats</button><button type="button" class="ghost" data-lib="edit">Edit</button><button type="button" class="chip-btn" data-lib="del" aria-label="Delete ${esc(m.name)}">✕</button></div></div>`).join('')
    : '<p class="lib-empty">No saved monsters yet. “New monster” makes one (you can start from an SRD monster and change it).</p>';
  $('libEncounters').innerHTML = encs.length ? encs.map(([id, e])=>`<div class="lib-row" data-id="${esc(id)}">
      <div class="lib-main"><b>${esc(e.name)}</b><span class="lib-sub">${esc(encounterSummary(e))}</span></div>
      <div class="lib-btns"><button type="button" data-lib="load">Load</button><button type="button" class="ghost" data-lib="eedit">Edit</button><button type="button" class="chip-btn" data-lib="edel" aria-label="Delete ${esc(e.name)}">✕</button></div></div>`).join('')
    : '<p class="lib-empty">No encounters yet. “New encounter” builds one, or set up Initiative and save its monsters as one.</p>';
}
$('libPanel').addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.id === 'libNewMon') return openMonsterEditor(null);
  if(b.id === 'libNewEnc') return openEncounterEditor(null);
  if(b.id === 'libSaveCurrent') return openEncounterEditor(null, encounterFromInitiative());
  const row = b.closest('.lib-row'), id = row && row.dataset.id, act = b.dataset.lib; if(!act) return;
  if(act === 'add'){
    addSavedMonster(id, toNum(row.querySelector('.lib-count').value) || 1);
    saveCombat(); renderInit(); renderEncounter();
    libMsg(`Added ${library.monsters[id].name} to Initiative.`);
  }
  else if(act === 'view') showStatBlock({name:library.monsters[id].name, custom:id, srd:library.monsters[id].srd || null});
  else if(act === 'edit') openMonsterEditor(id);
  else if(act === 'del'){ if(confirm(`Delete ${library.monsters[id].name} from your saved monsters?`)) libWrite(`monsters/${id}`, null); }
  else if(act === 'load') loadEncounter(id);
  else if(act === 'eedit') openEncounterEditor(id);
  else if(act === 'edel'){ if(confirm(`Delete the encounter ${library.encounters[id].name}?`)) libWrite(`encounters/${id}`, null); }
});

/* ---------- The editor popup (a monster or an encounter) ---------- */
let libReturnFocus = null;
function openLibPopup(title, html){
  libReturnFocus = document.activeElement;
  $('libTitle').textContent = title; $('libBody').innerHTML = html;
  const bd = $('libBackdrop'); bd.hidden = false;
  requestAnimationFrame(()=>bd.classList.add('open'));
  const first = $('libBody').querySelector('input'); if(first) first.focus();
}
function closeLibPopup(){
  const bd = $('libBackdrop'); bd.classList.remove('open');
  setTimeout(()=>{ bd.hidden = true; $('libBody').innerHTML = ''; }, 200);
  if(libReturnFocus && libReturnFocus.isConnected) libReturnFocus.focus();
}
$('libClose').addEventListener('click', closeLibPopup);
$('libBackdrop').addEventListener('click', e=>{ if(e.target === $('libBackdrop')) closeLibPopup(); });
document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && !$('libBackdrop').hidden) closeLibPopup(); });
const crOptions = cur=>'<option value="">—</option>' + Object.keys(CR_XP).map(k=>`<option value="${k}"${k === cur ? ' selected' : ''}>${k}</option>`).join('');
const attackRow = a=>`<div class="lib-attack"><input type="text" data-f="name" maxlength="60" placeholder="Attack (e.g. Morningstar)" value="${esc(a.name || '')}" aria-label="Attack name">
  <input type="number" data-f="hit" placeholder="+hit" value="${a.hit ?? ''}" aria-label="To hit bonus"><input type="text" data-f="dmg" maxlength="40" placeholder="2d8+2" value="${esc(a.dmg || '')}" aria-label="Damage dice">
  <input type="text" data-f="type" maxlength="20" placeholder="piercing" value="${esc(a.type || '')}" aria-label="Damage type"><button type="button" class="chip-btn" data-lib-x="1" aria-label="Remove this attack">✕</button></div>`;

// Monster editor
function openMonsterEditor(id, start){
  const m = start || (id ? library.monsters[id] : {name:'', ac:null, hp:'', init:0, cr:'', srd:'', notes:'', attacks:[]});
  loadSrdIndex();
  openLibPopup(id ? `Edit ${m.name}` : 'New Monster', `<form class="lib-form" id="libMonForm" data-id="${esc(id || '')}" autocomplete="off">
    <div class="lib-from"><label>Start from an SRD monster <input type="text" id="lmSrd" list="srdList" placeholder="e.g. Bugbear" value=""></label><button type="button" class="ghost" id="lmFill">Fill in from it</button><span class="lib-sub" id="lmSrdTag">${m.srd ? `Based on the SRD ${esc(srdName(m.srd))} (its traits show in the stat block).` : ''}</span></div>
    <input type="hidden" id="lmSrdIndex" value="${esc(m.srd || '')}">
    <div class="form-grid">
      <label class="span-all">Name <input type="text" id="lmName" maxlength="60" required value="${esc(m.name)}" placeholder="e.g. Kragg the Bugbear Chief"></label>
      <label>AC <input type="number" id="lmAc" min="0" max="40" value="${m.ac ?? ''}"></label>
      <label>HP <input type="text" id="lmHp" maxlength="20" value="${esc(m.hp || '')}" placeholder="65 or 10d8+20"></label>
      <label>Init bonus <input type="number" id="lmInit" min="-10" max="20" value="${m.init ?? 0}"></label>
      <label>CR <select id="lmCr">${crOptions(m.cr)}</select></label>
    </div>
    <div class="lib-sublbl">Attacks <small>(each gets Roll buttons in the stat block)</small></div>
    <div id="lmAttacks">${(m.attacks.length ? m.attacks : []).map(attackRow).join('')}</div>
    <button type="button" class="ghost" id="lmAddAttack">Add an attack</button>
    <label class="lib-notes">Abilities and notes <textarea id="lmNotes" maxlength="2000" rows="5" placeholder="Traits, special actions, tactics, legendary actions…">${esc(m.notes || '')}</textarea></label>
    <div class="form-row"><span class="msg" id="lmMsg"></span><span class="sep" style="flex:1"></span><button type="button" class="ghost" data-lib-cancel="1">Cancel</button><button type="submit">Save monster</button></div>
  </form>`);
  if(!m.attacks.length) $('lmAddAttack').click();
}
// Fill the editor from an SRD stat block: numbers, its weapon attacks, and the SRD link
async function fillMonsterFromSrd(){
  await loadSrdIndex();
  const name = $('lmSrd').value.trim().toLowerCase(), hit = (srdIndex || []).find(x=>x.name.toLowerCase() === name);
  if(!hit){ $('lmSrdTag').textContent = 'Pick a monster from the SRD list first.'; return; }
  $('lmSrdTag').textContent = 'Loading…';
  try{
    const m = await srdMonster(hit.index);
    if(!$('lmName').value.trim()) $('lmName').value = m.name;
    $('lmAc').value = m.armor_class && m.armor_class[0] ? m.armor_class[0].value : '';
    $('lmHp').value = m.hit_points_roll || m.hit_dice || m.hit_points;
    $('lmInit').value = abilMod(m.dexterity);
    $('lmCr').value = crText(m.challenge_rating);
    $('lmSrdIndex').value = m.index;
    const attacks = (m.actions || []).filter(a=>a.attack_bonus !== undefined).slice(0, LIB_MAX_ATTACKS).map(a=>{
      const d = (a.damage || []).find(x=>x.damage_dice) || {};
      return {name:a.name, hit:a.attack_bonus, dmg:(d.damage_dice || '').replace(/\s/g, ''), type:d.damage_type ? d.damage_type.name.toLowerCase() : ''};
    });
    if(attacks.length) $('lmAttacks').innerHTML = attacks.map(attackRow).join('');
    $('lmSrdTag').textContent = `Filled in from the SRD ${m.name}. Change anything you like; its traits still show in the stat block.`;
  }catch(err){ $('lmSrdTag').textContent = 'Couldn’t load that stat block.'; }
}
async function saveMonsterForm(form){
  const name = $('lmName').value.trim(); if(!name){ $('lmMsg').textContent = 'Give it a name.'; return; }
  const hp = $('lmHp').value.trim();
  if(hp && !/^\d+$/.test(hp) && rollExpr(hp) === null){ $('lmMsg').textContent = 'HP should be a number (65) or dice (10d8+20).'; return; }
  const attacks = [...form.querySelectorAll('.lib-attack')].map(r=>{ const f = k=>r.querySelector(`[data-f="${k}"]`).value.trim();
    return {name:f('name').slice(0, 60), hit:toNum(f('hit')), dmg:f('dmg').replace(/\s/g, '').slice(0, 40), type:f('type').slice(0, 20)}; })
    .filter(a=>a.name).map(a=>Object.fromEntries(Object.entries(a).filter(([, v])=>v !== null && v !== '')));
  const data = {name:name.slice(0, 60), hp:hp.slice(0, 20), init:toNum($('lmInit').value) ?? 0, notes:$('lmNotes').value.slice(0, 2000),
    attacks, cr:$('lmCr').value, srd:$('lmSrdIndex').value, ac:toNum($('lmAc').value)};
  Object.keys(data).forEach(k=>{ if(data[k] === null || data[k] === '' || (Array.isArray(data[k]) && !data[k].length)) delete data[k]; });
  const id = form.dataset.id;
  const ok = id ? await libWrite(`monsters/${id}`, data) : await libWrite('monsters', data, true);
  if(ok){ closeLibPopup(); libMsg(`Saved ${name}.`); }
}

// Encounter editor
function encounterFromInitiative(){
  const groups = new Map();
  combat.list.filter(c=>c.kind === 'monster' && (c.custom || c.srd)).forEach(c=>{
    const key = c.custom ? 'custom:' + c.custom : 'srd:' + c.srd;
    const g = groups.get(key) || {src:c.custom ? 'custom' : 'srd', ref:c.custom || c.srd, name:c.name.replace(/ \d+$/, ''), count:0};
    g.count++; groups.set(key, g);
  });
  return {name:'', party:combat.list.some(c=>c.kind === 'pc'), items:[...groups.values()]};
}
const encRow = it=>`<div class="lib-item"><input type="text" data-f="who" list="libMonsterList" maxlength="60" placeholder="Saved or SRD monster" value="${esc(it.src === 'custom' && library.monsters[it.ref] ? library.monsters[it.ref].name : it.name || '')}" aria-label="Monster">
  <input type="number" data-f="count" min="1" max="30" value="${it.count || 1}" aria-label="How many"><button type="button" class="chip-btn" data-lib-x="1" aria-label="Remove this row">✕</button></div>`;
function openEncounterEditor(id, start){
  const e = start || (id ? library.encounters[id] : {name:'', party:false, items:[]});
  loadSrdIndex().then(()=>{ const dl = $('libMonsterList'); if(dl) dl.innerHTML = libMonsterOptions(); });
  openLibPopup(id ? `Edit ${e.name}` : 'New Encounter', `<form class="lib-form" id="libEncForm" data-id="${esc(id || '')}" autocomplete="off">
    <label class="lib-wide">Name <input type="text" id="leName" maxlength="60" required value="${esc(e.name)}" placeholder="e.g. Goblin ambush, Kragg's lair"></label>
    <div class="lib-sublbl">Monsters <small>(your saved monsters, or any SRD monster)</small></div>
    <datalist id="libMonsterList">${libMonsterOptions()}</datalist>
    <div id="leItems">${(e.items.length ? e.items : [{count:1}]).map(encRow).join('')}</div>
    <button type="button" class="ghost" id="leAddItem">Add a monster</button>
    <label class="lib-check"><input type="checkbox" id="leParty"${e.party ? ' checked' : ''}> Also add the party when it loads</label>
    <div class="form-row"><span class="msg" id="leMsg"></span><span class="sep" style="flex:1"></span><button type="button" class="ghost" data-lib-cancel="1">Cancel</button><button type="submit">Save encounter</button></div>
  </form>`);
}
// Saved monsters first, then the SRD. Names only: some browsers show an option's label instead of its value
function libMonsterOptions(){
  return Object.values(library.monsters).sort((a, b)=>a.name.localeCompare(b.name)).map(m=>`<option value="${esc(m.name)}"></option>`).join('')
    + (srdIndex || []).map(m=>`<option value="${esc(m.name)}"></option>`).join('');
}
async function saveEncounterForm(form){
  const name = $('leName').value.trim(); if(!name){ $('leMsg').textContent = 'Give it a name.'; return; }
  await loadSrdIndex();
  const items = [], unknown = [];
  form.querySelectorAll('.lib-item').forEach(r=>{
    const who = r.querySelector('[data-f="who"]').value.trim(); if(!who) return;
    const count = Math.max(1, Math.min(30, toNum(r.querySelector('[data-f="count"]').value) || 1));
    const saved = Object.entries(library.monsters).find(([, m])=>m.name.toLowerCase() === who.toLowerCase());
    const srd = !saved && (srdIndex || []).find(m=>m.name.toLowerCase() === who.toLowerCase());
    if(saved) items.push({src:'custom', ref:saved[0], name:saved[1].name, count});
    else if(srd) items.push({src:'srd', ref:srd.index, name:srd.name, count});
    else unknown.push(who);
  });
  if(unknown.length){ $('leMsg').textContent = `Not a saved or SRD monster: ${unknown.join(', ')}. Save it as a monster first, or pick from the list.`; return; }
  if(!items.length){ $('leMsg').textContent = 'Add at least one monster.'; return; }
  if(items.length > LIB_MAX_ITEMS){ $('leMsg').textContent = `Up to ${LIB_MAX_ITEMS} kinds of monster per encounter.`; return; }
  const data = {name:name.slice(0, 60), party:$('leParty').checked, items};
  const id = form.dataset.id;
  const ok = id ? await libWrite(`encounters/${id}`, data) : await libWrite('encounters', data, true);
  if(ok){ closeLibPopup(); libMsg(`Saved ${name}.`); }
}

$('libBody').addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.dataset.libCancel) closeLibPopup();
  else if(b.dataset.libX) b.parentElement.remove();
  else if(b.id === 'lmAddAttack'){ if($('lmAttacks').children.length < LIB_MAX_ATTACKS) $('lmAttacks').insertAdjacentHTML('beforeend', attackRow({})); }
  else if(b.id === 'lmFill') fillMonsterFromSrd();
  else if(b.id === 'leAddItem'){ if($('leItems').children.length < LIB_MAX_ITEMS) $('leItems').insertAdjacentHTML('beforeend', encRow({count:1})); }
});
$('libBody').addEventListener('submit', e=>{
  e.preventDefault();
  if(e.target.id === 'libMonForm') saveMonsterForm(e.target);
  else if(e.target.id === 'libEncForm') saveEncounterForm(e.target);
});

/* ---------- A saved monster's stat block (the Stats button in Initiative and the list) ---------- */
function customStatBlockHtml(m){
  const line = (label, val)=>val || val === 0 ? `<div class="sb-line"><b>${label}</b> ${esc(val)}</div>` : '';
  const attacks = m.attacks.map(a=>{
    const rows = [];
    if(a.hit !== null) rows.push(rollRow(`1d20${fmtMod(a.hit)}`, `${a.name}: to hit`, 'to hit', ' data-fx-row="hit"'));
    if(a.dmg && readDice(a.dmg)) rows.push(rollRow(a.dmg, `${a.name}: damage`, `${a.type ? a.type + ' ' : ''}damage`));
    return `<div class="sb-feat"><b>${esc(a.name)}.</b>${a.hit !== null ? `<p>${fmtMod(a.hit)} to hit${a.dmg ? `, ${esc(a.dmg)}${a.type ? ' ' + esc(a.type) : ''}` : ''}.</p>` : ''}${rows.join('')}</div>`;
  }).join('');
  return `<div class="sb-sub">Your saved monster${m.srd ? ` · based on the SRD ${esc(srdName(m.srd))}` : ''}</div>
    ${line('Armor Class', m.ac)}${line('Hit Points', m.hp)}${line('Initiative', fmtMod(m.init))}${line('Challenge', m.cr ? `${m.cr} (${CR_XP[m.cr]} XP)` : '')}
    ${attacks ? `<div class="sb-sec">Attacks</div>${attacks}` : ''}
    ${m.notes ? `<div class="sb-sec">Abilities and Notes</div><p class="sb-notes">${esc(m.notes)}</p>` : ''}`;
}

/* ---------- From the database (dm.html's module script calls this) ---------- */
window.dmLibraryUpdate = (key, raw)=>{
  if(key !== campaign.key) return;
  library = cleanLibrary(raw);
  renderLibrary();
};
renderLibrary();
