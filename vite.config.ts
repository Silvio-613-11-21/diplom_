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
  }
});