/**
 * VaultProxy Permission Engine
 * Classifies risk level of operations and determines required security flows.
 */

export type RiskLevel = "READ" | "WRITE" | "DESTRUCTIVE" | "UNKNOWN";

export interface PermissionEvaluation {
  risk: RiskLevel;
  requiresApproval: boolean;
  requiresMFA: boolean;
}

/**
 * Evaluates the risk and required security steps for a given service API action.
 * 
 * @param service - Target service (e.g., "gmail")
 * @param action - Action to perform (e.g., "read", "send", "delete")
 * @returns An evaluation object containing the risk level and required steps
 */
export function evaluatePermission(service: string, action: string): PermissionEvaluation {
  const key = `${service}.${action}`;

  console.log(`🛡️ Evaluating permissions for: ${key}`);

  // Lookup table for permissions
  switch (key) {
    case "gmail.read":
      return { risk: "READ", requiresApproval: false, requiresMFA: false };
    case "gmail.send":
      return { risk: "WRITE", requiresApproval: true, requiresMFA: false };
    case "gmail.delete":
      return { risk: "DESTRUCTIVE", requiresApproval: true, requiresMFA: true };
    // Other safe defaults:
    case "calendar.read":
    case "slack.read":
      return { risk: "READ", requiresApproval: false, requiresMFA: false };
    case "calendar.send":
    case "slack.send":
      return { risk: "WRITE", requiresApproval: true, requiresMFA: false };
    case "calendar.delete":
    case "slack.delete":
      return { risk: "DESTRUCTIVE", requiresApproval: true, requiresMFA: true };
    default:
      console.log(`⚠️ Unrecognized permission key: ${key}. Defaulting to maximum restriction (DESTRUCTIVE).`);
      return { risk: "DESTRUCTIVE", requiresApproval: true, requiresMFA: true };
  }
}
