// Speak Native AIプロキシ (Cloudflare Worker)
//
// 環境変数(Cloudflareダッシュボード > Workers > Settings > Variables and Secrets)
//   GEMINI_KEY / CLAUDE_API_KEY / OPENAI_API_KEY : 各APIキー (Secret)
//   ALLOWED_ORIGINS : 許可するOrigin。カンマ区切りで複数可
//                     例) https://ユーザー名.github.io,http://localhost:8080
//                     ※ 空だと誰でも呼べます。公開するなら必ず設定
//   APP_TOKEN       : (任意) 設定するとヘッダ X-App-Token が一致しないリクエストを拒否 (Secret)
//   CLAUDE_MODEL / OPENAI_MODEL : (任意) モデル名の上書き

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";
const CLAUDE_ENDPOINT = "https://api.anthropic.com/v1/messages";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

const MAX_BODY_CHARS = 32 * 1024;   // リクエスト本文の上限
const MAX_MESSAGES = 40;            // 履歴の最大件数
const MAX_CONTENT_CHARS = 4000;     // 1メッセージの最大文字数
const MAX_OUTPUT_TOKENS = 1024;     // 出力トークンの上限(クライアント指定でも超えない)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const routes = {
      "/gemini-proxy": callGemini,
      "/claude-proxy": callClaude,
      "/openai-proxy": callOpenAI,
    };
    const handler = routes[url.pathname];
    if (!handler) return new Response("Not Found", { status: 404 });

    const allowedList = (env.ALLOWED_ORIGINS || env.ALLOWED_ORIGIN || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, allowedList);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (allowedList.length > 0 && !allowedList.includes(origin)) {
      return jsonError("Forbidden origin", 403, cors);
    }
    if (env.APP_TOKEN && request.headers.get("X-App-Token") !== env.APP_TOKEN) {
      return jsonError("Unauthorized", 401, cors);
    }
    if (request.method !== "POST") return jsonError("Method Not Allowed", 405, cors);

    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) return jsonError("Payload too large", 413, cors);
    let body;
    try { body = JSON.parse(text); }
    catch { return jsonError("Invalid JSON", 400, cors); }

    try {
      return await handler(body, env, cors);
    } catch (e) {
      return jsonError("Upstream request failed", 502, cors);
    }
  },
};

// ---------- Gemini ----------
async function callGemini(body, env, cors) {
  const apiKey = env.GEMINI_KEY || env.GEMINI_API_KEY;
  if (!apiKey) return jsonError("Gemini key is not configured", 500, cors);

  let contents, systemText = "";
  if (Array.isArray(body.messages)) {
    // OpenAI形式で来た場合はGemini形式へ変換 (systemはsystemInstructionへ)
    const msgs = sanitizeMessages(body.messages);
    systemText = msgs.filter(m => m.role === "system").map(m => m.content).join("\n");
    contents = msgs.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  } else if (Array.isArray(body.contents)) {
    // Gemini形式はテキストpartsだけを通す (tools等は受け付けない)
    contents = body.contents.slice(-MAX_MESSAGES).map(c => ({
      role: c && c.role === "model" ? "model" : "user",
      parts: [{ text: String((c && c.parts && c.parts[0] && c.parts[0].text) || "").slice(0, MAX_CONTENT_CHARS) }],
    }));
    systemText = String((body.systemInstruction && body.systemInstruction.parts &&
      body.systemInstruction.parts[0] && body.systemInstruction.parts[0].text) || "").slice(0, MAX_CONTENT_CHARS);
  } else {
    return jsonError("messages or contents required", 400, cors);
  }
  if (contents.length === 0) return jsonError("empty conversation", 400, cors);

  const gc = body.generationConfig || {};
  const geminiBody = {
    contents,
    generationConfig: {
      maxOutputTokens: Math.min(Number(gc.maxOutputTokens) || 512, MAX_OUTPUT_TOKENS),
      temperature: typeof gc.temperature === "number" ? Math.min(Math.max(gc.temperature, 0), 1.5) : 0.7,
      // 2.5-flashのthinkingが出力枠を消費して途中切れ/空返答になるのを防ぎ、応答も速くする
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  if (systemText) geminiBody.systemInstruction = { parts: [{ text: systemText }] };

  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, // キーをURLに載せない
    body: JSON.stringify(geminiBody),
  });
  return passthrough(res, cors);
}

// ---------- Claude ----------
async function callClaude(body, env, cors) {
  if (!env.CLAUDE_API_KEY) return jsonError("Claude key is not configured", 500, cors);
  const msgs = sanitizeMessages(body.messages);
  // Anthropic APIは messages に system ロールを置けないので、system パラメータへ分離する
  const system = msgs.filter(m => m.role === "system").map(m => m.content).join("\n");
  const messages = msgs.filter(m => m.role !== "system");
  if (messages.length === 0) return jsonError("empty conversation", 400, cors);

  const claudeBody = {
    model: env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages,
  };
  if (system) claudeBody.system = system;

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(claudeBody),
  });
  return passthrough(res, cors);
}

// ---------- OpenAI ----------
async function callOpenAI(body, env, cors) {
  if (!env.OPENAI_API_KEY) return jsonError("OpenAI key is not configured", 500, cors);
  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0) return jsonError("empty conversation", 400, cors);

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-4o-mini", messages, max_tokens: 600 }),
  });
  return passthrough(res, cors);
}

// ---------- 共通 ----------
function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-MAX_MESSAGES)
    .filter(m => m && typeof m.content === "string" && ["system", "user", "assistant"].includes(m.role))
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_CHARS) }));
}

function corsHeaders(origin, allowedList) {
  const h = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
    "Vary": "Origin",
  };
  if (allowedList.length === 0) h["Access-Control-Allow-Origin"] = "*";
  else if (allowedList.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

async function passthrough(upstream, cors) {
  const data = await upstream.text();
  return new Response(data, {
    status: upstream.status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// フロントは data.error.message を読むので同じ形で返す
function jsonError(message, status, cors) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}