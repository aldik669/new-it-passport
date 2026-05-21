# Kursor IT Passport (Static Landing)

Статический лендинг-диагностика для школы Kursor. Открывается через `index.html`.

## Запуск

Самый простой способ — открыть `index.html` в браузере.

Для корректной работы всех путей к ассетам рекомендуется локальный сервер:

```bash
python3 -m http.server 8080
```

Откройте: `http://localhost:8080`

## Flow

1. Welcome / Hero
2. Registration (возраст: 5–7, 8–12, 13+)
3. 7 возрастных вопросов
4. Memory Blocks
5. Поймай цвет
6. Собери маршрут
7. Result (с blur-аналитикой)
8. Admin: `#admin` (пароль: `kursor2026`)

## Хранение данных

MVP использует `localStorage`.  
Для production подключите Supabase или Google Sheets.

## Структура

- `index.html` — разметка
- `css/style.css` — стили Kursor
- `js/questions.js` — вопросы по возрасту
- `js/scoring.js` — подсчет профилей
- `js/games.js` — мини-игры
- `js/admin.js` — админка
- `js/app.js` — orchestration flow
- `assets/` — изображения бренда
