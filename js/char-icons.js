/* ---------- Character icons: shared by the tracker and the DM Screen ----------
   By character ID. Krunk's is his own framed icon (Justin, 2026-10-02); the others are their
   portraits cropped to head and shoulders (zoom and position) inside a ring colored for the
   class. To use a framed icon like Krunk's for someone else, put it in portraits/ and give
   their entry {img:'portraits/…'} instead. */
const CHAR_ICONS = {
  '1vIvEke6E12m7il5voB2n5rJAqwgJeWf_2BZYJSKpYgU':{face:'portraits/krunk-portrait.jpg', zoom:'200%', pos:'66% 5%', ring:'paladin'},
  '14TFj-bb1ixAUl9bw_tNdcIpWtnYxeV8JW5f2kIbiW_Q':{face:'portraits/bel.webp', zoom:'180%', pos:'68% 5%', ring:'bard'},
  '1GqXXArCfLC42oVTF9XVrbNeKbw868HF1ih2S7VpX8jk':{face:'portraits/ezlo.webp', zoom:'200%', pos:'41% 4%', ring:'wizard'},
  '1mS5Z2jgmi4U-bdEPP0JvZIkI-7puhWGjwlF8i6JIYbo':{face:'portraits/venthor.webp', zoom:'170%', pos:'58% 8%', ring:'rogue'},
};
// Full addresses: a picture in a CSS variable is looked up from the stylesheet that uses it
// (css/), not from the page, so a bare "portraits/…" would point at css/portraits/
const iconUrl = p=>new URL(p, document.baseURI).href;
// Turn an element into a char's icon; false when that char has none
function applyCharIcon(el, char, label){
  const c = char && CHAR_ICONS[char]; if(!c) return false;
  el.className = (el.className.split(' ').filter(k=>k && !/^(char-icon|framed|ringed|bard|wizard|rogue|paladin)$/.test(k)).concat(['char-icon', c.img ? 'framed' : 'ringed ' + c.ring])).join(' ');
  el.style.backgroundImage = c.img ? `url("${iconUrl(c.img)}")` : '';
  el.style.setProperty('--face', c.face ? `url("${iconUrl(c.face)}")` : 'none');
  el.style.setProperty('--zoom', c.zoom || 'cover'); el.style.setProperty('--pos', c.pos || 'center');
  el.setAttribute('role', 'img'); if(label) el.setAttribute('aria-label', label);
  return true;
}
// The same, as HTML (for pages that draw cards with innerHTML); '' when the char has none
function charIconHtml(char, label, extraClass){
  const c = char && CHAR_ICONS[char]; if(!c) return '';
  const q = s=>String(s).replace(/[&"<>]/g, ch=>({'&':'&amp;', '"':'&quot;', '<':'&lt;', '>':'&gt;'}[ch]));
  const style = c.img ? `background-image:url('${iconUrl(c.img)}')` : `--face:url('${iconUrl(c.face)}');--zoom:${c.zoom || 'cover'};--pos:${c.pos || 'center'}`;
  return `<div class="char-icon ${c.img ? 'framed' : 'ringed ' + c.ring}${extraClass ? ' ' + extraClass : ''}" role="img" aria-label="${q(label || '')}" style="${q(style)}"></div>`;
}
