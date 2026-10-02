import test from "node:test";
import assert from "node:assert/strict";
import { paymentMethodComponentHandlers } from "../components/payment-method.js";
import { componentHandlers } from "../handler/commands.js";
import { MessageFlags } from "../utils/constants.js";

const cases = [
    ["gopay_transfer", "Ketentuan Pembayaran via GoPay", /GoPay Plus/],
    ["scan_qris", "Ketentuan Pembayaran via QRIS", /QRIS/],
    ["trakteer", "Ketentuan Pembayaran via Trakteer", /biaya administrasi tambahan sebesar 5%/],
    ["disclaimer", "Disclaimer", /Perlindungan Konsumen/],
];

for (const [value, title, description] of cases) {
    test(`${value} returns its payment information ephemerally`, () => {
        const response = paymentMethodComponentHandlers.payment_method_select({
            data: { values: [value] },
        });

        assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
        assert.equal(response.data.embeds[0].title, title);
        assert.match(response.data.embeds[0].description, description);
    });
}

test("payment select handler is registered with the interaction router", () => {
    assert.equal(
        componentHandlers.payment_method_select,
        paymentMethodComponentHandlers.payment_method_select,
    );
});

test("Trakteer response includes its payment link button", () => {
    const response = paymentMethodComponentHandlers.payment_method_select({
        data: { values: ["trakteer"] },
    });

    assert.equal(response.data.components[0].components[0].url, "https://trakteer.id/tokioshy");
});

test("unknown payment methods return an ephemeral fallback", () => {
    const response = paymentMethodComponentHandlers.payment_method_select({
        data: { values: ["unknown"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(
        response.data.embeds[0].description,
        "Pilihan metode pembayaran ini belum tersedia.",
    );
});
