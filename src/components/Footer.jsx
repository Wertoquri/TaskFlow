import { useI18n } from "../context/I18nContext.jsx";
import styles from "./Footer.module.css";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      © {new Date().getFullYear()} TaskFlow · {t("rightsReserved")}
    </footer>
  );
}
