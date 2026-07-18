const DISCORD_EPOCH = 1420070400000;
const MAX_MESSAGE_AGE = 14 * 24 * 60 * 60 * 1000;

export async function discordRequest(env, method, path, body = null, extraHeaders = {}) {
    const makeRequest = async () => {
        const res = await fetch(`${env.DISCORD_API_BASE}${path}`, {
            method,
            headers: {
                Authorization: `Bot ${env.BOT_TOKEN}`,
                "Content-Type": "application/json",
                ...extraHeaders,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (res.status === 429) {
            const rateLimit = await res.json();

            await new Promise((resolve) => setTimeout(resolve, rateLimit.retry_after * 1000));

            return makeRequest();
        }

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Discord API error ${res.status}: ${errorText}`);
        }

        if (res.status === 204) {
            return null;
        }

        return res.json();
    };

    return makeRequest();
}

export function sendMessage(env, channelId, payload) {
    return discordRequest(env, "POST", `/channels/${channelId}/messages`, payload);
}

export function registerGuildCommands(env, commands) {
    return discordRequest(
        env,
        "PUT",
        `/applications/${env.APPLICATION_ID}/guilds/${env.GUILD_ID}/commands`,
        commands,
    );
}

function getMessageTimestamp(id) {
    return Number(BigInt(id) >> 22n) + DISCORD_EPOCH;
}

export async function fetchRecentMessages(env, channelId, limit = 100) {
    const messages = await discordRequest(
        env,
        "GET",
        `/channels/${channelId}/messages?limit=${Math.min(limit, 100)}`,
    );

    const now = Date.now();

    return messages.filter((message) => {
        if (message.pinned) return false;

        return now - getMessageTimestamp(message.id) < MAX_MESSAGE_AGE;
    });
}

export async function bulkDeleteMessages(env, channelId, ids) {
    return discordRequest(env, "POST", `/channels/${channelId}/messages/bulk-delete`, {
        messages: ids,
    });
}

export async function banUser(env, guildId, userId, { reason, deleteMessageSeconds } = {}) {
    const headers = reason
        ? { "X-Audit-Log-Reason": encodeURIComponent(reason.slice(0, 512)) }
        : {};

    return discordRequest(
        env,
        "PUT",
        `/guilds/${guildId}/bans/${userId}`,
        deleteMessageSeconds ? { delete_message_seconds: deleteMessageSeconds } : {},
        headers,
    );
}
