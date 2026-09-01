import Phaser from 'phaser'
import './style.css'
import { buyItem, chooseUpgrade, continueWave, createGameState, items, stepGame, upgrades } from './simulation.js'

class BattleScene extends Phaser.Scene {
  private state = createGameState()
  private actorGraphics!: Phaser.GameObjects.Graphics
  private playerSprite!: Phaser.GameObjects.Image
  private enemySprites = new Map<number, Phaser.GameObjects.Image>()
  private leafSprites = new Map<number, Phaser.GameObjects.Image>()
  private effectTexts = new Map<number, Phaser.GameObjects.Text>()
  private seenEffects = new Set<number>()
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>
  private paused = false
  private dashQueued = false
  private overlayMode = ''
  private audioContext?: AudioContext
  private lastHitSound = 0

  preload(): void {
    this.load.image('bamboo-ground', '/assets/environments/bamboo-ground.png')
    this.load.image('panda-wanderer', '/assets/characters/panda-wanderer.png')
    this.load.image('redfang-chaser', '/assets/enemies/redfang-chaser.png')
    this.load.image('violet-horn-dasher', '/assets/enemies/violet-horn-dasher.png')
    this.load.image('cyan-lantern-shooter', '/assets/enemies/cyan-lantern-shooter.png')
    this.load.image('leaf-dart', '/assets/weapons/leaf-dart.png')
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
    this.playerSprite = this.add.image(this.state.player.x, this.state.player.y, 'panda-wanderer').setOrigin(0.5, 1).setDisplaySize(68, 68)
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
        button.innerHTML = `<kbd>${index + 1}</kbd><img src="${item.image}" alt=""><small>${item.rarity} · 宝物</small><strong>${item.name}</strong><span>${item.description}</span><em>${purchased ? '已购入' : `${item.price} 铜钱`}</em>`
        button.addEventListener('click', () => buyItem(this.state, id))
        cards.append(button)
      })
    }
  }

  update(_time: number, delta: number): void {
    if (!this.paused) {
      stepGame(this.state, {
        x: Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown),
        y: Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown),
        dash: this.dashQueued,
      }, delta / 1000)
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
    for (const attack of this.state.attacks) graphics.lineStyle(10, 0xf0c96a, attack.life / 0.16).strokeCircle(attack.x, attack.y, attack.radius)
    for (const effect of this.state.effects) {
      const alpha = Math.min(1, effect.life * 4)
      if (effect.kind === 'kill') {
        graphics.fillStyle(0x7651a8, alpha * 0.42).fillCircle(effect.x, effect.y, 34 * (1 - effect.life))
        for (let index = 0; index < 5; index += 1) {
          const angle = index * Math.PI * 0.4
          graphics.lineStyle(4, 0xc5a4e8, alpha).lineBetween(effect.x, effect.y, effect.x + Math.cos(angle) * 28, effect.y + Math.sin(angle) * 28)
        }
      }
      if (effect.kind === 'dash-burst') graphics.lineStyle(8, 0x9bcb66, alpha).strokeCircle(effect.x, effect.y, 118 * (1 - effect.life / 0.35))
      if (effect.kind === 'hit' || effect.kind === 'crit') {
        graphics.fillStyle(effect.kind === 'crit' ? 0xffdf65 : 0xf3e6c8, alpha).fillCircle(effect.x, effect.y + 26, effect.kind === 'crit' ? 9 : 5)
      }
      if (!this.seenEffects.has(effect.id)) {
        this.seenEffects.add(effect.id)
        if (effect.kind === 'crit') {
          this.cameras.main.shake(75, 0.0025)
          this.playTone(155, 0.08, 0.035)
        } else if (effect.kind === 'player-hit') {
          this.cameras.main.shake(100, 0.004)
          this.playTone(70, 0.1, 0.055)
        } else if ((effect.kind === 'hit' || effect.kind === 'kill') && performance.now() - this.lastHitSound > 70) {
          this.lastHitSound = performance.now()
          this.playTone(effect.kind === 'kill' ? 210 : 105, 0.045, 0.018)
        }
      }
      if ((effect.kind === 'hit' || effect.kind === 'crit' || effect.kind === 'player-hit') && !this.effectTexts.has(effect.id)) {
        const text = this.add.text(effect.x, effect.y, `${effect.kind === 'player-hit' ? '-' : ''}${effect.value}`, {
          fontFamily: 'PingFang SC, sans-serif', fontSize: effect.kind === 'crit' ? '24px' : '17px',
          fontStyle: 'bold', color: effect.kind === 'crit' ? '#ffe06a' : effect.kind === 'player-hit' ? '#ff766d' : '#fff0c5',
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
      let sprite = this.leafSprites.get(projectile.id)
      if (!sprite) {
        sprite = this.add.image(projectile.x, projectile.y, 'leaf-dart').setDisplaySize(projectile.critical ? 27 : 22, projectile.critical ? 27 : 22)
        this.leafSprites.set(projectile.id, sprite)
      }
      sprite.setPosition(projectile.x, projectile.y).setRotation(Math.atan2(projectile.vy, projectile.vx) + Math.PI / 4).setDepth(projectile.y + 5)
    }
    for (const [id, sprite] of this.leafSprites) if (!liveLeafIds.has(id)) { sprite.destroy(); this.leafSprites.delete(id) }
    for (const projectile of this.state.enemyProjectiles) {
      graphics.fillStyle(0x6be4df).fillCircle(projectile.x, projectile.y, 6)
      graphics.lineStyle(2, 0xc8ffff, 0.7).strokeCircle(projectile.x, projectile.y, 10)
    }

    const liveEnemyIds = new Set<number>()
    for (const enemy of this.state.enemies) {
      liveEnemyIds.add(enemy.id)
      let sprite = this.enemySprites.get(enemy.id)
      const size = enemy.kind === 'chaser' ? 54 : enemy.kind === 'dasher' ? 62 : 58
      if (!sprite) {
        const texture = enemy.kind === 'chaser' ? 'redfang-chaser' : enemy.kind === 'dasher' ? 'violet-horn-dasher' : 'cyan-lantern-shooter'
        sprite = this.add.image(enemy.x, enemy.y, texture).setOrigin(0.5, 1).setDisplaySize(size, size)
        this.enemySprites.set(enemy.id, sprite)
      }
      const flashing = this.state.effects.some((effect) => (effect.kind === 'hit' || effect.kind === 'crit') && Math.abs(effect.x - enemy.x) < 12 && Math.abs(effect.y + 28 - enemy.y) < 12)
      sprite.setPosition(enemy.x, enemy.y).setDepth(enemy.y).setDisplaySize(enemy.kind === 'dasher' && enemy.dashTime > 0 ? size * 1.12 : size, enemy.kind === 'dasher' && enemy.dashTime > 0 ? size * 1.12 : size)
      sprite.setBlendMode(flashing ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
      if (enemy.hp < enemy.maxHp) {
        graphics.fillStyle(0x221715, 0.7).fillRect(enemy.x - 18, enemy.y - size - 5, 36, 4)
        graphics.fillStyle(0xd9554d, 0.9).fillRect(enemy.x - 18, enemy.y - size - 5, 36 * Math.max(0, enemy.hp / enemy.maxHp), 4)
      }
    }
    for (const [id, sprite] of this.enemySprites) if (!liveEnemyIds.has(id)) { sprite.destroy(); this.enemySprites.delete(id) }

    const { x, y, dashTime } = this.state.player
    if (dashTime > 0) graphics.fillStyle(0xd4ffb8, 0.22).fillCircle(x, y, 38)
    this.playerSprite.setPosition(x, y).setDepth(y).setAlpha(this.state.player.hitCooldown > 0 ? 0.55 + Math.sin(this.state.time * 50) * 0.25 : 1)

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
    if (itemIcons) itemIcons.innerHTML = this.state.ownedItems.map((id) => `<img src="${items[id].image}" title="${items[id].name}" alt="${items[id].name}">`).join('')

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
