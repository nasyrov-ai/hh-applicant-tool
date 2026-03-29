[English version](../README.md)

# hh-applicant-tool

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)

> Движок для автоматических откликов на [HeadHunter (hh.ru)](https://hh.ru) с AI-генерацией сопроводительных писем, дашбордом реального времени и архитектурой удалённого воркера. Self-hosted -- каждый пользователь разворачивает собственный экземпляр со своей базой данных.

<p align="center">
  <img src="screenshots/overview-dark.png" alt="Обзор дашборда" width="800" />
</p>

## Возможности

- **Автооклики** на вакансии по поисковому запросу с настраиваемыми фильтрами
- **AI-сопроводительные письма**, сгенерированные под конкретную вакансию через OpenAI GPT-4o или Claude, имитирующие естественный стиль письма
- **Автоответы** на сообщения работодателей с учётом контекста переписки
- **Управление резюме** -- периодическое поднятие резюме для видимости рекрутёрам, клонирование, просмотр списка
- **Дашборд реального времени** -- мониторинг откликов, управление воркером, просмотр переговоров
- **Удалённый воркер** -- фоновый процесс на VPS, управляемый через очередь команд в Supabase
- **Мастер настройки** для удобной конфигурации Supabase, переменных окружения и авторизации на hh.ru
- **Мультипрофильность** -- управление несколькими аккаунтами HH из одной установки
- **Telegram-уведомления** о ключевых событиях (опционально)
- **Поддержка прокси и cookie** для гибкой сетевой конфигурации

## Архитектура

```
Дашборд (Vercel)  --->  Supabase (PostgreSQL)  <---  Воркер (VPS / Docker)
       |                        |                           |
   Next.js-приложение     Очередь + данные            Python CLI-процесс
   React 19 UI            Авторизация, хранилище      Опрашивает очередь,
   shadcn/ui              Синхронизация в реальном     выполняет операции
                          времени
```

Каждый пользователь создаёт свой собственный проект в **Supabase** -- общего бэкенда нет. Ваши данные хранятся только в вашей базе данных.

**Дашборд** -- это Next.js-приложение, развёрнутое на Vercel (или локально). Оно записывает команды и читает состояние из Supabase. **Воркер** -- это долгоживущий Python-процесс (управляемый через systemd или Docker), который опрашивает очередь команд в Supabase, выполняет CLI-операции через API hh.ru и записывает результаты обратно. **CLI** также может использоваться автономно, без дашборда и воркера.

## Скриншоты

<details>
<summary><strong>Страницы дашборда (нажмите, чтобы развернуть)</strong></summary>

### Обзор -- KPI и график активности

| Тёмная тема | Светлая тема |
|-------------|--------------|
| ![Обзор (тёмная)](screenshots/overview-dark.png) | ![Обзор (светлая)](screenshots/overview-light.png) |

### Операции -- центр управления

| Тёмная тема | Светлая тема |
|-------------|--------------|
| ![Операции (тёмная)](screenshots/operations-dark.png) | ![Операции (светлая)](screenshots/operations-light.png) |

### Отклики -- отслеживание откликов

| Тёмная тема | Светлая тема |
|-------------|--------------|
| ![Отклики (тёмная)](screenshots/negotiations-dark.png) | ![Отклики (светлая)](screenshots/negotiations-light.png) |

### Вакансии

| Тёмная тема | Светлая тема |
|-------------|--------------|
| ![Вакансии (тёмная)](screenshots/vacancies-dark.png) | ![Вакансии (светлая)](screenshots/vacancies-light.png) |

### Логи -- журнал выполнения в реальном времени

| Тёмная тема | Светлая тема |
|-------------|--------------|
| ![Логи (тёмная)](screenshots/logs-dark.png) | ![Логи (светлая)](screenshots/logs-light.png) |

### Авторизация -- glassmorphism-дизайн

| Тёмная тема | Светлая тема |
|-------------|--------------|
| ![Авторизация (тёмная)](screenshots/login-dark.png) | ![Авторизация (светлая)](screenshots/login-light.png) |

</details>

## Технологический стек

| Компонент | Технологии |
|-----------|-----------|
| CLI | Python 3.11+, argparse, requests, SQLAlchemy |
| AI | OpenAI GPT-4o, Anthropic Claude (через CLI) |
| Дашборд | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| База данных | Supabase (PostgreSQL) для общего состояния, SQLite для локального хранилища |
| Воркер | Python, systemd / Docker |
| Деплой | Docker, docker-compose, Vercel |

## Быстрый старт

### Требования

- Python 3.11+
- Node.js 20+ (для дашборда)
- Аккаунт на [hh.ru](https://hh.ru) с доступом к API (`client_id` / `client_secret`)

### Установка

```bash
pip install hh-applicant-tool
```

Или из исходников:

```bash
git clone https://github.com/nasyrov-ai/hh-applicant-tool.git
cd hh-applicant-tool
pip install -e .
```

### Авторизация на hh.ru

```bash
hh-applicant-tool authorize
```

Откроется браузер для OAuth-аутентификации. Токен сохраняется локально.

### Настройка Supabase (для работы с дашбордом)

```bash
hh-applicant-tool setup
```

Мастер настройки запросит URL и ключи вашего проекта Supabase, после чего сгенерирует файлы `.env`. Подробные инструкции -- в разделе [Настройка Supabase](supabase-setup.md).

### Запуск дашборда

```bash
cd dashboard
npm install
npm run dev
```

Дашборд будет доступен по адресу `http://localhost:3000`.

### Использование CLI

```bash
# Показать все доступные команды
hh-applicant-tool --help

# Автооклики на вакансии по поисковому запросу с AI-сопроводительными
hh-applicant-tool apply-vacancies --search "Python developer" --use-ai

# Ответить на сообщения работодателей с помощью AI
hh-applicant-tool reply-employers --use-ai

# Поднять резюме, чтобы оставаться на виду у рекрутёров
hh-applicant-tool update-resumes

# Показать список резюме
hh-applicant-tool list-resumes

# Показать информацию о текущем пользователе
hh-applicant-tool whoami
```

## Руководство по self-hosting

Полная установка включает три компонента. Следуйте инструкциям по порядку:

1. **[Настройка Supabase](supabase-setup.md)** -- создание базы данных и запуск миграции схемы
2. **[Деплой дашборда](dashboard-deploy.md)** -- развёртывание Next.js-дашборда (Vercel, локально или Docker)
3. **[Деплой воркера](worker-deploy.md)** -- запуск воркера на VPS или в Docker

## Docker

```bash
# Скопировать и настроить переменные окружения
cp .env.example .env

# Запустить воркер (режим управления через дашборд)
docker-compose --profile worker up -d

# Или запустить в режиме cron (устаревший)
docker-compose --profile cron up -d
```

## Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `SUPABASE_URL` | Да (воркер) | URL проекта Supabase |
| `SUPABASE_SERVICE_KEY` | Да (воркер) | Service role ключ Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Да (дашборд) | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Да (дашборд) | Публичный anon-ключ Supabase |
| `DASHBOARD_SECRET` | Да (дашборд) | Пароль для авторизации в дашборде |
| `HH_PROFILE_ID` | Нет | Имя подкаталога профиля для мультиаккаунтных установок |
| `TG_BOT_TOKEN` | Нет | Токен Telegram-бота для уведомлений |
| `TG_CHAT_ID` | Нет | ID чата Telegram для уведомлений |
| `CONFIG_DIR` | Нет | Пользовательская директория конфигурации (по умолчанию: `~/.config/hh-applicant-tool`) |

Полный шаблон -- в файле [`.env.example`](../.env.example).

## Документация

- [Настройка Supabase](supabase-setup.md) -- конфигурация базы данных и миграция схемы
- [Деплой дашборда](dashboard-deploy.md) -- развёртывание через Vercel, локально и в Docker
- [Деплой воркера](worker-deploy.md) -- systemd, Docker и скрипт развёртывания

## Структура проекта

```
hh-applicant-tool/
  src/hh_applicant_tool/
    main.py              # Точка входа CLI
    operations/          # CLI-команды (отклики, ответы, авторизация и т.д.)
    ai/                  # AI-провайдеры (OpenAI, Claude)
    api/                 # Клиент API hh.ru
    storage/             # Слой хранения SQLite
    worker.py            # Процесс удалённого воркера
    utils/               # Общие утилиты
  dashboard/             # Next.js-приложение дашборда
  deploy/                # Конфигурации деплоя (systemd, скрипт развёртывания)
  docs/                  # Документация
  docker-compose.yml     # Docker-сервисы
  pyproject.toml         # Конфигурация Python-проекта
```

## Лицензия

MIT
