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
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    },{threshold:0.12,rootMargin:'0px 0px -8% 0px'});
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

/* Review carousel chevrons (Google-look 2026-08-12). */
(function () {
  function bind(root) {
    var track = root.querySelector('.rv-track, .rvTrack');
    if (!track) return;
    var prev = root.querySelector('[data-rv-prev]');
    var next = root.querySelector('[data-rv-next]');
    function step() {
      var card = track.querySelector('.rv-card, .rvCard');
      return card ? (card.getBoundingClientRect().width + 14) : 300;
    }
    function go(dir) {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      track.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
  }
  document.querySelectorAll('.rv-carousel, .rvCarousel').forEach(bind);
})();
