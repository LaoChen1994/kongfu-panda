import Phaser from 'phaser'
import './style.css'
import { createGameState, stepGame } from './simulation.js'

class BattleScene extends Phaser.Scene {
  private state = createGameState()
  private worldGraphics!: Phaser.GameObjects.Graphics
  private actorGraphics!: Phaser.GameObjects.Graphics
  private playerSprite!: Phaser.GameObjects.Image
  private enemySprites = new Map<number, Phaser.GameObjects.Image>()
  private leafSprites = new Map<number, Phaser.GameObjects.Image>()
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>
  private paused = false
  private dashQueued = false

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
    this.worldGraphics = this.add.graphics()
    this.worldGraphics.lineStyle(1, 0xf3e6c8, 0.08)
    for (let x = 0; x <= 1600; x += 80) this.worldGraphics.lineBetween(x, 0, x, 1000)
    for (let y = 0; y <= 1000; y += 80) this.worldGraphics.lineBetween(0, y, 1600, y)
    this.worldGraphics.lineStyle(8, 0x513d22, 0.7).strokeRect(5, 5, 1590, 990)
    this.actorGraphics = this.add.graphics().setDepth(3000)
    this.playerSprite = this.add.image(this.state.player.x, this.state.player.y, 'panda-wanderer').setOrigin(0.5, 1).setDisplaySize(68, 68)
    this.cameras.main.setBounds(0, 0, 1600, 1000)

    const keyboard = this.input.keyboard
    if (!keyboard) throw new Error('浏览器不支持键盘输入')
    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return
      if (event.code === 'Space' || event.code === 'Escape' || event.code === 'KeyR') event.preventDefault()
      if (event.code === 'Space') this.dashQueued = true
      if (event.code === 'Escape' && !this.state.gameOver) {
        this.paused = !this.paused
        const overlay = document.querySelector<HTMLDivElement>('#pause-overlay')
        const title = document.querySelector<HTMLElement>('#overlay-title')
        const copy = document.querySelector<HTMLElement>('#overlay-copy')
        if (overlay) overlay.hidden = !this.paused
        if (title) title.textContent = '竹息凝神'
        if (copy) copy.textContent = '按 ESC 继续战斗'
      }
      if (event.code === 'KeyR' && this.state.gameOver) {
        this.state = createGameState()
        this.paused = false
        const overlay = document.querySelector<HTMLDivElement>('#pause-overlay')
        if (overlay) overlay.hidden = true
      }
    })
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

    this.cameras.main.centerOn(this.state.player.x, this.state.player.y)
    const graphics = this.actorGraphics.clear()
    for (const attack of this.state.attacks) {
      graphics.lineStyle(10, 0xf0c96a, attack.life / 0.16).strokeCircle(attack.x, attack.y, 74)
    }
    const liveLeafIds = new Set<number>()
    for (const projectile of this.state.playerProjectiles) {
      liveLeafIds.add(projectile.id)
      let sprite = this.leafSprites.get(projectile.id)
      if (!sprite) {
        sprite = this.add.image(projectile.x, projectile.y, 'leaf-dart').setDisplaySize(22, 22)
        this.leafSprites.set(projectile.id, sprite)
      }
      sprite.setPosition(projectile.x, projectile.y).setRotation(Math.atan2(projectile.vy, projectile.vx) + Math.PI / 4).setDepth(projectile.y + 5)
    }
    for (const [id, sprite] of this.leafSprites) {
      if (!liveLeafIds.has(id)) {
        sprite.destroy()
        this.leafSprites.delete(id)
      }
    }
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
      const displaySize = enemy.kind === 'dasher' && enemy.dashTime > 0 ? size * 1.12 : size
      sprite.setPosition(enemy.x, enemy.y).setDepth(enemy.y).setDisplaySize(displaySize, displaySize)
    }
    for (const [id, sprite] of this.enemySprites) {
      if (!liveEnemyIds.has(id)) {
        sprite.destroy()
        this.enemySprites.delete(id)
      }
    }

    const { x, y, dashTime } = this.state.player
    if (dashTime > 0) graphics.fillStyle(0xd4ffb8, 0.22).fillCircle(x, y, 38)
    this.playerSprite.setPosition(x, y).setDepth(y)

    const healthFill = document.querySelector<HTMLElement>('#health-fill')
    const healthText = document.querySelector<HTMLElement>('#health-text')
    const time = document.querySelector<HTMLElement>('#time')
    const kills = document.querySelector<HTMLElement>('#kills')
    const enemies = document.querySelector<HTMLElement>('#enemies')
    const dash = document.querySelector<HTMLElement>('#dash')
    if (healthFill) healthFill.style.width = `${(this.state.player.hp / this.state.player.maxHp) * 100}%`
    if (healthText) healthText.textContent = `${Math.ceil(this.state.player.hp)} / ${this.state.player.maxHp}`
    if (time) time.textContent = `${String(Math.floor(this.state.time / 60)).padStart(2, '0')}:${String(Math.floor(this.state.time % 60)).padStart(2, '0')}`
    if (kills) kills.textContent = String(this.state.kills)
    if (enemies) enemies.textContent = String(this.state.enemies.length)
    if (dash) {
      dash.textContent = this.state.player.dashCooldown === 0 ? '闪避就绪' : `闪避 ${this.state.player.dashCooldown.toFixed(1)}s`
      dash.classList.toggle('ready', this.state.player.dashCooldown === 0)
    }

    if (this.state.gameOver) {
      const overlay = document.querySelector<HTMLDivElement>('#pause-overlay')
      const title = document.querySelector<HTMLElement>('#overlay-title')
      const copy = document.querySelector<HTMLElement>('#overlay-copy')
      if (overlay) overlay.hidden = false
      if (title) title.textContent = '此战暂歇'
      if (copy) copy.textContent = `坚持 ${Math.floor(this.state.time)} 秒 · 击破 ${this.state.kills} · 按 R 再战`
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#173527',
  scene: BattleScene,
  render: { antialias: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
})
