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
                            title: "Metode Pembayaran",
                            description:
                                "Berikut adalah informasi lengkap mengenai metode pembayaran yang tersedia di Harmony Hub. Mohon untuk membaca dengan teliti dan pastikan melakukan transaksi dengan benar sesuai petunjuk yang diberikan untuk menghindari kesalahan pengiriman dana.",
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
                                            label: "Gopay Transfer",
                                            value: "gopay_transfer",
                                            emoji: {
                                                name: "💳",
                                            },
                                        },
                                        {
                                            label: "Scan QRIS",
                                            value: "scan_qris",
                                            emoji: {
                                                name: "📱",
                                            },
                                        },
                                        {
                                            label: "Trakteer",
                                            value: "trakteer",
                                            emoji: {
                                                name: "🧧",
                                            },
                                        },
                                        {
                                            label: "Disclaimer",
                                            value: "disclaimer",
                                            emoji: {
                                                name: "⚖️",
                                            },
                                        },
                                    ],
                                    custom_id: "payment_method_select",
                                    min_values: 1,
                                    max_values: 1,
                                    placeholder: "Pilih Bagian Metode Pembayaran",
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
