export type EnemyKind = 'chaser' | 'dasher' | 'shooter'

export type GameState = {
  seed: number
  time: number
  kills: number
  nextId: number
  spawnTimer: number
  bambooCooldown: number
  leafCooldown: number
  gameOver: boolean
  player: {
    x: number
    y: number
    hp: number
    maxHp: number
    dashCooldown: number
    dashTime: number
    dashX: number
    dashY: number
    facingX: number
    facingY: number
    hitCooldown: number
  }
  enemies: Array<{
    id: number
    kind: EnemyKind
    x: number
    y: number
    hp: number
    cooldown: number
    dashTime: number
    vx: number
    vy: number
  }>
  playerProjectiles: Array<{ id: number; x: number; y: number; vx: number; vy: number; damage: number }>
  enemyProjectiles: Array<{ id: number; x: number; y: number; vx: number; vy: number }>
  attacks: Array<{ x: number; y: number; life: number }>
}

export type PlayerInput = { x: number; y: number; dash: boolean }

export const createGameState = (seed = 20260831): GameState => ({
  seed,
  time: 0,
  kills: 0,
  nextId: 1,
  spawnTimer: 1,
  bambooCooldown: 0.2,
  leafCooldown: 0.45,
  gameOver: false,
  player: { x: 800, y: 500, hp: 100, maxHp: 100, dashCooldown: 0, dashTime: 0, dashX: 1, dashY: 0, facingX: 1, facingY: 0, hitCooldown: 0 },
  enemies: [],
  playerProjectiles: [],
  enemyProjectiles: [],
  attacks: [],
})

export const stepGame = (state: GameState, input: PlayerInput, elapsed: number): void => {
  if (state.gameOver) return

  const dt = Math.min(elapsed, 0.05)
  state.time += dt
  state.player.dashCooldown = Math.max(0, state.player.dashCooldown - dt)
  state.player.dashTime = Math.max(0, state.player.dashTime - dt)
  state.player.hitCooldown = Math.max(0, state.player.hitCooldown - dt)
  state.bambooCooldown -= dt
  state.leafCooldown -= dt
  state.spawnTimer -= dt

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
  }
  const speed = state.player.dashTime > 0 ? 580 : 220
  state.player.x = Math.min(1580, Math.max(20, state.player.x + (state.player.dashTime > 0 ? state.player.dashX : moveX) * speed * dt))
  state.player.y = Math.min(980, Math.max(20, state.player.y + (state.player.dashTime > 0 ? state.player.dashY : moveY) * speed * dt))

  if (state.spawnTimer <= 0 && state.enemies.length < 100) {
    state.seed = (state.seed * 1664525 + 1013904223) >>> 0
    const angle = (state.seed / 4294967296) * Math.PI * 2
    const kind: EnemyKind = state.nextId % 3 === 1 ? 'chaser' : state.nextId % 3 === 2 ? 'dasher' : 'shooter'
    state.enemies.push({
      id: state.nextId++,
      kind,
      x: Math.min(1570, Math.max(30, state.player.x + Math.cos(angle) * 470)),
      y: Math.min(970, Math.max(30, state.player.y + Math.sin(angle) * 470)),
      hp: kind === 'dasher' ? 72 : kind === 'shooter' ? 48 : 56,
      cooldown: kind === 'shooter' ? 1.2 : 1.8,
      dashTime: 0,
      vx: 0,
      vy: 0,
    })
    state.spawnTimer = Math.max(0.35, 1.1 - state.time * 0.002)
  }

  for (const enemy of state.enemies) {
    const dx = state.player.x - enemy.x
    const dy = state.player.y - enemy.y
    const distance = Math.max(0.001, Math.hypot(dx, dy))
    enemy.cooldown -= dt

    if (enemy.kind === 'chaser') {
      enemy.x += (dx / distance) * 66 * dt
      enemy.y += (dy / distance) * 66 * dt
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
      state.player.hp -= enemy.kind === 'dasher' && enemy.dashTime > 0 ? 14 : 7
      state.player.hitCooldown = 0.8
    }
  }

  if (state.bambooCooldown <= 0) {
    let target: GameState['enemies'][number] | undefined
    let targetDistance = 118
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (distance < targetDistance) {
        target = enemy
        targetDistance = distance
      }
    }
    if (target) {
      target.hp -= 38
      state.attacks.push({ x: state.player.x, y: state.player.y, life: 0.16 })
    }
    state.bambooCooldown = 0.62
  }

  if (state.leafCooldown <= 0 && state.enemies.length > 0) {
    let target = state.enemies[0]
    let targetDistance = Math.hypot(target.x - state.player.x, target.y - state.player.y)
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y)
      if (distance < targetDistance) {
        target = enemy
        targetDistance = distance
      }
    }
    state.playerProjectiles.push({
      id: state.nextId++,
      x: state.player.x,
      y: state.player.y,
      vx: ((target.x - state.player.x) / Math.max(0.001, targetDistance)) * 430,
      vy: ((target.y - state.player.y) / Math.max(0.001, targetDistance)) * 430,
      damage: 24,
    })
    state.leafCooldown = 0.88
  }

  for (const projectile of state.playerProjectiles) {
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt
    for (const enemy of state.enemies) {
      if (projectile.damage > 0 && Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < 24) {
        enemy.hp -= projectile.damage
        projectile.damage = 0
      }
    }
  }

  for (const projectile of state.enemyProjectiles) {
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt
    if (state.player.hitCooldown === 0 && state.player.dashTime === 0 && Math.hypot(state.player.x - projectile.x, state.player.y - projectile.y) < 25) {
      state.player.hp -= 7
      state.player.hitCooldown = 0.65
      projectile.x = -100
    }
  }

  for (const attack of state.attacks) attack.life -= dt
  const defeated = state.enemies.filter((enemy) => enemy.hp <= 0).length
  state.kills += defeated
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0)
  state.playerProjectiles = state.playerProjectiles.filter((projectile) => projectile.damage > 0 && projectile.x > 0 && projectile.x < 1600 && projectile.y > 0 && projectile.y < 1000)
  state.enemyProjectiles = state.enemyProjectiles.filter((projectile) => projectile.x > 0 && projectile.x < 1600 && projectile.y > 0 && projectile.y < 1000)
  state.attacks = state.attacks.filter((attack) => attack.life > 0)

  if (state.player.hp <= 0) {
    state.player.hp = 0
    state.gameOver = true
  }
}
