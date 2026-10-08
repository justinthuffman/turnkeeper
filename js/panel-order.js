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

  // Dragging. Picking a panel up shrinks every panel to its title bar (the whole list fits on
  // screen, and a short move passes a neighbour); the panel lifts out as a card under the pointer
  // and follows it anywhere, a dashed slot shows where it will land, and the others slide out of
  // the way. Letting go opens the panels again; Esc puts it back where it was.
  let drag = null;
  const slide = fn=>{   // move panels, animating the others from where they were (FLIP)
    if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){ fn(); return; }
    const before = new Map(all().filter(visible).map(p=>[p, p.getBoundingClientRect().top]));
    fn();
    before.forEach((top, p)=>{
      if(p === drag.panel) return;
      const dy = top - p.getBoundingClientRect().top; if(!dy) return;
      p.style.transition = 'none'; p.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(()=>{ p.style.transition = 'transform 0.16s ease'; p.style.transform = ''; });
    });
  };
  const place = (x, y)=>{ drag.card.style.left = (x - drag.dx) + 'px'; drag.card.style.top = (y - drag.dy) + 'px'; };
  box.addEventListener('pointerdown', e=>{
    const g = e.target.closest('.panel-grip'); if(!g || e.button > 0 || drag) return;
    e.preventDefault();
    const panel = g.parentElement;
    drag = {panel, grip:g, id:e.pointerId, from:order(), y:e.clientY, y0:e.clientY, raf:0};
    try{ g.setPointerCapture(e.pointerId); }catch(err){}   // keeps getting moves when the pointer leaves the grip
    document.body.classList.add('panels-sorting');
    // Keep the grabbed panel's (now short) bar under the pointer after everything shrinks
    const r = panel.getBoundingClientRect();
    scrollBy(0, r.top - (e.clientY - 22));
    const bar = panel.getBoundingClientRect();
    // The card hangs from the pointer by the same small amount wherever the bar ended up (near the
    // top or bottom of the page the scroll above can't line it up, and the card used to keep the gap)
    drag.dx = Math.min(Math.max(e.clientX - bar.left, 8), 40); drag.dy = 22;
    // The card in your hand: the panel's title bar
    const card = document.createElement('div');
    card.className = 'panel panel-held'; card.style.width = bar.width + 'px';
    card.innerHTML = `<span class="panel-grip-icon">⠿</span><h2></h2>`; card.querySelector('h2').textContent = title(panel);
    card.setAttribute('aria-hidden', 'true');
    document.body.appendChild(card); drag.card = card;
    panel.classList.add('panel-slot');
    place(e.clientX, e.clientY);
  });
  // Where a panel really sits, not where its slide animation is drawing it right now (measuring
  // mid-slide made the slot flicker back and forth, most of all with a finger on a phone)
  const settledTop = p=>{
    const t = getComputedStyle(p).transform, shift = t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0;
    const r = p.getBoundingClientRect(); return {top:r.top - shift, height:r.height};
  };
  // The next panel after this one (or the end marker), skipping whatever else sits between them
  const nextPanel = p=>{ let n = p.nextSibling; while(n && n !== end && !(n.nodeType === 1 && n.classList.contains('panel') && n.id)) n = n.nextSibling; return n || end; };
  // The slot goes before the first panel whose middle is below the card's middle
  function retarget(){
    const mid = drag.y - drag.dy + drag.card.offsetHeight / 2;
    const others = all().filter(p=>p !== drag.panel && visible(p));
    const target = others.find(p=>{ const r = settledTop(p); return mid < r.top + r.height / 2; });
    const ref = target || end;
    if(nextPanel(drag.panel) !== ref && drag.panel !== ref) slide(()=>box.insertBefore(drag.panel, ref));
  }
  // Near the top or bottom of the screen the page keeps scrolling while the pointer is held there
  // (not only while it moves), faster the closer it gets. Only once the pointer has moved toward
  // that edge: picking a panel up near an edge doesn't set the page scrolling by itself.
  function edgeScroll(){
    if(!drag) return;
    const y = drag.y, edge = 70;
    const speed = y < edge && y < drag.y0 - 8 ? -(edge - y) / 4 : y > innerHeight - edge && y > drag.y0 + 8 ? (y - (innerHeight - edge)) / 4 : 0;
    if(speed){ scrollBy(0, Math.round(speed)); retarget(); }
    drag.raf = requestAnimationFrame(edgeScroll);
  }
  box.addEventListener('pointermove', e=>{
    if(!drag || e.pointerId !== drag.id) return;
    drag.y = e.clientY;
    place(e.clientX, e.clientY);
    if(!drag.raf) drag.raf = requestAnimationFrame(edgeScroll);
    retarget();
  });
  function finish(cancel){
    const {panel, card, grip, id, from} = drag;
    cancelAnimationFrame(drag.raf);
    if(cancel) apply(from);
    card.remove(); panel.classList.remove('panel-slot');
    all().forEach(p=>{ p.style.transition = ''; p.style.transform = ''; });
    try{ grip.releasePointerCapture(id); }catch(err){}
    const y = panel.getBoundingClientRect().top;
    document.body.classList.remove('panels-sorting');
    scrollBy(0, panel.getBoundingClientRect().top - y);   // the panel stays where it was dropped as the others open up
    drag = null;
    if(!cancel) changed();
    grip.focus({preventScroll:true});
  }
  const stop = e=>{ if(drag && e.pointerId === drag.id) finish(e.type === 'pointercancel'); };
  box.addEventListener('pointerup', stop);
  box.addEventListener('pointercancel', stop);
  document.addEventListener('keydown', e=>{ if(drag && e.key === 'Escape'){ e.preventDefault(); finish(true); } });

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
  // Collapsing (opts.collapsible): a ▾/▸ toggle before each title, and the title itself, fold a
  // panel down to its title bar. opts.saveCollapsed(ids) keeps which ones are folded.
  function setCollapsed(id, on){
    const p = document.getElementById(id), t = p && p.querySelector('.panel-fold'); if(!t) return;
    p.classList.toggle('panel-collapsed', on);
    t.textContent = on ? '▸' : '▾';
    t.setAttribute('aria-expanded', String(!on));
    t.setAttribute('aria-label', `${on ? 'Expand' : 'Collapse'} the ${title(p)} panel`);
  }
  const collapsed = ()=>all().filter(p=>p.classList.contains('panel-collapsed')).map(p=>p.id);
  if(opts.collapsible){
    all().forEach(p=>{
      const h = p.querySelector('h2'); if(!h) return;
      const t = document.createElement('button');
      t.type = 'button'; t.className = 'panel-fold';
      h.parentElement.insertBefore(t, h);
      h.classList.add('panel-fold-title');
      setCollapsed(p.id, false);
    });
    (opts.collapsed || []).forEach(id=>setCollapsed(id, true));
    box.addEventListener('click', e=>{
      const hit = e.target.closest('.panel-fold, .panel-fold-title'); if(!hit) return;
      const p = hit.closest('.panel'); if(!p || p.parentElement !== box) return;
      setCollapsed(p.id, !p.classList.contains('panel-collapsed'));
      if(opts.saveCollapsed) opts.saveCollapsed(collapsed());
    });
  }
  function expand(id){ if(document.getElementById(id) && document.getElementById(id).classList.contains('panel-collapsed')){ setCollapsed(id, false); if(opts.saveCollapsed) opts.saveCollapsed(collapsed()); } }
  return {apply, reset, order, expand, collapsed};
}
