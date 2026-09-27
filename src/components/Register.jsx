import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api.js";
import { useI18n } from "../context/I18nContext.jsx";
import VerifyEmail from "./VerifyEmail.jsx";
import AuthLayout from "./AuthLayout.jsx";
import styles from "./AuthLayout.module.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const [demoCode, setDemoCode] = useState("");

  function validateForm() {
    if (username.length < 3 || username.length > 20) return t("usernameLenErr");
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return t("usernameCharsErr");
    if (password.length < 8) return t("passwordLenErr");
    if (!/[A-Z]/.test(password)) return t("passwordUpperErr");
    if (!/[a-z]/.test(password)) return t("passwordLowerErr");
    if (!/[0-9]/.test(password)) return t("passwordDigitErr");
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const response = await registerUser(username, email, password);
      setUserId(response.userId);
      setDemoCode(response.verificationCode || "");
      setNeedsVerification(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          (requestError.response?.status >= 500 || !requestError.response
            ? t("apiUnavailable")
            : t("registerError")),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleVerified(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/dashboard");
    window.location.reload();
  }

  if (needsVerification) {
    return (
      <VerifyEmail
        userId={userId}
        email={email}
        onVerified={handleVerified}
        demoCode={demoCode}
      />
    );
  }

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const strength =
    score <= 2
      ? { bars: 1, tone: "weak", label: t("weak") }
      : score <= 4
        ? { bars: 2, tone: "medium", label: t("medium") }
        : { bars: 4, tone: "strong", label: t("strong") };

  return (
    <AuthLayout>
      <h2>{t("registerTitle")}</h2>
      <p className={styles.subtitle}>{t("registerSubtitle")}</p>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="register-username">{t("username")}</FieldLabel>
            <Input
              id="register-username"
              autoComplete="username"
              placeholder="username123"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <FieldDescription>{t("usernameHint")}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="register-email">{t("email")}</FieldLabel>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="register-password">{t("password")}</FieldLabel>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <FieldDescription>{t("passwordLenErr")}</FieldDescription>
            {password && (
              <>
                <div className={styles.strength} aria-hidden="true">
                  {[1, 2, 3, 4].map((item) => (
                    <span
                      key={item}
                      data-active={
                        item <= strength.bars ? strength.tone : undefined
                      }
                    />
                  ))}
                </div>
                <p className={styles.strengthLabel}>{strength.label}</p>
              </>
            )}
          </Field>
        </FieldGroup>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          className={styles.primaryButton}
          disabled={loading}
        >
          {loading && <Spinner data-icon="inline-start" />}
          {t("registerBtn")}
        </Button>
      </form>
      <p className={styles.switchAuth}>
        {t("haveAccount")} <Link to="/login">{t("goLogin")}</Link>
      </p>
    </AuthLayout>
  );
}
