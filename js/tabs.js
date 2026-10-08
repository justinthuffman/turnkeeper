/* ---------- V5: the character page in tabs ----------
   Overview (summary, resources, status, combat), Details, Spells, Inventory and Notes. Only the
   chosen tab's panels show; within a tab, panels still drag into your own order (js/panel-order.js).
   Tabs drag into your own order too (or move with the arrow keys while one has focus). Which tab is
   open and the tab order are kept in this browser (dndTracker:tabs). Details, Inventory and Notes are for
   characters in the Turnkeeper database. */
const TK_TABS = [
  {key:'overview', label:'Overview', panels:['tablePanel', 'summaryPanel', 'resourcesPanel', 'statusPanel', 'combatPanel']},
  {key:'details', label:'Details', panels:['detailsPanel', 'profPanel', 'armsPanel'], db:true},
  {key:'spells', label:'Spells', panels:['spellsPanel']},
  {key:'inventory', label:'Inventory', panels:['goldPanel', 'gearPanel', 'invPanel'], db:true},
  {key:'notes', label:'Notes', panels:['notesPanel'], db:true},
];
const TABS_KEY = 'dndTracker:tabs';
const tabPrefs = (()=>{ try{ return JSON.parse(localStorage.getItem(TABS_KEY) || 'null') || {}; }catch(e){ return {}; } })();
const saveTabPrefs = ()=>{ try{ localStorage.setItem(TABS_KEY, JSON.stringify(tabPrefs)); }catch(e){} };
function tabOrder(){
  const known = TK_TABS.map(t=>t.key), want = (tabPrefs.order || []).filter(k=>known.includes(k));
  return [...want, ...known.filter(k=>!want.includes(k))].map(k=>TK_TABS.find(t=>t.key === k));
}
const tabAvailable = t=>!t.db || (typeof csDb === 'function' && csDb());
function showTab(key){
  const avail = tabOrder().filter(tabAvailable);
  const tab = avail.find(t=>t.key === key) || avail[0];
  tabPrefs.active = tab.key; saveTabPrefs();
  TK_TABS.forEach(t=>t.panels.forEach(id=>{ const p = document.getElementById(id); if(p) p.classList.toggle('tab-off', t.key !== tab.key); }));
  document.querySelectorAll('#tkTabs [data-tab]').forEach(b=>{ const on = b.dataset.tab === tab.key; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  if(tab.key === 'spells' && typeof renderSpellList === 'function') renderSpellList();
}
function renderTabs(){
  const bar = document.getElementById('tkTabs'); if(!bar) return;
  bar.innerHTML = tabOrder().filter(tabAvailable).map(t=>`<button type="button" role="tab" class="tk-tab" data-tab="${t.key}" aria-selected="false" title="Drag to reorder">${t.label}</button>`).join('')
    // Far right: Manual Roll (js/manual-roll.js), any dice, for whatever the tracker doesn't cover
    + `<button type="button" class="tk-manual" id="manualRollBtn" aria-haspopup="dialog" aria-expanded="false">Manual Roll</button>`;
  // A link can open a tab: turnkeeper.html?char=<id>&tab=inventory
  const asked = new URLSearchParams(location.search).get('tab');
  // (once it's available: Details, Inventory and Notes appear when the character has opened)
  const ready = asked && !renderTabs.done && tabOrder().filter(tabAvailable).some(t=>t.key === asked);
  if(ready) renderTabs.done = true;
  showTab(ready ? asked : (tabPrefs.active || 'overview'));
}
// Moving a tab: by dragging, or with arrow keys (Alt+arrow) while it has focus
// Put tab `key` where tab `overKey` is (the others shift along)
function moveTab(key, overKey){
  const order = tabOrder().map(t=>t.key), from = order.indexOf(key), to = order.indexOf(overKey);
  if(from < 0 || to < 0 || from === to) return;
  order.splice(from, 1); order.splice(to, 0, key);
  tabPrefs.order = order; saveTabPrefs(); renderTabs();
  const b = document.querySelector(`#tkTabs [data-tab="${key}"]`); if(b) b.focus();
}
// Dragging works like the panels (js/panel-order.js): the tab lifts out as a card under the
// pointer, a dashed slot shows where it will land, and the other tabs slide out of the way.
// Letting go keeps the new order; Esc puts it back.
let tabDrag = null;
const tabButtons = ()=>[...document.querySelectorAll('#tkTabs [data-tab]')];
function slideTabs(fn){   // move a tab, animating the others from where they were (FLIP)
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){ fn(); return; }
  const before = new Map(tabButtons().map(b=>{ const r = b.getBoundingClientRect(); return [b, [r.left, r.top]]; }));
  fn();
  before.forEach(([left, top], b)=>{
    if(b === tabDrag.btn) return;
    const r = b.getBoundingClientRect(), dx = left - r.left, dy = top - r.top; if(!dx && !dy) return;
    b.style.transition = 'none'; b.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(()=>{ b.style.transition = 'transform 0.16s ease'; b.style.transform = ''; });
  });
}
function startTabDrag(e){
  const b = tabDrag.btn, r = b.getBoundingClientRect();
  tabDrag.moved = true; tabDrag.dx = e.clientX - r.left; tabDrag.dy = e.clientY - r.top;
  const card = b.cloneNode(true);
  card.className = 'tk-tab tab-held'; card.removeAttribute('data-tab'); card.setAttribute('aria-hidden', 'true');
  card.style.width = r.width + 'px';
  document.body.appendChild(card); tabDrag.card = card;
  b.classList.add('tab-slot'); document.body.classList.add('tabs-dragging');
}
function endTabDrag(cancel){
  const {btn, card, key, from} = tabDrag;
  card.remove(); btn.classList.remove('tab-slot'); document.body.classList.remove('tabs-dragging');
  tabButtons().forEach(b=>{ b.style.transition = ''; b.style.transform = ''; });
  tabDrag = null;
  if(!cancel){
    const shown = tabButtons().map(b=>b.dataset.tab), hidden = tabOrder().map(t=>t.key).filter(k=>!shown.includes(k));
    tabPrefs.order = [...shown, ...hidden]; saveTabPrefs();
  } else tabPrefs.order = from;
  renderTabs();
  const nb = document.querySelector(`#tkTabs [data-tab="${key}"]`); if(nb) nb.focus({preventScroll:true});
}
document.addEventListener('pointerdown', e=>{
  const b = e.target.closest && e.target.closest('#tkTabs [data-tab]'); if(!b || e.button > 0 || tabDrag) return;
  tabDrag = {btn:b, key:b.dataset.tab, x:e.clientX, moved:false, id:e.pointerId, from:tabOrder().map(t=>t.key)};
  try{ b.setPointerCapture(e.pointerId); }catch(err){}
});
document.addEventListener('pointermove', e=>{
  if(!tabDrag || e.pointerId !== tabDrag.id) return;
  if(!tabDrag.moved){ if(Math.abs(e.clientX - tabDrag.x) < 8) return; startTabDrag(e); }
  tabDrag.card.style.left = (e.clientX - tabDrag.dx) + 'px'; tabDrag.card.style.top = (e.clientY - tabDrag.dy) + 'px';
  // The slot goes before the first tab whose middle is right of the pointer
  const mid = e.clientX;
  const bar = document.getElementById('tkTabs'), others = tabButtons().filter(b=>b !== tabDrag.btn);
  // Where each tab really sits, not mid-slide (measuring mid-slide made the slot flicker). On a
  // phone the tabs wrap onto two rows: the slot goes before the first tab in reading order that
  // is on a later row than the pointer, or on its row and right of it.
  const settled = b=>{ const t = getComputedStyle(b).transform, m = t && t !== 'none' ? new DOMMatrixReadOnly(t) : {m41:0, m42:0}, r = b.getBoundingClientRect();
    return {top:r.top - m.m42, bottom:r.bottom - m.m42, mid:r.left - m.m41 + r.width / 2}; };
  const y = e.clientY;
  const target = others.find(b=>{ const r = settled(b); return r.top > y || (y >= r.top && y <= r.bottom && mid < r.mid); }) || null;
  const before = target || document.getElementById('manualRollBtn');   // Manual Roll stays last
  if(tabDrag.btn.nextElementSibling !== before) slideTabs(()=>bar.insertBefore(tabDrag.btn, before));
});
document.addEventListener('pointerup', e=>{
  if(!tabDrag || e.pointerId !== tabDrag.id) return;
  if(tabDrag.moved) endTabDrag(false); else { const k = tabDrag.key; tabDrag = null; showTab(k); }
});
document.addEventListener('pointercancel', e=>{ if(tabDrag && e.pointerId === tabDrag.id){ if(tabDrag.moved) endTabDrag(true); else tabDrag = null; } });
document.addEventListener('keydown', e=>{ if(tabDrag && tabDrag.moved && e.key === 'Escape'){ e.preventDefault(); endTabDrag(true); } });
document.addEventListener('keydown', e=>{
  const b = e.target.closest && e.target.closest('#tkTabs [data-tab]'); if(!b) return;
  const keys = [...document.querySelectorAll('#tkTabs [data-tab]')].map(x=>x.dataset.tab), i = keys.indexOf(b.dataset.tab);
  if(e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
    e.preventDefault();
    const target = keys[i + (e.key === 'ArrowLeft' ? -1 : 1)];
    if(target) moveTab(b.dataset.tab, target);
    return;
  }
  if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
    e.preventDefault();
    const next = keys[(i + (e.key === 'ArrowLeft' ? -1 : 1) + keys.length) % keys.length];
    showTab(next); const nb = document.querySelector(`#tkTabs [data-tab="${next}"]`); if(nb) nb.focus();
  }
});
// Called when a character is shown (database characters get Details and Inventory)
window.tkTabsRefresh = renderTabs;
window.showTab = showTab;
renderTabs();
