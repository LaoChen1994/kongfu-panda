import { buyItem, chooseUpgrade, continueWave, createGameState, enemyDefinitions, refreshShop, regularEnemyIds, sellItem, sellWeapon, stepGame, toggleShopLock, weaponIds } from './simulation.js'

// 触及下限后，任意出售顺序都必须恢复角色基础值。
for (const reverse of [false, true]) {
  const stacked = createGameState(31, 'qingtuan')
  stacked.shopOpen = true
  stacked.player.coins = 100000
  for (let count = 0; count < 20; count += 1) {
    stacked.shopChoices = ['jade-eyepatch', 'mountain-stone', 'spirit-bamboo-tube', 'tiger-seal']
    for (let slot = 0; slot < 4; slot += 1) if (!buyItem(stacked, slot)) throw new Error('叠加购买失败')
  }
  if (stacked.player.criticalChance !== 1 || stacked.player.maxHp !== 1 || stacked.player.moveSpeed !== 0.5 || stacked.player.normalDamage !== 0.5) throw new Error('极限叠加必须遵守上下限')
  while (stacked.ownedItems.length) sellItem(stacked, reverse ? stacked.ownedItems.length - 1 : 0)
  if (Number(stacked.player.maxHp) !== 10 || Math.abs(stacked.player.moveSpeed - 1.1) > 1e-8 || Math.abs(stacked.player.normalDamage - 1) > 1e-8) throw new Error('属性触底后出售不能凭空增加属性')
}
for (let seed = 1; seed <= 100; seed += 1) {
  for (const character of ['shanlan', 'qingtuan', 'shimo'] as const) {
    const candidate = createGameState(seed, character)
    candidate.weaponLevels = { 'iron-pot-gauntlets': 1, 'firecracker-launcher': 1 }
    candidate.player.xp = candidate.player.nextXp
    stepGame(candidate, { x: 0, y: 0, dash: false }, 0.01)
    if (candidate.upgradeChoices.includes(character === 'qingtuan' ? 'wide-sweep' : 'leaf-volley')) throw new Error('跨流派武器不应解锁无效专属天赋')
  }
}
for (const talentFirst of [false, true]) {
  const order = createGameState(32, 'qingtuan')
  order.shopOpen = true
  order.player.coins = 1000
  for (const action of talentFirst ? ['talent', 'item'] : ['item', 'talent']) {
    if (action === 'item') {
      order.shopChoices[0] = 'wind-feather'
      buyItem(order, 0)
    } else {
      order.pendingUpgrade = true
      order.upgradeChoices = ['leaf-volley']
      chooseUpgrade(order, 'leaf-volley')
    }
  }
  if (Math.abs(order.player.rangedDamage - 1.05 * 0.9) > 1e-8) throw new Error('远程伤害不应依赖天赋与宝物获得顺序')
  sellItem(order, 0)
  if (Math.abs(order.player.rangedDamage - 0.9) > 1e-8) throw new Error('出售风羽不能残留负伤害')
}
const previewSource = createGameState(33, 'qingtuan')
previewSource.shopOpen = true
previewSource.player.coins = 100
previewSource.shopChoices[0] = 'jade-eyepatch'
const previewCopy = structuredClone(previewSource)
buyItem(previewCopy, 0)
if (previewSource.player.maxHp !== 10 || previewSource.player.coins !== 100 || previewSource.ownedItems.length) throw new Error('预览不能修改真实状态')
buyItem(previewSource, 0)
if (JSON.stringify(previewSource.player) !== JSON.stringify(previewCopy.player)) throw new Error('预览与实际购买属性必须一致')
const cappedHaste = createGameState(34)
for (let count = 0; count < 12; count += 1) {
  cappedHaste.pendingUpgrade = true
  cappedHaste.upgradeChoices = ['wide-sweep']
  chooseUpgrade(cappedHaste, 'wide-sweep')
}
cappedHaste.shopOpen = true
cappedHaste.player.coins = 1000
for (let count = 0; count < 4; count += 1) {
  cappedHaste.shopChoices[0] = 'gale-leggings'
  buyItem(cappedHaste, 0)
}
while (cappedHaste.ownedItems.length) sellItem(cappedHaste, 0)
if (cappedHaste.player.attackSpeed !== 0.55) throw new Error('攻速触底后买卖绑腿必须恢复55%')
const mixedHealth = createGameState(35, 'qingtuan')
mixedHealth.shopOpen = true
mixedHealth.player.coins = 1000
mixedHealth.shopChoices = ['jade-eyepatch', 'jade-eyepatch', 'bamboo-dew-pill']
buyItem(mixedHealth, 0)
buyItem(mixedHealth, 1)
buyItem(mixedHealth, 2)
mixedHealth.pendingUpgrade = true
mixedHealth.upgradeChoices = ['vitality']
chooseUpgrade(mixedHealth, 'vitality')
sellItem(mixedHealth, mixedHealth.ownedItems.indexOf('bamboo-dew-pill'))
while (mixedHealth.ownedItems.length) sellItem(mixedHealth, 0)
if (mixedHealth.player.maxHp !== 15 || mixedHealth.player.hp > 15) throw new Error('混合生命加减与升级后出售应保留升级成长')
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

const shanlanStats = createGameState(2, 'shanlan')
if (shanlanStats.player.maxHp !== 20) throw new Error('山岚初始生命应为 20')
const qingtuanStats = createGameState(2, 'qingtuan')
if (qingtuanStats.player.maxHp !== 10 || qingtuanStats.player.moveSpeed !== 1.1 || qingtuanStats.player.projectileSpeed !== 516) throw new Error('青团初始属性应体现低生命远程机动定位')
const shimoStats = createGameState(2, 'shimo')
if (shimoStats.player.maxHp !== 30 || shimoStats.player.armor !== 8 || shimoStats.player.moveSpeed !== 0.9) throw new Error('石墨初始属性应体现肉盾定位')

const vitalityCheck = createGameState(23, 'qingtuan')
vitalityCheck.player.hp = 6
vitalityCheck.pendingUpgrade = true
vitalityCheck.upgradeChoices = ['vitality', 'power', 'haste']
if (!chooseUpgrade(vitalityCheck, 'vitality') || vitalityCheck.player.maxHp !== 15 || vitalityCheck.player.hp !== 11) throw new Error('竹息养生应增加 5 点最大生命并恢复 5 点生命')

const progression = createGameState(3)
progression.pendingUpgrade = true
progression.upgradeChoices = ['power', 'vitality', 'leaf-volley']
if (!chooseUpgrade(progression, 'leaf-volley') || progression.player.projectileCount !== 2) throw new Error('天赋应立即改变投射物数量')
progression.shopOpen = true
progression.player.coins = 100
progression.shopChoices = ['martial-belt', 'wind-feather', 'iron-bracer', 'panda-roller']
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
shopCheck.shopChoices = ['martial-belt', 'wind-feather', 'iron-bracer', 'panda-roller']
if (!toggleShopLock(shopCheck, 0) || !toggleShopLock(shopCheck, 1) || !refreshShop(shopCheck)) throw new Error('商城应允许独立锁定多个商品后刷新')
if (shopCheck.shopChoices[0] !== 'martial-belt' || shopCheck.shopChoices[1] !== 'wind-feather' || shopCheck.player.coins !== 96 || shopCheck.shopRefreshCost !== 6) throw new Error('刷新应保留多个锁定商品并让费用从 4 增加到 6')
if (new Set(shopCheck.shopChoices.filter(Boolean)).size !== shopCheck.shopChoices.filter(Boolean).length) throw new Error('刷新后的四件商品必须互不重复')
if (!buyItem(shopCheck, 1) || shopCheck.lockedShopIndices.includes(1) || !shopCheck.lockedShopIndices.includes(0) || shopCheck.shopChoices[1] !== null) throw new Error('购买锁定商品后只应清空对应商品槽和锁定状态')
const coinsBeforeSale = shopCheck.player.coins
const projectileSpeedBeforeSale = shopCheck.player.projectileSpeed
if (!sellItem(shopCheck, 0) || shopCheck.player.coins !== coinsBeforeSale + 22 || Math.abs(shopCheck.player.projectileSpeed - projectileSpeedBeforeSale / 1.2) > 0.0001) throw new Error('出售风羽应返还 60% 基准价并撤销属性')
shopCheck.shopChoices = ['panda-roller', 'martial-belt', 'martial-belt', 'iron-bracer']
shopCheck.ownedItems.push('panda-roller')
if (buyItem(shopCheck, 0)) throw new Error('唯一宝物已拥有时不得重复购买')
if (!buyItem(shopCheck, 1) || !buyItem(shopCheck, 2)) throw new Error('普通数值宝物应允许重复购买')

const buildItemCheck = createGameState(27, 'shimo')
buildItemCheck.shopOpen = true
buildItemCheck.player.coins = 1000
buildItemCheck.shopChoices = ['jade-eyepatch', 'mountain-stone', 'fortune-paw', 'spirit-bamboo-tube']
if (!buyItem(buildItemCheck, 0) || buildItemCheck.player.criticalChance !== 0.18 || buildItemCheck.player.maxHp !== 25) throw new Error('翡翠眼罩应提高暴击率并降低最大生命')
if (!buyItem(buildItemCheck, 1) || buildItemCheck.player.shieldPower !== 1.25 || buildItemCheck.player.moveSpeed !== 0.85) throw new Error('镇岳石应提高护盾效果并降低移动速度')
if (!buyItem(buildItemCheck, 2) || buildItemCheck.player.coinGain !== 1.12 || buildItemCheck.player.enemyPressure !== 1.05) throw new Error('招财熊爪应同时提高铜钱收益和敌潮压力')
if (!buyItem(buildItemCheck, 3) || buildItemCheck.player.pickupRange !== 182 || Math.abs(buildItemCheck.player.moveSpeed - 0.82) > 0.0001) throw new Error('聚灵竹筒应扩大拾取范围并降低移动速度')
const buildItemCoins = buildItemCheck.player.coins
if (!sellItem(buildItemCheck, buildItemCheck.ownedItems.indexOf('jade-eyepatch')) || Math.abs(buildItemCheck.player.criticalChance - 0.1) > 0.0001 || Math.abs(buildItemCheck.player.maxHp - 30) > 0.0001 || buildItemCheck.player.coins !== buildItemCoins + 22) throw new Error('出售构筑宝物应撤销对应属性并返还 60% 铜钱')

const waveHealingCheck = createGameState(28)
waveHealingCheck.shopOpen = true
waveHealingCheck.player.coins = 100
waveHealingCheck.player.hp = 1
waveHealingCheck.shopChoices[0] = 'food-god-lunchbox'
if (!buyItem(waveHealingCheck, 0) || !continueWave(waveHealingCheck) || waveHealingCheck.player.hp !== 11) throw new Error('食神饭盒应让波次开始恢复从 35% 提高到 50% 最大生命')

const tigerSealCheck = createGameState(29)
tigerSealCheck.shopOpen = true
tigerSealCheck.player.coins = 100
tigerSealCheck.shopChoices[0] = 'tiger-seal'
if (!buyItem(tigerSealCheck, 0)) throw new Error('猛虎印应可购买')
tigerSealCheck.shopOpen = false
tigerSealCheck.spawnTimer = 99
tigerSealCheck.bambooCooldown = 0
tigerSealCheck.player.criticalChance = 0
tigerSealCheck.enemies.push(
  { id: 1, kind: 'chaser', x: 850, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 },
  { id: 2, kind: 'chaser', x: 850, y: 520, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0, elite: true },
)
stepGame(tigerSealCheck, { x: 0, y: 0, dash: false }, 0.05)
if (tigerSealCheck.enemies[0].hp <= tigerSealCheck.enemies[1].hp) throw new Error('猛虎印应提高精英伤害并降低普通敌人伤害')

const allLockedShopCheck = createGameState(25)
allLockedShopCheck.shopOpen = true
allLockedShopCheck.player.coins = 100
for (let index = 0; index < 4; index += 1) toggleShopLock(allLockedShopCheck, index)
if (refreshShop(allLockedShopCheck) || allLockedShopCheck.player.coins !== 100) throw new Error('全部商品锁定时刷新不得扣除铜钱')

const uniqueLockCheck = createGameState(16)
uniqueLockCheck.shopOpen = true
uniqueLockCheck.player.coins = 1000
uniqueLockCheck.shopChoices = ['panda-roller', 'panda-roller', 'martial-belt', 'iron-bracer']
if (!toggleShopLock(uniqueLockCheck, 1) || !buyItem(uniqueLockCheck, 0)) throw new Error('应能购买未锁定的唯一宝物')
if (uniqueLockCheck.lockedShopIndices.length !== 0 || uniqueLockCheck.shopChoices.slice(0, 2).some(Boolean)) throw new Error('购买唯一宝物后应清除同名商品和无效锁定')
for (let refresh = 0; refresh < 12; refresh += 1) {
  if (!refreshShop(uniqueLockCheck)) throw new Error('应能连续刷新商品')
  const visibleChoices = uniqueLockCheck.shopChoices.filter(Boolean)
  if (new Set(visibleChoices).size !== visibleChoices.length || uniqueLockCheck.shopChoices.includes('panda-roller')) throw new Error('商城商品必须互不重复，且不得出现已拥有的唯一宝物')
}

const weaponShopCheck = createGameState(19)
weaponShopCheck.shopOpen = true
weaponShopCheck.player.coins = 1000
for (let level = 1; level <= 5; level += 1) {
  weaponShopCheck.shopChoices[0] = 'iron-pot-gauntlets'
  if (!buyItem(weaponShopCheck, 0) || weaponShopCheck.weaponLevels['iron-pot-gauntlets'] !== level) throw new Error('重复购买铁锅拳套应自动提升武器等级')
}
weaponShopCheck.shopChoices[0] = 'iron-pot-gauntlets'
if (buyItem(weaponShopCheck, 0)) throw new Error('Lv.5 武器不得继续购买')
weaponShopCheck.shopChoices[0] = 'firecracker-launcher'
if (!buyItem(weaponShopCheck, 0) || weaponShopCheck.weaponLevels['firecracker-launcher'] !== 1) throw new Error('首次购买爆竹筒应加入通用武器栏')
if (weaponIds.length !== 5) throw new Error('MVP 必须提供 5 件通用武器，与 3 件专属武器组成 8 件武器')
weaponShopCheck.shopChoices = ['spinning-bamboo-blade', 'panda-wine-gourd', 'bamboo-crossbow-turret', 'martial-belt']
if (!buyItem(weaponShopCheck, 0)) throw new Error('旋转竹刃应能加入通用武器栏')
if (buyItem(weaponShopCheck, 1)) throw new Error('拥有 3 件通用武器后不得购买第 4 件')
const coinsBeforeWeaponSale = weaponShopCheck.player.coins
if (!sellWeapon(weaponShopCheck, 'iron-pot-gauntlets') || weaponShopCheck.player.coins !== coinsBeforeWeaponSale + 66 || weaponShopCheck.weaponLevels['iron-pot-gauntlets']) throw new Error('出售 Lv.5 通用武器应返还总投入的 60% 并空出武器栏')
if (!buyItem(weaponShopCheck, 1)) throw new Error('出售通用武器后应能购买新的武器')

const gauntletCheck = createGameState(20)
gauntletCheck.spawnTimer = 99
gauntletCheck.bambooCooldown = 99
gauntletCheck.leafCooldown = 99
gauntletCheck.weaponLevels['iron-pot-gauntlets'] = 3
gauntletCheck.gauntletCooldown = 0
gauntletCheck.enemies.push({ id: 1, kind: 'chaser', x: 860, y: 500, hp: 200, maxHp: 200, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(gauntletCheck, { x: 0, y: 0, dash: false }, 0.05)
if (gauntletCheck.attacks.filter((attack) => attack.kind === 'fists').length !== 2 || gauntletCheck.enemies[0].hp >= 200) throw new Error('Lv.3 铁锅拳套应触发双段近距离拳击')

const firecrackerCheck = createGameState(21)
firecrackerCheck.spawnTimer = 99
firecrackerCheck.bambooCooldown = 99
firecrackerCheck.leafCooldown = 99
firecrackerCheck.weaponLevels['firecracker-launcher'] = 3
firecrackerCheck.firecrackerCooldown = 0
firecrackerCheck.enemies.push(
  { id: 1, kind: 'chaser', x: 900, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 },
  { id: 2, kind: 'chaser', x: 930, y: 510, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 },
)
for (let tick = 0; tick < 12 && firecrackerCheck.enemies[0].hp === 200; tick += 1) stepGame(firecrackerCheck, { x: 0, y: 0, dash: false }, 0.05)
if (firecrackerCheck.enemies.some((enemy) => enemy.hp >= 200) || !firecrackerCheck.effects.some((effect) => effect.kind === 'firecracker-blast')) throw new Error('爆竹筒命中后应对范围内敌人造成爆炸伤害')

const bladeCheck = createGameState(26)
bladeCheck.spawnTimer = 99
bladeCheck.bambooCooldown = 99
bladeCheck.leafCooldown = 99
bladeCheck.weaponLevels['spinning-bamboo-blade'] = 3
bladeCheck.orbitCooldown = 0
bladeCheck.enemies.push({ id: 1, kind: 'chaser', x: 873, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 })
stepGame(bladeCheck, { x: 0, y: 0, dash: false }, 0.05)
if (bladeCheck.enemies[0].hp >= 200 || bladeCheck.orbitCooldown <= 0) throw new Error('旋转竹刃应在可见轨道命中近身敌人')

const gourdCheck = createGameState(27)
gourdCheck.spawnTimer = 99
gourdCheck.bambooCooldown = 99
gourdCheck.leafCooldown = 99
gourdCheck.weaponLevels['panda-wine-gourd'] = 3
gourdCheck.gourdCooldown = 0
gourdCheck.enemies.push({ id: 1, kind: 'chaser', x: 900, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 })
stepGame(gourdCheck, { x: 0, y: 0, dash: false }, 0.05)
if (gourdCheck.groundZones.length !== 2 || gourdCheck.enemies[0].hp >= 200) throw new Error('Lv.3 熊猫酒葫芦应同时生成两处持续伤害酒焰')

const turretCheck = createGameState(28)
turretCheck.spawnTimer = 99
turretCheck.bambooCooldown = 99
turretCheck.leafCooldown = 99
turretCheck.weaponLevels['bamboo-crossbow-turret'] = 3
turretCheck.turretDeployCooldown = 0
turretCheck.enemies.push({ id: 1, kind: 'chaser', x: 1100, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 })
stepGame(turretCheck, { x: 0, y: 0, dash: false }, 0.05)
if (turretCheck.turrets.length !== 2 || turretCheck.playerProjectiles.filter((projectile) => projectile.kind === 'bolt').length !== 1) throw new Error('Lv.3 竹弩机关应部署两台，并由已就绪的机关自动射击')
turretCheck.shopOpen = true
const turretSaleCoins = turretCheck.player.coins
if (!sellWeapon(turretCheck, 'bamboo-crossbow-turret') || turretCheck.turrets.some(Boolean) || turretCheck.playerProjectiles.some((projectile) => projectile.kind === 'bolt') || turretCheck.player.coins !== turretSaleCoins + 86) throw new Error('出售竹弩机关应返还 60% 总投入并清理机关与弩箭')

const pausedWeaponCheck = createGameState(22)
pausedWeaponCheck.weaponLevels['iron-pot-gauntlets'] = 1
pausedWeaponCheck.gauntletCooldown = 0.2
pausedWeaponCheck.shopOpen = true
stepGame(pausedWeaponCheck, { x: 0, y: 0, dash: false }, 0.05)
if (pausedWeaponCheck.gauntletCooldown !== 0.2) throw new Error('商城打开时武器冷却必须暂停')
pausedWeaponCheck.gourdCooldown = 0.4
pausedWeaponCheck.groundZones.push({ id: 99, x: 800, y: 500, radius: 54, life: 2, duration: 2, tickCooldown: 0.2, damage: 5 })
pausedWeaponCheck.turrets.push({ id: 100, x: 840, y: 500, life: 8, cooldown: 0.3, level: 1, angle: 0 })
stepGame(pausedWeaponCheck, { x: 0, y: 0, dash: false }, 0.05)
if (pausedWeaponCheck.gourdCooldown !== 0.4 || pausedWeaponCheck.groundZones[0].life !== 2 || pausedWeaponCheck.turrets[0].life !== 8) throw new Error('商城打开时酒焰、机关和新武器冷却必须暂停')

const lockCarryCheck = createGameState(6)
lockCarryCheck.shopOpen = true
lockCarryCheck.player.hp = 50
lockCarryCheck.shopChoices = ['martial-belt', 'wind-feather', 'iron-bracer', 'panda-roller']
if (!toggleShopLock(lockCarryCheck, 0) || !toggleShopLock(lockCarryCheck, 3) || !continueWave(lockCarryCheck)) throw new Error('锁定多个商品后应能进入下一波')
if (lockCarryCheck.shopChoices[0] !== 'martial-belt' || lockCarryCheck.shopChoices[3] !== 'panda-roller' || lockCarryCheck.shopChoices.slice(1, 3).some(Boolean) || lockCarryCheck.shopRefreshCost !== 4) throw new Error('进入下一波时只应保留多个锁定商品并重置刷新费用')
lockCarryCheck.waveTime = lockCarryCheck.waveDuration
stepGame(lockCarryCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!lockCarryCheck.shopOpen || lockCarryCheck.shopChoices[0] !== 'martial-belt' || lockCarryCheck.shopChoices[3] !== 'panda-roller' || lockCarryCheck.shopChoices.some((id) => !id) || new Set(lockCarryCheck.shopChoices).size !== 4) throw new Error('下一次商城应保留多个锁定商品并以不同商品补齐空位')

const armorCheck = createGameState(5)
armorCheck.spawnTimer = 99
armorCheck.player.armor = 4
armorCheck.enemies.push({ id: 1, kind: 'chaser', x: 800, y: 500, hp: 50, maxHp: 50, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(armorCheck, { x: 0, y: 0, dash: false }, 0.05)
if (armorCheck.player.hp !== 19) throw new Error('4 点护甲应把第一波普通接触伤害从 2 降到 1')

const earlyEnemyCheck = createGameState(24)
earlyEnemyCheck.spawnTimer = 0
earlyEnemyCheck.bambooCooldown = 99
stepGame(earlyEnemyCheck, { x: 0, y: 0, dash: false }, 0.05)
const earlyEnemyHp = earlyEnemyCheck.enemies[0]?.maxHp
const lateEnemyCheck = createGameState(24)
lateEnemyCheck.wave = 7
lateEnemyCheck.spawnTimer = 0
lateEnemyCheck.bambooCooldown = 99
stepGame(lateEnemyCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!earlyEnemyHp || lateEnemyCheck.enemies[0]?.maxHp <= earlyEnemyHp * 2) throw new Error('普通敌人应从低生命起步并随波次显著成长')
lateEnemyCheck.enemies = [{ id: 99, kind: 'chaser', x: 800, y: 500, hp: 100, maxHp: 100, cooldown: 1, dashTime: 0, vx: 0, vy: 0 }]
lateEnemyCheck.player.hitCooldown = 0
const lateDamageHp = lateEnemyCheck.player.hp
stepGame(lateEnemyCheck, { x: 0, y: 0, dash: false }, 0.05)
if (lateDamageHp - lateEnemyCheck.player.hp <= 2) throw new Error('普通敌人接触伤害应随波次提升')

if (regularEnemyIds.length !== 6 || enemyDefinitions.boar.unlockWave !== 3 || enemyDefinitions.assassin.unlockWave !== 4 || enemyDefinitions.sorcerer.unlockWave !== 5) throw new Error('第一批敌人必须按第 3/4/5 波依次开放')
const budgetSpawnCheck = createGameState(29)
budgetSpawnCheck.wave = 1
budgetSpawnCheck.spawnTimer = 0
budgetSpawnCheck.threatBudget = 10
budgetSpawnCheck.bambooCooldown = 99
stepGame(budgetSpawnCheck, { x: 0, y: 0, dash: false }, 0.05)
if (budgetSpawnCheck.enemies.length !== 1 || budgetSpawnCheck.enemies[0].kind !== 'chaser' || budgetSpawnCheck.threatBudget >= 10) throw new Error('第 1 波只能按预算生成竹鼠并消耗威胁值')

const eliteSpawnCheck = createGameState(30)
eliteSpawnCheck.wave = 6
eliteSpawnCheck.waveTime = 15
eliteSpawnCheck.spawnTimer = 0
eliteSpawnCheck.threatBudget = 12
eliteSpawnCheck.bambooCooldown = 99
stepGame(eliteSpawnCheck, { x: 0, y: 0, dash: false }, 0.05)
if (eliteSpawnCheck.enemies.filter((enemy) => enemy.elite).length !== 1 || eliteSpawnCheck.eliteSpawns !== 1) throw new Error('第 6 波起应生成一只拥有额外行为的赤纹精英')
eliteSpawnCheck.spawnTimer = 0
eliteSpawnCheck.threatBudget = 12
stepGame(eliteSpawnCheck, { x: 0, y: 0, dash: false }, 0.05)
if (eliteSpawnCheck.enemies.filter((enemy) => enemy.elite).length !== 1) throw new Error('同一波最多只能生成一只精英')

const pressureCapCheck = createGameState(37)
pressureCapCheck.wave = 7
pressureCapCheck.bambooCooldown = 99
pressureCapCheck.leafCooldown = 99
pressureCapCheck.threatBudget = 500
for (let spawn = 0; spawn < 80; spawn += 1) {
  pressureCapCheck.spawnTimer = 0
  stepGame(pressureCapCheck, { x: 0, y: 0, dash: false }, 0.05)
}
if (pressureCapCheck.enemies.filter((enemy) => enemy.kind === 'dasher').length > 4 || pressureCapCheck.enemies.filter((enemy) => enemy.kind === 'boar').length > 4 || pressureCapCheck.enemies.filter((enemy) => enemy.kind === 'assassin').length > 3 || pressureCapCheck.enemies.filter((enemy) => enemy.kind === 'sorcerer').length > 2) throw new Error('高压敌人必须遵守各自的同屏上限')

const boarFrontCheck = createGameState(31)
boarFrontCheck.spawnTimer = 99
boarFrontCheck.bambooCooldown = 99
boarFrontCheck.leafCooldown = 99
boarFrontCheck.enemies.push({ id: 1, kind: 'boar', x: 900, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0, facingX: -1, facingY: 0 })
boarFrontCheck.playerProjectiles.push({ id: 2, kind: 'leaf', x: 880, y: 500, vx: 0, vy: 0, damage: 100, critical: false, blastRadius: 0 })
stepGame(boarFrontCheck, { x: 0, y: 0, dash: false }, 0.05)
if (boarFrontCheck.enemies[0].hp !== 155 || !boarFrontCheck.effects.some((effect) => effect.kind === 'armor-block')) throw new Error('甲壳野猪正面应只承受 45% 伤害并显示格挡反馈')
const boarBackCheck = createGameState(32)
boarBackCheck.spawnTimer = 99
boarBackCheck.bambooCooldown = 99
boarBackCheck.leafCooldown = 99
boarBackCheck.enemies.push({ id: 1, kind: 'boar', x: 900, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0, facingX: -1, facingY: 0 })
boarBackCheck.playerProjectiles.push({ id: 2, kind: 'leaf', x: 920, y: 500, vx: 0, vy: 0, damage: 100, critical: false, blastRadius: 0 })
stepGame(boarBackCheck, { x: 0, y: 0, dash: false }, 0.05)
if (boarBackCheck.enemies[0].hp !== 100 || boarBackCheck.effects.some((effect) => effect.kind === 'armor-block')) throw new Error('从背后攻击甲壳野猪应造成完整伤害')

const assassinCheck = createGameState(33)
assassinCheck.spawnTimer = 99
assassinCheck.bambooCooldown = 99
assassinCheck.enemies.push({ id: 1, kind: 'assassin', x: 1100, y: 500, hp: 200, maxHp: 200, cooldown: 0, dashTime: 0, vx: 0, vy: 0, telegraph: 0 })
stepGame(assassinCheck, { x: 0, y: 0, dash: false }, 0.05)
if ((assassinCheck.enemies[0].telegraph ?? 0) < 0.69 || assassinCheck.enemies[0].dashTime !== 0) throw new Error('鼬鼠刺客冲刺前必须先进入 0.7 秒预警')
for (let tick = 0; tick < 15; tick += 1) stepGame(assassinCheck, { x: 0, y: 0, dash: false }, 0.05)
if (assassinCheck.enemies[0].dashTime <= 0 || assassinCheck.enemies[0].x >= 1100) throw new Error('预警结束后鼬鼠刺客必须沿锁定方向冲刺')

const slowCheck = createGameState(34)
slowCheck.spawnTimer = 99
slowCheck.bambooCooldown = 99
slowCheck.enemyZones.push({ id: 1, x: 800, y: 500, radius: 76, life: 3, duration: 3 })
stepGame(slowCheck, { x: 1, y: 0, dash: false }, 0.05)
const slowedDistance = slowCheck.player.x - 800
slowCheck.enemyZones = []
const normalStart = slowCheck.player.x
stepGame(slowCheck, { x: 1, y: 0, dash: false }, 0.05)
if (Math.abs(slowedDistance - 6.05) > 0.01 || Math.abs(slowCheck.player.x - normalStart - 11) > 0.01) throw new Error('进入狐妖妖雾应减速 45%，离开后立即恢复')

const sorcererCheck = createGameState(36)
sorcererCheck.spawnTimer = 99
sorcererCheck.bambooCooldown = 99
sorcererCheck.enemies.push({ id: 1, kind: 'sorcerer', x: 1100, y: 500, hp: 200, maxHp: 200, cooldown: 0, dashTime: 0, vx: 0, vy: 0 })
stepGame(sorcererCheck, { x: 0, y: 0, dash: false }, 0.05)
if (sorcererCheck.enemyZones.length !== 1 || sorcererCheck.enemyZones[0].duration !== 3.2) throw new Error('狐妖术士应周期性生成持续 3.2 秒的减速妖雾')
sorcererCheck.shopOpen = true
const pausedZoneLife = sorcererCheck.enemyZones[0].life
const pausedSorcererCooldown = sorcererCheck.enemies[0].cooldown
stepGame(sorcererCheck, { x: 0, y: 0, dash: false }, 0.05)
if (sorcererCheck.enemyZones[0].life !== pausedZoneLife || sorcererCheck.enemies[0].cooldown !== pausedSorcererCooldown) throw new Error('商城或覆盖层打开时妖雾与敌人行为必须暂停')

const eliteDropCheck = createGameState(35)
eliteDropCheck.spawnTimer = 99
eliteDropCheck.bambooCooldown = 99
eliteDropCheck.enemies.push({ id: 1, kind: 'chaser', x: 1000, y: 500, hp: 0, maxHp: 300, cooldown: 99, dashTime: 0, vx: 0, vy: 0, elite: true })
stepGame(eliteDropCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!eliteDropCheck.drops.some((drop) => drop.kind === 'coin' && drop.value === 12)) throw new Error('精英击杀必须保证掉落铜钱')

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
whirlwindCheck.player.hp = 10
whirlwindCheck.enemies.push({ id: 1, kind: 'chaser', x: 875, y: 500, hp: 100, maxHp: 100, cooldown: 1, dashTime: 0, vx: 0, vy: 0 })
stepGame(whirlwindCheck, { x: 0, y: 0, dash: false }, 0.05)
if (whirlwindCheck.attacks[0]?.kind !== 'whirlwind' || whirlwindCheck.attacks[0].arc !== Math.PI / 2 || whirlwindCheck.player.hp !== 11) throw new Error('山岚第 4 次近战应触发 180° 旋风并恢复 1% 最大生命')

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
if (shieldCheck.player.shield !== 3 || shieldCheck.player.shieldMax !== 3) throw new Error('石墨每 8 秒应获得 8% 最大生命护盾')
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
const seen = new Set<string>()
for (let tick = 0; tick < 12_000; tick += 1) {
  // 波次覆盖测试免伤，不能覆写现在由构筑派生的生命上限。
  endurance.player.hitCooldown = 1
  stepGame(endurance, { x: tick % 400 < 200 ? 1 : -1, y: tick % 600 < 300 ? 1 : -1, dash: tick % 60 === 0 }, 0.05)
  for (const enemy of endurance.enemies) seen.add(enemy.kind)
  if (endurance.pendingUpgrade) chooseUpgrade(endurance, endurance.upgradeChoices[0])
  if (endurance.shopOpen) continueWave(endurance)
}
if (!regularEnemyIds.every((kind) => seen.has(kind))) throw new Error('十分钟模拟应出现当前全部普通敌人')
if (endurance.enemies.length > 100) throw new Error('敌人数量不得突破上限')
if (endurance.wave === 10 && endurance.enemies.filter((enemy) => enemy.kind !== 'boss').length > 9) throw new Error('Boss 战普通增援不得超过 9 只')
if (endurance.playerProjectiles.length + endurance.enemyProjectiles.length > 500) throw new Error('投射物疑似无限增长')
if (endurance.player.level < 2 || endurance.wave !== 10 || !seen.has('boss')) throw new Error('十分钟内应形成升级、多波与最终 Boss 循环')

console.log(`simulation ok: 600s, wave=${endurance.wave}, level=${endurance.player.level}, kills=${endurance.kills}, enemies=${endurance.enemies.length}`)
