/* ---------- The DM's preferences, saved to the "DM account" (DM Screen only) ----------
   Everything the DM Screen keeps under dndTracker:dm:… (theme, panel order and folding, dice
   style and throw, each campaign's Session Notes, the fight and the recent rolls) is also saved
   in the database at dm/<account>/prefs, so the DM's screen looks and works the same on any
   device, like a character does. The account is "main" (or "test" in test mode); there are no
   logins yet. The page keeps using this browser's storage as it always has: this file copies
   each change up, and on opening copies the account down (reloading once if anything differed).
   Kept per browser: which campaign was last open. */
(()=>{
  const ACCOUNT = TEST_MODE ? 'test' : 'main';
  const LOCAL_ONLY = new Set(['dndTracker:dm:campaign']);
  const synced = k=>typeof k === 'string' && k.startsWith('dndTracker:dm:') && !LOCAL_ONLY.has(k);
  const enc = k=>encodeURIComponent(k).replace(/\./g, '%2E'), dec = k=>decodeURIComponent(k);
  const set0 = Storage.prototype.setItem, remove0 = Storage.prototype.removeItem;
  let pending = {}, timer = null, fb = null;
  function flush(){
    clearTimeout(timer);
    const patch = pending; pending = {};
    if(!Object.keys(patch).length) return;
    if(!fb){ Object.assign(pending, patch); timer = setTimeout(flush, 2000); return; }
    fb.fb.update(fb.fb.ref(fb.db, `dm/${ACCOUNT}/prefs`), patch).catch(err=>{
      console.warn('Saving the DM’s preferences:', err);
      pending = {...patch, ...pending}; timer = setTimeout(flush, 5000);
    });
  }
  const queue = (k, v)=>{ pending[enc(k)] = v; clearTimeout(timer); timer = setTimeout(flush, 500); };
  // Every save on this page also goes to the account
  Storage.prototype.setItem = function(k, v){ set0.call(this, k, v); if(this === localStorage && synced(k)) queue(k, String(v)); };
  Storage.prototype.removeItem = function(k){ remove0.call(this, k); if(this === localStorage && synced(k)) queue(k, null); };
  addEventListener('pagehide', flush);
  addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') flush(); });

  const localKeys = ()=>{ const out = {}; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(synced(k)) out[k] = localStorage.getItem(k); } return out; };
  // On opening: the account's copy wins. The first time (nothing saved yet), this browser's goes up.
  tkFirebase().then(async conn=>{
    fb = conn;
    const remote = (await fb.fb.get(fb.fb.ref(fb.db, `dm/${ACCOUNT}/prefs`))).val();
    const mine = localKeys();
    if(!remote){ Object.entries(mine).forEach(([k, v])=>{ pending[enc(k)] = v; }); flush(); return; }
    const theirs = Object.fromEntries(Object.entries(remote).map(([k, v])=>[dec(k), String(v)]));
    let changed = false;
    Object.entries(theirs).forEach(([k, v])=>{ if(!(enc(k) in pending) && mine[k] !== v){ set0.call(localStorage, k, v); changed = true; } });
    Object.keys(mine).forEach(k=>{ if(!(k in theirs) && !(enc(k) in pending)){ remove0.call(localStorage, k); changed = true; } });
    flush();
    // Show the account's copy: reload once (not again within a minute, in case of a loop)
    let last = 0; try{ last = +sessionStorage.getItem('dndTracker:dmSynced') || 0; }catch(e){}
    if(changed && Date.now() - last > 60000){ try{ sessionStorage.setItem('dndTracker:dmSynced', String(Date.now())); }catch(e){} location.reload(); }
  }).catch(err=>console.warn('DM preferences:', err));
})();
