import nacl from "tweetnacl";

function hexToUint8Array(hex) {
    if (!hex || hex.length % 2 !== 0) return null;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i += 1) {
        const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        if (Number.isNaN(byte)) return null;
        bytes[i] = byte;
    }
    return bytes;
}

export async function readAndVerifyDiscordRequest(request, publicKey) {
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
        return { ok: false, status: 401, error: "Missing Discord signature headers" };
    }

    const rawBody = await request.text();
    const message = new TextEncoder().encode(timestamp + rawBody);
    const signatureBytes = hexToUint8Array(signature);
    const publicKeyBytes = hexToUint8Array(publicKey);

    if (!signatureBytes || !publicKeyBytes) {
        return { ok: false, status: 401, error: "Invalid signature encoding" };
    }

    const valid = nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
    if (!valid) {
        return { ok: false, status: 401, error: "Invalid request signature" };
    }

    try {
        return { ok: true, interaction: JSON.parse(rawBody) };
    } catch {
        return { ok: false, status: 400, error: "Invalid JSON body" };
    }
}
