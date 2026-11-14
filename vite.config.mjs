import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const pages = [
  'index', 'register', 'dashboard', 'creators', 'workspace', 'completeRoute',
  'location', 'fiction', 'cover', 'pricing', 'review',
  'create/quest', 'create/scavenger-hunt', 'create/exploration-tour',
];

export default defineConfig({
  base: './',
  oxc: { jsx: { runtime: 'automatic' } },
  build: {
    rolldownOptions: {
      input: pages.map(page => resolve(import.meta.dirname, page + '.html')),
    },
  },
});
