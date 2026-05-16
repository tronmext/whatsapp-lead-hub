export const DEFAULT_CONVERSATION_CATEGORIES = [
  "lead",
  "group",
  "amigo",
  "familia",
  "marketing",
] as const;

export type ConversationCategory = (typeof DEFAULT_CONVERSATION_CATEGORIES)[number];
