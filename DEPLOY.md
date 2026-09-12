# Деплой на hoster.by

Сайт статический: Astro собран без адаптера, `pnpm build` кладёт готовые
HTML и ассеты в `dist/`. Node на проде не нужен — нужен только веб-сервер,
отдающий файлы.

## Прод

| | |
|---|---|
| Домен | `oxygen-fitness.by` (SSL Let's Encrypt, выпущен) |
| Панель | hoster.by → Sites |
| Пользователь | `h217020` |
| IP | `87.232.64.134` |
| Корень сайта | `/var/www/h217020/data/www/oxygen-fitness.by` |
| Обработчик | Apache/nginx, статика |

В панели путь показан как `/www/oxygen-fitness.by` — это сокращение
относительно домашней папки. Абсолютный путь из таблицы выше.

Второй домен `oxygen-fitnes.by` (с одной «s») — отдельный сайт в панели.
`public/.htaccess` заворачивает его на канонический, но для этого его корень
надо направить на ту же папку.

## Обработчик: обязательно статика

При создании сайта был выбран обработчик **Node.js**, и хостер положил в корень
заглушку — `server.js`, `package.json`, тестовый `index.html`. Пока обработчик
Node, панель пытается запускать `server.js` вместо отдачи `index.html`.

Sites → строка сайта → «Изменить» → обработчик **Apache/nginx (статика)**.
Заглушку сносит `rsync --delete` при первой заливке.

## Вариант 1: сборка локально, заливка по rsync

С рабочей машины:

```
PUBLIC_SITE_URL=https://oxygen-fitness.by pnpm build
rsync -avz --delete dist/ h217020@87.232.64.134:/var/www/h217020/data/www/oxygen-fitness.by/
```

`PUBLIC_SITE_URL` задавать обязательно: без него `astro.config.mjs` подставит
дефолт `https://oxygen.vpname.cc`, и canonical с og:url уедут на чужой домен.

`--delete` зеркалит папку. На сервере нет ничего, что правится руками, поэтому
это безопасно.

## Вариант 2: сборка на сервере

На сервере есть git 2.52, node 26.8.2, rsync 3.2.5. Первый раз:

```
cd ~ && git clone https://github.com/skillforce/oxygen.git src-oxygen
mkdir -p ~/bin && corepack enable --install-directory ~/bin && export PATH=~/bin:$PATH
corepack prepare pnpm@11.10.0 --activate
cd ~/src-oxygen && pnpm install --frozen-lockfile
PUBLIC_SITE_URL=https://oxygen-fitness.by pnpm build
rsync -a --delete dist/ /var/www/h217020/data/www/oxygen-fitness.by/
```

Дальше обновление:

```
cd ~/src-oxygen && export PATH=~/bin:$PATH && git pull && pnpm build && rsync -a --delete dist/ /var/www/h217020/data/www/oxygen-fitness.by/
```

Плюс в том, что по сети не гоняются 28 МБ сборки (23 из них — тайлы 3D-тура),
а идёт только git-дельта.

## Грабли

**`corepack enable` падает с `EROFS: read-only file system`.** Corepack ставит
симлинк в `/usr/lib/ispnodejs/bin`, куда на шареде нет записи. Обход — ключ
`--install-directory ~/bin` и `~/bin` в `PATH`, как в варианте 2 выше. `PATH`
живёт только внутри сессии, поэтому его надо повторять при каждом заходе (либо
дописать в `~/.bashrc`).

**`bash: cd: too many arguments`.** Многострочная вставка в веб-терминал панели
склеивается в одну строку и переносы теряются. Команды надо либо соединять
через `&&`, либо вставлять по одной.

**`sharp`.** Тянет нативные бинарники и на шареде может не поставиться. Если
`pnpm install` падает на нём — вариант 2 отпадает, остаётся первый.

## Конфигурация веб-сервера

`public/.htaccess` попадает в `dist/` при сборке и настраивает gzip, кеш
(`/_astro/` на год как immutable, изображения и тур на 30 дней, HTML на 5 минут),
редирект на https и канонический хост, слеш для `/tour/`.

`nginx/nginx.conf` — то же самое для Docker-образа из `Dockerfile`, к шаред-хостингу
отношения не имеет. nginx `.htaccess` игнорирует, так что файлы не конфликтуют.
