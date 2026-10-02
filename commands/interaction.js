import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";
import { editOriginalResponse, sendMessage } from "../utils/discord.js";
import { ComponentType } from "../utils/constants.js";

function execute(interaction) {
    return {
        response: ephemeralEmbed([
            {
                title: "Sending",
                color: config.color.warning,
                description: "Sending the interaction...",
            },
        ]),
        afterResponse: async (env) => {
            try {
                await sendMessage(env, interaction.channel_id, {
                    embeds: [
                        {
                            description:
                                "**Penting untuk dibaca:** Daftar harga di bawah ini menampilkan berbagai paket layanan pembuatan dan konfigurasi Server Discord. Mohon untuk membaca dengan teliti setiap manfaat dan ketentuan yang berlaku pada masing-masing paket untuk menghindari kesalahpahaman di kemudian hari.\n\n**Penegasan:** Kekeliruan atau kesalahan yang terjadi akibat ketidaktelitian Klien dalam membaca informasi ini bukan menjadi tanggung jawab Harmony Hub. Kami sangat menyarankan Klien untuk membaca keseluruhan informasi ini sebelum melakukan pemesanan.",
                            title: "Harga Layanan Pembuatan Server Discord - Harmony Hub",
                            color: config.color.default,
                        },
                    ],
                    components: [
                        {
                            type: ComponentType.ACTION_ROW,
                            components: [
                                {
                                    type: ComponentType.STRING_SELECT,
                                    options: [
                                        {
                                            label: "Paket Dasar",
                                            value: "basic_package",
                                            emoji: {
                                                name: "🍙",
                                            },
                                        },
                                        {
                                            label: "Paket Reguler",
                                            value: "regular_package",
                                            emoji: {
                                                name: "🍻",
                                            },
                                        },
                                        {
                                            label: "Paket Lite",
                                            value: "lite_package",
                                            emoji: {
                                                name: "🍣",
                                            },
                                        },
                                        {
                                            label: "Paket Enterprise",
                                            value: "enterprise_package",
                                            emoji: {
                                                name: "🍗",
                                            },
                                        },
                                        {
                                            label: "Catatan Tambahan",
                                            value: "extra_notes",
                                            emoji: {
                                                name: "📚",
                                            },
                                        },
                                    ],
                                    custom_id: "server_price_list",
                                    min_values: 1,
                                    max_values: 1,
                                    placeholder: "Pilih Paket Yang Anda Inginkan",
                                },
                            ],
                        },
                    ],
                });

                await editOriginalResponse(env, interaction.token, {
                    embeds: [
                        {
                            title: "Success",
                            color: config.color.success,
                            description: "The interaction has been sent successfully.",
                        },
                    ],
                });
            } catch (error) {
                console.error("[interaction] Failed to send:", error.message);
                await editOriginalResponse(env, interaction.token, {
                    embeds: [
                        {
                            title: "Failed",
                            color: config.color.error,
                            description: "Failed to send the interaction.",
                        },
                    ],
                });
            }
        },
    };
}

export default {
    name: "interaction",
    definition: {
        description: "Sending an interaction for the community",
        default_member_permissions: "8",
    },
    execute,
};
