import type { SignatureWeaponId } from './weapons.js'

export type CharacterId = 'shanlan' | 'qingtuan' | 'shimo'

export type CharacterBaseStats = {
  maxHp: number
  damage: number
  meleeDamage: number
  attackSpeed: number
  armor: number
  moveSpeed: number
  projectileCount: number
  extraProjectiles: number
  projectileDamage: number
  meleeRange: number
  rangedDamage: number
  projectileSpeed: number
  criticalChance: number
  criticalDamage: number
  dodgeChance: number
  reflectDamage: number
  cooldownMultiplier: number
  basicAttackDamage: number
  luck: number
  shopPriceMultiplier: number
  pickupRange: number
  coinGain: number
  enemyPressure: number
  eliteDamage: number
  normalDamage: number
  waveHealing: number
  shieldPower: number
}

export const characters: Record<CharacterId, {
  name: string
  role: string
  description: string
  passive: string
  weakness: string
  portrait: string
  weaponName: string
  weaponDescription: string
  weaponImage: string
  weaponId: SignatureWeaponId
  animation: string
  baseStats: CharacterBaseStats
}> = {
  shanlan: {
    baseStats: {
      maxHp: 20,
      damage: 1,
      meleeDamage: 1.15,
      attackSpeed: 1,
      armor: 0,
      moveSpeed: 1,
      projectileCount: 1,
      extraProjectiles: 0,
      projectileDamage: 1,
      meleeRange: 74,
      rangedDamage: 1,
      projectileSpeed: 430,
      criticalChance: 0.1,
      criticalDamage: 1.75,
      dodgeChance: 0,
      reflectDamage: 0,
      cooldownMultiplier: 1,
      basicAttackDamage: 1,
      luck: 0,
      shopPriceMultiplier: 1,
      pickupRange: 140,
      coinGain: 1,
      enemyPressure: 1,
      eliteDamage: 1,
      normalDamage: 1,
      waveHealing: 0,
      shieldPower: 1,
    },
    name: '山岚', role: '近战 · 爆发', description: '贴近敌群，用大范围横扫打出持续压制。',
    passive: '每第 4 次近战变为 180° 旋风，并恢复 1% 最大生命。', weakness: '攻击距离较短',
    portrait: 'assets/characters/panda-wanderer.png', weaponName: '青竹杖', weaponDescription: '中距 90° 横扫', weaponImage: 'assets/weapons/bamboo-staff.png', weaponId: 'bamboo-staff', animation: 'panda',
  },
  qingtuan: {
    baseStats: {
      maxHp: 10,
      damage: 1,
      meleeDamage: 0.8,
      attackSpeed: 1,
      armor: 0,
      moveSpeed: 1.1,
      projectileCount: 1,
      extraProjectiles: 0,
      projectileDamage: 1,
      meleeRange: 82,
      rangedDamage: 1,
      projectileSpeed: 516,
      criticalChance: 0.1,
      criticalDamage: 1.75,
      dodgeChance: 0,
      reflectDamage: 0,
      cooldownMultiplier: 1,
      basicAttackDamage: 1,
      luck: 0,
      shopPriceMultiplier: 1,
      pickupRange: 140,
      coinGain: 1,
      enemyPressure: 1,
      eliteDamage: 1,
      normalDamage: 1,
      waveHealing: 0,
      shieldPower: 1,
    },
    name: '青团', role: '远程 · 机动', description: '保持距离，用高速飞叶穿梭清场。',
    passive: '每第 6 次射击分裂为 3 枚各造成 45% 伤害的飞叶。', weakness: '生命较低',
    portrait: 'assets/characters/qingtuan.png', weaponName: '飞叶镖', weaponDescription: '长距高速飞叶', weaponImage: 'assets/weapons/leaf-dart.png', weaponId: 'leaf-dart', animation: 'qingtuan',
  },
  shimo: {
    baseStats: {
      maxHp: 30,
      damage: 1,
      meleeDamage: 1,
      attackSpeed: 1,
      armor: 8,
      moveSpeed: 0.9,
      projectileCount: 1,
      extraProjectiles: 0,
      projectileDamage: 1,
      meleeRange: 82,
      rangedDamage: 1,
      projectileSpeed: 430,
      criticalChance: 0.1,
      criticalDamage: 1.75,
      dodgeChance: 0,
      reflectDamage: 0,
      cooldownMultiplier: 1,
      basicAttackDamage: 1,
      luck: 0,
      shopPriceMultiplier: 1,
      pickupRange: 140,
      coinGain: 1,
      enemyPressure: 1,
      eliteDamage: 1,
      normalDamage: 1,
      waveHealing: 0,
      shieldPower: 1,
    },
    name: '石墨', role: '肉盾 · 反击', description: '顶住敌潮，用铁盾撞开近身威胁。',
    passive: '每 8 秒获得 8% 最大生命护盾，破盾时震开周围敌人。', weakness: '移动速度较慢',
    portrait: 'assets/characters/shimo.png', weaponName: '铁竹盾', weaponDescription: '短距 72° 盾击', weaponImage: 'assets/weapons/iron-bamboo-shield.png', weaponId: 'iron-bamboo-shield', animation: 'shimo',
  },
}
