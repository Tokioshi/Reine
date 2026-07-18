import { searchAnime, getAnimeStatus } from "../utils/anilist.js";
import { addAnime, getAnime } from "../db/db.js";
import { ephemeral, autocompleteResult } from "./_helpers.js";

async function autocomplete(interaction, env) {
    const focused = interaction.data.options?.find((option) => option.focused)?.value ?? "";
    if (focused.length < 2) return autocompleteResult([]);

    try {
        const results = await searchAnime(env, focused);
        const choices = results.slice(0, 25).map((anime) => {
            const title = anime.title.english ?? anime.title.romaji;
            const year = anime.seasonYear ? ` (${anime.seasonYear})` : "";
            const badge =
                anime.status === "RELEASING" ? " 🟢" : anime.status === "FINISHED" ? " ✅" : "";

            return {
                name: `${title}${year}${badge}`.slice(0, 100),
                value: String(anime.id),
            };
        });

        return autocompleteResult(choices);
    } catch (err) {
        console.error("[watch autocomplete]", err.message);
        return autocompleteResult([]);
    }
}

async function execute(interaction, env) {
    const anilistId = Number.parseInt(
        interaction.data.options?.find((option) => option.name === "anime")?.value,
        10,
    );

    if (Number.isNaN(anilistId)) return ephemeral("Invalid selection. Pick from the suggestions.");

    const existing = await getAnime(env.DB, anilistId);
    if (existing) return ephemeral(`**${existing.title}** is already on the watchlist.`);

    try {
        const status = await getAnimeStatus(env, anilistId);

        await addAnime(env.DB, anilistId, {
            title: status.title,
            thumbnail: status.thumbnail,
            url: status.url,
            lastEpisode: status.latestEpisode,
        });

        const epInfo = status.totalEpisodes
            ? `${status.latestEpisode}/${status.totalEpisodes}`
            : `${status.latestEpisode}`;

        return ephemeral(
            `✅ Added **${status.title}** to the watchlist.\nCurrently at episode **${epInfo}**. You'll be notified when a new episode airs.`,
        );
    } catch (err) {
        console.error("[watch execute]", err.message);
        return ephemeral("Failed to fetch anime info. Try again later.");
    }
}

export default {
    name: "watch",
    definition: {
        description: "Add an anime to the notification watchlist.",
        default_member_permissions: "8",
        options: [
            {
                name: "anime",
                description: "Search for an anime by title",
                type: 3,
                required: true,
                autocomplete: true,
            },
        ],
    },
    execute,
    autocomplete,
};
