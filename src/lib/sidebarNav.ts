// Centralized sidebar tab → route mapping.
// Tabs that don't have a dedicated route are rendered inside Index via state.
export const ROUTE_MAP: Record<string, string> = {
  dashboard: "/",
  pos: "/pos",
  suppliers: "/suppliers",
  expenses: "/expenses",
  customers: "/customers",
  settings: "/settings",
  reports: "/monthly-report",
  expiry: "/expiry",
};

// Tab IDs that are rendered as in-page tabs on Index ("/")
const INDEX_TABS = new Set(["inventory", "sales", "stock-intake", "attendance", "users"]);

export function navigateForTab(
  tab: string,
  navigate: (path: string, opts?: { state?: unknown }) => void
) {
  if (ROUTE_MAP[tab]) {
    navigate(ROUTE_MAP[tab]);
    return;
  }
  if (INDEX_TABS.has(tab)) {
    navigate("/", { state: { activeTab: tab } });
    return;
  }
  navigate("/");
}
