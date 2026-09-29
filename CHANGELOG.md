# Changelog

What's new in Turnkeeper, the Crisis in Waterdeep character tracker, newest first.
Rules follow D&D 5e (2014), checked against [dnd5e.wikidot.com](https://dnd5e.wikidot.com).

## Unreleased — End turn on the DM Screen

### Added
- **End turn ▸** on the DM Screen's Initiative list: the row whose turn it is gets an orange
  End turn button, so the DM can end a monster's or lair action's turn (or a player's, if they
  forget) right where they're looking. It does the same as Next turn at the top.

## 2026-09-28 — Pick your target, and End my turn moves everyone on

### Added
- **Pick who you're attacking.** In combat, the Attack popup has an **Attacking** row listing
  the turn order. So does every spell that attacks, heals or makes a creature save: one target
  for attack spells, up to 3 (more with a higher slot) for Magic Missile, and several for area
  spells.
  - The DM Screen shows it straight away ("Last: Krunk → Goblin 2 · Greatsword"), outlines
    that creature's row for a minute, and adds it to the combat log.
  - If you've marked that creature with Hunter's Mark or Vow of Enmity, the bonus is ticked
    for you, and marks on other creatures are unticked.
- **End my turn moves the initiative on.** Clicking End my turn (in the combat bar, or on the
  orange "Your turn!" banner, which now has the button) moves the DM Screen to the next
  creature, and everyone's turn order follows. It only counts while it's still your turn, so
  a late or double click can't skip anyone. The DM Screen needs to be open.
- **DM Screen:** spells and features players cast on creatures are added to the combat log.
- **Test mode:** add `?test=1` to either page's address to use a separate test campaign, so
  trying things out never touches the real game.

### Security
- Everything the tracker and DM Screen read from the shared database is cleaned first: characters
  that could make code are stripped and long text is cut. Planted code shows as plain text
  instead of running. What they write is trimmed to fit the database's limits.

## 2026-09-28 — Shared combat and targets

### Added
- **In combat together.** When the DM clicks Start combat on the DM Screen, every player's
  Turnkeeper shows it:
  - An **⚔ IN COMBAT** banner stays at the top of the page, with the round and whose turn it
    is. It turns orange with **Your turn!** when it's yours.
  - An **Initiative** panel shows the turn order and everyone's conditions and effects.
    Players never see monster hit points, AC or the DM's notes, which aren't even sent to
    them. Defeated monsters are marked.
  - Turnkeeper's own round counter starts with the DM's combat and ends with it. **Start of my
    turn** and **End my turn** happen by themselves as the DM moves through the order, so
    durations count down on their own.
- **Cast on…** Spells and features that affect creatures ask who they're cast on, from the
  turn order (or the party outside combat), up to the spell's number of targets.
  - Covers Bless, Bane, Hunter's Mark, Vow of Enmity, Abjure Enemy, Bardic Inspiration, Hold
    Person, Faerie Fire, Sleep, Heroism, Haste, Slow, Invisibility and more.
  - For spells with a saving throw, pick only the creatures that failed it.
  - Everyone sees it on that creature in their Initiative list (e.g. "Hunter's Mark ·
    Krunk"), and so does the DM.
  - **On another player,** it's ticked in their own Status and changes their rolls, marked
    "from Bel". Bardic Inspiration from Bel is ready for Ezlo to use.
  - It ends when the caster loses concentration, when its time runs out, on a rest, or with
    its End button under Active effects. The Attack popup names the target
    ("Hunter's Mark target (Goblin 2)").
- **DM Screen:** effects players cast show on the right rows of the Initiative list.

## 2026-09-28 — DM Screen and live party updates

### Added
- **DM Screen** (`dm.html`), linked quietly under the character cards on the hub. Pick the
  campaign at the top (for now only Crisis in Waterdeep) and it shows:
  - **Party:** every character in the campaign, read from their Google Sheet. It shows AC,
    max HP, initiative, speed, spell save DC, passive Perception, Investigation and Insight,
    saving throws (proficient ones outlined), darkvision and resistances. Each card links to
    the character's Turnkeeper and sheet.
  - **Passive check:** pick Perception, Investigation or Insight and a DC to see who passes.
  - **Initiative:**
    - **Add the party**, then type in each player's roll.
    - **Add monsters:** search the 2014 SRD (334 monsters) to fill in AC, HP, initiative bonus
      and CR, or type any name and numbers. Add several at once ("Goblin 1–3"), with average
      or rolled hit points and one initiative for the group if you like.
    - **Lair actions** go on initiative 20, after anyone else on 20.
    - Initiative sorts itself; ▲▼ settle ties.
    - **Start combat / Next turn / Previous** move the turn and count rounds and time. Defeated
      monsters are skipped.
    - Each row tracks hit points (damage takes temporary HP first) and conditions or effects
      with a number of rounds, which count down at the end of that creature's turns. It also
      tracks concentration: damage brings up the Con save DC (and the monster's `!tk` roll),
      with Kept it / Lost it.
    - **Stats** opens an SRD monster's full stat block, with `!tk` commands for each attack's
      to-hit and damage.
    - A combat log keeps what happened.
  - **Encounter difficulty:** the 2014 DMG method. Party XP thresholds, the monster
    multiplier (adjusted for party size), the rating from Easy to Deadly, XP to award each
    character and the adventuring day budget. It updates as you add monsters.
  - **Rules reference:** conditions, exhaustion, DCs, actions in combat, cover and light,
    dropping to 0 HP, environment, travel and rest.
  - **Session notes**, saved as you type.
  - Everything is saved in the DM's browser, per campaign. It uses the same theme as the
    tracker and hub.
- **Campaign box** in Character Summary, showing the campaign the character plays in.
- **Live party updates.** When a player changes something in Turnkeeper, it shows on the DM
  Screen within a second or two. That covers hit points and temp HP, conditions and magic
  (Bless, Poisoned…), exhaustion, concentration, death saves, Inspiration, spell slots, Hit
  Dice and class features.
  - Each Party card has a live box with an HP bar and chips for each condition, and it says
    whether that player's Turnkeeper is open and when it last changed.
  - Characters in Initiative follow their player's hit points and show their conditions.
  - In the tracker, the Campaign box says "● Live with the DM" while it's sharing.
  - It uses a free Firebase database. Players don't need an account; the page signs in by
    itself, invisibly. Only the campaign's own characters can be written.
  - If a player opens their character on a device with an older copy, that device waits
    until they change something before sharing, so it doesn't overwrite newer numbers.

### Changed
- The color themes moved to `themes.css`, shared by the tracker and the DM Screen.

## 2026-09-27 — Spell limits and the wizard's spellbook

### Added
- **Spell limits from the Player's Handbook.** The Spells list shows how many you can have,
  e.g. "Cantrips: 2 of 3 · Prepared spells: 4 of 4", and stops you ticking more:
  - **Prepared casters** (Cleric, Druid, Paladin, Wizard) get their ability modifier plus
    their level. A Paladin uses half their level. The minimum is 1.
  - **Known casters** (Bard, Sorcerer, Ranger, Warlock, Arcane Trickster) get their class
    table's Spells Known.
  - **Cantrips** have their own count from the class table.
  - **Always-prepared spells** (Oath and racial spells) don't count.
  - **Spells above your highest spell slot level** can't be ticked.
  - Hover over a greyed-out box to see why. Unticking always works. If you already had more
    ticked than allowed, or a spell that's now too high, the list says which to untick.
  - "Select all" is gone for spellcasters, since you pick up to your number.
- **Wizard's spellbook.** Each wizard spell has two boxes: the first puts it in your
  spellbook, the second prepares it, and you can only prepare spells from your spellbook.
  - The book holds 6 spells at level 1 plus 2 more each time you level up ("Spellbook: 8 of
    8"), of any level you have slots for.
  - Once those are used up, ticking another asks whether you copied it from a scroll or
    another spellbook. Copied spells are tagged **Copied** and have no limit.
  - Turnkeeper doesn't charge gold or time for copying; your DM decides that.
  - Cantrips aren't kept in the spellbook and work as before.
  - Wizards need to re-tick their spells once.

## 2026-09-27 — Inspiration and your turn, start to end

### Added
- **Inspiration.** A **✧ Inspiration** button sits beside your hit points. It starts from the
  sheet's Inspiration box; click it when the DM gives you Inspiration or takes it away. While
  you have it, roll popups for attack rolls, ability checks and saving throws offer **Use
  Inspiration (advantage)**. Ticking it spends your Inspiration, and unticking gives it back.
  If the sheet's box changes, the sheet wins.
- **Your turn, start to end.** In combat, the round bar's button switches between **Start of
  my turn** and **End my turn**, and the bar shows what you've used:
  - **Reaction ready / used.** Using anything from Reactions (an opportunity attack, Shield,
    Uncanny Dodge…) marks it used. It comes back at the start of your turn. Click it to change
    it by hand.
  - **Attacks 1 of 2.** Each attack from the Attack action counts when you copy its to-hit,
    and the popup says which attack it is. Extra Attack gives two. Resets at the start of your
    turn.
  - **Sneak Attack used / Savage Attacker used.** Once-per-turn features count when you copy
    damage that includes them, and the popup reminds you. They reset when your turn starts and
    ends, so an opportunity attack on someone else's turn can use them again.

### Changed
- **End my turn is what counts time.** Each time you end your turn, one round passes for
  everything with a length. One minute is 10 turns, so an effect ends when you end your
  10th turn with it. This covers active effects (Divine Favor, Sacred Weapon), your
  concentration spell, and magic on you in Status: Bless, Bane, Haste, Heroism, Shield of
  Faith and so on, even when someone else cast them. Their chips show the turns left.

## 2026-09-27 — Helpful spells on yourself

### Added
- **Casting a helpful spell on yourself.** Bless, Heroism, Shield of Faith, Haste,
  Enlarge/Reduce, Guidance and Resistance ask "Casting it on yourself?" when you cast them.
  **Yes, on me** ticks it in your Status straight away (with an Undo); **No, someone else**
  reminds you that they can tick it on their own sheet.
  - If it's a concentration spell, it's linked: losing concentration (a failed save, dropping to
    0 HP, casting another concentration spell…) takes it off your Status too.
  - Undo on the spell slot puts your Status back the way it was before the cast.

## 2026-09-27 — Concentration

### Added
- **Concentration.** Casting any concentration spell (e.g. Bless, Hunter's Mark, Faerie Fire)
  shows "Concentrating: Bless" with your active effects, with an **End** button. With the round
  counter running it shows how many rounds are left, and it ends when the time's up.
  - Casting another concentration spell ends the first, and says so. Undo on the spell slot
    brings the first one back.
  - **Taking damage** while concentrating opens a **Concentration save** box in Resources: the
    DC (10, or half the damage if that's higher), the `!tk` Constitution save command with
    War Caster's advantage and any statuses (e.g. Bless), and **Kept it** / **Lost it**.
    Damage your temporary hit points absorb still counts.
  - Dropping to 0 HP, or becoming Incapacitated, Paralyzed, Petrified, Stunned or Unconscious,
    ends concentration. So does a rest.

## 2026-09-27 — Statuses named beside roll commands

### Changed
- **The text beside a roll command names your statuses.** For example, Krunk attacking while
  blessed shows "Greatsword attack (+1d4 Bless)", and while poisoned too "(+1d4 Bless,
  disadvantage from Poisoned)". Checks, saves, initiative, Grapple, Shove and spell attacks do
  the same, e.g. "Dexterity save (−2 Slowed)" or "Strength save (automatic failure:
  Paralyzed)". Damage already listed Enlarged and Reduced.

## 2026-09-27 — Status: conditions and magic on you

### Added
- **Status.** A new panel after Resources for conditions and magic that are on you. Click
  **Change** and pick what applies; it's shown as "Now: Poisoned, Bless" and also under the
  Combat Menu's move line. Hover a chip for its rules.
  - **Conditions** from the Player's Handbook (Blinded, Charmed, Deafened, Frightened, Grappled,
    Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned,
    Unconscious) and **Exhaustion** levels 1–6.
  - **Magic on you:** Bless, Bane, Guidance, Resistance, Bardic Inspiration (pick the die),
    Enlarge, Reduce, Haste, Slow, Heroism, Shield of Faith and Faerie Fire.
- **Statuses change your rolls.** Every attack, spell attack, check, save and initiative roll
  uses them, and the popup lists what changed:
  - Advantage and disadvantage from statuses (e.g. Poisoned, Invisible, Restrained on Dex saves,
    Exhaustion) combine with the one you pick, and cancel out per the 2014 rules.
  - Dice are added to the command: Bless `+1d4`, Bane `-1d4`, Guidance on checks, Resistance on
    saves, Enlarge `+1d4` weapon damage (doubled on a crit), Reduce `-1d4`. Slow takes 2 off
    Dexterity saves.
  - Paralyzed, Petrified, Stunned and Unconscious say you automatically fail Strength and
    Dexterity saves.
  - One-use buffs (Guidance, Resistance, Bardic Inspiration) have a button to remove them once
    used; Bardic Inspiration gives its `!tk 1d8`-style command to add after the roll.
- **Statuses change your speed, HP and AC too.** Grappled, Restrained, Paralyzed and Exhaustion 5
  make your speed 0, Exhaustion 2 and Slow halve it and Haste doubles it (the move line says
  why). Exhaustion 4 halves your hit point maximum. Haste and Shield of Faith add 2 to the AC
  box and Slow takes 2 off. Incapacitating conditions warn that you can't take actions.
- A long rest ends magic on you and lowers Exhaustion by 1. Conditions stay until you clear them.

## 2026-09-27 — Short Rest asks about Hit Dice

### Changed
- **Short Rest asks about Hit Dice.** Clicking Short Rest now opens the Hit Dice panel ready to
  spend (and says how many you have left), or tells you there's no need at full HP or that you
  have none left. Wizards are also reminded they can use Arcane Recovery.

## 2026-09-27 — Hit Dice and temporary hit points

### Added
- **Hit Dice** in Resources: one per level, sized by your class (d10 for Krunk, d8 for Venthor
  and Bel, d6 for Ezlo). Click **Spend** on a short rest, pick how many, and copy the command,
  e.g. `!tk 2d10+4` (the die plus your Constitution modifier, each). Enter the total you rolled
  and **Spend and add HP** marks them used and heals you, with an Undo.
  - A long rest gives back half your total Hit Dice (at least 1), per the 2014 rules.
  - **Durable** sets each die's minimum in the command, and **Song of Rest** (Bel) is noted.
- **Temporary hit points.** A **Temp HP** button beside Damage and Heal sets them from the amount
  box, and they show next to your HP (and in Character Summary). They don't stack: you keep the
  higher amount. **Damage uses them up first**, and a long rest clears them. Click the × to
  clear them yourself.
  - **False Life** asks for the total you rolled and sets them.
  - **Inspiring Leader** can give them to you too.

## 2026-09-27 — Initiative, death saves and healing yourself

### Added
- **Roll Initiative** in the Combat Menu's Anytime row: your initiative (Alert included) with
  Advantage / Normal / Disadvantage gives the `!tk` command. Rolling starts a **round counter**
  under the move line with **Start of my turn** and **End combat**.
  - **Start of my turn** moves to the next round, resets Dash, and counts down effects that
    last a while (1 minute is 10 rounds). The active effect shows how many rounds are left,
    and it ends with a message when time's up, e.g. "Ended: Divine Favor (1 minute)".
  - A rest ends combat too.
- **Death saves.** At 0 HP, a **Dying** box in Resources shows three success and three failure
  marks and the `!tk 1d20` command. After you roll, click what happened: 10 or higher,
  9 or lower, a natural 20 (back up with 1 HP) or a natural 1 (two failures). **Took damage**
  adds a failure (two for a critical hit). Three successes: stable. Three failures: dead.
  Click a mark to fix it, and there's an Undo. Any healing clears the death saves.
  - **Relentless Endurance** (Krunk): when you drop to 0 HP, a button takes you to 1 HP
    instead, once per long rest.
- **Healing yourself.** Healing spells like Cure Wounds and Healing Word ask "Healed yourself?
  Enter the total" and add it to your HP. **Lay on Hands** has a **Heal myself** button that
  spends from the pool and heals you. Both have an Undo.

## 2026-09-27 — Character Summary on phones

### Fixed
- **Character Summary fits on phones.** The six ability boxes stay in one row of tall, narrow
  cards with tighter spacing, and the summary fields stay inside the screen. Before, Charisma
  and the right-hand column ran off the edge.

### Changed
- "Senses / Passive Perc." in Character Summary is now just **Passive Perception**.
- **Character Summary's boxes fill neat rows** at any screen size. The Character Name box
  takes as much of its row as leaves the other boxes in full rows. On a phone it sits beside
  Level, so Spell Attack is no longer left on a row by itself. Every box is the same height,
  and boxes in a row line up even when a label wraps to two lines.

## 2026-09-27 — Active effects and target toggles

### Added
- **Active effects.** Effects that change your own attacks are added to the Attack popup for
  you while they last: Searing, Thunderous and Wrathful Smite, Divine Favor, Ensnaring Strike
  and Sacred Weapon. Casting or using one lists it under the Combat Menu's move line, e.g.
  "Sacred Weapon +2 to hit · 1 minute", with an **End** button.
  - Next-hit smites end when you copy the attack's damage (it hit).
  - Casting another concentration spell ends the one you were concentrating on.
  - A short or long rest clears them all. Undo on the spell slot or use puts them back.
  - Each one is a toggle in the Attack popup, so you can untick it for an attack it doesn't
    cover. Extra dice double on a crit.
- **Target effects are your call.** Effects on a creature, like Hunter's Mark and Vow of Enmity,
  aren't added automatically, since Turnkeeper can't know what you're attacking. If you have one
  prepared, the Attack popup shows an unticked **Hunter's Mark target** / **Vow of Enmity
  target** toggle; tick it when you attack that creature. Vow of Enmity's advantage cancels
  disadvantage, per the rules.

## 2026-09-27 — Reactions

### Added
- **Reactions** in the Combat Menu's Anytime row, beside Checks & Saves. It lists whatever your
  character can do with a reaction, from their own sheet and choices, so it works for any class:
  - **Opportunity Attack** with any melee weapon on your sheet, through the same popup as
    Attack (crits, Divine Smite, Sneak Attack, Great Weapon Master and so on).
  - **Reaction features and feats**, e.g. Uncanny Dodge, Cutting Words, Sentinel, War Caster,
    and the Protection fighting style if you picked it.
  - **Reaction spells** you can cast, e.g. Shield or a tiefling's Hellish Rebuke. Casting one
    uses the slot or racial use, just like Cast Prepared Spell.

### Changed
- Reaction spells are no longer dimmed in Cast Prepared Spell. They're in Reactions now, like
  bonus action spells are in Bonus Action Options.

## 2026-09-26 — Checks & Saves and a Subclass box

### Added
- **Checks & Saves** in the Combat Menu's new **Anytime** row, for whenever the DM asks for a
  roll. Pick **Skill check**, **Ability check** or **Saving throw**, then the skill or ability
  (each shows its modifier), then Advantage, Normal or Disadvantage, and **Roll** gives the
  `!tk` command to copy, e.g. `!tk 1d20+5 adv`.
  - **Jack of All Trades** (Bel) is added to plain ability checks, like a Strength check. Her
    sheet's skills already include it.
  - **Reliable Talent** adds `mi10` to skill checks you're proficient in, as Hide and Search
    already do.
  - **Aura of Protection** (Krunk, from level 6) adds his Charisma modifier to every save.
  - **Reminders** about advantage and disadvantage show before you pick how to roll, e.g.
    Fey Ancestry on saves against being charmed, War Caster on concentration saves, Supreme
    Sneak on Stealth and Sunlight Sensitivity on Perception. The popup also reminds you of
    Lucky and Portent.
  - Opening Checks & Saves doesn't cancel Dash, since it isn't part of your turn.

### Changed
- **Class and Subclass have their own boxes** in Character Summary. The Class box shows just
  the class, e.g. "Paladin". Subclass starts as whatever the sheet lists before the class, e.g.
  "Vengeance" from "Vengeance Paladin". Once you pick a subclass in Class Features or the
  choices box, it shows that one. It shows "—" if the sheet doesn't name a subclass.

## 2026-09-24 — Krunk's glowing sword

### Changed
- **Krunk's greatsword glows** on his hub card: the blade lights up, flares and pulses, and a
  shine runs down it to the tip, like the flame in Ezlo's hand.

## 2026-09-24 — !tk rolls and Keep as the default theme

### Changed
- **Roll commands now use `!tk`** instead of `!r`, e.g. `!tk 1d20+5 adv`. `!tk` is our
  server's Avrae command: it rolls exactly like `!r`, and on a natural 1 or natural 20 it
  adds a title and a random GIF.
- **Keep is the default theme** on both the hub and the tracker, for anyone who hasn't picked
  one. Harbor, the original look, is still in the Theme menu, and any theme you pick is
  remembered.

## 2026-09-24 — Remembered character names

### Added
- **Character names are remembered.** The character sheet has no spot for the character's
  name, so the first time you import a sheet, Turnkeeper asks for it at the top of Character
  Summary. It's saved for that sheet in your browser, so refreshing or re-importing fills it
  in. Opening a character from the hub saves their name automatically. Click **Rename** next
  to Character Name to change it. The browser tab shows the name too, e.g. "Krunk ·
  Turnkeeper".

## 2026-09-24 — Hub card badges and order

### Changed
- On the hub's character cards, the race and class under each name (e.g. "Half-Orc
  Paladin") now sit on a metallic badge in the card's class colors, and the class tag in the
  top-left corner is gone.
- The hub lists the characters in alphabetical order: Bel, Ezlo, Krunk, Venthor.

## 2026-09-24 — Hub portrait cards, saved spells and a shared theme

### Added
- **Prepared spells are saved** per character in your browser, so the spells you tick are
  still ticked after a reload or when you come back later. Each character keeps their own.
- **Sections stay the way you left them.** Whichever sections you expand or collapse
  (Racial Traits, Class Features, Feats, Saving Throws, Skills, Attacks, Backup, Spells)
  stay that way after a reload.
- **One theme for both pages.** The character hub can change the theme too, and a theme
  picked on either page applies to both, including Tome's parchment and Inferno's embers. If
  the other page is open in another tab, it changes straight away.

### Changed
- **The theme picker is tucked away.** Instead of a row of swatches, both pages have a small
  **Theme** button at the bottom. Click it to open the list of themes; click outside it or
  press Escape to close it.
- **Back to the hub:** click the Turnkeeper logo or name at the top of the tracker to return
  to the character list.
- **Character cards on the hub.** Each character is now a portrait card, like a trading card,
  in a frame that matches their class: gold for Krunk (Paladin), gunmetal for Venthor (Rogue),
  violet for Ezlo (Wizard), crimson and gold for Bel (Bard). Portraits are gray until you point
  at one; then it comes to color with a quick effect for that class:
  - **Krunk:** a flash of radiant light off his sword, the shock of the swing, rising embers.
  - **Venthor:** shadows close in, smoke rises, and a flash of steel cuts across the card.
  - **Ezlo:** the flame in his hand flares, a rune circle turns around it and sparks fly.
  - **Bel:** candlelight warms up, she tips her ale for a "cheers", the mug glints, bubbles
    rise out of her ale and music notes drift up.
  The card you point at comes forward while the others dim back. On phones and tablets, tap
  a card once to bring it forward and play its effect (a "Tap again to open" badge appears),
  then tap again to open the sheet; tap another card to switch, or anywhere else to put it
  back. No motion if your device is set to reduce motion.

## 2026-09-24 — Color themes

### Added
- **Color themes.** Swatches at the bottom of the page switch the look; your pick is saved in
  your browser. **Harbor** (the original look) stays the default. The others are
  **Midnight** (violet and gold), **Grove** (forest green and amber), **Ember** (charcoal,
  crimson and brass), **Daylight** (a light theme) and **Tome**, an old adventurer's book
  with parchment pages, deep red ink and book lettering. **Keep** is a medieval hall: oak
  panels in riveted iron frames on walnut planks, with brass headings and copper buttons.
  **Inferno** is fire and brimstone: a lava glow with drifting embers, blood dripping from
  charred-stone panels, a skull with glowing eyes on every heading, and blood-drop charges.
  The embers hold still if your device is set to reduce motion.

## 2026-09-24 — Feats and ability score improvements

### Added
- **Feats section** below Class Features, laid out by level: at each Ability Score
  Improvement level (4, 8, 12, 16 and 19; Fighters also get 6 and 14, Rogues 10) choose
  **+2 ability score points** (+2 to one score or +1 to two) or **a feat** from all 42
  Player's Handbook feats, each shown with its description and prerequisite (flagged if your
  sheet's score is too low). Levels fill in order, and an empty level you've reached shows at
  the top of Character Summary until you choose, like Fighting Style. Click **Change** to swap
  a choice. Feats pin like other features, and everything is saved per character.
  - **Great Weapon Master** (heavy melee weapons) and **Sharpshooter** (ranged weapons): a
    "−5 to hit / +10 damage" toggle in the Attack step, before you roll.
  - **Savage Attacker:** a toggle in the attack popup that rolls the weapon dice twice and
    keeps the higher, e.g. `!r (2d6,2d6)kh1+3`.
  - **Elemental Adept:** pick your element in the Build box; that damage gets `mi2`
    (1s count as 2s) in spell commands.
  - **Lucky** (3 luck points) and **Martial Adept** (superiority die, with your maneuver DC)
    are tracked in Resources; **Magic Initiate**'s free spell too.
  - **Healer**, **Grappler**, **Inspiring Leader** and **Polearm Master** give their rolls or
    numbers; bonus-action and action feats appear in the Combat Menu.
  - **Observant** adds +5 to Senses / Passive Perception.
- **Ability Score Improvements and feats change your numbers.** The points you choose, and
  the +1 from feats like Actor, Athlete or Resilient, are added to the ability scores shown
  (in orange; hover for where they came from, capped at 20) and to everything worked out
  from them: modifiers, skills, saving throws, weapon to-hit and damage, initiative, hit
  points, passive Perception, spell save DC and spell attack. Resilient also makes you
  proficient in that ability's saving throws, Alert adds +5 initiative, Mobile +10 ft speed
  and Tough +2 hit points per level. Feats that let you pick the ability ask at the top of
  Character Summary. Don't also add these on your sheet, or they'll count twice.

### Changed
- Choices for levels your character hasn't reached are cleared when the sheet loads. For
  example, if your sheet goes back from level 13 to 2, the feats or ability points chosen at
  levels 4 and 8, and a subclass chosen at level 3, are removed.
- The text beside a damage command now names everything the command includes, not just the
  damage type, e.g. "Greatsword damage (slashing), +10 Great Weapon Master, +2d8 Divine
  Smite (radiant)". Covers Dueling, Great Weapon Fighting, Savage Attacks, Savage Attacker,
  Sneak Attack, Divine Smite, Improved Divine Smite, Empowered Evocation and Elemental Adept.

## 2026-09-24 — Wizard, Bard, PHB-only spells and Backup

### Added
- **Wizard class features** (all eight PHB schools). The Arcane Tradition choice shows in the
  Build box at level 2. Arcane Recovery is tracked in Resources and tells you how many slot
  levels to recover. School features are tracked where they have uses (Arcane Ward pool,
  Portent dice, The Third Eye, Illusory Self…). **Empowered Evocation** adds your
  Intelligence to evocation spell damage, and **Potent Cantrip** is noted on save cantrips.
- **Bard class features** (Colleges of Lore and Valor). **Bardic Inspiration** is tracked
  (Charisma modifier uses, back on a short rest from level 5) and gives the command for the
  inspired creature's die (d6, d8, d10, d12). Cutting Words and Peerless Skill spend it too.
  Song of Rest gives its extra-healing roll.
- Features with dice but no combat action (Song of Rest, Portent, Arcane Recovery) have a
  **Roll** link in Class Features.
- **Backup** for your HP, spell slots and feature charges, a collapsible section in
  Resources, to keep somewhere safe (like a Google Doc) or move to a different browser:
  - **Back up to .txt** downloads a backup file; **Restore from .txt** loads one.
  - **Copy/Restore From Clipboard** opens one box holding your backup (readable lines plus a
    restore code): **Copy** copies it, **Clear** empties the box so you can paste a backup
    in, and **Restore** restores from what's in the box.
  - It asks first if a backup is for a different character, and has an Undo. Only things
    that change between rests are included.

### Changed
- **Advantage and disadvantage use Avrae's own words.** Commands now read like
  `!r 1d20+5 adv` or `!r 1d20+5 dis`, as Avrae's `!roll` help shows, instead of
  spelling out the dice math.
- **Spells are now Player's Handbook only.** The Wizard, Bard and Paladin spell lists match
  the PHB class lists exactly; spells from later books (Xanathar's, Tasha's, and others) and
  Tasha's optional class additions have been removed everywhere, including roll commands.

## 2026-09-24 — New address

### Changed
- The site moved to **justinthuffman.github.io/turnkeeper/**, and the tracker page is now
  `turnkeeper.html` (it was `dnd_tracker.html`). Old links no longer work; use the new one.

## 2026-09-24 — Build box and Rogue

### Added
- **Choices you can't miss.** A box at the top of Character Summary shows choices your
  character still needs to make (e.g. Fighting Style) with the options right there. Once
  picked, they show as "Always on" tags; click one to change it. The attack popup also warns
  when a Fighting Style hasn't been picked.
- **Rogue class features** (Thief, Assassin, Arcane Trickster):
  - **Sneak Attack** in the attack popup for finesse and ranged weapons, chosen after you hit
    (doubled on a crit).
  - **Cunning Action** in Bonus Action Options: Dash (adds your speed again), Disengage, or
    Hide (Stealth roll).
  - **Reliable Talent** at level 11 adds `mi10` to proficient checks, so a roll of 9 or lower
    counts as 10.
  - Arcane Tricksters get Intelligence spellcasting and their own spell slots.

## 2026-09-24 — Turnkeeper and resource tracking

### Changed
- The tracker is now called **Turnkeeper**, with its own hourglass logo in the header and
  browser tab (replacing the borrowed D&D tab icon on both pages).

### Added
- **Resources section** (between Character Summary and the Combat Menu):
  - **Hit points** with Damage and Heal buttons for manual adjustments, and "Reset to sheet".
  - **Spell slots** as dots per level, from the class tables. Click a dot to use or restore it.
  - **Limited-use features:** Channel Divinity, Divine Sense, the Lay on Hands pool, Relentless
    Endurance, and racial spells like Hellish Rebuke (once per long rest).
  - **Short Rest** and **Long Rest** buttons, each with an Undo. A long rest also restores HP.
  - Everything is saved per character in your browser.
- **The roll popups use your resources automatically:** casting a leveled spell uses a slot,
  Divine Smite uses the slot you pick (picking None gives it back), and features use their
  charges. Each shows how many are left, with Undo, and warns you when none are left.
  Lay on Hands can be spent from its popup.

## 2026-09-24 — Version 2 begins: roll commands

### Fixed
- Prepared spells no longer carry over when you import a different character.

### Added
- **Attack roll commands.** In the Combat Menu, Attack → pick a weapon, Grapple or Shove →
  Advantage / Normal / Disadvantage → **Roll**. A popup shows the Avrae commands to copy
  and paste into Discord, e.g. `!r 1d20+5` to hit and `!r 2d6ro<3+3` for damage. Only the
  command is in the copy box; what it's for ("Greatsword attack") is shown beside it.
  - Great Weapon Fighting and Dueling are applied automatically from your Fighting Style.
  - Following the rules, **Crit** and **Divine Smite** are chosen in the popup after you see
    the roll. A crit doubles all damage dice (plus Savage Attacks for Half-Orcs). Smite
    lets you pick the slot level and whether the target is undead or a fiend.
  - Grapple and Shove give an Athletics check.
- **Spell roll commands.** Cast Prepared Spell → pick a spell → spell slot level (→ Advantage /
  Normal / Disadvantage for spell attacks) → **Cast**. The popup gives the spell attack
  command, the save DC to tell your DM (e.g. "DC 13 Dexterity save, half damage on a
  success"), and damage, healing or hit point pool commands, all scaled for the slot level
  and, for cantrips, your character level. Spell crits are chosen after the roll.
  - Smite spells, Hunter's Mark and Divine Favor show the extra damage to add to your hit.
  - Spells that don't roll say so. Covers every cantrip and 1st-level spell on the class
    lists plus racial and Oath spells; higher-level spells are coming.
- **Bonus Action Options** follow the same path to a roll:
  - **Two-Weapon Fighting:** pick your off-hand light melee weapon → roll mode → Roll. Damage
    leaves out your ability modifier (unless it's negative), per the rule.
  - Bonus-action class features (e.g. Vow of Enmity) and bonus-action spells (e.g. Healing
    Word, the smites, Hunter's Mark). Bonus-action spells no longer appear under Cast
    Prepared Spell.
- **Class Features** follow the same path: pick a feature → **Use**. The popup gives the
  save DC for Channel Divinity options, your Lay on Hands pool, or says no roll is needed.
- **Dash updates your movement:** "Move up to 60 feet (30 + 30 from Dash)". It stays on if
  you open Bonus Action Options, and turns off when you pick another action or click Dash
  again.
- **Hide and Search roll commands.** Hide gives a Stealth check; Search lets you pick
  Perception or Investigation. Both have Advantage / Normal / Disadvantage.
  - Close the popup by clicking outside it, pressing Escape, or the ×.

## 2026-09-24

### Added
- **Spell Save DC and Spell Attack** in the Character Summary, calculated from your class's
  spellcasting ability, ability score and level. Hover over either number to see the math.
  Shows "—" for classes that don't cast spells (and for Paladins before level 2).
- **Pin skills and saving throws.** Click a skill or saving throw to pin it; it turns
  orange (dimmed orange if you're not proficient in it). Pinned ones stay visible when their section is collapsed, and are saved per
  character in your browser. Click again to unpin.
- **Attacks** now match the other sections: tick an attack to pin it so it stays visible
  when collapsed, laid out as "Greatsword — +5 to hit · 2d6+3 slashing · …".
- **Select all / Select none** in Racial Traits, Class Features, Saving Throws, Skills,
  Attacks and Spells, plus a master **Select all / Select none** at the top of Character
  Summary that pins or clears everything on the sheet at once (prepared spells aren't
  affected). In Class Features, "Select all" only pins features you've reached at your
  current level.
- Racial and class spell tooltips now include that spell's save DC and attack bonus. For
  example, a Drow wizard's Drow Magic spells use Charisma, not Intelligence.

### Changed
- Everything that expands or collapses now slides open and closed smoothly, and pinned
  items fade in. Turned off automatically if your device is set to reduce motion.
- Combat Menu: clicking the same button again closes its panel. Bonus Action Options now
  highlights while open, like the Action buttons.
- Picking a Fighting Style now pins Fighting Style automatically. When pinned, it shows
  as one line, e.g. "Fighting Style: Great Weapon Fighting — …".
- Cast Prepared Spell no longer says "No spells prepared yet" when you have
  always-prepared spells listed there.

## 2026-09-23

### Added
- **Racial Traits section** below the ability scores. It lists every trait for your race
  in alphabetical order. Tick a trait to pin it so it stays visible when the section is
  collapsed. Covers Half-Orc, Wood Elf, Drow and Tiefling.
- **Class Features section.** Lists your class features in level order, with a picker for
  your subclass. Paladin is done, with all three Oaths (Devotion, Ancients, Vengeance).
  Fighting Style lets you tick the one style you chose.
- **Level-aware display.** Traits, features and spells above your current level are
  dimmed and marked with the level they unlock at, so you can plan ahead.
- **Always Prepared spells** at the top of the Spells list. Spells granted by your race
  (e.g. Thaumaturgy) or class (e.g. Oath spells) are marked with a Racial or Class tag and
  don't need a tick box. Once unlocked, they also appear in Cast Prepared Spell and, for
  bonus action spells, Bonus Action Options.
- **Class features in the Combat Menu.** A new Class Features button in the Action row
  lists features you can use as an Action, e.g. Divine Sense and Lay on Hands. Bonus action
  features like Vow of Enmity appear in Bonus Action Options. They look and work like
  spells: hover for details, click for the full description.
- Hover tooltips for every spell granted by a trait or feature.
- Pins, your subclass and your Fighting Style are **saved in your browser** per character,
  so they're still there next time you open the page on the same device.

### Changed
- Saving Throw Proficiencies, Skill Proficiencies and Attacks are now collapsible.
- Removed the "offline · nothing is saved between sessions" tag from the header.

## 2026-09-22

### Added
- Note in the Spells section explaining that you tick spells to prepare them.
- Note at the top of the Combat Menu: the steps of your turn can be done in any order,
  and movement can be split.

### Fixed
- Attack bonuses no longer show a doubled "+" (e.g. "++2").
- Imported damage text is easier to read, e.g. "1d8 bludgeoning · Simple Melee Weapon
  Attack" instead of "1d8[bludgeoning]|Simple Melee Weapon Attack".

## 2026-09-22 — First release

- **Campaign hub page** (`index.html`) with a link for each character: Krunk, Venthor,
  Ezlo and Bel.
- **Character tracker** that imports from each player's Google Sheet:
  - Character Summary: level, race, class, AC, HP, initiative, speed, passive
    Perception, ability scores, saving throw and skill proficiencies, attacks
  - Combat Menu: movement, the standard actions, attacks, casting prepared spells,
    bonus action options
  - Spells: class spell lists for Wizard, Paladin and Bard, with hover
    details and tick boxes to prepare spells
  - "Show raw sheet cells" tool for troubleshooting imports
