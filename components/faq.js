import config from "../config.js";
import { ephemeralEmbed } from "../utils/responses.js";

function createEmbed(title, description) {
    return {
        title,
        description,
        color: config.color.default,
    };
}

const faqEmbeds = {
    hosting_infrastructure: createEmbed(
        "1. Hosting dan Infrastruktur",
        "**Q: Apakah layanan pembuatan Karya Akhir (bot/aplikasi) sudah termasuk hosting?**\n**A:** Tidak. Sesuai dengan ketentuan layanan kami, pembuatan **Karya Akhir** dan hosting merupakan dua layanan yang terpisah. Layanan pembuatan hanya mencakup *development* dan *setup* awal, sedangkan hosting merupakan layanan tambahan yang harus disediakan Klien.\n\n**Q: Bagaimana cara melakukan hosting untuk Karya Akhir yang telah dibuat?**\n**A:** Kami menyediakan *channel* khusus yang menampilkan berbagai pilihan *hosting* beserta harga-harganya. Tim kami akan membantu Anda dalam proses *setup hosting* secara **gratis** sebagai bagian dari layanan purna jual.\n\n**Q: Apakah tersedia layanan hosting gratis?**\n**A:** Meskipun kami mengakui bahwa terdapat beberapa penyedia *hosting* gratis, layanan tersebut umumnya memiliki keterbatasan seperti slot terbatas, *uptime* yang tidak stabil, dan kendala teknis lainnya. Untuk performa optimal dan reliabilitas, kami sangat merekomendasikan menggunakan *hosting* berbayar.\n\n**Q: Apakah hosting yang dibeli bersifat *lifetime*?**\n**A:** Tidak. Sebagian besar penyedia *hosting* menggunakan sistem **berlangganan bulanan**. Oleh karena itu, Anda perlu melakukan pembayaran berkala setiap bulan agar **Karya Akhir** tetap aktif dan beroperasi secara kontinu.\n\n**Q: Apakah Karya Akhir dapat di-*hosting* secara mandiri?**\n**A:** Ya, Anda dapat melakukan *hosting* mandiri dengan syarat memiliki komputer atau laptop yang dapat beroperasi **24/7**. Perangkat tersebut harus tetap menyala dan terhubung internet agar **Karya Akhir** dapat berfungsi dengan baik.",
    ),
    services_development: createEmbed(
        "Layanan dan Pengerjaan",
        "**Q: Berapa lama durasi yang diperlukan untuk menyelesaikan pembuatan Karya Akhir?**\n**A:** Durasi pengerjaan bervariasi tergantung pada kompleksitas permintaan dan situasi pengerjaan. Estimasi waktu berkisar antara **1 hari** (untuk proyek sederhana) hingga maksimal **1 minggu** (untuk proyek kompleks). Waktu pengerjaan final sangat dipengaruhi oleh tingkat kesulitan fitur yang diminta dan faktor-faktor teknis lainnya.\n\n**Q: Apakah layanan mencakup revisi dan perbaikan?**\n**A:** Ya, kami menyediakan dua jenis perbaikan:\n* **Perbaikan *Bug***: Kami memberikan garansi perbaikan *bug* gratis jika *error* murni kesalahan dari *developer* dan masalah terjadi dalam periode garansi **7 (tujuh) hari kalender** setelah penyerahan (sesuai S&K Pasal 8.1).\n* **Revisi Fitur**: Revisi minor yang diminta **selama masa pengerjaan** dapat dilakukan tanpa biaya tambahan. Namun, jika revisi diminta **setelah Karya Akhir disepakati selesai** (berupa penambahan atau perubahan fitur signifikan), maka akan dikenakan biaya tambahan sesuai dengan kompleksitas perubahan.\n\n**Q: Bagaimana jika Karya Akhir mengalami *error* atau tidak berfungsi?**\n**A:** Kami akan memberikan bantuan teknis gratis jika *error* tersebut murni kesalahan dari *developer* dan masalah terjadi dalam periode garansi yang ditentukan. Namun, jika masalah terjadi karena **Klien melakukan modifikasi kode** tanpa pemahaman yang memadai atau *error* disebabkan oleh *hosting* Klien, maka layanan perbaikan akan dikenakan biaya tambahan.\n\n**Q: Apakah harga pembuatan Karya Akhir bersifat tetap?**\n**A:** Tidak. Harga yang tertera merupakan **harga dasar minimal**. Harga final akan disesuaikan jika sistem yang diminta memiliki tingkat kompleksitas tinggi atau membutuhkan fitur-fitur khusus yang memerlukan *development* tambahan. Setelah Penawaran Harga (*Quotation*) disepakati, harga tersebut bersifat final (sesuai S&K Pasal 5.2).",
    ),
    payments_costs: createEmbed(
        "Pembayaran dan Biaya",
        "**Q: Metode pembayaran apa saja yang diterima?**\n**A:** Untuk informasi lengkap mengenai metode pembayaran yang tersedia (transfer bank, *platform* pihak ketiga, dll.), silakan merujuk pada *channel* **Pembayaran** di server Discord kami untuk melihat daftar lengkap opsi pembayaran yang dapat digunakan.\n\n**Q: Kapan saya harus membayar?**\n**A:** Pembayaran dapat dilakukan setelah kedua belah pihak saling setuju bahwa bot telah selesai dibuat dan siap digunakan.",
    ),
    support_contact: createEmbed(
        "Kontak Support",
        "Jika Anda memiliki pertanyaan yang tidak tercantum dalam FAQ ini, silakan hubungi tim support kami melalui:\n\n**Discord:** Channel **<#1251433206914486343>** di server Harmony Hub\n**Response Time:** **1x24 jam** (hari kerja)\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n*FAQ ini akan diperbarui secara berkala sesuai dengan perkembangan layanan dan pertanyaan yang sering diajukan oleh klien.*\nInformasi ini terakhir diperbarui: **28 April, 2026**.",
    ),
};

function handleFaqSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(faqEmbeds, selectedValue) ? faqEmbeds[selectedValue] : undefined;

    if (embed) return ephemeralEmbed([embed]);

    return ephemeralEmbed([
        {
            color: config.color.default,
            description: "Pilihan ini belum tersedia.",
        },
    ]);
}

export const faqComponentHandlers = {
    faq_select_menu: handleFaqSelect,
};
