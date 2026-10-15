# Project plan – Hippostina

## Initial idea

### Project overview

**Short description of the project (elevator pitch)**

A test version of a web shop for Hippostina, run by the artist Stina, who currently sells her paintings at horse shows and on Facebook. Customers have asked to be able to order a painting instead of buying it on site, so this project builds her a live online shop where paintings can be listed, ordered, and automatically marked as sold, whether purchased online or elsewhere. Stina manages her paintings herself through a secure admin login with full CRUD functionality (create, edit, delete/archive, upload images). The project is built in Stripe test mode, so the full purchase flow, checkout, payment, and order confirmation, works end to end without real payments, and is designed so it could go live with minimal changes if Stina decides to use it for real.

**Name of the project**

Hippostina

### Tech stack and architecture

**Frontend:** Angular, I chose angular specifically to learn as a new technology because it is relevant to the upcoming internship, which uses Angular.

**Backend, database, auth, storage, webhooks:** Supabase (Postgres database, Supabase Auth for the admin login, Supabase Storage for painting images, Supabase Edge Functions for the Stripe webhook)

**Payments:** Stripe Checkout (test mode during the project), I chose stripe so that card data never touches the application directly.

**Hosting:** Cloudflare Workers with static assets (free, allows commercial use). Cloudflare now recommends Workers over Pages for new projects.

**Resend:** Used for order confirmation/receipt to the customer and order notification/receipt to Admin

**Figma:** Used for design

The exam project itself is this test version, it is built so that switching to a live, fully functioning shop later (real payments, a custom domain, and live hosting) would be a small, well-documented step rather than a rebuild, but going live is outside the scope of the exam project. If there is time left, and Stina wants the shop to go live before the deadline, that is a realistic extra goal, not something that requires rebuilding the project, since the architecture is designed with that transition in mind from the start.

### MoSCoW

**Must**
- Information about the artist, contact information
- Public gallery and product page showing available paintings, with information (price, size, name)
- Secure admin login
- CRUD for paintings
- A painting automatically disappears from the shop once sold (online or marked as sold elsewhere by Admin)
- Stripe Checkout integration (test mode) for ordering a painting
- Automatic status handling for paintings (available/reserved/sold) via Stripe webhook
- Order confirmation email and receipt to customer and notification email and receipt to Admin
- Basic order overview for the admin login
- Terms of purchase, right of withdrawal (14 days), and privacy policy pages (draft text)
- Pickup choice if the painting is ordered
- Deployed
- Responsive design

**Should**
- Shipping option (fixed price per size category)
- Marking an order as "shipped" with a tracking number, triggering a customer email
- Rate limiting / basic bot protection on checkout-related functions

**Could**
- Going live with real Stripe keys, a custom domain, and real business information for Stina, as a stretch goal if time permits and Stina chooses to proceed before the deadline
- Print-on-demand integration for posters/prints
- Automated shipping label booking via a carrier API

**Won't**
- Customer accounts / login for buyers
- Custom-built payment processing (no handling of raw card data)

### AI

**How will you use AI in your project? (Tools, methods etc)**

AI will be used throughout the project in a few distinct ways:

**Planning and research:** Used to think through architecture choices, compare hosting/database/payment options, and understand new concepts.

**Daily development support / agent mode:** Used as a coding assistant for implementation, debugging, and working through unfamiliar Angular and Supabase patterns, under my own direction and review.

**Code review and security:** Used to help review code for bugs and security, though all suggestions are verified manually and against official documentation rather than trusted blindly for full security.

I will have CLAUDE.md file that will be kept in the root as persistent context for the AI coding assistant (tech stack, key architectural decisions, coding conventions), reducing repeated context-setting.

## Detailed plan

### MVP

- Admin logs in to a secure admin page and can create, edit, archive and delete paintings, including image upload.
- Visitors can see the artist information, contact information, a gallery of available paintings and a product page (name, price, size, image).
- A customer can order a painting with Stripe Checkout (test mode) and choose pickup.
- When the payment is done, a webhook sets the painting to "sold" and it disappears from the shop. Admin can also mark a painting as sold elsewhere.
- The customer gets an order confirmation with a receipt by email, and Admin gets a notification with a receipt.
- Admin can see all orders in an order overview in the admin page.
- Pages for terms of purchase, right of withdrawal and privacy policy exist (draft text).
- The site is responsive and deployed.

### Definition of Done

- All Must items in the MoSCoW list work in the deployed version.
- A full purchase has been tested end to end with Stripe test cards (successful payment, cancelled payment, expired session).
- The webhook checks the Stripe signature and handles duplicate events safely.
- Row Level Security is checked: a visitor who is not logged in as admin can only read available paintings and cannot change any data.
- No secrets are in the repository. All keys are in environment variables.
- The site works on mobile and desktop.
- The README explains how to run the project and includes a go-live checklist.
- Stina has tried the admin page and the shop, and her feedback is documented.
- The AI documentation and personal evaluation are written.
- Should items are done if time allows.

### System architecture

The system has three main parts:

- **Frontend (Angular, on Cloudflare Workers):** the shop that customers see and the admin page.
- **Supabase:** the database, the admin login, image storage and server functions.
- **Stripe:** the payment page where the customer pays.

How a purchase works:

1. The customer clicks "Buy" on a painting.
2. A Supabase function reserves the painting and creates a Stripe Checkout session.
3. The customer pays with Stripe.
4. Stripe tells a second Supabase function (webhook) that the payment is done.
5. That function sets the painting to "sold", saves the order and sends emails with Resend.

Main choices:

- **Angular:** new technology for me and used at my internship.
- **Supabase:** database, login, storage and server functions in one place, so no separate backend is needed.
- **Stripe Checkout:** card data never touches my application.
- **Reservation:** a painting is reserved when checkout starts, so two customers cannot buy the same painting.
- **Archive instead of delete:** old orders can still point to the painting.
- **Environment variables:** all keys and URLs are stored there, so going live means changing settings, not code.
- **Cloudflare Workers (static assets):** free, allows commercial use, and no move is needed if the shop goes live.

### Sprint plan

**Sprint 1 (week 1): Foundation**
- Goal: set up everything and test the hardest parts early.
- Create repo, CLAUDE.md, Angular project and Supabase project
- Create database tables and security rules
- Deploy an empty app to Cloudflare Workers
- Make the design in Figma
- Admin login (Must)
- Small test of a Supabase function with Stripe test mode

**Sprint 2 (week 2): Paintings and gallery**
- Goal: Stina can manage paintings and visitors can see them.
- CRUD for paintings with image upload (Must)
- Public gallery and product page (Must)
- Artist and contact page (Must)

**Sprint 3 (week 3): Purchase flow**
- Goal: a customer can buy a painting in test mode.
- Checkout session and reservation (Must)
- Stripe Checkout in test mode (Must)
- Webhook and automatic status handling (Must)
- Painting disappears when sold (Must)
- "Mark as sold elsewhere" in admin (Must)
- Pickup choice (Must)

**Sprint 4 (week 4): Emails, orders and polish**
- Goal: complete all Must items.
- Order confirmation and receipts with Resend (Must)
- Order overview in admin (Must)
- Terms, withdrawal and privacy pages (Must)
- Responsive design (Must)
- Tests
- Show the shop to Stina and collect feedback

**Sprint 5 (week 5): Buffer and documentation**
- Goal: fix problems, finish Should items and write documentation.
- Fix bugs
- Shipping option and shipped email with tracking number (Should)
- Rate limiting (Should)
- README, go-live checklist, AI documentation and personal evaluation
- Going live only if time and Stina allow (Could)

### Risks and mitigations

**Angular is new and takes longer than planned**
- Mitigation: test the basics in sprint 1, keep the design simple, use the docs and AI as support.
- Plan B: I would talk to my teacher.

**Supabase pauses the free project when it is not used**
- Mitigation: a scheduled ping with GitHub Actions keeps the project active.
- Plan B: upgrade to Supabase Pro, which does not pause projects.

**Resend only sends to my own email until a domain is verified**
- Mitigation: use my own email as the customer email in the demo.
- Plan B: verify a domain, or show the order confirmation on a page in the shop instead of only by email.

**Wrong security rules (RLS) let visitors change data**
- Mitigation: test as a logged-out user, review the rules, and check them against the docs with AI as a second check.
- Plan B: move all database changes into Edge Functions, so the frontend cannot change data directly.

**Two customers try to buy the same painting**
- Mitigation: a reservation status that expires after a time. Test with two browser tabs.
- Plan B: the first payment wins.

**Not enough time**
- Mitigation: follow MoSCoW, drop Should and Could items first, and keep week 5 as buffer.
- Plan B: build a simpler version without online payment. The customer reserves a painting in the shop, and Stina contacts them to arrange payment and pickup.

**Legal texts are not correct for a real shop**
- Mitigation: write the texts as drafts, based on the checklists from Konsumentverket.
- Plan B: if the texts are not approved by Stina, the shop stays in test mode. Going live is only a Could.

**Bot traffic on checkout**
- Mitigation: Cloudflare's free protection, reservations that expire automatically, and rate limiting (Should).
- Plan B: add a CAPTCHA (for example Cloudflare Turnstile) to the checkout, or turn off checkout until the problem is solved.
