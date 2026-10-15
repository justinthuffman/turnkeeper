/* ---------- Portrait: pick a picture and line it up in the class coin (V6 stage 4) ----------
   Shared by the character creator (Details) and the sheet (Details tab). A picture is uploaded
   (shrunk here to a small image, kept with the character) or linked (https). It's lined up by
   dragging it inside the coin and zooming with the slider; the coin is the same icon the sheet,
   the DM Screen and the hub show (js/char-icons.js).
   portraitEditorHtml(state) draws it, state = {portrait, fit:{zoom, x, y}, cls, name}; one editor
   per page, wired once with wirePortraitEditor({get, set}): get() returns the state now, set(changes)
   saves {portrait} and/or {fit} (the page redraws or not as it likes; dragging only moves the preview
   until the pointer lets go). */

// An uploaded picture, shrunk (longest side 320 px, then lower quality until it's about 40 KB at most)
function shrinkPicture(file){
  return new Promise((ok, bad)=>{
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = ()=>{
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 320 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let out = '';
      for(const q of [0.85, 0.75, 0.6, 0.45, 0.3]){
        out = c.toDataURL('image/webp', q);
        if(!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', q);   // browsers without WebP
        if(out.length <= 55000) break;
      }
      out.length <= 55000 ? ok(out) : bad(new Error('too big'));
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); bad(new Error('not a picture')); };
    img.src = url;
  });
}
// A picture's height over its width (loaded once and remembered; 1.3 until it has loaded)
const pfRatios = new Map();
function pfRatio(src){
  if(!src) return 1.3;
  if(!pfRatios.has(src)){ pfRatios.set(src, 1.3); const i = new Image(); i.onload = ()=>{ if(i.naturalWidth) pfRatios.set(src, i.naturalHeight / i.naturalWidth); }; i.src = src; }
  return pfRatios.get(src);
}
const pfEsc = s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
function portraitEditorHtml(st){
  pfRatio(safePortraitUrl(st.portrait));   // start loading its shape, for dragging
  const pic = safePortraitUrl(st.portrait), f = clampFit(st.fit);
  return `<div class="pf" data-pf>`
    + `<div class="pf-coin${pic ? ' pf-drag' : ''}" data-pf-preview title="${pic ? 'Drag the picture to move it' : ''}">${charIconHtml(null, 'Portrait', 'pf-icon', {portrait:pic, portraitFit:f, cls:st.cls, name:st.name})}</div>`
    + `<div class="pf-opts">`
    + (pic ? `<label class="pf-zoom"><span>Zoom</span><input type="range" min="100" max="400" step="5" value="${f.zoom}" data-pf-zoom aria-label="Zoom"></label>`
      + `<p class="pf-note">Drag the picture inside the coin to line up the face; use the slider to zoom.</p>`
      + `<button type="button" class="pf-link" data-pf-reset>Reset the position</button> · <button type="button" class="pf-link" data-pf-remove>Remove the picture</button>` : '')
    + `<div class="pf-row"><label class="pf-upload">Upload a picture<input type="file" accept="image/*" data-pf-file hidden></label></div>`
    + `<label class="pf-field"><span>Or paste a link to one (https://…)</span><input type="url" maxlength="400" placeholder="https://" data-pf-url value="${pfEsc(pic.startsWith('https://') ? pic : '')}"></label>`
    + `<p class="pf-note" data-pf-msg>${pic ? '' : 'The coin shows your initial until you add a picture. Its ring follows your class.'}</p></div></div>`;
}
let pfWired = false;
function wirePortraitEditor(api){
  if(pfWired) return; pfWired = true;
  const msg = t=>{ const m = document.querySelector('[data-pf-msg]'); if(m) m.textContent = t; };
  const icon = ()=>document.querySelector('[data-pf-preview] .char-icon');
  const show = fit=>{ const el = icon(); if(el){ el.style.setProperty('--zoom', fit.zoom + '%'); el.style.setProperty('--pos', `${fit.x}% ${fit.y}%`); } };
  document.addEventListener('change', async e=>{
    const t = e.target; if(!t.closest || !t.closest('[data-pf]')) return;
    if(t.matches('[data-pf-file]') && t.files[0]){
      msg('Shrinking the picture…');
      try{ api.set({portrait:await shrinkPicture(t.files[0]), fit:{zoom:100, x:50, y:30}}); }
      catch(err){ msg('That picture couldn’t be used. Try a JPG or PNG.'); }
    } else if(t.matches('[data-pf-url]')){
      const v = t.value.trim();
      if(!v){ if(String(api.get().portrait || '').startsWith('https://')) api.set({portrait:''}); return; }
      if(!safePortraitUrl(v)){ msg('That link has to start with https:// (the picture’s own address).'); return; }
      api.set({portrait:v, fit:{zoom:100, x:50, y:30}});
    } else if(t.matches('[data-pf-zoom]')) api.set({fit:{...clampFit(api.get().fit), zoom:+t.value}});
  });
  // The slider moves the preview as it slides (saved when it's let go: the change above)
  document.addEventListener('input', e=>{ if(e.target.matches && e.target.matches('[data-pf-zoom]')) show({...clampFit(api.get().fit), zoom:+e.target.value}); });
  document.addEventListener('click', e=>{
    const b = e.target.closest && e.target.closest('[data-pf-reset], [data-pf-remove]'); if(!b) return;
    if(b.matches('[data-pf-reset]')) api.set({fit:{zoom:100, x:50, y:30}});
    else api.set({portrait:'', fit:null});
  });
  // Dragging: the picture follows the pointer. Background positions are percents of how far the
  // picture overhangs the coin, so a pixel of dragging is 100 / overhang percent (and the
  // picture's shape sets the overhang up and down)
  let drag = null;
  document.addEventListener('pointerdown', e=>{
    const coin = e.target.closest && e.target.closest('[data-pf-preview].pf-drag'); if(!coin) return;
    e.preventDefault(); try{ coin.setPointerCapture(e.pointerId); }catch(err){}   // keeps the drag if the pointer leaves the coin
    const el = icon(), box = el ? el.getBoundingClientRect().width - 10 : 120, fit = clampFit(api.get().fit);   // 5 px of ring each side
    const w = box * fit.zoom / 100, h = w * pfRatio(api.get().portrait);
    drag = {x:e.clientX, y:e.clientY, overX:w - box, overY:h - box, fit, now:null};
  });
  document.addEventListener('pointermove', e=>{
    if(!drag) return;
    const dx = drag.overX > 1 ? (e.clientX - drag.x) / drag.overX * 100 : 0, dy = drag.overY > 1 ? (e.clientY - drag.y) / drag.overY * 100 : 0;
    drag.now = clampFit({...drag.fit, x:drag.fit.x - dx, y:drag.fit.y - dy});
    drag.now.x = Math.round(drag.now.x * 10) / 10; drag.now.y = Math.round(drag.now.y * 10) / 10;
    show(drag.now);
  });
  const end = ()=>{ if(drag && drag.now) api.set({fit:drag.now}); drag = null; };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
}
