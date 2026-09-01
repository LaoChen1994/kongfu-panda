import Phaser from 'phaser'
import './style.css'
import { buyItem, chooseUpgrade, continueWave, createGameState, items, stepGame, upgrades } from './simulation.js'

const assetRoot = `${import.meta.env.BASE_URL}assets/`
const animationSets = [
  { key: 'panda-idle', path: 'panda-wanderer/idle', frames: 6, frameRate: 7, repeat: -1 },
  { key: 'panda-run', path: 'panda-wanderer/run', frames: 8, frameRate: 13, repeat: -1 },
  { key: 'panda-attack', path: 'panda-wanderer/attack', frames: 6, frameRate: 22, repeat: 0 },
  { key: 'redfang-chaser-move', path: 'redfang-chaser/move', frames: 8, frameRate: 12, repeat: -1 },
  { key: 'redfang-chaser-attack', path: 'redfang-chaser/attack', frames: 6, frameRate: 18, repeat: 0 },
  { key: 'violet-horn-dasher-move', path: 'violet-horn-dasher/move', frames: 8, frameRate: 10, repeat: -1 },
  { key: 'violet-horn-dasher-attack', path: 'violet-horn-dasher/attack', frames: 6, frameRate: 15, repeat: 0 },
  { key: 'cyan-lantern-shooter-move', path: 'cyan-lantern-shooter/move', frames: 8, frameRate: 8, repeat: -1 },
  { key: 'cyan-lantern-shooter-attack', path: 'cyan-lantern-shooter/attack', frames: 6, frameRate: 15, repeat: 0 },
]

class BattleScene extends Phaser.Scene {
  private state = createGameState()
  private actorGraphics!: Phaser.GameObjects.Graphics
  private playerSprite!: Phaser.GameObjects.Sprite
  private enemySprites = new Map<number, Phaser.GameObjects.Sprite>()
  private leafSprites = new Map<number, Phaser.GameObjects.Image>()
  private effectTexts = new Map<number, Phaser.GameObjects.Text>()
  private seenEffects = new Set<number>()
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>
  private paused = false
  private dashQueued = false
  private overlayMode = ''
  private audioContext?: AudioContext
  private lastHitSound = 0
  private hitStop = 0
  private lastAttackId = 0

  preload(): void {
    this.load.image('bamboo-ground', `${assetRoot}environments/bamboo-ground.png`)
    this.load.image('leaf-dart', `${assetRoot}weapons/leaf-dart.png`)
    for (const animation of animationSets) {
      for (let index = 1; index <= animation.frames; index += 1) {
        const frame = String(index).padStart(2, '0')
        this.load.image(`${animation.key}-${frame}`, `${assetRoot}animations/${animation.path}/${frame}.png`)
      }
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#173527')
    this.add.tileSprite(800, 500, 1600, 1000, 'bamboo-ground').setDepth(-10)
    const worldGraphics = this.add.graphics()
    worldGraphics.lineStyle(1, 0xf3e6c8, 0.08)
    for (let x = 0; x <= 1600; x += 80) worldGraphics.lineBetween(x, 0, x, 1000)
    for (let y = 0; y <= 1000; y += 80) worldGraphics.lineBetween(0, y, 1600, y)
    worldGraphics.lineStyle(8, 0x513d22, 0.7).strokeRect(5, 5, 1590, 990)
    this.actorGraphics = this.add.graphics().setDepth(3000)
    for (const animation of animationSets) {
      this.anims.create({
        key: animation.key,
        frames: Array.from({ length: animation.frames }, (_, index) => ({ key: `${animation.key}-${String(index + 1).padStart(2, '0')}` })),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      })
    }
    this.playerSprite = this.add.sprite(this.state.player.x, this.state.player.y, 'panda-idle-01').setOrigin(0.5, 1).setScale(68 / 96).play('panda-idle')
    this.cameras.main.setBounds(0, 0, 1600, 1000)
    const keyboard = this.input.keyboard
    if (!keyboard) throw new Error('浏览器不支持键盘输入')
    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return
      if (event.code === 'Space' || event.code === 'Escape' || event.code === 'KeyR') event.preventDefault()
      if (!this.audioContext) this.audioContext = new AudioContext()
      if (event.code === 'Space' && !this.state.pendingUpgrade && !this.state.shopOpen) this.dashQueued = true
      if (this.state.pendingUpgrade && ['Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
        const choice = this.state.upgradeChoices[Number(event.code.slice(-1)) - 1]
        if (choice) chooseUpgrade(this.state, choice)
      }
      if (this.state.shopOpen && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(event.code)) {
        const choice = this.state.shopChoices[Number(event.code.slice(-1)) - 1]
        if (choice) buyItem(this.state, choice)
      }
      if (event.code === 'Enter' && this.state.shopOpen) continueWave(this.state)
      if (event.code === 'Escape' && !this.state.gameOver && !this.state.pendingUpgrade && !this.state.shopOpen) {
        this.paused = !this.paused
        const overlay = document.querySelector<HTMLDivElement>('#pause-overlay')
        if (overlay) overlay.hidden = !this.paused
      }
      if (event.code === 'KeyR' && this.state.gameOver) {
        this.state = createGameState()
        this.lastAttackId = 0
        this.paused = false
        this.overlayMode = ''
        const overlay = document.querySelector<HTMLDivElement>('#pause-overlay')
        if (overlay) overlay.hidden = true
      }
    })
  }

  private playTone(frequency: number, duration: number, volume: number): void {
    if (!this.audioContext || this.audioContext.state !== 'running') return
    const oscillator = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    gain.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
    oscillator.connect(gain).connect(this.audioContext.destination)
    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  private renderChoiceOverlay(): void {
    const overlay = document.querySelector<HTMLDivElement>('#choice-overlay')
    const cards = document.querySelector<HTMLDivElement>('#choice-cards')
    const title = document.querySelector<HTMLElement>('#choice-title')
    const kicker = document.querySelector<HTMLElement>('#choice-kicker')
    const copy = document.querySelector<HTMLElement>('#choice-copy')
    const continueButton = document.querySelector<HTMLButtonElement>('#continue-wave')
    if (!overlay || !cards || !title || !kicker || !copy || !continueButton) return

    const mode = this.state.pendingUpgrade ? `upgrade-${this.state.player.level}` : this.state.shopOpen ? `shop-${this.state.wave}-${this.state.player.coins}-${this.state.purchasedShopItems.join('-')}` : ''
    overlay.hidden = !mode
    if (!mode || mode === this.overlayMode) return
    this.overlayMode = mode
    cards.innerHTML = ''
    if (this.state.pendingUpgrade) {
      kicker.textContent = `境界突破 · Lv.${this.state.player.level}`
      title.textContent = '选择一门强化'
      copy.textContent = '战斗已暂停 · 让这一局形成自己的招式'
      cards.style.gridTemplateColumns = 'repeat(3, 1fr)'
      continueButton.hidden = true
      this.state.upgradeChoices.forEach((id, index) => {
        const upgrade = upgrades[id]
        const button = document.createElement('button')
        button.className = 'choice-card'
        button.type = 'button'
        button.innerHTML = `<kbd>${index + 1}</kbd><small>${upgrade.rarity} · ${upgrade.tag}</small><strong>${upgrade.name}</strong><span>${upgrade.description}</span><em>立即生效</em>`
        button.addEventListener('click', () => chooseUpgrade(this.state, id))
        cards.append(button)
      })
      this.playTone(520, 0.18, 0.045)
    } else {
      kicker.textContent = `竹林补给 · 第 ${this.state.wave} 波结束`
      title.textContent = '用战利品强化构筑'
      copy.textContent = `现有 ${this.state.player.coins} 铜钱 · 可购买多件，整备后继续`
      cards.style.gridTemplateColumns = 'repeat(4, 1fr)'
      continueButton.hidden = false
      continueButton.onclick = () => continueWave(this.state)
      this.state.shopChoices.forEach((id, index) => {
        const item = items[id]
        const purchased = this.state.purchasedShopItems.includes(id)
        const button = document.createElement('button')
        button.className = 'choice-card'
        button.type = 'button'
        button.disabled = purchased || this.state.player.coins < item.price
        button.innerHTML = `<kbd>${index + 1}</kbd><img src="${import.meta.env.BASE_URL}${item.image}" alt=""><small>${item.rarity} · 宝物</small><strong>${item.name}</strong><span>${item.description}</span><em>${purchased ? '已购入' : `${item.price} 铜钱`}</em>`
        button.addEventListener('click', () => buyItem(this.state, id))
        cards.append(button)
      })
    }
  }

  update(_time: number, delta: number): void {
    if (!this.paused) {
      if (this.hitStop > 0) this.hitStop = Math.max(0, this.hitStop - delta / 1000)
      else {
        stepGame(this.state, {
          x: Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown),
          y: Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown),
          dash: this.dashQueued,
        }, delta / 1000)
      }
    }
    this.dashQueued = false
    this.renderChoiceOverlay()
    this.cameras.main.centerOn(this.state.player.x, this.state.player.y)
    const graphics = this.actorGraphics.clear()

    for (const drop of this.state.drops) {
      const color = drop.kind === 'xp' ? 0xb8ed72 : drop.kind === 'coin' ? 0xf0b844 : 0x63d889
      graphics.fillStyle(color, 0.9).fillCircle(drop.x, drop.y, drop.kind === 'xp' ? 5 : 6)
      graphics.lineStyle(2, 0xf9f0c8, 0.7).strokeCircle(drop.x, drop.y, drop.kind === 'xp' ? 8 : 9)
    }
    for (const attack of this.state.attacks) {
      const alpha = Math.min(1, attack.life / 0.2)
      const start = attack.angle - Math.PI / 4
      const end = attack.angle + Math.PI / 4
      graphics.fillStyle(attack.critical ? 0xffdf65 : 0x9bcb66, alpha * 0.18).beginPath().moveTo(attack.x, attack.y).arc(attack.x, attack.y, attack.radius, start, end).closePath().fillPath()
      graphics.lineStyle(attack.critical ? 9 : 7, attack.critical ? 0xffdf65 : 0xe3a83b, alpha).beginPath().arc(attack.x, attack.y, attack.radius, start, end).strokePath()
      graphics.lineStyle(3, 0xcdf08a, alpha * 0.8).beginPath().arc(attack.x, attack.y, attack.radius * 0.72, start + 0.08, end - 0.08).strokePath()
      graphics.lineStyle(2, 0xf3e6c8, alpha * 0.6).lineBetween(attack.x, attack.y, attack.x + Math.cos(start) * attack.radius, attack.y + Math.sin(start) * attack.radius).lineBetween(attack.x, attack.y, attack.x + Math.cos(end) * attack.radius, attack.y + Math.sin(end) * attack.radius)
    }
    for (const effect of this.state.effects) {
      const alpha = Math.min(1, effect.life * 4)
      if (effect.kind === 'kill') {
        graphics.fillStyle(0x9bcb66, alpha * 0.32).fillCircle(effect.x, effect.y, 34 * (1 - effect.life))
        for (let index = 0; index < 5; index += 1) {
          const angle = index * Math.PI * 0.4
          graphics.lineStyle(4, index === 0 ? 0xe3a83b : 0xcdf08a, alpha).lineBetween(effect.x, effect.y, effect.x + Math.cos(angle) * 28, effect.y + Math.sin(angle) * 28)
        }
      }
      if (effect.kind === 'dash-burst') graphics.lineStyle(8, 0x9bcb66, alpha).strokeCircle(effect.x, effect.y, 118 * (1 - effect.life / 0.35))
      if (effect.kind === 'hit' || effect.kind === 'crit') {
        const centerY = effect.y + 26
        graphics.fillStyle(effect.kind === 'crit' ? 0xffdf65 : 0xf3e6c8, alpha).fillCircle(effect.x, centerY, effect.kind === 'crit' ? 9 : 5)
        graphics.lineStyle(effect.kind === 'crit' ? 5 : 3, effect.kind === 'crit' ? 0xe3a83b : 0x9bcb66, alpha).lineBetween(effect.x - Math.cos(effect.angle) * 18, centerY - Math.sin(effect.angle) * 18, effect.x + Math.cos(effect.angle) * 12, centerY + Math.sin(effect.angle) * 12)
      }
      if (effect.kind === 'projectile-hit' || effect.kind === 'projectile-crit') {
        const centerY = effect.y + 28
        const length = effect.kind === 'projectile-crit' ? 38 : 26
        for (let index = -1; index <= 1; index += 1) {
          const angle = effect.angle + index * 0.5
          graphics.lineStyle(index === 0 ? 5 : 3, effect.kind === 'projectile-crit' ? 0xffdf65 : 0x9bcb66, alpha).lineBetween(effect.x - Math.cos(angle) * 5, centerY - Math.sin(angle) * 5, effect.x + Math.cos(angle) * length, centerY + Math.sin(angle) * length)
        }
      }
      if (!this.seenEffects.has(effect.id)) {
        this.seenEffects.add(effect.id)
        if (effect.kind === 'crit' || effect.kind === 'projectile-crit') {
          this.hitStop = 0.04
          this.cameras.main.shake(75, 0.0025)
          this.playTone(155, 0.08, 0.035)
        } else if (effect.kind === 'player-hit') {
          this.cameras.main.shake(100, 0.004)
          this.playTone(70, 0.1, 0.055)
        } else if ((effect.kind === 'hit' || effect.kind === 'projectile-hit') && performance.now() - this.lastHitSound > 70) {
          this.hitStop = effect.kind === 'hit' ? 0.018 : 0.012
          this.lastHitSound = performance.now()
          this.playTone(effect.kind === 'hit' ? 105 : 130, 0.045, 0.018)
        } else if (effect.kind === 'kill' && performance.now() - this.lastHitSound > 70) {
          this.lastHitSound = performance.now()
          this.playTone(210, 0.045, 0.018)
        }
      }
      if ((effect.kind === 'hit' || effect.kind === 'crit' || effect.kind === 'projectile-hit' || effect.kind === 'projectile-crit' || effect.kind === 'player-hit') && !this.effectTexts.has(effect.id)) {
        const critical = effect.kind === 'crit' || effect.kind === 'projectile-crit'
        const text = this.add.text(effect.x, effect.y, `${effect.kind === 'player-hit' ? '-' : ''}${effect.value}`, {
          fontFamily: 'PingFang SC, sans-serif', fontSize: critical ? '24px' : '17px',
          fontStyle: 'bold', color: critical ? '#ffe06a' : effect.kind === 'player-hit' ? '#ff766d' : '#fff0c5',
          stroke: '#202622', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(5000)
        this.effectTexts.set(effect.id, text)
      }
      const text = this.effectTexts.get(effect.id)
      if (text) text.setPosition(effect.x, effect.y - (0.42 - effect.life) * 46).setAlpha(alpha)
    }
    const liveEffectIds = new Set(this.state.effects.map((effect) => effect.id))
    for (const [id, text] of this.effectTexts) {
      if (!liveEffectIds.has(id)) { text.destroy(); this.effectTexts.delete(id) }
    }
    this.seenEffects = new Set([...this.seenEffects].filter((id) => liveEffectIds.has(id)))

    const liveLeafIds = new Set<number>()
    for (const projectile of this.state.playerProjectiles) {
      liveLeafIds.add(projectile.id)
      const length = Math.max(0.001, Math.hypot(projectile.vx, projectile.vy))
      const directionX = projectile.vx / length
      const directionY = projectile.vy / length
      graphics.lineStyle(projectile.critical ? 9 : 7, 0x202622, 0.48).lineBetween(projectile.x - directionX * 34, projectile.y - directionY * 34, projectile.x, projectile.y)
      graphics.lineStyle(projectile.critical ? 5 : 3, projectile.critical ? 0xe3a83b : 0x9bcb66, 0.92).lineBetween(projectile.x - directionX * (projectile.critical ? 42 : 30), projectile.y - directionY * (projectile.critical ? 42 : 30), projectile.x, projectile.y)
      let sprite = this.leafSprites.get(projectile.id)
      if (!sprite) {
        sprite = this.add.image(projectile.x, projectile.y, 'leaf-dart').setDisplaySize(projectile.critical ? 38 : 31, projectile.critical ? 38 : 31)
        this.leafSprites.set(projectile.id, sprite)
      }
      sprite.setPosition(projectile.x, projectile.y).setRotation(Math.atan2(projectile.vy, projectile.vx) + Math.PI / 4 + Math.sin(this.state.time * 18 + projectile.id) * 0.18).setDepth(projectile.y + 5)
      if (projectile.critical) sprite.setTint(0xffdf65)
      else sprite.clearTint()
    }
    for (const [id, sprite] of this.leafSprites) if (!liveLeafIds.has(id)) { sprite.destroy(); this.leafSprites.delete(id) }
    for (const projectile of this.state.enemyProjectiles) {
      const length = Math.max(0.001, Math.hypot(projectile.vx, projectile.vy))
      graphics.lineStyle(5, 0xd9554d, 0.7).lineBetween(projectile.x - projectile.vx / length * 18, projectile.y - projectile.vy / length * 18, projectile.x, projectile.y)
      graphics.fillStyle(0x7651a8).fillCircle(projectile.x, projectile.y, 7)
      graphics.lineStyle(2, 0xff958a, 0.9).strokeCircle(projectile.x, projectile.y, 11)
    }

    const liveEnemyIds = new Set<number>()
    for (const enemy of this.state.enemies) {
      liveEnemyIds.add(enemy.id)
      let sprite = this.enemySprites.get(enemy.id)
      const size = enemy.kind === 'chaser' ? 54 : enemy.kind === 'dasher' ? 62 : 58
      const family = enemy.kind === 'chaser' ? 'redfang-chaser' : enemy.kind === 'dasher' ? 'violet-horn-dasher' : 'cyan-lantern-shooter'
      if (!sprite) {
        sprite = this.add.sprite(enemy.x, enemy.y, `${family}-move-01`).setOrigin(0.5, 1).setScale(size / 96).play(`${family}-move`)
        this.enemySprites.set(enemy.id, sprite)
      }
      const flashing = this.state.effects.some((effect) => (effect.kind === 'hit' || effect.kind === 'crit' || effect.kind === 'projectile-hit' || effect.kind === 'projectile-crit') && Math.abs(effect.x - enemy.x) < 24 && Math.abs(effect.y + 28 - enemy.y) < 24)
      const attacking = enemy.kind === 'chaser' ? Math.hypot(this.state.player.x - enemy.x, this.state.player.y - enemy.y) < 42 : enemy.kind === 'dasher' ? enemy.dashTime > 0 : enemy.cooldown > 1.45
      sprite.play(`${family}-${attacking ? 'attack' : 'move'}`, true)
      sprite.setFlipX(this.state.player.x < enemy.x)
      const actionScale = enemy.kind === 'dasher' && enemy.dashTime > 0 ? 1.12 : 1
      sprite.setPosition(enemy.x, enemy.y).setDepth(enemy.y).setScale(size / 96 * actionScale * (flashing ? 1.06 : 1), size / 96 * actionScale * (flashing ? 0.92 : 1))
      sprite.setBlendMode(flashing ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
      if (enemy.hp < enemy.maxHp) {
        graphics.fillStyle(0x221715, 0.7).fillRect(enemy.x - 18, enemy.y - size - 5, 36, 4)
        graphics.fillStyle(0xd9554d, 0.9).fillRect(enemy.x - 18, enemy.y - size - 5, 36 * Math.max(0, enemy.hp / enemy.maxHp), 4)
      }
    }
    for (const [id, sprite] of this.enemySprites) if (!liveEnemyIds.has(id)) { sprite.destroy(); this.enemySprites.delete(id) }

    const { x, y, dashTime } = this.state.player
    if (dashTime > 0) graphics.fillStyle(0xd4ffb8, 0.22).fillCircle(x, y, 38)
    const latestAttack = this.state.attacks.at(-1)
    if (latestAttack && latestAttack.id > this.lastAttackId) {
      this.lastAttackId = latestAttack.id
      this.playerSprite.setFlipX(Math.cos(latestAttack.angle) < 0).play('panda-attack')
    }
    const playerAttacking = this.playerSprite.anims.currentAnim?.key === 'panda-attack' && this.playerSprite.anims.isPlaying
    const moveX = Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown)
    const moveY = Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown)
    if (!playerAttacking) {
      this.playerSprite.play(moveX !== 0 || moveY !== 0 || dashTime > 0 ? 'panda-run' : 'panda-idle', true)
      this.playerSprite.setFlipX(moveX === 0 ? this.state.player.facingX < 0 : moveX < 0)
    }
    const playerHurt = this.state.player.hitCooldown > 0
    this.playerSprite.setPosition(x, y).setDepth(y).setRotation(playerAttacking ? 0 : moveY * 0.035).setScale(68 / 96 * (playerHurt ? 1.06 : 1), 68 / 96 * (playerHurt ? 0.92 : 1)).setAlpha(playerHurt ? 0.55 + Math.sin(this.state.time * 50) * 0.25 : 1)

    const healthFill = document.querySelector<HTMLElement>('#health-fill')
    const xpFill = document.querySelector<HTMLElement>('#xp-fill')
    if (healthFill) healthFill.style.width = `${(this.state.player.hp / this.state.player.maxHp) * 100}%`
    if (xpFill) xpFill.style.width = `${(this.state.player.xp / this.state.player.nextXp) * 100}%`
    const values: Record<string, string> = {
      '#health-text': `${Math.ceil(this.state.player.hp)} / ${this.state.player.maxHp}`,
      '#xp-text': `${this.state.player.xp} / ${this.state.player.nextXp}`,
      '#level': String(this.state.player.level), '#wave': String(this.state.wave),
      '#wave-time': `00:${String(Math.max(0, Math.ceil(this.state.waveDuration - this.state.waveTime))).padStart(2, '0')}`,
      '#kills': String(this.state.kills), '#coins': String(this.state.player.coins),
    }
    for (const [selector, value] of Object.entries(values)) {
      const element = document.querySelector<HTMLElement>(selector)
      if (element) element.textContent = value
    }
    const dash = document.querySelector<HTMLElement>('#dash')
    if (dash) {
      dash.textContent = this.state.player.dashCooldown === 0 ? '闪避就绪' : `闪避 ${this.state.player.dashCooldown.toFixed(1)}s`
      dash.classList.toggle('ready', this.state.player.dashCooldown === 0)
    }
    const hurtVignette = document.querySelector<HTMLElement>('#hurt-vignette')
    if (hurtVignette) hurtVignette.classList.toggle('active', this.state.effects.some((effect) => effect.kind === 'player-hit'))
    const buildTags = document.querySelector<HTMLElement>('#build-tags')
    if (buildTags) {
      const names = this.state.chosenUpgrades.slice(-3).map((id) => upgrades[id].name)
      buildTags.innerHTML = (names.length ? names : ['初入竹林']).map((name) => `<span>${name}</span>`).join('')
    }
    const itemIcons = document.querySelector<HTMLElement>('#item-icons')
    if (itemIcons) itemIcons.innerHTML = this.state.ownedItems.map((id) => `<img src="${import.meta.env.BASE_URL}${items[id].image}" title="${items[id].name}" alt="${items[id].name}">`).join('')

    if (this.state.gameOver) {
      const overlay = document.querySelector<HTMLDivElement>('#pause-overlay')
      const title = document.querySelector<HTMLElement>('#overlay-title')
      const copy = document.querySelector<HTMLElement>('#overlay-copy')
      if (overlay) overlay.hidden = false
      if (title) title.textContent = '此战暂歇'
      if (copy) copy.textContent = `第 ${this.state.wave} 波 · Lv.${this.state.player.level} · 击破 ${this.state.kills} · 按 R 再战`
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: 960, height: 540, backgroundColor: '#173527', scene: BattleScene,
  render: { antialias: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
})
