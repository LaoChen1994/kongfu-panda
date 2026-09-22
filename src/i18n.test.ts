import { english } from './translations.js'
import { resolveLocale, setLocale, t } from './i18n.js'
import { characters, createGameState, injurySources, items, signatureWeapons, stepGame, upgrades, weapons } from './simulation.js'

for (const [saved, browser, expected] of [
  [null, 'zh-CN', 'zh-CN'], [null, 'zh-TW', 'zh-CN'], [null, 'en-US', 'en'],
  [null, 'fr-FR', 'en'], ['invalid', 'en', 'en'], ['en', 'zh', 'en'], ['zh-CN', 'en', 'zh-CN'],
]) {
  if (resolveLocale(saved, browser ?? '') !== expected) throw new Error(`Language resolution failed: ${saved}/${browser}`)
}

for (const [source, translation] of Object.entries(english)) {
  if (/[\u3400-\u9fff]/.test(translation)) throw new Error(`Untranslated: ${source}`)
  const sourceSlots = [...source.matchAll(/\{\d+\}/g)].map((match) => match[0]).sort().join(',')
  const targetSlots = [...translation.matchAll(/\{\d+\}/g)].map((match) => match[0]).sort().join(',')
  if (sourceSlots !== targetSlots) throw new Error(`Placeholder mismatch: ${source}`)
}
for (const entry of [
  ...Object.values(characters), ...Object.values(items), ...Object.values(weapons),
  ...Object.values(upgrades), ...Object.values(signatureWeapons), ...Object.values(signatureWeapons).map((weapon) => weapon.evolution),
  injurySources,
]) {
  for (const value of Object.values(entry)) {
    if (typeof value === 'string' && /[\u3400-\u9fff]/.test(value) && !(value in english)) throw new Error(`Missing content translation: ${value}`)
  }
}
setLocale('en')
if (t('刷新商品 · {0} 铜钱', 42) !== 'Refresh · 42 coins') throw new Error('English interpolation failed')
if (t('未知键') !== '未知键') throw new Error('Missing key must remain readable')
if (t('每件：{0}', '$& {1}') !== 'Each: $& {1}') throw new Error('Interpolation must not recursively replace user values')
const englishRun = createGameState(2209)
for (let i = 0; i < 200; i++) stepGame(englishRun, { x: 1, y: 0, dash: i === 30 }, 0.05)
setLocale('zh-CN')
if (t('刷新商品 · {0} 铜钱', 42) !== '刷新商品 · 42 铜钱') throw new Error('Chinese interpolation failed')
const chineseRun = createGameState(2209)
for (let i = 0; i < 200; i++) stepGame(chineseRun, { x: 1, y: 0, dash: i === 30 }, 0.05)
if (JSON.stringify(englishRun) !== JSON.stringify(chineseRun)) throw new Error('Language must not change simulation or RNG')
console.log('i18n ok: locale fallback, content coverage, placeholders, deterministic simulation')
