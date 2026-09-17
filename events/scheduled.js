import { checkNewEpisodes } from "../utils/episode-checker.js";

export function handleScheduled(_event, env, ctx) {
    ctx.waitUntil(checkNewEpisodes(env));
}
