import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { buyItem, chooseUpgrade, continueWave, createGameState, refreshShop, refreshUpgrades, sellItem, sellWeapon, stepGame, toggleShopLock } from './simulation.js'
import { recordReplay } from './test-support/replay.js'

for (const characterId of ['shanlan', 'qingtuan', 'shimo'] as const) {
  for (const build of ['starter', 'mixed'] as const) {
    test(`${characterId}/${build}：固定种子与操作下所有检查点一致`, () => {
      const first = recordReplay(characterId, 20261002, build)
      const second = recordReplay(characterId, 20261002, build)
      assert.deepEqual(second, first, `seed=20261002, character=${characterId}, build=${build}`)
      assert.ok(first.some((point) => point.event === 'first-upgrade'))
      assert.ok(first.some((point) => point.event === 'first-shop'))
      assert.ok(first.some((point) => point.event === 'boss-entry'))
      for (const point of first) {
        assert.ok(point.player.hp >= 0 && point.player.hp <= point.player.maxHp)
        assert.ok(point.enemies <= 80)
        assert.ok(point.drops <= 140)
      }
    })

    test(`${characterId}/${build}：保持 main 合并版本的行为基线`, () => {
      const expected: unknown = JSON.parse(readFileSync(new URL(`../src/test-support/baselines/${characterId}-${build}.json`, import.meta.url), 'utf8'))
      assert.ok(Array.isArray(expected), '行为基线必须是检查点数组')
      const actual = recordReplay(characterId, 20261002, build)
      assert.equal(actual.length, expected.length, '检查点数量不能改变')
      for (const [index, point] of actual.entries()) {
        assert.deepEqual(point, expected[index], `main=ebadff3, seed=20261002, character=${characterId}, build=${build}, tick=${point.tick}, event=${point.event}`)
      }
    })
  }
}

test('不同种子改变遭遇和选择，但仍满足十波数量边界', () => {
  const first = recordReplay('shanlan', 7, 'starter')
  const second = recordReplay('shanlan', 2209, 'starter')
  assert.notDeepEqual(first.map((point) => point.fingerprint), second.map((point) => point.fingerprint))
  for (const points of [first, second]) {
    assert.equal(points.at(-1)?.wave, 10)
    assert.ok(points.every((point) => point.enemies <= 80 && point.drops <= 140))
  }
})

for (const blocked of ['pendingUpgrade', 'shopOpen', 'victory', 'gameOver'] as const) {
  test(`${blocked}：整个 Simulation 与随机状态保持冻结`, () => {
    const state = createGameState(20261002, 'shimo')
    state[blocked] = true
    state.enemies.push({ id: state.nextId++, kind: 'shooter', x: 900, y: 500, hp: 26, maxHp: 26, cooldown: 0, dashTime: 0, vx: 0, vy: 0 })
    const before = structuredClone(state)
    for (let tick = 0; tick < 20; tick += 1) stepGame(state, { x: 1, y: -1, dash: true }, 0.05)
    assert.deepEqual(state, before)
  })
}

test('无效命令不改变经济、构筑、选择与随机种子', () => {
  const state = createGameState(20261002)
  const before = structuredClone(state)
  assert.equal(buyItem(state, 0), false)
  assert.equal(refreshShop(state), false)
  assert.equal(toggleShopLock(state, 0), false)
  assert.equal(sellItem(state, 0), false)
  assert.equal(sellWeapon(state, 'iron-pot-gauntlets'), false)
  assert.equal(chooseUpgrade(state, 'power'), false)
  assert.equal(refreshUpgrades(state), false)
  assert.equal(continueWave(state), false)
  assert.deepEqual(state, before)
})

test('首次升级在战斗暂停时只应用一次且不消耗额外随机数', () => {
  const state = createGameState(20261002)
  state.spawnTimer = 99
  state.player.xp = state.player.nextXp
  stepGame(state, { x: 0, y: 0, dash: false }, 0.05)
  assert.equal(state.pendingUpgrade, true)
  const seed = state.seed
  const choice = state.upgradeChoices[0]
  assert.equal(chooseUpgrade(state, choice), true)
  const selected = structuredClone(state)
  assert.equal(chooseUpgrade(state, choice), false)
  assert.deepEqual(state, selected)
  assert.equal(state.seed, seed)
  assert.equal(state.chosenUpgrades.length, 1)
})

test('Boss 胜利和失败均在最后伤害后冻结，重开重新创建状态', () => {
  const won = createGameState(20261002)
  won.wave = 9
  won.shopOpen = true
  assert.equal(continueWave(won), true)
  const boss = won.enemies.find((enemy) => enemy.kind === 'boss')
  assert.ok(boss)
  won.bossIntroTime = 0
  boss.hp = 1
  boss.cooldown = 99
  won.player.x = boss.x
  won.player.y = boss.y + 70
  won.bambooCooldown = 0
  stepGame(won, { x: 0, y: 0, dash: false }, 0.05)
  assert.equal(won.victory, true)
  assert.equal(won.kills, 1)
  const lost = createGameState(20261002)
  lost.player.hp = 1
  lost.enemyProjectiles.push({ id: lost.nextId++, x: lost.player.x, y: lost.player.y, vx: 0, vy: 0 })
  stepGame(lost, { x: 0, y: 0, dash: false }, 0.05)
  assert.equal(lost.gameOver, true)
  assert.equal(lost.player.hp, 0)
  for (const ended of [won, lost]) {
    const before = structuredClone(ended)
    stepGame(ended, { x: 1, y: 1, dash: true }, 0.05)
    assert.deepEqual(ended, before)
  }
  const fresh = createGameState(2209)
  assert.equal(fresh.wave, 1)
  assert.equal(fresh.time, 0)
  assert.equal(fresh.seed, 2209)
  assert.deepEqual(fresh.runStats.damage, {})
  assert.deepEqual(fresh.ownedItems, [])
  assert.equal(fresh.victory, false)
  assert.equal(fresh.gameOver, false)
})
