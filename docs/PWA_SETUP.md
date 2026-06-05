# PWA化ガイド - Speak Native

> 🎤 英語を考えずに話す。iPhone Safari で PWA化完了！

---

## 📋 PWA化チェックリスト

### ✅ Step 1: プロジェクト構造
```
speak-native/
├── index.html              # ✓ PWA メタタグ + SW登録追加
├── package.json            # ✓ スクリプト設定
├── pwa/
│   ├── manifest.json       # ✓ 作成
│   └── service-worker.js   # ✓ 作成
├── assets/
│   └── images/
│       ├── icon-192.png    # ⚠️ 生成必要
│       ├── icon-512.png    # ⚠️ 生成必要
│       └── README.md       # ✓ ガイド作成
└── docs/
    └── ROADMAP.md
```

### ⚠️ Step 2: アイコン生成（必須）

#### 方法A: Favicon.io（推奨・1分で完成）
```bash
# 1. https://favicon.io/emoji-favicons/ を開く
# 2. 🎤 を入力してダウンロード
# 3. 展開して icon-192.png と icon-512.png を assets/images/ に配置
```

#### 方法B: Node.js自動生成（ローカル）
```bash
npm install -D canvas
npm run generate-icons
```

### 📱 Step 3: テスト環境でPWA確認

#### ローカルサーバー起動
```bash
npm run dev
# または
python -m http.server 8000
```

ブラウザ: `http://localhost:8000`

#### Chrome DevTools確認
```
DevTools → Application → Manifest
✓ name, icons, theme_color が表示されるか確認
```

#### スマートフォンでテスト（iOS Safari）
```bash
# 同じWiFi に接続
# Safari で http://[YOUR_IP]:8000 を開く
```

---

## 🚀 Step 4: GitHub Pages デプロイ

### 4.1 リポジトリプッシュ
```bash
git add .
git commit -m "PWA化: manifest + service worker追加"
git push origin main
```

### 4.2 GitHub Pages 有効化
```
GitHub → Settings → Pages
├─ Source: Deploy from a branch
├─ Branch: main / (root)
└─ Save
```

数分待つと以下でアクセス可能：
```
https://norinori-jan.github.io/speak-native/
```

### 4.3 デプロイ確認
```bash
curl -I https://norinori-jan.github.io/speak-native/
# HTTP/2 200 が返れば OK
```

---

## 📲 Step 5: iPhone でホーム画面に追加

### 手順
```
1. Safari で以下を開く：
   https://norinori-jan.github.io/speak-native/

2. 下のツールバー → 共有ボタン（□↑）

3. 「ホーム画面に追加」をタップ

4. 名前確認 → 「追加」

5. ホーム画面に "Speak Native" が追加される！
```

### 起動方法
```
ホーム画面の "Speak Native" アイコン → タップ
→ フルスクリーンで起動（Safariのツールバーなし）
```

---

## 🔍 PWA 機能チェック

### ✓ オフラインサポート
- Service Worker がアセットをキャッシュ
- インターネット未接続時も UI は表示
- API呼び出しはオンライン時のみ

### ✓ インストール可能
- manifest.json で `display: standalone` 設定
- iPhone ホーム画面追加対応

### ✓ キャッシュ戦略
- **App Shell**: Cache-first（高速起動）
- **API**: Network-first（最新データ優先）
- **External**: Network-only（Google Fonts等）

### ✓ 言語別対応
- iOS Safari: ✅ 完全対応
- Android Chrome: ✅ 完全対応
- PC Safari: ⚠️ PWA非対応（ブラウザタブでは動作）

---

## 🎨 PWA カスタマイズ（上級）

### manifest.json の調整

```json
{
  "theme_color": "#5cefb0",      // ステータスバー色
  "background_color": "#0e0f11",  // スプラッシュ画面背景
  "display": "standalone",        // ツールバー非表示
  "orientation": "portrait-primary" // ポートレート固定
}
```

### Service Worker のキャッシュ戦略

```javascript
// 現在の戦略
- App shell (HTML/CSS/JS): Cache-first
- API calls: Network-first  
- External resources: Network-only

// カスタマイズ例：より多くキャッシュ
const CACHE_ASSETS = [
  './assets/images/icon-192.png',
  './assets/images/icon-512.png'
];
```

---

## 📊 PWA 品質確認

### Lighthouse スコア確認
```
Chrome DevTools → Lighthouse
- Performance: 90+
- Best Practices: 90+
- PWA: 90+
```

### Security Headers チェック
```bash
curl -I https://norinori-jan.github.io/speak-native/
# Content-Security-Policy, X-Frame-Options 等を確認
```

---

## 🐛 トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| アイコンが表示されない | icon-192.png/icon-512.png 未配置 | `npm run generate-icons` 実行 |
| PWAが追加できない | manifest.json エラー | DevTools → Manifest タブで確認 |
| キャッシュが古い | Service Worker キャッシュ | Chrome → DevTools → Applications → Clear site data |
| オフラインで白画面 | Service Worker 登録失敗 | DevTools → Application → Service Workers で確認 |

---

## 📚 参考リソース

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google Web Dev: PWA](https://web.dev/progressive-web-apps/)
- [Favicon Generator](https://favicon.io/emoji-favicons/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)

---

## 🎉 完成！

これであなたの Speak Native は完全な PWA です！

```
✅ キャッシュ対応
✅ オフライン動作
✅ iPhone ホーム画面対応
✅ 独立したアプリのように動作
✅ GitHub Pages で全世界に公開
```

Happy Learning! 🚀🎤
