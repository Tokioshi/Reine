import { removeAnime, getAllAnime, getAnime } from "../db/db.js";
import { ephemeral, autocompleteResult } from "./_helpers.js";

async function autocomplete(interaction, env) {
    const focused = (
        interaction.data.options?.find((option) => option.focused)?.value ?? ""
    ).toLowerCase();
    const watchlist = await getAllAnime(env.DB);

    const choices = watchlist
        .filter((anime) => anime.title.toLowerCase().includes(focused))
        .slice(0, 25)
        .map((anime) => ({ name: anime.title.slice(0, 100), value: String(anime.anilistId) }));

    return autocompleteResult(choices);
}

async function execute(interaction, env) {
    const anilistId = Number.parseInt(
        interaction.data.options?.find((option) => option.name === "anime")?.value,
        10,
    );

    if (Number.isNaN(anilistId)) return ephemeral("Invalid selection. Pick from the suggestions.");

    const anime = await getAnime(env.DB, anilistId);
    if (!anime) return ephemeral("That anime is not on the watchlist.");

    await removeAnime(env.DB, anilistId);
    return ephemeral(`🗑️ Removed **${anime.title}** from the watchlist.`);
}

export default {
    name: "unwatch",
    definition: {
        description: "Remove an anime from the watchlist.",
        default_member_permissions: "8",
        options: [
            {
                name: "anime",
                description: "Pick an anime from your watchlist",
                type: 3,
                required: true,
                autocomplete: true,
            },
        ],
    },
    execute,
    autocomplete,
};
