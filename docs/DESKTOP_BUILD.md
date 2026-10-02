# Tauri 桌面试玩版

本阶段对应 GDD 18.5.5，首先在 macOS Apple Silicon 验证。应用内置 Phaser 游戏与全部资源，不依赖开发服务器或 Poki SDK。

## 开发与打包

需要 Node.js、pnpm、Rust 1.90 或更新版本。macOS 还需要 Xcode Command Line Tools；Windows 需要 Microsoft C++ Build Tools 与 WebView2。依赖按 Tauri 官方前置环境说明安装。

```sh
pnpm install --frozen-lockfile
pnpm desktop:dev
```

开发服务固定为 `http://127.0.0.1:1420`。端口占用时会直接报错，避免应用打开其他服务。

```sh
pnpm desktop:build --bundles app
```

macOS 应用输出到 `src-tauri/target/release/bundle/macos/Bamboo Guardians.app`。如需 DMG，可执行 `pnpm desktop:build --bundles dmg`。在 Windows 上执行 `pnpm desktop:build --bundles nsis` 可生成安装程序，但 Windows 产物需要独立真机验收。

本地版本尚未进行开发者签名和公证，不作为已完成公开分发的安装包。自动更新和商店发布另行接入。

若本机完整 Xcode 无法加载，而独立 Command Line Tools 可用，可只为该次命令设置 `DEVELOPER_DIR=/Library/Developer/CommandLineTools`，不需要修改系统的 `xcode-select`。本次验证的 Rust 工具链位于被忽略的 `artifacts/toolchains/`，未修改全局 Rust 或 shell 配置。

## 操作与记录

- WASD / 方向键移动，空格闪避，ESC 暂停。macOS 使用系统绿色窗口按钮进入全屏。
- 默认窗口 1280×720，最小内容区 960×540。画布保持 16:9，其他比例居中留边。
- 语言、设置、引导与战绩由应用 WebView 持久保存；浏览器和开发服务器记录不会自动迁入正式应用。
- 当前单局不保存，退出后重新开局。应用更新时保持 identifier `com.laochen1994.bamboo-guardians`，避免切换存储身份。
- Pages 仍使用 `pnpm build`；Poki 使用 `pnpm exec vite build --mode poki`；桌面构建输出为 `dist-desktop/`。

## 验收重点

真实 `.app` 启动、离线资源加载、三名角色选人、中英文、移动与闪避、升级/商城、暂停恢复、窗口缩放/全屏、关闭重开后的设置与战绩。浏览器截图不能替代 WebKit 原生应用验证。

官方参考：[前置环境](https://v2.tauri.app/start/prerequisites/)、[Vite 集成](https://v2.tauri.app/start/frontend/vite/)、[macOS 分发](https://v2.tauri.app/distribute/macos-application-bundle/)。
