import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { describe, expect, test } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..')

const DEBUG_FILES = [
  'debug_common.ts',
  'debug_common.test.ts',
  'debug_game.ts',
  'debug_game2.ts',
  'debug_game3.ts',
] as const

describe('プロジェクト構造: デバッグファイルの不在', () => {
  test('should not have debug files in project root', () => {
    // Given: プロジェクトルート直下のファイル一覧
    const rootFiles = readdirSync(PROJECT_ROOT)

    // When: デバッグファイルが存在するか確認する
    const foundDebugFiles = DEBUG_FILES.filter((debugFile) =>
      rootFiles.includes(debugFile),
    )

    // Then: デバッグファイルが1つも存在しない
    expect(foundDebugFiles).toEqual([])
  })

  test('should not have any debug_*.ts files in project root', () => {
    // Given: プロジェクトルート直下のファイル一覧
    const rootFiles = readdirSync(PROJECT_ROOT)

    // When: debug_ プレフィックスの .ts ファイルを検索する
    const debugPatternFiles = rootFiles.filter(
      (file) => file.startsWith('debug_') && file.endsWith('.ts'),
    )

    // Then: debug_*.ts パターンに一致するファイルが存在しない
    expect(debugPatternFiles).toEqual([])
  })
})

describe('プロジェクト構造: src/ からデバッグファイルへの参照不在', () => {
  function collectTsFiles(dir: string): string[] {
    const results: string[] = []
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        results.push(...collectTsFiles(fullPath))
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
      ) {
        results.push(fullPath)
      }
    }
    return results
  }

  test('should not import debug files from any src/ file', () => {
    // Given: src/ 配下の全 TypeScript ファイル
    const srcDir = join(PROJECT_ROOT, 'src')
    const tsFiles = collectTsFiles(srcDir)

    // When: 各ファイルの内容にデバッグファイルへのインポート参照があるか確認する
    const importPattern = /from\s+['"].*debug_(common|game\d*)['"]/
    const filesWithDebugImports = tsFiles.filter((filePath) => {
      const content = readFileSync(filePath, 'utf-8')
      return importPattern.test(content)
    })

    // Then: デバッグファイルをインポートしているファイルが存在しない
    expect(filesWithDebugImports).toEqual([])
  })
})
