import { buyItem, characters, chooseUpgrade, continueWave, createGameState, enemyDefinitions, getBambooWeaponCount, getShopPrice, isSignatureWeaponId, refreshShop, refreshUpgrades, regularEnemyIds, sellItem, sellWeapon, signatureWeapons, stepGame, toggleShopLock, upgrades, weaponIds } from './simulation.js'
import { parseBattleRecords } from './records.js'

// 战报只计实际损失生命；同帧多次命中和出售武器不能篡改历史输出。
const reportDamage = createGameState(77, 'qingtuan')
reportDamage.spawnTimer = 99
reportDamage.leafCooldown = 99
reportDamage.enemies = [{ id: 100, kind: 'chaser', x: 950, y: 500, hp: 7, maxHp: 7, cooldown: 99, dashTime: 0, vx: 0, vy: 0 }]
reportDamage.playerProjectiles = [
  { id: 101, kind: 'firecracker', x: 950, y: 500, vx: 0, vy: 0, damage: 100, critical: false, blastRadius: 50 },
  { id: 102, kind: 'leaf', x: 950, y: 500, vx: 0, vy: 0, damage: 100, critical: false, blastRadius: 0 },
]
stepGame(reportDamage, { x: 0, y: 0, dash: false }, 0.01)
if (reportDamage.runStats.damage['firecracker-launcher'] !== 7 || reportDamage.runStats.damage['leaf-dart'] !== 0) throw new Error('输出统计不能包含溢出或重复扣血')
reportDamage.shopOpen = true
reportDamage.weaponLevels['firecracker-launcher'] = 1
sellWeapon(reportDamage, 'firecracker-launcher')
if (reportDamage.runStats.damage['firecracker-launcher'] !== 7) throw new Error('出售武器不应丢失历史输出')

const reportInjury = createGameState(78, 'shimo')
reportInjury.spawnTimer = 99
reportInjury.bambooCooldown = 99
reportInjury.player.shield = 2
reportInjury.player.shieldTimer = 99
reportInjury.player.armor = 0
reportInjury.bossHazards = [{ id: 100, kind: 'root', x: 800, y: 500, radius: 46, life: 0, duration: 0.9, triggered: false }]
stepGame(reportInjury, { x: 0, y: 0, dash: false }, 0.01)
if (reportInjury.runStats.shieldAbsorbed !== 2 || reportInjury.runStats.injuries.root !== 10 || reportInjury.runStats.lastInjury !== 'root') throw new Error('根刺承伤应拆分护盾与生命')
reportInjury.player.hp = 1
reportInjury.player.hitCooldown = 0
reportInjury.enemyProjectiles = [{ id: 101, x: 800, y: 500, vx: 0, vy: 0 }]
stepGame(reportInjury, { x: 0, y: 0, dash: false }, 0.01)
if (!reportInjury.gameOver || reportInjury.runStats.injuries['enemy-shot'] !== 1 || String(reportInjury.runStats.lastInjury) !== 'enemy-shot') throw new Error('致命弹幕只记录剩余生命并归因')
const frozenReport = JSON.stringify(reportInjury.runStats)
stepGame(reportInjury, { x: 1, y: 0, dash: true }, 1)
if (JSON.stringify(reportInjury.runStats) !== frozenReport) throw new Error('结算后统计必须冻结')
const freshReport = createGameState(79, 'shimo')
if (freshReport.runStats.initialSeed !== 79 || Object.keys(freshReport.runStats.damage).length || Object.keys(freshReport.runStats.injuries).length || freshReport.runStats.shieldAbsorbed) throw new Error('新局必须从空战报开始')

for (const raw of [null, '{broken', 'null', '[]', '{"version":2,"characters":{}}']) {
  if (parseBattleRecords(raw).shanlan.runs !== 0) throw new Error('无效版本或存档应安全回退')
}
const savedRecords = parseBattleRecords(JSON.stringify({ version: 1, characters: {
  shanlan: { runs: 5, wins: 2, bestWave: 10, bestKills: 350, bestClearTime: 560 },
  qingtuan: { runs: 3, wins: 9, bestWave: 80, bestKills: 'bad', bestClearTime: -1 },
  shimo: null,
} }))
if (savedRecords.shanlan.runs !== 5 || savedRecords.shanlan.bestClearTime !== 560 || savedRecords.qingtuan.wins !== 3 || savedRecords.qingtuan.bestWave !== 10 || savedRecords.qingtuan.bestKills !== 0 || savedRecords.shimo.runs !== 0) throw new Error('损坏字段不得破坏其他角色成绩，数值需遵守范围')
if (JSON.stringify(parseBattleRecords(JSON.stringify({ version: 1, characters: savedRecords }))) !== JSON.stringify(savedRecords)) throw new Error('战绩存取往返必须保持数据')

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

const refreshUpgradeCheck = createGameState(230, 'shanlan')
refreshUpgradeCheck.pendingUpgrade = true
refreshUpgradeCheck.player.coins = 12
refreshUpgradeCheck.upgradeChoices = ['power', 'haste', 'vitality']
if (!refreshUpgrades(refreshUpgradeCheck) || refreshUpgradeCheck.player.coins !== 12 || !refreshUpgradeCheck.freeUpgradeRefreshUsed || refreshUpgradeCheck.runStats.upgradeRefreshes !== 1) throw new Error('每波第一次强化刷新必须免费并计入战报')
if (refreshUpgradeCheck.upgradeChoices.some((id) => ['power', 'haste', 'vitality'].includes(id))) throw new Error('刷新必须替换当前三项候选')
if (!refreshUpgrades(refreshUpgradeCheck) || Number(refreshUpgradeCheck.player.coins) !== 6 || Number(refreshUpgradeCheck.runStats.upgradeRefreshes) !== 2) throw new Error('同波后续强化刷新必须消耗 6 铜钱')
refreshUpgradeCheck.player.coins = 0
if (refreshUpgrades(refreshUpgradeCheck)) throw new Error('铜钱不足时不能继续刷新强化')

const lateRefreshCheck = createGameState(236, 'qingtuan')
for (const id of ['thorn-fur', 'panda-roll', 'battle-fury', 'iron-constitution', 'bamboo-unity'] as const) {
  lateRefreshCheck.pendingUpgrade = true
  lateRefreshCheck.upgradeChoices = [id]
  chooseUpgrade(lateRefreshCheck, id)
}
lateRefreshCheck.player.projectileCount = 3
lateRefreshCheck.pendingUpgrade = true
lateRefreshCheck.upgradeChoices = ['power', 'haste', 'vitality']
if (!refreshUpgrades(lateRefreshCheck) || lateRefreshCheck.upgradeChoices.length !== 3 || new Set(lateRefreshCheck.upgradeChoices).size !== 3) throw new Error('后期有效强化较少时刷新仍须返回三个不同候选')

const raritySeen = new Set<string>()
for (let seed = 1; seed <= 500; seed += 1) {
  const rarityCheck = createGameState(seed)
  rarityCheck.player.xp = rarityCheck.player.nextXp
  stepGame(rarityCheck, { x: 0, y: 0, dash: false }, 0.01)
  for (const id of rarityCheck.upgradeChoices) raritySeen.add(upgrades[id].rarity)
}
if (!['普通', '稀有', '史诗', '传说'].every((rarity) => raritySeen.has(rarity))) throw new Error('强化池必须能按种子生成四档稀有度')

const thornCheck = createGameState(231)
thornCheck.pendingUpgrade = true
thornCheck.upgradeChoices = ['thorn-fur']
chooseUpgrade(thornCheck, 'thorn-fur')
thornCheck.spawnTimer = 99
thornCheck.bambooCooldown = 99
thornCheck.enemies = [{ id: 1, kind: 'chaser', x: 800, y: 500, hp: 100, maxHp: 100, cooldown: 99, dashTime: 0, vx: 0, vy: 0 }]
stepGame(thornCheck, { x: 0, y: 0, dash: false }, 0.01)
if (thornCheck.runStats.damage['thorn-fur'] !== 18 || thornCheck.runStats.talentTriggers['thorn-fur'] !== 1) throw new Error('荆棘皮毛应在接触受伤时反击并记录贡献')
thornCheck.pendingUpgrade = true
thornCheck.upgradeChoices = ['power', 'haste', 'vitality']
refreshUpgrades(thornCheck)
if (thornCheck.upgradeChoices.includes('thorn-fur')) throw new Error('已经习得的唯一行为天赋不得再次出现')

const rollCheck = createGameState(232)
rollCheck.pendingUpgrade = true
rollCheck.upgradeChoices = ['panda-roll']
chooseUpgrade(rollCheck, 'panda-roll')
rollCheck.spawnTimer = 99
rollCheck.bambooCooldown = 99
rollCheck.enemies = [{ id: 1, kind: 'chaser', x: 925, y: 500, hp: 100, maxHp: 100, cooldown: 99, dashTime: 0, vx: 0, vy: 0 }]
for (let tick = 0; tick < 6; tick += 1) stepGame(rollCheck, { x: 1, y: 0, dash: tick === 0 }, 0.05)
if (rollCheck.runStats.damage['panda-roll'] !== 48 || rollCheck.runStats.talentTriggers['panda-roll'] !== 1 || rollCheck.player.dashCooldown > 2.9) throw new Error('熊猫滚滚应增加闪避冷却并在结束时震击')

const ironCheck = createGameState(233)
ironCheck.pendingUpgrade = true
ironCheck.upgradeChoices = ['iron-constitution']
chooseUpgrade(ironCheck, 'iron-constitution')
ironCheck.spawnTimer = 99
ironCheck.bambooCooldown = 99
ironCheck.player.hp = 1
ironCheck.drops = [{ id: 1, kind: 'heal', x: 800, y: 500, value: 10 }]
stepGame(ironCheck, { x: 0, y: 0, dash: false }, 0.01)
if (ironCheck.player.hp !== 10 || ironCheck.player.ironArmorTime <= 3.9 || ironCheck.runStats.talentTriggers['iron-constitution'] !== 1) throw new Error('食铁体质应降低治疗量并给予临时护甲')
ironCheck.player.hp = 20
ironCheck.player.hitCooldown = 0
ironCheck.bossHazards = [{ id: 2, kind: 'root', x: 800, y: 500, radius: 76, life: 0.005, duration: 0.005, triggered: false }]
stepGame(ironCheck, { x: 0, y: 0, dash: false }, 0.01)
if (ironCheck.player.hp !== 10) throw new Error('食铁体质触发期间必须按 +8 护甲减免伤害')

const bambooCheck = createGameState(234)
bambooCheck.pendingUpgrade = true
bambooCheck.upgradeChoices = ['bamboo-unity']
chooseUpgrade(bambooCheck, 'bamboo-unity')
if (bambooCheck.player.damage !== 1.05 || getBambooWeaponCount(bambooCheck) !== 1) throw new Error('万竹归心必须计入专属竹类武器')
bambooCheck.shopOpen = true
bambooCheck.player.coins = 100
bambooCheck.shopChoices[0] = 'spinning-bamboo-blade'
buyItem(bambooCheck, 0)
if (Number(bambooCheck.player.damage) !== 1.1 || getBambooWeaponCount(bambooCheck) !== 2) throw new Error('获得新竹类武器后万竹归心必须立即提高伤害')
sellWeapon(bambooCheck, 'spinning-bamboo-blade')
if (Number(bambooCheck.player.damage) !== 1.05 || getBambooWeaponCount(bambooCheck) !== 1) throw new Error('出售竹类武器后万竹归心必须立即回退伤害')

const furyCheck = createGameState(235)
furyCheck.pendingUpgrade = true
furyCheck.upgradeChoices = ['battle-fury']
chooseUpgrade(furyCheck, 'battle-fury')
furyCheck.waveKills = 50
furyCheck.spawnTimer = 99
furyCheck.bambooCooldown = 0
furyCheck.player.criticalChance = 0
furyCheck.enemies = [{ id: 1, kind: 'chaser', x: 860, y: 500, hp: 100, maxHp: 100, cooldown: 99, dashTime: 0, vx: 0, vy: 0 }]
stepGame(furyCheck, { x: 0, y: 0, dash: false }, 0.01)
if (furyCheck.runStats.damage['bamboo-staff'] !== 45) throw new Error('越战越勇达到 50 击破后必须提供 2% 伤害')

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

const secondItemCheck = createGameState(271, 'qingtuan')
secondItemCheck.shopOpen = true
secondItemCheck.player.coins = 1000
secondItemCheck.shopChoices = ['barbed-backplate', 'twin-bamboo', 'monk-beads', 'lucky-bell']
for (let index = 0; index < 4; index += 1) if (!buyItem(secondItemCheck, index)) throw new Error('第二批宝物应能正常购买')
if (secondItemCheck.player.reflectDamage !== 12 || secondItemCheck.player.dodgeChance !== 0) throw new Error('倒刺背甲应提供 12 点接触反伤，闪避率最低为 0%')
if (secondItemCheck.player.extraProjectiles !== 1 || secondItemCheck.player.projectileDamage !== 0.85) throw new Error('双生竹节应增加一枚投射物并降低 15% 单发伤害')
if (secondItemCheck.player.cooldownMultiplier !== 0.9 || secondItemCheck.player.basicAttackDamage !== 0.95) throw new Error('武僧念珠应缩短 10% 冷却并降低 5% 武器伤害')
if (secondItemCheck.player.luck !== 0.15 || secondItemCheck.player.shopPriceMultiplier !== 1.05 || getShopPrice(secondItemCheck, 40) !== 42) throw new Error('幸运铜铃应增加幸运并让后续商城价格上涨 5%')
secondItemCheck.shopChoices = ['twin-bamboo', 'twin-bamboo', 'martial-belt', 'wind-feather']
if (!buyItem(secondItemCheck, 0) || buyItem(secondItemCheck, 1) || Number(secondItemCheck.player.extraProjectiles) !== 2 || secondItemCheck.player.coins !== 732) throw new Error('双生竹节最多允许持有两件，幸运铜铃加价应参与实际扣款')
while (secondItemCheck.ownedItems.length) sellItem(secondItemCheck, 0)
if (Number(secondItemCheck.player.reflectDamage) !== 0 || Number(secondItemCheck.player.extraProjectiles) !== 0 || Number(secondItemCheck.player.projectileDamage) !== 1 || Number(secondItemCheck.player.cooldownMultiplier) !== 1 || Number(secondItemCheck.player.basicAttackDamage) !== 1 || Number(secondItemCheck.player.luck) !== 0 || Number(secondItemCheck.player.shopPriceMultiplier) !== 1) throw new Error('出售第二批宝物后必须恢复基础属性')

const secondItemCombatCheck = createGameState(272, 'qingtuan')
secondItemCombatCheck.shopOpen = true
secondItemCombatCheck.player.coins = 1000
secondItemCombatCheck.shopChoices = ['barbed-backplate', 'twin-bamboo', 'monk-beads', 'lucky-bell']
buyItem(secondItemCombatCheck, 0)
buyItem(secondItemCombatCheck, 1)
buyItem(secondItemCombatCheck, 2)
secondItemCombatCheck.shopOpen = false
secondItemCombatCheck.spawnTimer = 99
secondItemCombatCheck.leafCooldown = 99
secondItemCombatCheck.player.criticalChance = 0
secondItemCombatCheck.enemies = [{ id: 1, kind: 'chaser', x: 800, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 }]
stepGame(secondItemCombatCheck, { x: 0, y: 0, dash: false }, 0.01)
if (secondItemCombatCheck.enemies[0].hp !== 188 || secondItemCombatCheck.runStats.damage['barbed-backplate'] !== 12) throw new Error('倒刺背甲只应在实际接触受伤后反伤 12 点')
secondItemCombatCheck.player.hitCooldown = 99
secondItemCombatCheck.leafCooldown = 0
secondItemCombatCheck.enemies[0].x = 1100
stepGame(secondItemCombatCheck, { x: 0, y: 0, dash: false }, 0.01)
if (secondItemCombatCheck.playerProjectiles.filter((projectile) => projectile.kind === 'leaf').length !== 2 || secondItemCombatCheck.playerProjectiles[0]?.damage !== 19) throw new Error('双生竹节应让青团双发，并与念珠共同作用于单发伤害')
if (Math.abs(secondItemCombatCheck.leafCooldown - 0.792) > 1e-8) throw new Error('武僧念珠应让青团攻击冷却从 0.88 秒缩短为 0.792 秒')
secondItemCombatCheck.playerProjectiles = []
secondItemCombatCheck.leafCooldown = 99
secondItemCombatCheck.firecrackerCooldown = 0
secondItemCombatCheck.weaponLevels['firecracker-launcher'] = 1
stepGame(secondItemCombatCheck, { x: 0, y: 0, dash: false }, 0.01)
if (secondItemCombatCheck.playerProjectiles.filter((projectile) => projectile.kind === 'firecracker').length !== 2) throw new Error('双生竹节应让爆竹筒额外发射一枚爆竹')
secondItemCombatCheck.playerProjectiles = []
secondItemCombatCheck.firecrackerCooldown = 99
secondItemCombatCheck.turretDeployCooldown = 99
secondItemCombatCheck.weaponLevels['bamboo-crossbow-turret'] = 1
secondItemCombatCheck.turrets = [{ id: 2, x: 800, y: 500, life: 10, cooldown: 0, level: 1, angle: 0 }]
stepGame(secondItemCombatCheck, { x: 0, y: 0, dash: false }, 0.01)
if (secondItemCombatCheck.playerProjectiles.filter((projectile) => projectile.kind === 'bolt').length !== 2) throw new Error('双生竹节应让竹弩机关额外发射一枚弩箭')

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

const soldOutShopCheck = createGameState(251)
soldOutShopCheck.shopOpen = true
soldOutShopCheck.player.coins = 0
soldOutShopCheck.shopChoices = [null, null, null, null]
if (!refreshShop(soldOutShopCheck) || soldOutShopCheck.player.coins !== 0 || soldOutShopCheck.shopRefreshCost !== 4) throw new Error('本轮商品全部买空后应能免费补齐，且不提高正常刷新费用')
if (soldOutShopCheck.shopChoices.some((id) => id === null) || new Set(soldOutShopCheck.shopChoices).size !== 4) throw new Error('免费补齐后应恢复四件互不重复的商品')
if (refreshShop(soldOutShopCheck)) throw new Error('免费补齐后应恢复正常付费刷新限制')
soldOutShopCheck.player.coins = 1000
for (let index = 0; index < 4; index += 1) if (!buyItem(soldOutShopCheck, index)) throw new Error('补齐后的商品应能再次全部购买')
const coinsAfterSecondSellout = soldOutShopCheck.player.coins
if (!refreshShop(soldOutShopCheck) || soldOutShopCheck.player.coins !== coinsAfterSecondSellout || soldOutShopCheck.shopRefreshCost !== 4) throw new Error('每次买空四件商品后都应免费补齐')

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

for (const characterId of ['shanlan', 'qingtuan', 'shimo'] as const) {
  const signatureCheck = createGameState(36, characterId)
  const signatureId = characters[characterId].weaponId
  const evolution = signatureWeapons[signatureId].evolution
  signatureCheck.shopOpen = true
  signatureCheck.player.coins = 1000
  if (signatureCheck.signatureWeaponLevel !== 1 || signatureCheck.signatureWeaponEvolved) throw new Error('专属武器应从 Lv.1 未进化状态开始')
  for (let level = 2; level <= 5; level += 1) {
    signatureCheck.shopChoices[0] = signatureId
    if (!buyItem(signatureCheck, 0) || signatureCheck.signatureWeaponLevel !== level) throw new Error('重复购买当前角色专属武器应逐级提升')
  }
  if (signatureCheck.signatureWeaponEvolved) throw new Error('缺少指定宝物时专属武器不得进化')
  signatureCheck.shopChoices[0] = evolution.requiredItem
  if (!buyItem(signatureCheck, 0) || !signatureCheck.signatureWeaponEvolved) throw new Error('Lv.5 专属武器与指定宝物应触发进化')
  const itemIndex = signatureCheck.ownedItems.indexOf(evolution.requiredItem)
  if (!sellItem(signatureCheck, itemIndex) || !signatureCheck.signatureWeaponEvolved) throw new Error('已经觉醒的专属武器不能因出售宝物而退化')
  signatureCheck.shopChoices[0] = signatureId
  if (buyItem(signatureCheck, 0)) throw new Error('满级或已进化专属武器不能继续购买')
}

const signatureSlotCheck = createGameState(37, 'shanlan')
signatureSlotCheck.shopOpen = true
signatureSlotCheck.player.coins = 1000
signatureSlotCheck.weaponLevels = { 'iron-pot-gauntlets': 1, 'firecracker-launcher': 1, 'spinning-bamboo-blade': 1 }
signatureSlotCheck.shopChoices[0] = characters.shanlan.weaponId
if (!buyItem(signatureSlotCheck, 0) || signatureSlotCheck.signatureWeaponLevel !== 2 || Object.keys(signatureSlotCheck.weaponLevels).length !== 3) throw new Error('专属武器升级不能占用通用武器槽')
for (let refresh = 0; refresh < 40; refresh += 1) {
  refreshShop(signatureSlotCheck)
  if (signatureSlotCheck.shopChoices.some((id) => id && isSignatureWeaponId(id) && id !== characters.shanlan.weaponId)) throw new Error('商城不能出现其他角色的专属武器')
}

const dragonStaffCheck = createGameState(38, 'shanlan')
dragonStaffCheck.signatureWeaponLevel = 5
dragonStaffCheck.signatureWeaponEvolved = true
dragonStaffCheck.spawnTimer = 99
dragonStaffCheck.bambooCooldown = 0
dragonStaffCheck.enemies = [
  { id: 1, kind: 'chaser', x: 890, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 },
  { id: 2, kind: 'chaser', x: 710, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 },
]
stepGame(dragonStaffCheck, { x: 0, y: 0, dash: false }, 0.05)
if (dragonStaffCheck.attacks[0]?.kind !== 'dragon-staff' || dragonStaffCheck.enemies.some((enemy) => enemy.hp === enemy.maxHp)) throw new Error('盘龙金竹应以环形连击命中角色前后敌人')

const returningLeafCheck = createGameState(39, 'qingtuan')
returningLeafCheck.signatureWeaponLevel = 5
returningLeafCheck.signatureWeaponEvolved = true
returningLeafCheck.spawnTimer = 99
returningLeafCheck.leafCooldown = 0
returningLeafCheck.enemies = [{ id: 1, kind: 'chaser', x: 1200, y: 500, hp: 500, maxHp: 500, cooldown: 99, dashTime: 0, vx: 0, vy: 0 }]
stepGame(returningLeafCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!returningLeafCheck.playerProjectiles.every((projectile) => projectile.kind !== 'leaf' || projectile.pierces === 3)) throw new Error('万叶归宗飞叶应获得三次穿透')
for (let tick = 0; tick < 24; tick += 1) stepGame(returningLeafCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!returningLeafCheck.playerProjectiles.some((projectile) => projectile.kind === 'leaf' && projectile.returning)) throw new Error('万叶归宗飞叶到达末端后应分裂回射')

const mountainShieldCheck = createGameState(40, 'shimo')
mountainShieldCheck.signatureWeaponLevel = 5
mountainShieldCheck.signatureWeaponEvolved = true
mountainShieldCheck.spawnTimer = 99
mountainShieldCheck.bambooCooldown = 99
mountainShieldCheck.player.shield = 1
mountainShieldCheck.player.shieldTimer = 99
mountainShieldCheck.enemies = [{ id: 1, kind: 'chaser', x: 800, y: 500, hp: 200, maxHp: 200, cooldown: 99, dashTime: 0, vx: 0, vy: 0 }]
stepGame(mountainShieldCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!mountainShieldCheck.groundZones.some((zone) => zone.kind === 'mountain') || mountainShieldCheck.runStats.damage['iron-bamboo-shield']! <= 24) throw new Error('不动熊山破盾后应生成持续震地波并计入铁竹盾输出')

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
for (let tick = 0; tick < 16; tick += 1) stepGame(turretCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!(turretCheck.runStats.damage['bamboo-crossbow-turret']! > 0)) throw new Error('机关弩箭应计入机关输出')
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
pausedWeaponCheck.groundZones.push({ id: 99, kind: 'wine', x: 800, y: 500, radius: 54, life: 2, duration: 2, tickCooldown: 0.2, damage: 5 })
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
for (let tick = 0; tick < 16; tick += 1) stepGame(splitCheck, { x: 0, y: 0, dash: false }, 0.05)
if (!(splitCheck.runStats.damage['leaf-dart']! > 0)) throw new Error('分裂飞叶应归入专属武器输出')

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
if (shieldCheck.runStats.shieldAbsorbed !== 1 || Object.keys(shieldCheck.runStats.injuries).length || shieldCheck.runStats.damage['iron-bamboo-shield'] !== 24) throw new Error('完全吸收不能算生命损失，反击应归入铁竹盾')

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
if (victoryCheck.kills !== 1) throw new Error('最终 Boss 应计入结算击破数')
const victoryStats = JSON.stringify(victoryCheck.runStats)
stepGame(victoryCheck, { x: 1, y: 1, dash: true }, 1)
if (JSON.stringify(victoryCheck.runStats) !== victoryStats) throw new Error('胜利后伤害统计不能继续增长')
for (const [state, id] of [[sweepCheck, 'bamboo-staff'], [whirlwindCheck, 'bamboo-staff'], [shieldAttackCheck, 'iron-bamboo-shield'], [gauntletCheck, 'iron-pot-gauntlets'], [firecrackerCheck, 'firecracker-launcher'], [bladeCheck, 'spinning-bamboo-blade'], [gourdCheck, 'panda-wine-gourd']] as const) {
  const actualLoss = state.enemies.reduce((sum, enemy) => sum + enemy.maxHp - Math.max(0, enemy.hp), 0)
  if (state.runStats.damage[id] !== actualLoss) throw new Error(`${id} 的战报输出必须等于敌人实际生命损失`)
}

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
