import { banUser } from "../utils/discord.js";
import { ephemeral, ephemeralEmbed } from "./_helpers.js";

async function execute(interaction, env) {
    const options = interaction.data.options ?? [];
    const userId = options.find((option) => option.name === "user")?.value;
    const reason = options.find((option) => option.name === "reason")?.value;

    if (!userId)
        return ephemeralEmbed([
            {
                color: 0xffff00,
                description: "No user selected.",
            },
        ]);

    const resolvedUser = interaction.data.resolved?.users?.[userId];
    const displayName = resolvedUser ? resolvedUser.username : `<@${userId}>`;

    try {
        await banUser(env, interaction.guild_id, userId, { reason, deleteMessageSeconds: 604800 });

        return ephemeralEmbed([
            {
                title: `🔨 Banned ${displayName}`,
                description: reason ? `Reason: ${reason}` : "No reason provided.",
                color: 0x39ff14,
                timestamp: new Date().toISOString(),
            },
        ]);
    } catch (err) {
        console.error("[ban]", err.message);
        return ephemeralEmbed([
            {
                color: 0xff0000,
                description: `❌ Failed to ban **${displayName}**.\n${err.message}`,
            },
        ]);
    }
}

export default {
    name: "ban",
    definition: {
        description: "Ban a user from this server",
        default_member_permissions: "8",
        options: [
            {
                name: "user",
                description: "User to ban",
                type: 6,
                required: true,
            },
            {
                name: "reason",
                description: "Reason for the ban (optional)",
                type: 3,
                required: false,
            },
        ],
    },
    execute,
};
