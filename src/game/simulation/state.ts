import type { CharacterBaseStats, CharacterId } from '../content/characters.js'
import type { EnemyKind, injurySources } from '../content/enemies.js'
import type { ItemId } from '../content/items.js'
import type { UpgradeId } from '../content/upgrades.js'
import type { ShopProductId, WeaponId, SignatureWeaponId } from '../content/weapons.js'

export type DamageSource = WeaponId | SignatureWeaponId | 'panda-roller' | 'thorn-fur' | 'panda-roll' | 'barbed-backplate' | 'army-breaker-token' | 'thunder-drum' | 'taiji-jade'

export type RunStats = {
  initialSeed: number
  damage: Partial<Record<DamageSource, number>>
  injuries: Partial<Record<keyof typeof injurySources, number>>
  shieldAbsorbed: number
  upgradeRefreshes: number
  talentTriggers: Partial<Record<UpgradeId, number>>
  maxBattleFuryStacks: number
  lastInjury?: keyof typeof injurySources
}

export type PlayerState = CharacterBaseStats & {
  x: number
  y: number
  hp: number
  level: number
  xp: number
  nextXp: number
  coins: number
  coinRemainder: number
  dashCooldown: number
  dashTime: number
  dashX: number
  dashY: number
  facingX: number
  facingY: number
  hitCooldown: number
  dashBurstPending: boolean
  shield: number
  shieldMax: number
  shieldTimer: number
  ironArmorTime: number
  overflowDamageTime: number
}

export type EnemyState = {
  id: number
  kind: EnemyKind
  x: number
  y: number
  hp: number
  maxHp: number
  cooldown: number
  dashTime: number
  vx: number
  vy: number
  telegraph?: number
  facingX?: number
  facingY?: number
  elite?: boolean
  phase?: 1 | 2
  enraged?: boolean
}

export type BossHazardState = { id: number; kind: 'root' | 'shockwave'; x: number; y: number; radius: number; life: number; duration: number; triggered: boolean }

export type PlayerProjectileState = { id: number; kind: 'leaf' | 'firecracker' | 'bolt'; x: number; y: number; vx: number; vy: number; damage: number; critical: boolean; blastRadius: number; travel?: number; maxTravel?: number; pierces?: number; returning?: boolean; splitOnEnd?: boolean; hitIds?: number[] }

export type EnemyProjectileState = { id: number; x: number; y: number; vx: number; vy: number }

export type AttackState = { id: number; x: number; y: number; life: number; radius: number; angle: number; arc: number; critical: boolean; kind: 'staff' | 'whirlwind' | 'dragon-staff' | 'shield' | 'mountain-shield' | 'fists' }

export type GroundZoneState = { id: number; kind: 'wine' | 'mountain'; x: number; y: number; radius: number; life: number; duration: number; tickCooldown: number; damage: number }

export type EnemyZoneState = { id: number; x: number; y: number; radius: number; life: number; duration: number }

export type TurretState = { id: number; x: number; y: number; life: number; cooldown: number; level: number; angle: number }

export type DropState = { id: number; kind: 'xp' | 'coin' | 'heal'; x: number; y: number; value: number }

export type EffectState = { id: number; kind: 'hit' | 'crit' | 'projectile-hit' | 'projectile-crit' | 'firecracker-hit' | 'firecracker-crit' | 'firecracker-blast' | 'kill' | 'player-hit' | 'dash-burst' | 'shield-break' | 'last-stand' | 'enemy-shot' | 'boss-summon' | 'armor-block' | 'army-blast' | 'chain-lightning' | 'taiji-wave'; x: number; y: number; value: number; life: number; angle: number }

export type GameState = {
  characterId: CharacterId
  seed: number
  runStats: RunStats
  time: number
  wave: number
  waveTime: number
  waveDuration: number
  kills: number
  nextId: number
  spawnTimer: number
  threatBudget: number
  eliteSpawns: number
  bambooCooldown: number
  leafCooldown: number
  gauntletCooldown: number
  firecrackerCooldown: number
  orbitCooldown: number
  gourdCooldown: number
  turretDeployCooldown: number
  characterAttackCount: number
  gameOver: boolean
  victory: boolean
  pendingUpgrade: boolean
  shopOpen: boolean
  upgradeChoices: UpgradeId[]
  freeUpgradeRefreshUsed: boolean
  upgradeRefreshCost: number
  shopChoices: Array<ShopProductId | null>
  lockedShopIndices: number[]
  shopRefreshCost: number
  ownedItems: ItemId[]
  signatureWeaponLevel: number
  signatureWeaponEvolved: boolean
  weaponLevels: Partial<Record<WeaponId, number>>
  chosenUpgrades: UpgradeId[]
  waveKills: number
  bossAttackCount: number
  bossIntroTime: number
  corruptionInset: number
  lastStandUsed: boolean
  comboTargetId: number | null
  comboHits: number
  thunderAttacks: number
  stationaryTime: number
  totemBonus: number
  player: PlayerState
  enemies: EnemyState[]
  bossHazards: BossHazardState[]
  playerProjectiles: PlayerProjectileState[]
  enemyProjectiles: EnemyProjectileState[]
  attacks: AttackState[]
  groundZones: GroundZoneState[]
  enemyZones: EnemyZoneState[]
  turrets: TurretState[]
  drops: DropState[]
  effects: EffectState[]
}

export type PlayerInput = { x: number; y: number; dash: boolean }
