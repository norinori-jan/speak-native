# AI Provider 設計指標（Gemini Flash → Claude Haiku フォールバック）

## 1. モデル構成

|用途|モデル|理由|
|---|---|---|
|メイン|Gemini 2.0 Flash|無料枠・高速・英会話に十分|
|フォールバック|Claude 3 Haiku 4.5|最安・安定|

## 2. localStorage キー

|キー|内容|
|---|---|
|dei_aiProvider|gemini / claude|
|dei_geminiKey|Gemini API キー|
|dei_claudeKey|Claude API キー|

## 3. UI 設計

- Gemini / Claude のタブ切り替え
- デフォルトは Gemini
- 両方のキーがあれば自動フォールバック

## 4. STATE 設計

STATE = {
  aiProvider,
  geminiKey,
  claudeKey,
  history (直近4件)
}

## 5. 履歴管理

- pushHistory() で直近4件のみ保持
- 無料枠節約・高速化・エラー低減

## 6. Gemini 呼び出し

- モデル: gemini-2.0-flash
- maxOutputTokens: 128
- 履歴を Gemini 形式に変換

## 7. Claude Haiku 呼び出し

- モデル: claude-3-haiku-20240307
- max_tokens: 128
- system: 1-2文 + 質問で返す

## 8. フォールバック仕様

- Gemini → Claude の 1回だけ
- triedFallback で無限ループ防止
- dei_aiProvider は変更しない

## 9. sendMessage フロー

1. pushHistory(user)
2. メインで送信
3. 失敗 → Claude で再送
4. pushHistory(assistant)
5. provider / fallbackUsed を返す

## 10. メリット

- 無料枠中心で運用
- 壊れにくい
- 高速
- 保守しやすい
