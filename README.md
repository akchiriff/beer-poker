# 🍺 Beer Poker

Planning Poker para equipos ágiles usando cervezas como unidad de medida.

Compártela con tu equipo y ¡a estimar! 🍺

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
| 🍺 Quinto | 2 | Simple y rápido |
| 🍻 Caña | 4 | Algo de análisis |
| 🍾 Tercio | 6 | Compleja, con partes |
| 🪣 Jarra | 8 | Muy compleja, riesgo alto |
| 🛢️ Litrona | 10 | Épica, hay que dividirla |

## Nota técnica

La sincronización usa `localStorage` + `BroadcastChannel`. Funciona perfectamente para equipos en la misma red o usando el mismo link. Para sincronización cross-device en tiempo real sin servidor, cada participante recarga la página automáticamente cada 800ms.
