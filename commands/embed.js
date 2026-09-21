import {
    ButtonStyle,
    ComponentType,
    PermissionFlags,
    TextInputStyle,
} from "../utils/constants.js";
import {
    editMessage,
    editOriginalResponse,
    getMessage,
    sendMessage,
} from "../utils/discord.js";
import { ephemeralEmbed, getModalText, modal } from "../utils/responses.js";

const CREATE_MODAL_ID = "embed:create";
const EDIT_LOOKUP_MODAL_ID = "embed:lookup";
const EDIT_BUTTON_PREFIX = "embed:open-edit:";
const EDIT_MODAL_PREFIX = "embed:update:";
const SUCCESS_COLOR = 0x57f287;
const ERROR_COLOR = 0xed4245;
const INFO_COLOR = 0x5865f2;

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
        modalField("Judul", "title", TextInputStyle.SHORT, {
            min_length: 1,
            max_length: 256,
            placeholder: "Masukkan judul embed",
            ...(values.title ? { value: values.title } : {}),
        }),
        modalField("Warna (Hex)", "color", TextInputStyle.SHORT, {
            min_length: 3,
            max_length: 9,
            placeholder: "Contoh: #5865F2",
            ...(values.color ? { value: values.color } : {}),
        }),
        modalField("Deskripsi", "description", TextInputStyle.PARAGRAPH, {
            min_length: 1,
            max_length: 4000,
            placeholder: "Masukkan deskripsi embed",
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
        return { error: "Judul dan deskripsi tidak boleh kosong." };
    }

    if (color === null) {
        return {
            error: "Warna tidak valid. Gunakan format Hex seperti `#5865F2` atau `5865F2`.",
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
            "Akses Ditolak",
            "Hanya Administrator server yang dapat menggunakan fitur ini.",
        );
    }

    return null;
}

async function fetchEditableMessage(interaction, env, messageId) {
    const message = await getMessage(env, interaction.channel_id, messageId);

    if (message.author?.id !== env.APPLICATION_ID || message.author?.bot !== true) {
        return { error: "Pesan tersebut bukan pesan yang dikirim oleh bot ini." };
    }

    if (!Array.isArray(message.embeds) || message.embeds.length === 0) {
        return { error: "Pesan tersebut tidak memiliki embed yang dapat diedit." };
    }

    const embed = message.embeds[0];
    if (!embed.title || !embed.description) {
        return {
            error: "Embed tersebut tidak memiliki judul dan deskripsi lengkap sehingga tidak dapat diedit melalui formulir ini.",
        };
    }

    if (embed.title.length > 256 || embed.description.length > 4000) {
        return {
            error: "Judul atau deskripsi embed melebihi batas yang dapat dimuat oleh formulir edit.",
        };
    }

    return { message, embed };
}

function execute(interaction) {
    const accessError = validateAccess(interaction);
    if (accessError) return accessError;

    const action = interaction.data.options?.find((option) => option.name === "opsi")?.value;

    if (action === "create") return embedForm(CREATE_MODAL_ID, "Buat Embed");

    if (action === "edit") {
        return modal(EDIT_LOOKUP_MODAL_ID, "Cari Embed", [
            modalField("ID Pesan", "message_id", TextInputStyle.SHORT, {
                min_length: 17,
                max_length: 20,
                placeholder: "Masukkan ID pesan dari bot",
            }),
        ]);
    }

    return ephemeralStatus("Opsi Tidak Valid", "Silakan pilih opsi Buat atau Edit.");
}

async function handleCreateSubmit(interaction, env) {
    const accessError = validateAccess(interaction);
    if (accessError) {
        return editOriginalResponse(env, interaction.token, accessError.data);
    }

    const input = readEmbedInput(interaction);
    if (input.error) {
        return editOriginalResponse(env, interaction.token, {
            embeds: [statusEmbed("Embed Tidak Valid", input.error, ERROR_COLOR)],
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
                    "Embed Berhasil Dibuat",
                    `Embed telah dikirim ke channel ini. ID pesan: \`${message.id}\``,
                    SUCCESS_COLOR,
                ),
            ],
        });
    } catch (error) {
        console.error("[embed:create] Failed to send embed:", error.message);
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Gagal Membuat Embed",
                    "Bot tidak dapat mengirim embed. Pastikan bot memiliki izin Kirim Pesan dan Sematkan Tautan, lalu coba lagi.",
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
                    "ID Pesan Tidak Valid",
                    "Masukkan ID pesan Discord yang valid, terdiri dari 17–20 angka.",
                    ERROR_COLOR,
                ),
            ],
        });
    }

    try {
        const result = await fetchEditableMessage(interaction, env, messageId);
        if (result.error) {
            return editOriginalResponse(env, interaction.token, {
                embeds: [statusEmbed("Embed Tidak Dapat Diedit", result.error, ERROR_COLOR)],
            });
        }

        const userId = getUserId(interaction);
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Embed Ditemukan",
                    "Pesan berhasil diverifikasi. Tekan tombol di bawah untuk membuka formulir edit yang sudah terisi.",
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
                            label: "Lanjutkan Edit",
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
                    "Pesan Tidak Ditemukan",
                    "Pesan tidak ditemukan di channel ini atau bot tidak memiliki izin untuk membacanya.",
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
            "Akses Ditolak",
            "Tombol ini hanya dapat digunakan oleh Administrator yang memulai proses edit.",
        );
    }

    try {
        const result = await fetchEditableMessage(interaction, env, scope.messageId);
        if (result.error) {
            return ephemeralStatus("Embed Tidak Dapat Diedit", result.error);
        }

        return embedForm(`${EDIT_MODAL_PREFIX}${scope.userId}:${scope.messageId}`, "Edit Embed", {
            title: result.embed.title,
            color: formatColor(result.embed.color ?? 0),
            description: result.embed.description,
        });
    } catch (error) {
        console.error("[embed:open-edit] Failed to fetch message:", error.message);
        return ephemeralStatus(
            "Pesan Tidak Ditemukan",
            "Pesan tidak ditemukan di channel ini atau bot tidak memiliki izin untuk membacanya.",
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
                    "Sesi Edit Tidak Valid",
                    "Sesi edit ini tidak valid atau bukan milik Anda. Jalankan kembali perintah `/embed`.",
                    ERROR_COLOR,
                ),
            ],
        });
    }

    const input = readEmbedInput(interaction);
    if (input.error) {
        return editOriginalResponse(env, interaction.token, {
            embeds: [statusEmbed("Embed Tidak Valid", input.error, ERROR_COLOR)],
        });
    }

    try {
        const result = await fetchEditableMessage(interaction, env, scope.messageId);
        if (result.error) {
            return editOriginalResponse(env, interaction.token, {
                embeds: [statusEmbed("Embed Tidak Dapat Diedit", result.error, ERROR_COLOR)],
            });
        }

        await editMessage(env, interaction.channel_id, scope.messageId, {
            embeds: [input.embed],
            allowed_mentions: { parse: [] },
        });

        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Embed Berhasil Diedit",
                    `Embed pada pesan \`${scope.messageId}\` telah diperbarui.`,
                    SUCCESS_COLOR,
                ),
            ],
        });
    } catch (error) {
        console.error("[embed:update] Failed to edit message:", error.message);
        return editOriginalResponse(env, interaction.token, {
            embeds: [
                statusEmbed(
                    "Gagal Mengedit Embed",
                    "Bot tidak dapat memperbarui embed tersebut. Pastikan pesan masih tersedia dan izin bot tidak berubah, lalu coba lagi.",
                    ERROR_COLOR,
                ),
            ],
        });
    }
}

export default {
    name: "embed",
    definition: {
        description: "Buat atau edit embed di channel ini",
        default_member_permissions: "8",
        options: [
            {
                name: "opsi",
                description: "Pilih tindakan yang ingin dilakukan",
                type: 3,
                required: true,
                choices: [
                    { name: "Buat", value: "create" },
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
