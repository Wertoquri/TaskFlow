import { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { useI18n } from "../context/I18nContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteMyAccount } from "../api.js";
import useMobileMenuPosition from "./useMobileMenuPosition.js";
import styles from "./SettingsMenu.module.css";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function SettingsMenu({ isOpen, onToggle }) {
  const { t, language, setLanguage } = useI18n();
  const { logout } = useAuth();
  const ref = useRef(null);
  const { triggerRef, menuStyle } = useMobileMenuPosition(isOpen, {
    maxWidth: 340,
  });
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) setConfirming(false);
    function handleClickOutside(event) {
      if (isOpen && ref.current && !ref.current.contains(event.target))
        onToggle();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  async function handleDeleteAccount() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      await deleteMyAccount(localStorage.getItem("token"));
      logout();
    } catch {
      window.alert(t("deleteAccountFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} className={styles.root}>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon-lg"
        className="workspaceIconButton"
        onClick={onToggle}
        aria-label={t("settings")}
        aria-expanded={isOpen}
        title={t("settings")}
      >
        <Settings2 aria-hidden="true" />
      </Button>
      {isOpen && (
        <div className={styles.dropdown} style={menuStyle || undefined}>
          <h2>{t("settings")}</h2>
          <p className={styles.label}>{t("language")}</p>
          <ToggleGroup
            type="single"
            value={language}
            onValueChange={(value) => value && setLanguage(value)}
            variant="outline"
            className={styles.languageGroup}
          >
            <ToggleGroupItem value="uk">{t("ukrainian")}</ToggleGroupItem>
            <ToggleGroupItem value="en">{t("english")}</ToggleGroupItem>
          </ToggleGroup>
          <Separator className={styles.separator} />
          <p className={styles.dangerTitle}>{t("deleteAccount")}</p>
          <p className={styles.dangerDescription}>{t("deleteAccountDesc")}</p>
          <div className={styles.dangerActions}>
            {confirming && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={loading}
              >
                {t("cancel")}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {confirming ? t("confirmDelete") : t("deleteAccount")}
            </Button>
          </div>
          <Separator className={styles.separator} />
          <Button
            type="button"
            variant="outline"
            className={styles.logoutButton}
            onClick={logout}
          >
            {t("logout")}
          </Button>
        </div>
      )}
    </div>
  );
}
