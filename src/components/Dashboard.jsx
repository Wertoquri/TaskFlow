import React, { useEffect, useState, useRef } from "react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api";
import ProjectCard from "../components/ProjectCard";
import ProjectModal from "../components/ProjectModal";
import TasksModal from "../components/TasksModal";
import ProfileMenu from "../components/ProfileMenu";
import InvitationsBell from "../components/InvitationsBell";
import NotificationsBell from "../components/NotificationsBell";
import SettingsMenu from "../components/SettingsMenu";
import Kanban from "../components/Kanban";
import styles from "./Dashboard.module.css";
import { useI18n } from "../context/I18nContext.jsx";

export default function Dashboard() {
  const { t } = useI18n();
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState(
    localStorage.getItem("filterStatus") || ""
  );
  const [filterPriority, setFilterPriority] = useState(
    localStorage.getItem("filterPriority") || ""
  );
  const [filterLabel, setFilterLabel] = useState(
    localStorage.getItem("filterLabel") || ""
  );
  const [activeFilters, setActiveFilters] = useState(0);
  const [openMenu, setOpenMenu] = useState(null); // 'notifications' | 'invitations' | 'profile' | 'settings' | null
  const projectsListRef = useRef(null);
  const headerRef = useRef(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    localStorage.setItem("filterStatus", filterStatus);
    localStorage.setItem("filterPriority", filterPriority);
    localStorage.setItem("filterLabel", filterLabel);
    
    // Підрахунок активних фільтрів
    let count = 0;
    if (filterStatus) count++;
    if (filterPriority) count++;
    if (filterLabel) count++;
    setActiveFilters(count);
  }, [filterStatus, filterPriority, filterLabel]);

  useEffect(() => {
    // GSAP анімації - запускаємо лише один раз
    if (animatedRef.current || !window.gsap || !window.ScrollTrigger) return;
    
    window.gsap.registerPlugin(window.ScrollTrigger);

    // Анімація заголовка
    if (headerRef.current) {
      window.gsap.fromTo(headerRef.current,
        {
          y: -50,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out"
        }
      );
    }

    // Анімація карток проектів
    if (projectsListRef.current && projects.length > 0) {
      const cards = projectsListRef.current.querySelectorAll('[data-project-card]');
      if (cards.length > 0) {
        window.gsap.fromTo(cards,
          {
            y: 30,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: projectsListRef.current,
              start: "top 80%",
              once: true
            }
          }
        );
        animatedRef.current = true;
      }
    }
  }, [projects]);

  function loadProjects() {
    const token = localStorage.getItem("token");
    getProjects(token).then(setProjects);
  }

  function handleCreate() {
    setModalData(null);
    setModalOpen(true);
  }

  function handleEdit(id) {
    const proj = projects.find((p) => p.id === id);
    setModalData(proj);
    setModalOpen(true);
  }

  function handleOpenTasks(id) {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    setSelectedProject(proj);
    setTasksOpen(true);
  }

  function handleDelete(id) {
    if (window.confirm(t('confirmDeleteProject'))) {
      const token = localStorage.getItem("token");
      deleteProject(id, token)
        .then(loadProjects)
        .catch(() => alert(t('deleteProjectFailed')));
    }
  }

  function handleModalSubmit(data) {
    const token = localStorage.getItem("token");
    if (modalData) {
      // Редагування
      updateProject(data.id, data.name, data.description, token)
        .then(() => {
          setModalOpen(false);
          loadProjects();
        })
        .catch(() => alert(t('editProjectFailed')));
    } else {
      // Створення
      createProject(data.name, data.description, token)
        .then(() => {
          setModalOpen(false);
          loadProjects();
        })
        .catch(() => alert(t('createProjectFailed')));
    }
  }

  function clearAllFilters() {
    setFilterStatus("");
    setFilterPriority("");
    setFilterLabel("");
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} ref={headerRef}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>{t('dashboardTitle')}</h1>
            <p className={styles.headerSubtitle}>{t('dashboardSubtitle')}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.headerMenuGroup}>
              <NotificationsBell isOpen={openMenu === 'notifications'} onToggle={() => setOpenMenu(openMenu === 'notifications' ? null : 'notifications')} />
              <InvitationsBell isOpen={openMenu === 'invitations'} onToggle={() => setOpenMenu(openMenu === 'invitations' ? null : 'invitations')} />
              <SettingsMenu isOpen={openMenu === 'settings'} onToggle={() => setOpenMenu(openMenu === 'settings' ? null : 'settings')} />
            </div>
            <ProfileMenu isOpen={openMenu === 'profile'} onToggle={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')} />
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <button onClick={handleCreate} className={styles.createButton}>
            {t('createProject')}
          </button>
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`${styles.filterSelect} ${filterStatus ? styles.filterActive : ''}`}
              >
                <option value="">{t('filterStatusAll')}</option>
                <option value="pending">{t('statusPending')}</option>
                <option value="in_progress">{t('statusInProgress')}</option>
                <option value="done">{t('statusDone')}</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className={`${styles.filterSelect} ${filterPriority ? styles.filterActive : ''}`}
              >
                <option value="">{t('filterPriorityAll')}</option>
                <option value="low">{t('priorityLow')}</option>
                <option value="medium">{t('priorityMedium')}</option>
                <option value="high">{t('priorityHigh')}</option>
              </select>
              <input
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                placeholder={t('searchLabelPlaceholder')}
                className={`${styles.filterInput} ${filterLabel ? styles.filterActive : ''}`}
              />
            </div>
            {activeFilters > 0 && (
              <button onClick={clearAllFilters} className={styles.clearFiltersButton} title={t('clearFilters')}>
                {t('clearFilters')} ({activeFilters})
              </button>
            )}
          </div>
        </div>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📂</div>
            <div className={styles.emptyTitle}>{t('projectsEmptyTitle')}</div>
            <div className={styles.emptyText}>{t('projectsEmptyText')}</div>
          </div>
        ) : (
          <div className={styles.projectsList} ref={projectsListRef}>
            {projects.map((project) => (
              <div key={project.id} data-project-card>
                <ProjectCard
                  {...project}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onOpen={handleOpenTasks}
                />
              </div>
            ))}
          </div>
        )}
        {selectedProject && (
          <div className={styles.kanbanSection}>
            <h3 className={styles.kanbanTitle}>
              {t('kanbanBoard')}: {selectedProject.name}
            </h3>
            <Kanban
              project={selectedProject}
              filters={{
                status: filterStatus,
                priority: filterPriority,
                label: filterLabel,
              }}
            />
          </div>
        )}
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
      </div>
    </div>
  );
}
