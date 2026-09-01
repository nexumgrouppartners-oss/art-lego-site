// Art Lego LLC site behavior: mobile nav toggle + lead form submission
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var forms = document.querySelectorAll('.lead-form');
  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form-msg');
      var btn = form.querySelector('button[type="submit"]');
      var data = Object.fromEntries(new FormData(form).entries());
      data.source = 'art-lego-site';
      data.page = window.location.pathname;
      data.submitted_at = new Date().toISOString();

      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      if (msg) { msg.textContent = ''; msg.className = 'form-msg'; }

      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok && body.ok !== false, body: body };
          });
        })
        .then(function (result) {
          if (result.ok) {
            form.reset();
            if (msg) {
              msg.textContent = "Thanks — we've got your request. Art Lego LLC will call you shortly. Need it faster? Call 561-574-3769.";
              msg.className = 'form-msg ok';
            }
          } else {
            throw new Error('lead submit failed');
          }
        })
        .catch(function () {
          if (msg) {
            msg.textContent = "Something went wrong submitting the form. Please call us directly at 561-574-3769.";
            msg.className = 'form-msg err';
          }
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Get My Free Estimate'; }
        });
    });
  });
});
