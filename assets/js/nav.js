/* ============================================================
   Gameday Mavericks - nav.js
   Mobile drawer toggle, drawer accordions, newsletter demo
   submit, and "coming soon" buttons. Desktop mega-nav dropdowns
   are CSS-only (:hover / :focus-within); JS only adds Escape +
   click-outside niceties for keyboard users.
   ============================================================ */
(function () {
  "use strict";

  var drawer = document.querySelector("[data-nav-drawer]");
  var toggle = document.querySelector("[data-nav-toggle]");
  var lastFocus = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    void drawer.offsetWidth;            // reflow for transition
    drawer.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    var close = drawer.querySelector("[data-nav-close]");
    if (close && close.focus) close.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    var onEnd = function () {
      drawer.hidden = true;
      drawer.removeEventListener("transitionend", onEnd);
    };
    drawer.addEventListener("transitionend", onEnd);
    // Fallback in case transitionend does not fire
    setTimeout(function () { if (drawer.classList.contains("is-open") === false) drawer.hidden = true; }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (toggle) toggle.addEventListener("click", openDrawer);

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-nav-close]")) { closeDrawer(); return; }

    // Drawer accordion expand
    var exp = e.target.closest("[data-drawer-expand]");
    if (exp) {
      var row = exp.closest(".gm-drawer__item");
      var sub = row && row.querySelector(".gm-drawer__sublist");
      var open = exp.getAttribute("aria-expanded") === "true";
      exp.setAttribute("aria-expanded", String(!open));
      if (sub) sub.hidden = open;
      return;
    }

    // "Coming soon" actions (account / wishlist)
    var soon = e.target.closest("[data-gm-soon]");
    if (soon && window.gmToast) {
      window.gmToast(soon.dataset.gmSoon + " are coming soon");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });

  // Newsletter (demo - no backend)
  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-newsletter]");
    if (!form) return;
    e.preventDefault();
    var email = form.querySelector('input[type="email"]');
    if (email && email.value && email.value.indexOf("@") > 0) {
      if (window.gmToast) window.gmToast("Thanks for signing up.");
      form.reset();
    } else {
      if (window.gmToast) window.gmToast("Please enter a valid email.");
      if (email) email.focus();
    }
  });
})();
