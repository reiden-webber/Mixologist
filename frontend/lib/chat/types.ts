export type ChatRole = "user" | "assistant";

export type Message = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: number;
};
