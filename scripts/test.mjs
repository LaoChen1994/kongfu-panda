import { rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectDirectory = fileURLToPath(new URL('../', import.meta.url))
// 只清理本项目生成的测试输出，避免已移动或删除的测试继续执行。
rmSync(new URL('../.test-dist/', import.meta.url), { recursive: true, force: true })
const compilation = spawnSync(process.execPath, [
  fileURLToPath(new URL('bin/tsc', import.meta.resolve('typescript/package.json'))),
  '-p', 'tsconfig.test.json', '--outDir', '.test-dist', '--noEmit', 'false', '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
], { cwd: projectDirectory, stdio: 'inherit' })
if (compilation.error) throw compilation.error
if (compilation.status !== 0) process.exit(compilation.status ?? 1)

const tests = spawnSync(process.execPath, ['--test', '.test-dist'], { cwd: projectDirectory, stdio: 'inherit' })
if (tests.error) throw tests.error
process.exitCode = tests.status ?? 1
