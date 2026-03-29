# HH Dashboard

Веб-дашборд для визуализации данных из [hh-applicant-tool](https://github.com/s3rgeym/hh-applicant-tool).
Показывает статистику по откликам, вакансиям, работодателям и резюме.
Данные синхронизируются из локальной SQLite-базы CLI в Supabase.

> Скриншоты будут добавлены позже.

## Стек

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + JS-клиент)
- **Recharts** (графики)
- **Lucide React** (иконки)

## Требования

- Node.js 18+
- Проект в [Supabase](https://supabase.com/)
- Установленный `hh-applicant-tool` с extra `dashboard`:
  ```bash
  poetry install --extras dashboard
  ```

## Установка и запуск

### 1. Создайте проект в Supabase

Зайдите на [supabase.com](https://supabase.com/), создайте новый проект и запишите URL проекта и ключи API (anon key и service role key).

### 2. Создайте таблицы в Supabase

В SQL Editor выполните миграцию, которая создаёт следующие таблицы:

- `employers` -- работодатели
- `vacancies` -- вакансии
- `resumes` -- резюме
- `negotiations` -- отклики/переговоры
- `vacancy_contacts` -- контакты вакансий
- `employer_sites` -- сайты работодателей
- `sync_log` -- журнал синхронизации

SQL-схема находится в каталоге `supabase/` (если есть) или генерируется на основе моделей CLI.

### 3. Настройте переменные окружения дашборда

```bash
cp .env.example .env.local
```

Заполните `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Установите зависимости и запустите

```bash
npm install
npm run dev
```

Дашборд будет доступен по адресу `http://localhost:3000`.

### 5. Настройте CLI для синхронизации

Укажите Supabase-креды для CLI одним из способов:

**Переменные окружения:**

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-role-key
```

**Или в `config.json` CLI:**

```json
{
  "supabase": {
    "url": "https://your-project.supabase.co",
    "service_key": "your-service-role-key"
  }
}
```

### 6. Синхронизируйте данные

Первая синхронизация (полная):

```bash
hh-applicant-tool sync-db --full
```

Последующие запуски без `--full` будут отправлять только новые/изменённые записи.

Для предварительной проверки без отправки данных:

```bash
hh-applicant-tool sync-db --dry-run
```

## Деплой на Vercel

```bash
npm i -g vercel
vercel
```

Не забудьте добавить `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` в переменные окружения проекта на Vercel (Settings > Environment Variables).

## Страницы

| Страница       | Описание                                              |
|----------------|-------------------------------------------------------|
| Overview       | Сводная статистика и графики по откликам               |
| Negotiations   | Таблица откликов с фильтрацией по статусам             |
| Vacancies      | Список вакансий с информацией о зарплатах и статусах   |
| Employers      | Работодатели и связанные с ними вакансии               |
| Resumes        | Резюме пользователя                                    |

## Лицензия

Распространяется на тех же условиях, что и родительский проект [hh-applicant-tool](https://github.com/s3rgeym/hh-applicant-tool).
