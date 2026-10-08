const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const DUMMY_PASSWORD = 'Demo@12345';

const demoUsers = [
  // Top Heroes & Legends (1-10)
  { username: 'barbarian_king', email: 'barbarian_king@demo.local', avatar: 'Chieftain', avatarName: 'Barbarian King (Iron Crown)', trophies: 4850, level: 240, role: 'Leader', isOnline: true },
  { username: 'goblin_king', email: 'goblin_king@demo.local', avatar: 'Goblin', avatarName: 'Goblin King (Loot Sack)', trophies: 3200, level: 110, role: 'Co-Leader', isOnline: false },
  { username: 'pekka_master', email: 'pekka_master@demo.local', avatar: 'P.E.K.K.A', avatarName: 'P.E.K.K.A Overlord (Dark Armor)', trophies: 5120, level: 275, role: 'Leader', isOnline: true },
  { username: 'dragon_rider', email: 'dragon_rider@demo.local', avatar: 'Dragon Rider', avatarName: 'Dragon Rider Ace (Rocket Spear)', trophies: 4400, level: 195, role: 'Co-Leader', isOnline: false },
  { username: 'wizard_x', email: 'wizard_x@demo.local', avatar: 'Wizard', avatarName: 'Grand Wizard (Arcane Staff)', trophies: 3950, level: 160, role: 'Elder', isOnline: true },
  { username: 'hog_rider99', email: 'hog_rider99@demo.local', avatar: 'Hog Rider', avatarName: 'Hog Rider General (Hammer & Hog)', trophies: 3600, level: 145, role: 'Warrior', isOnline: false },
  { username: 'miner_pro', email: 'miner_pro@demo.local', avatar: 'Miner', avatarName: 'Subterranean Miner (Shovel & Lamp)', trophies: 3100, level: 120, role: 'Member', isOnline: false },
  { username: 'valkyrie_queen', email: 'valkyrie_queen@demo.local', avatar: 'Valkyrie', avatarName: 'Valkyrie Whirlwind (Double Axe)', trophies: 4700, level: 220, role: 'Co-Leader', isOnline: true },
  { username: 'townhall_legend', email: 'townhall_legend@demo.local', avatar: 'Chieftain', avatarName: 'Town Hall Legend (TH16 Star)', trophies: 5500, level: 300, role: 'Leader', isOnline: true },
  { username: 'electro_dragon', email: 'electro_dragon@demo.local', avatar: 'Electro Dragon', avatarName: 'Electro Dragon (Lightning Storm)', trophies: 4900, level: 250, role: 'Co-Leader', isOnline: false },

  // Elite Warriors & Strategists (11-25)
  { username: 'archer_queen_99', email: 'archer_queen_99@demo.local', avatar: 'Archer', avatarName: 'Crossbow Sovereign (Golden Bow)', trophies: 5200, level: 280, role: 'Leader', isOnline: true },
  { username: 'grand_warden_v', email: 'grand_warden_v@demo.local', avatar: 'Wizard', avatarName: 'Eternal Tome Guardian', trophies: 4650, level: 215, role: 'Co-Leader', isOnline: false },
  { username: 'royal_champion_x', email: 'royal_champion_x@demo.local', avatar: 'Warrior', avatarName: 'Seeking Shield Champion', trophies: 4780, level: 230, role: 'Co-Leader', isOnline: true },
  { username: 'lava_hound_chief', email: 'lava_hound_chief@demo.local', avatar: 'Lava Hound', avatarName: 'Volcanic Lava Hound', trophies: 3820, level: 150, role: 'Elder', isOnline: false },
  { username: 'bowler_smash', email: 'bowler_smash@demo.local', avatar: 'Bowler', avatarName: 'Dark Elixir Boulderer', trophies: 3450, level: 135, role: 'Warrior', isOnline: false },
  { username: 'witch_doctor_99', email: 'witch_doctor_99@demo.local', avatar: 'Witch', avatarName: 'Skeleton Army Summoner', trophies: 4100, level: 170, role: 'Elder', isOnline: true },
  { username: 'wall_breaker_pro', email: 'wall_breaker_pro@demo.local', avatar: 'Wall Breaker', avatarName: 'Demolition Specialist', trophies: 2900, level: 95, role: 'Member', isOnline: false },
  { username: 'ice_golem_master', email: 'ice_golem_master@demo.local', avatar: 'Golem', avatarName: 'Frostbite Tank Commander', trophies: 3750, level: 155, role: 'Elder', isOnline: false },
  { username: 'super_bowler_x', email: 'super_bowler_x@demo.local', avatar: 'Bowler', avatarName: 'Mega Boulder Striker', trophies: 4300, level: 185, role: 'Warrior', isOnline: true },
  { username: 'bat_spell_caster', email: 'bat_spell_caster@demo.local', avatar: 'Wizard', avatarName: 'Nocturnal Bat Enchanter', trophies: 3900, level: 165, role: 'Warrior', isOnline: false },
  { username: 'rage_barbarian', email: 'rage_barbarian@demo.local', avatar: 'Chieftain', avatarName: 'Furious Berserker', trophies: 3350, level: 128, role: 'Member', isOnline: false },
  { username: 'sneaky_goblin_99', email: 'sneaky_goblin_99@demo.local', avatar: 'Goblin', avatarName: 'Cloaked Elixir Thief', trophies: 3150, level: 115, role: 'Member', isOnline: true },
  { username: 'inferno_dragon_v', email: 'inferno_dragon_v@demo.local', avatar: 'Dragon', avatarName: 'Melting Inferno Drake', trophies: 4450, level: 190, role: 'Elder', isOnline: false },
  { username: 'super_wizard_pro', email: 'super_wizard_pro@demo.local', avatar: 'Wizard', avatarName: 'Chain Lightning Sorcerer', trophies: 4250, level: 180, role: 'Warrior', isOnline: true },
  { username: 'healer_queen', email: 'healer_queen@demo.local', avatar: 'Archer', avatarName: 'Celestial Heal Medic', trophies: 4600, level: 210, role: 'Co-Leader', isOnline: false },

  // Clan War Champions (26-45)
  { username: 'minion_swarm_001', email: 'minion_swarm_001@demo.local', avatar: 'Minion', avatarName: 'Dark Elixir Swarm Commander', trophies: 2850, level: 90, role: 'Member', isOnline: false },
  { username: 'stone_slammer_x', email: 'stone_slammer_x@demo.local', avatar: 'Siege', avatarName: 'Air Siege Bombard', trophies: 4050, level: 172, role: 'Warrior', isOnline: true },
  { username: 'siege_barracks_v', email: 'siege_barracks_v@demo.local', avatar: 'Siege', avatarName: 'P.E.K.K.A Deployment Unit', trophies: 3980, level: 168, role: 'Elder', isOnline: false },
  { username: 'flame_flinger_chief', email: 'flame_flinger_chief@demo.local', avatar: 'Siege', avatarName: 'Long-Range Incinerator', trophies: 4520, level: 205, role: 'Co-Leader', isOnline: true },
  { username: 'battle_blimp_pro', email: 'battle_blimp_pro@demo.local', avatar: 'Siege', avatarName: 'Town Hall Sniper Blimp', trophies: 4350, level: 188, role: 'Warrior', isOnline: false },
  { username: 'log_launcher_99', email: 'log_launcher_99@demo.local', avatar: 'Siege', avatarName: 'Wall Crushing Log Siege', trophies: 3880, level: 162, role: 'Member', isOnline: false },
  { username: 'battle_copter_x', email: 'battle_copter_x@demo.local', avatar: 'Warrior', avatarName: 'Builder Base Aerial Ace', trophies: 3250, level: 122, role: 'Member', isOnline: true },
  { username: 'electro_titan_v', email: 'electro_titan_v@demo.local', avatar: 'Titan', avatarName: 'Aura of Shocking Wrath', trophies: 4950, level: 260, role: 'Co-Leader', isOnline: false },
  { username: 'apprentice_warden', email: 'apprentice_warden@demo.local', avatar: 'Wizard', avatarName: 'Aura Support Scholar', trophies: 3400, level: 130, role: 'Member', isOnline: false },
  { username: 'super_hog_rider', email: 'super_hog_rider@demo.local', avatar: 'Hog Rider', avatarName: 'Double-Hammer Jumper', trophies: 4150, level: 175, role: 'Warrior', isOnline: true },
  { username: 'headhunter_pro', email: 'headhunter_pro@demo.local', avatar: 'Archer', avatarName: 'Hero Assassination Scout', trophies: 3800, level: 158, role: 'Elder', isOnline: false },
  { username: 'skeleton_king_99', email: 'skeleton_king_99@demo.local', avatar: 'Chieftain', avatarName: 'Undead Horde Commander', trophies: 3650, level: 148, role: 'Member', isOnline: false },
  { username: 'battle_machine_x', email: 'battle_machine_x@demo.local', avatar: 'Warrior', avatarName: 'Electric Hammer Titan', trophies: 3100, level: 118, role: 'Member', isOnline: true },
  { username: 'mega_knight_clash', email: 'mega_knight_clash@demo.local', avatar: 'P.E.K.K.A', avatarName: 'Spiked Mace Jumper', trophies: 4200, level: 178, role: 'Warrior', isOnline: false },
  { username: 'sparky_zap_99', email: 'sparky_zap_99@demo.local', avatar: 'Wizard', avatarName: 'Overcharged Cannon Cart', trophies: 3920, level: 164, role: 'Elder', isOnline: true },
  { username: 'executioner_axe', email: 'executioner_axe@demo.local', avatar: 'Warrior', avatarName: 'Boomerang Axe Cleaver', trophies: 3720, level: 152, role: 'Member', isOnline: false },
  { username: 'lumberjack_rage', email: 'lumberjack_rage@demo.local', avatar: 'Chieftain', avatarName: 'Rage Elixir Chopper', trophies: 3500, level: 138, role: 'Member', isOnline: false },
  { username: 'ram_rider_v', email: 'ram_rider_v@demo.local', avatar: 'Hog Rider', avatarName: 'Snaring Bola Rider', trophies: 3680, level: 146, role: 'Member', isOnline: true },
  { username: 'royal_ghost_spec', email: 'royal_ghost_spec@demo.local', avatar: 'Witch', avatarName: 'Invisible Phantom Striker', trophies: 4420, level: 192, role: 'Warrior', isOnline: false },
  { username: 'super_miner_x', email: 'super_miner_x@demo.local', avatar: 'Miner', avatarName: 'Drill Bomb Explosive Miner', trophies: 4080, level: 174, role: 'Warrior', isOnline: true },

  // Base Defense & Strategy Veterans (46-65)
  { username: 'party_wizard_99', email: 'party_wizard_99@demo.local', avatar: 'Wizard', avatarName: 'Disco Fireball Caster', trophies: 2950, level: 102, role: 'Member', isOnline: false },
  { username: 'ice_wizard_pro', email: 'ice_wizard_pro@demo.local', avatar: 'Wizard', avatarName: 'Chilling Frost Mage', trophies: 3580, level: 140, role: 'Member', isOnline: false },
  { username: 'super_archer_v', email: 'super_archer_v@demo.local', avatar: 'Archer', avatarName: 'Sharpshooter Piercing Arrow', trophies: 4320, level: 184, role: 'Warrior', isOnline: true },
  { username: 'super_wall_breaker', email: 'super_wall_breaker@demo.local', avatar: 'Wall Breaker', avatarName: 'Giant Barrel Detonator', trophies: 3620, level: 144, role: 'Member', isOnline: false },
  { username: 'super_giant_smash', email: 'super_giant_smash@demo.local', avatar: 'Chieftain', avatarName: 'Wall-Punching Colossus', trophies: 3480, level: 136, role: 'Member', isOnline: false },
  { username: 'super_dragon_x', email: 'super_dragon_x@demo.local', avatar: 'Dragon', avatarName: 'Quad-Fireball Leviathan', trophies: 4820, level: 235, role: 'Co-Leader', isOnline: true },
  { username: 'super_minion_spec', email: 'super_minion_spec@demo.local', avatar: 'Minion', avatarName: 'Long-Shot Rocket Launcher', trophies: 4180, level: 176, role: 'Warrior', isOnline: false },
  { username: 'super_valkyrie_r', email: 'super_valkyrie_r@demo.local', avatar: 'Valkyrie', avatarName: 'Rage-Dropping Berserker', trophies: 4260, level: 182, role: 'Elder', isOnline: true },
  { username: 'super_witch_mother', email: 'super_witch_mother@demo.local', avatar: 'Witch', avatarName: 'Big Boy Skeleton Summoner', trophies: 4620, level: 212, role: 'Co-Leader', isOnline: false },
  { username: 'rocket_balloon_ace', email: 'rocket_balloon_ace@demo.local', avatar: 'Balloon', avatarName: 'Rocket-Boosted Bomb Dropper', trophies: 3890, level: 161, role: 'Warrior', isOnline: false },
  { username: 'sneaky_archer_99', email: 'sneaky_archer_99@demo.local', avatar: 'Archer', avatarName: 'Invisibility Cloak Scout', trophies: 3050, level: 112, role: 'Member', isOnline: true },
  { username: 'boxer_giant_x', email: 'boxer_giant_x@demo.local', avatar: 'Chieftain', avatarName: 'Power Punch Boxer', trophies: 2980, level: 105, role: 'Member', isOnline: false },
  { username: 'raged_barbarian_v', email: 'raged_barbarian_v@demo.local', avatar: 'Chieftain', avatarName: 'Speed Haste Striker', trophies: 2890, level: 98, role: 'Member', isOnline: false },
  { username: 'bomber_boom_99', email: 'bomber_boom_99@demo.local', avatar: 'Wall Breaker', avatarName: 'Bouncing Bomb Hurler', trophies: 2750, level: 88, role: 'Member', isOnline: false },
  { username: 'baby_dragon_fire', email: 'baby_dragon_fire@demo.local', avatar: 'Baby Dragon', avatarName: 'Tantrum Fireball Drake', trophies: 3520, level: 139, role: 'Member', isOnline: true },
  { username: 'night_witch_bats', email: 'night_witch_bats@demo.local', avatar: 'Witch', avatarName: 'Bat Nest Matriarch', trophies: 3670, level: 147, role: 'Elder', isOnline: false },
  { username: 'drop_ship_bomb', email: 'drop_ship_bomb@demo.local', avatar: 'Balloon', avatarName: 'Skeleton Drop Cruiser', trophies: 3380, level: 126, role: 'Member', isOnline: false },
  { username: 'super_pekka_overcharged', email: 'super_pekka_overcharged@demo.local', avatar: 'P.E.K.K.A', avatarName: 'Overcharged Death Explosion', trophies: 4480, level: 198, role: 'Elder', isOnline: true },
  { username: 'hog_glider_ace', email: 'hog_glider_ace@demo.local', avatar: 'Hog Rider', avatarName: 'Airborne Paragliding Hammer', trophies: 3120, level: 116, role: 'Member', isOnline: false },
  { username: 'electro_fire_wizard', email: 'electro_fire_wizard@demo.local', avatar: 'Wizard', avatarName: 'Dual Element Archmage', trophies: 4120, level: 172, role: 'Warrior', isOnline: false },

  // Clan Capital & League Grinders (66-85)
  { username: 'dark_elixir_king', email: 'dark_elixir_king@demo.local', avatar: 'Chieftain', avatarName: 'Dark Elixir Refinery Mogul', trophies: 5050, level: 268, role: 'Leader', isOnline: true },
  { username: 'townhall_16_pro', email: 'townhall_16_pro@demo.local', avatar: 'Chieftain', avatarName: 'Giga Inferno Master', trophies: 5380, level: 290, role: 'Leader', isOnline: true },
  { username: 'legend_league_warrior', email: 'legend_league_warrior@demo.local', avatar: 'Warrior', avatarName: 'Legend Badge Top 100', trophies: 5420, level: 295, role: 'Co-Leader', isOnline: false },
  { username: 'war_hero_999', email: 'war_hero_999@demo.local', avatar: 'Chieftain', avatarName: '1000 War Stars Veteran', trophies: 4790, level: 228, role: 'Co-Leader', isOnline: true },
  { username: 'clan_capital_chief', email: 'clan_capital_chief@demo.local', avatar: 'Chieftain', avatarName: 'Capital Peak Overseer', trophies: 4680, level: 218, role: 'Co-Leader', isOnline: false },
  { username: 'raid_leader_x', email: 'raid_leader_x@demo.local', avatar: 'Warrior', avatarName: 'Weekend Raid Medalist', trophies: 4220, level: 179, role: 'Elder', isOnline: true },
  { username: 'star_collector_pro', email: 'star_collector_pro@demo.local', avatar: 'Archer', avatarName: '3-Star Perfect Attack Specialist', trophies: 4880, level: 242, role: 'Co-Leader', isOnline: false },
  { username: 'spell_master_99', email: 'spell_master_99@demo.local', avatar: 'Wizard', avatarName: 'Brewing Factory Alchemist', trophies: 3840, level: 156, role: 'Member', isOnline: false },
  { username: 'poison_master_v', email: 'poison_master_v@demo.local', avatar: 'Wizard', avatarName: 'CC Slowdown Toxicologist', trophies: 3560, level: 137, role: 'Member', isOnline: true },
  { username: 'freeze_wizard_x', email: 'freeze_wizard_x@demo.local', avatar: 'Wizard', avatarName: 'Inferno Tower Immobilizer', trophies: 3940, level: 166, role: 'Elder', isOnline: false },
  { username: 'earthquake_titan', email: 'earthquake_titan@demo.local', avatar: 'Golem', avatarName: 'Wall Shattering Seismologist', trophies: 4160, level: 177, role: 'Warrior', isOnline: true },
  { username: 'clone_master_99', email: 'clone_master_99@demo.local', avatar: 'Wizard', avatarName: 'Balloon Duplication Specialist', trophies: 4020, level: 171, role: 'Warrior', isOnline: false },
  { username: 'invisibility_ninja', email: 'invisibility_ninja@demo.local', avatar: 'Archer', avatarName: 'Super Archer Blimp Ninja', trophies: 4580, level: 208, role: 'Co-Leader', isOnline: true },
  { username: 'recall_spell_caster', email: 'recall_spell_caster@demo.local', avatar: 'Wizard', avatarName: 'Queen Charge Recall Master', trophies: 4720, level: 224, role: 'Co-Leader', isOnline: false },
  { username: 'root_rider_pro', email: 'root_rider_pro@demo.local', avatar: 'Warrior', avatarName: 'Nature Wall Crusher', trophies: 4920, level: 252, role: 'Co-Leader', isOnline: true },

  // Rising Stars & Academy Recruits (86-100)
  { username: 'druid_summoner_x', email: 'druid_summoner_x@demo.local', avatar: 'Wizard', avatarName: 'Bear Form Healer', trophies: 4380, level: 189, role: 'Warrior', isOnline: false },
  { username: 'super_charge_chief', email: 'super_charge_chief@demo.local', avatar: 'Chieftain', avatarName: 'Overcharged Siege Commander', trophies: 4140, level: 173, role: 'Member', isOnline: true },
  { username: 'clash_warrior_01', email: 'clash_warrior_01@demo.local', avatar: 'Warrior', avatarName: 'Silver Shield Challenger', trophies: 2100, level: 55, role: 'Member', isOnline: false },
  { username: 'clash_warrior_02', email: 'clash_warrior_02@demo.local', avatar: 'Warrior', avatarName: 'Gold League Vanguard', trophies: 2450, level: 68, role: 'Member', isOnline: true },
  { username: 'clash_warrior_03', email: 'clash_warrior_03@demo.local', avatar: 'Warrior', avatarName: 'Crystal League Striker', trophies: 2800, level: 85, role: 'Member', isOnline: false },
  { username: 'clash_warrior_04', email: 'clash_warrior_04@demo.local', avatar: 'Warrior', avatarName: 'Master League Battler', trophies: 3150, level: 114, role: 'Member', isOnline: false },
  { username: 'clash_warrior_05', email: 'clash_warrior_05@demo.local', avatar: 'Warrior', avatarName: 'Champion League Crusader', trophies: 3600, level: 142, role: 'Elder', isOnline: true },
  { username: 'clash_warrior_06', email: 'clash_warrior_06@demo.local', avatar: 'Warrior', avatarName: 'Titan League Destroyer', trophies: 4250, level: 181, role: 'Elder', isOnline: false },
  { username: 'clash_warrior_07', email: 'clash_warrior_07@demo.local', avatar: 'Warrior', avatarName: 'Electro Valley Defender', trophies: 2650, level: 78, role: 'Member', isOnline: false },
  { username: 'clash_warrior_08', email: 'clash_warrior_08@demo.local', avatar: 'Warrior', avatarName: 'Spell Valley Apprentice', trophies: 2300, level: 62, role: 'Member', isOnline: true },
  { username: 'clash_warrior_09', email: 'clash_warrior_09@demo.local', avatar: 'Warrior', avatarName: 'Builder Hall Level 10 Ace', trophies: 3080, level: 117, role: 'Member', isOnline: false },
  { username: 'clash_warrior_10', email: 'clash_warrior_10@demo.local', avatar: 'Warrior', avatarName: 'Night Base Champion', trophies: 3300, level: 125, role: 'Member', isOnline: false },
  { username: 'clash_warrior_11', email: 'clash_warrior_11@demo.local', avatar: 'Warrior', avatarName: 'Dark Elixir Hoarder', trophies: 2900, level: 96, role: 'Member', isOnline: true },
  { username: 'clash_warrior_12', email: 'clash_warrior_12@demo.local', avatar: 'Warrior', avatarName: 'Gold Vault Guardian', trophies: 2720, level: 84, role: 'Member', isOnline: false },
  { username: 'clash_warrior_13', email: 'clash_warrior_13@demo.local', avatar: 'Warrior', avatarName: 'Elixir Storage Sentinel', trophies: 2550, level: 72, role: 'Member', isOnline: false },
];

const seedUsers = async () => {
  try {
    await connectDB();

    console.log('\nStarting Demo User Seeding...\n');

    let createdCount = 0;
    let alreadyExistsCount = 0;

    for (const userData of demoUsers) {
      const userExists = await User.findOne({
        $or: [
          { email: userData.email.toLowerCase() },
          { username: userData.username },
        ],
      });

      if (userExists) {
        alreadyExistsCount++;
      } else {
        await User.create({
          ...userData,
          password: DUMMY_PASSWORD,
          isDemoUser: true,
        });
        createdCount++;
      }
    }

    const totalDemoUsers = createdCount + alreadyExistsCount;

    console.log('Demo User Seeder');
    console.log('----------------');
    console.log(`Created: ${createdCount}`);
    console.log(`Already Exists: ${alreadyExistsCount}`);
    console.log(`Total Demo Users: ${totalDemoUsers}\n`);

    await mongoose.disconnect();
    console.log('[Database] Mongoose disconnected gracefully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error] Failed to seed demo users:', error);
    process.exit(1);
  }
};

seedUsers();
