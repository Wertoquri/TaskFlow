import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useI18n } from "../context/I18nContext.jsx";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import styles from "./ProjectCard.module.css";

const cleanLabel = (value) =>
  String(value || "").replace(/^[^\p{L}\p{N}]+/u, "");

export default function ProjectCard({
  id,
  name,
  description,
  created_at,
  updated_at,
  selected,
  onEdit,
  onDelete,
  onOpen,
  onOpenTasks,
}) {
  const navigate = useNavigate();
  const { t, language } = useI18n();

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString(language === "en" ? "en-US" : "uk-UA", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }

  return (
    <Card className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.title}>
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => onOpen?.(id)}
          >
            {name}
          </button>
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={styles.tasksButton}
            onClick={onOpenTasks}
          >
            {cleanLabel(t("tasksTitle"))}
            <ChevronDown data-icon="inline-end" />
          </Button>
        </CardAction>
        <CardDescription className={styles.description}>
          {description || t("noDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.meta}>
        <div>
          <CalendarDays aria-hidden="true" />
          <span>
            {cleanLabel(t("created"))}: {formatDate(created_at)}
          </span>
        </div>
        <div>
          <CalendarDays aria-hidden="true" />
          <span>
            {cleanLabel(t("updated"))}: {formatDate(updated_at)}
          </span>
        </div>
      </CardContent>
      <CardFooter className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(`/project/${id}`)}
        >
          <UsersRound data-icon="inline-start" />
          {cleanLabel(t("participants"))}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(id)}
        >
          <Pencil data-icon="inline-start" />
          {cleanLabel(t("edit"))}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onDelete(id)}
        >
          <Trash2 data-icon="inline-start" />
          {cleanLabel(t("delete"))}
        </Button>
      </CardFooter>
    </Card>
  );
}
