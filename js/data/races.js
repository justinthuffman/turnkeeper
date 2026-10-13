/* Moved from turnkeeper.html (refactor stage 2). */
/* ---------- Racial traits ---------- */
// PHB-only traits, checked against dnd5e.wikidot.com. Descriptions are paraphrased.
// Flavour and already-tracked info (age, size, languages, ASIs) is left out.
// `tiers` are parts that unlock at a character level; they're dimmed until reached.
const DARKVISION = {name:'Darkvision', desc:'See 60 ft in dim light as if bright, and in darkness as if dim (shades of gray only).'};
// Dragonborn ancestries (PHB): damage type, breath weapon shape, save
const DRAGON_ANCESTRIES = [
  ['Black', 'acid', '5 by 30 ft line', 'dex'], ['Blue', 'lightning', '5 by 30 ft line', 'dex'], ['Brass', 'fire', '5 by 30 ft line', 'dex'],
  ['Bronze', 'lightning', '5 by 30 ft line', 'dex'], ['Copper', 'acid', '5 by 30 ft line', 'dex'], ['Gold', 'fire', '15 ft cone', 'dex'],
  ['Green', 'poison', '15 ft cone', 'con'], ['Red', 'fire', '15 ft cone', 'dex'], ['Silver', 'cold', '15 ft cone', 'con'], ['White', 'cold', '15 ft cone', 'con'],
].map(([color, type, area, save])=>({name:color + ' dragon', type, area, save}));
// The character's ancestry (picked in Character Summary), or null
const dragonAncestry = ()=>typeof getChoice === 'function' ? DRAGON_ANCESTRIES.find(a=>a.name === getChoice('Draconic Ancestry')) || null : null;
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
  // Dwarf (2014 PHB): Hill and Mountain
  dwarf: {traits:[
    DARKVISION,
    {name:'Dwarven Resilience', desc:'Advantage on saves against poison, and resistance to poison damage.'},
    {name:'Dwarven Combat Training', desc:'Proficient with the battleaxe, handaxe, light hammer and warhammer.'},
    {name:'Tool Proficiency', desc:'Proficient with one of: smith’s tools, brewer’s supplies or mason’s tools (add it under Proficiencies).'},
    {name:'Stonecunning', desc:'On an Intelligence (History) check about the origin of stonework, you count as proficient and add double your proficiency bonus.'},
    {name:'Dwarven Speed', desc:'Base walking speed is 25 ft, and heavy armor doesn’t reduce it.'},
  ]},
  hilldwarf: {base:'dwarf', traits:[
    {name:'Dwarven Toughness', desc:'+1 hit point maximum per level (already part of your hit point maximum).'},
  ]},
  mountaindwarf: {base:'dwarf', traits:[
    {name:'Dwarven Armor Training', desc:'Proficient with light and medium armor.'},
  ]},
  // Halfling: Lightfoot and Stout
  halfling: {traits:[
    {name:'Lucky', desc:'When you roll a 1 on the d20 for an attack roll, ability check or saving throw, reroll it and use the new roll.'},
    {name:'Brave', desc:'Advantage on saves against being frightened.'},
    {name:'Halfling Nimbleness', desc:'You can move through the space of any creature that is a size larger than you.'},
    {name:'Halfling Speed', desc:'Base walking speed is 25 ft.'},
  ]},
  lightfoot: {base:'halfling', traits:[
    {name:'Naturally Stealthy', desc:'You can try to hide even when only obscured by a creature at least one size larger than you.'},
  ]},
  stout: {base:'halfling', traits:[
    {name:'Stout Resilience', desc:'Advantage on saves against poison, and resistance to poison damage.'},
  ]},
  // Human: nothing beyond ability scores and a language. Variant Human: a skill and a feat.
  human: {none:'Humans have no racial traits beyond +1 to every ability score (already in your scores) and an extra language.', traits:[]},
  varianthuman: {traits:[
    {name:'Skills', desc:'Proficient in one skill of your choice (tick it in your skills).'},
    {name:'Feat', desc:'You gain one feat at 1st level: pick it in the Feats section (Level 1).'},
  ]},
  // Dragonborn: the Draconic Ancestry choice sets the breath weapon and the resistance
  dragonborn: {traits:[
    {name:'Draconic Ancestry', choose:true, desc:'Pick your dragon. It sets your breath weapon’s damage type and shape, and your damage resistance.',
      tiers:DRAGON_ANCESTRIES.map(a=>({level:1, name:a.name, text:`${a.type} damage; breath weapon: ${a.area} (${a.save === 'con' ? 'Constitution' : 'Dexterity'} save).`}))},
    {name:'Breath Weapon', type:'action', uses:{max:()=>1, recharge:'short'},
      desc:'Exhale destructive energy (your Draconic Ancestry’s shape and damage type). Each creature in the area makes a save (DC 8 + your Constitution modifier + your proficiency bonus): 2d6 damage on a failure, half on a success. 3d6 at 6th level, 4d6 at 11th, 5d6 at 16th. Once per short or long rest.',
      rolls:()=>{
        const a = dragonAncestry(), n = charLevel() >= 16 ? 5 : charLevel() >= 11 ? 4 : charLevel() >= 6 ? 3 : 2;
        if(!a) return [{label:'Pick your dragon first', info:()=>'Choose your Draconic Ancestry (Character Summary) to set the damage type and save.'}];
        const dc = 8 + abilityScoreMod('con') + proficiencyBonus();
        return [{label:'Saving throw', info:()=>`Each creature in the ${a.area} makes a <b>DC ${dc} ${a.save === 'con' ? 'Constitution' : 'Dexterity'}</b> save: half damage on a success.`},
                {label:'Damage', cmd:()=>`${n}d6`, desc:()=>`${a.type} damage (half on a successful save)`, type:()=>a.type}];
      }},
    {name:'Damage Resistance', desc:'Resistance to the damage type of your Draconic Ancestry.'},
  ]},
  // Gnome: Forest and Rock
  gnome: {traits:[
    DARKVISION,
    {name:'Gnome Cunning', desc:'Advantage on Intelligence, Wisdom and Charisma saves against magic.'},
    {name:'Gnome Speed', desc:'Base walking speed is 25 ft.'},
  ]},
  forestgnome: {base:'gnome', traits:[
    {name:'Natural Illusionist', ability:'int', desc:'Intelligence is your spellcasting ability for it.',
      tiers:[{level:1, name:'Minor Illusion', text:'Cantrip; cast at will.'}]},
    {name:'Speak with Small Beasts', desc:'Through sounds and gestures, communicate simple ideas with Small or smaller beasts.'},
  ]},
  rockgnome: {base:'gnome', traits:[
    {name:'Artificer’s Lore', desc:'On an Intelligence (History) check about magic items, alchemical objects or technological devices, add double your proficiency bonus.'},
    {name:'Tinker', desc:'Proficient with tinker’s tools. Spend 1 hour and 10 gp of materials to build a Tiny clockwork device (AC 5, 1 HP): a toy, a fire starter or a music box. Up to three at a time; each works for 24 hours.'},
  ]},
  // Half-Elf
  halfelf: {traits:[
    DARKVISION,
    {name:'Fey Ancestry', desc:'Advantage on saves against being charmed; magic can’t put you to sleep.'},
    {name:'Skill Versatility', desc:'Proficient in two skills of your choice (tick them in your skills).'},
  ]},
  // High Elf
  highelf: {base:'elf', traits:[
    {name:'Elf Weapon Training', desc:'Proficient with longsword, shortsword, shortbow and longbow.'},
    {name:'High Elf Cantrip', choose:true, ability:'int', desc:'One wizard cantrip of your choice; Intelligence is your spellcasting ability for it.',
      tiers:['Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Fire Bolt', 'Friends', 'Light', 'Mage Hand', 'Mending', 'Message', 'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp', 'True Strike']
        .map(name=>({level:1, name, text:'Cantrip; cast at will.'}))},
    {name:'Extra Language', desc:'One extra language of your choice.'},
  ]},
};
// The PHB races and subraces, for the Race box's suggestions
const PHB_RACES = ['Hill Dwarf', 'Mountain Dwarf', 'High Elf', 'Wood Elf', 'Drow', 'Lightfoot Halfling', 'Stout Halfling', 'Human', 'Variant Human',
  'Dragonborn', 'Forest Gnome', 'Rock Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];

function raceKeyFrom(race){
  const r = (race||'').toLowerCase();
  if(/half[\s-]?orc/.test(r)) return 'halforc';
  if(/half[\s-]?elf/.test(r)) return 'halfelf';
  if(r.includes('drow') || r.includes('dark elf')) return 'drow';
  if(r.includes('wood elf')) return 'woodelf';
  if(r.includes('high elf')) return 'highelf';
  if(r.includes('tiefling')) return 'tiefling';
  if(/\belf\b/.test(r)) return 'elf';
  if(r.includes('dwarf')) return r.includes('hill') ? 'hilldwarf' : r.includes('mountain') ? 'mountaindwarf' : 'dwarf';
  if(r.includes('halfling')) return r.includes('lightfoot') ? 'lightfoot' : r.includes('stout') ? 'stout' : 'halfling';
  if(r.includes('gnome')) return r.includes('forest') ? 'forestgnome' : r.includes('rock') ? 'rockgnome' : 'gnome';
  if(r.includes('dragonborn')) return 'dragonborn';
  if(r.includes('human')) return r.includes('variant') ? 'varianthuman' : 'human';
  return null;
}
function traitsForRace(key){
  const entry = RACIAL_TRAITS[key]; if(!entry) return [];
  const base = entry.base ? RACIAL_TRAITS[entry.base].traits.filter(t=>!(entry.replaces||[]).includes(t.name)) : [];
  return [...base, ...entry.traits].sort((a,b)=>a.name.localeCompare(b.name));
}
