import { getAllAnime, updateLastEpisode } from "../db/db.js";
import { getMultipleAnimeStatus } from "./anilist.js";
import { sendEpisodeNotification } from "./notify.js";

export async function checkNewEpisodes(env) {
    console.log("[scheduled] Checking for new episodes...");

    const watchlist = await getAllAnime(env.DB);

    if (watchlist.length === 0) {
        console.log("[scheduled] Watchlist empty, skipping.");
        return;
    }

    const ids = watchlist.map((anime) => anime.anilistId);

    let statuses;

    try {
        statuses = await getMultipleAnimeStatus(env, ids);
    } catch (err) {
        console.error("[scheduled] Failed to fetch AniList data:", err.message);
        return;
    }

    const statusMap = new Map(statuses.map((status) => [status.id, status]));

    let checked = 0;
    let updated = 0;

    for (const anime of watchlist) {
        checked++;

        const status = statusMap.get(anime.anilistId);

        if (!status) {
            console.warn(
                `[scheduled] Anime not found on AniList: ${anime.title} (${anime.anilistId})`,
            );
            continue;
        }

        try {
            if (status.latestEpisode > anime.lastEpisode) {
                console.log(
                    `[scheduled] New episode detected: ${status.title} (${anime.lastEpisode} → ${status.latestEpisode})`,
                );

                await sendEpisodeNotification(env, {
                    title: status.title,
                    episode: status.latestEpisode,
                    totalEpisodes: status.totalEpisodes,
                    thumbnail: status.thumbnail,
                    url: status.url,
                });

                await updateLastEpisode(env.DB, anime.anilistId, status.latestEpisode);

                updated++;
            }
        } catch (err) {
            console.error(`[scheduled] Error processing ${anime.title}:`, err.message);
        }
    }

    console.log(`[scheduled] Done. Checked ${checked} anime. Updated ${updated}.`);
}
