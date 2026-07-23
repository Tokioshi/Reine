import { ComponentType, TextInputStyle } from "../utils/constants.js";
import { sendMessage, sendMessageWithFiles, editOriginalResponse } from "../utils/discord.js";
import { modal, getModalText, getModalFiles } from "./_helpers.js";

function execute(_interaction, _env) {
    return modal("message", "Message Form", [
        {
            type: ComponentType.LABEL,
            label: "Text Content",
            component: {
                type: ComponentType.TEXT_INPUT,
                custom_id: "text",
                style: TextInputStyle.PARAGRAPH,
                min_length: 1,
                max_length: 4000,
                required: false,
            },
        },
        {
            type: ComponentType.LABEL,
            label: "Attachment",
            component: {
                type: ComponentType.FILE_UPLOAD,
                custom_id: "attachment",
                required: false,
                max_values: 10,
            },
        },
        {
            type: ComponentType.LABEL,
            label: "Message ID (Reply)",
            component: {
                type: ComponentType.TEXT_INPUT,
                custom_id: "message_id",
                style: TextInputStyle.SHORT,
                min_length: 1,
                max_length: 50,
                required: false,
            },
        },
    ]);
}

async function handleModalSubmit(interaction, env) {
    const text = getModalText(interaction, "text")?.trim() || null;
    const messageId = getModalText(interaction, "message_id")?.trim() || null;
    const attachments = getModalFiles(interaction, "attachment");

    if (!text && attachments.length === 0 && !messageId) {
        return editOriginalResponse(env, interaction.token, {
            content:
                "https://tenor.com/view/tertawa-tapi-terluka-tertawa-tapi-terluka-gif-4910619389471646348",
        });
    }

    const files = [];
    for (const attachment of attachments) {
        try {
            const res = await fetch(attachment.url);
            files.push({ blob: await res.blob(), name: attachment.filename || "attachment.png" });
        } catch (err) {
            console.error(
                `[message modal] Failed to fetch attachment ${attachment.filename}:`,
                err.message,
            );
        }
    }

    try {
        if (files.length > 0) {
            await sendMessageWithFiles(env, interaction.channel_id, {
                content: text ?? undefined,
                files,
                messageReference: messageId ?? undefined,
            });
        } else {
            await sendMessage(env, interaction.channel_id, {
                content: text,
                ...(messageId ? { message_reference: { message_id: messageId } } : {}),
            });
        }

        return editOriginalResponse(env, interaction.token, {
            embeds: [{ description: "You've just sent a message as bot!", color: 0x2ecc71 }],
        });
    } catch (err) {
        console.error("[message modal] Failed to send:", err.message);

        return editOriginalResponse(env, interaction.token, {
            embeds: [
                {
                    description:
                        "Failed to send announcement.\nPlease check the message ID (if used) and attachments, then try again.",
                    color: 0xe74c3c,
                },
            ],
        });
    }
}

export default {
    name: "message",
    definition: {
        description: "Compose a message to send in this channel",
        default_member_permissions: "8",
    },
    execute,
    modalId: "message",
    handleModalSubmit,
};
