# Habit RPG — Rastreador de hábitos (PWA)

Una app para crear hábitos, marcarlos a diario y convertir tu constancia en XP, niveles, monedas y logros, todo con estética retro de videojuego.

**Qué incluye**

- **Hoy**: HUD con nivel y XP, lista de hábitos del día, misiones diarias.
- **Hábitos**: crear, editar y archivar hábitos (con icono y color).
- **Tienda**: catálogo de recompensas para canjear con monedas e historial de canjes.
- **Perfil**: tarjeta de héroe, mapa de calor, logros y copia de seguridad.
- Funciona **offline** (service worker) e **instalable** en el móvil.

---

## Requisitos

- **Node.js 20 o superior** (probado con Node 24). Comprueba con `node -v`.
- **git** para publicar en GitHub. Hoy **no está instalado** en este PC. Instálalo con:

  ```powershell
  winget install --id Git.Git -e --source winget
  ```

  Después **cierra y reabre la terminal** para que `git` quede en el PATH.

No hace falta `npm install`: el proyecto no tiene dependencias.

---

## Desarrollo local

Desde la carpeta del proyecto:

```powershell
cd habitos
npm test        # ejecuta las pruebas (node --test)
npm run dev     # levanta un servidor local en http://localhost:8143
```

Abre `http://localhost:8143` en el navegador.

> **Nota sobre el service worker (cache-first):** si cambias JS o CSS y el navegador
> sigue mostrando la versión antigua, es la caché del service worker. Solución:
> DevTools → **Application** → **Service Workers** → *Unregister* + *Clear storage*
> (o "Clear site data"). Alternativa para producción: subir el valor de `CACHE` en `sw.js`.

---

## Publicar en GitHub Pages (gratis)

1. Inicializa el repositorio y haz el primer commit:

   ```powershell
   git init
   git add .
   git commit -m "feat: habit tracker PWA"
   ```

2. Crea un repositorio vacío en GitHub y conéctalo:

   ```powershell
   git remote add origin https://github.com/<usuario>/<repo>.git
   git branch -M main
   git push -u origin main
   ```

3. En GitHub: **Settings → Pages → Source: "Deploy from a branch"**
   → Branch `main`, carpeta `/ (root)` → **Save**.

4. La URL resultante será `https://<usuario>.github.io/<repo>/`.
   Todas las rutas son relativas (incluido el `manifest.webmanifest`, con
   `start_url`/`scope` en `"."`), así que funciona aunque se sirva desde una subcarpeta.

> **HTTPS es obligatorio** para instalar la PWA y registrar el service worker.
> GitHub Pages ya sirve por HTTPS, así que no tienes que hacer nada más.

---

## Instalar en iPhone (iOS 16.4+)

1. Abre la URL de la app en **Safari** (no en Chrome).
2. Pulsa el botón **Compartir**.
3. Elige **"Añadir a pantalla de inicio"** y confirma.
4. Ábrela desde el nuevo icono: se ejecuta a pantalla completa, como una app nativa.

Los datos se guardan en el propio dispositivo (`localStorage`); no se sincronizan.

---

## Datos y copia de seguridad

- Todo el progreso es **local** al dispositivo/navegador.
- En **Perfil → Exportar/Importar** puedes descargar un JSON con tus datos y volver a cargarlo.
- **Borrar los datos del sitio** (o desinstalar del móvil) **borra el progreso**. Haz copias periódicas.

---

## Estructura del proyecto

```
habitos/
├── index.html              # Punto de entrada
├── app.js                  # Shell, router de pestañas y render
├── styles.css              # Estilos (tema retro)
├── sw.js                   # Service worker (precache + offline)
├── manifest.webmanifest    # Metadatos PWA
├── dev-server.mjs          # Servidor de desarrollo (puerto 8143)
├── icons/                  # Iconos de la app
├── src/
│   ├── data.js             # Catálogos (hábitos, tienda, misiones)
│   ├── dates.js            # Utilidades de fechas
│   ├── storage.js          # Persistencia y migración de estado
│   ├── state.js            # Lógica de dominio (acciones)
│   ├── game.js             # XP, niveles y monedas
│   ├── achievements.js     # Logros
│   ├── quests.js           # Misiones diarias
│   ├── charts.js           # Mapa de calor / gráficos
│   └── ui/                 # Pantallas (today, habits, shop, profile)
└── tests/                  # Pruebas con node --test
```

La lógica **pura** de `src/` está cubierta por pruebas que se ejecutan con `node --test`
(script `npm test`). Las pantallas viven en `src/ui/`.

---

## Limitaciones conocidas

- **Una sola instalación por dispositivo**: no hay cuentas ni sincronización entre dispositivos.
- Las **fuentes de Google** se cachean **en la primera carga online**; para verlas offline
  hay que haber abierto la app al menos una vez con conexión.
- Los datos viven en `localStorage`: limpiar los datos del sitio elimina el progreso.
