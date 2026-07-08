import React from 'react';
import AppRoutes from './routes/AppRoutes';

/**
 * App
 * Root component. Routing and auth are handled by providers in index.js.
 * App.js is intentionally minimal — it just renders the route tree.
 */
function App() {
  return <AppRoutes />;
}

export default App;
