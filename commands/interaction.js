import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";
import { editOriginalResponse, sendMessage } from "../utils/discord.js";

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
                            title: "Discord Bot - Price List",
                            color: 3750465,
                            description:
                                "**Penting untuk dibaca:**  \nDaftar harga di bawah ini menampilkan pilihan layanan pembuatan bot Discord berdasarkan kebutuhan, tingkat kompleksitas, dan fitur yang diminta. Mohon membaca setiap benefit dan ketentuan dengan teliti agar tidak terjadi kesalahpahaman sebelum pemesanan.\n\n**Disclaimer:**  \nSetiap server Discord memiliki kebutuhan yang berbeda. Harga final dapat disesuaikan setelah proses konsultasi dan pengecekan brief. Kesalahan akibat informasi yang tidak lengkap dari pembeli atau perubahan permintaan di luar brief awal dapat memengaruhi biaya dan estimasi pengerjaan.\n\n**Penggunaan:**\nSilahkan klik tombol di bawah ini untuk menampilkan seluruh informasi, juga harga yang tertera untuk bot Discord. Harap baca dengan teliti untuk menentukan kebutuhan Anda, dan keperluan Anda. Segala kesalahpahaman Client karena kurangnya membaca, **bukan tanggung jawab** Harmony Hub.",
                        },
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 3,
                                    options: [
                                        {
                                            label: "Harga Bot Discord",
                                            value: "bot_price",
                                            emoji: {
                                                name: "💸",
                                            },
                                            description: "Melihat seluruh harga bot Discord",
                                        },
                                        {
                                            label: "Harga Maintenance",
                                            value: "maintenance_price",
                                            emoji: {
                                                name: "⚠️",
                                            },
                                            description: "Harga untuk maintenance bulanan",
                                        },
                                        {
                                            label: "Add-on Dan Tambahan Fitur",
                                            value: "add_on",
                                            description: "List harga penambahan fitur diluar paket",
                                            emoji: {
                                                name: "🏟️",
                                            },
                                        },
                                        {
                                            label: "Informasi Pembayaran",
                                            value: "payment_info",
                                            emoji: {
                                                name: "💳",
                                            },
                                            description:
                                                "List informasi tentang seluruh pembayaran",
                                        },
                                        {
                                            label: "Ketentuan Layanan",
                                            value: "service_terms",
                                            description: "Harap baca sebelum melakukan pembelian",
                                            emoji: {
                                                name: "📑",
                                            },
                                        },
                                        {
                                            label: "Frequently Asked Question",
                                            value: "faq",
                                            emoji: {
                                                name: "❓",
                                            },
                                            description: "Jawaban  yang mungkin Anda cari",
                                        },
                                        {
                                            label: "Cara Pemesanan",
                                            value: "order_guide",
                                            emoji: {
                                                name: "🤔",
                                            },
                                            description: "Bingung? Klik ini aja yaa",
                                        },
                                        {
                                            label: "Panduan Pemilihan Paket",
                                            value: "package_guide",
                                            description:
                                                "Cek ini kalo mau liat saran pemilihan paket",
                                            emoji: {
                                                name: "📮",
                                            },
                                        },
                                        {
                                            label: "Catatan Penting",
                                            value: "important_notes",
                                            emoji: {
                                                name: "❗",
                                            },
                                            description: "Penting untuk di baca!",
                                        },
                                    ],
                                    flows: {},
                                    custom_id: "bot_price_list_select",
                                    min_values: 1,
                                    max_values: 1,
                                    placeholder: "Klik ini dan buat pilihan",
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
