import { JsonHeaders } from "./constants.js";

export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: JsonHeaders,
    });
}

export function notFound() {
    return json({ error: "Couldn't find anything." }, 404);
}

export function methodNotAllowed() {
    return json({ error: "What are you doing here? You won't find anything." }, 405);
}
