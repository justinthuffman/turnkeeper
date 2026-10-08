/* ---------- Spells (2014 PHB): the class lists, summaries, rolls and lookups ----------
   Moved from turnkeeper.html (refactor stage 2). Plain data plus the small helpers that read it. */
/* ---------- Spell data (level|Name|School|Casting Time|Range|Duration|Components) ---------- */
const WIZARD_RAW = `0|Acid Splash|Conjuration|1 Action|60 Feet|Instantaneous|V, S
0|Blade Ward|Abjuration|1 Action|Self|1 round|V, S
0|Chill Touch|Necromancy|1 Action|120 feet|1 round|V, S
0|Dancing Lights|Evocation|1 Action|120 feet|Concentration up to 1 minute|V, S, M
0|Fire Bolt|Evocation|1 Action|120 feet|Instantaneous|V, S
0|Friends|Enchantment|1 Action|Self|Concentration, up to 1 minute|S, M
0|Light|Evocation|1 Action|Touch|1 hour|V, M
0|Mage Hand|Conjuration|1 Action|30 feet|1 minute|V, S
0|Mending|Transmutation|1 Minute|Touch|Instantaneous|V, S, M
0|Message|Transmutation|1 Action|120 feet|1 round|V, S, M
0|Minor Illusion|Illusion|1 Action|30 feet|1 minute|S, M
0|Poison Spray|Conjuration|1 Action|10 feet|Instantaneous|V, S
0|Prestidigitation|Transmutation|1 Action|10 feet|Up to 1 hour|V, S
0|Ray of Frost|Evocation|1 Action|60 feet|Instantaneous|V, S
0|Shocking Grasp|Evocation|1 Action|Touch|Instantaneous|V, S
0|True Strike|Divination|1 Action|30 feet|Concentration up to 1 round|S
1|Alarm|Abjuration|1 Minute|30 feet|8 Hours|V, S, M
1|Burning Hands|Evocation|1 Action|Self (15-foot cone)|Instantaneous|V, S
1|Charm Person|Enchantment|1 Action|30 feet|1 hour|V, S
1|Chromatic Orb|Evocation|1 Action|90 feet|Instantaneous|V, S, M
1|Color Spray|Illusion|1 Action|Self (15-foot cone)|1 round|V, S, M
1|Comprehend Languages|Divination|1 Action|Self|1 hour|V, S, M
1|Detect Magic|Divination|1 Action|Self|Concentration, up to 10 minutes|V, S
1|Disguise Self|Illusion|1 Action|Self|1 hour|V, S
1|Expeditious Retreat|Transmutation|1 Bonus Action|Self|Concentration, up to 10 minutes|V, S
1|False Life|Necromancy|1 Action|Self|1 hour|V, S, M
1|Feather Fall|Transmutation|1 Reaction|60 feet|1 minute|V, M
1|Find Familiar|Conjuration|1 Hour|10 feet|Instantaneous|V, S, M
1|Fog Cloud|Conjuration|1 Action|120 feet|Concentration, up to 1 hour|V, S
1|Grease|Conjuration|1 Action|60 feet|1 minute|V, S, M
1|Identify|Divination|1 Minute|Touch|Instantaneous|V, S, M
1|Illusory Script|Illusion|1 Minute|Touch|10 days|S, M
1|Jump|Transmutation|1 Action|Touch|1 minute|V, S, M
1|Longstrider|Transmutation|1 Action|Touch|1 hour|V, S, M
1|Mage Armor|Abjuration|1 Action|Touch|8 hours|V, S, M
1|Magic Missile|Evocation|1 Action|120 feet|Instantaneous|V, S
1|Protection from Evil and Good|Abjuration|1 Action|Touch|Concentration, up to 10 minutes|V, S, M
1|Ray of Sickness|Necromancy|1 Action|60 feet|Instantaneous|V, S
1|Shield|Abjuration|1 Reaction|Self|1 round|V, S
1|Silent Image|Illusion|1 Action|60 feet|Concentration, up to 10 minutes|V, S, M
1|Sleep|Enchantment|1 Action|90 feet|1 minute|V, S, M
1|Tasha's Hideous Laughter|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V, S, M
1|Tenser's Floating Disk|Conjuration|1 Action|30 feet|1 hour|V, S, M
1|Thunderwave|Evocation|1 Action|Self (15-foot cube)|Instantaneous|V, S
1|Unseen Servant|Conjuration|1 Action|60 feet|1 hour|V, S, M
1|Witch Bolt|Evocation|1 Action|30 feet|Concentration, up to 1 minute|V, S, M
2|Alter Self|Transmutation|1 Action|Self|Concentration, up to 1 hour|V, S
2|Arcane Lock|Abjuration|1 Action|Touch|Until dispelled|V, S, M
2|Blindness/Deafness|Necromancy|1 Action|30 Feet|1 minute|V
2|Blur|Illusion|1 Action|Self|Concentration, up to 1 minute|V
2|Cloud of Daggers|Conjuration|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
2|Continual Flame|Evocation|1 Action|Touch|Until dispelled|V, S, M
2|Crown of Madness|Enchantment|1 Action|120 feet|Concentration, up to 1 minute|V, S
2|Darkness|Evocation|1 Action|60 feet|Concentration, up to 10 minutes|V, M
2|Darkvision|Transmutation|1 Action|Touch|8 hours|V, S, M
2|Detect Thoughts|Divination|1 Action|Self|Concentration, up to 1 minute|V, S, M
2|Enlarge/Reduce|Transmutation|1 Action|30 feet|Concentration, up to 1 minute|V, S, M
2|Flaming Sphere|Conjuration|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
2|Gentle Repose|Necromancy|1 Action|Touch|10 days|V, S, M
2|Gust of Wind|Evocation|1 Action|Self (60-foot line)|Concentration, up to 1 minute|V, S, M
2|Hold Person|Enchantment|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
2|Invisibility|Illusion|1 Action|Touch|Concentration, up to 1 hour|V, S, M
2|Knock|Transmutation|1 Action|60 feet|Instantaneous|V
2|Levitate|Transmutation|1 Action|60 feet|Concentration, up to 10 minutes|V, S, M
2|Locate Object|Divination|1 Action|Self|Concentration, up to 10 minutes|V, S, M
2|Magic Mouth|Illusion|1 Minute|30 feet|Until dispelled|V, S, M
2|Magic Weapon|Transmutation|1 Bonus Action|Touch|Concentration, up to 1 hour|V, S
2|Melf's Acid Arrow|Evocation|1 Action|90 feet|Instantaneous|V, S, M
2|Mirror Image|Illusion|1 Action|Self|1 minute|V, S
2|Misty Step|Conjuration|1 Bonus Action|Self|Instantaneous|V
2|Nystul's Magic Aura|Illusion|1 Action|Touch|24 hours|V, S, M
2|Phantasmal Force|Illusion|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
2|Ray of Enfeeblement|Necromancy|1 Action|60 feet|Concentration, up to 1 minute|V, S
2|Rope Trick|Transmutation|1 Action|Touch|1 hour|V, S, M
2|Scorching Ray|Evocation|1 Action|120 feet|Instantaneous|V, S
2|See Invisibility|Divination|1 Action|Self|1 hour|V, S, M
2|Shatter|Evocation|1 Action|60 feet|Instantaneous|V, S, M
2|Spider Climb|Transmutation|1 Action|Touch|Concentration, up to 1 hour|V, S, M
2|Suggestion|Enchantment|1 Action|30 feet|Concentration, up to 8 hours|V, M
2|Web|Conjuration|1 Action|60 feet|Concentration, up to 1 hour|V, S, M
3|Animate Dead|Necromancy|1 Minute|10 feet|Instantaneous|V, S, M
3|Bestow Curse|Necromancy|1 Action|Touch|Concentration, up to 1 minute|V, S
3|Blink|Transmutation|1 Action|Self|1 minute|V, S
3|Clairvoyance|Divination|10 Minutes|1 mile|Concentration, up to 10 minutes|V, S, M
3|Counterspell|Abjuration|1 Reaction|60 feet|Instantaneous|S
3|Dispel Magic|Abjuration|1 Action|120 feet|Instantaneous|V, S
3|Fear|Illusion|1 Action|Self (30-foot cone)|Concentration, up to 1 minute|V, S, M
3|Feign Death|Necromancy|1 Action|Touch|1 hour|V, S, M
3|Fireball|Evocation|1 Action|150 feet|Instantaneous|V, S, M
3|Fly|Transmutation|1 Action|Touch|Concentration, up to 10 minutes|V, S, M
3|Gaseous Form|Transmutation|1 Action|Touch|Concentration, up to 1 hour|V, S, M
3|Glyph of Warding|Abjuration|1 Hour|Touch|Until dispelled or triggered|V, S, M
3|Haste|Transmutation|1 Action|30 feet|Concentration, up to 1 minute|V, S, M
3|Hypnotic Pattern|Illusion|1 Action|120 feet|Concentration, up to 1 minute|S, M
3|Leomund's Tiny Hut|Evocation|1 Minute|Self (10-foot radius hemisphere)|8 hours|V, S, M
3|Lightning Bolt|Evocation|1 Action|Self (100-foot line)|Instantaneous|V, S, M
3|Magic Circle|Abjuration|1 Minute|10 feet|1 hour|V, S, M
3|Major Image|Illusion|1 Action|120 feet|Concentration, up to 10 minutes|V, S, M
3|Nondetection|Abjuration|1 Action|Touch|8 hours|V, S, M
3|Phantom Steed|Illusion|1 Minute|30 feet|1 hour|V, S
3|Protection from Energy|Abjuration|1 Action|Touch|Concentration, up to 1 hour|V, S
3|Remove Curse|Abjuration|1 Action|Touch|Instantaneous|V, S
3|Sending|Evocation|1 Action|Unlimited|1 round|V, S, M
3|Sleet Storm|Conjuration|1 Action|150 feet|Concentration, up to 1 minute|V, S, M
3|Slow|Transmutation|1 Action|120 feet|Concentration, up to 1 minute|V, S, M
3|Stinking Cloud|Conjuration|1 Action|90 feet|Concentration, up to 1 minute|V, S, M
3|Tongues|Divination|1 Action|Touch|1 hour|V, M
3|Vampiric Touch|Necromancy|1 Action|Self|Concentration, up to 1 minute|V, S
3|Water Breathing|Transmutation|1 Action|30 feet|24 hours|V, S, M
4|Arcane Eye|Divination|1 Action|30 feet|Concentration, up to 1 hour|V, S, M
4|Banishment|Abjuration|1 Action|60 feet|Concentration, up to 1 minutes|V, S, M
4|Blight|Necromancy|1 Action|30 feet|Instantaneous|V, S
4|Confusion|Enchantment|1 Action|90 feet|Concentration, up to 1 minute|V, S, M
4|Conjure Minor Elementals|Conjuration|1 Minute|90 feet|Concentration, up to 1 hour|V, S
4|Control Water|Transmutation|1 Action|300 feet|Concentration, up to 10 minutes|V, S, M
4|Dimension Door|Conjuration|1 Action|500 feet|Instantaneous|V
4|Evard's Black Tentacles|Conjuration|1 Action|90 feet|Concentration, up to 1 minute|V, S, M
4|Fabricate|Transmutation|10 Minutes|120 feet|Instantaneous|V, S
4|Fire Shield|Evocation|1 Action|Self|10 minutes|V, S, M
4|Greater Invisibility|Illusion|1 Action|Touch|Concentration, up to 1 minute|V, S
4|Hallucinatory Terrain|Illusion|10 Minutes|300 feet|24 hours|V, S, M
4|Ice Storm|Evocation|1 Action|300 feet|Instantaneous|V, S, M
4|Leomund's Secret Chest|Conjuration|1 Action|Touch|Instantaneous|V, S, M
4|Locate Creature|Divination|1 Action|Self|Concentration, up to 1 hour|V, S, M
4|Mordenkainen's Faithful Hound|Conjuration|1 Action|30 feet|8 hours|V, S, M
4|Mordenkainen's Private Sanctum|Abjuration|10 minutes|120 feet|24 hours|V, S, M
4|Otiluke's Resilient Sphere|Evocation|1 Action|30 feet|Concentration, up to 1 minute|V, S, M
4|Phantasmal Killer|Illusion|1 Action|120 feet|Concentration, up to 1 minute|V, S
4|Polymorph|Transmutation|1 Action|60 feet|Concentration, up to 1 hour|V, S, M
4|Stone Shape|Transmutation|1 Action|Touch|Instantaneous|V, S, M
4|Stoneskin|Abjuration|1 Action|Touch|Concentration, up to 1 hour|V, S, M
4|Wall of Fire|Evocation|1 Action|120 feet|Concentration, up to 1 minute|V, S, M
5|Animate Objects|Transmutation|1 Action|120 feet|Concentration, up to 1 minute|V, S
5|Bigby's Hand|Evocation|1 Action|120 feet|Concentration, up to 1 minute|V, S, M
5|Cloudkill|Conjuration|1 Action|120 feet|Concentration, up to 10 minutes|V, S
5|Cone of Cold|Evocation|1 Action|Self (60-foot cone)|Instantaneous|V, S, M
5|Conjure Elemental|Conjuration|1 Minute|90 feet|Concentration, up to 1 hour|V, S, M
5|Contact Other Plane|Divination|1 Minute|Self|1 minute|V
5|Creation|Illusion|1 Minute|30 feet|Special|V, S, M
5|Dominate Person|Enchantment|1 Action|60 feet|Concentration, up to 1 minute|V, S
5|Dream|Illusion|1 Minute|Special|8 hours|V, S, M
5|Geas|Enchantment|1 Minute|60 feet|30 days|V
5|Hold Monster|Enchantment|1 Action|90 feet|Concentration, up to 1 minute|V, S, M
5|Legend Lore|Divination|10 Minutes|Self|Instantaneous|V, S, M
5|Mislead|Illusion|1 Action|Self|Concentration, up to 1 hour|S
5|Modify Memory|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V, S
5|Passwall|Transmutation|1 Action|30 feet|1 hour|V, S, M
5|Planar Binding|Abjuration|1 Hour|60 feet|24 hours|V, S, M
5|Rary's Telepathic Bond|Divination|1 Action|30 feet|1 hour|V, S, M
5|Scrying|Divination|10 Minutes|Self|Concentration, up to 10 minutes|V, S, M
5|Seeming|Illusion|1 Action|30 feet|8 hours|V, S
5|Telekinesis|Transmutation|1 Action|60 feet|Concentration, up to 10 minutes|V, S
5|Teleportation Circle|Conjuration|1 Minute|10 feet|1 round|V, M
5|Wall of Force|Evocation|1 Action|120 feet|Concentration, up to 10 minutes|V, S, M
5|Wall of Stone|Evocation|1 Action|120 feet|Concentration, up to 10 minutes|V, S, M
6|Arcane Gate|Conjuration|1 Action|500 feet|Concentration, up to 10 minutes|V, S
6|Chain Lightning|Evocation|1 Action|150 feet|Instantaneous|V, S, M
6|Circle of Death|Necromancy|1 Action|150 feet|Instantaneous|V, S, M
6|Contingency|Evocation|10 Minutes|Self|10 days|V, S, M
6|Create Undead|Necromancy|1 Minute|10 feet|Instantaneous|V, S, M
6|Disintegrate|Transmutation|1 Action|60 feet|Instantaneous|V, S, M
6|Drawmij's Instant Summons|Conjuration|1 Minute|Touch|Until dispelled|V, S, M
6|Eyebite|Necromancy|1 Action|Self|Concentration, up to 1 minute|V, S
6|Flesh to Stone|Transmutation|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
6|Globe of Invulnerability|Abjuration|1 Action|Self (10-foot radius)|Concentration, up to 1 minute|V, S, M
6|Guards and Wards|Abjuration|10 Minutes|Touch|24 hours|V, S, M
6|Magic Jar|Necromancy|1 Minute|Self|Until dispelled|V, S, M
6|Mass Suggestion|Enchantment|1 Action|60 feet|24 hours|V, M
6|Move Earth|Transmutation|1 Action|120 feet|Concentration, up to 2 hours|V, S, M
6|Otiluke's Freezing Sphere|Evocation|1 Action|300 feet|Instantaneous|V, S, M
6|Otto's Irresistible Dance|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V
6|Programmed Illusion|Illusion|1 Action|120 feet|Until dispelled|V, S, M
6|Sunbeam|Evocation|1 Action|Self (60-foot line)|Concentration, up to 1 minute|V, S, M
6|True Seeing|Divination|1 Action|Touch|1 hour|V, S, M
6|Wall of Ice|Evocation|1 Action|120 feet|Concentration, up to 10 minutes|V, S, M
7|Delayed Blast Fireball|Evocation|1 Action|150 feet|Concentration, up to 1 minute|V, S, M
7|Etherealness|Transmutation|1 Action|Self|Up to 8 hours|V, S
7|Finger of Death|Necromancy|1 Action|60 feet|Instantaneous|V, S
7|Forcecage|Evocation|1 Action|100 feet|1 hour|V, S, M
7|Mirage Arcane|Illusion|10 Minutes|Sight|10 days|V, S
7|Mordenkainen's Magnificent Mansion|Conjuration|1 Minute|300 feet|24 hours|V, S, M
7|Mordenkainen's Sword|Evocation|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
7|Plane Shift|Conjuration|1 Action|Touch|Instantaneous|V, S, M
7|Prismatic Spray|Evocation|1 Action|Self (60-foot cone)|Instantaneous|V, S
7|Project Image|Illusion|1 Action|500 Miles|Concentration, up to 1 day|V, S, M
7|Reverse Gravity|Transmutation|1 Action|100 feet|Concentration, up to 1 minute|V, S, M
7|Sequester|Transmutation|1 Action|Touch|Until dispelled|V, S, M
7|Simulacrum|Illusion|12 hours|Touch|Until dispelled|V, S, M
7|Symbol|Abjuration|1 Minute|Touch|Until dispelled or triggered|V, S, M
7|Teleport|Conjuration|1 Action|10 feet|Instantaneous|V
8|Antimagic Field|Abjuration|1 Action|Self (10-foot radius sphere)|Concentration, up to 1 hour|V, S, M
8|Antipathy/Sympathy|Enchantment|1 Hour|60 feet|10 Days|V, S, M
8|Clone|Necromancy|1 Hour|Touch|Instantaneous|V, S, M
8|Control Weather|Transmutation|10 Minutes|Self (5 mile radius)|Concentration, Up to 8 hours|V, S, M
8|Demiplane|Conjuration|1 Action|60 feet|1 hour|S
8|Dominate Monster|Enchantment|1 Action|60 feet|Concentration, up to 1 hour|V, S
8|Feeblemind|Enchantment|1 Action|150 feet|Instantaneous|V, S, M
8|Incendiary Cloud|Conjuration|1 Action|150 feet|Concentration, up to 1 minute|V, S
8|Maze|Conjuration|1 Action|60 feet|Concentration, up to 10 minutes|V, S
8|Mind Blank|Abjuration|1 Action|Touch|24 hours|V, S
8|Power Word: Stun|Enchantment|1 Action|60 feet|Instantaneous|V, S
8|Sunburst|Evocation|1 Action|150 feet|Instantaneous|V, S, M
8|Telepathy|Evocation|1 Action|Unlimited|24 hours|V, S, M
9|Astral Projection|Evocation|1 Hour|10 feet|Special|V, S, M
9|Foresight|Divination|1 Minute|Touch|8 hours|V, S, M
9|Gate|Conjuration|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
9|Imprisonment|Abjuration|1 Minute|30 feet|Until dispelled|V, S, M
9|Meteor Swarm|Evocation|1 Action|1 mile|Instantaneous|V, S
9|Power Word: Kill|Enchantment|1 Action|60 feet|Instantaneous|V
9|Prismatic Wall|Abjuration|1 Action|60 feet|10 minutes|V, S
9|Shapechange|Transmutation|1 Action|Self|Concentration, up to 1 hour|V, S, M
9|Time Stop|Transmutation|1 Action|Self|Instantaneous|V
9|True Polymorph|Transmutation|1 Action|30 feet|Concentration, up to 1 hour|V, S, M
9|Weird|Illusion|1 Action|120 feet|Concentration, up to 1 minute|V, S
9|Wish|Conjuration|1 Action|Self|Instantaneous|V`;

const PALADIN_RAW = `1|Bless|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V, S, M
1|Command|Enchantment|1 Action|60 feet|1 round|V
1|Compelled Duel|Enchantment|1 Bonus Action|30 feet|Concentration, up to 1 minute|V
1|Cure Wounds|Evocation|1 Action|Touch|Instantaneous|V, S
1|Detect Evil and Good|Divination|1 Action|Self|Concentration, up to 10 minutes|V, S
1|Detect Magic|Divination|1 Action|Self|Concentration, up to 10 minutes|V, S
1|Detect Poison and Disease|Divination|1 Action|Self|Concentration, up to 10 minutes|V, S, M
1|Divine Favor|Evocation|1 Bonus Action|Self|Concentration, up to 1 minute|V, S
1|Heroism|Enchantment|1 Action|Touch|Concentration, up to 1 minute|V, S
1|Protection from Evil and Good|Abjuration|1 Action|Touch|Concentration, up to 10 minutes|V, S, M
1|Purify Food and Drink|Transmutation|1 Action|10 feet|Instantaneous|V, S
1|Searing Smite|Evocation|1 Bonus Action|Self|Concentration, up to 1 minute|V
1|Shield of Faith|Abjuration|1 Bonus Action|60 feet|Concentration, up to 10 minutes|V, S, M
1|Thunderous Smite|Evocation|1 Bonus Action|Self|Concentration, up to 1 minute|V
1|Wrathful Smite|Evocation|1 Bonus Action|Self|Concentration, up to 1 minute|V
2|Aid|Abjuration|1 Action|30 Feet|8 hours|V, S, M
2|Branding Smite|Evocation|1 Bonus Action|Self|Concentration, up to 1 minute|V
2|Find Steed|Conjuration|10 Minutes|30 feet|Instantaneous|V, S
2|Lesser Restoration|Abjuration|1 Action|Touch|Instantaneous|V, S
2|Locate Object|Divination|1 Action|Self|Concentration, up to 10 minutes|V, S, M
2|Magic Weapon|Transmutation|1 Bonus Action|Touch|Concentration, up to 1 hour|V, S
2|Protection from Poison|Abjuration|1 Action|Touch|1 hour|V, S
2|Zone of Truth|Enchantment|1 Action|60 feet|10 minutes|V, S
3|Aura of Vitality|Evocation|1 Action|Self (30-foot radius)|Concentration, up to 1 minute|V
3|Blinding Smite|Evocation|1 Bonus Action|Self|Concentration, up to 1 minute|V
3|Create Food and Water|Conjuration|1 Action|30 feet|Instantaneous|V, S
3|Crusader's Mantle|Evocation|1 Action|Self|Concentration, up to 1 minute|V
3|Daylight|Evocation|1 Action|60 feet|1 hour|V, S
3|Dispel Magic|Abjuration|1 Action|120 feet|Instantaneous|V, S
3|Elemental Weapon|Transmutation|1 Action|Touch|Concentration, up to 1 hour|V, S
3|Magic Circle|Abjuration|1 Minute|10 feet|1 hour|V, S, M
3|Remove Curse|Abjuration|1 Action|Touch|Instantaneous|V, S
3|Revivify|Necromancy|1 Action|Touch|Instantaneous|V, S, M
4|Aura of Life|Abjuration|1 Action|Self (30-foot radius)|Concentration, up to 10 minutes|V
4|Aura of Purity|Abjuration|1 Action|Self (30-foot radius)|Concentration, up to 10 minutes|V
4|Banishment|Abjuration|1 Action|60 feet|Concentration, up to 1 minutes|V, S, M
4|Death Ward|Abjuration|1 Action|Touch|8 hours|V, S
4|Locate Creature|Divination|1 Action|Self|Concentration, up to 1 hour|V, S, M
4|Staggering Smite|Evocation|1 Bonus Action|Self|Concentration, up to 1 minute|V
5|Banishing Smite|Abjuration|1 Bonus Action|Self|Concentration, up to 1 minute|V
5|Circle of Power|Abjuration|1 Action|Self (30-foot radius)|Concentration, up to 10 minutes|V
5|Destructive Wave|Evocation|1 Action|Self (30-foot radius)|Instantaneous|V
5|Dispel Evil and Good|Abjuration|1 Action|Self|Concentration, up to 1 minute|V, S, M
5|Geas|Enchantment|1 Minute|60 feet|30 days|V
5|Raise Dead|Necromancy|1 Hour|Touch|Instantaneous|V, S, M`;

const BARD_RAW = `0|Blade Ward|Abjuration|1 Action|Self|1 round|V, S
0|Dancing Lights|Evocation|1 Action|120 feet|Concentration up to 1 minute|V, S, M
0|Friends|Enchantment|1 Action|Self|Concentration, up to 1 minute|S, M
0|Light|Evocation|1 Action|Touch|1 hour|V, M
0|Mage Hand|Conjuration|1 Action|30 feet|1 minute|V, S
0|Mending|Transmutation|1 Minute|Touch|Instantaneous|V, S, M
0|Message|Transmutation|1 Action|120 feet|1 round|V, S, M
0|Minor Illusion|Illusion|1 Action|30 feet|1 minute|S, M
0|Prestidigitation|Transmutation|1 Action|10 feet|Up to 1 hour|V, S
0|True Strike|Divination|1 Action|30 feet|Concentration up to 1 round|S
0|Vicious Mockery|Enchantment|1 Action|60 feet|Instantaneous|V
1|Animal Friendship|Enchantment|1 Action|30 feet|24 hours|V, S, M
1|Bane|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V, S, M
1|Charm Person|Enchantment|1 Action|30 feet|1 hour|V, S
1|Comprehend Languages|Divination|1 Action|Self|1 hour|V, S, M
1|Cure Wounds|Evocation|1 Action|Touch|Instantaneous|V, S
1|Detect Magic|Divination|1 Action|Self|Concentration, up to 10 minutes|V, S
1|Disguise Self|Illusion|1 Action|Self|1 hour|V, S
1|Dissonant Whispers|Enchantment|1 Action|60 feet|Instantaneous|V
1|Faerie Fire|Evocation|1 Action|60 feet|Concentration, up to 1 minute|V
1|Feather Fall|Transmutation|1 Reaction|60 feet|1 minute|V, M
1|Healing Word|Evocation|1 Bonus Action|60 feet|Instantaneous|V
1|Heroism|Enchantment|1 Action|Touch|Concentration, up to 1 minute|V, S
1|Identify|Divination|1 Minute|Touch|Instantaneous|V, S, M
1|Illusory Script|Illusion|1 Minute|Touch|10 days|S, M
1|Longstrider|Transmutation|1 Action|Touch|1 hour|V, S, M
1|Silent Image|Illusion|1 Action|60 feet|Concentration, up to 10 minutes|V, S, M
1|Sleep|Enchantment|1 Action|90 feet|1 minute|V, S, M
1|Speak with Animals|Divination|1 Action|Self|10 minutes|V, S
1|Tasha's Hideous Laughter|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V, S, M
1|Thunderwave|Evocation|1 Action|Self (15-foot cube)|Instantaneous|V, S
1|Unseen Servant|Conjuration|1 Action|60 feet|1 hour|V, S, M
2|Animal Messenger|Enchantment|1 Action|30 Feet|24 hours|V, S, M
2|Blindness/Deafness|Necromancy|1 Action|30 Feet|1 minute|V
2|Calm Emotions|Enchantment|1 Action|60 feet|Concentration, up to 1 minute|V, S
2|Cloud of Daggers|Conjuration|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
2|Crown of Madness|Enchantment|1 Action|120 feet|Concentration, up to 1 minute|V, S
2|Detect Thoughts|Divination|1 Action|Self|Concentration, up to 1 minute|V, S, M
2|Enhance Ability|Transmutation|1 Action|Touch|Concentration, up to 1 hour|V, S, M
2|Enthrall|Enchantment|1 Action|60 feet|1 minute|V, S
2|Heat Metal|Transmutation|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
2|Hold Person|Enchantment|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
2|Invisibility|Illusion|1 Action|Touch|Concentration, up to 1 hour|V, S, M
2|Knock|Transmutation|1 Action|60 feet|Instantaneous|V
2|Lesser Restoration|Abjuration|1 Action|Touch|Instantaneous|V, S
2|Locate Animals or Plants|Divination|1 Action|Self|Instantaneous|V, S, M
2|Locate Object|Divination|1 Action|Self|Concentration, up to 10 minutes|V, S, M
2|Magic Mouth|Illusion|1 Minute|30 feet|Until dispelled|V, S, M
2|Phantasmal Force|Illusion|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
2|See Invisibility|Divination|1 Action|Self|1 hour|V, S, M
2|Shatter|Evocation|1 Action|60 feet|Instantaneous|V, S, M
2|Silence|Illusion|1 Action|120 feet|Concentration, up to 10 minutes|V, S
2|Suggestion|Enchantment|1 Action|30 feet|Concentration, up to 8 hours|V, M
2|Zone of Truth|Enchantment|1 Action|60 feet|10 minutes|V, S
3|Bestow Curse|Necromancy|1 Action|Touch|Concentration, up to 1 minute|V, S
3|Clairvoyance|Divination|10 Minutes|1 mile|Concentration, up to 10 minutes|V, S, M
3|Dispel Magic|Abjuration|1 Action|120 feet|Instantaneous|V, S
3|Fear|Illusion|1 Action|Self (30-foot cone)|Concentration, up to 1 minute|V, S, M
3|Feign Death|Necromancy|1 Action|Touch|1 hour|V, S, M
3|Glyph of Warding|Abjuration|1 Hour|Touch|Until dispelled or triggered|V, S, M
3|Hypnotic Pattern|Illusion|1 Action|120 feet|Concentration, up to 1 minute|S, M
3|Leomund's Tiny Hut|Evocation|1 Minute|Self (10-foot radius hemisphere)|8 hours|V, S, M
3|Major Image|Illusion|1 Action|120 feet|Concentration, up to 10 minutes|V, S, M
3|Nondetection|Abjuration|1 Action|Touch|8 hours|V, S, M
3|Plant Growth|Transmutation|1 Action or 8 Hours|150 feet|Instantaneous|V, S
3|Sending|Evocation|1 Action|Unlimited|1 round|V, S, M
3|Speak with Dead|Necromancy|1 Action|10 feet|10 minutes|V, S, M
3|Speak with Plants|Transmutation|1 Action|Self (30-foot radius)|10 minutes|V, S
3|Stinking Cloud|Conjuration|1 Action|90 feet|Concentration, up to 1 minute|V, S, M
3|Tongues|Divination|1 Action|Touch|1 hour|V, M
4|Compulsion|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V, S
4|Confusion|Enchantment|1 Action|90 feet|Concentration, up to 1 minute|V, S, M
4|Dimension Door|Conjuration|1 Action|500 feet|Instantaneous|V
4|Freedom of Movement|Abjuration|1 Action|Touch|1 hour|V, S, M
4|Greater Invisibility|Illusion|1 Action|Touch|Concentration, up to 1 minute|V, S
4|Hallucinatory Terrain|Illusion|10 Minutes|300 feet|24 hours|V, S, M
4|Locate Creature|Divination|1 Action|Self|Concentration, up to 1 hour|V, S, M
4|Polymorph|Transmutation|1 Action|60 feet|Concentration, up to 1 hour|V, S, M
5|Animate Objects|Transmutation|1 Action|120 feet|Concentration, up to 1 minute|V, S
5|Awaken|Transmutation|8 Hours|Touch|Instantaneous|V, S, M
5|Dominate Person|Enchantment|1 Action|60 feet|Concentration, up to 1 minute|V, S
5|Dream|Illusion|1 Minute|Special|8 hours|V, S, M
5|Geas|Enchantment|1 Minute|60 feet|30 days|V
5|Greater Restoration|Abjuration|1 Action|Touch|Instantaneous|V, S, M
5|Hold Monster|Enchantment|1 Action|90 feet|Concentration, up to 1 minute|V, S, M
5|Legend Lore|Divination|10 Minutes|Self|Instantaneous|V, S, M
5|Mass Cure Wounds|Evocation|1 Action|60 feet|Instantaneous|V, S
5|Mislead|Illusion|1 Action|Self|Concentration, up to 1 hour|S
5|Modify Memory|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V, S
5|Planar Binding|Abjuration|1 Hour|60 feet|24 hours|V, S, M
5|Raise Dead|Necromancy|1 Hour|Touch|Instantaneous|V, S, M
5|Scrying|Divination|10 Minutes|Self|Concentration, up to 10 minutes|V, S, M
5|Seeming|Illusion|1 Action|30 feet|8 hours|V, S
5|Teleportation Circle|Conjuration|1 Minute|10 feet|1 round|V, M
6|Eyebite|Necromancy|1 Action|Self|Concentration, up to 1 minute|V, S
6|Find the Path|Divination|1 Minute|Self|Concentration, up to 1 day|V, S, M
6|Guards and Wards|Abjuration|10 Minutes|Touch|24 hours|V, S, M
6|Mass Suggestion|Enchantment|1 Action|60 feet|24 hours|V, M
6|Otto's Irresistible Dance|Enchantment|1 Action|30 feet|Concentration, up to 1 minute|V
6|Programmed Illusion|Illusion|1 Action|120 feet|Until dispelled|V, S, M
6|True Seeing|Divination|1 Action|Touch|1 hour|V, S, M
7|Etherealness|Transmutation|1 Action|Self|Up to 8 hours|V, S
7|Forcecage|Evocation|1 Action|100 feet|1 hour|V, S, M
7|Mirage Arcane|Illusion|10 Minutes|Sight|10 days|V, S
7|Mordenkainen's Magnificent Mansion|Conjuration|1 Minute|300 feet|24 hours|V, S, M
7|Mordenkainen's Sword|Evocation|1 Action|60 feet|Concentration, up to 1 minute|V, S, M
7|Prismatic Spray|Evocation|1 Action|Self (60-foot cone)|Instantaneous|V, S
7|Project Image|Illusion|1 Action|500 Miles|Concentration, up to 1 day|V, S, M
7|Regenerate|Transmutation|1 Minute|Touch|1 hour|V, S, M
7|Resurrection|Necromancy|1 Hour|Touch|Instantaneous|V, S, M
7|Symbol|Abjuration|1 Minute|Touch|Until dispelled or triggered|V, S, M
7|Teleport|Conjuration|1 Action|10 feet|Instantaneous|V
8|Dominate Monster|Enchantment|1 Action|60 feet|Concentration, up to 1 hour|V, S
8|Feeblemind|Enchantment|1 Action|150 feet|Instantaneous|V, S, M
8|Glibness|Transmutation|1 Action|Self|1 hour|V
8|Mind Blank|Abjuration|1 Action|Touch|24 hours|V, S
8|Power Word: Stun|Enchantment|1 Action|60 feet|Instantaneous|V, S
9|Foresight|Divination|1 Minute|Touch|8 hours|V, S, M
9|Power Word: Heal|Evocation|1 Action|Touch|Instantaneous|V, S
9|Power Word: Kill|Enchantment|1 Action|60 feet|Instantaneous|V
9|True Polymorph|Transmutation|1 Action|30 feet|Concentration, up to 1 hour|V, S, M`;

const RITUAL_SPELLS = new Set(['Alarm','Comprehend Languages','Detect Magic','Find Familiar','Identify','Illusory Script',
  "Tenser's Floating Disk",'Unseen Servant','Gentle Repose','Magic Mouth','Feign Death',
  "Leomund's Tiny Hut",'Phantom Steed','Water Breathing',"Drawmij's Instant Summons",'Detect Poison and Disease',
  'Purify Food and Drink','Speak with Animals','Animal Messenger','Locate Animals or Plants',
  'Commune','Commune with Nature']);

const DESCRIPTIONS_RAW = `Acid Splash::Ranged spray of acid; one or two creatures make a Dex save or take acid damage.
Blade Ward::Self-buff granting resistance to bludgeoning, piercing, and slashing weapon damage until your next turn.
Chill Touch::Ghostly hand attacks for necrotic damage and stops the target healing until your next turn.
Dancing Lights::Create up to four torch-sized lights you can move around within range.
Fire Bolt::Ranged fire attack dealing fire damage, and it can ignite flammable objects.
Friends::Advantage on Charisma checks toward one creature; it becomes hostile after if it learns of the trick.
Light::An object you touch sheds bright light in a 20-foot radius for an hour.
Mage Hand::A spectral hand that can manipulate, carry, or retrieve small objects at range.
Mending::Repairs a single break or tear in an object.
Message::Whisper a short message to a target out of others' hearing, who can reply.
Minor Illusion::Create a minor visual or sound illusion in range.
Poison Spray::Target makes a Con save or takes poison damage.
Prestidigitation::A minor magical trick — small sensory effects, cleaning, flavoring, or lighting a small flame.
Ray of Frost::Ranged cold attack dealing cold damage and reducing the target's speed.
Shocking Grasp::Melee lightning attack with advantage vs. metal-armored foes; stops the target taking reactions this turn.
True Strike::Study a target to gain advantage on your next attack roll against it.
Alarm::Sets a magical or mental alarm that alerts you when a creature enters the warded area.
Burning Hands::A cone of fire deals fire damage, Dex save for half.
Charm Person::A humanoid target makes a Wis save or regards you as a friend for the duration.
Chromatic Orb::Hurl a sphere of a chosen damage type at a target for a heavy hit.
Color Spray::Blinds creatures in a cone, based on total hit points affected, randomly.
Comprehend Languages::Understand the literal meaning of any spoken or written language for the duration.
Detect Magic::Sense the presence and school of magic within range for the duration.
Disguise Self::Change your appearance, including clothing and gear, for an hour.
Expeditious Retreat::Bonus-action Dash each turn for the duration.
False Life::Gain temporary hit points for the duration.
Feather Fall::Slow the fall of up to five creatures to prevent fall damage.
Find Familiar::Summon a spirit that takes an animal form to serve as your familiar.
Fog Cloud::Create a heavily obscuring fog sphere that spreads around corners.
Grease::Cover a surface in slick grease, forcing Dex saves or falling prone.
Identify::Learn the properties of a magic item, spell, or effect on a creature or object.
Illusory Script::Write a message only readable by creatures you designate.
Jump::Triple a creature's jump distance for the duration.
Longstrider::Increase a creature's walking speed by 10 feet for an hour.
Mage Armor::Grant a base AC of 13 + Dex modifier to an unarmored target.
Magic Missile::Three darts of force automatically hit targets you choose, dealing force damage.
Protection from Evil and Good::Ward a creature against aberrations, celestials, elementals, fey, fiends, and undead.
Ray of Sickness::Ranged poison attack that deals damage and may poison the target.
Shield::Reaction granting +5 AC and immunity to magic missile until your next turn.
Silent Image::Create a purely visual illusion that you can shape and move within range.
Sleep::Puts creatures within range to sleep based on total hit points, weakest first.
Tasha's Hideous Laughter::Target makes a Wis save or falls prone laughing uncontrollably.
Tenser's Floating Disk::Create an invisible disk that carries up to 500 pounds and follows you.
Thunderwave::Thunderous force pushes creatures back and deals thunder damage in a cube.
Unseen Servant::Create an invisible, mindless force that can perform simple tasks for you.
Witch Bolt::Lash a target with lightning, dealing ongoing damage each turn while concentrating.
Alter Self::Change your appearance or grow a natural weapon or gills for the duration.
Arcane Lock::Magically lock a door, chest, or portal against opening.
Blindness/Deafness::Target makes a Con save or becomes blinded or deafened.
Blur::Your outline blurs, giving attackers disadvantage on attack rolls against you.
Cloud of Daggers::Fill a space with spinning daggers that damage creatures passing through.
Continual Flame::Create a flame that sheds light but produces no heat or needs fuel.
Crown of Madness::Charm a creature and control which creature it attacks each turn.
Darkness::Create magical darkness in a radius that spreads around corners.
Darkvision::Grant a creature darkvision out to 60 feet for the duration.
Detect Thoughts::Read the surface thoughts of a creature you can see.
Enlarge/Reduce::Grow or shrink a creature or object, altering its size, damage, or strength.
Flaming Sphere::Conjure a rolling sphere of fire you can move to damage creatures.
Gentle Repose::Preserve a corpse from decay and prevent it becoming undead.
Gust of Wind::Create a strong wind that pushes creatures and extinguishes small flames.
Hold Person::A humanoid target makes a Wis save or becomes paralyzed for the duration.
Invisibility::Target becomes invisible until the spell ends or it attacks or casts a spell.
Knock::Open a locked or stuck door, chest, or container loudly.
Levitate::Make a creature or object float up and down at your direction.
Locate Object::Sense the direction to a familiar object or object type within range.
Magic Mouth::Plant a message an object delivers when a specific trigger occurs.
Magic Weapon::A weapon you touch becomes magical, gaining a bonus to attack and damage.
Melf's Acid Arrow::Ranged acid attack dealing damage immediately and again the following turn.
Mirror Image::Create three illusory duplicates of yourself to absorb attacks.
Misty Step::Teleport up to 30 feet to an unoccupied space you can see.
Nystul's Magic Aura::Disguise an object or creature's magical aura or make it appear nonmagical.
Phantasmal Force::Create an illusion only one creature perceives, which can seem to deal damage.
Ray of Enfeeblement::Target makes a Con save or deals half damage with weapon attacks.
Rope Trick::An extradimensional space opens at the top of a rope for shelter.
Scorching Ray::Hurl three rays of fire, each making a ranged attack for fire damage.
See Invisibility::See invisible creatures and objects, and see into the Ethereal Plane.
Shatter::A loud ringing noise deals thunder damage to creatures in a sphere.
Spider Climb::Grant a creature the ability to climb on walls and ceilings.
Suggestion::Suggest a reasonable-sounding course of action a target follows on a failed save.
Web::Fill an area with sticky webbing that restrains creatures.
Animate Dead::Raise a corpse or bones as an undead skeleton or zombie under your control.
Bestow Curse::Curse a target with one of several debilitating effects.
Blink::Randomly flicker between the Ethereal Plane and the material plane each turn.
Clairvoyance::Create an invisible sensor that lets you see or hear at a distant location.
Counterspell::Interrupt a creature casting a spell, potentially negating it.
Dispel Magic::End one spell effect on a target creature, object, or magical effect.
Fear::A cone of illusory horror makes creatures drop items and flee.
Feign Death::Feign death, becoming undetectable by most means of detecting life for the duration.
Fireball::An explosive burst of fire deals a large amount of fire damage in a sphere.
Fly::Grant a creature a flying speed for the duration.
Gaseous Form::Transform a willing creature into a misty cloud, immune to most damage.
Glyph of Warding::Inscribe a glyph that triggers a spell or explosion when a condition is met.
Haste::Double a creature's speed, add to AC and Dex saves, and grant an extra action.
Hypnotic Pattern::A twisting pattern of colors charms and incapacitates creatures who view it.
Leomund's Tiny Hut::Create a dome of protection that shelters you and allies for 8 hours.
Lightning Bolt::A stroke of lightning deals damage to creatures in a line.
Magic Circle::Create a 10-foot cylinder that bars or traps certain creature types.
Major Image::Create a detailed illusion with sound, smell, and even minor motion.
Nondetection::Hide a target from divination magic and scrying for the duration.
Phantom Steed::Conjure a spectral mount that can travel quickly overland.
Protection from Energy::Grant resistance to one damage type for the duration.
Remove Curse::End all curses on a creature, or break the curse on an object.
Sending::Send a short telepathic message to a creature anywhere, and receive a reply.
Sleet Storm::Create a slippery, icy storm that douses flames and knocks creatures prone.
Slow::Slow up to six creatures, reducing their speed, AC, and actions.
Stinking Cloud::Fill an area with nauseating gas that can incapacitate creatures.
Tongues::Understand and speak any language for the duration.
Vampiric Touch::Melee necrotic attack that heals you for half the damage dealt.
Water Breathing::Grant up to ten creatures the ability to breathe underwater.
Arcane Eye::Create an invisible, movable sensor you can see through.
Banishment::Target makes a Charisma save or is banished to a harmless demiplane.
Blight::Wither a target with necrotic energy, dealing heavy damage (extra to plants).
Confusion::Creatures in an area act randomly, wandering or attacking nearby creatures.
Conjure Minor Elementals::Summon minor elementals to fight for you for the duration.
Control Water::Manipulate a body of water — flood, part, redirect, or whirlpool it.
Dimension Door::Teleport yourself, and possibly one other, to a location you can visualize.
Evard's Black Tentacles::Writhing tentacles fill an area, grappling and damaging creatures.
Fabricate::Convert raw materials into a finished product of your design.
Fire Shield::Wreathe yourself in flame or frost, granting resistance and damaging attackers.
Greater Invisibility::Target becomes invisible even while attacking or casting spells.
Hallucinatory Terrain::Make natural terrain look like other natural terrain for the duration.
Ice Storm::Hail and ice deal bludgeoning and cold damage across an area.
Leomund's Secret Chest::Hide a chest in an extradimensional space, retrievable at will.
Locate Creature::Sense the direction to a familiar creature or type of creature.
Mordenkainen's Faithful Hound::Conjure an invisible watchdog that barks and bites intruders.
Mordenkainen's Private Sanctum::Ward an area against sound, sight, and teleportation.
Otiluke's Resilient Sphere::Encase a creature or object in a nearly impervious force sphere.
Phantasmal Killer::Fill a target's mind with a phantasmal monster that deals psychic damage.
Polymorph::Transform a creature into a different beast form for the duration.
Stone Shape::Reshape a piece of stone into a form of your choosing.
Stoneskin::Grant a creature resistance to nonmagical bludgeoning, piercing, and slashing damage.
Wall of Fire::Create a wall of fire that damages creatures who pass through or start there.
Animate Objects::Bring up to ten objects to life to fight at your command.
Bigby's Hand::Create a Large spectral hand that can punch, grasp, push, or block.
Cloudkill::A sphere of poison gas moves with you, damaging creatures inside.
Cone of Cold::A blast of frigid air deals heavy cold damage in a cone.
Conjure Elemental::Summon an elemental to fight for you for the duration.
Contact Other Plane::Contact an extraplanar entity to ask questions, at a risk to your sanity.
Creation::Fabricate an object of nonliving matter out of raw materials of light and shadow.
Dominate Person::Target makes a Wis save or you control its actions for the duration.
Dream::Enter a creature's dreams to deliver a message, or plague it with nightmares.
Geas::Compel a creature to follow a course of conduct for up to 30 days.
Hold Monster::Target makes a Wis save or becomes paralyzed for the duration.
Legend Lore::Learn lore about a famous person, place, or object.
Mislead::Turn invisible and create an illusory double you can control elsewhere.
Modify Memory::Alter a creature's memory of an event.
Passwall::Create a passage through a wall, floor, or ceiling.
Planar Binding::Bind a celestial, elemental, fey, or fiend to service.
Rary's Telepathic Bond::Link the minds of several willing creatures for telepathic communication.
Scrying::See and hear a chosen creature anywhere on the plane.
Seeming::Disguise the appearance of any number of creatures for the duration.
Telekinesis::Move or manipulate a creature or object with your mind.
Teleportation Circle::Create a portal linking to a permanent teleportation circle you know.
Wall of Force::Create an invisible wall of pure force that nothing can pass through.
Wall of Stone::Conjure a wall of solid stone in any shape you choose.
Arcane Gate::Create two linked portals that creatures can pass through.
Chain Lightning::A bolt of lightning arcs between multiple targets, dealing damage.
Circle of Death::A sphere of negative energy deals heavy necrotic damage in an area.
Contingency::Store a spell that triggers automatically when a chosen condition occurs.
Create Undead::Create up to three ghouls, or worse at higher levels, under your control.
Disintegrate::A green ray reduces a target to dust on a failed save.
Drawmij's Instant Summons::Prepare an item to teleport to your hand later when you speak a word.
Eyebite::Target makes a Wis save or becomes asleep, panicked, or sickened for the duration.
Flesh to Stone::Target makes a Con save or begins turning to stone.
Globe of Invulnerability::Create a sphere that blocks spells of 5th level or lower.
Guards and Wards::Ward a large area with a variety of magical defenses.
Magic Jar::Trap your soul in a container and possess a nearby creature's body.
Mass Suggestion::Suggest a course of action to up to twelve creatures at once.
Move Earth::Reshape large sections of earth — hills, trenches, and terrain.
Otiluke's Freezing Sphere::A ball of freezing energy explodes for cold damage and can freeze water.
Otto's Irresistible Dance::A target is compelled to dance, provoking attacks and hindering itself.
Programmed Illusion::Create an illusion that activates on a trigger you define.
Sunbeam::A line of radiant light damages and can blind creatures.
True Seeing::Grant a creature truesight and the ability to see through illusions.
Wall of Ice::Create a wall of ice that can trap or block creatures.
Delayed Blast Fireball::A globe of fire grows more powerful the longer you delay its detonation.
Etherealness::Step into the Ethereal Plane, unable to affect or be affected by the material world.
Finger of Death::A blast of negative energy deals heavy damage and can raise the slain as a zombie.
Forcecage::Create an invisible cage or barrier of force that traps a creature.
Mirage Arcane::Make a large area of terrain look and sound like different terrain.
Mordenkainen's Magnificent Mansion::Create an extradimensional dwelling with rooms, food, and servants for the duration.
Mordenkainen's Sword::Conjure a sentient, spectral sword that attacks on your command.
Plane Shift::Transport yourself and others to a different plane of existence.
Prismatic Spray::Eight rays of light spray in a cone, each with a different damaging effect.
Project Image::Create an illusory duplicate of yourself elsewhere that you can see and speak through.
Reverse Gravity::Reverse gravity in an area, causing creatures and objects to fall upward.
Sequester::Hide a creature or object in suspended animation until a trigger occurs.
Simulacrum::Create a duplicate of a creature from snow or ice, loyal to you.
Symbol::Inscribe a glyph that triggers a powerful magical effect when triggered.
Teleport::Instantly transport yourself and others to a familiar location.
Antimagic Field::Create a sphere where spells and magic items don't function.
Antipathy/Sympathy::Make a location or object attract or repel a chosen type of creature.
Clone::Grow a duplicate body that your soul transfers into if you die.
Control Weather::Change the weather in a large area over the following hours.
Demiplane::Create a shadowy extradimensional door or room that you can enter.
Dominate Monster::Target makes a Wis save or you control its actions for the duration.
Feeblemind::Blast a target's mind with psychic energy, potentially reducing Int and Cha to 1.
Incendiary Cloud::A cloud of roiling smoke and cinders deals fire damage to creatures inside.
Maze::Banish a creature to a labyrinthine demiplane until it escapes or the spell ends.
Mind Blank::Grant a creature immunity to psychic damage and most forms of mind-reading.
Power Word: Stun::A word of power stuns a target outright if its hit points are low enough.
Sunburst::A burst of brilliant sunlight deals radiant damage and can blind creatures.
Telepathy::Establish a telepathic link with a creature anywhere on the same plane.
Astral Projection::Project your astral form to the Astral Plane, leaving your body behind.
Foresight::Grant a creature near-precognitive insight, advantage on rolls and immunity to surprise.
Gate::Open a portal to another plane, or summon a specific creature through it.
Imprisonment::Bind a creature in one of several inescapable forms of imprisonment.
Meteor Swarm::Blazing orbs of fire crash down, dealing massive damage across a wide area.
Power Word: Kill::A word of power instantly slays a target if its hit points are low enough.
Prismatic Wall::Create a wall of shimmering, multicolored light with varied defensive effects per layer.
Shapechange::Transform into any creature you have seen, gaining its abilities.
Time Stop::Stop time for everyone but yourself for a short string of turns.
True Polymorph::Transform a creature or object into another form, potentially permanently.
Weird::Fill the minds of creatures in an area with their deepest fears.
Wish::The most powerful spell — alter reality to nearly any effect you can describe.
Bless::Up to three creatures add a d4 to attack rolls and saving throws for the duration.
Command::Target makes a Wis save or obeys a one-word command (drop, flee, halt, grovel, approach).
Compelled Duel::Compel a creature to fight only you, at disadvantage against others, for the duration.
Cure Wounds::Touch a creature to restore a modest amount of hit points.
Detect Evil and Good::Sense the presence and location of celestials, fiends, undead, or consecrated/desecrated ground nearby.
Detect Poison and Disease::Sense the presence and location of poison, poisonous creatures, and disease nearby.
Divine Favor::Your weapon attacks deal extra radiant damage for the duration.
Heroism::Grant a willing creature temporary hit points and immunity to fear for the duration.
Purify Food and Drink::Remove poison and spoilage from food and water in a radius.
Searing Smite::Your next weapon hit deals extra fire damage and sets the target ablaze.
Shield of Faith::A shimmering field grants an ally +2 AC for the duration.
Thunderous Smite::Your next weapon hit deals extra thunder damage and can knock the target prone.
Wrathful Smite::Your next weapon hit deals extra necrotic damage and frightens the target.
Aid::Bolster up to three creatures' hit point maximum and current hit points.
Branding Smite::Your next weapon hit deals extra radiant damage and makes the target visible even if invisible.
Find Steed::Summon a spirit that takes the form of a loyal mount.
Lesser Restoration::Touch a creature to end one disease or a condition like blindness or paralysis.
Protection from Poison::Neutralize a poison and grant resistance to poison damage for the duration.
Zone of Truth::Creatures in the area struggle to speak deliberate lies while inside it.
Aura of Vitality::Create an aura you can spend a bonus action to heal allies within.
Blinding Smite::Your next weapon hit deals extra radiant damage and can blind the target.
Create Food and Water::Conjure enough food and water to sustain a number of creatures for a day.
Crusader's Mantle::Nearby allies' weapon attacks deal extra radiant damage for the duration.
Daylight::Create a 60-foot radius of bright sunlight, which can dispel magical darkness.
Elemental Weapon::A weapon you touch gains a bonus to attack and elemental bonus damage.
Revivify::Touch a creature dead no longer than a minute to return it to life with 1 hp.
Aura of Life::An aura wards allies against necrotic damage and can stabilize dying allies each turn.
Aura of Purity::An aura grants allies resistance to disease and advantage on saves vs. poison and conditions.
Death Ward::Grant a creature protection against dying — it drops to 1 hp instead of 0 once.
Staggering Smite::Your next weapon hit deals extra psychic damage and can stun the target.
Banishing Smite::Your weapon attacks deal extra force damage, and a reduced foe may be banished.
Circle of Power::An aura grants allies advantage on saves against spells and halves failed-save effects.
Destructive Wave::Slam the ground, dealing thunder plus radiant or necrotic damage and knocking nearby creatures prone.
Dispel Evil and Good::Ward yourself against aberrations, celestials, elementals, fey, fiends, and undead, with offensive options too.
Raise Dead::Return a creature dead no more than 10 days to life, healing major harm.
Vicious Mockery::Hurl insults that deal psychic damage and give disadvantage on the target's next attack.
Dissonant Whispers::Whisper a discordant phrase that deals psychic damage and forces the target to flee.
Speak with Animals::Understand and communicate simple ideas with beasts for the duration.
Compulsion::Force a charmed creature to move in a direction you choose each of your turns.
Animal Friendship::Convince a beast it has nothing to fear from you, calming it for the duration.
Bane::Up to three creatures subtract a d4 from attack rolls and saving throws for the duration.
Faerie Fire::Outline creatures in an area with light, granting attackers advantage and negating invisibility.
Thaumaturgy::Produce a minor wonder, like a booming voice, flickering flames, tremors, sounds, doors flung open or changed eyes. Up to three 1-minute effects at once.
Hellish Rebuke::When a creature you can see within 60 ft damages you, it makes a Dex save: 2d10 fire on a failure, half on a success (+1d10 per slot level above 1st).
Sanctuary::Ward a creature so anyone targeting it with an attack or harmful spell must pass a Wis save or pick a new target. Ends if the warded creature attacks or casts a spell affecting an enemy.
Ensnaring Strike::Your next weapon hit makes thorny vines grab the target: Str save or restrained, taking 1d6 piercing at the start of each of its turns (+1d6 per slot level above 1st).
Hunter's Mark::Mark a creature: your weapon hits deal +1d6 damage to it and you have advantage on Perception and Survival checks to find it. Move the mark if it drops to 0 HP.
Moonbeam::A 5 ft radius, 40 ft high beam of silvery light; creatures entering or starting their turn in it make a Con save or take 2d10 radiant (half on a success). Move it as an action.
Beacon of Hope::Any number of creatures in range get advantage on Wisdom saves and death saves, and regain the maximum possible from any healing.
Guardian of Faith::A spectral guardian occupies a space nearby. Hostile creatures moving within 10 ft make a Dex save or take 20 radiant (half on a success); it vanishes after dealing 60 damage.
Commune::Contact your deity and ask up to three yes-or-no questions before the spell ends.
Commune with Nature::Learn up to three facts about the surrounding land within 3 miles (300 ft underground), such as terrain, water, plants, animals or creatures.
Flame Strike::A 10 ft radius, 40 ft high column of divine fire: Dex save or take 4d6 fire + 4d6 radiant (half on a success).
Tree Stride::Step into a tree and out of another of the same kind within 500 ft, once per turn, for the duration.
Healing Word::A word of power heals a creature at range without needing to touch it.
Calm Emotions::Suppress strong emotion in an area, quelling hostility or removing charm/fear effects.
Enhance Ability::Grant a creature advantage on checks with one chosen ability score.
Enthrall::Captivate a crowd's attention with your words, giving others advantage on Stealth against them.
Heat Metal::Cause a metal object to glow red-hot, damaging whoever holds or wears it.
Silence::Create an area of total silence that blocks sound and verbal spellcasting.
Plant Growth::Overgrow an area with vegetation, or enrich plants to boost food yield.
Speak with Dead::Ask a corpse up to five questions it can answer from what it knew in life.
Speak with Plants::Communicate with plants, which can also animate to entangle creatures nearby.
Freedom of Movement::Grant a creature immunity to being paralyzed, restrained, or slowed by magic.
Awaken::Grant a beast or plant human-like intelligence and the ability to speak.
Greater Restoration::Touch a creature to end powerful conditions — exhaustion, curse, or a reduced ability score.
Mass Cure Wounds::Heal a group of creatures in a burst, restoring a good chunk of hit points.
Find the Path::Learn the shortest, most direct route to a known location.
Regenerate::Restore a creature's severed body parts and grant fast, ongoing healing.
Resurrection::Return a creature dead no more than a century to full life.
Glibness::Replace your Charisma check and saving throw rolls with a fixed high number for the duration.
Power Word: Heal::A word of power fully heals a target and ends many debilitating conditions.
Animal Messenger::Send a Tiny beast to deliver a short message to a place or person you name.
Locate Animals or Plants::Learn the direction and distance to the nearest example of a species you name.`;

const DESCRIPTIONS = {};
DESCRIPTIONS_RAW.trim().split('\n').forEach(line=>{
  const idx = line.indexOf('::');
  DESCRIPTIONS[line.slice(0,idx)] = line.slice(idx+2);
});

function actionClass(sp){
  if(sp.ritual) return 'act-ritual';
  if(/Bonus Action/i.test(sp.time)) return 'act-bonus';
  if(/^1?\s*Action\b/i.test(sp.time)) return 'act-action';
  return 'act-other';
}

function parseSpells(raw){
  return raw.trim().split('\n').map(line=>{
    const [lvl,name,school,time,range,duration,comp] = line.split('|');
    const sp = {level:parseInt(lvl,10), name, school, time, range, duration, comp,
      ritual: RITUAL_SPELLS.has(name),
      desc: DESCRIPTIONS[name] || 'No summary written for this one yet — see the linked page for full text.'};
    sp.cls = actionClass(sp);
    return sp;
  });
}
const SPELL_DATA = {
  wizard: parseSpells(WIZARD_RAW),
  paladin: parseSpells(PALADIN_RAW),
  bard: parseSpells(BARD_RAW),
  rogue: []
};
// Racial spells that aren't on any class list above (checked against dnd5e.wikidot.com)
const RACIAL_SPELL_RAW = `0|Thaumaturgy|Transmutation|1 Action|30 feet|Up to 1 minute|V
1|Hellish Rebuke|Evocation|1 Reaction|60 feet|Instantaneous|V, S
1|Sanctuary|Abjuration|1 Bonus Action|30 feet|1 minute|V, S, M
1|Ensnaring Strike|Conjuration|1 Bonus Action|Self|Concentration, up to 1 minute|V
1|Hunter's Mark|Divination|1 Bonus Action|90 feet|Concentration, up to 1 hour|V
2|Moonbeam|Evocation|1 Action|120 feet|Concentration, up to 1 minute|V, S, M
3|Beacon of Hope|Abjuration|1 Action|30 feet|Concentration, up to 1 minute|V, S
4|Guardian of Faith|Conjuration|1 Action|30 feet|8 hours|V
5|Commune|Divination|1 Minute|Self|1 minute|V, S, M
5|Commune with Nature|Divination|1 Minute|Self|Instantaneous|V, S
5|Flame Strike|Evocation|1 Action|60 feet|Instantaneous|V, S, M
5|Tree Stride|Conjuration|1 Action|Self|Concentration, up to 1 minute|V, S`;
const EXTRA_SPELLS = parseSpells(RACIAL_SPELL_RAW);
/* Roll data for the Cast Prepared Spell popup, checked against dnd5e.wikidot.com (2014).
   attack: 'ranged'|'melee' spell attack.  save: ability the target saves with; onSave: 'half'|'none'.
   parts: damage [{d, type, per (extra dice per slot above the spell's level)}]; cantrips (cantrip:true)
   multiply their dice at character levels 5, 11 and 17.
   heal / temp / pool / darts: special results.  rider: extra damage on a later weapon hit.
   hitSave: a save the target makes when the spell (or rider) hits.  ongoing: damage on later turns.
   effect: what a failed save does.  upcastNote: non-damage upcast effect.
   fx: what the spell does to your weapon attacks once cast (see Active effects): weapon
   ('melee'|'any'), until ('hit' = your next hit, or a duration), target:true if it only
   applies against one creature. Its extra damage is the rider's dice.
   heal: {d, per, flat (fixed extra), noMod (no spellcasting modifier), desc}.  parts[].bonus: fixed damage on
   top (Disintegrate's +40).  check: a spellcasting ability check.  saveLater: {save, text}, a save made later,
   not on casting.  rolls: [{label, d, desc}], other dice the spell calls for.
   Covers every spell on the wizard, bard and paladin lists from cantrips to 9th level (2nd and up added
   2026-10-01), plus the party's racial and Oath spells. Spells not here and not in NO_ROLL_SPELLS show
   "not added yet". */
const SPELL_ROLLS = {
  'Acid Splash': {save:'dex', onSave:'none', cantrip:true, parts:[{d:'1d6', type:'acid'}], note:'One creature, or two within 5 ft of each other.'},
  'Chill Touch': {attack:'ranged', cantrip:true, parts:[{d:'1d8', type:'necrotic'}], note:'On a hit, the target can’t regain hit points until the start of your next turn. An undead target also has disadvantage on attacks against you until the end of your next turn.'},
  'Fire Bolt': {attack:'ranged', cantrip:true, parts:[{d:'1d10', type:'fire'}]},
  'Poison Spray': {save:'con', onSave:'none', cantrip:true, parts:[{d:'1d12', type:'poison'}]},
  'Ray of Frost': {attack:'ranged', cantrip:true, parts:[{d:'1d8', type:'cold'}], note:'On a hit, its speed drops by 10 ft until the start of your next turn.'},
  'Shocking Grasp': {attack:'melee', cantrip:true, parts:[{d:'1d8', type:'lightning'}], note:'Advantage if the target wears metal armor. On a hit, it can’t take reactions until the start of its next turn.'},
  'Vicious Mockery': {save:'wis', onSave:'none', cantrip:true, parts:[{d:'1d4', type:'psychic'}], effect:'Disadvantage on its next attack roll before the end of its next turn.'},

  'Burning Hands': {save:'dex', onSave:'half', parts:[{d:'3d6', type:'fire', per:'1d6'}], note:'15 ft cone.'},
  'Chromatic Orb': {attack:'ranged', parts:[{d:'3d8', type:'acid, cold, fire, lightning, poison or thunder (your choice)', per:'1d8'}]},
  'Color Spray': {pool:{d:'6d10', per:'2d10', what:'hit points of creatures blinded, lowest current hit points first'}},
  'Cure Wounds': {heal:{d:'1d8', per:'1d8'}},
  'Dissonant Whispers': {save:'wis', onSave:'half', parts:[{d:'3d6', type:'psychic', per:'1d6'}], effect:'It must use its reaction to move as far away from you as it can.'},
  'False Life': {temp:{d:'1d4', flat:4, perFlat:5}},
  'Healing Word': {heal:{d:'1d4', per:'1d4'}},
  'Magic Missile': {darts:{n:3, d:'1d4', bonus:1, type:'force'}},
  'Ray of Sickness': {attack:'ranged', parts:[{d:'2d8', type:'poison', per:'1d8'}], hitSave:{save:'con', effect:'poisoned until the end of your next turn'}},
  'Sleep': {pool:{d:'5d8', per:'2d8', what:'hit points of creatures that fall asleep, lowest current hit points first'}},
  'Thunderwave': {save:'con', onSave:'half', parts:[{d:'2d8', type:'thunder', per:'1d8'}], effect:'It is pushed 10 ft away from you.'},
  'Witch Bolt': {attack:'ranged', parts:[{d:'1d12', type:'lightning', per:'1d12'}], ongoing:{d:'1d12', type:'lightning', text:'On each later turn, use your action to deal this automatically (concentration).'}},
  'Hellish Rebuke': {save:'dex', onSave:'half', parts:[{d:'2d10', type:'fire', per:'1d10'}], note:'Reaction: when a creature you can see within 60 ft damages you.'},

  // Riders: no roll when cast; extra damage on a later weapon hit
  'Searing Smite': {rider:{d:'1d6', type:'fire', per:'1d6', on:'your next melee weapon hit'}, fx:{until:'hit', weapon:'melee'},
    ongoing:{d:'1d6', type:'fire', save:'con', text:'At the start of each of its turns the target makes a Constitution save: on a failure it takes this damage, on a success the spell ends.'}},
  'Thunderous Smite': {rider:{d:'2d6', type:'thunder', on:'your next melee weapon hit'}, fx:{until:'hit', weapon:'melee'}, hitSave:{save:'str', effect:'pushed 10 ft away and knocked prone'}},
  'Wrathful Smite': {rider:{d:'1d6', type:'psychic', on:'your next melee weapon hit'}, fx:{until:'hit', weapon:'melee'}, hitSave:{save:'wis', effect:'frightened of you until the spell ends'}},
  'Divine Favor': {rider:{d:'1d4', type:'radiant', on:'every weapon hit for the next minute (concentration)'}, fx:{until:'1 minute', weapon:'any'}},
  "Hunter's Mark": {rider:{d:'1d6', type:'same type as your weapon', on:'every weapon hit on the marked creature (concentration)'}, fx:{target:true, weapon:'any'}},
  'Ensnaring Strike': {rider:null, hitSave:{save:'str', effect:'restrained by thorny vines'}, onHit:'your next weapon hit', fx:{until:'hit', weapon:'any'},
    ongoing:{d:'1d6', type:'piercing', per:'1d6', text:'While restrained, it takes this at the start of each of its turns.'}},

  // Save only, no damage
  'Animal Friendship': {save:'wis', effect:'Charmed for 24 hours. Beasts only; fails on Intelligence 4 or higher.', upcastNote:'+1 beast per slot level above 1st.'},
  'Bane': {save:'cha', effect:'For the duration, it subtracts 1d4 from attack rolls and saving throws.', upcastNote:'+1 target per slot level above 1st.'},
  'Charm Person': {save:'wis', effect:'Charmed by you (advantage on the save if you or your companions are fighting it).', upcastNote:'+1 target per slot level above 1st.'},
  'Command': {save:'wis', effect:'It follows your one-word command on its next turn. Undead and creatures that don’t understand your language are unaffected.', upcastNote:'+1 target per slot level above 1st.'},
  'Compelled Duel': {save:'wis', effect:'Disadvantage on attacks against anyone but you, and it must save again to move more than 30 ft from you.'},
  'Faerie Fire': {save:'dex', effect:'Outlined in light: attacks against it have advantage and it can’t benefit from being invisible.'},
  'Grease': {save:'dex', effect:'It falls prone. Also when a creature enters the area or ends its turn there.'},
  'Sanctuary': {save:'wis', effect:'Made by any creature that targets the warded creature with an attack or harmful spell: on a failure it must choose a new target or lose the attack.'},
  "Tasha's Hideous Laughter": {save:'wis', effect:'Prone and incapacitated with laughter. Creatures with Intelligence 4 or less are unaffected.'},

  // ---- 2nd level and up (added 2026-10-01, checked against dnd5e.wikidot.com, 2014 PHB) ----
  // 2nd level
  'Blindness/Deafness': {save:'con', effect:'Blinded or deafened (your choice) for 1 minute. It repeats the save at the end of each of its turns.', upcastNote:'+1 target per slot level above 2nd.'},
  'Branding Smite': {rider:{d:'2d6', type:'radiant', per:'1d6', on:'your next weapon hit'}, fx:{until:'hit', weapon:'any'}, note:'The target becomes visible if invisible, sheds dim light and can’t turn invisible until the spell ends.'},
  'Calm Emotions': {save:'cha', effect:'Choose: its charm or fear effects are suppressed, or it becomes indifferent to creatures you choose that it’s hostile to. A creature can choose to fail.'},
  'Cloud of Daggers': {parts:[{d:'4d4', type:'slashing', per:'2d4'}], note:'No attack or save: a creature takes this when it enters the 5-ft cube for the first time on a turn or starts its turn there.'},
  'Crown of Madness': {save:'wis', effect:'Charmed: on each of its turns it attacks a creature you choose (you use your action to keep control). It repeats the save at the end of each of its turns. Humanoids only.'},
  'Detect Thoughts': {save:'wis', effect:'If you probe deeper into its mind: on a failure you learn its reasoning, emotions and what looms large in its mind. On a success it knows you’re probing and the spell ends.'},
  'Enhance Ability': {temp:{d:'2d6', desc:'temporary hit points (Bear’s Endurance only), lost when the spell ends'}, note:'Choose Bear’s Endurance, Bull’s Strength, Cat’s Grace, Eagle’s Splendor, Fox’s Cunning or Owl’s Wisdom: advantage on that ability’s checks, plus a bonus for some.', upcastNote:'+1 target per slot level above 2nd.'},
  'Enlarge/Reduce': {save:'con', effect:'Only an unwilling creature saves: on a failure it’s enlarged or reduced (your choice) for up to 1 minute.'},
  'Enthrall': {save:'wis', effect:'Disadvantage on Wisdom (Perception) checks to notice anyone but you for 1 minute. Creatures that can’t be charmed succeed automatically; it has advantage if you or your companions are fighting it.'},
  'Flaming Sphere': {save:'dex', onSave:'half', parts:[{d:'2d6', type:'fire', per:'1d6'}], note:'A creature that ends its turn within 5 ft of the sphere saves. As a bonus action you can move the sphere 30 ft and ram a creature, which then saves.'},
  'Gust of Wind': {save:'str', effect:'Each creature that starts its turn in the line is pushed 15 ft away from you.'},
  'Heat Metal': {parts:[{d:'2d8', type:'fire', per:'1d8'}], note:'No attack or save for the damage: a creature touching the metal takes it when you cast the spell.',
    saveLater:{save:'con', text:'a creature holding or wearing the object that takes the damage drops it if it can; if it doesn’t, it has disadvantage on attacks and ability checks until your next turn.'},
    ongoing:{d:'2d8', type:'fire', per:'1d8', text:'On each later turn, use a bonus action to deal this damage again.'}},
  'Hold Person': {save:'wis', effect:'Paralyzed for up to 1 minute. It repeats the save at the end of each of its turns. Humanoids only.', upcastNote:'+1 humanoid per slot level above 2nd (within 30 ft of each other).'},
  'Levitate': {save:'con', effect:'Only an unwilling creature saves: on a failure it rises up to 20 ft and hangs there for up to 10 minutes.'},
  "Melf's Acid Arrow": {attack:'ranged', parts:[{d:'4d4', type:'acid', per:'1d4'}], ongoing:{d:'2d4', type:'acid', per:'1d4', text:'On a hit, it also takes this at the end of its next turn.'}, note:'On a miss, the arrow splashes it for half the first damage and none later.'},
  'Phantasmal Force': {save:'int', effect:'It sees a phantasm of your choice for up to 1 minute and treats it as real. It can use an action to make an Intelligence (Investigation) check against your DC to see through it.',
    ongoing:{d:'1d6', type:'psychic', text:'Each round on your turn, if the phantasm could logically hurt it, it takes this damage.'}},
  'Ray of Enfeeblement': {attack:'ranged', note:'On a hit, its Strength-based weapon attacks deal only half damage for up to 1 minute. It makes a Constitution save at the end of each of its turns to end it.'},
  'Scorching Ray': {attack:'ranged', parts:[{d:'2d6', type:'fire'}], note:'3 rays: roll the attack and damage for each one. You can aim them at one target or several.', upcastNote:'+1 ray per slot level above 2nd.'},
  'Shatter': {save:'con', onSave:'half', parts:[{d:'3d8', type:'thunder', per:'1d8'}], note:'10-ft-radius sphere. Creatures made of stone, crystal or metal save with disadvantage.'},
  'Suggestion': {save:'wis', effect:'It follows your suggested course of activity (one or two sentences) for up to 8 hours. Creatures that can’t be charmed are immune.'},
  'Web': {save:'dex', effect:'Restrained by the webs. It can use its action for a Strength check against your DC to break free.', note:'Creatures save when they start their turn in the webs or enter them. Burning webs deal 2d4 fire to a creature that starts its turn in the fire.'},
  'Zone of Truth': {save:'cha', effect:'It can’t speak a deliberate lie while in the 15-ft-radius sphere. You know whether each creature passed or failed.'},

  // 3rd level
  'Blink': {rolls:[{label:'At the end of each of your turns', d:'1d20', desc:'11 or higher: you vanish to the Ethereal Plane until the start of your next turn'}], note:'Lasts 1 minute.'},
  // Cast with your action to start the aura (concentration); then each turn, Bonus Action Options has
  // "Aura of Vitality" (each) to heal one creature in it
  'Aura of Vitality': {each:{heal:{d:'2d6', desc:'hit points regained by one creature in the aura'}, text:'Heal one creature in your 30-foot aura, you included.'}, note:'Your aura lasts up to 1 minute (concentration). Each turn, use a bonus action from Bonus Action Options (Aura of Vitality) to heal one creature in it 2d6.'},
  'Bestow Curse': {save:'wis', effect:'Cursed (your choice): disadvantage on checks and saves with one ability; disadvantage on attacks against you; a Wisdom save each turn or it wastes its action; or your attacks and spells deal it extra damage (below).',
    ongoing:{d:'1d8', type:'necrotic', text:'If you chose this curse: your attacks and spells deal this extra damage to the target.'}, upcastNote:'Longer: 4th-level slot 10 minutes (concentration), 5th 8 hours, 7th 24 hours, 9th until dispelled; from 5th level it needs no concentration.'},
  'Blinding Smite': {rider:{d:'3d8', type:'radiant', on:'your next melee weapon hit'}, fx:{until:'hit', weapon:'melee'}, hitSave:{save:'con', effect:'blinded until the spell ends (it repeats the save at the end of each of its turns)'}},
  'Counterspell': {check:'Only if the spell is 4th level or higher (higher than your slot): the DC is 10 + that spell’s level. A spell of your slot’s level or lower fails automatically.', upcastNote:'A higher slot automatically stops spells of that level or lower.'},
  "Crusader's Mantle": {rider:{d:'1d4', type:'radiant', on:'every weapon hit for up to 1 minute (concentration), by you and each non-hostile creature within 30 ft'}, fx:{until:'1 minute', weapon:'any'}},
  'Dispel Magic': {check:'For each spell of 4th level or higher on the target (higher than your slot): the DC is 10 + that spell’s level. Spells of your slot’s level or lower end automatically.', upcastNote:'A higher slot automatically ends spells of that level or lower.'},
  'Elemental Weapon': {rider:{d:'1d4', type:'acid, cold, fire, lightning or thunder (your choice)', on:'every hit with the weapon for up to 1 hour (concentration)'}, fx:{until:'1 hour', weapon:'any', toHit:1},
    upcastNote:'5th or 6th-level slot: +2 to hit and 2d4. 7th level or higher: +3 to hit and 3d4. (The Attack popup adds +1 and 1d4.)'},
  'Fear': {save:'wis', effect:'It drops what it’s holding and is frightened of you for up to 1 minute, taking the Dash action to move away each turn. It saves again at the end of a turn it can’t see you.'},
  'Fireball': {save:'dex', onSave:'half', parts:[{d:'8d6', type:'fire', per:'1d6'}], note:'20-ft-radius sphere. The fire spreads around corners.'},
  'Glyph of Warding': {save:'dex', onSave:'half', parts:[{d:'5d8', type:'acid, cold, fire, lightning or thunder (chosen when you made it)', per:'1d8'}], note:'Explosive runes: each creature in a 20-ft-radius sphere saves when the glyph triggers. A spell glyph casts its stored spell instead.'},
  'Hypnotic Pattern': {save:'wis', effect:'Charmed for up to 1 minute: incapacitated with speed 0. It ends if it takes damage or someone uses an action to shake it awake.'},
  'Lightning Bolt': {save:'dex', onSave:'half', parts:[{d:'8d6', type:'lightning', per:'1d6'}], note:'100-ft line, 5 ft wide.'},
  'Sleet Storm': {save:'dex', effect:'It falls prone.', note:'Creatures save when they enter the area or start their turn there. A creature concentrating that starts its turn there makes a Constitution save against your DC or loses concentration.'},
  'Slow': {save:'wis', effect:'For up to 1 minute: speed halved, −2 to AC and Dexterity saves, no reactions, an action or a bonus action (not both) and one attack. It repeats the save at the end of each of its turns.', note:'Up to six creatures in a 40-ft cube.'},
  'Stinking Cloud': {save:'con', effect:'It spends its action that turn retching. Creatures that don’t breathe or are immune to poison succeed automatically.', note:'Creatures completely in the 20-ft-radius cloud save at the start of each of their turns.'},
  'Vampiric Touch': {attack:'melee', parts:[{d:'3d6', type:'necrotic', per:'1d6'}], note:'You regain hit points equal to half the necrotic damage. For up to 1 minute (concentration) you can make this attack again as your action.'},

  // 4th level
  'Banishment': {save:'cha', effect:'Banished for up to 1 minute (concentration). A creature native to another plane doesn’t come back if the spell lasts the full minute.', upcastNote:'+1 target per slot level above 4th.'},
  'Blight': {save:'con', onSave:'half', parts:[{d:'8d8', type:'necrotic', per:'1d8'}], note:'No effect on undead or constructs. Plant creatures save with disadvantage and take maximum damage.'},
  'Compulsion': {save:'wis', effect:'On each of its turns you can make it move in a direction you choose (bonus action), after which it saves again. Creatures that can’t be charmed succeed automatically.'},
  'Confusion': {save:'wis', effect:'For up to 1 minute it can’t take reactions and rolls a d10 at the start of each turn: 1 moves randomly, 2–6 does nothing, 7–8 attacks a random creature in reach, 9–10 acts normally. It repeats the save at the end of each turn.',
    rolls:[{label:'Its behavior (each turn)', d:'1d10', desc:'1 moves randomly · 2–6 nothing · 7–8 attacks a random creature · 9–10 acts normally'}], upcastNote:'The sphere’s radius grows by 5 ft per slot level above 4th.'},
  'Control Water': {save:'str', onSave:'none', parts:[{d:'2d8', type:'bludgeoning'}], note:'Whirlpool only: a creature that enters the vortex or starts its turn there saves or takes this and is caught in it.'},
  "Evard's Black Tentacles": {save:'dex', onSave:'none', parts:[{d:'3d6', type:'bludgeoning'}], effect:'It is also restrained.', note:'Creatures save when they enter the 20-ft square or start their turn there; one already restrained takes the damage at the start of its turn. It can escape with a Strength or Dexterity check against your DC.'},
  'Fire Shield': {parts:[{d:'2d8', type:'fire (warm shield) or cold (chill shield)'}], note:'For 10 minutes: when a creature within 5 ft hits you with a melee attack, it takes this damage. You also resist cold (warm) or fire (chill).'},
  'Ice Storm': {save:'dex', onSave:'half', parts:[{d:'2d8', type:'bludgeoning', per:'1d8'}, {d:'4d6', type:'cold'}], note:'20-ft-radius, 40-ft-high cylinder. The ground becomes difficult terrain until your next turn.'},
  "Mordenkainen's Faithful Hound": {attack:'melee', parts:[{d:'4d8', type:'piercing'}], note:'At the start of your turn the hound bites one hostile creature within 5 ft of it, using your spell attack bonus.'},
  "Otiluke's Resilient Sphere": {save:'dex', effect:'Only an unwilling creature saves: on a failure it’s enclosed in the sphere for up to 1 minute.'},
  'Phantasmal Killer': {save:'wis', effect:'Frightened for up to 1 minute.', ongoing:{d:'4d10', type:'psychic', per:'1d10', save:'wis', text:'At the end of each of its turns it makes a Wisdom save: on a failure it takes this damage, on a success the spell ends.'}},
  'Polymorph': {save:'wis', effect:'Only an unwilling creature saves: on a failure it turns into a beast you choose (CR up to its level) for up to 1 hour. Shapechangers succeed automatically.'},
  'Staggering Smite': {rider:{d:'4d6', type:'psychic', on:'your next melee weapon hit'}, fx:{until:'hit', weapon:'melee'}, hitSave:{save:'wis', effect:'at disadvantage on attack rolls and ability checks, and can’t take reactions, until the end of its next turn'}},
  'Wall of Fire': {save:'dex', onSave:'half', parts:[{d:'5d8', type:'fire', per:'1d8'}], note:'Creatures in the wall save when it appears. Afterward one side deals this damage (no save) to a creature that ends its turn within 10 ft of it or inside the wall.'},

  // 5th level
  'Animate Objects': {note:'Up to ten objects attack on your bonus-action command. Tiny: +8 to hit, 1d4+4 · Small: +6, 1d8+2 · Medium: +5, 2d6+1 · Large: +6, 2d10+2 · Huge: +8, 2d12+4 (bludgeoning).', upcastNote:'Two more objects per slot level above 5th.'},
  'Banishing Smite': {rider:{d:'5d10', type:'force', on:'your next weapon hit'}, fx:{until:'hit', weapon:'any'}, note:'If the attack leaves it at 50 hit points or fewer, it is banished (no save) to its home plane, or a harmless demiplane, for up to 1 minute.'},
  "Bigby's Hand": {attack:'melee', parts:[{d:'4d8', type:'force', per:'2d8'}], note:'Clenched Fist (the attack above). Other choices: Forceful Hand (push with a Strength contest), Grasping Hand (grapple; then crush for 2d6 + your spellcasting modifier bludgeoning, +2d6 per slot level above 5th) or Interposing Hand (cover).'},
  'Cloudkill': {save:'con', onSave:'half', parts:[{d:'5d8', type:'poison', per:'1d8'}], note:'Creatures save when they enter the 20-ft-radius cloud or start their turn there. It moves 10 ft away from you each turn.'},
  'Cone of Cold': {save:'con', onSave:'half', parts:[{d:'8d8', type:'cold', per:'1d8'}], note:'60-ft cone. A creature killed by it becomes a frozen statue.'},
  'Contact Other Plane': {note:'You make a DC 15 Intelligence save: on a failure you take 6d6 psychic damage and are insane until a long rest. On a success you can ask up to five questions.'},
  'Destructive Wave': {save:'con', onSave:'half', parts:[{d:'5d6', type:'thunder'}, {d:'5d6', type:'radiant or necrotic (your choice)'}], effect:'It is also knocked prone (not on a success).', note:'Creatures you choose within 30 ft of you.'},
  'Dispel Evil and Good': {attack:'melee', hitSave:{save:'cha', effect:'sent back to its home plane (celestials, elementals, fey, fiends and undead)'}, note:'Or break an enchantment or possession on a creature you touch. Until the spell ends, those creature types have disadvantage on attacks against you.'},
  'Dominate Person': {save:'wis', effect:'Charmed by you for up to 1 minute (concentration); you can command it telepathically. It saves again each time it takes damage. Advantage if you’re fighting it. Humanoids only.', upcastNote:'6th-level slot: up to 10 minutes. 7th: up to 1 hour. 8th or higher: up to 8 hours.'},
  'Dream': {save:'wis', effect:'For a nightmare: it gets no benefit from that rest and takes the damage below when it wakes.', ongoing:{d:'3d6', type:'psychic', text:'Nightmare only: it takes this when it wakes up.'}},
  'Geas': {save:'wis', effect:'Charmed by you for 30 days, bound to the service you command.', ongoing:{d:'5d10', type:'psychic', text:'Each time it acts directly against your instructions (once a day at most).'}, upcastNote:'7th or 8th-level slot: 1 year. 9th: until ended by Remove Curse, Greater Restoration or Wish.'},
  'Hold Monster': {save:'wis', effect:'Paralyzed for up to 1 minute. It repeats the save at the end of each of its turns. No effect on undead.', upcastNote:'+1 creature per slot level above 5th (within 30 ft of each other).'},
  'Mass Cure Wounds': {heal:{d:'3d8', per:'1d8', desc:'hit points regained by each of up to six creatures in a 30-ft sphere'}},
  'Modify Memory': {save:'wis', effect:'Charmed for up to 1 minute while you change its memory of an event from the last 24 hours. Advantage if you’re fighting it.', upcastNote:'Older memories: 7 days (6th-level slot), 30 days (7th), 1 year (8th) or any time (9th).'},
  'Planar Binding': {save:'cha', effect:'Bound to serve you for 24 hours (a celestial, elemental, fey or fiend).', upcastNote:'Longer: 10 days (6th-level slot), 30 days (7th), 180 days (8th), a year and a day (9th).'},
  'Scrying': {save:'wis', effect:'You see and hear it through an invisible sensor for up to 10 minutes. The save has a bonus or penalty for how well you know it (+5 to −5) and what you have of it (−10 to −2). It can fail on purpose. On a success you can’t target it again for 24 hours.'},
  'Seeming': {save:'cha', effect:'Only an unwilling creature saves: on a failure its appearance changes as you choose for 8 hours.'},
  'Telekinesis': {check:'To move a creature: contested by its Strength check. If you win, move it up to 30 ft; it’s restrained until the end of your next turn. Objects up to 1,000 lb need no check unless someone is holding it.'},
  'Wall of Stone': {save:'dex', effect:'Only a creature the wall would surround saves: on a success it moves out of the way first.'},

  // 6th level
  'Chain Lightning': {save:'dex', onSave:'half', parts:[{d:'10d8', type:'lightning'}], note:'One target, then three more bolts leap to other targets within 30 ft of it. Each target saves.', upcastNote:'+1 bolt per slot level above 6th.'},
  'Circle of Death': {save:'con', onSave:'half', parts:[{d:'8d6', type:'necrotic', per:'2d6'}], note:'60-ft-radius sphere.'},
  'Disintegrate': {save:'dex', onSave:'none', parts:[{d:'10d6', type:'force', per:'3d6', bonus:40}], note:'A creature reduced to 0 hit points is disintegrated (only True Resurrection or Wish can bring it back). Large or smaller objects and force creations are destroyed outright.'},
  'Eyebite': {save:'wis', effect:'Your choice: asleep (until damaged or shaken awake), panicked (frightened, Dashes away), or sickened (disadvantage on attacks and checks; it saves again at the end of each turn).', note:'For up to 1 minute you can use your action each turn to target another creature within 60 ft.'},
  'Flesh to Stone': {save:'con', effect:'Restrained. It saves again at the end of each of its turns: three failures and it’s petrified, three successes and the spell ends.', note:'No effect if its body isn’t flesh. If you concentrate for the full minute, the petrification is permanent.'},
  'Magic Jar': {save:'cha', effect:'You take over its body; its soul goes into the container. On a success it resists you and you can’t try again for 24 hours.'},
  'Mass Suggestion': {save:'wis', effect:'Each of up to twelve creatures follows your suggestion for up to 24 hours. Creatures that can’t be charmed are immune.', upcastNote:'Longer: 10 days (7th-level slot), 30 days (8th), a year and a day (9th).'},
  "Otiluke's Freezing Sphere": {save:'con', onSave:'half', parts:[{d:'10d6', type:'cold', per:'1d6'}], note:'60-ft-radius sphere. It freezes water it hits. You can hold the globe and throw it later instead.'},
  "Otto's Irresistible Dance": {saveLater:{save:'wis', text:'there’s no save when you cast it. As an action, the dancing creature can make this save to end the spell.'}, note:'For up to 1 minute it dances: it uses all its movement, has disadvantage on Dexterity saves and attacks, and attacks against it have advantage. Creatures that can’t be charmed are immune.'},
  'Sunbeam': {save:'con', onSave:'half', parts:[{d:'6d8', type:'radiant'}], effect:'It is also blinded until your next turn (not on a success).', note:'60-ft line, 5 ft wide. Undead and oozes save with disadvantage. You can make a new line as your action each turn for up to 1 minute.'},
  'Wall of Ice': {save:'dex', onSave:'half', parts:[{d:'10d6', type:'cold', per:'2d6'}], note:'Only a creature in the wall’s space when it appears saves.',
    ongoing:{d:'5d6', type:'cold', per:'1d6', save:'con', text:'A destroyed section leaves frigid air: a creature moving through it makes a Constitution save, taking this on a failure or half on a success.'}},

  // 7th level
  'Delayed Blast Fireball': {save:'dex', onSave:'half', parts:[{d:'12d6', type:'fire', per:'1d6'}], note:'20-ft-radius sphere. If you hold the bead, the damage grows by 1d6 at the end of each of your turns before it explodes.'},
  'Finger of Death': {save:'con', onSave:'half', parts:[{d:'7d8', type:'necrotic', bonus:30}], note:'A humanoid killed by it rises at the start of your next turn as a zombie under your command.'},
  "Mordenkainen's Sword": {attack:'melee', parts:[{d:'3d10', type:'force'}], note:'The attack when it appears. On each later turn, a bonus action moves the sword 20 ft and repeats the attack. Lasts up to 1 minute.'},
  'Plane Shift': {attack:'melee', hitSave:{save:'cha', effect:'sent to a plane of your choice'}, note:'Or carry yourself and up to eight willing creatures to another plane (no roll).'},
  'Prismatic Spray': {save:'dex', onSave:'half', parts:[{d:'10d6', type:'set by the ray: fire, acid, lightning, poison or cold'}],
    rolls:[{label:'Ray (one per creature)', d:'1d8', desc:'1 red fire · 2 orange acid · 3 yellow lightning · 4 green poison · 5 blue cold · 6 indigo · 7 violet · 8 two rays'}],
    note:'Each creature in the 60-ft cone saves and is struck by one ray. Indigo: restrained, then Constitution saves at the end of each turn (three failures: petrified). Violet: blinded, then a Wisdom save at the start of your next turn or it’s sent to another plane. 8: two rays (roll twice, rerolling 8s). The damage rays deal half on a success.'},
  'Regenerate': {heal:{d:'4d8', flat:15, noMod:true}, note:'Then it regains 1 hit point at the start of each of its turns for 1 hour, and severed body parts regrow after 2 minutes.'},
  'Reverse Gravity': {save:'dex', effect:'Only a creature that can reach a fixed object saves: on a success it grabs hold and doesn’t fall upward.'},
  'Symbol': {note:'The glyph triggers on a condition you set; each creature within 60 ft then saves against your spell save DC. Death: Constitution, 10d10 necrotic (half on a success). Discord: Constitution. Fear: Wisdom. Hopelessness: Charisma. Insanity: Intelligence. Pain: Constitution. Sleep: Wisdom. Stunning: Wisdom.',
    rolls:[{label:'Death glyph damage', d:'10d10', desc:'necrotic (half on a successful Constitution save)'}]},
  'Teleport': {note:'For an uncertain destination the DM rolls d100 on the familiarity table. A mishap deals 3d10 force damage to each creature teleporting, and the DM rolls again.'},

  // 8th level
  'Antipathy/Sympathy': {save:'wis', effect:'Antipathy: frightened of the target and must move away. Sympathy: drawn to the target. It saves again whenever the target harms it, or when it ends a turn more than 60 ft away and unable to see it.'},
  'Dominate Monster': {save:'wis', effect:'Charmed by you for up to 1 hour (concentration); you can command it telepathically. It saves again each time it takes damage. Advantage if you’re fighting it.', upcastNote:'9th-level slot: up to 8 hours.'},
  'Feeblemind': {save:'int', parts:[{d:'4d6', type:'psychic'}], effect:'Its Intelligence and Charisma become 1: it can’t cast spells, use magic items or communicate. It repeats the save every 30 days.', note:'It takes the damage whether or not it saves.'},
  'Incendiary Cloud': {save:'dex', onSave:'half', parts:[{d:'10d8', type:'fire'}], note:'Creatures save when the 20-ft-radius cloud appears, when they enter it for the first time on a turn, or end their turn there. It drifts 10 ft each turn.'},
  'Maze': {note:'No save: the creature is banished to a labyrinth for up to 10 minutes. It can use its action for a DC 20 Intelligence check to escape. Minotaurs and goristro demons escape automatically.'},
  'Power Word: Stun': {saveLater:{save:'con', text:'if it has 150 hit points or fewer it is stunned (no save). It makes this save at the end of each of its turns to end it.'}},
  'Sunburst': {save:'con', onSave:'half', parts:[{d:'12d6', type:'radiant'}], effect:'It is also blinded for 1 minute (not on a success); it saves again at the end of each of its turns.', note:'60-ft-radius sphere. Undead and oozes save with disadvantage.'},

  // 9th level
  'Imprisonment': {save:'wis', effect:'Imprisoned in the form you choose (burial, chaining, hedged prison, minimus containment or slumber) until freed by the condition you set. On a success it’s immune to your later castings.'},
  'Meteor Swarm': {save:'dex', onSave:'half', parts:[{d:'20d6', type:'fire'}, {d:'20d6', type:'bludgeoning'}], note:'Four meteors, each a 40-ft-radius sphere. A creature caught in more than one is affected only once.'},
  'Prismatic Wall': {note:'Creatures within 20 ft that can see the wall make a Constitution save or are blinded for 1 minute. A creature passing through makes a save for each layer: red fire, orange acid, yellow lightning, green poison, blue cold (Dexterity, 10d6 each, half on a success), indigo (Dexterity or restrained), violet (Dexterity or blinded, then sent to another plane).',
    rolls:[{label:'Damaging layer', d:'10d6', desc:'red fire · orange acid · yellow lightning · green poison · blue cold'}]},
  'Time Stop': {rolls:[{label:'Turns in a row', d:'1d4+1', desc:'your turns while time is stopped'}], note:'It ends early if anything you do affects another creature or its belongings, or you move more than 1,000 ft from where you cast it.'},
  'True Polymorph': {save:'wis', effect:'Only an unwilling creature saves: on a failure it turns into another creature or an object, or an object into a creature, for up to 1 hour (permanent if you concentrate the whole hour).'},
  'Weird': {save:'wis', effect:'Frightened for up to 1 minute.', ongoing:{d:'4d10', type:'psychic', save:'wis', text:'At the end of each of its turns it makes a Wisdom save: on a failure it takes this damage, on a success the spell ends for it.'}},
};
// Checked: these don't involve any roll by the caster
const NO_ROLL_SPELLS = new Set(['Blade Ward','Dancing Lights','Friends','Light','Mage Hand','Mending','Message',
  'Minor Illusion','Prestidigitation','True Strike','Thaumaturgy','Alarm','Bless',
  'Comprehend Languages','Detect Evil and Good','Detect Magic','Detect Poison and Disease','Disguise Self',
  'Expeditious Retreat','Feather Fall','Find Familiar','Fog Cloud','Heroism','Identify','Illusory Script',
  'Jump','Longstrider','Mage Armor','Protection from Evil and Good','Purify Food and Drink','Shield','Shield of Faith',
  'Silent Image','Speak with Animals',"Tenser's Floating Disk",'Unseen Servant','Darkness',
  // 2nd level and up (2026-10-01): only the caster's choices or effects, no roll by the caster
  'Aid','Alter Self','Animal Messenger','Arcane Lock','Blur','Continual Flame','Darkvision','Find Steed','Gentle Repose',
  'Invisibility','Knock','Lesser Restoration','Locate Animals or Plants','Locate Object','Magic Mouth','Magic Weapon',
  'Mirror Image','Misty Step',"Nystul's Magic Aura",'Protection from Poison','Rope Trick','See Invisibility','Silence','Spider Climb',
  'Animate Dead','Clairvoyance','Create Food and Water','Daylight','Feign Death','Fly','Gaseous Form','Haste',"Leomund's Tiny Hut",
  'Magic Circle','Major Image','Nondetection','Phantom Steed','Plant Growth','Protection from Energy','Remove Curse','Revivify',
  'Sending','Speak with Dead','Speak with Plants','Tongues','Water Breathing',
  'Arcane Eye','Aura of Life','Aura of Purity','Conjure Minor Elementals','Death Ward','Dimension Door','Fabricate',
  'Freedom of Movement','Greater Invisibility','Hallucinatory Terrain',"Leomund's Secret Chest",'Locate Creature',
  "Mordenkainen's Private Sanctum",'Stone Shape','Stoneskin',
  'Awaken','Circle of Power','Conjure Elemental','Creation','Greater Restoration','Legend Lore','Mislead','Passwall','Raise Dead',
  "Rary's Telepathic Bond",'Teleportation Circle','Wall of Force',
  'Arcane Gate','Contingency','Create Undead',"Drawmij's Instant Summons",'Find the Path','Globe of Invulnerability',
  'Guards and Wards','Move Earth','Programmed Illusion','True Seeing',
  'Etherealness','Forcecage','Mirage Arcane',"Mordenkainen's Magnificent Mansion",'Project Image','Resurrection','Sequester','Simulacrum',
  'Antimagic Field','Clone','Control Weather','Demiplane','Glibness','Mind Blank','Telepathy',
  'Astral Projection','Foresight','Gate','Power Word: Heal','Power Word: Kill','Shapechange','Wish']);

function findSpell(name){
  for(const list of [...Object.values(SPELL_DATA), EXTRA_SPELLS]){
    const sp = list.find(s=>s.name===name);
    if(sp) return sp;
  }
  return null;
}
function slugify(name){
  return name.toLowerCase().replace(/'/g,'').replace(/[:,]/g,'').replace(/\//g,'-')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
const LEVEL_NAMES = ['Cantrip','1st Level','2nd Level','3rd Level','4th Level','5th Level','6th Level','7th Level','8th Level','9th Level'];
