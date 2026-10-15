import { characters, type CharacterId } from './game/content/characters.js'
import { enemyDefinitions, regularEnemyIds, injurySources, type EnemyKind } from './game/content/enemies.js'
import { items, type ItemId } from './game/content/items.js'
import { upgrades, type UpgradeId } from './game/content/upgrades.js'
import { weapons, signatureWeapons, weaponIds, isWeaponId, isSignatureWeaponId, type ShopProductId, type WeaponId, type SignatureWeaponId } from './game/content/weapons.js'
import type { DamageSource, EnemyState, GameState, PlayerInput, PlayerProjectileState } from './game/simulation/state.js'

const random = (state: GameState): number => {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0
  return state.seed / 4294967296
}

export const getBambooWeaponCount = (state: GameState): number => 1
  + ((state.weaponLevels['spinning-bamboo-blade'] ?? 0) > 0 ? 1 : 0)
  + ((state.weaponLevels['bamboo-crossbow-turret'] ?? 0) > 0 ? 1 : 0)

// 战斗与只读预览共用；level 可指定下一等级或场上旧弩台的部署等级。
export const getWeaponGrowth = (state: GameState, id: WeaponId | SignatureWeaponId, level: number) => {
  const rate = state.player.attackSpeed / state.player.cooldownMultiplier
  switch (id) {
    case 'bamboo-staff':
    case 'iron-bamboo-shield':
      return { baseDamage: (id === 'iron-bamboo-shield' ? 34 : 38) * (1 + (level - 1) * 0.12), radius: state.player.meleeRange + (id === 'iron-bamboo-shield' ? 8 : 24) + (level - 1) * 4 + (id === 'bamboo-staff' && state.signatureWeaponEvolved ? 18 : 0), count: id === 'bamboo-staff' && state.signatureWeaponEvolved ? 2 : 1, duration: 0, interval: 0.62 / rate }
    case 'leaf-dart':
      return { baseDamage: 24 + (level - 1) * 4, radius: 0, count: state.player.projectileCount + state.player.extraProjectiles, duration: 0, interval: 0.88 / rate }
    case 'iron-pot-gauntlets':
      return { baseDamage: 15 + level * 4, radius: 62 + level * 4, count: level >= 3 ? 2 : 1, duration: 0, interval: 0.44 / rate }
    case 'firecracker-launcher':
      return { baseDamage: 24 + level * 8, radius: 48 + level * 8, count: (level >= 3 ? 2 : 1) + state.player.extraProjectiles, duration: 0, interval: 1.65 / rate }
    case 'spinning-bamboo-blade':
      return { baseDamage: 8 + level * 3, radius: 58 + level * 5, count: level >= 5 ? 3 : level >= 3 ? 2 : 1, duration: 0, interval: 0.42 / rate }
    case 'panda-wine-gourd':
      return { baseDamage: 5 + level * 2, radius: 48 + level * 6, count: level >= 3 ? 2 : 1, duration: 2.4 + level * 0.15, interval: 2.4 / rate }
    case 'bamboo-crossbow-turret':
      return { baseDamage: 10 + level * 3, radius: 0, count: level >= 5 ? 3 : level >= 3 ? 2 : 1, duration: 12, interval: Math.max(0.42, 0.95 - level * 0.08) / rate }
  }
}

const rollUpgradeChoice = (state: GameState, pool: UpgradeId[]): UpgradeId => {
  const roll = random(state) * 100
  const rarity = roll < 60 ? '普通' : roll < 87 ? '稀有' : roll < 97 ? '史诗' : '传说'
  const rarityPool = pool.filter((id) => upgrades[id].rarity === rarity)
  const choices = rarityPool.length ? rarityPool : pool
  return choices[Math.floor(random(state) * choices.length)]
}

const reduceIncomingDamage = (state: GameState, rawDamage: number): number => {
  const armor = state.player.armor + (state.player.ironArmorTime > 0 ? 8 : 0)
  return Math.max(1, Math.floor(rawDamage * (1 - armor / (armor + 60))))
}

const dealEnemyDamage = (state: GameState, enemy: EnemyState, rawDamage: number, sourceX: number, sourceY: number, source: DamageSource, critical = false): number => {
  if (enemy.hp <= 0) {
    state.runStats.damage[source] ??= 0
    return 0
  }
  const battleFury = state.chosenUpgrades.includes('battle-fury') ? Math.floor(state.waveKills / 50) * 0.02 : 0
  const weaponHit = source in weapons || source in signatureWeapons
  let comboDamage = 1
  if (weaponHit && state.ownedItems.includes('chain-copper-clasp')) {
    if (state.comboTargetId !== enemy.id) {
      state.comboTargetId = enemy.id
      state.comboHits = 0
    }
    comboDamage += Math.min(5, state.comboHits) * 0.04
    state.comboHits = Math.min(5, state.comboHits + 1)
  }
  let damage = Math.max(1, Math.round(rawDamage * (1 + battleFury) * (1 + state.totemBonus) * comboDamage * (state.player.overflowDamageTime > 0 ? 1.2 : 1) * (enemy.kind === 'boss' || enemy.elite ? state.player.eliteDamage : state.player.normalDamage)))
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
  state.runStats.damage[source] = (state.runStats.damage[source] ?? 0) + Math.min(Math.max(0, enemy.hp), damage)
  enemy.hp -= damage
  if (enemy.hp <= 0 && critical && weaponHit && state.ownedItems.includes('army-breaker-token')) {
    state.effects.push({ id: state.nextId++, kind: 'army-blast', x: enemy.x, y: enemy.y, value: 90, life: 0.45, angle: 0 })
    for (const target of state.enemies) {
      if (target.hp > 0 && Math.hypot(target.x - enemy.x, target.y - enemy.y) <= 90) {
        dealEnemyDamage(state, target, 40 * state.player.damage, enemy.x, enemy.y, 'army-breaker-token')
      }
    }
  }
  return damage
}

// 每次有效攻击只调用一次，齐射数量和持续伤害不加快手鼓计数。
const recordAttack = (state: GameState): void => {
  if (!state.ownedItems.includes('thunder-drum')) return
  state.thunderAttacks += 1
  if (state.thunderAttacks < 10) return
  state.thunderAttacks = 0
  const hitIds: number[] = []
  let x = state.player.x
  let y = state.player.y
  for (let jump = 0; jump < 3; jump += 1) {
    let target: EnemyState | undefined
    let distance = 180
    for (const enemy of state.enemies) {
      const nextDistance = Math.hypot(enemy.x - x, enemy.y - y)
      if (enemy.hp > 0 && !hitIds.includes(enemy.id) && nextDistance <= distance) {
        target = enemy
        distance = nextDistance
      }
    }
    if (!target) break
    state.effects.push({ id: state.nextId++, kind: 'chain-lightning', x, y, value: distance, life: 0.3, angle: Math.atan2(target.y - y, target.x - x) })
    dealEnemyDamage(state, target, 24 * state.player.damage, x, y, 'thunder-drum')
    hitIds.push(target.id)
    x = target.x
    y = target.y
  }
}

const recordInjury = (state: GameState, lostHp: number, absorbed: number, source: keyof typeof injurySources): void => {
  state.runStats.shieldAbsorbed += absorbed
  if (lostHp > 0) {
    state.runStats.injuries[source] = (state.runStats.injuries[source] ?? 0) + lostHp
    state.runStats.lastInjury = source
  }
}

const triggerShieldBreak = (state: GameState): void => {
  if (state.ownedItems.includes('taiji-jade')) {
    state.effects.push({ id: state.nextId++, kind: 'taiji-wave', x: state.player.x, y: state.player.y, value: 130, life: 0.5, angle: 0 })
    for (const enemy of state.enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) <= 130) dealEnemyDamage(state, enemy, 36 * state.player.damage, state.player.x, state.player.y, 'taiji-jade')
    }
  }
  state.effects.push({ id: state.nextId++, kind: 'shield-break', x: state.player.x, y: state.player.y, value: 24, life: 0.42, angle: 0 })
  for (const enemy of state.enemies) {
    const breakX = enemy.x - state.player.x
    const breakY = enemy.y - state.player.y
    const breakDistance = Math.max(0.001, Math.hypot(breakX, breakY))
    if (breakDistance <= 110) {
      dealEnemyDamage(state, enemy, 24, state.player.x, state.player.y, 'iron-bamboo-shield')
      if (enemy.kind !== 'boss') {
        enemy.x += (breakX / breakDistance) * 48
        enemy.y += (breakY / breakDistance) * 48
      }
    }
  }
  if (state.characterId === 'shimo' && state.signatureWeaponEvolved) {
    state.groundZones.push({
      id: state.nextId++, kind: 'mountain', x: state.player.x, y: state.player.y, radius: 150,
      life: 2.4, duration: 2.4, tickCooldown: 0, damage: Math.round(14 * state.player.damage * state.player.meleeDamage),
    })
  }
}

const applyPlayerHit = (state: GameState, rawDamage: number, source: keyof typeof injurySources, hitCooldown: number, angle: number): boolean => {
  if (state.player.dodgeChance > 0 && random(state) < state.player.dodgeChance) {
    state.player.hitCooldown = 0.3
    return false
  }
  const damage = reduceIncomingDamage(state, rawDamage)
  const shieldBefore = state.player.shield
  const absorbed = Math.min(shieldBefore, damage)
  const fatalDamage = damage - absorbed >= state.player.hp
  const saved = fatalDamage && state.ownedItems.includes('tumbler-charm') && !state.lastStandUsed
  const lostHp = saved ? Math.max(0, state.player.hp - 1) : Math.min(state.player.hp, damage - absorbed)
  recordInjury(state, lostHp, absorbed, source)
  state.player.shield -= absorbed
  state.player.hp -= lostHp
  state.player.hitCooldown = hitCooldown
  state.effects.push({ id: state.nextId++, kind: 'player-hit', x: state.player.x, y: state.player.y, value: damage, life: 0.35, angle })
  if (saved) {
    state.lastStandUsed = true
    state.effects.push({ id: state.nextId++, kind: 'last-stand', x: state.player.x, y: state.player.y, value: 1, life: 0.8, angle: 0 })
  }
  if (shieldBefore > 0 && state.player.shield === 0) triggerShieldBreak(state)
  return true
}

const applyHealing = (state: GameState, amount: number): number => {
  const healing = Math.min(amount, Math.max(0, state.player.maxHp - state.player.hp))
  state.player.hp += healing
  if (amount > healing && state.ownedItems.includes('wine-immortal-gourd')) state.player.overflowDamageTime = 5
  return healing
}

export const createGameState = (seed = 20260831, characterId: CharacterId = 'shanlan'): GameState => ({
  characterId,
  seed,
  runStats: { initialSeed: seed, damage: {}, injuries: {}, shieldAbsorbed: 0, upgradeRefreshes: 0, talentTriggers: {}, maxBattleFuryStacks: 0 },
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
  freeUpgradeRefreshUsed: false,
  upgradeRefreshCost: 6,
  shopChoices: ['iron-pot-gauntlets', 'firecracker-launcher', 'iron-bracer', 'panda-roller'],
  lockedShopIndices: [],
  shopRefreshCost: 4,
  ownedItems: [],
  signatureWeaponLevel: 1,
  signatureWeaponEvolved: false,
  weaponLevels: {},
  chosenUpgrades: [],
  waveKills: 0,
  bossAttackCount: 0,
  bossIntroTime: 0,
  corruptionInset: 0,
  lastStandUsed: false,
  comboTargetId: null,
  comboHits: 0,
  thunderAttacks: 0,
  stationaryTime: 0,
  totemBonus: 0,
  player: {
    x: 800, y: 500,
    hp: characters[characterId].baseStats.maxHp,
    level: 1, xp: 0, nextXp: 18, coins: 0,
    ...characters[characterId].baseStats,
    coinRemainder: 0,
    dashCooldown: 0, dashTime: 0, dashX: 1, dashY: 0, facingX: 1, facingY: 0, hitCooldown: 0, dashBurstPending: false,
    shield: 0, shieldMax: 0, shieldTimer: characterId === 'shimo' ? 8 : 0, ironArmorTime: 0, overflowDamageTime: 0,
  },
  enemies: [], playerProjectiles: [], enemyProjectiles: [], bossHazards: [], attacks: [], groundZones: [], enemyZones: [], turrets: [], drops: [], effects: [],
})

const recalculateBuildStats = (state: GameState): void => {
  const base = characters[state.characterId].baseStats
  let maxHp = base.maxHp
  let moveSpeed = base.moveSpeed
  let attackSpeed = base.attackSpeed
  let normalDamage = base.normalDamage
  let criticalChance = base.criticalChance
  let rangedDamage = base.rangedDamage
  let damage = base.damage
  let dodgeChance = base.dodgeChance
  let reflectDamage = base.reflectDamage
  let cooldownMultiplier = base.cooldownMultiplier
  let basicAttackDamage = base.basicAttackDamage
  let luck = base.luck
  let shopPriceMultiplier = base.shopPriceMultiplier
  let extraProjectiles = base.extraProjectiles
  let projectileDamage = base.projectileDamage
  for (const id of state.ownedItems) {
    if (id === 'bamboo-dew-pill') maxHp += 10
    if (id === 'jade-eyepatch') { maxHp -= 5; criticalChance += 0.08 }
    if (id === 'iron-bracer' || id === 'spirit-bamboo-tube') moveSpeed -= 0.03
    if (id === 'mountain-stone') moveSpeed -= 0.05
    if (id === 'gale-leggings') attackSpeed += 0.08
    if (id === 'thunder-drum') attackSpeed -= 0.05
    if (id === 'tiger-seal') normalDamage -= 0.05
    if (id === 'wind-feather') rangedDamage += 0.05
    if (id === 'barbed-backplate') { reflectDamage += 12; dodgeChance -= 0.05 }
    if (id === 'twin-bamboo') { extraProjectiles += 1; projectileDamage *= 0.85 }
    if (id === 'monk-beads') { cooldownMultiplier *= 0.9; basicAttackDamage *= 0.95 }
    if (id === 'lucky-bell') { luck += 0.15; shopPriceMultiplier += 0.05 }
  }
  for (const id of state.chosenUpgrades) {
    if (id === 'power') damage += 0.12
    if (id === 'vitality') maxHp += 5
    if (id === 'footwork') moveSpeed += 0.1
    if (id === 'haste') attackSpeed += 0.1
    if (id === 'wide-sweep') attackSpeed -= 0.05
    if (id === 'leaf-volley') rangedDamage *= 0.9
  }
  if (state.chosenUpgrades.includes('bamboo-unity')) damage += getBambooWeaponCount(state) * 0.05
  state.player.maxHp = Math.max(1, Math.floor(maxHp * (state.ownedItems.includes('taiji-jade') ? 0.85 : 1)))
  state.player.criticalDamage = state.ownedItems.includes('army-breaker-token') ? 1.4 : base.criticalDamage
  state.player.moveSpeed = Math.max(0.5, Number(moveSpeed.toFixed(8)))
  state.player.attackSpeed = Math.max(0.55, Number(attackSpeed.toFixed(8)))
  state.player.normalDamage = Math.max(0.5, Number(normalDamage.toFixed(8)))
  state.player.criticalChance = Math.min(1, Number(criticalChance.toFixed(8)))
  state.player.dodgeChance = Math.max(0, Number(dodgeChance.toFixed(8)))
  state.player.reflectDamage = reflectDamage
  state.player.cooldownMultiplier = Math.max(0.5, Number(cooldownMultiplier.toFixed(8)))
  state.player.basicAttackDamage = Math.max(0.5, Number(basicAttackDamage.toFixed(8)))
  state.player.luck = Number(luck.toFixed(8))
  state.player.shopPriceMultiplier = Number(shopPriceMultiplier.toFixed(8))
  state.player.extraProjectiles = Math.min(2, extraProjectiles)
  state.player.projectileDamage = Math.max(0.5, Number(projectileDamage.toFixed(8)))
  state.player.rangedDamage = rangedDamage
  state.player.damage = Number(damage.toFixed(8))
  state.player.hp = Math.min(state.player.hp, state.player.maxHp)
}

export const chooseUpgrade = (state: GameState, id: UpgradeId): boolean => {
  if (!state.pendingUpgrade || !state.upgradeChoices.includes(id)) return false
  if (id === 'leaf-volley') {
    state.player.projectileCount = Math.min(3, state.player.projectileCount + 1)
  }
  if (id === 'wide-sweep') {
    state.player.meleeRange += 18
  }
  state.chosenUpgrades.push(id)
  recalculateBuildStats(state)
  if (id === 'vitality') applyHealing(state, 5)
  state.pendingUpgrade = false
  state.upgradeChoices = []
  return true
}

export const refreshUpgrades = (state: GameState): boolean => {
  if (!state.pendingUpgrade) return false
  if (state.freeUpgradeRefreshUsed && state.player.coins < state.upgradeRefreshCost) return false
  if (state.freeUpgradeRefreshUsed) state.player.coins -= state.upgradeRefreshCost
  else state.freeUpgradeRefreshUsed = true
  state.runStats.upgradeRefreshes += 1
  const previous = state.upgradeChoices
  const eligible = (Object.keys(upgrades) as UpgradeId[]).filter((id) => (
    (id !== 'wide-sweep' || state.characterId !== 'qingtuan')
    && (id !== 'leaf-volley' || state.characterId === 'qingtuan')
    && !(id === 'leaf-volley' && state.player.projectileCount >= 3)
    && (!upgrades[id].unique || !state.chosenUpgrades.includes(id))
  ))
  const fresh = eligible.filter((id) => !previous.includes(id))
  const pool = fresh.length >= 3 ? fresh : eligible
  const hasMeleeBuild = state.characterId !== 'qingtuan' || (state.weaponLevels['iron-pot-gauntlets'] ?? 0) > 0
  const hasRangedBuild = state.characterId === 'qingtuan' || (state.weaponLevels['firecracker-launcher'] ?? 0) > 0 || (state.weaponLevels['bamboo-crossbow-turret'] ?? 0) > 0
  const preferred = pool.filter((id) => (
    hasMeleeBuild && (id === 'power' || id === 'haste' || id === 'wide-sweep' || id === 'thorn-fur')
    || hasRangedBuild && (id === 'power' || id === 'haste' || id === 'leaf-volley' || id === 'battle-fury')
    || state.ownedItems.some((itemId) => itemId === 'iron-bracer' || itemId === 'mountain-stone' || itemId === 'spirit-bamboo-tube') && (id === 'vitality' || id === 'footwork' || id === 'iron-constitution')
  ))
  state.upgradeChoices = [rollUpgradeChoice(state, preferred.length ? preferred : pool)]
  while (state.upgradeChoices.length < 3) {
    const choice = rollUpgradeChoice(state, pool.filter((id) => !state.upgradeChoices.includes(id)))
    if (!state.upgradeChoices.includes(choice)) state.upgradeChoices.push(choice)
  }
  return true
}

export const buyItem = (state: GameState, index: number): boolean => {
  const id = state.shopChoices[index]
  if (!id) return false
  const product = isWeaponId(id) ? weapons[id] : isSignatureWeaponId(id) ? signatureWeapons[id] : items[id]
  const maxStacks = !isWeaponId(id) && !isSignatureWeaponId(id) ? items[id].unique ? 1 : items[id].maxStacks : undefined
  const atStackLimit = maxStacks !== undefined && state.ownedItems.filter((itemId) => itemId === id).length >= maxStacks
  const price = getShopPrice(state, product.price)
  if (!state.shopOpen || state.player.coins < price || atStackLimit) return false
  if (isSignatureWeaponId(id)) {
    if (id !== characters[state.characterId].weaponId || state.signatureWeaponLevel >= 5 || state.signatureWeaponEvolved) return false
    state.signatureWeaponLevel += 1
  } else if (isWeaponId(id)) {
    const level = state.weaponLevels[id] ?? 0
    if (level >= 5 || level === 0 && Object.keys(state.weaponLevels).length >= 3) return false
    state.weaponLevels[id] = level + 1
  } else {
    state.ownedItems.push(id)
  }
  state.player.coins -= price
  const reachesStackLimit = maxStacks !== undefined && state.ownedItems.filter((itemId) => itemId === id).length >= maxStacks
  state.shopChoices = state.shopChoices.map((choice, choiceIndex) => reachesStackLimit && choice === id || choiceIndex === index ? null : choice)
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
  if (id === 'guild-token') state.shopRefreshCost += 3
  recalculateBuildStats(state)
  if (id === 'bamboo-dew-pill') applyHealing(state, 10)
  const signature = signatureWeapons[characters[state.characterId].weaponId]
  if (!state.signatureWeaponEvolved && state.signatureWeaponLevel === 5 && state.ownedItems.includes(signature.evolution.requiredItem)) {
    state.signatureWeaponEvolved = true
  }
  return true
}

export const refreshShop = (state: GameState): boolean => {
  const soldOut = state.shopChoices.every((id) => id === null)
  if (!state.shopOpen || (!soldOut && state.player.coins < state.shopRefreshCost) || state.shopChoices.every((id, index) => id !== null && state.lockedShopIndices.includes(index))) return false
  if (!soldOut) {
    state.player.coins -= state.shopRefreshCost
    state.shopRefreshCost += 2
  }
  const signatureId = characters[state.characterId].weaponId
  const pool: ShopProductId[] = [...Object.keys(items) as ItemId[], ...weaponIds, signatureId, ...(state.chosenUpgrades.includes('bamboo-unity') ? ['spinning-bamboo-blade', 'spinning-bamboo-blade', 'bamboo-crossbow-turret', 'bamboo-crossbow-turret'] as WeaponId[] : [])].filter((id) => (
    isSignatureWeaponId(id) ? state.signatureWeaponLevel < 5 && !state.signatureWeaponEvolved
      : isWeaponId(id) ? (state.weaponLevels[id] ?? 0) < 5 : state.ownedItems.filter((itemId) => itemId === id).length < (items[id].unique ? 1 : items[id].maxStacks ?? Infinity)
  ))
  const selected = state.lockedShopIndices.map((index) => state.shopChoices[index]).filter((id): id is ShopProductId => id !== null)
  const guaranteedIndex = state.ownedItems.includes('guild-token') && !selected.some((id) => (isWeaponId(id) ? weapons[id] : isSignatureWeaponId(id) ? signatureWeapons[id] : items[id]).rarity !== '普通')
    ? state.shopChoices.findIndex((_id, index) => !state.lockedShopIndices.includes(index)) : -1
  state.shopChoices = state.shopChoices.map((id, index) => {
    if (state.lockedShopIndices.includes(index)) return id
    const available = pool.filter((candidate) => !selected.includes(candidate))
    const rarityRoll = random(state) * 100
    const rarity = rarityRoll >= 97 ? '传说' : rarityRoll >= 87 - Math.min(60, state.player.luck * 20) ? '史诗' : index === guaranteedIndex || rarityRoll >= 60 - Math.min(60, state.player.luck * 20) ? '稀有' : '普通'
    const rarityPool = available.filter((candidate) => (isWeaponId(candidate) ? weapons[candidate] : isSignatureWeaponId(candidate) ? signatureWeapons[candidate] : items[candidate]).rarity === rarity)
    const choices = rarityPool.length ? rarityPool : available
    const choice = choices[Math.floor(random(state) * choices.length)] ?? null
    if (choice) selected.push(choice)
    return choice
  })
  return true
}

export const getShopPrice = (state: GameState, basePrice: number): number => Math.ceil(basePrice * state.player.shopPriceMultiplier)

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
  if (id === 'chain-copper-clasp') {
    state.comboTargetId = null
    state.comboHits = 0
  }
  if (id === 'guild-token') state.shopRefreshCost = Math.max(4, state.shopRefreshCost - 3)
  if (id === 'wine-immortal-gourd') state.player.overflowDamageTime = 0
  if (id === 'thunder-drum') state.thunderAttacks = 0
  if (id === 'bamboo-totem') { state.stationaryTime = 0; state.totemBonus = 0 }
  recalculateBuildStats(state)
  return true
}

export const sellWeapon = (state: GameState, id: WeaponId): boolean => {
  const level = state.weaponLevels[id] ?? 0
  if (!state.shopOpen || level === 0) return false
  state.player.coins += Math.floor(weapons[id].price * level * 0.6)
  delete state.weaponLevels[id]
  if (id === 'panda-wine-gourd') state.groundZones = state.groundZones.filter((zone) => zone.kind !== 'wine')
  if (id === 'bamboo-crossbow-turret') {
    state.turrets = []
    state.playerProjectiles = state.playerProjectiles.filter((projectile) => projectile.kind !== 'bolt')
  }
  if (id === 'firecracker-launcher') state.playerProjectiles = state.playerProjectiles.filter((projectile) => projectile.kind !== 'firecracker')
  recalculateBuildStats(state)
  return true
}

export const continueWave = (state: GameState): boolean => {
  if (!state.shopOpen) return false
  state.shopOpen = false
  state.shopRefreshCost = 4 + (state.ownedItems.includes('guild-token') ? 3 : 0)
  state.shopChoices = state.shopChoices.map((id, index) => state.lockedShopIndices.includes(index) ? id : null)
  state.wave += 1
  state.waveKills = 0
  state.thunderAttacks = 0
  state.stationaryTime = 0
  state.totemBonus = 0
  state.freeUpgradeRefreshUsed = false
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
  applyHealing(state, Math.ceil(state.player.maxHp * (0.35 + state.player.waveHealing)))
  return true
}

export const stepGame = (state: GameState, input: PlayerInput, elapsed: number): void => {
  if (state.gameOver || state.victory || state.pendingUpgrade || state.shopOpen) return
  const dt = Math.min(elapsed, 0.05)
  const shieldBeforeStep = state.player.shield
  state.time += dt
  state.waveTime += dt
  state.bossIntroTime = Math.max(0, state.bossIntroTime - dt)
  state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt)
  const previousDashTime = state.player.dashTime
  state.player.dashTime = Math.max(0, state.player.dashTime - dt)
  state.player.hitCooldown = Math.max(0, state.player.hitCooldown - dt)
  state.player.ironArmorTime = Math.max(0, state.player.ironArmorTime - dt)
  state.player.overflowDamageTime = Math.max(0, state.player.overflowDamageTime - dt)
  if (state.characterId === 'shimo') {
    state.player.shieldTimer -= dt
    if (state.player.shieldTimer <= 0) {
      state.player.shieldMax = Math.ceil(state.player.maxHp * 0.08 * state.player.shieldPower)
      state.player.shield = state.player.shieldMax
      state.player.shieldTimer = 8
      if (state.player.shield > shieldBeforeStep && state.ownedItems.includes('taiji-jade')) {
        state.effects.push({ id: state.nextId++, kind: 'taiji-wave', x: state.player.x, y: state.player.y, value: 130, life: 0.5, angle: 0 })
        for (const enemy of state.enemies) {
          if (enemy.hp > 0 && Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) <= 130) dealEnemyDamage(state, enemy, 36 * state.player.damage, state.player.x, state.player.y, 'taiji-jade')
        }
      }
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
    const itemDamage = state.ownedItems.includes('panda-roller') ? 32 : 0
    const talentDamage = state.chosenUpgrades.includes('panda-roll') ? 48 : 0
    state.effects.push({ id: state.nextId++, kind: 'dash-burst', x: state.player.x, y: state.player.y, value: itemDamage + talentDamage, life: 0.35, angle: Math.atan2(state.player.dashY, state.player.dashX) })
    for (const enemy of state.enemies) {
      const dx = enemy.x - state.player.x
      const dy = enemy.y - state.player.y
      const distance = Math.max(0.001, Math.hypot(dx, dy))
      if (distance < 118) {
        if (itemDamage) dealEnemyDamage(state, enemy, itemDamage, state.player.x, state.player.y, 'panda-roller')
        if (talentDamage) {
          dealEnemyDamage(state, enemy, talentDamage, state.player.x, state.player.y, 'panda-roll')
          state.runStats.talentTriggers['panda-roll'] = (state.runStats.talentTriggers['panda-roll'] ?? 0) + 1
        }
        if (enemy.kind !== 'boss') {
          enemy.x += (dx / distance) * 42
          enemy.y += (dy / distance) * 42
        }
      }
    }
  }

  const inputLength = Math.hypot(input.x, input.y)
  if (state.ownedItems.includes('bamboo-totem')) {
    if (inputLength > 0 || input.dash || previousDashTime > 0) state.stationaryTime = 0
    else state.stationaryTime = Math.min(2, state.stationaryTime + dt)
    state.totemBonus = state.stationaryTime >= 2 ? 0.25 : Math.max(0, state.totemBonus - dt * 0.125)
  }
  const moveX = inputLength > 0 ? input.x / inputLength : 0
  const moveY = inputLength > 0 ? input.y / inputLength : 0
  if (inputLength > 0) {
    state.player.facingX = moveX
    state.player.facingY = moveY
  }
  if (input.dash && state.player.dashCooldown === 0) {
    state.player.dashTime = 0.22
    state.player.dashCooldown = 2.5 + (state.chosenUpgrades.includes('panda-roll') ? 0.4 : 0)
    state.player.dashX = inputLength > 0 ? moveX : state.player.facingX
    state.player.dashY = inputLength > 0 ? moveY : state.player.facingY
    state.player.dashBurstPending = state.ownedItems.includes('panda-roller') || state.chosenUpgrades.includes('panda-roll')
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
    if (enemy.hp <= 0) continue
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
      const playerWasHit = applyPlayerHit(state, rawDamage, enemy.elite && enemy.kind === 'chaser' ? 'elite-chaser' : enemy.kind, 1.15, Math.atan2(dy, dx))
      if (playerWasHit && state.chosenUpgrades.includes('thorn-fur')) {
        const reflected = dealEnemyDamage(state, enemy, 18, state.player.x, state.player.y, 'thorn-fur')
        state.runStats.talentTriggers['thorn-fur'] = (state.runStats.talentTriggers['thorn-fur'] ?? 0) + 1
        state.effects.push({ id: state.nextId++, kind: 'hit', x: enemy.x, y: enemy.y - 28, value: reflected, life: 0.42, angle: Math.atan2(-dy, -dx) })
      }
      if (playerWasHit && state.player.reflectDamage > 0) {
        const reflected = dealEnemyDamage(state, enemy, state.player.reflectDamage, state.player.x, state.player.y, 'barbed-backplate')
        state.effects.push({ id: state.nextId++, kind: 'hit', x: enemy.x, y: enemy.y - 28, value: reflected, life: 0.42, angle: Math.atan2(-dy, -dx) })
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
        applyPlayerHit(state, rawDamage, hazard.kind, 1.05, Math.atan2(state.player.y - hazard.y, state.player.x - hazard.x))
      }
    }
  }

  if (state.characterId !== 'qingtuan' && state.bambooCooldown <= 0) {
    let target: EnemyState | undefined
    const growth = getWeaponGrowth(state, characters[state.characterId].weaponId, state.signatureWeaponLevel)
    const attackRadius = growth.radius
    let targetDistance = attackRadius
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (enemy.hp > 0 && distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    if (target) {
      recordAttack(state)
      state.characterAttackCount += 1
      const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
      const critical = random(state) < state.player.criticalChance
      const whirlwind = state.characterId === 'shanlan' && state.characterAttackCount % 4 === 0
      const dragonStaff = state.characterId === 'shanlan' && state.signatureWeaponEvolved
      const arc = dragonStaff ? Math.PI : whirlwind ? Math.PI / 2 : state.characterId === 'shimo' ? Math.PI / 5 : Math.PI / 4
      const damage = Math.round(growth.baseDamage * state.player.damage * state.player.meleeDamage * state.player.basicAttackDamage * (critical ? state.player.criticalDamage : 1))
      const strikes = growth.count
      for (let strike = 0; strike < strikes; strike += 1) {
        let hitCount = 0
        for (const enemy of state.enemies) {
          const dx = enemy.x - state.player.x
          const dy = enemy.y - state.player.y
          const distance = Math.max(0.001, Math.hypot(dx, dy))
          const angleDelta = Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle))
          if (enemy.hp > 0 && distance <= attackRadius && Math.abs(angleDelta) <= arc && hitCount < (dragonStaff ? 12 : 8)) {
            hitCount += 1
            const appliedDamage = dealEnemyDamage(state, enemy, Math.round(damage * (strike === 0 ? 1 : 0.6)), state.player.x, state.player.y, state.characterId === 'shimo' ? 'iron-bamboo-shield' : 'bamboo-staff', critical)
            if (enemy.kind !== 'boss') {
              const knockback = dragonStaff && strike === 1 ? 56 : state.characterId === 'shimo' ? critical ? 46 : 34 : critical ? 22 : 14
              enemy.x = Math.min(1550, Math.max(50, enemy.x + (dx / distance) * knockback))
              enemy.y = Math.min(950, Math.max(75, enemy.y + (dy / distance) * knockback))
            }
            state.effects.push({ id: state.nextId++, kind: critical ? 'crit' : 'hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.42, angle })
          }
        }
        state.attacks.push({
          id: state.nextId++, x: state.player.x, y: state.player.y, life: 0.28 + strike * 0.08, radius: attackRadius - strike * 12, angle: angle + strike * 0.35, arc, critical,
          kind: dragonStaff ? 'dragon-staff' : whirlwind ? 'whirlwind' : state.characterId === 'shimo' && state.signatureWeaponEvolved ? 'mountain-shield' : state.characterId === 'shimo' ? 'shield' : 'staff',
        })
      }
      if (whirlwind) applyHealing(state, Math.max(1, Math.ceil(state.player.maxHp * 0.01)))
    }
    state.bambooCooldown = growth.interval
  }

  if (state.characterId === 'qingtuan' && state.leafCooldown <= 0 && state.enemies.length > 0) {
    if (state.enemies.some((enemy) => enemy.hp > 0)) recordAttack(state)
    let target = state.enemies[0]
    let targetDistance = target.hp > 0 ? Math.hypot(target.x - state.player.x, target.y - state.player.y) : Infinity
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (enemy.hp > 0 && distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    const growth = getWeaponGrowth(state, 'leaf-dart', state.signatureWeaponLevel)
    const projectileCount = growth.count
    for (let index = 0; index < projectileCount; index += 1) {
      state.characterAttackCount += 1
      const baseAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x) + (index - (projectileCount - 1) / 2) * 0.16
      const critical = random(state) < state.player.criticalChance
      const split = state.characterAttackCount % 6 === 0
      for (const angleOffset of split ? [-0.22, 0, 0.22] : [0]) {
        const angle = baseAngle + angleOffset
        state.playerProjectiles.push({
          id: state.nextId++, kind: 'leaf', x: state.player.x, y: state.player.y,
          vx: Math.cos(angle) * state.player.projectileSpeed, vy: Math.sin(angle) * state.player.projectileSpeed,
          damage: Math.round(growth.baseDamage * state.player.damage * state.player.rangedDamage * state.player.basicAttackDamage * state.player.projectileDamage * (critical ? state.player.criticalDamage : 1) * (split ? 0.45 : 1)), critical, blastRadius: 0,
          travel: 0, maxTravel: state.signatureWeaponEvolved ? 520 : undefined, pierces: state.signatureWeaponEvolved ? 3 : 1,
          splitOnEnd: state.signatureWeaponEvolved, hitIds: [],
        })
      }
    }
    state.leafCooldown = growth.interval
  }

  const gauntletLevel = state.weaponLevels['iron-pot-gauntlets'] ?? 0
  if (gauntletLevel > 0 && state.gauntletCooldown <= 0) {
    let target: EnemyState | undefined
    const growth = getWeaponGrowth(state, 'iron-pot-gauntlets', gauntletLevel)
    const radius = growth.radius
    let targetDistance = radius
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (enemy.hp > 0 && distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    if (target) {
      recordAttack(state)
      const targetAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
      const critical = random(state) < state.player.criticalChance
      const strikes = growth.count
      for (let strike = 0; strike < strikes; strike += 1) {
        const angle = targetAngle + (strike - (strikes - 1) / 2) * 0.18
        const damage = Math.round(growth.baseDamage * (strike === 0 ? 1 : 0.65) * state.player.damage * state.player.meleeDamage * state.player.basicAttackDamage * (critical ? state.player.criticalDamage : 1))
        let hitCount = 0
        for (const enemy of state.enemies) {
          const dx = enemy.x - state.player.x
          const dy = enemy.y - state.player.y
          const distance = Math.max(0.001, Math.hypot(dx, dy))
          const angleDelta = Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle))
          if (distance <= radius && Math.abs(angleDelta) <= Math.PI / 7 && hitCount < 3) {
            hitCount += 1
            const appliedDamage = dealEnemyDamage(state, enemy, damage, state.player.x, state.player.y, 'iron-pot-gauntlets', critical)
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
    state.gauntletCooldown = growth.interval
  }

  const firecrackerLevel = state.weaponLevels['firecracker-launcher'] ?? 0
  if (firecrackerLevel > 0 && state.firecrackerCooldown <= 0 && state.enemies.length > 0) {
    if (state.enemies.some((enemy) => enemy.hp > 0)) recordAttack(state)
    let target = state.enemies[0]
    let targetDistance = target.hp > 0 ? Math.hypot(target.x - state.player.x, target.y - state.player.y) : Infinity
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (enemy.hp > 0 && distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    const growth = getWeaponGrowth(state, 'firecracker-launcher', firecrackerLevel)
    const projectileCount = growth.count
    const targetAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
    for (let index = 0; index < projectileCount; index += 1) {
      const angle = targetAngle + (index - (projectileCount - 1) / 2) * 0.18
      const critical = random(state) < state.player.criticalChance
      state.playerProjectiles.push({
        id: state.nextId++, kind: 'firecracker', x: state.player.x, y: state.player.y,
        vx: Math.cos(angle) * (250 + firecrackerLevel * 12), vy: Math.sin(angle) * (250 + firecrackerLevel * 12),
        damage: Math.round(growth.baseDamage * state.player.damage * state.player.rangedDamage * state.player.basicAttackDamage * state.player.projectileDamage * (critical ? state.player.criticalDamage : 1)),
        critical, blastRadius: growth.radius,
      })
    }
    state.firecrackerCooldown = growth.interval
  }

  const bladeLevel = state.weaponLevels['spinning-bamboo-blade'] ?? 0
  if (bladeLevel > 0 && state.orbitCooldown <= 0) {
    const growth = getWeaponGrowth(state, 'spinning-bamboo-blade', bladeLevel)
    const radius = growth.radius
    const damage = Math.round(growth.baseDamage * state.player.damage * state.player.meleeDamage * state.player.basicAttackDamage)
    const bladeCount = growth.count
    let bladeHit = false
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      const enemyAngle = Math.atan2(enemy.y - state.player.y, enemy.x - state.player.x)
      let bladeIsPassing = false
      for (let index = 0; index < bladeCount; index += 1) {
        const bladeAngle = state.time * 5.4 + index * Math.PI * 2 / bladeCount
        const angleDelta = Math.atan2(Math.sin(enemyAngle - bladeAngle), Math.cos(enemyAngle - bladeAngle))
        if (Math.abs(angleDelta) <= 0.72) bladeIsPassing = true
      }
      if (enemy.hp > 0 && Math.abs(distance - radius) <= 24 && bladeIsPassing) {
        bladeHit = true
        const appliedDamage = dealEnemyDamage(state, enemy, damage, state.player.x, state.player.y, 'spinning-bamboo-blade')
        state.effects.push({ id: state.nextId++, kind: 'hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.36, angle: enemyAngle })
      }
    }
    if (bladeHit) recordAttack(state)
    state.orbitCooldown = growth.interval
  }

  const gourdLevel = state.weaponLevels['panda-wine-gourd'] ?? 0
  if (gourdLevel > 0 && state.gourdCooldown <= 0 && state.enemies.length > 0) {
    if (state.enemies.some((enemy) => enemy.hp > 0)) recordAttack(state)
    let target = state.enemies[0]
    let targetDistance = target.hp > 0 ? Math.hypot(target.x - state.player.x, target.y - state.player.y) : Infinity
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (enemy.hp > 0 && distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    const growth = getWeaponGrowth(state, 'panda-wine-gourd', gourdLevel)
    const zoneCount = growth.count
    const targetAngle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
    for (let index = 0; index < zoneCount; index += 1) {
      const offset = zoneCount === 1 ? 0 : (index === 0 ? -1 : 1) * 44
      const x = Math.min(1530, Math.max(70, target.x + Math.cos(targetAngle + Math.PI / 2) * offset))
      const y = Math.min(930, Math.max(95, target.y + Math.sin(targetAngle + Math.PI / 2) * offset))
      state.groundZones.push({
        id: state.nextId++, kind: 'wine', x, y, radius: growth.radius,
        life: growth.duration, duration: growth.duration,
        tickCooldown: 0, damage: Math.round(growth.baseDamage * state.player.damage * state.player.rangedDamage * state.player.basicAttackDamage),
      })
    }
    state.gourdCooldown = growth.interval
  }

  for (const zone of state.groundZones) {
    zone.life -= dt
    zone.tickCooldown -= dt
    if (zone.tickCooldown <= 0) {
      for (const enemy of state.enemies) {
        if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) <= zone.radius) {
          const appliedDamage = dealEnemyDamage(state, enemy, zone.damage, zone.x, zone.y, zone.kind === 'mountain' ? 'iron-bamboo-shield' : 'panda-wine-gourd')
          state.effects.push({ id: state.nextId++, kind: 'firecracker-hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.42, angle: Math.atan2(enemy.y - zone.y, enemy.x - zone.x) })
        }
      }
      zone.tickCooldown = 0.45
    }
  }

  const turretLevel = state.weaponLevels['bamboo-crossbow-turret'] ?? 0
  const turretGrowth = getWeaponGrowth(state, 'bamboo-crossbow-turret', turretLevel)
  const turretCount = turretGrowth.count
  if (turretLevel > 0 && state.turretDeployCooldown <= 0 && state.turrets.length < turretCount) {
    for (let index = state.turrets.length; index < turretCount; index += 1) {
      const angle = state.time * 0.7 + index * Math.PI * 2 / turretCount
      state.turrets.push({ id: state.nextId++, x: state.player.x + Math.cos(angle) * 62, y: state.player.y + Math.sin(angle) * 42, life: turretGrowth.duration, cooldown: index * 0.16, level: turretLevel, angle })
    }
    state.turretDeployCooldown = 8
  }
  for (const turret of state.turrets) {
    turret.life -= dt
    turret.cooldown -= dt
    if (turret.cooldown <= 0 && state.enemies.length > 0) {
      if (state.enemies.some((enemy) => enemy.hp > 0)) recordAttack(state)
      let target = state.enemies[0]
      let targetDistance = target.hp > 0 ? Math.hypot(target.x - turret.x, target.y - turret.y) : Infinity
      for (const enemy of state.enemies) {
        const distance = Math.hypot(enemy.x - turret.x, enemy.y - turret.y)
        if (enemy.hp > 0 && distance < targetDistance) { target = enemy; targetDistance = distance }
      }
      const growth = getWeaponGrowth(state, 'bamboo-crossbow-turret', turret.level)
      turret.angle = Math.atan2(target.y - turret.y, target.x - turret.x)
      for (let index = 0; index <= state.player.extraProjectiles; index += 1) {
        const angle = turret.angle + (index - state.player.extraProjectiles / 2) * 0.12
        state.playerProjectiles.push({
          id: state.nextId++, kind: 'bolt', x: turret.x, y: turret.y,
          vx: Math.cos(angle) * 520, vy: Math.sin(angle) * 520,
          damage: Math.round(growth.baseDamage * state.player.damage * state.player.rangedDamage * state.player.basicAttackDamage * state.player.projectileDamage), critical: false, blastRadius: 0,
        })
      }
      turret.cooldown = growth.interval
    }
  }

  const returningLeaves: PlayerProjectileState[] = []
  for (const projectile of state.playerProjectiles) {
    const speed = Math.hypot(projectile.vx, projectile.vy)
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt
    projectile.travel = (projectile.travel ?? 0) + speed * dt
    if (projectile.kind === 'leaf' && projectile.maxTravel && projectile.travel >= projectile.maxTravel) {
      if (projectile.splitOnEnd) {
        const returnAngle = Math.atan2(state.player.y - projectile.y, state.player.x - projectile.x)
        for (const offset of [-0.2, 0, 0.2]) {
          const angle = returnAngle + offset
          returningLeaves.push({
            id: state.nextId++, kind: 'leaf', x: projectile.x, y: projectile.y,
            vx: Math.cos(angle) * state.player.projectileSpeed * 0.9, vy: Math.sin(angle) * state.player.projectileSpeed * 0.9,
            damage: Math.max(1, Math.round(projectile.damage * 0.55)), critical: projectile.critical, blastRadius: 0,
            travel: 0, maxTravel: 520, pierces: 2, returning: true, splitOnEnd: false, hitIds: [],
          })
        }
      }
      projectile.damage = 0
      continue
    }
    for (const enemy of state.enemies) {
      if (projectile.damage > 0 && !projectile.hitIds?.includes(enemy.id) && Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < 24) {
        if (projectile.kind === 'firecracker') {
          state.effects.push({ id: state.nextId++, kind: 'firecracker-blast', x: projectile.x, y: projectile.y, value: projectile.blastRadius, life: 0.38, angle: 0 })
          for (const blastTarget of state.enemies) {
            if (Math.hypot(blastTarget.x - projectile.x, blastTarget.y - projectile.y) <= projectile.blastRadius) {
              const appliedDamage = dealEnemyDamage(state, blastTarget, projectile.damage, projectile.x, projectile.y, 'firecracker-launcher', projectile.critical)
              state.effects.push({ id: state.nextId++, kind: projectile.critical ? 'firecracker-crit' : 'firecracker-hit', x: blastTarget.x, y: blastTarget.y - 28, value: appliedDamage, life: 0.42, angle: Math.atan2(blastTarget.y - projectile.y, blastTarget.x - projectile.x) })
            }
          }
        } else {
          const appliedDamage = dealEnemyDamage(state, enemy, projectile.damage, projectile.x - projectile.vx * dt, projectile.y - projectile.vy * dt, projectile.kind === 'leaf' ? 'leaf-dart' : 'bamboo-crossbow-turret', projectile.critical)
          state.effects.push({ id: state.nextId++, kind: projectile.critical ? 'projectile-crit' : 'projectile-hit', x: enemy.x, y: enemy.y - 28, value: appliedDamage, life: 0.42, angle: Math.atan2(projectile.vy, projectile.vx) })
        }
        projectile.hitIds?.push(enemy.id)
        projectile.pierces = (projectile.pierces ?? 1) - 1
        if (projectile.kind !== 'leaf' || projectile.pierces <= 0) projectile.damage = 0
        break
      }
    }
  }
  state.playerProjectiles.push(...returningLeaves)

  for (const projectile of state.enemyProjectiles) {
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt
    if (state.player.hitCooldown === 0 && state.player.dashTime === 0 && Math.hypot(state.player.x - projectile.x, state.player.y - projectile.y) < 25) {
      applyPlayerHit(state, 2 + Math.floor((state.wave - 1) / 3), 'enemy-shot', 1.05, Math.atan2(projectile.vy, projectile.vx))
      projectile.x = -100
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
      else {
        const healing = state.chosenUpgrades.includes('iron-constitution') ? Math.ceil(drop.value * 0.9) : drop.value
        applyHealing(state, healing)
        if (state.chosenUpgrades.includes('iron-constitution')) {
          state.player.ironArmorTime = 4
          state.runStats.talentTriggers['iron-constitution'] = (state.runStats.talentTriggers['iron-constitution'] ?? 0) + 1
        }
      }
      drop.value = 0
    }
  }

  for (const attack of state.attacks) attack.life -= dt
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      if (enemy.kind === 'boss') {
        state.victory = true
        state.kills += 1
        state.corruptionInset = 0
        state.enemyProjectiles = []
        state.bossHazards = []
        state.enemyZones = []
        state.effects.push({ id: state.nextId++, kind: 'kill', x: enemy.x, y: enemy.y, value: 0, life: 0.8, angle: 0 })
        continue
      }
      state.kills += 1
      state.waveKills += 1
      if (state.chosenUpgrades.includes('battle-fury')) state.runStats.maxBattleFuryStacks = Math.max(state.runStats.maxBattleFuryStacks, Math.floor(state.waveKills / 50))
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
  if (state.comboTargetId !== null && !state.enemies.some((enemy) => enemy.id === state.comboTargetId)) {
    state.comboTargetId = null
    state.comboHits = 0
  }
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
      (id !== 'wide-sweep' || state.characterId !== 'qingtuan') && (id !== 'leaf-volley' || state.characterId === 'qingtuan') && !(id === 'leaf-volley' && state.player.projectileCount >= 3) && (!upgrades[id].unique || !state.chosenUpgrades.includes(id))
    ))
    const preferred = pool.filter((id) => (
      hasMeleeBuild && (id === 'power' || id === 'haste' || id === 'wide-sweep' || id === 'thorn-fur')
      || hasRangedBuild && (id === 'power' || id === 'haste' || id === 'leaf-volley' || id === 'battle-fury')
      || state.ownedItems.some((itemId) => itemId === 'iron-bracer' || itemId === 'mountain-stone' || itemId === 'spirit-bamboo-tube') && (id === 'vitality' || id === 'footwork' || id === 'iron-constitution')
    ))
    state.upgradeChoices = [rollUpgradeChoice(state, preferred.length ? preferred : pool)]
    while (state.upgradeChoices.length < 3) {
      const choice = rollUpgradeChoice(state, pool.filter((id) => !state.upgradeChoices.includes(id)))
      if (!state.upgradeChoices.includes(choice)) state.upgradeChoices.push(choice)
    }
    state.pendingUpgrade = true
  } else if (!state.victory && state.waveTime >= state.waveDuration && state.wave === 10) {
    const boss = state.enemies.find((enemy) => enemy.kind === 'boss')
    if (boss) boss.enraged = true
  } else if (!state.victory && state.waveTime >= state.waveDuration) {
    const signatureId = characters[state.characterId].weaponId
    const pool: ShopProductId[] = [...Object.keys(items) as ItemId[], ...weaponIds, signatureId, ...(state.chosenUpgrades.includes('bamboo-unity') ? ['spinning-bamboo-blade', 'spinning-bamboo-blade', 'bamboo-crossbow-turret', 'bamboo-crossbow-turret'] as WeaponId[] : [])].filter((id) => (
      isSignatureWeaponId(id) ? state.signatureWeaponLevel < 5 && !state.signatureWeaponEvolved
        : isWeaponId(id) ? (state.weaponLevels[id] ?? 0) < 5 : state.ownedItems.filter((itemId) => itemId === id).length < (items[id].unique ? 1 : items[id].maxStacks ?? Infinity)
    ))
    const selected = state.lockedShopIndices.map((index) => state.shopChoices[index]).filter((id): id is ShopProductId => id !== null)
    state.shopChoices = state.shopChoices.map((id, index) => {
      if (state.lockedShopIndices.includes(index)) return id
      const available = pool.filter((candidate) => !selected.includes(candidate))
      const rarityRoll = random(state) * 100
      const rarity = rarityRoll >= 97 ? '传说' : rarityRoll >= 87 - Math.min(60, state.player.luck * 20) ? '史诗' : rarityRoll >= 60 - Math.min(60, state.player.luck * 20) ? '稀有' : '普通'
      const rarityPool = available.filter((candidate) => (isWeaponId(candidate) ? weapons[candidate] : isSignatureWeaponId(candidate) ? signatureWeapons[candidate] : items[candidate]).rarity === rarity)
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
