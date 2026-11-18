# Cloudflare 网页试玩部署

更新日期：2026-11-18。对应 GDD 18.5.6 / 20.5。复用现有 Web 构建，不改玩法或资源格式；GitHub Pages 保留为备用。

## 部署边界

- 使用 Workers Static Assets，wrangler.json 的 assets.directory 指向 dist；不编写动态 Worker，不配置 run_worker_first，不使用 R2、KV、数据库或平台账号玩法。
- 项目名 kongfu-panda，后台创建时必须与 wrangler.json 的 name 一致。生产入口为 [panda.pidanzz.com](https://panda.pidanzz.com/)，分支预览使用 `https://<preview-name>.panda-dev.pidanzz.com`；具体预览名以 Wrangler 或后台返回的地址为准。
- wrangler.json 同时声明生产和预览自定义域名，并设置 workers_dev=false、preview_urls=false，保持旧 workers.dev 生产和预览入口关闭，避免后续部署重新开启。预览域名设置 enabled=false、previews_enabled=true，仅承载预览；保留 previews 配置与现有 preview 命令。
- 部署工具 Wrangler 4.149.0 仅为项目开发依赖，不全局安装。工具要求 Node 22 或更新版本；.node-version 固定云端 Node 22。pnpm 使用 packageManager 指定的 10.33.4。
- 只有 Vite 生成的 assets/index-*.js / assets/index-*.css 使用一年 immutable 浏览器缓存。HTML 和固定文件名 PNG/动画沿用 Cloudflare 默认的 max-age=0、must-revalidate 与 ETag；平台边缘缓存仍生效。不要给整个 assets 目录永久缓存。
- 不承诺中国大陆实网一定比 GitHub Pages 快；部署后比较相同设备与网络的首次加载、复访和进入战斗时间。

纯静态配置与计费以[官方静态托管文档](https://developers.cloudflare.com/workers/static-assets/)为准；缓存行为见[官方响应头文档](https://developers.cloudflare.com/workers/static-assets/headers/)。

自定义预览域名自动提供 `<preview-name>.panda-dev.pidanzz.com`，根域名 panda-dev.pidanzz.com 不作为生产入口；无需额外声明通配符路由。关闭 workers.dev 预览入口不影响自定义域名预览，参见[官方预览域名配置](https://developers.cloudflare.com/workers/previews/custom-domains/)。

## 本地验证与发布命令

使用 Node 22+ 后运行：

| 命令 | 作用 |
| --- | --- |
| pnpm check:cloudflare | 构建 Web，并 dry-run 检查部署配置；不发布 |
| pnpm dev:cloudflare | 构建并启动本地 Workers 静态服务，默认 127.0.0.1:8787 |
| pnpm test:cloudflare | 对已启动的本地服务检查 HTML、哈希文件缓存、PNG 的 ETag/304 和资源 404 |
| pnpm preview:cloudflare | 测试与构建后上传当前分支预览；属于云端写操作 |
| pnpm deploy:cloudflare | 测试与构建后更新生产站；属于云端写操作 |

本地测试不会登录 Cloudflare，也不会创建资源。生产/预览命令必须先确认目标账号；手动发布时用 Wrangler 官方登录授权，不把 Token 发到聊天或写进仓库。所有需要网络的终端命令先检查并显式 unset HTTP_PROXY、HTTPS_PROXY、ALL_PROXY 及其小写变量。

## 用户配合与 Git 自动发布

1. 用户在 Cloudflare 官方后台自行登录，确认使用的账号。
2. 在 Workers & Pages 创建应用，连接 GitHub 仓库 LaoChen1994/kongfu-panda；新增 GitHub 权限由用户本人确认。只选择本仓库，不授权所有仓库，不开通收费计划。
3. 在代码已经推送并可读取 wrangler.json 后配置下表。本次用户确认首次使用 codex/cloudflare-web 部署试玩；MR 合入 main 后再切换生产分支。不要把尚无部署配置的 main 当作已可自动发布。

| 后台字段 | 值 |
| --- | --- |
| Worker name | kongfu-panda |
| Production branch | 首次 codex/cloudflare-web；合并后改 main |
| Root directory | 仓库根目录 |
| Build command | pnpm test && pnpm build:web |
| Deploy command | pnpm exec wrangler deploy |
| Preview command | pnpm exec wrangler preview |
| Preview builds | 开启非生产分支预览 |
| NODE_VERSION | 22（与 .node-version 一致） |
| PNPM_VERSION | 10.33.4 |

Cloudflare Git 集成管理部署认证，不要求用户发送 API Token。新项目预览使用 Wrangler 4.135.0+ 的 preview 命令及 previews 配置，不套用旧的 versions upload 流程。参见[构建配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)与[预览指南](https://developers.cloudflare.com/workers/previews/get-started/)。

4. 若首建 Git 向导没有分支选择，先通过 Workers 的 Upload your static files 上传当前分支的 dist，再到该 Worker 的 Settings → Builds 连接仓库；在 Branch control 选择 codex/cloudflare-web，不让尚无配置的 main 首次构建。不要使用旧 Pages 的 Direct Upload 流程。
5. 首次线上试玩通过后再合入 main，并把生产分支改为 main，让后续合并自动发布；确认线上入口与提交匹配，再把链接给朋友试玩。
6. 回归三角色、中文/英文、正常战斗、暂停/恢复、升级、商城、结算与手机横屏。首次进入、再次进入及发版后刷新都要验证。
7. 更换域名后，localStorage 战绩和设置与旧 workers.dev、GitHub Pages 及不同预览域名隔离，不会自动迁移；不新增云存档或中途续局。

## 当前验收状态

- 2026-11-18 用户已在后台配置生产域名 panda.pidanzz.com 与预览域名 panda-dev.pidanzz.com，并关闭旧 workers.dev 入口。生产地址已直连验证 HTTPS 200；具体分支预览仍需使用实际生成的地址验收。
- 2026-10-13 首次静态发布已完成，当时使用 kongfu-panda.735849467.workers.dev，现已切换到上述自定义域名。GitHub Pages 继续保留。
- 首次发布时已连接现有 GitHub 集成，生产分支为 codex/cloudflare-web；构建与发布命令、Node 22 和 pnpm 10.33.4 已在后台保存。该记录为首次发布状态；后续生产分支是否切到 main，以后台 Settings → Builds 为准，不能仅凭合并记录确认。
- 本地 Node 20 / Node 22 各 54 项测试通过，Web/Poki/桌面前端构建通过；本地和线上静态 HTTP 回归各 4 项通过，自动发布后再次回归通过。线上中英文选角、石墨加载/战斗/升级/暂停、青团战斗/失败结算和 844×390 横屏选角布局已验证；真机触控仍需用户测试。
- 首次 Git 自动构建在 Linux / Node 22.23.3 被五组原始全状态 SHA 差异拦截。用户确认后，从原实现参考代码受控追加 48 个可移植指纹，保留原始 SHA 和所有业务摘要，补充浮点尾差与真实变化检查；不跳过测试、不改玩法。044eb51 重跑在 Linux 54 项全部通过，构建 #30666ce4 与发布均成功（49 秒）；生产版本 d7855fc8-e2f9-4d24-a0ae-919be783c7ed。
- 首次发布截图和详细记录在 artifacts/agent-loop/cloudflare-web/iteration-01/notes.md。自定义域名在国内手机实网的速度仍需用户在目标网络测量。
