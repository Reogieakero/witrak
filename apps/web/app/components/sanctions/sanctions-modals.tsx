"use client";

import type { SanctionsModalsProps } from "./types";
import { EditModal } from "./sanctions-edit-modal";
import { FinesModal } from "./sanctions-fines-modal";
import { SanctionDrawer, ActivityDrawer } from "./sanctions-drawers";

export function SanctionsModals({
  sanctions,
  activityLogs,
  fines,
  modal,
  drawer,
  onCloseModal,
  onCloseDrawer,
  onEdit,
  onSaveFines,
  canCreate,
  onEditFor,
  onResolve,
}: SanctionsModalsProps) {
  const editItem =
    modal?.kind === "edit"
      ? sanctions.find((s) => s.id === modal.id) ?? sanctions[0]
      : undefined;

  const sanctionForDrawer =
    drawer?.kind === "sanction" ? sanctions.find((s) => s.id === drawer.id) : undefined;

  return (
    <>
      {modal?.kind === "edit" && editItem && (
        <EditModal item={editItem} onEdit={onEdit} onClose={onCloseModal} />
      )}
      {modal?.kind === "fines" && (
        <FinesModal fines={fines} onSave={onSaveFines} onClose={onCloseModal} />
      )}
      {drawer?.kind === "sanction" && sanctionForDrawer && (
        <SanctionDrawer
          item={sanctionForDrawer}
          canResolve={canCreate}
          canEdit={canCreate}
          onResolve={onResolve}
          onEditFor={onEditFor}
          onClose={onCloseDrawer}
        />
      )}
      {drawer?.kind === "activity" && (
        <ActivityDrawer logs={activityLogs} onClose={onCloseDrawer} />
      )}
    </>
  );
}
