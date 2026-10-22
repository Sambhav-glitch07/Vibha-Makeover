
import { createClient } from '@supabase/supabase-js';

const clean = (value, max = 500) =>
  String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const origin = req.headers.origin;
  const allowed = (process.env.SITE_URL || '').replace(/\/$/, '');

  if (allowed && origin && origin.replace(/\/$/, '') !== allowed) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  const body = req.body || {};

  if (clean(body.company_website, 200)) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, 80);
  const phone = clean(body.phone, 25);
  const event = clean(body.event, 80);
  const date = clean(body.date, 10) || null;
  const message = clean(body.message, 1000);

  if (!name || !phone || !event) {
    return res.status(400).json({
      error: 'Name, phone and occasion are required.'
    });
  }

  if (!/^[+()\-\s\d]{7,25}$/.test(phone)) {
    return res.status(400).json({
      error: 'Enter a valid contact number.'
    });
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      error: 'Enter a valid event date.'
    });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'Booking database is not configured.'
    });
  }

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      name,
      phone,
      event,
      date,
      message: message || null,
      status: 'Pending'
    })
    .select('id')
    .single();

  if (error) {
    console.error('Booking insert failed:', error.message);
    return res.status(500).json({
      error: 'Could not save your booking. Please try again.'
    });
  }

  return res.status(200).json({
    ok: true,
    bookingId: data.id,
    whatsappSent: false
  });
}
