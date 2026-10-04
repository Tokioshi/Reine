import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";
import { editOriginalResponse, sendMessage } from "../utils/discord.js";
import { ComponentType } from "../utils/constants.js";
import { tosComponentHandlers } from "../components/tos.js";

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
                                "Dokumen ini mengatur Syarat dan Ketentuan (“**S&K**”) penggunaan layanan jasa pembuatan bot yang disediakan oleh **Harmony Hub** (selanjutnya disebut “**Kami**” atau “**Penyedia Jasa**”).\n\nPihak yang mengakses layanan, melakukan pemesanan, dan/atau melakukan pembayaran kepada Kami disebut sebagai “**Anda**” atau “**Klien**”.\n\nDengan mengakses layanan Kami, melakukan pemesanan, atau mengirimkan pembayaran, Anda dinyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan dalam S&K ini. Dokumen ini berlaku sebagai perjanjian yang mengikat antara Anda dan Kami.",
                            title: "Syarat dan Ketentuan Harmony Hub",
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
                                            label: "Informasi Penyedia Layanan",
                                            value: "service_information",
                                            emoji: {
                                                name: "💼",
                                            },
                                        },
                                        {
                                            label: "Definisi Istilah Kunci dan Layanan",
                                            value: "definition_and_service",
                                            emoji: {
                                                name: "🔑",
                                            },
                                        },
                                        {
                                            label: "Ketentuan Penggunaan Layanan",
                                            value: "tos_service",
                                            emoji: {
                                                name: "⚖️",
                                            },
                                        },
                                        {
                                            label: "Hak Kekayaan Intelektual",
                                            value: "haki_terms",
                                            emoji: {
                                                name: "💡",
                                            },
                                        },
                                        {
                                            label: "Ketentuan Pembayaran",
                                            value: "payment_terms",
                                            emoji: {
                                                name: "🧾",
                                            },
                                        },
                                        {
                                            label: "Waktu Pengerjaan dan Penyerahan",
                                            value: "work_time",
                                            emoji: {
                                                name: "⏳",
                                            },
                                        },
                                        {
                                            label: "Kebijakan Pembatalan dan Kompensasi",
                                            value: "cancellation_terms",
                                            emoji: {
                                                name: "🚫",
                                            },
                                        },
                                        {
                                            label: "Dukungan dan Perawatan",
                                            value: "support_maintenance",
                                            emoji: {
                                                name: "🧰",
                                            },
                                        },
                                        {
                                            label: "Penyelesaian Sengketa",
                                            value: "dispute_resolution",
                                            emoji: {
                                                name: "🏛️",
                                            },
                                        },
                                        {
                                            label: "Perubahan Syarat dan Ketentuan",
                                            value: "tos_changes",
                                            emoji: {
                                                name: "📑",
                                            },
                                        },
                                        {
                                            label: "Kontak dan Dukungan Resmi",
                                            value: "official_contact",
                                            emoji: {
                                                name: "💬",
                                            },
                                        },
                                        {
                                            label: "Penutup",
                                            value: "closing",
                                            emoji: {
                                                name: "✨",
                                            },
                                        },
                                    ],
                                    custom_id: "tos_select_menu",
                                    min_values: 1,
                                    max_values: 1,
                                    placeholder: "Pilih ToS Yang Ingin Anda Lihat",
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
    componentHandlers: tosComponentHandlers,
};
