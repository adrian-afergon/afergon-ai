export const TUI_ROUTES = Object.freeze(["home", "configuration", "status", "model-profiles"]);

function assertRoute(route) {
  if (!TUI_ROUTES.includes(route)) {
    throw new Error(`Unsupported TUI route: ${route}`);
  }
}

export function createNavigationState(initialRoute = "home") {
  assertRoute(initialRoute);

  return {
    route: initialRoute,
    routes: [...TUI_ROUTES],
  };
}

export function navigateTo(state, route) {
  assertRoute(route);

  return {
    ...state,
    route,
  };
}
