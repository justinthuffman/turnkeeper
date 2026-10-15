/* ---------- Connecting to Firebase (every page) ----------
   tkFirebase() loads Firebase (js/config.js has the project and version), waits until Firebase has
   restored whoever is signed in on this browser, and resolves {app, db, fb, auth, authMod, user}:
   fb is the Realtime Database module (ref, get, set, onValue…), user the signed-in account or null.
   V6: nobody is signed in invisibly any more; the hub signs people in (js/auth.js), and pages that
   need an account send visitors there (tkRequireUser). It connects once per page however often
   it's called. A failure (offline, blocked) rejects, and each page carries on without live features. */
let tkFirebasePromise = null;
function tkFirebase(){
  if(!tkFirebasePromise) tkFirebasePromise = Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-database.js'].map(f=>import(FB + f)))
    .then(async ([appMod, authMod, fb])=>{
      const app = appMod.initializeApp(FIREBASE_CONFIG), auth = authMod.getAuth(app);
      const user = await new Promise(ok=>{ const stop = authMod.onAuthStateChanged(auth, u=>{ stop(); ok(u); }); });
      return {app, db:fb.getDatabase(app), fb, auth, authMod, user};
    });
  return tkFirebasePromise;
}
// The signed-in account, or off to the hub to sign in (and back here afterwards)
async function tkRequireUser(){
  const f = await tkFirebase();
  if(f.user) return f;
  location.href = 'index.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
  return new Promise(()=>{});   // the page is leaving
}
