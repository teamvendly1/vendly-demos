/* RiverTown Cooling shared site behavior: nav toggle, scroll reveal,
   counters, scroll restoration. Extracted from the per-page inline script
   (data-grind-motion 2357, ref-learn 0037) so every page shares one file. */
(function(){/* demo-motion-20260812 CATTAILS-NOT-GLOBAL PERSONALIZE-PER-BUSINESS */
  try{
    /* Jacob phone audit 2026-08-02 (em2154): opening the demo on a phone
       landed partway down instead of the hero. Two causes stack: browsers
       restoring the prior scroll position on reload, and a stale #quote hash
       forcing a jump on first paint. scrollRestoration=manual kills the
       first. For the second, only clear the hash when it was NOT the result
       of an intentional in-page click this session (rc-quote-intent flag,
       set below) - so a real "Get estimate" / #quote click still lands on
       the quote section, on this load and on any later reload. */
    if('scrollRestoration' in history){ history.scrollRestoration='manual'; }
    if(window.location.hash==='#quote' && !sessionStorage.getItem('rc-quote-intent')){
      history.replaceState(null,'',window.location.pathname+window.location.search);
      window.scrollTo(0,0);
    } else if(!window.location.hash){
      window.scrollTo(0,0);
    }
    document.querySelectorAll('a[href="#quote"],a[href$="#quote"]').forEach(function(a){
      a.addEventListener('click',function(){
        try{ sessionStorage.setItem('rc-quote-intent','1'); }catch(e){}
      });
    });

    var navBtn=document.getElementById('navtoggle'), navPanel=document.getElementById('sitemenu');
    if(navBtn && navPanel){
      var setNav=function(open){ navPanel.hidden=!open; navBtn.setAttribute('aria-expanded', open?'true':'false'); };
      navBtn.addEventListener('click',function(e){ e.stopPropagation(); setNav(navPanel.hidden); });
      navPanel.addEventListener('click',function(e){ if(e.target.tagName==='A') setNav(false); });
      document.addEventListener('click',function(e){ if(!navPanel.hidden && !navPanel.contains(e.target) && e.target!==navBtn) setNav(false); });
      document.addEventListener('keydown',function(e){ if(e.key==='Escape' && !navPanel.hidden){ setNav(false); navBtn.focus(); } });
    }
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced){
      document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});
      document.querySelectorAll('[data-counter]').forEach(function(el){
        var t=parseFloat(el.getAttribute('data-target'))||0;
        var suf=el.getAttribute('data-suffix')||'';
        el.textContent=t+suf;
      });
      return;
    }
    /* CTA-BELOW-GAP: explore after strip is on-fold; never wait on IO (sticky -8% hid it). */
    document.querySelectorAll('.strip + .reveal').forEach(function(el){el.classList.add('in');});
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    },{threshold:0.08,rootMargin:'0px 0px -72px 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});

    /* Jacob phone audit 2026-08-02 (em2154): counters did not count up on
       first mobile scroll-into-view. Fix: lower threshold (0.15, not 0.5) so
       a partly-covered numeral still fires, a generous negative bottom
       rootMargin so it fires before the element is fully clear of the sticky
       call bar, and an explicit already-intersecting check at observe time
       so an element that is already on screen when JS runs (fast scroll,
       short page) still animates instead of waiting for a scroll event that
       may never come. */
    function startCounter(el){
      if(el.dataset.counted) return;
      el.dataset.counted='1';
      var target=parseFloat(el.getAttribute('data-target'))||0;
      var suffix=el.getAttribute('data-suffix')||'';
      var dur=1100,start=null;
      function step(ts){
        if(!start) start=ts;
        var p=Math.min((ts-start)/dur,1);
        el.textContent=Math.round(target*p)+suffix;
        if(p<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var cio=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        cio.unobserve(e.target);
        startCounter(e.target);
      });
    },{threshold:0.15,rootMargin:'0px 0px -5% 0px'});
    document.querySelectorAll('[data-counter]').forEach(function(el){
      var r=el.getBoundingClientRect();
      var vh=window.innerHeight||document.documentElement.clientHeight;
      if(r.top<vh && r.bottom>0){ startCounter(el); }
      else{ cio.observe(el); }
    });
  }catch(e){}
})();


/* sticky-stack measurement 2026-09-09
   The CSS states the header as 114px / 106px, which is what its own fixed rules produce. But
   .bizmeta wraps, so a header whose pills run to a second line is taller and a constant would
   be wrong for that demo - exactly the hardcoded-height mistake this fix exists to end. Measure
   the real thing and write it back. Fails safe: if anything here throws, the CSS value stands. */
(function(){
  try{
    var root=document.documentElement;
    function sync(){
      var strip=document.querySelector(".phone-strip");
      var head=document.querySelector("header.site");
      if(head){
        var h=Math.round(head.getBoundingClientRect().height);
        if(h>0) root.style.setProperty("--site-header-h", h+"px");
      }
      /* The strip is height-locked in CSS, so this only ever confirms it. Kept so a future
         strip change cannot silently reopen the 2px slit. */
      if(strip){
        var s=Math.round(strip.getBoundingClientRect().height);
        if(s>0) root.style.setProperty("--phone-strip-h", s+"px");
      }
    }
    sync();
    window.addEventListener("load", sync);
    window.addEventListener("resize", sync);
  }catch(e){}
})();

/* ---------------------------------------------------------------------------
   LEAD FORM DELIVERY. Added 2026-09-09 (seat gen-og-form).

   WHAT WAS BROKEN: every lead form this factory has ever shipped had no
   action, no method, and a submit handler in index.html that did
   e.preventDefault() and popped an alert. The form rendered perfectly and
   delivered nothing. Every name and number a visitor typed went nowhere.

   WHY IT LIVES HERE AND NOT IN A PAGE: site.js is copied verbatim onto every
   emitted page, so one implementation covers index.html, contact.html and any
   page that grows a form later. A handler written into one page is a handler
   the next page does not have - which is exactly how index.html ended up
   being the only page with a form at all.

   IT READS ITS OWN CONFIG, IT INVENTS NOTHING: the endpoint and tenant come
   from window.SiteAssistantConfig, which every page already carries for the
   concierge. The thank-you line comes from the form's own data-thanks, filled
   by the generator, so no copy is authored in JavaScript.

   FAIL SOFT, NEVER SILENT: if the network call fails the visitor is told to
   call instead and the phone number is right there. A form that swallows a
   lead and says "thanks" is worse than one that says it could not send.
--------------------------------------------------------------------------- */
(function () {
  var forms = document.querySelectorAll("form[data-lead-endpoint]");
  if (!forms.length) return;

  function cfg() {
    try { return window.SiteAssistantConfig || {}; } catch (e) { return {}; }
  }
  function val(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el && typeof el.value === "string" ? el.value : "";
  }
  function setNote(form, text, isError) {
    var note = form.querySelector(".formnote");
    if (!note) {
      note = document.createElement("p");
      note.className = "formnote";
      form.appendChild(note);
    }
    note.textContent = text;
    note.setAttribute("role", "status");
    note.style.color = isError ? "#8c1d18" : "";
  }

  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var c = cfg();
      var endpoint = form.getAttribute("data-lead-endpoint") || "";
      if (!/^https?:\/\//i.test(endpoint)) {
        setNote(form, "Please call us and we will take care of it.", true);
        return;
      }

      var name = val(form, "name").trim();
      var phone = val(form, "phone").trim();
      var email = val(form, "email").trim();
      if (!name || (!phone && !email)) {
        setNote(form, "Please add your name and a phone number or email so we can reply.", true);
        return;
      }

      var payload = {
        tenantId: c.tenantId || "",
        demoSlug: c.demoSlug || "",
        name: name,
        phone: phone,
        email: email,
        type: val(form, "type"),
        heard: val(form, "heard"),
        message: val(form, "message"),
        website: val(form, "website"),
        sourceUrl: (function () { try { return String(location.href).slice(0, 400); } catch (err) { return ""; } })()
      };

      if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
      setNote(form, "Sending...", false);

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().catch(function () { return { ok: r.ok }; });
      }).then(function (data) {
        if (data && data.ok) {
          var thanks = form.getAttribute("data-thanks") || "Thanks. We will get back to you shortly.";
          form.reset();
          setNote(form, thanks, false);
        } else {
          setNote(form, (data && data.error) || "That did not send. Please call us instead.", true);
        }
      }).catch(function () {
        setNote(form, "That did not send. Please call us instead.", true);
      }).then(function () {
        if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
      });
    });
  });
})();
