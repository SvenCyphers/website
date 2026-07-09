(function () {
  function getSubmitButton(form) {
    return form.querySelector('button[type="submit"], input[type="submit"]');
  }

  function setMessage(form, text, type) {
    var message = form.querySelector('.cf-form-message');
    if (!message) {
      message = document.createElement('div');
      message.className = 'cf-form-message';
      message.setAttribute('role', 'status');
      form.appendChild(message);
    }

    message.textContent = text;
    message.style.marginTop = '16px';
    message.style.fontSize = '15px';
    message.style.lineHeight = '1.5';
    message.style.color = type === 'error' ? '#b91c1c' : '#047857';
  }

  async function submitForm(event) {
    var form = event.target;
    if (!form || !form.matches('form.elementor-form')) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    var button = getSubmitButton(form);
    var originalText = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = 'Versturen...';
    }

    try {
      var response = await fetch('/api/contact', {
        method: 'POST',
        body: new FormData(form),
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Formulier kon niet worden verzonden.');
      }

      form.reset();
      setMessage(form, 'Bedankt, je bericht is ontvangen. We nemen zo snel mogelijk contact op.', 'success');
    } catch (error) {
      setMessage(form, 'Er ging iets mis bij het versturen. Probeer het later opnieuw of mail naar info@cyphers.nl.', 'error');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  document.addEventListener('submit', submitForm, true);
})();

