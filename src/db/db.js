export async function addAnime(db, anilistId, meta) {
    await db
        .prepare(
            `INSERT INTO anime_watchlist (anilist_id, title, thumbnail, url, last_episode, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(anilist_id) DO UPDATE SET
            title = excluded.title,
            thumbnail = excluded.thumbnail,
            url = excluded.url,
            last_episode = excluded.last_episode,
            updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(anilistId, meta.title, meta.thumbnail, meta.url, meta.lastEpisode ?? 0)
        .run();
}

export async function removeAnime(db, anilistId) {
    await db.prepare("DELETE FROM anime_watchlist WHERE anilist_id = ?").bind(anilistId).run();
}

export async function getAllAnime(db) {
    const { results } = await db
        .prepare(
            `SELECT
                anilist_id AS anilistId,
                title,
                thumbnail,
                url,
                last_episode AS lastEpisode
            FROM anime_watchlist
            ORDER BY title COLLATE NOCASE ASC`,
        )
        .all();

    return results ?? [];
}

export async function getAnime(db, anilistId) {
    return db
        .prepare(
            `SELECT
                anilist_id AS anilistId,
                title,
                thumbnail,
                url,
                last_episode AS lastEpisode
            FROM anime_watchlist
            WHERE anilist_id = ?`,
        )
        .bind(anilistId)
        .first();
}

export async function updateLastEpisode(db, anilistId, episode) {
    await db
        .prepare(
            `UPDATE anime_watchlist
            SET last_episode = ?, updated_at = CURRENT_TIMESTAMP
            WHERE anilist_id = ?`,
        )
        .bind(episode, anilistId)
        .run();
}
