/* ---------- What a character's race, class and background give them (Player's Handbook, 2014) ----------
   Used to fill the Details tab: languages and tools here show as automatic, and the player adds
   the rest (the "of your choice" ones are listed as reminders). */
const BACKGROUNDS = {
  'Acolyte':      {skills:['Insight', 'Religion'], languages:2, feature:'Shelter of the Faithful'},
  'Charlatan':    {skills:['Deception', 'Sleight of Hand'], tools:['Disguise Kit', 'Forgery Kit'], feature:'False Identity'},
  'Criminal':     {skills:['Deception', 'Stealth'], tools:["Thieves' Tools"], choose:['one gaming set'], feature:'Criminal Contact'},
  'Entertainer':  {skills:['Acrobatics', 'Performance'], tools:['Disguise Kit'], choose:['one musical instrument'], feature:'By Popular Demand'},
  'Folk Hero':    {skills:['Animal Handling', 'Survival'], vehicles:['Vehicles (land)'], choose:["one set of artisan's tools"], feature:'Rustic Hospitality'},
  'Guild Artisan':{skills:['Insight', 'Persuasion'], languages:1, choose:["one set of artisan's tools"], feature:'Guild Membership'},
  'Hermit':       {skills:['Medicine', 'Religion'], tools:['Herbalism Kit'], languages:1, feature:'Discovery'},
  'Noble':        {skills:['History', 'Persuasion'], languages:1, choose:['one gaming set'], feature:'Position of Privilege'},
  'Outlander':    {skills:['Athletics', 'Survival'], languages:1, choose:['one musical instrument'], feature:'Wanderer'},
  'Sage':         {skills:['Arcana', 'History'], languages:2, feature:'Researcher'},
  'Sailor':       {skills:['Athletics', 'Perception'], tools:["Navigator's Tools"], vehicles:['Vehicles (water)'], feature:"Ship's Passage"},
  'Soldier':      {skills:['Athletics', 'Intimidation'], vehicles:['Vehicles (land)'], choose:['one gaming set'], feature:'Military Rank'},
  'Urchin':       {skills:['Sleight of Hand', 'Stealth'], tools:['Disguise Kit', "Thieves' Tools"], feature:'City Secrets'},
};
const backgroundOf = text=>{ const t = String(text || '').trim().toLowerCase(); const k = Object.keys(BACKGROUNDS).find(b=>b.toLowerCase() === t); return k ? {name:k, ...BACKGROUNDS[k]} : null; };

// Languages from race, read from the race text so every Player's Handbook race is covered
// (Common for everyone; "extra" is how many more the player picks)
function raceLanguages(race){
  const r = String(race || '').toLowerCase(), out = {languages:['Common'], extra:0, tools:[]};
  if(/half[\s-]?orc/.test(r)) out.languages.push('Orc');
  else if(/half[\s-]?elf/.test(r)){ out.languages.push('Elvish'); out.extra = 1; }
  else if(/\belf\b|drow|eladrin/.test(r)) out.languages.push('Elvish');
  if(/dwar/.test(r)) out.languages.push('Dwarvish');
  if(/halfling/.test(r)) out.languages.push('Halfling');
  if(/gnome/.test(r)) out.languages.push('Gnomish');
  if(/rock gnome/.test(r)) out.tools.push("Tinker's Tools");
  if(/dragonborn/.test(r)) out.languages.push('Draconic');
  if(/tiefling/.test(r)) out.languages.push('Infernal');
  if(/human/.test(r) && !/half/.test(r)) out.extra = 1;
  if(/high elf/.test(r)) out.extra = 1;
  return out;
}
// Languages and tools from class (and subclass, from its level); "choose" are reminders
function classLanguagesTools(classKey, subclass, level){
  const out = {languages:[], tools:[], choose:[]};
  if(classKey === 'rogue'){ out.languages.push("Thieves' Cant"); out.tools.push("Thieves' Tools");
    if(/assassin/i.test(subclass || '') && level >= 3) out.tools.push('Disguise Kit', "Poisoner's Kit"); }
  if(classKey === 'druid'){ out.languages.push('Druidic'); out.tools.push('Herbalism Kit'); }
  if(classKey === 'bard') out.choose.push('three musical instruments');
  if(classKey === 'monk') out.choose.push("one set of artisan's tools or one musical instrument");
  return out;
}
