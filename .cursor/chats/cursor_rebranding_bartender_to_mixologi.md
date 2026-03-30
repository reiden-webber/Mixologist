# Rebranding Bartender to Mixologist
_Exported on 3/29/2026 at 14:49:50 PDT from Cursor (2.6.22)_

---

**User**

I want to rebrand "Bartender" to "Mixologist". Help me find everything that mentions "Bartender" in the code and replace it with "Mixologist"

---

**Cursor**

Searching the codebase for "Bartender" and "bartender" to scope the rebrand.



Having mapped matches: product strings live in the frontend and one backend health field; the root npm package is still named `bartender`. Creating a concise plan.



---

**User**

Do not rename any of the plans or anything in .prompts

---

**Cursor**

Updating the plan to exclude renaming plans and any changes under `.prompts`.



Updated [rebrand_bartender_to_mixologist_ef6569fc.plan.md](/home/reidenw/.cursor/plans/rebrand_bartender_to_mixologist_ef6569fc.plan.md) with your constraint:

- **Overview** now states that `.cursor/plans` and `.prompts` must not be renamed or edited.
- Removed the **optional-docs** todo and the whole “Optional repo hygiene” section.
- Added an **Explicitly out of scope** section that calls out plans, `.prompts`, and keeping `bartender_technical_plan.md` as-is.
- **Verification** now expects `rg` to possibly still match under `.cursor/plans`, `.prompts`, and the prompt filename.

Execution scope is unchanged: frontend strings, `backend/src/index.ts`, and root `package.json` / `package-lock.json` only.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Implementing the rebrand: updating todos and applying the planned file changes.



Here’s what was implemented:

### Frontend
- [frontend/app/layout.tsx](frontend/app/layout.tsx) — `metadata.title` is now `"Mixologist"`.
- [frontend/components/chat/ChatShell.tsx](frontend/components/chat/ChatShell.tsx) — sidebar and mobile header wordmarks updated to Mixologist.
- [frontend/components/chat/Composer.tsx](frontend/components/chat/Composer.tsx) — placeholder is `Message Mixologist…`.

### Backend
- [backend/src/index.ts](backend/src/index.ts) — health payload uses `service: "mixologist-backend"`.

### Root package
- [package.json](package.json) — `"name": "mixologist"`.
- [package-lock.json](package-lock.json) — root package name updated in both places.

Verification: `rg -i bartender` under `frontend/`, `backend/src/`, and the root `package*.json` files returns no matches. Nothing under `.cursor/plans` or `.prompts` was changed.

The stale **optional-docs** todo was **cancelled** so it matches the plan (no edits there).

If you run the backend from compiled output, run `npm run build -w backend` so `dist` picks up the new service string.

