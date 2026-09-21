import ban from "../commands/ban.js";
import clear from "../commands/clear.js";
import embed from "../commands/embed.js";
import list from "../commands/list.js";
import message from "../commands/message.js";
import ticketPanel from "../commands/ticket-panel.js";
import unwatch from "../commands/unwatch.js";
import watch from "../commands/watch.js";
import { registerGuildCommands } from "../utils/discord.js";
import { json, methodNotAllowed } from "../utils/http.js";

// Workers cannot discover files at runtime, so new commands are added to this list.
const commands = [watch, unwatch, list, clear, ban, message, embed, ticketPanel];

export const commandHandlers = Object.fromEntries(
    commands.map((command) => [
        command.name,
        { execute: command.execute, autocomplete: command.autocomplete },
    ]),
);

export const commandDefinitions = commands.map(({ name, definition }) => ({
    name,
    ...definition,
}));

export const componentHandlers = Object.assign(
    {},
    ...commands.map((command) => command.componentHandlers ?? {}),
);

export const modalHandlers = Object.assign(
    {},
    ...commands.map((command) => command.modalHandlers ?? {}),
    ...commands
        .filter((command) => command.modalId)
        .map((command) => ({ [command.modalId]: command.handleModalSubmit })),
);

export function findInteractionHandler(handlers, customId) {
    if (!customId) return null;
    if (handlers[customId]) return handlers[customId];

    const prefix = Object.keys(handlers)
        .filter((key) => key.endsWith(":"))
        .sort((a, b) => b.length - a.length)
        .find((key) => customId.startsWith(key));

    return prefix ? handlers[prefix] : null;
}

export async function handleCommandRegistration(request, env) {
    if (request.method !== "POST") return methodNotAllowed();

    const authorization = request.headers.get("authorization") ?? "";
    if (authorization !== `Bearer ${env.REGISTER_SECRET}`) {
        return json({ error: "Unauthorized" }, 401);
    }

    const result = await registerGuildCommands(env, commandDefinitions);
    return json({ ok: true, commands: result });
}
