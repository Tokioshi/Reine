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

export function modal(customId, title, components) {
    return {
        type: InteractionResponseType.MODAL,
        data: { custom_id: customId, title, components },
    };
}

export function deferred() {
    return {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: MessageFlags.EPHEMERAL },
    };
}

function findModalComponent(components, customId) {
    for (const component of components ?? []) {
        if (component.custom_id === customId) return component;
        if (component.component?.custom_id === customId) return component.component; // Label wrapper
        if (component.components) {
            const found = findModalComponent(component.components, customId);
            if (found) return found;
        }
    }

    return null;
}

export function getModalText(interaction, customId) {
    return findModalComponent(interaction.data?.components, customId)?.value ?? null;
}

export function getModalFiles(interaction, customId) {
    const component = findModalComponent(interaction.data?.components, customId);
    const ids = component?.values ?? [];
    const attachments = interaction.data?.resolved?.attachments ?? {};

    return ids.map((id) => attachments[id]).filter(Boolean);
}
