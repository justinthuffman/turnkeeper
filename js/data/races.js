/* Moved from turnkeeper.html (refactor stage 2). */
/* ---------- Racial traits ---------- */
// PHB-only traits, checked against dnd5e.wikidot.com. Descriptions are paraphrased.
// Flavour and already-tracked info (age, size, languages, ASIs) is left out.
// `tiers` are parts that unlock at a character level; they're dimmed until reached.
const DARKVISION = {name:'Darkvision', desc:'See 60 ft in dim light as if bright, and in darkness as if dim (shades of gray only).'};
const RACIAL_TRAITS = {
  halforc: {traits:[
    DARKVISION,
    {name:'Menacing', desc:'Proficient in Intimidation.'},
    {name:'Relentless Endurance', uses:{max:()=>1, recharge:'long'}, desc:'When you drop to 0 HP but aren’t killed outright, go to 1 HP instead. Once per long rest.'},
    {name:'Savage Attacks', desc:'On a melee weapon crit, roll one extra weapon damage die and add it to the crit damage.'},
  ]},
  elf: {traits:[
    DARKVISION,
    {name:'Fey Ancestry', desc:'Advantage on saves against being charmed; magic can’t put you to sleep.'},
    {name:'Keen Senses', desc:'Proficient in Perception.'},
    {name:'Trance', desc:'No sleep needed; 4 hours of semi-conscious meditation gives the same benefit as 8 hours of sleep.'},
  ]},
  woodelf: {base:'elf', traits:[
    {name:'Elf Weapon Training', desc:'Proficient with longsword, shortsword, shortbow and longbow.'},
    {name:'Fleet of Foot', desc:'Base walking speed is 35 ft.'},
    {name:'Mask of the Wild', desc:'You can try to hide when only lightly obscured by natural things like foliage, heavy rain, falling snow or mist.'},
  ]},
  drow: {base:'elf', replaces:['Darkvision'], traits:[
    {name:'Drow Magic', ability:'cha', desc:'Charisma is the spellcasting ability for these spells.',
      tiers:[{level:1, name:'Dancing Lights', text:'Cantrip; cast at will.'},
             {level:3, name:'Faerie Fire', perRest:'long', text:'Cast once per long rest.'},
             {level:5, name:'Darkness', perRest:'long', text:'Cast once per long rest.'}]},
    {name:'Drow Weapon Training', desc:'Proficient with rapiers, shortswords and hand crossbows.'},
    {name:'Sunlight Sensitivity', desc:'Disadvantage on attack rolls and sight-based Perception checks in direct sunlight.'},
    {name:'Superior Darkvision', desc:'Darkvision out to 120 ft instead of 60.'},
  ]},
  tiefling: {traits:[
    DARKVISION,
    {name:'Hellish Resistance', desc:'Resistance to fire damage.'},
    {name:'Infernal Legacy', ability:'cha', desc:'Charisma is the spellcasting ability for these spells.',
      tiers:[{level:1, name:'Thaumaturgy', text:'Cantrip; cast at will.'},
             {level:3, name:'Hellish Rebuke', perRest:'long', castLevel:2, text:'Cast once per long rest as a 2nd-level spell (3d10 fire).'},
             {level:5, name:'Darkness', perRest:'long', text:'Cast once per long rest.'}]},
  ]},
};

function raceKeyFrom(race){
  const r = (race||'').toLowerCase();
  if(/half[\s-]?orc/.test(r)) return 'halforc';
  if(r.includes('drow') || r.includes('dark elf')) return 'drow';
  if(r.includes('wood elf')) return 'woodelf';
  if(r.includes('tiefling')) return 'tiefling';
  if(/\belf\b/.test(r) && !r.includes('half')) return 'elf';
  return null;
}
function traitsForRace(key){
  const entry = RACIAL_TRAITS[key]; if(!entry) return [];
  const base = entry.base ? RACIAL_TRAITS[entry.base].traits.filter(t=>!(entry.replaces||[]).includes(t.name)) : [];
  return [...base, ...entry.traits].sort((a,b)=>a.name.localeCompare(b.name));
}
