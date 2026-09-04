export const regularEnemyIds = ['chaser', 'dasher', 'shooter', 'boar', 'assassin', 'sorcerer'] as const
export type RegularEnemyKind = typeof regularEnemyIds[number]
export type EnemyKind = RegularEnemyKind | 'boss'
export type CharacterId = 'shanlan' | 'qingtuan' | 'shimo'
export type UpgradeId = 'power' | 'haste' | 'vitality' | 'footwork' | 'leaf-volley' | 'wide-sweep'
export type ItemId = 'martial-belt' | 'wind-feather' | 'iron-bracer' | 'panda-roller' | 'bamboo-dew-pill' | 'food-god-lunchbox' | 'jade-eyepatch' | 'gale-leggings' | 'mountain-stone' | 'fortune-paw' | 'spirit-bamboo-tube' | 'tiger-seal'
export const weaponIds = ['iron-pot-gauntlets', 'firecracker-launcher', 'spinning-bamboo-blade', 'panda-wine-gourd', 'bamboo-crossbow-turret'] as const
export type WeaponId = typeof weaponIds[number]
export type ShopProductId = ItemId | WeaponId

export const enemyDefinitions: Record<RegularEnemyKind, { name: string; unlockWave: number; threat: number; baseHp: number; size: number; animation: string }> = {
  chaser: { name: '竹鼠', unlockWave: 1, threat: 1, baseHp: 30, size: 54, animation: 'redfang-chaser' },
  dasher: { name: '山猴', unlockWave: 2, threat: 2, baseHp: 38, size: 62, animation: 'violet-horn-dasher' },
  shooter: { name: '毒蜂', unlockWave: 2, threat: 2, baseHp: 26, size: 58, animation: 'cyan-lantern-shooter' },
  boar: { name: '甲壳野猪', unlockWave: 3, threat: 3, baseHp: 68, size: 68, animation: 'shellback-boar' },
  assassin: { name: '鼬鼠刺客', unlockWave: 4, threat: 3, baseHp: 34, size: 58, animation: 'weasel-assassin' },
  sorcerer: { name: '狐妖术士', unlockWave: 5, threat: 4, baseHp: 42, size: 62, animation: 'fox-sorcerer' },
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
  animation: string
}> = {
  shanlan: {
    name: '山岚', role: '近战 · 爆发', description: '贴近敌群，用大范围横扫打出持续压制。',
    passive: '每第 4 次近战变为 180° 旋风，并恢复 1% 最大生命。', weakness: '攻击距离较短',
    portrait: 'assets/characters/panda-wanderer.png', weaponName: '青竹杖', weaponDescription: '中距 90° 横扫', weaponImage: 'assets/weapons/bamboo-staff.png', animation: 'panda',
  },
  qingtuan: {
    name: '青团', role: '远程 · 机动', description: '保持距离，用高速飞叶穿梭清场。',
    passive: '每第 6 次射击分裂为 3 枚各造成 45% 伤害的飞叶。', weakness: '生命较低',
    portrait: 'assets/characters/qingtuan.png', weaponName: '飞叶镖', weaponDescription: '长距高速飞叶', weaponImage: 'assets/weapons/leaf-dart.png', animation: 'qingtuan',
  },
  shimo: {
    name: '石墨', role: '肉盾 · 反击', description: '顶住敌潮，用铁盾撞开近身威胁。',
    passive: '每 8 秒获得 8% 最大生命护盾，破盾时震开周围敌人。', weakness: '移动速度较慢',
    portrait: 'assets/characters/shimo.png', weaponName: '铁竹盾', weaponDescription: '短距 72° 盾击', weaponImage: 'assets/weapons/iron-bamboo-shield.png', animation: 'shimo',
  },
}

export const upgrades: Record<UpgradeId, { name: string; rarity: string; description: string; tag: string }> = {
  power: { name: '沉肩坠肘', rarity: '普通', description: '全部伤害 +12%', tag: '输出' },
  haste: { name: '疾风连式', rarity: '普通', description: '攻击速度 +10%', tag: '攻速' },
  vitality: { name: '竹息养生', rarity: '普通', description: '最大生命 +5，并恢复 5', tag: '生存' },
  footwork: { name: '踏叶无痕', rarity: '稀有', description: '移动速度 +10%', tag: '机动' },
  'leaf-volley': { name: '竹叶连射', rarity: '史诗', description: '额外发射 1 枚飞叶，远程伤害 -10%', tag: '远程 · 天赋' },
  'wide-sweep': { name: '横扫千军', rarity: '稀有', description: '杖/盾攻击范围 +18，攻击速度 -5%', tag: '近战 · 天赋' },
}

export const items: Record<ItemId, { name: string; rarity: string; description: string; preview: string; price: number; image: string; unique?: boolean }> = {
  'martial-belt': { name: '武道腰带', rarity: '普通', description: '近战伤害 +10%', preview: '近战伤害提高 10%', price: 18, image: 'assets/items/martial-belt.png' },
  'wind-feather': { name: '风羽', rarity: '稀有', description: '投射物速度 +20%，远程伤害 +5%', preview: '弹速提高 20% · 远程伤害提高 5%', price: 38, image: 'assets/items/wind-feather.png' },
  'iron-bracer': { name: '铁砂护腕', rarity: '普通', description: '护甲 +4，移动速度 -3%', preview: '护甲增加 4 · 移速降低 3%', price: 20, image: 'assets/items/iron-bracer.png' },
  'panda-roller': { name: '熊猫滚轮', rarity: '稀有', description: '闪避结束震开敌人并造成 32 伤害', preview: '解锁闪避震击', price: 38, image: 'assets/items/panda-roller.png', unique: true },
  'bamboo-dew-pill': { name: '竹露丸', rarity: '普通', description: '最大生命 +10，并立即恢复 10', preview: '生命上限与当前生命提高 10', price: 20, image: 'assets/items/bamboo-dew-pill.png' },
  'food-god-lunchbox': { name: '食神饭盒', rarity: '稀有', description: '每波开始恢复 15% 最大生命', preview: '每件额外恢复 15% 最大生命', price: 40, image: 'assets/items/food-god-lunchbox.png' },
  'jade-eyepatch': { name: '翡翠眼罩', rarity: '稀有', description: '暴击率 +8%，最大生命 -5', preview: '暴击提高 8% · 生命上限降低 5', price: 38, image: 'assets/items/jade-eyepatch.png' },
  'gale-leggings': { name: '疾风绑腿', rarity: '普通', description: '攻击速度 +8%', preview: '所有自动攻击频率提高 8%', price: 20, image: 'assets/items/gale-leggings.png' },
  'mountain-stone': { name: '镇岳石', rarity: '史诗', description: '护盾效果 +25%，移动速度 -5%', preview: '石墨护盾更厚 · 移速降低 5%', price: 58, image: 'assets/items/mountain-stone.png' },
  'fortune-paw': { name: '招财熊爪', rarity: '普通', description: '铜钱获取 +12%，敌人数量 +5%', preview: '收益提高，同时增加敌潮压力', price: 24, image: 'assets/items/fortune-paw.png' },
  'spirit-bamboo-tube': { name: '聚灵竹筒', rarity: '稀有', description: '拾取范围 +30%，移动速度 -3%', preview: '更远吸取掉落 · 移速降低 3%', price: 36, image: 'assets/items/spirit-bamboo-tube.png' },
  'tiger-seal': { name: '猛虎印', rarity: '史诗', description: '对精英和 Boss 伤害 +18%，对普通敌人伤害 -5%', preview: '专精强敌，但清杂能力下降', price: 60, image: 'assets/items/tiger-seal.png' },
}

export const weapons: Record<WeaponId, { name: string; rarity: string; description: string; preview: string; price: number; image: string }> = {
  'iron-pot-gauntlets': { name: '铁锅拳套', rarity: '普通', description: '极短距离快速拳击，Lv.3 起追加第二拳', preview: '升级提高伤害与拳风范围', price: 22, image: 'assets/weapons/iron-pot-gauntlets.png' },
  'firecracker-launcher': { name: '爆竹筒', rarity: '稀有', description: '发射慢速爆竹，命中造成范围爆炸', preview: '升级扩大爆炸，Lv.3 起双弹齐射', price: 42, image: 'assets/weapons/firecracker-launcher.png' },
  'spinning-bamboo-blade': { name: '旋转竹刃', rarity: '普通', description: '竹刃绕身切割近身敌人，Lv.3 起增加第二把', preview: '升级增加伤害、轨道与竹刃数量', price: 24, image: 'assets/weapons/spinning-bamboo-blade.png' },
  'panda-wine-gourd': { name: '熊猫酒葫芦', rarity: '稀有', description: '投出酒焰灼烧一片区域，Lv.3 起同时点燃两处', preview: '升级扩大酒焰并延长持续时间', price: 44, image: 'assets/weapons/panda-wine-gourd.png' },
  'bamboo-crossbow-turret': { name: '竹弩机关', rarity: '稀有', description: '部署自动索敌的竹弩台，Lv.3 起同时部署两台', preview: '升级增加箭伤、射速与机关数量', price: 48, image: 'assets/weapons/bamboo-crossbow-turret.png' },
}

export const isWeaponId = (id: ShopProductId): id is WeaponId => id in weapons

export type GameState = {
  characterId: CharacterId
  seed: number
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
  shopChoices: Array<ShopProductId | null>
  lockedShopIndices: number[]
  shopRefreshCost: number
  ownedItems: ItemId[]
  weaponLevels: Partial<Record<WeaponId, number>>
  chosenUpgrades: UpgradeId[]
  bossAttackCount: number
  bossIntroTime: number
  corruptionInset: number
  player: {
    x: number
    y: number
    hp: number
    maxHp: number
    level: number
    xp: number
    nextXp: number
    coins: number
    damage: number
    meleeDamage: number
    attackSpeed: number
    armor: number
    moveSpeed: number
    projectileCount: number
    meleeRange: number
    rangedDamage: number
    projectileSpeed: number
    criticalChance: number
    pickupRange: number
    coinGain: number
    coinRemainder: number
    enemyPressure: number
    eliteDamage: number
    normalDamage: number
    waveHealing: number
    shieldPower: number
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
  }
  enemies: Array<{
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
  }>
  bossHazards: Array<{ id: number; kind: 'root' | 'shockwave'; x: number; y: number; radius: number; life: number; duration: number; triggered: boolean }>
  playerProjectiles: Array<{ id: number; kind: 'leaf' | 'firecracker' | 'bolt'; x: number; y: number; vx: number; vy: number; damage: number; critical: boolean; blastRadius: number }>
  enemyProjectiles: Array<{ id: number; x: number; y: number; vx: number; vy: number }>
  attacks: Array<{ id: number; x: number; y: number; life: number; radius: number; angle: number; arc: number; critical: boolean; kind: 'staff' | 'whirlwind' | 'shield' | 'fists' }>
  groundZones: Array<{ id: number; x: number; y: number; radius: number; life: number; duration: number; tickCooldown: number; damage: number }>
  enemyZones: Array<{ id: number; x: number; y: number; radius: number; life: number; duration: number }>
  turrets: Array<{ id: number; x: number; y: number; life: number; cooldown: number; level: number; angle: number }>
  drops: Array<{ id: number; kind: 'xp' | 'coin' | 'heal'; x: number; y: number; value: number }>
  effects: Array<{ id: number; kind: 'hit' | 'crit' | 'projectile-hit' | 'projectile-crit' | 'firecracker-hit' | 'firecracker-crit' | 'firecracker-blast' | 'kill' | 'player-hit' | 'dash-burst' | 'shield-break' | 'enemy-shot' | 'boss-summon' | 'armor-block'; x: number; y: number; value: number; life: number; angle: number }>
}

export type PlayerInput = { x: number; y: number; dash: boolean }

const random = (state: GameState): number => {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0
  return state.seed / 4294967296
}

const dealEnemyDamage = (state: GameState, enemy: GameState['enemies'][number], rawDamage: number, sourceX: number, sourceY: number): number => {
  let damage = Math.max(1, Math.round(rawDamage * (enemy.kind === 'boss' || enemy.elite ? state.player.eliteDamage : state.player.normalDamage)))
  if (enemy.kind === 'boar') {
    const sourceDistance = Math.max(0.001, Math.hypot(sourceX - enemy.x, sourceY - enemy.y))
    const sourceXDirection = (sourceX - enemy.x) / sourceDistance
    const sourceYDirection = (sourceY - enemy.y) / sourceDistance
    const facingX = enemy.facingX ?? 1
    const facingY = enemy.facingY ?? 0
    if (sourceXDirection * facingX + sourceYDirection * facingY > 0.2) {
      damage = Math.max(1, Math.round(damage * 0.45))
      state.effects.push({ id: state.nextId++, kind: 'armor-block', x: enemy.x, y: enemy.y - 24, value: damage, life: 0.28, angle: Math.atan2(sourceY - enemy.y, sourceX - enemy.x) })
    }
  }
  enemy.hp -= damage
  return damage
}

export const createGameState = (seed = 20260831, characterId: CharacterId = 'shanlan'): GameState => ({
  characterId,
  seed,
  time: 0,
  wave: 1,
  waveTime: 0,
  waveDuration: 50,
  kills: 0,
  nextId: 1,
  spawnTimer: 0.6,
  threatBudget: 3,
  eliteSpawns: 0,
  bambooCooldown: 0.2,
  leafCooldown: 0.45,
  gauntletCooldown: 0.15,
  firecrackerCooldown: 0.6,
  orbitCooldown: 0.2,
  gourdCooldown: 0.8,
  turretDeployCooldown: 0.5,
  characterAttackCount: 0,
  gameOver: false,
  victory: false,
  pendingUpgrade: false,
  shopOpen: false,
  upgradeChoices: [],
  shopChoices: ['iron-pot-gauntlets', 'firecracker-launcher', 'iron-bracer', 'panda-roller'],
  lockedShopIndices: [],
  shopRefreshCost: 4,
  ownedItems: [],
  weaponLevels: {},
  chosenUpgrades: [],
  bossAttackCount: 0,
  bossIntroTime: 0,
  corruptionInset: 0,
  player: {
    x: 800, y: 500,
    hp: characterId === 'qingtuan' ? 10 : characterId === 'shimo' ? 30 : 20,
    maxHp: characterId === 'qingtuan' ? 10 : characterId === 'shimo' ? 30 : 20,
    level: 1, xp: 0, nextXp: 18, coins: 0,
    damage: 1, meleeDamage: characterId === 'shanlan' ? 1.15 : characterId === 'qingtuan' ? 0.8 : 1,
    attackSpeed: 1, armor: characterId === 'shimo' ? 8 : 0, moveSpeed: characterId === 'qingtuan' ? 1.1 : characterId === 'shimo' ? 0.9 : 1,
    projectileCount: 1, meleeRange: characterId === 'shanlan' ? 74 : 82, rangedDamage: 1, projectileSpeed: characterId === 'qingtuan' ? 516 : 430,
    criticalChance: 0.1, pickupRange: 140, coinGain: 1, coinRemainder: 0, enemyPressure: 1, eliteDamage: 1, normalDamage: 1, waveHealing: 0, shieldPower: 1,
    dashCooldown: 0, dashTime: 0, dashX: 1, dashY: 0, facingX: 1, facingY: 0, hitCooldown: 0, dashBurstPending: false,
    shield: 0, shieldMax: 0, shieldTimer: characterId === 'shimo' ? 8 : 0,
  },
  enemies: [], playerProjectiles: [], enemyProjectiles: [], bossHazards: [], attacks: [], groundZones: [], enemyZones: [], turrets: [], drops: [], effects: [],
})

const recalculateBuildStats = (state: GameState): void => {
  let maxHp = state.characterId === 'qingtuan' ? 10 : state.characterId === 'shimo' ? 30 : 20
  let moveSpeed = state.characterId === 'qingtuan' ? 1.1 : state.characterId === 'shimo' ? 0.9 : 1
  let attackSpeed = 1
  let normalDamage = 1
  let criticalChance = 0.1
  let rangedDamage = 1
  for (const id of state.ownedItems) {
    if (id === 'bamboo-dew-pill') maxHp += 10
    if (id === 'jade-eyepatch') { maxHp -= 5; criticalChance += 0.08 }
    if (id === 'iron-bracer' || id === 'spirit-bamboo-tube') moveSpeed -= 0.03
    if (id === 'mountain-stone') moveSpeed -= 0.05
    if (id === 'gale-leggings') attackSpeed += 0.08
    if (id === 'tiger-seal') normalDamage -= 0.05
    if (id === 'wind-feather') rangedDamage += 0.05
  }
  for (const id of state.chosenUpgrades) {
    if (id === 'vitality') maxHp += 5
    if (id === 'footwork') moveSpeed += 0.1
    if (id === 'haste') attackSpeed += 0.1
    if (id === 'wide-sweep') attackSpeed -= 0.05
    if (id === 'leaf-volley') rangedDamage *= 0.9
  }
  state.player.maxHp = Math.max(1, maxHp)
  state.player.moveSpeed = Math.max(0.5, Number(moveSpeed.toFixed(8)))
  state.player.attackSpeed = Math.max(0.55, Number(attackSpeed.toFixed(8)))
  state.player.normalDamage = Math.max(0.5, Number(normalDamage.toFixed(8)))
  state.player.criticalChance = Math.min(1, Number(criticalChance.toFixed(8)))
  state.player.rangedDamage = rangedDamage
  state.player.hp = Math.min(state.player.hp, state.player.maxHp)
}

export const chooseUpgrade = (state: GameState, id: UpgradeId): boolean => {
  if (!state.pendingUpgrade || !state.upgradeChoices.includes(id)) return false
  if (id === 'power') state.player.damage += 0.12
  if (id === 'leaf-volley') {
    state.player.projectileCount = Math.min(3, state.player.projectileCount + 1)
  }
  if (id === 'wide-sweep') {
    state.player.meleeRange += 18
  }
  state.chosenUpgrades.push(id)
  recalculateBuildStats(state)
  if (id === 'vitality') state.player.hp = Math.min(state.player.maxHp, state.player.hp + 5)
  state.pendingUpgrade = false
  state.upgradeChoices = []
  return true
}

export const buyItem = (state: GameState, index: number): boolean => {
  const id = state.shopChoices[index]
  if (!id) return false
  const product = isWeaponId(id) ? weapons[id] : items[id]
  const unique = !isWeaponId(id) && Boolean(items[id].unique)
  if (!state.shopOpen || state.player.coins < product.price) return false
  if (isWeaponId(id)) {
    const level = state.weaponLevels[id] ?? 0
    if (level >= 5 || level === 0 && Object.keys(state.weaponLevels).length >= 3) return false
    state.weaponLevels[id] = level + 1
  } else {
    if (unique && state.ownedItems.includes(id)) return false
    state.ownedItems.push(id)
  }
  state.player.coins -= product.price
  state.shopChoices = state.shopChoices.map((choice, choiceIndex) => unique && choice === id || choiceIndex === index ? null : choice)
  state.lockedShopIndices = state.lockedShopIndices.filter((lockedIndex) => state.shopChoices[lockedIndex] !== null)
  if (id === 'martial-belt') state.player.meleeDamage += 0.1
  if (id === 'wind-feather') {
    state.player.projectileSpeed *= 1.2
  }
  if (id === 'iron-bracer') {
    state.player.armor += 4
  }
  if (id === 'food-god-lunchbox') state.player.waveHealing += 0.15
  if (id === 'mountain-stone') {
    state.player.shieldPower += 0.25
  }
  if (id === 'fortune-paw') {
    state.player.coinGain += 0.12
    state.player.enemyPressure += 0.05
  }
  if (id === 'spirit-bamboo-tube') {
    state.player.pickupRange += 42
  }
  if (id === 'tiger-seal') {
    state.player.eliteDamage += 0.18
  }
  recalculateBuildStats(state)
  if (id === 'bamboo-dew-pill') state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10)
  return true
}

export const refreshShop = (state: GameState): boolean => {
  if (!state.shopOpen || state.player.coins < state.shopRefreshCost || state.shopChoices.every((id, index) => id !== null && state.lockedShopIndices.includes(index))) return false
  state.player.coins -= state.shopRefreshCost
  state.shopRefreshCost += 2
  const pool: ShopProductId[] = [...Object.keys(items) as ItemId[], ...weaponIds].filter((id) => (
    isWeaponId(id) ? (state.weaponLevels[id] ?? 0) < 5 : !items[id].unique || !state.ownedItems.includes(id)
  ))
  const selected = state.lockedShopIndices.map((index) => state.shopChoices[index]).filter((id): id is ShopProductId => id !== null)
  state.shopChoices = state.shopChoices.map((id, index) => {
    if (state.lockedShopIndices.includes(index)) return id
    const available = pool.filter((candidate) => !selected.includes(candidate))
    const rarityRoll = random(state) * 100
    const rarity = rarityRoll < 60 ? '普通' : rarityRoll < 87 ? '稀有' : '史诗'
    const rarityPool = available.filter((candidate) => (isWeaponId(candidate) ? weapons[candidate] : items[candidate]).rarity === rarity)
    const choices = rarityPool.length ? rarityPool : available
    const choice = choices[Math.floor(random(state) * choices.length)] ?? null
    if (choice) selected.push(choice)
    return choice
  })
  return true
}

export const toggleShopLock = (state: GameState, index: number): boolean => {
  if (!state.shopOpen || !state.shopChoices[index]) return false
  state.lockedShopIndices = state.lockedShopIndices.includes(index)
    ? state.lockedShopIndices.filter((lockedIndex) => lockedIndex !== index)
    : [...state.lockedShopIndices, index]
  return true
}

export const sellItem = (state: GameState, index: number): boolean => {
  const id = state.ownedItems[index]
  if (!state.shopOpen || !id) return false
  state.ownedItems.splice(index, 1)
  state.player.coins += Math.floor(items[id].price * 0.6)
  if (id === 'martial-belt') state.player.meleeDamage -= 0.1
  if (id === 'wind-feather') {
    state.player.projectileSpeed /= 1.2
  }
  if (id === 'iron-bracer') {
    state.player.armor -= 4
  }
  if (id === 'food-god-lunchbox') state.player.waveHealing = Math.max(0, state.player.waveHealing - 0.15)
  if (id === 'mountain-stone') {
    state.player.shieldPower = Math.max(1, state.player.shieldPower - 0.25)
  }
  if (id === 'fortune-paw') {
    state.player.coinGain = Math.max(1, state.player.coinGain - 0.12)
    state.player.enemyPressure = Math.max(1, state.player.enemyPressure - 0.05)
  }
  if (id === 'spirit-bamboo-tube') {
    state.player.pickupRange = Math.max(140, state.player.pickupRange - 42)
  }
  if (id === 'tiger-seal') {
    state.player.eliteDamage = Math.max(1, state.player.eliteDamage - 0.18)
  }
  recalculateBuildStats(state)
  return true
}

export const sellWeapon = (state: GameState, id: WeaponId): boolean => {
  const level = state.weaponLevels[id] ?? 0
  if (!state.shopOpen || level === 0) return false
  state.player.coins += Math.floor(weapons[id].price * level * 0.6)
  delete state.weaponLevels[id]
  if (id === 'panda-wine-gourd') state.groundZones = []
  if (id === 'bamboo-crossbow-turret') {
    state.turrets = []
    state.playerProjectiles = state.playerProjectiles.filter((projectile) => projectile.kind !== 'bolt')
  }
  if (id === 'firecracker-launcher') state.playerProjectiles = state.playerProjectiles.filter((projectile) => projectile.kind !== 'firecracker')
  return true
}

export const continueWave = (state: GameState): boolean => {
  if (!state.shopOpen) return false
  state.shopOpen = false
  state.shopRefreshCost = 4
  state.shopChoices = state.shopChoices.map((id, index) => state.lockedShopIndices.includes(index) ? id : null)
  state.wave += 1
  state.waveTime = 0
  state.waveDuration = state.wave === 10 ? 90 : 50
  state.enemies = []
  state.playerProjectiles = []
  state.enemyProjectiles = []
  state.attacks = []
  state.groundZones = []
  state.enemyZones = []
  state.turrets = []
  state.drops = []
  state.effects = []
  state.bossHazards = []
  state.spawnTimer = 0.8
  state.threatBudget = 2.5 + state.wave * 0.5
  state.eliteSpawns = 0
  state.bossAttackCount = 0
  state.bossIntroTime = state.wave === 10 ? 2.6 : 0
  state.corruptionInset = 0
  if (state.wave === 10) {
    state.player.x = 1100
    state.player.y = 600
    state.player.facingX = -1
    state.player.facingY = 0
    state.enemies.push({
      id: state.nextId++, kind: 'boss', x: 760, y: 600, hp: 2400, maxHp: 2400,
      cooldown: 2.6, dashTime: 0, vx: 0, vy: 0, phase: 1, enraged: false,
    })
  }
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.ceil(state.player.maxHp * (0.35 + state.player.waveHealing)))
  return true
}

export const stepGame = (state: GameState, input: PlayerInput, elapsed: number): void => {
  if (state.gameOver || state.victory || state.pendingUpgrade || state.shopOpen) return
  const dt = Math.min(elapsed, 0.05)
  state.time += dt
  state.waveTime += dt
  state.bossIntroTime = Math.max(0, state.bossIntroTime - dt)
  state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt)
  const previousDashTime = state.player.dashTime
  state.player.dashTime = Math.max(0, state.player.dashTime - dt)
  state.player.hitCooldown = Math.max(0, state.player.hitCooldown - dt)
  if (state.characterId === 'shimo') {
    state.player.shieldTimer -= dt
    if (state.player.shieldTimer <= 0) {
      state.player.shieldMax = Math.ceil(state.player.maxHp * 0.08 * state.player.shieldPower)
      state.player.shield = state.player.shieldMax
      state.player.shieldTimer = 8
    }
  }
  state.bambooCooldown -= dt
  state.leafCooldown -= dt
  state.gauntletCooldown -= dt
  state.firecrackerCooldown -= dt
  state.orbitCooldown -= dt
  state.gourdCooldown -= dt
  state.turretDeployCooldown -= dt
  state.spawnTimer -= dt
  state.threatBudget += (0.7 + state.wave * 0.15) * state.player.enemyPressure * dt
  for (const effect of state.effects) effect.life -= dt
  for (const zone of state.enemyZones) zone.life -= dt

  if (previousDashTime > 0 && state.player.dashTime === 0 && state.player.dashBurstPending) {
    state.player.dashBurstPending = false
    state.effects.push({ id: state.nextId++, kind: 'dash-burst', x: state.player.x, y: state.player.y, value: 32, life: 0.35, angle: 0 })
    for (const enemy of state.enemies) {
      const dx = enemy.x - state.player.x
      const dy = enemy.y - state.player.y
      const distance = Math.max(0.001, Math.hypot(dx, dy))
      if (distance < 118) {
        dealEnemyDamage(state, enemy, 32, state.player.x, state.player.y)
        if (enemy.kind !== 'boss') {
          enemy.x += (dx / distance) * 42
          enemy.y += (dy / distance) * 42
        }
      }
    }
  }

  const inputLength = Math.hypot(input.x, input.y)
  const moveX = inputLength > 0 ? input.x / inputLength : 0
  const moveY = inputLength > 0 ? input.y / inputLength : 0
  if (inputLength > 0) {
    state.player.facingX = moveX
    state.player.facingY = moveY
  }
  if (input.dash && state.player.dashCooldown === 0) {
    state.player.dashTime = 0.22
    state.player.dashCooldown = 2.5
    state.player.dashX = inputLength > 0 ? moveX : state.player.facingX
    state.player.dashY = inputLength > 0 ? moveY : state.player.facingY
    state.player.dashBurstPending = state.ownedItems.includes('panda-roller')
  }
  const slowed = state.enemyZones.some((zone) => Math.hypot(state.player.x - zone.x, state.player.y - zone.y) <= zone.radius)
  const speed = (state.player.dashTime > 0 ? 580 : 220) * state.player.moveSpeed * (slowed && state.player.dashTime === 0 ? 0.55 : 1)
  state.player.x = Math.min(1550 - state.corruptionInset, Math.max(50 + state.corruptionInset, state.player.x + (state.player.dashTime > 0 ? state.player.dashX : moveX) * speed * dt))
  state.player.y = Math.min(950 - state.corruptionInset, Math.max(75 + state.corruptionInset, state.player.y + (state.player.dashTime > 0 ? state.player.dashY : moveY) * speed * dt))

  if (state.wave < 10 && state.spawnTimer <= 0 && state.enemies.length < 80) {
    const elite = state.wave >= 6 && state.waveTime >= 15 && state.eliteSpawns === 0 && state.threatBudget >= 6
    const availableKinds = regularEnemyIds.filter((kind) => (
      enemyDefinitions[kind].unlockWave <= state.wave
      && enemyDefinitions[kind].threat <= state.threatBudget
      && (kind !== 'dasher' || state.enemies.filter((enemy) => enemy.kind === 'dasher').length < 4)
      && (kind !== 'boar' || state.enemies.filter((enemy) => enemy.kind === 'boar').length < 4)
      && (kind !== 'assassin' || state.enemies.filter((enemy) => enemy.kind === 'assassin').length < 3)
      && (kind !== 'sorcerer' || state.enemies.filter((enemy) => enemy.kind === 'sorcerer').length < 2)
    ))
    const kind = elite ? 'chaser' : availableKinds[Math.floor(random(state) * availableKinds.length)]
    if (kind) {
      const angle = random(state) * Math.PI * 2
      const definition = enemyDefinitions[kind]
      const hp = Math.round(definition.baseHp * (1 + (state.wave - 1) * 0.25) * (elite ? 3 : 1))
      state.enemies.push({
        id: state.nextId++, kind,
        x: Math.min(1550, Math.max(50, state.player.x + Math.cos(angle) * 540)),
        y: Math.min(950, Math.max(75, state.player.y + Math.sin(angle) * 540)),
        hp, maxHp: hp, cooldown: elite ? 2.4 : kind === 'shooter' ? 1.2 : kind === 'sorcerer' ? 1.6 : 1.8,
        dashTime: 0, vx: 0, vy: 0, telegraph: 0, facingX: -Math.cos(angle), facingY: -Math.sin(angle), elite,
      })
      state.threatBudget -= elite ? 6 : definition.threat
      if (elite) state.eliteSpawns += 1
    }
    state.spawnTimer = availableKinds.length > 0 || elite ? 0.28 : 0.12
  }

  for (const enemy of state.enemies) {
    const dx = state.player.x - enemy.x
    const dy = state.player.y - enemy.y
    const distance = Math.max(0.001, Math.hypot(dx, dy))
    enemy.cooldown -= dt
    const previousTelegraph = enemy.telegraph ?? 0
    enemy.telegraph = Math.max(0, previousTelegraph - dt)
    if (enemy.kind === 'boss') {
      enemy.phase = enemy.hp <= enemy.maxHp * 0.5 ? 2 : 1
      state.corruptionInset = enemy.phase === 2 ? 90 : 0
      if (enemy.cooldown <= 0 && state.bossIntroTime === 0) {
        const attack = state.bossAttackCount % 3
        state.bossAttackCount += 1
        if (attack === 0) {
          const count = enemy.phase === 2 ? 5 : 3
          for (let index = 0; index < count; index += 1) {
            const angle = index * Math.PI * 2 / count
            state.bossHazards.push({
              id: state.nextId++, kind: 'root',
              x: Math.min(1510, Math.max(90, state.player.x + Math.cos(angle) * index * 34)),
              y: Math.min(910, Math.max(115, state.player.y + Math.sin(angle) * index * 34)),
              radius: 46, life: 0.9, duration: 0.9, triggered: false,
            })
          }
        } else if (attack === 1) {
          state.bossHazards.push({ id: state.nextId++, kind: 'shockwave', x: enemy.x, y: enemy.y, radius: 230, life: 1.1, duration: 1.1, triggered: false })
        } else {
          const summonKinds: Array<Exclude<EnemyKind, 'boss'>> = ['chaser', 'dasher', 'shooter']
          for (let index = 0; index < 3 && state.enemies.filter((candidate) => candidate.kind !== 'boss').length < 9; index += 1) {
            const angle = index * Math.PI * 2 / 3
            const kind = summonKinds[index]
            const hp = kind === 'dasher' ? 150 : kind === 'shooter' ? 105 : 120
            state.enemies.push({ id: state.nextId++, kind, x: enemy.x + Math.cos(angle) * 150, y: enemy.y + Math.sin(angle) * 150, hp, maxHp: hp, cooldown: 1.2, dashTime: 0, vx: 0, vy: 0 })
          }
          state.effects.push({ id: state.nextId++, kind: 'boss-summon', x: enemy.x, y: enemy.y, value: 0, life: 0.7, angle: 0 })
        }
        enemy.cooldown = enemy.enraged ? 1.7 : enemy.phase === 2 ? 2.7 : 3.8
      }
    } else if (enemy.kind === 'assassin' || enemy.kind === 'chaser' && enemy.elite) {
      enemy.dashTime = Math.max(0, enemy.dashTime - dt)
      if (previousTelegraph > 0 && enemy.telegraph === 0) enemy.dashTime = enemy.elite ? 0.5 : 0.38
      if (enemy.telegraph > 0) {
        enemy.facingX = enemy.vx
        enemy.facingY = enemy.vy
      } else if (enemy.dashTime > 0) {
        const dashSpeed = enemy.elite ? 340 : 410
        enemy.x += enemy.vx * dashSpeed * dt
        enemy.y += enemy.vy * dashSpeed * dt
      } else if (enemy.cooldown <= 0) {
        enemy.vx = dx / distance
        enemy.vy = dy / distance
        enemy.telegraph = enemy.elite ? 0.9 : 0.7
        enemy.cooldown = enemy.elite ? 4.2 : 3.4
      } else {
        enemy.x += (dx / distance) * (enemy.elite ? 54 : 72) * dt
        enemy.y += (dy / distance) * (enemy.elite ? 54 : 72) * dt
      }
    } else if (enemy.kind === 'chaser') {
      enemy.x += (dx / distance) * (66 + state.wave * 2) * dt
      enemy.y += (dy / distance) * (66 + state.wave * 2) * dt
    } else if (enemy.kind === 'dasher') {
      enemy.dashTime = Math.max(0, enemy.dashTime - dt)
      if (enemy.cooldown <= 0) {
        enemy.vx = (dx / distance) * 330
        enemy.vy = (dy / distance) * 330
        enemy.dashTime = 0.42
        enemy.cooldown = 2.35
      }
      const dashSpeed = enemy.dashTime > 0 ? 1 : 0.18
      enemy.x += enemy.vx * dashSpeed * dt
      enemy.y += enemy.vy * dashSpeed * dt
    } else if (enemy.kind === 'shooter') {
      const direction = distance > 270 ? 1 : distance < 205 ? -1 : 0
      enemy.x += (dx / distance) * 58 * direction * dt
      enemy.y += (dy / distance) * 58 * direction * dt
      if (enemy.cooldown <= 0) {
        const projectileId = state.nextId++
        state.enemyProjectiles.push({ id: projectileId, x: enemy.x, y: enemy.y, vx: (dx / distance) * 190, vy: (dy / distance) * 190 })
        state.effects.push({ id: -projectileId, kind: 'enemy-shot', x: enemy.x, y: enemy.y - 24, value: 0, life: 0.24, angle: Math.atan2(dy, dx) })
        enemy.cooldown = 1.85
      }
    } else if (enemy.kind === 'boar') {
      enemy.facingX = dx / distance
      enemy.facingY = dy / distance
      enemy.x += enemy.facingX * (42 + state.wave) * dt
      enemy.y += enemy.facingY * (42 + state.wave) * dt
    } else if (enemy.kind === 'sorcerer') {
      const direction = distance > 390 ? 1 : distance < 280 ? -1 : 0
      enemy.x += (dx / distance) * 50 * direction * dt
      enemy.y += (dy / distance) * 50 * direction * dt
      if (enemy.cooldown <= 0) {
        state.enemyZones.push({ id: state.nextId++, x: state.player.x + state.player.facingX * 34, y: state.player.y + state.player.facingY * 34, radius: 76, life: 3.2, duration: 3.2 })
        enemy.cooldown = 4.1
      }
    }
    enemy.x = Math.min(1550, Math.max(50, enemy.x))
    enemy.y = Math.min(950, Math.max(75, enemy.y))
    if (distance < (enemy.kind === 'boss' ? 82 : 32) && state.player.hitCooldown === 0 && state.player.dashTime === 0) {
      const rawDamage = enemy.kind === 'boss' ? 10 : (enemy.kind === 'dasher' || enemy.kind === 'assassin' || enemy.elite) && enemy.dashTime > 0 ? 4 + Math.floor((state.wave - 1) / 2) : enemy.kind === 'boar' ? 3 + Math.floor((state.wave - 1) / 3) : 2 + Math.floor((state.wave - 1) / 3)
      const damage = Math.max(1, Math.floor(rawDamage * (1 - state.player.armor / (state.player.armor + 60))))
      const shieldBefore = state.player.shield
      const absorbed = Math.min(shieldBefore, damage)
      state.player.shield -= absorbed
      state.player.hp -= damage - absorbed
      state.player.hitCooldown = 1.15
      state.effects.push({ id: state.nextId++, kind: 'player-hit', x: state.player.x, y: state.player.y, value: damage, life: 0.35, angle: Math.atan2(dy, dx) })
      if (shieldBefore > 0 && state.player.shield === 0) {
        state.effects.push({ id: state.nextId++, kind: 'shield-break', x: state.player.x, y: state.player.y, value: 24, life: 0.42, angle: 0 })
        for (const nearbyEnemy of state.enemies) {
          const breakX = nearbyEnemy.x - state.player.x
          const breakY = nearbyEnemy.y - state.player.y
          const breakDistance = Math.max(0.001, Math.hypot(breakX, breakY))
          if (breakDistance <= 110) {
            dealEnemyDamage(state, nearbyEnemy, 24, state.player.x, state.player.y)
            if (nearbyEnemy.kind !== 'boss') {
              nearbyEnemy.x += (breakX / breakDistance) * 48
              nearbyEnemy.y += (breakY / breakDistance) * 48
            }
          }
        }
      }
    }
  }

  for (const hazard of state.bossHazards) {
    hazard.life -= dt
    if (hazard.life <= 0 && !hazard.triggered) {
      hazard.triggered = true
      const distance = Math.hypot(state.player.x - hazard.x, state.player.y - hazard.y)
      const hit = hazard.kind === 'root' ? distance <= hazard.radius : Math.abs(distance - hazard.radius) <= 34
      if (hit && state.player.dashTime === 0 && state.player.hitCooldown === 0) {
        const rawDamage = hazard.kind === 'root' ? 12 : 16
        const damage = Math.max(1, Math.floor(rawDamage * (1 - state.player.armor / (state.player.armor + 60))))
        const shieldBefore = state.player.shield
        const absorbed = Math.min(shieldBefore, damage)
        state.player.shield -= absorbed
        state.player.hp -= damage - absorbed
        state.player.hitCooldown = 1.05
        state.effects.push({ id: state.nextId++, kind: 'player-hit', x: state.player.x, y: state.player.y, value: damage, life: 0.35, angle: Math.atan2(state.player.y - hazard.y, state.player.x - hazard.x) })
        if (shieldBefore > 0 && state.player.shield === 0) {
          state.effects.push({ id: state.nextId++, kind: 'shield-break', x: state.player.x, y: state.player.y, value: 24, life: 0.42, angle: 0 })
          for (const enemy of state.enemies) {
            const breakX = enemy.x - state.player.x
            const breakY = enemy.y - state.player.y
            const breakDistance = Math.max(0.001, Math.hypot(breakX, breakY))
            if (breakDistance <= 110) {
              dealEnemyDamage(state, enemy, 24, state.player.x, state.player.y)
              if (enemy.kind !== 'boss') {
                enemy.x += (breakX / breakDistance) * 48
                enemy.y += (breakY / breakDistance) * 48
              }
            }
          }
        }
      }
    }
  }

  if (state.characterId !== 'qingtuan' && state.bambooCooldown <= 0) {
    let target: GameState['enemies'][number] | undefined
    const attackRadius = state.player.meleeRange + (state.characterId === 'shimo' ? 8 : 24)
    let targetDistance = attackRadius
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    if (target) {
      state.characterAttackCount += 1
      const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
      const critical = random(state) < state.player.criticalChance
      const whirlwind = state.characterId === 'shanlan' && state.characterAttackCount % 4 === 0
      const arc = whirlwind ? Math.PI / 2 : state.characterId === 'shimo' ? Math.PI / 5 : Math.PI / 4
      const damage = Math.round((state.characterId === 'shimo' ? 34 : 38) * state.player.damage * state.player.meleeDamage * (critical ? 1.75 : 1))
      let hitCount = 0
      for (const enemy of state.enemies) {
        const dx = enemy.x - state.player.x
        const dy = enemy.y - state.player.y
        const distance = Math.max(0.001, Math.hypot(dx, dy))
        const angleDelta = Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle))
        if (distance <= attackRadius && Math.abs(angleDelta) <= arc && hitCount < 8) {
          hitCount += 1
          const appliedDamage = dealEnemyDamage(state, enemy, damage, state.player.x, state.player.y)
          if (enemy.kind !== 'boss') {
            const knockback = state.characterId === 'shimo' ? critical ? 46 : 34 : critical ? 22 : 14
            enemy.x = Math.min(1550, Math.max(50, enemy.x + (dx / distance) * knockback))
            enemy.y = Math.min(950, Math.max(75, enemy.y + (dy / distance) * knockback))
          }
          state.effects.push({ id: state.nextId++, kind: critical ? 'crit' : 'hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.42, angle })
        }
      }
      if (whirlwind) state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.max(1, Math.ceil(state.player.maxHp * 0.01)))
      state.attacks.push({
        id: state.nextId++, x: state.player.x, y: state.player.y, life: 0.28, radius: attackRadius, angle, arc, critical,
        kind: whirlwind ? 'whirlwind' : state.characterId === 'shimo' ? 'shield' : 'staff',
      })
    }
    state.bambooCooldown = 0.62 / state.player.attackSpeed
  }

  if (state.characterId === 'qingtuan' && state.leafCooldown <= 0 && state.enemies.length > 0) {
    let target = state.enemies[0]
    let targetDistance = Math.hypot(target.x - state.player.x, target.y - state.player.y)
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    for (let index = 0; index < state.player.projectileCount; index += 1) {
      state.characterAttackCount += 1
      const baseAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x) + (index - (state.player.projectileCount - 1) / 2) * 0.16
      const critical = random(state) < state.player.criticalChance
      const split = state.characterAttackCount % 6 === 0
      for (const angleOffset of split ? [-0.22, 0, 0.22] : [0]) {
        const angle = baseAngle + angleOffset
        state.playerProjectiles.push({
          id: state.nextId++, kind: 'leaf', x: state.player.x, y: state.player.y,
          vx: Math.cos(angle) * state.player.projectileSpeed, vy: Math.sin(angle) * state.player.projectileSpeed,
          damage: Math.round(24 * state.player.damage * state.player.rangedDamage * (critical ? 1.75 : 1) * (split ? 0.45 : 1)), critical, blastRadius: 0,
        })
      }
    }
    state.leafCooldown = 0.88 / state.player.attackSpeed
  }

  const gauntletLevel = state.weaponLevels['iron-pot-gauntlets'] ?? 0
  if (gauntletLevel > 0 && state.gauntletCooldown <= 0) {
    let target: GameState['enemies'][number] | undefined
    const radius = 62 + gauntletLevel * 4
    let targetDistance = radius
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    if (target) {
      const targetAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
      const critical = random(state) < state.player.criticalChance
      const strikes = gauntletLevel >= 3 ? 2 : 1
      for (let strike = 0; strike < strikes; strike += 1) {
        const angle = targetAngle + (strike - (strikes - 1) / 2) * 0.18
        const damage = Math.round((15 + gauntletLevel * 4) * (strike === 0 ? 1 : 0.65) * state.player.damage * state.player.meleeDamage * (critical ? 1.75 : 1))
        let hitCount = 0
        for (const enemy of state.enemies) {
          const dx = enemy.x - state.player.x
          const dy = enemy.y - state.player.y
          const distance = Math.max(0.001, Math.hypot(dx, dy))
          const angleDelta = Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle))
          if (distance <= radius && Math.abs(angleDelta) <= Math.PI / 7 && hitCount < 3) {
            hitCount += 1
            const appliedDamage = dealEnemyDamage(state, enemy, damage, state.player.x, state.player.y)
            if (enemy.kind !== 'boss') {
              enemy.x = Math.min(1550, Math.max(50, enemy.x + dx / distance * 8))
              enemy.y = Math.min(950, Math.max(75, enemy.y + dy / distance * 8))
            }
            state.effects.push({ id: state.nextId++, kind: critical ? 'crit' : 'hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.36, angle })
          }
        }
        state.attacks.push({ id: state.nextId++, x: state.player.x, y: state.player.y, life: 0.18, radius, angle, arc: Math.PI / 7, critical, kind: 'fists' })
      }
    }
    state.gauntletCooldown = 0.44 / state.player.attackSpeed
  }

  const firecrackerLevel = state.weaponLevels['firecracker-launcher'] ?? 0
  if (firecrackerLevel > 0 && state.firecrackerCooldown <= 0 && state.enemies.length > 0) {
    let target = state.enemies[0]
    let targetDistance = Math.hypot(target.x - state.player.x, target.y - state.player.y)
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    const projectileCount = firecrackerLevel >= 3 ? 2 : 1
    const targetAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
    for (let index = 0; index < projectileCount; index += 1) {
      const angle = targetAngle + (index - (projectileCount - 1) / 2) * 0.18
      const critical = random(state) < state.player.criticalChance
      state.playerProjectiles.push({
        id: state.nextId++, kind: 'firecracker', x: state.player.x, y: state.player.y,
        vx: Math.cos(angle) * (250 + firecrackerLevel * 12), vy: Math.sin(angle) * (250 + firecrackerLevel * 12),
        damage: Math.round((24 + firecrackerLevel * 8) * state.player.damage * state.player.rangedDamage * (critical ? 1.75 : 1)),
        critical, blastRadius: 48 + firecrackerLevel * 8,
      })
    }
    state.firecrackerCooldown = 1.65 / state.player.attackSpeed
  }

  const bladeLevel = state.weaponLevels['spinning-bamboo-blade'] ?? 0
  if (bladeLevel > 0 && state.orbitCooldown <= 0) {
    const radius = 58 + bladeLevel * 5
    const damage = Math.round((8 + bladeLevel * 3) * state.player.damage * state.player.meleeDamage)
    const bladeCount = bladeLevel >= 5 ? 3 : bladeLevel >= 3 ? 2 : 1
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      const enemyAngle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x)
      let bladeIsPassing = false
      for (let index = 0; index < bladeCount; index += 1) {
        const bladeAngle = state.time * 5.4 + index * Math.PI * 2 / bladeCount
        const angleDelta = Math.atan2(Math.sin(enemyAngle - bladeAngle), Math.cos(enemyAngle - bladeAngle))
        if (Math.abs(angleDelta) <= 0.72) bladeIsPassing = true
      }
      if (Math.abs(distance - radius) <= 24 && bladeIsPassing) {
        const appliedDamage = dealEnemyDamage(state, enemy, damage, state.player.x, state.player.y)
        state.effects.push({ id: state.nextId++, kind: 'hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.36, angle: enemyAngle })
      }
    }
    state.orbitCooldown = 0.42 / state.player.attackSpeed
  }

  const gourdLevel = state.weaponLevels['panda-wine-gourd'] ?? 0
  if (gourdLevel > 0 && state.gourdCooldown <= 0 && state.enemies.length > 0) {
    let target = state.enemies[0]
    let targetDistance = Math.hypot(target.x - state.player.x, target.y - state.player.y)
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    const zoneCount = gourdLevel >= 3 ? 2 : 1
    const targetAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
    for (let index = 0; index < zoneCount; index += 1) {
      const offset = zoneCount === 1 ? 0 : (index === 0 ? -1 : 1) * 44
      const x = Math.min(1530, Math.max(70, target.x + Math.cos(targetAngle + Math.PI / 2) * offset))
      const y = Math.min(930, Math.max(95, target.y + Math.sin(targetAngle + Math.PI / 2) * offset))
      state.groundZones.push({
        id: state.nextId++, x, y, radius: 48 + gourdLevel * 6,
        life: 2.4 + gourdLevel * 0.15, duration: 2.4 + gourdLevel * 0.15,
        tickCooldown: 0, damage: Math.round((5 + gourdLevel * 2) * state.player.damage * state.player.rangedDamage),
      })
    }
    state.gourdCooldown = 2.4 / state.player.attackSpeed
  }

  for (const zone of state.groundZones) {
    zone.life -= dt
    zone.tickCooldown -= dt
    if (zone.tickCooldown <= 0) {
      for (const enemy of state.enemies) {
        if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) <= zone.radius) {
          const appliedDamage = dealEnemyDamage(state, enemy, zone.damage, zone.x, zone.y)
          state.effects.push({ id: state.nextId++, kind: 'firecracker-hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.42, angle: Math.atan2(enemy.y - zone.y, enemy.x - zone.x) })
        }
      }
      zone.tickCooldown = 0.45
    }
  }

  const turretLevel = state.weaponLevels['bamboo-crossbow-turret'] ?? 0
  const turretCount = turretLevel >= 5 ? 3 : turretLevel >= 3 ? 2 : 1
  if (turretLevel > 0 && state.turretDeployCooldown <= 0 && state.turrets.length < turretCount) {
    for (let index = state.turrets.length; index < turretCount; index += 1) {
      const angle = state.time * 0.7 + index * Math.PI * 2 / turretCount
      state.turrets.push({ id: state.nextId++, x: state.player.x + Math.cos(angle) * 62, y: state.player.y + Math.sin(angle) * 42, life: 12, cooldown: index * 0.16, level: turretLevel, angle })
    }
    state.turretDeployCooldown = 8
  }
  for (const turret of state.turrets) {
    turret.life -= dt
    turret.cooldown -= dt
    if (turret.cooldown <= 0 && state.enemies.length > 0) {
      let target = state.enemies[0]
      let targetDistance = Math.hypot(target.x - turret.x, target.y - turret.y)
      for (const enemy of state.enemies) {
        const distance = Math.hypot(enemy.x - turret.x, enemy.y - turret.y)
        if (distance < targetDistance) { target = enemy; targetDistance = distance }
      }
      turret.angle = Math.atan2(target.y - turret.y, target.x - turret.x)
      state.playerProjectiles.push({
        id: state.nextId++, kind: 'bolt', x: turret.x, y: turret.y,
        vx: Math.cos(turret.angle) * 520, vy: Math.sin(turret.angle) * 520,
        damage: Math.round((10 + turret.level * 3) * state.player.damage * state.player.rangedDamage), critical: false, blastRadius: 0,
      })
      turret.cooldown = Math.max(0.42, 0.95 - turret.level * 0.08) / state.player.attackSpeed
    }
  }

  for (const projectile of state.playerProjectiles) {
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt
    for (const enemy of state.enemies) {
      if (projectile.damage > 0 && Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < 24) {
        if (projectile.kind === 'firecracker') {
          state.effects.push({ id: state.nextId++, kind: 'firecracker-blast', x: projectile.x, y: projectile.y, value: projectile.blastRadius, life: 0.38, angle: 0 })
          for (const blastTarget of state.enemies) {
            if (Math.hypot(blastTarget.x - projectile.x, blastTarget.y - projectile.y) <= projectile.blastRadius) {
              const appliedDamage = dealEnemyDamage(state, blastTarget, projectile.damage, projectile.x, projectile.y)
              state.effects.push({ id: state.nextId++, kind: projectile.critical ? 'firecracker-crit' : 'firecracker-hit', x: blastTarget.x, y: blastTarget.y - 28, value: appliedDamage, life: 0.42, angle: Math.atan2(blastTarget.y - projectile.y, blastTarget.x - projectile.x) })
            }
          }
        } else {
          const appliedDamage = dealEnemyDamage(state, enemy, projectile.damage, projectile.x - projectile.vx * dt, projectile.y - projectile.vy * dt)
          state.effects.push({ id: state.nextId++, kind: projectile.critical ? 'projectile-crit' : 'projectile-hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.42, angle: Math.atan2(projectile.vy, projectile.vx) })
        }
        projectile.damage = 0
        break
      }
    }
  }

  for (const projectile of state.enemyProjectiles) {
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt
    if (state.player.hitCooldown === 0 && state.player.dashTime === 0 && Math.hypot(state.player.x - projectile.x, state.player.y - projectile.y) < 25) {
      const damage = Math.max(1, Math.floor((2 + Math.floor((state.wave - 1) / 3)) * (1 - state.player.armor / (state.player.armor + 60))))
      const shieldBefore = state.player.shield
      const absorbed = Math.min(shieldBefore, damage)
      state.player.shield -= absorbed
      state.player.hp -= damage - absorbed
      state.player.hitCooldown = 1.05
      state.effects.push({ id: state.nextId++, kind: 'player-hit', x: state.player.x, y: state.player.y, value: damage, life: 0.35, angle: Math.atan2(projectile.vy, projectile.vx) })
      projectile.x = -100
      if (shieldBefore > 0 && state.player.shield === 0) {
        state.effects.push({ id: state.nextId++, kind: 'shield-break', x: state.player.x, y: state.player.y, value: 24, life: 0.42, angle: 0 })
        for (const enemy of state.enemies) {
          const breakX = enemy.x - state.player.x
          const breakY = enemy.y - state.player.y
          const breakDistance = Math.max(0.001, Math.hypot(breakX, breakY))
          if (breakDistance <= 110) {
            dealEnemyDamage(state, enemy, 24, state.player.x, state.player.y)
            if (enemy.kind !== 'boss') {
              enemy.x += (breakX / breakDistance) * 48
              enemy.y += (breakY / breakDistance) * 48
            }
          }
        }
      }
    }
  }

  for (const drop of state.drops) {
    const dx = state.player.x - drop.x
    const dy = state.player.y - drop.y
    const distance = Math.max(0.001, Math.hypot(dx, dy))
    if (distance < state.player.pickupRange) {
      drop.x += (dx / distance) * 420 * dt
      drop.y += (dy / distance) * 420 * dt
    }
    if (distance < 24) {
      if (drop.kind === 'xp') state.player.xp += drop.value
      else if (drop.kind === 'coin') {
        const coinValue = drop.value * state.player.coinGain + state.player.coinRemainder
        state.player.coins += Math.floor(coinValue)
        state.player.coinRemainder = coinValue - Math.floor(coinValue)
      }
      else state.player.hp = Math.min(state.player.maxHp, state.player.hp + drop.value)
      drop.value = 0
    }
  }

  for (const attack of state.attacks) attack.life -= dt
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      if (enemy.kind === 'boss') {
        state.victory = true
        state.corruptionInset = 0
        state.enemyProjectiles = []
        state.bossHazards = []
        state.enemyZones = []
        state.effects.push({ id: state.nextId++, kind: 'kill', x: enemy.x, y: enemy.y, value: 0, life: 0.8, angle: 0 })
        continue
      }
      state.kills += 1
      state.drops.push({ id: state.nextId++, kind: 'xp', x: enemy.x, y: enemy.y, value: enemy.elite ? 10 : 4 })
      if (enemy.elite) {
        state.drops.push({ id: state.nextId++, kind: 'coin', x: enemy.x + 10, y: enemy.y, value: 12 })
        if (random(state) < 0.35) state.drops.push({ id: state.nextId++, kind: 'heal', x: enemy.x - 10, y: enemy.y, value: 10 })
      }
      if (state.kills % 2 === 0) state.drops.push({ id: state.nextId++, kind: 'coin', x: enemy.x + 8, y: enemy.y, value: 2 })
      if (state.kills % 8 === 0) state.drops.push({ id: state.nextId++, kind: 'heal', x: enemy.x - 8, y: enemy.y, value: 10 })
      state.effects.push({ id: state.nextId++, kind: 'kill', x: enemy.x, y: enemy.y, value: 0, life: 0.36, angle: 0 })
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0)
  state.playerProjectiles = state.playerProjectiles.filter((projectile) => projectile.damage > 0 && projectile.x > 0 && projectile.x < 1600 && projectile.y > 0 && projectile.y < 1000)
  state.groundZones = state.groundZones.filter((zone) => zone.life > 0)
  state.enemyZones = state.enemyZones.filter((zone) => zone.life > 0).slice(-6)
  state.turrets = state.turrets.filter((turret) => turret.life > 0)
  state.enemyProjectiles = state.enemyProjectiles.filter((projectile) => projectile.x > 0 && projectile.x < 1600 && projectile.y > 0 && projectile.y < 1000)
  state.bossHazards = state.bossHazards.filter((hazard) => hazard.life > -0.28)
  state.attacks = state.attacks.filter((attack) => attack.life > 0)
  state.drops = state.drops.filter((drop) => drop.value > 0).slice(-140)
  state.effects = state.effects.filter((effect) => effect.life > 0).slice(-80)

  if (!state.victory && state.player.xp >= state.player.nextXp) {
    state.player.xp -= state.player.nextXp
    state.player.level += 1
    state.player.nextXp = Math.round(state.player.nextXp * 1.24 + 6)
    const hasMeleeBuild = state.characterId !== 'qingtuan' || (state.weaponLevels['iron-pot-gauntlets'] ?? 0) > 0
    const hasRangedBuild = state.characterId === 'qingtuan' || (state.weaponLevels['firecracker-launcher'] ?? 0) > 0 || (state.weaponLevels['bamboo-crossbow-turret'] ?? 0) > 0
    const pool = (Object.keys(upgrades) as UpgradeId[]).filter((id) => (
      (id !== 'wide-sweep' || state.characterId !== 'qingtuan') && (id !== 'leaf-volley' || state.characterId === 'qingtuan') && !(id === 'leaf-volley' && state.player.projectileCount >= 3)
    ))
    const preferred = pool.filter((id) => (
      hasMeleeBuild && (id === 'power' || id === 'haste' || id === 'wide-sweep')
      || hasRangedBuild && (id === 'power' || id === 'haste' || id === 'leaf-volley')
      || state.ownedItems.some((itemId) => itemId === 'iron-bracer' || itemId === 'mountain-stone' || itemId === 'spirit-bamboo-tube') && (id === 'vitality' || id === 'footwork')
    ))
    state.upgradeChoices = [preferred[Math.floor(random(state) * preferred.length)] ?? pool[Math.floor(random(state) * pool.length)]]
    while (state.upgradeChoices.length < 3) {
      const choice = pool[Math.floor(random(state) * pool.length)]
      if (!state.upgradeChoices.includes(choice)) state.upgradeChoices.push(choice)
    }
    state.pendingUpgrade = true
  } else if (!state.victory && state.waveTime >= state.waveDuration && state.wave === 10) {
    const boss = state.enemies.find((enemy) => enemy.kind === 'boss')
    if (boss) boss.enraged = true
  } else if (!state.victory && state.waveTime >= state.waveDuration) {
    const pool: ShopProductId[] = [...Object.keys(items) as ItemId[], ...weaponIds].filter((id) => (
      isWeaponId(id) ? (state.weaponLevels[id] ?? 0) < 5 : !items[id].unique || !state.ownedItems.includes(id)
    ))
    const selected = state.lockedShopIndices.map((index) => state.shopChoices[index]).filter((id): id is ShopProductId => id !== null)
    state.shopChoices = state.shopChoices.map((id, index) => {
      if (state.lockedShopIndices.includes(index)) return id
      const available = pool.filter((candidate) => !selected.includes(candidate))
      const rarityRoll = random(state) * 100
      const rarity = rarityRoll < 60 ? '普通' : rarityRoll < 87 ? '稀有' : '史诗'
      const rarityPool = available.filter((candidate) => (isWeaponId(candidate) ? weapons[candidate] : items[candidate]).rarity === rarity)
      const choices = rarityPool.length ? rarityPool : available
      const choice = choices[Math.floor(random(state) * choices.length)] ?? null
      if (choice) selected.push(choice)
      return choice
    })
    state.shopOpen = true
  }

  if (!state.victory && state.player.hp <= 0) {
    state.player.hp = 0
    state.gameOver = true
  }
}
