import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      'src': '/src',
      'shared': '/src/shared',
      'widgets': '/src/widgets',
      'entities': '/src/entities',
      'features': '/src/features',
      'pages': '/src/pages',
      'app': '/src/app',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // превью-хост песочницы (e2b.app) должен приниматься dev-сервером
    allowedHosts: ['.e2b.app', 'localhost'],
  },
});
