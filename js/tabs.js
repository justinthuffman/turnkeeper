/* ---------- V5: the character page in tabs ----------
   Overview (summary, resources, status, combat, notes), Details, Spells and Inventory. Only the
   chosen tab's panels show; within a tab, panels still drag into your own order (js/panel-order.js).
   Tabs drag into your own order too (or move with the arrow keys while one has focus). Which tab is
   open and the tab order are kept in this browser (dndTracker:tabs). Details and Inventory are for
   characters in the Turnkeeper database; a character still on a Google Sheet doesn't show them. */
const TK_TABS = [
  {key:'overview', label:'Overview', panels:['tablePanel', 'summaryPanel', 'resourcesPanel', 'statusPanel', 'combatPanel', 'notesPanel']},
  {key:'details', label:'Details', panels:['detailsPanel', 'profPanel', 'armsPanel'], db:true},
  {key:'spells', label:'Spells', panels:['spellsPanel']},
  {key:'inventory', label:'Inventory', panels:['goldPanel', 'gearPanel', 'invPanel'], db:true},
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
  bar.innerHTML = tabOrder().filter(tabAvailable).map(t=>`<button type="button" role="tab" class="tk-tab" data-tab="${t.key}" aria-selected="false" title="Drag to reorder">${t.label}</button>`).join('');
  showTab(tabPrefs.active || 'overview');
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
  const before = new Map(tabButtons().map(b=>[b, b.getBoundingClientRect().left]));
  fn();
  before.forEach((left, b)=>{
    if(b === tabDrag.btn) return;
    const dx = left - b.getBoundingClientRect().left; if(!dx) return;
    b.style.transition = 'none'; b.style.transform = `translateX(${dx}px)`;
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
  const target = others.find(b=>{ const r = b.getBoundingClientRect(); return mid < r.left + r.width / 2; }) || null;
  if(tabDrag.btn.nextElementSibling !== target) slideTabs(()=>bar.insertBefore(tabDrag.btn, target));
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
