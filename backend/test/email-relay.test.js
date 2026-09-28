const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "..", "email-relay", "Code.gs"),
  "utf8",
);

function createRelay() {
  const sent = [];
  const context = {
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput(body) {
        return { body, setMimeType() { return this; } };
      },
    },
    PropertiesService: {
      getScriptProperties() {
        return { getProperty: () => "relay-secret" };
      },
    },
    MailApp: {
      sendEmail(options) { sent.push(options); },
      getRemainingDailyQuota: () => 100,
    },
    console: { error() {} },
  };
  vm.runInNewContext(source, context, { filename: "Code.gs" });
  const post = (payload) => JSON.parse(context.doPost({
    postData: { contents: JSON.stringify({ secret: "relay-secret", to: "user@example.com", ...payload }) },
  }).body);
  return { sent, post };
}

test("registration email has its own subject and teal visual treatment", () => {
  const { sent, post } = createRelay();
  assert.equal(post({ code: "123456" }).ok, true);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /Підтвердження реєстрації/);
  assert.match(sent[0].htmlBody, /Вітаємо в TaskFlow/);
  assert.match(sent[0].htmlBody, /#087f75/);
  assert.match(sent[0].htmlBody, /123456/);
});

test("password reset email has a distinct subject and amber visual treatment", () => {
  const { sent, post } = createRelay();
  assert.equal(post({ code: "654321", purpose: "password-reset" }).ok, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "Код для скидання пароля TaskFlow");
  assert.match(sent[0].htmlBody, /Скидання пароля/);
  assert.match(sent[0].htmlBody, /#fff0d8/);
  assert.match(sent[0].htmlBody, /654321/);
  assert.doesNotMatch(sent[0].htmlBody, /Підтвердження реєстрації/);
  assert.match(sent[0].body, /654321/);
});

test("relay rejects invalid purpose and preserves portfolio inquiries", () => {
  const { sent, post } = createRelay();
  assert.equal(post({ code: "123456", purpose: "other" }).ok, false);
  assert.equal(sent.length, 0);
  assert.equal(post({ subject: "Inquiry", text: "Hello <script>" }).ok, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "Inquiry");
  assert.match(sent[0].htmlBody, /&lt;script&gt;/);
});
