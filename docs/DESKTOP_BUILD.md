# Tauri 桌面试玩版

本阶段对应 GDD 18.5.5，首先在 macOS Apple Silicon 验证。应用内置 Phaser 游戏与全部资源，不依赖开发服务器或 Poki SDK。

## 开发与打包

需要 Node.js 20.19 或更新兼容版本、pnpm 10.33.4、Rust 1.90 或更新版本。macOS 还需要 Xcode Command Line Tools。依赖按 Tauri 官方前置环境说明安装。本轮只处理 Web、Poki 与 macOS，Windows 构建和验收暂不接入。

```sh
pnpm install --frozen-lockfile
pnpm desktop:dev
```

开发服务固定为 `http://127.0.0.1:1420`。端口占用时会直接报错，避免应用打开其他服务。

### 独立构建入口

| 命令 | 内容 | 输出 |
| --- | --- | --- |
| `pnpm build:web` | 默认浏览器 / GitHub Pages | `dist/` |
| `pnpm build:poki` | Poki 前端，启用既有 SDK 接入 | `dist-poki/` |
| `pnpm build:desktop` | 离线桌面前端，不生成原生应用 | `dist-desktop/` |
| `pnpm build:mac` | 当前 Mac 架构的原生应用与磁盘镜像 | `.app`、`.dmg` |

三个前端构建先执行生产与测试类型检查，再调用 Vite。macOS 入口由 Tauri 先执行 `build:desktop`，再编译 Rust 并生成安装产物；不重复维护一套前端命令，也不需要额外 Node 包装脚本。单元测试仍独立执行 `pnpm test`，构建成功不等于单测、真人试玩或平台审核通过。

`pnpm build` 保留为 `build:web` 的兼容入口。`desktop:dev`、`desktop:build` 保留原有 Tauri 开发和自定义打包用途。

### macOS 本地包

```sh
pnpm build:mac
```

在当前 Apple Silicon Mac 上，应用输出到 `src-tauri/target/release/bundle/macos/Bamboo Guardians.app`，DMG 输出到 `src-tauri/target/release/bundle/dmg/`，文件名包含产品名、应用版本和架构。命令需在 macOS 运行，不承诺在其他系统交叉生成安装包；Intel Mac 和 universal 包不属于本轮验证范围。只需要 `.app` 时可使用原有 `pnpm desktop:build --bundles app`。

打包不会创建 GitHub Release、上传安装包或启用自动更新。Pages 合入 main 后仍按现有 workflow 发布，只把构建入口改为 `build:web`。本地版本尚未进行开发者身份签名和公证，不作为已完成公开分发的安装包。自动更新和商店发布另行接入。

macOS 配置使用 `signingIdentity: "-"`，在打包时生成完整 ad-hoc 本地签名，封装应用与资源，而不是只依赖链接器的临时签名。这不提供开发者身份或公证，也不保证下载后绕过 Gatekeeper 提示；不修改系统安全设置。[Tauri ad-hoc 签名说明](https://v2.tauri.app/distribute/sign/macos/#ad-hoc-signing)

安装包版本来自 `src-tauri/tauri.conf.json`，当前为 `0.1.0`，与 Cargo 包版本一致；根 `package.json` 的 `1.0.0` 是前端包元数据，本轮不改变或自动递增任何版本。

若本机完整 Xcode 无法加载，而独立 Command Line Tools 可用，可只为该次命令设置 `DEVELOPER_DIR=/Library/Developer/CommandLineTools`，不需要修改系统的 `xcode-select`。本次验证的 Rust 工具链位于被忽略的 `artifacts/toolchains/`，未修改全局 Rust 或 shell 配置。

## 操作与记录

- WASD / 方向键移动，空格闪避，ESC 暂停。macOS 使用系统绿色窗口按钮进入全屏。
- 默认窗口 1280×720，最小内容区 960×540。画布保持 16:9，其他比例居中留边。
- 语言、设置、引导与战绩由应用 WebView 持久保存；浏览器和开发服务器记录不会自动迁入正式应用。
- 当前单局不保存，退出后重新开局。应用更新时保持 identifier `com.laochen1994.bamboo-guardians`，避免切换存储身份。
- Pages 使用 `pnpm build:web`（兼容 `pnpm build`）；Poki 使用 `pnpm build:poki`；桌面前端输出为 `dist-desktop/`。

## 验收重点

真实 `.app` 启动、离线资源加载、三名角色选人、中英文、移动与闪避、升级/商城、暂停恢复、窗口缩放/全屏、关闭重开后的设置与战绩。浏览器截图不能替代 WebKit 原生应用验证。

2026-10-03 构建入口验证：Web、Poki、桌面前端及旧 `build` 入口通过；macOS arm64 应用与 DMG 生成，`codesign --verify --deep --strict` 和 `hdiutil verify` 通过。原生选人页可打开，但本次后台自动化中开局加载停在 28%，并出现窗口控制异常，原因未确认，战斗试玩不计通过。完整本机玩法、其他 Mac、下载后的 Gatekeeper 和公开分发仍需单独验收。

官方参考：[前置环境](https://v2.tauri.app/start/prerequisites/)、[Vite 集成](https://v2.tauri.app/start/frontend/vite/)、[macOS 分发](https://v2.tauri.app/distribute/macos-application-bundle/)。
