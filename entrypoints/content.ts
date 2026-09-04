import "../src/ui/styles.css";
import { TwitchDomAdapter } from "../src/platform/twitch-dom-adapter";
import { mountUserSelection } from "../src/features/user-selection";

export default defineContentScript({
  matches: ["https://www.twitch.tv/*"],
  runAt: "document_idle",
  main() {
    const stop = mountUserSelection(new TwitchDomAdapter(document));
    window.addEventListener("pagehide", stop, { once: true });
  }
});
