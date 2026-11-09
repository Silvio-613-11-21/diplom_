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
    }
  },
  // разрешаем открывать dev-сервер через preview-хост песочницы
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app'],
  }
});
