export type ChatRole = "user" | "assistant";

export type MenuItem = {
  name: string;
  ingredients: string[];
  margin: number;
  description: string;
};

export type Menu = {
  menuName: string;
  concept: string;
  items: MenuItem[];
};

export type Message = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: number;
  menu?: Menu;
};
