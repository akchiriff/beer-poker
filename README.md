# 🍺 Beer Poker

Planning Poker para equipos ágiles usando cervezas como unidad de medida.

## ¿Cómo publicar en GitHub Pages? (5 pasos)

### 1. Crea el repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `beer-poker` (exactamente así, en minúsculas)
3. Visibilidad: **Public** (necesario para GitHub Pages gratis)
4. **NO** marques "Add README" ni nada más
5. Clic en **Create repository**

---

### 2. Sube este proyecto

Abre una terminal en la carpeta `beer-poker` y ejecuta:

```bash
git init
git add .
git commit -m "🍺 Initial Beer Poker"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/beer-poker.git
git push -u origin main
```

> ⚠️ Cambia `TU_USUARIO` por tu nombre de usuario de GitHub

---

### 3. Activa GitHub Pages

1. Ve a tu repositorio → **Settings** → **Pages**
2. En "Source" selecciona: **GitHub Actions**
3. ¡Listo! El workflow se ejecuta automáticamente al hacer push

---

### 4. Espera ~2 minutos

GitHub Actions compilará y publicará la app. Puedes ver el progreso en la pestaña **Actions** de tu repositorio.

---

### 5. Tu URL estará lista

```
https://TU_USUARIO.github.io/beer-poker/
```

Compártela con tu equipo y ¡a estimar! 🍺

---

## ¿El repositorio se llama distinto?

Si tu repo no se llama `beer-poker`, edita `vite.config.js` y cambia:

```js
base: '/beer-poker/',  // ← pon aquí el nombre exacto de tu repo
```

---

## Funcionalidades

- 🎲 **Crear sala** → genera código de 6 letras automáticamente
- 🔗 **Compartir link** → URL directa con el código incluido
- 🍺 **Votar en secreto** → las cartas se revelan todas a la vez
- 📊 **Capacidad del sprint** → cada uno indica cuánto puede asumir
- 🔄 **Nueva votación** → resetea los votos sin perder la sala
- ✅ **Detección de consenso** → avisa si hay diferencias de opinión

## Escalas

| Cerveza | Puntos | Cuándo |
|---------|--------|--------|
| 🍺 Quinto | 1 | Simple y rápido |
| 🍻 Caña | 2 | Algo de análisis |
| 🍾 Tercio | 3 | Compleja, con partes |
| 🪣 Jarra | 5 | Muy compleja, riesgo alto |
| 🛢️ Litrona | 8 | Épica, hay que dividirla |
| 🛑 ¡Barril! | 13 | Rompe en tareas primero |

## Nota técnica

La sincronización usa `localStorage` + `BroadcastChannel`. Funciona perfectamente para equipos en la misma red o usando el mismo link. Para sincronización cross-device en tiempo real sin servidor, cada participante recarga la página automáticamente cada 800ms.
