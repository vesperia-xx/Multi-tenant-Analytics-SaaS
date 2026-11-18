export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "organization.created": "Workspace created",
  "organization.updated": "Workspace settings changed",
  "member.joined": "Member joined",
  "member.role_changed": "Member role changed",
  "member.removed": "Member removed",
  "invitation.created": "Invitation sent",
  "invitation.revoked": "Invitation revoked",
  "report.exported": "Report exported",
};

export type AuditTone = "default" | "secondary" | "outline" | "success" | "warning" | "destructive";

const ACTION_TONES: Record<string, AuditTone> = {
  "organization.created": "default",
  "organization.updated": "default",
  "member.joined": "success",
  "member.role_changed": "warning",
  "member.removed": "destructive",
  "invitation.created": "secondary",
  "invitation.revoked": "outline",
  "report.exported": "outline",
};

/** Falls back to a humanised key so new actions still read well. */
export function auditActionLabel(action: string): string {
  const known = AUDIT_ACTION_LABELS[action];
  if (known) return known;

  const humanised = action.replace(/[._-]+/g, " ").trim();
  return humanised.charAt(0).toUpperCase() + humanised.slice(1);
}

export function auditActionTone(action: string): AuditTone {
  return ACTION_TONES[action] ?? "outline";
}
