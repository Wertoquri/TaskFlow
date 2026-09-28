import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, FolderKanban, Plus, Search, X } from "lucide-react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api.js";
import { useI18n } from "../context/I18nContext.jsx";
import ProjectCard from "./ProjectCard.jsx";
import ProjectModal from "./ProjectModal.jsx";
import TasksModal from "./TasksModal.jsx";
import Kanban from "./Kanban.jsx";
import WorkspaceShell from "./WorkspaceShell.jsx";
import styles from "./Dashboard.module.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Alert, AlertDescription } from "@/components/ui/alert";

const cleanLabel = (value) =>
  String(value || "").replace(/^[^\p{L}\p{N}]+/u, "");

export default function Dashboard() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState(
    () => localStorage.getItem("filterStatus") || "",
  );
  const [filterPriority, setFilterPriority] = useState(
    () => localStorage.getItem("filterPriority") || "",
  );
  const [filterLabel, setFilterLabel] = useState(
    () => localStorage.getItem("filterLabel") || "",
  );

  const loadProjects = useCallback(async () => {
    try {
      setLoadError("");
      const rows = await getProjects(localStorage.getItem("token"));
      const projectRows = Array.isArray(rows) ? rows : [];
      setProjects(projectRows);
      setSelectedProject((current) =>
        current
          ? projectRows.find((row) => row.id === current.id) || null
          : null,
      );
    } catch {
      setLoadError(t("projectsLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("create") !== "1") return;
    setModalData(null);
    setModalOpen(true);
    navigate("/dashboard", { replace: true });
  }, [location.search, navigate]);
  useEffect(() => {
    localStorage.setItem("filterStatus", filterStatus);
    localStorage.setItem("filterPriority", filterPriority);
    localStorage.setItem("filterLabel", filterLabel);
  }, [filterStatus, filterPriority, filterLabel]);

  const activeFilters = [filterStatus, filterPriority, filterLabel].filter(
    Boolean,
  ).length;

  function handleCreate() {
    setModalData(null);
    setModalOpen(true);
  }

  function handleEdit(id) {
    setModalData(projects.find((project) => project.id === id) || null);
    setModalOpen(true);
  }

  function handleSelectProject(id) {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    setSelectedProject(project);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document
          .getElementById("selected-board")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      ),
    );
  }

  function formatDate(value) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm(t("confirmDeleteProject"))) return;
    try {
      await deleteProject(id, localStorage.getItem("token"));
      if (selectedProject?.id === id) setSelectedProject(null);
      await loadProjects();
    } catch {
      window.alert(t("deleteProjectFailed"));
    }
  }

  async function handleModalSubmit(data) {
    const token = localStorage.getItem("token");
    try {
      if (modalData)
        await updateProject(data.id, data.name, data.description, token);
      else await createProject(data.name, data.description, token);
      setModalOpen(false);
      await loadProjects();
    } catch {
      window.alert(
        modalData ? t("editProjectFailed") : t("createProjectFailed"),
      );
    }
  }

  function clearAllFilters() {
    setFilterStatus("");
    setFilterPriority("");
    setFilterLabel("");
  }

  return (
    <>
      <WorkspaceShell
        sectionLabel={t("projectsNav")}
        projects={projects}
        onCreateProject={handleCreate}
      >
        <main className={styles.content}>
          <div className={styles.headingRow}>
            <div>
              <h1>{t("projectsNav")}</h1>
              <p>{t("dashboardSubtitle")}</p>
            </div>
            <Button onClick={handleCreate} className={styles.createButton}>
              <Plus data-icon="inline-start" />
              {cleanLabel(t("createProject"))}
            </Button>
          </div>

          <div className={styles.filterBar} aria-label={t("filtersLabel")}>
            <label className={styles.filterField}>
              <span className="sr-only">{t("filterStatusAll")}</span>
              <NativeSelect
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
              >
                <NativeSelectOption value="">
                  {cleanLabel(t("filterStatusAll"))}
                </NativeSelectOption>
                <NativeSelectOption value="pending">
                  {cleanLabel(t("statusPending"))}
                </NativeSelectOption>
                <NativeSelectOption value="in_progress">
                  {cleanLabel(t("statusInProgress"))}
                </NativeSelectOption>
                <NativeSelectOption value="done">
                  {cleanLabel(t("statusDone"))}
                </NativeSelectOption>
              </NativeSelect>
            </label>
            <label className={styles.filterField}>
              <span className="sr-only">{t("filterPriorityAll")}</span>
              <NativeSelect
                value={filterPriority}
                onChange={(event) => setFilterPriority(event.target.value)}
              >
                <NativeSelectOption value="">
                  {cleanLabel(t("filterPriorityAll"))}
                </NativeSelectOption>
                <NativeSelectOption value="low">
                  {cleanLabel(t("priorityLow"))}
                </NativeSelectOption>
                <NativeSelectOption value="medium">
                  {cleanLabel(t("priorityMedium"))}
                </NativeSelectOption>
                <NativeSelectOption value="high">
                  {cleanLabel(t("priorityHigh"))}
                </NativeSelectOption>
              </NativeSelect>
            </label>
            <label className={styles.searchField}>
              <Search aria-hidden="true" />
              <span className="sr-only">
                {cleanLabel(t("searchLabelPlaceholder"))}
              </span>
              <Input
                value={filterLabel}
                onChange={(event) => setFilterLabel(event.target.value)}
                placeholder={cleanLabel(t("searchLabelPlaceholder"))}
              />
            </label>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className={styles.clearButton}
              >
                <X data-icon="inline-start" />
                {cleanLabel(t("clearFilters"))} ({activeFilters})
              </Button>
            )}
          </div>

          {loadError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}
          {!loading && !loadError && projects.length === 0 && (
            <Empty className={styles.emptyState}>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanban />
                </EmptyMedia>
                <EmptyTitle>{t("projectsEmptyTitle")}</EmptyTitle>
                <EmptyDescription>{t("projectsEmptyText")}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={handleCreate}>
                  <Plus data-icon="inline-start" />
                  {cleanLabel(t("createProject"))}
                </Button>
              </EmptyContent>
            </Empty>
          )}
          {projects.length > 0 && (
            <section
              id="projects"
              className={styles.projectsSection}
              aria-label={t("projectsNav")}
            >
              <div className={styles.projectsGrid}>
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    {...project}
                    selected={selectedProject?.id === project.id}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onOpen={handleSelectProject}
                    onOpenTasks={() => {
                      setSelectedProject(project);
                      setTasksOpen(true);
                    }}
                  />
                ))}
              </div>
            </section>
          )}
          {selectedProject && (
            <section
              id="selected-board"
              className={styles.kanbanSection}
              aria-label={t("kanbanBoard")}
            >
              <div className={styles.projectDetailHeader}>
                <div className={styles.projectDetailCopy}>
                  <h2>{selectedProject.name}</h2>
                  <p>{selectedProject.description || t("noDescription")}</p>
                </div>
                <div className={styles.projectDetailAside}>
                  <span>
                    <CalendarDays aria-hidden="true" />
                    {cleanLabel(t("created"))}:{" "}
                    {formatDate(selectedProject.created_at)}
                  </span>
                  <span>
                    <CalendarDays aria-hidden="true" />
                    {cleanLabel(t("updated"))}:{" "}
                    {formatDate(selectedProject.updated_at)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTasksOpen(true)}
                  >
                    {cleanLabel(t("tasksTitle"))}
                  </Button>
                </div>
              </div>
              <Kanban
                project={selectedProject}
                filters={{
                  status: filterStatus,
                  priority: filterPriority,
                  label: filterLabel,
                }}
                onAddTask={() => setTasksOpen(true)}
              />
            </section>
          )}
        </main>
      </WorkspaceShell>
      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={modalData}
      />
      <TasksModal
        open={tasksOpen}
        onClose={() => setTasksOpen(false)}
        project={selectedProject}
        filters={{
          status: filterStatus,
          priority: filterPriority,
          label: filterLabel,
        }}
      />
    </>
  );
}
