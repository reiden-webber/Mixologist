import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { AIMessage, HumanMessage } from "langchain";
import { createMixologistSession, extractAssistantText, } from "./agentSession.js";
async function main() {
    try {
        const { agent, close } = await createMixologistSession();
        const rl = createInterface({ input, output });
        console.info("Master Mixologist ready. Ask about drinks, ingredients, or your bar stock. Ctrl+C or empty line to exit.\n");
        const history = [];
        const shutdown = async () => {
            rl.close();
            await close();
        };
        process.on("SIGINT", () => {
            void shutdown().finally(() => process.exit(0));
        });
        try {
            while (true) {
                const line = (await rl.question("You: ")).trim();
                if (!line)
                    break;
                history.push(new HumanMessage(line));
                try {
                    const result = await agent.invoke({ messages: history });
                    const msgs = result.messages;
                    history.length = 0;
                    history.push(...msgs);
                    const last = msgs[msgs.length - 1];
                    const reply = last instanceof AIMessage
                        ? extractAssistantText(last)
                        : last
                            ? JSON.stringify(last.content)
                            : "(no response)";
                    console.info(`Mixologist: ${reply}\n`);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.error(`Error: ${msg}\n`);
                    history.pop();
                }
            }
        }
        finally {
            await shutdown();
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Startup failed: ${msg}`);
        process.exitCode = 1;
    }
}
await main();
//# sourceMappingURL=main.js.map