/* ============================================================
   Gameday Mavericks - checkout.js
   Routes the checkout button:
     DEMO MODE (site.stripe.demo_mode: true) -> /checkout-demo/
     LIVE MODE                               -> Stripe Checkout
   The demo path never contacts Stripe and never charges anything.
   ============================================================ */
(function () {
  "use strict";
  var GM = window.GM || {};

  function path(p) { return (GM.baseurl || "") + p; }
  function absUrl(p) { return window.location.origin + path(p); }

  function startCheckout() {
    var cart = (window.GMCart && window.GMCart.getCart()) || [];
    if (!cart.length) {
      if (window.gmToast) window.gmToast("Your cart is empty");
      return;
    }
    if (GM.demoMode) {
      window.location.href = path("/checkout-demo/");
      return;
    }
    realCheckout(cart);
  }

  /* ---- Real Stripe Checkout (client-only) ----
     Requires: site.stripe.publishable_key set, and every product in
     products.yml has a real stripe_price_id (price_...). */
  function realCheckout(cart) {
    var key = GM.publishableKey || "";
    if (!key || key.indexOf("REPLACE") !== -1) {
      alert("Stripe is not configured yet. Set stripe.publishable_key in _config.yml and add real Stripe Price IDs to each product.");
      return;
    }
    var lineItems = cart.map(function (i) {
      return { price: i.stripe_price_id, quantity: i.quantity };
    });
    if (lineItems.some(function (li) { return !li.price || li.price.indexOf("price_DEMO") === 0; })) {
      alert("One or more products are missing a real Stripe Price ID. Update products.yml before going live.");
      return;
    }
    loadStripe(function () {
      var stripe = window.Stripe(key);
      stripe.redirectToCheckout({
        lineItems: lineItems,
        mode: "payment",
        successUrl: absUrl("/success/"),
        cancelUrl: absUrl("/cancel/")
      }).then(function (result) {
        if (result && result.error) alert(result.error.message);
      });
    });
  }

  function loadStripe(cb) {
    if (window.Stripe) { cb(); return; }
    var s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = cb;
    s.onerror = function () { alert("Could not load Stripe. Check your connection."); };
    document.head.appendChild(s);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-checkout]");
    if (!btn) return;
    e.preventDefault();
    startCheckout();
  });

  // Expose for pages that want to trigger checkout programmatically.
  window.GMCheckout = { start: startCheckout, demoMode: !!GM.demoMode };
})();
