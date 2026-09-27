import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyInvitations, acceptInvitation, declineInvitation } from "../api";
import { useI18n } from "../context/I18nContext.jsx";
import ProjectInviteCard from "./ProjectInviteCard.jsx";
import useMobileMenuPosition from "./useMobileMenuPosition.js";
import { Check, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitationsBell({ isOpen, onToggle }) {
  const { token, user, socket } = useAuth();
  const [invites, setInvites] = useState([]);
  const { t } = useI18n();
  const rootRef = useRef(null);
  const { triggerRef, menuStyle } = useMobileMenuPosition(isOpen, {
    maxWidth: 320,
  });

  async function load() {
    if (!token) return;
    try {
      const rows = await getMyInvitations(token);
      setInvites(rows || []);
    } catch {}
  }

  useEffect(() => {
    load();
  }, [token]);

  // close when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!isOpen) return;
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        onToggle();
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      // new invite for current user
      load();
    };
    socket.on("invite:new", handler);
    return () => socket.off("invite:new", handler);
  }, [socket]);

  async function onAccept(id) {
    try {
      await acceptInvitation(id, token);
      setInvites((prev) => prev.filter((x) => x.id !== id));
    } catch {}
  }
  async function onDecline(id) {
    try {
      await declineInvitation(id, token);
      setInvites((prev) => prev.filter((x) => x.id !== id));
    } catch {}
  }

  const count = invites.length;

  return (
    <div style={{ position: "relative" }} ref={rootRef}>
      <Button
        ref={triggerRef}
        title={t("invitationsTitle")}
        aria-label={`${t("invitationsTitle")} (${count})`}
        aria-expanded={isOpen}
        onClick={onToggle}
        variant="ghost"
        size="icon-lg"
        className="workspaceIconButton"
      >
        <Mail aria-hidden="true" />
        {count > 0 && (
          <span className="workspaceIconCount" aria-hidden="true">
            {count}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="workspaceDropdown" style={menuStyle || undefined}>
          <div className="workspaceDropdownTitle">{t("invitationsTitle")}</div>
          {invites.length === 0 ? (
            <div className="workspaceDropdownEmpty">{t("noInvitations")}</div>
          ) : (
            invites.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "6px 0",
                }}
              >
                <ProjectInviteCard
                  data={{
                    sender_id: inv.sender_id,
                    project_id: inv.project_id,
                    project_name: inv.project_name,
                    invitation_id: inv.id,
                  }}
                  createdAt={inv.created_at}
                />
                <div className="workspaceDropdownActions">
                  <button
                    onClick={() => onAccept(inv.id)}
                    title={t("accept")}
                    aria-label={t("accept")}
                  >
                    <Check aria-hidden="true" size={14} />
                    {t("accept")}
                  </button>
                  <button
                    onClick={() => onDecline(inv.id)}
                    title={t("decline")}
                    aria-label={t("decline")}
                    className="danger"
                  >
                    <X aria-hidden="true" size={14} />
                    {t("decline")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
