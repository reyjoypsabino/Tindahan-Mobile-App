// Canonical auth lives in src/auth/AuthContext.tsx; this path keeps the
// src/context/* convention working without duplicating state.
export { AuthProvider, useAuth } from '../auth/AuthContext';
