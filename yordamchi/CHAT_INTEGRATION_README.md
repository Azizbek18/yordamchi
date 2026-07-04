# Chat Integration — Topshiriq.uz

## 🎯 Что исправлено в этой версии

Главная проблема предыдущей версии: RLS-политики использовали `auth.uid()`, но в вашем проекте `profiles.id` **не** равен `auth.uid()` — id генерируется на клиенте через `crypto.randomUUID()` в `register.js`, а логин идёт через прямой SELECT из `profiles` по email+password. Поэтому `auth.uid()` всегда `NULL`, и RLS блокировал всё на свете.

**Что сделано в этой версии:**
1. ✅ RLS **отключён** (как уже сделано для таблицы `tasks`) — фильтрация по `currentUser.id` идёт в JS
2. ✅ Все политики `auth.uid()` удалены
3. ✅ Хранимая функция `get_or_create_conversation` переписана — теперь принимает `p_current_user_id` как параметр, а не берёт из `auth.uid()`
4. ✅ В `auth.js` добавлена глобальная функция `openChatWith(otherUserId, taskId)` — можно вызывать с любой страницы для создания/открытия чата
5. ✅ В `chatlar.js` добавлена обработка `sessionStorage.openConversationId` — при переходе с другой страницы автоматически открывается нужный диалог
6. ✅ Скрипт теперь **идемпотентный** — корректно удаляет старые таблицы и политики перед созданием новых

## 📦 Что в файле

В обновлённом проекте `yordamchi.zip` изменены 3 файла:

| Файл | Что изменилось |
|------|----------------|
| `chat_schema.sql` | **Новый файл** — schema для `conversations` + `messages` (RLS отключён) |
| `chatlar.html` | Убраны захардкоженные демо-чаты, добавлены динамические контейнеры с loading/empty states, баннер задачи теперь скрывается когда чата нет |
| `chatlar.js` | Полностью переписан — интеграция с Supabase: загрузка, отправка, Realtime, пометка прочитанным, поиск |
| `auth.js` | Добавлена функция `openChatWith(otherUserId, taskId)` для создания/открытия чата с любой страницы |

Остальные файлы в проекте **не тронуты**.

## 🚀 Пошаговая установка

### Шаг 1. Запустить SQL-схему в Supabase

1. Откройте проект в Supabase Dashboard → `Ak1_ro`
2. Перейдите в **SQL Editor** → **New query**
3. Скопируйте содержимое **`chat_schema.sql`** и нажмите **Run**

Скрипт:
- удалит существующие таблицы `conversations` и `messages` (если были) через `DROP TABLE ... CASCADE`
- создаст их заново с правильной структурой
- создаст view `v_conversations_preview`
- создаст триггер `trg_touch_conversation` (автообновление `updated_at`)
- **отключит RLS** (как у вас уже сделано для `tasks`)
- добавит таблицы в публикацию `supabase_realtime`
- создаст функцию `get_or_create_conversation(p_current_user_id, p_other_user_id, p_task_id)`

### Шаг 2. Включить Realtime (если SQL не смог)

1. Supabase Dashboard → **Database** → **Replication**
2. В секции **supabase_realtime** поставьте галочки напротив таблиц `messages` и `conversations`

### Шаг 3. Заменить файлы в проекте

Распакуйте новый `yordamchi.zip` поверх вашего текущего проекта (или просто скопируйте 4 изменённых файла: `chat_schema.sql`, `chatlar.html`, `chatlar.js`, `auth.js`).

### Шаг 4. Создать тестовый диалог

Откройте Supabase SQL Editor и выполните:

```sql
-- Найти двух любых пользователей
SELECT id, first_name, last_name FROM profiles LIMIT 5;

-- Создать диалог между ними (замените UUID на реальные)
INSERT INTO conversations (task_id, participant1_id, participant2_id)
VALUES (
    NULL,  -- или реальный task_id из таблицы tasks
    'UUID-ПОЛЬЗОВАТЕЛЯ-1',
    'UUID-ПОЛЬЗОВАТЕЛЯ-2'
);

-- Отправить тестовое сообщение
INSERT INTO messages (conversation_id, sender_id, content)
SELECT id, participant1_id, 'Assalomu alaykum!'
  FROM conversations ORDER BY created_at DESC LIMIT 1;
```

### Шаг 5. Открыть страницу чата

1. Залогиньтесь как один из пользователей через `kirish.html`
2. Откройте `chatlar.html`
3. Должны увидеть ваш диалог в боковой панели — кликните на него
4. Сообщения загрузятся, можно отвечать

---

## 🔌 Как открыть чат с другой страницы

Если на странице задачи (`topshiriq.html`, `mahallam.html`) вы хотите добавить кнопку «Написать исполнителю» — просто вызовите глобальную функцию:

```html
<button onclick="openChatWith('UUID-ДРУГОГО-ПОЛЬЗОВАТЕЛЯ', 'UUID-ЗАДАЧИ')">
    Yozish
</button>
```

Функция (в `auth.js`):
- проверит, что вы залогинены
- вызовет `get_or_create_conversation` (создаст диалог, если его ещё нет)
- перейдёт на `chatlar.html` с автоматическим открытием этого диалога

---

## ⚙️ Как это работает (кратко)

| Функция в `chatlar.js` | Что делает |
|---------|------------|
| `loadConversations()` | Грузит все диалоги, где текущий юзер участник, + последнее сообщение + непрочитанные |
| `renderChatList()` | Рисует список в сайдбаре (имя, инициалы, последнее сообщение, время, бейджи категории, непрочитанные) |
| `openConversation(id)` | Открывает конкретный диалог: грузит сообщения, помечает прочитанным |
| `loadMessages(id)` | Загружает все сообщения с группировкой по дате |
| `sendMessage()` | Оптимистично добавляет сообщение в DOM, потом вставляет в БД |
| `setupRealtime()` | Подписывается на `INSERT` в `messages` — входящие появляются мгновенно |
| `markConversationAsRead(id)` | Помечает все входящие сообщения как прочитанные |

---

## 🐛 Частые проблемы

| Симптом | Решение |
|---------|---------|
| «Suhbatlar yo'q» и пусто | В `conversations` нет записей с `participant1_id` или `participant2_id` = id текущего юзера. Создайте тестовый диалог (см. Шаг 4) |
| Сообщения не приходят в реальном времени | Включите Realtime для таблиц `messages` и `conversations` (Database → Replication) |
| Ошибка «column participant1_id does not exist» | Старая таблица не удалена. Скрипт `chat_schema.sql` теперь использует `DROP TABLE IF EXISTS ... CASCADE`, ошибки быть не должно |
| Ошибка `permission denied` при вставке | Проверьте, что RLS отключён: `ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;` |
| В сайдбаре нет аватарок | Используется fallback с инициалами (т.к. в `profiles` нет `avatar_url`). Чтобы подключить фото — добавьте колонку и обновите рендеринг |
| Баннер задачи не показывается | Либо у диалога нет `task_id`, либо задача не найдена по FK |

---

## 📌 TODO на будущее

1. **Поле `status` в `tasks`** — сейчас в баннере захардкожено «Jarayonda»
2. **Поле `avatar_url` в `profiles`** — заменить fallback с инициалами на реальный `<img>`
3. **Уведомления** — таблица `notifications` + push при новых сообщениях
4. **Прикрепление файлов** — `storage buckets` + колонка `attachment_url` в `messages`
5. **Безопасность**: в идеале перевести логин на Supabase Auth — тогда можно включить RLS с `auth.uid()` и не фильтровать в JS (текущая схема с plaintext-паролями в `profiles` небезопасна)
