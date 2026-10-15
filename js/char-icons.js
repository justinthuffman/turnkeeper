/* ---------- Character icons: shared by the tracker, the DM Screen, the hub and the creator ----------
   A portrait cropped to the face (zoom and position) inside a coin colored for the class
   (css/char-icons.css), or an image that already has its frame (Krunk's).
   V6 stage 4: any character can have one. Its own portrait (core.portrait: a small uploaded
   picture or an https link) is lined up by its player (core.portraitFit {zoom, x, y}: zoom as a
   percent of the coin's width, x and y as the picture's position in percent). With no picture,
   the coin shows the character's initial. The four characters below were set up by hand before
   that, and keep these icons until their players pick a portrait of their own. */
const CHAR_ICONS = {
  '1vIvEke6E12m7il5voB2n5rJAqwgJeWf_2BZYJSKpYgU':{face:'portraits/krunk-portrait.jpg', zoom:'200%', pos:'66% 5%', ring:'paladin'},
  '14TFj-bb1ixAUl9bw_tNdcIpWtnYxeV8JW5f2kIbiW_Q':{face:'portraits/bel.webp', zoom:'180%', pos:'68% 5%', ring:'bard'},
  '1GqXXArCfLC42oVTF9XVrbNeKbw868HF1ih2S7VpX8jk':{face:'portraits/ezlo.webp', zoom:'200%', pos:'41% 4%', ring:'wizard'},
  '1mS5Z2jgmi4U-bdEPP0JvZIkI-7puhWGjwlF8i6JIYbo':{face:'portraits/venthor.webp', zoom:'170%', pos:'58% 8%', ring:'rogue'},
};
const ICON_CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
// The class in a character's class text ("Assassin Rogue" → rogue), or ''
const iconClassOf = cls=>ICON_CLASSES.find(k=>new RegExp('\\b' + k + '\\b', 'i').test(String(cls || ''))) || '';
// A portrait a character may use: a small uploaded picture, or an https link
const safePortraitUrl = v=>typeof v === 'string' && (/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(v) || /^https:\/\/[^\s"'<>()\\]+$/.test(v)) ? v : '';
const clampFit = f=>{ const n = (v, lo, hi, d)=>Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d; f = f || {}; return {zoom:n(f.zoom, 100, 400, 100), x:n(f.x, 0, 100, 50), y:n(f.y, 0, 100, 30)}; };
// Full addresses: a picture in a CSS variable is looked up from the stylesheet that uses it
// (css/), not from the page, so a bare "portraits/…" would point at css/portraits/
const iconUrl = p=>p.startsWith('data:') ? p : new URL(p, document.baseURI).href;
// What a character's icon shows: {img} (framed), {face, zoom, pos, ring}, or {initial, ring}; core is optional
function charIconSpec(char, core){
  const own = core && safePortraitUrl(core.portrait), ring = (core && iconClassOf(core.cls)) || (CHAR_ICONS[char] || {}).ring || 'plain';
  if(own){ const f = clampFit(core.portraitFit); return {face:own, zoom:f.zoom + '%', pos:`${f.x}% ${f.y}%`, ring}; }
  if(char && CHAR_ICONS[char]) return CHAR_ICONS[char];
  if(core) return {initial:String(core.name || '?').trim().charAt(0).toUpperCase() || '?', ring};
  return null;
}
const ICON_CLASS_RE = new RegExp('^(char-icon|framed|ringed|initial|plain|' + ICON_CLASSES.join('|') + ')$');
// Turn an element into a char's icon; false when that char has none
function applyCharIcon(el, char, label, core){
  const c = charIconSpec(char, core); if(!c) return false;
  el.className = el.className.split(' ').filter(k=>k && !ICON_CLASS_RE.test(k)).concat(['char-icon', c.img ? 'framed' : 'ringed ' + c.ring, ...(c.initial ? ['initial'] : [])]).join(' ');
  el.style.backgroundImage = c.img ? `url("${iconUrl(c.img)}")` : '';
  el.style.setProperty('--face', c.face ? `url("${iconUrl(c.face)}")` : 'none');
  el.style.setProperty('--zoom', c.zoom || 'cover'); el.style.setProperty('--pos', c.pos || 'center');
  if(c.initial) el.dataset.initial = c.initial; else delete el.dataset.initial;
  el.setAttribute('role', 'img'); if(label) el.setAttribute('aria-label', label);
  return true;
}
// The same, as HTML (for pages that draw cards with innerHTML); '' when the char has none
function charIconHtml(char, label, extraClass, core){
  const c = charIconSpec(char, core); if(!c) return '';
  const q = s=>String(s).replace(/[&"<>]/g, ch=>({'&':'&amp;', '"':'&quot;', '<':'&lt;', '>':'&gt;'}[ch]));
  const style = c.img ? `background-image:url('${iconUrl(c.img)}')` : c.face ? `--face:url('${iconUrl(c.face)}');--zoom:${c.zoom || 'cover'};--pos:${c.pos || 'center'}` : '';
  return `<div class="char-icon ${c.img ? 'framed' : 'ringed ' + c.ring}${c.initial ? ' initial' : ''}${extraClass ? ' ' + extraClass : ''}" role="img" aria-label="${q(label || '')}"${c.initial ? ` data-initial="${q(c.initial)}"` : ''}${style ? ` style="${q(style)}"` : ''}></div>`;
}
