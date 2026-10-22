# Vibha Makeover — hosted booking dashboard

A Vercel-ready project based on your existing luxury editorial website. Customers submit the public booking form; Vercel stores enquiries in Supabase; Mom signs in at `/admin.html` to view and update bookings. Optional WhatsApp alerts are sent through the official Meta WhatsApp Cloud API.

## 1. Create Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it.
3. In **Project Settings → API**, copy the Project URL and the **service_role** key. Keep the service-role key secret.
4. In **Authentication → Users**, add/create Mom's user with her email and a strong password. If email confirmation is enabled, complete confirmation.
5. Open that user and copy its UUID. In SQL Editor run this, replacing the placeholder with the actual UUID:

```sql
insert into public.app_admins (id) values ('PASTE_MOMS_AUTH_USER_UUID_HERE');
```

Only a user whose UUID is in `app_admins` can read/update bookings. Do not expose the service-role key to the browser.

## 2. Configure the dashboard browser keys

Open `public/admin.html` and replace:

```js
const SUPABASE_URL='YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY='YOUR_SUPABASE_ANON_KEY';
```

with your Supabase Project URL and **anon/public** key. These two values are safe to use in a browser when RLS is configured. Never use the service-role key here.

## 3. Deploy to Vercel

1. Put this folder in a private GitHub repository, then import it in https://vercel.com/new, or use the Vercel CLI.
2. In Vercel Project → Settings → Environment Variables add:
   - `SUPABASE_URL` = project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (server only)
   - `SITE_URL` = deployed origin, e.g. `https://your-project.vercel.app`
3. Redeploy after setting variables.
4. Test `/` by submitting a test enquiry, then open `/admin.html` and sign in as Mom.

## 4. Enable WhatsApp notifications (optional)

Set these environment variables in Vercel, then redeploy:

- `WHATSAPP_TOKEN` — Meta Cloud API access token
- `WHATSAPP_PHONE_NUMBER_ID` — sender phone-number ID from Meta
- `WHATSAPP_RECIPIENT` — Mom's WhatsApp number, international digits only (example: `916200919043`)
- `GRAPH_API_VERSION` — a currently supported version shown in Meta's Graph API documentation, formatted `vXX.X`
- `WHATSAPP_TEMPLATE_NAME` — defaults to `vibha_booking_alert`
- `WHATSAPP_TEMPLATE_LANGUAGE` — defaults to `en`

Create and get approval for a WhatsApp message template named `vibha_booking_alert`, language English (`en`), with **five body placeholders** in this order:

```text
New Vibha Makeover booking enquiry
Customer: {{1}}
Phone: {{2}}
Occasion: {{3}}
Event date: {{4}}
Details: {{5}}
Please contact the customer to confirm availability.
```

Match the template name, language and five placeholders exactly. Meta may require a business setup and approved template for business-initiated notifications. A booking is saved even if WhatsApp notification fails; inspect Vercel function logs for delivery/API errors. API acceptance is not proof of delivery.

Official docs: https://developers.facebook.com/docs/whatsapp/cloud-api/

## Security and launch checklist

- Keep the Supabase service-role key and WhatsApp token only in Vercel server environment variables.
- Use a strong unique password for Mom's admin account. Disable public user signups in Supabase Auth if they are not needed.
- RLS is enabled. Do not create public select/insert policies on bookings.
- The public form includes a honeypot and basic server-side validation. Before advertising the site widely, add a managed rate limit / CAPTCHA to protect the public endpoint from spam.
- Test status updates and confirm an ordinary unauthorised account cannot read booking rows.
- Current dashboard is polling/manual refresh, not live push; tap Refresh bookings to reload.
