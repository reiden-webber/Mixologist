### Goal: Implement Word-by-Word Streaming and Markdown Formatting for the Chat UI

I need to update the chat interface to provide a smooth, "word-by-word" scrolling experience while ensuring all agent responses are correctly formatted as Markdown.

#### 1. Markdown Rendering (React-Markdown)
* **Library**: Install `react-markdown` and `remark-gfm`.
* **Implementation**: Inside the chat message component, wrap the `message.content` in a `<ReactMarkdown>` component.
* **Styling**: Use the **Tailwind CSS Typography** plugin (`prose` classes) to ensure that:
    * **Bold** (`**text**`) and *Italics* (`*text*`) render correctly.
    * Lists (bullet points and numbered) are properly indented.
    * Inline code blocks and code fences are styled for technical clarity.

#### 2. Word-by-Word "Typewriter" Streaming
* **Concept**: Instead of the UI jumping every time a large chunk of text arrives, implement a "smoothed" stream.
* **Logic**: 
    * Use the `useChat` hook's `messages` array.
    * Create a custom `StreamedText` component that takes the raw string and uses a CSS transition or a small `useEffect` timer to "reveal" words sequentially.
    * Alternatively, use the `ai` SDK's built-in `experimental_throttle` or a similar framerate-limiting utility to ensure the text flows at a readable human pace rather than dumping instantly.

#### 3. Auto-Scrolling & Layout
* **Visual Polish**: Ensure the container uses `scroll-behavior: smooth` to prevent jarring jumps as new words appear.
* **Persona Integration**: Ensure the "Master Mixologist" responses still use the curated 30-drink logic from the technical plan while following these formatting rules.

#### 4. Technical Requirements
* Use **TypeScript** for all component props.
* Ensure the Markdown parser can handle streaming "partial" syntax (e.g., if a word is halfway through being bolded `**te...`, it shouldn't break the UI).
* The solution must be compatible with **Next.js App Router** and **Tailwind CSS v4**.