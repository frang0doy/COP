# Guía de Configuración - COP E-commerce

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-aqui
MP_ACCESS_TOKEN=tu-mercadopago-access-token
```

### Generar NEXTAUTH_SECRET

Puedes generar un secret seguro usando:
```bash
openssl rand -base64 32
```

### Obtener MP_ACCESS_TOKEN

1. Crea una cuenta en [Mercado Pago Developers](https://www.mercadopago.com.mx/developers)
2. Crea una aplicación
3. Obtén tu Access Token desde el panel de desarrolladores
4. Para pruebas, usa las credenciales de prueba (test credentials)

## Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
├── app/                    # Rutas y páginas (App Router de Next.js)
│   ├── api/               # API routes
│   ├── auth/              # Páginas de autenticación
│   ├── productos/         # Catálogo de productos
│   ├── carrito/           # Carrito de compras
│   ├── checkout/          # Proceso de pago
│   ├── pedidos/           # Historial de pedidos
│   └── perfil/            # Perfil de usuario
├── components/            # Componentes React
│   ├── landing/          # Componentes de la landing page
│   ├── products/         # Componentes de productos
│   ├── cart/             # Componentes del carrito
│   └── layout/           # Componentes de layout
├── context/              # Context providers (Carrito)
├── types/               # Definiciones de tipos TypeScript
└── public/              # Archivos estáticos
```

## Características Implementadas

✅ Landing page moderna y visual
✅ Catálogo de productos con búsqueda y filtros
✅ Carrito de compras con persistencia en localStorage
✅ Sistema de autenticación con NextAuth
✅ Integración con Mercado Pago
✅ Historial de pedidos
✅ Perfil de usuario
✅ Diseño responsive
✅ Gestión de stock

## Próximos Pasos para Producción

1. **Base de Datos**: Integrar una base de datos (PostgreSQL, MongoDB, etc.)
2. **Autenticación Real**: Implementar registro y login real con base de datos
3. **Gestión de Productos**: Panel de administración para gestionar productos
4. **Webhooks de Mercado Pago**: Implementar webhooks para actualizar pedidos
5. **Imágenes**: Integrar un servicio de almacenamiento de imágenes (Cloudinary, AWS S3)
6. **Email**: Configurar envío de emails de confirmación
7. **SEO**: Optimizar meta tags y agregar sitemap
8. **Analytics**: Integrar Google Analytics o similar

## Notas de Desarrollo

- Los productos actualmente están hardcodeados en `components/products/ProductsList.tsx`
- Los pedidos están hardcodeados en `components/orders/OrdersList.tsx`
- La autenticación actualmente acepta cualquier email/password para demo
- En producción, necesitarás implementar una base de datos real

## Soporte

Para más información sobre Next.js, consulta la [documentación oficial](https://nextjs.org/docs).




