/* ---------- Wild Shape (druid, 2014 PHB) ----------
   The Wild Shape panel (druids from 2nd level) lists the beasts the druid can become at their level
   (js/data/beasts.js, from the SRD): challenge rating up to 1/4, 1/2 at 4th, 1 at 8th; no swimming
   speed before 4th and no flying speed before 8th. Circle of the Moon: CR 1 from 2nd, then druid level
   ÷ 3 from 6th, and the four elementals from 10th (two uses).
   While transformed, the sheet is the beast's, as the rules say:
     - its Strength, Dexterity and Constitution (your Intelligence, Wisdom and Charisma stay), your skill
       and save proficiencies, using the beast's own bonus where it's higher
     - its AC, speed and attacks (they roll like any attack on the sheet)
     - its hit points, a pool of their own: damage and healing go to the beast (everything that changes
       HP goes through setHp), and when they run out you change back and the extra damage carries over
   Saved with the character (kv "wild:@" {name, hp, max, since}). Spending a use, changing back and the
   overflow are worked out here; the rest of the sheet just sees different numbers. */
const wildKey = ()=>`dndTracker:wild:${currentCharId}`;
function wildState(){
  if(!currentCharId) return null;
  try{ const w = JSON.parse(storageGet(wildKey()) || 'null'); return w && typeof w === 'object' && beastByName(w.name) && Number.isFinite(w.hp) ? w : null; }catch(e){ return null; }
}
const saveWild = w=>storageSet(wildKey(), w ? JSON.stringify(w) : null);
const wildBeast = ()=>{ const w = wildState(); return w ? beastByName(w.name) : null; };
const isDruid = ()=>typeof cf !== 'undefined' && cf.classKey === 'druid' && charLevel() >= 2;

// What the druid can become now
function wildLimits(){
  const l = charLevel(), moon = cf.subclass === 'Circle of the Moon';
  return {maxCr:moon ? (l >= 6 ? Math.floor(l / 3) : 1) : l >= 8 ? 1 : l >= 4 ? 0.5 : 0.25, fly:l >= 8, swim:l >= 4, elementals:moon && l >= 10};
}
function wildAllowed(b){
  const L = wildLimits();
  if(b.type === 'elemental') return L.elementals;
  return CR_VALUE(b.cr) <= L.maxCr && (!b.speed.fly || L.fly) && (!b.speed.swim || L.swim);
}
const wildCost = b=>b.type === 'elemental' ? 2 : 1;
const wildUnlimited = ()=>charLevel() >= 20;   // Archdruid
const wildLeft = ()=>wildUnlimited() ? Infinity : remaining('feat:Wild Shape');

/* ---------- Hit points: the beast's pool while transformed ---------- */
const hpMaxOwn = hpMax, hpNowOwn = hpNow, setHpOwn = setHp;
hpMax = function(){ const w = wildState(); return w ? w.max : hpMaxOwn(); };
hpNow = function(){ const w = wildState(); return w ? Math.min(w.hp, w.max) : hpNowOwn(); };
setHp = function(v){
  const w = wildState(); if(!w) return setHpOwn(v);
  if(v > 0){ w.hp = Math.min(w.max, Math.round(v)); saveWild(w); saveTrack(); renderResources(); renderWild(); if(typeof livePush === 'function') livePush(); return; }
  // Down to 0 (or past it): back to your own form, and the rest of the damage carries over
  changeBack(`Your ${w.name} form dropped to 0 hit points: you’re yourself again${v < 0 ? `, and the other ${-v} damage carries over` : ''}.`, Math.round(v));
};

/* ---------- Becoming a beast, and changing back ---------- */
function becomeBeast(name){
  const b = beastByName(name); if(!b || !wildAllowed(b)) return;
  if(!wildUnlimited() && wildLeft() < wildCost(b)){ wildMsg(`You need ${wildCost(b)} Wild Shape use${wildCost(b) === 1 ? '' : 's'} for that, and have ${wildLeft()}.`); return; }
  if(!wildUnlimited()) spend('feat:Wild Shape', wildCost(b));
  saveWild({name:b.name, hp:b.hp, max:b.hp, since:Date.now()});
  wildUi.open = false; wildUi.view = null;
  redrawForWild();
  wildMsg(`You’re a ${b.name}.`);
}
function changeBack(why, overflow){
  const w = wildState(); if(!w) return;
  saveWild(null);
  redrawForWild();
  if(overflow < 0 && hpNowOwn() !== null) setHpOwn(hpNowOwn() + overflow);
  wildMsg(why || 'You’re yourself again.');
}
function redrawForWild(){ const y = scrollY; applyCore(currentCore, currentCharId); scrollTo(0, y); if(typeof livePush === 'function') livePush(); }

/* ---------- The sheet in beast form ---------- */
const applyCoreOwn = applyCore;
applyCore = function(core, charId){
  applyCoreOwn(core, charId);
  applyWildForm();
};
function applyWildForm(){
  renderWild();
  const b = wildBeast(); if(!b || !currentCore) return;
  // Strength, Dexterity and Constitution are the beast's; everything worked out from them follows
  ['str', 'dex', 'con'].forEach(a=>{ document.getElementById('s_' + a).value = String(b[a]); });
  refreshMods();
  const checks = coreChecks({...currentCore, scores:{...currentCore.scores, str:b.str, dex:b.dex, con:b.con}});
  // Your proficiencies stay; where the beast's own bonus is higher, use it
  checks.skills.forEach(s=>{ const v = b.skills && b.skills[s.name]; if(typeof v === 'number' && v > s.mod){ s.mod = v; s.prof = true; } });
  checks.saves.forEach(s=>{ const v = b.saves && b.saves[ABILITY_ABBR[s.name]]; if(typeof v === 'number' && v > s.mod){ s.mod = v; s.prof = true; } });
  state.skills = checks.skills; state.saves = checks.saves;
  state.attacks = b.actions.filter(a=>typeof a.hit === 'number').map(a=>({
    name:a.name, bonus:fmtMod(a.hit), beast:true,
    damage:`${(a.dmg || []).map(d=>`${d.dice} ${d.type}`).join(' + ') || '0'} · ${b.name} (Wild Shape)`}));
  document.getElementById('f_ac').value = String(b.ac); statusBaseAC = String(b.ac); updateACBox();
  document.getElementById('f_speed').value = beastSpeedText(b);
  document.getElementById('f_init').value = fmtMod(abilityMod(b.dex) + joatBonus());
  basePassive = 10 + checks.skills.find(s=>s.name === 'Perception').mod;
  skillPins.render(); savePins.render(); attackSection.render(); updateSenses(); renderResources();
}
const beastSpeedText = b=>[b.speed.walk ? `${b.speed.walk} ft` : '', ...['swim', 'fly', 'climb', 'burrow'].filter(k=>b.speed[k]).map(k=>`${k} ${b.speed[k]} ft${k === 'fly' && b.speed.hover ? ' (hover)' : ''}`)].filter(Boolean).join(', ') || '0 ft';

/* ---------- The Wild Shape panel ---------- */
const wildUi = {open:false, q:'', view:null};
function wildMsg(t){ const m = document.getElementById('wildMsg'); if(m) m.textContent = t || ''; }
function beastCardHtml(b){
  const mod = n=>fmtMod(abilityMod(n));
  const list = (label, v)=>v && v.length ? `<div><b>${label}</b> ${escapeHtml(v.join(', '))}</div>` : '';
  return `<div class="beast-card"><div class="beast-top"><b>${escapeHtml(b.name)}</b><span>${escapeHtml(b.size)} ${b.type} · CR ${escapeHtml(b.cr)}</span></div>`
    + `<div class="beast-line"><span><b>AC</b> ${b.ac}</span><span><b>HP</b> ${b.hp} (${escapeHtml(b.hd)})</span><span><b>Speed</b> ${escapeHtml(beastSpeedText(b))}</span></div>`
    + `<div class="beast-abil">${['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a=>`<span><small>${a.toUpperCase()}</small>${b[a]} (${mod(b[a])})</span>`).join('')}</div>`
    + (b.skills ? `<div><b>Skills</b> ${Object.entries(b.skills).map(([k, v])=>`${escapeHtml(k)} ${fmtMod(v)}`).join(', ')}</div>` : '')
    + `<div><b>Senses</b> ${escapeHtml([b.senses, `passive Perception ${b.pp}`].filter(Boolean).join(', '))}</div>`
    + list('Resistances', b.res) + list('Immunities', b.imm) + list('Vulnerabilities', b.vul) + list('Condition immunities', b.condImm)
    + (b.traits || []).map(t=>`<p><b>${escapeHtml(t.name)}.</b> ${escapeHtml(t.desc)}</p>`).join('')
    + `<div class="beast-sub">Actions</div>` + b.actions.map(a=>`<p><b>${escapeHtml(a.name)}.</b> ${escapeHtml(a.desc)}</p>`).join('')
    + `</div>`;
}
function renderWild(){
  const panel = document.getElementById('wildPanel'); if(!panel) return;
  panel.hidden = !isDruid() && !wildState();
  if(panel.hidden) return;
  const w = wildState(), b = w && beastByName(w.name), body = panel.querySelector('.wild-body');
  document.getElementById('wildPins').innerHTML = b ? `<span class="fx-chip">${escapeHtml(b.name)} · ${Math.min(w.hp, w.max)}/${w.max} HP</span>` : '';
  const left = wildUnlimited() ? 'unlimited (Archdruid)' : `${wildLeft()} of ${maxFor('feat:Wild Shape')} uses left (back on a short or long rest)`;
  if(b){
    const hours = Math.max(1, Math.floor(charLevel() / 2));
    body.innerHTML = `<p class="rt-note"><span>You’re a <b>${escapeHtml(b.name)}</b> (up to ${hours} hour${hours === 1 ? '' : 's'}). The sheet uses its Strength, Dexterity, Constitution, AC, speed, attacks and hit points; your skills and saves keep your proficiencies. Damage goes to the beast’s ${w.max} hit points; when they run out you change back and the rest carries over.${charLevel() >= 18 ? ' Beast Spells: you can cast spells with verbal and somatic components.' : ' You can’t cast spells in this form.'}</span></p>`
      + `<div class="wild-actions"><button type="button" data-wild="back">Change back</button><span class="cs-none">${left}</span></div><div class="cs-none" id="wildMsg" aria-live="polite"></div>` + beastCardHtml(b);
    return;
  }
  const L = wildLimits(), q = wildUi.q.trim().toLowerCase();
  const allowed = BEASTS.filter(wildAllowed).filter(x=>!q || x.name.toLowerCase().includes(q)).sort((a, c)=>CR_VALUE(c.cr) - CR_VALUE(a.cr) || a.name.localeCompare(c.name));
  body.innerHTML = `<div class="wild-actions"><button type="button" data-wild="open"${!wildUnlimited() && wildLeft() < 1 ? ' disabled' : ''}>${wildUi.open ? 'Hide the beasts' : 'Transform…'}</button><span class="cs-none">${left}</span></div><div class="cs-none" id="wildMsg" aria-live="polite"></div>`
    + `<p class="cs-none">${wildShapeLimits()}${L.elementals ? ' Elemental Wild Shape: an air, earth, fire or water elemental, for two uses.' : ''}</p>`
    + (wildUi.open ? `<input type="search" class="wild-search" placeholder="Search beasts" value="${escapeHtml(wildUi.q)}" aria-label="Search beasts">`
      + `<div class="wild-list">${allowed.map(x=>`<div class="wild-row${wildUi.view === x.name ? ' open' : ''}"><button type="button" class="wild-name" data-wild-view="${escapeHtml(x.name)}">${escapeHtml(x.name)}</button>`
        + `<span class="cs-none">CR ${escapeHtml(x.cr)} · ${escapeHtml(x.size)} · AC ${x.ac} · ${x.hp} HP · ${escapeHtml(beastSpeedText(x))}</span>`
        + `<button type="button" data-wild-be="${escapeHtml(x.name)}"${!wildUnlimited() && wildLeft() < wildCost(x) ? ' disabled' : ''}>Become${wildCost(x) > 1 ? ' (2 uses)' : ''}</button>`
        + (wildUi.view === x.name ? beastCardHtml(x) : '') + `</div>`).join('') || '<p class="cs-none">No beasts match.</p>'}</div>`
      + `<p class="cs-none">Beast stat blocks: SRD 5.1, CC-BY-4.0.</p>` : '');
}
document.addEventListener('click', e=>{
  const b = e.target.closest && e.target.closest('#wildPanel button'); if(!b) return;
  if(b.dataset.wild === 'open'){ wildUi.open = !wildUi.open; renderWild(); }
  else if(b.dataset.wild === 'back') changeBack('You’re yourself again.', 0);
  else if(b.dataset.wildView){ wildUi.view = wildUi.view === b.dataset.wildView ? null : b.dataset.wildView; renderWild(); }
  else if(b.dataset.wildBe) becomeBeast(b.dataset.wildBe);
});
document.addEventListener('input', e=>{
  if(!e.target.matches || !e.target.matches('.wild-search')) return;
  wildUi.q = e.target.value; renderWild();
  const s = document.querySelector('.wild-search'); if(s){ s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
});
