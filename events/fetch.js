import { handleCommandRegistration } from "../handler/commands.js";
import { handleDiscordInteraction } from "../handler/interactions.js";
import { json, notFound } from "../utils/http.js";

export function handleFetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
        return json({ ok: true, service: "reine" });
    }

    if (url.pathname === "/interactions") {
        return handleDiscordInteraction(request, env, ctx);
    }

    if (url.pathname === "/admin/register-commands") {
        return handleCommandRegistration(request, env);
    }

    return notFound();
}
