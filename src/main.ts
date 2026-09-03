import Phaser from 'phaser'
import './style.css'
import { buyItem, characters, chooseUpgrade, continueWave, createGameState, enemyDefinitions, isWeaponId, items, refreshShop, sellItem, sellWeapon, stepGame, toggleShopLock, upgrades, weaponIds, weapons, type CharacterId } from './simulation.js'

const assetRoot = `${import.meta.env.BASE_URL}assets/`
let selectedCharacter: CharacterId = 'shanlan'
const animationSets = [
  { key: 'panda-idle', path: 'panda-wanderer/idle', frames: 6, frameRate: 7, repeat: -1 },
  { key: 'panda-run', path: 'panda-wanderer/run', frames: 8, frameRate: 13, repeat: -1 },
  { key: 'panda-attack', path: 'panda-wanderer/attack', frames: 6, frameRate: 22, repeat: 0 },
  { key: 'qingtuan-idle', path: 'qingtuan/idle', frames: 6, frameRate: 7, repeat: -1 },
  { key: 'qingtuan-run', path: 'qingtuan/run', frames: 8, frameRate: 13, repeat: -1 },
  { key: 'qingtuan-attack', path: 'qingtuan/attack', frames: 6, frameRate: 20, repeat: 0 },
  { key: 'shimo-idle', path: 'shimo/idle', frames: 6, frameRate: 6, repeat: -1 },
  { key: 'shimo-run', path: 'shimo/run', frames: 8, frameRate: 11, repeat: -1 },
  { key: 'shimo-attack', path: 'shimo/attack', frames: 6, frameRate: 18, repeat: 0 },
  { key: 'redfang-chaser-move', path: 'redfang-chaser/move', frames: 8, frameRate: 12, repeat: -1 },
  { key: 'redfang-chaser-attack', path: 'redfang-chaser/attack', frames: 6, frameRate: 18, repeat: 0 },
  { key: 'violet-horn-dasher-move', path: 'violet-horn-dasher/move', frames: 8, frameRate: 10, repeat: -1 },
  { key: 'violet-horn-dasher-attack', path: 'violet-horn-dasher/attack', frames: 6, frameRate: 15, repeat: 0 },
  { key: 'cyan-lantern-shooter-move', path: 'cyan-lantern-shooter/move', frames: 8, frameRate: 8, repeat: -1 },
  { key: 'cyan-lantern-shooter-attack', path: 'cyan-lantern-shooter/attack', frames: 6, frameRate: 15, repeat: 0 },
  { key: 'shellback-boar-move', path: 'shellback-boar/move', frames: 6, frameRate: 7, repeat: -1 },
  { key: 'shellback-boar-attack', path: 'shellback-boar/attack', frames: 4, frameRate: 12, repeat: 0 },
  { key: 'weasel-assassin-move', path: 'weasel-assassin/move', frames: 6, frameRate: 12, repeat: -1 },
  { key: 'weasel-assassin-attack', path: 'weasel-assassin/attack', frames: 4, frameRate: 16, repeat: 0 },
  { key: 'fox-sorcerer-move', path: 'fox-sorcerer/move', frames: 6, frameRate: 7, repeat: -1 },
  { key: 'fox-sorcerer-attack', path: 'fox-sorcerer/attack', frames: 4, frameRate: 12, repeat: 0 },
]

class BattleScene extends Phaser.Scene {
  private state = createGameState(20260831, selectedCharacter)
  private actorGraphics!: Phaser.GameObjects.Graphics
  private playerSprite!: Phaser.GameObjects.Sprite
  private enemySprites = new Map<number, Phaser.GameObjects.Sprite>()
  private bossHazardSprites = new Map<number, Phaser.GameObjects.Image>()
  private shieldAura!: Phaser.GameObjects.Image
  private leafSprites = new Map<number, Phaser.GameObjects.Image>()
  private firecrackerBlastSprites = new Map<number, Phaser.GameObjects.Image>()
  private wineFlameSprites = new Map<number, Phaser.GameObjects.Image>()
  private enemyZoneSprites = new Map<number, Phaser.GameObjects.Image>()
  private turretSprites = new Map<number, Phaser.GameObjects.Image>()
  private bladeSprites = new Map<number, Phaser.GameObjects.Image>()
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
  private lastPlayerProjectileId = 0
  private weaponHudMode = ''

  preload(): void {
    this.load.image('bamboo-ground', `${assetRoot}environments/bamboo-ground.png`)
    this.load.image('leaf-dart', `${assetRoot}weapons/leaf-dart.png`)
    this.load.image('firecracker-launcher', `${assetRoot}weapons/firecracker-launcher.png`)
    this.load.image('spinning-bamboo-blade', `${assetRoot}weapons/spinning-bamboo-blade.png`)
    this.load.image('panda-wine-gourd', `${assetRoot}weapons/panda-wine-gourd.png`)
    this.load.image('bamboo-crossbow-turret', `${assetRoot}weapons/bamboo-crossbow-turret.png`)
    this.load.image('firecracker-blast', `${assetRoot}effects/firecracker-blast.png`)
    this.load.image('wine-flame-patch', `${assetRoot}effects/wine-flame-patch.png`)
    this.load.image('fox-slowing-mist', `${assetRoot}effects/fox-slowing-mist.png`)
    this.load.image('corrupted-bamboo-giant', `${assetRoot}enemies/corrupted-bamboo-giant.png`)
    this.load.image('corrupted-root-warning', `${assetRoot}effects/corrupted-root-warning.png`)
    this.load.image('corrupted-root-burst', `${assetRoot}effects/corrupted-root-burst.png`)
    this.load.image('ink-shield-aura', `${assetRoot}effects/ink-shield-aura.png`)
    for (const animation of animationSets) {
      for (let index = 1; index <= animation.frames; index += 1) {
        const frame = String(index).padStart(2, '0')
        this.load.image(`${animation.key}-${frame}`, `${assetRoot}animations/${animation.path}/${frame}.png`)
      }
    }
  }

  create(): void {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('playtest-upgrade')) {
      this.state.player.hp = Math.min(6, this.state.player.maxHp)
      this.state.pendingUpgrade = true
      this.state.upgradeChoices = ['vitality', 'power', 'haste']
    } else if (import.meta.env.DEV && new URLSearchParams(location.search).has('playtest-weapons-combat')) {
      this.state.weaponLevels = { 'iron-pot-gauntlets': 3, 'firecracker-launcher': 4 }
    } else if (import.meta.env.DEV && new URLSearchParams(location.search).has('playtest-complete-weapons-shop')) {
      this.state.shopOpen = true
      this.state.player.coins = 500
      this.state.weaponLevels = { 'spinning-bamboo-blade': 3, 'panda-wine-gourd': 3, 'bamboo-crossbow-turret': 3 }
      this.state.shopChoices = ['iron-pot-gauntlets', 'firecracker-launcher', 'iron-bracer', 'panda-roller']
    } else if (import.meta.env.DEV && new URLSearchParams(location.search).has('playtest-weapons')) {
      this.state.shopOpen = true
      this.state.player.coins = 500
      this.state.shopChoices = ['iron-pot-gauntlets', 'firecracker-launcher', 'iron-bracer', 'panda-roller']
    } else if (import.meta.env.DEV && new URLSearchParams(location.search).has('playtest-complete-weapons')) {
      this.state.weaponLevels = { 'spinning-bamboo-blade': 3, 'panda-wine-gourd': 3, 'bamboo-crossbow-turret': 3 }
      this.state.player.hp = 200
      this.state.player.maxHp = 200
      this.state.spawnTimer = 99
      this.state.enemies = [
        { id: this.state.nextId++, kind: 'chaser', x: 900, y: 500, hp: 2000, maxHp: 2000, cooldown: 99, dashTime: 0, vx: 0, vy: 0 },
        { id: this.state.nextId++, kind: 'dasher', x: 760, y: 620, hp: 2000, maxHp: 2000, cooldown: 99, dashTime: 0, vx: 0, vy: 0 },
        { id: this.state.nextId++, kind: 'shooter', x: 1010, y: 620, hp: 2000, maxHp: 2000, cooldown: 99, dashTime: 0, vx: 0, vy: 0 },
      ]
    } else if (import.meta.env.DEV && new URLSearchParams(location.search).has('playtest-enemy-wave')) {
      this.state.wave = 6
      this.state.waveTime = 18
      this.state.spawnTimer = 99
      this.state.threatBudget = 0
      this.state.player.hp = 200
      this.state.player.maxHp = 200
      this.state.bambooCooldown = 99
      this.state.leafCooldown = 99
      this.state.enemies = [
        { id: this.state.nextId++, kind: 'boar', x: 610, y: 500, hp: 280, maxHp: 280, cooldown: 99, dashTime: 0, vx: 0, vy: 0, facingX: 1, facingY: 0 },
        { id: this.state.nextId++, kind: 'assassin', x: 920, y: 330, hp: 160, maxHp: 160, cooldown: 0, dashTime: 0, vx: 0, vy: 0, telegraph: 0 },
        { id: this.state.nextId++, kind: 'sorcerer', x: 1060, y: 570, hp: 180, maxHp: 180, cooldown: 0, dashTime: 0, vx: 0, vy: 0 },
        { id: this.state.nextId++, kind: 'chaser', x: 620, y: 730, hp: 360, maxHp: 360, cooldown: 0, dashTime: 0, vx: 0, vy: 0, telegraph: 0, elite: true },
      ]
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('playtest-boss')) {
      this.state.wave = 9
      this.state.shopOpen = true
      continueWave(this.state)
      this.state.player.damage = 4
      this.state.player.attackSpeed = 2
      this.state.player.hp = 500
      this.state.player.maxHp = 500
    }
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
    const playerAnimation = characters[this.state.characterId].animation
    this.playerSprite = this.add.sprite(this.state.player.x, this.state.player.y, `${playerAnimation}-idle-01`).setOrigin(0.5, 1).setScale(68 / 96).play(`${playerAnimation}-idle`)
    this.shieldAura = this.add.image(this.state.player.x, this.state.player.y - 26, 'ink-shield-aura').setDisplaySize(104, 104).setVisible(false)
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
        buyItem(this.state, Number(event.code.slice(-1)) - 1)
      }
      if (event.code === 'Enter' && this.state.shopOpen) continueWave(this.state)
      if (event.code === 'Escape' && !this.state.gameOver && !this.state.victory && !this.state.pendingUpgrade && !this.state.shopOpen) {
        this.paused = !this.paused
        const overlay = document.querySelector<HTMLDivElement>('#pause-overlay')
        const title = document.querySelector<HTMLElement>('#overlay-title')
        const copy = document.querySelector<HTMLElement>('#overlay-copy')
        if (overlay) overlay.hidden = !this.paused
        if (title) title.textContent = '竹息凝神'
        if (copy) copy.textContent = '按 ESC 继续战斗'
      }
      if (event.code === 'KeyR' && (this.state.gameOver || this.state.victory)) {
        this.state = createGameState(20260831, this.state.characterId)
        this.lastAttackId = 0
        this.lastPlayerProjectileId = 0
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
    const shopLayout = document.querySelector<HTMLElement>('#shop-layout')
    const shopCards = document.querySelector<HTMLElement>('#shop-cards')
    const shopWeapons = document.querySelector<HTMLElement>('#shop-weapons')
    const shopInventory = document.querySelector<HTMLElement>('#shop-inventory')
    const shopStats = document.querySelector<HTMLElement>('#shop-stats')
    const refreshButton = document.querySelector<HTMLButtonElement>('#refresh-shop')
    if (!overlay || !cards || !title || !kicker || !copy || !continueButton || !shopLayout || !shopCards || !shopWeapons || !shopInventory || !shopStats || !refreshButton) return

    const mode = this.state.pendingUpgrade ? `upgrade-${this.state.player.level}` : this.state.shopOpen ? `shop-${this.state.wave}-${this.state.player.coins}-${this.state.shopChoices.join('-')}-${this.state.lockedShopIndices.join('-')}-${this.state.ownedItems.join('-')}-${Object.entries(this.state.weaponLevels).join('-')}` : ''
    overlay.hidden = !mode
    if (!mode || mode === this.overlayMode) return
    this.overlayMode = mode
    cards.innerHTML = ''
    if (this.state.pendingUpgrade) {
      cards.hidden = false
      shopLayout.hidden = true
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
      cards.hidden = true
      shopLayout.hidden = false
      kicker.textContent = `竹林补给 · 第 ${this.state.wave} 波结束`
      title.textContent = '整备下一波构筑'
      copy.textContent = `现有 ${this.state.player.coins} 铜钱 · 商品可重复购买，唯一宝物除外`
      continueButton.hidden = false
      continueButton.onclick = () => continueWave(this.state)
      const allProductsLocked = this.state.shopChoices.every((id, index) => id !== null && this.state.lockedShopIndices.includes(index))
      refreshButton.textContent = allProductsLocked ? '全部商品已锁定' : `刷新商品 · ${this.state.shopRefreshCost} 铜钱`
      refreshButton.disabled = allProductsLocked || this.state.player.coins < this.state.shopRefreshCost
      refreshButton.onclick = () => {
        if (refreshShop(this.state)) this.overlayMode = ''
      }
      const character = characters[this.state.characterId]
      shopStats.innerHTML = `
        <div class="shop-character"><img src="${import.meta.env.BASE_URL}${character.portrait}" alt=""><strong>${character.name}</strong><span>${character.role}</span></div>
        <dl>
          <div><dt>生命</dt><dd>${Math.ceil(this.state.player.hp)} / ${this.state.player.maxHp}</dd></div>
          <div><dt>护甲</dt><dd>${this.state.player.armor}</dd></div>
          <div><dt>全部伤害</dt><dd>+${Math.round((this.state.player.damage - 1) * 100)}%</dd></div>
          <div><dt>近战伤害</dt><dd>${Math.round(this.state.player.meleeDamage * 100)}%</dd></div>
          <div><dt>远程伤害</dt><dd>${Math.round(this.state.player.rangedDamage * 100)}%</dd></div>
          <div><dt>移动速度</dt><dd>${Math.round(this.state.player.moveSpeed * 100)}%</dd></div>
        </dl>`
      shopCards.innerHTML = ''
      this.state.shopChoices.forEach((id, index) => {
        const article = document.createElement('article')
        article.className = 'shop-card'
        if (!id) return
        const product = isWeaponId(id) ? weapons[id] : items[id]
        const weaponLevel = isWeaponId(id) ? this.state.weaponLevels[id] ?? 0 : 0
        const uniqueOwned = Boolean(!isWeaponId(id) && items[id].unique && this.state.ownedItems.includes(id))
        const weaponFull = isWeaponId(id) && weaponLevel === 0 && Object.keys(this.state.weaponLevels).length >= 3
        const maxLevel = isWeaponId(id) && weaponLevel >= 5
        const buyButton = document.createElement('button')
        const lockButton = document.createElement('button')
        const locked = this.state.lockedShopIndices.includes(index)
        article.dataset.rarity = product.rarity
        article.innerHTML = `<kbd>${index + 1}</kbd><img src="${import.meta.env.BASE_URL}${product.image}" alt=""><small>${product.rarity} · ${isWeaponId(id) ? `武器 · ${weaponLevel >= 5 ? 'Lv.5 · 已满级' : weaponLevel > 0 ? `Lv.${weaponLevel} → Lv.${weaponLevel + 1}` : '新武器'}` : '宝物'}</small><strong>${product.name}</strong><span>${product.description}</span><em>${product.preview}</em>`
        buyButton.type = 'button'
        buyButton.className = 'shop-buy'
        buyButton.disabled = uniqueOwned || weaponFull || maxLevel || this.state.player.coins < product.price
        buyButton.textContent = uniqueOwned ? '已拥有' : weaponFull ? '通用武器栏已满' : maxLevel ? '已达 Lv.5' : this.state.player.coins < product.price ? `缺少 ${product.price - this.state.player.coins} 铜钱` : `${product.price} 铜钱 · ${weaponLevel > 0 ? '合成升级' : '购买'}`
        buyButton.addEventListener('click', () => {
          if (buyItem(this.state, index)) this.overlayMode = ''
        })
        lockButton.type = 'button'
        lockButton.className = `shop-lock${locked ? ' locked' : ''}`
        lockButton.textContent = locked ? '已锁定' : '锁定'
        lockButton.setAttribute('aria-pressed', String(locked))
        lockButton.addEventListener('click', () => {
          if (toggleShopLock(this.state, index)) this.overlayMode = ''
        })
        article.append(buyButton, lockButton)
        shopCards.append(article)
      })
      shopWeapons.innerHTML = ''
      const ownedWeaponIds = weaponIds.filter((id) => (this.state.weaponLevels[id] ?? 0) > 0)
      if (ownedWeaponIds.length === 0) shopWeapons.innerHTML = '<p>尚未获得通用武器</p>'
      ownedWeaponIds.forEach((id) => {
        const weapon = weapons[id]
        const level = this.state.weaponLevels[id] ?? 0
        const row = document.createElement('div')
        const sellButton = document.createElement('button')
        row.className = 'shop-weapon'
        row.innerHTML = `<img src="${import.meta.env.BASE_URL}${weapon.image}" alt=""><span><strong>${weapon.name} · Lv.${level}</strong><small>${weapon.description}</small></span>`
        sellButton.type = 'button'
        sellButton.textContent = `出售 +${Math.floor(weapon.price * level * 0.6)}`
        sellButton.addEventListener('click', () => {
          if (sellWeapon(this.state, id)) this.overlayMode = ''
        })
        row.append(sellButton)
        shopWeapons.append(row)
      })
      shopInventory.innerHTML = ''
      if (this.state.ownedItems.length === 0) shopInventory.innerHTML = '<p>尚未获得宝物</p>'
      this.state.ownedItems.forEach((id, index) => {
        const item = items[id]
        const button = document.createElement('button')
        button.type = 'button'
        button.innerHTML = `<img src="${import.meta.env.BASE_URL}${item.image}" alt=""><span><strong>${item.name}</strong><small>出售 +${Math.floor(item.price * 0.6)} 铜钱</small></span>`
        button.addEventListener('click', () => {
          if (sellItem(this.state, index)) this.overlayMode = ''
        })
        shopInventory.append(button)
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

    if (this.state.corruptionInset > 0) {
      const inset = this.state.corruptionInset
      graphics.fillStyle(0x4a286d, 0.28).fillRect(0, 0, 1600, inset + 75).fillRect(0, 950 - inset, 1600, inset + 50).fillRect(0, 0, inset + 50, 1000).fillRect(1550 - inset, 0, inset + 50, 1000)
      graphics.lineStyle(8, 0x9e4f91, 0.72).strokeRect(50 + inset, 75 + inset, 1500 - inset * 2, 875 - inset * 2)
    }
    const liveHazardIds = new Set<number>()
    for (const hazard of this.state.bossHazards) {
      if (hazard.kind === 'root') {
        liveHazardIds.add(hazard.id)
        let sprite = this.bossHazardSprites.get(hazard.id)
        if (!sprite) {
          sprite = this.add.image(hazard.x, hazard.y, 'corrupted-root-warning').setOrigin(0.5).setRotation((hazard.id % 12) * Math.PI / 6)
          this.bossHazardSprites.set(hazard.id, sprite)
        }
        if (!hazard.triggered) {
          const progress = 1 - hazard.life / hazard.duration
          const size = hazard.radius * (2.9 + progress * 0.45)
          sprite.setTexture('corrupted-root-warning').setPosition(hazard.x, hazard.y).setDisplaySize(size, size).setDepth(hazard.y - 80).setAlpha(0.68 + progress * 0.32)
        } else {
          const alpha = Math.max(0, (hazard.life + 0.28) / 0.28)
          sprite.setTexture('corrupted-root-burst').setPosition(hazard.x, hazard.y + 12).setDisplaySize(hazard.radius * 2.8, hazard.radius * 2.8).setDepth(hazard.y + 2).setAlpha(alpha * 0.9)
        }
      } else if (!hazard.triggered) {
        const progress = 1 - hazard.life / hazard.duration
        const rotation = this.state.time * 0.15
        graphics.fillStyle(0x4a286d, 0.05 + progress * 0.08).fillCircle(hazard.x, hazard.y, hazard.radius - 8)
        for (let index = 0; index < 3; index += 1) {
          const start = rotation + index * Math.PI * 2 / 3
          graphics.lineStyle(12 - index * 2, index === 1 ? 0xd9554d : 0x7651a8, 0.48 + progress * 0.38).beginPath().arc(hazard.x, hazard.y, hazard.radius - index * 7, start, start + 1.28).strokePath()
        }
      } else {
        const alpha = Math.max(0, (hazard.life + 0.28) / 0.28)
        for (let index = 0; index < 9; index += 1) {
          const angle = index * Math.PI * 2 / 9 + hazard.id
          graphics.lineStyle(index % 3 === 0 ? 8 : 4, index % 3 === 0 ? 0xd9554d : 0x7651a8, alpha).lineBetween(hazard.x + Math.cos(angle) * (hazard.radius - 12), hazard.y + Math.sin(angle) * (hazard.radius - 12), hazard.x + Math.cos(angle) * (hazard.radius + 28), hazard.y + Math.sin(angle) * (hazard.radius + 28))
        }
      }
    }
    for (const [id, sprite] of this.bossHazardSprites) if (!liveHazardIds.has(id)) { sprite.destroy(); this.bossHazardSprites.delete(id) }

    const bladeLevel = this.state.weaponLevels['spinning-bamboo-blade'] ?? 0
    const bladeCount = bladeLevel >= 5 ? 3 : bladeLevel >= 3 ? 2 : bladeLevel > 0 ? 1 : 0
    const bladeRadius = 58 + bladeLevel * 5
    for (let index = 0; index < bladeCount; index += 1) {
      const angle = this.state.time * 5.4 + index * Math.PI * 2 / bladeCount
      const x = this.state.player.x + Math.cos(angle) * bladeRadius
      const y = this.state.player.y + Math.sin(angle) * bladeRadius
      graphics.lineStyle(5, 0x9bcb66, 0.45).beginPath().arc(this.state.player.x, this.state.player.y, bladeRadius, angle - 0.72, angle - 0.18).strokePath()
      graphics.lineStyle(2, 0xf3e6c8, 0.72).beginPath().arc(this.state.player.x, this.state.player.y, bladeRadius - 7, angle - 0.58, angle - 0.28).strokePath()
      let sprite = this.bladeSprites.get(index)
      if (!sprite) {
        sprite = this.add.image(x, y, 'spinning-bamboo-blade')
        this.bladeSprites.set(index, sprite)
      }
      sprite.setPosition(x, y).setDisplaySize(42, 42).setRotation(angle + Math.PI / 2).setDepth(y + 4).setVisible(true)
    }
    for (const [index, sprite] of this.bladeSprites) {
      if (index >= bladeCount) { sprite.destroy(); this.bladeSprites.delete(index) }
    }

    const liveZoneIds = new Set<number>()
    for (const zone of this.state.groundZones) {
      liveZoneIds.add(zone.id)
      let sprite = this.wineFlameSprites.get(zone.id)
      if (!sprite) {
        sprite = this.add.image(zone.x, zone.y, 'wine-flame-patch').setRotation((zone.id % 9 - 4) * 0.08)
        this.wineFlameSprites.set(zone.id, sprite)
      }
      const fade = Math.min(1, zone.life * 2, (zone.duration - zone.life) * 5)
      sprite.setPosition(zone.x, zone.y).setDisplaySize(zone.radius * 2.25, zone.radius * 1.7).setDepth(zone.y - 2).setAlpha(fade * 0.86)
    }
    for (const [id, sprite] of this.wineFlameSprites) if (!liveZoneIds.has(id)) { sprite.destroy(); this.wineFlameSprites.delete(id) }

    const liveEnemyZoneIds = new Set<number>()
    for (const zone of this.state.enemyZones) {
      liveEnemyZoneIds.add(zone.id)
      let sprite = this.enemyZoneSprites.get(zone.id)
      if (!sprite) {
        sprite = this.add.image(zone.x, zone.y, 'fox-slowing-mist').setRotation((zone.id % 7 - 3) * 0.12)
        this.enemyZoneSprites.set(zone.id, sprite)
      }
      const fade = Math.min(1, zone.life * 2, (zone.duration - zone.life) * 4)
      const pulse = 1 + Math.sin(this.state.time * 2.2 + zone.id) * 0.035
      sprite.setPosition(zone.x, zone.y).setDisplaySize(zone.radius * 2.12 * pulse, zone.radius * 2.12 * pulse).setDepth(zone.y - 4).setAlpha(fade * 0.56)
    }
    for (const [id, sprite] of this.enemyZoneSprites) if (!liveEnemyZoneIds.has(id)) { sprite.destroy(); this.enemyZoneSprites.delete(id) }

    const liveTurretIds = new Set<number>()
    for (const turret of this.state.turrets) {
      liveTurretIds.add(turret.id)
      let sprite = this.turretSprites.get(turret.id)
      if (!sprite) {
        sprite = this.add.image(turret.x, turret.y, 'bamboo-crossbow-turret')
        this.turretSprites.set(turret.id, sprite)
      }
      const deployScale = Math.min(1, (12 - turret.life) * 5)
      sprite.setPosition(turret.x, turret.y).setDisplaySize(50 * deployScale, 50 * deployScale).setRotation(turret.angle + Math.PI / 4).setDepth(turret.y + 2).setAlpha(Math.min(1, turret.life * 2))
    }
    for (const [id, sprite] of this.turretSprites) if (!liveTurretIds.has(id)) { sprite.destroy(); this.turretSprites.delete(id) }

    for (const drop of this.state.drops) {
      const color = drop.kind === 'xp' ? 0xb8ed72 : drop.kind === 'coin' ? 0xf0b844 : 0x63d889
      graphics.fillStyle(color, 0.9).fillCircle(drop.x, drop.y, drop.kind === 'xp' ? 5 : 6)
      graphics.lineStyle(2, 0xf9f0c8, 0.7).strokeCircle(drop.x, drop.y, drop.kind === 'xp' ? 8 : 9)
    }
    for (const attack of this.state.attacks) {
      const alpha = Math.min(1, attack.life / 0.2)
      const start = attack.angle - attack.arc
      const end = attack.angle + attack.arc
      if (attack.kind === 'fists') {
        const impactX = attack.x + Math.cos(attack.angle) * attack.radius
        const impactY = attack.y + Math.sin(attack.angle) * attack.radius
        graphics.lineStyle(10, 0x8f5b2f, alpha * 0.78).beginPath().arc(attack.x, attack.y, attack.radius * 0.78, start + 0.1, end - 0.1).strokePath()
        graphics.lineStyle(5, attack.critical ? 0xffdf65 : 0xe3a83b, alpha).beginPath().arc(attack.x, attack.y, attack.radius, start, end).strokePath()
        graphics.fillStyle(0xf3e6c8, alpha * 0.9).fillCircle(impactX, impactY, attack.critical ? 9 : 6)
        graphics.lineStyle(4, 0xe3a83b, alpha).lineBetween(impactX - Math.cos(attack.angle) * 14, impactY - Math.sin(attack.angle) * 14, impactX + Math.cos(attack.angle) * 12, impactY + Math.sin(attack.angle) * 12)
      } else if (attack.kind === 'shield') {
        const impactX = attack.x + Math.cos(attack.angle) * attack.radius
        const impactY = attack.y + Math.sin(attack.angle) * attack.radius
        graphics.lineStyle(12, 0x286d72, alpha * 0.78).beginPath().arc(attack.x, attack.y, attack.radius * 0.82, start + 0.16, end - 0.16).strokePath()
        graphics.lineStyle(6, attack.critical ? 0xf3e6c8 : 0x72d4cf, alpha).beginPath().arc(attack.x, attack.y, attack.radius, start, end).strokePath()
        graphics.fillStyle(0xf3e6c8, alpha * 0.82).fillTriangle(impactX + Math.cos(attack.angle) * 12, impactY + Math.sin(attack.angle) * 12, impactX + Math.cos(attack.angle + 2.35) * 8, impactY + Math.sin(attack.angle + 2.35) * 8, impactX + Math.cos(attack.angle - 2.35) * 8, impactY + Math.sin(attack.angle - 2.35) * 8)
        for (let index = -1; index <= 1; index += 1) {
          const angle = attack.angle + index * 0.42
          graphics.lineStyle(4, index === 0 ? 0xf3e6c8 : 0x53b8b2, alpha * 0.9).lineBetween(impactX - Math.cos(angle) * 8, impactY - Math.sin(angle) * 8, impactX + Math.cos(angle) * 18, impactY + Math.sin(angle) * 18)
        }
      } else {
        graphics.fillStyle(attack.kind === 'whirlwind' ? 0xffdf65 : 0x9bcb66, alpha * (attack.kind === 'whirlwind' ? 0.25 : 0.18)).beginPath().moveTo(attack.x, attack.y).arc(attack.x, attack.y, attack.radius, start, end).closePath().fillPath()
        graphics.lineStyle(attack.critical || attack.kind === 'whirlwind' ? 9 : 7, attack.critical || attack.kind === 'whirlwind' ? 0xffdf65 : 0xe3a83b, alpha).beginPath().arc(attack.x, attack.y, attack.radius, start, end).strokePath()
        graphics.lineStyle(3, 0xcdf08a, alpha * 0.8).beginPath().arc(attack.x, attack.y, attack.radius * 0.72, start + 0.08, end - 0.08).strokePath()
        if (attack.kind === 'whirlwind') graphics.lineStyle(5, 0xe3a83b, alpha * 0.8).beginPath().arc(attack.x, attack.y, attack.radius * 0.86, start + 0.2, end - 0.2).strokePath()
        for (let index = 0; index < (attack.kind === 'whirlwind' ? 5 : attack.radius > 110 ? 3 : 2); index += 1) {
          const angle = start + (end - start) * ((index + 1) / (attack.kind === 'whirlwind' ? 6 : attack.radius > 110 ? 4 : 3))
          graphics.lineStyle(3, index % 2 === 0 ? 0xf3e6c8 : 0x9bcb66, alpha * 0.72).lineBetween(attack.x + Math.cos(angle) * attack.radius * 0.78, attack.y + Math.sin(angle) * attack.radius * 0.78, attack.x + Math.cos(angle + 0.08) * attack.radius, attack.y + Math.sin(angle + 0.08) * attack.radius)
        }
      }
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
      if (effect.kind === 'shield-break') {
        const distance = 35 + 82 * (1 - effect.life / 0.42)
        for (let index = 0; index < 10; index += 1) {
          const angle = index * Math.PI * 0.2 + 0.18
          graphics.fillStyle(index % 3 === 0 ? 0xf3e6c8 : 0x53b8b2, alpha).fillTriangle(effect.x + Math.cos(angle) * distance, effect.y + Math.sin(angle) * distance, effect.x + Math.cos(angle + 0.1) * (distance - 15), effect.y + Math.sin(angle + 0.1) * (distance - 15), effect.x + Math.cos(angle - 0.12) * (distance - 8), effect.y + Math.sin(angle - 0.12) * (distance - 8))
        }
      }
      if (effect.kind === 'enemy-shot') {
        const progress = 1 - effect.life / 0.24
        const muzzleX = effect.x + Math.cos(effect.angle) * progress * 20
        const muzzleY = effect.y + Math.sin(effect.angle) * progress * 20
        graphics.fillStyle(0x7651a8, alpha * 0.24).fillCircle(muzzleX, muzzleY, 18 * (1 - progress))
        graphics.lineStyle(3, 0xd9554d, alpha * 0.85).strokeCircle(muzzleX, muzzleY, 6 + progress * 8)
      }
      if (effect.kind === 'boss-summon') {
        const progress = 1 - effect.life / 0.7
        graphics.fillStyle(0x7651a8, alpha * 0.24).fillCircle(effect.x, effect.y, 55 + progress * 70)
        graphics.lineStyle(7, 0xd9554d, alpha * 0.72).strokeCircle(effect.x, effect.y, 42 + progress * 95)
      }
      if (effect.kind === 'armor-block') {
        const centerY = effect.y + 24
        graphics.lineStyle(7, 0xe3a83b, alpha * 0.9).beginPath().arc(effect.x, centerY, 23, effect.angle - 0.72, effect.angle + 0.72).strokePath()
        graphics.lineStyle(3, 0xf3e6c8, alpha).lineBetween(effect.x + Math.cos(effect.angle) * 14, centerY + Math.sin(effect.angle) * 14, effect.x + Math.cos(effect.angle) * 31, centerY + Math.sin(effect.angle) * 31)
      }
      if (effect.kind === 'firecracker-blast') {
        const progress = 1 - effect.life / 0.38
        let sprite = this.firecrackerBlastSprites.get(effect.id)
        if (!sprite) {
          sprite = this.add.image(effect.x, effect.y, 'firecracker-blast').setRotation((effect.id % 8) * Math.PI / 12)
          this.firecrackerBlastSprites.set(effect.id, sprite)
        }
        sprite.setPosition(effect.x, effect.y).setDisplaySize(effect.value * (1.45 + progress * 0.65), effect.value * (1.45 + progress * 0.65)).setDepth(effect.y + 8).setAlpha(alpha * 0.92)
      }
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
        if (effect.kind === 'crit' || effect.kind === 'projectile-crit' || effect.kind === 'firecracker-crit') {
          this.hitStop = 0.04
          this.cameras.main.shake(75, 0.0025)
          this.playTone(155, 0.08, 0.035)
        } else if (effect.kind === 'player-hit') {
          this.cameras.main.shake(100, 0.004)
          this.playTone(70, 0.1, 0.055)
        } else if (effect.kind === 'shield-break') {
          this.cameras.main.shake(130, 0.006)
          this.playTone(92, 0.14, 0.06)
        } else if ((effect.kind === 'hit' || effect.kind === 'projectile-hit' || effect.kind === 'firecracker-hit') && performance.now() - this.lastHitSound > 70) {
          this.hitStop = effect.kind === 'hit' ? 0.018 : 0.012
          this.lastHitSound = performance.now()
          this.playTone(effect.kind === 'hit' ? 105 : 130, 0.045, 0.018)
        } else if (effect.kind === 'kill' && performance.now() - this.lastHitSound > 70) {
          this.lastHitSound = performance.now()
          this.playTone(210, 0.045, 0.018)
        }
      }
      if ((effect.kind === 'hit' || effect.kind === 'crit' || effect.kind === 'projectile-hit' || effect.kind === 'projectile-crit' || effect.kind === 'firecracker-hit' || effect.kind === 'firecracker-crit' || effect.kind === 'player-hit') && !this.effectTexts.has(effect.id)) {
        const critical = effect.kind === 'crit' || effect.kind === 'projectile-crit' || effect.kind === 'firecracker-crit'
        const text = this.add.text(effect.x, effect.y, `${effect.kind === 'player-hit' ? '-' : ''}${effect.value}`, {
          fontFamily: 'PingFang SC, sans-serif', fontSize: critical ? '24px' : '17px',
          fontStyle: 'bold', color: critical ? '#ffe06a' : effect.kind === 'player-hit' ? '#ff766d' : '#fff0c5',
          stroke: '#202622', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(5000)
        this.effectTexts.set(effect.id, text)
      }
      const text = this.effectTexts.get(effect.id)
      if (text) text.setPosition(
        Phaser.Math.Clamp(effect.x, 34, 1566),
        Phaser.Math.Clamp(effect.y - (0.42 - effect.life) * 46, 28, 972),
      ).setAlpha(alpha)
    }
    const liveEffectIds = new Set(this.state.effects.map((effect) => effect.id))
    for (const [id, text] of this.effectTexts) {
      if (!liveEffectIds.has(id)) { text.destroy(); this.effectTexts.delete(id) }
    }
    for (const [id, sprite] of this.firecrackerBlastSprites) if (!liveEffectIds.has(id)) { sprite.destroy(); this.firecrackerBlastSprites.delete(id) }
    this.seenEffects = new Set([...this.seenEffects].filter((id) => liveEffectIds.has(id)))

    const liveLeafIds = new Set<number>()
    for (const projectile of this.state.playerProjectiles) {
      liveLeafIds.add(projectile.id)
      const length = Math.max(0.001, Math.hypot(projectile.vx, projectile.vy))
      const directionX = projectile.vx / length
      const directionY = projectile.vy / length
      graphics.lineStyle(projectile.kind === 'bolt' ? 4 : projectile.critical ? 9 : 7, 0x202622, 0.48).lineBetween(projectile.x - directionX * 34, projectile.y - directionY * 34, projectile.x, projectile.y)
      graphics.lineStyle(projectile.kind === 'bolt' ? 2 : projectile.critical ? 5 : 3, projectile.critical ? 0xffdf65 : projectile.kind === 'firecracker' ? 0xd9554d : projectile.kind === 'bolt' ? 0xe3a83b : 0x9bcb66, 0.92).lineBetween(projectile.x - directionX * (projectile.kind === 'bolt' ? 22 : projectile.critical ? 42 : 30), projectile.y - directionY * (projectile.kind === 'bolt' ? 22 : projectile.critical ? 42 : 30), projectile.x, projectile.y)
      if (projectile.kind === 'bolt') {
        const sideX = -directionY
        const sideY = directionX
        graphics.fillStyle(0xe3a83b, 0.96).fillTriangle(projectile.x + directionX * 8, projectile.y + directionY * 8, projectile.x - directionX * 3 + sideX * 4, projectile.y - directionY * 3 + sideY * 4, projectile.x - directionX * 3 - sideX * 4, projectile.y - directionY * 3 - sideY * 4)
        continue
      }
      let sprite = this.leafSprites.get(projectile.id)
      if (!sprite) {
        sprite = this.add.image(projectile.x, projectile.y, projectile.kind === 'firecracker' ? 'firecracker-launcher' : 'leaf-dart')
        this.leafSprites.set(projectile.id, sprite)
      }
      const projectileSize = projectile.kind === 'firecracker' ? 32 : projectile.critical ? 34 : 28
      sprite.setTexture(projectile.kind === 'firecracker' ? 'firecracker-launcher' : 'leaf-dart').setDisplaySize(projectileSize, projectileSize).setPosition(projectile.x, projectile.y).setRotation(Math.atan2(projectile.vy, projectile.vx) + Math.PI / 4 + Math.sin(this.state.time * 18 + projectile.id) * 0.18).setDepth(projectile.y + 5)
      if (projectile.critical) sprite.setTint(0xffdf65)
      else sprite.clearTint()
    }
    for (const [id, sprite] of this.leafSprites) if (!liveLeafIds.has(id)) { sprite.destroy(); this.leafSprites.delete(id) }
    for (const projectile of this.state.enemyProjectiles) {
      const length = Math.max(0.001, Math.hypot(projectile.vx, projectile.vy))
      const directionX = projectile.vx / length
      const directionY = projectile.vy / length
      const angle = Math.atan2(projectile.vy, projectile.vx)
      const sideX = -directionY
      const sideY = directionX
      graphics.lineStyle(7, 0x3f285d, 0.22).lineBetween(projectile.x - directionX * 34, projectile.y - directionY * 34, projectile.x, projectile.y)
      graphics.lineStyle(3, 0xd9554d, 0.78).lineBetween(projectile.x - directionX * 28, projectile.y - directionY * 28, projectile.x, projectile.y)
      graphics.lineStyle(1, 0xffb0a8, 0.9).lineBetween(projectile.x - directionX * 15, projectile.y - directionY * 15, projectile.x, projectile.y)
      const pulse = Math.sin(this.state.time * 12 + projectile.id) * 1.5
      graphics.fillStyle(0x7651a8, 0.96).beginPath().moveTo(projectile.x + directionX * (9 + pulse), projectile.y + directionY * (9 + pulse)).lineTo(projectile.x + sideX * 5, projectile.y + sideY * 5).lineTo(projectile.x - directionX * 8, projectile.y - directionY * 8).lineTo(projectile.x - sideX * 5, projectile.y - sideY * 5).closePath().fillPath()
      graphics.lineStyle(2, 0xd9554d, 0.9).beginPath().moveTo(projectile.x + directionX * (9 + pulse), projectile.y + directionY * (9 + pulse)).lineTo(projectile.x + sideX * 5, projectile.y + sideY * 5).lineTo(projectile.x - directionX * 8, projectile.y - directionY * 8).lineTo(projectile.x - sideX * 5, projectile.y - sideY * 5).closePath().strokePath()
      graphics.fillStyle(0xf3e6c8, 0.95).fillCircle(projectile.x + Math.cos(angle) * 2, projectile.y + Math.sin(angle) * 2, 2)
      graphics.fillStyle(0xd9554d, 0.72).fillCircle(projectile.x + sideX * (8 + pulse), projectile.y + sideY * (8 + pulse), 2).fillCircle(projectile.x - sideX * (8 + pulse), projectile.y - sideY * (8 + pulse), 2)
    }

    const liveEnemyIds = new Set<number>()
    for (const enemy of this.state.enemies) {
      liveEnemyIds.add(enemy.id)
      let sprite = this.enemySprites.get(enemy.id)
      const definition = enemy.kind === 'boss' ? null : enemyDefinitions[enemy.kind]
      const size = enemy.kind === 'boss' ? 176 : (definition?.size ?? 54) + (enemy.elite ? 14 : 0)
      const family = definition?.animation ?? ''
      if ((enemy.kind === 'assassin' || enemy.elite) && (enemy.telegraph ?? 0) > 0) {
        const directionX = enemy.vx || (this.state.player.x - enemy.x) / Math.max(1, Math.hypot(this.state.player.x - enemy.x, this.state.player.y - enemy.y))
        const directionY = enemy.vy || (this.state.player.y - enemy.y) / Math.max(1, Math.hypot(this.state.player.x - enemy.x, this.state.player.y - enemy.y))
        const sideX = -directionY
        const sideY = directionX
        const length = enemy.elite ? 260 : 220
        const width = enemy.elite ? 34 : 24
        const progress = 1 - (enemy.telegraph ?? 0) / (enemy.elite ? 0.9 : 0.7)
        graphics.fillStyle(enemy.elite ? 0xe3a83b : 0xd9554d, 0.1 + progress * 0.12).fillTriangle(enemy.x + sideX * width, enemy.y + sideY * width, enemy.x - sideX * width, enemy.y - sideY * width, enemy.x + directionX * length, enemy.y + directionY * length)
        for (let index = 0; index < 3; index += 1) {
          const start = 32 + index * 62
          graphics.lineStyle(index === 1 ? 6 : 3, enemy.elite ? 0xe3a83b : 0xd9554d, 0.42 + progress * 0.42).lineBetween(enemy.x + directionX * start + sideX * (index - 1) * 9, enemy.y + directionY * start + sideY * (index - 1) * 9, enemy.x + directionX * (start + 31), enemy.y + directionY * (start + 31))
        }
      }
      if (enemy.elite) {
        const facingX = enemy.facingX ?? 1
        const facingY = enemy.facingY ?? 0
        const sideX = -facingY
        const sideY = facingX
        for (let index = -1; index <= 1; index += 1) {
          const centerX = enemy.x - facingX * 29 + sideX * index * 17
          const centerY = enemy.y - facingY * 29 + sideY * index * 17 - 8
          graphics.fillStyle(index === 0 ? 0xe3a83b : 0xd9554d, 0.82).fillTriangle(centerX + facingX * 12, centerY + facingY * 12, centerX - facingX * 8 + sideX * 6, centerY - facingY * 8 + sideY * 6, centerX - facingX * 8 - sideX * 6, centerY - facingY * 8 - sideY * 6)
        }
      }
      if (!sprite) {
        sprite = enemy.kind === 'boss'
          ? this.add.sprite(enemy.x, enemy.y, 'corrupted-bamboo-giant').setOrigin(0.5, 1).setDisplaySize(size, size)
          : this.add.sprite(enemy.x, enemy.y, `${family}-move-01`).setOrigin(0.5, 1).setScale(size / 96).play(`${family}-move`)
        this.enemySprites.set(enemy.id, sprite)
      }
      const flashing = this.state.effects.some((effect) => (effect.kind === 'hit' || effect.kind === 'crit' || effect.kind === 'projectile-hit' || effect.kind === 'projectile-crit' || effect.kind === 'firecracker-hit' || effect.kind === 'firecracker-crit') && Math.abs(effect.x - enemy.x) < 24 && Math.abs(effect.y + 28 - enemy.y) < 24)
      const attacking = enemy.kind === 'chaser' ? enemy.elite ? (enemy.telegraph ?? 0) > 0 || enemy.dashTime > 0 : Math.hypot(this.state.player.x - enemy.x, this.state.player.y - enemy.y) < 42 : enemy.kind === 'dasher' || enemy.kind === 'assassin' ? enemy.dashTime > 0 || (enemy.telegraph ?? 0) > 0 : enemy.kind === 'boar' ? Math.hypot(this.state.player.x - enemy.x, this.state.player.y - enemy.y) < 48 : enemy.cooldown > (enemy.kind === 'sorcerer' ? 3.65 : 1.45)
      if (enemy.kind !== 'boss') sprite.play(`${family}-${attacking ? 'attack' : 'move'}`, true).setFlipX((enemy.facingX ?? this.state.player.x - enemy.x) < 0)
      const generatedEnemy = enemy.kind === 'boar' || enemy.kind === 'assassin' || enemy.kind === 'sorcerer'
      const actionScale = enemy.kind === 'boss' ? 1 + Math.sin(this.state.time * (enemy.enraged ? 6 : 3)) * 0.018 : generatedEnemy ? enemy.kind === 'assassin' && enemy.dashTime > 0 ? 1.06 : 1 : (enemy.kind === 'dasher' && enemy.dashTime > 0 ? 1.12 : 1) * (
        attacking ? enemy.kind === 'chaser' ? 0.9 : enemy.kind === 'dasher' ? 0.625 : 0.51 : 1
      )
      const baseScale = enemy.kind === 'boss' ? size / 512 : size / 96
      sprite.setPosition(enemy.x, enemy.y).setDepth(enemy.y).setScale(baseScale * actionScale * (flashing ? 1.04 : 1), baseScale * actionScale * (flashing ? 0.96 : 1))
      if (enemy.kind === 'boss' && enemy.phase === 2) sprite.setTint(enemy.enraged ? 0xff8c92 : 0xd9a8ff)
      else if (enemy.elite) sprite.setTint(0xffc477)
      else sprite.clearTint()
      sprite.setBlendMode(flashing ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
      if (enemy.kind !== 'boss' && enemy.hp < enemy.maxHp) {
        graphics.fillStyle(0x221715, 0.7).fillRect(enemy.x - 18, enemy.y - size - 5, 36, 4)
        graphics.fillStyle(0xd9554d, 0.9).fillRect(enemy.x - 18, enemy.y - size - 5, 36 * Math.max(0, enemy.hp / enemy.maxHp), 4)
      }
    }
    for (const [id, sprite] of this.enemySprites) if (!liveEnemyIds.has(id)) { sprite.destroy(); this.enemySprites.delete(id) }

    const { x, y, dashTime } = this.state.player
    if (dashTime > 0) graphics.fillStyle(0xd4ffb8, 0.22).fillCircle(x, y, 38)
    const shieldRatio = this.state.player.shieldMax > 0 ? this.state.player.shield / this.state.player.shieldMax : 0
    const shieldPulse = 1 + Math.sin(this.state.time * 2.3) * 0.018
    this.shieldAura.setPosition(x, y - 10).setDepth(y + 1).setVisible(shieldRatio > 0).setAlpha(0.1 + shieldRatio * 0.09 + Math.sin(this.state.time * 4) * 0.018).setDisplaySize(102 * shieldPulse, 72 * shieldPulse)
    const playerAnimation = characters[this.state.characterId].animation
    const latestAttack = this.state.attacks.at(-1)
    if (latestAttack && latestAttack.id > this.lastAttackId) {
      this.lastAttackId = latestAttack.id
      this.playerSprite.setFlipX(Math.cos(latestAttack.angle) < 0).play(`${playerAnimation}-attack`)
    }
    const latestProjectile = this.state.playerProjectiles.at(-1)
    if (latestProjectile && latestProjectile.kind !== 'bolt' && latestProjectile.id > this.lastPlayerProjectileId) {
      this.lastPlayerProjectileId = latestProjectile.id
      this.playerSprite.setFlipX(latestProjectile.vx < 0).play(`${playerAnimation}-attack`)
    }
    const playerAttacking = this.playerSprite.anims.currentAnim?.key === `${playerAnimation}-attack` && this.playerSprite.anims.isPlaying
    const moveX = Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown)
    const moveY = Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown)
    if (!playerAttacking) {
      this.playerSprite.play(`${playerAnimation}-${moveX !== 0 || moveY !== 0 || dashTime > 0 ? 'run' : 'idle'}`, true)
      this.playerSprite.setFlipX(moveX === 0 ? this.state.player.facingX < 0 : moveX < 0)
    }
    const playerHurt = this.state.player.hitCooldown > 0
    const playerScale = playerAttacking ? this.state.characterId === 'shanlan' ? 68 / 96 * 0.56 : 68 / 128 : 68 / 96
    this.playerSprite.setPosition(x, y).setDepth(y).setRotation(playerAttacking ? 0 : moveY * 0.035).setScale(playerScale * (playerHurt ? 1.06 : 1), playerScale * (playerHurt ? 0.92 : 1)).setAlpha(playerHurt ? 0.55 + Math.sin(this.state.time * 50) * 0.25 : 1)

    const healthFill = document.querySelector<HTMLElement>('#health-fill')
    const xpFill = document.querySelector<HTMLElement>('#xp-fill')
    if (healthFill) healthFill.style.width = `${(this.state.player.hp / this.state.player.maxHp) * 100}%`
    if (xpFill) xpFill.style.width = `${(this.state.player.xp / this.state.player.nextXp) * 100}%`
    const shieldRow = document.querySelector<HTMLElement>('#shield-row')
    const shieldFill = document.querySelector<HTMLElement>('#shield-fill')
    const shieldText = document.querySelector<HTMLElement>('#shield-text')
    if (shieldRow) shieldRow.hidden = this.state.characterId !== 'shimo'
    if (shieldFill) shieldFill.style.width = `${this.state.player.shieldMax > 0 ? this.state.player.shield / this.state.player.shieldMax * 100 : 0}%`
    if (shieldText) shieldText.textContent = `${Math.ceil(this.state.player.shield)} / ${this.state.player.shieldMax || Math.ceil(this.state.player.maxHp * 0.08)}`
    const values: Record<string, string> = {
      '#character-name': characters[this.state.characterId].name,
      '#health-text': `${Math.ceil(this.state.player.hp)} / ${this.state.player.maxHp}`,
      '#xp-text': `${this.state.player.xp} / ${this.state.player.nextXp}`,
      '#level': String(this.state.player.level), '#wave': String(this.state.wave),
      '#wave-time': `${String(Math.floor(Math.max(0, Math.ceil(this.state.waveDuration - this.state.waveTime)) / 60)).padStart(2, '0')}:${String(Math.max(0, Math.ceil(this.state.waveDuration - this.state.waveTime)) % 60).padStart(2, '0')}`,
      '#kills': String(this.state.kills), '#coins': String(this.state.player.coins),
    }
    for (const [selector, value] of Object.entries(values)) {
      const element = document.querySelector<HTMLElement>(selector)
      if (element) element.textContent = value
    }
    const weaponStrip = document.querySelector<HTMLElement>('#weapon-strip')
    const weaponHudMode = `${this.state.characterId}-${Object.entries(this.state.weaponLevels).join('-')}`
    if (weaponStrip && weaponHudMode !== this.weaponHudMode) {
      this.weaponHudMode = weaponHudMode
      const character = characters[this.state.characterId]
      weaponStrip.innerHTML = `<span class="weapon-slot"><img src="${import.meta.env.BASE_URL}${character.weaponImage}" alt="${character.weaponName}"><span><b>${character.weaponName} · 专属</b><small>${character.weaponDescription}</small></span></span>${weaponIds.filter((id) => (this.state.weaponLevels[id] ?? 0) > 0).map((id) => {
        const weapon = weapons[id]
        const level = this.state.weaponLevels[id] ?? 0
        let detail = `${level >= 3 ? '双段' : '单段'}快拳 · 范围 ${62 + level * 4}`
        if (id === 'firecracker-launcher') detail = `${level >= 3 ? '双弹' : '单弹'}爆破 · 范围 ${48 + level * 8}`
        if (id === 'spinning-bamboo-blade') detail = `${level >= 5 ? 3 : level >= 3 ? 2 : 1} 刃环身 · 轨道 ${58 + level * 5}`
        if (id === 'panda-wine-gourd') detail = `${level >= 3 ? '双区' : '单区'}酒焰 · 持续 ${(2.4 + level * 0.15).toFixed(1)}秒`
        if (id === 'bamboo-crossbow-turret') detail = `${level >= 5 ? 3 : level >= 3 ? 2 : 1} 台竹弩 · 自动索敌`
        return `<span class="weapon-slot"><img src="${import.meta.env.BASE_URL}${weapon.image}" alt="${weapon.name}"><span><b>${weapon.name} · Lv.${level}</b><small>${detail}</small></span></span>`
      }).join('')}`
    }
    const boss = this.state.enemies.find((enemy) => enemy.kind === 'boss')
    const bossBar = document.querySelector<HTMLElement>('#boss-bar')
    const bossFill = document.querySelector<HTMLElement>('#boss-fill')
    const bossHealth = document.querySelector<HTMLElement>('#boss-health')
    const bossPhase = document.querySelector<HTMLElement>('#boss-phase')
    const bossAnnouncement = document.querySelector<HTMLElement>('#boss-announcement')
    if (bossBar) bossBar.hidden = !boss || this.state.victory
    if (bossFill) bossFill.style.width = `${boss ? Math.max(0, boss.hp / boss.maxHp * 100) : 0}%`
    if (bossHealth) bossHealth.textContent = boss ? `${Math.ceil(boss.hp)} / ${boss.maxHp}` : ''
    if (bossPhase) bossPhase.textContent = boss?.enraged ? '狂暴' : boss?.phase === 2 ? '腐化蔓延' : '盘根守势'
    if (bossAnnouncement) {
      bossAnnouncement.hidden = this.state.bossIntroTime === 0
      bossAnnouncement.textContent = '最终波 · 腐竹巨灵苏醒'
    }
    const dash = document.querySelector<HTMLElement>('#dash')
    if (dash) {
      dash.textContent = this.state.player.dashCooldown === 0 ? '闪避就绪' : `闪避 ${this.state.player.dashCooldown.toFixed(1)}s`
      dash.classList.toggle('ready', this.state.player.dashCooldown === 0)
      dash.classList.toggle('near-player', this.state.player.x > 1400 && this.state.player.y < 180)
    }
    const hurtVignette = document.querySelector<HTMLElement>('#hurt-vignette')
    if (hurtVignette) hurtVignette.classList.toggle('active', this.state.effects.some((effect) => effect.kind === 'player-hit'))
    const buildTags = document.querySelector<HTMLElement>('#build-tags')
    if (buildTags) {
      const names = this.state.chosenUpgrades.slice(-3).map((id) => upgrades[id].name)
      buildTags.innerHTML = (names.length ? names : ['初入竹林']).map((name) => `<span>${name}</span>`).join('')
    }
    const itemIcons = document.querySelector<HTMLElement>('#item-icons')
    if (itemIcons) {
      const ownedItemIds = this.state.ownedItems.filter((id, index, ownedItems) => ownedItems.indexOf(id) === index)
      itemIcons.innerHTML = ownedItemIds.length ? ownedItemIds.map((id) => {
        const item = items[id]
        const count = this.state.ownedItems.filter((ownedId) => ownedId === id).length
        return `<div class="item-detail"><img src="${import.meta.env.BASE_URL}${item.image}" alt=""><span><b>${item.name}${count > 1 ? ` ×${count}` : ''}</b><small>${count > 1 ? '每件：' : ''}${item.description}</small></span></div>`
      }).join('') : '<small class="item-empty">尚未获得宝物</small>'
    }
    const buildPanel = document.querySelector<HTMLElement>('.build-panel')
    if (buildPanel) buildPanel.classList.toggle('near-player', this.state.player.x > 1400 && this.state.player.y > 850)

    if (this.state.gameOver || this.state.victory) {
      const overlay = document.querySelector<HTMLDivElement>('#pause-overlay')
      const title = document.querySelector<HTMLElement>('#overlay-title')
      const copy = document.querySelector<HTMLElement>('#overlay-copy')
      if (overlay) overlay.hidden = false
      if (title) title.textContent = this.state.victory ? '竹林得守' : '此战暂歇'
      if (copy) copy.textContent = this.state.victory
        ? `${characters[this.state.characterId].name} · ${Math.floor(this.state.time / 60)}分${Math.floor(this.state.time % 60)}秒 · 击破 ${this.state.kills} · Lv.${this.state.player.level} · 构筑 ${this.state.chosenUpgrades.slice(-3).map((id) => upgrades[id].name).join(' / ') || '初入竹林'} · 按 R 再战`
        : `第 ${this.state.wave} 波 · Lv.${this.state.player.level} · 击破 ${this.state.kills} · 按 R 再战`
    }
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach((button) => {
  button.addEventListener('click', () => {
    const characterId = button.dataset.character
    if (characterId !== 'shanlan' && characterId !== 'qingtuan' && characterId !== 'shimo') return
    selectedCharacter = characterId
    const character = characters[characterId]
    const characterSelect = document.querySelector<HTMLElement>('#character-select')
    const characterName = document.querySelector<HTMLElement>('#character-name')
    const healthText = document.querySelector<HTMLElement>('#health-text')
    const weaponImage = document.querySelector<HTMLImageElement>('#weapon-image')
    const weaponName = document.querySelector<HTMLElement>('#weapon-name')
    const weaponCopy = document.querySelector<HTMLElement>('#weapon-copy')
    if (characterSelect) characterSelect.hidden = true
    if (characterName) characterName.textContent = character.name
    const maxHp = characterId === 'qingtuan' ? 10 : characterId === 'shimo' ? 30 : 20
    if (healthText) healthText.textContent = `${maxHp} / ${maxHp}`
    if (weaponImage) {
      weaponImage.src = `${import.meta.env.BASE_URL}${character.weaponImage}`
      weaponImage.alt = character.weaponName
    }
    if (weaponName) weaponName.textContent = character.weaponName
    if (weaponCopy) weaponCopy.textContent = character.weaponDescription
    new Phaser.Game({
      type: Phaser.AUTO, parent: 'game', width: 960, height: 540, backgroundColor: '#173527', scene: BattleScene,
      render: { antialias: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    })
  })
})
