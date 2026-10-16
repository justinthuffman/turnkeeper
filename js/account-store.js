/* ---------- Preferences that follow the account (every page) ----------
   V6: each account's look-and-feel is saved in the database at users/<account>/prefs, so it is the
   same on any device it signs in on. The page keeps using this browser's storage as it always has:
   this file copies each change up, and on opening copies the account's down (reloading once if
   anything differed). Load it right after js/firebase.js, before anything reads storage.
   Which keys follow the account:
   - DM Screen (window.TK_PREFS = 'dm'): everything under dndTracker:dm:… (theme, panels, dice style
     and throw, each campaign's Session Notes, the fight, the recent rolls), except which campaign
     was last open.
   - Other pages: theme (and each character's theme), panel order and folding, dice sound,
     crit effects, tabs and the backup reminder.
   Kept per browser: the last-open campaign, backups' dates, which characters were open. */
(()=>{
  const DM = window.TK_PREFS === 'dm';
  const PLAYER_KEY = /^dndTracker:(theme(:[^:]+)?|panels|collapsed|diceSound|critFx|tabs)$/;
  const synced = k=>typeof k === 'string' && (DM ? k.startsWith('dndTracker:dm:') && k !== 'dndTracker:dm:campaign' : PLAYER_KEY.test(k));
  const enc = k=>encodeURIComponent(k).replace(/\./g, '%2E'), dec = k=>decodeURIComponent(k);
  const set0 = Storage.prototype.setItem, remove0 = Storage.prototype.removeItem;
  let pending = {}, timer = null, fb = null, path = null, ready = false;   // ready: the account's copy is in
  function flush(){
    clearTimeout(timer);
    const patch = pending; pending = {};
    if(!Object.keys(patch).length) return;
    if(!ready){ Object.assign(pending, patch); return; }   // sent once the account's copy is in
    if(!path) return;   // nobody signed in: this browser only
    fb.fb.update(fb.fb.ref(fb.db, path), patch).catch(err=>{
      console.warn('Saving your preferences:', err);
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
  // On opening: the account's copy wins, even over what the page saved while loading (its defaults).
  // The first time (none of this page's kind saved yet), this browser's goes up.
  tkFirebase().then(async conn=>{
    fb = conn;
    if(!conn.user){ pending = {}; ready = true; return; }
    path = `${USERS}/${conn.user.uid}/prefs`;
    const remote = (await fb.fb.get(fb.fb.ref(fb.db, path))).val() || {};
    const theirs = Object.fromEntries(Object.entries(remote).map(([k, v])=>[dec(k), String(v)]).filter(([k])=>synced(k)));
    const mine = localKeys();
    ready = true;
    if(!Object.keys(theirs).length){ Object.entries(mine).forEach(([k, v])=>{ pending[enc(k)] = v; }); flush(); return; }
    let changed = false;
    Object.entries(theirs).forEach(([k, v])=>{ delete pending[enc(k)]; if(mine[k] !== v){ set0.call(localStorage, k, v); changed = true; } });
    Object.keys(mine).forEach(k=>{ if(!(k in theirs) && !(enc(k) in pending)){ remove0.call(localStorage, k); changed = true; } });
    flush();
    // Show the account's copy: reload once (not again within a minute, in case of a loop)
    const SEEN = 'dndTracker:prefsSynced:' + (DM ? 'dm' : 'player');
    let last = 0; try{ last = +sessionStorage.getItem(SEEN) || 0; }catch(e){}
    if(changed && Date.now() - last > 60000){ try{ sessionStorage.setItem(SEEN, String(Date.now())); }catch(e){} location.reload(); }
  }).catch(err=>console.warn('Your preferences:', err));
})();
