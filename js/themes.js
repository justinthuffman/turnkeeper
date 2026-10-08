/* ---------- Themes (the tracker and the DM Screen; the hub keeps its own short copy) ----------
   Loaded in each page's <head> before anything draws, so the saved theme applies with no flash.
   Colors live in themes.css and css/class-themes.css; fonts load from Google Fonts only when a
   theme that uses them is picked. The pick is saved per browser under dndTracker:theme. */
const GF = 'https://fonts.googleapis.com/css2?display=swap&family=';
const THEME_FONTS = {
  tome: GF + 'Cinzel:wght@400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400',
  keep: GF + 'MedievalSharp',
  inferno: GF + 'Pirata+One',
  // Class themes (css/class-themes.css); Cinzel Decorative is loaded by each page already
  'class-barbarian': GF + 'New+Rocker',
  'class-bard': GF + 'Playfair+Display:ital,wght@0,400;0,600;1,400&family=Playfair+Display+SC:ital,wght@0,400;0,700;1,400',
  'class-cleric': GF + 'Cormorant+Garamond:wght@400;600',
  'class-druid': GF + 'Uncial+Antiqua',
  'class-fighter': GF + 'Cinzel:wght@400;700',
  'class-monk': GF + 'Marcellus&family=Marcellus+SC',
  'class-paladin': GF + 'Cinzel:wght@400;700',
  'class-ranger': GF + 'Almendra:wght@400;700',
  'class-rogue': GF + 'IM+Fell+English+SC',
  'class-warlock': GF + 'Grenze+Gotisch:wght@400;600',
  'class-wizard': GF + 'Cormorant+SC:wght@500;600',
};
// Ember is the default look for anyone who hasn't picked a theme (Justin, 2026-09-30)
const DEFAULT_THEME = 'ember';
const THEMES = [
  {key:'harbor', name:'Harbor', bg:'#13293d', accent:'#4fb8a6'},
  {key:'midnight', name:'Midnight', bg:'#1a1730', accent:'#c9962f'},
  {key:'grove', name:'Grove', bg:'#16241c', accent:'#9ccf6f'},
  {key:'ember', name:'Ember', bg:'#221a1b', accent:'#b8433a'},
  {key:'daylight', name:'Daylight', bg:'#ffffff', accent:'#1d7a6e'},
  {key:'tome', name:'Tome', bg:'#f2e7cc', accent:'#7d1a16'},
  {key:'keep', name:'Keep', bg:'#3a2515', accent:'#d9ad56'},
  {key:'inferno', name:'Inferno', bg:'#170c0b', accent:'#d42a12'},
];
const CLASS_THEMES = [
  {key:'class-barbarian', name:'Barbarian', bg:'#241a14', accent:'#c4342a'},
  {key:'class-bard', name:'Bard', bg:'#2a1019', accent:'#e9c46a'},
  {key:'class-cleric', name:'Cleric', bg:'#fbf8f1', accent:'#c8a24a'},
  {key:'class-druid', name:'Druid', bg:'#152619', accent:'#a8d46a'},
  {key:'class-fighter', name:'Fighter', bg:'#1d232a', accent:'#3d73c4'},
  {key:'class-monk', name:'Monk', bg:'#f6f0e2', accent:'#b0281e'},
  {key:'class-paladin', name:'Paladin', bg:'#141b38', accent:'#f0c95a'},
  {key:'class-ranger', name:'Ranger', bg:'#2b2116', accent:'#4f8449'},
  {key:'class-rogue', name:'Rogue', bg:'#121219', accent:'#a98bf0'},
  {key:'class-sorcerer', name:'Sorcerer', bg:'#1f0c22', accent:'#ff5f8f'},
  {key:'class-warlock', name:'Warlock', bg:'#0c1510', accent:'#5cff9c'},
  {key:'class-wizard', name:'Wizard', bg:'#11152f', accent:'#8fb4ff'},
];
/* Each character keeps its own theme (dndTracker:theme:<character ID>), so Krunk's tab and
   Ezlo's tab can look different. A character with no pick of its own and the hub use the browser's
   main theme (dndTracker:theme), which stays in this browser, so each player picks their own.
   The DM Screen has its own (window.TK_THEME_KEY = dndTracker:dm:theme), saved to the DM's
   account with the rest of the DM's preferences (js/dm-store.js). */
function charIdNow(){
  if(window.tkCharId) return window.tkCharId;
  try{ return new URLSearchParams(location.search).get('char') || null; }catch(e){ return null; }
}
const themeStoreKey = ()=>{ if(window.TK_THEME_KEY) return window.TK_THEME_KEY; const id = charIdNow(); return id ? 'dndTracker:theme:' + id : 'dndTracker:theme'; };
const savedThemeKey = ()=>{
  try{
    if(window.TK_THEME_KEY) return localStorage.getItem(window.TK_THEME_KEY) || DEFAULT_THEME;
    const id = charIdNow(); return (id && localStorage.getItem('dndTracker:theme:' + id)) || localStorage.getItem('dndTracker:theme') || DEFAULT_THEME;
  }
  catch(e){ return DEFAULT_THEME; }
};
// "My class" (saved as 'class') is the open character's class theme. The class is remembered per
// character (dndTracker:classOf:<character ID>), so a character draws in it before it has loaded. With no
// character (the DM Screen), it's the default theme.
function resolveTheme(key){
  if(key !== 'class') return key;
  let cls = window.tkClassKey || null;
  if(!cls){ try{ const id = charIdNow(); if(id) cls = localStorage.getItem('dndTracker:classOf:' + id); }catch(e){} }
  return cls ? 'class-' + cls : DEFAULT_THEME;
}
function applyTheme(saved){
  const root = document.documentElement, key = resolveTheme(saved);
  if(key && key !== 'harbor') root.setAttribute('data-theme', key); else root.removeAttribute('data-theme');
  if(THEME_FONTS[key] && !document.getElementById('font-'+key)){
    const l = document.createElement('link');
    l.id = 'font-'+key; l.rel = 'stylesheet'; l.href = THEME_FONTS[key];
    document.head.appendChild(l);
  }
}
function setTheme(key){
  const ok = key === 'class' || THEMES.some(x=>x.key===key) || CLASS_THEMES.some(x=>x.key===key);
  key = ok ? key : THEMES[0].key;
  applyTheme(key);
  // On a character: just this character. Elsewhere: the browser's main theme. Saved even for Harbor,
  // since Ember is the default.
  try{ localStorage.setItem(themeStoreKey(), key); }catch(e){}
  renderThemeMenu();
}
// Settings → Theme: the themes, then the class themes ("My class" only on a character sheet)
function renderThemeMenu(){
  const menu = document.getElementById('themeMenu'); if(!menu) return;
  const cur = savedThemeKey(), onChar = !!document.getElementById('f_name');
  const opt = x=>`<button type="button" class="theme-option" data-theme-pick="${x.key}" aria-pressed="${x.key===cur}"><span class="theme-dot" style="background:linear-gradient(135deg, ${x.bg} 50%, ${x.accent} 50%);"></span>${x.name}</button>`;
  const mine = window.tkClassKey && CLASS_THEMES.find(x=>x.key === 'class-' + window.tkClassKey);
  menu.innerHTML = THEMES.map(opt).join('')
    + `<div class="theme-group">Class Themes</div>`
    + (onChar ? opt({key:'class', name:`My class${mine ? ` (${mine.name})` : ''}`, bg:mine ? mine.bg : '#555', accent:mine ? mine.accent : '#999'}) : '')
    + CLASS_THEMES.map(opt).join('');
  menu.querySelectorAll('[data-theme-pick]').forEach(b=>b.addEventListener('click', ()=>setTheme(b.dataset.themePick)));
}
applyTheme(savedThemeKey());
// A theme picked in another tab is followed here straight away: this character's own (another
// tab of the same character), or the main theme when this page has none of its own
window.addEventListener('storage', e=>{
  if(e.key === themeStoreKey() || (!window.TK_THEME_KEY && e.key === 'dndTracker:theme')){ applyTheme(savedThemeKey()); renderThemeMenu(); }
});
// The tracker calls this once a character is open
function themeForChar(id){ window.tkCharId = id || null; applyTheme(savedThemeKey()); renderThemeMenu(); }

/* ---------- Settings (the gear, top right): open and close ----------
   A click elsewhere, Escape or × closes it. It stays open after a pick so themes can be compared.
   opts.onOpen runs each time it opens. */
function setupSettings(opts){
  opts = opts || {};
  const box = document.getElementById('settings'), pop = document.getElementById('settingsPop'), btn = document.getElementById('settingsBtn');
  const show = open=>{ pop.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if(open && opts.onOpen) opts.onOpen(); };
  btn.addEventListener('click', ()=>show(pop.hidden));
  document.getElementById('settingsClose').addEventListener('click', ()=>{ show(false); btn.focus(); });
  // composedPath, not closest(): picking a theme rebuilds the menu, detaching the clicked button
  document.addEventListener('click', e=>{ if(!e.composedPath().includes(box)) show(false); });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && !pop.hidden){ show(false); btn.focus(); } });
  renderThemeMenu();
  return show;
}
