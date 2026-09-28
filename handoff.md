# Handoff: Sitio de Apuestas Deportivas

> Contexto para retomar el trabajo en una nueva sesión con Claude.
> Última actualización: 2026-09-27.
> **Al empezar una sesión nueva:** pide a Claude que lea este archivo y ejecute `git status` y `git log --oneline`, porque el estado puede haber cambiado.

## 1. Qué es el proyecto

Sitio web full-stack de apuestas **virtuales** (sin dinero real) sobre la **Primera División de Chile**. Los usuarios se registran, reciben $1.000 de saldo virtual, apuestan en partidos (1 / X / 2), ven su historial y las estadísticas del torneo, y crean **grupos** para competir con amigos, con invitación por WhatsApp.

- **Carpeta local:** `C:\Darian\repositorios\sitio-apuestas`
- **GitHub:** https://github.com/Darianpmorenoa/sitio-apuestas (todo está en `main`)
- **Idioma:** todo en español (UI, commits, conversación).

## 2. Estado actual (resumen rápido)

- `main` está sincronizado con GitHub y no hay cambios sin commit.
- **Todo el sitio está rediseñado** con el tema oscuro "Estadio nocturno" en Tailwind CSS v4.
- **Panel de administración** en `/admin`: registrar marcadores (liquidar), suspender partidos y crear partidos nuevos. Solo para usuarios con `es_admin`.
- La liquidación también sigue disponible por terminal (`npm run liquidar` en `backend/`).
- El partido 1 (Colo-Colo vs U. de Chile) se liquidó 1-1 desde el panel el 2026-09-27; la apuesta de juan al empate quedó ganada.
- **Sin probar todavía:** la vista móvil del panel.
- **Partidos reales cargados (2026-09-27):** el pendiente de la fecha 23 (U. de Concepción vs Huachipato, vie 2 oct 20:00) y toda la fecha 24 (10 al 12 de octubre). Los partidos de ejemplo 2 a 5 se **suspendieron** (apuestas anuladas y montos devueltos: $150 a juan, $10 al admin).

## 3. Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 + React Router 6 + Axios + **Tailwind CSS v4** (con preflight), puerto **3000** |
| Backend | Node.js 22 + Express (ES modules), JWT (`jsonwebtoken`), `bcryptjs`, `pg`, puerto **5000** |
| Base de datos | PostgreSQL en **Supabase** |
| Tests | `node:test` (sin dependencias), `npm test` en `backend/` |

### Estructura

```
backend/
  config/database.js        # Pool de pg (SSL si DB_HOST != localhost)
  controllers/              # auth, matches, bets, grupos, admin
  routes/                   # /api/auth, /api/matches, /api/bets, /api/grupos, /api/admin
  middleware/auth.js        # verifyToken (con logs de depuración) y requireAdmin
  services/liquidacion.js   # liquidar/anular partidos y apuestas
  services/partidos.js      # validar y crear partidos nuevos
  scripts/liquidar.js       # comando `npm run liquidar`
  scripts/admin.js          # comando `npm run admin` (dar/quitar rol de administrador)
  tests/                    # pruebas de liquidación, partidos y validadores
  utils/cuotas.js           # cuotas fijas por pronóstico (1.85 / 3.20 / 4.10)
  utils/validators.js
  .env                      # NO está en git (credenciales)
frontend/src/
  App.jsx                   # rutas + estado global de user/token (handleLogin, handleUserUpdate)
  index.css                 # Tailwind + tokens del diseño (@theme) + base mínima
  components/
    Navigation.jsx          # barra superior + barra inferior en móvil + menú de usuario
    Footer.jsx              # pie global con enlaces legales
    AuthLayout.jsx          # layout dividido y campos (Field, PasswordField, FormAlert, SubmitButton)
    Crest.jsx               # escudo con iniciales y colores del club
  utils/
    futbol.js               # ODDS, equipos, formatMoney, formatKickoff, SALDO_INICIAL
    grupos.js               # iniciales y color de la ficha de cada grupo
    tabla.js                # cálculo de la tabla de posiciones
    api.js                  # API_URL: base de la API (`/api` o VITE_API_URL)
  pages/                    # Home, Login, Register, Matches, MyBets, Stats, Grupos, GrupoDetalle, Legal, Admin, NotFound (404)
database/
  schema.sql                # esquema completo + datos de ejemplo (instalación nueva)
  grupos.sql                # grupos, miembros_grupo, apuestas_grupo
  migraciones/001_liquidacion.sql      # columnas cuota y fecha_liquidacion (ya aplicada en Supabase)
  migraciones/002_administradores.sql  # columna usuarios.es_admin (ya aplicada en Supabase)
  migraciones/003_equipos_2026.sql     # 8 clubes de la Liga de Primera 2026 que faltaban (ya aplicada en Supabase)
```

### Rutas del frontend

`/` Inicio · `/login` · `/register` · `/matches` Partidos · `/mis-apuestas` · `/estadisticas` · `/grupos` · `/grupos/:id` · `/admin` (solo administradores) · `/terminos` · `/privacidad`

### Cómo correrlo

```bash
cd backend  && npm run dev   # http://localhost:5000
cd frontend && npm run dev   # http://localhost:3000
cd backend  && npm test      # pruebas de liquidación y partidos
```

Si el navegador muestra `ERR_CONNECTION_REFUSED` en `:5000`, el backend está detenido.

## 4. Configuración de Supabase (importante)

- Proyecto Supabase ID: `apyzpytwoofnwxgzjavw`, región **ca-central-1**.
- **Se usa el Session pooler, NO la conexión directa.** El host directo solo tiene IPv6 y la red del usuario no tiene IPv6 (`ENOTFOUND` → error 500).
- `backend/.env` usa `DB_HOST=aws-0-ca-central-1.pooler.supabase.com`, `DB_USER=postgres.apyzpytwoofnwxgzjavw`, `DB_PORT=5432`, `DB_NAME=postgres`. La contraseña y el `JWT_SECRET` están solo en el archivo local.
- Datos actuales: 5 partidos de ejemplo (el 1 ya liquidado 1-1), la cuenta de pruebas del usuario ("juan") y la cuenta **administradora** `admin123@test.cl` (nombre "Administrador"; la contraseña la tiene el usuario, no se escribe en archivos).
- Para probar, crear una cuenta nueva en `/register` o pedirle credenciales al usuario. **No hacer apuestas con la cuenta del usuario sin preguntar.**

## 5. Reglas del negocio

- Saldo inicial: **$1.000** virtuales. No es dinero, no se canjea.
- Cuotas fijas: **1 → 1.85**, **X → 3.20**, **2 → 4.10** (`backend/utils/cuotas.js` y `frontend/src/utils/futbol.js`; deben coincidir).
- Al apostar se descuenta el monto del saldo (de forma atómica) y se guarda la `cuota`. No se puede apostar en partidos que ya empezaron, finalizados o suspendidos. Monto: número entre $1 y $100.000 con hasta 2 decimales (validado en backend y frontend).
- Estados de **partido**: `pendiente` → `finalizado` | `suspendido`.
- Estados de **apuesta**: `pendiente` → `ganada` | `perdida` | `anulada`.
- Al **liquidar** (una sola transacción): se guarda marcador y resultado del partido; cada apuesta queda ganada o perdida con su **ganancia neta** (`ganancia`, negativa si se pierde); al ganador se le suma `monto × cuota`. Un partido no se liquida dos veces ni antes de jugarse.
- Al **anular** un partido suspendido: apuestas `anulada`, ganancia 0 y se devuelve el monto.
- **Ranking de grupos:** por saldo actual (todos parten con $1.000).
- **Administradores:** columna `usuarios.es_admin`. Las rutas `/api/admin/*` pasan por `requireAdmin`, que consulta la base en cada petición (quitar el rol tiene efecto inmediato). El frontend muestra el panel según `user.es_admin` (viene en login y `/api/auth/verify`).
- **Partidos nuevos** (panel): equipos de la tabla `equipos`, distintos entre sí, fecha futura dentro del próximo año y ningún equipo con otro partido a menos de 24 h.

### Comando de liquidación (desde `backend/`)

```bash
npm run liquidar                   # lista los partidos jugados pendientes de liquidar
npm run liquidar -- 1 2 1          # el partido 1 terminó 2-1
npm run liquidar -- 1 --anular     # el partido 1 se suspendió: devuelve lo apostado
```

### Comando de administradores (desde `backend/`)

```bash
npm run admin                      # lista los administradores
npm run admin -- <email>           # le da el rol (debe recargar la página para ver el panel)
npm run admin -- <email> --quitar  # le quita el rol
```

## 6. Diseño "Estadio nocturno"

Lienzo de diseño (privado): https://claude.ai/artifact/KLxUoppYAEDpo5ac9thYhM

- **Colores** (tokens en `index.css`, se usan como `bg-volt`, `text-gris`, etc.): `noche` #07090D (fondo), `grada` #0F141C (tarjetas), `pasto` #151C27 (filas), `linea` #232D3C (bordes), `tiza` #F2F5F9 (texto), `niebla`/`gris` (texto secundario), `volt` #C8FF2E (acento, ganada), `ambar` (pendiente), `roja` (perdida, errores).
- **Fuentes** (Google Fonts en `index.html`): `font-display` Barlow Condensed 800 (títulos en cursiva y mayúsculas), `font-body` Manrope, `font-cifras` JetBrains Mono (montos, cuotas).
- Marca provisoria: **APUESTAS.CL** (placeholder; está en `Navigation.jsx`).
- Todas las páginas son responsive (probadas a 390 px y 1280 px).

## 7. Historial de lo trabajado

### Sesión 1
Proyecto completo, grupos con WhatsApp, migración a Supabase (pooler + SSL), reorganización del repo, arreglo del saldo que no se actualizaba al apostar.

### Sesión 2
1. **Rediseño completo** (`cfe7c74`): todas las páginas en Tailwind con el tema oscuro; se borraron todos los `.css` por página y se activó el preflight.
   - Navegación con saldo, menú de usuario y barra inferior en móvil.
   - Inicio con partido destacado y cupón de apuesta funcional.
   - Partidos agrupados por día; cupón en modal (escritorio) u hoja inferior (móvil).
   - Mis apuestas con resumen, filtros, racha y distribución de pronósticos.
   - Login y Registro con validación por campo y reglas de contraseña en vivo.
   - Grupos y detalle con ranking, código copiable e invitación por WhatsApp (solo admin).
   - Estadísticas con tabla de posiciones, forma, últimos resultados y próximos.
   - Páginas `/terminos` y `/privacidad` + pie de página global.
2. **Errores corregidos:**
   - El registro no guardaba la sesión en `App.jsx` (volvía al login).
   - Estadísticas usaba solo partidos futuros y nunca mostraba resultados.
   - El detalle de grupo mostraba IDs en vez de nombres de usuario y partido.
3. **Backend enriquecido** (`cabbe99`): las apuestas traen fecha y goles del partido; los grupos traen rol, total de miembros, saldo y apuestas de cada miembro.
4. **Liquidación de apuestas** (`dfded8d`, `423679f`, `4933743`): servicio, comando, migración, pruebas y estados "anulada"/"suspendido" en el frontend.
5. **Forma de trabajo con ramas:** se crea una rama desde `main` (`git checkout -b nombre`), se trabaja ahí, commit y push solo cuando el usuario lo pide, y luego se une a `main` (fast-forward) y se borra la rama.

### Sesión 3
1. **Panel de administración** (`561f93a`, unido a `main`): migración 002 (`es_admin`), `requireAdmin`, rutas `/api/admin`, comando `npm run admin`, página `/admin` (por liquidar, nuevo partido, próximos, historial) y enlace en el menú de usuario. Probado en el navegador; el usuario liquidó el partido 1 (1-1) desde el panel.
2. **Bug de zona horaria corregido** (`config/database.js`): las columnas `TIMESTAMP` guardan UTC, pero `pg` las leía como hora de Chile y las fechas quedaban 3 h corridas (se podía apostar hasta 3 h después del inicio). Ahora se leen y escriben como UTC.
3. `enTransaccion` en `config/database.js`, compartido por el panel y `npm run liquidar`.

### Sesión 4 (QA)
1. **QA de la API** (48 casos: auth, partidos, apuestas, grupos, admin) y **del frontend** en el navegador (registro, apuesta, grupos, 404, cierre de sesión, 375 px sin desborde). Se borraron las cuentas de prueba.
2. **Errores corregidos:**
   - El registro aceptaba emails inválidos y contraseñas débiles (el backend no usaba `validators.js`).
   - Se podía apostar $0,001 (quedaba una apuesta de $0,00) y el backend no aplicaba el máximo de $100.000.
   - Ids con texto (`/api/matches/abc`, `/api/grupos/abc`…), nombres largos o tipos incorrectos daban **error 500** y algunos mostraban el mensaje interno de Postgres.
   - Crear grupo no era atómico (el grupo podía quedar sin su admin).
   - Las rutas inexistentes del frontend mostraban una página en blanco (ahora `NotFound`).
3. **Partidos reales** de la Liga de Primera: migración 003 (8 clubes nuevos, con escudo en `utils/futbol.js`) y 9 partidos creados con `crearPartido` (horario de Chile, UTC-3). Fuentes: ESPN, Cooperativa, Emol y En Cancha.

## 8. Próximos pasos

- [x] **Probar una apuesta real**: la apuesta guarda `cuota` (probado el 2026-09-27 con la cuenta admin).
- [ ] **Completar las páginas legales** antes de publicar (resaltado en ámbar en `pages/Legal.jsx`): nombre del responsable, correo de contacto, edad mínima (puesta en 18) y plazos (puestos en 30 días). Idealmente, revisión de un abogado (Ley 19.628 y su reforma).
- [ ] Decidir el nombre de la marca (hoy "APUESTAS.CL").
- [x] **Liquidación desde la web** y **carga de partidos nuevos**: panel `/admin` (sesión 3).
- [ ] Probar la vista móvil del panel (390 px).
- [ ] No hay forma de **revertir una liquidación** si se carga un marcador equivocado (hoy habría que corregirlo a mano en la base).
- [x] Partidos de ejemplo 2 a 5 suspendidos (2026-09-27).
- [ ] Magallanes y Deportes Iquique no juegan la Primera 2026, pero siguen en `TEAMS` (`utils/futbol.js`) y aparecen en la tabla de posiciones.
- [ ] Cargar la fecha 25 (fin de semana del 24-25 de octubre) cuando la ANFP publique los horarios.
- [ ] Los partidos de ejemplo no guardan `equipo_local_id`/`equipo_visitante_id` (los creados desde el panel sí).
- [x] URLs de la API: el frontend usa `API_URL` (`src/utils/api.js`), que vale `/api` en desarrollo (proxy de Vite) o `VITE_API_URL` al publicar.
- [ ] Los logs de depuración en `middleware/auth.js` y `bets.js` siguen activos.
- [ ] No existe `.env.example`.
- [ ] La tabla `apuestas_grupo` no se usa (el detalle muestra las apuestas de los miembros).
- [ ] Opcional: permitir que cualquier miembro (no solo el admin) genere el enlace de WhatsApp.

## 9. Cuidados y gotchas

- **Tailwind v4 con preflight:** la base está en `index.css` (`@layer base`). No hay CSS por página; todo va con clases de Tailwind y los tokens del tema.
- **Llamadas a la API:** usar siempre `${API_URL}/...` de `utils/api.js`, nunca `http://localhost:5000`.
- Reutiliza `utils/futbol.js`, `Crest` y `AuthLayout` (Field, FormAlert…) en vez de duplicar formatos o estilos.
- Si cambias las cuotas, cámbialas en **backend y frontend**.
- Cambios de base de datos: crear una migración nueva en `database/migraciones/` (numerada, que se pueda correr más de una vez), actualizar `schema.sql` y avisar antes de aplicarla en Supabase.
- Para probar la liquidación contra la base real sin cambiar datos: correr `liquidarPartido` dentro de una transacción y hacer `ROLLBACK`.
- **Fechas:** en la base todo `TIMESTAMP` es UTC. No quitar la configuración de `config/database.js`. Desde el frontend, enviar fechas con `toISOString()`.
- **Pruebas en el navegador:** el usuario puede estar usando la misma pestaña al mismo tiempo. Antes de iniciar sesión con otra cuenta, guardar la sesión que haya en `localStorage` y restaurarla al terminar.
- **Claude in Chrome:** el usuario lo activa con `/chrome`. Puede estar usando la misma pestaña; no hacer acciones que cambien datos de su cuenta.
- **Nunca subir `backend/.env`** (está en `.gitignore`). Nunca escribir contraseñas en archivos versionados.
- En Windows, `curl` desde Git Bash puede enviar texto con tildes mal codificado; para probar la API con acentos es mejor usar Node.
- El usuario trabaja en Windows (PowerShell / Git Bash) y prefiere explicaciones en español, paso a paso.
