/* ---------- Equipment (2014 Player's Handbook, chapter 5) ----------
   Weapons, armor, adventuring gear, tools and trade goods with cost and weight, for the
   inventory and the equipped slots. Costs are text ("2 gp"); weights are pounds (0 = none
   listed). Weapons carry their damage and properties; armor its AC rules. Custom items a
   campaign adds (Grun's Greataxe) are stored in Firebase and built on these (base: name). */

// Weapons: [name, category, cost, damage dice, damage type, weight, properties]
// Properties: finesse, light, heavy, reach, loading, two-handed, thrown, ammunition, special,
// versatile (die), range (normal/long)
const WEAPON_ROWS = [
  // Simple melee
  ['Club', 'simple melee', '1 sp', '1d4', 'bludgeoning', 2, {light:true}],
  ['Dagger', 'simple melee', '2 gp', '1d4', 'piercing', 1, {finesse:true, light:true, thrown:true, range:'20/60'}],
  ['Greatclub', 'simple melee', '2 sp', '1d8', 'bludgeoning', 10, {twoHanded:true}],
  ['Handaxe', 'simple melee', '5 gp', '1d6', 'slashing', 2, {light:true, thrown:true, range:'20/60'}],
  ['Javelin', 'simple melee', '5 sp', '1d6', 'piercing', 2, {thrown:true, range:'30/120'}],
  ['Light Hammer', 'simple melee', '2 gp', '1d4', 'bludgeoning', 2, {light:true, thrown:true, range:'20/60'}],
  ['Mace', 'simple melee', '5 gp', '1d6', 'bludgeoning', 4, {}],
  ['Quarterstaff', 'simple melee', '2 sp', '1d6', 'bludgeoning', 4, {versatile:'1d8'}],
  ['Sickle', 'simple melee', '1 gp', '1d4', 'slashing', 2, {light:true}],
  ['Spear', 'simple melee', '1 gp', '1d6', 'piercing', 3, {thrown:true, range:'20/60', versatile:'1d8'}],
  // Simple ranged
  ['Light Crossbow', 'simple ranged', '25 gp', '1d8', 'piercing', 5, {ammunition:true, range:'80/320', loading:true, twoHanded:true}],
  ['Dart', 'simple ranged', '5 cp', '1d4', 'piercing', 0.25, {finesse:true, thrown:true, range:'20/60'}],
  ['Shortbow', 'simple ranged', '25 gp', '1d6', 'piercing', 2, {ammunition:true, range:'80/320', twoHanded:true}],
  ['Sling', 'simple ranged', '1 sp', '1d4', 'bludgeoning', 0, {ammunition:true, range:'30/120'}],
  // Martial melee
  ['Battleaxe', 'martial melee', '10 gp', '1d8', 'slashing', 4, {versatile:'1d10'}],
  ['Flail', 'martial melee', '10 gp', '1d8', 'bludgeoning', 2, {}],
  ['Glaive', 'martial melee', '20 gp', '1d10', 'slashing', 6, {heavy:true, reach:true, twoHanded:true}],
  ['Greataxe', 'martial melee', '30 gp', '1d12', 'slashing', 7, {heavy:true, twoHanded:true}],
  ['Greatsword', 'martial melee', '50 gp', '2d6', 'slashing', 6, {heavy:true, twoHanded:true}],
  ['Halberd', 'martial melee', '20 gp', '1d10', 'slashing', 6, {heavy:true, reach:true, twoHanded:true}],
  ['Lance', 'martial melee', '10 gp', '1d12', 'piercing', 6, {reach:true, special:'Disadvantage against a target within 5 feet. Needs two hands unless you are mounted.'}],
  ['Longsword', 'martial melee', '15 gp', '1d8', 'slashing', 3, {versatile:'1d10'}],
  ['Maul', 'martial melee', '10 gp', '2d6', 'bludgeoning', 10, {heavy:true, twoHanded:true}],
  ['Morningstar', 'martial melee', '15 gp', '1d8', 'piercing', 4, {}],
  ['Pike', 'martial melee', '5 gp', '1d10', 'piercing', 18, {heavy:true, reach:true, twoHanded:true}],
  ['Rapier', 'martial melee', '25 gp', '1d8', 'piercing', 2, {finesse:true}],
  ['Scimitar', 'martial melee', '25 gp', '1d6', 'slashing', 3, {finesse:true, light:true}],
  ['Shortsword', 'martial melee', '10 gp', '1d6', 'piercing', 2, {finesse:true, light:true}],
  ['Trident', 'martial melee', '5 gp', '1d6', 'piercing', 4, {thrown:true, range:'20/60', versatile:'1d8'}],
  ['War Pick', 'martial melee', '5 gp', '1d8', 'piercing', 2, {}],
  ['Warhammer', 'martial melee', '15 gp', '1d8', 'bludgeoning', 2, {versatile:'1d10'}],
  ['Whip', 'martial melee', '2 gp', '1d4', 'slashing', 3, {finesse:true, reach:true}],
  // Martial ranged
  ['Blowgun', 'martial ranged', '10 gp', '1', 'piercing', 1, {ammunition:true, range:'25/100', loading:true}],
  ['Hand Crossbow', 'martial ranged', '75 gp', '1d6', 'piercing', 3, {ammunition:true, range:'30/120', light:true, loading:true}],
  ['Heavy Crossbow', 'martial ranged', '50 gp', '1d10', 'piercing', 18, {ammunition:true, range:'100/400', heavy:true, loading:true, twoHanded:true}],
  ['Longbow', 'martial ranged', '50 gp', '1d8', 'piercing', 2, {ammunition:true, range:'150/600', heavy:true, twoHanded:true}],
  ['Net', 'martial ranged', '1 gp', '', '', 3, {thrown:true, range:'5/15', special:'A Large or smaller creature hit is restrained until freed (DC 10 Strength check, or 5 slashing damage to the net). No effect on formless or Huge or larger creatures.'}],
];
const WEAPONS = WEAPON_ROWS.map(([name, category, cost, dice, dmgType, weight, p])=>({
  name, type:'Weapon', category, cost, weight, dice, dmgType,
  melee:/melee/.test(category), ranged:/ranged/.test(category), martial:/martial/.test(category), ...p}));

// Armor: [name, category, cost, base AC, adds Dex (max, or null for no cap), Str needed, stealth disadvantage, weight]
const ARMOR_ROWS = [
  ['Padded', 'light', '5 gp', 11, true, null, 0, true, 8],
  ['Leather', 'light', '10 gp', 11, true, null, 0, false, 10],
  ['Studded Leather', 'light', '45 gp', 12, true, null, 0, false, 13],
  ['Hide', 'medium', '10 gp', 12, true, 2, 0, false, 12],
  ['Chain Shirt', 'medium', '50 gp', 13, true, 2, 0, false, 20],
  ['Scale Mail', 'medium', '50 gp', 14, true, 2, 0, true, 45],
  ['Breastplate', 'medium', '400 gp', 14, true, 2, 0, false, 20],
  ['Half Plate', 'medium', '750 gp', 15, true, 2, 0, true, 40],
  ['Ring Mail', 'heavy', '30 gp', 14, false, null, 0, true, 40],
  ['Chain Mail', 'heavy', '75 gp', 16, false, null, 13, true, 55],
  ['Splint', 'heavy', '200 gp', 17, false, null, 15, true, 60],
  ['Plate', 'heavy', '1,500 gp', 18, false, null, 15, true, 65],
  ['Shield', 'shield', '10 gp', 2, false, null, 0, false, 6],
];
const ARMOR = ARMOR_ROWS.map(([name, category, cost, ac, dex, dexMax, str, stealthDis, weight])=>({
  name, type:category === 'shield' ? 'Shield' : 'Armor', category, cost, weight, ac, dex, dexMax, str, stealthDis}));

// Adventuring gear, tools and trade goods: [name, type, cost, weight, notes]
const GEAR_ROWS = [
  ['Abacus', 'Adventuring Gear', '2 gp', 2],
  ['Acid (vial)', 'Adventuring Gear', '25 gp', 1, 'Thrown up to 20 ft (improvised); 2d6 acid on a hit.'],
  ["Alchemist's Fire (flask)", 'Adventuring Gear', '50 gp', 1, 'Thrown up to 20 ft (improvised); on a hit, 1d4 fire at the start of each of its turns until it uses an action on a DC 10 Dexterity check.'],
  ['Arrows (20)', 'Ammunition', '1 gp', 1],
  ['Blowgun Needles (50)', 'Ammunition', '1 gp', 1],
  ['Crossbow Bolts (20)', 'Ammunition', '1 gp', 1.5],
  ['Sling Bullets (20)', 'Ammunition', '4 cp', 1.5],
  // Dungeon Master's Guide (2014): magic ammunition, +1 to +3 to attack and damage (used up when fired)
  ['Arrow +1', 'Ammunition', '', 0.05, 'Magic: +1 to attack and damage rolls.'], ['Arrow +2', 'Ammunition', '', 0.05, 'Magic: +2 to attack and damage rolls.'], ['Arrow +3', 'Ammunition', '', 0.05, 'Magic: +3 to attack and damage rolls.'],
  ['Crossbow Bolt +1', 'Ammunition', '', 0.075, 'Magic: +1 to attack and damage rolls.'], ['Crossbow Bolt +2', 'Ammunition', '', 0.075, 'Magic: +2 to attack and damage rolls.'], ['Crossbow Bolt +3', 'Ammunition', '', 0.075, 'Magic: +3 to attack and damage rolls.'],
  ['Sling Bullet +1', 'Ammunition', '', 0.075, 'Magic: +1 to attack and damage rolls.'], ['Sling Bullet +2', 'Ammunition', '', 0.075, 'Magic: +2 to attack and damage rolls.'], ['Sling Bullet +3', 'Ammunition', '', 0.075, 'Magic: +3 to attack and damage rolls.'],
  ['Antitoxin (vial)', 'Adventuring Gear', '50 gp', 0, 'Advantage on saves against poison for 1 hour.'],
  ['Crystal', 'Arcane Focus', '10 gp', 1],
  ['Orb', 'Arcane Focus', '20 gp', 3],
  ['Rod', 'Arcane Focus', '10 gp', 2],
  ['Staff (arcane focus)', 'Arcane Focus', '5 gp', 4],
  ['Wand', 'Arcane Focus', '10 gp', 1],
  ['Backpack', 'Adventuring Gear', '2 gp', 5],
  ['Ball Bearings (bag of 1,000)', 'Adventuring Gear', '1 gp', 2],
  ['Barrel', 'Adventuring Gear', '2 gp', 70],
  ['Basket', 'Adventuring Gear', '4 sp', 2],
  ['Bedroll', 'Adventuring Gear', '1 gp', 7],
  ['Bell', 'Adventuring Gear', '1 gp', 0],
  ['Blanket', 'Adventuring Gear', '5 sp', 3],
  ['Block and Tackle', 'Adventuring Gear', '1 gp', 5],
  ['Book', 'Adventuring Gear', '25 gp', 5],
  ['Bottle, Glass', 'Adventuring Gear', '2 gp', 2],
  ['Bucket', 'Adventuring Gear', '5 cp', 2],
  ['Caltrops (bag of 20)', 'Adventuring Gear', '1 gp', 2],
  ['Candle', 'Adventuring Gear', '1 cp', 0],
  ['Case, Crossbow Bolt', 'Adventuring Gear', '1 gp', 1],
  ['Case, Map or Scroll', 'Adventuring Gear', '1 gp', 1],
  ['Chain (10 feet)', 'Adventuring Gear', '5 gp', 10],
  ['Chalk (1 piece)', 'Adventuring Gear', '1 cp', 0],
  ['Chest', 'Adventuring Gear', '5 gp', 25],
  ["Climber's Kit", 'Adventuring Gear', '25 gp', 12],
  ['Clothes, Common', 'Adventuring Gear', '5 sp', 3],
  ['Clothes, Costume', 'Adventuring Gear', '5 gp', 4],
  ['Clothes, Fine', 'Adventuring Gear', '15 gp', 6],
  ["Clothes, Traveler's", 'Adventuring Gear', '2 gp', 4],
  ['Component Pouch', 'Adventuring Gear', '25 gp', 2],
  ['Crowbar', 'Adventuring Gear', '2 gp', 5],
  ['Sprig of Mistletoe', 'Druidic Focus', '1 gp', 0],
  ['Totem', 'Druidic Focus', '1 gp', 0],
  ['Wooden Staff', 'Druidic Focus', '5 gp', 4],
  ['Yew Wand', 'Druidic Focus', '10 gp', 1],
  ['Fishing Tackle', 'Adventuring Gear', '1 gp', 4],
  ['Flask or Tankard', 'Adventuring Gear', '2 cp', 1],
  ['Grappling Hook', 'Adventuring Gear', '2 gp', 4],
  ['Hammer', 'Adventuring Gear', '1 gp', 3],
  ['Hammer, Sledge', 'Adventuring Gear', '2 gp', 10],
  ["Healer's Kit", 'Adventuring Gear', '5 gp', 3, 'Ten uses. As an action, stabilize a creature at 0 HP without a Medicine check.'],
  ['Amulet', 'Holy Symbol', '5 gp', 1],
  ['Emblem', 'Holy Symbol', '5 gp', 0],
  ['Reliquary', 'Holy Symbol', '5 gp', 2],
  ['Holy Water (flask)', 'Adventuring Gear', '25 gp', 1, 'Thrown up to 20 ft (improvised); 2d6 radiant to a fiend or undead on a hit.'],
  ['Hourglass', 'Adventuring Gear', '25 gp', 1],
  ['Hunting Trap', 'Adventuring Gear', '5 gp', 25],
  ['Ink (1 ounce bottle)', 'Adventuring Gear', '10 gp', 0],
  ['Ink Pen', 'Adventuring Gear', '2 cp', 0],
  ['Jug or Pitcher', 'Adventuring Gear', '2 cp', 4],
  ['Ladder (10-foot)', 'Adventuring Gear', '1 sp', 25],
  ['Lamp', 'Adventuring Gear', '5 sp', 1],
  ['Lantern, Bullseye', 'Adventuring Gear', '10 gp', 2],
  ['Lantern, Hooded', 'Adventuring Gear', '5 gp', 2],
  ['Lock', 'Adventuring Gear', '10 gp', 1],
  ['Magnifying Glass', 'Adventuring Gear', '100 gp', 0],
  ['Manacles', 'Adventuring Gear', '2 gp', 6],
  ['Mess Kit', 'Adventuring Gear', '2 sp', 1],
  ['Mirror, Steel', 'Adventuring Gear', '5 gp', 0.5],
  ['Oil (flask)', 'Adventuring Gear', '1 sp', 1],
  ['Paper (one sheet)', 'Adventuring Gear', '2 sp', 0],
  ['Parchment (one sheet)', 'Adventuring Gear', '1 sp', 0],
  ['Perfume (vial)', 'Adventuring Gear', '5 gp', 0],
  ["Pick, Miner's", 'Adventuring Gear', '2 gp', 10],
  ['Piton', 'Adventuring Gear', '5 cp', 0.25],
  ['Poison, Basic (vial)', 'Adventuring Gear', '100 gp', 0, 'Coat a weapon or up to three pieces of ammunition (an action); a hit deals an extra 1d4 poison (DC 10 Con save) for 1 minute.'],
  ['Pole (10-foot)', 'Adventuring Gear', '5 cp', 7],
  ['Pot, Iron', 'Adventuring Gear', '2 gp', 10],
  ['Potion of Healing', 'Potion', '50 gp', 0.5, 'Regain 2d4 + 2 hit points.'],
  // Dungeon Master's Guide (2014): the stronger healing potions
  ['Potion of Greater Healing', 'Potion', '150 gp', 0.5, 'Regain 4d4 + 4 hit points.'],
  ['Potion of Superior Healing', 'Potion', '450 gp', 0.5, 'Regain 8d4 + 8 hit points.'],
  ['Potion of Supreme Healing', 'Potion', '1,350 gp', 0.5, 'Regain 10d4 + 20 hit points.'],
  ['Pouch', 'Adventuring Gear', '5 sp', 1],
  ['Quiver', 'Adventuring Gear', '1 gp', 1],
  ['Ram, Portable', 'Adventuring Gear', '4 gp', 35],
  ['Rations (1 day)', 'Adventuring Gear', '5 sp', 2],
  ['Robes', 'Adventuring Gear', '1 gp', 4],
  ['Rope, Hempen (50 feet)', 'Adventuring Gear', '1 gp', 10],
  ['Rope, Silk (50 feet)', 'Adventuring Gear', '10 gp', 5],
  ['Sack', 'Adventuring Gear', '1 cp', 0.5],
  ["Scale, Merchant's", 'Adventuring Gear', '5 gp', 3],
  ['Sealing Wax', 'Adventuring Gear', '5 sp', 0],
  ['Shovel', 'Adventuring Gear', '2 gp', 5],
  ['Signal Whistle', 'Adventuring Gear', '5 cp', 0],
  ['Signet Ring', 'Adventuring Gear', '5 gp', 0],
  ['Soap', 'Adventuring Gear', '2 cp', 0],
  ['Spellbook', 'Adventuring Gear', '50 gp', 3],
  ['Spikes, Iron (10)', 'Adventuring Gear', '1 gp', 5],
  ['Spyglass', 'Adventuring Gear', '1,000 gp', 1],
  ['Tent, Two-Person', 'Adventuring Gear', '2 gp', 20],
  ['Tinderbox', 'Adventuring Gear', '5 sp', 1],
  ['Torch', 'Adventuring Gear', '1 cp', 1],
  ['Vial', 'Adventuring Gear', '1 gp', 0],
  ['Waterskin', 'Adventuring Gear', '2 sp', 5],
  ['Whetstone', 'Adventuring Gear', '1 cp', 1],
  // Equipment packs
  ["Burglar's Pack", 'Equipment Pack', '16 gp', 0],
  ["Diplomat's Pack", 'Equipment Pack', '39 gp', 0],
  ["Dungeoneer's Pack", 'Equipment Pack', '12 gp', 0],
  ["Entertainer's Pack", 'Equipment Pack', '40 gp', 0],
  ["Explorer's Pack", 'Equipment Pack', '10 gp', 0],
  ["Priest's Pack", 'Equipment Pack', '19 gp', 0],
  ["Scholar's Pack", 'Equipment Pack', '40 gp', 0],
  // Tools
  ["Alchemist's Supplies", "Artisan's Tools", '50 gp', 8],
  ["Brewer's Supplies", "Artisan's Tools", '20 gp', 9],
  ["Calligrapher's Supplies", "Artisan's Tools", '10 gp', 5],
  ["Carpenter's Tools", "Artisan's Tools", '8 gp', 6],
  ["Cartographer's Tools", "Artisan's Tools", '15 gp', 6],
  ["Cobbler's Tools", "Artisan's Tools", '5 gp', 5],
  ["Cook's Utensils", "Artisan's Tools", '1 gp', 8],
  ["Glassblower's Tools", "Artisan's Tools", '30 gp', 5],
  ["Jeweler's Tools", "Artisan's Tools", '25 gp', 2],
  ["Leatherworker's Tools", "Artisan's Tools", '5 gp', 5],
  ["Mason's Tools", "Artisan's Tools", '10 gp', 8],
  ["Painter's Supplies", "Artisan's Tools", '10 gp', 5],
  ["Potter's Tools", "Artisan's Tools", '10 gp', 3],
  ["Smith's Tools", "Artisan's Tools", '20 gp', 8],
  ["Tinker's Tools", "Artisan's Tools", '50 gp', 10],
  ["Weaver's Tools", "Artisan's Tools", '1 gp', 5],
  ["Woodcarver's Tools", "Artisan's Tools", '1 gp', 5],
  ['Disguise Kit', 'Tool', '25 gp', 3],
  ['Forgery Kit', 'Tool', '15 gp', 5],
  ['Dice Set', 'Gaming Set', '1 sp', 0],
  ['Dragonchess Set', 'Gaming Set', '1 gp', 0.5],
  ['Playing Card Set', 'Gaming Set', '5 sp', 0],
  ['Three-Dragon Ante Set', 'Gaming Set', '1 gp', 0],
  ['Herbalism Kit', 'Tool', '5 gp', 3],
  ['Bagpipes', 'Musical Instrument', '30 gp', 6],
  ['Drum', 'Musical Instrument', '6 gp', 3],
  ['Dulcimer', 'Musical Instrument', '25 gp', 10],
  ['Flute', 'Musical Instrument', '2 gp', 1],
  ['Lute', 'Musical Instrument', '35 gp', 2],
  ['Lyre', 'Musical Instrument', '30 gp', 2],
  ['Horn', 'Musical Instrument', '3 gp', 2],
  ['Pan Flute', 'Musical Instrument', '12 gp', 2],
  ['Shawm', 'Musical Instrument', '2 gp', 1],
  ['Viol', 'Musical Instrument', '30 gp', 1],
  ["Navigator's Tools", 'Tool', '25 gp', 2],
  ["Poisoner's Kit", 'Tool', '50 gp', 2],
  ["Thieves' Tools", 'Tool', '25 gp', 1],
  // Gemstones (DMG values), for treasure
  ['Gemstone (10 gp)', 'Gemstone', '10 gp', 0],
  ['Gemstone (50 gp)', 'Gemstone', '50 gp', 0],
  ['Gemstone (100 gp)', 'Gemstone', '100 gp', 0],
  ['Gemstone (500 gp)', 'Gemstone', '500 gp', 0],
  ['Gemstone (1,000 gp)', 'Gemstone', '1,000 gp', 0],
  ['Gemstone (5,000 gp)', 'Gemstone', '5,000 gp', 0],
];
const GEAR = GEAR_ROWS.map(([name, type, cost, weight, notes])=>({name, type, cost, weight, notes:notes || ''}));
/* What an item does when used or thrown (the Combat Menu's Use Object and Throw). 2014 rules:
   drinking or giving a potion is an action; Acid, Alchemist's Fire and Holy Water are thrown up to
   20 feet as an improvised weapon (a ranged attack). use: {heal, dmg, dmgType, throwRange, onHit:
   [effect names], note}. All of these are used up. */
const ITEM_USES = {
  'Acid (vial)': {dmg:'2d6', dmgType:'acid', throwRange:'20'},
  "Alchemist's Fire (flask)": {throwRange:'20', onHit:["Alchemist's Fire"], note:'No damage on the hit itself: the target burns (1d4 fire at the start of each of its turns) until it puts the fire out.'},
  'Holy Water (flask)': {dmg:'2d6', dmgType:'radiant', throwRange:'20', note:'Only a fiend or undead takes the damage.'},
  'Potion of Healing': {heal:'2d4+2'},
  'Potion of Greater Healing': {heal:'4d4+4'},
  'Potion of Superior Healing': {heal:'8d4+8'},
  'Potion of Supreme Healing': {heal:'10d4+20'},
};
GEAR.forEach(g=>{ if(ITEM_USES[g.name]) Object.assign(g, {use:ITEM_USES[g.name], consumable:true}); });
/* Special ammunition: what it fits (arrow, bolt, bullet, needle), a magic bonus, extra damage
   (ammo: {fits, dmg, dmgType}), On hit effects. It's chosen when attacking with a weapon that
   fires it, and used up when fired. Ordinary arrows aren't counted. */
const AMMO_KINDS = [['arrow', 'Arrows (bows)'], ['bolt', 'Bolts (crossbows)'], ['bullet', 'Sling bullets'], ['needle', 'Blowgun needles']];
GEAR.forEach(g=>{ const m = g.name.match(/^(Arrow|Crossbow Bolt|Sling Bullet) \+(\d)$/); if(m) Object.assign(g, {ammo:{fits:{'Arrow':'arrow', 'Crossbow Bolt':'bolt', 'Sling Bullet':'bullet'}[m[1]]}, magic:+m[2], consumable:true}); });
// What a weapon fires: bows arrows, crossbows bolts, slings bullets, blowguns needles
const ammoKindOf = name=>{ const n = String(name || '').toLowerCase(); return /\bbow\b|longbow|shortbow/.test(n) && !/crossbow/.test(n) ? 'arrow' : /crossbow/.test(n) ? 'bolt' : /sling/.test(n) ? 'bullet' : /blowgun/.test(n) ? 'needle' : null; };

// Everything in one list, by name (custom campaign items are added to this at run time)
const EQUIPMENT = [...WEAPONS, ...ARMOR, ...GEAR];
const equipmentByName = name=>EQUIPMENT.find(x=>x.name.toLowerCase() === String(name || '').toLowerCase()) || null;
const ITEM_TYPES = [...new Set(EQUIPMENT.map(x=>x.type)), 'Magic Item', 'Treasure', 'Other'];

// A weapon's properties in words: "Finesse, light, thrown (20/60)"
function weaponPropsText(w){
  const out = [];
  if(w.ammunition) out.push(`ammunition (${w.range})`);
  if(w.finesse) out.push('finesse');
  if(w.heavy) out.push('heavy');
  if(w.light) out.push('light');
  if(w.loading) out.push('loading');
  if(w.reach) out.push('reach');
  if(w.special) out.push('special');
  if(w.thrown) out.push(`thrown (${w.range})`);
  if(w.twoHanded) out.push('two-handed');
  if(w.versatile) out.push(`versatile (${w.versatile})`);
  const s = out.join(', ');
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

// Proficiency lists (2014): languages, tools and vehicles players can pick from
const LANGUAGES = ['Common', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc',
  'Abyssal', 'Celestial', 'Draconic', 'Deep Speech', 'Infernal', 'Primordial', 'Sylvan', 'Undercommon', 'Druidic', "Thieves' Cant"];
const TOOL_PROFS = GEAR.filter(x=>/Tools|Tool|Gaming Set|Musical Instrument/.test(x.type) && x.type !== 'Equipment Pack').map(x=>x.name);
const VEHICLE_PROFS = ['Vehicles (land)', 'Vehicles (water)'];
const ARMOR_PROFS = ['Light armor', 'Medium armor', 'Heavy armor', 'Shields'];
const WEAPON_PROF_GROUPS = ['Simple weapons', 'Martial weapons'];
