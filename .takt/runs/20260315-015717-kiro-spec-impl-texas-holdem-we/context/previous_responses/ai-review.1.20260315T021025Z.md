All facts verified. Now let me produce the review report.

---

## AI Antipattern Review — 初回レビュー

### 判定: **REJECT**

ブロッキング問題が3件検出されました。

---

### ブロッキング問題

#### AI-REVIEW-001 [new] — フォールバック値の濫用（テストが常にパスする）

**ファイル:** `src/App.test.tsx:12`

**問題:** `document.body.querySelector('#root')?.parentElement ?? document.body` でフォールバックに `document.body` を使用しているため、`#root` 要素が存在しなくても `document.body` は常に truthy であり、`expect(...).toBeTruthy()` は絶対に失敗しない。テストとして機能していない。

これはAIが「もっともらしいが検証していない」テストを生成する典型的なパターン。

**修正案:**
```typescript
test('should render without crashing', () => {
  const { container } = render(<App />)
  expect(container.firstChild).toBeTruthy()
})
```
`render()` が例外なく成功し、DOMに要素が存在することを直接検証する。

---

#### AI-REVIEW-002 [new] — 未使用の依存パッケージ（`@testing-library/jest-dom`）

**ファイル:** `package.json:18`

**問題:** `@testing-library/jest-dom` が devDependencies に含まれているが、プロジェクト内のどのテストファイルでもインポートされておらず、jest-dom マッチャー（`toBeInTheDocument()`, `toHaveTextContent()` 等）も一切使用されていない。grep で `src/` 内に `jest-dom` の参照はゼロ件。

AIがテンプレートから「念のため」含めた未使用コード。

**修正案:** `@testing-library/jest-dom` を devDependencies から削除する。将来必要になった時点で追加すればよい。

---

#### AI-REVIEW-003 [new] — 配線忘れ（lint スクリプトに対応する依存がない）

**ファイル:** `package.json:9`

**問題:** `"lint": "eslint ."` スクリプトが定義されているが、`eslint` は dependencies にも devDependencies にも含まれておらず、`node_modules/eslint` も存在しない。`npm run lint` を実行すると失敗する。

Viteテンプレートのデモコード除去時に、eslint関連パッケージは除去したがスクリプト定義だけ残した、AIの典型的な配線忘れパターン。

**修正案:** `lint` スクリプトを `package.json` の `scripts` から削除する。eslint はタスク1のスコープ外であり、必要になった時点でパッケージとスクリプトを一緒に追加すべき。

---

### 非ブロッキング（参考情報）

#### [INFO] `.gitignore` に `dist/` が未登録

**ファイル:** `.gitignore`（変更対象外ファイル）

`dist/` ディレクトリ（ビルド成果物）が `.gitignore` に含まれていない。プロジェクト初期化時に追加するのが望ましい。変更対象外ファイルのため記録のみ。

---

### 検出なし（確認済み項目）

| 観点 | 結果 |
|------|------|
| 幻覚API / 存在しないメソッド | 問題なし — `@tailwindcss/vite`, `vitest/config`, `createRoot` 等すべて正当 |
| スコープクリープ | 問題なし — タスク1.1+1.2の範囲に収まっている |
| スコープ縮小 | 問題なし — 計画で宣言した全ファイルが作成されている |
| 過剰エンジニアリング | 問題なし — 最小限の実装 |
| `any` 型の使用 | なし |
| TODO コメント | なし |
| useEffect 使用 | なし（CLAUDE.local.md 準拠） |
| エラーの握りつぶし | なし — `main.tsx` で `throw new Error` を適切に使用 |
| 既存パターンとの整合性 | グリーンフィールドのため該当なし |