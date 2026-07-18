import { fetchRecentMessages, bulkDeleteMessages } from "../utils/discord.js";
import { ephemeral, ephemeralEmbed } from "./_helpers.js";

async function execute(interaction, env) {
    const option = interaction.data.options?.find((option) => option.name === "amount");

    const raw =
        typeof option?.value === "number" ? option.value : Number.parseInt(option?.value ?? 2, 10);

    const amount = Math.max(2, Math.min(raw || 2, 100));

    try {
        const messages = await fetchRecentMessages(
            env,
            interaction.channel_id,
            Math.min(amount + 30, 100),
        );

        const ids = messages.slice(0, amount).map((message) => message.id);

        if (ids.length < 2) {
            return ephemeralEmbed([
                {
                    color: 0xffff00,
                    description: "There aren't enough recent messages to bulk delete.",
                },
            ]);
        }

        await bulkDeleteMessages(env, interaction.channel_id, ids);

        return ephemeralEmbed([
            {
                color: 0x39ff14,
                description: `🧹 Deleted **${ids.length}** messages.`,
            },
        ]);
    } catch (err) {
        console.error("[clear]", err);

        return ephemeralEmbed([
            {
                color: 0xff0000,
                description: `❌ Failed to delete messages.\n${err.message}`,
            },
        ]);
    }
}

export default {
    name: "clear",
    definition: {
        description: "Bulk delete messages in this channel",
        default_member_permissions: "8",
        options: [
            {
                name: "amount",
                description: "Number of messages to delete (2-100)",
                type: 4,
                required: true,
                min_value: 2,
                max_value: 100,
            },
        ],
    },
    execute,
};
