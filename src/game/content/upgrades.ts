export type UpgradeId = 'power' | 'haste' | 'vitality' | 'footwork' | 'leaf-volley' | 'wide-sweep' | 'thorn-fur' | 'panda-roll' | 'battle-fury' | 'iron-constitution' | 'bamboo-unity'

export const upgrades: Record<UpgradeId, { name: string; rarity: '普通' | '稀有' | '史诗' | '传说'; description: string; preview: string; tag: string; image?: string; unique?: boolean }> = {
  power: { name: '沉肩坠肘', rarity: '普通', description: '全部伤害 +12%', preview: '所有招式伤害提高 12%', tag: '输出' },
  haste: { name: '疾风连式', rarity: '普通', description: '攻击速度 +10%', preview: '所有自动攻击间隔缩短', tag: '攻速' },
  vitality: { name: '竹息养生', rarity: '普通', description: '最大生命 +5，并恢复 5', preview: '立即恢复 5 点生命', tag: '生存' },
  footwork: { name: '踏叶无痕', rarity: '稀有', description: '移动速度 +10%', preview: '走位和撤离速度提高', tag: '机动' },
  'leaf-volley': { name: '竹叶连射', rarity: '史诗', description: '额外发射 1 枚飞叶，远程伤害 -10%', preview: '飞叶数量增加，单发伤害降低', tag: '远程 · 天赋' },
  'wide-sweep': { name: '横扫千军', rarity: '稀有', description: '杖/盾攻击范围 +18，攻击速度 -5%', preview: '近战覆盖扩大，但攻击稍慢', tag: '近战 · 天赋' },
  'thorn-fur': { name: '荆棘皮毛', rarity: '稀有', description: '受到接触伤害时反击 18 点伤害', preview: '只反击直接接触你的敌人', tag: '生存 · 反击', image: 'assets/upgrades/thorn-fur.png', unique: true },
  'panda-roll': { name: '熊猫滚滚', rarity: '史诗', description: '闪避结束震击 48 点伤害，冷却 +0.4 秒', preview: '闪避转为范围攻击，基础冷却 2.5秒 → 2.9秒', tag: '机动 · 触发', image: 'assets/upgrades/panda-roll.png', unique: true },
  'battle-fury': { name: '越战越勇', rarity: '史诗', description: '本波每击破 50 个敌人，全部伤害 +2%', preview: '每波重新累计，不设永久增益', tag: '输出 · 成长', image: 'assets/upgrades/battle-fury.png', unique: true },
  'iron-constitution': { name: '食铁体质', rarity: '史诗', description: '拾取治疗后获得 4 秒 +8 护甲，治疗量 -10%', preview: '治疗球 10 → 9；短时承伤降低', tag: '生存 · 触发', image: 'assets/upgrades/iron-constitution.png', unique: true },
  'bamboo-unity': { name: '万竹归心', rarity: '传说', description: '每种竹类武器使全部伤害 +5%，商城更易出现竹类武器', preview: '专属武器计 1 种，最高获得 +15% 伤害', tag: '构筑 · 传说', image: 'assets/upgrades/bamboo-unity.png', unique: true },
}
