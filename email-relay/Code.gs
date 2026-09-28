function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function isEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value || '').trim());
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function verificationHtml(code) {
  return `<!doctype html><html lang="uk"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#eaf5f3;font-family:Arial,sans-serif;color:#17313a">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background:#eaf5f3;padding:32px 12px"><tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="width:100%;max-width:600px;background:#fff;border:1px solid #cfe5e1;border-radius:16px">
        <tr><td style="background:#087f75;padding:26px 32px;border-radius:16px 16px 0 0;color:#fff;font-size:18px;font-weight:700;letter-spacing:.3px">▦&nbsp; TaskFlow <span style="float:right;font-size:11px;letter-spacing:1.5px;font-weight:700">НОВИЙ АКАУНТ</span></td></tr>
        <tr><td style="padding:38px 32px 32px">
          <p style="margin:0 0 12px;color:#087f75;font-size:12px;font-weight:700;letter-spacing:1.5px">КРОК 01 / ПІДТВЕРДЖЕННЯ</p>
          <h1 style="margin:0 0 14px;color:#17313a;font-size:28px;line-height:1.2">Вітаємо в TaskFlow!</h1>
          <p style="margin:0 0 26px;color:#425b65;font-size:16px;line-height:1.6">Введіть цей код на сторінці реєстрації, щоб підтвердити адресу пошти та активувати акаунт.</p>
          <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background:#e6f5f1;border:1px solid #9bd6cd;border-radius:12px"><tr><td align="center" style="padding:23px 12px">
            <p style="margin:0 0 8px;color:#346d68;font-size:12px;font-weight:700;letter-spacing:1px">КОД ПІДТВЕРДЖЕННЯ</p>
            <span style="color:#075c56;font-size:34px;line-height:1.2;font-weight:700;letter-spacing:7px">${code}</span>
          </td></tr></table>
          <p style="margin:22px 0 0;color:#425b65;font-size:14px;line-height:1.6">Код дійсний 15 хвилин.</p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #e1ebea;color:#526b73;font-size:13px;line-height:1.6">Якщо ви не реєструвалися в TaskFlow, просто проігноруйте цей лист.</td></tr>
      </table>
    </td></tr></table></body></html>`;
}

function passwordResetHtml(code) {
  return `<!doctype html><html lang="uk"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#fff7ed;font-family:Arial,sans-serif;color:#17313a">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background:#fff7ed;padding:32px 12px"><tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="width:100%;max-width:600px;background:#fff;border:1px solid #f3d8ac;border-radius:16px">
        <tr><td style="background:#183443;padding:28px 32px 32px;border-radius:16px 16px 0 0;color:#fff">
          <p style="margin:0 0 28px;font-size:18px;font-weight:700">▦&nbsp; TaskFlow</p>
          <p style="margin:0 0 10px;color:#ffd392;font-size:12px;font-weight:700;letter-spacing:1.5px">БЕЗПЕКА АКАУНТА</p>
          <h1 style="margin:0;color:#fff;font-size:29px;line-height:1.2">Скидання пароля</h1>
        </td></tr>
        <tr><td style="padding:32px 32px 30px">
          <p style="margin:0 0 24px;color:#425b65;font-size:16px;line-height:1.6">Ми отримали запит на зміну пароля. Введіть код нижче на сторінці скидання пароля:</p>
          <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background:#fff0d8;border:1px solid #f0bf70;border-radius:12px"><tr><td align="center" style="padding:23px 12px">
            <p style="margin:0 0 8px;color:#83540b;font-size:12px;font-weight:700;letter-spacing:1px">КОД ДЛЯ СКИДАННЯ</p>
            <span style="color:#694108;font-size:34px;line-height:1.2;font-weight:700;letter-spacing:7px">${code}</span>
          </td></tr></table>
          <p style="margin:22px 0 0;color:#425b65;font-size:14px;line-height:1.6">Код дійсний 15 хвилин.</p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #f2e4ce;color:#526b73;font-size:13px;line-height:1.6">Не запитували зміну пароля? Проігноруйте цей лист. Без коду ваш пароль не зміниться.</td></tr>
      </table>
    </td></tr></table></body></html>`;
}

function doPost(e) {
  try {
    var payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    var relaySecret = PropertiesService.getScriptProperties().getProperty('RELAY_SECRET');

    if (!relaySecret || payload.secret !== relaySecret) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    var recipient = String(payload.to || '').trim();
    if (!isEmail(recipient)) {
      return jsonResponse({ ok: false, error: 'invalid_payload' });
    }

    var code = String(payload.code || '').trim();
    if (code) {
      if (!/^\d{6}$/.test(code)) {
        return jsonResponse({ ok: false, error: 'invalid_payload' });
      }

      var purpose = String(payload.purpose || 'verification').trim();
      if (purpose !== 'verification' && purpose !== 'password-reset') {
        return jsonResponse({ ok: false, error: 'invalid_payload' });
      }

      var reset = purpose === 'password-reset';
      MailApp.sendEmail({
        to: recipient,
        subject: reset ? 'Код для скидання пароля TaskFlow' : 'Підтвердження реєстрації в TaskFlow',
        body: reset
          ? 'Код для скидання пароля TaskFlow: ' + code + '\n\nКод дійсний 15 хвилин. Якщо ви не запитували зміну пароля, проігноруйте цей лист.'
          : 'Код підтвердження реєстрації TaskFlow: ' + code + '\n\nКод дійсний 15 хвилин. Якщо ви не реєструвалися, проігноруйте цей лист.',
        htmlBody: reset ? passwordResetHtml(code) : verificationHtml(code),
        name: 'TaskFlow'
      });
      return jsonResponse({ ok: true });
    }

    if (payload.purpose) {
      return jsonResponse({ ok: false, error: 'invalid_payload' });
    }

    var subject = String(payload.subject || '').trim().slice(0, 160);
    var text = String(payload.text || '').trim().slice(0, 4000);
    var replyTo = String(payload.replyTo || '').trim();

    if (!subject || !text || (replyTo && !isEmail(replyTo))) {
      return jsonResponse({ ok: false, error: 'invalid_payload' });
    }

    var safeText = escapeHtml(text).split(String.fromCharCode(10)).join('<br>');
    var portfolioHtml = '<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#111827;color:#e5e7eb;border-radius:16px">' +
      '<h1 style="margin:0 0 16px;color:#fff">Portfolio inquiry</h1>' +
      '<div style="background:#020617;border:1px solid #334155;border-radius:12px;padding:20px;line-height:1.55">' + safeText + '</div>' +
      '</div>';

    var mailOptions = {
      to: recipient,
      subject: subject,
      htmlBody: portfolioHtml,
      body: text,
      name: 'Portfolio'
    };

    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    MailApp.sendEmail(mailOptions);
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: 'send_failed' });
  }
}

function authorizeMail() {
  return MailApp.getRemainingDailyQuota();
}
