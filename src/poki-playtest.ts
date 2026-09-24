import type { PokiSDK } from './poki.js'

// 仅由 DEV 分支动态加载，生产构建不包含该测试面板或模拟 SDK。
const panel = document.createElement('aside')
panel.id = 'poki-test-panel'
panel.style.cssText = 'position:fixed;bottom:0;left:0;z-index:1000;background:#fff;color:#111;padding:4px;font:14px sans-serif;max-width:100%'
const log = document.createElement('output')
const complete = document.createElement('button')
const fail = document.createElement('button')
complete.textContent = 'Complete test ad'
fail.textContent = 'Fail test ad'
complete.hidden = fail.hidden = true
panel.append(log, complete, fail)
document.body.append(panel)
export const sdk: PokiSDK = {
  init: async () => {
    if (new URLSearchParams(location.search).get('playtest-poki') === 'init-failure') throw new Error('Test initialization failure')
    log.textContent += 'init '
  },
  gameLoadingFinished: () => { log.textContent += 'loaded ' },
  gameplayStart: () => { log.textContent += 'start ' },
  gameplayStop: () => { log.textContent += 'stop ' },
  commercialBreak: () => {
    log.textContent += 'ad '
    complete.hidden = fail.hidden = false
    return new Promise<void>((resolve, reject) => {
      complete.onclick = () => { complete.hidden = fail.hidden = true; resolve() }
      fail.onclick = () => { complete.hidden = fail.hidden = true; reject(new Error('Test ad failure')) }
    })
  },
}
