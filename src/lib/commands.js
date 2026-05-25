import { searchAnime, getAnimeStatus } from "./anilist.js";
import { addAnime, removeAnime, getAllAnime, getAnime } from "./db.js";
import { InteractionResponseType, MessageFlags } from "./constants.js";

function ephemeral(content) {
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content, flags: MessageFlags.EPHEMERAL },
    };
}

function ephemeralEmbed(embeds) {
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { embeds, flags: MessageFlags.EPHEMERAL },
    };
}

function autocompleteResult(choices) {
    return {
        type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices },
    };
}

async function watchAutocomplete(interaction, env) {
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

async function watchExecute(interaction, env) {
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

async function unwatchAutocomplete(interaction, env) {
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

async function unwatchExecute(interaction, env) {
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

async function listExecute(_interaction, env) {
    const watchlist = await getAllAnime(env.DB);

    if (watchlist.length === 0) {
        return ephemeral("The watchlist is empty. Use `/watch` to add an anime.");
    }

    const lines = watchlist.map((anime, index) => {
        const ep = anime.lastEpisode > 0 ? ` — last seen ep ${anime.lastEpisode}` : "";
        return `**${index + 1}.** [${anime.title}](${anime.url})${ep}`;
    });

    return ephemeralEmbed([
        {
            title: "📋 Anime Watchlist",
            description: lines.join("\n"),
            color: 0x02a9ff,
            footer: { text: `${watchlist.length} anime tracked` },
            timestamp: new Date().toISOString(),
        },
    ]);
}

export const COMMANDS = {
    watch: { execute: watchExecute, autocomplete: watchAutocomplete },
    unwatch: { execute: unwatchExecute, autocomplete: unwatchAutocomplete },
    list: { execute: listExecute },
};
