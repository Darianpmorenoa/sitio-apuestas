# ⚽ Sitio de Apuestas Deportivas - Fútbol Chileno

Plataforma web completa para realizar apuestas en la Primera División Chilena. Desarrollada con **React**, **Node.js**, **Express** y **PostgreSQL**.

## 🎯 Características Principales

### Autenticación & Usuarios
- ✅ Sistema de registro e inicio de sesión seguro
- ✅ Autenticación con JWT
- ✅ Saldo virtual de $1000 al registrarse
- ✅ Persistencia de datos con localStorage

### Sistema de Apuestas
- ✅ Visualización de partidos disponibles
- ✅ Modal interactivo para realizar apuestas
- ✅ Validación automática de montos y saldo
- ✅ Historial completo de apuestas
- ✅ Gestión de saldo en tiempo real

### Estadísticas del Torneo
- ✅ Tabla de posiciones dinámica
- ✅ Estadísticas generales (partidos, goles, etc.)
- ✅ Últimos resultados
- ✅ Clasificación a torneos internacionales

### Grupos de Apuestas
- ✅ Crear grupos privados
- ✅ Unirse con código de invitación
- ✅ Compartir invitaciones por WhatsApp
- ✅ Ver apuestas del grupo
- ✅ Gestión de miembros (Admin/Miembro)

## 🛠️ Tecnología

### Frontend
- **React 18** - Biblioteca UI
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **CSS3** - Diseño responsivo

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas

## 📋 Instalación

### Requisitos Previos
- Node.js v16+
- PostgreSQL v12+
- npm o yarn

### Paso 1: Clonar Repositorio
```bash
git clone https://github.com/tuusuario/sitio-apuestas.git
cd sitio-apuestas
```

### Paso 2: Configurar Base de Datos
1. Crea una BD en PostgreSQL:
```sql
CREATE DATABASE apuestas_deportivas;
```

2. Ejecuta el script SQL:
```bash
psql -U postgres -d apuestas_deportivas -f database/schema.sql
psql -U postgres -d apuestas_deportivas -f database/grupos.sql
```

### Paso 3: Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales PostgreSQL
```

### Paso 4: Configurar Frontend
```bash
cd ../frontend
npm install
```

## 🚀 Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
El servidor estará disponible en `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
La app estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
sitio-apuestas/
├── backend/
│   ├── config/           # Configuración de BD
│   ├── controllers/      # Lógica de negocio
│   ├── routes/          # Rutas API
│   ├── middleware/      # Autenticación
│   ├── .env.example     # Variables de entorno
│   └── server.js        # Servidor principal
├── frontend/
│   ├── src/
│   │   ├── pages/       # Páginas principales
│   │   ├── components/  # Componentes reutilizables
│   │   ├── App.jsx      # App principal
│   │   └── main.jsx     # Entry point
│   └── index.html       # HTML principal
├── database/
│   ├── schema.sql       # Tablas principales
│   └── grupos.sql       # Tablas de grupos
└── README.md
```

## 🔐 Variables de Entorno (.env)

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apuestas_deportivas
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_clave_secreta
NODE_ENV=development
```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token

### Partidos
- `GET /api/matches` - Obtener partidos disponibles
- `GET /api/matches/:id` - Detalles de partido
- `GET /api/matches/resultados/historial` - Resultados finalizados

### Apuestas
- `POST /api/bets` - Crear apuesta (requiere auth)
- `GET /api/bets` - Obtener apuestas del usuario (requiere auth)
- `GET /api/bets/:id` - Detalles de apuesta (requiere auth)

### Grupos
- `POST /api/grupos` - Crear grupo (requiere auth)
- `GET /api/grupos` - Obtener grupos del usuario (requiere auth)
- `GET /api/grupos/:id` - Detalles del grupo (requiere auth)
- `POST /api/grupos/unirse` - Unirse a grupo (requiere auth)
- `GET /api/grupos/:id/whatsapp` - Generar link WhatsApp (requiere auth)

## 🎮 Usuarios de Prueba

Al registrarse, todos los usuarios comienzan con **$1000** de crédito virtual.

Puedes crear tu propia cuenta o registrarte con:
- Email: `test@example.com`
- Contraseña: `Password123`

## 🌟 Características Destacadas

- 🔐 **Seguridad**: Contraseñas encriptadas, JWT tokens, validaciones en cliente y servidor
- 📱 **Responsivo**: Diseño mobile-first compatible con todos los dispositivos
- ⚡ **Rendimiento**: Carga rápida, optimización de assets
- 🎨 **Interfaz**: Diseño moderno y amigable
- 🤝 **Social**: Sistema de grupos con invitaciones por WhatsApp

## 🚀 Deploy

### Vercel (Frontend)
```bash
cd frontend
vercel
```

### Heroku o Railway (Backend)
```bash
cd backend
git push heroku main
```

## 📝 Licencia

MIT License - ver LICENSE.md para más detalles

## 👨‍💻 Autor

Desarrollado por Darian Moreno

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Si encuentras problemas, abre un issue en GitHub.

---

**¡Disfruta apostando en la Primera División Chilena!** ⚽🇨🇱
