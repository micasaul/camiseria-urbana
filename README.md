# 🧵 Camisería Urbana

Plataforma de comercio electrónico para la venta online de camisas de algodón, jean y lino. Desarrollada como Trabajo Integrador Final para la obtención del título de Analista en Sistemas de Información (FCyT – UADER, sede Concepción del Uruguay)

El sistema cubre el ciclo completo de compra: catálogo con filtros, carrito persistente, checkout con cálculo de envío y pago integrado, historial de pedidos, wishlist, reseñas y un panel de administración con métricas, gestión de productos, combos y promociones.

---

## 🚀 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite (SPA) |
| Backend / CMS | Strapi v5 sobre Node.js |
| Base de datos | PostgreSQL |
| Autenticación | Google OAuth 2.0 |
| Pagos | Mercado Pago |
| Correos transaccionales | Nodemailer |
| Deploy frontend | Vercel |
| Exposición backend (demo) | ngrok |
| Gestión de proyecto | ClickUp (Kanban) + GitHub |

---

## ⚙️ Instalación y configuración local

### Requisitos previos

- Node.js v20–v24
- npm
- Git
- PostgreSQL
- ngrok (para exponer el backend en demo)

### 1. Clonar el repositorio

```bash
git clone https://github.com/micasaul/camiseria-urbana.git
cd camiseria-urbana
git checkout main
```

### 2. Instalar dependencias

```bash
# Backend
cd Back-end
npm install

# Frontend
cd ../Front-end
npm install
```

### 3. Crear la base de datos

```sql
CREATE DATABASE tpfi25;
```

### 4. Variables de entorno

**Back-end** — crear `Back-end/.env` (no versionar):

```env
HOST=0.0.0.0
PORT=1337

# Base de datos
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=tpfi25
DATABASE_USERNAME=tu_usuario
DATABASE_PASSWORD=tu_contraseña

# Strapi secrets
APP_KEYS=
API_TOKEN_SALT=
ADMIN_JWT_SECRET=
TRANSFER_TOKEN_SALT=
JWT_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# Mercado Pago
MP_ACCESS_TOKEN=

# Nodemailer
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Solo necesario al exponer con ngrok
PUBLIC_URL=
```

> El origen permitido del frontend se configura en `Back-end/config/cors.js`.

**Front-end** — crear `Front-end/.env`:

```env
VITE_BACKEND_URL=http://localhost:1337
```

---

## ▶️ Ejecución

```bash
# Backend (http://localhost:1337)
cd Back-end
npm run develop

# Frontend (http://localhost:5173)
cd ../Front-end
npm run dev
```

El panel de administración de Strapi queda disponible en `http://localhost:1337/admin`.

---

## 🌐 Deploy (demo con Vercel + ngrok)

1. Iniciar el backend localmente y exponer con ngrok:
   ```bash
   ngrok http 1337
   ```
2. Copiar la URL generada por ngrok.
3. Actualizar `PUBLIC_URL` en `Back-end/.env` y la URL en `Back-end/config/cors.js`.
4. En Vercel, importar el repositorio, definir `Front-end` como directorio raíz y configurar:
   ```
   VITE_BACKEND_URL=https://<tu-url-ngrok>
   ```
5. Ejecutar el deploy.

> ⚠️ La URL gratuita de ngrok cambia cada vez que se reinicia el túnel. Para un entorno productivo real se recomienda migrar la base de datos a un servicio remoto (Railway, Supabase, etc.) y desplegar el backend en un servidor estable.
