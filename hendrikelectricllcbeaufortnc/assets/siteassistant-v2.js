/*!
 * SiteAssistant v2 (LLM) - website chat widget that talks to the Vendly
 * Site Assistant backend. Vendly LLC. Rentable micro-app. No build step.
 *
 * v2.1 adds browser-native VOICE: a mic button for talking to the assistant
 * (Web Speech recognition) and an optional speak-replies toggle that reads
 * answers aloud (browser speechSynthesis today, swappable to a branded server
 * voice later). No Twilio, no A2P, no SMS - all in-browser and user-initiated.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT IS
 *   Same accessible floating chat widget as v1, but instead of answering from
 *   an in-page script it POSTs the visitor's message to the hosted backend,
 *   which asks Claude to answer ONLY from that client's business info. The FAQ
 *   and knowledge live server-side (never shipped to the visitor's browser),
 *   the API key is server-side, and cost/rate limits are enforced server-side.
 *
 * INSTALL (just before </body>):
 *   <script>
 *     window.SiteAssistantConfig = {
 *       tenantId: "your-client-id",                       // your client id (required)
 *       endpoint: "https://vendly-jarvis.vercel.app", // backend base URL
 *       name: "Your Business Name",              // header label
 *       greeting: "Hi. Ask about our services or hours.",
 *       phone: "+18035551234",   // Call chip (optional)
 *       sms:   "+18035551234",   // Text chip (optional)
 *       quoteUrl: "/pages/contact", // Get a quote chip (optional)
 *       bookUrl: "/pages/book",     // Book chip (optional)
 *       contactUrl: "/pages/contact", // where an email/contact CTA in a reply
 *                                     // links (on-site form, NOT mailto). Usually
 *                                     // set per-tenant in the tenant JSON.
 *       suggestions: ["Hours", "Services", "Get a quote"], // quick prompts
 *       accent: "#111111",
 *       ttsUrl: ""               // OPTIONAL. Leave unset to use the browser
 *                                // voice. When set, replies are read aloud via
 *                                // this server endpoint (POST {tenantId, text}
 *                                // returning an audio blob) - this is where the
 *                                // branded "Quinn" voice gets wired in later.
 *     };
 *   </script>
 *   <script src="https://vendly-jarvis.vercel.app/siteassistant-v2.js" defer></script>
 *
 * VOICE (browser-native, no Twilio / no A2P)
 *   - Mic button (in the input row): uses the Web Speech API
 *     (SpeechRecognition / webkitSpeechRecognition). Feature-detected - if the
 *     browser lacks it, the mic is NOT rendered. Needs HTTPS. Works in Chrome,
 *     Edge, and Safari. User-initiated only (never auto-starts on open).
 *     Transcribed text fills the input; a final result auto-submits. Clicking
 *     again stops. Listening always resets on error, end, or panel close.
 *   - Speak-replies toggle (in the header): default OFF, aria-pressed. When ON,
 *     each new assistant reply is read aloud. speakReply() first tries the
 *     optional cfg.ttsUrl server endpoint (future branded voice) and otherwise
 *     falls back to browser speechSynthesis with an en-US voice.
 *
 * DESIGN NOTES (built in, never marketed)
 *   - Accessibility: labeled dialog, focus moves in on open and returns on
 *     close, focus trapped while open, Escape closes, visible focus rings,
 *     contrast-aware colors, respects prefers-reduced-motion (the listening
 *     pulse is disabled under reduced motion; the state stays clearly visible).
 *   - Security: all displayed text is escaped/textContent, config links are
 *     sanitized to safe schemes, no innerHTML from network data, no secrets in
 *     the page. Network calls go only to your configured backend endpoint (and
 *     the optional ttsUrl you set). Voice is captured in-browser; audio is not
 *     sent anywhere unless you configure ttsUrl.
 * ---------------------------------------------------------------------------
 */
(function () {
  "use strict";

  var DEFAULTS = {
    tenantId: "",
    endpoint: "",
    name: "",
    greeting: "Hi. How can I help? Ask about hours, services, or getting in touch.",
    phone: "",
    sms: "",
    quoteUrl: "",
    bookUrl: "",
    // Where the assistant's email / "contact us" CTA sends the visitor. We do
    // NOT use mailto: an email shown in a reply links here instead, so the
    // customer stays on the site and fills the on-site contact form. The tenant
    // JSON is the source of truth (delivered by /api/status on boot); this
    // default is the fallback if the status call omits it.
    contactUrl: "/pages/contact",
    suggestions: [],
    position: "right",
    accent: "#e8560a",
    // Panel theme: "light" (default) keeps the clean white panel. "dark" flips the
    // panel surfaces to near-black with light text for stores with a dark
    // storefront; the accent (branded buttons/header) is unchanged either way.
    theme: "light",
    launcherLabel: "Ask us",
    // Presence (Jarvis agent-actions, 2026-07-12). assistantName gives the
    // assistant a named human presence: a monogram avatar (first letter) on the
    // launcher and header, and a name in the greeting bubble. nudge is the text
    // of the proactive peek bubble; unset falls back to a name-aware default.
    // Both optional - unset keeps the old look and no peek text change.
    assistantName: "",
    nudge: "",
    fallback: "I am not able to answer that right now. The quickest way is to reach the team directly.",
    // Optional server text-to-speech endpoint. Leave unset to use the browser
    // voice. When set, speakReply() POSTs {tenantId, text} and plays the
    // returned audio blob (future home of the branded "Quinn" voice).
    ttsUrl: "",
    labels: {
      title: "Assistant",
      inputPlaceholder: "Type your question",
      send: "Send",
      close: "Close chat",
      call: "Call",
      text: "Text",
      quote: "Get a quote",
      book: "Book",
      mic: "Speak your question",
      listening: "Listening... speak now",
      speak: "Read replies aloud",
      /* DEMO pages: never "Assistant by Vendly" (Jacob CLEAR 2026-08-13). Empty = no foot. */
      poweredBy: "",
      // Jarvis agent-actions (2026-07-12): action buttons + peek bubble.
      addToCart: "Add {label} to cart",
      checkout: "Go to checkout",
      addedToCart: "Added to your cart.",
      cartFailed: "Could not add that. See the plan page.",
      subscribed: "You are on the list.",
      askMe: "Ask me",
      peekClose: "Dismiss"
    }
  };

  // ---- helpers --------------------------------------------------------------

  function merge(user) {
    var c = {};
    for (var k in DEFAULTS) c[k] = DEFAULTS[k];
    for (var j in user) if (user.hasOwnProperty(j)) c[j] = user[j];
    c.labels = {};
    for (var l in DEFAULTS.labels) c.labels[l] = DEFAULTS.labels[l];
    if (user && user.labels) {
      for (var m in user.labels) if (user.labels.hasOwnProperty(m)) c.labels[m] = user.labels[m];
    }
    return c;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function safeHref(raw) {
    if (typeof raw !== "string") return "";
    var v = raw.trim();
    if (!v) return "";
    if (/^[\/.#?]/.test(v)) return v;
    if (/^(https?|mailto|tel|sms):/i.test(v)) return v;
    return "";
  }

  function dialHref(scheme, phone) {
    if (typeof phone !== "string") return "";
    var cleaned = phone.replace(/[^0-9+]/g, "");
    if (!cleaned) return "";
    return scheme + ":" + cleaned;
  }

  // ---- linkify assistant replies (phone -> tel:, email -> on-site contact) --
  // Turns clear phone numbers and email addresses inside a bot reply into safe,
  // tappable links WITHOUT ever using innerHTML on network text. Every visible
  // label is set via textContent and every href is sanitized:
  //   - Phone numbers become tel: links: formatting is stripped for the href
  //     (dialHref keeps only + and digits), the original formatting stays as the
  //     visible text (tap to call on mobile).
  //   - Email addresses do NOT become mailto: links. The email text instead
  //     links to the client's on-site CONTACT page (cfg.contactUrl), so the
  //     visitor stays on the site and fills the form there.
  // Anything that is not a clean phone/email match is appended as a plain text
  // node, so nothing the model writes can ever be interpreted as HTML.

  // Email: a conservative address pattern. Phone: an optional +, a lead digit,
  // then digits/spaces/()/./- ending in a digit; the raw match is then validated
  // by digit count (phoneLooksReal) so dates, prices, and IDs do not turn into
  // fake phone links.
  var LINKIFY_RE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,})|(\+?\(?\d[\d\s().-]{7,}\d)/g;

  function phoneLooksReal(match) {
    var plus = match.charAt(0) === "+";
    var digits = match.replace(/[^0-9]/g, "");
    // With an explicit country prefix, trust 10 to 15 digits (E.164 range).
    if (plus) return digits.length >= 10 && digits.length <= 15;
    // Otherwise only a clean North American 10-digit, or 11-digit starting in 1.
    return digits.length === 10 || (digits.length === 11 && digits.charAt(0) === "1");
  }

  function makePhoneLink(display) {
    var href = dialHref("tel", display);
    if (!href) return null;
    var a = document.createElement("a");
    a.className = "sa-link";
    a.setAttribute("href", href);
    a.textContent = display; // keep the assistant's formatting visible
    return a;
  }

  function makeContactLink(cfg, display) {
    var href = safeHref(cfg && cfg.contactUrl) || "/pages/contact";
    var a = document.createElement("a");
    a.className = "sa-link";
    a.setAttribute("href", href);
    a.textContent = display; // show the email text; the link goes to the form
    if (/^https?:/i.test(href)) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
    return a;
  }

  // Append `text` into `container`, converting phone/email matches to safe links
  // and everything else to plain text nodes. Mutates container; returns nothing.
  function appendLinkified(container, text, cfg) {
    var src = String(text == null ? "" : text);
    LINKIFY_RE.lastIndex = 0;
    var last = 0;
    var m;
    while ((m = LINKIFY_RE.exec(src)) !== null) {
      // Zero-length guard (cannot happen with this pattern, but keep it safe).
      if (m.index === LINKIFY_RE.lastIndex) { LINKIFY_RE.lastIndex++; continue; }
      var matchStr = m[0];
      var isEmail = !!m[1];
      var node = null;
      if (isEmail) node = makeContactLink(cfg, matchStr);
      else if (phoneLooksReal(matchStr)) node = makePhoneLink(matchStr);
      if (node) {
        if (m.index > last) container.appendChild(document.createTextNode(src.slice(last, m.index)));
        container.appendChild(node);
        last = m.index + matchStr.length;
      }
      // node === null (a number that is not a real phone): leave `last` where it
      // is so the text falls into the next plain-text slice and renders as text.
    }
    if (last < src.length) container.appendChild(document.createTextNode(src.slice(last)));
  }

  // ---- icons (inline SVG, no emoji) ----------------------------------------

  function chatIconSvg() {
    return '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.5 3.4 6L4.5 20.5c-.1.4.3.7.6.5l4-2.2c.9.2 1.9.3 2.9.3 5.5 0 10-3.6 10-8s-4.5-8-10-8z"/>' +
      '</svg>';
  }

  function closeIconSvg() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M6.4 5L5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"/>' +
      '</svg>';
  }

  function micIconSvg() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/>' +
      '<path fill="currentColor" d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/>' +
      '</svg>';
  }

  function speakerOnIconSvg() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M4 9v6h3l4 4V5L7 9H4z"/>' +
      '<path fill="currentColor" d="M14 8.5a3.5 3.5 0 0 1 0 7v-2a1.5 1.5 0 0 0 0-3v-2z"/>' +
      '<path fill="currentColor" d="M14 4.5a7.5 7.5 0 0 1 0 15v-2a5.5 5.5 0 0 0 0-11v-2z"/>' +
      '</svg>';
  }

  function speakerOffIconSvg() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M4 9v6h3l4 4V5L7 9H4z"/>' +
      '<path fill="currentColor" d="M19.5 12l1.9-1.9-1.1-1.1L18.4 10.9 16.5 9l-1.1 1.1L17.3 12l-1.9 1.9 1.1 1.1 1.9-1.9 1.9 1.9 1.1-1.1z"/>' +
      '</svg>';
  }

  function cartIconSvg() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M7 4h-2a1 1 0 0 0 0 2h1.2l1.6 8.4a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.6l1.2-6.2A1 1 0 0 0 19 7H8.2l-.3-1.6A1.2 1.2 0 0 0 6.7 4H7z"/>' +
      '<circle fill="currentColor" cx="10" cy="20" r="1.4"/>' +
      '<circle fill="currentColor" cx="17" cy="20" r="1.4"/>' +
      '</svg>';
  }

  // Named human presence (Jarvis, 2026-07-12): a clean monogram avatar in the
  // accent color. NEVER a photo or a fabricated face - just the first letter of
  // the assistant name in a circle. Falls back to the chat icon when no name is
  // configured. Text is escaped (the monogram is a single letter).
  function avatarHtml(cfg, size) {
    var name = typeof cfg.assistantName === "string" ? cfg.assistantName.trim() : "";
    if (!name) return chatIconSvg();
    var initial = escapeHtml(name.charAt(0).toUpperCase());
    return '<span class="sa-ava" aria-hidden="true" style="width:' + size + 'px;height:' +
      size + 'px;line-height:' + size + 'px;font-size:' + Math.round(size * 0.5) +
      'px">' + initial + "</span>";
  }

  // ---- styles (same as v1, plus a typing indicator) ------------------------

  function injectCss(accent, theme) {
    if (document.getElementById("siteassistant-css")) return;
    // Palette. Light is the default and unchanged. Dark is an opt-in per-tenant
    // theme (config theme:"dark") for stores with a dark storefront: panel
    // surfaces go near-black with light text; the accent (branded header,
    // launcher, buttons) is unchanged. Only surface/ink/line colors flip.
    var dark = theme === "dark";
    var p = dark
      ? { ink: "#f4f2ee", muted: "#a9a49a", line: "#2c2c2c", bg: "#141414", log: "#0e0e0e", surface: "#1e1e1e", field: "#242424", inputBorder: "#3a3a3a", peekx: "#2a2a2a" }
      : { ink: "#14140f", muted: "#5c5c55", line: "#e5e5e5", bg: "#ffffff", log: "#fbfaf6", surface: "#ffffff", field: "#ffffff", inputBorder: "#cfcfc7", peekx: "#eee" };
    var css =
      ".sa-root{--sa-accent:" + accent + ";--sa-ink:" + p.ink + ";--sa-muted:" + p.muted + ";--sa-line:" + p.line + ";--sa-bg:" + p.bg + ";--sa-log:" + p.log + ";--sa-surface:" + p.surface + ";--sa-field:" + p.field + ";--sa-input-border:" + p.inputBorder + ";--sa-peekx:" + p.peekx + ";" +
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.45;box-sizing:border-box}" +
      ".sa-root *,.sa-root *::before,.sa-root *::after{box-sizing:border-box}" +
      // MOBILE DISMISS BACKDROP. Jacob, 2026-08-01: "I clicked the concierge and
      // it take up the whole screen to the point I can't click off of it."
      // Mobile only and on purpose: on desktop this panel is a small corner card
      // and the visitor is meant to keep using the site behind it, so a scrim
      // there would be a regression rather than a fix. It sits under the panel
      // (2147483001) and over the page, and it is inside .sa-root so the existing
      // prefers-reduced-motion rule already kills its transition.
      ".sa-scrim{position:fixed;inset:0;z-index:2147483000;background:rgba(10,12,14,.42);" +
      "display:none;opacity:0;transition:opacity .18s ease}" +
      ".sa-launch{position:fixed;bottom:20px;z-index:2147483000;display:inline-flex;align-items:center;gap:9px;" +
      "border:none;border-radius:999px;padding:13px 20px 13px 16px;background:var(--sa-accent);color:#fff;" +
      "font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.22)}" +
      ".sa-launch.sa-right{right:20px}.sa-launch.sa-left{left:20px}" +
      ".sa-launch svg{display:block}" +
      ".sa-launch:hover{filter:brightness(.94)}" +
      ".sa-launch:focus-visible{outline:3px solid var(--sa-ink);outline-offset:2px}" +
      ".sa-panel{position:fixed;bottom:20px;z-index:2147483001;width:360px;max-width:calc(100vw - 32px);" +
      "height:520px;max-height:calc(100svh - 40px);max-height:calc(100dvh - 40px);background:var(--sa-bg);color:var(--sa-ink);" +
      "border:1px solid var(--sa-line);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);" +
      "display:none;flex-direction:column;overflow:hidden}" +
      ".sa-panel.sa-right{right:20px}.sa-panel.sa-left{left:20px}" +
      ".sa-panel.sa-open{display:flex}" +
      // Close lives in panel flow at the top (never viewport-fixed alone) so a
      // keyboard shrink cannot push the X under the keys. flex-shrink:0 keeps
      // the header from collapsing when the message list eats remaining height.
      ".sa-head{display:flex;align-items:center;gap:10px;padding:14px 14px 14px 16px;background:var(--sa-accent);color:#fff;flex:0 0 auto}" +
      ".sa-head-txt{flex:1 1 auto;min-width:0}" +
      ".sa-head-title{font-weight:700;font-size:15px;line-height:1.2}" +
      ".sa-head-sub{font-size:12px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".sa-x{background:rgba(255,255,255,.15);border:none;color:#fff;width:34px;height:34px;border-radius:8px;" +
      "cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}" +
      ".sa-x:hover{background:rgba(255,255,255,.28)}" +
      ".sa-x:focus-visible{outline:3px solid #fff;outline-offset:2px}" +
      ".sa-spk{background:rgba(255,255,255,.15);border:none;color:#fff;width:34px;height:34px;border-radius:8px;" +
      "cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}" +
      ".sa-spk:hover{background:rgba(255,255,255,.28)}" +
      ".sa-spk:focus-visible{outline:3px solid #fff;outline-offset:2px}" +
      ".sa-spk svg{display:block}" +
      '.sa-spk[aria-pressed="true"]{background:#fff;color:var(--sa-accent)}' +
      ".sa-log{flex:1 1 auto;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--sa-log)}" +
      ".sa-msg{max-width:85%;padding:9px 12px;border-radius:14px;font-size:14px;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}" +
      ".sa-bot{align-self:flex-start;background:var(--sa-surface);border:1px solid var(--sa-line);color:var(--sa-ink);border-bottom-left-radius:4px}" +
      ".sa-user{align-self:flex-end;background:var(--sa-accent);color:#fff;border-bottom-right-radius:4px}" +
      // Auto-linkified phone (tel:) / contact links inside a bot reply.
      ".sa-msg a.sa-link{color:var(--sa-accent);text-decoration:underline;font-weight:600}" +
      ".sa-user a.sa-link{color:#fff}" +
      ".sa-msg a.sa-link:focus-visible{outline:2px solid var(--sa-accent);outline-offset:1px;border-radius:3px}" +
      ".sa-typing{align-self:flex-start;display:inline-flex;gap:4px;padding:11px 14px;background:var(--sa-surface);border:1px solid var(--sa-line);border-radius:14px;border-bottom-left-radius:4px}" +
      ".sa-typing span{width:6px;height:6px;border-radius:50%;background:#b9b9b0;display:inline-block;animation:sa-blink 1.2s infinite ease-in-out}" +
      ".sa-typing span:nth-child(2){animation-delay:.2s}.sa-typing span:nth-child(3){animation-delay:.4s}" +
      "@keyframes sa-blink{0%,80%,100%{opacity:.3}40%{opacity:1}}" +
      ".sa-chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 14px 10px;background:var(--sa-log)}" +
      ".sa-chip{border:1px solid var(--sa-accent);background:var(--sa-surface);color:var(--sa-accent);border-radius:999px;" +
      "padding:7px 13px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}" +
      ".sa-chip:hover{background:var(--sa-accent);color:#fff}" +
      ".sa-chip:focus-visible{outline:3px solid var(--sa-ink);outline-offset:2px}" +
      ".sa-form{display:flex;gap:8px;padding:12px 14px;border-top:1px solid var(--sa-line);background:var(--sa-surface);flex:0 0 auto}" +
      ".sa-input{flex:1 1 auto;min-width:0;border:1px solid var(--sa-input-border);border-radius:10px;padding:10px 12px;" +
      // 16px minimum: iOS Safari auto-zooms the page on focus for any input
      // under 16px, which is its own source of a jumped/zoomed layout.
      "font-size:16px;font-family:inherit;color:var(--sa-ink);background:var(--sa-field)}" +
      ".sa-input::placeholder{color:var(--sa-muted)}" +
      ".sa-input:focus-visible{outline:3px solid var(--sa-accent);outline-offset:1px;border-color:var(--sa-accent)}" +
      ".sa-send{border:none;background:var(--sa-accent);color:#fff;border-radius:10px;padding:0 16px;" +
      "font-size:14px;font-weight:600;cursor:pointer;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:6px}" +
      ".sa-send-ic{display:none}" +
      ".sa-send:hover{filter:brightness(.94)}" +
      ".sa-send:disabled{opacity:.5;cursor:default}" +
      ".sa-send:focus-visible{outline:3px solid var(--sa-ink);outline-offset:2px}" +
      ".sa-mic{border:1px solid var(--sa-accent);background:var(--sa-surface);color:var(--sa-accent);border-radius:10px;" +
      "width:42px;padding:0;cursor:pointer;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center}" +
      ".sa-mic svg{display:block}" +
      ".sa-mic:hover{background:var(--sa-accent);color:#fff}" +
      ".sa-mic:disabled{opacity:.5;cursor:default}" +
      ".sa-mic:focus-visible{outline:3px solid var(--sa-ink);outline-offset:2px}" +
      ".sa-mic.sa-listening{background:var(--sa-accent);color:#fff;animation:sa-pulse 1.4s infinite}" +
      "@keyframes sa-pulse{0%{box-shadow:0 0 0 0 var(--sa-accent)}70%{box-shadow:0 0 0 8px transparent}" +
      "100%{box-shadow:0 0 0 0 transparent}}" +
      ".sa-foot{text-align:center;font-size:11px;color:var(--sa-muted);padding:0 0 8px;background:var(--sa-surface)}" +
      // Monogram avatar (named presence). White ring on the launcher/header
      // accent background so the single letter reads clearly.
      ".sa-ava{display:inline-block;text-align:center;border-radius:50%;background:rgba(255,255,255,.22);" +
      "color:#fff;font-weight:700;flex:0 0 auto}" +
      ".sa-launch .sa-ava{background:rgba(255,255,255,.25)}" +
      ".sa-head .sa-ava{background:rgba(255,255,255,.22)}" +
      // Action buttons (navigate / add to cart / checkout) under a bot message.
      ".sa-acts{align-self:flex-start;display:flex;flex-wrap:wrap;gap:8px;max-width:85%;margin:-2px 0 2px}" +
      ".sa-act{border:1px solid var(--sa-accent);background:var(--sa-accent);color:#fff;border-radius:999px;" +
      "padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;" +
      "display:inline-flex;align-items:center;gap:6px;font-family:inherit;line-height:1.2}" +
      ".sa-act:hover{filter:brightness(.94)}" +
      ".sa-act:focus-visible{outline:3px solid var(--sa-ink);outline-offset:2px}" +
      ".sa-act--ghost{background:var(--sa-surface);color:var(--sa-accent)}" +
      ".sa-act--ghost:hover{background:var(--sa-accent);color:#fff;filter:none}" +
      ".sa-act[disabled]{opacity:.55;cursor:default;filter:none}" +
      ".sa-act svg{display:block}" +
      ".sa-note{align-self:flex-start;font-size:12px;color:var(--sa-muted);max-width:85%;padding:0 2px}" +
      // Proactive peek bubble near the launcher (once per session, dismissible).
      ".sa-peek{position:fixed;bottom:74px;z-index:2147483002;width:250px;max-width:calc(100vw - 32px);" +
      "background:var(--sa-bg);color:var(--sa-ink);border:1px solid var(--sa-line);border-radius:14px;" +
      "box-shadow:0 10px 34px rgba(0,0,0,.22);padding:12px 12px 12px 14px;" +
      "transform:translateY(12px);opacity:0;transition:transform .28s ease,opacity .28s ease}" +
      ".sa-peek.sa-right{right:20px}.sa-peek.sa-left{left:20px}" +
      ".sa-peek.sa-in{transform:translateY(0);opacity:1}" +
      ".sa-peek-row{display:flex;align-items:flex-start;gap:9px}" +
      ".sa-peek-txt{flex:1 1 auto;font-size:13.5px;line-height:1.4}" +
      ".sa-peek-x{background:transparent;border:none;color:var(--sa-muted);width:22px;height:22px;border-radius:6px;" +
      "cursor:pointer;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;font-size:16px;line-height:1}" +
      ".sa-peek-x:hover{background:var(--sa-peekx)}" +
      ".sa-peek-x:focus-visible{outline:2px solid var(--sa-accent);outline-offset:1px}" +
      ".sa-peek-cta{margin-top:9px}" +
      ".sa-peek-ask{border:none;background:var(--sa-accent);color:#fff;border-radius:999px;padding:7px 15px;" +
      "font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}" +
      ".sa-peek-ask:hover{filter:brightness(.94)}" +
      ".sa-peek-ask:focus-visible{outline:3px solid var(--sa-ink);outline-offset:2px}" +
      "@media (prefers-reduced-motion: reduce){.sa-root *{transition:none!important;animation:none!important}" +
      ".sa-peek{transition:none!important}}" +
      // Mobile: make the panel a true full-width bottom sheet so nothing (close
      // X, Send, message bubbles) can be clipped off the right edge.
      "@media (max-width: 480px){" +
      // KEYBOARD TRAP FIX (Jacob CLEAR 2026-08-12): never size with bare 100vh.
      // dvh/svh first; when the soft keyboard is up, syncViewport() overrides
      // height + bottom from visualViewport so the panel (and its in-flow X)
      // stays inside what the user can actually see.
      ".sa-panel{left:0;right:0;bottom:calc(90px + env(safe-area-inset-bottom,0px));top:auto;width:100%;max-width:100%;height:auto;" +
      "min-height:200px;min-height:min(200px,36svh);" +
      "max-height:58svh;max-height:min(58dvh,520px);border-radius:18px 18px 0 0;" +
      "overscroll-behavior:contain;touch-action:pan-y}" +
      ".sa-panel.sa-kb{max-height:none;min-height:0;border-radius:14px 14px 0 0}" +
      ".sa-scrim.sa-open{display:block;opacity:1}" +
      ".sa-panel.sa-right,.sa-panel.sa-left{left:0;right:0}" +
      ".sa-root{isolation:isolate;position:relative;z-index:2147483000;pointer-events:none}" +
      ".sa-root .sa-scrim,.sa-root .sa-panel,.sa-root .sa-launch,.sa-root .sa-peek{pointer-events:auto}" +
      ".sa-form{gap:6px;padding:10px}" +
      ".sa-input{flex:1 1 0%;min-width:0;padding:10px}" +
      ".sa-mic{width:44px}" +
      ".sa-mic,.sa-send{flex:0 0 auto}" +
      ".sa-send{width:44px;padding:0}" +
      ".sa-send-txt{display:none}" +
      ".sa-send-ic{display:block}" +
      ".sa-foot{display:none}" +
      ".sa-chips{padding:0 12px 8px}" +
      "}";
    var el = document.createElement("style");
    el.id = "siteassistant-css";
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ---- analytics beacon (owner mode) ----------------------------------------
  // Privacy-safe, aggregate-only ping to /api/track: view (page load), open
  // (assistant opened), click (a CTA/action button). No visitor identity, no
  // message content, no PII. Fire-and-forget: it must NEVER affect the page, so
  // every path is wrapped and all outcomes ignored. keepalive lets the view
  // beacon survive an immediate navigation. Silently no-ops without an endpoint.
  function track(cfg, event, extra) {
    try {
      if (!cfg || !cfg.endpoint || !cfg.tenantId) return;
      var url = cfg.endpoint.replace(/\/+$/, "") + "/api/track";
      var payload = { tenantId: cfg.tenantId, event: event };
      if (extra && extra.path) payload.path = String(extra.path).slice(0, 200);
      if (extra && extra.label) payload.label = String(extra.label).slice(0, 120);
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        cache: "no-store"
      }).catch(function () {});
    } catch (e) {}
  }

  // ---- widget ---------------------------------------------------------------

  function SiteAssistant(cfg) {
    this.cfg = cfg;
    this.open = false;
    this.lastFocus = null;
    this.history = [];   // [{role:"user"|"assistant", content}] sent for context
    this.busy = false;
    this.built = false;
    // The kill-switch status check runs first (boot); build() only happens when
    // the tenant is active or the check could not be reached (fail open).
    this.boot();
  }

  // Per-tenant kill switch (Jarvis, 2026-07-12). Before rendering anything, ask
  // the backend whether this tenant is active. Render only on active:true OR on
  // any failure (fail OPEN, so a transient blip never hides a paying client).
  // Render NOTHING when the backend definitively says active:false (deactivated
  // or unknown tenant). Lightweight and non-blocking - no launcher, no bubble,
  // no DOM until this resolves.
  SiteAssistant.prototype.boot = function () {
    var self = this;
    var cfg = this.cfg;
    var render = function () {
      if (self.built) return;
      self.build();
      // The widget rendered on this page (tenant active or fail-open) = one page
      // view. Fire once per load; path buckets the owner-mode top-pages report.
      var path = "/";
      try { path = (location && location.pathname) || "/"; } catch (e) {}
      track(cfg, "view", { path: path });
    };
    // No backend to ask: keep the old behaviour and just render (fail open).
    if (!cfg.endpoint || !cfg.tenantId) { render(); return; }
    // Demo sites must always build the panel so the sticky Ask button can open it.
    // A definitive active:false on a real client still hides the widget below.
    if (cfg.forceRender === true || cfg.demoMode === true) { render(); return; }
    var url = cfg.endpoint.replace(/\/+$/, "") + "/api/status?tenantId=" + encodeURIComponent(cfg.tenantId);
    try {
      fetch(url, { method: "GET", headers: { "Accept": "application/json" } })
        .then(function (r) {
          var ok = r.ok, status = r.status;
          return r.json().catch(function () { return null; }).then(function (data) {
            return { ok: ok, status: status, data: data };
          });
        })
        .then(function (res) {
          // Definitive "off" (200 active:false, or 404 unknown) hides the widget.
          if (res.data && res.data.active === false && (res.ok || res.status === 404)) return;
          // Adopt the tenant-configured contact page (source of truth is the
          // tenant JSON, delivered here) so an email/contact CTA in a reply links
          // to the client's on-site form. Sanitized before use; falls back to the
          // config default if absent or unsafe.
          if (res.data && typeof res.data.contactUrl === "string" && res.data.contactUrl) {
            var safe = safeHref(res.data.contactUrl);
            if (safe) cfg.contactUrl = safe;
          }
          render(); // active:true, or any ambiguous/error response -> fail open
        })
        .catch(function () { render(); }); // network blip -> fail open
    } catch (e) {
      render();
    }
  };

  SiteAssistant.prototype.build = function () {
    this.built = true;
    var cfg = this.cfg;
    var self = this;
    var side = cfg.position === "left" ? "sa-left" : "sa-right";

    var root = document.createElement("div");
    root.className = "sa-root";

    var launch = document.createElement("button");
    launch.type = "button";
    launch.className = "sa-launch " + side;
    launch.setAttribute("aria-haspopup", "dialog");
    launch.setAttribute("aria-expanded", "false");
    launch.setAttribute("aria-label", cfg.launcherLabel);
    launch.innerHTML = avatarHtml(cfg, 22) + "<span>" + escapeHtml(cfg.launcherLabel) + "</span>";

    var panel = document.createElement("div");
    panel.className = "sa-panel " + side;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    var titleId = "sa-title-" + Math.random().toString(36).slice(2, 8);
    panel.setAttribute("aria-labelledby", titleId);

    var subLine = cfg.name ? escapeHtml(cfg.name) : "";
    var headAva = (cfg.assistantName && cfg.assistantName.trim()) ? avatarHtml(cfg, 30) : "";
    panel.innerHTML =
      '<div class="sa-head">' +
        headAva +
        '<div class="sa-head-txt">' +
          '<div class="sa-head-title" id="' + titleId + '">' + escapeHtml(cfg.labels.title) + "</div>" +
          (subLine ? '<div class="sa-head-sub">' + subLine + "</div>" : "") +
        "</div>" +
        '<button type="button" class="sa-x" aria-label="' + escapeHtml(cfg.labels.close) + '">' + closeIconSvg() + "</button>" +
      "</div>" +
      '<div class="sa-log" role="log" aria-live="polite" aria-atomic="false"></div>' +
      '<div class="sa-chips"></div>' +
      '<form class="sa-form">' +
        '<input class="sa-input" type="text" autocomplete="off" ' +
          'aria-label="' + escapeHtml(cfg.labels.inputPlaceholder) + '" ' +
          'placeholder="' + escapeHtml(cfg.labels.inputPlaceholder) + '" maxlength="500">' +
        '<button type="submit" class="sa-send">' +
          '<svg class="sa-send-ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 11h11.2l-3.6-3.6L13 6l6 6-6 6-1.4-1.4 3.6-3.6H4z"/></svg>' +
          '<span class="sa-send-txt">' + escapeHtml(cfg.labels.send) + "</span></button>" +
      "</form>" +
      (cfg.labels.poweredBy && String(cfg.labels.poweredBy).trim()
        ? '<div class="sa-foot">' + escapeHtml(cfg.labels.poweredBy) + "</div>"
        : "");

    root.appendChild(launch);

    // The backdrop for the mobile sheet. Tapping it closes the panel, and
    // because it is a real element it also stops the tap reaching the page
    // underneath. MEASURED before this existed: a tap on the visible sliver of
    // page selected a word and opened Chrome's touch-to-search sheet, and the
    // sticky CALL dock stayed tappable straight through the open panel.
    var scrim = document.createElement("div");
    scrim.className = "sa-scrim";
    scrim.setAttribute("aria-hidden", "true");
    var saSelf = this;
    scrim.addEventListener("click", function () { saSelf.close(); });
    root.appendChild(scrim);
    root.appendChild(panel);
    document.body.appendChild(root);

    this.root = root;
    this.launch = launch;
    this.panel = panel;
    this.scrim = scrim;
    this.log = panel.querySelector(".sa-log");
    this.chips = panel.querySelector(".sa-chips");
    this.form = panel.querySelector(".sa-form");
    this.input = panel.querySelector(".sa-input");
    this.sendBtn = panel.querySelector(".sa-send");
    this.closeBtn = panel.querySelector(".sa-x");

    // ---- voice: capability detection (browser-native, no Twilio / A2P) ----
    this.SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = null;
    this.listening = false;
    this.speakOn = false;
    this.canSpeak = !!(window.speechSynthesis || cfg.ttsUrl);

    // Speak-replies toggle (header). Only render if we can actually speak.
    if (this.canSpeak) {
      var spk = document.createElement("button");
      spk.type = "button";
      spk.className = "sa-spk";
      spk.setAttribute("aria-pressed", "false");
      spk.setAttribute("aria-label", cfg.labels.speak);
      spk.innerHTML = speakerOffIconSvg();
      spk.addEventListener("click", function () { self.toggleSpeak(); });
      panel.querySelector(".sa-head").insertBefore(spk, this.closeBtn);
      this.spkBtn = spk;
    }

    // Mic button (input row, before Send). Only render if the browser supports
    // Web Speech recognition - no broken control otherwise.
    if (this.SR) {
      var mic = document.createElement("button");
      mic.type = "button";
      mic.className = "sa-mic";
      mic.setAttribute("aria-label", cfg.labels.mic);
      mic.setAttribute("aria-pressed", "false");
      mic.innerHTML = micIconSvg();
      mic.addEventListener("click", function () { self.toggleListening(); });
      this.form.insertBefore(mic, this.sendBtn);
      this.micBtn = mic;
    }

    this.renderChips();

    launch.addEventListener("click", function () { self.toggle(); });
    this.closeBtn.addEventListener("click", function () { self.close(); });
    this.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = self.input.value;
      self.input.value = "";
      self.handleUserMessage(v);
      // Keep focus without yanking the document (never scrollIntoView on input).
      try { self.input.focus({ preventScroll: true }); } catch (err) { try { self.input.focus(); } catch (e2) {} }
      if (typeof self.syncViewport === "function") self.syncViewport();
      try { window.scrollTo(0, self._scrollY || 0); } catch (e3) {}
    });

    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); self.close(); return; }
      if (e.key === "Tab") self.trapTab(e);
    });

    // Remember which side we sit on, so the peek bubble lines up with the
    // launcher. Then schedule the one-per-session proactive peek.
    this.side = side;
    this.schedulePeek();
  };

  SiteAssistant.prototype.renderChips = function () {
    var cfg = this.cfg;
    var self = this;
    this.chips.innerHTML = "";

    // Suggested-question chips send that text to the assistant.
    if (Array.isArray(cfg.suggestions)) {
      cfg.suggestions.slice(0, 6).forEach(function (label) {
        if (typeof label !== "string" || !label.trim()) return;
        self.addAskChip(label.trim());
      });
    }

    // Action chips are real links (call, text, quote, book).
    var call = dialHref("tel", cfg.phone);
    if (call) this.addLinkChip(cfg.labels.call, call);
    var text = dialHref("sms", cfg.sms || cfg.phone);
    if (text && cfg.sms) this.addLinkChip(cfg.labels.text, text);
    var quote = safeHref(cfg.quoteUrl);
    if (quote) this.addLinkChip(cfg.labels.quote, quote);
    var book = safeHref(cfg.bookUrl);
    if (book) this.addLinkChip(cfg.labels.book, book);
  };

  SiteAssistant.prototype.addAskChip = function (label) {
    var self = this;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "sa-chip";
    b.textContent = label;
    b.addEventListener("click", function () { self.handleUserMessage(label); });
    this.chips.appendChild(b);
  };

  SiteAssistant.prototype.addLinkChip = function (label, href) {
    var a = document.createElement("a");
    a.className = "sa-chip";
    a.textContent = label;
    a.setAttribute("href", href);
    if (/^https?:/i.test(href) || /^[\/.#?]/.test(href)) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
    this.chips.appendChild(a);
  };

  SiteAssistant.prototype.addMessage = function (who, text) {
    var el = document.createElement("div");
    el.className = "sa-msg " + (who === "user" ? "sa-user" : "sa-bot");
    if (who === "user") {
      el.textContent = text; // user text: never linkified, never HTML
    } else {
      // Assistant replies: phone -> tel:, email/contact CTA -> on-site contact
      // page. Built only from safe text nodes + sanitized anchors (no innerHTML),
      // so this can never inject markup from the model's output.
      appendLinkified(el, text, this.cfg);
    }
    this.log.appendChild(el);
    this.log.scrollTop = this.log.scrollHeight;
    return el;
  };

  SiteAssistant.prototype.showTyping = function () {
    var el = document.createElement("div");
    el.className = "sa-typing";
    el.setAttribute("aria-label", "Assistant is typing");
    el.innerHTML = "<span></span><span></span><span></span>";
    this.log.appendChild(el);
    this.log.scrollTop = this.log.scrollHeight;
    this.typingEl = el;
  };

  SiteAssistant.prototype.hideTyping = function () {
    if (this.typingEl && this.typingEl.parentNode) this.typingEl.parentNode.removeChild(this.typingEl);
    this.typingEl = null;
  };

  SiteAssistant.prototype.setBusy = function (busy) {
    this.busy = busy;
    this.sendBtn.disabled = busy;
    this.input.disabled = busy;
    if (this.micBtn) this.micBtn.disabled = busy;
  };

  // ---- agent actions (rendered as buttons under a bot message) --------------
  // Every action came from the backend, which validated it against tenant
  // config. We still treat all fields as untrusted: labels go through
  // textContent (never innerHTML), hrefs/handles are sanitized, and the widget
  // only executes a side effect on the visitor's click.

  var HANDLE_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

  SiteAssistant.prototype.renderActions = function (actions) {
    if (!Array.isArray(actions) || !actions.length) return;
    var self = this;
    var wrap = document.createElement("div");
    wrap.className = "sa-acts";
    var added = 0;
    actions.forEach(function (a) {
      if (!a || typeof a.type !== "string") return;
      if (a.type === "navigate") {
        var href = safeHref(typeof a.url === "string" ? a.url : "");
        if (!href) return;
        var label = typeof a.label === "string" && a.label.trim() ? a.label.trim() : "Open page";
        var link = document.createElement("a");
        link.className = "sa-act sa-act--ghost";
        link.setAttribute("href", href);
        link.textContent = label;
        // External http(s) links open in a new tab; internal links same tab.
        if (/^https?:/i.test(href)) {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
        link.addEventListener("click", function () {
          track(self.cfg, "click", { label: label });
        });
        wrap.appendChild(link);
        added++;
      } else if (a.type === "add_to_cart") {
        var handle = typeof a.handle === "string" ? a.handle : "";
        if (!HANDLE_RE.test(handle)) return;
        var plabel = typeof a.label === "string" && a.label.trim() ? a.label.trim() : "this plan";
        var tpl = self.cfg.labels.addToCart || "Add {label} to cart";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sa-act";
        btn.innerHTML = cartIconSvg();
        var span = document.createElement("span");
        span.textContent = tpl.replace("{label}", plabel);
        btn.appendChild(span);
        btn.addEventListener("click", function () {
          track(self.cfg, "click", { label: "Add to cart: " + plabel });
          self.addToCart(handle, plabel, btn, wrap);
        });
        wrap.appendChild(btn);
        added++;
      } else if (a.type === "subscribed") {
        // Backend already subscribed; just show a brief confirmation note.
        var note = document.createElement("div");
        note.className = "sa-note";
        note.textContent = self.cfg.labels.subscribed || "You are on the list.";
        self.log.appendChild(note);
      }
    });
    if (added) {
      this.log.appendChild(wrap);
      this.log.scrollTop = this.log.scrollHeight;
    }
  };

  // Shopify storefront AJAX (same-origin): resolve the first available variant,
  // then add it to the cart. On success, offer a checkout button; on failure,
  // link to the plan page. Only ever called from a visitor's click.
  SiteAssistant.prototype.addToCart = function (handle, label, btn, wrap) {
    var self = this;
    if (!HANDLE_RE.test(handle)) return;
    btn.disabled = true;
    var base = "/products/" + handle;
    fetch(base + ".js", { headers: { "Accept": "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("no product"); return r.json(); })
      .then(function (p) {
        var variants = (p && p.variants) || [];
        var pick = null;
        for (var i = 0; i < variants.length; i++) {
          if (variants[i] && variants[i].available) { pick = variants[i]; break; }
        }
        if (!pick && variants.length) pick = variants[0];
        if (!pick || pick.id == null) throw new Error("no variant");
        return fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ items: [{ id: pick.id, quantity: 1 }] })
        });
      })
      .then(function (r) { if (!r.ok) throw new Error("add failed"); return r.json(); })
      .then(function () {
        var note = document.createElement("div");
        note.className = "sa-note";
        note.textContent = self.cfg.labels.addedToCart || "Added to your cart.";
        self.log.appendChild(note);
        // Offer a checkout button (internal, same tab).
        var co = document.createElement("a");
        co.className = "sa-act";
        co.setAttribute("href", "/checkout");
        co.textContent = self.cfg.labels.checkout || "Go to checkout";
        wrap.appendChild(co);
        self.log.scrollTop = self.log.scrollHeight;
        try { co.focus(); } catch (e) {}
      })
      .catch(function () {
        btn.disabled = false;
        var fail = document.createElement("a");
        fail.className = "sa-note";
        fail.setAttribute("href", base);
        fail.textContent = self.cfg.labels.cartFailed || "Could not add that. See the plan page.";
        fail.style.textDecoration = "underline";
        self.log.appendChild(fail);
        self.log.scrollTop = self.log.scrollHeight;
      });
  };

  // ---- proactive peek bubble (once per browser session, dismissible) --------

  SiteAssistant.prototype.peekSeen = function () {
    try { return window.sessionStorage.getItem("sa-peek-shown") === "1"; }
    catch (e) { return this._peekShown === true; }
  };
  SiteAssistant.prototype.markPeekSeen = function () {
    this._peekShown = true;
    try { window.sessionStorage.setItem("sa-peek-shown", "1"); } catch (e) {}
  };

  SiteAssistant.prototype.schedulePeek = function () {
    var self = this;
    // Photos / BA pages can set disablePeek:true so the proactive card never
    // covers a before/after drag handle (OUT-2250 WAIT).
    if (this.cfg && this.cfg.disablePeek === true) return;
    if (this.peekSeen()) return;
    // About 5 seconds after load, once per session, if the chat is still closed.
    setTimeout(function () {
      if (self.open || self.peekSeen() || self.peekEl) return;
      self.showPeek();
    }, 5000);
  };

  SiteAssistant.prototype.peekText = function () {
    var cfg = this.cfg;
    if (typeof cfg.nudge === "string" && cfg.nudge.trim()) return cfg.nudge.trim();
    var name = (typeof cfg.assistantName === "string" && cfg.assistantName.trim())
      ? cfg.assistantName.trim() : "";
    var who = name ? "Hi, I am " + name + ". " : "Hi. ";
    return who + "Not sure which plan fits, or have a question about your site? Ask me.";
  };

  SiteAssistant.prototype.showPeek = function () {
    if (this.peekEl || this.open) return;
    var self = this;
    var cfg = this.cfg;
    this.markPeekSeen();

    var side = this.side === "sa-left" ? "sa-left" : "sa-right";
    var peek = document.createElement("div");
    peek.className = "sa-peek " + side;
    peek.setAttribute("role", "note");

    var row = document.createElement("div");
    row.className = "sa-peek-row";
    var txt = document.createElement("div");
    txt.className = "sa-peek-txt";
    txt.textContent = this.peekText();
    var x = document.createElement("button");
    x.type = "button";
    x.className = "sa-peek-x";
    x.setAttribute("aria-label", cfg.labels.peekClose || "Dismiss");
    x.innerHTML = "&times;";
    x.addEventListener("click", function (e) { e.stopPropagation(); self.dismissPeek(); });
    row.appendChild(txt);
    row.appendChild(x);

    var ctaWrap = document.createElement("div");
    ctaWrap.className = "sa-peek-cta";
    var ask = document.createElement("button");
    ask.type = "button";
    ask.className = "sa-peek-ask";
    ask.textContent = cfg.labels.askMe || "Ask me";
    ask.addEventListener("click", function () { self.openFromExternal(); });
    ctaWrap.appendChild(ask);

    peek.appendChild(row);
    peek.appendChild(ctaWrap);
    this.root.appendChild(peek);
    this.peekEl = peek;

    // Respect reduced motion: no slide, just appear (the CSS transition is
    // disabled under the media query; adding the class snaps it visible).
    var reduce = false;
    try { reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) {}
    if (reduce) {
      peek.classList.add("sa-in");
    } else {
      // Next frame so the transition runs from the initial state.
      window.requestAnimationFrame
        ? window.requestAnimationFrame(function () { if (self.peekEl === peek) peek.classList.add("sa-in"); })
        : peek.classList.add("sa-in");
    }
  };

  SiteAssistant.prototype.dismissPeek = function () {
    var peek = this.peekEl;
    if (!peek) return;
    this.peekEl = null;
    if (peek.parentNode) peek.parentNode.removeChild(peek);
  };

  // Open the panel from an outside trigger (peek "Ask me", a data-ask-jessica
  // element, or window.VendlyAssistant.open) and move focus into it. Safe to
  // call anytime; dismisses the peek first.
  SiteAssistant.prototype.openFromExternal = function () {
    if (!this.built) return; // not rendered (inactive tenant / still checking)
    this.dismissPeek();
    if (!this.open) this.openPanel();
    var self = this;
    // On desktop focus the input; on mobile focus the close button so the
    // keyboard does not immediately shove the sheet.
    setTimeout(function () {
      try {
        if (window.innerWidth > 480) self.input.focus();
        else if (self.closeBtn) self.closeBtn.focus();
      } catch (e) {}
    }, 0);
  };

  SiteAssistant.prototype.handleUserMessage = function (raw) {
    if (this.busy) return;
    var msg = String(raw == null ? "" : raw).slice(0, 500).trim();
    if (!msg) return;

    this.addMessage("user", msg);
    this.history.push({ role: "user", content: msg });
    this.ask(msg);
  };

  SiteAssistant.prototype.ask = function (msg) {
    var self = this;
    var cfg = this.cfg;

    // No backend configured: fail safe with the fallback line.
    if (!cfg.endpoint || !cfg.tenantId) {
      this.addMessage("bot", cfg.fallback);
      return;
    }

    this.setBusy(true);
    this.showTyping();
    // Read-aloud on: start the subtle "thinking" filler now, the moment the
    // visitor sends, so the wait for the spoken reply is not dead air. It is
    // stopped the instant real audio starts (or if speak is off / reduced
    // motion / no Web Audio, it never plays).
    this.startFiller();

    // Send only the last few turns for context (backend also caps this).
    var recent = this.history.slice(-8);

    var url = cfg.endpoint.replace(/\/+$/, "") + "/api/chat";
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: cfg.tenantId, message: msg, history: recent })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) {
        var reply = data && typeof data.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : (data && typeof data.error === "string" ? data.error : cfg.fallback);
        self.hideTyping();
        self.addMessage("bot", reply);
        self.history.push({ role: "assistant", content: reply });
        // Render any validated agent actions (navigate / add to cart /
        // subscribed) the backend returned, as accessible buttons/notes.
        self.renderActions(data && data.actions);
        self.setBusy(false);
        self.input.focus();
        self.speakReply(reply); // reads aloud only when the toggle is on
      })
      .catch(function () {
        self.hideTyping();
        self.stopFiller(); // no reply is coming; do not leave the cue running
        self.addMessage("bot", cfg.fallback);
        self.setBusy(false);
        self.input.focus();
      });
  };

  // ---- voice input (Web Speech recognition) --------------------------------

  SiteAssistant.prototype.toggleListening = function () {
    if (this.listening) this.stopListening();
    else this.startListening();
  };

  SiteAssistant.prototype.startListening = function () {
    if (!this.SR || this.listening || this.busy) return;
    var self = this;
    var rec;
    try { rec = new this.SR(); } catch (e) { return; }
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    this.recognition = rec;

    rec.onresult = function (ev) {
      var text = "";
      for (var i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
      self.input.value = String(text).slice(0, 500);
      var last = ev.results[ev.results.length - 1];
      if (last && last.isFinal) {
        // Final phrase: auto-submit so it feels like talking.
        var msg = self.input.value;
        self.input.value = "";
        self.stopListening();
        self.handleUserMessage(msg);
      }
    };
    // Any error (including a denied mic permission) fails quietly back to text.
    rec.onerror = function () { self.stopListening(); };
    rec.onend = function () { self.setListeningState(false); self.recognition = null; };

    try { rec.start(); } catch (e) { this.setListeningState(false); this.recognition = null; return; }
    this.setListeningState(true);
  };

  SiteAssistant.prototype.stopListening = function () {
    this.setListeningState(false);
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
  };

  SiteAssistant.prototype.setListeningState = function (on) {
    this.listening = on;
    if (!this.micBtn) return;
    if (on) {
      this.micBtn.classList.add("sa-listening");
      this.micBtn.setAttribute("aria-pressed", "true");
      this.input.setAttribute("placeholder", this.cfg.labels.listening);
    } else {
      this.micBtn.classList.remove("sa-listening");
      this.micBtn.setAttribute("aria-pressed", "false");
      this.input.setAttribute("placeholder", this.cfg.labels.inputPlaceholder);
    }
  };

  // ---- speak replies (server voice preferred, browser voice fallback) -------

  SiteAssistant.prototype.toggleSpeak = function () {
    this.speakOn = !this.speakOn;
    if (this.spkBtn) {
      this.spkBtn.setAttribute("aria-pressed", this.speakOn ? "true" : "false");
      this.spkBtn.innerHTML = this.speakOn ? speakerOnIconSvg() : speakerOffIconSvg();
    }
    // Turning it off stops any speech already in progress: the filler cue, a
    // playing server-voice clip, and the browser speechSynthesis.
    if (!this.speakOn) {
      this.stopFiller();
      this.stopTtsAudio();
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }
  };

  SiteAssistant.prototype.speakReply = function (text) {
    var clean = String(text == null ? "" : text).trim();
    // Nothing to say (toggle off, or empty reply): make sure the filler is not
    // left running.
    if (!this.speakOn || !clean) { this.stopFiller(); return; }
    var cfg = this.cfg;
    var self = this;

    // Preferred path: the branded server voice from the TTS endpoint. When
    // cfg.ttsUrl is set, POST {tenantId, text} and play the returned audio as
    // early as the browser allows, stopping the filler the instant it starts.
    // On any non-audio response or playback failure we fall back to the browser
    // voice. ttsUrl unset (default) uses the browser speechSynthesis fallback.
    if (cfg.ttsUrl) {
      fetch(cfg.ttsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: cfg.tenantId, text: clean })
      })
        .then(function (r) {
          var ct = (r.headers && r.headers.get("content-type")) || "";
          if (!r.ok || ct.indexOf("audio") === -1) throw new Error("no audio");
          return r.blob();
        })
        .then(function (blob) {
          if (!self.speakOn) { self.stopFiller(); return; } // toggle flipped while fetching
          var objUrl = URL.createObjectURL(blob);
          self.stopTtsAudio(); // never overlap a prior clip
          var audio = new Audio();
          self._ttsAudio = audio;
          var cleanup = function () {
            try { URL.revokeObjectURL(objUrl); } catch (e) {}
            if (self._ttsAudio === audio) self._ttsAudio = null;
          };
          // Stop the filler exactly when the real voice begins - no overlap.
          audio.addEventListener("playing", function () { self.stopFiller(); });
          audio.addEventListener("ended", cleanup);
          audio.addEventListener("error", cleanup);
          audio.src = objUrl;
          audio.play().then(function () {
            self.stopFiller(); // belt and suspenders if "playing" is delayed
          }).catch(function () {
            cleanup();
            self.speakWithBrowser(clean); // browser voice stops the filler on start
          });
        })
        .catch(function () { self.speakWithBrowser(clean); });
      return;
    }

    this.speakWithBrowser(clean);
  };

  // ---- filler cue (Web Audio "thinking" blip while a reply is prepared) ------
  // A very quiet synthesized cue (no speech, no external asset) played from the
  // moment the visitor sends until the real voice starts, so the wait does not
  // feel dead. Only when read-aloud is on; never under prefers-reduced-motion;
  // silent no-op if Web Audio is unavailable.

  SiteAssistant.prototype.fillerAllowed = function () {
    if (!this.speakOn) return false;
    if (!(window.AudioContext || window.webkitAudioContext)) return false;
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    } catch (e) {}
    return true;
  };

  SiteAssistant.prototype.startFiller = function () {
    if (this._filler) return;            // already running
    if (!this.fillerAllowed()) return;   // off / reduced motion / unsupported
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx;
    try {
      ctx = this._audioCtx || new AC();
      this._audioCtx = ctx;
      if (ctx.state === "suspended" && ctx.resume) { ctx.resume().catch(function () {}); }
    } catch (e) { return; } // fail silent if Web Audio cannot start

    var self = this;
    var stopped = false;
    var timer = null;
    var safety = null;
    var live = []; // active nodes, so a stop can silence any sounding blip at once

    function blip() {
      if (stopped) return;
      var now;
      try { now = ctx.currentTime; } catch (e) { return; }
      // Two soft sine notes, a gentle rising cue. Peak gain ~0.15 (very quiet).
      // forEach gives each note its own scope, so the onended closure below
      // captures the right node (no shared-var loop trap).
      [[523.25, 0], [659.25, 0.12]].forEach(function (pair) {
        try {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = pair[0];
          var t = now + pair[1];
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.15, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.26);
          var node = { osc: osc, gain: gain };
          live.push(node);
          osc.onended = function () {
            var k = live.indexOf(node);
            if (k !== -1) live.splice(k, 1);
          };
        } catch (e) {}
      });
    }

    blip();
    // Repeat gently so a longer wait still feels alive.
    timer = setInterval(blip, 1600);
    // Hard safety cap: never let the cue run forever, even if real audio never
    // starts (e.g. speech voices never load). Better to go quiet than to blip on.
    safety = setTimeout(function () { self.stopFiller(); }, 8000);

    this._filler = {
      stop: function () {
        if (stopped) return;
        stopped = true;
        if (timer) { clearInterval(timer); timer = null; }
        if (safety) { clearTimeout(safety); safety = null; }
        // Silence anything currently sounding immediately (no overlap with the
        // real voice).
        var end;
        try { end = ctx.currentTime; } catch (e) { end = 0; }
        for (var i = 0; i < live.length; i++) {
          try {
            live[i].gain.gain.cancelScheduledValues(end);
            live[i].gain.gain.setValueAtTime(0.0001, end);
            live[i].osc.stop(end + 0.02);
          } catch (e) {}
        }
        live = [];
      }
    };
  };

  SiteAssistant.prototype.stopFiller = function () {
    if (this._filler) {
      try { this._filler.stop(); } catch (e) {}
      this._filler = null;
    }
  };

  // Stop and release any server-voice clip currently playing (used on toggle
  // off and on close so the voice never keeps playing or overlaps).
  SiteAssistant.prototype.stopTtsAudio = function () {
    var a = this._ttsAudio;
    if (!a) return;
    this._ttsAudio = null;
    try { a.pause(); } catch (e) {}
    try { a.src = ""; } catch (e) {}
  };

  // Rank-pick the warmest natural English voice the device offers, so the
  // free built-in speech sounds friendly (Quinn-style) instead of robotic.
  // Order: known good warm female voices across iOS, Chrome, Edge, Android;
  // then any en-US that is not obviously a male-named voice; then any English.
  function pickBrowserVoice(synth) {
    var voices = synth.getVoices ? synth.getVoices() : [];
    if (!voices.length) return null;
    var en = voices.filter(function (v) { return v && /^en\b|^en[-_]/i.test(v.lang || ""); });
    if (!en.length) en = voices;
    var prefer = ["samantha", "ava", "allison", "susan", "nicky", "serena", "karen", "moira",
      "fiona", "tessa", "google us english", "aria", "jenny", "michelle", "sonia", "natasha",
      "clara", "zira"];
    for (var p = 0; p < prefer.length; p++) {
      for (var i = 0; i < en.length; i++) {
        if (en[i].name && en[i].name.toLowerCase().indexOf(prefer[p]) !== -1) return en[i];
      }
    }
    var male = /\b(daniel|alex|fred|thomas|arthur|oliver|george|james|rishi|aaron|albert|male)\b/i;
    var usFemale = en.filter(function (v) { return /en[-_]US/i.test(v.lang || "") && !male.test(v.name || ""); });
    if (usFemale.length) return usFemale[0];
    var nonMale = en.filter(function (v) { return !male.test(v.name || ""); });
    if (nonMale.length) return nonMale[0];
    return en[0];
  }

  SiteAssistant.prototype.speakWithBrowser = function (text) {
    if (!this.speakOn) { this.stopFiller(); return; }
    var synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance !== "function") { this.stopFiller(); return; } // silent if unavailable
    var self = this;
    var doSpeak = function () {
      try {
        synth.cancel(); // cancel any prior utterance before speaking
        var u = new window.SpeechSynthesisUtterance(text);
        var v = pickBrowserVoice(synth);
        u.lang = (v && v.lang) || "en-US";
        u.rate = 1.0;
        u.pitch = 1.05; // a touch warmer
        if (v) u.voice = v;
        // Stop the filler the instant the browser voice actually starts.
        u.onstart = function () { self.stopFiller(); };
        synth.speak(u);
      } catch (e) { self.stopFiller(); }
    };
    // On some browsers voices are not ready on the first call; wait once.
    var voices = synth.getVoices ? synth.getVoices() : [];
    if (!voices.length && typeof synth.addEventListener === "function") {
      var once = function () { try { synth.removeEventListener("voiceschanged", once); } catch (e) {} if (self.speakOn) doSpeak(); };
      synth.addEventListener("voiceschanged", once);
      setTimeout(function () {
        if (synth.getVoices && synth.getVoices().length) { try { synth.removeEventListener("voiceschanged", once); } catch (e) {} if (self.speakOn) doSpeak(); }
      }, 300);
      return;
    }
    doSpeak();
  };

  SiteAssistant.prototype.focusable = function () {
    return Array.prototype.slice.call(
      this.panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  };

  SiteAssistant.prototype.trapTab = function (e) {
    var items = this.focusable();
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  SiteAssistant.prototype.toggle = function () { this.open ? this.close() : this.openPanel(); };

  SiteAssistant.prototype.openPanel = function () {
    if (this.open) return;
    this.dismissPeek(); // opening the chat retires the peek for this session
    this.open = true;
    track(this.cfg, "open");
    this.lastFocus = document.activeElement;
    this.panel.classList.add("sa-open");
    if (this.scrim) this.scrim.classList.add("sa-open");
    this.launch.setAttribute("aria-expanded", "true");
    if (!this.greeted) {
      this.addMessage("bot", this.cfg.greeting);
      this.greeted = true;
    }
    var self = this;
    this.bindViewport();
    // On mobile, do not auto-focus: that would pop the keyboard and shift the
    // sheet on open. Let the visitor tap the field when they are ready.
    if (window.innerWidth > 480) {
      setTimeout(function () { self.input.focus(); }, 0);
    }
  };

  // Keep the mobile bottom sheet inside the VISUAL viewport when the soft
  // keyboard is up (Jacob CLEAR 2026-08-12). Chrome Android shrinks visualViewport
  // but not layout viewport; bare vh/dvh alone still leaves the X under the keys.
  // Pin with bottom + height from vv.height / offsetTop. Close stays in .sa-head
  // normal flow (flex-shrink:0). Do NOT position:fixed the body - that jumps the
  // page; overflow lock is enough.
  SiteAssistant.prototype.syncViewport = function () {
    var vv = window.visualViewport;
    var p = this.panel;
    if (!p) return;
    if (!vv || window.innerWidth > 480 || !this.open) {
      p.classList.remove("sa-kb");
      p.style.top = "";
      p.style.height = "";
      p.style.bottom = "";
      p.style.maxHeight = "";
      return;
    }
    var kbUp = (window.innerHeight - vv.height) > 80;
    if (!kbUp) {
      p.classList.remove("sa-kb");
      p.style.top = "";
      p.style.height = "";
      p.style.bottom = "";
      p.style.maxHeight = "";
      return;
    }
    // Keyboard open: fill the visible viewport. Header (with X) is the first
    // flex child so it stays on screen; message list scrolls inside.
    var h = Math.max(220, Math.floor(vv.height));
    var bottomGap = Math.max(0, Math.floor(window.innerHeight - vv.offsetTop - vv.height));
    p.classList.add("sa-kb");
    p.style.top = "auto";
    p.style.bottom = bottomGap + "px";
    p.style.height = h + "px";
    p.style.maxHeight = h + "px";
  };

  SiteAssistant.prototype.bindViewport = function () {
    var self = this;
    if (window.innerWidth <= 480) {
      this._scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var html = document.documentElement;
      var b = document.body;
      this._bodyPrev = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: b.style.overflow,
        bodyOverscroll: b.style.overscrollBehavior
      };
      html.style.overflow = "hidden";
      b.style.overflow = "hidden";
      b.style.overscrollBehavior = "none";
    }
    var vv = window.visualViewport;
    if (vv) {
      this._vvHandler = function () { if (self.open) self.syncViewport(); };
      vv.addEventListener("resize", this._vvHandler);
      vv.addEventListener("scroll", this._vvHandler);
      this._focusHandler = function () {
        [0, 50, 150, 350, 600, 1000].forEach(function (t) {
          setTimeout(function () {
            if (!self.open) return;
            self.syncViewport();
            try { window.scrollTo(0, self._scrollY || 0); } catch (e) {}
          }, t);
        });
      };
      this.input.addEventListener("focus", this._focusHandler);
    }
    this.syncViewport();
  };

  SiteAssistant.prototype.unbindViewport = function () {
    var vv = window.visualViewport;
    if (vv && this._vvHandler) {
      vv.removeEventListener("resize", this._vvHandler);
      vv.removeEventListener("scroll", this._vvHandler);
    }
    if (this._focusHandler) {
      try { this.input.removeEventListener("focus", this._focusHandler); } catch (e) {}
    }
    this._vvHandler = null;
    this._focusHandler = null;
    if (this._bodyPrev) {
      var html = document.documentElement;
      var b = document.body;
      html.style.overflow = this._bodyPrev.htmlOverflow || "";
      b.style.overflow = this._bodyPrev.bodyOverflow || "";
      b.style.overscrollBehavior = this._bodyPrev.bodyOverscroll || "";
      this._bodyPrev = null;
      window.scrollTo(0, this._scrollY || 0);
    }
    if (this.panel) {
      this.panel.classList.remove("sa-kb");
      this.panel.style.top = "";
      this.panel.style.height = "";
      this.panel.style.bottom = "";
      this.panel.style.maxHeight = "";
    }
  };

  SiteAssistant.prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.unbindViewport();
    this.stopListening(); // never leave the mic stuck on after close
    this.stopFiller();    // never leave the filler cue running after close
    this.stopTtsAudio();  // stop any server-voice clip still playing
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    this.panel.classList.remove("sa-open");
    if (this.scrim) this.scrim.classList.remove("sa-open");
    this.launch.setAttribute("aria-expanded", "false");
    if (this.lastFocus && typeof this.lastFocus.focus === "function") {
      try { this.lastFocus.focus({ preventScroll: true }); } catch (e) { this.lastFocus.focus(); }
    } else {
      try { this.launch.focus({ preventScroll: true }); } catch (e2) { this.launch.focus(); }
    }
  };

  // ---- boot -----------------------------------------------------------------

  // The most-recently-initialized instance. The global open hook and the
  // delegated data-ask-jessica listener both act on this one, so an on-page
  // "Ask Jessica" trigger opens the live widget.
  var activeInstance = null;
  var externalWired = false;

  // Open the active widget from an outside trigger. Safe no-op (no throw) if the
  // widget has not initialized yet.
  function externalOpen() {
    if (activeInstance && typeof activeInstance.openFromExternal === "function") {
      activeInstance.openFromExternal();
    }
  }

  // Wire the page-level open hooks ONCE: a delegated click listener for any
  // element carrying data-ask-jessica, and a tiny guarded global. Both simply
  // open + focus the panel; they never throw if the widget is not ready.
  function wireExternalOpen() {
    if (externalWired) return;
    externalWired = true;

    document.addEventListener("click", function (e) {
      var trigger = e.target && e.target.closest ? e.target.closest("[data-ask-jessica]") : null;
      if (!trigger) return;
      e.preventDefault();
      externalOpen();
    });

    // Expose a small, safe global so a page can open the chat programmatically.
    // Do not overwrite an existing one (another script may have defined it).
    if (!window.VendlyAssistant) {
      window.VendlyAssistant = { open: externalOpen };
    } else if (typeof window.VendlyAssistant.open !== "function") {
      window.VendlyAssistant.open = externalOpen;
    }
  }

  function init(userCfg) {
    var cfg = merge(userCfg || {});
    injectCss(typeof cfg.accent === "string" && cfg.accent ? cfg.accent : DEFAULTS.accent, cfg.theme);
    var inst = new SiteAssistant(cfg);
    activeInstance = inst;
    wireExternalOpen();
    return inst;
  }

  window.SiteAssistant = { init: init };
  // Wire the page-level open hooks immediately, even before (or without) an
  // init, so window.VendlyAssistant.open and data-ask-jessica exist right away
  // and safely no-op until the widget is ready.
  wireExternalOpen();
  function autostart() { if (window.SiteAssistantConfig) init(window.SiteAssistantConfig); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autostart);
  } else {
    autostart();
  }
})();
