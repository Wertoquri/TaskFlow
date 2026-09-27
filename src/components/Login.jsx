import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { loginUser } from "../api.js";
import VerifyEmail from "./VerifyEmail.jsx";
import AuthLayout from "./AuthLayout.jsx";
import styles from "./AuthLayout.module.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userId, setUserId] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.needsVerification) {
        setUserId(response.userId);
        setNeedsVerification(true);
      } else {
        setError(
          response?.message ||
            (requestError.response?.status >= 500 || !requestError.response
              ? t("apiUnavailable")
              : t("loginInvalid")),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleVerified(data) {
    login(data.token, data.user);
    navigate("/dashboard");
    window.location.reload();
  }

  if (needsVerification) {
    return (
      <VerifyEmail userId={userId} email={email} onVerified={handleVerified} />
    );
  }

  return (
    <AuthLayout>
      <h2>{t("loginTitle")}</h2>
      <p className={styles.subtitle}>{t("loginSubtitle")}</p>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="login-email">{t("email")}</FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="login-password">{t("password")}</FieldLabel>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
        </FieldGroup>
        <Link className={styles.forgotLink} to="/forgot-password">
          {t("forgotPassword")}
        </Link>
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
          {t("loginBtn")}
        </Button>
      </form>
      <p className={styles.switchAuth}>
        {t("noAccount")} <Link to="/register">{t("goRegister")}</Link>
      </p>
    </AuthLayout>
  );
}
