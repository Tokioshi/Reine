import { readAndVerifyDiscordRequest } from "./lib/verify.js";
import { InteractionType, InteractionResponseType } from "./lib/constants.js";
import { json, methodNotAllowed, notFound } from "./lib/http.js";
import { COMMANDS } from "./lib/commands.js";
import { slashCommands } from "./lib/commands-definition.js";
import { registerGuildCommands } from "./lib/discord.js";
import { checkNewEpisodes } from "./lib/episode-checker.js";

async function handleInteractions(request, env) {
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

async function handleRequest(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
        return json({ ok: true, service: "reine" });
    }

    if (url.pathname === "/debug/anilist" && request.method === "GET") {
        const query = `
        query ($search: String) {
            Page(perPage: 3) {
                media(search: $search, type: ANIME, format_in: [TV, ONA]) {
                    id
                    title { romaji english }
                    status
                    seasonYear
                }
            }
        }
        `;

        const res = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 ReineDiscordBot/2.0",
                Origin: "https://anilist.co",
                Referer: "https://anilist.co/",
            },
            body: JSON.stringify({
                query,
                variables: { search: "frieren" },
            }),
        });

        const text = await res.text();

        return new Response(text, {
            status: res.status,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    if (url.pathname === "/interactions") {
        return handleInteractions(request, env);
    }

    if (url.pathname === "/admin/register-commands") {
        return handleRegisterCommands(request, env);
    }

    return notFound();
}

export default {
    fetch(request, env) {
        return handleRequest(request, env);
    },

    async scheduled(_event, env, ctx) {
        ctx.waitUntil(checkNewEpisodes(env));
    },
};
