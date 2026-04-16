/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from '@/views/App';
import { LogIn } from '@/views/LogIn';

function start() {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/login' element={<LogIn />} />
        <Route path='/account' element={<App />} /> {/*PLACEHOLDER*/}
      </Routes>
    </BrowserRouter>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
