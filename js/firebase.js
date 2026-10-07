/* ---------- Connecting to Firebase (every page) ----------
   tkFirebase() loads Firebase (js/config.js has the project and version), signs in invisibly and
   resolves {app, db, fb}: fb is the Realtime Database module (ref, get, set, onValue…). It
   connects once per page however often it's called. A failure (offline, blocked) rejects, and each
   page carries on without live features. */
let tkFirebasePromise = null;
function tkFirebase(){
  if(!tkFirebasePromise) tkFirebasePromise = Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-database.js'].map(f=>import(FB + f)))
    .then(async ([appMod, authMod, fb])=>{
      const app = appMod.initializeApp(FIREBASE_CONFIG);
      await authMod.signInAnonymously(authMod.getAuth(app));
      return {app, db:fb.getDatabase(app), fb};
    });
  return tkFirebasePromise;
}
