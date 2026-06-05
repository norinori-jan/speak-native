# speak-native

> 日本語を考えずに英語が出てくるようになる、個人用英語イマージョンPWA

外資系企業への就職・入社後を見据えた実戦英語習得ツール。  
iPhone Safari で完結。Claude API + Google Sheets でバックエンドレス。

-----

## リポジトリ構成

speak-native/
├── index.html
├── gas/
│   └── Code.js
├── docs/
│   └── ROADMAP.md
└── README.md

-----

## 技術スタック

|要素    |技術                                     |備考                     |
|------|---------------------------------------|-----------------------|
|UI    |HTML / CSS / Vanilla JS                |Single-file, Safari PWA|
|AI会話  |Claude API (\claude-sonnet-4-20250514\)|Free Talk              |
|音声入力  |Web Speech API                         |iOS Safari対応           |
|音声出力  |Web Speech Synthesis API               |shadowing・瞬間英作文        |
|データ保存 |localStorage                           |オフライン動作                |
|クラウド同期|Google Apps Script + Sheets            |無料・無サーバー               |

-----

## 現在の機能（v1.0）

- Free Talk
- Shadowing
- 瞬間英作文
- 単語帳
- 進捗グラフ
- Google Sheets同期

-----

## セットアップ

### 1. クローン

git clone https://github.com/norinori-jan/speak-native.git

### 2. iPhone Safari で開く

index.html をSafariで開く  
「ホーム画面に追加」でPWA化

### 3. Claude API キーを設定

sk-ant-... を入力して Save  
localStorage に保存される

### 4. Google Sheets 連携

gas/Code.js を script.google.com に貼り付け  
ウェブアプリとしてデプロイ  
URL をアプリに保存

-----

## ライセンス

Private — 個人利用のみ
