#!/bin/bash

# Переходим в папку, где находится скрипт, если необходимо
cd "$(dirname "$0")"

# Обновляем зависимости для основного проекта
echo "Обновление зависимостей для основного проекта..."
npm update

# Переходим в папку бэкенда и обновляем зависимости
echo "Обновление зависимостей для бэкенда..."
cd backend
npm update

# Возвращаемся в корневую папку проекта
cd ..

# Перезапускаем приложения через PM2
echo "Перезапуск приложений через PM2..."
npx pm2 restart ecosystem.config.js

# Выводим статус запущенных приложений
npx pm2 status
