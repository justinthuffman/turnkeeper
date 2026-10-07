/* ---------- Manual Roll (the tabs row, far right) ----------
   For anything the tracker doesn't cover: type any dice ("2d6+1d4+3", "1d20+5 adv") or tap the
   dice buttons to build them, then Roll. It's a normal roll (the same permission to roll, shown on
   every screen in your dice), labelled "Free Roll" in the combat log; a natural 20 or 1 on a d20
   shows a GIF from the To Hit pool (js/dice.js treats kind "free" as To Hit). */
(()=>{
  const DICE = [4, 6, 8, 10, 12, 20, 100];
  let box = null;
  function build(){
    box = document.createElement('div');
    box.id = 'manualRoll'; box.className = 'manual-roll'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Manual roll');
    box.innerHTML = `<div class="mr-head"><b>Manual Roll</b><button type="button" class="mr-close" aria-label="Close">&times;</button></div>`
      + `<div class="mr-dice">${DICE.map(s=>`<button type="button" class="chip-btn" data-mr-die="${s}">d${s}</button>`).join('')}<button type="button" class="chip-btn" data-mr-clear>Clear</button></div>`
      + `<div class="roll-cmd-row" data-dice="1d20"><span class="roll-what"><input class="roll-edit" id="mrDice" type="text" spellcheck="false" autocomplete="off" aria-label="Dice to roll" value="1d20" placeholder="e.g. 2d6+1d4+3"></span>`
      + `<button type="button" class="roll-btn" data-roll="Free Roll" data-fx-row="free">Roll</button></div>`
      + `<p class="mr-hint">Any dice: 2d6+3, 1d20+5 adv, 3d8+2d6. Tap a die to add one.</p>`;
    document.body.appendChild(box);
  }
  // Add one die of a size: "1d20" → tapping d20 again makes "2d20"; a new size is added on ("2d20+1d6")
  function addDie(sides){
    const inp = document.getElementById('mrDice');
    const terms = inp.value.replace(/\s+/g, '').split(/(?=[+-])/).filter(Boolean);
    const i = terms.findIndex(t=>new RegExp(`^\\+?(\\d*)d${sides}$`, 'i').test(t));
    if(i >= 0){ const m = terms[i].match(/^(\+?)(\d*)d/i); terms[i] = `${m[1]}${(+m[2] || 1) + 1}d${sides}`; }
    else terms.push(`${terms.length ? '+' : ''}1d${sides}`);
    inp.value = terms.join('');
  }
  function place(){
    const btn = document.getElementById('manualRollBtn'); if(!btn || !box) return;
    const r = btn.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
    box.style.width = w + 'px';
    box.style.left = Math.max(12, Math.min(r.right - w, innerWidth - w - 12)) + scrollX + 'px';
    box.style.top = r.bottom + 6 + scrollY + 'px';
  }
  function show(open){
    if(!box) build();
    box.hidden = !open;
    const btn = document.getElementById('manualRollBtn'); if(btn) btn.setAttribute('aria-expanded', String(open));
    if(open){ place(); const inp = document.getElementById('mrDice'); inp.focus(); inp.select(); }
  }
  document.addEventListener('click', e=>{
    if(e.target.closest('#manualRollBtn')){ show(!box || box.hidden); return; }
    if(!box || box.hidden) return;
    if(e.target.closest('.mr-close')){ show(false); return; }
    const die = e.target.closest('[data-mr-die]'); if(die){ addDie(+die.dataset.mrDie); return; }
    if(e.target.closest('[data-mr-clear]')){ const inp = document.getElementById('mrDice'); inp.value = ''; inp.focus(); return; }
    // A click on the dice card or crit GIF (from this roll) doesn't close it; anywhere else does
    if(!e.composedPath().includes(box) && !e.target.closest('#diceCard, #critFx')) show(false);
  });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && box && !box.hidden) show(false); });
  addEventListener('resize', ()=>{ if(box && !box.hidden) place(); });
})();
