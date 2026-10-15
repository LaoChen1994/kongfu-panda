import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getBuildSummary, getEvolutionProgress, getWeaponDetails } from './build-presentation.js'
import { buyItem, chooseUpgrade, createGameState, getWeaponGrowth, sellItem, sellWeapon, stepGame } from './simulation.js'
import { characters, type CharacterId } from './game/content/characters.js'
import { signatureWeapons, weaponIds, type ShopProductId } from './game/content/weapons.js'
import type { UpgradeId } from './game/content/upgrades.js'
import { setLocale } from './i18n.js'
import { english } from './translations.js'

for (const characterId of ['shanlan', 'qingtuan', 'shimo'] as const) {
  for (const enhanced of [false, true]) {
    test(`${characterId} 摘要：${enhanced ? '范围/投射物/护盾' : '反伤与攻速'}组合按来源稳定排序，出售立即移除`, () => {
      setLocale('zh-CN')
      const products: ShopProductId[] = enhanced
        ? characterId === 'shimo' ? ['mountain-stone', 'taiji-jade'] : ['twin-bamboo', 'firecracker-launcher']
        : ['barbed-backplate', 'gale-leggings']
      const upgrade: UpgradeId = enhanced ? characterId === 'qingtuan' ? 'leaf-volley' : 'wide-sweep' : 'haste'
      const results = []
      for (const order of [products, [...products].reverse()]) {
        const state = createGameState(2209, characterId)
        assert.deepEqual(getBuildSummary(state), [])
        state.shopOpen = true
        state.player.coins = 1000
        for (const id of order) { state.shopChoices = [id]; assert.ok(buyItem(state, 0)) }
        state.pendingUpgrade = true
        state.upgradeChoices = [upgrade]
        assert.ok(chooseUpgrade(state, upgrade))
        results.push(getBuildSummary(state))
        assert.ok(results.at(-1)!.length >= (enhanced && characterId === 'qingtuan' ? 1 : 2))
        assert.ok(getBuildSummary(state).every(({ sources }) => sources.length > 0))
        if (characterId !== 'shimo') assert.ok(!getBuildSummary(state).some(({ label }) => label === '护盾反击'))
        while (state.ownedItems.length) assert.ok(sellItem(state, 0))
        for (const id of weaponIds) if (state.weaponLevels[id]) assert.ok(sellWeapon(state, id))
        const after = getBuildSummary(state)
        assert.ok(!after.some(({ label }) => label === '护盾反击' || label === '接触反伤'))
        assert.ok(!after.flatMap(({ sources }) => sources).some((source) => source.includes('双生竹节') || source.includes('爆竹筒')))
      }
      assert.deepEqual(results[0], results[1])
    })
  }
  for (const itemFirst of [false, true]) {
    test(`${characterId} 进化：${itemFirst ? '先宝物' : '先满级'}，出售条件宝物仍永久保留`, () => {
      setLocale('zh-CN')
      const state = createGameState(122, characterId)
      const id = characters[characterId].weaponId
      const item = signatureWeapons[id].evolution.requiredItem
      state.shopOpen = true
      state.player.coins = 1000
      state.signatureWeaponLevel = 4
      for (const product of itemFirst ? [item, id] : [id, item]) {
        state.shopChoices = [product]
        const before = structuredClone(state)
        const detail = getWeaponDetails(state, id, true)
        assert.deepEqual(state, before)
        if (product === id && itemFirst) assert.match(detail, /本次购买立即进化/)
        assert.ok(buyItem(state, 0))
      }
      assert.ok(state.signatureWeaponEvolved)
      assert.match(getEvolutionProgress(state), /已进化/)
      assert.ok(sellItem(state, 0))
      assert.ok(state.signatureWeaponEvolved)
      assert.match(getEvolutionProgress(state), /出售条件宝物仍保留/)
      assert.equal(getBuildSummary(state)[0].label, signatureWeapons[id].evolution.name)
      assert.doesNotMatch(getWeaponDetails(state, id, true), /Lv\.6|下一节点/)
    })
  }
}

test('无护盾或有效投射武器时，宝物不产生虚假方向；出售最后适用武器后更新', () => {
  setLocale('zh-CN')
  const state = createGameState(2209, 'shanlan')
  state.shopOpen = true
  state.player.coins = 2000
  for (const id of ['taiji-jade', 'twin-bamboo'] as const) { state.shopChoices = [id]; buyItem(state, 0) }
  assert.deepEqual(getBuildSummary(state), [])
  state.shopChoices = ['firecracker-launcher']
  buyItem(state, 0)
  assert.equal(getBuildSummary(state)[0].label, '多投射物')
  sellWeapon(state, 'firecracker-launcher')
  assert.deepEqual(getBuildSummary(state), [])
})

for (const id of [...weaponIds, 'bamboo-staff', 'leaf-dart', 'iron-bamboo-shield'] as const) {
  test(`${id} 新购、1→2、2→3、4→5、满级：预览与真实购买一致，读取不修改状态`, () => {
    const characterId: CharacterId = id === 'leaf-dart' ? 'qingtuan' : id === 'iron-bamboo-shield' ? 'shimo' : 'shanlan'
    for (const level of [0, 1, 2, 4, 5]) {
      const state = createGameState(2209, characterId)
      state.shopOpen = true
      state.player.coins = 1000
      state.shopChoices = [id]
      if (id === 'bamboo-staff' || id === 'leaf-dart' || id === 'iron-bamboo-shield') state.signatureWeaponLevel = Math.max(1, level)
      else if (level > 0) state.weaponLevels[id] = level
      const before = structuredClone(state)
      for (const language of ['zh-CN', 'en'] as const) {
        setLocale(language)
        getBuildSummary(state)
        getEvolutionProgress(state)
        const preview = getWeaponDetails(state, id, true)
        assert.doesNotMatch(preview, /NaN|undefined|Lv\.6|DPS/)
        if (language === 'en') assert.doesNotMatch(preview, /[\u3400-\u9fff]/)
        assert.deepEqual(state, before)
      }
      if (level === 5) { assert.equal(buyItem(state, 0), false); continue }
      setLocale('zh-CN')
      const preview = getWeaponDetails(state, id, true)
      assert.ok(buyItem(state, 0))
      const current = getWeaponDetails(state, id)
      const previewValues = preview.split('\n').filter((line) => !line.startsWith('下一节点')).map((line) => line.replace(/([\d.]+) → ([\d.]+)/g, '$2'))
      for (const line of previewValues) assert.ok(current.split('\n').includes(line), `${id}: ${line}`)
    }
  })
}

test('武器成长节点与实际生成的攻击、弹道、区域和部署一致', () => {
  for (const level of [1, 2, 3, 5]) {
    const state = createGameState(2209, 'shanlan')
    state.spawnTimer = 99
    state.bambooCooldown = 99
    state.gauntletCooldown = 0
    state.firecrackerCooldown = 0
    state.orbitCooldown = 0
    state.gourdCooldown = 0
    state.turretDeployCooldown = 0
    state.player.criticalChance = 0
    state.player.extraProjectiles = 2
    state.weaponLevels = { 'iron-pot-gauntlets': level, 'firecracker-launcher': level, 'spinning-bamboo-blade': level, 'panda-wine-gourd': level, 'bamboo-crossbow-turret': level }
    state.enemies = [{ id: 100, kind: 'chaser', x: 840, y: 500, hp: 10000, maxHp: 10000, cooldown: 99, dashTime: 0, vx: 0, vy: 0 }]
    stepGame(state, { x: 0, y: 0, dash: false }, 0.001)
    const fists = getWeaponGrowth(state, 'iron-pot-gauntlets', level)
    assert.equal(state.attacks.filter((attack) => attack.kind === 'fists').length, fists.count)
    assert.equal(state.attacks[0].radius, fists.radius)
    const cracker = getWeaponGrowth(state, 'firecracker-launcher', level)
    assert.equal(state.playerProjectiles.filter((shot) => shot.kind === 'firecracker').length, cracker.count)
    assert.equal(state.playerProjectiles.find((shot) => shot.kind === 'firecracker')!.blastRadius, cracker.radius)
    const gourd = getWeaponGrowth(state, 'panda-wine-gourd', level)
    assert.equal(state.groundZones.length, gourd.count)
    assert.equal(state.groundZones[0].radius, gourd.radius)
    assert.equal(state.groundZones[0].duration, gourd.duration)
    const turret = getWeaponGrowth(state, 'bamboo-crossbow-turret', level)
    assert.equal(state.turrets.length, turret.count)
    assert.equal(state.turrets[0].cooldown, turret.interval)
    assert.equal(getWeaponGrowth(state, 'spinning-bamboo-blade', level).count, level >= 5 ? 3 : level >= 3 ? 2 : 1)
  }
})

test('新增展示文案有英文映射，反复中英文切换不修改状态', () => {
  const source = readFileSync('src/build-presentation.ts', 'utf8')
  for (const match of source.matchAll(/'([^'\n]*[\u3400-\u9fff][^'\n]*)'/g)) assert.ok(match[1] in english, match[1])
  const state = createGameState(42, 'shimo')
  const before = structuredClone(state)
  for (const language of ['en', 'zh-CN', 'en'] as const) {
    setLocale(language)
    getBuildSummary(state)
    getWeaponDetails(state, 'iron-bamboo-shield', true)
  }
  assert.deepEqual(state, before)
})

test('不倒翁触发后不再列作生存来源，角色重开清空摘要', () => {
  setLocale('zh-CN')
  const state = createGameState(42)
  state.shopOpen = true
  state.player.coins = 100
  state.shopChoices = ['tumbler-charm']
  assert.ok(buyItem(state, 0))
  assert.equal(getBuildSummary(state)[0].label, '生存保障')
  state.lastStandUsed = true
  assert.deepEqual(getBuildSummary(state), [])
  assert.deepEqual(getBuildSummary(createGameState(42, 'qingtuan')), [])
})
