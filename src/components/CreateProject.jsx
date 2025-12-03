import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../context/I18nContext.jsx";

const CreateProject = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate(); // Заміна useHistory на useNavigate
  const { t } = useI18n();

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // Токен з localStorage або context

    if (!token) {
      return alert(t('mustBeLoggedToCreate'));
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/projects",
        {
          title,
          description,
          owner_id: 1, // В даному випадку припускаємо, що id користувача — це 1, насправді це значення повинно братися з токену
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate("/dashboard"); // Заміна history.push на navigate
    } catch (error) {
      console.error(error);
      alert(t('failedCreateProject'));
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(18px) saturate(1.2)",
        WebkitBackdropFilter: "blur(18px) saturate(1.2)",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: "16px",
        padding: "28px",
        width: "100%",
        maxWidth: "560px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        color: "#0f172a"
      }}>
        <h2 style={{ margin: 0, marginBottom: 16, fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{t('createProjectPageTitle')}</h2>
        <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>{t('titleLabel')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('projectTitlePlaceholder')}
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid rgba(0,0,0,0.12)",
              borderRadius: "var(--pill)",
              fontSize: 14,
              background: "rgba(255,255,255,0.9)",
              color: "#0f172a",
              outline: "none",
              transition: "all 0.2s"
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "var(--ring)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.12)"; e.target.style.boxShadow = "none"; }}
          />

          <label style={{ fontSize: 14, fontWeight: 600 }}>{t('descriptionLabel')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('shortDescriptionPlaceholder')}
            required
            rows={4}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid rgba(0,0,0,0.12)",
              borderRadius: "var(--pill)",
              fontSize: 14,
              background: "rgba(255,255,255,0.9)",
              color: "#0f172a",
              outline: "none",
              transition: "all 0.2s",
              resize: "vertical"
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "var(--ring)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.12)"; e.target.style.boxShadow = "none"; }}
          ></textarea>

          <button type="submit" style={{
            width: "100%",
            padding: "12px 16px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--pill)",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(37,99,235,0.35)"
          }}>
            {t('createProjectSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
