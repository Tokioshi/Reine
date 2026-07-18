import { fetchRecentMessages, bulkDeleteMessages } from "../utils/discord.js";
import { ephemeral } from "./_helpers.js";

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
            return ephemeral("There aren't enough recent messages to bulk delete.");
        }

        await bulkDeleteMessages(env, interaction.channel_id, ids);

        if (ids.length < amount) {
            return ephemeral(
                `🧹 Deleted **${ids.length}** messages.\nSome messages were skipped because they were pinned or older than 14 days.`,
            );
        }

        return ephemeral(`🧹 Deleted **${ids.length}** messages.`);
    } catch (err) {
        console.error("[clear]", err);

        return ephemeral(`❌ Failed to delete messages.\n${err.message}`);
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
