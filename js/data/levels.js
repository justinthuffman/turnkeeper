/* ---------- Class tables by level (Player's Handbook, 2014) ----------
   Shared by the character sheet, the character creator and Level Up: hit dice, spell slots,
   cantrips and spells known, Ability Score Improvement levels and experience points.
   (Moved here from turnkeeper.html and js/char-sheet.js so every page uses the same numbers.) */
const HIT_DIE = {barbarian:12, fighter:10, paladin:10, ranger:10, bard:8, cleric:8, druid:8, monk:8, rogue:8, warlock:8, sorcerer:6, wizard:6};
const FULL_CASTERS = ['bard','cleric','druid','sorcerer','wizard'];
// Spell slots by level: FULL_SLOTS[level] = [1st, 2nd, …] slots; half casters are Paladins and Rangers
const FULL_SLOTS = [[], [2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],
  [4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]];
const HALF_SLOTS = [[], [],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],
  [4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
// Third casters (Arcane Trickster, Eldritch Knight), from level 3
const THIRD_SLOTS = [null,null,null,[2],[3],[3],[3],[4,2],[4,2],[4,2],[4,3],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,2],[4,3,3],[4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1]];
// The highest spell level a class (and subclass) can cast at a level, without a character open
function maxSpellLevelAt(classKey, subclass, level){
  const l = Math.min(20, Math.max(1, level));
  if(classKey === 'warlock') return Math.min(5, Math.ceil(l / 2));
  const rows = FULL_CASTERS.includes(classKey) ? FULL_SLOTS[l] : (classKey === 'paladin' || classKey === 'ranger') ? HALF_SLOTS[l]
    : (classKey === 'rogue' && subclass === 'Arcane Trickster') || (classKey === 'fighter' && subclass === 'Eldritch Knight') ? THIRD_SLOTS[l] : null;
  return rows ? rows.length : 0;
}

/* How many spells a character can prepare or know (2014 PHB class tables).
   Prepared casters (Cleric, Druid, Paladin, Wizard): ability modifier + class level (half,
   rounded down, for the Paladin), minimum 1. Known casters: the class table's Spells Known. Cantrips are counted
   separately from the Cantrips Known column. Always-prepared spells (Oath, racial) don't count.
   No spell above the highest spell slot level the character has. Keys are class keys, or
   'class|Subclass' for a subclass that adds spellcasting. */
const byLevel20 = arr=>lvl=>arr[Math.min(20, Math.max(1, lvl)) - 1];
const cantripsAt = (n1, n4, n10)=>lvl=>lvl >= 10 ? n10 : lvl >= 4 ? n4 : n1;
const SPELL_LIMITS = {
  bard:     {cantrips:cantripsAt(2,3,4), known:byLevel20([4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22])},
  cleric:   {cantrips:cantripsAt(3,4,5), prepared:'wis'},
  druid:    {cantrips:cantripsAt(2,3,4), prepared:'wis'},
  paladin:  {prepared:'cha', half:true},
  ranger:   {known:byLevel20([0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11])},
  sorcerer: {cantrips:cantripsAt(4,5,6), known:byLevel20([2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15])},
  warlock:  {cantrips:cantripsAt(2,3,4), known:byLevel20([2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15])},
  wizard:   {cantrips:cantripsAt(3,4,5), prepared:'int'},
  'rogue|Arcane Trickster': {cantrips:lvl=>lvl >= 10 ? 4 : 3, known:byLevel20([0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13])},
  'fighter|Eldritch Knight': {cantrips:lvl=>lvl >= 10 ? 3 : 2, known:byLevel20([0,0,3,4,4,4,5,6,6,7,8,8,9,10,10,11,11,11,12,13])},
};
// A wizard's spellbook: 6 spells at level 1 and 2 more each level
const wizardBookAt = level=>6 + 2 * (Math.min(20, Math.max(1, level)) - 1);

// Ability Score Improvements (or a feat) by class level; most classes use the default
const ASI_LEVELS = {fighter:[4,6,8,12,14,16,19], rogue:[4,8,10,12,16,19]};
const asiLevelsFor = classKey=>ASI_LEVELS[classKey] || [4,8,12,16,19];
// Experience needed for each level: XP_FOR[n] reaches level n + 1
const XP_FOR = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
// Hit points for a level after 1st: the average (half the die + 1) or a roll, plus the Constitution modifier (at least 1)
const hpAverage = die=>die / 2 + 1;
