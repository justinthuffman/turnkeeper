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
let tabDrag = null;
document.addEventListener('pointerdown', e=>{
  const b = e.target.closest && e.target.closest('#tkTabs [data-tab]'); if(!b || e.button > 0) return;
  tabDrag = {key:b.dataset.tab, x:e.clientX, moved:false, id:e.pointerId};
});
document.addEventListener('pointermove', e=>{
  if(!tabDrag || e.pointerId !== tabDrag.id) return;
  if(!tabDrag.moved && Math.abs(e.clientX - tabDrag.x) < 8) return;
  tabDrag.moved = true; document.body.classList.add('tabs-dragging');
  const over = document.elementsFromPoint(e.clientX, e.clientY).find(el=>el.dataset && el.dataset.tab && el.closest('#tkTabs'));
  if(over && over.dataset.tab !== tabDrag.key) moveTab(tabDrag.key, over.dataset.tab);
});
document.addEventListener('pointerup', e=>{
  if(!tabDrag || e.pointerId !== tabDrag.id) return;
  const {key, moved} = tabDrag; tabDrag = null; document.body.classList.remove('tabs-dragging');
  if(!moved) showTab(key);
});
document.addEventListener('pointercancel', ()=>{ tabDrag = null; document.body.classList.remove('tabs-dragging'); });
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
