import { InteractionResponseType, MessageFlags } from "../utils/constants.js";

export function ephemeral(content) {
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content, flags: MessageFlags.EPHEMERAL },
    };
}

export function ephemeralEmbed(embeds) {
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { embeds, flags: MessageFlags.EPHEMERAL },
    };
}

export function autocompleteResult(choices) {
    return {
        type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices },
    };
}
