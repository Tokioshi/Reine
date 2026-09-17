import { commandHandlers, modalHandlers } from "./commands.js";
import {
    InteractionResponseType,
    InteractionType,
    MessageFlags,
} from "../utils/constants.js";
import { json, methodNotAllowed } from "../utils/http.js";
import { readAndVerifyDiscordRequest } from "../utils/verify.js";

function emptyAutocomplete() {
    return json({
        type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices: [] },
    });
}

async function handleAutocomplete(interaction, env) {
    const command = commandHandlers[interaction.data?.name];
    if (!command?.autocomplete) return emptyAutocomplete();

    try {
        return json(await command.autocomplete(interaction, env));
    } catch (error) {
        console.error("[autocomplete] Error:", error.message);
        return emptyAutocomplete();
    }
}

async function handleApplicationCommand(interaction, env) {
    const command = commandHandlers[interaction.data?.name];
    if (!command) {
        return json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Unknown command.", flags: MessageFlags.EPHEMERAL },
        });
    }

    try {
        return json(await command.execute(interaction, env));
    } catch (error) {
        console.error(`[command:${interaction.data?.name}] Error:`, error.message);
        return json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "An error occurred.", flags: MessageFlags.EPHEMERAL },
        });
    }
}

function handleModal(interaction, env, ctx) {
    const handler = modalHandlers[interaction.data?.custom_id];
    if (!handler) {
        return json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "Unknown modal.", flags: MessageFlags.EPHEMERAL },
        });
    }

    ctx.waitUntil(
        handler(interaction, env).catch((error) =>
            console.error(`[modal:${interaction.data.custom_id}] Error:`, error.message),
        ),
    );

    return json({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: MessageFlags.EPHEMERAL },
    });
}

export async function handleDiscordInteraction(request, env, ctx) {
    if (request.method !== "POST") return methodNotAllowed();

    const verification = await readAndVerifyDiscordRequest(request, env.PUBLIC_KEY);
    if (!verification.ok) return json({ error: verification.error }, verification.status);

    const interaction = verification.interaction;

    switch (interaction.type) {
        case InteractionType.PING:
            return json({ type: InteractionResponseType.PONG });
        case InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE:
            return handleAutocomplete(interaction, env);
        case InteractionType.APPLICATION_COMMAND:
            return handleApplicationCommand(interaction, env);
        case InteractionType.MODAL_SUBMIT:
            return handleModal(interaction, env, ctx);
        default:
            return json({ error: "Unknown interaction type" }, 400);
    }
}
