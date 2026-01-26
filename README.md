# COP - E-commerce de Materiales de Construcción

Sitio web y e-commerce para COP, líder en materiales de construcción en México.

## Características

- 🏠 Landing page moderna y visual
- 🛍️ Catálogo completo de productos
- 💳 Integración con Mercado Pago
- 🔐 Sistema de autenticación
- 📦 Gestión de stock en tiempo real
- 📊 Historial de compras
- 📱 Diseño responsive

## Tecnologías

- Next.js 14
- TypeScript
- Tailwind CSS
- NextAuth.js
- Mercado Pago SDK
- Framer Motion

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Variables de Entorno

Crea un archivo `.env.local` con:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-aqui
MP_ACCESS_TOKEN=tu-mercadopago-access-token
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
```

## Build

```bash
npm run build
npm start
```




