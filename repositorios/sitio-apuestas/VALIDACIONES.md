# 🔒 Validaciones de Autenticación y Autorización

## Resumen de Mejoras

Se han implementado validaciones robustas en **autenticación** y **autorización** para garantizar que los usuarios se registren correctamente y puedan usar la plataforma de forma segura.

---

## 📋 Validaciones en el Frontend

### **Registro (Register.jsx)**

✅ **Validación de Nombre:**
- Mínimo 3 caracteres
- Máximo 100 caracteres
- No puede estar vacío

✅ **Validación de Email:**
- Formato válido (ejemplo@dominio.com)
- No puede estar vacío
- Se convierte a minúsculas antes de enviar

✅ **Validación de Contraseña:**
- Mínimo 6 caracteres
- Debe contener al menos 1 mayúscula
- Debe contener al menos 1 número
- No puede estar vacía

✅ **Validación de Confirmación:**
- Las dos contraseñas deben coincidir

### **Login (Login.jsx)**

✅ **Validación de Email:**
- Formato válido
- No puede estar vacío

✅ **Validación de Contraseña:**
- No puede estar vacía
- La contraseña se limpia después de error de login

### **Apuestas (Matches.jsx)**

✅ **Validación de Monto:**
- Debe ser mayor a 0
- No puede exceder el saldo del usuario
- Máximo $100,000 por apuesta
- Debe ser un número válido

✅ **Cálculo de Ganancia:**
- Se muestra la ganancia potencial en tiempo real

---

## 🔐 Validaciones en el Backend

### **Validador de Email** (validators.js)
```javascript
Regresa: true/false
Patrón: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

### **Validador de Contraseña** (validators.js)
```javascript
✓ Mínimo 6 caracteres
✓ Contiene mayúscula
✓ Contiene número
Retorna: { valid: boolean, error: string }
```

### **Validador de Nombre** (validators.js)
```javascript
✓ Mínimo 3 caracteres
✓ Máximo 100 caracteres
Retorna: { valid: boolean, error: string }
```

### **Validador de Apuestas** (validators.js)
```javascript
✓ Monto > 0
✓ Monto <= saldo del usuario
✓ Monto <= $100,000
Retorna: { valid: boolean, error: string }
```

---

## 👤 Controlador de Autenticación (auth.js)

### **Register**

**Validaciones:**
1. ✅ Verifica que email, contraseña y nombre existan
2. ✅ Valida formato de email
3. ✅ Valida requisitos de contraseña
4. ✅ Valida requisitos de nombre
5. ✅ Verifica que el email NO esté registrado
6. ✅ Encripta la contraseña con bcrypt (10 rounds)
7. ✅ Genera JWT token automáticamente
8. ✅ Retorna token + datos del usuario

**Errores posibles:**
- "Email, contraseña y nombre son requeridos"
- "Email inválido"
- "La contraseña debe tener al menos 6 caracteres"
- "La contraseña debe contener al menos una mayúscula"
- "La contraseña debe contener al menos un número"
- "El nombre debe tener al menos 3 caracteres"
- "El nombre no debe exceder 100 caracteres"
- "Este email ya está registrado"

### **Login**

**Validaciones:**
1. ✅ Verifica que email y contraseña existan
2. ✅ Valida formato de email
3. ✅ Busca usuario por email (insensible a mayúsculas)
4. ✅ Compara contraseña con bcrypt
5. ✅ Genera JWT token con expiración 24h
6. ✅ Retorna token + datos del usuario

**Errores posibles:**
- "Email y contraseña son requeridos"
- "Email inválido"
- "Credenciales inválidas"

### **Verify Token**

**Propósito:** Verificar que el token sea válido y devolver datos del usuario

**Validaciones:**
1. ✅ Verifica presencia del token
2. ✅ Valida firma del JWT
3. ✅ Verifica que el usuario aún exista en BD
4. ✅ Retorna datos actualizados del usuario

**Errores posibles:**
- "Token no proporcionado"
- "Usuario no encontrado"
- "Token inválido o expirado"

---

## 🛡️ Autorización

### **Middleware de Autenticación** (middleware/auth.js)

```javascript
verifyToken(req, res, next)
```

**Función:** Valida el JWT en cada petición protegida

**Ubicación del token:** `Authorization: Bearer <token>`

**Errores:**
- "Token no proporcionado" → 401
- "Token inválido" → 401

### **Rutas Protegidas**

Las siguientes rutas requieren autenticación:
- ✅ POST `/api/bets` - Crear apuesta
- ✅ GET `/api/bets` - Obtener apuestas del usuario
- ✅ GET `/api/bets/:id` - Obtener detalles de apuesta
- ✅ GET `/api/auth/verify` - Verificar token

### **Rutas Públicas**

Las siguientes rutas NO requieren autenticación:
- ✅ POST `/api/auth/register` - Registrar
- ✅ POST `/api/auth/login` - Login
- ✅ GET `/api/matches` - Ver partidos
- ✅ GET `/api/matches/:id` - Ver detalles partido
- ✅ GET `/api/matches/resultados/historial` - Ver resultados

---

## 💾 Controlador de Apuestas (bets.js)

### **Create Bet**

**Validaciones:**
1. ✅ Verifica que los datos existan (partido_id, monto, predicción)
2. ✅ Valida predicción (solo '1', 'X', '2')
3. ✅ Obtiene saldo actual del usuario
4. ✅ Valida monto con validador
5. ✅ Verifica que el partido exista
6. ✅ Verifica que el partido aún NO ha comenzado
7. ✅ Usa TRANSACCIÓN para seguridad:
   - BEGIN
   - Descuenta saldo
   - Crea apuesta
   - COMMIT (si todo está bien) o ROLLBACK (si hay error)

**Errores posibles:**
- "Partido, monto y predicción son requeridos"
- "Predicción inválida"
- "Usuario no encontrado"
- "El monto debe ser mayor a 0"
- "Saldo insuficiente"
- "El monto máximo es $100,000"
- "Partido no encontrado"
- "No se puede apostar en partidos que ya han comenzado"

---

## 🔄 Flujo de Autenticación en Frontend

```
1. Usuario abre la app
   ↓
2. App.jsx verifica si hay token en localStorage
   ↓
3. Si hay token: POST /api/auth/verify
   ↓
4a. Token válido → Carga datos del usuario
4b. Token inválido → Limpia localStorage, redirige a login
   ↓
5. Loading = false, renderiza la app
   ↓
6. Usuario logueado puede acceder a rutas protegidas
```

---

## 🔐 Seguridad Implementada

✅ **Contraseñas encriptadas** con bcrypt (10 rounds)
✅ **JWT tokens** con expiración 24h
✅ **Validación de email** con regex
✅ **Prevención de inyección SQL** con parameterized queries
✅ **Transacciones ACID** en apuestas
✅ **Emails únicos** en la BD
✅ **Verificación de integridad** del token en cada petición
✅ **Rutas protegidas** con middleware
✅ **Redirecciones** automáticas si token expira

---

## 📝 Requisitos de Contraseña

Para mayor seguridad, se requiere que la contraseña:
- ✓ Tenga **mínimo 6 caracteres**
- ✓ Contenga **al menos 1 mayúscula** (A-Z)
- ✓ Contenga **al menos 1 número** (0-9)

**Ejemplo válido:** `Password123`
**Ejemplos inválidos:**
- `pass` (muy corta)
- `password123` (sin mayúscula)
- `Password` (sin número)

---

## 🧪 Cómo Probar

### **Registro**
1. Ve a http://localhost:3000/register
2. Intenta con datos inválidos (verás errores específicos)
3. Registra con contraseña: `User123`
4. Se loguea automáticamente

### **Login**
1. Ve a http://localhost:3000/login
2. Intenta con credenciales incorrectas
3. Login con datos válidos

### **Apuestas**
1. Intenta apostar más que tu saldo (error)
2. Intenta apostar $0 (error)
3. Intenta apostar $150,000 (error)
4. Apuesta cantidad válida (éxito)

---

¡Tu aplicación ahora es **segura** y **robusta**! 🚀
