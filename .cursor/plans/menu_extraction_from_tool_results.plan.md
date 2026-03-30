---
name: Menu extraction from tool results
overview: The agent can call submit_menu successfully while the Live Menu Canvas stays closed because the HTTP layer only parses the final AIMessage, not the submit_menu tool output. Fix extraction in server.ts by scanning all returned messages (especially ToolMessage).
todos:
  - id: server-scan-messages
    content: "server.ts: extract menu by scanning ToolMessage + AIMessage bodies (reverse order) with extractMenuFromReply"
    status: pending
  - id: server-reply-last-ai
    content: "server.ts: set reply from last AIMessage only; strip sentinels via extractMenuFromReply"
    status: pending
  - id: optional-menu-validate
    content: "Optional: MenuSchema.safeParse before including menu in JSON response"
    status: pending
isProject: false
---

# Menu canvas: why submit_menu runs but the canvas does not open

## What you saw in the test run

The agent **did** call `submit_menu`. That means [`submitMenu.ts`](mixologist-cli/src/tools/submitMenu.ts) ran: Zod parsed the payload, built JSON, and the tool `func` returned:

```text
<!--MENU_JSON-->{...}<!--/MENU_JSON-->
Menu "…" submitted successfully with N item(s).
```

So **the tool is behaving as designed**. The bug is not “submit_menu failed” — it is **where that string ends up** in the LangChain turn vs **what the HTTP server reads**.

## How `submit_menu` works (LangChain)

- `DynamicStructuredTool` passes the model’s structured arguments into `func`.
- The **return value** of `func` becomes the **tool result** shown to the model in a **`ToolMessage`** (tool output), not automatically the text of the final user-facing **`AIMessage`**.
- The model may then produce a **short final reply** (“Your menu is ready…”) **without** repeating the sentinel block.

## Where the server looks today

[`mixologist-cli/src/server.ts`](mixologist-cli/src/server.ts) takes only the **last** entry in `result.messages`, and only uses `extractAssistantText` when that entry is an `AIMessage`. It never inspects **`ToolMessage`** content.

So if the transcript ends with:

1. `AIMessage` (tool calls) → 2. `ToolMessage` (body = sentinel + success line) → 3. `AIMessage` (final prose),

then step 3 has **no** `<!--MENU_JSON-->…<!--/MENU_JSON-->` → `extractMenuFromReply` returns `menu: null` → response is `{ reply }` only → [`sendMessage.ts`](frontend/lib/chat/sendMessage.ts) never sets `msg.menu` → [`ChatShell.tsx`](frontend/components/chat/ChatShell.tsx) never sets `canvasOpen` / `latestMenu` for the canvas.

```mermaid
sequenceDiagram
  participant Agent as Final_AIMessage
  participant Tool as ToolMessage_submit_menu
  Agent->>Tool: tool call
  Tool-->>Agent: content includes MENU_JSON sentinels
  Agent-->>Client: last AIMessage prose only
  Note over Client: Server parses last AIMessage only; misses ToolMessage
```

## Recommended fix (unchanged intent, sharper root cause)

**File:** [`mixologist-cli/src/server.ts`](mixologist-cli/src/server.ts)

1. Import **`ToolMessage`** from `langchain` (alongside `AIMessage` / `HumanMessage`).
2. **Menu:** Walk `result.messages` **from end to start** (or collect all, take last match). For each message, derive a string (for `ToolMessage`, use string content; for `AIMessage`, use `extractAssistantText`). Run existing **`extractMenuFromReply`** on each chunk until a parsed `menu` is found.
3. **Reply:** Still use the **last `AIMessage`** in the list for the chat bubble; run **`extractMenuFromReply`** on that text only to **strip** sentinels if the model ever echoes them.
4. Response shape unchanged: `menu ? { reply, menu } : { reply }`.

No change required to [`submitMenu.ts`](mixologist-cli/src/tools/submitMenu.ts) for this fix — the sentinels in the tool return value are correct; the server must **read tool results**.

## Optional follow-ups

- **`MenuSchema.safeParse`** on the extracted object before putting it in the JSON response (reject malformed extractions).
- **Prompt** (in [`agentSession.ts`](mixologist-cli/src/agentSession.ts)): optional line asking the model to include the exact tool output in the final message — **redundant** once the server scans `ToolMessage`s; prefer the server fix.

## Alternative (larger refactor)

Change `submit_menu` to return **raw JSON only** and detect `ToolMessage` with `name === "submit_menu"`, then `MenuSchema.parse`. Drops sentinels entirely; requires careful handling of LangChain’s tool message shape across versions.

## Verification

- After implementation: one chat turn that ends with `submit_menu` should return HTTP body with `menu` and the UI should open the canvas (and “Show menu” should appear when toggled closed).
