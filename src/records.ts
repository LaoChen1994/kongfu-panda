import type { CharacterId } from './simulation.js'

export type BattleRecord = { runs: number; wins: number; bestWave: number; bestKills: number; bestClearTime: number }

export const parseBattleRecords = (raw: string | null): Record<CharacterId, BattleRecord> => {
  const records = {
    shanlan: { runs: 0, wins: 0, bestWave: 0, bestKills: 0, bestClearTime: 0 },
    qingtuan: { runs: 0, wins: 0, bestWave: 0, bestKills: 0, bestClearTime: 0 },
    shimo: { runs: 0, wins: 0, bestWave: 0, bestKills: 0, bestClearTime: 0 },
  }
  try {
    const saved: unknown = JSON.parse(raw ?? 'null')
    if (typeof saved !== 'object' || saved === null || !('version' in saved) || saved.version !== 1 || !('characters' in saved) || typeof saved.characters !== 'object' || saved.characters === null) return records
    for (const id of ['shanlan', 'qingtuan', 'shimo'] as const) {
      if (!(id in saved.characters)) continue
      const candidate: unknown = Reflect.get(saved.characters, id)
      if (typeof candidate !== 'object' || candidate === null) continue
      for (const field of ['runs', 'wins', 'bestWave', 'bestKills', 'bestClearTime'] as const) {
        const value: unknown = Reflect.get(candidate, field)
        if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) records[id][field] = value
      }
      records[id].wins = Math.min(records[id].wins, records[id].runs)
      records[id].bestWave = Math.min(records[id].bestWave, 10)
      if (!records[id].wins) records[id].bestClearTime = 0
    }
  } catch {
    // 损坏存档回退到空战绩，不能阻止选人和战斗。
  }
  return records
}
