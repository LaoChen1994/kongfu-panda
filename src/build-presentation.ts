import { characters } from './game/content/characters.js'
import { items, type ItemId } from './game/content/items.js'
import { upgrades, type UpgradeId } from './game/content/upgrades.js'
import { signatureWeapons, weapons, isSignatureWeaponId, type SignatureWeaponId, type WeaponId } from './game/content/weapons.js'
import type { GameState } from './game/simulation/state.js'
import { getWeaponGrowth } from './simulation.js'
import { t } from './i18n.js'

const getHeldSources = (state: GameState, itemIds: ItemId[], upgradeIds: UpgradeId[] = [], commonIds: WeaponId[] = []): string[] => {
  const sources: string[] = []
  for (const id of itemIds) {
    const count = state.ownedItems.filter((held) => held === id).length
    if (count && !(id === 'tumbler-charm' && state.lastStandUsed)) sources.push(`${t(items[id].name)} ×${count}`)
  }
  for (const id of upgradeIds) {
    const count = state.chosenUpgrades.filter((held) => held === id).length
    if (count) sources.push(`${t(upgrades[id].name)} ×${count}`)
  }
  for (const id of commonIds) {
    const level = state.weaponLevels[id] ?? 0
    if (level > 0) sources.push(`${t(weapons[id].name)} Lv.${level}`)
  }
  return sources
}

export const getBuildSummary = (state: GameState): { label: string; sources: string[] }[] => {
  const directions: { label: string; sources: string[] }[] = []
  const signature = signatureWeapons[characters[state.characterId].weaponId]
  if (state.signatureWeaponEvolved) directions.push({ label: t(signature.evolution.name), sources: [t('专属武器已进化，本局永久保留')] })
  if (state.characterId === 'shimo' && (state.ownedItems.includes('taiji-jade') || state.player.shieldPower > 1)) {
    directions.push({ label: t('护盾反击'), sources: [t(characters.shimo.name), ...getHeldSources(state, ['mountain-stone', 'taiji-jade'])] })
  }
  if (state.characterId !== 'qingtuan' && state.player.meleeRange > characters[state.characterId].baseStats.meleeRange) {
    directions.push({ label: t('近战范围'), sources: [t(signature.name), ...getHeldSources(state, [], ['wide-sweep'])] })
  }
  const projectiles: WeaponId[] = []
  if ((state.weaponLevels['firecracker-launcher'] ?? 0) >= 3 || (state.weaponLevels['firecracker-launcher'] ?? 0) > 0 && state.player.extraProjectiles > 0) projectiles.push('firecracker-launcher')
  if ((state.weaponLevels['bamboo-crossbow-turret'] ?? 0) > 0 && state.player.extraProjectiles > 0) projectiles.push('bamboo-crossbow-turret')
  if (projectiles.length || state.characterId === 'qingtuan' && state.player.projectileCount + state.player.extraProjectiles > 1) {
    const sources = getHeldSources(state, ['twin-bamboo'], state.characterId === 'qingtuan' ? ['leaf-volley'] : [], projectiles)
    if (state.characterId === 'qingtuan') sources.unshift(t(signature.name))
    directions.push({ label: t('多投射物'), sources })
  }
  if (state.chosenUpgrades.includes('bamboo-unity')) directions.push({ label: t('竹武器协同'), sources: [t(signature.name), ...getHeldSources(state, [], ['bamboo-unity'], ['spinning-bamboo-blade', 'bamboo-crossbow-turret'])] })
  const deployments: WeaponId[] = []
  if ((state.weaponLevels['spinning-bamboo-blade'] ?? 0) >= 3) deployments.push('spinning-bamboo-blade')
  if ((state.weaponLevels['bamboo-crossbow-turret'] ?? 0) >= 3) deployments.push('bamboo-crossbow-turret')
  if (deployments.length) directions.push({ label: t('多重部署'), sources: getHeldSources(state, [], [], deployments) })
  if ((state.weaponLevels['panda-wine-gourd'] ?? 0) > 0) directions.push({ label: t('持续区域'), sources: getHeldSources(state, [], [], ['panda-wine-gourd']) })
  if (state.player.reflectDamage > 0 || state.chosenUpgrades.includes('thorn-fur')) directions.push({ label: t('接触反伤'), sources: getHeldSources(state, ['barbed-backplate'], ['thorn-fur']) })
  if (state.ownedItems.includes('panda-roller') || state.chosenUpgrades.includes('panda-roll')) directions.push({ label: t('闪避震击'), sources: getHeldSources(state, ['panda-roller'], ['panda-roll']) })
  if (state.ownedItems.includes('army-breaker-token') || state.player.criticalChance > characters[state.characterId].baseStats.criticalChance) directions.push({ label: t('暴击输出'), sources: getHeldSources(state, ['army-breaker-token', 'jade-eyepatch']) })
  if (state.player.attackSpeed / state.player.cooldownMultiplier > characters[state.characterId].baseStats.attackSpeed) directions.push({ label: t('快速出招'), sources: getHeldSources(state, ['gale-leggings', 'monk-beads'], ['haste']) })
  if (state.ownedItems.some((id) => id === 'thunder-drum' || id === 'chain-copper-clasp' || id === 'bamboo-totem' || id === 'wine-immortal-gourd') || state.chosenUpgrades.includes('battle-fury')) directions.push({ label: t('条件触发'), sources: getHeldSources(state, ['thunder-drum', 'chain-copper-clasp', 'bamboo-totem', 'wine-immortal-gourd'], ['battle-fury']) })
  if (state.player.meleeDamage > characters[state.characterId].baseStats.meleeDamage && (state.characterId !== 'qingtuan' || (state.weaponLevels['iron-pot-gauntlets'] ?? 0) > 0 || (state.weaponLevels['spinning-bamboo-blade'] ?? 0) > 0)) directions.push({ label: t('近战增伤'), sources: getHeldSources(state, ['martial-belt']) })
  if (state.ownedItems.includes('wind-feather') && (state.characterId === 'qingtuan' || (state.weaponLevels['firecracker-launcher'] ?? 0) > 0 || (state.weaponLevels['panda-wine-gourd'] ?? 0) > 0 || (state.weaponLevels['bamboo-crossbow-turret'] ?? 0) > 0)) directions.push({ label: t('远程增伤'), sources: getHeldSources(state, ['wind-feather']) })
  if (state.player.damage > 1 || state.player.eliteDamage > 1) directions.push({ label: t('伤害强化'), sources: getHeldSources(state, ['tiger-seal'], ['power', 'bamboo-unity']) })
  if (state.player.maxHp > characters[state.characterId].baseStats.maxHp || state.player.armor > characters[state.characterId].baseStats.armor || state.player.waveHealing > 0 || state.ownedItems.includes('tumbler-charm') && !state.lastStandUsed || state.chosenUpgrades.includes('iron-constitution')) directions.push({ label: t('生存保障'), sources: getHeldSources(state, ['bamboo-dew-pill', 'iron-bracer', 'food-god-lunchbox', 'tumbler-charm'], ['vitality', 'iron-constitution']) })
  if (state.player.moveSpeed > characters[state.characterId].baseStats.moveSpeed) directions.push({ label: t('灵活走位'), sources: getHeldSources(state, [], ['footwork']) })
  if (state.ownedItems.some((id) => id === 'fortune-paw' || id === 'lucky-bell' || id === 'spirit-bamboo-tube' || id === 'guild-token')) directions.push({ label: t('资源成长'), sources: getHeldSources(state, ['fortune-paw', 'lucky-bell', 'spirit-bamboo-tube', 'guild-token']) })
  return directions.filter(({ sources }) => sources.length > 0).slice(0, 3)
}

export const getEvolutionProgress = (state: GameState): string => {
  const signature = signatureWeapons[characters[state.characterId].weaponId]
  if (state.signatureWeaponEvolved) return t('已进化为{0}；出售条件宝物仍保留', t(signature.evolution.name))
  return t('进化：Lv.{0}/5 · {1}：{2}', state.signatureWeaponLevel, t(items[signature.evolution.requiredItem].name), state.ownedItems.includes(signature.evolution.requiredItem) ? t('已持有') : t('未持有'))
}

export const getWeaponDetails = (state: GameState, id: WeaponId | SignatureWeaponId, buying = false): string => {
  const level = isSignatureWeaponId(id) ? state.signatureWeaponLevel : state.weaponLevels[id] ?? 0
  const afterLevel = buying ? Math.min(5, level + 1) : level
  const before = getWeaponGrowth(state, id, level)
  const afterState = { ...state, signatureWeaponEvolved: state.signatureWeaponEvolved || isSignatureWeaponId(id) && afterLevel === 5 && state.ownedItems.includes(signatureWeapons[id].evolution.requiredItem) }
  const after = getWeaponGrowth(afterState, id, afterLevel)
  const fields: { key: keyof typeof before; label: string }[] = [{ key: 'baseDamage', label: t(id === 'panda-wine-gourd' ? '基础伤害/每跳' : '基础伤害/首击单发') }]
  if (after.radius) fields.push({ key: 'radius', label: t(id === 'spinning-bamboo-blade' ? '轨道半径（场景单位）' : id === 'firecracker-launcher' || id === 'panda-wine-gourd' ? '区域半径（场景单位）' : '判定半径（场景单位）') })
  fields.push({ key: 'count', label: t(id === 'leaf-dart' || id === 'firecracker-launcher' ? '枚/齐射（未计被动分裂）' : id === 'bamboo-crossbow-turret' ? '部署上限/台' : id === 'spinning-bamboo-blade' ? '环绕竹刃/把' : id === 'panda-wine-gourd' ? '区域/次' : '连击/次') })
  if (after.duration) fields.push({ key: 'duration', label: t('持续/秒') })
  fields.push({ key: 'interval', label: t(id === 'bamboo-crossbow-turret' ? '弩台射击间隔/秒' : '出招间隔/秒') })
  const lines = fields.filter(({ key }) => !buying || level === 0 || level >= 5 || before[key] !== after[key]).map(({ key, label }) => `${label} ${buying && level > 0 && level < 5 && before[key] !== after[key] ? `${Number(before[key].toFixed(2))} → ` : ''}${Number(after[key].toFixed(2))}`)
  if (id === 'bamboo-crossbow-turret') lines.push(t('每台齐射 {0} 枚；升级用于后续部署，旧弩台保留原等级', 1 + state.player.extraProjectiles))
  if (id === 'iron-pot-gauntlets' && after.count > 1) lines.push(t('第二拳为首拳的 65%'))
  if (id === 'bamboo-staff' && after.count > 1) lines.push(t('第二击为首击的 60%'))
  lines.push(t('基础伤害未计加成；其余为当前实际值'))
  if (isSignatureWeaponId(id)) {
    lines.push(getEvolutionProgress({ ...afterState, signatureWeaponLevel: afterLevel }))
    if (afterState.signatureWeaponEvolved) lines.push(t(signatureWeapons[id].evolution.description))
    if (buying && !state.signatureWeaponEvolved && afterState.signatureWeaponEvolved) lines.push(t('本次购买立即进化'))
  } else if (afterLevel < 5) {
    const nextLevel = afterLevel < 3 ? 3 : 5
    const next = getWeaponGrowth(state, id, nextLevel)
    const key = next.count !== after.count ? 'count' : 'baseDamage'
    lines.push(t('下一节点 Lv.{0}：{1} {2} → {3}', nextLevel, fields.find((field) => field.key === key)!.label, Number(after[key].toFixed(2)), Number(next[key].toFixed(2))))
  }
  if (afterLevel === 5) lines.push(t('Lv.5 · 已满级'))
  return lines.join('\n')
}
