// Copper Brokers LLC clone + Vendly concierge bolt-on — shared script
(function(){
  document.documentElement.classList.add('js');

  var toggle = document.querySelector('.nav-toggle');
  var navList = document.querySelector('.main-nav ul');
  if (toggle && navList) {
    toggle.addEventListener('click', function(){
      var open = navList.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navList.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ navList.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); });
    });
  }

  var revealAll = function(){
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('is-visible'); });
  };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' });
      document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
    } else { revealAll(); }
  } catch (e) { revealAll(); }
  window.setTimeout(revealAll, 1800);

  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });

  // Contact / quote form (site content page) — mailto handoff, same pattern as the client build.
  var form = document.querySelector('form.quote-form');
  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var phone = (data.get('phone') || '').toString().trim();
      var message = (data.get('message') || '').toString().trim();
      var status = document.getElementById('form-status');
      if (!name || !phone) {
        if (status) { status.textContent = 'Please add your name and a phone number.'; status.className = 'form-status show'; }
        return;
      }
      var body = ['Name: ' + name, 'Phone: ' + phone, '', 'Message:', message || '(none)'].join('\n');
      var mailto = 'mailto:copperbrokersrecycling@gmail.com?subject=' + encodeURIComponent('Quote Request from ' + name) + '&body=' + encodeURIComponent(body);
      if (status) { status.textContent = 'Opening your email app, pre-filled — just hit send.'; status.className = 'form-status show'; }
      window.location.href = mailto;
    });
  }

  // ---------------------------------------------------------------
  // VENDLY CONCIERGE BOLT-ON (our addition, layered on top of the clone)
  // ---------------------------------------------------------------
  try {
    var banner = document.getElementById('vendly-banner');
    var bannerClose = document.getElementById('vendly-banner-close');
    var dismissed = false;
    try { dismissed = window.localStorage.getItem('vendlyBannerDismissed') === '1'; } catch (e) {}
    if (banner && dismissed) { banner.hidden = true; }
    if (banner && bannerClose) {
      bannerClose.addEventListener('click', function(){
        banner.hidden = true;
        try { window.localStorage.setItem('vendlyBannerDismissed', '1'); } catch (e) {}
      });
    }
  } catch (e) {}

  var launcher = document.getElementById('vendly-chat-launcher');
  var panel = document.getElementById('vendly-chat-panel');
  var closeBtn = document.getElementById('vendly-chat-close');
  var body = document.getElementById('vendly-chat-body');
  var chatForm = document.getElementById('vendly-chat-form');
  var chatStatus = document.getElementById('vendly-chat-status');
  var greeted = false;

  function addMsg(text, who){
    if (!body) return;
    var div = document.createElement('div');
    div.className = 'vendly-msg ' + (who === 'user' ? 'user' : 'bot');
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  if (launcher && panel) {
    launcher.addEventListener('click', function(){
      var isHidden = panel.hidden;
      panel.hidden = !isHidden;
      launcher.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      if (isHidden && !greeted) {
        greeted = true;
        addMsg('Hi, thanks for reaching out to Copper Brokers. Do you have HVAC units or scrap metal you need picked up?', 'bot');
      }
    });
  }
  if (closeBtn && panel) {
    closeBtn.addEventListener('click', function(){ panel.hidden = true; if (launcher) launcher.setAttribute('aria-expanded','false'); });
  }
  if (chatForm) {
    chatForm.addEventListener('submit', function(e){
      e.preventDefault();
      var data = new FormData(chatForm);
      var name = (data.get('cname') || '').toString().trim();
      var phone = (data.get('cphone') || '').toString().trim();
      if (!name || !phone) {
        if (chatStatus) { chatStatus.textContent = 'Add your name and phone so Cory can call you back.'; chatStatus.className = 'vendly-chat-status show'; }
        return;
      }
      addMsg(name + ' — ' + phone, 'user');
      addMsg('Got it. Cory (or his team) will reach out shortly. Thanks for stopping by.', 'bot');
      chatForm.reset();
      if (chatStatus) { chatStatus.textContent = 'Lead captured. In a live install this posts straight to the client dashboard and text/email alerts fire immediately.'; chatStatus.className = 'vendly-chat-status show'; }
    });
  }
})();
