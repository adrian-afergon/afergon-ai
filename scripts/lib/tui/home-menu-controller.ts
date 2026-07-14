// @ts-nocheck
import { activateHomeSelection, moveHomeSelection } from "./navigation.js";

/**
 * Routes Home-only menu input without depending on Pi TUI.
 * Key recognition and printable-input normalization remain shell-owned.
 */
export function createHomeMenuInputController({ navigation, onNavigate, setRoute, normalizeInput, keyMatches }) {
  function handleInput(data) {
    if (navigation.route !== "home") {
      return false;
    }

    if (keyMatches.up(data) || keyMatches.down(data)) {
      Object.assign(navigation, moveHomeSelection(navigation, keyMatches.up(data) ? -1 : 1));
      onNavigate();
      return true;
    }

    if (keyMatches.enter(data)) {
      setRoute(activateHomeSelection(navigation).route);
      onNavigate();
      return true;
    }

    const shortcutRoute = { c: "configuration", s: "status", m: "model-profiles" }[normalizeInput(data)];
    if (!shortcutRoute) {
      return false;
    }

    setRoute(shortcutRoute);
    onNavigate();
    return true;
  }

  return { handleInput };
}
