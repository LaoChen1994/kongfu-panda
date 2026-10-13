import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

// 先启动 dev:cloudflare；也可指定已授权的 Cloudflare 试玩地址复用同一检查。
const baseUrl = new URL(process.env.CLOUDFLARE_TEST_URL ?? 'http://127.0.0.1:8787')
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')

test('HTML 可打开且每次重新校验，不加载 Poki SDK', async () => {
  const response = await fetch(baseUrl)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') ?? '', /text\/html/)
  assert.match(response.headers.get('cache-control') ?? '', /max-age=0/)
  assert.match(response.headers.get('cache-control') ?? '', /must-revalidate/)
  const body = await response.text()
  assert.match(body, /id="game"/)
  assert.ok(!body.includes('sdk.poki.com'))
})

test('构建输出的哈希 JS/CSS 可访问，并采用长期缓存', async () => {
  const paths = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1])
  assert.equal(paths.length, 2)
  for (const path of paths) {
    assert.match(path, /\/assets\/index-[\w-]+\.(?:js|css)$/)
    const response = await fetch(new URL(path, baseUrl))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable')
    assert.match(response.headers.get('content-type') ?? '', path.endsWith('.css') ? /text\/css/ : /javascript/)
    await response.arrayBuffer()
  }
})

test('固定文件名 PNG 不采用永久缓存，ETag 命中返回 304', async () => {
  const url = new URL('assets/environments/bamboo-ground.png', baseUrl)
  const response = await fetch(url)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') ?? '', /image\/png/)
  assert.match(response.headers.get('cache-control') ?? '', /max-age=0/)
  assert.ok(!response.headers.get('cache-control')?.includes('immutable'))
  const etag = response.headers.get('etag')
  assert.ok(etag)
  await response.arrayBuffer()
  const cached = await fetch(url, { headers: { 'If-None-Match': etag } })
  assert.equal(cached.status, 304)
})

test('缺失资源返回 404，不回退成游戏 HTML', async () => {
  const response = await fetch(new URL('assets/cloudflare-missing-resource.png', baseUrl))
  assert.equal(response.status, 404)
  assert.ok(!(await response.text()).includes('id="game"'))
})
