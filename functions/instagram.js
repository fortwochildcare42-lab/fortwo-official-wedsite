/**
 * functions/instagram.js
 * Cloudflare Pages Functions — Instagram フィード取得エンドポイント
 *
 * GET /functions/instagram
 *
 * トークン解決の優先順位:
 *   1. KV Namespace「TOKEN_STORE」に保存された最新トークン（自動更新後）
 *   2. Pages 環境変数「INSTAGRAM_TOKEN」（初回 or KV 未設定時）
 */
export async function onRequest(context) {
  /* ── トークン解決 ─────────────────────────── */
  let token = null;

  // 1. KV から最新トークンを取得（TOKEN_STORE バインディングが設定されている場合）
  if (context.env.TOKEN_STORE) {
    try {
      token = await context.env.TOKEN_STORE.get('instagram:access_token');
    } catch {
      // KV 取得失敗は無視して次のフォールバックへ
    }
  }

  // 2. フォールバック: Pages 環境変数
  if (!token) {
    token = context.env.INSTAGRAM_TOKEN ?? null;
  }

  if (!token) {
    return errorResponse('Token not configured.', 500);
  }

  /* ── Instagram Graph API 呼び出し ────────── */
  const userId = '28608678982054469';
  const fields = [
    'id',
    'media_type',
    'media_url',
    'thumbnail_url', // 動画のサムネイル
    'permalink',
    'caption',
    'timestamp',
  ].join(',');

  const apiUrl = new URL(`https://graph.instagram.com/${userId}/media`);
  apiUrl.searchParams.set('fields',       fields);
  apiUrl.searchParams.set('limit',        '12');
  apiUrl.searchParams.set('access_token', token);

  let res, json;
  try {
    res  = await fetch(apiUrl.toString());
    json = await res.json();
  } catch (err) {
    return errorResponse(`Network error: ${err.message}`, 502);
  }

  /* ── エラーハンドリング ───────────────────── */
  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    const code = json.error?.code;

    // トークン期限切れ（コード 190）は 401 を返してクライアントに通知
    const status = code === 190 ? 401 : 502;
    return errorResponse(`Instagram API error: ${msg}`, status);
  }

  /* ── 正常レスポンス ───────────────────────── */
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: {
      'Content-Type' : 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      // CORS（必要に応じてオリジンを限定）
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/* ── ヘルパー ────────────────────────────────── */
function errorResponse(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
