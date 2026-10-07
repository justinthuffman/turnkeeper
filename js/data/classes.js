/* Moved from turnkeeper.html (refactor stage 2). */
/* ---------- Class features ---------- */
// PHB-only (core subclasses), checked against dnd5e.wikidot.com and paraphrased.
// `level` = class level the feature arrives at; later features are dimmed until reached.
// `type` ('action' | 'bonus' | 'reaction') adds a colored label; passive features have none.
// Oath spells are `tiers` with spell names, so they also show in the Spells list as always prepared.
const oathSpells = (list)=>list.map(([level, name])=>({level, name, text:'Oath spell; always prepared.'}));
const CLASS_FEATURES = {
  paladin: {
    subclassLabel: 'Sacred Oath', subclassLevel: 3,
    // Shared pools that several features spend from
    resources: [{id:'channelDivinity', label:'Channel Divinity', level:3, max:()=>1, recharge:'short'}],
    base: [
      {level:1, name:'Divine Sense', type:'action', uses:{max:()=>Math.max(0, 1 + abilityScoreMod('cha')), recharge:'long'}, desc:'Until the end of your next turn, sense the location of any celestial, fiend or undead within 60 ft not behind total cover, and any consecrated or desecrated place or object nearby. Uses: 1 + your Charisma modifier per long rest.'},
      {level:1, name:'Lay on Hands', type:'action', pool:{max:()=>5*charLevel(), recharge:'long'}, desc:'You have a healing pool of 5 × your paladin level, refilled on a long rest. Touch a creature to restore hit points from the pool, or spend 5 points to cure one disease or neutralize one poison.'},
      {level:2, name:'Fighting Style', choose:true, desc:'Pick one style; its benefit is permanent.',
        tiers:[{level:2, name:'Defense', text:'+1 AC while wearing armor.'},
               {level:2, name:'Dueling', text:'+2 damage with a melee weapon in one hand and no other weapons.'},
               {level:2, name:'Great Weapon Fighting', text:'Reroll 1s and 2s on damage dice with a two-handed or versatile melee weapon held in two hands.'},
               {level:2, name:'Protection', type:'reaction', text:'With a shield, use your reaction to give disadvantage to an attack on an ally within 5 ft.'}]},
      {level:2, name:'Spellcasting', desc:'Cast paladin spells using Charisma. Prepare Charisma modifier + half your paladin level (minimum 1) each long rest.'},
      {level:2, name:'Divine Smite', desc:'When you hit with a melee weapon attack, spend a spell slot for +2d8 radiant damage (+1d8 per slot level above 1st, max 5d8; +1d8 more against undead or fiends).'},
      {level:3, name:'Divine Health', desc:'You are immune to disease.'},
      {level:3, name:'Sacred Oath', desc:'Swear your Oath (pick it above). It grants Oath spells and Channel Divinity options; Channel Divinity can be used once per short or long rest.'},
      {level:4, name:'Ability Score Improvement', desc:'At levels 4, 8, 12, 16 and 19: raise one ability score by 2, or two scores by 1 each (max 20), or take a feat if your table allows it.'},
      {level:5, name:'Extra Attack', attacks:2, desc:'Attack twice when you take the Attack action.'},
      {level:6, name:'Aura of Protection', desc:'You and friendly creatures within 10 ft add your Charisma modifier (minimum +1) to saving throws while you’re conscious.'},
      {level:10, name:'Aura of Courage', desc:'You and friendly creatures within 10 ft can’t be frightened while you’re conscious.'},
      {level:11, name:'Improved Divine Smite', desc:'Every melee weapon hit deals an extra 1d8 radiant damage.'},
      {level:14, name:'Cleansing Touch', type:'action', uses:{max:()=>Math.max(1, abilityScoreMod('cha')), recharge:'long'}, desc:'End one spell on yourself or a willing creature you touch. Uses: your Charisma modifier (minimum 1) per long rest.'},
      {level:18, name:'Aura Improvements', desc:'Your auras reach 30 ft instead of 10 ft.'},
    ],
    subclasses: {
      'Oath of Devotion': [
        {level:3, name:'Oath Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers: oathSpells([[3,'Protection from Evil and Good'],[3,'Sanctuary'],[5,'Lesser Restoration'],[5,'Zone of Truth'],[9,'Beacon of Hope'],[9,'Dispel Magic'],[13,'Freedom of Movement'],[13,'Guardian of Faith'],[17,'Commune'],[17,'Flame Strike']])},
        {level:3, name:'Channel Divinity: Sacred Weapon', type:'action', spends:'channelDivinity', fx:()=>({until:'1 minute', weapon:'any', toHit:Math.max(1, abilityScoreMod('cha'))}), tip:'For the next minute, Turnkeeper adds your Charisma modifier to your Attack popups (see Active effects in the Combat Menu). Untick it there for a different weapon.', desc:'For 1 minute, add your Charisma modifier (minimum +1) to attack rolls with one weapon you hold. It sheds bright light 20 ft (dim 20 ft more) and counts as magical.'},
        {level:3, name:'Channel Divinity: Turn the Unholy', type:'action', spends:'channelDivinity', save:'wis', saveNote:'Each fiend or undead within 30 ft that can see or hear you. On a failure it is turned for 1 minute or until it takes damage.', desc:'Each fiend or undead within 30 ft that can see or hear you makes a Wisdom save or is turned for 1 minute or until it takes damage.'},
        {level:7, name:'Aura of Devotion', desc:'You and friendly creatures within 10 ft can’t be charmed while you’re conscious (30 ft at level 18).'},
        {level:15, name:'Purity of Spirit', desc:'You are always under the effects of Protection from Evil and Good.'},
        {level:20, name:'Holy Nimbus', type:'action', uses:{max:()=>1, recharge:'long'}, desc:'For 1 minute, shed bright sunlight 30 ft. Enemies starting their turn in it take 10 radiant damage, and you have advantage on saves against spells from fiends and undead. Once per long rest.'},
      ],
      'Oath of the Ancients': [
        {level:3, name:'Oath Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers: oathSpells([[3,'Ensnaring Strike'],[3,'Speak with Animals'],[5,'Misty Step'],[5,'Moonbeam'],[9,'Plant Growth'],[9,'Protection from Energy'],[13,'Ice Storm'],[13,'Stoneskin'],[17,'Commune with Nature'],[17,'Tree Stride']])},
        {level:3, name:'Channel Divinity: Nature’s Wrath', type:'action', spends:'channelDivinity', save:'str/dex', saveNote:'The target picks Strength or Dexterity. On a failure it is restrained, and repeats the save at the end of each of its turns.', desc:'Spectral vines grab a creature within 10 ft; it makes a Strength or Dexterity save (its choice) or is restrained, repeating the save each turn.'},
        {level:3, name:'Channel Divinity: Turn the Faithless', type:'action', spends:'channelDivinity', save:'wis', saveNote:'Each fey or fiend within 30 ft that can hear you. On a failure it is turned for 1 minute or until it takes damage.', desc:'Each fey or fiend within 30 ft that can hear you makes a Wisdom save or is turned for 1 minute or until it takes damage.'},
        {level:7, name:'Aura of Warding', desc:'You and friendly creatures within 10 ft have resistance to damage from spells (30 ft at level 18).'},
        {level:15, name:'Undying Sentinel', uses:{max:()=>1, recharge:'long'}, desc:'When reduced to 0 HP and not killed outright, drop to 1 HP instead, once per long rest. You also stop showing signs of age.'},
        {level:20, name:'Elder Champion', type:'action', uses:{max:()=>1, recharge:'long'}, desc:'For 1 minute: regain 10 HP at the start of each turn, cast action-length paladin spells as a bonus action, and enemies within 10 ft have disadvantage on saves against your paladin spells and Channel Divinity. Once per long rest.'},
      ],
      'Oath of Vengeance': [
        {level:3, name:'Oath Spells', desc:'Always prepared; they don’t count against your prepared spells.',
          tiers: oathSpells([[3,'Bane'],[3,"Hunter's Mark"],[5,'Hold Person'],[5,'Misty Step'],[9,'Haste'],[9,'Protection from Energy'],[13,'Banishment'],[13,'Dimension Door'],[17,'Hold Monster'],[17,'Scrying']])},
        {level:3, name:'Channel Divinity: Abjure Enemy', type:'action', spends:'channelDivinity', save:'wis', saveNote:'Fiends and undead have disadvantage. On a failure: frightened for 1 minute (or until it takes damage), speed 0. On a success: speed halved for 1 minute.', desc:'One creature within 60 ft makes a Wisdom save or is frightened for 1 minute (or until it takes damage) with speed 0. Fiends and undead save with disadvantage. On a success its speed is halved for 1 minute.'},
        {level:3, name:'Channel Divinity: Vow of Enmity', type:'bonus', spends:'channelDivinity', fx:{target:true, adv:true, weapon:'any'}, tip:'For the next minute, tick <b>Vow of Enmity target</b> in the Attack popup when you attack that creature.', desc:'Advantage on attack rolls against one creature within 10 ft for 1 minute.'},
        {level:7, name:'Relentless Avenger', desc:'When you hit with an opportunity attack, you can move up to half your speed right after, as part of the same reaction, without provoking opportunity attacks.'},
        {level:15, name:'Soul of Vengeance', type:'reaction', desc:'When the target of your Vow of Enmity attacks, make a melee weapon attack against it if it’s within reach.'},
        {level:20, name:'Avenging Angel', type:'action', uses:{max:()=>1, recharge:'long'}, save:'wis', saveNote:'The first time in a battle an enemy enters your 30 ft aura or starts its turn there. On a failure it is frightened for 1 minute or until it takes damage.', desc:'For 1 hour: gain a 60 ft flying speed and a 30 ft aura. The first time in a battle an enemy enters it or starts its turn there, it makes a Wisdom save or is frightened for 1 minute (or until it takes damage). Once per long rest.'},
      ],
    },
  },
  // Wizard (2014 PHB), checked on dnd5e.wikidot.com
  wizard: {
    subclassLabel: 'Arcane Tradition', subclassLevel: 2,
    base: [
      {level:1, name:'Spellcasting', desc:'Cast wizard spells from your spellbook using Intelligence. Prepare Intelligence modifier + wizard level spells (minimum 1) after each long rest; rituals in your spellbook can be cast without preparing them.'},
      {level:1, name:'Arcane Recovery', uses:{max:()=>1, recharge:'long'},
        roll:{label:'Slots to recover', info:()=>`When you finish a short rest, choose spent spell slots totalling up to <b>${Math.ceil(charLevel()/2)} slot level${Math.ceil(charLevel()/2) === 1 ? '' : 's'}</b> (none 6th level or higher) and restore them in Resources.`},
        desc:'Once per day, when you finish a short rest, recover spent spell slots whose levels add up to half your wizard level (rounded up), none of them 6th level or higher.'},
      {level:4, name:'Ability Score Improvement', desc:'At levels 4, 8, 12, 16 and 19: raise one ability score by 2, or two scores by 1 each (max 20), or take a feat if your table allows it.'},
      {level:18, name:'Spell Mastery', desc:'Pick one 1st-level and one 2nd-level wizard spell in your spellbook; cast them at their lowest level without a slot while prepared.'},
      {level:20, name:'Signature Spells', uses:{max:()=>2, recharge:'short'}, desc:'Two 3rd-level wizard spells are always prepared; cast each once at 3rd level without a slot, regained on a short or long rest.'},
    ],
    subclasses: {
      'School of Abjuration': [
        {level:2, name:'Abjuration Savant', desc:'Copying an abjuration spell into your spellbook costs half the gold and time.'},
        {level:2, name:'Arcane Ward', pool:{max:()=>2*charLevel() + abilityScoreMod('int'), recharge:'long'},
          desc:'When you cast a 1st-level or higher abjuration spell, create a ward (once per long rest) with hit points equal to twice your wizard level + your Intelligence modifier. It takes damage for you first. Casting abjuration spells restores 2 × the spell’s level in hit points. Track it in Resources.'},
        {level:6, name:'Projected Ward', type:'reaction', desc:'When a creature you can see within 30 ft takes damage, your Arcane Ward can absorb it instead.'},
        {level:10, name:'Improved Abjuration', desc:'Add your proficiency bonus to ability checks made as part of an abjuration spell (e.g. Counterspell, Dispel Magic).'},
        {level:14, name:'Spell Resistance', desc:'Advantage on saving throws against spells, and resistance to damage from spells.'},
      ],
      'School of Conjuration': [
        {level:2, name:'Conjuration Savant', desc:'Copying a conjuration spell into your spellbook costs half the gold and time.'},
        {level:2, name:'Minor Conjuration', type:'action', desc:'Conjure a nonmagical object (up to 3 ft on a side, 10 lb) that you’ve seen, in your hand or on the ground within 10 ft. It lasts 1 hour, or until it takes damage or you use this again.'},
        {level:6, name:'Benign Transposition', type:'action', uses:{max:()=>1, recharge:'long'}, desc:'Teleport up to 30 ft to an unoccupied space you can see, or swap places with a willing Small or Medium creature. Regained on a long rest or when you cast a 1st-level or higher conjuration spell.'},
        {level:10, name:'Focused Conjuration', desc:'While concentrating on a conjuration spell, taking damage can’t break your concentration.'},
        {level:14, name:'Durable Summons', desc:'Creatures you summon or create with a conjuration spell have 30 temporary hit points.'},
      ],
      'School of Divination': [
        {level:2, name:'Divination Savant', desc:'Copying a divination spell into your spellbook costs half the gold and time.'},
        {level:2, name:'Portent', uses:{max:()=>charLevel() >= 14 ? 3 : 2, recharge:'long'}, spendOnUse:false,
          roll:{label:'Roll your Portent dice after a long rest', cmd:()=>`${charLevel() >= 14 ? 3 : 2}d20`, desc:()=>'note each die; the total doesn’t matter'},
          desc:'After a long rest, roll two d20s and record them. Replace any attack roll, saving throw or ability check made by you or a creature you can see with one of them, before the roll. Once per turn. Unused dice are lost on your next long rest.'},
        {level:6, name:'Expert Divination', desc:'When you cast a 2nd-level or higher divination spell with a slot, regain one spent slot of a lower level (up to 5th).'},
        {level:10, name:'The Third Eye', type:'action', uses:{max:()=>1, recharge:'short'}, desc:'Gain one of: darkvision 60 ft, ethereal sight 60 ft, the ability to read any language, or see invisibility within 10 ft. Lasts until you’re incapacitated or rest.'},
        {level:14, name:'Greater Portent', desc:'Roll three d20s for Portent instead of two.'},
      ],
      'School of Enchantment': [
        {level:2, name:'Enchantment Savant', desc:'Copying an enchantment spell into your spellbook costs half the gold and time.'},
        {level:2, name:'Hypnotic Gaze', type:'action', save:'wis', saveNote:'A creature within 5 ft that can see or hear you. On a failure it is charmed until the end of your next turn: speed 0, incapacitated and visibly dazed. You can extend it with your action each turn. When it ends, or if the creature succeeds, you can’t use this on that creature again until a long rest.',
          desc:'Charm a creature within 5 ft that can see or hear you, leaving it incapacitated with speed 0.'},
        {level:6, name:'Instinctive Charm', type:'reaction', save:'wis', saveNote:'When a creature you can see within 30 ft attacks you. On a failure it must target the creature closest to it (or waste the attack). On a success you can’t use this on that attacker again until a long rest.',
          desc:'Use your reaction to make an attacker target someone else.'},
        {level:10, name:'Split Enchantment', desc:'An enchantment spell of 1st level or higher that targets only one creature can target a second creature.'},
        {level:14, name:'Alter Memories', type:'action', save:'int', saveNote:'Make a creature charmed by your spell forget up to 1 + your Charisma modifier hours (minimum 1) of the time it was charmed.',
          desc:'Charmed creatures don’t know you charmed them, and you can make one forget part of its time charmed.'},
      ],
      'School of Evocation': [
        {level:2, name:'Evocation Savant', desc:'Copying an evocation spell into your spellbook costs half the gold and time.'},
        {level:2, name:'Sculpt Spells', desc:'When you cast an evocation spell that affects others you can see, choose 1 + the spell’s level of them: they automatically succeed on its saves and take no damage where they’d take half.'},
        {level:6, name:'Potent Cantrip', desc:'A creature that succeeds on a save against your cantrip still takes half its damage (but no other effect).'},
        {level:10, name:'Empowered Evocation', desc:'Add your Intelligence modifier (minimum +1) to one damage roll of any wizard evocation spell. Turnkeeper adds it to the damage command.'},
        {level:14, name:'Overchannel', desc:'Deal maximum damage with a 1st- to 5th-level wizard damage spell. Free once per long rest; each further use before a long rest deals you necrotic damage (2d12 per spell level, +1d12 per level for each later use) that ignores resistance.'},
      ],
      'School of Illusion': [
        {level:2, name:'Illusion Savant', desc:'Copying an illusion spell into your spellbook costs half the gold and time.'},
        {level:2, name:'Improved Minor Illusion', desc:'You know Minor Illusion (or another wizard cantrip if you already did), and it can create a sound and an image at the same time.'},
        {level:6, name:'Malleable Illusions', type:'action', desc:'Change the nature of one of your illusions with a duration of 1 minute or longer, within the spell’s limits.'},
        {level:10, name:'Illusory Self', type:'reaction', uses:{max:()=>1, recharge:'short'}, desc:'When a creature attacks you, an illusory duplicate makes the attack miss automatically.'},
        {level:14, name:'Illusory Reality', type:'bonus', desc:'When you cast an illusion spell of 1st level or higher, make one inanimate, nonmagical object in it real for 1 minute. It can’t deal damage or harm anyone directly.'},
      ],
      'School of Necromancy': [
        {level:2, name:'Necromancy Savant', desc:'Copying a necromancy spell into your spellbook costs half the gold and time.'},
        {level:2, name:'Grim Harvest', desc:'Once per turn, when your 1st-level or higher spell kills a creature (not a construct or undead), regain hit points equal to twice the spell’s level, or three times if it’s a necromancy spell.'},
        {level:6, name:'Undead Thralls', desc:'Add Animate Dead to your spellbook; it can target one extra corpse or pile of bones. Your undead gain extra hit points equal to your wizard level and add your proficiency bonus to weapon damage.'},
        {level:10, name:'Inured to Undeath', desc:'Resistance to necrotic damage, and your hit point maximum can’t be reduced.'},
        {level:14, name:'Command Undead', type:'action', save:'cha', saveNote:'An undead within 60 ft that you can see. On a failure it becomes friendly and obeys you until you use this again. Intelligence 8+: advantage on the save; Intelligence 12+: repeats the save every hour.',
          desc:'Bring an undead creature under your control.'},
      ],
      'School of Transmutation': [
        {level:2, name:'Transmutation Savant', desc:'Copying a transmutation spell into your spellbook costs half the gold and time.'},
        {level:2, name:'Minor Alchemy', desc:'Spend 10 minutes per cubic foot to turn a nonmagical object of wood, stone (not gemstone), iron, copper or silver into another of those materials, for up to 1 hour.'},
        {level:6, name:'Transmuter’s Stone', desc:'Spend 8 hours to make a stone giving its holder one benefit: darkvision 60 ft, +10 ft speed, Constitution save proficiency, or resistance to acid, cold, fire, lightning or thunder. Change it when you cast a 1st-level or higher transmutation spell.'},
        {level:10, name:'Shapechanger', uses:{max:()=>1, recharge:'short'}, desc:'Add Polymorph to your spellbook. Cast it on yourself without a slot, into a beast of challenge rating 1 or lower. Once per short or long rest.'},
        {level:14, name:'Master Transmuter', type:'action', desc:'Destroy your transmuter’s stone for one effect: transform a nonmagical object, cure a creature (curses, diseases, poisons, full hit points), cast Raise Dead without a slot, or make a willing creature 3d10 years younger (minimum 13).'},
      ],
    },
  },
  // Bard (2014 PHB), checked on dnd5e.wikidot.com
  bard: {
    subclassLabel: 'Bard College', subclassLevel: 3,
    // Bardic Inspiration: CHA-mod uses (min 1), long rest; short rest too from level 5 (Font of Inspiration)
    resources: [{id:'bardicInspiration', label:'Bardic Inspiration', level:1, max:()=>Math.max(1, abilityScoreMod('cha')), recharge:()=>charLevel() >= 5 ? 'short' : 'long'}],
    base: [
      {level:1, name:'Spellcasting', desc:'Cast bard spells using Charisma. You know a set number of spells, and can cast any bard spell you know as a ritual if it has the ritual tag.'},
      {level:1, name:'Bardic Inspiration', type:'bonus', spends:'bardicInspiration',
        roll:{label:'For the creature you inspire', cmd:()=>`1d${bardicDie()}`, desc:()=>`Bardic Inspiration d${bardicDie()}: add to one ability check, attack roll or saving throw`},
        desc:'Give a creature other than you within 60 ft that can hear you an inspiration die (d6, d8 at level 5, d10 at 10, d12 at 15). Within 10 minutes, it can roll the die and add it to one ability check, attack roll or saving throw, even after seeing its d20, before the DM says whether it succeeds. Uses: Charisma modifier (minimum 1) per long rest.'},
      {level:2, name:'Jack of All Trades', desc:'Add half your proficiency bonus (rounded down) to ability checks you aren’t proficient in. Your sheet’s skill modifiers already include it.'},
      {level:2, name:'Song of Rest',
        roll:{label:'Extra healing during a short rest', cmd:()=>`1d${songOfRestDie()}`, desc:()=>'added to each friendly creature that spends Hit Dice'},
        desc:'During a short rest, you and friendly creatures who hear your performance regain an extra d6 hit points (d8 at level 9, d10 at 13, d12 at 17) if they spend any Hit Dice.'},
      {level:3, name:'Expertise', desc:'Double your proficiency bonus for two of your skill proficiencies; two more at level 10. Your sheet’s skill modifiers already include it.'},
      {level:4, name:'Ability Score Improvement', desc:'At levels 4, 8, 12, 16 and 19: raise one ability score by 2, or two scores by 1 each (max 20), or take a feat if your table allows it.'},
      {level:5, name:'Font of Inspiration', desc:'You regain all Bardic Inspiration uses on a short or long rest.'},
      {level:6, name:'Countercharm', type:'action', desc:'Perform until the end of your next turn: you and friendly creatures within 30 ft who can hear you have advantage on saves against being frightened or charmed.'},
      {level:10, name:'Magical Secrets', desc:'Learn two spells from any class’s list (two more at 14 and 18); they count as bard spells. Turnkeeper’s Spells list only shows the bard list for now.'},
      {level:20, name:'Superior Inspiration', desc:'When you roll initiative with no Bardic Inspiration uses left, you regain one.'},
    ],
    subclasses: {
      'College of Lore': [
        {level:3, name:'Bonus Proficiencies', desc:'Proficiency with three skills of your choice.'},
        {level:3, name:'Cutting Words', type:'reaction', spends:'bardicInspiration',
          roll:{label:'Subtract from the creature’s roll', cmd:()=>`1d${bardicDie()}`, desc:()=>'subtract this from its attack roll, ability check or damage roll'},
          desc:'When a creature you can see within 60 ft makes an attack roll, ability check or damage roll, spend a Bardic Inspiration use to subtract your inspiration die from it, after it rolls but before the DM says whether it succeeds or before it deals damage. Creatures that can’t hear you or can’t be charmed are immune.'},
        {level:6, name:'Additional Magical Secrets', desc:'Learn two spells from any class’s list; they count as bard spells.'},
        {level:14, name:'Peerless Skill', spends:'bardicInspiration',
          roll:{label:'Add to your ability check', cmd:()=>`1d${bardicDie()}`, desc:()=>'add this to your ability check'},
          desc:'When you make an ability check, spend a Bardic Inspiration use to add your inspiration die, after you roll but before the DM says whether you succeed.'},
      ],
      'College of Valor': [
        {level:3, name:'Bonus Proficiencies', desc:'Proficiency with medium armor, shields and martial weapons.'},
        {level:3, name:'Combat Inspiration', desc:'A creature with your inspiration die can also add it to a weapon damage roll it just made, or use its reaction to add it to its AC against an attack after seeing the roll but before knowing whether it hits.'},
        {level:6, name:'Extra Attack', attacks:2, desc:'Attack twice when you take the Attack action.'},
        {level:14, name:'Battle Magic', type:'bonus', desc:'When you use your action to cast a bard spell, you can make one weapon attack as a bonus action.'},
      ],
    },
  },
  // Rogue (2014 PHB), checked on dnd5e.wikidot.com
  rogue: {
    subclassLabel: 'Roguish Archetype', subclassLevel: 3,
    base: [
      {level:1, name:'Expertise', desc:'Double your proficiency bonus for two skill proficiencies (or one skill and thieves’ tools); two more at level 6. Your sheet’s skill modifiers already include it.'},
      {level:1, name:'Sneak Attack', desc:'Once per turn, deal extra damage (1d6, rising every odd level to 10d6) when you hit with a finesse or ranged weapon, if you have advantage, or if another enemy of the target is within 5 ft of it (not incapacitated) and you don’t have disadvantage. Pick it in the attack popup after you hit.'},
      {level:1, name:'Thieves’ Cant', desc:'You know the secret mix of jargon, dialect and signs rogues use to hide messages.'},
      {level:2, name:'Cunning Action', type:'bonus', desc:'On each of your turns, use your bonus action to Dash, Disengage or Hide.'},
      {level:4, name:'Ability Score Improvement', desc:'At levels 4, 8, 10, 12, 16 and 19: raise one ability score by 2, or two scores by 1 each (max 20), or take a feat if your table allows it.'},
      {level:5, name:'Uncanny Dodge', type:'reaction', desc:'When an attacker you can see hits you with an attack, use your reaction to halve the attack’s damage.'},
      {level:7, name:'Evasion', desc:'When a Dexterity save would halve damage, you take none on a success and half on a failure.'},
      {level:11, name:'Reliable Talent', desc:'On an ability check you’re proficient in, a d20 roll of 9 or lower counts as 10. Turnkeeper adds this to your check commands (1d20mi10).'},
      {level:14, name:'Blindsense', desc:'While you can hear, you know where any hidden or invisible creature within 10 ft of you is.'},
      {level:15, name:'Slippery Mind', desc:'You gain proficiency in Wisdom saving throws.'},
      {level:18, name:'Elusive', desc:'No attack roll has advantage against you while you aren’t incapacitated.'},
      {level:20, name:'Stroke of Luck', uses:{max:()=>1, recharge:'short'}, desc:'Turn a missed attack into a hit, or treat a failed ability check’s d20 as a 20. Once per short or long rest.'},
    ],
    subclasses: {
      'Thief': [
        {level:3, name:'Fast Hands', type:'bonus', desc:'Cunning Action can also make a Sleight of Hand check, use thieves’ tools to disarm a trap or open a lock, or take the Use an Object action.'},
        {level:3, name:'Second-Story Work', desc:'Climbing costs no extra movement, and your running jumps go further by your Dexterity modifier in feet.'},
        {level:9, name:'Supreme Sneak', desc:'Advantage on Stealth checks if you move no more than half your speed on the same turn.'},
        {level:13, name:'Use Magic Device', desc:'Ignore all class, race and level requirements for using magic items.'},
        {level:17, name:'Thief’s Reflexes', desc:'In the first round of combat, take two turns: one at your initiative and one at your initiative minus 10. Not while surprised.'},
      ],
      'Assassin': [
        {level:3, name:'Bonus Proficiencies', desc:'Proficiency with the disguise kit and the poisoner’s kit.'},
        {level:3, name:'Assassinate', desc:'Advantage on attacks against any creature that hasn’t taken a turn in the combat yet, and any hit against a surprised creature is a critical hit.', tip:'Pick Advantage when you Attack a creature that hasn’t acted yet, and Crit if it’s surprised.'},
        {level:9, name:'Infiltration Expertise', desc:'Spend 7 days and 25 gp to build a false identity (history, profession, affiliations) that others accept.'},
        {level:13, name:'Impostor', desc:'After 3 hours studying someone, mimic their speech, writing and behavior; advantage on Deception checks to avoid detection.'},
        {level:17, name:'Death Strike', desc:'When you hit a surprised creature, it makes a Constitution save (DC 8 + your Dexterity modifier + proficiency bonus) or the attack’s damage is doubled.'},
      ],
      'Arcane Trickster': [
        {level:3, name:'Spellcasting', desc:'Cast wizard spells using Intelligence. You know Mage Hand plus two other cantrips, and have your own spell slots (see Resources). Use the Wizard spell list in the Spells section.'},
        {level:3, name:'Mage Hand Legerdemain', desc:'Your Mage Hand is invisible and can stow or take objects from containers, and pick locks or disarm traps at range.'},
        {level:9, name:'Magical Ambush', desc:'If you’re hidden from a creature when you cast a spell on it, it has disadvantage on saves against that spell this turn.'},
        {level:13, name:'Versatile Trickster', type:'bonus', desc:'Use your Mage Hand to distract a creature within 5 ft of it: you have advantage on attack rolls against that creature until the end of the turn.'},
        {level:17, name:'Spell Thief', type:'reaction', uses:{max:()=>1, recharge:'long'}, desc:'When a creature casts a spell that targets you or includes you, force a save with its spellcasting ability against your spell save DC; on a failure you negate it and can cast it yourself for 8 hours. Once per long rest.'},
      ],
    },
  },
};
const CLASS_NAMES =['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
function classKeyFrom(cls){
  const c = (cls||'').toLowerCase();
  return CLASS_NAMES.find(k=>c.includes(k)) || null;
}
// The sheet lists the subclass first in the class text (e.g. "Vengeance Paladin"): the words before
// the class name, or '' if there are none
function subclassPrefix(classKey, cls){
  const c = String(cls||''), i = classKey ? c.toLowerCase().indexOf(classKey) : -1;
  return i > 0 ? c.slice(0, i).trim() : '';
}
// A subclass's full Player's Handbook name from the sheet's short word ("Vengeance" → "Oath of
// Vengeance", "Moon" → "Circle of the Moon", "Fiend" → "The Fiend")
const SUBCLASS_STYLE = {
  barbarian:w=>`Path of the ${w}`, bard:w=>`College of ${w}`, cleric:w=>`${w} Domain`, druid:w=>`Circle of the ${w}`,
  monk:w=>`Way of the ${w}`, paladin:w=>/^ancients?$/i.test(w) ? 'Oath of the Ancients' : `Oath of ${w}`,
  sorcerer:w=>/^draconic$/i.test(w) ? 'Draconic Bloodline' : w, warlock:w=>`The ${w}`, wizard:w=>`School of ${w}`,
};
function fullSubclassName(classKey, cls){
  const known = subclassFromText(classKey, cls); if(known) return known;
  const w = subclassPrefix(classKey, cls); if(!w) return '';
  if(/^(path|college|circle|way|oath|school|the)\b|\b(domain|bloodline)$/i.test(w)) return w;
  return SUBCLASS_STYLE[classKey] ? SUBCLASS_STYLE[classKey](w) : w;
}
// That subclass as Turnkeeper names it (e.g. "Assassin Rogue" → "Assassin")
function subclassFromText(classKey, cls){
  const entry = CLASS_FEATURES[classKey]; if(!entry) return '';
  const c = (cls||'').toLowerCase();
  return Object.keys(entry.subclasses).find(s=>c.includes(s.split(' ').pop().toLowerCase())) || '';
}
