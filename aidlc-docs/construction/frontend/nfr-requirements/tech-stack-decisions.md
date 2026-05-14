# テックスタック決定（frontend）

| 技術 | バージョン | 選定理由 |
|---|---|---|
| React | 18.3.x | 標準・実績あり |
| TypeScript | 5.4.x | 型安全・IDE補完 |
| Vite | 5.2.x | 高速ビルド・HMR |
| React Router | 6.23.x | 標準的なSPAルーティング |
| axios | 1.7.x | シンプルなHTTPクライアント |
| Tailwind CSS | 3.4.x | ユーティリティファーストCSS・迅速なUI構築 |
| Vitest | 1.6.x | Vite統合テストフレームワーク |
| React Testing Library | 16.x | コンポーネントテスト |

## `package.json` 依存関係

```json
{
  "dependencies": {
    "axios": "1.7.2",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "6.23.1"
  },
  "devDependencies": {
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "@vitejs/plugin-react": "4.3.0",
    "autoprefixer": "10.4.19",
    "postcss": "8.4.38",
    "tailwindcss": "3.4.4",
    "typescript": "5.4.5",
    "vite": "5.2.13",
    "vitest": "1.6.0",
    "@testing-library/react": "16.0.0",
    "@testing-library/jest-dom": "6.4.6",
    "@testing-library/user-event": "14.5.2",
    "jsdom": "24.1.0"
  }
}
```
