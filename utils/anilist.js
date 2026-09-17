import { sendMessage } from "./discord.js";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(env, url, options, maxRetries = 5) {
    let delay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, options);

        if (res.ok) {
            return res;
        }

        if (res.status === 429 || res.status >= 500) {
            const retryAfter = Number(res.headers.get("Retry-After"));

            if (!Number.isNaN(retryAfter) && retryAfter > 0) {
                console.warn(
                    `[anilist] Rate limited. Waiting ${retryAfter}s (attempt ${attempt}/${maxRetries})`,
                );

                await sleep(retryAfter * 1000);
            } else {
                console.warn(
                    `[anilist] HTTP ${res.status}. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
                );

                await sleep(delay);
                delay *= 2;
            }

            continue;
        }

        return res;
    }

    await sendMessage(env, "1530831591507759155", {
        embeds: [
            {
                title: "Anilist API Error",
                color: 0xff0000,
                description: `I have detect an error with the API proxy. Please check the logs.\nReferrence: Request failed after maximum retries.`,
            },
        ],
    });

    throw new Error("AniList request failed after maximum retries.");
}

export async function anilistQuery(env, query, variables = {}) {
    const res = await fetchWithRetry(env, env.ANILIST_PROXY_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${env.ANILIST_PROXY_TOKEN}`,
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    if (!res.ok) {
        const text = await res.text();

        console.error("[anilist proxy] HTTP error", res.status, text.slice(0, 500));

        await sendMessage(env, "1530831591507759155", {
            embeds: [
                {
                    title: "Anilist API Error",
                    color: 0xff0000,
                    description: `I have detect an error with the API proxy. Please check the logs.\nReferrence: A long one. Just check the log.`,
                },
            ],
        });

        throw new Error(`AniList proxy error: ${res.status}`);
    }

    const json = await res.json();

    if (json.errors?.length) {
        throw new Error(json.errors[0].message);
    }

    return json.data;
}

export async function searchAnime(env, search) {
    const data = await anilistQuery(
        env,
        `
        query ($search: String) {
            Page(perPage: 25) {
                media(
                    search: $search,
                    type: ANIME,
                    format_in: [TV, ONA, TV_SHORT]
                ) {
                    id

                    title {
                        romaji
                        english
                    }

                    status
                    seasonYear
                }
            }
        }
        `,
        {
            search,
        },
    );

    return data.Page.media;
}

function chunkArray(array, size) {
    const chunks = [];

    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }

    return chunks;
}

export async function getMultipleAnimeStatus(env, ids) {
    if (!ids.length) {
        return [];
    }

    const chunks = chunkArray(ids, 50);

    const nowSeconds = Math.floor(Date.now() / 1000);

    const results = [];

    for (const chunk of chunks) {
        const data = await anilistQuery(
            env,
            `
            query ($ids: [Int]) {
                Page(perPage: 50) {
                    media(
                        id_in: $ids,
                        type: ANIME
                    ) {

                        id

                        title {
                            romaji
                            english
                        }

                        episodes

                        status

                        coverImage {
                            large
                        }

                        siteUrl

                        airingSchedule(
                            notYetAired: false,
                            perPage: 50
                        ) {
                            nodes {
                                episode
                                airingAt
                            }
                        }
                    }
                }
            }
            `,
            {
                ids: chunk,
            },
        );

        for (const media of data.Page.media) {
            const nodes = (media.airingSchedule?.nodes ?? []).filter(
                (node) => node.airingAt <= nowSeconds,
            );

            const latestEpisode = nodes.reduce((max, node) => Math.max(max, node.episode), 0);

            results.push({
                id: media.id,

                latestEpisode,

                totalEpisodes: media.episodes ?? null,

                title: media.title.english ?? media.title.romaji,

                thumbnail: media.coverImage.large,

                url: media.siteUrl,

                status: media.status,
            });
        }
    }

    return results;
}

export async function getAnimeStatus(env, id) {
    const results = await getMultipleAnimeStatus(env, [id]);

    if (!results.length) {
        throw new Error(`Anime with ID ${id} not found.`);
    }

    return results[0];
}
