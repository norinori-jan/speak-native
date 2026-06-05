# アイコン生成ガイド

このディレクトリに以下のアイコンファイルを置いてください：

## 必要なファイル

- **icon-192.png** (192×192px)
- **icon-512.png** (512×512px)

## 生成方法（推奨）

### 方法1: Favicon.io（推奨・最速）
1. https://favicon.io/emoji-favicons/ を開く
2. 検索ボックスに 🎤 を入力（またはマイク絵文字をコピペ）
3. 「Download」をクリック
4. ダウンロードしたファイルを展開
5. `favicon-192x192.png` を `icon-192.png` に名前変更して保存
6. `favicon-512x512.png` を `icon-512.png` に名前変更して保存

### 方法2: Node.js + sharp（ローカル）
```bash
npm install -D sharp jimp canvas
```

その後、以下のスクリプトで自動生成可能：

```javascript
const canvas = require('canvas');
const fs = require('fs');

async function generateIcon(size) {
  const c = canvas.createCanvas(size, size);
  const ctx = c.getContext('2d');
  
  // 背景
  ctx.fillStyle = '#0e0f11';
  ctx.fillRect(0, 0, size, size);
  
  // グラデーション
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#5cefb0');
  grad.addColorStop(1, '#7eb8ff');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size*0.35, 0, Math.PI*2);
  ctx.fill();
  
  // マイク絵文字をテキストで表示
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎤', size/2, size/2);
  
  // ファイル保存
  const buffer = c.toBuffer('image/png');
  fs.writeFileSync(`icon-${size}.png`, buffer);
  console.log(`✓ icon-${size}.png created`);
}

generateIcon(192);
generateIcon(512);
```

### 方法3: オンラインツール
以下のサービスでも生成可能：
- Figma.com - 無料でアイコン作成
- Pixlr.com - シンプルなオンラインエディタ
- PhotoPea.com - Photoshop互換のエディタ

## 既存ファイルの確認

このディレクトリに以下が配置されたら PWA アイコンが有効になります：

```
assets/
└── images/
    ├── icon-192.png
    └── icon-512.png
```

## テスト方法

アイコンが正しく配置されたか確認：
```bash
ls -la assets/images/
# 出力：
# icon-192.png
# icon-512.png
```

## PWA化の確認手順

1. **ブラウザで確認** (Chrome DevTools)
   - F12 → Application → Manifest
   - 「icons」セクションに icon-192.png と icon-512.png が表示されるか確認

2. **iPhone/iPadで確認**
   - Safari で https://norinori-jan.github.io/speak-native/ を開く
   - 共有ボタン（□↑） → 「ホーム画面に追加」
   - アイコンが表示されるか確認

---

🎤 マイク絵文字は speak-native の象徴です。是非使ってください！
