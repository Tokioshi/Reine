export async function discordRequest(env, method, path, body = null) {
    const res = await fetch(`${env.DISCORD_API_BASE}${path}`, {
        method,
        headers: {
            Authorization: `Bot ${env.BOT_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Discord API error ${res.status}: ${errorText}`);
    }

    if (res.status === 204) return null;
    return res.json();
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
