import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Конфигурация тестов.
 *
 * Алиасы путей повторяют vite.config.ts - код проекта импортирует модули
 * как "src/...", "shared/...", "entities/..." и т.д.
 *
 * Окружение jsdom нужно потому, что почти весь проект работает с DOM:
 * DataSegment и CodeSegment строят таблицы через innerHTML,
 * Debugger создаёт виджеты, Registers обновляет ячейки таблицы.
 */
export default defineConfig({
    resolve: {
        alias: {
            'src': path.resolve(__dirname, 'src'),
            'shared': path.resolve(__dirname, 'src/shared'),
            'widgets': path.resolve(__dirname, 'src/widgets'),
            'entities': path.resolve(__dirname, 'src/entities'),
            'features': path.resolve(__dirname, 'src/features'),
            'pages': path.resolve(__dirname, 'src/pages'),
            'app': path.resolve(__dirname, 'src/app'),
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/**/*.test.ts'],
        setupFiles: ['./tests/setup.ts'],
        reporters: ['verbose'],
    }
});
