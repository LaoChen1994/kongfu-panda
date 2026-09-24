import { PokiSession, type PokiSDK } from './poki.js'

const events: string[] = []
let finishAd: (() => void) | undefined
const sdk: PokiSDK = {
  init: async () => { events.push('init') },
  gameLoadingFinished: () => { events.push('loaded') },
  gameplayStart: () => { events.push('start') },
  gameplayStop: () => { events.push('stop') },
  commercialBreak: () => {
    events.push('ad')
    return new Promise<void>((resolve) => { finishAd = resolve })
  },
}
const session = new PokiSession()
await session.initialize(true, sdk)
session.setPlaying(true)
session.loadingFinished()
session.loadingFinished()
session.setPlaying(true)
session.setPlaying(true)
session.setPlaying(false)
session.setPlaying(false)
session.setPlaying(true)
const ad = session.commercialBreak()
if (!session.adPending) throw new Error('Ad must lock platform events before awaiting')
session.setPlaying(true)
session.setPlaying(false)
await session.commercialBreak()
if (events.join(',') !== 'init,loaded,start,stop,start,stop,ad') throw new Error(`Invalid lifecycle: ${events}`)
finishAd?.()
await ad
if (session.adPending) throw new Error('Ad lock must clear')
session.setPlaying(true)
if (events.at(-1) !== 'start') throw new Error('Resume must emit start')

const failedAd = new PokiSession()
await failedAd.initialize(true, { ...sdk, commercialBreak: async () => { throw new Error('No ad') } })
failedAd.loadingFinished()
await failedAd.commercialBreak()
if (failedAd.adPending) throw new Error('Failed ad must not lock game')
failedAd.setPlaying(true)
if (events.at(-1) !== 'start') throw new Error('Failed ad must allow resume')

const beforeFailure = events.length
const failedInit = new PokiSession()
await failedInit.initialize(true, { ...sdk, init: async () => { throw new Error('Blocked') } })
failedInit.loadingFinished()
failedInit.setPlaying(true)
await failedInit.commercialBreak()
const pages = new PokiSession()
await pages.initialize(false, sdk)
pages.loadingFinished()
pages.setPlaying(true)
await pages.commercialBreak()
if (events.length !== beforeFailure) throw new Error('Failed init and Pages must not send SDK events')
console.log('poki ok: lifecycle ordering, deduplication, ad locking, failure fallback, Pages isolation')
