import React from "react";
import { Bell } from "lucide-react";

export default function NotificationCard({ title, body, createdAt }) {
  const dt = createdAt ? new Date(createdAt) : null;
  const formatted = dt ? dt.toLocaleString() : "";
  return (
    <div className="workspaceNoticeCard">
      <div className="workspaceNoticeTitle">
        <span className="workspaceNoticeIcon">
          <Bell aria-hidden="true" size={14} />
        </span>
        <span>{title}</span>
      </div>
      {body && <div className="workspaceNoticeBody">{body}</div>}
      {formatted && <div className="workspaceNoticeTime">{formatted}</div>}
    </div>
  );
}
