const { storage } = require('@forge/api');
const { handleCallback, getWebhookCallbackUrl } = require('../lib/oauth');
const { getWorkspaceInfo, registerWebhook } = require('../lib/linear');

exports.handler = async ({ queryParameters }) => {
  try {
    const code = pickFirst(queryParameters?.code);
    const state = pickFirst(queryParameters?.state);
    const error = pickFirst(queryParameters?.error);
    const errorDescription = pickFirst(queryParameters?.error_description);

    if (error) {
      return htmlPage(
        400,
        'Authorization denied',
        `Linear returned an error: <strong>${escapeHtml(error)}</strong>${
          errorDescription ? `<br/>${escapeHtml(errorDescription)}` : ''
        }.<br/><br/>Please return to Confluence and try again.`
      );
    }

    if (!code || !state) {
      return htmlPage(
        400,
        'Missing parameters',
        'The callback URL is missing the <code>code</code> or <code>state</code> parameter. Please retry the connection from Confluence.'
      );
    }

    // Exchange code for tokens (uses stored redirectUri for exact match)
    const { siteId } = await handleCallback(code, state);

    // Best-effort workspace fetch + org mapping for webhook invalidation
    let workspaceName = 'your workspace';
    try {
      const workspace = await getWorkspaceInfo(siteId);
      workspaceName = workspace?.name || workspaceName;
      if (workspace?.id) {
        // Store reverse map so incoming Linear webhooks can resolve back to siteId
        await storage.set(`org_mapping:${workspace.id}`, { siteId, connectedAt: Date.now() });
      }
    } catch (err) {
      console.warn('Post-callback workspace fetch failed (non-fatal):', err.message);
    }

    // Best-effort webhook registration
    try {
      const webhookUrl = await getWebhookCallbackUrl();
      if (webhookUrl && process.env.LINEAR_WEBHOOK_SECRET) {
        await registerWebhook(siteId, webhookUrl, process.env.LINEAR_WEBHOOK_SECRET);
      }
    } catch (err) {
      console.warn('Linear webhook registration failed (non-fatal):', err.message);
    }

    return htmlPage(
      200,
      'Connected!',
      `Successfully connected to Linear workspace: <strong>${escapeHtml(
        workspaceName
      )}</strong>.<br/><br/>You can close this tab and return to the Confluence Linear Configuration page. Click "Refresh Status" there to see the confirmation.`
    );
  } catch (err) {
    // Log only the message, never the full error object - upstream errors may
    // include the OAuth code, tokens, or other sensitive bits in their stack.
    console.error('OAuth callback error:', err?.message || 'unknown error');
    return htmlPage(
      400,
      'Connection failed',
      'We could not complete the connection. Please return to the Linear Configuration page in Confluence and try again. If the problem persists, contact support.'
    );
  }
};

function pickFirst(v) {
  if (v == null) return null;
  return Array.isArray(v) ? v[0] : v;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlPage(statusCode, title, message) {
  return {
    statusCode,
    body: `<!DOCTYPE html>
<html><head><title>Linea - ${escapeHtml(title)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;display:flex;
    justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f5f7;color:#172b4d}
  .card{background:white;border-radius:8px;padding:32px 40px;max-width:520px;
    box-shadow:0 4px 8px -2px rgba(9,30,66,0.25);text-align:center}
  h1{margin:0 0 16px 0;font-size:24px}
  p{color:#44546f;line-height:1.6;margin:0}
  code{background:#f1f2f4;padding:2px 6px;border-radius:3px;font-family:ui-monospace,monospace;font-size:13px}
</style></head>
<body><div class="card"><h1>${escapeHtml(title)}</h1><p>${message}</p></div></body></html>`,
    headers: { 'Content-Type': ['text/html; charset=utf-8'] },
  };
}
