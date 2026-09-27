import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  FolderKanban,
  ListTodo,
  Menu,
  MessageSquareText,
  Plus,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { BrandMark } from "./AuthLayout.jsx";
import NotificationsBell from "./NotificationsBell.jsx";
import InvitationsBell from "./InvitationsBell.jsx";
import SettingsMenu from "./SettingsMenu.jsx";
import ProfileMenu from "./ProfileMenu.jsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import styles from "./Dashboard.module.css";

const cleanLabel = (value) =>
  String(value || "").replace(/^[^\p{L}\p{N}]+/u, "");

export default function WorkspaceShell({
  sectionLabel,
  children,
  projects = [],
  activeProjectId,
  onCreateProject,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const onDashboard = location.pathname === "/dashboard";
  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at) -
        new Date(a.updated_at || a.created_at),
    )
    .slice(0, 4);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (location.hash)
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      else window.scrollTo(0, 0);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const toggle = (name) =>
    setOpenMenu((current) => (current === name ? null : name));
  const closeMobile = () => setMobileOpen(false);

  function afterMobileClose(action) {
    if (mobileOpen) {
      closeMobile();
      window.setTimeout(action, 160);
    } else action();
  }

  function openProjects() {
    if (!onDashboard) {
      closeMobile();
      navigate("/dashboard#projects");
      return;
    }
    afterMobileClose(() =>
      document
        .getElementById("projects")
        ?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  function createProject() {
    closeMobile();
    if (onCreateProject) onCreateProject();
    else navigate("/dashboard?create=1");
  }

  function openSection(id) {
    afterMobileClose(() =>
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  const sidebarContent = (
    <>
      <div className={styles.sidebarSectionLabel}>{t("workspaceNav")}</div>
      <nav className={styles.sidebarNavGroup} aria-label={t("workspaceNav")}>
        <button
          type="button"
          className={`${styles.sidebarNav} ${onDashboard ? styles.sidebarNavActive : ""}`}
          onClick={openProjects}
          aria-current={onDashboard ? "page" : undefined}
        >
          <FolderKanban aria-hidden="true" />
          {t("projectsNav")}
          <span className={styles.sidebarCount}>{projects.length}</span>
        </button>
      </nav>
      <Button
        type="button"
        onClick={createProject}
        className={styles.sidebarCreate}
      >
        <Plus data-icon="inline-start" />
        {cleanLabel(t("createProject"))}
      </Button>

      {activeProjectId && (
        <>
          <Separator className={styles.sidebarSeparator} />
          <div className={styles.sidebarSectionLabel}>{t("inThisProject")}</div>
          <nav
            className={styles.sidebarNavGroup}
            aria-label={t("inThisProject")}
          >
            {[
              [
                "project-team",
                <UsersRound aria-hidden="true" />,
                t("participants"),
              ],
              [
                "project-chat",
                <MessageSquareText aria-hidden="true" />,
                t("projectChatNav"),
              ],
              [
                "project-tasks",
                <ListTodo aria-hidden="true" />,
                t("tasksTitle"),
              ],
              [
                "project-activity",
                <Activity aria-hidden="true" />,
                t("activity"),
              ],
            ].map(([id, icon, label]) => (
              <button
                type="button"
                key={id}
                className={styles.sidebarNav}
                onClick={() => openSection(id)}
              >
                {icon}
                {cleanLabel(label)}
              </button>
            ))}
          </nav>
        </>
      )}

      <Separator className={styles.sidebarSeparator} />
      <div className={styles.sidebarSectionHeading}>
        <span>{t("recentProjectsNav")}</span>
        <span>{recentProjects.length}</span>
      </div>
      <div className={styles.recentProjectList}>
        {recentProjects.length === 0 && (
          <p className={styles.sidebarEmpty}>{t("projectsEmptyTitle")}</p>
        )}
        {recentProjects.map((project) => (
          <button
            type="button"
            key={project.id}
            className={`${styles.recentProject} ${String(project.id) === String(activeProjectId) ? styles.recentProjectActive : ""}`}
            onClick={() => {
              closeMobile();
              navigate(`/project/${project.id}`);
            }}
            title={project.name}
            aria-current={
              String(project.id) === String(activeProjectId)
                ? "page"
                : undefined
            }
          >
            <span className={styles.recentProjectIcon}>
              <FolderKanban aria-hidden="true" />
            </span>
            <span className={styles.recentProjectName}>{project.name}</span>
            <ArrowUpRight
              aria-hidden="true"
              className={styles.recentProjectArrow}
            />
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label={t("workspaceNav")}>
        <div className={styles.sidebarBrand}>
          <BrandMark compact />
        </div>
        {sidebarContent}
      </aside>
      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.mobileBrand}>
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("openNavigation")}
                  className={styles.mobileMenuButton}
                >
                  <Menu />
                </Button>
              </DialogTrigger>
              <DialogContent className={styles.mobileDrawer}>
                <DialogHeader>
                  <DialogTitle>{t("workspaceNav")}</DialogTitle>
                </DialogHeader>
                {sidebarContent}
              </DialogContent>
            </Dialog>
            <BrandMark compact />
          </div>
          <div className={styles.topbarLabel}>
            <FolderKanban aria-hidden="true" />
            {sectionLabel || t("projectsNav")}
          </div>
          <div className={styles.headerActions}>
            <NotificationsBell
              isOpen={openMenu === "notifications"}
              onToggle={() => toggle("notifications")}
            />
            <InvitationsBell
              isOpen={openMenu === "invitations"}
              onToggle={() => toggle("invitations")}
            />
            <SettingsMenu
              isOpen={openMenu === "settings"}
              onToggle={() => toggle("settings")}
            />
            <div className={styles.profileAction}>
              <ProfileMenu
                isOpen={openMenu === "profile"}
                onToggle={() => toggle("profile")}
              />
              <span>{user?.nickname || user?.username || t("profile")}</span>
            </div>
          </div>
        </header>
        <div className={styles.bodyMain}>{children}</div>
      </div>
    </div>
  );
}
