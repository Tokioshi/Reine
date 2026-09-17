import { sendMessage } from "./discord.js";

export async function sendEpisodeNotification(
    env,
    { title, episode, totalEpisodes, thumbnail, url },
) {
    const episodeText = totalEpisodes
        ? `Episode ${episode} / ${totalEpisodes}`
        : `Episode ${episode}`;

    const embed = {
        title: `📺 New Episode — ${title}`,
        url,
        color: 0x02a9ff,
        thumbnail: { url: thumbnail },
        fields: [{ name: "Episode", value: episodeText, inline: true }],
        footer: { text: "AniList" },
        timestamp: new Date().toISOString(),
    };

    await sendMessage(env, env.NOTIFY_CHANNEL_ID, { embeds: [embed] });
}
