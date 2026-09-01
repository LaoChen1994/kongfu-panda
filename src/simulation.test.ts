import { buyItem, chooseUpgrade, continueWave, createGameState, stepGame } from './simulation.js'

const movement = createGameState(1)
stepGame(movement, { x: 1, y: 0, dash: false }, 0.05)
if (movement.player.x <= 800) throw new Error('玩家应当向右移动')

const normalX = movement.player.x
stepGame(movement, { x: 0, y: 0, dash: true }, 0.05)
if (movement.player.x - normalX < 20 || movement.player.dashCooldown <= 0) throw new Error('闪避应当加速并进入冷却')
movement.spawnTimer = 99
for (let tick = 0; tick < 100; tick += 1) stepGame(movement, { x: 1, y: 0, dash: false }, 0.05)
if (movement.player.x !== 1580) throw new Error('玩家移动不得越过战场边界')

const progression = createGameState(3)
progression.pendingUpgrade = true
progression.upgradeChoices = ['power', 'vitality', 'leaf-volley']
if (!chooseUpgrade(progression, 'leaf-volley') || progression.player.projectileCount !== 2) throw new Error('天赋应立即改变投射物数量')
progression.shopOpen = true
progression.player.coins = 100
progression.enemies.push({ id: 99, kind: 'chaser', x: 100, y: 100, hp: 20, maxHp: 20, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
if (!buyItem(progression, 'iron-bracer') || progression.player.armor !== 4) throw new Error('道具购买应立即改变属性')
progression.purchasedShopItems = []
const rangedBeforeBelt = progression.player.rangedDamage
if (!buyItem(progression, 'martial-belt') || Math.abs(progression.player.meleeDamage - 1.15) > 0.0001 || progression.player.rangedDamage !== rangedBeforeBelt) throw new Error('武道腰带只能强化近战伤害')
if (!continueWave(progression) || progression.wave !== 2) throw new Error('补给后应进入下一波')
if (progression.enemies.length !== 0) throw new Error('新波次不得保留上一波敌人')

const armorCheck = createGameState(5)
armorCheck.spawnTimer = 99
armorCheck.player.armor = 4
armorCheck.enemies.push({ id: 1, kind: 'chaser', x: 800, y: 500, hp: 50, maxHp: 50, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(armorCheck, { x: 0, y: 0, dash: false }, 0.05)
if (armorCheck.player.hp !== 108) throw new Error('4 点护甲应把普通接触伤害从 3 降到 2')

const sweepCheck = createGameState(9)
sweepCheck.spawnTimer = 99
sweepCheck.bambooCooldown = 0
sweepCheck.leafCooldown = 99
sweepCheck.enemies.push(
  { id: 1, kind: 'chaser', x: 875, y: 500, hp: 100, maxHp: 100, cooldown: 1, dashTime: 0, vx: 0, vy: 0 },
  { id: 2, kind: 'chaser', x: 725, y: 500, hp: 100, maxHp: 100, cooldown: 1, dashTime: 0, vx: 0, vy: 0 },
)
stepGame(sweepCheck, { x: 0, y: 0, dash: false }, 0.05)
if (sweepCheck.enemies[0].hp >= 100 || sweepCheck.enemies[0].x <= 875) throw new Error('竹杖应命中并击退朝向内的敌人')
if (sweepCheck.enemies[1].hp !== 100) throw new Error('竹杖扇形不得命中角色背后的敌人')
if (sweepCheck.attacks.length !== 1 || Math.abs(sweepCheck.attacks[0].angle) > 0.1 || sweepCheck.attacks[0].radius !== sweepCheck.player.meleeRange + 24) throw new Error('横扫表现必须记录真实方向和命中半径')

const defeatCheck = createGameState(11)
defeatCheck.spawnTimer = 99
defeatCheck.player.hp = 1
defeatCheck.bambooCooldown = 99
defeatCheck.leafCooldown = 99
defeatCheck.enemies.push({ id: 1, kind: 'chaser', x: 800, y: 500, hp: 50, maxHp: 50, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(defeatCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!defeatCheck.gameOver || defeatCheck.player.hp !== 0) throw new Error('生命归零时应进入失败状态')

const endurance = createGameState(7)
endurance.player.hp = 1_000_000
endurance.player.maxHp = 1_000_000
const seen = new Set<string>()
for (let tick = 0; tick < 12_000; tick += 1) {
  stepGame(endurance, { x: tick % 400 < 200 ? 1 : -1, y: tick % 600 < 300 ? 1 : -1, dash: tick % 60 === 0 }, 0.05)
  for (const enemy of endurance.enemies) seen.add(enemy.kind)
  if (endurance.pendingUpgrade) chooseUpgrade(endurance, endurance.upgradeChoices[0])
  if (endurance.shopOpen) continueWave(endurance)
}
if (seen.size !== 3) throw new Error('十分钟模拟应出现三类敌人')
if (endurance.enemies.length > 100) throw new Error('敌人数量不得突破上限')
if (endurance.playerProjectiles.length + endurance.enemyProjectiles.length > 500) throw new Error('投射物疑似无限增长')
if (endurance.player.level < 2 || endurance.wave < 6) throw new Error('十分钟内应形成升级与多波循环')

console.log(`simulation ok: 600s, wave=${endurance.wave}, level=${endurance.player.level}, kills=${endurance.kills}, enemies=${endurance.enemies.length}`)
