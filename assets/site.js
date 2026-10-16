// Overflow Robotics website: plain JavaScript for the static export.
// Replaces the React bits of the Next.js site: header, mobile menu, scroll reveal,
// count-up numbers, on-screen videos and the "Book a school visit" form.
(function () {
  "use strict";
  var PORTAL = (window.OVERFLOW_PORTAL || "").replace(/\/$/, "");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Header: solid background once scrolled or when the menu is open ──
  var header = document.querySelector("[data-site-header]");
  var toggle = document.querySelector("[data-menu-toggle]");
  var SOLID = ["bg-ink/95", "shadow-lg", "shadow-black/10", "backdrop-blur"];
  var menuOpen = false;
  function paintHeader() {
    if (!header) return;
    var solid = menuOpen || window.scrollY > 24;
    SOLID.forEach(function (c) { header.classList.toggle(c, solid); });
    header.classList.toggle("bg-transparent", !solid);
  }
  window.addEventListener("scroll", paintHeader, { passive: true });
  paintHeader();

  // ── Mobile menu ──
  var ICON_MENU = '<svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16"/><path d="M4 18h16"/><path d="M4 6h16"/></svg>';
  var ICON_X = '<svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  var LINKS = [["/#about", "About"], ["/#journey", "Journey"], ["/#rov", "Our ROV"], ["/#team", "Team"], ["/education", "Education"], ["/#contact", "Contact"]];
  var panel = null;
  function buildPanel() {
    var p = document.createElement("div");
    p.className = "border-t border-white/10 bg-ink px-4 pb-6 pt-2 lg:hidden";
    var nav = LINKS.map(function (l) {
      return '<a href="' + l[0] + '" class="border-b border-white/5 py-3 text-base font-medium text-white/90">' + l[1] + "</a>";
    }).join("");
    p.innerHTML =
      '<nav class="flex flex-col">' + nav + "</nav>" +
      '<div class="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">' +
      '<p class="flex items-center gap-2 font-display text-sm font-black uppercase tracking-[0.15em] text-accent">Tech in Schools portal</p>' +
      '<p class="mt-1 text-sm text-white/60">For TIS students, their parents and instructors.</p>' +
      '<div class="mt-3 grid grid-cols-2 gap-2">' +
      '<a href="' + PORTAL + '/login" class="rounded-full border border-white/20 py-3 text-center font-semibold text-white">Portal log in</a>' +
      '<a href="/education#enroll" class="rounded-full bg-accent py-3 text-center font-semibold text-white">Enroll a student</a>' +
      "</div></div>";
    p.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    return p;
  }
  function setMenu(open) {
    menuOpen = open;
    if (open && !panel) panel = buildPanel();
    if (open) header.appendChild(panel);
    else if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.innerHTML = open ? ICON_X : ICON_MENU;
    paintHeader();
  }
  if (header && toggle) toggle.addEventListener("click", function () { setMenu(!menuOpen); });

  // ── Scroll reveal ──
  var reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); revealObs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  // ── Count-up numbers (final value is already in the HTML) ──
  if (!reduced && "IntersectionObserver" in window) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countObs.unobserve(e.target);
        var el = e.target, to = Number(el.getAttribute("data-countup")) || 0;
        var pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "";
        var t0 = performance.now();
        (function tick(now) {
          var p = Math.min(1, (now - t0) / 1400);
          el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll("[data-countup]").forEach(function (el) { countObs.observe(el); });
  }

  // ── Videos ──
  // Phones may refuse to autoplay (iPhone Low Power Mode, data saver, some Android browsers).
  // So: try to play; if a video still isn't playing, start it on the first touch, and show a ▶ button.
  var conn = navigator.connection || {};
  var slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z"/></svg>';

  function prep(v) {
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
  }

  function tryPlay(v) {
    prep(v);
    try {
      var p = v.play();
      if (p && p.then) return p.then(function () { hideButton(v); return true; }, function () { showButton(v); return false; });
    } catch (e) { showButton(v); }
    return Promise.resolve(!v.paused);
  }

  function showButton(v) {
    if (v._playBtn || !v.paused) return;
    var host = v.parentElement;
    if (!host) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Play video");
    b.innerHTML = ICON_PLAY;
    b.style.cssText = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;width:56px;height:56px;border-radius:9999px;border:0;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(15,23,42,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer";
    if (v.hasAttribute("autoplay")) { b.style.top = "auto"; b.style.bottom = "88px"; b.style.left = "auto"; b.style.right = "20px"; b.style.transform = "none"; }
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); tryPlay(v); });
    host.appendChild(b);
    v._playBtn = b;
  }

  function hideButton(v) {
    if (v._playBtn) { v._playBtn.remove(); v._playBtn = null; }
  }

  var heroes = Array.prototype.slice.call(document.querySelectorAll("video[autoplay]"));
  var inview = Array.prototype.slice.call(document.querySelectorAll("video[data-inview]"));

  heroes.forEach(function (v) {
    if (slow || reduced) {
      // Keep just the still image: no download on data saver / reduced motion.
      v.removeAttribute("autoplay");
      v.querySelectorAll("source").forEach(function (s) { s.remove(); });
      v.removeAttribute("src");
      v.load();
      return;
    }
    v.addEventListener("playing", function () { hideButton(v); });
    tryPlay(v);
    // Some browsers neither play nor reject; check again shortly.
    setTimeout(function () { if (v.paused) tryPlay(v); }, 1500);
  });

  // First touch/click anywhere unlocks playback on phones that blocked autoplay.
  function unlock() {
    heroes.forEach(function (v) { if (v.paused && v.hasAttribute("autoplay")) tryPlay(v); });
    inview.forEach(function (v) { if (v._wanted && v.paused) tryPlay(v); });
  }
  ["touchend", "click", "keydown"].forEach(function (ev) { document.addEventListener(ev, unlock, { passive: true }); });

  // Clips play only while on screen (saves data and battery).
  if (!reduced && "IntersectionObserver" in window) {
    var vidObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        v._wanted = e.isIntersecting;
        if (e.isIntersecting) tryPlay(v);
        else v.pause();
      });
    }, { threshold: 0.25 });
    inview.forEach(function (v) {
      prep(v);
      v.addEventListener("playing", function () { hideButton(v); });
      vidObs.observe(v);
    });
  }

  // ── "Book a school visit" form → portal API ──
  document.querySelectorAll("[data-school-visit] form").forEach(function (form) {
    var status = document.createElement("p");
    status.setAttribute("role", "status");
    status.className = "hidden rounded-xl px-4 py-3 text-sm font-medium";
    form.insertBefore(status, form.firstChild);
    var button = form.querySelector('button[type="submit"]') || form.querySelector("button");
    var label = button ? button.innerHTML : "";
    function show(ok, text) {
      status.textContent = text;
      status.className = "rounded-xl px-4 py-3 text-sm font-medium " + (ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { if (typeof v === "string" && k.charAt(0) !== "$") data[k] = v; });
      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      fetch(PORTAL + "/api/public/school-visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) {
          if (res && res.ok) { show(true, res.message || "Thank you! We'll be in touch."); form.reset(); }
          else show(false, (res && res.error) || "Something went wrong. Please try again, or message us on WhatsApp.");
        })
        .catch(function () { show(false, "Couldn't send right now. Please try again, or message us on WhatsApp."); })
        .then(function () { if (button) { button.disabled = false; button.innerHTML = label; } });
    });
  });
})();
