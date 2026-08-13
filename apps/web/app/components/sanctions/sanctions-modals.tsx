"use client";

import type { SanctionsModalsProps } from "./types";
import { RuleModal } from "./sanctions-rule-modal";
import { EditModal } from "./sanctions-edit-modal";
import { SanctionDrawer, ActivityDrawer } from "./sanctions-drawers";

export function SanctionsModals({
  sanctions,
  rules,
  activityLogs,
  modal,
  drawer,
  onCloseModal,
  onCloseDrawer,
  onCreateRule,
  onEditRule,
  onEdit,
  canCreate,
  scopeOptions,
  onEditFor,
  onResolve,
}: SanctionsModalsProps) {
  const editItem =
    modal?.kind === "edit"
      ? sanctions.find((s) => s.id === modal.id) ?? sanctions[0]
      : undefined;

  const sanctionForDrawer =
    drawer?.kind === "sanction" ? sanctions.find((s) => s.id === drawer.id) : undefined;

  const editRuleItem =
    modal?.kind === "editRule"
      ? rules.find((r) => r.id === modal.id) ?? rules[0]
      : undefined;

  return (
    <>
      {modal?.kind === "rule" && (
        <RuleModal
          scopeOptions={scopeOptions}
          onCreateRule={onCreateRule}
          onEditRule={onEditRule}
          onClose={onCloseModal}
        />
      )}
      {modal?.kind === "editRule" && editRuleItem && (
        <RuleModal
          scopeOptions={scopeOptions}
          editing={editRuleItem}
          onCreateRule={onCreateRule}
          onEditRule={onEditRule}
          onClose={onCloseModal}
        />
      )}
      {modal?.kind === "edit" && editItem && (
        <EditModal item={editItem} onEdit={onEdit} onClose={onCloseModal} />
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
