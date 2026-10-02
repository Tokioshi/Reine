import test from "node:test";
import assert from "node:assert/strict";
import { priceListComponentHandlers } from "../components/bot-price-list.js";
import { InteractionResponseType, MessageFlags } from "../utils/constants.js";

function selectResponse(handlerId, value) {
    return priceListComponentHandlers[handlerId]({
        data: { values: [value] },
    });
}

test("price-list menu opens the selected pricing section", () => {
    const botPrice = selectResponse("bot_price_list_select", "bot_price");
    const maintenance = selectResponse("bot_price_list_select", "maintenance_price");
    const addOn = selectResponse("bot_price_list_select", "add_on");

    assert.equal(botPrice.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(botPrice.data.embeds[0].title, "Pilih Tipe Bot Discord");
    assert.equal(botPrice.data.components[0].components[0].custom_id, "bot_type");

    assert.equal(maintenance.data.flags, MessageFlags.EPHEMERAL);
    assert.deepEqual(
        maintenance.data.embeds.map(({ title }) => title),
        ["Maintenance Bulanan", "Care Basic"],
    );

    assert.equal(addOn.data.flags, MessageFlags.EPHEMERAL);
    assert.deepEqual(
        addOn.data.embeds.map(({ title }) => title),
        ["Add-on dan Tambahan Fitur", "Fitur Basic"],
    );
});

test("bot type menu opens regular or Serverless bot information", () => {
    const regularBot = selectResponse("bot_type", "normal_bot");
    const serverlessBot = selectResponse("bot_type", "serverless_bot");

    assert.equal(regularBot.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(regularBot.data.embeds[0].title, "Paket Starter Bot");
    assert.equal(serverlessBot.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(serverlessBot.data.embeds[0].title, "Discord Bot Serverless");
    assert.equal(
        serverlessBot.data.components[0].components[0].custom_id,
        "serverless_bot_pricelist",
    );
});

test("Serverless menu returns the selected information or package list", () => {
    const freeHosting = selectResponse("serverless_bot_pricelist", "free_hosting");
    const packages = selectResponse("serverless_bot_pricelist", "serverless_bot_price");

    assert.equal(freeHosting.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(freeHosting.data.embeds[0].title, "Tidak Perlu Membayar Hosting Bulanan?");
    assert.equal(packages.data.flags, MessageFlags.EPHEMERAL);
    assert.deepEqual(
        packages.data.embeds.map(({ title }) => title),
        ["Paket Discord Bot Serverless", "Serverless Starter"],
    );
});

test("pagination buttons update the selected page", () => {
    const maintenance = priceListComponentHandlers["maintenance:"]({
        data: { custom_id: "maintenance:next:2" },
    });
    const botPrice = priceListComponentHandlers["bot_price:"]({
        data: { custom_id: "bot_price:next:2" },
    });

    assert.equal(maintenance.type, InteractionResponseType.UPDATE_MESSAGE);
    assert.deepEqual(
        maintenance.data.embeds.map(({ title }) => title),
        ["Maintenance Bulanan", "Care Plus"],
    );
    assert.equal(maintenance.data.components[0].components[1].label, "2/4");

    assert.equal(botPrice.type, InteractionResponseType.UPDATE_MESSAGE);
    assert.equal(botPrice.data.embeds[0].title, "Paket Community Bot");
    assert.equal(botPrice.data.components[0].components[1].label, "2/3");
});

test("invalid pagination and menu selections return ephemeral errors", () => {
    const invalidPage = priceListComponentHandlers["bot_price:"]({
        data: { custom_id: "bot_price:next:99" },
    });
    const invalidBotType = selectResponse("bot_type", "unknown_bot");
    const unavailableOption = selectResponse("bot_price_list_select", "unknown_option");

    assert.equal(invalidPage.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(invalidPage.data.content, "Halaman paket tidak valid.");
    assert.equal(invalidBotType.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(invalidBotType.data.content, "Pilihan tipe bot tidak valid.");
    assert.equal(unavailableOption.data.flags, MessageFlags.EPHEMERAL);
    assert.equal(unavailableOption.data.embeds[0].description, "Pilihan ini belum tersedia.");
});
