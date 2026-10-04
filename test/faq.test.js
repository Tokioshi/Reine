import test from "node:test";
import assert from "node:assert/strict";
import { faqComponentHandlers } from "../components/faq.js";
import { MessageFlags } from "../utils/constants.js";

test("hosting FAQ replies with an ephemeral embed", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["hosting_infrastructure"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Hosting dan Infrastruktur");
    assert.match(response.data.embeds[0].description, /Apakah layanan pembuatan Karya Akhir/);
});

test("services FAQ replies with its development information", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["services_development"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Layanan dan Pengerjaan");
    assert.match(response.data.embeds[0].description, /maksimal \*\*1 minggu\*\*/);
});

test("payments FAQ replies with its payment information", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["payments_costs"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Pembayaran dan Biaya");
    assert.match(response.data.embeds[0].description, /Kapan saya harus membayar/);
});

test("support FAQ replies with its contact information", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["support_contact"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].title, "Kontak Support");
    assert.match(response.data.embeds[0].description, /1251433206914486343/);
});

test("unavailable FAQ categories return the fallback embed", () => {
    const response = faqComponentHandlers.faq_select_menu({
        data: { values: ["unknown_category"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].description, "Pilihan ini belum tersedia.");
});
