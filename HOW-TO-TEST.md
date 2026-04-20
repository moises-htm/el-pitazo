# ⚽ El Pitazo — Cómo probar la app

## Opción A: Probar en tu computadora (rápido)

```bash
# 1. Instalar dependencias
cd el-pitazo
npm install

# 2. Instalar PostgreSQL (si no lo tienes)
# macOS: brew install postgresql
# Windows: descargar de postgresql.org

# 3. Crear base de datos
psql -U postgres -c "CREATE DATABASE el_pitazo;"

# 4. Generar esquema
npx prisma db push

# 5. Crear usuarios de prueba
node scripts/create-test-users.js

# 6. Correr todo
npm run server &   # terminal 1
npm run dev        # terminal 2

# 7. Abrir http://localhost:3000
```

## Opción B: Enviar a tu hijo para probar ( hosting gratis)

### Paso 1: Subir el código a GitHub
```bash
cd el-pitazo
git remote add origin https://github.com/moi/el-pitazo.git
git push origin master
```

### Paso 2: Deploy en Vercel (gratis)
1. Ir a [vercel.com](https://vercel.com)
2. Importar el repo de GitHub
3. Deploy automático
4. Te dará una URL como: `el-pitazo.vercel.app`

### Paso 3: Backend en Railway.app (gratis)
1. Ir a [railway.app](https://railway.app)
2. Crear proyecto PostgreSQL
3. Copiar la DATABASE_URL
4. Crear proyecto Node.js y subir el backend
5. Configurar las variables de entorno

### Paso 4: Enviarle el link
Tu hijo abre `el-pitazo.vercel.app` y usa las credenciales de abajo.

---

## 🔑 Credenciales de prueba

| Rol | Teléfono | Contraseña |
|-----|---------|-----------|
| ⚽ Jugador | +525512345678 | 123456 |
| ⚽ Jugador | +525598765432 | 123456 |
| 🟨 Árbitro | +525511112222 | 123456 |
| 🟨 Árbitro | +525533334444 | 123456 |
| 👔 Organizador | +52555556666 | 123456 |
| 👔 Organizador | +525577778888 | 123456 |
| ⚽🟨👔 Multi-rol | +525599990000 | 123456 |

## 🎯 Qué probar

### Tu hijo como JUGADOR:
- Explorar torneos → ver 1 torneo de prueba creado
- Ver bracket en tiempo real
- Ver estadísticas personales

### Tu hijo como ORGANIZADOR:
- Crear un torneo (elige tipo, fecha, precio)
- Ver el bracket generado automáticamente
- Ver dashboard financiero

### Tu hijo como ÁRBITRO:
- Ver partidos del día
- Confirmar asistencia
- Ver ganancias

---

## 📱 Para App Store (futuro)

Necesitas:
1. Cuenta Apple Developer ($99/año)
2. Cuenta Google Play ($25 único)
3. App icon + screenshots
4. Subir builds (Expo o React Native CLI)

Esto se hace después de que tengas usuarios reales usando la web app.
