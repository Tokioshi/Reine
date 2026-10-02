import test from "node:test";
import assert from "node:assert/strict";
import { componentHandlers, findInteractionHandler } from "../handler/commands.js";
import { MessageFlags } from "../utils/constants.js";

const packageChoices = [
    ["basic_package", "Paket Dasar (Rp10.000)"],
    ["regular_package", "Paket Reguler (Rp15.000)"],
    ["lite_package", "Paket Lite (Rp20.000)"],
    ["enterprise_package", "Paket Enterprise (Rp25.000)"],
];

test("each server package selection returns only its matching ephemeral embed", () => {
    const handler = findInteractionHandler(componentHandlers, "server_price_list");
    assert.equal(typeof handler, "function");

    for (const [value, heading] of packageChoices) {
        const response = handler({ data: { values: [value] } });
        const embed = response.data.embeds[0];

        assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
        assert.equal(response.data.embeds.length, 1);
        assert.equal(embed.title, heading);
        assert.doesNotMatch(embed.description, /###|📦/);

        for (const [, otherHeading] of packageChoices) {
            if (otherHeading !== heading) assert.ok(!embed.description.includes(otherHeading));
        }
    }
});

test("extra notes selection returns the notes and support contact", () => {
    const response = componentHandlers.server_price_list({
        data: { values: ["extra_notes"] },
    });
    const description = response.data.embeds[0].description;

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds.length, 1);
    assert.equal(response.data.embeds[0].title, "Catatan Tambahan");
    assert.doesNotMatch(description, /###|📦/);
    assert.match(description, /\*\*Kontak\*\*/);
    assert.match(description, /1251433206914486343/);
});

test("unknown server package selection returns the unavailable message", () => {
    const response = componentHandlers.server_price_list({
        data: { values: ["unknown_package"] },
    });

    assert.equal(response.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(response.data.embeds[0].description, "Pilihan ini belum tersedia.");
});
