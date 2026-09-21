import {
    addThreadMember,
    createPrivateThread,
    deleteMessage,
    editMessage,
    editOriginalResponse,
    getChannel,
    joinThread,
    modifyThread,
    removeThreadMember,
    sendMessage,
} from "./discord.js";
import {
    attachThread,
    beginTicketClose,
    createTicketReservation,
    getActiveTicket,
    getRecoverableTickets,
    getTicketByThreadId,
    markTicketClosed,
    markTicketFailed,
    markTicketOpen,
} from "./ticket-database.js";
import {
    ButtonStyle,
    ComponentType,
    PermissionFlags,
    TextInputStyle,
} from "./constants.js";
import { ephemeral, getModalText, getModalValues, modal } from "./responses.js";

const DEFAULT_TICKET_ROLE_IDS = [
    "1254702078555586592",
    "1416280122767708201",
    "1101865823188025354",
];

const IDS = {
    BUY_BUTTON: "ticket:open:buy",
    ASK_BUTTON: "ticket:open:ask",
    BUY_MODAL: "ticket:modal:buy",
    ASK_MODAL: "ticket:modal:ask",
    CLOSE_BUTTON: "ticket:close",
    CLOSE_MODAL: "ticket:modal:close",
    TERMS: "ticket_terms",
    SERVICE: "ticket_service",
    DETAILS: "ticket_details",
    CLOSE_REASON: "ticket_close_reason",
};

function getInteractionUser(interaction) {
    return interaction.member?.user ?? interaction.user ?? null;
}

function getTicketRoleIds(env) {
    const configured = env.TICKET_ROLE_IDS?.split(",") ?? DEFAULT_TICKET_ROLE_IDS;
    return [...new Set(configured.map((id) => id.trim()).filter((id) => /^\d{17,20}$/.test(id)))];
}

function hasPermission(interaction, permission) {
    try {
        return (BigInt(interaction.member?.permissions ?? "0") & permission) === permission;
    } catch {
        return false;
    }
}

function canManageTicket(interaction, ticket, env) {
    const user = getInteractionUser(interaction);
    if (!user) return false;
    if (user.id === ticket.owner_id) return true;
    if (hasPermission(interaction, PermissionFlags.ADMINISTRATOR)) return true;

    const memberRoles = new Set(interaction.member?.roles ?? []);
    return getTicketRoleIds(env).some((roleId) => memberRoles.has(roleId));
}

function sanitizeThreadName(value) {
    const cleaned = value
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    return cleaned.slice(0, 60) || "member";
}

function serviceSelect(label) {
    return {
        type: ComponentType.LABEL,
        label,
        component: {
            type: ComponentType.STRING_SELECT,
            custom_id: IDS.SERVICE,
            placeholder: "Choose a service",
            min_values: 1,
            max_values: 1,
            options: [
                {
                    label: "Bot",
                    value: "Bot",
                    description: "Discord bot service",
                    emoji: { name: "🤖" },
                },
                {
                    label: "Server",
                    value: "Server",
                    description: "Discord server service",
                    emoji: { name: "🗃️" },
                },
            ],
        },
    };
}

function detailsInput(label, placeholder) {
    return {
        type: ComponentType.LABEL,
        label,
        component: {
            type: ComponentType.TEXT_INPUT,
            custom_id: IDS.DETAILS,
            style: TextInputStyle.PARAGRAPH,
            placeholder,
            min_length: 10,
            max_length: 2000,
            required: true,
        },
    };
}

function closeButton(disabled = false) {
    return {
        type: ComponentType.ACTION_ROW,
        components: [
            {
                type: ComponentType.BUTTON,
                custom_id: IDS.CLOSE_BUTTON,
                label: "Close Ticket",
                emoji: { name: "🔒" },
                style: ButtonStyle.DANGER,
                disabled,
            },
        ],
    };
}

export function ticketPanelResponse() {
    return {
        type: 4,
        data: {
            allowed_mentions: { parse: [] },
            embeds: [
                {
                    color: 0xce0200,
                    title: "Ticket Service",
                    description:
                        "Choose **Buy** to order a service or **Ask** to open a consultation ticket. Please do not create duplicate tickets.",
                    footer: { text: "One active ticket is allowed per member." },
                },
            ],
            components: [
                {
                    type: ComponentType.ACTION_ROW,
                    components: [
                        {
                            type: ComponentType.BUTTON,
                            custom_id: IDS.BUY_BUTTON,
                            label: "Buy",
                            emoji: { name: "🏷️" },
                            style: ButtonStyle.PRIMARY,
                        },
                        {
                            type: ComponentType.BUTTON,
                            custom_id: IDS.ASK_BUTTON,
                            label: "Ask",
                            emoji: { name: "✋" },
                            style: ButtonStyle.SECONDARY,
                        },
                    ],
                },
            ],
        },
    };
}

export function handleBuyButton() {
    return modal(IDS.BUY_MODAL, "Create Buy Ticket", [
        {
            type: ComponentType.LABEL,
            label: "Terms and Conditions",
            component: {
                type: ComponentType.STRING_SELECT,
                custom_id: IDS.TERMS,
                placeholder: "Confirm that you have read the terms",
                min_values: 1,
                max_values: 1,
                options: [
                    {
                        label: "I have read and agree",
                        value: "accepted",
                        emoji: { name: "✅" },
                    },
                    {
                        label: "I have not read them yet",
                        value: "not_accepted",
                        emoji: { name: "❌" },
                    },
                ],
            },
        },
        serviceSelect("Service to buy"),
        detailsInput("Order details", "Describe what you want to order."),
    ]);
}

export function handleAskButton() {
    return modal(IDS.ASK_MODAL, "Create Ask Ticket", [
        serviceSelect("Service to ask about"),
        detailsInput("Your question", "Describe what you want to ask."),
    ]);
}

export async function handleCloseButton(interaction, env) {
    const ticket = await getTicketByThreadId(env.DB, interaction.channel_id);
    if (!ticket || ticket.status !== "open") {
        return ephemeral("This channel is not an open ticket.");
    }

    if (!canManageTicket(interaction, ticket, env)) {
        return ephemeral("Only the ticket owner or an authorized role can close this ticket.");
    }

    return modal(IDS.CLOSE_MODAL, "Close Ticket", [
        {
            type: ComponentType.LABEL,
            label: "Reason",
            description: "Optional. This will be included in the ticket log.",
            component: {
                type: ComponentType.TEXT_INPUT,
                custom_id: IDS.CLOSE_REASON,
                style: TextInputStyle.PARAGRAPH,
                placeholder: "Why is this ticket being closed?",
                min_length: 1,
                max_length: 1000,
                required: false,
            },
        },
    ]);
}

async function inviteConfiguredRoles(env, threadId) {
    const roleIds = getTicketRoleIds(env);
    if (roleIds.length === 0) return;

    const mentionMessage = await sendMessage(env, threadId, {
        content: roleIds.map((roleId) => `<@&${roleId}>`).join(" "),
        allowed_mentions: { parse: [], roles: roleIds },
    });

    try {
        await deleteMessage(env, threadId, mentionMessage.id);
    } catch (error) {
        console.error("[ticket] Failed to remove role invitation message:", error.message);
    }
}

function ticketStarterPayload(ticket, user) {
    const kindLabel = ticket.type === "buy" ? "Order Service" : "Ask About Service";

    return {
        allowed_mentions: { parse: [] },
        embeds: [
            {
                color: 0xf39c12,
                title: `Ticket #${ticket.id} — ${kindLabel}`,
                description: ticket.details,
                fields: [
                    { name: "Owner", value: `<@${user.id}>`, inline: true },
                    { name: "Service", value: ticket.service, inline: true },
                    { name: "Type", value: ticket.type.toUpperCase(), inline: true },
                ],
                footer: { text: "Use the button below when this ticket is finished." },
                timestamp: new Date().toISOString(),
            },
        ],
        components: [closeButton()],
    };
}

async function reserveTicket(interaction, env, type, service, details) {
    const user = getInteractionUser(interaction);
    if (!user || !interaction.guild_id || !interaction.channel_id) {
        throw new Error("Tickets can only be created inside a server channel");
    }

    const existing = await getActiveTicket(env.DB, interaction.guild_id, user.id);
    if (existing) return { existing, user };

    try {
        const ticket = await createTicketReservation(env.DB, {
            interactionId: interaction.id,
            guildId: interaction.guild_id,
            parentChannelId: interaction.channel_id,
            ownerId: user.id,
            type,
            service,
            details,
        });
        return { ticket, user };
    } catch (error) {
        const raced = await getActiveTicket(env.DB, interaction.guild_id, user.id);
        if (raced) return { existing: raced, user };
        throw error;
    }
}

async function createTicketFromModal(interaction, env, type) {
    const service = getModalValues(interaction, IDS.SERVICE)[0];
    const details = getModalText(interaction, IDS.DETAILS)?.trim();

    if (!service || !details) {
        return editOriginalResponse(env, interaction.token, {
            content: "The ticket form is incomplete. Please try again.",
        });
    }

    if (type === "buy" && getModalValues(interaction, IDS.TERMS)[0] !== "accepted") {
        return editOriginalResponse(env, interaction.token, {
            content: "Please read and accept the Terms and Conditions before opening a ticket.",
        });
    }

    let ticket;
    let user;
    let thread;

    try {
        const reservation = await reserveTicket(interaction, env, type, service, details);
        user = reservation.user;

        if (reservation.existing) {
            const location = reservation.existing.thread_id
                ? `<#${reservation.existing.thread_id}>`
                : "Your existing ticket is still being prepared.";
            return editOriginalResponse(env, interaction.token, {
                content: `You already have an active ticket. ${location}`,
            });
        }

        ticket = reservation.ticket;
        const username = sanitizeThreadName(user.global_name ?? user.username ?? user.id);
        thread = await createPrivateThread(env, interaction.channel_id, {
            name: `${type}-${username}-${ticket.id}`.slice(0, 100),
            auto_archive_duration: 1440,
        });

        await attachThread(env.DB, ticket.id, thread.id);

        // The creator is normally joined automatically; this idempotent call guarantees it.
        await joinThread(env, thread.id);

        // Adding the owner directly produces Discord's native "added to the thread" message.
        await addThreadMember(env, thread.id, user.id);

        // Mentioning a role in a private thread invites its members. The message itself is removed.
        await inviteConfiguredRoles(env, thread.id);

        const starter = await sendMessage(env, thread.id, ticketStarterPayload(ticket, user));
        await markTicketOpen(env.DB, ticket.id, starter.id);

        try {
            await editOriginalResponse(env, interaction.token, {
                content: `✅ Ticket created: <#${thread.id}>`,
                allowed_mentions: { parse: [] },
            });
        } catch (responseError) {
            // The ticket is already valid; a failed ephemeral confirmation must not roll it back.
            console.error("[ticket] Failed to send creation confirmation:", responseError.message);
        }
    } catch (error) {
        console.error("[ticket] Failed to create ticket:", error);

        if (thread?.id) {
            try {
                await modifyThread(env, thread.id, { locked: true, archived: true });
            } catch (cleanupError) {
                console.error("[ticket] Failed to archive incomplete thread:", cleanupError.message);
            }
        }

        if (ticket?.id) {
            try {
                await markTicketFailed(env.DB, ticket.id, error.message);
            } catch (databaseError) {
                console.error("[ticket] Failed to mark ticket as failed:", databaseError.message);
            }
        }

        return editOriginalResponse(env, interaction.token, {
            content: "❌ The ticket could not be created. Please contact the owner.",
        });
    }
}

export function handleBuyModal(interaction, env) {
    return createTicketFromModal(interaction, env, "buy");
}

export function handleAskModal(interaction, env) {
    return createTicketFromModal(interaction, env, "ask");
}

async function sendTicketLog(env, ticket, closedBy, reason) {
    if (!env.TICKET_LOG_CHANNEL_ID) return;

    await sendMessage(env, env.TICKET_LOG_CHANNEL_ID, {
        allowed_mentions: { parse: [] },
        embeds: [
            {
                color: 0xe67e22,
                title: `Ticket #${ticket.id} Closed`,
                fields: [
                    { name: "Owner", value: `<@${ticket.owner_id}>`, inline: true },
                    { name: "Closed By", value: `<@${closedBy}>`, inline: true },
                    { name: "Type", value: ticket.type.toUpperCase(), inline: true },
                    { name: "Service", value: ticket.service, inline: true },
                    { name: "Thread ID", value: ticket.thread_id, inline: true },
                    { name: "Reason", value: reason },
                ],
                timestamp: new Date().toISOString(),
            },
        ],
    });
}

export async function handleCloseModal(interaction, env) {
    const user = getInteractionUser(interaction);
    const ticket = await getTicketByThreadId(env.DB, interaction.channel_id);

    if (!ticket || !user) {
        return editOriginalResponse(env, interaction.token, {
            content: "This channel is not a registered ticket.",
        });
    }

    if (!canManageTicket(interaction, ticket, env)) {
        return editOriginalResponse(env, interaction.token, {
            content: "You are not allowed to close this ticket.",
        });
    }

    const reason = getModalText(interaction, IDS.CLOSE_REASON)?.trim() || "No reason provided.";
    const acquired = await beginTicketClose(env.DB, ticket.id, user.id, reason);
    if (!acquired) {
        return editOriginalResponse(env, interaction.token, {
            content: "This ticket is already being closed or has been closed.",
        });
    }

    try {
        if (ticket.starter_message_id) {
            try {
                await editMessage(env, ticket.thread_id, ticket.starter_message_id, {
                    components: [closeButton(true)],
                });
            } catch (error) {
                console.error("[ticket] Failed to disable close button:", error.message);
            }
        }

        await sendMessage(env, ticket.thread_id, {
            content: `🔒 Ticket closed by <@${user.id}>.\n**Reason:** ${reason}`,
            allowed_mentions: { parse: [] },
        });

        try {
            // Removing the owner produces Discord's native "removed from the thread" message.
            await removeThreadMember(env, ticket.thread_id, ticket.owner_id);
        } catch (error) {
            console.error("[ticket] Failed to remove ticket owner:", error.message);
        }

        try {
            await sendTicketLog(env, ticket, user.id, reason);
        } catch (error) {
            console.error("[ticket] Failed to send close log:", error.message);
        }

        await modifyThread(env, ticket.thread_id, { locked: true, archived: true });
        await markTicketClosed(env.DB, ticket.id);

        try {
            await editOriginalResponse(env, interaction.token, {
                content: "✅ Ticket closed and archived.",
            });
        } catch (responseError) {
            // Closing succeeded; the interaction token may simply have expired.
            console.error("[ticket] Failed to send close confirmation:", responseError.message);
        }
    } catch (error) {
        console.error("[ticket] Failed to close ticket:", error);
        return editOriginalResponse(env, interaction.token, {
            content:
                "The ticket is being closed, but one of the final steps failed. It will be retried automatically.",
        });
    }
}

export async function recoverTickets(env) {
    const tickets = await getRecoverableTickets(env.DB);

    for (const ticket of tickets) {
        try {
            if (ticket.status === "creating") {
                if (ticket.thread_id) {
                    let thread;
                    try {
                        thread = await getChannel(env, ticket.thread_id);
                    } catch (error) {
                        if (!error.message.includes("Discord API error 404")) throw error;
                    }

                    if (thread && !(thread.thread_metadata?.archived && thread.thread_metadata?.locked)) {
                        if (thread.thread_metadata?.archived) {
                            await modifyThread(env, ticket.thread_id, { archived: false });
                        }
                        try {
                            await removeThreadMember(env, ticket.thread_id, ticket.owner_id);
                        } catch {
                            // The owner may not have been added before creation failed.
                        }
                        await modifyThread(env, ticket.thread_id, { locked: true, archived: true });
                    }
                }
                await markTicketFailed(env.DB, ticket.id, "Ticket creation timed out");
                continue;
            }

            if (ticket.status === "closing") {
                let thread;
                try {
                    thread = await getChannel(env, ticket.thread_id);
                } catch (error) {
                    if (error.message.includes("Discord API error 404")) {
                        await markTicketClosed(env.DB, ticket.id);
                        continue;
                    }
                    throw error;
                }
                if (thread.thread_metadata?.archived && thread.thread_metadata?.locked) {
                    await markTicketClosed(env.DB, ticket.id);
                    continue;
                }

                if (thread.thread_metadata?.archived) {
                    await modifyThread(env, ticket.thread_id, { archived: false });
                }

                try {
                    await removeThreadMember(env, ticket.thread_id, ticket.owner_id);
                } catch {
                    // Removal is idempotent from the workflow's perspective.
                }
                await modifyThread(env, ticket.thread_id, { locked: true, archived: true });
                await markTicketClosed(env.DB, ticket.id);
            }
        } catch (error) {
            console.error(`[ticket recovery:${ticket.id}]`, error.message);
        }
    }
}

export const ticketComponentHandlers = {
    [IDS.BUY_BUTTON]: handleBuyButton,
    [IDS.ASK_BUTTON]: handleAskButton,
    [IDS.CLOSE_BUTTON]: handleCloseButton,
};

export const ticketModalHandlers = {
    [IDS.BUY_MODAL]: handleBuyModal,
    [IDS.ASK_MODAL]: handleAskModal,
    [IDS.CLOSE_MODAL]: handleCloseModal,
};
