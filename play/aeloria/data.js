// Aeloria: Age of Crowns — game data: realms, buildings, troops, heroes, story campaign, research, quests, items.
'use strict';
const GAME = { name: 'Aeloria', sub: 'Age of Crowns', nameAr: 'إيلوريا', subAr: 'عصر التيجان', saveKey: 'aeloria-save-v1' };
const RES = ['grain', 'timber', 'stone', 'ore', 'gold'];
const RNAME = { grain: 'Grain', timber: 'Timber', stone: 'Stone', ore: 'Iron', gold: 'Gold' };

/* ---------- the six realms of Aeloria ---------- */
// Each realm sets the look of your city, its trees and architecture, and gives a small bonus.
const REALMS = {
  greenhold: { name: 'Greenhold', title: 'Kingdom of Oak and Oath', desc: 'Rolling meadows, ancient oaks and the knightly orders who swear by them.', color: '#4f8a3c',
    ground: ['#9cc46a', '#6f9a48', '#4f7a34'], wall: '#d9d2c0', wall2: '#b3ab97', wall3: '#8a826e', roof: '#3d6fb3', cap: 'pitch', tree: 'oak', water: '#4aa3c9',
    bonus: { grain: .12 }, bonusText: '+12% Grain production' },
  frostmark: { name: 'Frostmark', title: 'Jarldoms of the Silent North', desc: 'Fjords, longhouses and rune-carved stone beneath the aurora.', color: '#5f8fbf',
    ground: ['#f2f6fb', '#d5e0ec', '#aebfd2'], wall: '#a8b3bf', wall2: '#86919e', wall3: '#5f6a77', roof: '#8a3a2a', cap: 'pitch', tree: 'pine', water: '#3a7fa8',
    bonus: { def: .06 }, bonusText: '+6% troop defence' },
  amber: { name: 'Amber Sultanate', title: 'Sultanates of Sun and Sand', desc: 'Domed cities, caravans and oases strung across golden dunes.', color: '#d9822b',
    ground: ['#f0d29c', '#dbb277', '#b98a52'], wall: '#e3c08a', wall2: '#c99e63', wall3: '#a87b45', roof: '#1c6f73', cap: 'dome', tree: 'palm', water: '#3fd7c8',
    bonus: { gold: .2 }, bonusText: '+20% Gold income' },
  jade: { name: 'Jade Dominion', title: 'Dominion of a Thousand Lanterns', desc: 'Terraced mountains, bamboo forests and scholars of wind and silk.', color: '#2f9c7a',
    ground: ['#a9c98a', '#7fa86a', '#5a8a55'], wall: '#efe4cc', wall2: '#cdbf9f', wall3: '#a3946f', roof: '#2a7a64', cap: 'pagoda', tree: 'bamboo', water: '#5ab7b0',
    bonus: { research: .12 }, bonusText: '+12% research speed' },
  coral: { name: 'Coral Isles', title: 'Free Isles of the Tidewalkers', desc: 'Island chiefdoms of navigators, reef-singers and great outrigger fleets.', color: '#1fb3c9',
    ground: ['#f5e2b4', '#e6c98d', '#c9a96a'], wall: '#f2ede4', wall2: '#d8cfbf', wall3: '#b0a58f', roof: '#b97a3e', cap: 'thatch', tree: 'palm', water: '#25c4d6',
    bonus: { march: .12 }, bonusText: '+12% march speed' },
  sunveldt: { name: 'Sunveldt', title: 'Kingdoms of the Golden Savanna', desc: 'Endless grasslands, lion riders and the forge-cities of the red earth.', color: '#c9902b',
    ground: ['#d9c070', '#b99b4f', '#8f7a3a'], wall: '#c98a5a', wall2: '#a86c42', wall3: '#7e4a2a', roof: '#5a3418', cap: 'cone', tree: 'acacia', water: '#4aa3a0',
    bonus: { train: .12 }, bonusText: '+12% training speed' }
};
const REALM_IDS = Object.keys(REALMS);

/* ---------- buildings ---------- */
const BLD = {
  citadel:   { name: 'Citadel', desc: 'Heart of your realm. Its level caps every other building and unlocks new ones.', base: 24, cost: { grain: 500, timber: 500, stone: 400, ore: 120 }, max: 20, unlock: 1 },
  barracks:  { name: 'Barracks', desc: 'Trains spearmen, archers, cavalry and siege engines. Higher levels train larger batches.', base: 14, cost: { grain: 300, timber: 350, stone: 150 }, max: 20, unlock: 1 },
  mews:      { name: 'Hall of Heroes', desc: 'Home of your heroes. Higher levels raise the hero level cap and let heroes lead bigger armies.', base: 14, cost: { grain: 250, timber: 300, stone: 200 }, max: 20, unlock: 1 },
  academy:   { name: 'Royal Academy', desc: 'Research economy and military sciences.', base: 18, cost: { grain: 300, timber: 400, stone: 300, ore: 60 }, max: 20, unlock: 2 },
  infirmary: { name: 'Infirmary', desc: 'Wounded troops recover here instead of dying. Level raises capacity.', base: 14, cost: { grain: 300, timber: 250, stone: 250 }, max: 20, unlock: 2 },
  vault:     { name: 'Treasury', desc: 'Keeps a share of each resource safe from raiders.', base: 16, cost: { timber: 300, stone: 450, ore: 80 }, max: 20, unlock: 3 },
  tower:     { name: 'Watchtower', desc: 'Warns of incoming raids earlier and reveals more about enemy armies.', base: 12, cost: { timber: 350, stone: 300 }, max: 20, unlock: 3 },
  wall:      { name: 'Ramparts', desc: 'Strengthens the defence of every troop guarding your city.', base: 20, cost: { stone: 600, timber: 200, ore: 100 }, max: 20, unlock: 2 },
  embassy:   { name: 'Alliance Embassy', desc: 'Your Alliance can help speed up building and research. More helps per level.', base: 14, cost: { grain: 300, timber: 300, stone: 300 }, max: 20, unlock: 4 },
  market:    { name: 'Grand Market', desc: 'Earns Gold from trade and lets you swap resources.', base: 16, cost: { grain: 400, timber: 400, stone: 200 }, max: 20, unlock: 5 },
  farm:      { name: 'Farm', desc: 'Produces Grain to feed your people and troops.', base: 6, cost: { timber: 120, stone: 60 }, max: 20, field: 'grain' },
  lumber:    { name: 'Lumber Mill', desc: 'Produces Timber.', base: 6, cost: { grain: 120, stone: 60 }, max: 20, field: 'timber' },
  quarry:    { name: 'Quarry', desc: 'Produces Stone.', base: 6, cost: { grain: 120, timber: 80 }, max: 20, field: 'stone' },
  mine:      { name: 'Iron Mine', desc: 'Produces Iron for weapons and armour.', base: 7, cost: { grain: 150, timber: 120 }, max: 20, field: 'ore' }
};
const INNER = { citadel: [500, 305], market: [500, 168], mews: [372, 218], embassy: [628, 218], barracks: [258, 292], academy: [742, 292], infirmary: [352, 368], vault: [648, 368], tower: [432, 432], wall: [568, 432] };
const FIELD_POS = [[70, 96], [214, 52], [664, 30], [790, 78], [330, 668], [70, 420], [166, 470], [262, 522], [356, 576], [104, 572], [212, 640], [646, 570], [742, 520], [840, 466], [930, 414], [810, 620], [-170, 640], [-40, 770], [130, 870], [560, 905], [730, 840], [1010, 800], [1180, 660], [1260, 150]];
const LANDMARKS = { arena: [-250, 350, 'Arena of Crowns'], bazaar: [1265, 440, 'Grand Bazaar'], forge: [1000, -120, 'Great Forge'], altar: [110, -140, 'Crown Altar'] };
const FIELD_TYPES = ['farm', 'lumber', 'quarry', 'mine'];

/* ---------- troops ---------- */
const TROOP = {
  inf: { name: 'Spearmen', role: 'Infantry · strong vs cavalry', atk: 10, def: 13, hp: 32, load: 10, cost: { grain: 30, timber: 20, ore: 4 } },
  rng: { name: 'Archers', role: 'Ranged · strong vs spearmen', atk: 14, def: 7, hp: 20, load: 8, cost: { grain: 30, timber: 30, stone: 4 } },
  cav: { name: 'Cavalry', role: 'Cavalry · strong vs archers', atk: 12, def: 10, hp: 27, load: 14, cost: { grain: 40, stone: 15, ore: 10 } },
  sie: { name: 'Trebuchets', role: 'Siege · breaks ramparts', atk: 18, def: 5, hp: 16, load: 5, cost: { timber: 50, stone: 30, ore: 12 } }
};
const TYPES = ['inf', 'rng', 'cav', 'sie'];
const TIERS = [1, 2, 3];
const TIER_MULT = [1, 1.9, 3.5];
const TIER_MIGHT = [2, 6, 16];
const TIER_TIME = [2, 6, 14];
const COUNTER = { inf: 'cav', cav: 'rng', rng: 'inf' };
const tkey = (t, tier) => t + tier;
const tparse = k => [k.slice(0, 3), +k.slice(3)];

/* ---------- heroes: thirteen champions from every corner of Aeloria ---------- */
// look: skin, hair (colour), hs (hair style), eye, head (headwear), beard, outfit (main/trim/metal), armor style, weapon, marks
const HEROES = [
  { id: 'astrid', name: 'Astrid Frostmane', title: 'Shieldmaiden of the North', realm: 'frostmark', role: 'Tank', rarity: 'rare', hp: 980, atk: 42, def: 52, spd: 5,
    skill: { name: 'Wall of Winter', kind: 'shield', mult: 0.5, desc: 'Raises a wall of ice: the squad takes half damage for 3 turns.' },
    bio: 'Youngest jarl-daughter of Frostmark, who held the Hrim Pass for nine days with forty shields. She does not retreat; she advances in a different direction.',
    look: { skin: '#f1d2bd', hair: '#e8c66a', hs: 'braids', eye: '#3f7fbf', head: 'wingedhelm', outfit: ['#3c5a7a', '#e8e0d0', '#b8c4d0'], armor: 'fur', weapon: 'axeshield', marks: '#3f7fbf' } },
  { id: 'sigrun', name: 'Sigrun Runeseer', title: 'Keeper of the Frozen Runes', realm: 'frostmark', role: 'Mage', rarity: 'epic', hp: 480, atk: 84, def: 16, spd: 7,
    skill: { name: 'Rune of Stillness', kind: 'stun', mult: 1.0, desc: 'Carves a rune of frost: hits all foes for 100% ATK and freezes them for a turn.' },
    bio: 'She has read the ice for seventy winters and remembers every name the Hollow King has stolen. The runes on her staff hum when ash is near.',
    look: { skin: '#ead0c0', hair: '#e6eef5', hs: 'long', eye: '#7fe0ff', head: 'hood', outfit: ['#2a3f5a', '#7fe0ff', '#c9d6e3'], armor: 'robe', weapon: 'runestaff', marks: '#7fe0ff', glow: '#7fe0ff' } },
  { id: 'aldric', name: 'Sir Aldric Valebrand', title: 'Knight-Commander of the Oak', realm: 'greenhold', role: 'Warrior', rarity: 'rare', hp: 780, atk: 76, def: 36, spd: 7,
    skill: { name: 'Oathkeeper\'s Judgement', kind: 'single', mult: 3.0, desc: 'A sworn strike on the front foe for 300% ATK.' },
    bio: 'Last knight of the burned Valewood order. He carries his grandmother\'s blade and a promise: no village will burn while he still stands.',
    look: { skin: '#7a4a2e', hair: '#1b120c', hs: 'short', eye: '#3a2414', head: 'none', beard: '#1b120c', outfit: ['#2f5a8a', '#e8c35a', '#c9d2dc'], armor: 'plate', weapon: 'sword' } },
  { id: 'elowen', name: 'Elowen Thornwhisper', title: 'Druid of the Old Oaks', realm: 'greenhold', role: 'Support', rarity: 'rare', hp: 560, atk: 48, def: 26, spd: 8,
    skill: { name: 'Bloom of Renewal', kind: 'heal', mult: 1.7, desc: 'The forest answers: heals every ally for 170% ATK.' },
    bio: 'Raised by the oldest oak in Greenhold, Elowen speaks to roots and rain. She is gentle with everyone except those who set forests on fire.',
    look: { skin: '#f3d6c4', hair: '#c4542e', hs: 'wavy', eye: '#3e8a4a', head: 'leafcrown', outfit: ['#3e6b3a', '#d9c27a', '#8a6a3c'], armor: 'robe', weapon: 'branchstaff', marks: '#6fbf5a' } },
  { id: 'rania', name: 'Rania Sunarrow', title: 'Archer of the Amber Dunes', realm: 'amber', role: 'Ranged', rarity: 'rare', hp: 520, atk: 72, def: 20, spd: 9,
    skill: { name: 'Sunburst Volley', kind: 'aoe', mult: 1.3, desc: 'Rains sunlit arrows on all foes for 130% ATK.' },
    bio: 'A caravan guard who can split a date at three hundred paces. She joined you because the Ashen Court stole her caravan, and she wants every camel back.',
    look: { skin: '#c98f5e', hair: '#2a1a10', hs: 'scarf', eye: '#2a1a10', head: 'headscarf', outfit: ['#8a2f2f', '#e8a33d', '#d9b36b'], armor: 'leather', weapon: 'bow', headColor: '#2f7d8c' } },
  { id: 'layla', name: 'Layla Nightveil', title: 'The Kinzhal Blade', realm: 'amber', role: 'Assassin', rarity: 'epic', hp: 500, atk: 92, def: 18, spd: 11,
    skill: { name: 'Kinzhal Strike', kind: 'crit', mult: 3.6, desc: 'Strikes the weakest foe for 360% ATK.' },
    bio: 'Nobody knows her real name. The Sultanate\'s enemies know only her twin daggers, and the silence they leave behind.',
    look: { skin: '#c48a60', hair: '#120c1f', hs: 'hidden', eye: '#ffd36b', head: 'hoodmask', outfit: ['#1d1530', '#7a4fb3', '#9aa6b2'], armor: 'leather', weapon: 'daggers' } },
  { id: 'saqr', name: 'Emira Saqr', title: 'The Falcon Queen', realm: 'amber', role: 'Mage', rarity: 'legendary', hp: 620, atk: 98, def: 26, spd: 8,
    skill: { name: 'Talon Storm', kind: 'aoe', mult: 2.0, desc: 'A storm of golden falcons tears all foes for 200% ATK.' },
    bio: 'Sovereign of the Amber Sultanate, who rides the wind with a thousand falcons. She once wore a shard of the Sunspire Crown, and she wants it back.',
    look: { skin: '#b9825a', hair: '#1b120c', hs: 'long', eye: '#e8a33d', head: 'crown', outfit: ['#5a2f8a', '#ffd36b', '#ffd36b'], armor: 'royal', weapon: 'falcon', glow: '#ffd36b' } },
  { id: 'lian', name: 'Lian Jadewind', title: 'Sage of the Thousand Petals', realm: 'jade', role: 'Mage', rarity: 'legendary', hp: 560, atk: 100, def: 22, spd: 9,
    skill: { name: 'Thousand Petal Tempest', kind: 'aoe', mult: 1.9, desc: 'A storm of jade petals cuts all foes for 190% ATK.' },
    bio: 'The youngest Grand Sage in the Dominion\'s history. With one folded fan she can turn a typhoon, or an argument.',
    look: { skin: '#f0d0b4', hair: '#15100f', hs: 'bun', eye: '#2a1a10', head: 'hairpins', outfit: ['#1f7a64', '#f2e6cf', '#d9b36b'], armor: 'silk', weapon: 'fan', glow: '#7fffd4' } },
  { id: 'hiro', name: 'Hiro Ironpetal', title: 'Blade of the Lantern Guard', realm: 'jade', role: 'Warrior', rarity: 'epic', hp: 760, atk: 86, def: 32, spd: 9,
    skill: { name: 'Falling Petal Cut', kind: 'single', mult: 3.3, desc: 'One perfect draw: 330% ATK to the front foe.' },
    bio: 'Captain of the Lantern Guard, sworn to protect the Jade Court. He paints a cherry blossom on his armour for every life he saves.',
    look: { skin: '#e8c4a4', hair: '#15100f', hs: 'topknot', eye: '#2a1a10', head: 'none', outfit: ['#7a1f2a', '#1d1530', '#c9a24a'], armor: 'lamellar', weapon: 'longblade' } },
  { id: 'kaimana', name: 'Kaimana Tidecaller', title: 'Navigator of the Coral Isles', realm: 'coral', role: 'Support', rarity: 'rare', hp: 580, atk: 52, def: 26, spd: 8,
    skill: { name: 'Song of the Rising Tide', kind: 'buff', mult: 0.4, desc: 'Her song lifts every heart: squad ATK +40% for 3 turns.' },
    bio: 'She steers by stars and swells and has never lost a ship. When she sings, the sea itself seems to listen.',
    look: { skin: '#8a5a3a', hair: '#1b120c', hs: 'curly', eye: '#2a1a10', head: 'flower', outfit: ['#1fa5b8', '#f2ede4', '#f0a0a0'], armor: 'wrap', weapon: 'trident', marks: '#f2ede4' } },
  { id: 'tama', name: 'Tama Reefbreaker', title: 'Guardian of the Outer Reef', realm: 'coral', role: 'Tank', rarity: 'rare', hp: 1040, atk: 46, def: 50, spd: 4,
    skill: { name: 'Reef Wall', kind: 'shield', mult: 0.5, desc: 'Plants his great shield: the squad takes half damage for 3 turns.' },
    bio: 'The strongest man on any island, and the gentlest. His tattoos tell the story of every storm he has stood against.',
    look: { skin: '#7a4a2e', hair: '#1b120c', hs: 'tied', eye: '#2a1a10', head: 'none', beard: '#1b120c', outfit: ['#c9b07a', '#1fa5b8', '#e8e0d0'], armor: 'wrap', weapon: 'club', marks: '#1b120c', tattoo: true } },
  { id: 'amara', name: 'Amara Sunforge', title: 'Artificer of the Red Earth', realm: 'sunveldt', role: 'Engineer', rarity: 'epic', hp: 640, atk: 78, def: 28, spd: 6,
    skill: { name: 'Sunforge Barrage', kind: 'aoe', mult: 1.6, desc: 'Fires a volley of sun-hot bolts at all foes for 160% ATK.' },
    bio: 'Master of the great forges of Sunveldt. Her inventions are loud, brilliant and only occasionally on fire.',
    look: { skin: '#5a3420', hair: '#120a06', hs: 'afro', eye: '#2a1a10', head: 'goggles', outfit: ['#b5602a', '#ffd36b', '#c9a24a'], armor: 'leather', weapon: 'cannon', marks: '#ffd36b' } },
  { id: 'kofi', name: 'Kofi Swiftmane', title: 'Lion Rider of Sunveldt', realm: 'sunveldt', role: 'Warrior', rarity: 'rare', hp: 740, atk: 80, def: 30, spd: 8,
    skill: { name: 'Pride Charge', kind: 'single', mult: 3.0, desc: 'Charges with his lion for 300% ATK to the front foe.' },
    bio: 'He raised his lion, Zuri, from a cub. Together they have outrun wildfire, warbands and, once, an entire Ashen legion.',
    look: { skin: '#4a2a18', hair: '#120a06', hs: 'locs', eye: '#2a1a10', head: 'none', beard: '#120a06', outfit: ['#c9902b', '#7a2f2f', '#e8c35a'], armor: 'leather', weapon: 'spear', marks: '#e8c35a' } }
  /* ---------- Legends of the Ages: echoes from our own world, called by the breaking Crown ---------- */
  ,{ id: 'arthur', name: 'King Arthur', title: 'The Once and Future King', origin: 'Legend of Britain', legend: true, realm: 'greenhold', role: 'Warrior', rarity: 'legendary', hp: 900, atk: 92, def: 40, spd: 7,
    skill: { name: 'Excalibur Unsheathed', kind: 'single', mult: 3.6, desc: 'Draws the sword of light and strikes the front foe for 360% ATK.' },
    bio: 'He slept beneath a hill in Britain, waiting for the hour of greatest need. He did not expect the hour to call from another world.',
    look: { skin: '#f1d2bd', hair: '#8a5a2a', hs: 'tied', eye: '#3f7fbf', head: 'none', beard: '#8a5a2a', outfit: ['#2a3f8a', '#cfd8e2', '#e8b04a'], armor: 'lamellar', weapon: 'longblade', marks: '#e8b04a' } },
  { id: 'antarah', name: 'Antarah ibn Shaddad', title: 'The Black Knight of Najd', origin: 'Legend of Arabia · Najd', legend: true, realm: 'amber', role: 'Warrior', rarity: 'legendary', hp: 860, atk: 96, def: 36, spd: 8,
    skill: { name: 'Ode of the Charging Knight', kind: 'crit', mult: 3.4, desc: 'Recites as he charges and strikes the weakest foe for 340% ATK, with a high chance to crit.' },
    bio: 'Warrior and poet of the sands of Najd. They would not call him free until his sword spoke for him; after that, they could call him nothing else.',
    look: { skin: '#5a3420', hair: '#120a06', hs: 'tied', eye: '#2a1a10', head: 'none', beard: '#120a06', outfit: ['#7a1f2a', '#c9902b', '#e8c35a'], armor: 'lamellar', weapon: 'longblade', marks: '#e8c35a' } },
  { id: 'zarqa', name: 'Zarqa al-Yamama', title: 'She Who Sees Three Days Ahead', origin: 'Legend of Arabia · Yamama', legend: true, realm: 'amber', role: 'Support', rarity: 'epic', hp: 560, atk: 60, def: 24, spd: 9,
    skill: { name: 'Sight Beyond the Horizon', kind: 'buff', mult: 0.4, desc: 'She sees every blow before it lands: squad ATK +40% for 3 turns.' },
    bio: 'The blue-eyed seer of Yamama saw an army three days away, hidden behind branches. Her people laughed that trees do not walk. She will not be doubted twice.',
    look: { skin: '#c99a6e', hair: '#15100f', hs: 'tied', eye: '#3f9fdf', head: 'none', outfit: ['#232a6a', '#cfd8e2', '#c9d6e3'], armor: 'wrap', weapon: 'spear', marks: '#c9d6e3' } },
  { id: 'peter', name: 'Peter the Great', title: 'Tsar and Shipwright', origin: 'Legend of Russia', legend: true, realm: 'frostmark', role: 'Engineer', rarity: 'epic', hp: 700, atk: 80, def: 30, spd: 6,
    skill: { name: 'Broadside of the Grand Fleet', kind: 'aoe', mult: 1.7, desc: 'Signals the fleet he built with his own hands: every gun fires on all foes for 170% ATK.' },
    bio: 'He learned shipbuilding as a common carpenter in foreign yards, then raised a capital from a frozen marsh. A ruler who will not learn, he says, cannot lead.',
    look: { skin: '#f1d2bd', hair: '#2a1a10', hs: 'curly', eye: '#2a1a10', head: 'none', outfit: ['#2f5a3a', '#b3433a', '#3f7fbf'], armor: 'leather', weapon: 'cannon', marks: '#3f7fbf' } },
  { id: 'suntzu', name: 'Sun Tzu', title: 'Master of the Art of War', origin: 'Legend of China', legend: true, realm: 'jade', role: 'Mage', rarity: 'legendary', hp: 540, atk: 90, def: 20, spd: 8,
    skill: { name: 'Win Before the Battle', kind: 'stun', mult: 1.1, desc: 'The enemy is beaten before he moves: hits all foes for 110% ATK and stuns them for a turn.' },
    bio: 'Master Sun wrote thirteen chapters that generals have studied ever since. The supreme art of war, he teaches, is to subdue the enemy without fighting.',
    look: { skin: '#e8c4a4', hair: '#9a9a9a', hs: 'topknot', eye: '#2a1a10', head: 'none', beard: '#9a9a9a', outfit: ['#1f4a3a', '#1d1530', '#c9a24a'], armor: 'lamellar', weapon: 'spear' } },
  { id: 'leonardo', name: 'Leonardo da Vinci', title: 'The Universal Genius', origin: 'Legend of Italy', legend: true, realm: 'coral', role: 'Support', rarity: 'epic', hp: 600, atk: 70, def: 24, spd: 7,
    skill: { name: 'Vitruvian Remedy', kind: 'heal', mult: 1.2, desc: 'Applies everything he knows of anatomy: heals every hero for 120% of his ATK.' },
    bio: 'Painter when they pay him, engineer when they listen. He has spent his life asking how birds fly and why water curls, and Aeloria has given him new questions.',
    look: { skin: '#f1d2bd', hair: '#e8e0d0', hs: 'tied', eye: '#3f7fbf', head: 'none', beard: '#e8e0d0', outfit: ['#7a1f2a', '#3a2414', '#c9a24a'], armor: 'wrap', weapon: 'club' } },
  { id: 'elcid', name: 'El Cid', title: 'The Lord Champion of Vivar', origin: 'Legend of Spain', legend: true, realm: 'sunveldt', role: 'Tank', rarity: 'legendary', hp: 1120, atk: 58, def: 56, spd: 5,
    skill: { name: 'Banner of Tizona', kind: 'shield', mult: 0.5, desc: 'Plants his banner and will not be moved: the squad takes half damage for 3 turns.' },
    bio: 'Rodrigo Díaz of Vivar, exiled by his own king, kept his word to him anyway. Friend and foe alike called him El Cid, the Lord.',
    look: { skin: '#e0b896', hair: '#2a1a10', hs: 'tied', eye: '#2a1a10', head: 'none', beard: '#2a1a10', outfit: ['#b3433a', '#cfd8e2', '#e8b04a'], armor: 'lamellar', weapon: 'axeshield', marks: '#e8b04a' } },
  { id: 'bismarck', name: 'Otto von Bismarck', title: 'The Iron Chancellor', origin: 'Legend of Germany', legend: true, realm: 'greenhold', role: 'Tank', rarity: 'epic', hp: 1000, atk: 52, def: 54, spd: 4,
    skill: { name: 'Blood and Iron', kind: 'aoe', mult: 1.3, desc: 'One plan, one blow: the whole line advances and hits all foes for 130% ATK.' },
    bio: 'He made one nation out of thirty-nine quarrelling states, with patience first and iron second. He has already redrawn your maps.',
    look: { skin: '#f1d2bd', hair: '#e8e0d0', hs: 'tied', eye: '#3f7fbf', head: 'none', beard: '#e8e0d0', outfit: ['#1f2a4a', '#cfd8e2', '#c9a24a'], armor: 'lamellar', weapon: 'axeshield' } }
];
const HERO = Object.fromEntries(HEROES.map(h => [h.id, h]));
const STAR_SHARDS = [0, 10, 20, 40, 80, 150]; // shards to recruit (index 1) and to reach each next star
const STARTERS = ['astrid', 'rania', 'elowen'];

/* ---------- enemies: the Ashen Court and the creatures it corrupts ---------- */
const FOES = {
  ghoul:    { name: 'Ash Ghoul', hp: 320, atk: 42, def: 12, spd: 7 },
  hound:    { name: 'Cinder Hound', hp: 280, atk: 46, def: 8, spd: 10 },
  raider:   { name: 'Ashsworn Raider', hp: 380, atk: 48, def: 16, spd: 7 },
  stalker:  { name: 'Dune Stalker', hp: 560, atk: 38, def: 32, spd: 4 },
  wraith:   { name: 'Ember Wraith', hp: 340, atk: 64, def: 12, spd: 8 },
  troll:    { name: 'Frost Troll', hp: 760, atk: 50, def: 40, spd: 3 },
  phantom:  { name: 'Lantern Phantom', hp: 360, atk: 60, def: 14, spd: 9 },
  serpent:  { name: 'Tide Serpent', hp: 520, atk: 54, def: 24, spd: 6 },
  golem:    { name: 'Slag Golem', hp: 820, atk: 46, def: 46, spd: 3 },
  warlord:  { name: 'Cinder Warlord', hp: 1200, atk: 56, def: 30, spd: 5 },
  queen:    { name: 'Queen of Mirages', hp: 1100, atk: 66, def: 22, spd: 8 },
  wyrm:     { name: 'Ashbound Wyrm', hp: 1500, atk: 62, def: 40, spd: 5 },
  lantern:  { name: 'Lantern-Smoke Lord', hp: 1250, atk: 68, def: 26, spd: 8 },
  kraken:   { name: 'Cinder Leviathan', hp: 1600, atk: 60, def: 42, spd: 4 },
  hollow:   { name: 'The Hollow King', hp: 1800, atk: 70, def: 44, spd: 6 }
};
const CHAPTERS = [
  { realm: 'greenhold', name: 'Ash in the Valewood', foes: ['ghoul', 'hound', 'raider'], boss: { kind: 'warlord', name: 'Grask the Cinder Warlord', hp: 1.25 } },
  { realm: 'amber', name: 'The Mirage Road', foes: ['stalker', 'raider', 'wraith'], boss: { kind: 'queen', name: 'The Queen of Mirages', hp: 1.35 } },
  { realm: 'frostmark', name: 'The Silent Fjords', foes: ['troll', 'ghoul', 'wraith'], boss: { kind: 'wyrm', name: 'Hrimfang, the Ashbound Wyrm', hp: 1.0 } },
  { realm: 'jade', name: 'Lanterns in the Mist', foes: ['phantom', 'hound', 'raider'], boss: { kind: 'lantern', name: 'The Lantern-Smoke Lord', hp: 1.2 } },
  { realm: 'coral', name: 'Tides of Cinder', foes: ['serpent', 'ghoul', 'phantom'], boss: { kind: 'kraken', name: 'The Cinder Leviathan', hp: .95 } },
  { realm: 'sunspire', name: 'The Hollow Throne', foes: ['wraith', 'ghoul', 'golem'], boss: { kind: 'hollow', name: 'The Hollow King', hp: .8 } }
];
const STAGE_SHARD = { '1-3': 'aldric', '1-5': 'kofi', '1-6': 'kofi', '2-3': 'layla', '2-5': 'rania', '2-6': 'saqr', '3-3': 'sigrun', '3-5': 'astrid', '3-6': 'sigrun', '4-3': 'hiro', '4-5': 'lian', '4-6': 'lian', '5-3': 'tama', '5-5': 'kaimana', '5-6': 'tama', '6-3': 'amara', '6-5': 'saqr', '6-6': 'lian' };
// Heroes who join your court in the story the first time a chapter is won
const STORY_JOIN = { '1-6': 'aldric', '2-6': 'layla', '3-6': 'sigrun', '4-6': 'hiro', '5-6': 'kaimana', '6-6': 'amara', '1-2': 'arthur', '2-2': 'antarah', '2-4': 'zarqa', '3-2': 'peter', '4-2': 'suntzu', '5-2': 'leonardo', '6-2': 'elcid', '6-4': 'bismarck' };

/* ---------- the story ---------- */
// Speakers: a hero id, 'narrator', 'you', or a foe kind. {name} becomes the player's name.
const STORY = {
  prologue: [
    ['narrator', 'For a thousand years the Sunspire Crown kept the six realms of Aeloria at peace.'],
    ['narrator', 'Then the Hollow King came out of the Ashen Scar, shattered the Crown and scattered its seven shards across the world.'],
    ['narrator', 'Where his ash falls, forests wither, rivers burn and good people forget their own names.'],
    ['narrator', 'But one shard did not fall to him. It fell into your hand.'],
    ['narrator', 'And as the Crown broke, its cry rang beyond Aeloria: across every age and every land where courage was ever sung.'],
    ['narrator', 'In Arabia and China, in Russia and Spain, in Italy, Germany and Britain, legends stirred in their sleep. Some of them answered.']
  ],
  // Legends of the Ages: each scene plays the first time its stage is won, when the legend joins your court
  legend: {
    arthur: [['narrator', 'Mist rolls over the Valewood, though the morning is clear. A king walks out of it with a sword of light in his hand.'], ['arthur', 'I slept beneath a hill in Britain, waiting for the hour of greatest need. I did not think the hour would call from another world.'], ['arthur', 'I am Arthur. I once gathered my knights at a table with no head, so that none sat above another. Your court will need such a table, {name}.'], ['elowen', 'A king who asks for a round table instead of a throne. The forest likes him already.']],
    antarah: [['narrator', 'A black horse crests the dune at full gallop. Its rider recites as he charges, and every verse lands like a blow.'], ['antarah', 'I am Antarah, son of Shaddad, from the sands of Najd. They would not call me free until my sword spoke for me. After that, they could call me nothing else.'], ['antarah', 'A man is not measured by his birth, {name}, but by where he stands when the charge comes. I stand here.'], ['rania', 'The poets of the Sultanate sing of riders like you. I always thought they were exaggerating.']],
    zarqa: [['narrator', 'On the wall of a ruined oasis fort a woman in indigo watches the horizon, her eyes as blue as deep water.'], ['zarqa', 'I am Zarqa of Yamama. I saw an army three days away, hidden behind the branches they carried. My people laughed that trees do not walk. I will not be doubted twice.'], ['zarqa', 'The mirages lie to your eyes, {name}. They cannot lie to mine. The Queen\'s true camp lies three days east.'], ['antarah', 'When Zarqa of Yamama says an army is coming, wise men saddle their horses.']],
    peter: [['narrator', 'In the silent fjord a giant of a man is already at work, coat off and axe in hand, building a ship from a wrecked longboat.'], ['peter', 'Peter, Tsar of all Russia. And today, carpenter. I learned this trade with my own hands in foreign shipyards, because a ruler who will not learn cannot lead.'], ['peter', 'I raised a city from a frozen marsh, {name}. Your Frostmark needs a fleet and a window on the sea. Hand me that hammer.'], ['astrid', 'A king who works. Frostmark will like this one.']],
    suntzu: [['narrator', 'In a bamboo pavilion an old general is setting stones on a board. He does not look up as you enter.'], ['suntzu', 'I am Sun Wu, whom they call Master Sun. You have won three realms by strength. Good. Now learn to win before the battle begins.'], ['suntzu', 'Know your enemy and know yourself, and in a hundred battles you will never be in peril. The Lantern-Smoke Lord knows neither. That is where we strike, {name}.'], ['lian', 'I have the strangest feeling that I have read him somewhere.']],
    leonardo: [['narrator', 'On the reef a white-bearded man is sketching a wave and, beside it, a machine to ride beneath it.'], ['leonardo', 'Leonardo, of Vinci. Painter when they pay me, engineer when they listen. I have spent my life asking how birds fly and why water curls. Your world has given me new questions.'], ['leonardo', 'The Leviathan is not evil, {name}. It is in pain. Give me timber, canvas and one day, and I will show you how to reach it.'], ['tama', 'He drew my shield and made it better. I am not sure how I feel about that.']],
    elcid: [['narrator', 'Before the grey gates of the Sunspire a lone knight sits his horse, facing an entire Ashen legion. The legion is not advancing.'], ['elcid', 'Rodrigo Díaz of Vivar. Friend and foe alike called me El Cid, the Lord. My own king exiled me, and still I kept my word to him. Honour is what you do when nothing is owed.'], ['elcid', 'They say I won my last battle after my death, tied upright in the saddle. Today I would rather win one alive. Ride with me, {name}.'], ['antarah', 'An exile who answers injustice with loyalty. Brother, I know that road.']],
    bismarck: [['narrator', 'In the war tent, someone has already redrawn your maps. In ink. With a ruler.'], ['bismarck', 'Otto von Bismarck. I made one nation out of thirty-nine quarrelling states, and I did it with patience first and iron second.'], ['bismarck', 'Six realms, six banners, six plans of attack: that is how the Hollow King wins. One realm, one plan, one blow. Sign here, {name}, and Aeloria marches as one.'], ['suntzu', 'He who unites his ranks in purpose will be victorious. The Chancellor and I shall get along.']]
  },
  1: { intro: [['elowen', 'The Valewood is burning, {name}. Ash ghouls walk where children used to play.'], ['astrid', 'Then we put out the fire, and whoever lit it.'], ['rania', 'Tracks lead north. Many feet, all heavy. A warband.']],
       outro: [['warlord', 'The Hollow King will remember your name… and take it.'], ['aldric', 'I am Aldric Valebrand, last of the Oak Knights. Your shard shone through the smoke like a sunrise. My sword is yours.'], ['elowen', 'One shard found us. Six more wait across Aeloria.'], ['arthur', 'One shard, and already a fellowship. I have seen great things begin with less.']] },
  2: { intro: [['rania', 'Home. The Amber dunes. But the oases are lying, {name}. They show water where there is only ash.'], ['narrator', 'Somewhere ahead, a woman\'s laughter echoes from every direction at once.']],
       outro: [['queen', 'You cannot kill a mirage…'], ['layla', 'You can if you aim for the shadow instead of the reflection.'], ['layla', 'Call me Layla. Emira Saqr sent me to watch you. I think I will stay instead.'], ['antarah', 'She ruled by making people doubt their own eyes. Zarqa, what do you see now?'], ['zarqa', 'Clear sand to the horizon. And far beyond it, snow.']] },
  3: { intro: [['astrid', 'Frostmark. My mother\'s halls are silent. No songs, no fires.'], ['sigrun', 'Because the great wyrm Hrimfang breathes ash now, child. I have read it in the ice.']],
       outro: [['wyrm', '…the chains… are gone…'], ['sigrun', 'The beast was a prisoner, not a monster. The Hollow King binds the strong and calls them his servants.'], ['sigrun', 'I am too old to wait for the end of the world. I will walk with you, shard-bearer.'], ['peter', 'A chained giant, set free! I have always preferred breaking chains to forging them. The north is ours. Onward!']] },
  4: { intro: [['lian', 'Welcome to the Jade Dominion. Please mind the lanterns. Some of them are watching you.'], ['hiro', 'The Lantern Guard has fallen silent. My brothers march for someone else now.']],
       outro: [['lantern', 'The smoke… lifts…'], ['hiro', 'My brothers are free. The Lantern Guard owes you a debt of honour, and I will pay it in person.'], ['lian', 'Three shards hum in harmony now. The Sunspire is calling them home.'], ['suntzu', 'The supreme art is to subdue the enemy without fighting. Today you freed an army instead of destroying it. You are learning.']] },
  5: { intro: [['kaimana', 'The reef is singing a warning song. Something huge is moving beneath the Coral Isles.'], ['tama', 'Then I stand on the reef and it goes around me.']],
       outro: [['kraken', 'The deep… remembers… the sun…'], ['kaimana', 'The Leviathan was the old guardian of our waters. Thank you for bringing it back to itself.'], ['leonardo', 'Extraordinary. I must draw it before it dives. Hold the canoe steady, my friend.'], ['kaimana', 'My canoes will carry your army to the Sunspire. Every island sails with you.']] },
  6: { intro: [['narrator', 'The Sunspire rises from the heart of Aeloria, its golden stones grey with ash.'], ['saqr', 'Every realm has sent its champions, {name}. Today we finish what he started.'], ['arthur', 'And every age has sent its legends. Let them stand together. For Aeloria!'], ['hollow', 'You bring me the last shards yourself? How… generous.']],
       outro: [['hollow', 'I only wanted… to be remembered…'], ['elowen', 'Then be remembered as the last shadow before the dawn.'], ['narrator', 'The Crown is whole again. Across six realms the ash turns to rain, and the rain to green.'], ['elcid', 'An exile, a tsar, a poet, a seer, a strategist, a painter, a chancellor and a king. No table ever sat a stranger company, or a finer one.'], ['zarqa', 'I see green to every horizon. This time, they will believe me.'], ['amara', 'Now THAT is something worth building. Where do we start, my sovereign?']] }
};

/* ---------- research ---------- */
const TECH = [
  { id: 'agri', name: 'Crop Rotation', desc: '+8% Grain production', max: 8, eff: .08, tree: 'Economy' },
  { id: 'forest', name: 'Forestry', desc: '+8% Timber production', max: 8, eff: .08, tree: 'Economy' },
  { id: 'mason', name: 'Masonry', desc: '+8% Stone production', max: 8, eff: .08, tree: 'Economy' },
  { id: 'metal', name: 'Smelting', desc: '+8% Iron production', max: 8, eff: .08, tree: 'Economy' },
  { id: 'build', name: 'Architecture', desc: '+6% construction speed', max: 8, eff: .06, tree: 'Economy' },
  { id: 'gather', name: 'Pack Saddles', desc: '+10% gathering speed', max: 8, eff: .10, tree: 'Economy' },
  { id: 'drill', name: 'Drill Yards', desc: '+6% training speed', max: 8, eff: .06, tree: 'Military' },
  { id: 'blade', name: 'Tempered Steel', desc: '+5% troop ATK', max: 10, eff: .05, tree: 'Military' },
  { id: 'armor', name: 'Plate Armour', desc: '+5% troop DEF', max: 10, eff: .05, tree: 'Military' },
  { id: 'march', name: 'Royal Roads', desc: '+8% march speed', max: 8, eff: .08, tree: 'Military' },
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
  shield: { name: 'Aegis Ward (8h)', desc: 'Protects your city from attacks for 8 hours. Attacking breaks it.', icon: 'shield', gems: 250 },
  crate: { name: 'Supply Crate', desc: 'Contains 5,000 of a random resource.', icon: 'crate', gems: 40 },
  scroll: { name: 'Hero Tome', desc: 'Gives 600 XP to a hero.', icon: 'scroll', gems: 30 },
  vigor: { name: 'Elixir of Vigor', desc: 'Restores 30 Vigor.', icon: 'vigor', gems: 50 },
  builder: { name: 'Hired Builder (24h)', desc: 'A second builder for 24 hours.', icon: 'help', gems: 300 },
  gift: { name: 'Alliance Gift', desc: 'A gift from your Alliance. Open it for a surprise.', icon: 'chest', gems: 0 }
};

/* ---------- quests (main story chain) ---------- */
const QUESTS = [
  { t: 'Raise your Citadel to level 2', c: S => S.b.citadel >= 2, r: { gems: 20, grain: 1000, timber: 1000 } },
  { t: 'Build a Farm in an empty field', c: S => S.fields.filter(f => f && f.t === 'farm').length >= 2, r: { timber: 800, stone: 500 } },
  { t: 'Train 30 Spearmen', c: S => S.stats.trained >= 30, r: { grain: 1500, items: { sp5: 2 } } },
  { t: 'Story: win stage 1-1 of the campaign', c: S => !!S.stages['1-1'], r: { gems: 20, items: { scroll: 1 } } },
  { t: 'Build the Royal Academy', c: S => S.b.academy >= 1, r: { ore: 400, gold: 1000 } },
  { t: 'Research Crop Rotation', c: S => (S.tech.agri || 0) >= 1, r: { grain: 2000 } },
  { t: 'Gather from a resource site on the World map', c: S => S.stats.gathered > 0, r: { gems: 30, items: { crate: 1 } } },
  { t: 'Destroy an Ashen outpost', c: S => S.stats.camps >= 1, r: { gems: 30, items: { sp5: 3 } } },
  { t: 'Raise your Citadel to level 3', c: S => S.b.citadel >= 3, r: { gems: 40, items: { sp60: 1 } } },
  { t: 'Build the Infirmary', c: S => S.b.infirmary >= 1, r: { grain: 2000, timber: 2000 } },
  { t: 'Explore or scout with a scout march', c: S => S.stats.scouts >= 1, r: { gold: 2000 } },
  { t: 'Story: free the Valewood (stage 1-6)', c: S => !!S.stages['1-6'], r: { gems: 50, items: { scroll: 2 } } },
  { t: 'Raise your Citadel to level 5', c: S => S.b.citadel >= 5, r: { gems: 60, items: { builder: 1 } } },
  { t: 'Train 300 troops in total', c: S => S.stats.trained >= 300, r: { items: { sp60: 1, crate: 2 } } },
  { t: 'Destroy a level 5 Ashen outpost', c: S => S.stats.campMax >= 5, r: { gems: 60, items: { gift: 2 } } },
  { t: 'Unlock Tier II troops', c: S => (S.tech.tier2 || 0) >= 1, r: { gems: 60, ore: 3000 } },
  { t: 'Story: break the Mirage Road (stage 2-6)', c: S => !!S.stages['2-6'], r: { gems: 80, items: { vigor: 2 } } },
  { t: 'Raise your Citadel to level 8', c: S => S.b.citadel >= 8, r: { gems: 100, items: { sp60: 3 } } },
  { t: 'Defeat an Ash-sworn lord in battle', c: S => S.stats.rivals >= 1, r: { gems: 100, items: { shield: 1 } } },
  { t: 'Story: free Hrimfang (stage 3-6)', c: S => !!S.stages['3-6'], r: { gems: 120 } },
  { t: 'Raise your Citadel to level 10', c: S => S.b.citadel >= 10, r: { gems: 150, items: { sp480: 1 } } },
  { t: 'Story: lift the Lantern Smoke (stage 4-6)', c: S => !!S.stages['4-6'], r: { gems: 150 } },
  { t: 'Unlock Tier III troops', c: S => (S.tech.tier3 || 0) >= 1, r: { gems: 150, items: { crate: 5 } } },
  { t: 'Story: calm the Leviathan (stage 5-6)', c: S => !!S.stages['5-6'], r: { gems: 200 } },
  { t: 'Raise your Citadel to level 15', c: S => S.b.citadel >= 15, r: { gems: 300 } },
  { t: 'Story: defeat the Hollow King (stage 6-6)', c: S => !!S.stages['6-6'], r: { gems: 500 } },
  { t: 'Claim the Sunspire Throne on the World map', c: S => !!S.throne, r: { gems: 1000 } }
];

/* ---------- world ---------- */
// Ash-sworn lords: rulers who bent the knee to the Hollow King. [name, realm]
const RIVALS = [
  ['Jarl Ulfric Greyhand', 'frostmark'], ['Duke Morcant Thorne', 'greenhold'], ['Sultan Qasim Redsand', 'amber'], ['Lady Hessa Moonwell', 'amber'],
  ['Governor Shen Wuyan', 'jade'], ['Admiral Tavita Blackwake', 'coral'], ['Chief Obasi Emberhide', 'sunveldt'], ['Baroness Ilse Kaltmoor', 'frostmark'],
  ['The Ashen Chancellor', 'greenhold'], ['Warlord Naiche Redmesa', 'sunveldt']
];
const HOUSE_NAMES = ['Ingrid', 'Mateo', 'Aiko', 'Omar', 'Leilani', 'Thandi', 'Finn', 'Priya', 'Yusuf', 'Sofia', 'Kenji', 'Amaru', 'Noor', 'Lukas', 'Zainab', 'Ravi'];
const HOUSE_CHAT = [
  'Who needs help? Tap the Embassy, I am online.', 'Ashen outposts near the Sunspire drop great loot today.', 'Keep your resources inside the Treasury before you log off!',
  'Sultan Qasim is raiding again, raise your Aegis Wards.', 'Tier II archers are worth it, trust me.', 'Nice work on the outposts, everyone.',
  'Has anyone beaten the Lantern-Smoke Lord yet?', 'Remember to claim your supply chest.', 'One day we take the Sunspire Throne together.',
  'Frostmark players: the north fjords are full of iron.', 'Coral Isles marches are SO fast, I love it.', 'Helped everyone, back to farming.'
];
