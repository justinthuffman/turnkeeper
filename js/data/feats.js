/* Moved from turnkeeper.html (refactor stage 2). */
/* ---------- Feats (2014 PHB), checked on dnd5e.wikidot.com and paraphrased ----------
   The player adds the feats their character has; they're saved per character. Feats use the
   same hooks as class features (type, uses, roll/rolls, choose/tiers, tip). Ability score
   increases, proficiencies, HP and initiative bonuses are already on the player's sheet. */
const abilityScore = a=>parseInt(document.getElementById('s_'+a).value,10) || 10;
const needs = (a, n)=>()=>abilityScore(a) >= n;
const HEAVY_WEAPONS = /\b(glaive|greataxe|greatsword|halberd|maul|pike|heavy crossbow|longbow)\b/i;
const POLEARMS = /\b(glaive|halberd|quarterstaff|spear)\b/i;
function polearmAttack(){ return state.attacks.find(a=>POLEARMS.test(a.name)); }
const FEATS = [
  {name:'Actor', asi:{cha:1}, desc:'+1 Charisma. Advantage on Deception and Performance checks when passing yourself off as someone else, and you can mimic someone’s speech or sounds (a listener can spot it with Wisdom (Insight) against your Charisma (Deception)).'},
  {name:'Alert', desc:'+5 to initiative (Turnkeeper adds it). You can’t be surprised while conscious, and hidden attackers don’t get advantage against you.'},
  {name:'Athlete', asiPick:['str','dex'], desc:'+1 Strength or Dexterity. Standing up from prone costs only 5 ft of movement, climbing doesn’t cost extra movement, and a running jump needs only a 5 ft run-up.'},
  {name:'Charger', type:'bonus', tip:'Use Attack → your weapon (or Shove) for the roll, and add <b>+5</b> to the damage if you moved at least 10 ft in a straight line first.', desc:'When you take the Dash action, you can make one melee weapon attack or shove as a bonus action. If you moved at least 10 ft in a straight line first, the attack gets +5 damage or the shove pushes 10 ft.'},
  {name:'Crossbow Expert', type:'bonus', tip:'Use Attack → your hand crossbow for the roll.', desc:'Ignore the loading property of crossbows you’re proficient with. Being within 5 ft of an enemy doesn’t give you disadvantage on ranged attacks. When you attack with a one-handed weapon as part of the Attack action, you can attack with a hand crossbow as a bonus action.'},
  {name:'Defensive Duelist', prereq:'Dexterity 13', meets:needs('dex',13), type:'reaction', desc:'While wielding a finesse weapon you’re proficient with, when a melee attack would hit you, add your proficiency bonus to your AC for that attack.'},
  {name:'Dual Wielder', desc:'+1 AC while wielding a separate melee weapon in each hand. Two-Weapon Fighting works with one-handed melee weapons that aren’t light, and you can draw or stow two one-handed weapons at once.'},
  {name:'Dungeon Delver', desc:'Advantage on Perception and Investigation checks to find secret doors, and on saves against traps. Resistance to trap damage. You can search for traps while traveling at a normal pace.'},
  {name:'Durable', asi:{con:1}, desc:'+1 Constitution. When you roll a Hit Die to regain hit points, you regain at least twice your Constitution modifier (minimum 2).'},
  {name:'Elemental Adept', prereq:'Can cast at least one spell', choose:true, desc:'Pick a damage type. Your spells ignore resistance to it, and when you roll damage of that type, 1s count as 2s. Turnkeeper rolls it that way for you.',
    tiers:['Acid','Cold','Fire','Lightning','Thunder'].map(n=>({level:1, name:n, text:`Your spells ignore resistance to ${n.toLowerCase()} damage; 1s on its damage dice count as 2s.`}))},
  {name:'Grappler', prereq:'Strength 13', meets:needs('str',13), type:'action',
    roll:{label:'Pin (Athletics, contested)', cmd:()=>d20Cmd('normal', skillMod('Athletics')), desc:()=>'Grappler: pin the creature you’re grappling'},
    desc:'Advantage on attack rolls against a creature you’re grappling. As an action, try to pin it with another grapple check: if you win, you and it are both restrained until the grapple ends.'},
  {name:'Great Weapon Master', type:'bonus', tip:'Use Attack → your weapon for the roll.', desc:'When you score a crit or drop a creature to 0 HP with a melee weapon, make one melee weapon attack as a bonus action. Before a melee attack with a heavy weapon you’re proficient with, you can take −5 to hit for +10 damage: Turnkeeper offers it in the Attack step.'},
  {name:'Healer', type:'action',
    roll:{label:'Healing', cmd:()=>`1d6+4`, desc:()=>'plus the creature’s maximum number of Hit Dice'},
    desc:'When you stabilize a creature with a healer’s kit, it also regains 1 HP. As an action, spend one use of a healer’s kit to restore 1d6 + 4 HP, plus the creature’s maximum number of Hit Dice. Each creature can benefit once per short or long rest.'},
  {name:'Heavily Armored', prereq:'Proficiency with medium armor', asi:{str:1}, desc:'+1 Strength. Proficiency with heavy armor.'},
  {name:'Heavy Armor Master', prereq:'Proficiency with heavy armor', asi:{str:1}, desc:'+1 Strength. While wearing heavy armor, nonmagical bludgeoning, piercing and slashing damage you take is reduced by 3.'},
  {name:'Inspiring Leader', prereq:'Charisma 13', meets:needs('cha',13),
    roll:{label:'Temporary hit points', info:()=>`Each creature gets <b>${Math.max(0, charLevel() + abilityScoreMod('cha'))} temporary hit points</b> (your level ${charLevel()} + Charisma modifier ${fmtMod(abilityScoreMod('cha'))}).`
      + ` <button type="button" class="flow-btn" data-temp-set="${Math.max(0, charLevel() + abilityScoreMod('cha'))}">Give them to myself too</button>` + (rollState.tempMsg ? `<div class="spent-line">${rollState.tempMsg}</div>` : '')},
    desc:'Spend 10 minutes inspiring up to six friendly creatures (you can include yourself) within 30 ft that can see or hear you. Each gains temporary hit points equal to your level + your Charisma modifier. A creature can benefit once per short or long rest.'},
  {name:'Keen Mind', asi:{int:1}, desc:'+1 Intelligence. You always know which way is north and the hours until sunrise or sunset, and can recall anything you’ve seen or heard in the past month.'},
  {name:'Lightly Armored', asiPick:['str','dex'], desc:'+1 Strength or Dexterity. Proficiency with light armor.'},
  {name:'Linguist', asi:{int:1}, desc:'+1 Intelligence. Learn three languages. You can write ciphers; others need an Intelligence check (DC your Intelligence score + proficiency bonus) to decode them without your help.'},
  {name:'Lucky', uses:{max:()=>3, recharge:'long'}, useDesc:'a luck point',
    roll:{label:'Your extra d20', cmd:()=>`1d20`, desc:()=>'pick which d20 counts'},
    desc:'Three luck points per long rest. After you roll an attack, ability check or saving throw (before the DM says the outcome), spend one to roll another d20 and choose which to use. When you’re attacked, spend one to roll a d20 and choose whether the attacker uses it or theirs.'},
  {name:'Mage Slayer', type:'reaction', desc:'When a creature within 5 ft casts a spell, make a melee weapon attack against it as a reaction. Creatures you damage have disadvantage on concentration saves, and you have advantage on saves against spells cast within 5 ft of you.'},
  {name:'Magic Initiate', uses:{max:()=>1, recharge:'long'}, useDesc:'your Magic Initiate spell',
    desc:'Learn two cantrips and one 1st-level spell from the bard, cleric, druid, sorcerer, warlock or wizard list. Cast the 1st-level spell once per long rest without a slot (track it in Resources). Your spellcasting ability for them depends on that class.'},
  {name:'Martial Adept', uses:{max:()=>1, recharge:'short'}, useDesc:'your superiority die',
    rolls:()=>[{label:'Superiority die', cmd:()=>`1d6`, desc:()=>'add to the maneuver'},
      {label:'Maneuver save DC', info:()=>{ const m = Math.max(abilityScoreMod('str'), abilityScoreMod('dex')); return `<b>DC ${8 + proficiencyBonus() + m}</b> (8 + proficiency ${fmtMod(proficiencyBonus())} + Strength or Dexterity ${fmtMod(m)}).`; }}],
    desc:'Learn two Battle Master maneuvers. You have one superiority die (d6) to fuel them, regained on a short or long rest. Maneuver save DC: 8 + proficiency bonus + Strength or Dexterity modifier.'},
  {name:'Medium Armor Master', prereq:'Proficiency with medium armor', desc:'Medium armor doesn’t give you disadvantage on Stealth checks, and you can add up to +3 Dexterity to AC in it instead of +2.'},
  {name:'Mobile', desc:'+10 ft speed (Turnkeeper adds it). Dashing ignores difficult terrain that turn. When you make a melee attack against a creature, it can’t make opportunity attacks against you for the rest of your turn.'},
  {name:'Moderately Armored', prereq:'Proficiency with light armor', asiPick:['str','dex'], desc:'+1 Strength or Dexterity. Proficiency with medium armor and shields.'},
  {name:'Mounted Combatant', desc:'While mounted: advantage on melee attacks against unmounted creatures smaller than your mount, you can make an attack targeting your mount target you instead, and your mount takes no damage on a successful Dexterity save for half (half on a failure).'},
  {name:'Observant', asiPick:['int','wis'], desc:'+1 Intelligence or Wisdom. You can read lips in a language you know. +5 to your passive Perception and passive Investigation: Turnkeeper adds it to Passive Perception.'},
  {name:'Polearm Master', type:'bonus',
    rolls:()=>{
      const a = polearmAttack(), p = a && parseWeaponDamage(a.damage);
      if(!a || !p) return [{label:'Butt end', info:()=>'No glaive, halberd, quarterstaff or spear found on your sheet.'}];
      const bonus = parseInt(String(a.bonus||'0').replace(/\s/g,''),10) || 0;
      return [{label:'To hit', cmd:()=>d20Cmd('normal', bonus), desc:()=>`${a.name} butt end attack`},
              {label:'Damage', cmd:()=>`1d4${p.mod ? fmtMod(p.mod) : ''}`, desc:()=>`${a.name} butt end damage (bludgeoning)`}];
    },
    desc:'When you take the Attack action with only a glaive, halberd, quarterstaff or spear, make a bonus action attack with its other end (1d4 bludgeoning). Creatures entering your reach with one of those (or a pike) provoke an opportunity attack.'},
  {name:'Resilient', asiPick:['str','dex','con','int','wis','cha'], desc:'+1 to one ability score, and proficiency in saving throws with that ability. Pick the ability at the top of Character Summary; Turnkeeper adds both.'},
  {name:'Ritual Caster', prereq:'Intelligence or Wisdom 13', meets:()=>abilityScore('int') >= 13 || abilityScore('wis') >= 13, desc:'You have a ritual book with two 1st-level ritual spells from one class’s list, and can cast them (and others you copy in) as rituals.'},
  {name:'Savage Attacker', desc:'Once per turn, when you roll damage for a melee weapon attack, you can reroll the weapon’s damage dice and use either total. Turnkeeper offers it in the attack popup.'},
  {name:'Sentinel', type:'reaction', desc:'Your opportunity attack hits reduce the target’s speed to 0 for the turn. Creatures provoke opportunity attacks from you even if they Disengage. When a creature within 5 ft attacks someone other than you, make a melee weapon attack against it as a reaction.'},
  {name:'Sharpshooter', desc:'No disadvantage at long range, and your ranged weapon attacks ignore half and three-quarters cover. Before an attack with a ranged weapon you’re proficient with, you can take −5 to hit for +10 damage: Turnkeeper offers it in the Attack step.'},
  {name:'Shield Master', type:'bonus', tip:'Use Attack → Shove for the roll.', desc:'When you take the Attack action, you can shove a creature within 5 ft with your shield as a bonus action. Add your shield’s AC bonus to Dexterity saves against effects that target only you, and on a successful Dexterity save for half damage you can take none instead (reaction).'},
  {name:'Skilled', desc:'Proficiency in any combination of three skills or tools.'},
  {name:'Skulker', prereq:'Dexterity 13', meets:needs('dex',13), desc:'You can try to hide when only lightly obscured. Missing with a ranged weapon attack while hidden doesn’t reveal you, and dim light doesn’t give you disadvantage on sight-based Perception checks.'},
  {name:'Spell Sniper', prereq:'Can cast at least one spell', desc:'Spells with attack rolls have double range, and your ranged spell attacks ignore half and three-quarters cover. Learn one attack-roll cantrip from any class’s list.'},
  {name:'Tavern Brawler', type:'bonus', asiPick:['str','con'], tip:'Use Attack → Grapple for the roll.', desc:'+1 Strength or Constitution. Proficiency with improvised weapons, your unarmed strike deals 1d4, and when you hit with an unarmed strike or improvised weapon you can try to grapple as a bonus action.'},
  {name:'Tough', desc:'Your hit point maximum increases by 2 per level (Turnkeeper adds it).'},
  {name:'War Caster', prereq:'Can cast at least one spell', type:'reaction', desc:'Advantage on Constitution saves to keep concentration. You can do somatic components with weapons or a shield in your hands. When a creature provokes an opportunity attack, you can cast a 1-action spell at it instead.'},
  {name:'Weapon Master', asiPick:['str','dex'], desc:'+1 Strength or Dexterity. Proficiency with four weapons of your choice.'},
].map(f=>({...f, feat:true, level:1}));
const FEAT_BY_NAME = Object.fromEntries(FEATS.map(f=>[f.name, f]));

// Feat slots: the levels a class gets an Ability Score Improvement, which can be a feat
// instead (2014 PHB: Fighters also get 6 and 14, Rogues 10). Each slot holds {feat:name} or
// {asi:{str:1, con:1}}, saved per character (with an in-memory copy if storage is blocked).
