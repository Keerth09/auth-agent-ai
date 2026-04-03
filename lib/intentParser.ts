/**
 * VaultProxy Intent Parser
 * Converts natural language task descriptions into actionable intents.
 */

export interface ParsedIntent {
  service: "gmail" | "slack" | "calendar" | "unknown";
  action: "read" | "send" | "delete" | "unknown";
}

/**
 * Parses user input to identify the target service and the intended action.
 * Uses robust keyword matching logic.
 * 
 * @param task - Natural language string input from the user
 * @returns ParsedIntent containing the identified service and action
 */
export function parseIntent(task: string): ParsedIntent {
  const lowerTask = task.toLowerCase();

  let service: ParsedIntent["service"] = "unknown";
  
  // Intelligent fuzzy matching for Gmail
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  
  if (
    lowerTask.includes("email") || 
    lowerTask.includes("eamil") || 
    lowerTask.includes("mail") || 
    lowerTask.includes("gmail") || 
    lowerTask.includes("message") ||
    emailRegex.test(lowerTask)
  ) {
    service = "gmail";
  } else if (lowerTask.includes("slack")) {
    service = "slack";
  } else if (lowerTask.includes("calendar") || lowerTask.includes("event") || lowerTask.includes("meeting")) {
    service = "calendar";
  }

  let action: ParsedIntent["action"] = "unknown";
  if (
    lowerTask.includes("summarize") ||
    lowerTask.includes("read") ||
    lowerTask.includes("show") ||
    lowerTask.includes("list") ||
    lowerTask.includes("get")
  ) {
    action = "read";
  } else if (
    lowerTask.includes("send") ||
    lowerTask.includes("reply") ||
    lowerTask.includes("respond") ||
    lowerTask.includes("write")
  ) {
    action = "send";
  } else if (
    lowerTask.includes("delete") ||
    lowerTask.includes("remove") ||
    lowerTask.includes("clear") ||
    lowerTask.includes("trash")
  ) {
    action = "delete";
  }

  console.log(`🔍 Intent Parsed: ${service}.${action} from "${task}"`);
  return { service, action };
}
