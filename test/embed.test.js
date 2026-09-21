import assert from "node:assert/strict";
import test from "node:test";
import embedCommand from "../commands/embed.js";

const env = {
    APPLICATION_ID: "123456789012345678",
    BOT_TOKEN: "token",
    DISCORD_API_BASE: "https://discord.test/api/v10",
};

const baseInteraction = {
    guild_id: "234567890123456789",
    channel_id: "345678901234567890",
    token: "interaction-token",
    member: {
        permissions: "8",
        user: { id: "456789012345678901" },
    },
};

function modalComponents(values) {
    return Object.entries(values).map(([customId, value]) => ({
        type: 18,
        component: { type: 4, custom_id: customId, value },
    }));
}

function jsonResponse(body, status = 200) {
    return new Response(body === null ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

test("create opens an Indonesian embed modal for administrators", () => {
    const response = embedCommand.execute({
        ...baseInteraction,
        data: { options: [{ name: "opsi", value: "create" }] },
    });

    assert.equal(response.type, 9);
    assert.equal(response.data.title, "Buat Embed");
    assert.deepEqual(
        response.data.components.map((item) => item.label),
        ["Judul", "Warna (Hex)", "Deskripsi"],
    );
});

test("create sends the public embed separately and returns an ephemeral success embed", async () => {
    const requests = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
        requests.push({ url: String(url), options });
        if (options.method === "POST") {
            return jsonResponse({ id: "567890123456789012" });
        }
        return jsonResponse({ id: "response" });
    };

    try {
        await embedCommand.modalHandlers["embed:create"](
            {
                ...baseInteraction,
                data: {
                    custom_id: "embed:create",
                    components: modalComponents({
                        title: "Informasi",
                        color: "#5865F2",
                        description: "Deskripsi pengujian",
                    }),
                },
            },
            env,
        );
    } finally {
        globalThis.fetch = originalFetch;
    }

    assert.equal(requests.length, 2);
    const publicPayload = JSON.parse(requests[0].options.body);
    const statusPayload = JSON.parse(requests[1].options.body);
    assert.deepEqual(publicPayload.embeds, [
        { title: "Informasi", description: "Deskripsi pengujian", color: 0x5865f2 },
    ]);
    assert.equal(statusPayload.embeds[0].title, "Embed Berhasil Dibuat");
});

test("edit lookup verifies the bot message and exposes a user-scoped edit button", async () => {
    const requests = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
        requests.push({ url: String(url), options });
        if (options.method === "GET") {
            return jsonResponse({
                author: { id: env.APPLICATION_ID, bot: true },
                embeds: [{ title: "Lama", description: "Teks lama", color: 0x112233 }],
            });
        }
        return jsonResponse({ id: "response" });
    };

    try {
        await embedCommand.modalHandlers["embed:lookup"](
            {
                ...baseInteraction,
                data: {
                    custom_id: "embed:lookup",
                    components: modalComponents({ message_id: "567890123456789012" }),
                },
            },
            env,
        );
    } finally {
        globalThis.fetch = originalFetch;
    }

    const statusPayload = JSON.parse(requests[1].options.body);
    assert.equal(statusPayload.embeds[0].title, "Embed Ditemukan");
    assert.equal(
        statusPayload.components[0].components[0].custom_id,
        "embed:open-edit:456789012345678901:567890123456789012",
    );
});

test("edit button pre-fills the current embed and update edits the original message", async () => {
    const messageId = "567890123456789012";
    const userId = baseInteraction.member.user.id;
    const buttonId = `embed:open-edit:${userId}:${messageId}`;
    const modalId = `embed:update:${userId}:${messageId}`;
    const requests = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
        requests.push({ url: String(url), options });
        if (options.method === "GET") {
            return jsonResponse({
                author: { id: env.APPLICATION_ID, bot: true },
                embeds: [{ title: "Lama", description: "Teks lama", color: 0x112233 }],
            });
        }
        return jsonResponse({ id: "response" });
    };

    try {
        const modalResponse = await embedCommand.componentHandlers["embed:open-edit:"](
            { ...baseInteraction, data: { custom_id: buttonId } },
            env,
        );
        assert.equal(modalResponse.type, 9);
        assert.deepEqual(
            modalResponse.data.components.map((item) => item.component.value),
            ["Lama", "#112233", "Teks lama"],
        );

        await embedCommand.modalHandlers["embed:update:"](
            {
                ...baseInteraction,
                data: {
                    custom_id: modalId,
                    components: modalComponents({
                        title: "Baru",
                        color: "ABC",
                        description: "Teks baru",
                    }),
                },
            },
            env,
        );
    } finally {
        globalThis.fetch = originalFetch;
    }

    const updateRequest = requests.find(
        (request) => request.options.method === "PATCH" && request.url.includes(`/messages/${messageId}`),
    );
    assert.ok(updateRequest);
    assert.deepEqual(JSON.parse(updateRequest.options.body).embeds, [
        { title: "Baru", description: "Teks baru", color: 0xaabbcc },
    ]);
});

test("non-administrators receive an ephemeral embed denial", () => {
    const response = embedCommand.execute({
        ...baseInteraction,
        member: { ...baseInteraction.member, permissions: "0" },
        data: { options: [{ name: "opsi", value: "create" }] },
    });

    assert.equal(response.type, 4);
    assert.equal(response.data.flags, 64);
    assert.equal(response.data.embeds[0].title, "Akses Ditolak");
});
