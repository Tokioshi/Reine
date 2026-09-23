import config from "../config.js";
import { ButtonStyle, ComponentType, PermissionFlags, TextInputStyle } from "../utils/constants.js";
import { editMessage, editOriginalResponse, getMessage, sendMessage } from "../utils/discord.js";
import { ephemeralEmbed, getModalText, modal } from "../utils/responses.js";

const CREATE_MODAL_ID = "embed:create";
const EDIT_LOOKUP_MODAL_ID = "embed:lookup";
const EDIT_BUTTON_PREFIX = "embed:open-edit:";
const EDIT_MODAL_PREFIX = "embed:update:";
const SUCCESS_COLOR = config.color.success;
const ERROR_COLOR = config.color.error;
const INFO_COLOR = config.color.information;

function getUserId(interaction) {
    return interaction.member?.user?.id ?? interaction.user?.id ?? null;
}

function isAdministrator(interaction) {
    try {
        const permissions = BigInt(interaction.member?.permissions ?? "0");
        return (permissions & PermissionFlags.ADMINISTRATOR) === PermissionFlags.ADMINISTRATOR;
    } catch {
        return false;
    }
}

function statusEmbed(title, description, color) {
    return { title, description, color };
}

function ephemeralStatus(title, description, color = ERROR_COLOR) {
    return ephemeralEmbed([statusEmbed(title, description, color)]);
}

function modalField(label, customId, style, options = {}) {
    return {
        type: ComponentType.LABEL,
        label,
        component: {
            type: ComponentType.TEXT_INPUT,
            custom_id: customId,
            style,
            required: true,
            ...options,
        },
    };
}

function embedForm(customId, title, values = {}) {
    return modal(customId, title, [
        modalField("Title", "title", TextInputStyle.SHORT, {
            min_length: 1,
            max_length: 256,
            placeholder: "Enter embed title",
            ...(values.title ? { value: values.title } : {}),
        }),
        modalField("Color (Hex)", "color", TextInputStyle.SHORT, {
            min_length: 3,
            max_length: 9,
            placeholder: "Example: #5865F2",
            ...(values.color ? { value: values.color } : {}),
        }),
        modalField("Description", "description", TextInputStyle.PARAGRAPH, {
            min_length: 1,
            max_length: 4000,
            placeholder: "Enter embed description",
            ...(values.description ? { value: values.description } : {}),
        }),
    ]);
}

function parseColor(value) {
    const normalized = value.trim().replace(/^#/, "").replace(/^0x/i, "");
    const expanded = /^[0-9a-f]{3}$/i.test(normalized)
        ? normalized
              .split("")
              .map((character) => character.repeat(2))
              .join("")
        : normalized;

    if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;
    return Number.parseInt(expanded, 16);
}

function formatColor(color) {
    return `#${color.toString(16).padStart(6, "0").toUpperCase()}`;
}

function readEmbedInput(interaction) {
    const title = getModalText(interaction, "title")?.trim() ?? "";
    const description = getModalText(interaction, "description")?.trim() ?? "";
    const color = parseColor(getModalText(interaction, "color") ?? "");

    if (!title || !description) {
        return { error: "Title and description cannot be empty." };
    }

    if (color === null) {
        return {
            error: "Invalid color. Use a Hex format like `#5865F2` or `5865F2`.",
        };
    }

    return { embed: { title, description, color } };
}

function parseScopedCustomId(customId, prefix) {
    if (!customId?.startsWith(prefix)) return null;
    const [userId, messageId] = customId.slice(prefix.length).split(":");
    if (!/^\d{17,20}$/.test(userId ?? "") || !/^\d{17,20}$/.test(messageId ?? "")) {
        return null;
    }

    return { userId, messageId };
}

function validateAccess(interaction) {
    if (!interaction.guild_id || !isAdministrator(interaction)) {
        return ephemeralStatus(
            "Access Denied",
            "Only server administrators can use this feature.",
            ERROR_COLOR,
        );
    }

    return null;
}

async function fetchEditableMessage(interaction, env, messageId) {
    const message = await getMessage(env, interaction.channel_id, messageId);

    if (message.author?.id !== env.APPLICATION_ID || message.author?.bot !== true) {
        return { error: "The message is not sent by this bot." };
    }

    if (!Array.isArray(message.embeds) || message.embeds.length === 0) {
        return { error: "The message does not have any embeds that can be edited." };
    }

    const embed = message.embeds[0];
    if (!embed.title || !embed.description) {
        return {
            error: "The embed does not have a complete title and description, so it cannot be edited through this form.",
        };
    }

    if (embed.title.length > 256 || embed.description.length > 4000) {
        return {
            error: "The embed title or description exceeds the limit that can be loaded by the edit form.",
        };
    }

    return { message, embed };
}

function execute(interaction) {
    const accessError = validateAccess(interaction);
    if (accessError) return accessError;

    const action = interaction.data.options?.find((option) => option.name === "opsi")?.value;

    if (action === "create") return embedForm(CREATE_MODAL_ID, "Create Embed");

    if (action === "edit") {
        return modal(EDIT_LOOKUP_MODAL_ID, "Lookup Embed", [
            modalField("Message ID", "message_id", TextInputStyle.SHORT, {
                min_length: 17,
                max_length: 20,
                placeholder: "Enter message ID from the bot",
            }),
        ]);
    }

    return ephemeralStatus("Invalid Option", "Please choose either Create or Edit.", ERROR_COLOR);
}

async function handleCreateSubmit(interaction, env) {
    const accessError = validateAccess(interaction);
    if (accessError) {
        return editOriginalResponse(env, interaction.token, accessError.data);
    }

    const input = readEmbedInput(interaction);
    if (input.error) {
        return editOriginalResponse(env, interaction.token, {
            embeds: [statusEmbed("Invalid Embed", input.error, ERROR_COLOR)],
        });
    }

    try {
        const message = await sendMessage(env, interaction.channel_id, {
            embeds: [input.embed],
            allowed_mentions: { parse: [] },
        });

        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Embed Created Successfully",
                    `The embed has been sent to this channel. Message ID: \`${message.id}\``,
                    SUCCESS_COLOR,
                ),
            ],
        });
    } catch (error) {
        console.error("[embed:create] Failed to send embed:", error.message);
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Failed to Create Embed",
                    "Bot cannot send embed. Make sure the bot has permission to Send Messages and Embed Links, then try again.",
                    ERROR_COLOR,
                ),
            ],
        });
    }
}

async function handleLookupSubmit(interaction, env) {
    const accessError = validateAccess(interaction);
    if (accessError) {
        return editOriginalResponse(env, interaction.token, accessError.data);
    }

    const messageId = getModalText(interaction, "message_id")?.trim() ?? "";
    if (!/^\d{17,20}$/.test(messageId)) {
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Invalid Message ID",
                    "Please enter a valid Discord message ID, which consists of 17–20 digits.",
                    ERROR_COLOR,
                ),
            ],
        });
    }

    try {
        const result = await fetchEditableMessage(interaction, env, messageId);
        if (result.error) {
            return editOriginalResponse(env, interaction.token, {
                embeds: [statusEmbed("Embed Cannot Be Edited", result.error, ERROR_COLOR)],
            });
        }

        const userId = getUserId(interaction);
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Embed Found",
                    "The message has been verified successfully. Click the button below to open the pre-filled edit form.",
                    INFO_COLOR,
                ),
            ],
            components: [
                {
                    type: ComponentType.ACTION_ROW,
                    components: [
                        {
                            type: ComponentType.BUTTON,
                            style: ButtonStyle.PRIMARY,
                            custom_id: `${EDIT_BUTTON_PREFIX}${userId}:${messageId}`,
                            label: "Continue Edit",
                        },
                    ],
                },
            ],
        });
    } catch (error) {
        console.error("[embed:lookup] Failed to fetch message:", error.message);
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Message Not Found",
                    "The message was not found in this channel or the bot does not have permission to read it.",
                    ERROR_COLOR,
                ),
            ],
        });
    }
}

async function handleEditButton(interaction, env) {
    const accessError = validateAccess(interaction);
    if (accessError) return accessError;

    const scope = parseScopedCustomId(interaction.data.custom_id, EDIT_BUTTON_PREFIX);
    if (!scope || scope.userId !== getUserId(interaction)) {
        return ephemeralStatus(
            "Access Denied",
            "This button can only be used by Administrators who initiated the edit process.",
            ERROR_COLOR,
        );
    }

    try {
        const result = await fetchEditableMessage(interaction, env, scope.messageId);
        if (result.error) {
            return ephemeralStatus("Failed", "Embed Cannot Be Edited", result.error, ERROR_COLOR);
        }

        return embedForm(`${EDIT_MODAL_PREFIX}${scope.userId}:${scope.messageId}`, "Edit Embed", {
            title: result.embed.title,
            color: formatColor(result.embed.color ?? 0),
            description: result.embed.description,
        });
    } catch (error) {
        console.error("[embed:open-edit] Failed to fetch message:", error.message);
        return ephemeralStatus(
            "Message Not Found",
            "The message was not found in this channel or the bot does not have permission to read it.",
            ERROR_COLOR,
        );
    }
}

async function handleUpdateSubmit(interaction, env) {
    const accessError = validateAccess(interaction);
    if (accessError) {
        return editOriginalResponse(env, interaction.token, accessError.data);
    }

    const scope = parseScopedCustomId(interaction.data.custom_id, EDIT_MODAL_PREFIX);
    if (!scope || scope.userId !== getUserId(interaction)) {
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Invalid Edit Session",
                    "This edit session is not valid or not yours. Please run the `/embed` command again.",
                    ERROR_COLOR,
                ),
            ],
        });
    }

    const input = readEmbedInput(interaction);
    if (input.error) {
        return editOriginalResponse(env, interaction.token, {
            embeds: [statusEmbed("Embed Invalid", input.error, ERROR_COLOR)],
        });
    }

    try {
        const result = await fetchEditableMessage(interaction, env, scope.messageId);
        if (result.error) {
            return editOriginalResponse(env, interaction.token, {
                embeds: [statusEmbed("Embed Cannot Be Edited", result.error, ERROR_COLOR)],
            });
        }

        await editMessage(env, interaction.channel_id, scope.messageId, {
            embeds: [input.embed],
            allowed_mentions: { parse: [] },
        });

        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Embed Successfully Edited",
                    `Embed on message \`${scope.messageId}\` has been updated.`,
                    SUCCESS_COLOR,
                ),
            ],
        });
    } catch (error) {
        console.error("[embed:update] Failed to edit message:", error.message);
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Failed to Edit Embed",
                    "The bot could not update the embed. Please ensure the message is still available and the bot's permissions have not changed, then try again.",
                    ERROR_COLOR,
                ),
            ],
        });
    }
}

export default {
    name: "embed",
    definition: {
        description: "Create or edit embeds in this channel",
        default_member_permissions: "8",
        options: [
            {
                name: "option",
                description: "Select the action you want to perform",
                type: 3,
                required: true,
                choices: [
                    { name: "Create", value: "create" },
                    { name: "Edit", value: "edit" },
                ],
            },
        ],
    },
    execute,
    componentHandlers: {
        [EDIT_BUTTON_PREFIX]: handleEditButton,
    },
    modalHandlers: {
        [CREATE_MODAL_ID]: handleCreateSubmit,
        [EDIT_LOOKUP_MODAL_ID]: handleLookupSubmit,
        [EDIT_MODAL_PREFIX]: handleUpdateSubmit,
    },
};
