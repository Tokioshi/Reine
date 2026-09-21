import { checkNewEpisodes } from "../utils/episode-checker.js";
import { recoverTickets } from "../utils/tickets.js";

export function handleScheduled(_event, env, ctx) {
    ctx.waitUntil(
        Promise.allSettled([checkNewEpisodes(env), recoverTickets(env)]).then((results) => {
            for (const result of results) {
                if (result.status === "rejected") {
                    console.error("[scheduled] Task failed:", result.reason);
                }
            }
        }),
    );
}
