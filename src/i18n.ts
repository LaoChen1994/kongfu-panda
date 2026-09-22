import { english } from './translations.js'

export type Locale = 'zh-CN' | 'en'
export let locale: Locale = 'en'

// 只记录启动时的静态节点。动态 UI 替换节点后，这些旧节点不会再被翻译覆盖。
const staticText: Array<{ node: Text; source: string }> = []
const staticAttributes: Array<{ node: Element; attribute: string; source: string }> = []
if (typeof document !== 'undefined') {
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node instanceof Text && /[\u3400-\u9fff]/.test(node.data) && !node.parentElement?.closest('[data-language]')) staticText.push({ node, source: node.data })
  }
  for (const node of document.querySelectorAll('[alt], [aria-label]')) {
    for (const attribute of ['alt', 'aria-label']) {
      const source = node.getAttribute(attribute)
      if (source && /[\u3400-\u9fff]/.test(source) && source !== 'Language / 语言') staticAttributes.push({ node, attribute, source })
    }
  }
}

export const resolveLocale = (saved: string | null, browserLanguage: string): Locale => {
  if (saved === 'zh-CN' || saved === 'en') return saved
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export const setLocale = (value: Locale): void => { locale = value }

export const t = (source: string, ...values: Array<string | number>): string => {
  const template = locale === 'en' ? english[source] ?? source : source
  return template.replace(/\{(\d+)\}/g, (placeholder, index: string) => String(values[Number(index)] ?? placeholder))
}

export const applyStaticTranslations = (): void => {
  document.documentElement.lang = locale
  for (const { node, source } of staticText) {
    if (node.isConnected) node.data = source.replace(source.trim(), t(source.trim()))
  }
  for (const { node, attribute, source } of staticAttributes) {
    if (node.isConnected) node.setAttribute(attribute, t(source))
  }
}
