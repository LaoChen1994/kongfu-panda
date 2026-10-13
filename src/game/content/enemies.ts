export const regularEnemyIds = ['chaser', 'dasher', 'shooter', 'boar', 'assassin', 'sorcerer'] as const
export type RegularEnemyKind = typeof regularEnemyIds[number]
export type EnemyKind = RegularEnemyKind | 'boss'

export const injurySources = {
  chaser: '竹鼠接触', dasher: '山猴冲撞', shooter: '毒蜂接触', boar: '野猪撞击',
  assassin: '鼬鼠突刺', sorcerer: '狐妖接触', boss: '巨灵接触',
  'elite-chaser': '赤纹竹鼠冲撞', 'enemy-shot': '毒蜂弹幕', root: '巨灵根刺', shockwave: '巨灵冲击波',
} as const

export const enemyDefinitions: Record<RegularEnemyKind, { name: string; unlockWave: number; threat: number; baseHp: number; size: number; animation: string }> = {
  chaser: { name: '竹鼠', unlockWave: 1, threat: 1, baseHp: 30, size: 54, animation: 'redfang-chaser' },
  dasher: { name: '山猴', unlockWave: 2, threat: 2, baseHp: 38, size: 62, animation: 'violet-horn-dasher' },
  shooter: { name: '毒蜂', unlockWave: 2, threat: 2, baseHp: 26, size: 58, animation: 'cyan-lantern-shooter' },
  boar: { name: '甲壳野猪', unlockWave: 3, threat: 3, baseHp: 68, size: 68, animation: 'shellback-boar' },
  assassin: { name: '鼬鼠刺客', unlockWave: 4, threat: 3, baseHp: 34, size: 58, animation: 'weasel-assassin' },
  sorcerer: { name: '狐妖术士', unlockWave: 5, threat: 4, baseHp: 42, size: 62, animation: 'fox-sorcerer' },
}
