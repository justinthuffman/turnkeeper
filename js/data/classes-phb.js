/* ---------- More PHB classes: Fighter, Cleric, Ranger, Sorcerer, Warlock (2014) ----------
   Same shape as js/data/classes.js (loaded right after it). Checked against dnd5e.wikidot.com
   and paraphrased. Extra keys used here:
   - picks: {n(), label, options()} several picks from a list (invocations, Metamagic,
     maneuvers, favored enemies); saved as choices "<name> pick 1"… like the feats' picks.
     pickText: what each option does, shown with the picked ones.
   - strike: {type} Divine Strike's extra damage type ('weapon' = the weapon's own type).
   - expanded: a warlock patron's extra spells, added to the warlock list.
   - perRest on a "pick one" tier: a spell cast once per long rest at that level (Mystic Arcanum). */
const ASI_TEXT = levels=>`At levels ${levels}: raise one ability score by 2, or two scores by 1 each (max 20), or take a feat if your table allows it.`;
const domainSpells = list=>list.map(([level, name])=>({level, name, text:'Domain spell; always prepared.'}));
// Fighting Style options (2014 PHB). The Fighter has all six; the Ranger four.
const STYLE_OPTIONS = {
  'Archery': {level:1, name:'Archery', text:'+2 to attack rolls with ranged weapons (Turnkeeper adds it).'},
  'Defense': {level:1, name:'Defense', text:'+1 AC while wearing armor (Turnkeeper adds it).'},
  'Dueling': {level:1, name:'Dueling', text:'+2 damage with a melee weapon in one hand and no other weapons.'},
  'Great Weapon Fighting': {level:1, name:'Great Weapon Fighting', text:'Reroll 1s and 2s on damage dice with a two-handed or versatile melee weapon held in two hands.'},
  'Protection': {level:1, name:'Protection', type:'reaction', text:'With a shield, use your reaction to give disadvantage to an attack on an ally within 5 ft.'},
  'Two-Weapon Fighting': {level:1, name:'Two-Weapon Fighting', text:'Add your ability modifier to the damage of your off-hand attack (Turnkeeper adds it).'},
};
const styleTiers = (names, level)=>names.map(n=>({...STYLE_OPTIONS[n], level}));
// Battle Master maneuvers (2014 PHB)
const MANEUVER_TEXT = {
  "Commander's Strike":'Forgo one of your attacks and spend a bonus action: an ally who can see or hear you uses its reaction to make a weapon attack, adding the superiority die to the damage.',
  'Disarming Attack':'On a hit, add the die to the damage; the target makes a Strength save or drops an item you choose.',
  'Distracting Strike':'On a hit, add the die to the damage; the next attack against the target by someone else has advantage before your next turn.',
  'Evasive Footwork':'When you move, add the die to your AC until you stop moving.',
  'Feinting Attack':'Bonus action: advantage on your next attack this turn against a creature within 5 ft; on a hit, add the die to the damage.',
  'Goading Attack':'On a hit, add the die to the damage; the target makes a Wisdom save or has disadvantage on attacks against anyone but you until your next turn ends.',
  'Lunging Attack':'Your melee reach grows by 5 ft for one attack; on a hit, add the die to the damage.',
  'Maneuvering Attack':'On a hit, add the die to the damage; an ally can use its reaction to move half its speed without provoking an opportunity attack from the target.',
  'Menacing Attack':'On a hit, add the die to the damage; the target makes a Wisdom save or is frightened of you until your next turn ends.',
  'Parry':'Reaction when a melee attack hits you: reduce the damage by the die + your Dexterity modifier.',
  'Precision Attack':'Add the die to an attack roll, before or after rolling but before you know whether it hits.',
  'Pushing Attack':'On a hit, add the die to the damage; a Large or smaller target makes a Strength save or is pushed up to 15 ft away.',
  'Rally':'Bonus action: an ally who can see or hear you gains temporary hit points equal to the die + your Charisma modifier.',
  'Riposte':'Reaction when a creature misses you with a melee attack: make a melee weapon attack against it, adding the die to the damage on a hit.',
  'Sweeping Attack':'When a melee hit lands, another creature within 5 ft of the target and in reach takes damage equal to the die if your attack roll would hit it.',
  'Trip Attack':'On a hit, add the die to the damage; a Large or smaller target makes a Strength save or is knocked prone.',
};
const supDie = ()=>charLevel() >= 18 ? 12 : charLevel() >= 10 ? 10 : 8;
// Eldritch Invocations (2014 PHB): level, pact boon, or Eldritch Blast prerequisites
const INVOCATIONS = [
  ['Agonizing Blast', 'Add your Charisma modifier to the damage of each Eldritch Blast beam (Turnkeeper adds it).', {eb:true}],
  ['Armor of Shadows', 'Cast Mage Armor on yourself at will, without a spell slot or components.'],
  ['Ascendant Step', 'Cast Levitate on yourself at will, without a spell slot or components.', {level:9}],
  ['Beast Speech', 'Cast Speak with Animals at will, without a spell slot.'],
  ['Beguiling Influence', 'Proficiency in Deception and Persuasion.'],
  ['Bewitching Whispers', 'Cast Compulsion once with a warlock spell slot; again after a long rest.', {level:7}],
  ['Book of Ancient Secrets', 'Inscribe rituals in your Book of Shadows and cast them as rituals.', {pact:'Pact of the Tome'}],
  ['Chains of Carceri', 'Cast Hold Monster at will on a celestial, fiend or elemental; once per long rest per creature.', {level:15, pact:'Pact of the Chain'}],
  ["Devil's Sight", 'See normally in darkness, magical or not, to 120 ft.'],
  ['Dreadful Word', 'Cast Confusion once with a warlock spell slot; again after a long rest.', {level:7}],
  ['Eldritch Sight', 'Cast Detect Magic at will, without a spell slot.'],
  ['Eldritch Spear', 'Eldritch Blast reaches 300 ft.', {eb:true}],
  ['Eyes of the Rune Keeper', 'You can read all writing.'],
  ['Fiendish Vigor', 'Cast False Life on yourself at will as a 1st-level spell, without a spell slot or components.'],
  ['Gaze of Two Minds', 'Touch a willing humanoid and see and hear through its senses until your next turn ends (extend it with your action each turn).'],
  ['Lifedrinker', 'Your pact weapon deals extra necrotic damage equal to your Charisma modifier (minimum 1).', {level:12, pact:'Pact of the Blade'}],
  ['Mask of Many Faces', 'Cast Disguise Self at will, without a spell slot.'],
  ['Master of Myriad Forms', 'Cast Alter Self at will, without a spell slot.', {level:15}],
  ['Minions of Chaos', 'Cast Conjure Elemental once with a warlock spell slot; again after a long rest.', {level:9}],
  ['Mire the Mind', 'Cast Slow once with a warlock spell slot; again after a long rest.', {level:5}],
  ['Misty Visions', 'Cast Silent Image at will, without a spell slot or components.'],
  ['One with Shadows', 'In dim light or darkness, use your action to become invisible until you move or take an action or reaction.', {level:5}],
  ['Otherworldly Leap', 'Cast Jump on yourself at will, without a spell slot or components.', {level:9}],
  ['Repelling Blast', 'When an Eldritch Blast beam hits a creature, you can push it up to 10 ft away from you.', {eb:true}],
  ['Sculptor of Flesh', 'Cast Polymorph once with a warlock spell slot; again after a long rest.', {level:7}],
  ['Sign of Ill Omen', 'Cast Bestow Curse once with a warlock spell slot; again after a long rest.', {level:5}],
  ['Thief of Five Fates', 'Cast Bane once with a warlock spell slot; again after a long rest.'],
  ['Thirsting Blade', 'Attack twice with your pact weapon when you take the Attack action.', {level:5, pact:'Pact of the Blade'}],
  ['Visions of Distant Realms', 'Cast Arcane Eye at will, without a spell slot.', {level:15}],
  ['Voice of the Chain Master', 'Communicate telepathically with your familiar and perceive through its senses anywhere on the same plane.', {pact:'Pact of the Chain'}],
  ['Whispers of the Grave', 'Cast Speak with Dead at will, without a spell slot.', {level:9}],
  ['Witch Sight', 'See the true form of shapechangers and creatures hidden by illusion or transmutation magic within 30 ft.', {level:15}],
].map(([name, text, req])=>({name, text, req:req || {}}));
const invocationsKnown = ()=>{ const l = charLevel(); return l >= 18 ? 8 : l >= 15 ? 7 : l >= 12 ? 6 : l >= 9 ? 5 : l >= 7 ? 4 : l >= 5 ? 3 : 2; };
const METAMAGIC_TEXT = {
  'Careful Spell':'1 sorcery point: up to your Charisma modifier (min 1) creatures automatically succeed on the spell’s save.',
  'Distant Spell':'1 point: double the spell’s range (a touch spell reaches 30 ft).',
  'Empowered Spell':'1 point: reroll up to your Charisma modifier (min 1) damage dice and use the new rolls. Works with other Metamagic.',
  'Extended Spell':'1 point: double a duration of 1 minute or longer, up to 24 hours.',
  'Heightened Spell':'3 points: one target has disadvantage on its first save against the spell.',
  'Quickened Spell':'2 points: cast a 1-action spell as a bonus action.',
  'Subtle Spell':'1 point: cast without verbal or somatic components.',
  'Twinned Spell':'Points equal to the spell’s level (1 for a cantrip): a spell that targets one creature (not self) targets a second one.',
};
const CREATURE_TYPES = ['Aberrations', 'Beasts', 'Celestials', 'Constructs', 'Dragons', 'Elementals', 'Fey', 'Fiends', 'Giants', 'Monstrosities', 'Oozes', 'Plants', 'Undead', 'Two humanoid races'];
const TERRAINS = ['Arctic', 'Coast', 'Desert', 'Forest', 'Grassland', 'Mountain', 'Swamp', 'Underdark'];
// Divine Strike dice: 1d8, 2d8 from 14th level
const divineStrikeDice = ()=>charLevel() >= 14 ? '2d8' : '1d8';
const divineStrike = (type, typeText)=>({level:8, name:'Divine Strike', strike:{type},
  desc:`Once on each of your turns, when you hit with a weapon attack, deal an extra 1d8 ${typeText} damage (2d8 at 14th level). The Attack popup has a toggle for it.`});
// Cleric (and Paladin) Channel Divinity uses
const clericCD = ()=>charLevel() >= 18 ? 3 : charLevel() >= 6 ? 2 : 1;
const warlockSpellsAt = level=>CLASS_SPELL_NAMES.warlock[level].map(name=>({level:0, name, perRest:'long', castLevel:level, text:`Cast once per long rest at ${['', '', '', '', '', '', '6th', '7th', '8th', '9th'][level]} level, without a slot.`}));
const mysticArcanum = (level, at)=>({level:at, name:`Mystic Arcanum (${['', '', '', '', '', '', '6th', '7th', '8th', '9th'][level]} level)`, choose:true,
  desc:`Pick one ${['', '', '', '', '', '', '6th', '7th', '8th', '9th'][level]}-level warlock spell. Cast it once per long rest without a spell slot.`,
  tiers:warlockSpellsAt(level).map(t=>({...t, level:at}))});
const expandedTiers = list=>list.map(([level, name])=>({level, name, text:'Added to the warlock spell list for you (pick it as one of your spells known).'}));

Object.assign(CLASS_FEATURES, {
  // Fighter (2014 PHB)
  fighter: {
    subclassLabel: 'Martial Archetype', subclassLevel: 3,
    base: [
      {level:1, name:'Fighting Style', choose:true, desc:'Pick one style; its benefit is permanent.', tiers:styleTiers(Object.keys(STYLE_OPTIONS), 1)},
      {level:1, name:'Second Wind', type:'bonus', uses:{max:()=>1, recharge:'short'},
        roll:{label:'Healing', cmd:()=>`1d10+${charLevel()}`, desc:()=>'hit points you regain', healSelf:true},
        desc:'Regain 1d10 + your fighter level hit points. Once per short or long rest.'},
      {level:2, name:'Action Surge', uses:{max:()=>charLevel() >= 17 ? 2 : 1, recharge:'short'},
        desc:'On your turn, take one additional action. Once per short or long rest (twice from 17th level, but only once per turn).'},
      {level:3, name:'Martial Archetype', desc:'Pick your archetype (above): Champion, Battle Master or Eldritch Knight.'},
      {level:4, name:'Ability Score Improvement', desc:ASI_TEXT('4, 6, 8, 12, 14, 16 and 19')},
      {level:5, name:'Extra Attack', attacks:2, desc:'Attack twice when you take the Attack action.'},
      {level:9, name:'Indomitable', uses:{max:()=>charLevel() >= 17 ? 3 : charLevel() >= 13 ? 2 : 1, recharge:'long'},
        desc:'Reroll a saving throw you fail; you must use the new roll. Once per long rest (twice from 13th level, three times from 17th).'},
      {level:11, name:'Extra Attack (2)', attacks:3, desc:'Attack three times when you take the Attack action.'},
      {level:20, name:'Extra Attack (3)', attacks:4, desc:'Attack four times when you take the Attack action.'},
    ],
    subclasses: {
      'Champion': [
        {level:3, name:'Improved Critical', critMin:19, desc:'Your weapon attacks score a critical hit on a roll of 19 or 20 (Turnkeeper turns Crit on for you).'},
        {level:7, name:'Remarkable Athlete', desc:'Add half your proficiency bonus (rounded up) to Strength, Dexterity and Constitution checks you aren’t proficient in. Your running long jump grows by your Strength modifier in feet.'},
        {level:10, name:'Additional Fighting Style', choose:true, desc:'Pick a second Fighting Style.', tiers:styleTiers(Object.keys(STYLE_OPTIONS), 10)},
        {level:15, name:'Superior Critical', critMin:18, desc:'Your weapon attacks score a critical hit on a roll of 18 to 20.'},
        {level:18, name:'Survivor', desc:'At the start of each of your turns, regain 5 + your Constitution modifier hit points if you have no more than half your hit points left (and at least 1).'},
      ],
      'Battle Master': [
        {level:3, name:'Combat Superiority', uses:{max:()=>charLevel() >= 15 ? 6 : charLevel() >= 7 ? 5 : 4, recharge:'short'}, spendOnUse:false,
          picks:{n:()=>charLevel() >= 15 ? 9 : charLevel() >= 10 ? 7 : charLevel() >= 7 ? 5 : 3, label:'maneuver', options:()=>Object.keys(MANEUVER_TEXT)}, pickText:MANEUVER_TEXT,
          desc:'You learn maneuvers fueled by superiority dice (four d8s; five at 7th level, six at 15th), regained on a short or long rest. Learn three maneuvers (two more at 7th, 10th and 15th). Use one from Combat Menu → Use a Class Feature → Maneuver.'},
        {level:3, name:'Maneuver', spends:'feat:Combat Superiority', useDesc:'a superiority die',
          rolls:()=>[{label:'Superiority die', cmd:()=>`1d${supDie()}`, desc:()=>`d${supDie()}: add it where the maneuver says`},
            {label:'Maneuver save DC', info:()=>`If a maneuver calls for a save: <b>DC ${8 + proficiencyBonus() + Math.max(abilityScoreMod('str'), abilityScoreMod('dex'))}</b> (8 + proficiency + Strength or Dexterity).${classPicks('Combat Superiority').length ? ` Your maneuvers: ${classPicks('Combat Superiority').join(', ')}.` : ''}`}],
          desc:'Spend a superiority die on one of your maneuvers. Most add the die to an attack’s damage when it hits; one per attack.'},
        {level:3, name:'Student of War', desc:'Proficiency with one type of artisan’s tools of your choice.'},
        {level:7, name:'Know Your Enemy', desc:'Spend 1 minute observing a creature outside combat to learn whether it’s your equal, superior or inferior in two of: Strength, Dexterity, Constitution, AC, current hit points, total class levels, fighter levels.'},
        {level:10, name:'Improved Combat Superiority', desc:'Your superiority dice are d10s (d12s at 18th level).'},
        {level:15, name:'Relentless', desc:'When you roll initiative with no superiority dice left, you regain one.'},
      ],
      'Eldritch Knight': [
        {level:3, name:'Spellcasting', desc:'Cast wizard spells using Intelligence (mostly abjuration and evocation). You know two wizard cantrips (three at 10th) and have your own spell slots (see Resources). Use the Wizard spell list in the Spells section.'},
        {level:3, name:'Weapon Bond', desc:'Bond with up to two weapons over a short rest: you can’t be disarmed of them, and a bonus action summons one to your hand from the same plane.'},
        {level:7, name:'War Magic', type:'bonus', desc:'When you use your action to cast a cantrip, you can make one weapon attack as a bonus action.'},
        {level:10, name:'Eldritch Strike', desc:'When you hit a creature with a weapon attack, it has disadvantage on the next save it makes against a spell you cast before the end of your next turn.'},
        {level:15, name:'Arcane Charge', desc:'When you use Action Surge, you can teleport up to 30 ft to an unoccupied space you can see, before or after the extra action.'},
        {level:18, name:'Improved War Magic', type:'bonus', desc:'When you use your action to cast a spell, you can make one weapon attack as a bonus action.'},
      ],
    },
  },
});

Object.assign(CLASS_FEATURES, {
  // Cleric (2014 PHB)
  cleric: {
    subclassLabel: 'Divine Domain', subclassLevel: 1,
    resources: [{id:'channelDivinity', label:'Channel Divinity', level:2, max:clericCD, recharge:'short'}],
    base: [
      {level:1, name:'Spellcasting', desc:'Cast cleric spells using Wisdom. Prepare Wisdom modifier + cleric level spells (minimum 1) after each long rest; cast prepared rituals as rituals.'},
      {level:1, name:'Divine Domain', desc:'Pick your domain (above). It grants domain spells, always prepared, and features at 1st, 2nd, 6th, 8th and 17th level.'},
      {level:2, name:'Channel Divinity', desc:'Channel divine energy for one effect: Turn Undead or your domain’s. Once per short or long rest (twice from 6th level, three times from 18th).'},
      {level:2, name:'Channel Divinity: Turn Undead', type:'action', spends:'channelDivinity', save:'wis',
        saveNote:'Each undead within 30 ft that can see or hear you. On a failure it is turned for 1 minute or until it takes damage: it moves away from you and can only Dash or try to escape.',
        desc:'Present your holy symbol: undead within 30 ft are turned on a failed Wisdom save.'},
      {level:4, name:'Ability Score Improvement', desc:ASI_TEXT('4, 8, 12, 16 and 19')},
      {level:5, name:'Destroy Undead', desc:'An undead that fails its save against Turn Undead is destroyed if its challenge rating is low enough: 1/2 or lower at 5th level, 1 at 8th, 2 at 11th, 3 at 14th, 4 at 17th.'},
      {level:10, name:'Divine Intervention', type:'action', uses:{max:()=>1, recharge:'long'},
        roll:{label:'Divine Intervention', cmd:()=>'1d100', desc:()=>charLevel() >= 20 ? 'it succeeds automatically at 20th level' : `it succeeds on ${charLevel()} or lower`},
        desc:'Call on your deity: roll d100, and on your cleric level or lower your deity intervenes (the DM chooses how). After a success you can’t use it again for 7 days; otherwise after a long rest.'},
      {level:20, name:'Divine Intervention Improvement', desc:'Your Divine Intervention succeeds automatically.'},
    ],
    subclasses: {
      'Knowledge Domain': [
        {level:1, name:'Domain Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers:domainSpells([[1,'Command'],[1,'Identify'],[3,'Augury'],[3,'Suggestion'],[5,'Nondetection'],[5,'Speak with Dead'],[7,'Arcane Eye'],[7,'Confusion'],[9,'Legend Lore'],[9,'Scrying']])},
        {level:1, name:'Blessings of Knowledge', desc:'Learn two languages, and become proficient in two of Arcana, History, Nature or Religion with double your proficiency bonus.'},
        {level:2, name:'Channel Divinity: Knowledge of the Ages', type:'action', spends:'channelDivinity', desc:'Gain proficiency with one skill or tool of your choice for 10 minutes.'},
        {level:6, name:'Channel Divinity: Read Thoughts', type:'action', spends:'channelDivinity', save:'wis',
          saveNote:'A creature within 60 ft. On a failure you read its surface thoughts for 1 minute, and can end it with your action to cast Suggestion on it without a slot (it automatically fails the save).',
          desc:'Read a creature’s thoughts, then plant a suggestion.'},
        {level:8, name:'Potent Spellcasting', desc:'Add your Wisdom modifier to the damage of your cleric cantrips (Turnkeeper adds it).'},
        {level:17, name:'Visions of the Past', desc:'Meditate for a minute to see recent events tied to an object you hold, or to your surroundings.'},
      ],
      'Life Domain': [
        {level:1, name:'Domain Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers:domainSpells([[1,'Bless'],[1,'Cure Wounds'],[3,'Lesser Restoration'],[3,'Spiritual Weapon'],[5,'Beacon of Hope'],[5,'Revivify'],[7,'Death Ward'],[7,'Guardian of Faith'],[9,'Mass Cure Wounds'],[9,'Raise Dead']])},
        {level:1, name:'Bonus Proficiency', desc:'Proficiency with heavy armor.'},
        {level:1, name:'Disciple of Life', desc:'Your healing spells of 1st level or higher restore an extra 2 + the spell’s level hit points (Turnkeeper adds it).'},
        {level:2, name:'Channel Divinity: Preserve Life', type:'action', spends:'channelDivinity',
          roll:{label:'Hit points to share', info:()=>`Share out up to <b>${5 * charLevel()}</b> hit points (5 × cleric level) among creatures within 30 ft. None can be brought above half its hit point maximum. No effect on undead or constructs.`},
          desc:'Restore hit points to creatures within 30 ft, up to half their maximum.'},
        {level:6, name:'Blessed Healer', desc:'When a healing spell of 1st level or higher you cast heals someone else, you regain 2 + the spell’s level hit points.'},
        divineStrike('radiant', 'radiant'),
        {level:17, name:'Supreme Healing', desc:'Your healing spells use the maximum on every die instead of rolling (Turnkeeper sets the healing to the maximum).'},
      ],
      'Light Domain': [
        {level:1, name:'Domain Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers:domainSpells([[1,'Burning Hands'],[1,'Faerie Fire'],[3,'Flaming Sphere'],[3,'Scorching Ray'],[5,'Daylight'],[5,'Fireball'],[7,'Guardian of Faith'],[7,'Wall of Fire'],[9,'Flame Strike'],[9,'Scrying']])},
        {level:1, name:'Bonus Cantrip', desc:'You know the Light cantrip.', tiers:[{level:1, name:'Light', text:'Cantrip; always prepared.'}]},
        {level:1, name:'Warding Flare', type:'reaction', uses:{max:()=>Math.max(1, abilityScoreMod('wis')), recharge:'long'},
          desc:'When a creature you can see within 30 ft attacks you, impose disadvantage on the attack (unless it can’t be blinded). Uses: your Wisdom modifier (minimum 1), per long rest.'},
        {level:2, name:'Channel Divinity: Radiance of the Dawn', type:'action', spends:'channelDivinity', save:'con',
          saveNote:'Each hostile creature within 30 ft of you. Half damage on a success. Magical darkness within 30 ft is dispelled. Total cover protects.',
          roll:{label:'Damage', cmd:()=>`2d10+${charLevel()}`, desc:()=>'radiant damage (half on a successful save)', type:()=>'radiant'},
          desc:'Dispel darkness and burn your enemies with light.'},
        {level:6, name:'Improved Flare', desc:'You can use Warding Flare when a creature attacks another creature within 30 ft of you.'},
        {level:8, name:'Potent Spellcasting', desc:'Add your Wisdom modifier to the damage of your cleric cantrips (Turnkeeper adds it).'},
        {level:17, name:'Corona of Light', type:'action', desc:'For 1 minute, emit bright light 60 ft; enemies in it have disadvantage on saves against spells that deal fire or radiant damage.'},
      ],
      'Nature Domain': [
        {level:1, name:'Domain Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers:domainSpells([[1,'Animal Friendship'],[1,'Speak with Animals'],[3,'Barkskin'],[3,'Spike Growth'],[5,'Plant Growth'],[5,'Wind Wall'],[7,'Dominate Beast'],[7,'Grasping Vine'],[9,'Insect Plague'],[9,'Tree Stride']])},
        {level:1, name:'Acolyte of Nature', choose:true, ability:'wis', desc:'Learn one druid cantrip (it counts as a cleric cantrip), and gain proficiency in Animal Handling, Nature or Survival.',
          tiers:['Druidcraft', 'Guidance', 'Mending', 'Poison Spray', 'Produce Flame', 'Resistance', 'Shillelagh', 'Thorn Whip'].map(name=>({level:1, name, text:'Cantrip; always prepared.'}))},
        {level:1, name:'Bonus Proficiency', desc:'Proficiency with heavy armor.'},
        {level:2, name:'Channel Divinity: Charm Animals and Plants', type:'action', spends:'channelDivinity', save:'wis',
          saveNote:'Each beast or plant creature within 30 ft that can see you. On a failure it is charmed by you for 1 minute or until it takes damage, and is friendly to you and your allies.',
          desc:'Charm the beasts and plants around you.'},
        {level:6, name:'Dampen Elements', type:'reaction', desc:'When you or a creature within 30 ft takes acid, cold, fire, lightning or thunder damage, grant resistance to that instance.'},
        divineStrike('cold, fire or lightning (your choice)', 'cold, fire or lightning (your choice)'),
        {level:17, name:'Master of Nature', type:'bonus', desc:'Command creatures charmed by your Charm Animals and Plants.'},
      ],
      'Tempest Domain': [
        {level:1, name:'Domain Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers:domainSpells([[1,'Fog Cloud'],[1,'Thunderwave'],[3,'Gust of Wind'],[3,'Shatter'],[5,'Call Lightning'],[5,'Sleet Storm'],[7,'Control Water'],[7,'Ice Storm'],[9,'Destructive Wave'],[9,'Insect Plague']])},
        {level:1, name:'Bonus Proficiencies', desc:'Proficiency with martial weapons and heavy armor.'},
        {level:1, name:'Wrath of the Storm', type:'reaction', uses:{max:()=>Math.max(1, abilityScoreMod('wis')), recharge:'long'}, save:'dex',
          saveNote:'When a creature within 5 ft that you can see hits you with an attack. Half damage on a success.',
          roll:{label:'Damage', cmd:()=>'2d8', desc:()=>'lightning or thunder damage (your choice; half on a successful save)'},
          desc:'Strike back with thunder or lightning when you’re hit. Uses: your Wisdom modifier (minimum 1), per long rest.'},
        {level:2, name:'Channel Divinity: Destructive Wrath', spends:'channelDivinity', desc:'When you roll lightning or thunder damage, deal the maximum instead of rolling.'},
        {level:6, name:'Thunderbolt Strike', desc:'When you deal lightning damage to a Large or smaller creature, you can also push it up to 10 ft away.'},
        divineStrike('thunder', 'thunder'),
        {level:17, name:'Stormborn', desc:'You have a flying speed equal to your walking speed whenever you’re outdoors and not underground.'},
      ],
      'Trickery Domain': [
        {level:1, name:'Domain Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers:domainSpells([[1,'Charm Person'],[1,'Disguise Self'],[3,'Mirror Image'],[3,'Pass without Trace'],[5,'Blink'],[5,'Dispel Magic'],[7,'Dimension Door'],[7,'Polymorph'],[9,'Dominate Person'],[9,'Modify Memory']])},
        {level:1, name:'Blessing of the Trickster', type:'action', desc:'A willing creature you touch (not you) has advantage on Dexterity (Stealth) checks for 1 hour, or until you use this again.'},
        {level:2, name:'Channel Divinity: Invoke Duplicity', type:'action', spends:'channelDivinity', desc:'Create an illusory duplicate within 30 ft for 1 minute (concentration). Move it 30 ft as a bonus action, cast spells through it, and have advantage on attacks against creatures within 5 ft of both of you.'},
        {level:6, name:'Channel Divinity: Cloak of Shadows', type:'action', spends:'channelDivinity', desc:'Become invisible until the end of your next turn, or until you attack or cast a spell.'},
        divineStrike('poison', 'poison'),
        {level:17, name:'Improved Duplicity', desc:'Invoke Duplicity creates up to four duplicates, moved together with one bonus action.'},
      ],
      'War Domain': [
        {level:1, name:'Domain Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers:domainSpells([[1,'Divine Favor'],[1,'Shield of Faith'],[3,'Magic Weapon'],[3,'Spiritual Weapon'],[5,"Crusader's Mantle"],[5,'Spirit Guardians'],[7,'Freedom of Movement'],[7,'Stoneskin'],[9,'Flame Strike'],[9,'Hold Monster']])},
        {level:1, name:'Bonus Proficiencies', desc:'Proficiency with martial weapons and heavy armor.'},
        {level:1, name:'War Priest', type:'bonus', uses:{max:()=>Math.max(1, abilityScoreMod('wis')), recharge:'long'},
          desc:'When you take the Attack action, make one weapon attack as a bonus action. Uses: your Wisdom modifier (minimum 1), per long rest.'},
        {level:2, name:'Channel Divinity: Guided Strike', spends:'channelDivinity', desc:'When you make an attack roll, add +10 to it, after seeing the roll but before the DM says whether it hits.'},
        {level:6, name:'Channel Divinity: War God’s Blessing', type:'reaction', spends:'channelDivinity', desc:'When a creature within 30 ft makes an attack roll, give it +10, after seeing the roll but before the DM says whether it hits.'},
        divineStrike('weapon', 'damage of the weapon’s type'),
        {level:17, name:'Avatar of Battle', desc:'Resistance to bludgeoning, piercing and slashing damage from nonmagical weapons.'},
      ],
    },
  },
});

Object.assign(CLASS_FEATURES, {
  // Ranger (2014 PHB)
  ranger: {
    subclassLabel: 'Ranger Archetype', subclassLevel: 3,
    base: [
      {level:1, name:'Favored Enemy', picks:{n:()=>charLevel() >= 14 ? 3 : charLevel() >= 6 ? 2 : 1, label:'favored enemy', options:()=>CREATURE_TYPES},
        desc:'Advantage on Wisdom (Survival) checks to track your favored enemies, and on Intelligence checks to recall information about them. You learn one language they speak. One type at 1st level, another at 6th and 14th.'},
      {level:1, name:'Natural Explorer', picks:{n:()=>charLevel() >= 10 ? 3 : charLevel() >= 6 ? 2 : 1, label:'favored terrain', options:()=>TERRAINS},
        desc:'In your favored terrain: double proficiency on Intelligence and Wisdom checks about it, difficult terrain doesn’t slow your group, you can’t get lost except by magic, you stay alert while doing other things, you move stealthily at a normal pace alone, and you find twice the food. One terrain at 1st level, another at 6th and 10th.'},
      {level:2, name:'Fighting Style', choose:true, desc:'Pick one style; its benefit is permanent.', tiers:styleTiers(['Archery', 'Defense', 'Dueling', 'Two-Weapon Fighting'], 2)},
      {level:2, name:'Spellcasting', desc:'Cast ranger spells using Wisdom. You know a set number of ranger spells; swap one when you gain a level.'},
      {level:3, name:'Ranger Archetype', desc:'Pick your archetype (above): Hunter or Beast Master.'},
      {level:3, name:'Primeval Awareness', type:'action', desc:'Spend a ranger spell slot: for 1 minute per slot level, sense whether aberrations, celestials, dragons, elementals, fey, fiends or undead are within 1 mile (6 miles in your favored terrain). Not their number or location.'},
      {level:4, name:'Ability Score Improvement', desc:ASI_TEXT('4, 8, 12, 16 and 19')},
      {level:5, name:'Extra Attack', attacks:2, desc:'Attack twice when you take the Attack action.'},
      {level:8, name:'Land’s Stride', desc:'Nonmagical difficult terrain doesn’t slow you, and nonmagical plants don’t hurt or hold you. Advantage on saves against magical plants that impede movement.'},
      {level:10, name:'Hide in Plain Sight', desc:'Spend 1 minute camouflaging yourself: +10 to Dexterity (Stealth) checks while you stay still against a solid surface.'},
      {level:14, name:'Vanish', type:'bonus', desc:'Hide as a bonus action, and you can’t be tracked by nonmagical means unless you choose to leave a trail.'},
      {level:18, name:'Feral Senses', desc:'Attacking a creature you can’t see doesn’t give you disadvantage, and you know where any invisible creature within 30 ft is unless it’s hidden from you.'},
      {level:20, name:'Foe Slayer', desc:'Once on each of your turns, add your Wisdom modifier to an attack roll or a damage roll against one of your favored enemies.'},
    ],
    subclasses: {
      'Hunter': [
        {level:3, name:'Hunter’s Prey', choose:true, desc:'Pick one.', tiers:[
          {level:3, name:'Colossus Slayer', text:'Once per turn, a weapon hit on a creature below its hit point maximum deals an extra 1d8 damage (the Attack popup has a toggle).'},
          {level:3, name:'Giant Killer', type:'reaction', text:'When a Large or larger creature within 5 ft hits or misses you, attack it right after.'},
          {level:3, name:'Horde Breaker', text:'Once per turn, when you make a weapon attack, make another against a different creature within 5 ft of the target and within your reach.'}]},
        {level:7, name:'Defensive Tactics', choose:true, desc:'Pick one.', tiers:[
          {level:7, name:'Escape the Horde', text:'Opportunity attacks against you have disadvantage.'},
          {level:7, name:'Multiattack Defense', text:'When a creature hits you, you get +4 AC against its later attacks this turn.'},
          {level:7, name:'Steel Will', text:'Advantage on saves against being frightened.'}]},
        {level:11, name:'Multiattack', choose:true, desc:'Pick one.', tiers:[
          {level:11, name:'Volley', type:'action', text:'Make a ranged attack against every creature within 10 ft of a point you can see within range (one piece of ammunition each).'},
          {level:11, name:'Whirlwind Attack', type:'action', text:'Make a melee attack against every creature within 5 ft of you.'}]},
        {level:15, name:'Superior Hunter’s Defense', choose:true, desc:'Pick one.', tiers:[
          {level:15, name:'Evasion', text:'When a Dexterity save would halve damage, you take none on a success and half on a failure.'},
          {level:15, name:'Stand Against the Tide', type:'reaction', text:'When a hostile creature misses you with a melee attack, make it repeat the attack against another creature (not itself).'},
          {level:15, name:'Uncanny Dodge', type:'reaction', text:'When an attacker you can see hits you, halve the attack’s damage.'}]},
      ],
      'Beast Master': [
        {level:3, name:'Ranger’s Companion', desc:'A beast of challenge rating 1/4 or lower (Medium or smaller) obeys you. Add your proficiency bonus to its AC, attacks, damage, saves and skills; its hit point maximum is its normal one or 4 × your ranger level, whichever is higher. It acts on your initiative; use your action to command it to Attack, Dash, Disengage, Dodge or Help. (Its stat block isn’t in Turnkeeper yet: the DM has it.)'},
        {level:7, name:'Exceptional Training', type:'bonus', desc:'When your companion doesn’t attack on your turn, command it with a bonus action to Dash, Disengage, Dodge or Help. Its attacks count as magical.'},
        {level:11, name:'Bestial Fury', desc:'When you command your companion to Attack, it makes two attacks (or uses Multiattack).'},
        {level:15, name:'Share Spells', desc:'A spell you cast that targets only you can also affect your companion if it’s within 30 ft.'},
      ],
    },
  },
  // Sorcerer (2014 PHB)
  sorcerer: {
    subclassLabel: 'Sorcerous Origin', subclassLevel: 1,
    base: [
      {level:1, name:'Spellcasting', desc:'Cast sorcerer spells using Charisma. You know a set number of sorcerer spells; swap one when you gain a level.'},
      {level:1, name:'Sorcerous Origin', desc:'Pick your origin (above): Draconic Bloodline or Wild Magic.'},
      {level:2, name:'Font of Magic', pool:{max:()=>charLevel(), recharge:'long'},
        roll:{label:'Flexible Casting', info:()=>'As a bonus action: turn a spell slot into sorcery points equal to its level, or spend points to create a slot (1st: 2 points, 2nd: 3, 3rd: 5, 4th: 6, 5th: 7; up to 5th level). Created slots vanish after a long rest. Change your points and slots in Resources.'},
        desc:'You have sorcery points equal to your sorcerer level, regained on a long rest. Spend them on Metamagic or convert them to and from spell slots (Flexible Casting).'},
      {level:3, name:'Metamagic', picks:{n:()=>charLevel() >= 17 ? 4 : charLevel() >= 10 ? 3 : 2, label:'Metamagic option', options:()=>Object.keys(METAMAGIC_TEXT)}, pickText:METAMAGIC_TEXT,
        desc:'Learn two Metamagic options (another at 10th and 17th). Spend sorcery points to twist a spell as you cast it; only one per spell, except Empowered Spell. Take the points off in Resources.'},
      {level:4, name:'Ability Score Improvement', desc:ASI_TEXT('4, 8, 12, 16 and 19')},
      {level:20, name:'Sorcerous Restoration', desc:'Regain 4 spent sorcery points when you finish a short rest.'},
    ],
    subclasses: {
      'Draconic Bloodline': [
        {level:1, name:'Dragon Ancestor', choose:true, desc:'Pick your dragon. You speak Draconic, and double your proficiency bonus on Charisma checks with dragons.',
          tiers:DRAGON_ANCESTRIES.map(a=>({level:1, name:a.name, text:`${a.type} damage.`}))},
        {level:1, name:'Draconic Resilience', desc:'Your hit point maximum rises by 1 per sorcerer level (include it in your hit points). Without armor, your AC is 13 + your Dexterity modifier (Turnkeeper uses it).'},
        {level:6, name:'Elemental Affinity', desc:'When you cast a spell that deals your dragon’s damage type, add your Charisma modifier to one damage roll of it (Turnkeeper adds it). Spend 1 sorcery point to gain resistance to that type for 1 hour.'},
        {level:14, name:'Dragon Wings', type:'bonus', desc:'Sprout dragon wings: a flying speed equal to your walking speed until you dismiss them. Not while wearing armor that doesn’t allow them.'},
        {level:18, name:'Draconic Presence', type:'action', save:'wis',
          saveNote:'Spend 5 sorcery points: for 1 minute (concentration), each hostile creature that starts its turn within 60 ft is charmed (awe) or frightened (fear) on a failure, until the aura ends.',
          desc:'Exude an aura of awe or fear.'},
      ],
      'Wild Magic': [
        {level:1, name:'Wild Magic Surge',
          rolls:[{label:'Surge check (after a 1st-level or higher spell)', cmd:()=>'1d20', desc:()=>'on a 1, roll on the Wild Magic Surge table'},
                 {label:'Wild Magic Surge table', cmd:()=>'1d100', desc:()=>'the DM reads the effect'}],
          desc:'Right after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20; on a 1, roll on the Wild Magic Surge table.'},
        {level:1, name:'Tides of Chaos', uses:{max:()=>1, recharge:'long'}, desc:'Gain advantage on one attack roll, ability check or saving throw. Regained on a long rest, or when the DM has you roll on the Wild Magic Surge table.'},
        {level:6, name:'Bend Luck', type:'reaction', spendOnUse:false,
          roll:{label:'Add to or subtract from the roll', cmd:()=>'1d4', desc:()=>'costs 2 sorcery points (take them off in Resources)'},
          desc:'When a creature you can see makes an attack roll, ability check or saving throw, spend 2 sorcery points to roll 1d4 and add or subtract it, after the roll but before it takes effect.'},
        {level:14, name:'Controlled Chaos', desc:'When you roll on the Wild Magic Surge table, roll twice and use either result.'},
        {level:18, name:'Spell Bombardment', desc:'When you roll damage for a spell and a die rolls its highest number, roll it again and add it. Once per turn.'},
      ],
    },
  },
  // Warlock (2014 PHB)
  warlock: {
    subclassLabel: 'Otherworldly Patron', subclassLevel: 1,
    base: [
      {level:1, name:'Otherworldly Patron', desc:'Pick your patron (above): the Archfey, the Fiend or the Great Old One. Its expanded spells join your warlock spell list.'},
      {level:1, name:'Pact Magic', desc:'Cast warlock spells using Charisma. All your spell slots are the same level and come back on a short or long rest (see Resources). You know a set number of warlock spells.'},
      {level:2, name:'Eldritch Invocations', picks:{n:invocationsKnown, label:'invocation',
          options:()=>INVOCATIONS.filter(i=>(!i.req.level || charLevel() >= i.req.level) && (!i.req.pact || getChoice('Pact Boon') === i.req.pact)).map(i=>i.name)},
        pickText:Object.fromEntries(INVOCATIONS.map(i=>[i.name, i.text + (i.req.level || i.req.pact || i.req.eb ? ` (Needs ${[i.req.level && `level ${i.req.level}`, i.req.pact, i.req.eb && 'the Eldritch Blast cantrip'].filter(Boolean).join(', ')}.)` : '')])),
        desc:'Learn two invocations (more as you level: 3 at 5th, 4 at 7th, 5 at 9th, 6 at 12th, 7 at 15th, 8 at 18th). Some need a level, a pact boon or Eldritch Blast.'},
      {level:3, name:'Pact Boon', choose:true, desc:'Your patron’s gift.', tiers:[
        {level:3, name:'Pact of the Chain', text:'Learn Find Familiar and cast it as a ritual; your familiar can be an imp, pseudodragon, quasit or sprite, and can attack with its reaction when you take the Attack action and give up one attack.'},
        {level:3, name:'Pact of the Blade', text:'Create a pact weapon in your hand as an action, in any melee form; you’re proficient with it and it counts as magical.'},
        {level:3, name:'Pact of the Tome', text:'A Book of Shadows with three cantrips from any class’s list; you can cast them at will.'}]},
      {level:4, name:'Ability Score Improvement', desc:ASI_TEXT('4, 8, 12, 16 and 19')},
      mysticArcanum(6, 11), mysticArcanum(7, 13), mysticArcanum(8, 15), mysticArcanum(9, 17),
      {level:20, name:'Eldritch Master', uses:{max:()=>1, recharge:'long'}, desc:'Spend 1 minute entreating your patron to regain all your Pact Magic slots. Once per long rest.'},
    ],
    subclasses: {
      'The Archfey': [
        {level:1, name:'Expanded Spell List', expanded:true, desc:'These join your warlock spell list.',
          tiers:expandedTiers([[1,'Faerie Fire'],[1,'Sleep'],[3,'Calm Emotions'],[3,'Phantasmal Force'],[5,'Blink'],[5,'Plant Growth'],[7,'Dominate Beast'],[7,'Greater Invisibility'],[9,'Dominate Person'],[9,'Seeming']])},
        {level:1, name:'Fey Presence', type:'action', uses:{max:()=>1, recharge:'short'}, save:'wis',
          saveNote:'Each creature in a 10-ft cube from you. On a failure, charmed or frightened (your choice) by you until the end of your next turn.',
          desc:'Charm or frighten the creatures around you. Once per short or long rest.'},
        {level:6, name:'Misty Escape', type:'reaction', uses:{max:()=>1, recharge:'short'}, desc:'When you take damage, turn invisible and teleport up to 60 ft; you stay invisible until your next turn starts or you attack or cast a spell.'},
        {level:10, name:'Beguiling Defenses', type:'reaction', desc:'You can’t be charmed. When a creature tries to charm you, turn it back on it (Wisdom save against your spell save DC, charmed for 1 minute on a failure).'},
        {level:14, name:'Dark Delirium', type:'action', uses:{max:()=>1, recharge:'short'}, save:'wis',
          saveNote:'A creature within 60 ft. On a failure it’s charmed or frightened for 1 minute (concentration), lost in an illusory realm; it ends if the creature takes damage.',
          desc:'Plunge a creature into an illusory realm.'},
      ],
      'The Fiend': [
        {level:1, name:'Expanded Spell List', expanded:true, desc:'These join your warlock spell list.',
          tiers:expandedTiers([[1,'Burning Hands'],[1,'Command'],[3,'Blindness/Deafness'],[3,'Scorching Ray'],[5,'Fireball'],[5,'Stinking Cloud'],[7,'Fire Shield'],[7,'Wall of Fire'],[9,'Flame Strike'],[9,'Hallow']])},
        {level:1, name:'Dark One’s Blessing',
          roll:{label:'Temporary hit points', info:()=>`When you reduce a hostile creature to 0 hit points, gain <b>${Math.max(1, abilityScoreMod('cha') + charLevel())}</b> temporary hit points (Charisma modifier + warlock level, minimum 1).`},
          desc:'Gain temporary hit points when you drop a hostile creature to 0.'},
        {level:6, name:'Dark One’s Own Luck', uses:{max:()=>1, recharge:'short'},
          roll:{label:'Add to the check or save', cmd:()=>'1d10', desc:()=>'add it after seeing the roll, before it takes effect'},
          desc:'Add a d10 to an ability check or saving throw you make. Once per short or long rest.'},
        {level:10, name:'Fiendish Resilience', choose:true, desc:'After a short or long rest, pick a damage type: you resist it until you pick another (not from magical or silvered weapons).',
          tiers:['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'].map(t=>({level:10, name:t, text:`Resistance to ${t} damage.`}))},
        {level:14, name:'Hurl Through Hell', uses:{max:()=>1, recharge:'long'},
          roll:{label:'Damage', cmd:()=>'10d10', desc:()=>'psychic damage when it returns (unless it’s a fiend)', type:()=>'psychic'},
          desc:'When you hit a creature with an attack, send it through the lower planes until the end of your next turn. Once per long rest.'},
      ],
      'The Great Old One': [
        {level:1, name:'Expanded Spell List', expanded:true, desc:'These join your warlock spell list.',
          tiers:expandedTiers([[1,'Dissonant Whispers'],[1,"Tasha's Hideous Laughter"],[3,'Detect Thoughts'],[3,'Phantasmal Force'],[5,'Clairvoyance'],[5,'Sending'],[7,'Dominate Beast'],[7,"Evard's Black Tentacles"],[9,'Dominate Person'],[9,'Telekinesis']])},
        {level:1, name:'Awakened Mind', desc:'Speak telepathically to any creature you can see within 30 ft (it must understand a language).'},
        {level:6, name:'Entropic Ward', type:'reaction', uses:{max:()=>1, recharge:'short'}, desc:'When a creature attacks you, give the attack disadvantage. If it misses, you have advantage on your next attack against it before your next turn ends.'},
        {level:10, name:'Thought Shield', desc:'Your thoughts can’t be read unless you allow it. Resistance to psychic damage, and a creature that deals you psychic damage takes the same amount.'},
        {level:14, name:'Create Thrall', type:'action', desc:'Touch an incapacitated humanoid: it’s charmed by you until Remove Curse is cast on it, and you can communicate telepathically while on the same plane.'},
      ],
    },
  },
});
