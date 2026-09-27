import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, MailCheck } from "lucide-react";
import { requestPasswordReset, confirmPasswordReset } from "../api.js";
import { useI18n } from "../context/I18nContext.jsx";
import AuthLayout from "./AuthLayout.jsx";
import styles from "./AuthLayout.module.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [stage, setStage] = useState("request");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setStage("confirm");
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("apiUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError(t("resetMismatch"));
      return;
    }
    setBusy(true);
    try {
      await confirmPasswordReset(email.trim(), code.trim(), password);
      setStage("done");
      setPassword("");
      setConfirmation("");
      setCode("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("apiUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          color: "var(--primary)",
          marginBottom: 18,
        }}
        aria-hidden="true"
      >
        {stage === "done" ? <MailCheck size={32} /> : <KeyRound size={32} />}
      </div>
      <h2>{t("resetTitle")}</h2>
      <p className={styles.subtitle}>
        {stage === "done" ? t("resetSuccess") : t("resetSubtitle")}
      </p>

      {stage === "request" && (
        <form onSubmit={sendCode}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reset-email">{t("email")}</FieldLabel>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
          </FieldGroup>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            className={styles.primaryButton}
            type="submit"
            disabled={busy}
          >
            {busy && <Spinner data-icon="inline-start" />}
            {t("resetSendCode")}
          </Button>
        </form>
      )}

      {stage === "confirm" && (
        <form onSubmit={savePassword}>
          <Alert>
            <AlertDescription>{t("resetCodeSent")}</AlertDescription>
          </Alert>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reset-code">
                {t("resetCodeLabel")}
              </FieldLabel>
              <Input
                id="reset-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{8}"
                maxLength={8}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="reset-password">
                {t("resetNewPassword")}
              </FieldLabel>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="reset-confirm">
                {t("resetConfirmPassword")}
              </FieldLabel>
              <Input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </Field>
          </FieldGroup>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            className={styles.primaryButton}
            type="submit"
            disabled={busy}
          >
            {busy && <Spinner data-icon="inline-start" />}
            {t("resetSave")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStage("request");
              setError("");
            }}
            disabled={busy}
          >
            {t("resetRequestAgain")}
          </Button>
        </form>
      )}

      <p className={styles.switchAuth}>
        <Link to="/login">{t("goLogin")}</Link>
      </p>
    </AuthLayout>
  );
}
