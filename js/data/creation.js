/* ---------- What the character creator needs (Player's Handbook, 2014) ----------
   Ability score increases and speed by race, each class's level 1 basics (hit die, saving throws,
   skill choices, starting equipment, spells at level 1) and each background's equipment.
   The rest (racial and class features, proficiencies, automatic languages and tools) is already in
   js/data/races.js, classes.js, classes-phb.js, backgrounds.js and equipment.js, which the
   character sheet reads. */

// Race: ability increases, walking speed, size; pick: "+1 to N other scores of your choice";
// skills: skills of your choice; fixedSkills: proficiencies the race always has; hpPerLevel: Dwarven Toughness
const RACE_BUILD = {
  'Hill Dwarf':         {asi:{con:2, wis:1}, speed:25, size:'Medium', hpPerLevel:1},
  'Mountain Dwarf':     {asi:{con:2, str:2}, speed:25, size:'Medium'},
  'High Elf':           {asi:{dex:2, int:1}, speed:30, size:'Medium', fixedSkills:['Perception']},
  'Wood Elf':           {asi:{dex:2, wis:1}, speed:35, size:'Medium', fixedSkills:['Perception']},
  'Drow':               {asi:{dex:2, cha:1}, speed:30, size:'Medium', fixedSkills:['Perception']},
  'Lightfoot Halfling': {asi:{dex:2, cha:1}, speed:25, size:'Small'},
  'Stout Halfling':     {asi:{dex:2, con:1}, speed:25, size:'Small'},
  'Human':              {asi:{str:1, dex:1, con:1, int:1, wis:1, cha:1}, speed:30, size:'Medium'},
  'Variant Human':      {asi:{}, pick:2, skills:1, speed:30, size:'Medium', note:'An optional rule (Player’s Handbook, page 31) for tables that use feats: instead of +1 to every ability score, you get +1 to two scores, one skill and a feat. Ask your DM before picking it. You pick the feat in the Build box when the character opens.'},
  'Dragonborn':         {asi:{str:2, cha:1}, speed:30, size:'Medium'},
  'Forest Gnome':       {asi:{int:2, dex:1}, speed:25, size:'Small'},
  'Rock Gnome':         {asi:{int:2, con:1}, speed:25, size:'Small'},
  'Half-Elf':           {asi:{cha:2}, pick:2, skills:2, speed:30, size:'Medium'},
  'Half-Orc':           {asi:{str:2, con:1}, speed:30, size:'Medium', fixedSkills:['Intimidation']},
  'Tiefling':           {asi:{cha:2, int:1}, speed:30, size:'Medium'},
};

// The nine races, each with its subraces (the race names above). A race with one entry has no subraces.
const RACE_GROUPS = [
  {name:'Dwarf', blurb:'Constitution +2 · 25 ft', subs:[['Hill Dwarf'], ['Mountain Dwarf']]},
  {name:'Elf', blurb:'Dexterity +2 · darkvision', subs:[['High Elf'], ['Wood Elf'], ['Drow', 'Drow (Dark Elf)']]},
  {name:'Halfling', blurb:'Dexterity +2 · lucky · Small', subs:[['Lightfoot Halfling'], ['Stout Halfling']]},
  {name:'Human', blurb:'+1 to every score · 30 ft', subs:[['Human', 'Standard Human'], ['Variant Human', 'Variant Human (optional rule)']]},
  {name:'Dragonborn', blurb:'Strength +2, Charisma +1 · breath weapon', subs:[['Dragonborn']]},
  {name:'Gnome', blurb:'Intelligence +2 · Small', subs:[['Forest Gnome'], ['Rock Gnome']]},
  {name:'Half-Elf', blurb:'Charisma +2, +1 to two others', subs:[['Half-Elf']]},
  {name:'Half-Orc', blurb:'Strength +2, Constitution +1', subs:[['Half-Orc']]},
  {name:'Tiefling', blurb:'Charisma +2, Intelligence +1', subs:[['Tiefling']]},
];
const raceGroupOf = race=>RACE_GROUPS.find(g=>g.subs.some(([r])=>r === race)) || null;

/* Starting equipment: each class has fixed items and a list of "(a) or (b)" choices. An option is
   {label, items:[[name, qty]], pick:[[kind, count]]}: pick asks for "any simple weapon" and so on. */
const WEAPON_PICKS = {
  simple:      {label:'a simple weapon', list:()=>WEAPONS.filter(w=>!w.martial)},
  simpleMelee: {label:'a simple melee weapon', list:()=>WEAPONS.filter(w=>!w.martial && w.melee)},
  martial:     {label:'a martial weapon', list:()=>WEAPONS.filter(w=>w.martial)},
  martialMelee:{label:'a martial melee weapon', list:()=>WEAPONS.filter(w=>w.martial && w.melee)},
  instrument:  {label:'a musical instrument', list:()=>GEAR.filter(g=>g.type === 'Musical Instrument')},
  arcane:      {label:'an arcane focus', list:()=>GEAR.filter(g=>g.type === 'Arcane Focus')},
  holy:        {label:'a holy symbol', list:()=>GEAR.filter(g=>g.type === 'Holy Symbol')},
  druidic:     {label:'a druidic focus', list:()=>GEAR.filter(g=>g.type === 'Druidic Focus')},
  artisan:     {label:"a set of artisan's tools", list:()=>GEAR.filter(g=>g.type === "Artisan's Tools")},
  gaming:      {label:'a gaming set', list:()=>GEAR.filter(g=>g.type === 'Gaming Set')},
};
const opt = (label, items, pick)=>({label, items:items || [], pick:pick || []});
const BOLTS = [['Light Crossbow', 1], ['Crossbow Bolts (20)', 1]];

// Spells at level 1: cantrips and spells known (or a spellbook); prepared casters prepare
// (ability modifier + level) each day from the whole list, so they pick here too.
const CLASS_BUILD = {
  barbarian:{name:'Barbarian', hd:12, saves:['str', 'con'],
    skills:{n:2, from:['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival']},
    fixed:[["Explorer's Pack", 1], ['Javelin', 4]],
    choices:[[opt('Greataxe', [['Greataxe', 1]]), opt('Any martial melee weapon', [], [['martialMelee', 1]])],
             [opt('Two handaxes', [['Handaxe', 2]]), opt('Any simple weapon', [], [['simple', 1]])]]},
  bard:{name:'Bard', hd:8, saves:['dex', 'cha'], skills:{n:3, from:'any'},
    fixed:[['Leather', 1], ['Dagger', 1]],
    choices:[[opt('Rapier', [['Rapier', 1]]), opt('Longsword', [['Longsword', 1]]), opt('Any simple weapon', [], [['simple', 1]])],
             [opt("Diplomat's pack", [["Diplomat's Pack", 1]]), opt("Entertainer's pack", [["Entertainer's Pack", 1]])],
             [opt('Lute', [['Lute', 1]]), opt('Another musical instrument', [], [['instrument', 1]])]],
    spells:{cantrips:2, known:4, ability:'cha'}},
  cleric:{name:'Cleric', hd:8, saves:['wis', 'cha'],
    skills:{n:2, from:['History', 'Insight', 'Medicine', 'Persuasion', 'Religion']},
    fixed:[['Shield', 1]], fixedPick:[['holy', 1]],
    choices:[[opt('Mace', [['Mace', 1]]), opt('Warhammer (if proficient)', [['Warhammer', 1]])],
             [opt('Scale mail', [['Scale Mail', 1]]), opt('Leather armor', [['Leather', 1]]), opt('Chain mail (if proficient)', [['Chain Mail', 1]])],
             [opt('Light crossbow and 20 bolts', BOLTS), opt('Any simple weapon', [], [['simple', 1]])],
             [opt("Priest's pack", [["Priest's Pack", 1]]), opt("Explorer's pack", [["Explorer's Pack", 1]])]],
    spells:{cantrips:3, prepared:true, ability:'wis'}},
  druid:{name:'Druid', hd:8, saves:['int', 'wis'],
    skills:{n:2, from:['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival']},
    fixed:[['Leather', 1], ["Explorer's Pack", 1]], fixedPick:[['druidic', 1]],
    choices:[[opt('Wooden shield', [['Shield', 1]]), opt('Any simple weapon', [], [['simple', 1]])],
             [opt('Scimitar', [['Scimitar', 1]]), opt('Any simple melee weapon', [], [['simpleMelee', 1]])]],
    spells:{cantrips:2, prepared:true, ability:'wis'}},
  fighter:{name:'Fighter', hd:10, saves:['str', 'con'],
    skills:{n:2, from:['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival']},
    fixed:[],
    choices:[[opt('Chain mail', [['Chain Mail', 1]]), opt('Leather armor, longbow and 20 arrows', [['Leather', 1], ['Longbow', 1], ['Arrows (20)', 1]])],
             [opt('A martial weapon and a shield', [['Shield', 1]], [['martial', 1]]), opt('Two martial weapons', [], [['martial', 2]])],
             [opt('Light crossbow and 20 bolts', BOLTS), opt('Two handaxes', [['Handaxe', 2]])],
             [opt("Dungeoneer's pack", [["Dungeoneer's Pack", 1]]), opt("Explorer's pack", [["Explorer's Pack", 1]])]]},
  monk:{name:'Monk', hd:8, saves:['str', 'dex'],
    skills:{n:2, from:['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth']},
    fixed:[['Dart', 10]],
    choices:[[opt('Shortsword', [['Shortsword', 1]]), opt('Any simple weapon', [], [['simple', 1]])],
             [opt("Dungeoneer's pack", [["Dungeoneer's Pack", 1]]), opt("Explorer's pack", [["Explorer's Pack", 1]])]]},
  paladin:{name:'Paladin', hd:10, saves:['wis', 'cha'],
    skills:{n:2, from:['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion']},
    fixed:[['Chain Mail', 1]], fixedPick:[['holy', 1]],
    choices:[[opt('A martial weapon and a shield', [['Shield', 1]], [['martial', 1]]), opt('Two martial weapons', [], [['martial', 2]])],
             [opt('Five javelins', [['Javelin', 5]]), opt('Any simple melee weapon', [], [['simpleMelee', 1]])],
             [opt("Priest's pack", [["Priest's Pack", 1]]), opt("Explorer's pack", [["Explorer's Pack", 1]])]]},
  ranger:{name:'Ranger', hd:10, saves:['str', 'dex'],
    skills:{n:3, from:['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']},
    fixed:[['Longbow', 1], ['Quiver', 1], ['Arrows (20)', 1]],
    choices:[[opt('Scale mail', [['Scale Mail', 1]]), opt('Leather armor', [['Leather', 1]])],
             [opt('Two shortswords', [['Shortsword', 2]]), opt('Two simple melee weapons', [], [['simpleMelee', 2]])],
             [opt("Dungeoneer's pack", [["Dungeoneer's Pack", 1]]), opt("Explorer's pack", [["Explorer's Pack", 1]])]]},
  rogue:{name:'Rogue', hd:8, saves:['dex', 'int'], expertise:2,
    skills:{n:4, from:['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth']},
    fixed:[['Leather', 1], ['Dagger', 2], ["Thieves' Tools", 1]],
    choices:[[opt('Rapier', [['Rapier', 1]]), opt('Shortsword', [['Shortsword', 1]])],
             [opt('Shortbow and a quiver of 20 arrows', [['Shortbow', 1], ['Quiver', 1], ['Arrows (20)', 1]]), opt('Shortsword', [['Shortsword', 1]])],
             [opt("Burglar's pack", [["Burglar's Pack", 1]]), opt("Dungeoneer's pack", [["Dungeoneer's Pack", 1]]), opt("Explorer's pack", [["Explorer's Pack", 1]])]]},
  sorcerer:{name:'Sorcerer', hd:6, saves:['con', 'cha'],
    skills:{n:2, from:['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion']},
    fixed:[['Dagger', 2]],
    choices:[[opt('Light crossbow and 20 bolts', BOLTS), opt('Any simple weapon', [], [['simple', 1]])],
             [opt('Component pouch', [['Component Pouch', 1]]), opt('An arcane focus', [], [['arcane', 1]])],
             [opt("Dungeoneer's pack", [["Dungeoneer's Pack", 1]]), opt("Explorer's pack", [["Explorer's Pack", 1]])]],
    spells:{cantrips:4, known:2, ability:'cha'}},
  warlock:{name:'Warlock', hd:8, saves:['wis', 'cha'],
    skills:{n:2, from:['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion']},
    fixed:[['Leather', 1], ['Dagger', 2]], fixedPick:[['simple', 1]],
    choices:[[opt('Light crossbow and 20 bolts', BOLTS), opt('Any simple weapon', [], [['simple', 1]])],
             [opt('Component pouch', [['Component Pouch', 1]]), opt('An arcane focus', [], [['arcane', 1]])],
             [opt("Scholar's pack", [["Scholar's Pack", 1]]), opt("Dungeoneer's pack", [["Dungeoneer's Pack", 1]])]],
    spells:{cantrips:2, known:2, ability:'cha'}},
  wizard:{name:'Wizard', hd:6, saves:['int', 'wis'],
    skills:{n:2, from:['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']},
    fixed:[['Spellbook', 1]],
    choices:[[opt('Quarterstaff', [['Quarterstaff', 1]]), opt('Dagger', [['Dagger', 1]])],
             [opt('Component pouch', [['Component Pouch', 1]]), opt('An arcane focus', [], [['arcane', 1]])],
             [opt("Scholar's pack", [["Scholar's Pack", 1]]), opt("Explorer's pack", [["Explorer's Pack", 1]])]],
    spells:{cantrips:3, book:6, prepared:true, ability:'int'}},
};
// Classes that pick their subclass at level 1
const LEVEL1_SUBCLASS = ['cleric', 'sorcerer', 'warlock'];

// Background equipment and the gold in its pouch; pick: [[kind, count]] for "a gaming set" and so on.
// Items that aren't on the equipment lists (a prayer book, a trophy) are kept as plain items.
const BACKGROUND_GEAR = {
  'Acolyte':      {gold:15, items:[['Prayer Book', 1], ['Incense (stick)', 5], ['Vestments', 1], ['Clothes, Common', 1], ['Pouch', 1]], pick:[['holy', 1]]},
  'Charlatan':    {gold:15, items:[['Clothes, Fine', 1], ['Disguise Kit', 1], ['Con Tools (of your choice)', 1], ['Pouch', 1]]},
  'Criminal':     {gold:15, items:[['Crowbar', 1], ['Clothes, Common', 1], ['Pouch', 1]]},
  'Entertainer':  {gold:15, items:[["Admirer's Favor", 1], ['Clothes, Costume', 1], ['Pouch', 1]], pick:[['instrument', 1]]},
  'Folk Hero':    {gold:10, items:[['Shovel', 1], ['Pot, Iron', 1], ['Clothes, Common', 1], ['Pouch', 1]], pick:[['artisan', 1]]},
  'Guild Artisan':{gold:15, items:[['Letter of Introduction', 1], ["Clothes, Traveler's", 1], ['Pouch', 1]], pick:[['artisan', 1]]},
  'Hermit':       {gold:5,  items:[['Case, Map or Scroll', 1], ['Blanket', 1], ['Clothes, Common', 1], ['Herbalism Kit', 1]]},
  'Noble':        {gold:25, items:[['Clothes, Fine', 1], ['Signet Ring', 1], ['Scroll of Pedigree', 1], ['Pouch', 1]]},
  'Outlander':    {gold:10, items:[['Quarterstaff', 1], ['Hunting Trap', 1], ['Animal Trophy', 1], ["Clothes, Traveler's", 1], ['Pouch', 1]]},
  'Sage':         {gold:10, items:[['Ink (1 ounce bottle)', 1], ['Ink Pen', 1], ['Small Knife', 1], ['Letter from a Dead Colleague', 1], ['Clothes, Common', 1], ['Pouch', 1]]},
  'Sailor':       {gold:10, items:[['Club', 1], ['Rope, Silk (50 feet)', 1], ['Lucky Charm', 1], ['Clothes, Common', 1], ['Pouch', 1]]},
  'Soldier':      {gold:10, items:[['Insignia of Rank', 1], ['Trophy from a Fallen Enemy', 1], ['Clothes, Common', 1], ['Pouch', 1]], pick:[['gaming', 1]]},
  'Urchin':       {gold:10, items:[['Small Knife', 1], ['Map of Your Home City', 1], ['Pet Mouse', 1], ['Token from Your Parents', 1], ['Clothes, Common', 1], ['Pouch', 1]]},
};

// Ability scores: the three Player's Handbook methods (the DM picks which in Campaign settings)
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_BUY_COST = {8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9};
const POINT_BUY_TOTAL = 27;
const ABILITY_METHODS = [['array', 'Standard array'], ['pointBuy', 'Point buy (27 points)'], ['roll', 'Roll 4d6, drop the lowest']];
