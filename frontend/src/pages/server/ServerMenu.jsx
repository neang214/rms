// The ordering flow (menu browsing, cart, table selection, submit) is
// identical for server and cashier — same backend calls, same UI. Rather
// than duplicate CashierMenu.jsx, this re-exports it under the server
// route. Route-level ProtectedRoute (see App.jsx) is what actually
// restricts who can reach it; this file exists only so the page lives at
// a path matching the server role, consistent with the other role folders.
export { default } from "../cashier/CashierMenu"
