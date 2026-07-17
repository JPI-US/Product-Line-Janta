/**
 * Contact-form backend — Cloudflare Pages Function (POST /api/contact).
 *
 * Privacy posture: this function keeps NOTHING. It validates one submission in
 * memory and fans it out to exactly two destinations, then forgets it:
 *   1. An email to CONTACT_TO via Resend (the source of truth for a lead).
 *   2. A row appended to a private Google Sheet via an Apps Script web app.
 * No database, no KV, no request bodies in logs, no IP / user-agent forwarded.
 *
 * Failure rule: the email is sent FIRST and must succeed — if it fails we return
 * an error so the visitor retries and no lead is lost. The Sheet append is
 * best-effort: if it fails after the email already went out, we still report
 * success (their message reached us) and only note the miss server-side. This is
 * what stops a flaky Sheet from causing duplicate submissions.
 *
 * Env (set in Cloudflare Pages → Settings → Environment variables):
 *   RESEND_API_KEY        secret  — Resend API key (re_...)
 *   SHEETS_WEBAPP_URL     secret  — Apps Script web-app /exec URL
 *   SHEETS_SHARED_SECRET  secret  — must match the constant in sheets-webapp.gs
 *   TURNSTILE_SECRET_KEY  secret  — Cloudflare Turnstile secret key
 *   CONTACT_TO            plain   — inbox for leads (default info@jantaus.com)
 *   CONTACT_FROM          plain   — verified sender (default form@jantaus.com)
 *   SITE_ORIGIN           plain   — allowed origin (default https://jantaus.com)
 */

const DEFAULTS = {
  to: "info@jantaus.com",
  from: "Janta Power Website <form@jantaus.com>",
};

/** Field length caps — anything longer is truncated, never rejected outright. */
const LIMITS = {
  name: 100,
  email: 254,
  company: 120,
  phone: 40,
  projectType: 80,
  acreage: 40,
  projectSize: 40,
  energyUsage: 60,
  message: 5000,
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** Trim, strip control characters, and cap length. Never returns undefined. */
function clean(value, max) {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= LIMITS.email;
}

/** Escape for safe inclusion in the notification email's HTML body. */
function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function verifyTurnstile(token, secret) {
  if (!token) return false;
  try {
    const body = new FormData();
    body.append("secret", secret);
    body.append("response", token);
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Same-origin only: block other sites from POSTing to our endpoint. Compare
  // the Origin header to this function's OWN origin, so it works wherever the
  // site is legitimately served — production, *.pages.dev previews, localhost —
  // with no hardcoded domain. An optional SITE_ORIGIN allows one extra origin
  // (e.g. apex vs www). A missing Origin is allowed through; Turnstile is the
  // real gate behind this cheap check.
  const selfOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== selfOrigin && origin !== env.SITE_ORIGIN) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot: a hidden field real users never see. If it's filled, it's a bot —
  // return a success shape so the bot learns nothing, but do nothing.
  if (clean(payload.website, 200)) {
    return json({ ok: true });
  }

  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("contact: missing TURNSTILE_SECRET_KEY");
    return json({ ok: false, error: "server_error" }, 500);
  }
  const passed = await verifyTurnstile(payload.turnstileToken, secret);
  if (!passed) {
    return json({ ok: false, error: "verification_failed" }, 403);
  }

  const fields = {
    name: clean(payload.name, LIMITS.name),
    email: clean(payload.email, LIMITS.email),
    company: clean(payload.company, LIMITS.company),
    phone: clean(payload.phone, LIMITS.phone),
    projectType: clean(payload.projectType, LIMITS.projectType),
    acreage: clean(payload.acreage, LIMITS.acreage),
    projectSize: clean(payload.projectSize, LIMITS.projectSize),
    energyUsage: clean(payload.energyUsage, LIMITS.energyUsage),
    message: clean(payload.message, LIMITS.message),
  };

  if (!fields.name || !isEmail(fields.email) || !fields.message) {
    return json({ ok: false, error: "invalid_input" }, 422);
  }
  // Contact page (extended form) requires project type; compact footer does not.
  if (payload.extended === true && !fields.projectType) {
    return json({ ok: false, error: "invalid_input" }, 422);
  }

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("contact: missing RESEND_API_KEY");
    return json({ ok: false, error: "server_error" }, 500);
  }

  const rows = [
    ["Name", fields.name],
    ["Email", fields.email],
    ["Company", fields.company],
    ["Phone", fields.phone],
    ["Project type", fields.projectType],
    ["Acreage", fields.acreage],
    ["Project size", fields.projectSize],
    ["Energy usage", fields.energyUsage],
  ].filter(([, v]) => v);

  const htmlRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:2px 12px 2px 0;color:#666">${esc(k)}</td><td>${esc(v)}</td></tr>`,
    )
    .join("");
  const html =
    `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#111">` +
    `<h2 style="margin:0 0 12px">New website inquiry</h2>` +
    `<table style="border-collapse:collapse;margin-bottom:16px">${htmlRows}</table>` +
    `<div style="white-space:pre-wrap;border-top:1px solid #eee;padding-top:12px">${esc(fields.message)}</div>` +
    `</div>`;
  const text =
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${fields.message}`;

  // 1) Email — must succeed, or the lead is lost.
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || DEFAULTS.from,
        to: [env.CONTACT_TO || DEFAULTS.to],
        reply_to: fields.email,
        subject: `Website inquiry from ${fields.name}`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      console.error("contact: resend send failed", res.status);
      return json({ ok: false, error: "send_failed" }, 502);
    }
  } catch {
    console.error("contact: resend threw");
    return json({ ok: false, error: "send_failed" }, 502);
  }

  // 2) Sheet — best-effort. The email already reached us, so never fail here.
  const sheetUrl = env.SHEETS_WEBAPP_URL;
  if (sheetUrl) {
    try {
      await fetch(sheetUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret: env.SHEETS_SHARED_SECRET || "",
          timestamp: new Date().toISOString(),
          ...fields,
        }),
      });
    } catch {
      console.warn("contact: sheet append failed (email delivered)");
    }
  }

  return json({ ok: true });
}
