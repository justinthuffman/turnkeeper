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

// Campaigns and their party. Hard-coded for now (Justin, 2026-09-28): later, players join a
// campaign from their account or a DM's invite link. `char` is the character's ID in the
// Turnkeeper database (campaigns/<campaign>/characters/<char>).
const CAMPAIGNS = [
  {key:'waterdeep', name:'Crisis in Waterdeep', party:[
    {name:'Bel', char:'14TFj-bb1ixAUl9bw_tNdcIpWtnYxeV8JW5f2kIbiW_Q', portrait:'portraits/bel.webp'},
    {name:'Ezlo', char:'1GqXXArCfLC42oVTF9XVrbNeKbw868HF1ih2S7VpX8jk', portrait:'portraits/ezlo.webp'},
    {name:'Krunk', char:'1vIvEke6E12m7il5voB2n5rJAqwgJeWf_2BZYJSKpYgU', portrait:'portraits/krunk.jpg'},
    {name:'Venthor', char:'1mS5Z2jgmi4U-bdEPP0JvZIkI-7puhWGjwlF8i6JIYbo', portrait:'portraits/venthor.webp'},
  ]},
];
// The campaign a character belongs to, or undefined
const campaignOfChar = id=>CAMPAIGNS.find(c=>c.party.some(p=>p.char === id));

// Test mode (?test=1 on the address, or any copy on this computer: localhost or a local file):
// everything goes to a separate 'test' campaign in the database, so testing never touches the
// real game
const TEST_MODE = (new URLSearchParams(location.search).has('test') || ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname));
const FBK = key=>TEST_MODE ? 'test' : key;
// Shared data is untrusted: strip HTML characters from every key and string
const clean = v=>typeof v === 'string' ? v.replace(/[<>"&`]/g, '').slice(0, 200) : Array.isArray(v) ? v.map(clean)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x])=>[k.replace(/[<>"&`]/g, ''), clean(x)])) : v;
