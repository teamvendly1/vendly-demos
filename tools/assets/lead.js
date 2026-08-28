/*
 * Vendly free tools - optional lead capture.
 *
 * Uses Klaviyo's public CLIENT API (subscriptions + events), the same
 * endpoint pattern already proven safe in production at
 * vendly-code/vendly-apps/siteassistant/v2-llm/src/lib/klaviyo.ts:
 *   - keyed only by the tenant's PUBLIC company id (not a secret - this is
 *     the same id a Klaviyo signup form ships in any browser)
 *   - no server, no token, nothing stored on this static page
 *   - fires ONLY when the visitor explicitly submits the opt-in form -
 *     never on load, never required to use the calculator
 *
 * VENDLY_KLAVIYO is Vendly's own public company id + list id (not a
 * client's). Honest-only: this never claims the email was verified or that
 * a human will respond - it says what it does and nothing more.
 */
(function () {
  "use strict";

  var VENDLY_KLAVIYO = {
    companyId: "RAimGj",
    listId: "S9vQLg"
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function normalizeEmail(raw) {
    var e = (raw || "").toString().trim().toLowerCase().slice(0, 254);
    return EMAIL_RE.test(e) ? e : "";
  }

  function subscribeToList(email) {
    var url = "https://a.klaviyo.com/client/subscriptions/?company_id=" + encodeURIComponent(VENDLY_KLAVIYO.companyId);
    var payload = {
      data: {
        type: "subscription",
        attributes: { profile: { data: { type: "profile", attributes: { email: email } } } },
        relationships: { list: { data: { type: "list", id: VENDLY_KLAVIYO.listId } } }
      }
    };
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", revision: "2024-10-15" },
      body: JSON.stringify(payload)
    });
  }

  function sendToolLeadEvent(email, toolName, extra) {
    var url = "https://a.klaviyo.com/client/events/?company_id=" + encodeURIComponent(VENDLY_KLAVIYO.companyId);
    var props = Object.assign(
      {
        source: "Free Tools",
        tool: toolName,
        page: typeof location !== "undefined" ? location.href : ""
      },
      extra || {}
    );
    var payload = {
      data: {
        type: "event",
        attributes: {
          properties: props,
          metric: { data: { type: "metric", attributes: { name: "Website Lead" } } },
          profile: { data: { type: "profile", attributes: { email: email } } }
        }
      }
    };
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", revision: "2024-10-15" },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Wire up a lead-capture form on the page. Call once per tool page.
   * formId: the <form> element id
   * toolName: human label used on the "Website Lead" event (e.g. "Quote Calculator")
   * getExtra: optional function returning a plain object of extra event properties
   *           (e.g. the computed total) - never PII beyond what the visitor typed.
   */
  function wireLeadForm(formId, toolName, getExtra) {
    var form = document.getElementById(formId);
    if (!form) return;
    var msgEl = form.querySelector(".lead-msg");
    var emailInput = form.querySelector('input[type="email"]');
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      var email = normalizeEmail(emailInput ? emailInput.value : "");
      if (!email) {
        setMsg("That email does not look right - try again.", "err");
        return;
      }
      if (submitBtn) submitBtn.disabled = true;
      setMsg("Sending...", "");

      var extra = typeof getExtra === "function" ? getExtra() || {} : {};

      Promise.all([subscribeToList(email), sendToolLeadEvent(email, toolName, extra)])
        .then(function (responses) {
          var ok = responses.every(function (r) {
            return r.ok || r.status === 202;
          });
          if (ok) {
            setMsg("Done. Check your inbox to confirm.", "ok");
            if (emailInput) emailInput.value = "";
          } else {
            setMsg("Could not save that right now - the tool still works fine without it.", "err");
          }
        })
        .catch(function () {
          setMsg("Could not reach the sign-up service - the tool still works fine without it.", "err");
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });

    function setMsg(text, cls) {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.className = "lead-msg" + (cls ? " " + cls : "");
    }
  }

  window.VendlyLead = {
    normalizeEmail: normalizeEmail,
    wireLeadForm: wireLeadForm
  };
})();
