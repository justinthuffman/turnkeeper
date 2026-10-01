/* ---------- Panels in your own order (the tracker and the DM Screen) ----------
   Every panel (a .panel with an id, directly inside the container) gets a ⠿ grip by its title:
   drag it up or down with a mouse or a finger, or focus it and press the up and down arrow keys.
   The page decides where the order is kept (opts.save / apply). A saved order that doesn't know
   a panel (one added in a later version) leaves that panel in its default place.
   setupPanelOrder({container, save, onChange}) returns {apply(order), reset(), order()}. */
function setupPanelOrder(opts){
  const box = document.querySelector(opts.container);
  const all = ()=>[...box.children].filter(el=>el.classList.contains('panel') && el.id);
  const defaults = all().map(p=>p.id);
  if(!defaults.length) return {apply(){}, reset(){}, order:()=>[]};
  // The panels move among themselves, between two markers; nothing else on the page moves
  const start = document.createComment('panels'), end = document.createComment('/panels');
  box.insertBefore(start, document.getElementById(defaults[0]));
  const last = document.getElementById(defaults[defaults.length - 1]);
  box.insertBefore(end, last.nextSibling);
  const title = p=>{ const h = p.querySelector('h2'); return h ? h.textContent.trim() : p.id; };
  const order = ()=>all().map(p=>p.id);
  const visible = p=>!p.hidden && p.offsetParent !== null;

  function apply(saved){
    const want = (Array.isArray(saved) ? saved : []).filter(id=>defaults.includes(id));
    // Panels the saved order doesn't know go back where they'd be by default
    defaults.forEach((id, i)=>{
      if(want.includes(id)) return;
      const before = defaults.slice(0, i).reverse().find(x=>want.includes(x));
      want.splice(before ? want.indexOf(before) + 1 : 0, 0, id);
    });
    want.forEach(id=>box.insertBefore(document.getElementById(id), end));
  }
  function changed(){ opts.save(order()); if(opts.onChange) opts.onChange(order()); }
  function reset(){ apply(defaults); changed(); }

  // The grips
  all().forEach(p=>{
    const g = document.createElement('button');
    g.type = 'button'; g.className = 'panel-grip'; g.textContent = '⠿';
    g.title = 'Drag to move this panel (or use the arrow keys)';
    g.setAttribute('aria-label', `Move the ${title(p)} panel: drag it, or press the up and down arrow keys`);
    p.insertBefore(g, p.firstChild);
  });

  // Dragging: the panel moves through the list as the pointer passes the middle of the others
  let drag = null;
  box.addEventListener('pointerdown', e=>{
    const g = e.target.closest('.panel-grip'); if(!g || e.button > 0) return;
    e.preventDefault();
    drag = {panel:g.parentElement, grip:g, id:e.pointerId};
    try{ g.setPointerCapture(e.pointerId); }catch(err){}   // keeps getting moves when the pointer leaves the grip
    drag.panel.classList.add('panel-dragging'); document.body.classList.add('panels-dragging');
  });
  box.addEventListener('pointermove', e=>{
    if(!drag || e.pointerId !== drag.id) return;
    const y = e.clientY;
    if(y < 70) scrollBy(0, -14); else if(y > innerHeight - 70) scrollBy(0, 14);   // scroll while dragging near the edges
    const others = all().filter(p=>p !== drag.panel && visible(p));
    const target = others.find(p=>{ const r = p.getBoundingClientRect(); return y < r.top + r.height / 2; });
    const ref = target || end;
    if(drag.panel.nextSibling !== ref && drag.panel !== ref) box.insertBefore(drag.panel, ref);
  });
  const stop = e=>{
    if(!drag || e.pointerId !== drag.id) return;
    drag.panel.classList.remove('panel-dragging'); document.body.classList.remove('panels-dragging');
    try{ drag.grip.releasePointerCapture(drag.id); }catch(err){}
    drag = null; changed();
  };
  box.addEventListener('pointerup', stop);
  box.addEventListener('pointercancel', stop);

  // Keyboard: up and down arrows move the panel past its visible neighbour
  box.addEventListener('keydown', e=>{
    const g = e.target.closest && e.target.closest('.panel-grip');
    if(!g || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const p = g.parentElement, list = all().filter(x=>x === p || visible(x)), i = list.indexOf(p);
    if(e.key === 'ArrowUp' && i > 0) box.insertBefore(p, list[i - 1]);
    else if(e.key === 'ArrowDown' && i < list.length - 1) box.insertBefore(p, list[i + 1].nextSibling);
    else return;
    g.focus(); p.scrollIntoView({block:'nearest'});
    changed();
  });
  return {apply, reset, order};
}
