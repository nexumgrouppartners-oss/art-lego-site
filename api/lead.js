// Art Lego LLC lead capture endpoint.
// Primary: GHL contact upsert with tag "website lead" (GHL_API_KEY = pit-... token,
// GHL_LOCATION_ID) -- fires the "Website Lead - Notify Client" workflow (Contact Tag
// trigger) in the Art Lego LLC sub-account.
// Secondary: GHL inbound webhook (GHL_WEBHOOK_URL), if ever configured.
// Fallback: Supabase `site_leads` table (SUPABASE_URL + SUPABASE_ANON_KEY).
// If nothing is configured, returns a real, honest non-200 -- never fakes success.

// Contact note: the lead's need + message + page go onto the GHL contact as a note, so the CRM
// record (and the GHL owner-notify workflow) carries what the visitor asked for. Never blocks the lead.
async function addGhlNote(ghlKey, contactId, record, errors) {
  if (!contactId) { errors.push('ghl_note_skipped_no_contact_id'); return; }
  const lines = [
    'Website lead via ' + record.source,
    'Need: ' + (record.need || record.program || 'n/a'),
    'Message: ' + (record.message || 'n/a'),
    'Page: ' + (record.page || 'n/a')
  ];
  try {
    const r = await fetch('https://services.leadconnectorhq.com/contacts/' + encodeURIComponent(contactId) + '/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ghlKey, 'Version': '2021-07-28' },
      body: JSON.stringify({ body: lines.join('\n') })
    });
    if (!r.ok) { errors.push('ghl_note_status_' + r.status); }
  } catch (e) { errors.push('ghl_note_error_' + e.message); }
}

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
        let j = null;
        try { j = await r.json(); } catch (e) { j = null; }
        await addGhlNote(ghlKey, j && j.contact && j.contact.id, record, errors);
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
        body: JSON.stringify({ ...record, sms_consent: undefined })
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

  // Always mirror to site_leads: its insert trigger posts every lead to Slack #client-leads.
  if (supabaseUrl && supabaseKey) {
    try {
      const r = await fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/site_leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ ...record, sms_consent: undefined })
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

  // Owner notification is NOT sent from this handler. The 'website lead' tag set on the GHL contact above fires
  // the client's GHL workflow (email + SMS via GHL's A2P number). Every lead is also mirrored to public.site_leads,
  // whose insert trigger posts to Slack #client-leads.


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
