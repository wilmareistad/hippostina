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

## Admin order overview and admin layout (#64)

Tested 2026-11-03 with `ng serve` on localhost against the Supabase project, logged in as the admin.
The deployed site and the order emails themselves are tested in #67.

| # | Test case | Expected | Result |
|---|---|---|---|
| 1 | Unit tests and build | `ng test --watch=false`: 74 tests pass; `ng build` finishes without errors | Pass |
| 2 | Logged-out visitor opens `/admin/ordrar` (incognito) | Redirected to `/admin/logga-in` | Pass |
| 3 | Logged-out read of `orders` (REST API with the publishable key) | `401`, and no order data | Pass |
| 4 | Login page | "Tillbaka till hemsidan" goes to the start page; logging in goes to `/admin` | Pass |
| 5 | Overview compared with `orders` in SQL Editor | Same rows, newest first; same date in Swedish time, customer, amount and delivery; empty name shows "Ej angivet" | Pass |
| 6 | Order number | Same as in the order email for that order | Pass |
| 7 | Email warnings (`customer_email_sent_at` and `admin_email_sent_at` cleared on a test order, then restored) | The row names the missing email; both columns empty count as one order in the summary; no warning when both are set | Pass |
| 8 | Fetched columns (Network tab) | Response has no `shipping_address`, `stripe_session_id` or `painting_id`; `painting` has only `title` | Pass |
| 9 | Failed read (request to `orders` blocked in DevTools) | "Kunde inte hämta ordrarna. Försök igen." | Pass |
| 10 | Painting actions in the new layout | New, edit, archive, restore, mark as sold, undo and permanent delete still work; new and edit open `/admin/tavlor/...` | Pass |
| 11 | Log out | Goes to the start page; the browser's Back button leads to the login page, not to admin | Pass |
| 12 | Narrow window | Admin menu works; the order table scrolls sideways, the rest of the page does not | Pass |
| 13 | Shop pages `/` and `/malningar` after the shared header change | Header looks as before in desktop and mobile width | Pass |

**Not tested in the browser:** the message for no orders, since that would need all orders to be deleted.
It is covered by a unit test.

**Known limitations:** the title comes from `paintings`, so a renamed painting shows its new title in the
overview. Orders from before #63 show the email warning, since their columns are empty.
