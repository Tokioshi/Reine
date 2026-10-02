import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";

function createEmbed(title, description) {
    return {
        title,
        description,
        color: config.color.default,
    };
}

const serverPriceEmbeds = {
    basic_package: createEmbed(
        "Paket Dasar (Rp10.000)",
        [
            "Paket ini cocok untuk kebutuhan server personal, komunitas kecil, atau *gaming* sederhana.",
            "* **Penataan Saluran (Channel):** Server dengan saluran teks dan suara yang telah ditata rapi.",
            "* **Integrasi Bot Dasar:** Penambahan bot sesuai permintaan dan/atau kebutuhan dasar server.",
            "* **Peran (Roles) Inti:** Konfigurasi peran yang simpel dengan fungsi inti (misalnya: anggota, *moderator*, administrator).",
        ].join("\n"),
    ),
    regular_package: createEmbed(
        "Paket Reguler (Rp15.000)",
        [
            "Paket ini cocok untuk komunitas yang lebih terorganisir dan membutuhkan tampilan serta fungsi yang lebih terperinci.",
            "* **Penataan Peran Lanjut:** Konfigurasi peran yang tertata rapih dengan pengaturan izin (*permission*) yang jelas.",
            "* **Estetika Saluran:** Tataan saluran yang rapi, sejajar, dan diberikan warna atau simbol estetika.",
            "* **Bot Fungsional:** Integrasi dan konfigurasi bot dengan fungsi yang berguna untuk mengoptimalkan interaksi server.",
        ].join("\n"),
    ),
    lite_package: createEmbed(
        "Paket Lite (Rp20.000)",
        [
            "Paket ini menawarkan automasi dasar untuk mengurangi pekerjaan administrasi server.",
            "* **Integrasi 3 Bot Utama:** Penambahan dan *setup* 3 (tiga) bot utama (misalnya: Verifikasi, *Reaction Roles*, dsb.).",
            "* **Konfigurasi Peran Mendalam:** Pengaturan peran yang lebih mendalam dan spesifik dibandingkan paket reguler.",
            "* **Izin Saluran Optimal:** Penataan saluran yang rapi disertai pengaturan izin yang sesuai dengan setiap peran.",
        ].join("\n"),
    ),
    enterprise_package: createEmbed(
        "Paket Enterprise (Rp25.000)",
        [
            "Paket lengkap untuk kebutuhan server berskala besar atau yang berorientasi publik/bisnis.",
            "* **Integrasi Bot Maksimal:** *Setup* dan integrasi bot dalam jumlah tak terbatas (*as much as you want*) ke dalam server.",
            "* **Aktivasi Komunitas:** Mengaktifkan fitur ***Community*** Discord.",
            "* **Optimasi Komunitas:** *Setup* dan konfigurasi fitur ***Community*** agar bekerja optimal (misalnya: *welcome screen*, aturan, *server insights*).",
        ].join("\n"),
    ),
    extra_notes: createEmbed(
        "Catatan Tambahan",
        [
            "* **Fitur Bertingkat:** Setiap paket level tinggi secara otomatis mencakup semua fitur dari level paket sebelumnya sebagai fitur yang dapat diminta.",
            "* **Kebutuhan Kustom:** Jika kebutuhan server Anda tidak ditemukan dalam daftar paket di atas, silakan buat tiket dan jelaskan server impian Anda untuk mendapatkan Penawaran Harga (*Quotation*) kustom.",
            "**Kontak**",
            "Untuk informasi lebih lanjut atau konsultasi gratis, silakan hubungi tim *support* kami melalui *channel* **<#1251433206914486343>** di server Discord Harmony Hub.",
            "",
            "*Informasi ini terakhir diperbarui: 8 Oktober 2025*.",
        ].join("\n"),
    ),
};

function handleServerPriceSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(serverPriceEmbeds, selectedValue)
        ? serverPriceEmbeds[selectedValue]
        : undefined;

    if (embed) return ephemeralEmbed([embed]);

    return ephemeralEmbed([
        {
            color: config.color.default,
            description: "Pilihan ini belum tersedia.",
        },
    ]);
}

export const serverPriceListComponentHandlers = {
    server_price_list: handleServerPriceSelect,
};
