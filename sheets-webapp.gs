/**
 * Google Apps Script — receives one contact submission from the Cloudflare Pages
 * function (functions/api/contact.js) and appends it as a row to a private Sheet.
 *
 * This is the ONLY code that writes to the Sheet. It authenticates every request
 * with a shared secret, and it neutralises spreadsheet formula injection so a
 * value like "=IMPORTDATA(...)" can never execute inside your Sheet.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * SETUP (about 5 minutes)
 * ────────────────────────────────────────────────────────────────────────────
 * 1. Create a Google Sheet in a COMPANY-controlled Google account (2FA on).
 *    Share it with named teammates only — never "anyone with the link".
 * 2. In that Sheet: Extensions → Apps Script. Delete the sample code and paste
 *    this whole file in. Save.
 * 3. Set the shared secret WITHOUT hardcoding it in the script:
 *      Project Settings (gear icon) → Script Properties → Add script property
 *      Property:  SHARED_SECRET
 *      Value:     <the same string you set as SHEETS_SHARED_SECRET in Cloudflare>
 * 4. Deploy → New deployment → type "Web app".
 *      Description:      contact-form intake
 *      Execute as:       Me
 *      Who has access:   Anyone
 *    (It must be "Anyone" so the server can POST without a Google login; the
 *     shared secret is what actually guards it. The Sheet itself stays private.)
 * 5. Click Deploy, authorize when prompted, and COPY the Web app URL
 *    (looks like https://script.google.com/macros/s/AKfy.../exec).
 *    Put that URL in Cloudflare as the SHEETS_WEBAPP_URL env var.
 *
 * To change the code later, edit and then Deploy → Manage deployments → edit
 * (pencil) → New version, so the same /exec URL keeps working.
 */

// Column order written to the Sheet. Add a matching header row yourself if you
// want labels at the top.
var COLUMNS = [
  "timestamp",
  "name",
  "email",
  "company",
  "projectType",
  "acreage",
  "projectSize",
  "energyUsage",
  "message",
];

function doPost(e) {
  try {
    var expected = PropertiesService.getScriptProperties().getProperty("SHARED_SECRET");
    if (!expected) {
      return json_({ ok: false, error: "not_configured" });
    }

    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    if (!body.secret || body.secret !== expected) {
      return json_({ ok: false, error: "forbidden" });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var row = COLUMNS.map(function (key) {
      return safeCell_(body[key]);
    });
    sheet.appendRow(row);

    return json_({ ok: true });
  } catch (err) {
    // Never echo the payload; a generic status is enough.
    return json_({ ok: false, error: "server_error" });
  }
}

/**
 * Formula-injection guard: a cell whose text starts with = + - @ (or tab / CR)
 * can be executed by Sheets as a formula. Prefix such values with an apostrophe
 * so they are stored as literal text. Also caps length as a final safety net.
 */
function safeCell_(value) {
  if (value === null || value === undefined) return "";
  var str = String(value).slice(0, 5000);
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
