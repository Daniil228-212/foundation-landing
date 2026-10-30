---
name: replicate-atelier-ux
description: Design DNA of "The Atelier · The art of the unhurried day" — Quiet Luxury UX for Foundation. Use for any visual/layout/typography/motion decision on the landing so it never drifts back to template SaaS look.
---

# Quiet Luxury UX (The Atelier DNA)

Задача — полностью искоренить шаблонный SaaS-дизайн (синие кнопки, резкие карточки, яркий неоновый свет) и заменить его на «Тихий люкс».

## Сетка и цвет
1. Фон: исключительно глубокий графитовый `#121212` или дымчатый шёлк `#FBFBFA`. Никаких чистых #000/#fff.
2. Типографика как дорогая печатная периодика: заголовки — изящная антиква (Cormorant Garamond / Playfair Display) с увеличенным трекингом; подзаголовки и данные — разреженный тонкий гротеск, opacity 0.6.
3. Интерфейс «Хронографа»: вместо дашбордов — тонкая линия времени вверху экрана с текущей фазой: `nexus: market • 01 | nexus: product • 02 | …`.

## Движение (вместе с emil-design-eng)
1. Сценические появления — «проявление»: blur(20px) → blur(0) + opacity, а не вылет.
2. Длительность сценических появлений 1.4–1.8 s, easing `cubic-bezier(0.16, 1, 0.3, 1)`.
3. Исключение (из emil-design-eng): отклик на действие пользователя (press, focus, hover) — 120–200 ms, ease-out. Долгие кривые только для того, что пользователь смотрит, а не нажимает.
4. prefers-reduced-motion: оставить только opacity-фейды, без blur-движения и смещений.

## Акцент
Единственный насыщенный цвет — жёлтый маскота. Цвета Нексусов — приглушённые, «пигментные», не неон. Нексусы изображаются как области объединённых точек (облака-кластеры), а не как кружки с подписями.
