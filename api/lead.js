// Art Lego LLC lead capture endpoint.
// Primary: GHL contact upsert with tag "website lead" (GHL_API_KEY = pit-... token,
// GHL_LOCATION_ID) -- fires the "Website Lead - Notify Client" workflow (Contact Tag
// trigger) in the Art Lego LLC sub-account.
// Secondary: GHL inbound webhook (GHL_WEBHOOK_URL), if ever configured.
// Fallback: Supabase `site_leads` table (SUPABASE_URL + SUPABASE_ANON_KEY).
// If nothing is configured, returns a real, honest non-200 -- never fakes success.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
  }
  payload = payload || {};

  const record = {
    name: payload.name || null,
    business: 'Art Lego LLC',
    phone: payload.phone || null,
    email: payload.email || null,
    need: payload.need || payload.service || null,
    message: payload.message || null,
    source: 'art-lego-site',
    page: payload.page || null,
    user_agent: req.headers['user-agent'] || null
  };

  const ghlKey = process.env.GHL_API_KEY;
  const ghlLocation = process.env.GHL_LOCATION_ID;
  const ghlUrl = process.env.GHL_WEBHOOK_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  let delivered = false;
  const errors = [];

  if (ghlKey && ghlLocation) {
    try {
      const r = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + ghlKey,
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          locationId: ghlLocation,
          name: record.name,
          phone: record.phone,
          email: record.email,
          tags: ['website lead'],
          source: 'art-lego-site.vercel.app'
        })
      });
      if (r.ok) {
        delivered = true;
      } else {
        errors.push('ghl_upsert_status_' + r.status);
      }
    } catch (e) {
      errors.push('ghl_upsert_error_' + e.message);
    }
  }

  if (!delivered && ghlUrl) {
    try {
      const r = await fetch(ghlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (r.ok) {
        delivered = true;
      } else {
        errors.push('ghl_webhook_status_' + r.status);
      }
    } catch (e) {
      errors.push('ghl_webhook_error_' + e.message);
    }
  }

  if (!delivered && supabaseUrl && supabaseKey) {
    try {
      const r = await fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/site_leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(record)
      });
      if (r.ok) {
        delivered = true;
      } else {
        errors.push('supabase_status_' + r.status);
      }
    } catch (e) {
      errors.push('supabase_error_' + e.message);
    }
  }

  // Owner SMS notify via Blooio direct API (bypasses GHL's per-location provider,
  // which is not wired in client subs -- same failure mode as GRV / Green Diamond).
  // Never blocks the lead: fire-and-log regardless of outcome.
  const blooioKey = process.env.BLOOIO_API_KEY;
  const blooioTo = process.env.BLOOIO_NOTIFY_TO;
  let smsOk = false;
  const forceFail = req.headers['x-debug'] === 'summit' && payload.force_blooio_fail === true;
  if (delivered && blooioKey && blooioTo && !forceFail) {
    try {
      const smsText = 'New website lead for Art Lego LLC! Name: ' + (record.name || 'n/a') +
        ' Phone: ' + (record.phone || 'n/a') + ' Email: ' + (record.email || 'n/a') +
        ' Need: ' + (record.need || 'n/a');
      const r = await fetch('https://api.blooio.com/v2/api/chats/' + encodeURIComponent(blooioTo) + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + blooioKey },
        body: JSON.stringify({ text: smsText })
      });
      if (r.ok) { smsOk = true; } else { errors.push('blooio_notify_status_' + r.status); }
    } catch (e) {
      errors.push('blooio_notify_error_' + e.message);
    }
  }

  // Global rule (locked by operator 2026-08-18): if a lead lands and the Blooio SMS
  // did NOT fire, a loud Telegram alert goes to the Summit ops group so no lead is
  // ever silently missed. Never blocks the lead.
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (delivered && !smsOk && tgToken && tgChat) {
    try {
      const alert = '\u{1F6A8}\u{1F6A8} WEBSITE LEAD — SMS NOTIFY FAILED \u{1F6A8}\u{1F6A8}\n' +
        'Client: Art Lego LLC (art-lego-site.vercel.app)\n' +
        'Name: ' + (record.name || 'n/a') + '\nPhone: ' + (record.phone || 'n/a') +
        '\nEmail: ' + (record.email || 'n/a') + '\nNeed: ' + (record.need || 'n/a') +
        '\nBlooio error: ' + (errors.join('; ') || 'skipped') +
        '\nLead IS saved — notify the client manually NOW.';
      const r = await fetch('https://api.telegram.org/bot' + tgToken + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChat, text: alert })
      });
      if (!r.ok) { errors.push('telegram_alert_status_' + r.status); }
    } catch (e) {
      errors.push('telegram_alert_error_' + e.message);
    }
  }

  if (!delivered) {
    res.status(502).json({
      ok: false,
      error: 'no_lead_destination_configured',
      detail: errors.length ? errors : ['GHL_API_KEY/GHL_LOCATION_ID, GHL_WEBHOOK_URL, and SUPABASE_* are all unset in this deployment']
    });
    return;
  }

  if (errors.length) { console.error('lead notify errors:', errors.join('; ')); }
  res.status(200).json(
    req.headers['x-debug'] === 'summit' ? { ok: true, detail: errors } : { ok: true }
  );
};
