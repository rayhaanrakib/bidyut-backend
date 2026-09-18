import type { Request, Response } from "express";

const oauthSuccess = (_req: Request, res: Response) => {
  const nonce = res.locals.cspNonce;

  res.type("html").send(`
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OAuth Success</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #111;
      color: #eee;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .container {
      width: 100%;
      max-width: 900px;
      padding: 32px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 14px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }

    h2 {
      margin: 0 0 8px;
      color: #4ade80;
      text-align: center;
    }

    .subtitle {
      margin: 0 0 28px;
      color: #999;
      text-align: center;
      font-size: 14px;
    }

    .token-group {
      margin-bottom: 18px;
    }

    .token-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .token-name {
      font-size: 14px;
      font-weight: 600;
      color: #ccc;
    }

    .token-box {
      display: flex;
      gap: 8px;
    }

    .token-input {
      flex: 1;
      min-width: 0;
      padding: 12px;
      background: #0d0d0d;
      color: #ddd;
      border: 1px solid #333;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      outline: none;
    }

    .token-input:focus {
      border-color: #4ade80;
    }

    button {
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      background: #2563eb;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    button:hover {
      background: #1d4ed8;
    }

    button.copied {
      background: #16a34a;
    }

    .copy-all {
      width: 100%;
      margin-top: 8px;
      padding: 13px;
      background: #16a34a;
      font-size: 14px;
    }

    .copy-all:hover {
      background: #15803d;
    }

    .status {
      margin-top: 16px;
      min-height: 20px;
      color: #4ade80;
      text-align: center;
      font-size: 13px;
    }

    @media (max-width: 600px) {
      .container {
        padding: 20px;
      }

      .token-box {
        flex-direction: column;
      }

      .token-input {
        width: 100%;
      }
    }
  </style>
</head>

<body>
  <div class="container">
    <h2>Google Login Successful</h2>
    <p class="subtitle">Copy your tokens for Postman</p>

    <div class="token-group">
      <div class="token-header">
        <span class="token-name">Access Token</span>
      </div>

      <div class="token-box">
        <input
          id="accessToken"
          class="token-input"
          type="text"
          readonly
          placeholder="No access token"
        />
        <button onclick="copyToken('accessToken', this)">
          Copy
        </button>
      </div>
    </div>

    <div class="token-group">
      <div class="token-header">
        <span class="token-name">Refresh Token</span>
      </div>

      <div class="token-box">
        <input
          id="refreshToken"
          class="token-input"
          type="text"
          readonly
          placeholder="No refresh token"
        />
        <button onclick="copyToken('refreshToken', this)">
          Copy
        </button>
      </div>
    </div>

    <div class="token-group">
      <div class="token-header">
        <span class="token-name">Google ID Token</span>
      </div>

      <div class="token-box">
        <input
          id="idToken"
          class="token-input"
          type="text"
          readonly
          placeholder="No ID token"
        />
        <button onclick="copyToken('idToken', this)">
          Copy
        </button>
      </div>
    </div>

    <button class="copy-all" onclick="copyAll()">
      Copy All Tokens
    </button>

    <div id="status" class="status"></div>
  </div>

  <script nonce="${nonce}">
    const params = new URLSearchParams(
      window.location.hash.substring(1)
    );

    const accessToken = params.get("accessToken") || "";
    const refreshToken = params.get("refreshToken") || "";
    const idToken = params.get("idToken") || "";

    document.getElementById("accessToken").value = accessToken;
    document.getElementById("refreshToken").value = refreshToken;
    document.getElementById("idToken").value = idToken;

    async function copyToken(id, button) {
      const input = document.getElementById(id);

      if (!input.value) {
        showStatus("Token is not available.");
        return;
      }

      await navigator.clipboard.writeText(input.value);

      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.classList.add("copied");

      showStatus("Token copied to clipboard.");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 1500);
    }

    async function copyAll() {
      const text =
        "Access Token:\\n" + accessToken +
        "\\n\\nRefresh Token:\\n" + refreshToken +
        "\\n\\nID Token:\\n" + idToken;

      await navigator.clipboard.writeText(text);

      showStatus("All tokens copied to clipboard.");
    }

    function showStatus(message) {
      const status = document.getElementById("status");
      status.textContent = message;

      setTimeout(() => {
        status.textContent = "";
      }, 2000);
    }
  </script>
</body>
</html>
  `);
};

export const authUtils = {
  oauthSuccess,
};
