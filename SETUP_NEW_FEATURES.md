# Setup Guide — Activating v6.5.0 Features

The code for all three features is already live once this is deployed.
But three things only fully turn on once you (or your developer)
complete a short one-time setup. Until then, the site works exactly as
before — nothing breaks.

This is written so you can do it yourself, or hand this exact document
to your developer.

---

## 1. Analytics (GA4)

**What you need:** a free Google Analytics 4 property.

1. Go to https://analytics.google.com → Admin (bottom-left gear icon).
2. Click **Create Property** → name it "PackersHub" → fill in your
   business details (country: India, currency: INR) → Create.
3. When asked for a "data stream", choose **Web**, enter
   `https://www.packershub.in`, name it "PackersHub Website".
4. You'll get a **Measurement ID** that looks like `G-XXXXXXXXXX`. Copy it.
5. In Cloudflare Pages dashboard → your `packershub` project → **Settings
   → Environment Variables** → add:
   - Name: `PUBLIC_GA_MEASUREMENT_ID`
   - Value: `G-XXXXXXXXXX` (your real ID)
   - Apply to: Production (and Preview if you want)
6. Re-deploy the site (or trigger a new deployment — env var changes
   need a fresh build to take effect since this is a `PUBLIC_` variable
   baked in at build time).
7. Visit the live site, click around, then check **Reports → Realtime**
   in GA4 — you should see yourself as an active user within a minute.

No other code changes needed — this is the only step.

---

## 2. Lead-Capture Backup + Track Your Move

These two share the same backend piece: a Cloudflare KV namespace.

### Step A — Create the KV namespace
Your developer runs this once from the project folder (needs
`wrangler` CLI logged into your Cloudflare account):

```
wrangler kv:namespace create TRACKING_KV
```

(Note: this project pins `wrangler ^3.90.0`, which uses the `kv:namespace`
colon syntax above. If you've separately upgraded to Wrangler v4+, the
equivalent command is `wrangler kv namespace create TRACKING_KV` without
the colon.)

This prints something like:
```
{ binding = "TRACKING_KV", id = "abcd1234efgh5678..." }
```

### Step B — Bind it
**Option 1 (recommended) — via `wrangler.toml`:**
Open `wrangler.toml` in the project, find this commented-out block near
the top, uncomment it, and paste your real ID:

```toml
[[kv_namespaces]]
binding = "TRACKING_KV"
id = "abcd1234efgh5678..."   # <- paste your real id here
```

**Option 2 — via Cloudflare dashboard (no file edit needed):**
Cloudflare Pages project → **Settings → Functions → KV namespace
bindings** → Add binding → Variable name: `TRACKING_KV` → select the
namespace you created → Save.

### Step C — Re-deploy
Push/deploy again. From this point on:
- Every Booking Engine / Contact / Franchise submission gets a Tracking
  ID stored.
- `/track/` will actually find and display bookings.
- `/admin/orders/` can look up and update them (see Step D below).

### Step D — Set the staff Admin Token
This protects `/admin/orders/` (the page your team uses to update a
booking's status — e.g. "Packing Crew Assigned").

1. Pick a long random string — e.g. generate one at
   https://1password.com/password-generator or just mash the keyboard
   for 24+ characters. Save it somewhere safe (password manager).
2. Cloudflare Pages → **Settings → Environment Variables → Secrets** →
   add:
   - Name: `ADMIN_TOKEN`
   - Value: (your long random string)
3. Re-deploy.
4. Share that token with whoever on your team will update order
   statuses. They open `https://www.packershub.in/admin/orders/`, paste
   the token once into the "Staff Token" box, click Save — it's
   remembered on that device after that.

**Keep this token private** — anyone who has it can update any booking's
status. Don't share it over public channels; send it directly,
one-to-one.

### Optional — Step E: Email backup (Resend)
This is a second, independent backup notification (in addition to KV) —
useful so your team gets an **email** the moment a lead comes in, not
just a WhatsApp message.

1. Sign up free at https://resend.com (free tier covers small volume
   easily).
2. Verify your sending domain (`packershub.in`) following Resend's DNS
   instructions — this takes a few minutes and needs access to your
   domain's DNS settings (wherever packershub.in is registered).
3. Create an API key in Resend's dashboard.
4. Cloudflare Pages → **Settings → Environment Variables → Secrets**:
   - `RESEND_API_KEY` = your Resend API key
   - `LEAD_NOTIFY_EMAIL` = the email address that should receive lead
     notifications (e.g. `info@packershub.in` or your personal email)
5. Re-deploy.

This step is fully optional — leads still get saved to KV without it.

---

## 3. Franchise Page

No backend setup needed — `/franchise/` is live as soon as you deploy.

**One thing to fill in when ready:** the page deliberately does **not**
state any investment amount, royalty percentage, or ROI figures —
those are framed as "discussed on a call" because we don't have your
real, confirmed numbers. Once you've decided on actual terms:

- Open `src/pages/franchise.astro`
- Find the `faqs` array near the top (the answer to "How much investment
  is required?")
- Update the text with your real figures once finalized — your developer
  can help with this in under 5 minutes.

---

## Quick Checklist

| Step | Where | Required for |
|---|---|---|
| [ ] Create GA4 property, get Measurement ID | analytics.google.com | Analytics |
| [ ] Add `PUBLIC_GA_MEASUREMENT_ID` env var | Cloudflare Pages settings | Analytics |
| [ ] Create `TRACKING_KV` namespace | `wrangler` CLI | Tracking + Lead backup |
| [ ] Bind `TRACKING_KV` | `wrangler.toml` or dashboard | Tracking + Lead backup |
| [ ] Set `ADMIN_TOKEN` | Cloudflare Pages secrets | Staff order updates |
| [ ] (Optional) Resend account + API key | resend.com | Email lead backup |
| [ ] (Later) Fill in real franchise investment figures | `franchise.astro` | Franchise page accuracy |

Once the checked items are done and re-deployed, all three features are
fully active — no further code changes required.
