# Handoff: Sitio de Apuestas Deportivas

> Contexto para retomar el trabajo en una nueva sesión con Claude.
> Última actualización: 2026-09-27 (fin de la sesión 4).
> **Al empezar una sesión nueva:** pide a Claude que lea este archivo y ejecute `git status` y `git log --oneline`, porque el estado puede haber cambiado.

## 0. Reglas obligatorias (las fijó el usuario)

1. **NUNCA usar la base de datos de producción ni la `service_role` key de producción.** El Supabase de `backend/.env` es producción. Nada de pruebas, scripts, `npm run liquidar`/`npm run admin`, QA con datos ni navegación contra un backend que apunte ahí. Si una tarea necesita datos, preguntar qué base usar.
2. **Todo lo que toque créditos o apuestas va en el backend y dentro de una transacción.**
3. **Créditos como enteros, nunca float** (saldo, montos, ganancias, pagos). Nada de `parseFloat` ni decimales en créditos.
4. **Después de cambiar UI o flujos de apuesta, verificar en el navegador con `playwright-cli`**, con la API simulada (ver sección 9).
5. **No hacer commit de archivos `.env`.** Agregar archivos por nombre y revisar `git status` antes de cada commit.
6. Commit, merge y push **solo cuando el usuario lo pide**.

## 1. Qué es el proyecto

Sitio web full-stack de apuestas **virtuales** (sin dinero real) sobre la **Primera División de Chile**. Los usuarios se registran, reciben $1.000 de saldo virtual, apuestan en partidos (1 / X / 2), ven su historial y las estadísticas del torneo, y crean **grupos** para competir con amigos, con invitación por WhatsApp.

- **Carpeta local:** `C:\Darian\repositorios\sitio-apuestas`
- **GitHub:** https://github.com/Darianpmorenoa/sitio-apuestas
- **Idioma:** todo en español (UI, commits, conversación). El usuario trabaja en Windows y prefiere explicaciones paso a paso.

## 2. Estado actual y qué hacer primero

### Git
- `main` = `763ddfc`, subido a GitHub (QA, partidos reales, página 404, `API_URL`).
- Rama **`creditos-enteros`** (sin unir a `main`, sin subir):
  - `352aae1`: panel `/admin` en móvil (nombres completos, marcador en una línea). Con commit.
  - **Cambios sin commit:** créditos enteros + apuesta en una transacción + migración 004 + pruebas + este handoff. Ya probados (31 pruebas OK, build OK, verificado con playwright-cli). Falta que el usuario pida el commit y el merge a `main`.

### Pendiente del usuario (en este orden)
1. **Aplicar la migración `004_creditos_enteros.sql`** en el editor SQL de Supabase. Primero correr la consulta de revisión que trae en los comentarios (muestra las filas con decimales, que son las únicas que cambian). **Ojo:** el backend con nodemon ya ejecuta el código nuevo, que exige créditos enteros. Si alguna fila tiene decimales, apostar o liquidar sobre ella falla hasta aplicar la migración.
2. **Quitar la cuenta de prueba** `qa_admin_1790562613450@test.cl` (id 9, tiene rol admin): `npm run admin -- qa_admin_1790562613450@test.cl --quitar` desde `backend/` y borrarla en la tabla `usuarios` de Supabase.
3. Pedir el commit de la rama `creditos-enteros` y unirla a `main`.
4. Decidir una **base de pruebas** (PostgreSQL local o un proyecto Supabase aparte) para QA con datos reales.

### Funcionalidad
- Sitio completo con el tema oscuro "Estadio nocturno" (Tailwind v4), responsive (probado a 390 px y 1280 px).
- Panel de administración en `/admin` (liquidar, suspender y crear partidos), solo para `es_admin`. También está `npm run liquidar`.
- Partidos en la base: el 1 finalizado (Colo-Colo 1-1 U. de Chile); los de ejemplo 2 a 5 **suspendidos**; del 7 al 15, **partidos reales** pendientes: U. de Concepción vs Huachipato (vie 2 oct 20:00, pendiente de la fecha 23) y toda la fecha 24 (10 al 12 de octubre).

## 3. Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 + React Router 6 + Axios + **Tailwind CSS v4** (con preflight), puerto **3000** |
| Backend | Node.js 22 + Express (ES modules), JWT (`jsonwebtoken`), `bcryptjs`, `pg`, puerto **5000** |
| Base de datos | PostgreSQL en **Supabase** (producción) |
| Tests | `node:test` (sin dependencias, con clientes de base falsos), `npm test` en `backend/` |
| Navegador | `playwright-cli` (instalado global) + skill `playwright-cli` en `~/.claude/skills` |

### Estructura

```
backend/
  config/database.js        # Pool de pg (SSL si DB_HOST != localhost), fechas en UTC, enTransaccion()
  controllers/              # auth, matches, bets, grupos, admin
  routes/                   # /api/auth, /api/matches, /api/bets, /api/grupos, /api/admin
  middleware/auth.js        # verifyToken (con logs de depuración) y requireAdmin
  services/apuestas.js      # crearApuesta: todo dentro de la transacción, con bloqueos
  services/liquidacion.js   # liquidar/anular partidos y apuestas
  services/partidos.js      # validar y crear partidos nuevos
  scripts/liquidar.js       # comando `npm run liquidar`
  scripts/admin.js          # comando `npm run admin` (dar/quitar rol de administrador)
  tests/                    # apuestas, liquidación, partidos y validadores (31 pruebas)
  utils/cuotas.js           # CUOTAS, creditosDe (exige enteros) y pagoDe (pago redondeado hacia abajo)
  utils/validators.js       # email, contraseña, nombre, monto de apuesta (entero), esIdValido
  .env                      # NO está en git (credenciales de producción)
frontend/src/
  App.jsx                   # rutas + estado global de user/token (handleLogin, handleUserUpdate)
  index.css                 # Tailwind + tokens del diseño (@theme) + base mínima
  components/
    Navigation.jsx          # barra superior + barra inferior en móvil + menú de usuario
    Footer.jsx              # pie global con enlaces legales
    AuthLayout.jsx          # layout dividido y campos (Field, PasswordField, FormAlert, SubmitButton)
    Crest.jsx               # escudo con iniciales y colores del club
  utils/
    futbol.js               # ODDS, TEAMS (18 clubes), formatMoney, formatKickoff, pagoPotencial, SALDO_INICIAL
    grupos.js               # iniciales y color de la ficha de cada grupo
    tabla.js                # cálculo de la tabla de posiciones
    api.js                  # API_URL: `/api` en desarrollo (proxy de Vite) o VITE_API_URL al publicar
  pages/                    # Home, Login, Register, Matches, MyBets, Stats, Grupos, GrupoDetalle, Legal, Admin, NotFound (404)
database/
  schema.sql                # esquema completo + datos de ejemplo (instalación nueva); ya con créditos INTEGER
  grupos.sql                # grupos, miembros_grupo, apuestas_grupo
  migraciones/001_liquidacion.sql      # cuota y fecha_liquidacion (aplicada)
  migraciones/002_administradores.sql  # usuarios.es_admin (aplicada)
  migraciones/003_equipos_2026.sql     # 8 clubes de la Liga de Primera 2026 (aplicada)
  migraciones/004_creditos_enteros.sql # saldo/monto/ganancia a INTEGER + CHECK saldo>=0 y monto>0 (PENDIENTE, la aplica el usuario)
```

### Rutas del frontend

`/` Inicio · `/login` · `/register` · `/matches` Partidos · `/mis-apuestas` · `/estadisticas` · `/grupos` · `/grupos/:id` · `/admin` (solo administradores) · `/terminos` · `/privacidad` · cualquier otra → 404

### Cómo correrlo

```bash
cd backend  && npm run dev   # http://localhost:5000  (OJO: se conecta a producción)
cd frontend && npm run dev   # http://localhost:3000
cd backend  && npm test      # pruebas unitarias (no usan la base)
cd frontend && npm run build # comprobar que compila
```

- Si el navegador muestra `ERR_CONNECTION_REFUSED` en `:5000`, el backend está detenido.
- Si `npm run dev` del backend dice **"app crashed"**, casi siempre es porque otro proceso ocupa el puerto 5000 (por ejemplo, un servidor que Claude dejó corriendo). Liberar el puerto y escribir `rs` en nodemon.

## 4. Configuración de Supabase (producción)

- Proyecto Supabase ID: `apyzpytwoofnwxgzjavw`, región **ca-central-1**.
- **Se usa el Session pooler, NO la conexión directa.** El host directo solo tiene IPv6 y la red del usuario no tiene IPv6 (`ENOTFOUND` → error 500).
- `backend/.env` usa `DB_HOST=aws-0-ca-central-1.pooler.supabase.com`, `DB_USER=postgres.apyzpytwoofnwxgzjavw`, `DB_PORT=5432`, `DB_NAME=postgres`. La contraseña y el `JWT_SECRET` están solo en el archivo local. El proyecto **no usa** la `service_role` key.
- Datos actuales: 18 equipos, 15 partidos (ver sección 2), usuarios `juan@test.com` (id 2), `admin123@test.cl` (id 3, administrador; la contraseña la tiene el usuario) y la cuenta de prueba id 9 que hay que quitar.
- **No escribir en esta base.** Los cambios de esquema los aplica el usuario desde el editor SQL.

## 5. Reglas del negocio

- Saldo inicial: **$1.000** virtuales. No es dinero, no se canjea.
- Cuotas fijas: **1 → 1.85**, **X → 3.20**, **2 → 4.10** (`backend/utils/cuotas.js` y `frontend/src/utils/futbol.js`; deben coincidir).
- **Créditos siempre enteros** (saldo, monto, ganancia, pagos). La cuota sí tiene decimales, porque es un multiplicador. En el backend, `creditosDe()` convierte lo que viene de la base y **falla** si trae decimales: no redondea sin avisar.
- **Apostar** (`services/apuestas.js`, una sola transacción): valida los datos, bloquea el partido (`FOR SHARE`), revisa que siga pendiente y no haya empezado, bloquea al usuario (`FOR UPDATE`), valida el monto contra el saldo, descuenta y registra la apuesta con su cuota. **Orden de bloqueo: partido → usuario**, el mismo que la liquidación, para evitar bloqueos cruzados.
- Monto de apuesta: **entero** entre $1 y $100.000 y que no supere el saldo (backend y cupón).
- **Pago de una apuesta ganada:** `monto × cuota` redondeado **hacia abajo**, calculado con la cuota en centésimas (`pagoDe` en backend, `pagoPotencial` en frontend; deben coincidir). Ej.: $5 a 1.85 = 9,25 → paga $9. Está explicado en `/terminos`.
- Estados de **partido**: `pendiente` → `finalizado` | `suspendido`.
- Estados de **apuesta**: `pendiente` → `ganada` | `perdida` | `anulada`.
- Al **liquidar** (una sola transacción): se guarda el marcador; cada apuesta queda ganada o perdida con su **ganancia neta** (`ganancia`, negativa si se pierde); al ganador se le suma el pago. Un partido no se liquida dos veces ni antes de jugarse.
- Al **anular** un partido suspendido: apuestas `anulada`, ganancia 0 y se devuelve el monto.
- **Registro:** el backend valida el email, el nombre (3 a 100 caracteres) y la contraseña (6+ caracteres, una mayúscula y un número), con las mismas reglas que el formulario.
- **Ranking de grupos:** por saldo actual (todos parten con $1.000). Nombre del grupo hasta 100 caracteres, descripción hasta 500. Crear un grupo es atómico (grupo y admin en una transacción).
- **Administradores:** columna `usuarios.es_admin`. Las rutas `/api/admin/*` pasan por `requireAdmin`, que consulta la base en cada petición (quitar el rol tiene efecto inmediato).
- **Partidos nuevos** (panel): equipos de la tabla `equipos`, distintos entre sí, fecha futura dentro del próximo año y ningún equipo con otro partido a menos de 24 h.
- **Errores de la API:** ids inválidos → 400/404; errores internos → 500 con un mensaje genérico, sin exponer detalles de Postgres.

### Comandos (desde `backend/`; escriben en la base, **no los corre Claude**)

```bash
npm run liquidar                   # lista los partidos jugados pendientes de liquidar
npm run liquidar -- 1 2 1          # el partido 1 terminó 2-1
npm run liquidar -- 1 --anular     # el partido 1 se suspendió: devuelve lo apostado
npm run admin                      # lista los administradores
npm run admin -- <email>           # le da el rol (debe recargar la página para ver el panel)
npm run admin -- <email> --quitar  # le quita el rol
```

## 6. Diseño "Estadio nocturno"

Lienzo de diseño (privado): https://claude.ai/artifact/KLxUoppYAEDpo5ac9thYhM

- **Colores** (tokens en `index.css`, se usan como `bg-volt`, `text-gris`, etc.): `noche` #07090D (fondo), `grada` #0F141C (tarjetas), `pasto` #151C27 (filas), `linea` #232D3C (bordes), `tiza` #F2F5F9 (texto), `niebla`/`gris` (texto secundario), `volt` #C8FF2E (acento, ganada), `ambar` (pendiente), `roja` (perdida, errores).
- **Fuentes** (Google Fonts en `index.html`): `font-display` Barlow Condensed 800 (títulos en cursiva y mayúsculas), `font-body` Manrope, `font-cifras` JetBrains Mono (montos, cuotas).
- Marca provisoria: **APUESTAS.CL** (placeholder; está en `Navigation.jsx`).
- Filas de partido con nombres largos: grilla `local | VS o marcador | visita` (`minmax(0,1fr) auto minmax(0,1fr)`); los nombres pasan a otra línea en vez de cortarse.

## 7. Historial de lo trabajado

### Sesión 1
Proyecto completo, grupos con WhatsApp, migración a Supabase (pooler + SSL), reorganización del repo, arreglo del saldo que no se actualizaba al apostar.

### Sesión 2
1. **Rediseño completo** (`cfe7c74`): todas las páginas en Tailwind con el tema oscuro, navegación con barra inferior en móvil, cupón de apuesta, Mis apuestas con resumen y filtros, grupos con ranking y WhatsApp, estadísticas y páginas legales.
2. **Errores corregidos:** el registro no guardaba la sesión; Estadísticas no mostraba resultados; el detalle de grupo mostraba IDs.
3. **Backend enriquecido** (`cabbe99`) y **liquidación de apuestas** (`dfded8d`, `423679f`, `4933743`).
4. **Forma de trabajo con ramas:** rama desde `main`, commit y push solo cuando el usuario lo pide, luego merge fast-forward a `main` y se borra la rama.

### Sesión 3
1. **Panel de administración** (`561f93a`): migración 002, `requireAdmin`, rutas `/api/admin`, `npm run admin` y página `/admin`.
2. **Bug de zona horaria corregido** (`config/database.js`): los `TIMESTAMP` se leen y escriben como UTC.
3. `enTransaccion` en `config/database.js`.

### Sesión 4 (2026-09-27)
1. **`API_URL`** (`8e4057f`, en `main`): el frontend ya no tiene `http://localhost:5000` fijo.
2. **QA completo** (`8e4057f`, en `main`): 48 casos de API y recorrido del frontend. Errores corregidos:
   - El registro aceptaba emails inválidos y contraseñas débiles (el backend no usaba `validators.js`).
   - Se podía apostar $0,001 (quedaba una apuesta de $0,00) y el backend no aplicaba el máximo de $100.000.
   - Ids con texto, nombres largos o tipos incorrectos daban **error 500** y algunos exponían mensajes de Postgres.
   - Crear grupo no era atómico.
   - Las rutas inexistentes mostraban una página en blanco (ahora `pages/NotFound.jsx`).
3. **Partidos reales**: migración 003 (8 clubes con escudo en `utils/futbol.js`) y 9 partidos (fecha 23 pendiente + fecha 24), horario de Chile (UTC-3). Fuentes: ESPN, Cooperativa, Emol y En Cancha. U. de Chile vs Ñublense se reprogramó al lunes 12/10 18:00 en el Santa Laura.
4. **Partidos de ejemplo 2 a 5 suspendidos** con `npm run liquidar -- <id> --anular` (devueltos $150 a juan y $10 al admin).
5. **Panel `/admin` en móvil** (`352aae1`, rama `creditos-enteros`): probado con playwright-cli a 390 px; nombres cortados y marcador partido, arreglado.
6. **Créditos enteros** (rama `creditos-enteros`, sin commit): migración 004, `creditosDe`/`pagoDe`, `services/apuestas.js` con la apuesta completa en una transacción (antes la revisión del partido quedaba fuera y podía quedar una apuesta pendiente en un partido ya liquidado), frontend sin `parseFloat`, cupón solo con enteros, redondeo explicado en `/terminos`, 11 pruebas nuevas.
7. **Reglas nuevas del usuario** (sección 0). Antes de esa regla se usó la base de producción para el QA y la carga de partidos; los datos de prueba se borraron, salvo la cuenta id 9.
8. Se instaló `playwright-cli` global y su skill para Claude.

## 8. Próximos pasos

- [ ] **Aplicar la migración 004** (usuario) y unir `creditos-enteros` a `main` (ver sección 2).
- [ ] **Quitar la cuenta de prueba** id 9 (usuario).
- [ ] **Base de pruebas** (local o Supabase aparte) para QA con datos. Luego conviene un `.env.test` (que tampoco se commitea) y un `.env.example` sin credenciales.
- [ ] **Completar las páginas legales** antes de publicar (resaltado en ámbar en `pages/Legal.jsx`): nombre del responsable, correo de contacto, edad mínima (puesta en 18) y plazos (puestos en 30 días). Idealmente, revisión de un abogado (Ley 19.628 y su reforma).
- [ ] Decidir el nombre de la marca (hoy "APUESTAS.CL").
- [ ] Cargar la **fecha 25** (fin de semana del 24-25 de octubre) cuando la ANFP publique los horarios; liquidar los partidos reales a medida que se jueguen (el primero es el 2 de octubre).
- [ ] Magallanes y Deportes Iquique no juegan la Primera 2026, pero siguen en `TEAMS` (`utils/futbol.js`) y aparecen en la tabla de posiciones.
- [ ] No hay forma de **revertir una liquidación** si se carga un marcador equivocado (hoy habría que corregirlo a mano en la base).
- [ ] Los partidos de ejemplo no guardan `equipo_local_id`/`equipo_visitante_id` (los creados desde el panel sí).
- [ ] Los logs de depuración de `middleware/auth.js` siguen activos (imprimen el header `Authorization` completo con el token).
- [ ] Avisos de React Router sobre las "future flags" de v7 en la consola (no rompen nada).
- [ ] La tabla `apuestas_grupo` no se usa.
- [ ] Opcional: permitir que cualquier miembro (no solo el admin) genere el enlace de WhatsApp.

## 9. Cuidados y gotchas

### Datos y seguridad
- **Nunca usar la base de producción** (sección 0). Tampoco navegar el sitio con el backend local en pruebas que creen datos, porque ese backend escribe en producción.
- **Nunca hacer commit de `.env`** (está en `.gitignore`). Nunca escribir contraseñas ni tokens en archivos versionados ni en el chat.
- Cambios de base de datos: migración nueva en `database/migraciones/` (numerada, que se pueda correr más de una vez, dentro de `BEGIN/COMMIT`), actualizar `schema.sql` y **que la aplique el usuario**.

### Verificar en el navegador con playwright-cli (sin tocar la base)
- Simular **toda** la API con `page.route('**/api/**', ...)` y abortar lo no previsto. Así las peticiones nunca llegan al backend. Guardar el token y el usuario simulados en `localStorage` antes de navegar.
- Correr los scripts con `playwright-cli -s=<sesion> --raw run-code --filename=script.js`. En ese entorno **no existe `URL`**: sacar la ruta con `req.url().split('/api/')[1]`.
- Móvil: `playwright-cli open --device="iPhone 13"` (390 × 844). Cerrar con `playwright-cli -s=<sesion> close`.
- Botones de cuota en Partidos: su nombre accesible es `Local: cuota 1.85`, `Empate: cuota 3.20` y `Visita: cuota 4.10`.
- Guardar capturas y scripts en la carpeta temporal de Claude, no en el repo.
- Claude in Chrome dio problemas: las capturas fallaban y `resize_window` no cambiaba el ancho. Para móvil, mejor playwright-cli.

### Código
- **Tailwind v4 con preflight:** la base está en `index.css` (`@layer base`). No hay CSS por página; todo va con clases de Tailwind y los tokens del tema.
- **Llamadas a la API:** usar siempre `${API_URL}/...` de `utils/api.js`, nunca `http://localhost:5000`.
- Reutilizar `utils/futbol.js` (`formatMoney`, `pagoPotencial`…), `Crest` y `AuthLayout` en vez de duplicar formatos o estilos.
- Si cambias cuotas o la regla de pago, cámbialas en **backend y frontend** (`CUOTAS`/`pagoDe` ↔ `ODDS`/`pagoPotencial`).
- Todo lo que mueva saldo: función en `services/` que recibe `client`, llamada con `enTransaccion`, probada con un cliente falso en `tests/`.
- **Fechas:** en la base todo `TIMESTAMP` es UTC. No quitar la configuración de `config/database.js`. Desde el frontend, enviar fechas con `toISOString()`.
- En Windows, `curl` desde Git Bash puede enviar texto con tildes mal codificado; para probar la API con acentos es mejor usar Node.
- Si Claude levanta servidores en segundo plano, debe **detenerlos al terminar**: ocupan los puertos 3000 y 5000 y hacen caer el `npm run dev` del usuario.
