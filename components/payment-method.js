import config from "../config.js";
import { ButtonStyle, ComponentType } from "../utils/constants.js";
import { ephemeralEmbed } from "../utils/responses.js";

function createEmbed(title, description) {
    return {
        title,
        description,
        color: config.color.default,
    };
}

const paymentMethodEmbeds = {
    gopay_transfer: createEmbed(
        "Ketentuan Pembayaran via GoPay",
        "Untuk pembayaran menggunakan GoPay, pastikan akun GoPay Anda sudah ditingkatkan (*upgrade*) ke GoPay Plus, atau Anda dapat memilih untuk mentransfer langsung dari rekening bank milik Anda. Harap diperhatikan bahwa biaya administrasi atau biaya transfer antarbank (jika ada) ditanggung sepenuhnya oleh Client.\n\n### Panduan Pembayaran via GoPay\n\n1. Buka aplikasi **GoPay** atau aplikasi bank yang Anda gunakan.\n2. Silakan minta nomor tujuan pembayaran di **channel tiket**. Tim kami akan memberikan nomor telepon/akun GoPay tujuan di sana.\n3. Pilih menu **Transfer**, lalu masukkan nomor telepon GoPay tujuan yang telah diberikan.\n4. Masukkan nominal pembayaran sesuai dengan total tagihan yang telah disepakati.\n5. Periksa kembali nama penerima dan nominal transaksi, lalu selesaikan pembayaran.\n6. Ambil tangkapan layar (*screenshot*) bukti transfer, lalu kirimkan ke **channel tiket** untuk verifikasi dan konfirmasi.",
    ),
    scan_qris: createEmbed(
        "Ketentuan Pembayaran via QRIS",
        "Pembayaran menggunakan QRIS mendukung berbagai aplikasi *e-wallet* (GoPay, OVO, DANA, ShopeePay, LinkAja) serta aplikasi *m-banking*. Harap diperhatikan bahwa biaya administrasi atau biaya layanan (jika ada dari platform/aplikasi) ditanggung sepenuhnya oleh Client.\n\n### Panduan Pembayaran via QRIS\n\n1. Buka aplikasi *e-wallet* atau *m-banking* yang Anda gunakan.\n2. Silakan minta kode QRIS pembayaran di **channel tiket**. Tim kami akan mengirimkan gambar kode QRIS di sana.\n3. Pilih fitur **Pindai / Scan QRIS** pada aplikasi Anda, lalu arahkan kamera ke kode QRIS yang diberikan (atau unggah gambar QRIS dari galeri HP Anda).\n4. Masukkan nominal pembayaran sesuai dengan total tagihan yang telah disepakati.\n5. Periksa kembali nama penerima dan nominal transaksi, lalu selesaikan pembayaran.\n6. Ambil tangkapan layar (*screenshot*) bukti transfer berhasil, lalu kirimkan ke **channel tiket** untuk verifikasi dan konfirmasi.",
    ),
    trakteer: createEmbed(
        "Ketentuan Pembayaran via Trakteer",
        "Metode pembayaran melalui Trakteer dikenakan biaya administrasi tambahan sebesar 5% sesuai dengan ketentuan platform. Biaya administrasi ini ditanggung sepenuhnya oleh Client agar nominal bersih yang kami terima tetap sesuai dengan kesepakatan. Mohon maaf atas ketidaknyamanannya, dan terima kasih atas pengertian Anda. Jika berkeberatan, Anda dapat memilih alternatif metode pembayaran lainnya.\n\n### Panduan Pembayaran via Trakteer\n\n1. Akses tautan berikut: https://trakteer.id/tokioshy atau klik tombol di bawah ini.\n3. Masukkan jumlah unit sesuai nominal tagihan Anda.\n4. Tambahkan biaya administrasi sebesar 5% dari total nominal (dapat dibulatkan ke atas).\n5. Klik **Lanjutkan Pembayaran**.\n6. Pilih metode pembayaran yang Anda inginkan.\n7. Selesaikan pembayaran sebelum batas waktu berakhir.\n8. Ambil tangkapan layar (*screenshot*) bukti pembayaran dan kirimkan kepada kami untuk proses konfirmasi.",
    ),
    disclaimer: createEmbed(
        "Disclaimer",
        "**Ketentuan Umum:**\n* Harmony Hub tidak bertanggung jawab atas kesalahan transaksi yang disebabkan oleh kelalaian pengguna.\n* Pengguna wajib memverifikasi semua informasi sebelum melakukan pembayaran.\n* Semua transaksi bersifat final setelah konfirmasi dari kedua belah pihak.\n* Pengembalian dana mengikuti kebijakan yang tercantum dalam syarat dan ketentuan.\n* Pembayaran dilakukan dengan cara DP 50%, atau full di akhir jika projek kecil.\n\n**Perlindungan Konsumen:**\n* Setiap transaksi memiliki bukti digital yang dapat dilacak.\n* Support team siap membantu menyelesaikan masalah pembayaran.\n* Prosedur penyelesaian sengketa yang jelas dan transparan.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n*Dokumen ini merupakan bagian dari ketentuan layanan Harmony Hub dan dapat berubah sewaktu-waktu sesuai kebijakan Harmony Hub. Terakhir diperbarui: [09/09/25].*",
    ),
};

function handlePaymentMethodSelect(interaction) {
    const selectedValue = interaction.data?.values?.[0];
    const embed = Object.hasOwn(paymentMethodEmbeds, selectedValue)
        ? paymentMethodEmbeds[selectedValue]
        : undefined;

    if (!embed) {
        return ephemeralEmbed([
            {
                color: config.color.default,
                description: "Pilihan metode pembayaran ini belum tersedia.",
            },
        ]);
    }

    const components =
        selectedValue === "trakteer"
            ? [
                  {
                      type: ComponentType.ACTION_ROW,
                      components: [
                          {
                              type: ComponentType.BUTTON,
                              style: ButtonStyle.LINK,
                              label: "Buka Trakteer",
                              url: "https://trakteer.id/tokioshy",
                          },
                      ],
                  },
              ]
            : undefined;

    return ephemeralEmbed([embed], components);
}

export const paymentMethodComponentHandlers = {
    payment_method_select: handlePaymentMethodSelect,
};
