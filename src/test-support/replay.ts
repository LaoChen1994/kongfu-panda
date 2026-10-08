import { createHash } from 'node:crypto'
import { buyItem, chooseUpgrade, continueWave, createGameState, refreshShop, sellItem, stepGame, toggleShopLock, type CharacterId, type GameState } from '../simulation.js'

// 用于锁定重构前的行为，不是数值平衡脚本或真人通关证明。
const captureCheckpoint = (state: GameState, tick: number, event: string) => ({
  tick, event, seed: state.seed, nextId: state.nextId, time: state.time, wave: state.wave, waveTime: state.waveTime,
  kills: state.kills, player: structuredClone(state.player), upgrades: [...state.chosenUpgrades],
  items: [...state.ownedItems], weapons: { ...state.weaponLevels }, signatureLevel: state.signatureWeaponLevel,
  signatureEvolved: state.signatureWeaponEvolved, shopChoices: [...state.shopChoices], upgradeChoices: [...state.upgradeChoices],
  locks: [...state.lockedShopIndices], stats: structuredClone(state.runStats),
  enemies: state.enemies.length, drops: state.drops.length,
  projectiles: state.playerProjectiles.length + state.enemyProjectiles.length,
  boss: structuredClone(state.enemies.find((enemy) => enemy.kind === 'boss') ?? null),
  victory: state.victory, gameOver: state.gameOver,
  // 对象键排序忽略属性声明顺序，数组顺序仍属于规则契约。
  fingerprint: createHash('sha256').update(JSON.stringify(state, (_key, value: unknown) => (
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0))
      : value
  ))).digest('hex'),
})

export const recordReplay = (characterId: CharacterId, seed: number, build: 'starter' | 'mixed') => {
  const state = createGameState(seed, characterId)
  const checkpoints = [captureCheckpoint(state, 0, 'initial')]
  let firstUpgrade = false
  let firstShop = false
  let bossEntered = false
  for (let tick = 1; tick <= 12000; tick += 1) {
    // 与现有耐久测试一致：只免接触伤害，保留真实生命基线、经济与成长。
    state.player.hitCooldown = 1
    stepGame(state, { x: tick % 400 < 200 ? 1 : -1, y: tick % 600 < 300 ? 1 : -1, dash: tick % 60 === 0 }, 0.05)
    if (state.pendingUpgrade) {
      if (!firstUpgrade) checkpoints.push(captureCheckpoint(state, tick, 'first-upgrade'))
      firstUpgrade = true
      chooseUpgrade(state, state.upgradeChoices[0])
    }
    if (state.shopOpen) {
      if (!firstShop) checkpoints.push(captureCheckpoint(state, tick, 'first-shop'))
      firstShop = true
      if (build === 'mixed') {
        for (let slot = 0; slot < state.shopChoices.length; slot += 1) buyItem(state, slot)
        refreshShop(state)
        if (state.shopChoices[0]) toggleShopLock(state, 0)
        for (let slot = 1; slot < state.shopChoices.length; slot += 1) buyItem(state, slot)
        if (state.ownedItems.length > 3) sellItem(state, 0)
      }
      continueWave(state)
    }
    if (!bossEntered && state.wave === 10) {
      checkpoints.push(captureCheckpoint(state, tick, 'boss-entry'))
      bossEntered = true
    }
    if (tick === 1000 || tick === 4000 || tick === 8000 || tick === 12000) checkpoints.push(captureCheckpoint(state, tick, 'sample'))
  }
  return checkpoints
}
