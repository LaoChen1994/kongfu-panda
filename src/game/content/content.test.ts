import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { buyItem, createGameState, refreshShop, sellItem } from '../../simulation.js'
import { english } from '../../translations.js'
import { characters, type CharacterId } from './characters.js'
import { enemyDefinitions, injurySources, regularEnemyIds } from './enemies.js'
import { items, type ItemId } from './items.js'
import { upgrades } from './upgrades.js'
import { signatureWeapons, weaponIds, weapons } from './weapons.js'

const characterIds: CharacterId[] = ['shanlan', 'qingtuan', 'shimo']
const itemIds: ItemId[] = [
  'martial-belt', 'wind-feather', 'iron-bracer', 'panda-roller', 'bamboo-dew-pill',
  'food-god-lunchbox', 'jade-eyepatch', 'gale-leggings', 'mountain-stone', 'fortune-paw',
  'spirit-bamboo-tube', 'tiger-seal', 'barbed-backplate', 'twin-bamboo', 'monk-beads',
  'lucky-bell', 'tumbler-charm', 'chain-copper-clasp', 'guild-token', 'wine-immortal-gourd',
  'army-breaker-token', 'thunder-drum', 'bamboo-totem', 'taiji-jade',
]
const sharedBaseStats = {
  damage: 1, attackSpeed: 1, projectileCount: 1, extraProjectiles: 0, projectileDamage: 1,
  rangedDamage: 1, criticalChance: 0.1, criticalDamage: 1.75, dodgeChance: 0, reflectDamage: 0,
  cooldownMultiplier: 1, basicAttackDamage: 1, luck: 0, shopPriceMultiplier: 1,
  pickupRange: 140, coinGain: 1, enemyPressure: 1, normalDamage: 1, eliteDamage: 1,
  shieldPower: 1, waveHealing: 0,
}
const expectedBaseStats = {
  shanlan: { ...sharedBaseStats, maxHp: 20, meleeDamage: 1.15, armor: 0, moveSpeed: 1, meleeRange: 74, projectileSpeed: 430 },
  qingtuan: { ...sharedBaseStats, maxHp: 10, meleeDamage: 0.8, armor: 0, moveSpeed: 1.1, meleeRange: 82, projectileSpeed: 516 },
  shimo: { ...sharedBaseStats, maxHp: 30, meleeDamage: 1, armor: 8, moveSpeed: 0.9, meleeRange: 82, projectileSpeed: 430 },
}

test('内容数量与稳定 ID 顺序保持原版本，商城商品 ID 不跨域重复', () => {
  assert.deepEqual(Object.keys(characters), characterIds)
  assert.deepEqual(regularEnemyIds, ['chaser', 'dasher', 'shooter', 'boar', 'assassin', 'sorcerer'])
  assert.deepEqual(Object.keys(enemyDefinitions), regularEnemyIds)
  assert.deepEqual(Object.keys(signatureWeapons), ['bamboo-staff', 'leaf-dart', 'iron-bamboo-shield'])
  assert.deepEqual(weaponIds, ['iron-pot-gauntlets', 'firecracker-launcher', 'spinning-bamboo-blade', 'panda-wine-gourd', 'bamboo-crossbow-turret'])
  assert.deepEqual(Object.keys(weapons), weaponIds)
  assert.deepEqual(Object.keys(items), itemIds)
  assert.deepEqual(Object.keys(upgrades), ['power', 'haste', 'vitality', 'footwork', 'leaf-volley', 'wide-sweep', 'thorn-fur', 'panda-roll', 'battle-fury', 'iron-constitution', 'bamboo-unity'])
  const productIds = [...Object.keys(signatureWeapons), ...weaponIds, ...itemIds]
  assert.equal(productIds.length, 32)
  assert.equal(new Set(productIds).size, productIds.length)
})

test('角色专属武器双向映射、进化宝物与物品堆叠约束有效', () => {
  for (const characterId of characterIds) {
    const weapon = signatureWeapons[characters[characterId].weaponId]
    assert.equal(weapon.characterId, characterId)
    assert.ok(weapon.evolution.requiredItem in items)
  }
  for (const item of Object.values(items)) {
    if (item.maxStacks !== undefined) {
      assert.ok(Number.isInteger(item.maxStacks) && item.maxStacks > 0)
      if (item.unique) assert.equal(item.maxStacks, 1)
    }
  }
  assert.deepEqual(itemIds.filter((id) => items[id].unique), [
    'panda-roller', 'tumbler-charm', 'chain-copper-clasp', 'guild-token', 'wine-immortal-gourd',
    'army-breaker-token', 'thunder-drum', 'bamboo-totem', 'taiji-jade',
  ])
  assert.deepEqual(itemIds.filter((id) => items[id].maxStacks !== undefined), ['twin-bamboo'])
  assert.equal(items['twin-bamboo'].maxStacks, 2)
})

test('内容配置的静态图片、角色与敌人动画目录真实存在', () => {
  const publicRoot = new URL('../../../public/', import.meta.url)
  for (const characterId of characterIds) {
    const character = characters[characterId]
    for (const path of [character.portrait, character.weaponImage]) {
      assert.ok(existsSync(new URL(path, publicRoot)), `缺少资源：${path}`)
    }
    const animationPath = characterId === 'shanlan' ? 'panda-wanderer' : characterId
    assert.equal(character.animation, characterId === 'shanlan' ? 'panda' : characterId)
    for (const action of ['idle', 'run', 'attack']) {
      const path = `assets/animations/${animationPath}/${action}/01.png`
      assert.ok(existsSync(new URL(path, publicRoot)), `缺少动画：${path}`)
    }
  }
  for (const enemy of Object.values(enemyDefinitions)) {
    for (const action of ['move', 'attack']) {
      const path = `assets/animations/${enemy.animation}/${action}/01.png`
      assert.ok(existsSync(new URL(path, publicRoot)), `缺少动画：${path}`)
    }
  }
  for (const entry of [
    ...Object.values(items), ...Object.values(weapons), ...Object.values(signatureWeapons),
    ...Object.values(signatureWeapons).map((weapon) => weapon.evolution), ...Object.values(upgrades),
  ]) {
    if (entry.image) assert.ok(existsSync(new URL(entry.image, publicRoot)), `缺少资源：${entry.image}`)
  }
})

test('内容配置的中文文案保留英文映射，包括六种普通敌人', () => {
  for (const entry of [
    ...Object.values(characters), ...Object.values(enemyDefinitions), ...Object.values(items),
    ...Object.values(weapons), ...Object.values(signatureWeapons), ...Object.values(upgrades),
    ...Object.values(signatureWeapons).map((weapon) => weapon.evolution), injurySources,
  ]) {
    for (const value of Object.values(entry)) {
      if (typeof value === 'string' && /[\u3400-\u9fff]/.test(value)) {
        assert.ok(value in english, `缺少英文映射：${value}`)
        assert.ok(!/[\u3400-\u9fff]/.test(english[value]), `英文仍含中文：${value}`)
      }
    }
  }
})

for (const characterId of characterIds) {
  test(`${characterId}：配置与初始状态逐项保持固定基础数值`, () => {
    const expected = expectedBaseStats[characterId]
    assert.deepEqual(characters[characterId].baseStats, expected)
    const state = createGameState(20261002, characterId)
    const actual = Object.fromEntries(Object.entries(state.player).filter(([key]) => key in expected))
    assert.deepEqual(actual, expected)
    assert.equal(state.player.hp, expected.maxHp)
    assert.equal(state.player.shieldTimer, characterId === 'shimo' ? 8 : 0)
  })

  test(`${characterId}：只修改基础配置，初始化与买卖后的重算同步读取新值`, () => {
    const base = characters[characterId].baseStats
    const original = { ...base }
    try {
      Object.assign(base, {
        maxHp: original.maxHp + 7, damage: 1.1, meleeDamage: original.meleeDamage + 0.1,
        attackSpeed: 1.2, armor: original.armor + 3, moveSpeed: original.moveSpeed + 0.1,
        projectileCount: 2, extraProjectiles: 1, projectileDamage: 0.9,
        meleeRange: original.meleeRange + 8, rangedDamage: 1.15, projectileSpeed: original.projectileSpeed + 20,
        criticalChance: 0.2, criticalDamage: 2, dodgeChance: 0.1, reflectDamage: 5,
        cooldownMultiplier: 0.8, basicAttackDamage: 0.9, luck: 0.15, shopPriceMultiplier: 1.05,
        pickupRange: 160, coinGain: 1.2, enemyPressure: 1.1, normalDamage: 1.15,
        eliteDamage: 1.2, shieldPower: 1.1, waveHealing: 0.1,
      })
      const state = createGameState(20261002, characterId)
      assert.deepEqual(Object.fromEntries(Object.entries(state.player).filter(([key]) => key in base)), base)
      state.shopOpen = true
      state.player.coins = 10000
      state.shopChoices = ['gale-leggings']
      assert.equal(buyItem(state, 0), true)
      assert.equal(sellItem(state, 0), true)
      const actual = Object.fromEntries(Object.entries(state.player).filter(([key]) => key in base))
      for (const [key, value] of Object.entries(base)) {
        const actualValue = actual[key]
        assert.ok(typeof actualValue === 'number' && Math.abs(actualValue - value) < 1e-8, `${key}：${actualValue} ≠ ${value}`)
      }
    } finally {
      Object.assign(base, original)
    }
  })

  test(`${characterId}：极限叠加遵守属性边界，出售后不产生额外收益`, () => {
    const state = createGameState(20261002, characterId)
    state.shopOpen = true
    state.player.coins = 100000
    for (let count = 0; count < 20; count += 1) {
      state.shopChoices = ['jade-eyepatch', 'mountain-stone', 'spirit-bamboo-tube', 'tiger-seal', 'monk-beads']
      for (let index = 0; index < 5; index += 1) assert.equal(buyItem(state, index), true)
    }
    assert.equal(state.player.maxHp, 1)
    assert.equal(state.player.moveSpeed, 0.5)
    assert.equal(state.player.criticalChance, 1)
    assert.equal(state.player.normalDamage, 0.5)
    assert.equal(state.player.cooldownMultiplier, 0.5)
    assert.equal(state.player.basicAttackDamage, 0.5)
    while (state.ownedItems.length) assert.equal(sellItem(state, 0), true)
    const expected = expectedBaseStats[characterId]
    const actual = Object.fromEntries(Object.entries(state.player).filter(([key]) => key in expected))
    for (const [key, value] of Object.entries(expected)) {
      const actualValue = actual[key]
      assert.ok(typeof actualValue === 'number' && Math.abs(actualValue - value) < 1e-8, `${key}：${actualValue} ≠ ${value}`)
    }
  })

  for (const reverse of [false, true]) {
    test(`${characterId}：购买全部道具后${reverse ? '逆序' : '正序'}出售，持续属性恢复角色基线`, () => {
      const state = createGameState(20261002, characterId)
      state.shopOpen = true
      state.player.coins = 100000
      for (const id of itemIds) {
        state.shopChoices = [id]
        assert.equal(buyItem(state, 0), true, `购买失败：${id}`)
      }
      assert.equal(state.ownedItems.length, 24)
      while (state.ownedItems.length) {
        assert.equal(sellItem(state, reverse ? state.ownedItems.length - 1 : 0), true)
      }
      const expected = expectedBaseStats[characterId]
      const actual = Object.fromEntries(Object.entries(state.player).filter(([key]) => key in expected))
      assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort())
      for (const [key, value] of Object.entries(expected)) {
        const actualValue = actual[key]
        assert.ok(typeof actualValue === 'number' && Math.abs(actualValue - value) < 1e-8, `${key}：${actualValue} ≠ ${value}`)
      }
      assert.ok(state.player.hp >= 0 && state.player.hp <= state.player.maxHp)
    })
  }
}

for (const id of itemIds) {
  const item = items[id]
  const stackLimit = item.unique ? 1 : item.maxStacks
  if (stackLimit === undefined) continue
  test(`${id}：达到 ${stackLimit} 件上限后拒绝重复购买且完整状态不变`, () => {
    const state = createGameState(20261002, 'qingtuan')
    state.shopOpen = true
    state.player.coins = 100000
    for (let count = 0; count < stackLimit; count += 1) {
      state.shopChoices = [id]
      assert.equal(buyItem(state, 0), true)
    }
    assert.equal(state.ownedItems.filter((ownedId) => ownedId === id).length, stackLimit)
    state.shopChoices = [id]
    state.lockedShopIndices = [0]
    const before = structuredClone(state)
    assert.equal(buyItem(state, 0), false)
    assert.deepEqual(state, before)
    state.lockedShopIndices = []
    state.shopChoices = [null, null, null, null]
    for (let refresh = 0; refresh < 100; refresh += 1) {
      assert.equal(refreshShop(state), true)
      assert.ok(!state.shopChoices.includes(id), `达上限的物品不应再次出现：${id}`)
    }
  })
}
