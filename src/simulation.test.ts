import { buyItem, chooseUpgrade, continueWave, createGameState, refreshShop, sellItem, stepGame, toggleShopLock } from './simulation.js'

const movement = createGameState(1)
stepGame(movement, { x: 1, y: 0, dash: false }, 0.05)
if (movement.player.x <= 800) throw new Error('玩家应当向右移动')

const normalX = movement.player.x
stepGame(movement, { x: 0, y: 0, dash: true }, 0.05)
if (movement.player.x - normalX < 20 || movement.player.dashCooldown <= 0) throw new Error('闪避应当加速并进入冷却')
movement.spawnTimer = 99
for (let tick = 0; tick < 100; tick += 1) stepGame(movement, { x: 1, y: 0, dash: false }, 0.05)
if (movement.player.x !== 1550) throw new Error('玩家移动不得越过战场安全边界')
for (let tick = 0; tick < 100; tick += 1) stepGame(movement, { x: 0, y: -1, dash: false }, 0.05)
if (movement.player.y !== 75) throw new Error('玩家顶部边界必须保留完整精灵空间')

const qingtuanStats = createGameState(2, 'qingtuan')
if (qingtuanStats.player.maxHp !== 85 || qingtuanStats.player.moveSpeed !== 1.1 || qingtuanStats.player.projectileSpeed !== 516) throw new Error('青团初始属性应体现远程机动定位')
const shimoStats = createGameState(2, 'shimo')
if (shimoStats.player.maxHp !== 140 || shimoStats.player.armor !== 8 || shimoStats.player.moveSpeed !== 0.9) throw new Error('石墨初始属性应体现肉盾定位')

const progression = createGameState(3)
progression.pendingUpgrade = true
progression.upgradeChoices = ['power', 'vitality', 'leaf-volley']
if (!chooseUpgrade(progression, 'leaf-volley') || progression.player.projectileCount !== 2) throw new Error('天赋应立即改变投射物数量')
progression.shopOpen = true
progression.player.coins = 100
progression.enemies.push({ id: 99, kind: 'chaser', x: 100, y: 100, hp: 20, maxHp: 20, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
if (!buyItem(progression, 2) || progression.player.armor !== 4) throw new Error('道具购买应立即改变属性')
const rangedBeforeBelt = progression.player.rangedDamage
const meleeBeforeBelt = progression.player.meleeDamage
if (!buyItem(progression, 0) || Math.abs(progression.player.meleeDamage - meleeBeforeBelt - 0.1) > 0.0001 || progression.player.rangedDamage !== rangedBeforeBelt) throw new Error('武道腰带只能强化近战伤害')
if (!continueWave(progression) || progression.wave !== 2) throw new Error('补给后应进入下一波')
if (progression.enemies.length !== 0) throw new Error('新波次不得保留上一波敌人')

const shopCheck = createGameState(4)
shopCheck.shopOpen = true
shopCheck.player.coins = 100
if (!toggleShopLock(shopCheck, 1) || !refreshShop(shopCheck)) throw new Error('商城应允许锁定商品后刷新')
if (shopCheck.shopChoices[1] !== 'wind-feather' || shopCheck.player.coins !== 96 || shopCheck.shopRefreshCost !== 6) throw new Error('刷新应保留锁定商品并让费用从 4 增加到 6')
if (!buyItem(shopCheck, 1) || shopCheck.lockedShopIndex !== null || shopCheck.shopChoices[1] !== null) throw new Error('购买锁定商品后应清空商品槽和锁定状态')
const coinsBeforeSale = shopCheck.player.coins
const projectileSpeedBeforeSale = shopCheck.player.projectileSpeed
if (!sellItem(shopCheck, 0) || shopCheck.player.coins !== coinsBeforeSale + 22 || Math.abs(shopCheck.player.projectileSpeed - projectileSpeedBeforeSale / 1.2) > 0.0001) throw new Error('出售风羽应返还 60% 基准价并撤销属性')
shopCheck.shopChoices = ['panda-roller', 'martial-belt', 'martial-belt', 'iron-bracer']
shopCheck.ownedItems.push('panda-roller')
if (buyItem(shopCheck, 0)) throw new Error('唯一宝物已拥有时不得重复购买')
if (!buyItem(shopCheck, 1) || !buyItem(shopCheck, 2)) throw new Error('普通数值宝物应允许重复购买')

const uniqueLockCheck = createGameState(16)
uniqueLockCheck.shopOpen = true
uniqueLockCheck.player.coins = 1000
uniqueLockCheck.shopChoices = ['panda-roller', 'panda-roller', 'martial-belt', 'iron-bracer']
if (!toggleShopLock(uniqueLockCheck, 1) || !buyItem(uniqueLockCheck, 0)) throw new Error('应能购买未锁定的唯一宝物')
if (uniqueLockCheck.lockedShopIndex !== null || uniqueLockCheck.shopChoices.slice(0, 2).some(Boolean)) throw new Error('购买唯一宝物后应清除同名商品和无效锁定')
for (let refresh = 0; refresh < 12; refresh += 1) {
  if (!refreshShop(uniqueLockCheck)) throw new Error('应能连续刷新商品')
  const counts = uniqueLockCheck.shopChoices.map((id) => uniqueLockCheck.shopChoices.filter((choice) => choice === id).length)
  if (Math.max(...counts) > 2 || new Set(uniqueLockCheck.shopChoices).size < 3 || uniqueLockCheck.shopChoices.includes('panda-roller')) throw new Error('商城应至少提供三种商品，且不得出现已拥有的唯一宝物')
}

const lockCarryCheck = createGameState(6)
lockCarryCheck.shopOpen = true
lockCarryCheck.player.hp = 50
if (!toggleShopLock(lockCarryCheck, 3) || !continueWave(lockCarryCheck)) throw new Error('锁定商品后应能进入下一波')
if (lockCarryCheck.shopChoices[3] !== 'panda-roller' || lockCarryCheck.shopChoices.slice(0, 3).some(Boolean) || lockCarryCheck.shopRefreshCost !== 4) throw new Error('进入下一波时只应保留锁定商品并重置刷新费用')
lockCarryCheck.waveTime = lockCarryCheck.waveDuration
stepGame(lockCarryCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!lockCarryCheck.shopOpen || lockCarryCheck.shopChoices[3] !== 'panda-roller' || lockCarryCheck.shopChoices.slice(0, 3).some((id) => !id)) throw new Error('下一次商城应保留锁定商品并补齐其他商品')

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
if (sweepCheck.attacks.length !== 1 || sweepCheck.attacks[0].id <= 0 || Math.abs(sweepCheck.attacks[0].angle) > 0.1 || sweepCheck.attacks[0].radius !== sweepCheck.player.meleeRange + 24) throw new Error('横扫表现必须记录独立攻击、真实方向和命中半径')

const whirlwindCheck = createGameState(10, 'shanlan')
whirlwindCheck.spawnTimer = 99
whirlwindCheck.bambooCooldown = 0
whirlwindCheck.characterAttackCount = 3
whirlwindCheck.player.hp = 100
whirlwindCheck.enemies.push({ id: 1, kind: 'chaser', x: 875, y: 500, hp: 100, maxHp: 100, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(whirlwindCheck, { x: 0, y: 0, dash: false }, 0.05)
if (whirlwindCheck.attacks[0]?.kind !== 'whirlwind' || whirlwindCheck.attacks[0].arc !== Math.PI / 2 || whirlwindCheck.player.hp !== 102) throw new Error('山岚第 4 次近战应触发 180° 旋风并恢复 1% 最大生命')

const splitCheck = createGameState(12, 'qingtuan')
splitCheck.spawnTimer = 99
splitCheck.leafCooldown = 0
splitCheck.characterAttackCount = 5
splitCheck.enemies.push({ id: 1, kind: 'chaser', x: 1100, y: 500, hp: 100, maxHp: 100, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(splitCheck, { x: 0, y: 0, dash: false }, 0.05)
if (splitCheck.playerProjectiles.length !== 3 || splitCheck.playerProjectiles.some((projectile) => projectile.damage !== 11)) throw new Error('青团第 6 次射击应分裂为 3 枚 45% 伤害飞叶')

const shieldCheck = createGameState(13, 'shimo')
shieldCheck.spawnTimer = 99
shieldCheck.bambooCooldown = 99
shieldCheck.player.shieldTimer = 0.01
stepGame(shieldCheck, { x: 0, y: 0, dash: false }, 0.05)
if (shieldCheck.player.shield !== 12 || shieldCheck.player.shieldMax !== 12) throw new Error('石墨每 8 秒应获得 8% 最大生命护盾')
shieldCheck.player.shield = 1
shieldCheck.enemies.push({ id: 1, kind: 'chaser', x: 800, y: 500, hp: 50, maxHp: 50, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(shieldCheck, { x: 0, y: 0, dash: false }, 0.05)
if (shieldCheck.player.shield !== 0 || !shieldCheck.effects.some((effect) => effect.kind === 'shield-break') || shieldCheck.enemies[0].hp !== 26) throw new Error('石墨护盾破裂时应吸收伤害并反击周围敌人')

const shieldAttackCheck = createGameState(14, 'shimo')
shieldAttackCheck.spawnTimer = 99
shieldAttackCheck.bambooCooldown = 0
shieldAttackCheck.enemies.push({ id: 1, kind: 'chaser', x: 880, y: 500, hp: 100, maxHp: 100, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(shieldAttackCheck, { x: 0, y: 0, dash: false }, 0.05)
if (shieldAttackCheck.attacks[0]?.kind !== 'shield' || shieldAttackCheck.attacks[0].arc !== Math.PI / 5 || shieldAttackCheck.attacks[0].radius !== 90 || shieldAttackCheck.enemies[0].x < 908) throw new Error('铁竹盾应使用短距窄扇形并产生强击退')

const enemyShotCheck = createGameState(15)
enemyShotCheck.spawnTimer = 99
enemyShotCheck.bambooCooldown = 99
enemyShotCheck.enemies.push({ id: 1, kind: 'shooter', x: 1050, y: 500, hp: 100, maxHp: 100, cooldown: 0, dashTime: 0, vx: 0, vy: 0 })
stepGame(enemyShotCheck, { x: 0, y: 0, dash: false }, 0.05)
if (enemyShotCheck.enemyProjectiles.length !== 1 || !enemyShotCheck.effects.some((effect) => effect.kind === 'enemy-shot' && effect.id === -enemyShotCheck.enemyProjectiles[0].id) || enemyShotCheck.nextId !== 2) throw new Error('远程敌人发射反馈不得额外占用实体 ID')

const defeatCheck = createGameState(11)
defeatCheck.spawnTimer = 99
defeatCheck.player.hp = 1
defeatCheck.bambooCooldown = 99
defeatCheck.leafCooldown = 99
defeatCheck.enemies.push({ id: 1, kind: 'chaser', x: 800, y: 500, hp: 50, maxHp: 50, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(defeatCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!defeatCheck.gameOver || defeatCheck.player.hp !== 0) throw new Error('生命归零时应进入失败状态')

const bossCheck = createGameState(17, 'shimo')
bossCheck.wave = 9
bossCheck.shopOpen = true
if (!continueWave(bossCheck) || bossCheck.wave !== 10 || bossCheck.waveDuration !== 90) throw new Error('第 9 波补给后应进入 90 秒最终 Boss 波')
const boss = bossCheck.enemies.find((enemy) => enemy.kind === 'boss')
if (!boss || boss.hp !== 2400 || bossCheck.bossIntroTime <= 0 || boss.x !== 760 || boss.y !== 600 || bossCheck.player.x !== 1100 || bossCheck.player.y !== 600) throw new Error('最终波应在同一镜头内安排玩家与腐竹巨灵的出场站位')
bossCheck.bambooCooldown = 99
bossCheck.leafCooldown = 99
bossCheck.bossIntroTime = 0
boss.cooldown = 0
const hpBeforeRoot = bossCheck.player.hp
bossCheck.player.shield = 1
stepGame(bossCheck, { x: 0, y: 0, dash: false }, 0.05)
if (bossCheck.bossHazards.length !== 3 || bossCheck.bossHazards.some((hazard) => hazard.kind !== 'root' || hazard.duration !== 0.9)) throw new Error('Boss 首招应生成三处 0.9 秒根刺预警')
for (let tick = 0; tick < 19; tick += 1) stepGame(bossCheck, { x: 0, y: 0, dash: false }, 0.05)
if (bossCheck.player.hp >= hpBeforeRoot || !bossCheck.effects.some((effect) => effect.kind === 'shield-break')) throw new Error('玩家停留在根刺预警内时应受伤，石墨护盾被击破时应触发反击')
boss.hp = 1200
stepGame(bossCheck, { x: 0, y: 0, dash: false }, 0.05)
if (boss.phase !== 2 || bossCheck.corruptionInset !== 90) throw new Error('Boss 半血后应进入二阶段并收缩安全边界')
bossCheck.waveTime = 90
stepGame(bossCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!boss.enraged || bossCheck.shopOpen) throw new Error('Boss 波超时应进入狂暴而不是开启商城')

const victoryCheck = createGameState(18)
victoryCheck.wave = 9
victoryCheck.shopOpen = true
continueWave(victoryCheck)
const finalBoss = victoryCheck.enemies.find((enemy) => enemy.kind === 'boss')
if (!finalBoss) throw new Error('胜利测试缺少最终 Boss')
victoryCheck.bossIntroTime = 0
victoryCheck.player.x = finalBoss.x
victoryCheck.player.y = finalBoss.y + 70
victoryCheck.bambooCooldown = 0
finalBoss.cooldown = 99
finalBoss.hp = 1
stepGame(victoryCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!victoryCheck.victory || victoryCheck.gameOver || victoryCheck.enemies.some((enemy) => enemy.kind === 'boss')) throw new Error('击败最终 Boss 后应进入胜利结算并移除 Boss')

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
if (!['chaser', 'dasher', 'shooter'].every((kind) => seen.has(kind))) throw new Error('十分钟模拟应出现三类普通敌人')
if (endurance.enemies.length > 100) throw new Error('敌人数量不得突破上限')
if (endurance.wave === 10 && endurance.enemies.filter((enemy) => enemy.kind !== 'boss').length > 9) throw new Error('Boss 战普通增援不得超过 9 只')
if (endurance.playerProjectiles.length + endurance.enemyProjectiles.length > 500) throw new Error('投射物疑似无限增长')
if (endurance.player.level < 2 || endurance.wave !== 10 || !seen.has('boss')) throw new Error('十分钟内应形成升级、多波与最终 Boss 循环')

console.log(`simulation ok: 600s, wave=${endurance.wave}, level=${endurance.player.level}, kills=${endurance.kills}, enemies=${endurance.enemies.length}`)
