# TaskFlow email relay

`Code.gs` is the source of the existing Google Apps Script web app used by the free Render service. It accepts the existing `RELAY_SECRET` Script Property and the existing `EMAIL_API_URL`; no credentials belong in this repository.

The registration request sends `{ secret, to, code }` and receives a teal welcome email. Password recovery sends `{ secret, to, code, purpose: "password-reset" }` and receives a separate amber security email. Both codes are six digits. The portfolio inquiry request without a code remains supported.

To update the existing web app, replace its `Code.gs` content, save, then open **Deploy → Manage deployments → Edit** on the active deployment. Select **New version** and deploy that version. Edit the active deployment instead of creating a new one so `EMAIL_API_URL` remains unchanged. The existing `RELAY_SECRET` Script Property stays in place. After deployment, request a new reset code and check that the email subject is **Код для скидання пароля TaskFlow**.

If the new version has a problem, select the previous deployment version in the same dialog and deploy it again.
