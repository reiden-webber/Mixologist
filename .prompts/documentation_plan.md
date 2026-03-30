# Role: Lead Software Engineer and Technical Writer

# Task:
Document this agentic application using a two-tiered structure: a high-level `README.md` and deep-dive technical files within a `.docs/` directory. Perform a deep-scan of the codebase to ensure accuracy.

## Tier 1: Generate/Update `README.md` (The Front Door)
Create a professional README that includes:
- **Project Title & Tagline**: Concise description of the agent's purpose.
- **Key Features**: High-level capabilities.
- **Tech Stack**: Summary of frontend, backend, AI framework, and database.
- **Quick Start**: Minimum steps to get the application running (install, env, start).
- **Documentation Index**: A section clearly pointing to the `.docs/` folder for technical deep-dives.

## Tier 2: Generate Technical Documentation in `.docs/`
Create the following Markdown files inside a `.docs/` directory:

1. **`architecture.md`**: Detail the agentic flow. Include a **Mermaid.js** diagram showing the reasoning loop (e.g., ReAct, Plan-and-Execute), how the LLM interacts with tools, and the data flow between components.
2. **`agent-logic.md`**: Document the "brain." Detail the LLM models used, system prompt structures, state management, and memory handling.
3. **`api-and-tools.md`**: Document all external API integrations and custom tools. Define the input/output schemas and how the agent handles tool-calling.
4. **`database-schema.md`**: Provide an overview of data models, relationships, and how persistent state is stored.

# Tone & Constraints:
- **README**: Accessible and focused on "What" and "How to run."
- **Technical Docs**: Professional and focused on "How it works" and "Why." Use code snippets and schema definitions.
- **Accuracy**: Ensure all documentation matches the actual variable names and directory structures found in the code.