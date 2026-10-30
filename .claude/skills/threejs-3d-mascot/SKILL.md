---
name: threejs-3d-mascot
description: Procedural 3D mascot (yellow "Fundik") for Foundation in three.js / react-three-fiber — no .gltf, all geometry in code. Use whenever touching the mascot, its states, or the agent mini-mascots.
---

# Процедурный 3D-маскот

## Генерация
1. Форма: базовая `SphereGeometry`, деформированная шумом (simplex/Perlin) в вершинном шейдере через `onBeforeCompile`, чтобы сфера «дышала» и меняла форму — мягкое желейное тело (squishy body). Физическое освещение материала сохраняется.
2. Материал тела — `MeshPhysicalMaterial`: color `#FFD54F`, roughness 0.4, metalness 0.1, clearcoat 1.0, transmission 0.3 (на слабых устройствах transmission → 0, остальное без изменений), плюс sheen для бархатистости.
3. Детали — тоже процедурно: большие глаза (склера + радужка + зрачок + два блика), веки-полусферы цвета тела (вращение по X — моргание, по Z — нахмуренность), длинные висячие уши с пружинной инерцией, розовый носик, широкая улыбка с зубами (две дуги TorusGeometry), длинные руки с простой IK (плечо → цель кисти) и рукавицы. Никаких отростков на голове. Образ — «по мотивам» добродушного жёлтого инопланетянина, но не копия чужого персонажа: свои пропорции, оба глаза одного цвета.

## Поведение
1. Медленное парение по Y (синусоида) над круглым кольцом ввода.
2. Фокус на инпуте → плавный наклон вперёд к пользователю.
3. Глаза следят за курсором через пружину (damp), моргание раз в 3–6 s.
4. Состояния из стора: idle / listening / thinking / challenging / approving / blocking / greeting.
5. Пауза рендера, когда сцена вне вьюпорта или вкладка скрыта (frameloop="demand"/IntersectionObserver).
