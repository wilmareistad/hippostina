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

## Order emails sent only once (#63)

Tested 2026-11-03 on the deployed `stripe-webhook` function, Stripe test mode, with `stripe listen`.
Retries were sent with `stripe events resend`. Failures were forced by changing `ADMIN_EMAIL` and
`EMAIL_FROM` with `supabase secrets`. Result shows what was observed in the emails received.

| # | Test case | Expected | Result |
|---|---|---|---|
| 1 | Normal purchase | Customer and admin email both arrive | Not recorded |
| 2 | Repeated event after both emails were sent | No new email | Pass |
| 3 | `customer_email_sent_at` and `admin_email_sent_at` cleared within 24 hours, event sent again | The Resend idempotency key stops a new email | Pass |
| 4 | `ADMIN_EMAIL` not set during purchase | Only the customer email arrives | Pass |
| 5 | Test 4's event sent again with `ADMIN_EMAIL` restored | Only the admin email arrives | Pass |
| 6 | `EMAIL_FROM` not set during purchase | No email arrives | Pass |
| 7 | Two resends of one event at the same time, after a purchase with `EMAIL_FROM` not set and the value restored | One customer email and one admin email, no duplicates | Pass |
| 8 | `ADMIN_EMAIL` set to an address Resend refuses during purchase, restored, event sent again | Only the customer email arrives at first; the admin email arrives after the retry, so the refused send did not block the key | Pass |
| 9 | Logged-out update of `orders` (REST API with the publishable key, all-zero id) | Refused (`401`, `42501`) | Pass |

**Not tested:** what happens to the idempotency key after a `5xx` error from Resend, and Stripe's automatic
retries. It was not recorded if test 7's two requests overlapped, so it does not prove the behavior when
two events really run at the same time. The painting's status after a failed email was not recorded per test.

**Note:** a changed secret may take a few minutes to reach the function, so wait before testing again.

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

## Legal pages (#65)

Tests 1–2 were run 2026-11-04 on `feature/legalPages` with `ng serve` on localhost.
Tests 3–5 were run 2026-11-10 on the deployed site.

| # | Test case | Expected | Result |
|---|---|---|---|
| 1 | Unit tests and build | `ng test --watch=false`: 83 tests pass; `ng build` finishes without errors | Pass |
| 2 | `/kopvillkor` at 1280 px and `/integritetspolicy` at 500 px (screenshots) | Readable, draft notice shown, no sideways scrolling | Pass |
| 3 | Footer on mobile and desktop, with the links clicked | Copyright and links are stacked on mobile and on one row on desktop; each link opens its page at the top | Pass |
| 4 | "Läs köpvillkor och ångerrätt här" on the product page, on mobile and desktop | Link is under the buy button and opens `/kopvillkor`; Back returns to the painting | Pass |
| 5 | External links (Allmänna reklamationsnämnden, IMY, Konsumentverket's withdrawal form) in a browser | Each opens the right page | Pass |
| 6 | Stina reads the texts and fills in the placeholders | Texts approved, draft notice removed | Not run |

**Known limitations:** the texts are drafts and not legally reviewed. The withdrawal function and the
withdrawal form in the order confirmation are not built, see `docs/go-live-checklist.md`.

## Order emails and order overview on the deployed site (#67)

Tested 2026-11-05 on the deployed site, Stripe test mode. A repeated event is already covered by test 2 in #63.

| # | Test case | Expected | Result |
|---|---|---|---|
| 1 | Successful payment | Customer and admin email both arrive, with correct order number, date, painting, delivery and total; the admin email also has the customer's name and email | Pass |
| 2 | Cancelled payment | No email | Pass |
| 3 | Expired session (`stripe checkout sessions expire`) | No email | Pass |
| 4 | Order overview after test 1 | The order is shown, with the same order number as in the emails | Pass |
| 5 | Logged-out read of `orders` (REST API with the publishable key) | Refused (`401`, `42501`), and no order data | Pass |
| 6 | Logged-out upload to and delete from the painting image bucket (Storage API with the publishable key) | Both refused (`AccessDenied`); the upload did not create a file and the deleted file is still in `storage.objects` | Pass |
| 7 | Shop and admin pages on mobile and desktop | Pages work and are readable; no sideways scrolling of the page | Pass |
