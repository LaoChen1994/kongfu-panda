import type { CharacterId } from './characters.js'
import type { ItemId } from './items.js'

export type SignatureWeaponId = 'bamboo-staff' | 'leaf-dart' | 'iron-bamboo-shield'
export const weaponIds = ['iron-pot-gauntlets', 'firecracker-launcher', 'spinning-bamboo-blade', 'panda-wine-gourd', 'bamboo-crossbow-turret'] as const
export type WeaponId = typeof weaponIds[number]
export type ShopProductId = ItemId | WeaponId | SignatureWeaponId

export const signatureWeapons: Record<SignatureWeaponId, {
  characterId: CharacterId
  name: string
  rarity: string
  description: string
  preview: string
  price: number
  image: string
  evolution: { name: string; description: string; image: string; requiredItem: ItemId }
}> = {
  'bamboo-staff': {
    characterId: 'shanlan', name: '青竹杖', rarity: '普通', description: '山岚专属；升级提高伤害与横扫范围', preview: '专属武器升级，不占通用武器槽', price: 26, image: 'assets/weapons/bamboo-staff.png',
    evolution: { name: '盘龙金竹', description: '横扫化为两段环形连击，末击强力击退', image: 'assets/weapons/coiling-dragon-bamboo.png', requiredItem: 'martial-belt' },
  },
  'leaf-dart': {
    characterId: 'qingtuan', name: '飞叶镖', rarity: '普通', description: '青团专属；升级提高飞叶伤害', preview: '专属武器升级，不占通用武器槽', price: 26, image: 'assets/weapons/leaf-dart.png',
    evolution: { name: '万叶归宗', description: '飞叶穿透敌群，并在末端分裂回射', image: 'assets/weapons/myriad-leaf-return.png', requiredItem: 'wind-feather' },
  },
  'iron-bamboo-shield': {
    characterId: 'shimo', name: '铁竹盾', rarity: '普通', description: '石墨专属；升级提高盾击伤害与范围', preview: '专属武器升级，不占通用武器槽', price: 26, image: 'assets/weapons/iron-bamboo-shield.png',
    evolution: { name: '不动熊山', description: '护盾破裂后留下持续震地波', image: 'assets/weapons/immovable-bear-mountain.png', requiredItem: 'mountain-stone' },
  },
}

export const weapons: Record<WeaponId, { name: string; rarity: string; description: string; preview: string; price: number; image: string }> = {
  'iron-pot-gauntlets': { name: '铁锅拳套', rarity: '普通', description: '极短距离快速拳击，Lv.3 起追加第二拳', preview: '升级提高伤害与拳风范围', price: 22, image: 'assets/weapons/iron-pot-gauntlets.png' },
  'firecracker-launcher': { name: '爆竹筒', rarity: '稀有', description: '发射慢速爆竹，命中造成范围爆炸', preview: '升级扩大爆炸，Lv.3 起双弹齐射', price: 42, image: 'assets/weapons/firecracker-launcher.png' },
  'spinning-bamboo-blade': { name: '旋转竹刃', rarity: '普通', description: '竹刃绕身切割近身敌人，Lv.3 起增加第二把', preview: '升级增加伤害、轨道与竹刃数量', price: 24, image: 'assets/weapons/spinning-bamboo-blade.png' },
  'panda-wine-gourd': { name: '灵茶葫芦', rarity: '稀有', description: '投出茶焰灼烧一片区域，Lv.3 起同时点燃两处', preview: '升级扩大茶焰并延长持续时间', price: 44, image: 'assets/weapons/panda-wine-gourd.png' },
  'bamboo-crossbow-turret': { name: '竹弩机关', rarity: '稀有', description: '部署自动索敌的竹弩台，Lv.3 起同时部署两台', preview: '升级增加箭伤、射速与机关数量', price: 48, image: 'assets/weapons/bamboo-crossbow-turret.png' },
}

export const isWeaponId = (id: ShopProductId): id is WeaponId => id in weapons
export const isSignatureWeaponId = (id: ShopProductId): id is SignatureWeaponId => id in signatureWeapons
