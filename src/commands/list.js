import { getAllAnime } from "../db/db.js";
import { ephemeral, ephemeralEmbed } from "./_helpers.js";

async function execute(_interaction, env) {
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

export default {
    name: "list",
    definition: {
        description: "Show all anime currently on the watchlist.",
    },
    execute,
};
