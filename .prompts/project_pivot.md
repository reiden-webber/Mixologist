# Project Pivot: Bartender to Menu Consultant

## Context

The current application is a customer-facing AI bartender using LangChain, Node.js, and Next.js. The goal is to refactor this into a platform where the agent acts as a **Hospitality Consultant** helping bar owners design, cost, and curate seasonal menus.

## Primary Objectives

1. **Persona Shift:** Transition the agent from a "flavor explorer" to a "business strategist."
2. **Business Logic:** Implement tools for menu validation.
3. **Structured Data:** Enforce strict JSON output for menu objects to drive the UI.
4. **UI Evolution:** Refactor the Next.js frontend into a "Consultant Chat" (left) and "Live Menu Canvas" (right).

---

## Technical Instructions

### 1. Agent Persona & Prompts

Update the `SystemMessage` in the LangChain initialization:

- **Role:** Expert Hospitality Consultant.
- **Workflow:** Must perform a "Discovery Phase" first. Ask about bar theme, target demographics, price points, and inventory constraints before suggesting drinks.
- **Tone:** Professional, analytical, and efficiency-oriented.

### 2. Tool Expansion

Refactor the toolset in `src/langchain/tools`:

- `**validateTheme`:** A logic-based tool to ensure suggested drinks align with the owner's defined theme (e.g., no Piña Coladas for a 1920s Speakeasy).

### 3. Structured Output (Zod Schema)

Ensure all final menu recommendations are returned as structured data. Use `model.withStructuredOutput(menuSchema)`.

```typescript
import { z } from "zod";

const MenuSchema = z.object({
  menuName: z.string(),
  concept: z.string(),
  items: z.array(z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    margin: z.number(),
    description: z.string()
  }))
});
```

