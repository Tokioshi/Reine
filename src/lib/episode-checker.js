import { getAllAnime, updateLastEpisode } from "./db.js";
import { getAnimeStatus } from "./anilist.js";
import { sendEpisodeNotification } from "./notify.js";

export async function checkNewEpisodes(env) {
    console.log("[scheduled] Checking for new episodes...");

    const watchlist = await getAllAnime(env.DB);
    if (watchlist.length === 0) {
        console.log("[scheduled] Watchlist empty, skipping.");
        return;
    }

    for (const anime of watchlist) {
        try {
            const status = await getAnimeStatus(env, anime.anilistId);

            if (status.latestEpisode > anime.lastEpisode) {
                await sendEpisodeNotification(env, {
                    title: status.title,
                    episode: status.latestEpisode,
                    totalEpisodes: status.totalEpisodes,
                    thumbnail: status.thumbnail,
                    url: status.url,
                });

                await updateLastEpisode(env.DB, anime.anilistId, status.latestEpisode);
            }
        } catch (err) {
            console.error(`[scheduled] Error checking ${anime.title}:`, err.message);
        }
    }

    console.log("[scheduled] Done.");
}
