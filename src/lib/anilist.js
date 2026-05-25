const ANILIST_API = "https://graphql.anilist.co";

export async function anilistQuery(query, variables = {}) {
    const res = await fetch(ANILIST_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "ReineDiscordBot/2.0 (+https://discord.com)",
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("[anilist] HTTP error", res.status, text.slice(0, 500));
        throw new Error(`AniList error: ${res.status}`);
    }

    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);

    return json.data;
}

export async function searchAnime(search) {
    const data = await anilistQuery(
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

export async function getAnimeStatus(id) {
    const data = await anilistQuery(
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
