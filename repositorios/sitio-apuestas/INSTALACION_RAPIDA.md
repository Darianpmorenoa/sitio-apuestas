# 🚀 Guía de Instalación Rápida

## Paso 1️⃣: Preparar PostgreSQL

1. Abre PostgreSQL (pgAdmin o línea de comandos)
2. Crea la base de datos:
```sql
CREATE DATABASE apuestas_deportivas;
```

3. Ejecuta el script SQL:
```bash
psql -U postgres -d apuestas_deportivas -f database/schema.sql
```

## Paso 2️⃣: Instalar Backend

```bash
cd backend
npm install
```

## Paso 3️⃣: Configurar Backend

Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales PostgreSQL:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=apuestas_deportivas
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
JWT_SECRET=tu_clave_secreta_aqui
```

## Paso 4️⃣: Instalar Frontend

```bash
cd frontend
npm install
```

## Paso 5️⃣: Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend corriendo en `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend corriendo en `http://localhost:3000`

## 🎯 Probar la Aplicación

1. Abre `http://localhost:3000` en tu navegador
2. Haz clic en "Registro"
3. Completa el formulario y crea tu cuenta
4. Inicia sesión
5. ¡Comienza a apostar! ⚽

## 📊 Datos de Ejemplo

La base de datos viene con:
- 10 equipos de la Primera División Chilena
- 5 partidos de ejemplo listos para apostar
- Saldo inicial: $1000 por usuario

## ❌ Solución de Problemas

### Error de conexión a BD
- Verifica que PostgreSQL esté corriendo
- Comprueba las credenciales en `.env`
- Asegúrate que la BD se creó correctamente

### Puerto 5000/3000 ya en uso
- Cambia el puerto en `.env` (backend) o `vite.config.js` (frontend)

### Error al instalar dependencias
```bash
npm install --legacy-peer-deps
```

---

¡Listo! Ya tienes tu sitio de apuestas funcionando 🎉
