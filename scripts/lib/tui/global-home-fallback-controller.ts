/**
 * Routes the shell-owned Home shortcut after route-specific controllers decline it.
 * Input normalization remains shell-owned so Pi TUI stays the runtime authority.
 */
// @ts-nocheck
export function createGlobalHomeFallbackController({ navigation, onNavigate, setRoute, normalizeInput }) {
  function handleInput(data) {
    if (navigation.route === "home" || normalizeInput(data) !== "h") {
      return false;
    }

    setRoute("home");
    onNavigate();
    return true;
  }

  return { handleInput };
}
