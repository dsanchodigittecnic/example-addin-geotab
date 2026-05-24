import React from 'react';
import { FeedbackProvider } from '@geotab/zenith';
import Dashboard from './components/Dashboard';

function App({ api, state }) {
  return (
    <FeedbackProvider>
      <Dashboard api={api} state={state} />
    </FeedbackProvider>
  );
}

export default App;
