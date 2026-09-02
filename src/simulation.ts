export type EnemyKind = 'chaser' | 'dasher' | 'shooter'
export type CharacterId = 'shanlan' | 'qingtuan' | 'shimo'
export type UpgradeId = 'power' | 'haste' | 'vitality' | 'footwork' | 'leaf-volley' | 'wide-sweep'
export type ItemId = 'martial-belt' | 'wind-feather' | 'iron-bracer' | 'panda-roller'

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
    portrait: 'assets/characters/panda-wanderer.png', weaponName: '青竹杖', weaponDescription: '近战横扫', weaponImage: 'assets/weapons/bamboo-staff.png', animation: 'panda',
  },
  qingtuan: {
    name: '青团', role: '远程 · 机动', description: '保持距离，用高速飞叶穿梭清场。',
    passive: '每第 6 次射击分裂为 3 枚各造成 45% 伤害的飞叶。', weakness: '生命较低',
    portrait: 'assets/characters/qingtuan.png', weaponName: '飞叶镖', weaponDescription: '高速追敌', weaponImage: 'assets/weapons/leaf-dart.png', animation: 'qingtuan',
  },
  shimo: {
    name: '石墨', role: '肉盾 · 反击', description: '顶住敌潮，用铁盾撞开近身威胁。',
    passive: '每 8 秒获得 8% 最大生命护盾，破盾时震开周围敌人。', weakness: '移动速度较慢',
    portrait: 'assets/characters/shimo.png', weaponName: '铁竹盾', weaponDescription: '近战盾击', weaponImage: 'assets/weapons/iron-bamboo-shield.png', animation: 'shimo',
  },
}

export const upgrades: Record<UpgradeId, { name: string; rarity: string; description: string; tag: string }> = {
  power: { name: '沉肩坠肘', rarity: '普通', description: '全部伤害 +12%', tag: '输出' },
  haste: { name: '疾风连式', rarity: '普通', description: '攻击速度 +10%', tag: '攻速' },
  vitality: { name: '竹息养生', rarity: '普通', description: '最大生命 +15，并恢复 15', tag: '生存' },
  footwork: { name: '踏叶无痕', rarity: '稀有', description: '移动速度 +10%', tag: '机动' },
  'leaf-volley': { name: '竹叶连射', rarity: '史诗', description: '额外发射 1 枚飞叶，远程伤害 -10%', tag: '远程 · 天赋' },
  'wide-sweep': { name: '横扫千军', rarity: '稀有', description: '竹杖范围 +18，攻击速度 -5%', tag: '近战 · 天赋' },
}

export const items: Record<ItemId, { name: string; rarity: string; description: string; price: number; image: string }> = {
  'martial-belt': { name: '武道腰带', rarity: '普通', description: '竹杖伤害 +15%', price: 18, image: 'assets/items/martial-belt.png' },
  'wind-feather': { name: '风羽', rarity: '稀有', description: '飞叶速度 +20%，伤害 +10%', price: 32, image: 'assets/items/wind-feather.png' },
  'iron-bracer': { name: '铁砂护腕', rarity: '普通', description: '护甲 +4，移动速度 -3%', price: 20, image: 'assets/items/iron-bracer.png' },
  'panda-roller': { name: '熊猫滚轮', rarity: '稀有', description: '闪避结束震开敌人并造成 32 伤害', price: 38, image: 'assets/items/panda-roller.png' },
}

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
  bambooCooldown: number
  leafCooldown: number
  characterAttackCount: number
  gameOver: boolean
  pendingUpgrade: boolean
  shopOpen: boolean
  upgradeChoices: UpgradeId[]
  shopChoices: ItemId[]
  purchasedShopItems: ItemId[]
  ownedItems: ItemId[]
  chosenUpgrades: UpgradeId[]
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
  }>
  playerProjectiles: Array<{ id: number; x: number; y: number; vx: number; vy: number; damage: number; critical: boolean }>
  enemyProjectiles: Array<{ id: number; x: number; y: number; vx: number; vy: number }>
  attacks: Array<{ id: number; x: number; y: number; life: number; radius: number; angle: number; arc: number; critical: boolean; kind: 'staff' | 'whirlwind' | 'shield' }>
  drops: Array<{ id: number; kind: 'xp' | 'coin' | 'heal'; x: number; y: number; value: number }>
  effects: Array<{ id: number; kind: 'hit' | 'crit' | 'projectile-hit' | 'projectile-crit' | 'kill' | 'player-hit' | 'dash-burst' | 'shield-break'; x: number; y: number; value: number; life: number; angle: number }>
}

export type PlayerInput = { x: number; y: number; dash: boolean }

const random = (state: GameState): number => {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0
  return state.seed / 4294967296
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
  bambooCooldown: 0.2,
  leafCooldown: 0.45,
  characterAttackCount: 0,
  gameOver: false,
  pendingUpgrade: false,
  shopOpen: false,
  upgradeChoices: [],
  shopChoices: ['martial-belt', 'wind-feather', 'iron-bracer', 'panda-roller'],
  purchasedShopItems: [],
  ownedItems: [],
  chosenUpgrades: [],
  player: {
    x: 800, y: 500,
    hp: characterId === 'qingtuan' ? 85 : characterId === 'shimo' ? 140 : 110,
    maxHp: characterId === 'qingtuan' ? 85 : characterId === 'shimo' ? 140 : 110,
    level: 1, xp: 0, nextXp: 18, coins: 0,
    damage: 1, meleeDamage: characterId === 'shanlan' ? 1.15 : characterId === 'qingtuan' ? 0.8 : 1,
    attackSpeed: 1, armor: characterId === 'shimo' ? 8 : 0, moveSpeed: characterId === 'qingtuan' ? 1.1 : characterId === 'shimo' ? 0.9 : 1,
    projectileCount: 1, meleeRange: characterId === 'shanlan' ? 74 : 82, rangedDamage: 1, projectileSpeed: characterId === 'qingtuan' ? 516 : 430,
    dashCooldown: 0, dashTime: 0, dashX: 1, dashY: 0, facingX: 1, facingY: 0, hitCooldown: 0, dashBurstPending: false,
    shield: 0, shieldMax: 0, shieldTimer: characterId === 'shimo' ? 8 : 0,
  },
  enemies: [], playerProjectiles: [], enemyProjectiles: [], attacks: [], drops: [], effects: [],
})

export const chooseUpgrade = (state: GameState, id: UpgradeId): boolean => {
  if (!state.pendingUpgrade || !state.upgradeChoices.includes(id)) return false
  if (id === 'power') state.player.damage += 0.12
  if (id === 'haste') state.player.attackSpeed += 0.1
  if (id === 'vitality') {
    state.player.maxHp += 15
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 15)
  }
  if (id === 'footwork') state.player.moveSpeed += 0.1
  if (id === 'leaf-volley') {
    state.player.projectileCount = Math.min(3, state.player.projectileCount + 1)
    state.player.rangedDamage *= 0.9
  }
  if (id === 'wide-sweep') {
    state.player.meleeRange += 18
    state.player.attackSpeed = Math.max(0.55, state.player.attackSpeed - 0.05)
  }
  state.chosenUpgrades.push(id)
  state.pendingUpgrade = false
  state.upgradeChoices = []
  return true
}

export const buyItem = (state: GameState, id: ItemId): boolean => {
  const item = items[id]
  if (!state.shopOpen || !state.shopChoices.includes(id) || state.purchasedShopItems.includes(id) || state.player.coins < item.price) return false
  state.player.coins -= item.price
  state.purchasedShopItems.push(id)
  state.ownedItems.push(id)
  if (id === 'martial-belt') state.player.meleeDamage += 0.15
  if (id === 'wind-feather') {
    state.player.projectileSpeed *= 1.2
    state.player.rangedDamage += 0.1
  }
  if (id === 'iron-bracer') {
    state.player.armor += 4
    state.player.moveSpeed = Math.max(0.5, state.player.moveSpeed - 0.03)
  }
  return true
}

export const continueWave = (state: GameState): boolean => {
  if (!state.shopOpen) return false
  state.shopOpen = false
  state.purchasedShopItems = []
  state.wave += 1
  state.waveTime = 0
  state.enemies = []
  state.playerProjectiles = []
  state.enemyProjectiles = []
  state.attacks = []
  state.drops = []
  state.effects = []
  state.spawnTimer = 0.8
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.ceil(state.player.maxHp * 0.35))
  return true
}

export const stepGame = (state: GameState, input: PlayerInput, elapsed: number): void => {
  if (state.gameOver || state.pendingUpgrade || state.shopOpen) return
  const dt = Math.min(elapsed, 0.05)
  state.time += dt
  state.waveTime += dt
  state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt)
  const previousDashTime = state.player.dashTime
  state.player.dashTime = Math.max(0, state.player.dashTime - dt)
  state.player.hitCooldown = Math.max(0, state.player.hitCooldown - dt)
  if (state.characterId === 'shimo') {
    state.player.shieldTimer -= dt
    if (state.player.shieldTimer <= 0) {
      state.player.shieldMax = Math.ceil(state.player.maxHp * 0.08)
      state.player.shield = state.player.shieldMax
      state.player.shieldTimer = 8
    }
  }
  state.bambooCooldown -= dt
  state.leafCooldown -= dt
  state.spawnTimer -= dt
  for (const effect of state.effects) effect.life -= dt

  if (previousDashTime > 0 && state.player.dashTime === 0 && state.player.dashBurstPending) {
    state.player.dashBurstPending = false
    state.effects.push({ id: state.nextId++, kind: 'dash-burst', x: state.player.x, y: state.player.y, value: 32, life: 0.35, angle: 0 })
    for (const enemy of state.enemies) {
      const dx = enemy.x - state.player.x
      const dy = enemy.y - state.player.y
      const distance = Math.max(0.001, Math.hypot(dx, dy))
      if (distance < 118) {
        enemy.hp -= 32
        enemy.x += (dx / distance) * 42
        enemy.y += (dy / distance) * 42
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
  const speed = (state.player.dashTime > 0 ? 580 : 220) * state.player.moveSpeed
  state.player.x = Math.min(1580, Math.max(20, state.player.x + (state.player.dashTime > 0 ? state.player.dashX : moveX) * speed * dt))
  state.player.y = Math.min(980, Math.max(20, state.player.y + (state.player.dashTime > 0 ? state.player.dashY : moveY) * speed * dt))

  if (state.spawnTimer <= 0 && state.enemies.length < 100) {
    const angle = random(state) * Math.PI * 2
    const kind: EnemyKind = state.nextId % 3 === 1 ? 'chaser' : state.nextId % 3 === 2 ? 'dasher' : 'shooter'
    const hp = (kind === 'dasher' ? 72 : kind === 'shooter' ? 48 : 56) * (1 + (state.wave - 1) * 0.12)
    state.enemies.push({
      id: state.nextId++, kind,
      x: Math.min(1570, Math.max(30, state.player.x + Math.cos(angle) * 470)),
      y: Math.min(970, Math.max(30, state.player.y + Math.sin(angle) * 470)),
      hp, maxHp: hp, cooldown: kind === 'shooter' ? 1.2 : 1.8, dashTime: 0, vx: 0, vy: 0,
    })
    state.spawnTimer = Math.max(0.3, 1.05 - state.time * 0.0015 - (state.wave - 1) * 0.04)
  }

  for (const enemy of state.enemies) {
    const dx = state.player.x - enemy.x
    const dy = state.player.y - enemy.y
    const distance = Math.max(0.001, Math.hypot(dx, dy))
    enemy.cooldown -= dt
    if (enemy.kind === 'chaser') {
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
    } else {
      const direction = distance > 270 ? 1 : distance < 205 ? -1 : 0
      enemy.x += (dx / distance) * 58 * direction * dt
      enemy.y += (dy / distance) * 58 * direction * dt
      if (enemy.cooldown <= 0) {
        state.enemyProjectiles.push({ id: state.nextId++, x: enemy.x, y: enemy.y, vx: (dx / distance) * 190, vy: (dy / distance) * 190 })
        enemy.cooldown = 1.85
      }
    }
    enemy.x = Math.min(1580, Math.max(20, enemy.x))
    enemy.y = Math.min(980, Math.max(20, enemy.y))
    if (distance < 32 && state.player.hitCooldown === 0 && state.player.dashTime === 0) {
      const rawDamage = enemy.kind === 'dasher' && enemy.dashTime > 0 ? 7 : 3
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
            nearbyEnemy.hp -= 24
            nearbyEnemy.x += (breakX / breakDistance) * 48
            nearbyEnemy.y += (breakY / breakDistance) * 48
          }
        }
      }
    }
  }

  if (state.characterId !== 'qingtuan' && state.bambooCooldown <= 0) {
    let target: GameState['enemies'][number] | undefined
    const attackRadius = state.player.meleeRange + 24
    let targetDistance = attackRadius
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (distance < targetDistance) { target = enemy; targetDistance = distance }
    }
    if (target) {
      state.characterAttackCount += 1
      const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x)
      const critical = random(state) < 0.1
      const whirlwind = state.characterId === 'shanlan' && state.characterAttackCount % 4 === 0
      const arc = whirlwind ? Math.PI / 2 : state.characterId === 'shimo' ? Math.PI / 3 : Math.PI / 4
      const damage = Math.round((state.characterId === 'shimo' ? 34 : 38) * state.player.damage * state.player.meleeDamage * (critical ? 1.75 : 1))
      let hitCount = 0
      for (const enemy of state.enemies) {
        const dx = enemy.x - state.player.x
        const dy = enemy.y - state.player.y
        const distance = Math.max(0.001, Math.hypot(dx, dy))
        const angleDelta = Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle))
        if (distance <= attackRadius && Math.abs(angleDelta) <= arc && hitCount < 8) {
          hitCount += 1
          enemy.hp -= damage
          enemy.x = Math.min(1580, Math.max(20, enemy.x + (dx / distance) * (critical ? 22 : 14)))
          enemy.y = Math.min(980, Math.max(20, enemy.y + (dy / distance) * (critical ? 22 : 14)))
          state.effects.push({ id: state.nextId++, kind: critical ? 'crit' : 'hit', x: enemy.x, y: enemy.y - 28, value: damage, life: 0.42, angle })
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
      const critical = random(state) < 0.1
      const split = state.characterAttackCount % 6 === 0
      for (const angleOffset of split ? [-0.22, 0, 0.22] : [0]) {
        const angle = baseAngle + angleOffset
        state.playerProjectiles.push({
          id: state.nextId++, x: state.player.x, y: state.player.y,
          vx: Math.cos(angle) * state.player.projectileSpeed, vy: Math.sin(angle) * state.player.projectileSpeed,
          damage: Math.round(24 * state.player.damage * state.player.rangedDamage * (critical ? 1.75 : 1) * (split ? 0.45 : 1)), critical,
        })
      }
    }
    state.leafCooldown = 0.88 / state.player.attackSpeed
  }

  for (const projectile of state.playerProjectiles) {
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt
    for (const enemy of state.enemies) {
      if (projectile.damage > 0 && Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < 24) {
        enemy.hp -= projectile.damage
        state.effects.push({ id: state.nextId++, kind: projectile.critical ? 'projectile-crit' : 'projectile-hit', x: enemy.x, y: enemy.y - 28, value: projectile.damage, life: 0.42, angle: Math.atan2(projectile.vy, projectile.vx) })
        projectile.damage = 0
      }
    }
  }

  for (const projectile of state.enemyProjectiles) {
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt
    if (state.player.hitCooldown === 0 && state.player.dashTime === 0 && Math.hypot(state.player.x - projectile.x, state.player.y - projectile.y) < 25) {
      const damage = Math.max(1, Math.floor(3 * (1 - state.player.armor / (state.player.armor + 60))))
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
            enemy.hp -= 24
            enemy.x += (breakX / breakDistance) * 48
            enemy.y += (breakY / breakDistance) * 48
          }
        }
      }
    }
  }

  for (const drop of state.drops) {
    const dx = state.player.x - drop.x
    const dy = state.player.y - drop.y
    const distance = Math.max(0.001, Math.hypot(dx, dy))
    if (distance < 140) {
      drop.x += (dx / distance) * 420 * dt
      drop.y += (dy / distance) * 420 * dt
    }
    if (distance < 24) {
      if (drop.kind === 'xp') state.player.xp += drop.value
      else if (drop.kind === 'coin') state.player.coins += drop.value
      else state.player.hp = Math.min(state.player.maxHp, state.player.hp + drop.value)
      drop.value = 0
    }
  }

  for (const attack of state.attacks) attack.life -= dt
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      state.kills += 1
      state.drops.push({ id: state.nextId++, kind: 'xp', x: enemy.x, y: enemy.y, value: 4 })
      if (state.kills % 2 === 0) state.drops.push({ id: state.nextId++, kind: 'coin', x: enemy.x + 8, y: enemy.y, value: 2 })
      if (state.kills % 8 === 0) state.drops.push({ id: state.nextId++, kind: 'heal', x: enemy.x - 8, y: enemy.y, value: 10 })
      state.effects.push({ id: state.nextId++, kind: 'kill', x: enemy.x, y: enemy.y, value: 0, life: 0.36, angle: 0 })
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0)
  state.playerProjectiles = state.playerProjectiles.filter((projectile) => projectile.damage > 0 && projectile.x > 0 && projectile.x < 1600 && projectile.y > 0 && projectile.y < 1000)
  state.enemyProjectiles = state.enemyProjectiles.filter((projectile) => projectile.x > 0 && projectile.x < 1600 && projectile.y > 0 && projectile.y < 1000)
  state.attacks = state.attacks.filter((attack) => attack.life > 0)
  state.drops = state.drops.filter((drop) => drop.value > 0).slice(-140)
  state.effects = state.effects.filter((effect) => effect.life > 0).slice(-80)

  if (state.player.xp >= state.player.nextXp) {
    state.player.xp -= state.player.nextXp
    state.player.level += 1
    state.player.nextXp = Math.round(state.player.nextXp * 1.24 + 6)
    const pool = (Object.keys(upgrades) as UpgradeId[]).filter((id) => (
      state.characterId === 'qingtuan' ? id !== 'wide-sweep' : id !== 'leaf-volley'
    ))
    state.upgradeChoices = []
    while (state.upgradeChoices.length < 3) {
      const choice = pool[Math.floor(random(state) * pool.length)]
      if (!state.upgradeChoices.includes(choice) && !(choice === 'leaf-volley' && state.player.projectileCount >= 3)) state.upgradeChoices.push(choice)
    }
    state.pendingUpgrade = true
  } else if (state.waveTime >= state.waveDuration) {
    state.shopOpen = true
  }

  if (state.player.hp <= 0) {
    state.player.hp = 0
    state.gameOver = true
  }
}
