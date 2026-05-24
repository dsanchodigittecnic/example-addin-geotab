import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const ADDIN_NAME = 'addin-geotab';

geotab.addin[ADDIN_NAME] = function () {
  var root = null;

  return {
    initialize: function (api, state, callback) {
      var container = document.getElementById('root');
      root = createRoot(container);
      root.render(<App api={api} state={state} />);
      callback();
    },

    focus: function (api, state) {
      if (root) {
        root.render(<App api={api} state={state} />);
      }
    },

    blur: function () {},
  };
};
