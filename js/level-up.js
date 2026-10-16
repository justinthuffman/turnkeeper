/* ---------- Level Up (V6 stage 3) ----------
   Details' Level up button opens a window that walks through what the next level brings:
     Hit points    roll the class's hit die or take the average, plus your Constitution modifier
                   (the base score: the sheet adds Constitution increases and Tough by itself)
     New features  the class's (and subclass's) features at that level, and racial ones that unlock
     Choices       the subclass (at its level), "pick one" features (a Fighting Style…), and an
                   Ability Score Improvement or a feat at ASI levels. Anything skipped stays
                   highlighted in the Build box.
     Spells        how many more cantrips and spells, the new highest spell level, a wizard's two
                   new spellbook spells (picked on the Spells tab, which shows the new limits)
   What each level added to the hit point maximum is kept with the character ("levels:@"), so
   Level down takes off exactly that. */
const LU = {to:0, hp:null, sub:'', choices:{}, asiMode:'asi', asi1:'', asi2:'', feat:''};
const levelsKey = ()=>`dndTracker:levels:${currentCharId}`;
function levelHistory(){ try{ return JSON.parse(storageGet(levelsKey()) || '{}') || {}; }catch(e){ return {}; } }
const luConMod = ()=>abilityMod((currentCore.scores || {}).con ?? 10);
const luDwarf = ()=>rt.raceKey === 'hilldwarf' ? 1 : 0;   // Dwarven Toughness: +1 per level
const luGain = ()=>LU.hp ? Math.max(1, LU.hp.value + luConMod() + luDwarf()) : null;
// The hit point maximum after this level: the gain, plus what the sheet adds for each level on its own
// (Constitution raised by an Ability Score Improvement, the Tough feat). Your own maximum, even in Wild Shape.
function luNewMax(){
  const own = typeof hpMaxOwn === 'function' ? hpMaxOwn() : hpMax();
  const wild = typeof wildState === 'function' && wildState();
  const perLevel = wild ? 0 : (abilityScoreMod('con') - luConMod()) + (typeof hasFeat === 'function' && hasFeat('Tough') ? 2 : 0);
  return (own || 0) + luGain() + perLevel;
}
const luRoll = die=>{ const r = new Uint32Array(1); crypto.getRandomValues(r); return 1 + r[0] % die; };

// What the new level brings, worked out without changing the level yet
function luFeatures(){
  const entry = CLASS_FEATURES[cf.classKey], sub = LU.sub || cf.subclass;
  const list = entry ? [...entry.base, ...((entry.subclasses || {})[sub] || [])].filter(t=>t.level === LU.to) : [];
  const racial = traitsForRace(rt.raceKey).flatMap(t=>(t.tiers || []).filter(x=>x.level === LU.to).map(x=>({name:`${t.name}: ${x.name}`, desc:x.text || ''})));
  return {list, racial};
}
function luSpells(){
  const casting = castingFor(); if(!casting) return null;
  const from = casting.from || 1, sub = LU.sub || cf.subclass;
  const t = SPELL_LIMITS[cf.classKey] || SPELL_LIMITS[`${cf.classKey}|${sub}`]; if(!t || LU.to < from) return null;
  const was = LU.to - 1, now = LU.to, out = [];
  const can = (l, f)=>l >= from ? f(l) : 0;
  if(t.cantrips){ const d = can(now, t.cantrips) - can(was, t.cantrips); if(d > 0) out.push(`${d} more cantrip${d === 1 ? '' : 's'} (${can(now, t.cantrips)} in all)`); }
  if(t.known){ const d = can(now, t.known) - can(was, t.known); if(d > 0) out.push(`${d} more spell${d === 1 ? '' : 's'} known (${can(now, t.known)} in all)`); }
  if(t.prepared) out.push(`You can prepare one more spell${t.half ? ' every other level (half your level)' : ''}: ${Math.max(1, abilityScoreMod(t.prepared) + (t.half ? Math.floor(now / 2) : now))} in all`);
  if(cf.classKey === 'wizard') out.push('Two new spells for your spellbook, free');
  const m0 = maxSpellLevelAt(cf.classKey, sub, was), m1 = maxSpellLevelAt(cf.classKey, sub, now);
  if(m1 > m0) out.push(`You can now cast ${['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'][m1]}-level spells`);
  if(cf.classKey === 'warlock' && now > 1 && typeof invocationsKnown === 'function'){ /* the Build box asks for new invocations */ }
  return out;
}
function luAsiLevel(){ return featSlotLevels().includes(LU.to); }

// How hit points go up here: the player's pick (roll or average), or what the DM set for the campaign
const luHpRule = ()=>(typeof critSettings === 'object' && critSettings.opts && critSettings.opts.hpLevel) || 'choice';
function renderLevelUp(){
  const dlg = document.getElementById('levelUp'); if(!dlg) return;
  const die = hitDie(), avg = hpAverage(die), con = luConMod(), dwarf = luDwarf(), entry = CLASS_FEATURES[cf.classKey], rule = luHpRule();
  // A rule with no choice to make fills itself in
  if(!LU.hp && rule === 'average') LU.hp = {how:'average', value:avg};
  if(!LU.hp && rule === 'max') LU.hp = {how:'max', value:die};
  const {list, racial} = luFeatures(), spells = luSpells();
  const needSub = entry && LU.to === entry.subclassLevel && !cf.subclass;
  const chooseNow = list.filter(t=>t.choose);
  const picksNow = list.filter(t=>t.picks);
  let h = `<div class="cs-modal-box lu-box"><div class="cs-modal-head"><h2>Level Up to ${LU.to}</h2><button type="button" class="roll-close" data-lu-close aria-label="Close">&times;</button></div>`;
  // Hit points
  const ruleText = {choice:`Roll your hit die (d${die}) or take the average (${avg})`, average:`Your campaign uses the average of your hit die (${avg})`, roll:`Your campaign rolls your hit die (d${die})`, max:`Your campaign gives the maximum of your hit die (${die})`}[rule];
  h += `<div class="lu-sec"><h3>Hit Points</h3><p class="cs-none">${ruleText}, then add your Constitution modifier (${fmtMod(con)})${dwarf ? ' and 1 for Dwarven Toughness' : ''}.</p>`
    + `<div class="lu-row">${rule === 'choice' || rule === 'roll' ? `<button type="button" class="${LU.hp && LU.hp.how === 'roll' ? '' : 'ghost'}" data-lu-hp="roll"${LU.hp && LU.hp.how === 'roll' ? ' disabled' : ''}>Roll d${die}</button>` : ''}`
    + `${rule === 'choice' ? `<button type="button" class="${LU.hp && LU.hp.how === 'average' ? '' : 'ghost'}" data-lu-hp="average"${LU.hp && LU.hp.how === 'roll' ? ' disabled' : ''}>Take ${avg}</button>` : ''}`
    + (LU.hp ? `<span class="lu-hp">${LU.hp.how === 'roll' ? `Rolled <b>${LU.hp.value}</b>` : LU.hp.how === 'max' ? `Maximum <b>${LU.hp.value}</b>` : `Average <b>${LU.hp.value}</b>`} ${fmtMod(con)}${dwarf ? ' +1' : ''} = <b>+${luGain()}</b> hit points, <b>${luNewMax()}</b> in all</span>` : '') + `</div>`
    + (LU.hp && LU.hp.how === 'roll' ? `<p class="cs-none">Rolled, so that’s it: no rerolls.</p>` : '') + `</div>`;
  // Subclass
  if(needSub){
    const subs = pickableSubclasses(entry);
    h += `<div class="lu-sec"><h3>${csEsc(entry.subclassLabel)}</h3><select data-lu-sub><option value="">Pick one…</option>${subs.map(s=>`<option${s === LU.sub ? ' selected' : ''}>${csEsc(s)}</option>`).join('')}</select></div>`;
  }
  // New features
  if(list.length || racial.length){
    h += `<div class="lu-sec"><h3>New at Level ${LU.to}</h3><ul class="lu-list">${list.map(t=>`<li><b>${csEsc(t.name)}</b> ${csEsc(t.desc || '')}`
      + (t.choose ? `<div><select data-lu-choice="${csEsc(t.name)}"><option value="">Pick one…</option>${(t.tiers || []).map(x=>`<option${LU.choices[t.name] === x.name ? ' selected' : ''}>${csEsc(x.name)}</option>`).join('')}</select></div>` : '')
      + `</li>`).join('')}${racial.map(t=>`<li><b>${csEsc(t.name)}</b> ${csEsc(t.desc)}</li>`).join('')}</ul>`
      + (picksNow.length ? `<p class="cs-none">${picksNow.map(t=>csEsc(t.name)).join(', ')}: make your picks in the Build box after leveling up.</p>` : '') + `</div>`;
  } else if(!needSub) h += `<div class="lu-sec"><h3>New at Level ${LU.to}</h3><p class="cs-none">No new class features at this level${spells && spells.length ? ', but your spellcasting grows' : ''}.</p></div>`;
  // Ability Score Improvement or a feat
  if(luAsiLevel()){
    const taken = new Set(Object.values(getSlots()).map(s=>s.feat).filter(Boolean));
    const opts = Object.keys(ABILITY_FULL).map(a=>{ const now = asiScoreWithout(LU.to, a); return `<option value="${a}"${now >= 20 ? ' disabled' : ''}>${ABILITY_FULL[a]} (${now})</option>`; }).join('');
    h += `<div class="lu-sec"><h3>Ability Score Improvement</h3><div class="lu-row"><label><input type="radio" name="luAsi" data-lu-asimode="asi"${LU.asiMode === 'asi' ? ' checked' : ''}> Raise ability scores</label><label><input type="radio" name="luAsi" data-lu-asimode="feat"${LU.asiMode === 'feat' ? ' checked' : ''}> Take a feat</label></div>`
      + (LU.asiMode === 'asi'
        ? `<p class="cs-none">+1 to two scores, or pick the same score twice for +2 (no higher than 20).</p><div class="lu-row"><select data-lu-asi="1"><option value="">+1 to…</option>${opts.replace(`value="${LU.asi1}"`, `value="${LU.asi1}" selected`)}</select><select data-lu-asi="2"><option value="">+1 to…</option>${opts.replace(`value="${LU.asi2}"`, `value="${LU.asi2}" selected`)}</select></div>`
          + (LU.asi1 && LU.asi1 === LU.asi2 && asiScoreWithout(LU.to, LU.asi1) > 18 ? `<p class="cs-none lu-warn">${ABILITY_FULL[LU.asi1]} would go over 20.</p>` : '')
        : `<p class="cs-none">Feats are an optional rule: check with your DM.</p><select data-lu-feat><option value="">Pick a feat…</option>${FEATS.filter(f=>!taken.has(f.name)).map(f=>`<option${f.name === LU.feat ? ' selected' : ''}>${csEsc(f.name)}</option>`).join('')}</select>`
          + (LU.feat && FEAT_BY_NAME[LU.feat] ? `<p class="cs-none">${csEsc(FEAT_BY_NAME[LU.feat].prereq ? 'Needs ' + FEAT_BY_NAME[LU.feat].prereq + '. ' : '')}${csEsc(FEAT_BY_NAME[LU.feat].desc)}</p>` : ''))
      + `</div>`;
  }
  // Spells
  if(spells && spells.length) h += `<div class="lu-sec"><h3>Spells</h3><ul class="lu-list">${spells.map(s=>`<li>${csEsc(s)}</li>`).join('')}</ul><p class="cs-none">Pick them on the Spells tab after leveling up: it shows your new limits.</p></div>`;
  const left = [!LU.hp && 'your hit points'].filter(Boolean);
  const later = [needSub && !LU.sub && entry.subclassLabel, ...chooseNow.filter(t=>!LU.choices[t.name]).map(t=>t.name), luAsiLevel() && !luAsiValue() && 'your Ability Score Improvement'].filter(Boolean);
  h += `<div class="lu-foot">${later.length ? `<p class="cs-none">Not picked yet: ${later.map(csEsc).join(', ')}. You can level up now and pick ${later.length === 1 ? 'it' : 'them'} in the Build box.</p>` : ''}`
    + `<button type="button" data-lu-go${left.length ? ' disabled' : ''}>Level up to ${LU.to}</button>${left.length ? `<span class="cs-none"> First: ${left.join(', ')}.</span>` : ''}</div></div>`;
  dlg.innerHTML = h;
}
function luAsiValue(){
  if(LU.asiMode === 'feat') return LU.feat ? {feat:LU.feat} : null;
  if(!LU.asi1 || !LU.asi2) return null;
  const asi = {}; asi[LU.asi1] = (asi[LU.asi1] || 0) + 1; asi[LU.asi2] = (asi[LU.asi2] || 0) + 1;
  if(Object.entries(asi).some(([a, n])=>asiScoreWithout(LU.to, a) + n > 20)) return null;
  return {asi};
}
function openLevelUp(){
  if(!csDb()) return;
  const lv = currentCore.level || 1; if(lv >= 20) return;
  Object.assign(LU, {to:lv + 1, hp:null, sub:'', choices:{}, asiMode:'asi', asi1:'', asi2:'', feat:''});
  let dlg = document.getElementById('levelUp');
  if(!dlg){
    dlg = document.createElement('div'); dlg.id = 'levelUp'; dlg.className = 'cs-modal'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Level up');
    document.body.appendChild(dlg);
    dlg.addEventListener('click', e=>{
      if(e.target === dlg || e.target.closest('[data-lu-close]')){ dlg.hidden = true; return; }
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.luHp){ const die = hitDie(), rule = luHpRule(); if(b.dataset.luHp === 'average' && rule !== 'choice') return; if(b.dataset.luHp === 'roll' && !['choice', 'roll'].includes(rule)) return; if(b.dataset.luHp === 'roll'){ if(!LU.hp || LU.hp.how !== 'roll') LU.hp = {how:'roll', value:luRoll(die)}; } else LU.hp = {how:'average', value:hpAverage(die)}; renderLevelUp(); }
      else if(b.dataset.luGo !== undefined) finishLevelUp();
    });
    dlg.addEventListener('change', e=>{
      const d = e.target.dataset;
      if(d.luSub !== undefined) LU.sub = e.target.value;
      else if(d.luChoice) LU.choices[d.luChoice] = e.target.value;
      else if(d.luAsimode) LU.asiMode = d.luAsimode;
      else if(d.luAsi) LU['asi' + d.luAsi] = e.target.value;
      else if(d.luFeat !== undefined) LU.feat = e.target.value;
      else return;
      renderLevelUp();
    });
  }
  renderLevelUp();
  dlg.hidden = false;
}
function finishLevelUp(){
  if(!LU.hp) return;
  const to = LU.to, gain = luGain(), oldMax = hpMax();
  if(LU.sub) setSubclass(LU.sub);
  Object.entries(LU.choices).forEach(([name, v])=>{ if(v) setChoice(name, v); });
  const slot = luAsiLevel() ? luAsiValue() : null;
  if(slot) fillSlot(to, slot);
  storageSet(levelsKey(), JSON.stringify({...levelHistory(), [to]:{hp:gain, how:LU.hp.how, die:LU.hp.value}}));
  csSaveCore('hpMax', (currentCore.hpMax || 0) + gain);
  if(typeof currentCore.hpCur === 'number') csSaveCore('hpCur', currentCore.hpCur + gain);
  csSaveCore('level', to, true);   // the whole page follows the new level
  // Current hit points rise with the maximum (including what Constitution increases and Tough add)
  const newMax = hpMax();
  if(track.hp !== null && oldMax !== null && newMax !== null){ track.hp = Math.max(0, track.hp + (newMax - oldMax)); saveTrack(); renderResources(); }
  document.getElementById('levelUp').hidden = true;
  const m = document.getElementById('cdLevelMsg');
  if(m) m.textContent = `Now level ${to}: +${gain} hit points.${spellLimits() && !spellLimits().none ? ' New spells: pick them on the Spells tab.' : ''}`;
  csFlash(`Level ${to}!`);
}
// Level down: back one level, taking off the hit points that level added (if Turnkeeper recorded them)
function levelDown(quiet){
  if(!csDb()) return;
  const lv = currentCore.level || 1; if(lv <= 1) return;
  const rec = levelHistory()[lv], hp = rec ? rec.hp : null;
  if(!quiet && !confirm(`Go back to level ${lv - 1}?${hp ? ` Your hit point maximum drops by ${hp} (what level ${lv} added).` : ' Lower your hit point maximum in Edit Character if it went up.'}`)) return;
  const oldMax = hpMax();
  if(hp){
    const hist = levelHistory(); delete hist[lv]; storageSet(levelsKey(), Object.keys(hist).length ? JSON.stringify(hist) : null);
    csSaveCore('hpMax', Math.max(1, (currentCore.hpMax || 1) - hp));
    if(typeof currentCore.hpCur === 'number') csSaveCore('hpCur', Math.max(0, Math.min(currentCore.hpCur - hp, currentCore.hpMax)));
  }
  csSaveCore('level', lv - 1, true);
  const newMax = hpMax();
  if(track.hp !== null && newMax !== null){ track.hp = Math.min(track.hp, newMax); saveTrack(); renderResources(); }
  const m = document.getElementById('cdLevelMsg'); if(m) m.textContent = `Back to level ${lv - 1}.`;
  csFlash('Saved.');
}
window.tkLevelUp = openLevelUp;

/* ---------- The DM levels you up (or down) from the DM Screen ----------
   The request arrives at campaigns/<c>/levelups/<this character> (the module script hands it to
   tkLevelRequest). Up: the level-up screen plays, listing what the new level unlocks (grouped:
   "2 more spells known", not each spell), and the level is taken: at once when hit points need no
   choice (the campaign's average or maximum), else the Level Up window opens for that one choice.
   Anything else (a subclass, an Ability Score Improvement, spells) goes to the choices banner.
   Down: quietly back a level. Either way the request is then cleared. */
const LU_HANDLED = new Set();
// What the next level brings, as short lines for the level-up screen
function luUnlocks(){
  const out = [], {list, racial} = luFeatures(), spells = luSpells() || [], entry = CLASS_FEATURES[cf.classKey];
  const pbNow = 2 + Math.floor((LU.to - 2) / 4), pbNew = 2 + Math.floor((LU.to - 1) / 4);
  if(LU.hp) out.push({k:'hp', t:`+${luGain()} hit points (${luNewMax()} in all)`});
  if(entry && LU.to === entry.subclassLevel && !cf.subclass) out.push({k:'pick', t:`Choose your ${entry.subclassLabel}`});
  // (the class's own 'Martial Archetype' / 'Druid Circle' entry is just the reminder to pick: the pick line covers it)
  list.filter(t=>!t.choose && !t.picks && !/^Ability Score Improvement$/.test(t.name) && !(entry && t.name === entry.subclassLabel)).forEach(t=>out.push({k:'feat', t:t.name}));
  if(luAsiLevel()) out.push({k:'pick', t:'Ability Score Improvement (or a feat)'});
  list.filter(t=>t.choose).forEach(t=>out.push({k:'pick', t:`Choose: ${t.name}`}));
  list.filter(t=>t.picks).forEach(t=>out.push({k:'pick', t:`New picks: ${t.name}`}));
  racial.forEach(t=>out.push({k:'feat', t:t.name}));
  spells.forEach(t=>out.push({k:'spell', t:t.replace(/ \(\d+ in all\)/, '').replace(/: \d+ in all$/, '')}));
  if(pbNew > pbNow) out.push({k:'feat', t:`Proficiency bonus +${pbNew}`});
  return out;
}
// The level-up screen: an original take on a big RPG level-up (golden light, the new level, then what it unlocks)
function playLevelUpFx(to, clsName, items){
  return new Promise(done=>{
    document.getElementById('lvlFx')?.remove();
    const fx = document.createElement('div'); fx.id = 'lvlFx'; fx.setAttribute('role', 'dialog'); fx.setAttribute('aria-label', 'Level up');
    const sparks = Array.from({length:18}, (_, i)=>`<i style="--x:${(i * 37) % 100}%;--d:${2 + (i % 5) * 0.4}s;--t:${(i % 7) * 0.25}s;--s:${3 + (i % 3) * 2}px"></i>`).join('');
    // The rays turn around the ring (they sit inside its box), so they stay centered on it however long the list is
    fx.innerHTML = `<div class="lv-sparks">${sparks}</div><div class="lv-core">
      <div class="lv-ringwrap"><div class="lv-rays"></div><div class="lv-ring"><span>${to}</span></div></div>
      <div class="lv-title">LEVEL UP</div><div class="lv-sub">${escapeHtml(clsName)} · Level ${to}</div>
      <ul class="lv-list">${items.map((x, i)=>`<li class="lv-${x.k}" style="--i:${i}">${escapeHtml(x.t)}</li>`).join('') || '<li style="--i:0">Your new level</li>'}</ul>
      <button type="button" class="lv-go" style="--i:${items.length + 1}">Continue</button></div>`;
    document.body.appendChild(fx);
    requestAnimationFrame(()=>fx.classList.add('on'));
    const close = ()=>{ fx.classList.add('off'); setTimeout(()=>fx.remove(), 450); done(); };
    fx.querySelector('.lv-go').addEventListener('click', close);
    fx.addEventListener('keydown', e=>{ if(e.key === 'Escape' || e.key === 'Enter') close(); });
    setTimeout(()=>fx.querySelector('.lv-go').focus(), 1200);
  });
}
window.tkLevelRequest = async (req, clear)=>{
  if(!req || !csDb() || LU_HANDLED.has(req.id)) return;
  LU_HANDLED.add(req.id);
  const lv = currentCore.level || 1;
  if(req.dir === 'down'){ if(req.to === lv - 1) levelDown(true); clear(); return; }
  if(req.to !== lv + 1){ clear(); return; }   // already done, or out of step: nothing to do
  Object.assign(LU, {to:lv + 1, hp:null, sub:'', choices:{}, asiMode:'asi', asi1:'', asi2:'', feat:''});
  const rule = luHpRule(), die = hitDie();
  if(rule === 'average') LU.hp = {how:'average', value:hpAverage(die)};
  if(rule === 'max') LU.hp = {how:'max', value:die};
  const items = luUnlocks();
  clear();
  await playLevelUpFx(LU.to, classTitle(false), items);
  if(LU.hp) finishLevelUp();   // nothing to ask: the level is taken, and any choices go to the banner
  else openLevelUp();          // the hit points are the player's to roll or average
};
window.tkLevelDown = levelDown;
document.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ const d = document.getElementById('levelUp'); if(d && !d.hidden) d.hidden = true; } });
