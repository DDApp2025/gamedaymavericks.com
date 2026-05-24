/* ============================================================
   Gameday Mavericks - cart.js
   Cart state (localStorage) + UI wiring. No dependencies.
   Public API exposed on window.GMCart and window.gmToast.
   ============================================================ */
(function () {
  "use strict";

  var KEY = "gm_cart";
  var GM = window.GM || {};
  var SHIPPING_FLAT = 6.99;                       // demo flat shipping
  var FREE_OVER = Number(GM.freeShipping || 99);  // free shipping threshold
  var SYMBOL = GM.currency || "$";

  /* ---------- storage helpers ---------- */
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }
  function write(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("gm:cartchange"));
  }

  /* ---------- money ---------- */
  function money(n) { return SYMBOL + Number(n || 0).toFixed(2); }

  /* ---------- core API ---------- */
  function getCart() { return read(); }

  function getCartCount() {
    return read().reduce(function (n, i) { return n + (i.quantity || 0); }, 0);
  }

  function getCartTotal() { // subtotal of items
    return read().reduce(function (s, i) { return s + (Number(i.price) * (i.quantity || 0)); }, 0);
  }

  function getShipping() {
    var sub = getCartTotal();
    if (sub <= 0) return 0;
    return sub >= FREE_OVER ? 0 : SHIPPING_FLAT;
  }

  function getGrandTotal() { return getCartTotal() + getShipping(); }

  function addToCart(product, qty) {
    if (!product || !product.id) return;
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var cart = read();
    var stock = product.stock != null ? Number(product.stock) : Infinity;
    var existing = cart.filter(function (i) { return i.id === product.id; })[0];
    if (existing) {
      existing.quantity = Math.min(stock, (existing.quantity || 0) + qty);
    } else {
      cart.push({
        id: product.id,
        title: product.title || "",
        price: Number(product.price) || 0,
        image: product.image || "",
        quantity: Math.min(stock, qty),
        stripe_price_id: product.stripe_price_id || "",
        stock: isFinite(stock) ? stock : null
      });
    }
    write(cart);
  }

  function removeFromCart(id) {
    write(read().filter(function (i) { return i.id !== id; }));
  }

  function updateQuantity(id, qty) {
    qty = parseInt(qty, 10) || 0;
    var cart = read();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        if (qty <= 0) { cart.splice(i, 1); }
        else {
          var max = cart[i].stock ? Number(cart[i].stock) : Infinity;
          cart[i].quantity = Math.min(max, qty);
        }
        break;
      }
    }
    write(cart);
  }

  function clearCart() { write([]); }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    // force reflow so the transition runs on repeated calls
    void el.offsetWidth;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("is-visible");
    }, 2200);
  }

  /* ---------- header badge ---------- */
  function updateBadge() {
    var count = getCartCount();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = count;
      el.hidden = count === 0;
      el.classList.remove("is-bump");
      if (count > 0) { void el.offsetWidth; el.classList.add("is-bump"); }
    });
  }

  /* ---------- add-to-cart buttons ---------- */
  function bindAddButtons() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add]");
      if (!btn) return;
      var qty = 1;
      var buy = btn.closest("[data-buy]");
      if (buy) {
        var input = buy.querySelector("[data-qty-input]");
        if (input) qty = parseInt(input.value, 10) || 1;
      }
      addToCart({
        id: btn.dataset.id,
        title: btn.dataset.title,
        price: btn.dataset.price,
        image: btn.dataset.image,
        stripe_price_id: btn.dataset.priceId,
        stock: btn.dataset.stock
      }, qty);

      btn.classList.add("is-added");
      setTimeout(function () { btn.classList.remove("is-added"); }, 1600);
      toast((btn.dataset.title || "Item") + " added to cart");
    });
  }

  /* ---------- quantity steppers (product detail) ---------- */
  function bindSteppers() {
    document.addEventListener("click", function (e) {
      var dec = e.target.closest("[data-qty-dec]");
      var inc = e.target.closest("[data-qty-inc]");
      if (!dec && !inc) return;
      var wrap = (dec || inc).closest("[data-qty]");
      if (!wrap) return;
      var input = wrap.querySelector("[data-qty-input]");
      if (!input) return;
      var val = parseInt(input.value, 10) || 1;
      var max = parseInt(input.getAttribute("max"), 10) || Infinity;
      if (inc) val = Math.min(max, val + 1);
      if (dec) val = Math.max(1, val - 1);
      input.value = val;
    });
  }

  /* ---------- cart page rendering ---------- */
  function renderCartPage() {
    var page = document.querySelector("[data-cart-page]");
    if (!page) return;

    var itemsEl = page.querySelector("[data-cart-items]");
    var emptyEl = page.querySelector("[data-cart-empty]");
    var summaryEl = page.querySelector("[data-cart-summary]");
    var cart = getCart();

    if (!cart.length) {
      if (itemsEl) itemsEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      if (summaryEl) summaryEl.hidden = true;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    if (summaryEl) summaryEl.hidden = false;

    if (itemsEl) {
      itemsEl.innerHTML = cart.map(function (i) {
        var lineTotal = money(Number(i.price) * i.quantity);
        var url = (GM.baseurl || "") + "/products/" + i.id + "/";
        return '' +
          '<article class="gm-cart-row" data-line="' + i.id + '">' +
            '<a href="' + url + '"><img class="gm-cart-row__img" src="' + i.image + '" alt="' + escapeHtml(i.title) + '"></a>' +
            '<div class="gm-cart-row__main">' +
              '<div class="gm-cart-row__top">' +
                '<div>' +
                  '<p class="gm-cart-row__title"><a href="' + url + '">' + escapeHtml(i.title) + '</a></p>' +
                  '<p class="gm-cart-row__unit">' + money(i.price) + ' each</p>' +
                '</div>' +
                '<button class="gm-cart-row__remove" type="button" data-remove="' + i.id + '" aria-label="Remove ' + escapeHtml(i.title) + '">Remove</button>' +
              '</div>' +
              '<div class="gm-cart-row__bottom">' +
                '<div class="gm-qty" data-qty>' +
                  '<button class="gm-qty__btn" type="button" data-line-dec="' + i.id + '" aria-label="Decrease">-</button>' +
                  '<input class="gm-qty__input" type="number" min="1" value="' + i.quantity + '" data-line-input="' + i.id + '" aria-label="Quantity for ' + escapeHtml(i.title) + '">' +
                  '<button class="gm-qty__btn" type="button" data-line-inc="' + i.id + '" aria-label="Increase">+</button>' +
                '</div>' +
                '<span class="gm-cart-row__subtotal">' + lineTotal + '</span>' +
              '</div>' +
            '</div>' +
          '</article>';
      }).join("");
    }

    // summary numbers
    setText(page, "[data-cart-subtotal]", money(getCartTotal()));
    var ship = getShipping();
    setText(page, "[data-cart-shipping]", ship === 0 ? "FREE" : money(ship));
    setText(page, "[data-cart-total]", money(getGrandTotal()));

    // free shipping progress bar
    var freeBar = page.querySelector("[data-free-bar]");
    if (freeBar) {
      var remaining = FREE_OVER - getCartTotal();
      if (remaining > 0) {
        freeBar.innerHTML = "Add <b>" + money(remaining) + "</b> more to unlock free shipping.";
      } else {
        freeBar.innerHTML = "<b>You have unlocked free shipping.</b>";
      }
    }
  }

  function bindCartPageEvents() {
    var page = document.querySelector("[data-cart-page]");
    if (!page) return;
    page.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-remove]");
      if (rm) { removeFromCart(rm.dataset.remove); return; }
      var inc = e.target.closest("[data-line-inc]");
      if (inc) { stepLine(inc.dataset.lineInc, 1); return; }
      var dec = e.target.closest("[data-line-dec]");
      if (dec) { stepLine(dec.dataset.lineDec, -1); return; }
    });
    page.addEventListener("change", function (e) {
      var input = e.target.closest("[data-line-input]");
      if (input) updateQuantity(input.dataset.lineInput, parseInt(input.value, 10));
    });
  }
  function stepLine(id, delta) {
    var item = getCart().filter(function (i) { return i.id === id; })[0];
    if (!item) return;
    updateQuantity(id, item.quantity + delta);
  }

  /* ---------- helpers ---------- */
  function setText(scope, sel, text) {
    var el = scope.querySelector(sel);
    if (el) el.textContent = text;
  }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  /* ---------- expose + init ---------- */
  window.GMCart = {
    getCart: getCart,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal,
    getShipping: getShipping,
    getGrandTotal: getGrandTotal,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQuantity: updateQuantity,
    clearCart: clearCart,
    formatMoney: money,
    freeShippingThreshold: FREE_OVER
  };
  window.gmToast = toast;

  function init() {
    bindAddButtons();
    bindSteppers();
    bindCartPageEvents();
    updateBadge();
    renderCartPage();
    document.addEventListener("gm:cartchange", function () {
      updateBadge();
      renderCartPage();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
