// Copper Brokers LLC — go-live site script
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

  var form = document.querySelector('form.quote-form');
  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var phone = (data.get('phone') || '').toString().trim();
      var email = (data.get('email') || '').toString().trim();
      var service = (data.get('service') || '').toString().trim();
      var size = (data.get('size') || '').toString().trim();
      var message = (data.get('message') || '').toString().trim();
      var status = document.getElementById('form-status');
      if (!name || !phone) {
        if (status) { status.textContent = 'Please add your name and a phone number so Cory can reach you back.'; status.className = 'form-status show'; }
        return;
      }
      var bodyLines = [
        'Name: ' + name,
        'Phone: ' + phone,
        'Email: ' + (email || 'not provided'),
        'Service needed: ' + (service || 'not specified'),
        'Quantity / size: ' + (size || 'not specified'),
        '',
        'Message:',
        message || '(none)'
      ];
      var mailto = 'mailto:copperbrokersrecycling@gmail.com?subject=' + encodeURIComponent('Quote Request from ' + name) + '&body=' + encodeURIComponent(bodyLines.join('\n'));
      if (status) { status.textContent = 'Opening your email app with this request pre-filled to Cory — just hit send.'; status.className = 'form-status show'; }
      window.location.href = mailto;
    });
  }
})();
