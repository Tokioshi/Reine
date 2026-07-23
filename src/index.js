import { readAndVerifyDiscordRequest } from "./utils/verify.js";
import { InteractionType, InteractionResponseType } from "./utils/constants.js";
import { json, methodNotAllowed, notFound } from "./utils/http.js";
import { COMMANDS, slashCommands, MODAL_HANDLERS } from "./commands/index.js";
import { registerGuildCommands } from "./utils/discord.js";
import { checkNewEpisodes } from "./utils/episode-checker.js";

async function handleInteractions(request, env, ctx) {
    if (request.method !== "POST") return methodNotAllowed();

    const verification = await readAndVerifyDiscordRequest(request, env.PUBLIC_KEY);
    if (!verification.ok) return json({ error: verification.error }, verification.status);

    const interaction = verification.interaction;

    if (interaction.type === InteractionType.PING) {
        return json({ type: InteractionResponseType.PONG });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
        const command = COMMANDS[interaction.data?.name];
        if (!command?.autocomplete) {
            return json({
                type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
                data: { choices: [] },
            });
        }

        try {
            return json(await command.autocomplete(interaction, env));
        } catch (err) {
            console.error("[autocomplete] Error:", err.message);
            return json({
                type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
                data: { choices: [] },
            });
        }
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        const command = COMMANDS[interaction.data?.name];
        if (!command) {
            return json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: "Unknown command.", flags: 64 },
            });
        }

        try {
            return json(await command.execute(interaction, env));
        } catch (err) {
            console.error(`[command:${interaction.data?.name}] Error:`, err.message);
            return json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: "An error occurred.", flags: 64 },
            });
        }
    }

    if (interaction.type === InteractionType.MODAL_SUBMIT) {
        const handler = MODAL_HANDLERS[interaction.data?.custom_id];
        if (!handler) {
            return json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: "Unknown modal.", flags: 64 },
            });
        }

        ctx.waitUntil(
            handler(interaction, env).catch((err) =>
                console.error(`[modal:${interaction.data.custom_id}] Error:`, err.message),
            ),
        );

        return json({
            type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            data: { flags: 64 },
        });
    }

    return json({ error: "Unknown interaction type" }, 400);
}

async function handleRegisterCommands(request, env) {
    if (request.method !== "POST") return methodNotAllowed();

    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${env.REGISTER_SECRET}`) {
        return json({ error: "Unauthorized" }, 401);
    }

    const result = await registerGuildCommands(env, slashCommands);
    return json({ ok: true, commands: result });
}

async function handleRequest(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
        return json({ ok: true, service: "reine" });
    }

    if (url.pathname === "/interactions") {
        return handleInteractions(request, env, ctx);
    }

    if (url.pathname === "/admin/register-commands") {
        return handleRegisterCommands(request, env);
    }

    return notFound();
}

export default {
    fetch(request, env, ctx) {
        return handleRequest(request, env, ctx);
    },

    async scheduled(_event, env, ctx) {
        ctx.waitUntil(checkNewEpisodes(env));
    },
};
