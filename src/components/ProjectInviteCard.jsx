import React from "react";
import { Link2 } from "lucide-react";
import { useI18n } from "../context/I18nContext.jsx";

export default function ProjectInviteCard({ data, createdAt }) {
  const { t } = useI18n();
  const { sender_id, project_id, project_name, invitation_id } = data || {};
  const dt = createdAt ? new Date(createdAt) : null;
  const formatted = dt ? dt.toLocaleString() : "";

  return (
    <div className="workspaceNoticeCard">
      <div className="workspaceNoticeTitle">
        <span className="workspaceNoticeIcon">
          <Link2 aria-hidden="true" size={14} />
        </span>
        <span>
          {t("invitationNumber")}
          {invitation_id}
        </span>
      </div>

      <div className="workspaceInviteDetails">
        <div>
          <strong>{t("inviteSender")}:</strong> #{sender_id}
        </div>
        <div>
          <strong>{t("inviteProject")}:</strong> #{project_id}
        </div>
        <div>
          <strong>{t("inviteProjectName")}:</strong> {project_name}
        </div>
      </div>

      {formatted && <div className="workspaceNoticeTime">{formatted}</div>}
    </div>
  );
}
