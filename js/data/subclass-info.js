/* ---------- What each subclass is (Player's Handbook and Dungeon Master's Guide, 2014) ----------
   A short, paraphrased description of every subclass, shown wherever one is picked (the creator,
   Level Up, the sheet's choices and Subclass box), with its features by level from CLASS_FEATURES
   (js/data/classes.js, classes-phb.js). */
const SUBCLASS_INFO = {
  // Barbarian: Primal Path
  'Path of the Berserker':'Rage turned to frenzy: while raging you can make an extra attack as a bonus action (at the cost of exhaustion afterwards), and later shrug off being charmed or frightened mid-rage.',
  'Path of the Totem Warrior':'A spirit animal guides your rage: the bear (resist almost all damage), the eagle (move and dash freely) or the wolf (allies gain advantage near you), with more totem gifts as you grow.',
  // Bard: Bard College
  'College of Lore':'Collectors of knowledge and secrets: three extra skills, Cutting Words to spoil an enemy’s roll with your Bardic Inspiration, and spells borrowed from any class at 6th level.',
  'College of Valor':'Skalds who inspire heroism in battle: medium armor, shields and martial weapons, Bardic Inspiration that can add to damage or AC, and Extra Attack at 6th level.',
  // Cleric: Divine Domain
  'Knowledge Domain':'A seeker of lore and secrets: extra languages and two skills with expertise, and Channel Divinity to gain any skill or tool proficiency for a while, or read a creature’s thoughts.',
  'Life Domain':'The healer: heavy armor, extra healing every time you cast a healing spell, and Channel Divinity to restore hit points to many allies at once.',
  'Light Domain':'Fire and radiance: Warding Flare dazzles an attacker into disadvantage, and Channel Divinity floods the area with radiant light that burns your foes.',
  'Nature Domain':'A priest of the wild: heavy armor, a druid cantrip and a nature skill, and Channel Divinity to charm beasts and plants.',
  'Tempest Domain':'Storm and sea: heavy armor and martial weapons, lightning or thunder that punishes those who hit you, and Channel Divinity to deal maximum lightning or thunder damage.',
  'Trickery Domain':'Mischief and deceit: give an ally advantage on Stealth, and Channel Divinity to create an illusory double of yourself to cast spells from.',
  'War Domain':'A battle priest: heavy armor and martial weapons, extra weapon attacks as a bonus action, and Channel Divinity for +10 to a roll to hit.',
  'Death Domain':'A necromantic priest (a Dungeon Master’s Guide villain option, only if your DM allows it): martial weapons, deadlier necrotic magic, and extra necrotic damage on a touch.',
  // Druid: Druid Circle
  'Circle of the Land':'Druid of a sacred land: extra spells tied to a terrain you pick (forest, mountain, swamp…), and you can recover spell slots on a short rest.',
  'Circle of the Moon':'The shapeshifter: Wild Shape into much tougher beasts (CR 1 at 2nd level, more later), as a bonus action, and eventually into elementals.',
  // Fighter: Martial Archetype
  'Champion':'Pure physical excellence: critical hits on a 19 or 20 (18 later), better athletics, and a second Fighting Style.',
  'Battle Master':'The tactician: superiority dice fuel maneuvers like trip, disarm, riposte and commanding an ally to strike.',
  'Eldritch Knight':'A fighter with wizard magic: abjuration and evocation spells, a bonded weapon you can call to your hand, and later casting mixed with attacks.',
  // Monk: Monastic Tradition
  'Way of the Open Hand':'The master of unarmed combat: Flurry of Blows that can knock a foe prone, push it away or stop its reactions, and later healing yourself.',
  'Way of Shadow':'The ninja: cast darkness, silence and pass without trace with ki, and step from shadow to shadow.',
  'Way of the Four Elements':'Elemental disciplines: spend ki to wield fire, water, earth and air, casting spells like burning hands and gust of wind.',
  // Paladin: Sacred Oath
  'Oath of Devotion':'The knight in shining armor: honesty, courage and compassion. Channel Divinity makes your weapon holy or turns fiends and undead; later an aura keeps allies from being charmed.',
  'Oath of the Ancients':'Defender of light, life and the beauty of the natural world: nature spells, Channel Divinity to entangle foes or turn fey and fiends, and later an aura that shields allies from spells.',
  'Oath of Vengeance':'Sworn to punish great wrongdoers at any cost: Channel Divinity to frighten a foe or vow vengeance on one (advantage against it), and later hunting it down relentlessly.',
  'Oathbreaker':'A paladin who broke their oath for power (a Dungeon Master’s Guide villain option, only if your DM allows it): commands undead, fills foes with dread, and empowers evil allies.',
  // Ranger: Ranger Archetype
  'Hunter':'The monster slayer: pick techniques like Colossus Slayer or Horde Breaker, then defensive tactics and attacks against many foes.',
  'Beast Master':'Bonded with an animal companion (a beast of CR 1/4 or lower) that fights at your command.',
  // Rogue: Roguish Archetype
  'Thief':'Burglar and treasure hunter: Fast Hands to use objects as a bonus action, climbing at full speed, and later using any magic item.',
  'Assassin':'The deadly ambusher: advantage against anyone who hasn’t acted yet in a fight, automatic critical hits on surprised foes, and disguise and poison kits.',
  'Arcane Trickster':'A rogue with wizard magic: enchantment and illusion spells, and an invisible Mage Hand that can pick pockets and locks.',
  // Sorcerer: Sorcerous Origin
  'Draconic Bloodline':'Dragon blood: tougher skin (AC 13 + Dexterity), extra hit points, an element whose damage you boost, and later dragon wings.',
  'Wild Magic':'Chaotic power: your spells can set off wild magic surges, and Tides of Chaos gives you advantage when you need it most.',
  // Warlock: Otherworldly Patron
  'The Archfey':'A pact with a lord of the fey: Fey Presence charms or frightens those around you, and later misty escapes and beguiling defenses.',
  'The Fiend':'A pact with a fiend: temporary hit points when you drop a foe, fire and destruction spells, and later dark luck and resistances.',
  'The Great Old One':'A pact with an unknowable entity: telepathy, protection for your mind, and spells that bend others’ minds.',
  // Wizard: Arcane Tradition
  'School of Abjuration':'Protective magic: an arcane ward that soaks up damage when you cast abjuration spells, and better at countering and dispelling magic.',
  'School of Conjuration':'Summoning and teleportation: conjure small objects, blink short distances, and make your summoned creatures tougher.',
  'School of Divination':'Seeing what’s to come: after each long rest, roll two d20s and use them in place of any rolls you or others make (Portent).',
  'School of Enchantment':'Charming minds: daze those who threaten you with a glance, and your charm spells can affect more creatures.',
  'School of Evocation':'Raw elemental power: shape your area spells to spare your allies, and add extra damage to your evocation spells.',
  'School of Illusion':'Deception and phantasms: a better Minor Illusion, change your illusions on the fly, and later make them partly real.',
  'School of Necromancy':'Life and death: regain hit points when your spells slay, and raise stronger undead servants that serve longer.',
  'School of Transmutation':'Changing matter: a transmuter’s stone that grants a benefit, transforming materials, and later shapechanging magic.',
};
// A subclass's features by level, from the class data: "Level 3: Cutting Words, Bonus Proficiencies · Level 6: …"
function subclassFeatureLine(classKey, name){
  const feats = (((typeof CLASS_FEATURES === 'object' && CLASS_FEATURES[classKey]) || {}).subclasses || {})[name] || [];
  const byLevel = {};
  feats.forEach(f=>{ (byLevel[f.level] = byLevel[f.level] || []).push(f.name); });
  return Object.keys(byLevel).map(Number).sort((a, b)=>a - b).map(l=>`Level ${l}: ${byLevel[l].join(', ')}`).join(' · ');
}
// The cards for picking one thing (a subclass, a Fighting Style…): [{name, desc, more}] → buttons with
// attr (data-…) = the option's name; the picked one is marked
function pickCardsHtml(attr, value, options, extraAttrs){
  const q = s=>String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  return `<div class="pick-cards">${options.map(o=>`<button type="button" class="pick-card${o.name === value ? ' on' : ''}" ${attr}="${q(o.name)}"${extraAttrs || ''} aria-pressed="${o.name === value}">`
    + `<b>${q(o.name)}</b>${o.desc ? `<span>${q(o.desc)}</span>` : ''}${o.more ? `<small>${q(o.more)}</small>` : ''}</button>`).join('')}</div>`;
}
// A class's subclasses as cards' options
const subclassOptions = (classKey, names)=>names.map(n=>({name:n, desc:SUBCLASS_INFO[n] || '', more:subclassFeatureLine(classKey, n)}));
