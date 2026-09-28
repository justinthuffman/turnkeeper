# Turnkeeper

A character tracker for Dungeons & Dragons 5e, built to help new players take their turn.

**[Open Turnkeeper](https://justinthuffman.github.io/turnkeeper/)** · [What's new](CHANGELOG.md)

![The Crisis in Waterdeep hub, with a portrait card for each character](docs/hub.jpg)

Turnkeeper reads a character from the Google Sheets D&D character sheet (v2.1) and lays out
what that player needs at the table. It follows the 2014 rules, so it knows what the character
can do on their turn and hands them the dice command to paste into Discord, where
[Avrae](https://avrae.io) rolls it.

It's a static web page. There's no server, install, or login, and no API keys.

![Krunk, a level 2 Half-Orc Paladin, loaded into the tracker](docs/tracker.jpg)

## What it does

- **Imports from Google Sheets.** Share the sheet as "Anyone with the link can view" and paste
  its link. Turnkeeper reads it straight from Google, and the sheet stays the source of truth.
- **Walks you through your turn.** The Combat Menu lays out actions, bonus actions and
  reactions. Pick an attack, spell or feature and it gives you the roll command, with
  advantage, bonuses and damage already worked out.
- **Tracks what you use.** Hit points, temporary HP, spell slots, Hit Dice, class resources,
  Inspiration, death saves and concentration. Start of my turn and End my turn keep count of
  your reaction, attacks and once-per-turn features, and count down spells with a duration.
- **Knows the rules.** Conditions and magic on you (Bless, Haste, Poisoned…) change your
  rolls. Spell limits come from the Player's Handbook tables, including the wizard's
  spellbook.
- **Remembers your choices** in your browser: prepared spells, pinned skills, open sections
  and your color theme.
- **Works on phones** as well as computers.

## Using it

- **The party:** the [hub](https://justinthuffman.github.io/turnkeeper/) has a card for each
  character in our Crisis in Waterdeep campaign. Click one to open their tracker.
- **Your own character:** open
  [turnkeeper.html](https://justinthuffman.github.io/turnkeeper/turnkeeper.html), expand
  **Import from Google Sheet** at the bottom, and paste your sheet's link. You can also link
  to it directly with `turnkeeper.html?sheet=<sheet link>&name=<character name>`.
- **The DM:** the [DM Screen](https://justinthuffman.github.io/turnkeeper/dm.html), linked under
  the hub's cards, shows the campaign's party, runs initiative with SRD monster stat blocks,
  rates encounter difficulty, and keeps a rules reference and session notes.

Roll commands start with `!tk`, our Discord server's Avrae alias.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The campaign hub |
| `turnkeeper.html` | The tracker |
| `dm.html` | The DM Screen |
| `themes.css` | The color themes, shared by the tracker and DM Screen |
| `portraits/` | Character art for the hub cards |
| `CHANGELOG.md` | Every change, newest first |
| `docs/` | Screenshots for this README |
