# Handoff: Sitio de Apuestas Deportivas

> Contexto para retomar el trabajo en una nueva sesión con Claude.
> Última actualización: 2026-09-27.
> **Al empezar una sesión nueva:** pide a Claude que lea este archivo y ejecuta `git status` y `git log --oneline`, porque el estado puede haber cambiado.

## 1. Qué es el proyecto

Sitio web full-stack de apuestas virtuales sobre la **Primera División Chilena**. Los usuarios se registran, reciben $1000 de saldo virtual, apuestan en partidos (1 / X / 2), ven su historial y estadísticas del torneo, y crean **grupos de apuestas** con invitación por WhatsApp.

- **Carpeta local:** `C:\Darian\repositorios\sitio-apuestas`
- **GitHub:** https://github.com/Darianpmorenoa/sitio-apuestas
- **Idioma:** todo en español (UI, commits, conversación).

## 2. Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 + React Router 6 + Axios + **Tailwind CSS v4** (con preflight), puerto **3000** |
| Backend | Node.js + Express (ES modules), JWT (`jsonwebtoken`), `bcryptjs`, `pg`, puerto **5000** |
| Base de datos | PostgreSQL en **Supabase** |

### Estructura

```
backend/
  config/database.js      # Pool de pg (SSL si DB_HOST != localhost)
  controllers/            # auth, matches, bets, grupos
  routes/                 # /api/auth, /api/matches, /api/bets, /api/grupos
  middleware/auth.js      # verifica JWT (con logs de depuración)
  utils/validators.js
  .env                    # NO está en git (credenciales)
frontend/src/
  App.jsx                 # rutas + estado global de user/token (handleLogin, handleUserUpdate)
  index.css               # Tailwind + tokens del diseño (@theme) + base mínima
  components/
    Navigation.jsx        # barra superior + barra inferior en móvil + menú de usuario
    Footer.jsx            # pie global con enlaces legales
    AuthLayout.jsx        # layout dividido y campos (Field, PasswordField, FormAlert, SubmitButton)
    Crest.jsx             # escudo con iniciales y colores del club
  utils/
    futbol.js             # ODDS, equipos, formatMoney, formatKickoff, SALDO_INICIAL
    grupos.js             # iniciales y color de la ficha de cada grupo
    tabla.js              # cálculo de la tabla de posiciones
  pages/                  # Home, Login, Register, Matches, MyBets, Stats, Grupos, GrupoDetalle, Legal
database/
  schema.sql              # usuarios, equipos, partidos, apuestas + datos de ejemplo
  grupos.sql              # grupos, miembros_grupo, apuestas_grupo
```

### Cómo correrlo

```bash
cd backend  && npm run dev   # http://localhost:5000
cd frontend && npm run dev   # http://localhost:3000
```

Si el navegador muestra `ERR_CONNECTION_REFUSED` en `:5000`, el backend está detenido.

## 3. Configuración de Supabase (importante)

- Proyecto Supabase ID: `apyzpytwoofnwxgzjavw`, región **ca-central-1**.
- **Se usa el Session pooler, NO la conexión directa.** El host directo solo tiene IPv6 y la red del usuario no tiene IPv6 (`ENOTFOUND` → error 500).
- `backend/.env` usa `DB_HOST=aws-0-ca-central-1.pooler.supabase.com`, `DB_USER=postgres.apyzpytwoofnwxgzjavw`, `DB_PORT=5432`, `DB_NAME=postgres`. La contraseña y el `JWT_SECRET` están solo en el archivo local.
- Datos de prueba creados por Claude (se pueden borrar):
  - Usuario `prueba907405448@test.com` (la contraseña la tiene el usuario; no se versiona). Tiene 2 apuestas pendientes ($50 y $10), saldo $940.
  - Grupo "Grupo de prueba" (id 1), admin: ese usuario.
- El usuario también tiene su propia cuenta de pruebas ("juan").

## 4. Diseño "Estadio nocturno"

Todo el sitio usa un tema oscuro tipo casa de apuestas. Lienzo de diseño (privado): https://claude.ai/artifact/KLxUoppYAEDpo5ac9thYhM

- **Colores** (tokens en `index.css`, usar como `bg-volt`, `text-gris`, etc.): `noche` #07090D (fondo), `grada` #0F141C (tarjetas), `pasto` #151C27 (filas), `linea` #232D3C (bordes), `tiza` #F2F5F9 (texto), `niebla`/`gris` (texto secundario), `volt` #C8FF2E (acento, ganada), `ambar` (pendiente), `roja` (perdida, errores).
- **Fuentes** (Google Fonts en `index.html`): `font-display` Barlow Condensed 800 (títulos en cursiva y mayúsculas), `font-body` Manrope, `font-cifras` JetBrains Mono (montos, cuotas).
- Marca provisoria: **APUESTAS.CL** (placeholder; cambiar en `Navigation.jsx` y `AuthLayout`/páginas si se decide otro nombre).
- Todas las páginas son responsive (probadas a 390 px y 1280 px).

## 5. Lo que se hizo

### Sesión 1
Proyecto completo, grupos con WhatsApp, migración a Supabase (pooler + SSL), reorganización del repo, arreglo del saldo que no se actualizaba al apostar (descuento atómico en `bets.js` + `handleUserUpdate` en `App.jsx`).

### Sesión 2 (rediseño completo)
1. **Lienzo de diseño** con sistema visual, navegación, login/registro, inicio, mis apuestas, grupos y móvil.
2. **Todas las páginas migradas a Tailwind** con el diseño oscuro; se borraron todos los `.css` por página y se activó el **preflight** de Tailwind.
3. **Navegación:** enlaces activos, chip de saldo, menú de usuario (Esc / clic fuera), barra inferior fija en móvil.
4. **Inicio:** partido destacado con **cupón de apuesta funcional**, próximos partidos, tus apuestas pendientes y tus grupos (o "cómo funciona" sin sesión). Se quitaron estadísticas inventadas.
5. **Partidos:** agrupados por día; cupón oscuro (modal en escritorio, hoja inferior en móvil).
6. **Mis apuestas:** resumen (saldo, apostado, ganancia neta, acierto), filtros, tabla/tarjetas, racha y distribución de pronósticos. Cuota según pronóstico (1.85 / 3.20 / 4.10).
7. **Login y Registro:** errores por campo, mostrar contraseña, reglas de contraseña en vivo, `autocomplete`. **Arreglo:** el registro no guardaba la sesión en `App.jsx` (ahora llama a `onLogin`).
8. **Grupos y detalle:** crear/unirse sin modales; detalle con **ranking por saldo**, últimas apuestas con nombres reales, copiar código y WhatsApp (solo admin). Sin `alert()`.
9. **Estadísticas:** tabla de posiciones con forma, últimos resultados y próximos. **Arreglo:** antes usaba `/api/matches` (solo partidos futuros) y nunca mostraba resultados; ahora usa también `/api/matches/resultados/historial`.
10. **Legal:** `/terminos` y `/privacidad` (describen lo que la app realmente hace con los datos) + pie de página global. El registro enlaza a ambas.
11. **Backend:**
    - `bets.js`: `GET /api/bets` devuelve también `fecha_partido`, `goles_local`, `goles_visitante`.
    - `grupos.js`: la lista incluye `mi_rol` y `total_miembros`; el detalle incluye `mi_rol`, saldo y `total_apuestas` de cada miembro, y nombre de usuario + equipos en cada apuesta.

## 6. Próximos pasos

- [ ] **Completar las páginas legales** antes de publicar (aparecen resaltadas en ámbar en `pages/Legal.jsx`): nombre del responsable, correo de contacto, edad mínima (puesta en 18) y plazos (puestos en 30 días). Idealmente, revisión de un abogado (Ley 19.628 y su reforma).
- [ ] Decidir el nombre de la marca (hoy "APUESTAS.CL").
- [ ] **Liquidar apuestas:** el backend nunca marca apuestas como ganadas/perdidas ni guarda `ganancia`. Por eso Mis apuestas muestra "—" en ganancia/acierto y el ranking de grupos usa el saldo. Falta un proceso que cargue marcadores (`goles_local`, `goles_visitante`) y cierre apuestas.
- [ ] Las URLs `http://localhost:5000` siguen fijas en el código; hay un proxy `/api` en Vite sin usar.
- [ ] Los logs de depuración en `middleware/auth.js` y `bets.js` siguen activos.
- [ ] No existe `.env.example`.
- [ ] La tabla `apuestas_grupo` no se usa (el detalle muestra las apuestas de los miembros).
- [ ] Opcional: permitir que cualquier miembro (no solo el admin) genere el enlace de WhatsApp; hoy los miembros solo ven el código.

## 7. Cuidados y gotchas

- **Tailwind v4 con preflight:** los estilos base están en `index.css` (`@layer base`). Ya no hay CSS global por página; todo va con clases de Tailwind y los tokens del tema.
- Reutiliza `utils/futbol.js`, `Crest`, `AuthLayout` (Field, FormAlert…) en vez de duplicar formatos o estilos.
- **Claude in Chrome:** para pruebas en el navegador, el usuario ejecuta `/chrome`. El usuario puede estar usando la misma pestaña; no hacer acciones que cambien datos de su cuenta.
- **Nunca subir `backend/.env`** (está en `.gitignore`). Nunca escribir contraseñas en archivos versionados.
- El usuario trabaja en Windows (PowerShell / Git Bash). Prefiere explicaciones en español, paso a paso.
