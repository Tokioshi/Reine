import config from "../config.js";
import { PermissionFlags } from "../utils/constants.js";
import {
    ticketComponentHandlers,
    ticketModalHandlers,
    ticketPanelResponse,
} from "../utils/tickets.js";
import { ephemeralEmbed } from "../utils/responses.js";

function isAdministrator(interaction) {
    try {
        const permissions = BigInt(interaction.member?.permissions ?? "0");
        return (permissions & PermissionFlags.ADMINISTRATOR) === PermissionFlags.ADMINISTRATOR;
    } catch {
        return false;
    }
}

function execute(interaction) {
    if (!interaction.guild_id || !isAdministrator(interaction)) {
        return ephemeralEmbed([
            {
                title: "Failed",
                color: config.color.error,
                description: "You must be an administrator to use this command.",
            },
        ]);
    }

    return ticketPanelResponse();
}

export default {
    name: "ticket-panel",
    definition: {
        description: "Create the private-thread ticket panel in this channel",
        default_member_permissions: "8",
    },
    execute,
    componentHandlers: ticketComponentHandlers,
    modalHandlers: ticketModalHandlers,
};
