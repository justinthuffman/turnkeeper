/* ---------- V5: the character sheet's own panels ----------
   For a character opened from the database (js/char-store.js), these panels show and edit what
   the Google Sheet used to hold:
     Character Details      the basics (level, class, race, scores, proficient saves and skills,
                            HP max, speed, AC), identity, appearance, personality, backstory,
                            allies and organizations, additional features and traits
     Proficiencies & Languages   armor, weapons, vehicles, tools, other; languages; other speeds
     Gold                   a balance with a ledger: amount + note, then + or − (like the HP box)
     Notes                  free text with simple formatting (Reddit style), Write / Preview
   The basics and details live in the record's core (tkDb.updateCore); gold and notes are kept like
   the tracker's other saved data (storageSet → kv "gold:@", "notes:@"). Changing a basic redraws
   the whole page (applyCore), so every number that depends on it follows. */
const csEsc = s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const csDb = ()=>!!(charStore.kv && currentCore && currentCharId);
const ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil', 'Unaligned'];
const LIFESTYLES = ['Wretched', 'Squalid', 'Poor', 'Modest', 'Comfortable', 'Wealthy', 'Aristocratic'];
const campaignTracks = what=>false;   // the future Campaign settings toggles (lifestyle, weight, currencies): all off for now

// Save part of the record (debounced per key), then optionally redraw the page from it
const csTimers = {};
function csSaveCore(key, value, redraw){
  currentCore[key] = value;
  clearTimeout(csTimers[key]);
  csTimers[key] = setTimeout(()=>{
    if(!window.tkDb) return;
    window.tkDb.updateCore(charStore.campaign, charStore.id, {[key]: JSON.parse(JSON.stringify(value ?? null))})
      .catch(err=>{ console.warn('Saving the character:', err); csFlash('Couldn’t save that change. Check your connection.', true); });
  }, 500);
  if(redraw){ const y = scrollY; applyCore(currentCore, currentCharId); scrollTo(0, y); }
}
function csFlash(text, err){
  const dlg = document.getElementById('editChar'), el = document.getElementById(dlg && !dlg.hidden ? 'csSaveMsg2' : 'csSaveMsg'); if(!el) return;
  el.textContent = text; el.classList.toggle('err', !!err);
  clearTimeout(el._t); el._t = setTimeout(()=>{ el.textContent = ''; }, 4000);
}

/* ---------- Character Details ---------- */
const DETAIL_GROUPS = [
  ['Identity', [['background', 'Background'], ['alignment', 'Alignment', 'align'], ['xp', 'Experience points', 'number'], ['lifestyle', 'Lifestyle', 'lifestyle'], ['bgFeature', 'Background feature', 'area']]],
  ['Appearance', [['age', 'Age'], ['height', 'Height'], ['weight', 'Weight'], ['eyes', 'Eyes'], ['skin', 'Skin'], ['hair', 'Hair'], ['look', 'Appearance', 'area']]],
  ['Personality', [['traits', 'Personality traits', 'area'], ['ideals', 'Ideals', 'area'], ['bonds', 'Bonds', 'area'], ['flaws', 'Flaws', 'area']]],
  ['Story', [['backstory', 'Backstory', 'area'], ['allies', 'Allies & organizations', 'area'], ['symbol', 'Symbol (allies & organizations)'], ['extraFeatures', 'Additional features & traits', 'area']]],
];
function detailFieldHtml([key, label, kind], d){
  const v = d[key] ?? '', id = 'cd_' + key;
  if(kind === 'lifestyle' && !campaignTracks('lifestyle')) return '';
  // A Player's Handbook background suggests its feature (shown until the player writes their own)
  const bg = key === 'bgFeature' && typeof backgroundOf === 'function' ? backgroundOf(d.background) : null;
  if(key === 'background') return `<label class="cs-field" for="${id}"><span>${label}</span><input id="${id}" data-detail="${key}" type="text" list="bgList" value="${csEsc(v)}">`
    + `<datalist id="bgList">${Object.keys(typeof BACKGROUNDS === 'object' ? BACKGROUNDS : {}).map(b=>`<option value="${b}"></option>`).join('')}</datalist></label>`;
  const input = kind === 'area' ? `<textarea id="${id}" data-detail="${key}" rows="3"${bg ? ` placeholder="${csEsc(bg.feature)} (from the ${csEsc(bg.name)} background)"` : ''}>${csEsc(v)}</textarea>`
    : kind === 'align' ? `<select id="${id}" data-detail="${key}"><option value=""></option>${ALIGNMENTS.map(a=>`<option${a === v ? ' selected' : ''}>${a}</option>`).join('')}</select>`
    : kind === 'lifestyle' ? `<select id="${id}" data-detail="${key}"><option value=""></option>${LIFESTYLES.map(a=>`<option${a === v ? ' selected' : ''}>${a}</option>`).join('')}</select>`
    : `<input id="${id}" data-detail="${key}" type="${kind === 'number' ? 'number' : 'text'}" value="${csEsc(v)}"${kind === 'number' ? ' min="0"' : ''}>`;
  return `<label class="cs-field${kind === 'area' ? ' cs-wide' : ''}" for="${id}"><span>${label}</span>${input}</label>`;
}
// The basics: what the rest of the page is worked out from
function basicsHtml(c){
  const sc = c.scores || {}, saves = c.saves || [], skills = c.skills || {};
  const num = (key, label, val, min, max)=>`<label class="cs-field cs-num" for="cb_${key}"><span>${label}</span><input id="cb_${key}" data-basic="${key}" type="number" value="${csEsc(val ?? '')}" min="${min}" max="${max}"></label>`;
  return `<div class="cs-grid">`
    + `<label class="cs-field" for="cb_name"><span>Name</span><input id="cb_name" data-basic="name" type="text" value="${csEsc(c.name || savedName(currentCharId) || '')}"></label>`
    + `<label class="cs-field" for="cb_cls"><span>Class</span><input id="cb_cls" data-basic="cls" type="text" value="${csEsc(c.cls)}" placeholder="e.g. Vengeance Paladin"></label>`
    + `<label class="cs-field" for="cb_race"><span>Race</span><input id="cb_race" data-basic="race" type="text" value="${csEsc(c.race)}"></label>`
    + `<label class="cs-field" for="cb_hand"><span>Handedness</span><select id="cb_hand" data-basic="hand"><option value="R"${c.hand === 'L' ? '' : ' selected'}>Right-handed</option><option value="L"${c.hand === 'L' ? ' selected' : ''}>Left-handed</option></select></label>`
    + num('level', 'Level', c.level, 1, 20) + num('hpMax', 'HP max', c.hpMax, 1, 999) + num('speed', 'Speed (ft)', c.speed, 0, 200) + num('ac', 'AC (until armor is equipped)', c.ac, 0, 40)
    + `</div><div class="cs-sub">Ability Scores</div><div class="cs-grid cs-scores">`
    + ABILITY_KEYS.map(a=>`<label class="cs-field cs-num" for="cb_s_${a}"><span>${ABILITY_FULL[a]}</span><input id="cb_s_${a}" data-score="${a}" type="number" min="1" max="30" value="${sc[a] ?? 10}"></label>`).join('')
    + `</div><div class="cs-sub">Saving Throw Proficiencies</div><div class="cs-checks">`
    + ABILITY_KEYS.map(a=>`<label class="cs-check"><input type="checkbox" data-save="${a}"${saves.includes(a) ? ' checked' : ''}> ${ABILITY_FULL[a]}</label>`).join('')
    + `</div><div class="cs-sub">Skill Proficiencies</div><div class="cs-skills">`
    + Object.keys(SKILL_ABILITY).map(n=>`<label class="cs-skill"><span>${n} <small>(${ABILITY_ABBR[SKILL_ABILITY[n]].toUpperCase()})</small></span><select data-skill="${csEsc(n)}"><option value="">—</option><option value="p"${skills[n] === 'p' ? ' selected' : ''}>Proficient</option><option value="e"${skills[n] === 'e' ? ' selected' : ''}>Expertise</option></select></label>`).join('')
    + `</div>`;
}
function renderDetails(){
  const panel = document.getElementById('detailsPanel'); if(!panel) return;
  panel.hidden = !csDb(); if(!csDb()) return;
  const d = currentCore.details || {};
  document.getElementById('detailsBody').innerHTML =
    DETAIL_GROUPS.map(([title, fields])=>`<details class="cs-sec"${title === 'Identity' ? ' open' : ''}><summary>${title}</summary><div class="cs-grid">${fields.map(f=>detailFieldHtml(f, d)).join('')}</div></details>`).join('');
}
/* Edit Character: the set-once basics, behind a button in Settings (a window over the page) */
function openEditChar(){
  if(!csDb()) return;
  let dlg = document.getElementById('editChar');
  if(!dlg){
    dlg = document.createElement('div'); dlg.id = 'editChar'; dlg.className = 'cs-modal'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Edit character');
    document.body.appendChild(dlg);
    dlg.addEventListener('click', e=>{ if(e.target === dlg || e.target.closest('[data-edit-close]')) closeEditChar(); });
  }
  dlg.innerHTML = `<div class="cs-modal-box"><div class="cs-modal-head"><h2>Edit Character</h2><span class="cs-save-msg" id="csSaveMsg2" aria-live="polite"></span><button type="button" class="roll-close" data-edit-close aria-label="Close">&times;</button></div>`
    + `<p class="cs-none">These are set when a character is made and rarely change. Everything on the sheet updates as you change them.</p>${basicsHtml(currentCore)}</div>`;
  dlg.hidden = false;
  document.getElementById('cb_name').focus();
}
function closeEditChar(){ const d = document.getElementById('editChar'); if(d) d.hidden = true; }
document.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ const d = document.getElementById('editChar'); if(d && !d.hidden) closeEditChar(); } });
document.addEventListener('click', e=>{ if(e.target.closest && e.target.closest('#editCharBtn')) openEditChar(); });
document.addEventListener('change', e=>{
  const t = e.target; if(!csDb() || !t.closest || !t.closest('#detailsPanel, #editChar')) return;
  if(t.dataset.detail){ csSaveCore('details', {...(currentCore.details || {}), [t.dataset.detail]: t.type === 'number' ? (parseInt(t.value, 10) || 0) : t.value}); if(t.dataset.detail === 'background'){ renderDetails(); renderProfs(); } csFlash('Saved.'); return; }
  if(t.dataset.basic === 'name'){ const n = t.value.trim(); if(n){ saveName(currentCharId, n); setCharName(n); csSaveCore('name', n); csFlash('Saved.'); } return; }
  if(t.dataset.basic){
    const k = t.dataset.basic, num = ['level', 'hpMax', 'speed', 'ac'].includes(k);
    let v = num ? parseInt(t.value, 10) : t.value.trim();
    if(num && isNaN(v)) v = k === 'ac' ? null : currentCore[k];
    if(k === 'level') v = Math.min(20, Math.max(1, v || 1));
    csSaveCore(k, v, true); csFlash('Saved.'); return;
  }
  if(t.dataset.score){ const v = Math.min(30, Math.max(1, parseInt(t.value, 10) || 10)); csSaveCore('scores', {...currentCore.scores, [t.dataset.score]: v}, true); csFlash('Saved.'); return; }
  if(t.dataset.save){ const s = new Set(currentCore.saves || []); t.checked ? s.add(t.dataset.save) : s.delete(t.dataset.save); csSaveCore('saves', ABILITY_KEYS.filter(a=>s.has(a)), true); csFlash('Saved.'); return; }
  if(t.dataset.skill){ const s = {...(currentCore.skills || {})}; if(t.value) s[t.dataset.skill] = t.value; else delete s[t.dataset.skill]; csSaveCore('skills', s, true); csFlash('Saved.'); }
});

/* ---------- Proficiencies & Languages ---------- */
// Chip lists: pick from a list or type your own; × removes
const PROF_LISTS = [
  // Armor and weapon proficiencies are with Equipment in the Inventory tab (js/inventory.js)
  ['vehicles', 'Vehicles', VEHICLE_PROFS], ['tools', 'Tools', TOOL_PROFS], ['other', 'Other', []],
];
function chipEditorHtml(key, label, values, options, auto){
  // auto: [[name, where it comes from]], shown first and not removable
  const listId = 'cl_' + key, autoList = auto || [], isAuto = v=>autoList.some(([n])=>n.toLowerCase() === String(v).toLowerCase());
  const chips = autoList.map(([n, from])=>`<span class="cs-chip cs-chip-auto" title="From ${csEsc(from.replace(/^Your/, 'your'))}">${csEsc(n)}<small>${csEsc(from)}</small></span>`)
    .concat(values.map((v, i)=>isAuto(v) ? '' : `<span class="cs-chip">${csEsc(v)}<button type="button" data-chip-del="${key}" data-i="${i}" aria-label="Remove ${csEsc(v)}">&times;</button></span>`)).filter(Boolean);
  return `<div class="cs-chiprow"><div class="cs-sub">${label}</div><div class="cs-chips">`
    + (chips.length ? chips.join('') : '<span class="cs-none">None yet</span>')
    + `</div><div class="cs-add"><input type="text" list="${listId}" data-chip-input="${key}" placeholder="Add ${label.toLowerCase()}…" aria-label="Add ${csEsc(label)}"><button type="button" class="chip-btn" data-chip-add="${key}">Add</button>`
    + `<datalist id="${listId}">${options.filter(o=>!values.includes(o) && !isAuto(o)).map(o=>`<option value="${csEsc(o)}"></option>`).join('')}</datalist></div></div>`;
}
const profValues = key=>key === 'languages' ? (currentCore.languages || []) : ((currentCore.profs || {})[key] || []);
function setProfValues(key, list){
  if(key === 'languages') csSaveCore('languages', list);
  // Armor and weapon proficiencies change attacks and armor penalties: redraw the page for those
  else csSaveCore('profs', {...(currentCore.profs || {}), [key]: list}, key === 'armor' || key === 'weapons');
  renderProfs(); if(window.renderGear) window.renderGear();
}
function renderProfs(){
  const panel = document.getElementById('profPanel'); if(!panel) return;
  panel.hidden = !csDb(); if(!csDb()) return;
  const sp = currentCore.speeds || {};
  // Languages, tools and vehicles from race, class, background and feats show as automatic chips.
  // Above them: anything else that comes automatically (feat skills; armor and weapons are with
  // Armor & Weapon Proficiencies) and the "of your choice" reminders.
  const armsProf = x=>/armor|Shields|weapons/.test(x) || WEAPONS.some(w=>w.name === x);
  const auto = typeof autoProfs === 'function' ? autoProfs() : {languages:[], tools:[], vehicles:[], notes:[]};
  const chipped = [...auto.languages, ...auto.tools, ...auto.vehicles].map(([n])=>n);
  const granted = (typeof grantedProfs === 'function' ? grantedProfs() : []).map(([f, l])=>[f, l.filter(x=>!armsProf(x) && !chipped.includes(x))]).filter(([, l])=>l.length);
  document.getElementById('profBody').innerHTML =
    (granted.length || auto.notes.length ? `<div class="cs-granted">${granted.map(([from, list])=>`<div><span>${from}:</span> ${list.map(csEsc).join(', ')}</div>`).join('')}${auto.notes.map(x=>`<div>${csEsc(x)}</div>`).join('')}</div>` : '')
    + PROF_LISTS.map(([k, label, opts])=>chipEditorHtml(k, label, profValues(k), opts, auto[k])).join('')
    + chipEditorHtml('languages', 'Languages', profValues('languages'), LANGUAGES, auto.languages)
    + `<div class="cs-sub">Other Speeds</div><div class="cs-grid cs-scores">`
    + [['fly', 'Fly'], ['swim', 'Swim'], ['climb', 'Climb'], ['burrow', 'Burrow']].map(([k, l])=>`<label class="cs-field cs-num" for="csp_${k}"><span>${l} (ft)</span><input id="csp_${k}" data-speed="${k}" type="number" min="0" max="300" value="${sp[k] || ''}"></label>`).join('')
    + `</div>`;
}
function addChip(key){
  const input = document.querySelector(`[data-chip-input="${key}"]`); if(!input) return;
  const v = input.value.trim().slice(0, 80); if(!v) return;
  const list = profValues(key);
  if(!list.some(x=>x.toLowerCase() === v.toLowerCase())) setProfValues(key, [...list, v]);
  const again = document.querySelector(`[data-chip-input="${key}"]`); if(again) again.focus();
}
document.addEventListener('click', e=>{
  const add = e.target.closest && e.target.closest('[data-chip-add]'); if(add){ addChip(add.dataset.chipAdd); return; }
  const del = e.target.closest && e.target.closest('[data-chip-del]');
  if(del){ const k = del.dataset.chipDel, list = profValues(k).slice(); list.splice(+del.dataset.i, 1); setProfValues(k, list); }
});
document.addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.dataset && e.target.dataset.chipInput){ e.preventDefault(); addChip(e.target.dataset.chipInput); } });
document.addEventListener('change', e=>{
  const t = e.target; if(!csDb() || !t.dataset || !t.dataset.speed) return;
  const n = parseInt(t.value, 10), sp = {...(currentCore.speeds || {})};
  if(n > 0) sp[t.dataset.speed] = n; else delete sp[t.dataset.speed];
  csSaveCore('speeds', sp); csFlash('Saved.');
});

/* ---------- Gold: a balance with a ledger ----------
   Like the HP box: type an amount, write what it's for, then + or −. Each change is a ledger
   line ({t, d: signed amount, note}); the balance is their sum. GP only for now; the Campaign
   settings will choose other currencies later. */
const goldKey = ()=>`dndTracker:gold:${currentCharId}`;
function goldLog(){ try{ const g = JSON.parse(storageGet(goldKey()) || 'null'); return g && Array.isArray(g.log) ? g.log : []; }catch(e){ return []; } }
const goldBalance = log=>Math.round(log.reduce((n, x)=>n + (+x.d || 0), 0) * 100) / 100;
function renderGold(){
  const panel = document.getElementById('goldPanel'); if(!panel) return;
  panel.hidden = !csDb(); if(!csDb()){ const rg = document.getElementById('resGold'); if(rg) rg.hidden = true; return; }
  const log = goldLog(), bal = goldBalance(log);
  document.getElementById('goldBal').textContent = `${bal.toLocaleString()} gp`;
  // The total also shows in Resources on the Overview tab (clicking it opens the Inventory tab)
  const rg = document.getElementById('resGold'); if(rg){ rg.hidden = false; document.getElementById('resGoldAmt').textContent = bal.toLocaleString(); }
  const note = document.getElementById('goldNote'), ok = !!note.value.trim();
  document.querySelectorAll('[data-gold]').forEach(b=>{ b.disabled = !ok; });
  let run = 0;
  const rows = log.map(x=>{ run = Math.round((run + (+x.d || 0)) * 100) / 100; return {...x, after:run}; }).reverse();
  document.getElementById('goldLedger').innerHTML = rows.length
    ? `<table class="ledger"><thead><tr><th>When</th><th>Change</th><th>Note</th><th>Balance</th><th></th></tr></thead><tbody>`
      + rows.map(x=>`<tr><td>${new Date(x.t).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</td><td class="${x.d < 0 ? 'neg' : 'pos'}">${x.d < 0 ? '−' : '+'}${Math.abs(x.d).toLocaleString()}</td><td>${csEsc(x.note)}</td><td>${x.after.toLocaleString()}</td><td>${goldDelAsk === x.t ? `<button type="button" class="sel-toggle ledger-del sure" data-gold-del="${x.t}">Remove?</button>` : `<button type="button" class="ledger-del" data-gold-del="${x.t}" title="Remove this line (it was a mistake)" aria-label="Remove this line">&times;</button>`}</td></tr>`).join('')
      + `</tbody></table>`
    : `<p class="cs-none">No entries yet. Add your starting gold with a note like “Starting gold”, then +.</p>`;
}
function goldChange(sign){
  const amt = Math.round(parseFloat(document.getElementById('goldAmt').value) * 100) / 100;
  const noteEl = document.getElementById('goldNote'), note = noteEl.value.trim().slice(0, 200);
  if(!(amt > 0) || !note) return;
  const log = goldLog();
  log.push({t:Date.now(), d:sign * amt, note});
  storageSet(goldKey(), JSON.stringify({log}));
  noteEl.value = ''; document.getElementById('goldAmt').value = 1;
  renderGold(); noteEl.focus();
}
document.addEventListener('click', e=>{ const b = e.target.closest && e.target.closest('[data-gold]'); if(b && !b.disabled) goldChange(b.dataset.gold === 'add' ? 1 : -1); });
// Removing a ledger line added by mistake: × asks "Remove?", a second click removes it (the balance follows)
let goldDelAsk = null;
document.addEventListener('click', e=>{
  const b = e.target.closest && e.target.closest('[data-gold-del]'); if(!b){ if(goldDelAsk !== null && !(e.target.closest && e.target.closest('#goldLedger'))){ goldDelAsk = null; renderGold(); } return; }
  const t = +b.dataset.goldDel;
  if(goldDelAsk !== t){ goldDelAsk = t; renderGold(); return; }
  goldDelAsk = null;
  storageSet(goldKey(), JSON.stringify({log:goldLog().filter(x=>x.t !== t)}));
  renderGold();
});
document.addEventListener('input', e=>{ if(e.target.id === 'goldNote') document.querySelectorAll('[data-gold]').forEach(b=>{ b.disabled = !e.target.value.trim(); }); });
document.addEventListener('keydown', e=>{ if(e.key === 'Enter' && e.target.id === 'goldNote'){ e.preventDefault(); } });

/* ---------- Notes: free text with simple formatting ----------
   Reddit-style marks, shown in Preview: **bold**, *italic*, __underline__, ~~strikethrough~~,
   `code`, ``` code blocks ```, > quotes, - lists, 1. lists, # headings. The text is escaped
   before any formatting, so nothing typed can run as HTML. */
const notesKey = ()=>`dndTracker:notes:${currentCharId}`;
function renderMarkdown(src){
  const blocks = [], esc = csEsc(String(src || '').replace(/\r\n/g, '\n'));
  // Code blocks first, kept out of the other formatting
  let text = esc.replace(/```\n?([\s\S]*?)```/g, (m, code)=>{ blocks.push(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`); return `\u0000${blocks.length - 1}\u0000`; });
  const inline = s=>s
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<u>$1</u>')
    .replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^\w_])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
  const out = []; let list = null, quote = [];
  const endList = ()=>{ if(list){ out.push(`<${list.tag}>${list.items.map(i=>`<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const endQuote = ()=>{ if(quote.length){ out.push(`<blockquote>${quote.map(inline).join('<br>')}</blockquote>`); quote = []; } };
  text.split('\n').forEach(line=>{
    const block = line.match(/^\u0000(\d+)\u0000$/);
    if(block){ endList(); endQuote(); out.push(blocks[+block[1]]); return; }
    const q = line.match(/^&gt;\s?(.*)$/); if(q){ endList(); quote.push(q[1]); return; } else endQuote();
    const ul = line.match(/^\s*[-*]\s+(.*)$/), ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if(ul || ol){ const tag = ul ? 'ul' : 'ol'; if(!list || list.tag !== tag){ endList(); list = {tag, items:[]}; } list.items.push((ul || ol)[1]); return; }
    endList();
    const h = line.match(/^(#{1,3})\s+(.*)$/); if(h){ out.push(`<h${h[1].length + 3}>${inline(h[2])}</h${h[1].length + 3}>`); return; }
    out.push(line.trim() ? `<p>${inline(line)}</p>` : '');
  });
  endList(); endQuote();
  return out.join('').replace(/\u0000(\d+)\u0000/g, (m, i)=>blocks[+i]);
}
const NOTE_MARKS = {bold:['**', '**'], italic:['*', '*'], underline:['__', '__'], strike:['~~', '~~'], code:['`', '`'], block:['```\n', '\n```'], quote:['> ', ''], list:['- ', ''], heading:['## ', '']};
function noteMark(kind){
  const ta = document.getElementById('notesText'), [a, b] = NOTE_MARKS[kind], s = ta.selectionStart, e = ta.selectionEnd;
  const sel = ta.value.slice(s, e) || (b ? 'text' : '');
  const lineStart = !b && ta.value.lastIndexOf('\n', s - 1) + 1;
  if(!b){ ta.setRangeText(a, lineStart, lineStart, 'end'); }   // quotes, lists, headings go at the line's start
  else { ta.setRangeText(a + sel + b, s, e, 'select'); ta.setSelectionRange(s + a.length, s + a.length + sel.length); }
  ta.focus(); saveNotes();
}
let notesTimer = null, notesFor = null;
function writeNotes(){
  clearTimeout(notesTimer); notesTimer = null;
  if(!notesFor) return;
  const key = `dndTracker:notes:${notesFor}`, text = document.getElementById('notesText').value || null;
  if(notesFor === currentCharId) storageSet(key, text);
  const m = document.getElementById('notesMsg'); if(m){ m.textContent = 'Saved'; setTimeout(()=>{ m.textContent = ''; }, 1500); }
}
function saveNotes(){ notesFor = currentCharId; clearTimeout(notesTimer); notesTimer = setTimeout(writeNotes, 600); }
function renderNotes(){
  const panel = document.getElementById('notesPanel'); if(!panel) return;
  if(notesTimer) writeNotes();   // typing that hasn't been saved yet is saved before the box is refilled
  panel.hidden = !csDb(); if(!csDb()) return;
  const ta = document.getElementById('notesText');
  if(document.activeElement !== ta) ta.value = storageGet(notesKey()) || '';
  showNotesTab(panel.dataset.tab || 'write');
}
function showNotesTab(tab){
  const panel = document.getElementById('notesPanel'); panel.dataset.tab = tab;
  const write = tab === 'write';
  document.getElementById('notesWrite').hidden = !write;
  document.getElementById('notesPreview').hidden = write;
  if(!write) document.getElementById('notesPreview').innerHTML = renderMarkdown(document.getElementById('notesText').value) || '<p class="cs-none">Nothing written yet.</p>';
  document.querySelectorAll('[data-notes-tab]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.notesTab === tab)));
}
document.addEventListener('click', e=>{
  const m = e.target.closest && e.target.closest('[data-mark]'); if(m){ noteMark(m.dataset.mark); return; }
  const t = e.target.closest && e.target.closest('[data-notes-tab]'); if(t) showNotesTab(t.dataset.notesTab);
});
document.addEventListener('input', e=>{ if(e.target.id === 'notesText') saveNotes(); });

// Everything above, for the character just shown (called at the end of applyCore)
window.renderCharSheet = ()=>{ const sc = document.getElementById('setChar'); if(sc) sc.hidden = !csDb(); renderDetails(); renderProfs(); renderGold(); renderNotes(); if(window.renderGear) window.renderGear(); if(window.tkTabsRefresh) window.tkTabsRefresh(); };
// The gold total in Resources opens the Inventory tab at the Gold panel
document.addEventListener('click', e=>{
  if(!(e.target.closest && e.target.closest('#resGold'))) return;
  if(window.showTab) window.showTab('inventory');
  const p = document.getElementById('goldPanel'); if(p) p.scrollIntoView({behavior:'smooth', block:'start'});
});
