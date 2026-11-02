# Test report – purchase flow end to end

Final acceptance test of the whole purchase flow on the deployed site
(https://hippostina.wilmareistad.workers.dev), 2026-10-30, Stripe test mode.
Webhook events were forwarded with `stripe listen`. Card: `4242 4242 4242 4242`.

| # | Test case | Expected | Result |
|---|---|---|---|
| 1 | Successful payment | Thanks page; webhook `200`; painting `sold`; one order with `delivery_method = pickup`; painting gone from `/malningar` | Pass |
| 2 | Cancelled payment (Stripe's back link, and the browser Back button) | Cancel page; painting `available` again and back in `/malningar` | Pass |
| 3 | Expired session (`stripe checkout sessions expire`) | Webhook `checkout.session.expired` `200`; painting `available` again | Pass |
| 4 | Two customers, one painting (two tabs) | Second customer gets an error and no Checkout page; admin shows "Reserverad till …" and no archive or mark-as-sold buttons; painting `available` after cancel | Pass |
| 5 | Same webhook event twice (`stripe events resend`) | Still exactly one order; painting still `sold` | Pass |
| 6 | Webhook call with an invalid signature | `400 {"error":"Invalid signature"}`; no data changed | Pass |
| 7 | Admin: mark as sold elsewhere, and undo | Painting moves to "Sålda" and leaves the shop; undo makes it `available` (also when it was archived before); a painting sold online has no undo button | Pass |
| 8 | Logged-out visitor (REST API with the publishable key) | Reading `orders`, inserting, updating and deleting paintings are refused (`401`, `42501`); only `available` paintings can be read | Pass |

**Known limitation:** the gallery and product pages load the paintings once. A painting that becomes
available again (for example after a cancelled checkout) shows up in another open tab only after a reload.
This does not affect safety: the reservation in the database decides who can buy.

**Other testing:** each part (create-checkout, cancel-checkout, the webhook and the pg_cron cleanup) was
also tested on its own while it was built, and the Angular app has unit tests (50, `ng test`).
