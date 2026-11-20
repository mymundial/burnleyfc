// Firebase's email-link handler can carry the action parameters in the main
// URL or in a nested `link`/`continueUrl` parameter. The email itself is never
// taken from the URL: the player must enter it before consuming the code.
export function readRecoveryLink(href) {
  try {
    let url = new URL(href);
    let username = "";
    for (let step = 0; step < 4; step++) {
      if (!username) username = (url.searchParams.get("recoveryUsername") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
      const mode = url.searchParams.get("mode");
      const code = url.searchParams.get("oobCode");
      if (code && (!mode || mode.toLowerCase() === "signin")) return { oobCode: code, username };
      const nested = url.searchParams.get("link") || url.searchParams.get("deep_link_id") || url.searchParams.get("continueUrl");
      if (!nested) break;
      url = new URL(nested);
    }
  } catch { /* Invalid or missing deep link. */ }
  return null;
}
