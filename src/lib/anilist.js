export async function anilistQuery(env, query, variables = {}) {
    const res = await fetch(env.ANILIST_PROXY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${env.ANILIST_PROXY_TOKEN}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("[anilist proxy] HTTP error", res.status, text.slice(0, 500));
        throw new Error(`AniList proxy error: ${res.status}`);
    }

    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);

    return json.data;
}

export async function searchAnime(env, search) {
    const data = await anilistQuery(
        env,
        `query ($search: String) {
            Page(perPage: 25) {
                media(search: $search, type: ANIME, format_in: [TV, ONA]) {
                    id
                    title { romaji english }
                    status
                    seasonYear
                }
            }
        }`,
        { search },
    );

    return data.Page.media;
}

export async function getAnimeStatus(env, id) {
    const data = await anilistQuery(
        env,
        `query ($id: Int) {
            Media(id: $id, type: ANIME) {
                    id
                    title { romaji english }
                    episodes
                    status
                    coverImage { large }
                    siteUrl
                    airingSchedule(notYetAired: false, perPage: 50) {
                    nodes { episode airingAt }
                }
            }
        }`,
        { id },
    );

    const media = data.Media;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const nodes = (media.airingSchedule?.nodes ?? []).filter((node) => node.airingAt <= nowSeconds);
    const latestEpisode = nodes.reduce((max, node) => Math.max(max, node.episode), 0);

    return {
        latestEpisode,
        totalEpisodes: media.episodes ?? null,
        title: media.title.english ?? media.title.romaji,
        thumbnail: media.coverImage.large,
        url: media.siteUrl,
        status: media.status,
    };
}
