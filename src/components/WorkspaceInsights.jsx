import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  UsersRound,
} from "lucide-react";
import { useI18n } from "../context/I18nContext.jsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import styles from "./WorkspaceInsights.module.css";

const SESSION_NOW = Date.now();

export function ProjectInsights({ tasks, members, projectId }) {
  const { t, language } = useI18n();
  const done = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = tasks
    .filter((task) => {
      if (!task.due_date || task.status === "done") return false;
      const due = new Date(task.due_date).getTime();
      return (
        Number.isFinite(due) &&
        due >= SESSION_NOW - 24 * 60 * 60 * 1000 &&
        due <= SESSION_NOW + 7 * 24 * 60 * 60 * 1000
      );
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);

  return (
    <section className={styles.projectSummary} aria-label={t("projectStatus")}>
      <div className={styles.summaryHeading}>
        <h2>{t("projectStatus")}</h2>
        <span>
          {t("projectLabel")} #{projectId}
        </span>
      </div>
      <div className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <CardHeader>
            <CardTitle>{t("taskProgress")}</CardTitle>
            <CardDescription>{t("projectProgressHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={styles.progressTop}>
              <strong>{progress}%</strong>
              <span>
                {done}/{tasks.length} {t("completedTasks")}
              </span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label={t("taskProgress")}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressBreakdown}>
              <span>
                <CheckCircle2 aria-hidden="true" />
                {done} {t("statusDone").replace(/^[^\p{L}\p{N}]+/u, "")}
              </span>
              <span>
                <CircleDashed aria-hidden="true" />
                {inProgress}{" "}
                {t("statusInProgress").replace(/^[^\p{L}\p{N}]+/u, "")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.summaryCard}>
          <CardHeader>
            <CardTitle>
              <CalendarClock aria-hidden="true" className={styles.titleIcon} />
              {t("dueSoon")}
            </CardTitle>
            <CardDescription>{t("nextSevenDays")}</CardDescription>
          </CardHeader>
          <CardContent className={styles.deadlineList}>
            {upcoming.length === 0 && (
              <p className={styles.empty}>{t("noUpcomingDeadlines")}</p>
            )}
            {upcoming.map((task) => (
              <a
                key={task.id}
                href="#project-tasks"
                className={styles.deadlineRow}
              >
                <span className={styles.deadlineDot} />
                <span>
                  <strong>{task.title}</strong>
                  <small>
                    {new Date(task.due_date).toLocaleDateString(
                      language === "en" ? "en-US" : "uk-UA",
                      { day: "numeric", month: "short" },
                    )}
                  </small>
                </span>
                <ArrowRight aria-hidden="true" />
              </a>
            ))}
          </CardContent>
        </Card>

        <Card className={styles.summaryCard}>
          <CardHeader>
            <CardTitle>{t("teamOverview")}</CardTitle>
            <CardDescription>{t("teamOverviewHint")}</CardDescription>
          </CardHeader>
          <CardContent className={styles.teamCount}>
            <UsersRound aria-hidden="true" />
            <strong>{members.length}</strong>
            <span>{t("membersCount")}</span>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <a href="#project-team">
                <UsersRound data-icon="inline-start" />
                {t("participants").replace(/^[^\p{L}\p{N}]+/u, "")}
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
