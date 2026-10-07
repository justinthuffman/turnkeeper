/* ---------- V5: characters in the database ----------
   A character lives at campaigns/<campaign>/characters/<id> in Firebase:
     core  the base facts (applyCore shows them): name, class, race, level, scores, proficiencies…
     kv    everything the tracker used to keep in this browser for the character: tracking (HP,
           charges, conditions), prepared spells, spellbook, pins, choices, feats, dice style…
     t     when it last changed
   The tracker's storageGet / storageSet send a character's keys here (charStoreGet / Set), so
   every feature saves to the character, and it follows the player to any device. Keys are
   stored without "dndTracker:" and with the character's ID as "@" ("track:@", "choice:@:Fighting
   Style"), percent-encoded for Firebase. Theme, the backup date and the class-theme hint stay in
   the browser. Writes are batched (0.4 s) and sent through window.tkDb (the Firebase module). */
const PER_BROWSER_KEY = /^dndTracker:(theme|backupAt|classOf|open):/;
const charStore = {id:null, campaign:null, kv:null, pending:{}, timer:null};
const encodeKvKey = k=>encodeURIComponent(k).replace(/\./g, '%2E');
function charKvKey(key){
  if(!charStore.kv || !charStore.id || PER_BROWSER_KEY.test(key) || !key.includes(charStore.id)) return null;
  return encodeKvKey(key.replace(/^dndTracker:/, '').split(charStore.id).join('@'));
}
// undefined: not a database key (use the browser); null: no value
function charStoreGet(key){ const k = charKvKey(key); return k === null ? undefined : (charStore.kv[k] ?? null); }
function charStoreSet(key, val){
  const k = charKvKey(key); if(k === null) return false;
  if(val === null) delete charStore.kv[k]; else charStore.kv[k] = String(val);
  charStore.pending[k] = val === null ? null : String(val);
  clearTimeout(charStore.timer); charStore.timer = setTimeout(flushCharStore, 400);
  return true;
}
function flushCharStore(){
  clearTimeout(charStore.timer);
  const patch = charStore.pending; charStore.pending = {};
  if(!Object.keys(patch).length || !charStore.id) return;
  if(!window.tkDb){ Object.assign(charStore.pending, patch); charStore.timer = setTimeout(flushCharStore, 2000); return; }
  window.tkDb.updateKv(charStore.campaign, charStore.id, patch).catch(err=>{
    console.warn('Saving the character:', err);
    charStore.pending = {...patch, ...charStore.pending}; charStore.timer = setTimeout(flushCharStore, 5000);   // try again
  });
}
// Send anything waiting when the page is hidden or closed (switching apps on a phone)
addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') flushCharStore(); });
addEventListener('pagehide', flushCharStore);

// window.tkDb appears once Firebase has signed in (the module script); wait for it
function tkDbReady(timeoutMs){
  if(window.tkDb) return Promise.resolve(window.tkDb);
  return new Promise((ok, bad)=>{
    const t0 = Date.now(), iv = setInterval(()=>{
      if(window.tkDb){ clearInterval(iv); ok(window.tkDb); }
      else if(Date.now() - t0 > (timeoutMs || 15000)){ clearInterval(iv); bad(new Error('Couldn’t reach the Turnkeeper database. Check your connection and refresh.')); }
    }, 100);
  });
}
