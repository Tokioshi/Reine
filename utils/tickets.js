import config from "../config.js";
import {
    addThreadMember,
    createPrivateThread,
    deleteChannel,
    deleteMessage,
    editMessage,
    editOriginalResponse,
    getChannel,
    getGuildMember,
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
    markTicketReopened,
    deleteTicket,
} from "./ticket-database.js";
import {
    ButtonStyle,
    ComponentType,
    InteractionResponseType,
    MessageFlags,
    PermissionFlags,
    TextInputStyle,
} from "./constants.js";
import { ephemeralEmbed, getModalText, getModalValues, modal } from "./responses.js";

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
    REOPEN_BUTTON: "reopen_ticket",
    DELETE_BUTTON: "delete_ticket",
    TERMS: "ticket_terms",
    SERVICE: "ticket_service",
    DETAILS: "ticket_details",
    CLOSE_REASON: "ticket_close_reason",
};

function getInteractionUser(interaction) {
    return interaction.member?.user ?? interaction.user ?? null;
}

async function getTicketUser(interaction, env) {
    const user = getInteractionUser(interaction);
    if (!user?.id || !interaction.guild_id) return user;

    try {
        const member = await getGuildMember(env, interaction.guild_id, user.id);
        return {
            ...user,
            ...member.user,
            nickname: member.nick ?? user.nickname,
        };
    } catch (error) {
        console.error("[ticket] Failed to fetch guild member:", error.message);
        return user;
    }
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

export function buildTicketThreadName(type, username) {
    const label = type === "buy" ? "Order" : type === "ask" ? "Ask" : "Ticket";

    const displayName = (username ?? "Member")
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
        .slice(0, 60);

    return `${label} Ticket - ${displayName || "Member"}`.slice(0, 100);
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

function closedTicketButtons(disabled = false) {
    return {
        type: ComponentType.ACTION_ROW,
        components: [
            {
                type: ComponentType.BUTTON,
                custom_id: IDS.REOPEN_BUTTON,
                label: "Reopen Ticket",
                emoji: { name: "🔓" },
                style: ButtonStyle.PRIMARY,
                disabled,
            },
            {
                type: ComponentType.BUTTON,
                custom_id: IDS.DELETE_BUTTON,
                label: "Delete Thread",
                emoji: { name: "🗑️" },
                style: ButtonStyle.DANGER,
                disabled,
            },
        ],
    };
}

function deferredComponentResponse() {
    return {
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: MessageFlags.EPHEMERAL },
    };
}

function deferredComponentUpdateResponse() {
    return { type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE };
}

export function ticketPanelPayload() {
    return {
        embeds: [
            {
                color: 0xce0200,
                author: {
                    name: "Harmony Hub — Ticket Service",
                    icon_url:
                        "https://cdn.discordapp.com/icons/1101864405492306040/e54e9e26a4e2c227121b517b7adb239f.png?size=1024",
                },
                description:
                    "Welcome to the **Harmony Hub** ticket system.\nSelect an option below to continue.",
                fields: [
                    {
                        name: "🏷️ Buy",
                        value: "Order a development service (bot, tools, etc).",
                        inline: true,
                    },
                    {
                        name: "✋ Ask",
                        value: "Consultation before ordering or general questions.",
                        inline: true,
                    },
                ],
                image: {
                    url: "https://i.pinimg.com/1200x/5c/ff/be/5cffbe0205462492b0d7fae908db8929.jpg",
                },
                footer: {
                    text: "Only 1 active ticket allowed per member",
                },
                timestamp: new Date().toISOString(),
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
        return ephemeralEmbed([
            {
                title: "Failed",
                color: config.color.error,
                description: "This channel is not an open ticket.",
            },
        ]);
    }

    if (!canManageTicket(interaction, ticket, env)) {
        return ephemeralEmbed([
            {
                title: "Failed",
                color: config.color.error,
                description: "Only the ticket owner or an authorized role can close this ticket.",
            },
        ]);
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
                color: config.color.warning,
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
    const user = await getTicketUser(interaction, env);
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
            embeds: [
                {
                    title: "Failed",
                    color: config.color.error,
                    description: "The ticket form is incomplete. Please try again.",
                },
            ],
        });
    }

    if (type === "buy" && getModalValues(interaction, IDS.TERMS)[0] !== "accepted") {
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                {
                    title: "Failed",
                    color: config.color.error,
                    description:
                        "Please read and accept the Terms and Conditions before opening a ticket.",
                },
            ],
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
                embeds: [
                    {
                        title: "Failed",
                        color: config.color.error,
                        description: `You already have an active ticket : ${location}`,
                    },
                ],
            });
        }

        ticket = reservation.ticket;
        const username = user.nickname ?? user.global_name ?? user.username ?? user.id;
        thread = await createPrivateThread(env, interaction.channel_id, {
            name: buildTicketThreadName(type, username),
            auto_archive_duration: 1440,
        });

        await attachThread(env.DB, ticket.id, thread.id);
        await joinThread(env, thread.id);
        await addThreadMember(env, thread.id, user.id);
        await inviteConfiguredRoles(env, thread.id);

        const starter = await sendMessage(env, thread.id, ticketStarterPayload(ticket, user));
        await markTicketOpen(env.DB, ticket.id, starter.id);

        try {
            await editOriginalResponse(env, interaction.token, {
                embeds: [
                    {
                        title: "Success",
                        color: config.color.success,
                        description: `Ticket created: <#${thread.id}>`,
                    },
                ],
            });
        } catch (responseError) {
            console.error("[ticket] Failed to send creation confirmation:", responseError.message);
        }
    } catch (error) {
        console.error("[ticket] Failed to create ticket:", error);

        if (thread?.id) {
            try {
                await modifyThread(env, thread.id, { locked: true, archived: true });
            } catch (cleanupError) {
                console.error(
                    "[ticket] Failed to archive incomplete thread:",
                    cleanupError.message,
                );
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
            embeds: [
                {
                    title: "Failed",
                    color: config.color.error,
                    description: "The ticket could not be created. Please contact the owner.",
                },
            ],
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
                color: config.color.warning,
                title: `Ticket #${ticket.id} Closed`,
                fields: [
                    { name: "Owner", value: `<@${ticket.owner_id}>`, inline: true },
                    { name: "Closed By", value: `<@${closedBy}>`, inline: true },
                    { name: "Type", value: ticket.type.toUpperCase(), inline: true },
                    { name: "Service", value: ticket.service, inline: true },
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
            embeds: [
                {
                    title: "Failed",
                    color: config.color.error,
                    description: "This channel is not a registered ticket.",
                },
            ],
        });
    }

    if (!canManageTicket(interaction, ticket, env)) {
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                {
                    title: "Failed",
                    color: config.color.error,
                    description: "You are not allowed to close this ticket.",
                },
            ],
        });
    }

    const reason = getModalText(interaction, IDS.CLOSE_REASON)?.trim() || "No reason provided.";
    const acquired = await beginTicketClose(env.DB, ticket.id, user.id, reason);
    if (!acquired) {
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                {
                    title: "Failed",
                    color: config.color.error,
                    description: "This ticket is already being closed or has been closed.",
                },
            ],
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
            embeds: [
                {
                    color: config.color.information,
                    title: `Ticket Closed`,
                    description: `This ticket has been closed for the following reason: ${reason}`,
                    fields: [
                        { name: "Closed By", value: `<@${user.id}>`, inline: true },
                        { name: "Ticket Owner", value: `<@${ticket.owner_id}>`, inline: true },
                    ],
                },
            ],
            components: [closedTicketButtons()],
        });

        try {
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
                embeds: [
                    {
                        title: "Success",
                        color: config.color.success,
                        description: "Ticket closed and archived.",
                    },
                ],
            });
        } catch (responseError) {
            console.error("[ticket] Failed to send close confirmation:", responseError.message);
        }
    } catch (error) {
        console.error("[ticket] Failed to close ticket:", error);
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                {
                    title: "Loading",
                    color: config.color.warning,
                    description:
                        "The ticket is being closed, but one of the final steps failed. It will be retried automatically.",
                },
            ],
        });
    }
}

function componentActionError(description) {
    return {
        embeds: [
            {
                title: "Failed",
                color: config.color.error,
                description,
            },
        ],
    };
}

function componentActionSuccess(description) {
    return {
        embeds: [
            {
                title: "Success",
                color: config.color.success,
                description,
            },
        ],
    };
}

async function validateClosedTicketAction(interaction, env) {
    const ticket = await getTicketByThreadId(env.DB, interaction.channel_id);
    if (!ticket || ticket.status !== "closed") {
        return { error: "This ticket is not closed or is no longer available." };
    }
    if (!canManageTicket(interaction, ticket, env)) {
        return { error: "You are not allowed to manage this ticket." };
    }
    return { ticket };
}

export async function handleReopenTicket(interaction, env) {
    const result = await validateClosedTicketAction(interaction, env);
    if (result.error) return ephemeralEmbed([componentActionError(result.error).embeds[0]]);

    return {
        response: deferredComponentResponse(),
        afterResponse: async (runtimeEnv) => {
            const { ticket } = result;
            try {
                await modifyThread(runtimeEnv, ticket.thread_id, {
                    archived: false,
                    locked: false,
                });
                await addThreadMember(runtimeEnv, ticket.thread_id, ticket.owner_id);
                if (!(await markTicketReopened(runtimeEnv.DB, ticket.id))) {
                    throw new Error("Ticket status changed before it could be reopened");
                }

                if (ticket.starter_message_id) {
                    try {
                        await editMessage(runtimeEnv, ticket.thread_id, ticket.starter_message_id, {
                            components: [closeButton()],
                        });
                    } catch (error) {
                        console.error("[ticket] Failed to re-enable close button:", error.message);
                    }
                }

                if (interaction.message?.id) {
                    try {
                        await editMessage(
                            runtimeEnv,
                            interaction.channel_id,
                            interaction.message.id,
                            {
                                components: [closedTicketButtons(true)],
                            },
                        );
                    } catch (error) {
                        console.error(
                            "[ticket] Failed to disable old ticket actions:",
                            error.message,
                        );
                    }
                }

                await sendMessage(runtimeEnv, ticket.thread_id, {
                    allowed_mentions: { parse: [] },
                    embeds: [
                        {
                            color: config.color.processing,
                            title: "Ticket Reopened",
                            description: "This ticket has been reopened by Staff.",
                            fields: [
                                {
                                    name: "Opened By",
                                    value: `<@${getInteractionUser(interaction).id}>`,
                                    inline: true,
                                },
                                {
                                    name: "Ticket Owner",
                                    value: `<@${ticket.owner_id}>`,
                                    inline: true,
                                },
                            ],
                        },
                    ],
                });

                await editOriginalResponse(
                    runtimeEnv,
                    interaction.token,
                    componentActionSuccess("The ticket has been successfully reopened."),
                );
            } catch (error) {
                console.error("[ticket] Failed to reopen ticket:", error.message);
                await editOriginalResponse(
                    runtimeEnv,
                    interaction.token,
                    componentActionError("The ticket could not be reopened. Please try again."),
                );
            }
        },
    };
}

export async function handleDeleteTicket(interaction, env) {
    const result = await validateClosedTicketAction(interaction, env);
    if (result.error) return ephemeralEmbed([componentActionError(result.error).embeds[0]]);

    return {
        response: deferredComponentUpdateResponse(),
        afterResponse: async (runtimeEnv) => {
            const { ticket } = result;
            try {
                await deleteChannel(runtimeEnv, ticket.thread_id);
                if (!(await deleteTicket(runtimeEnv.DB, ticket.id))) {
                    throw new Error("Ticket database record could not be deleted");
                }
            } catch (error) {
                console.error("[ticket] Failed to delete ticket:", error.message);
            }
        },
    };
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

                    if (
                        thread &&
                        !(thread.thread_metadata?.archived && thread.thread_metadata?.locked)
                    ) {
                        if (thread.thread_metadata?.archived) {
                            await modifyThread(env, ticket.thread_id, { archived: false });
                        }
                        try {
                            await removeThreadMember(env, ticket.thread_id, ticket.owner_id);
                        } catch {}
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
                } catch {}
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
    [IDS.REOPEN_BUTTON]: handleReopenTicket,
    [IDS.DELETE_BUTTON]: handleDeleteTicket,
};

export const ticketModalHandlers = {
    [IDS.BUY_MODAL]: handleBuyModal,
    [IDS.ASK_MODAL]: handleAskModal,
    [IDS.CLOSE_MODAL]: handleCloseModal,
};
