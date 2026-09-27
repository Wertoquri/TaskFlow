import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "../context/I18nContext.jsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import styles from "./ProjectModal.module.css";

const cleanLabel = (value) =>
  String(value || "").replace(/^[^\p{L}\p{N}]+/u, "");

export default function ProjectModal({ open, onClose, onSubmit, initialData }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setNameError("");
  }, [initialData, open]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(t("projectNameRequired"));
      return;
    }
    if (name.trim().length < 3) {
      setNameError(t("projectNameShort"));
      return;
    }
    setNameError("");
    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      description: description.trim(),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className={styles.dialog}>
        <DialogHeader className={styles.header}>
          <DialogTitle className={styles.title}>
            {cleanLabel(
              initialData ? t("editProjectTitle") : t("createProjectTitle"),
            )}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("close")}
            >
              <X aria-hidden="true" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className={styles.fields}>
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="project-name">
                {t("projectNameLabel")} *
              </FieldLabel>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setNameError("");
                }}
                placeholder={t("projectNamePlaceholder")}
                autoFocus
                maxLength={100}
                aria-invalid={Boolean(nameError)}
                required
              />
              {nameError && <FieldError>{nameError}</FieldError>}
              <span className={styles.count}>{name.length}/100</span>
            </Field>
            <Field>
              <FieldLabel htmlFor="project-description">
                {t("projectDescLabel")}
              </FieldLabel>
              <Textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("projectDescPlaceholder")}
                maxLength={500}
                rows={4}
              />
              <span className={styles.count}>{description.length}/500</span>
            </Field>
          </FieldGroup>
          <DialogFooter className={styles.footer}>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancelBtn")}
            </Button>
            <Button type="submit">
              {cleanLabel(
                initialData ? t("saveChangesProject") : t("createProjectBtn"),
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
