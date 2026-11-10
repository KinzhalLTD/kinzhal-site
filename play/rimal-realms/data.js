// Rimal Realms — game data: buildings, troops, heroes, stages, research, quests, items.
'use strict';
const RES = ['grain', 'timber', 'stone', 'ore', 'gold'];
const RNAME = { grain: 'Grain', timber: 'Timber', stone: 'Stone', ore: 'Ore', gold: 'Dinars' };

/* ---------- buildings ---------- */
const BLD = {
  citadel:   { name: 'Citadel', desc: 'Heart of your realm. Its level caps every other building and unlocks new ones.', base: 24, cost: { grain: 500, timber: 500, stone: 400, ore: 120 }, max: 20, unlock: 1 },
  barracks:  { name: 'Barracks', desc: 'Trains spearmen, archers, camel riders and siege engines. Higher levels train larger batches.', base: 14, cost: { grain: 300, timber: 350, stone: 150 }, max: 20, unlock: 1 },
  mews:      { name: 'Falcon Mews', desc: 'Home of your heroes. Higher levels raise the hero level cap and let heroes lead bigger squads.', base: 14, cost: { grain: 250, timber: 300, stone: 200 }, max: 20, unlock: 1 },
  academy:   { name: 'House of Wisdom', desc: 'Research economy and military sciences.', base: 18, cost: { grain: 300, timber: 400, stone: 300, ore: 60 }, max: 20, unlock: 2 },
  infirmary: { name: 'Infirmary', desc: 'Wounded troops recover here instead of dying. Level raises capacity.', base: 14, cost: { grain: 300, timber: 250, stone: 250 }, max: 20, unlock: 2 },
  vault:     { name: 'Treasury Vault', desc: 'Keeps a share of each resource safe from raiders.', base: 16, cost: { timber: 300, stone: 450, ore: 80 }, max: 20, unlock: 3 },
  tower:     { name: 'Watchtower', desc: 'Warns of incoming raids earlier and reveals more about enemy armies.', base: 12, cost: { timber: 350, stone: 300 }, max: 20, unlock: 3 },
  wall:      { name: 'Sandstone Ramparts', desc: 'Strengthens the defence of every troop guarding your city.', base: 20, cost: { stone: 600, timber: 200, ore: 100 }, max: 20, unlock: 2 },
  embassy:   { name: 'House Embassy', desc: 'Your House members can help speed up building and research. More helps per level.', base: 14, cost: { grain: 300, timber: 300, stone: 300 }, max: 20, unlock: 4 },
  market:    { name: 'Spice Souq', desc: 'Earns Dinars from trade and lets you swap resources.', base: 16, cost: { grain: 400, timber: 400, stone: 200 }, max: 20, unlock: 5 },
  farm:      { name: 'Date Farm', desc: 'Produces Grain to feed your people and troops.', base: 6, cost: { timber: 120, stone: 60 }, max: 20, field: 'grain' },
  lumber:    { name: 'Palm Grove', desc: 'Produces Timber.', base: 6, cost: { grain: 120, stone: 60 }, max: 20, field: 'timber' },
  quarry:    { name: 'Sandstone Quarry', desc: 'Produces Stone.', base: 6, cost: { grain: 120, timber: 80 }, max: 20, field: 'stone' },
  mine:      { name: 'Copper Mine', desc: 'Produces Ore for weapons and armour.', base: 7, cost: { grain: 150, timber: 120 }, max: 20, field: 'ore' }
};
const INNER = { citadel: [500, 316], market: [500, 172], mews: [372, 226], embassy: [628, 226], barracks: [282, 300], academy: [718, 300], infirmary: [392, 372], vault: [608, 372], tower: [420, 448], wall: [500, 470] };
const FIELD_POS = [[86, 110], [228, 92], [370, 64], [640, 66], [760, 96], [70, 420], [166, 470], [262, 522], [356, 576], [104, 572], [212, 640], [646, 570], [742, 520], [840, 466], [930, 414], [810, 620]];
const FIELD_TYPES = ['farm', 'lumber', 'quarry', 'mine'];

/* ---------- troops ---------- */
const TROOP = {
  inf: { name: 'Spearmen', role: 'Infantry · strong vs riders', atk: 10, def: 13, hp: 32, load: 10, cost: { grain: 30, timber: 20, ore: 4 } },
  rng: { name: 'Dune Archers', role: 'Ranged · strong vs spearmen', atk: 14, def: 7, hp: 20, load: 8, cost: { grain: 30, timber: 30, stone: 4 } },
  cav: { name: 'Camel Riders', role: 'Cavalry · strong vs archers', atk: 12, def: 10, hp: 27, load: 14, cost: { grain: 40, stone: 15, ore: 10 } },
  sie: { name: 'Ballistae', role: 'Siege · breaks ramparts', atk: 18, def: 5, hp: 16, load: 5, cost: { timber: 50, stone: 30, ore: 12 } }
};
const TYPES = ['inf', 'rng', 'cav', 'sie'];
const TIERS = [1, 2, 3];
const TIER_MULT = [1, 1.9, 3.5];
const TIER_MIGHT = [2, 6, 16];
const TIER_TIME = [2, 6, 14];
const COUNTER = { inf: 'cav', cav: 'rng', rng: 'inf' };
const tkey = (t, tier) => t + tier;
const tparse = k => [k.slice(0, 3), +k.slice(3)];

/* ---------- heroes ---------- */
const HEROES = [
  { id: 'rania', name: 'Rania Sunarrow', title: 'Dune Archer', role: 'Ranged', hp: 520, atk: 70, def: 20, spd: 9,
    skill: { name: 'Sunburst Volley', kind: 'aoe', mult: 1.3, desc: 'Rains arrows on all foes for 130% ATK.' },
    look: { skin: '#c98f5e', bg: '#e8a33d', robe: '#7a2f2f', acc: '#2f7d8c', head: 'scarf', eye: '#2a1a10' } },
  { id: 'tariq', name: 'Tariq Ironveil', title: 'Gate Warden', role: 'Tank', hp: 980, atk: 42, def: 52, spd: 5,
    skill: { name: 'Bastion of Brass', kind: 'shield', mult: 0.5, desc: 'Halves all damage taken by the squad for 3 turns.' },
    look: { skin: '#a8714a', bg: '#5a6f86', robe: '#3a4656', acc: '#e8a33d', head: 'helm', eye: '#2a1a10', beard: '#2b2b2b' } },
  { id: 'noor', name: 'Noor Palmsong', title: 'Oasis Singer', role: 'Support', hp: 560, atk: 46, def: 26, spd: 8,
    skill: { name: 'Oasis Hymn', kind: 'heal', mult: 1.7, desc: 'Heals every ally for 170% ATK.' },
    look: { skin: '#d9a47a', bg: '#3fd7c8', robe: '#1c6f73', acc: '#f2ede4', head: 'scarf', eye: '#3a2414' } },
  { id: 'zayna', name: 'Zayna Stormcaller', title: 'Haboob Mystic', role: 'Mage', hp: 480, atk: 82, def: 16, spd: 7,
    skill: { name: 'Haboob', kind: 'stun', mult: 1.0, desc: 'A sandstorm hits all foes for 100% ATK and stuns them for a turn.' },
    look: { skin: '#b9825a', bg: '#9b7bff', robe: '#3c2a6b', acc: '#c9b8e8', head: 'hood', eye: '#7fe0ff' } },
  { id: 'barak', name: 'Barak Dunehorn', title: 'Camel Lord', role: 'Warrior', hp: 760, atk: 78, def: 34, spd: 7,
    skill: { name: 'Dune Charge', kind: 'single', mult: 3.0, desc: 'Charges the front foe for 300% ATK.' },
    look: { skin: '#9c6a44', bg: '#b3433a', robe: '#5a1f1f', acc: '#b3433a', head: 'keffiyeh', eye: '#2a1a10', beard: '#3a2414' } },
  { id: 'layla', name: 'Layla Nightveil', title: 'Kinzhal Blade', role: 'Assassin', hp: 500, atk: 92, def: 18, spd: 11,
    skill: { name: 'Kinzhal Strike', kind: 'crit', mult: 3.6, desc: 'Strikes the weakest foe for 360% ATK.' },
    look: { skin: '#c48a60', bg: '#2a1f3d', robe: '#1b1430', acc: '#3a2a55', head: 'hood', eye: '#ffd36b', mask: '#1b1430' } },
  { id: 'hakeem', name: 'Hakeem the Starwise', title: 'Royal Astronomer', role: 'Support', hp: 540, atk: 50, def: 24, spd: 6,
    skill: { name: 'Star Chart', kind: 'buff', mult: 0.4, desc: 'Raises squad ATK by 40% for 3 turns.' },
    look: { skin: '#b07a52', bg: '#1c6f73', robe: '#0d3640', acc: '#f2ede4', head: 'turban', eye: '#2a1a10', beard: '#d6d0c6' } },
  { id: 'omar', name: 'Omar Brassgear', title: 'Siege Artificer', role: 'Engineer', hp: 620, atk: 74, def: 28, spd: 6,
    skill: { name: 'Brass Barrage', kind: 'aoe', mult: 1.6, desc: 'Fires bolts at all foes for 160% ATK.' },
    look: { skin: '#a8714a', bg: '#d9822b', robe: '#5a3418', acc: '#9c5f2e', head: 'goggles', eye: '#2a1a10', beard: '#5a3418', mark: '#e8a33d' } },
  { id: 'saqr', name: 'Emira Saqr', title: 'Falcon Queen', role: 'Mage', hp: 600, atk: 96, def: 26, spd: 8,
    skill: { name: 'Talon Storm', kind: 'aoe', mult: 2.0, desc: 'A storm of falcons tears all foes for 200% ATK.' },
    look: { skin: '#c98f5e', bg: '#ffd36b', robe: '#7a4fb3', acc: '#e8a33d', head: 'crown', eye: '#2a1a10' } }
];
const HERO = Object.fromEntries(HEROES.map(h => [h.id, h]));
const STAR_SHARDS = [0, 10, 20, 40, 80, 150]; // shards to recruit (index 1) and to reach each next star

/* ---------- hero stages ---------- */
const FOES = {
  jackal:   { name: 'Sand Jackal', hp: 300, atk: 40, def: 10, spd: 9 },
  raider:   { name: 'Dune Raider', hp: 380, atk: 48, def: 16, spd: 7 },
  scorpion: { name: 'Brute Scorpion', hp: 560, atk: 38, def: 32, spd: 4 },
  wraith:   { name: 'Mirage Wraith', hp: 340, atk: 64, def: 12, spd: 8 },
  golem:    { name: 'Glass Golem', hp: 820, atk: 46, def: 46, spd: 3 },
  colossus: { name: 'Brass Colossus', hp: 1500, atk: 62, def: 44, spd: 4 }
};
const CHAPTERS = [
  { name: 'The Saltflat Road', foes: ['jackal', 'raider', 'scorpion'], boss: { kind: 'raider', name: 'Bandit Chief Ghul', hp: 2.4 } },
  { name: 'Whispering Dunes', foes: ['wraith', 'scorpion', 'raider'], boss: { kind: 'wraith', name: 'Queen of Mirages', hp: 2.6 } },
  { name: 'The Glass Canyon', foes: ['golem', 'wraith', 'jackal'], boss: { kind: 'colossus', name: 'The Brass Colossus', hp: 1.1 } },
  { name: 'Ashen Oasis', foes: ['golem', 'raider', 'wraith'], boss: { kind: 'colossus', name: 'Colossus Reforged', hp: 1.2 } }
];
const STAGE_SHARD = { '1-3': 'zayna', '1-6': 'barak', '2-3': 'layla', '2-6': 'hakeem', '3-3': 'omar', '3-6': 'saqr', '4-3': 'zayna', '4-6': 'saqr', '1-5': 'rania', '2-5': 'noor', '3-5': 'tariq', '4-5': 'layla' };

/* ---------- research ---------- */
const TECH = [
  { id: 'agri', name: 'Irrigation Canals', desc: '+8% Grain production', max: 8, eff: .08, tree: 'Economy' },
  { id: 'forest', name: 'Palm Cultivation', desc: '+8% Timber production', max: 8, eff: .08, tree: 'Economy' },
  { id: 'mason', name: 'Masonry', desc: '+8% Stone production', max: 8, eff: .08, tree: 'Economy' },
  { id: 'metal', name: 'Smelting', desc: '+8% Ore production', max: 8, eff: .08, tree: 'Economy' },
  { id: 'build', name: 'Architecture', desc: '+6% construction speed', max: 8, eff: .06, tree: 'Economy' },
  { id: 'gather', name: 'Pack Saddles', desc: '+10% gathering speed', max: 8, eff: .10, tree: 'Economy' },
  { id: 'drill', name: 'Drill Yards', desc: '+6% training speed', max: 8, eff: .06, tree: 'Military' },
  { id: 'blade', name: 'Damascene Blades', desc: '+5% troop ATK', max: 10, eff: .05, tree: 'Military' },
  { id: 'armor', name: 'Lamellar Armour', desc: '+5% troop DEF', max: 10, eff: .05, tree: 'Military' },
  { id: 'march', name: 'Caravan Routes', desc: '+8% march speed', max: 8, eff: .08, tree: 'Military' },
  { id: 'tier2', name: 'Veteran Drills', desc: 'Unlocks Tier II troops', max: 1, eff: 1, tree: 'Military', need: 3 },
  { id: 'tier3', name: 'Elite Drills', desc: 'Unlocks Tier III troops', max: 1, eff: 1, tree: 'Military', need: 8, req: 'tier2' },
  { id: 'slots', name: 'Banner Corps', desc: '+1 march slot', max: 2, eff: 1, tree: 'Military', need: 4 }
];
const TECHM = Object.fromEntries(TECH.map(t => [t.id, t]));

/* ---------- items ---------- */
const ITEMS = {
  sp5: { name: '5-min Hourglass', desc: 'Speeds up any timer by 5 minutes.', icon: 'clock', sec: 300, gems: 10 },
  sp60: { name: '1-hour Hourglass', desc: 'Speeds up any timer by 1 hour.', icon: 'clock', sec: 3600, gems: 90 },
  sp480: { name: '8-hour Hourglass', desc: 'Speeds up any timer by 8 hours.', icon: 'clock', sec: 28800, gems: 600 },
  shield: { name: 'Mirage Veil (8h)', desc: 'Hides your city from raids for 8 hours. Attacking breaks it.', icon: 'shield', gems: 250 },
  crate: { name: 'Caravan Crate', desc: 'Contains 5,000 of a random resource.', icon: 'crate', gems: 40 },
  scroll: { name: 'Hero Tome', desc: 'Gives 600 XP to a hero.', icon: 'scroll', gems: 30 },
  vigor: { name: 'Qahwa Flask', desc: 'Restores 30 Vigor.', icon: 'vigor', gems: 50 },
  builder: { name: 'Hired Mason (24h)', desc: 'A second builder for 24 hours.', icon: 'help', gems: 300 },
  gift: { name: 'House Gift', desc: 'A gift from your House. Open it for a surprise.', icon: 'chest', gems: 0 }
};

/* ---------- quests (a story chain) ---------- */
const QUESTS = [
  { t: 'Raise your Citadel to level 2', c: S => S.b.citadel >= 2, r: { gems: 20, grain: 1000, timber: 1000 } },
  { t: 'Plant a Date Farm in an empty field', c: S => S.fields.filter(f => f && f.t === 'farm').length >= 2, r: { timber: 800, stone: 500 } },
  { t: 'Train 30 Spearmen', c: S => S.stats.trained >= 30, r: { grain: 1500, items: { sp5: 2 } } },
  { t: 'Win Hero stage 1-1', c: S => !!S.stages['1-1'], r: { gems: 20, items: { scroll: 1 } } },
  { t: 'Build the House of Wisdom', c: S => S.b.academy >= 1, r: { ore: 400, gold: 1000 } },
  { t: 'Research Irrigation Canals', c: S => (S.tech.agri || 0) >= 1, r: { grain: 2000 } },
  { t: 'Gather from a resource site on the World map', c: S => S.stats.gathered > 0, r: { gems: 30, items: { crate: 1 } } },
  { t: 'Defeat a bandit camp', c: S => S.stats.camps >= 1, r: { gems: 30, items: { sp5: 3 } } },
  { t: 'Raise your Citadel to level 3', c: S => S.b.citadel >= 3, r: { gems: 40, items: { sp60: 1 } } },
  { t: 'Build the Infirmary', c: S => S.b.infirmary >= 1, r: { grain: 2000, timber: 2000 } },
  { t: 'Scout a rival lord', c: S => S.stats.scouts >= 1, r: { gold: 2000 } },
  { t: 'Win Hero stage 1-6', c: S => !!S.stages['1-6'], r: { gems: 50, items: { scroll: 2 } } },
  { t: 'Raise your Citadel to level 5', c: S => S.b.citadel >= 5, r: { gems: 60, items: { builder: 1 } } },
  { t: 'Train 300 troops in total', c: S => S.stats.trained >= 300, r: { items: { sp60: 1, crate: 2 } } },
  { t: 'Defeat a level 5 bandit camp', c: S => S.stats.campMax >= 5, r: { gems: 60, items: { gift: 2 } } },
  { t: 'Unlock Tier II troops', c: S => (S.tech.tier2 || 0) >= 1, r: { gems: 60, ore: 3000 } },
  { t: 'Win Hero stage 2-6', c: S => !!S.stages['2-6'], r: { gems: 80, items: { vigor: 2 } } },
  { t: 'Raise your Citadel to level 8', c: S => S.b.citadel >= 8, r: { gems: 100, items: { sp60: 3 } } },
  { t: 'Defeat a rival lord in battle', c: S => S.stats.rivals >= 1, r: { gems: 100, items: { shield: 1 } } },
  { t: 'Raise your Citadel to level 10', c: S => S.b.citadel >= 10, r: { gems: 150, items: { sp480: 1 } } },
  { t: 'Win Hero stage 3-6', c: S => !!S.stages['3-6'], r: { gems: 150 } },
  { t: 'Unlock Tier III troops', c: S => (S.tech.tier3 || 0) >= 1, r: { gems: 150, items: { crate: 5 } } },
  { t: 'Raise your Citadel to level 15', c: S => S.b.citadel >= 15, r: { gems: 300 } },
  { t: 'Capture the Oasis Throne', c: S => !!S.throne, r: { gems: 1000 } }
];

/* ---------- world ---------- */
const RIVALS = [
  ['Emir Qasim Redsand', '#b3433a'], ['Sultana Maysa', '#9b7bff'], ['Warden Idris', '#5a6f86'], ['Shaykha Reem Saltwind', '#3fd7c8'],
  ['Captain Zubair', '#ff8a3d'], ['Lord Fahad Ashfall', '#7e2f2f'], ['Lady Hessa Moonwell', '#c9b8e8'], ['Baron Mansour', '#2f7d8c'], ['The Brass Vizier', '#d9822b']
];
const HOUSE_NAMES = ['Ghazi', 'Salma', 'Yousef', 'Dana', 'Faris', 'Huda', 'Majid', 'Lama', 'Rashid', 'Asma', 'Nawaf', 'Mira'];
const HOUSE_CHAT = [
  'Who needs help? Tap the Embassy, I am online.', 'Bandit camps near the oasis are easy loot today.', 'Do not keep too many resources outside the vault!',
  'Emir Qasim is raiding again, raise your veils.', 'Tier II archers are worth it, trust me.', 'Nice work on the camps, everyone.',
  'Anyone tried the Glass Canyon stages yet?', 'Remember to claim the caravan chest.', 'One day we take the Oasis Throne together.', 'Helped everyone, back to farming dates.'
];
