/* ---------- The Beast Master's companion (ranger, 2014 PHB) ----------
   From 3rd level a Beast Master picks a beast no larger than Medium with a challenge rating of 1/4 or
   lower (js/data/beasts.js, from the SRD). Ranger's Companion adds the ranger's proficiency bonus to its
   AC, attack rolls, damage rolls, and the saves and skills it's proficient in; its hit point maximum is
   its normal one or four times the ranger's level, whichever is higher.
   The Companion panel shows it with its own hit points (Damage / Heal) and its attacks as roll rows
   (rolled like any roll on the sheet, so the DM's permission to roll applies). Bestial Fury (11th) and
   Exceptional Training (7th) are noted on it.
   Saved with the character (kv "companion:@" {name (the beast), nick, hp}). */
const compKey = ()=>`dndTracker:companion:${currentCharId}`;
function compState(){
  if(!currentCharId) return null;
  try{ const c = JSON.parse(storageGet(compKey()) || 'null'); return c && typeof c === 'object' && beastByName(c.name) ? c : null; }catch(e){ return null; }
}
const saveComp = c=>storageSet(compKey(), c ? JSON.stringify(c) : null);
const isBeastMaster = ()=>typeof cf !== 'undefined' && cf.classKey === 'ranger' && cf.subclass === 'Beast Master' && charLevel() >= 3;
const compAllowed = b=>b.type === 'beast' && CR_VALUE(b.cr) <= 0.25 && ['Tiny', 'Small', 'Medium'].includes(b.size);
const compMax = b=>Math.max(b.hp, 4 * charLevel());
// Dice with the proficiency bonus added to the modifier: "2d4+2" + 2 → "2d4+4"
function plusProf(dice, prof){
  const m = String(dice).match(/^(\d+d\d+)([+-]\d+)?$/);
  if(!m) return `${dice}+${prof}`;
  const n = (parseInt(m[2], 10) || 0) + prof;
  return n ? `${m[1]}${n > 0 ? '+' : ''}${n}` : m[1];
}
const compUi = {q:'', view:null};
function compMsg(t){ const m = document.getElementById('compMsg'); if(m) m.textContent = t || ''; }

function renderCompanion(){
  const panel = document.getElementById('compPanel'); if(!panel) return;
  const c = compState();
  panel.hidden = !isBeastMaster() && !c;
  if(panel.hidden) return;
  const body = panel.querySelector('.comp-body'), b = c && beastByName(c.name), prof = proficiencyBonus();
  if(!b){
    const q = compUi.q.trim().toLowerCase();
    const list = BEASTS.filter(compAllowed).filter(x=>!q || x.name.toLowerCase().includes(q)).sort((a, x)=>CR_VALUE(x.cr) - CR_VALUE(a.cr) || a.name.localeCompare(x.name));
    document.getElementById('compPins').innerHTML = '';
    body.innerHTML = `<p class="cs-none">Pick your companion: a beast no larger than Medium, challenge rating 1/4 or lower. It gets your proficiency bonus (+${prof}) on its AC, attacks, damage and proficient saves and skills, and at least ${4 * charLevel()} hit points (4 × your level).</p>`
      + `<input type="search" class="wild-search comp-search" placeholder="Search beasts" value="${escapeHtml(compUi.q)}" aria-label="Search beasts">`
      + `<div class="wild-list">${list.map(x=>`<div class="wild-row${compUi.view === x.name ? ' open' : ''}"><button type="button" class="wild-name" data-comp-view="${escapeHtml(x.name)}">${escapeHtml(x.name)}</button>`
        + `<span class="cs-none">CR ${escapeHtml(x.cr)} · ${escapeHtml(x.size)} · AC ${x.ac + prof} · ${compMax(x)} HP · ${escapeHtml(beastSpeedText(x))}</span>`
        + `<button type="button" data-comp-pick="${escapeHtml(x.name)}">Choose</button>${compUi.view === x.name ? beastCardHtml(x) : ''}</div>`).join('') || '<p class="cs-none">No beasts match.</p>'}</div>`
      + `<div class="cs-none" id="compMsg" aria-live="polite"></div><p class="cs-none">Beast stat blocks: SRD 5.1, CC-BY-4.0.</p>`;
    return;
  }
  const max = compMax(b), hp = Math.max(0, Math.min(c.hp ?? max, max)), name = c.nick || b.name, lvl = charLevel();
  document.getElementById('compPins').innerHTML = `<span class="fx-chip">${escapeHtml(name)} · ${hp}/${max} HP</span>`;
  const attacks = b.actions.filter(a=>typeof a.hit === 'number');
  const row = (dice, label, kind, what)=>`<div class="roll-cmd-row" data-dice="${escapeHtml(dice)}"><span class="roll-what">${what} <code>${escapeHtml(dice)}</code></span><button type="button" class="roll-btn" data-roll="${escapeHtml(label)}" data-fx-row="${kind}">Roll</button></div>`;
  body.innerHTML = `<div class="comp-head"><label class="cs-none">Name <input type="text" class="comp-nick" maxlength="40" value="${escapeHtml(c.nick || '')}" placeholder="${escapeHtml(b.name)}"></label>`
    + `<span><b>AC</b> ${b.ac + prof}</span><span><b>Speed</b> ${escapeHtml(beastSpeedText(b))}</span></div>`
    + `<div class="comp-hp"><span class="comp-hp-num${hp === 0 ? ' down' : ''}"><b>${hp}</b> / ${max} HP</span><input type="number" class="comp-amt" min="1" max="999" value="1" aria-label="Amount">`
    + `<button type="button" data-comp-hp="-1">Damage</button><button type="button" data-comp-hp="1">Heal</button>${hp === 0 ? '<span class="status-warn">Down (0 HP)</span>' : ''}</div>`
    + `<div class="cs-none" id="compMsg" aria-live="polite"></div>`
    + `<div class="beast-sub">Attacks</div>`
    + attacks.map(a=>`<div class="comp-attack"><b>${escapeHtml(a.name)}</b>${row(`1d20${fmtMod(a.hit + prof)}`, `${name}: ${a.name} to hit`, 'hit', 'To hit')}`
      + (a.dmg || []).map((d, i)=>row(i === 0 ? plusProf(d.dice, prof) : d.dice, `${name}: ${a.name} damage (${d.type})`, 'damage', `Damage (${escapeHtml(d.type)})`)).join('')
      + `<p class="cs-none">${escapeHtml(a.desc)}</p></div>`).join('')
    + `<p class="cs-none">It acts on your initiative. Use your action to command it to Attack, Dash, Disengage, Dodge or Help${lvl >= 7 ? '; when it doesn’t attack, a bonus action commands Dash, Disengage, Dodge or Help (Exceptional Training), and its attacks count as magical' : ''}${lvl >= 11 ? '. Bestial Fury: when you command it to Attack, it makes two attacks' : ''}. Its rolls above include your +${prof}.</p>`
    + beastCardHtml(b)
    + `<div class="wild-actions"><button type="button" class="ghost" data-comp="release">Choose a different companion</button></div>`;
}
document.addEventListener('click', e=>{
  const btn = e.target.closest && e.target.closest('#compPanel button'); if(!btn || !currentCharId) return;
  const c = compState();
  if(btn.dataset.compView){ compUi.view = compUi.view === btn.dataset.compView ? null : btn.dataset.compView; renderCompanion(); }
  else if(btn.dataset.compPick){ const b = beastByName(btn.dataset.compPick); if(b && compAllowed(b)){ saveComp({name:b.name, nick:'', hp:compMax(b)}); compUi.view = null; renderCompanion(); } }
  else if(btn.dataset.compHp && c){
    const b = beastByName(c.name), max = compMax(b), amt = Math.max(0, parseInt(document.querySelector('.comp-amt').value, 10) || 0);
    c.hp = Math.max(0, Math.min(max, (c.hp ?? max) + Number(btn.dataset.compHp) * amt)); saveComp(c); renderCompanion();
    compMsg(Number(btn.dataset.compHp) < 0 ? `${c.nick || b.name} took ${amt} damage.` : `${c.nick || b.name} healed ${amt}.`);
  }
  else if(btn.dataset.comp === 'release' && c){ if(confirm(`Choose a different companion? ${c.nick || c.name} leaves (the rules say you can bond with a new one after it dies, with 8 hours of work).`)){ saveComp(null); renderCompanion(); } }
});
document.addEventListener('change', e=>{
  if(!e.target.matches || !e.target.matches('.comp-nick')) return;
  const c = compState(); if(!c) return; c.nick = e.target.value.trim().slice(0, 40); saveComp(c); renderCompanion();
});
document.addEventListener('input', e=>{
  if(!e.target.matches || !e.target.matches('.comp-search')) return;
  compUi.q = e.target.value; renderCompanion();
  const s = document.querySelector('.comp-search'); if(s){ s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
});
// A long rest brings it back to full (it rests with you)
const takeRestBeforeComp = takeRest;
takeRest = function(kind){ const r = takeRestBeforeComp.apply(this, arguments); if(kind === 'long'){ const c = compState(); if(c){ c.hp = compMax(beastByName(c.name)); saveComp(c); } } renderCompanion(); return r; };
// Redrawn with the rest of the sheet
const applyCoreBeforeComp = applyCore;
applyCore = function(core, charId){ applyCoreBeforeComp(core, charId); renderCompanion(); };
