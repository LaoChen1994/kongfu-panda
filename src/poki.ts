export interface PokiSDK {
  init(): Promise<void>
  gameLoadingFinished(): void
  gameplayStart(): void
  gameplayStop(): void
  commercialBreak(): Promise<void>
}

declare global {
  interface Window { PokiSDK?: PokiSDK }
}

// 平台状态独立于战斗规则；事件失败不会改变本局数值或阻止游玩。
export class PokiSession {
  private sdk?: PokiSDK
  private playing = false
  private loaded = false
  adPending = false

  async initialize(enabled: boolean, sdk?: PokiSDK): Promise<void> {
    if (!enabled) return
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      if (!sdk) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js'
          script.async = true
          script.onload = () => { clearTimeout(timeout); resolve() }
          script.onerror = () => { clearTimeout(timeout); reject(new Error('SDK unavailable')) }
          timeout = setTimeout(() => { script.remove(); reject(new Error('SDK load timeout')) }, 5000)
          document.head.append(script)
        })
        sdk = window.PokiSDK
      }
      if (!sdk) return
      await Promise.race([
        sdk.init(),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('SDK init timeout')), 5000) }),
      ])
      this.sdk = sdk
    } catch {
      this.sdk = undefined
    } finally {
      clearTimeout(timeout)
    }
  }

  loadingFinished(): void {
    if (!this.sdk || this.loaded) return
    try {
      this.sdk.gameLoadingFinished()
      this.loaded = true
    } catch { this.sdk = undefined }
  }

  setPlaying(active: boolean): void {
    if (!this.sdk || !this.loaded || this.adPending || active === this.playing) return
    try {
      if (active) this.sdk.gameplayStart()
      else this.sdk.gameplayStop()
      this.playing = active
    } catch { this.sdk = undefined }
  }

  async commercialBreak(): Promise<void> {
    if (!this.sdk || this.adPending) return
    this.setPlaying(false)
    this.adPending = true
    try {
      await this.sdk?.commercialBreak()
    } catch {
      // 没有广告或请求失败时继续游戏，不显示自定义广告拦截提示。
    } finally {
      this.adPending = false
    }
  }
}
