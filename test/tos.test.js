import test from "node:test";
import assert from "node:assert/strict";
import { componentHandlers } from "../handler/commands.js";
import { tosComponentHandlers } from "../components/tos.js";
import { MessageFlags } from "../utils/constants.js";

const expectedSections = {
    service_information: "Informasi Penyedia Layanan",
    definition_and_service: "Definisi Istilah Kunci dan Layanan",
    tos_service: "Ketentuan Penggunaan Layanan",
    haki_terms: "Hak Kekayaan Intelektual",
    payment_terms: "Ketentuan Pembayaran",
    work_time: "Waktu Pengerjaan dan Penyerahan",
    cancellation_terms: "Kebijakan Pembatalan dan Kompensasi",
    support_maintenance: "Dukungan dan Perawatan",
    dispute_resolution: "Penyelesaian Sengketa",
    tos_changes: "Perubahan Syarat dan Ketentuan",
    official_contact: "Kontak dan Dukungan Resmi",
    closing: "Penutup",
};

test("ToS select handler replies with an ephemeral embed for every section", () => {
    for (const [value] of Object.entries(expectedSections)) {
        const response = tosComponentHandlers.tos_select_menu({
            data: { values: [value] },
        });

        assert.equal(response.data.flags, MessageFlags.EPHEMERAL, value);
        assert.ok(response.data.embeds[0].description.length > 0, value);
    }
});

test("ToS select handler is registered in the interaction router", () => {
    assert.equal(componentHandlers.tos_select_menu, tosComponentHandlers.tos_select_menu);
});

test("unknown ToS sections return the unavailable fallback embed", () => {
    const response = tosComponentHandlers.tos_select_menu({
        data: { values: ["unknown_section"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].description, "Pilihan ini belum tersedia.");
});
