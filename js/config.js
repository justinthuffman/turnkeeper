/* ---------- Shared settings for every page (hub, tracker, DM Screen) ----------
   The Firebase project, the campaigns and their party, and test mode. Loaded first, as a plain
   script, so page scripts and module scripts can all use these. */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAuTuvMgF52vRQRyR0psfeyiIv31_svy-Y',
  authDomain: 'turnkeeper-7b835.firebaseapp.com',
  databaseURL: 'https://turnkeeper-7b835-default-rtdb.firebaseio.com',
  projectId: 'turnkeeper-7b835',
  appId: '1:866334063897:web:feaaa8b817f9b80ee69988',
};
const FB = 'https://www.gstatic.com/firebasejs/12.19.0/';

// Portraits for characters that have one in portraits/ (the hub's cards and the DM Screen's party).
// The character creator will let players add their own (V6 stage 4).
const PORTRAITS = {
  '14TFj-bb1ixAUl9bw_tNdcIpWtnYxeV8JW5f2kIbiW_Q':'portraits/bel.webp',
  '1GqXXArCfLC42oVTF9XVrbNeKbw868HF1ih2S7VpX8jk':'portraits/ezlo.webp',
  '1vIvEke6E12m7il5voB2n5rJAqwgJeWf_2BZYJSKpYgU':'portraits/krunk.jpg',
  '1mS5Z2jgmi4U-bdEPP0JvZIkI-7puhWGjwlF8i6JIYbo':'portraits/venthor.webp',
};

// Test mode (?test=1 on the address, or any copy on this computer: localhost or a local file):
// everything lives under sandbox/ in the database (its own accounts' records, characters and
// campaigns), so testing never touches the real game
const TEST_MODE = (new URLSearchParams(location.search).has('test') || ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname));
/* V6: where things live in the database
     users/<account>              name, email, and the campaigns they're in ({key: 'dm' | 'player'})
     characters/<id>              owner (account), campaign (key or none), core, kv (js/char-store.js)
     campaigns/<key>/meta         name, dm (account), invite (the code in its invite link)
     campaigns/<key>/members/<account>  role, char
     campaigns/<key>/…            combat, settings, live, effects, acts, rolls… (as before) */
const DBROOT = TEST_MODE ? 'sandbox/' : '';
const CAMP = key=>`${DBROOT}campaigns/${key}`;
const CHARS = `${DBROOT}characters`;
const USERS = `${DBROOT}users`;
// Shared data is untrusted: strip HTML characters from every key and string
const clean = v=>typeof v === 'string' ? v.replace(/[<>"&`]/g, '').slice(0, 200) : Array.isArray(v) ? v.map(clean)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x])=>[k.replace(/[<>"&`]/g, ''), clean(x)])) : v;
