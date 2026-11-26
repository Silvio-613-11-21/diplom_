/**
 * Общая подготовка перед каждым тестовым файлом.
 *
 * Проект активно работает с DOM: виджеты вставляют разметку через
 * insertAdjacentHTML, обращаются к document.getElementById и т.п.
 * Поэтому перед каждым тестом даём чистый документ.
 */
import { beforeEach } from 'vitest';

beforeEach(() => {
    document.body.innerHTML = '';
});
