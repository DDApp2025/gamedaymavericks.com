# Gameday Mavericks - Card Shop Website

Static e-commerce site for **Gameday Mavericks Sports Cards & TCG** (Las Vegas, NV).
Built with Jekyll + vanilla JavaScript, hosted on GitHub Pages. Cart uses
`localStorage`; checkout runs in a safe **demo mode** until a real Stripe account
is connected.

- **Live (testing):** https://ddapp2025.github.io/gamedaymavericks.com/
- **Repo:** https://github.com/DDApp2025/gamedaymavericks.com
- **Future custom domain:** gamedaymavericks.com

---

## 1. Project overview

| Area | Choice |
| --- | --- |
| Static site generator | Jekyll (built into GitHub Pages, no local install needed) |
| Scripting | Vanilla JavaScript (no frameworks, no build tools, no npm) |
| Cart | `localStorage` (key: `gm_cart`) |
| Checkout | Stripe Checkout, currently in DEMO MODE |
| Styling | One stylesheet: `assets/css/styles.css` |

Key files:

```
_config.yml              Site + business config, Stripe demo flag
_data/nav.yml            Navigation tree (mega-menu)
_data/products.yml       All products (demo seed data)
_data/services.yml       Buy/Sell/Trade/Grade blocks
_includes/               header, nav, footer, product-card, logo, icon
_layouts/                default, category, product
assets/css/styles.css    All styling
assets/js/cart.js        Cart logic + UI
assets/js/checkout.js    Demo/real Stripe routing
assets/js/nav.js         Mobile menu, drawer, newsletter
index.html               Homepage
cart.html                Cart
checkout-demo.html       Fake Stripe checkout (demo mode)
success.html             Order confirmation (clears cart)
cancel.html              Cancelled checkout
about.html, services.html
collections/             Category landing pages
products/                One file per product (detail pages)
```

> **Note on the folder name:** the local folder is `gamedaymaverics.com`
> (missing a `k`). The GitHub repo and the live domain use the correct spelling,
> `gamedaymavericks`. This is intentional and already handled in `_config.yml`.

---

## 2. Local preview (optional)

You do **not** need this to deploy. GitHub Pages builds the site automatically.
To preview locally you need Ruby + Bundler:

```bash
gem install bundler
bundle install
bundle exec jekyll serve
# open http://localhost:4000/gamedaymavericks.com/
```

---

## 3. How to add a new product

Edit `_data/products.yml` and add an entry (copy an existing one):

```yaml
- id: prod_013                       # unique, also the cart key
  title: "2024 Bowman Baseball Hobby Box"
  group: sports                      # sports | pokemon | tcg | supplies
  category: baseball                 # collection slug (baseball, football, pokemon, supplies, ...)
  type: sealed                       # sealed | graded | single | supplies
  price: 199.99
  image: /assets/images/products/baseball.svg
  badge: "SEALED"                    # SEALED | GRADED | SINGLE | SUPPLIES
  grade: ""                          # optional, e.g. "PSA 10" (shows a chip)
  stock: 6                           # 3 or fewer shows an "Only N left" note
  featured: true                     # true -> appears in homepage Featured grid
  description: "Factory sealed hobby box..."
  stripe_price_id: "price_DEMO_013"  # replace with real price_... when going live
```

Then create the detail page `products/prod_013.html`:

```yaml
---
layout: product
permalink: /products/prod_013/
product_id: prod_013
title: "2024 Bowman Baseball Hobby Box"
---
```

Commit and push. The card appears automatically on the matching collection pages.
Product images: drop a real image in `assets/images/products/` and point `image:`
at it, or reuse one of the placeholder SVGs already there.

---

## 4. How to add a new page

Create an `.html` file with front matter:

```yaml
---
layout: default
permalink: /my-page/
title: My Page
---
<section class="gm-section"><div class="gm-container">
  <h1>Hello</h1>
</div></section>
```

Commit and push. Link to it with `{{ '/my-page/' | relative_url }}`.

---

## 5. How to add a new nav item

Edit `_data/nav.yml`. Top-level item:

```yaml
  - title: Memorabilia
    url: /collections/memorabilia/
```

Item with a dropdown:

```yaml
  - title: Sports
    url: /collections/sports/
    children:
      - { title: Wrestling, url: /collections/wrestling/ }
```

URLs are root-relative; the site prepends the correct base path automatically.

---

## 6. How to flip from Stripe DEMO MODE to real Stripe

Right now `checkout.js` reads `stripe.demo_mode` from `_config.yml`. When it is
`true`, the Checkout button goes to `/checkout-demo/` (a visual imitation that
charges nothing). To go live:

1. **Create a Stripe account** at https://stripe.com and finish activation.
2. **Get your publishable key** (Dashboard > Developers > API keys). It starts
   with `pk_live_` (or `pk_test_` while testing).
3. **Create a Product + Price** in Stripe for each item (Dashboard > Products).
   Copy each **Price ID** (starts with `price_...`).
4. **Paste each Price ID** into the matching product in `_data/products.yml`
   (`stripe_price_id:`), replacing the `price_DEMO_xxx` placeholder.
5. **Edit `_config.yml`:**
   ```yaml
   stripe:
     demo_mode: false
     publishable_key: "pk_live_your_real_key"
   ```
6. **Enable client-only Checkout** in Stripe: Dashboard > Settings > Checkout
   and payment, turn on "client-only integration", and add your site domain to
   the allowed domains.
7. **Commit and push.** The Checkout button now sends customers to real Stripe
   Checkout, returning them to `/success/` or `/cancel/`.

> Client-only Stripe Checkout requires that every line item has a real Price ID.
> `checkout.js` will warn (and not proceed) if any item is still on a `price_DEMO`
> placeholder.

---

## 7. How to point a custom domain (gamedaymavericks.com)

GitHub Pages currently serves the site under a sub-path
(`/gamedaymavericks.com/`), so `_config.yml` has:

```yaml
url: "https://ddapp2025.github.io"
baseurl: "/gamedaymavericks.com"
```

When you connect the custom domain (served at the root), do **all** of these:

1. **Add a `CNAME` file** at the repo root containing one line:
   ```
   gamedaymavericks.com
   ```
2. **Update `_config.yml`** so the base path is the root:
   ```yaml
   url: "https://gamedaymavericks.com"
   baseurl: ""
   ```
3. **Configure DNS** at your registrar:
   - Apex domain `gamedaymavericks.com` -> four `A` records pointing to
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www` subdomain -> `CNAME` to `ddapp2025.github.io`
4. **Repo Settings > Pages**: set the custom domain and enable
   "Enforce HTTPS" once the certificate is issued.
5. Commit and push. Internal links use the `relative_url` filter, so changing
   `baseurl` updates every link automatically.

---

## Editing common content

- **Business info** (phone, address, hours, Instagram, free-shipping threshold):
  `_config.yml` under `business:`.
- **Colors / fonts / spacing:** CSS variables at the top of
  `assets/css/styles.css`.
- **Logo:** `_includes/logo.svg` (used inline) and `assets/images/logo.svg`
  (standalone). Both are pure vector.
- **Testimonials and shop photos** on the homepage/about page are placeholders;
  replace the copy and swap the placeholder SVGs in `assets/images/` for real
  photos when ready.
