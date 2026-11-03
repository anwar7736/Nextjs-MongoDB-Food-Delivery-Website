function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function verifyAuthSession(token) {
  try {
    const [payload, signature, extra] = token.split(".");
    const configuredKey = process.env.TOTP_ENCRYPTION_KEY;
    if (!payload || !signature || extra || !configuredKey || configuredKey.length < 32) return null;

    const keyMaterial = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(configuredKey));
    const key = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(signature),
      new TextEncoder().encode(`session.${payload}`)
    );
    if (!valid) return null;

    const contents = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (!["user", "restaurant", "delivery"].includes(contents.type)) return null;
    if (typeof contents.id !== "string" || contents.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return { type: contents.type, id: contents.id };
  } catch {
    return null;
  }
}
