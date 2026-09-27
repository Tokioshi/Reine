import config from "../config.js";
import { ButtonStyle, ComponentType, InteractionResponseType } from "../utils/constants.js";
import { ephemeral, ephemeralEmbed } from "../utils/responses.js";

const priceListEmbeds = [
    {
        color: config.color.default,
        description:
            "**Harga:** Rp50.000 - Rp100.000\n\nPaket ini cocok untuk bot sederhana dengan fitur dasar dan kebutuhan ringan.\n\n**Benefit:**\n- Bot custom sesuai kebutuhan dasar server\n- Maksimal 3 fitur ringan\n- Cocok untuk command informasi, embed, greeting, fun command, atau fitur sederhana lainnya\n- Setup dan testing bot\n- Bantuan konfigurasi awal\n- Garansi bug fixing 7 hari setelah bot selesai\n\n**Contoh fitur:**\n- Informasi server\n- Informasi user\n- Simple embed message\n- Welcome/goodbye sederhana\n- Fun command ringan\n- Command custom tanpa database kompleks\n\n**Catatan:**  \nPaket ini cocok untuk server kecil atau client yang baru ingin mulai menggunakan bot custom.",
        title: "Paket Starter Bot",
    },
    {
        color: config.color.default,
        description:
            "**Harga:** Rp125.000 - Rp200.000\n\nPaket ini cocok untuk server komunitas yang membutuhkan fitur lebih lengkap dan sistem yang lebih terstruktur.\n\n**Benefit:**\n- Bot custom untuk kebutuhan komunitas\n- Beberapa fitur menengah sesuai brief\n- Bisa menggunakan database ringan\n- Setup, testing, dan konfigurasi awal\n- Bantuan penggunaan bot\n- Dokumentasi command sederhana\n- Garansi bug fixing 14 hari setelah bot selesai\n\n**Contoh fitur:**\n- Moderation system\n- Auto-moderation sederhana\n- Role management\n- Welcome/goodbye system\n- Logging server\n- Message listener\n- Database simple\n- Sistem command interaktif\n\n**Catatan:**  \nHarga final bergantung pada jumlah fitur, tingkat kerumitan, dan apakah bot membutuhkan database atau sistem tambahan.",
        title: "Paket Community Bot",
    },
    {
        color: config.color.default,
        description:
            "**Harga:** Rp225.000 - Rp300.000\n\nPaket ini ditujukan untuk bot dengan sistem yang lebih kompleks, logic khusus, integrasi eksternal, database, atau kebutuhan yang tidak dapat disamakan dengan paket biasa.\n\n**Benefit:**\n- Bot custom berdasarkan workflow server\n- Sistem kompleks sesuai kebutuhan\n- Database lebih terstruktur\n- Integrasi API jika diperlukan\n- Testing fitur lebih detail\n- Bantuan setup dan konfigurasi\n- Dokumentasi penggunaan bot\n- Garansi bug fixing 14-30 hari tergantung project\n\n**Contoh fitur:**\n- Ticket system custom\n- Economy system\n- Leveling system kompleks\n- Multi-server functionality\n- API integration\n- Dashboard web sederhana\n- Sistem database kompleks\n- Automation khusus\n- Sistem khusus sesuai request client\n\n**Catatan:**  \nHarga final ditentukan setelah konsultasi berdasarkan jumlah fitur, tingkat kompleksitas, estimasi waktu pengerjaan, dan kebutuhan teknis project. Batas harga paket ini adalah Rp300.000 selama kebutuhan masih berada dalam cakupan layanan yang tersedia.",
        title: "Paket Custom System Bot",
    },
];

const maintenancePlans = {
    care_basic: {
        color: config.color.default,
        description:
            "**Harga:** Rp10.000/bulan\n\nCocok untuk bot kecil dengan kebutuhan support ringan.\n\n**Benefit:**\n- Hosting ringan\n- Restart bot jika terjadi error/down\n- Bug fixing kecil\n- Pengecekan dasar\n- Support ringan",
        title: "Care Basic",
    },
    care_plus: {
        color: config.color.default,
        description:
            "**Harga:** Rp20.000/bulan\n\nCocok untuk bot komunitas yang aktif digunakan dan membutuhkan support secara berkala.\n\n**Benefit:**\n- Hosting bot\n- Monitoring dasar\n- Bug fixing\n- Minor update\n- Bantuan konfigurasi\n- Support lebih prioritas dibanding Care Basic",
        title: "Care Plus",
    },
    care_pro: {
        color: config.color.default,
        description:
            "**Harga:** Rp40.000/bulan\n\nCocok untuk bot penting yang digunakan di server aktif, komunitas besar, atau sistem yang membutuhkan stabilitas lebih tinggi.\n\n**Benefit:**\n- Hosting bot\n- Monitoring lebih serius\n- Prioritas support\n- Bug fixing\n- Minor feature update setiap bulan\n- Backup database jika bot menggunakan database\n- Bantuan teknis lebih lengkap",
        title: "Care Pro",
    },
    care_notes: {
        color: config.color.default,
        description:
            "Maintenance bersifat opsional. Jika client tidak mengambil maintenance, support gratis hanya berlaku selama masa garansi sesuai paket pembuatan bot yang dipilih.\n\nMaintenance tidak mencakup penambahan sistem besar atau perubahan total terhadap fitur yang sebelumnya telah dibuat. Permintaan tersebut akan dihitung sebagai fitur atau project tambahan.",
        title: "Catatan",
    },
};

const addOnInfoEmbed = {
    color: config.color.default,
    description:
        "Penambahan fitur di luar paket atau brief awal akan dikenakan biaya tambahan sesuai tingkat kesulitan dan kebutuhan teknis.",
    title: "Add-on dan Tambahan Fitur",
};

const addOnPages = [
    {
        color: config.color.default,
        description:
            "**Harga:** Rp10.000 - Rp20.000 per fitur\n\nContoh:\n- Command informasi\n- Simple embed\n- Fun command sederhana\n- Command teks biasa\n- Command tanpa database\n- Auto-response sederhana",
        title: "Fitur Basic",
    },
    {
        color: config.color.default,
        description:
            "**Harga:** Rp25.000 - Rp40.000 per fitur\n\nContoh:\n- Database simple\n- Role management\n- Welcome/goodbye system\n- Logging system\n- Moderation command\n- Auto-response dengan logic tambahan\n- Message listener\n- Sistem konfigurasi sederhana",
        title: "Fitur Intermediate",
    },
    {
        color: config.color.default,
        description:
            "**Harga:** Rp50.000 - Rp100.000 per fitur/sistem\n\nContoh:\n- Ticket system\n- Economy system\n- Leveling system\n- API integration\n- Multi-server system\n- Dashboard web\n- Sistem custom dengan database kompleks\n- Automation khusus",
        title: "Fitur Advanced",
    },
    {
        color: config.color.default,
        description:
            "Fitur advanced dihitung berdasarkan kompleksitas, estimasi waktu pengerjaan, database, API, serta kebutuhan teknis lainnya.\n\nApabila beberapa fitur advanced dipesan sekaligus, client dapat disarankan menggunakan Paket Custom System Bot agar harga dan pengerjaan lebih efisien.",
        title: "Catatan",
    },
];

function paginationComponents(prefix, page, lastPage) {
    return [
        {
            type: ComponentType.ACTION_ROW,
            components: [
                {
                    type: ComponentType.BUTTON,
                    style: page === 1 ? ButtonStyle.SECONDARY : ButtonStyle.PRIMARY,
                    custom_id: `${prefix}:previous:${Math.max(1, page - 1)}`,
                    label: "Previous",
                    emoji: { name: "◀️" },
                    disabled: page === 1,
                },
                {
                    type: ComponentType.BUTTON,
                    style: ButtonStyle.SECONDARY,
                    custom_id: `${prefix}:indicator:${page}`,
                    label: `${page}/${lastPage}`,
                    disabled: true,
                },
                {
                    type: ComponentType.BUTTON,
                    style: page === lastPage ? ButtonStyle.SECONDARY : ButtonStyle.PRIMARY,
                    custom_id: `${prefix}:next:${Math.min(lastPage, page + 1)}`,
                    label: "Next",
                    emoji: { name: "▶️" },
                    disabled: page === lastPage,
                },
            ],
        },
    ];
}

function handlePriceListSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];

    switch (selectedValue) {
        case "bot_price": {
            return ephemeralEmbed(
                [priceListEmbeds[0]],
                paginationComponents("bot_price", 1, priceListEmbeds.length),
            );
        }

        case "maintenance_price": {
            return ephemeralEmbed(
                [
                    {
                        description:
                            "Bot Discord tidak hanya membutuhkan proses development awal. Bot juga dapat membutuhkan hosting, pengecekan, update, dan perbaikan apabila terjadi error atau perubahan dari Discord, API, library, maupun sistem lain yang digunakan.\n\nClient dapat memilih maintenance bulanan agar bot tetap aktif, stabil, dan mendapatkan support setelah masa garansi selesai.\n\nKlik tombol di bawah untuk memulai navigasi.",
                        title: "Maintenance Bulanan",
                        color: config.color.default,
                    },
                ],
                [
                    {
                        type: ComponentType.ACTION_ROW,
                        components: [
                            {
                                type: ComponentType.STRING_SELECT,
                                options: [
                                    {
                                        label: "Care Basic",
                                        value: "care_basic",
                                        emoji: { name: "🧌" },
                                    },
                                    {
                                        label: "Care Plus",
                                        value: "care_plus",
                                        emoji: { name: "🍵" },
                                    },
                                    {
                                        label: "Care Pro",
                                        value: "care_pro",
                                        emoji: { name: "🍔" },
                                    },
                                    {
                                        label: "Catatan",
                                        value: "care_notes",
                                        emoji: { name: "📔" },
                                    },
                                ],
                                flows: {},
                                custom_id: "p_351395336821936203",
                                min_values: 1,
                                max_values: 1,
                                placeholder: "Pilih paket maintenance yang diinginkan",
                            },
                        ],
                    },
                ],
            );
        }

        case "add_on": {
            return ephemeralEmbed(
                [addOnInfoEmbed, addOnPages[0]],
                paginationComponents("add_on", 1, addOnPages.length),
            );
        }

        case "payment_info": {
            return ephemeralEmbed([
                {
                    description:
                        "- Harga final ditentukan setelah konsultasi dan pengecekan brief.\n- Untuk project kecil, pembayaran dilakukan di awal sebelum pengerjaan dimulai.\n- Untuk project menengah atau besar, pembayaran dapat dilakukan dengan sistem DP.\n- Minimal DP untuk project menengah/besar adalah 50%.\n- Pelunasan dilakukan sebelum bot diserahkan sepenuhnya kepada client.\n- Maintenance bulanan dibayar di awal periode.\n- Add-on atau fitur tambahan di luar brief akan dihitung secara terpisah.\n- Harga yang telah disepakati tidak berubah selama client tidak mengubah atau menambah brief.\n\n**Catatan:**  \nPengerjaan baru dimulai setelah pembayaran awal atau DP dikonfirmasi.",
                    title: "Informasi Pembayaran",
                    color: config.color.default,
                },
            ]);
        }

        case "service_terms": {
            return ephemeralEmbed([
                {
                    description:
                        "- Setiap paket mencakup development, testing, dan setup awal.\n- Revisi gratis hanya berlaku selama masih sesuai dengan brief awal.\n- Perubahan fitur besar atau permintaan baru di luar brief akan dikenakan biaya tambahan.\n- Garansi bug fixing berlaku sesuai paket yang dipilih.\n- Bug fixing hanya berlaku untuk error dari sistem yang dibuat.\n- Garansi tidak mencakup error akibat perubahan konfigurasi oleh client, perubahan layanan pihak ketiga, perubahan API, atau modifikasi source code oleh pihak lain.\n- Estimasi pengerjaan berkisar antara 1-21 hari kerja tergantung kompleksitas.\n- Bot yang tidak mengambil maintenance bulanan hanya mendapat support selama masa garansi.\n- Setelah masa garansi habis, perbaikan, update, atau bantuan teknis dapat dikenakan biaya tambahan.\n- Source code dan akses lain yang termasuk dalam kesepakatan akan diberikan setelah pembayaran diselesaikan.\n- Permintaan yang tidak terdapat dalam brief awal dianggap sebagai tambahan fitur.",
                    title: "Ketentuan Layanan",
                    color: config.color.default,
                },
            ]);
        }

        case "faq": {
            return ephemeralEmbed([
                {
                    description:
                        "Bot Discord merupakan software yang bergantung pada beberapa sistem lain. Meskipun bot telah selesai dibuat dan berjalan dengan normal, masalah tetap dapat muncul di kemudian hari.\n\nBeberapa hal yang dapat terjadi setelah bot selesai dibuat:\n\n- Bot mengalami error karena perubahan library/API\n- Hosting mengalami masalah\n- Token atau konfigurasi berubah\n- Database membutuhkan pengecekan\n- Client membutuhkan update kecil\n- Discord melakukan perubahan pada sistem mereka\n- Dependency mengalami update\n- Bot membutuhkan restart atau monitoring\n- Terjadi error setelah bot digunakan dalam jangka waktu tertentu\n\nDengan maintenance, client mendapatkan bantuan teknis setelah masa garansi selesai tanpa perlu melakukan pemesanan support secara terpisah setiap kali terjadi masalah kecil.",
                    title: "Kenapa Ada Maintenance?",
                    color: config.color.default,
                },
            ]);
        }

        case "order_guide": {
            return ephemeralEmbed([
                {
                    description:
                        "1. **Konsultasi**  \n   Hubungi kami melalui channel yang tersedia untuk konsultasi kebutuhan bot.\n\n2. **Brief Detail**  \n   Jelaskan fitur yang diinginkan, tujuan bot, contoh referensi, dan kebutuhan server.\n\n3. **Pengecekan Kebutuhan**  \n   Kami akan mengecek tingkat kompleksitas, kebutuhan database, API, hosting, dan sistem lainnya.\n\n4. **Estimasi Harga**  \n   Kami akan menentukan paket, estimasi harga, dan estimasi waktu pengerjaan.\n\n5. **Pembayaran Awal / DP**  \n   Pengerjaan dimulai setelah pembayaran awal atau DP dikonfirmasi.\n\n6. **Pengerjaan Bot**  \n   Bot akan dibuat berdasarkan brief yang telah disepakati.\n\n7. **Testing dan Revisi**  \n   Bot akan diuji dan dilakukan revisi apabila masih terdapat bagian yang tidak sesuai dengan brief awal.\n\n8. **Pelunasan dan Penyerahan**  \n   Setelah selesai, client melakukan pelunasan sebelum bot diserahkan sepenuhnya.\n\n9. **Maintenance Opsional**  \n   Client dapat memilih paket maintenance bulanan agar bot tetap mendapatkan support setelah masa garansi selesai.",
                    title: "Cara Pemesanan",
                    color: config.color.default,
                },
            ]);
        }

        case "package_guide": {
            return ephemeralEmbed([
                {
                    description:
                        "### Pilih Starter Bot jika:\n- Hanya membutuhkan beberapa command\n- Tidak membutuhkan sistem database kompleks\n- Bot digunakan untuk kebutuhan sederhana\n- Tidak membutuhkan integrasi API atau dashboard\n### Pilih Community Bot jika:\n- Bot digunakan untuk server komunitas\n- Membutuhkan beberapa sistem sekaligus\n- Membutuhkan database sederhana\n- Membutuhkan moderation, logging, role, atau sistem interaktif lainnya\n### Pilih Custom System Bot jika:\n- Membutuhkan sistem yang saling terhubung\n- Membutuhkan database yang lebih kompleks\n- Membutuhkan API integration\n- Membutuhkan dashboard web\n- Membutuhkan automation atau logic khusus\n- Bot menjadi bagian penting dari operasional server\n\nPemilihan paket tetap akan disesuaikan setelah brief diperiksa.",
                    title: "Panduan Pemilihan Paket",
                    color: config.color.default,
                },
            ]);
        }

        case "important_notes": {
            return ephemeralEmbed([
                {
                    description:
                        "Harga layanan tidak hanya dihitung berdasarkan jumlah command atau jumlah file yang dibuat.\n\nBeberapa faktor yang menentukan harga antara lain:\n\n- Waktu pengerjaan\n- Tingkat kesulitan fitur\n- Jumlah fitur\n- Kompleksitas logic\n- Penggunaan database\n- Integrasi API\n- Testing\n- Setup awal\n- Bantuan konfigurasi\n- Garansi bug fixing\n- Risiko error teknis\n- Support setelah bot selesai\n\nBot custom bukan hanya sekadar kumpulan command, tetapi sistem yang dibuat berdasarkan kebutuhan server dan workflow client.\n\nKarena itu, dua bot dengan jumlah command yang sama belum tentu memiliki harga yang sama apabila tingkat kompleksitas sistemnya berbeda.",
                    title: "Catatan Penting",
                    color: config.color.default,
                },
            ]);
        }

        default:
            return ephemeralEmbed([
                {
                    color: config.color.default,
                    description: "Pilihan ini belum tersedia.",
                },
            ]);
    }
}

function handleMaintenanceSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = maintenancePlans[selectedValue];

    if (!embed) return ephemeral("Pilihan maintenance tidak valid.");

    return ephemeralEmbed([embed]);
}

function handleAddOnButton(interaction) {
    const page = Number(interaction.data?.custom_id?.split(":").pop());
    if (!Number.isInteger(page) || page < 1 || page > addOnPages.length) {
        return ephemeral("Halaman add-on tidak valid.");
    }

    return {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
            embeds: [addOnInfoEmbed, addOnPages[page - 1]],
            components: paginationComponents("add_on", page, addOnPages.length),
        },
    };
}

function handleBotPriceButton(interaction) {
    const page = Number(interaction.data?.custom_id?.split(":").pop());
    if (!Number.isInteger(page) || page < 1 || page > priceListEmbeds.length) {
        return ephemeral("Halaman paket tidak valid.");
    }

    return {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
            embeds: [priceListEmbeds[page - 1]],
            components: paginationComponents("bot_price", page, priceListEmbeds.length),
        },
    };
}

export const priceListComponentHandlers = {
    bot_price_list_select: handlePriceListSelect,
    p_351395336821936203: handleMaintenanceSelect,
    "add_on:": handleAddOnButton,
    "bot_price:": handleBotPriceButton,
};
