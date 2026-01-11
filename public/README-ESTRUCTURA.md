# Estructura de Archivos - COP

## 📁 Organización de Carpetas

### `/public/images/`
**Imágenes de la página principal**
- Hero slider
- Imágenes de secciones (Features, Testimonios, etc.)
- Logo y otros assets generales

**Ejemplo de uso:**
```
/images/hero-1.jpg
/images/hero-2.jpg
/images/feature-1.jpg
/images/logocop.png
```

---

### `/public/images/products/`
**Imágenes de productos**
- Una imagen por producto
- Nomenclatura recomendada: `producto-{id}.jpg` o `{sku}.jpg`

**Ejemplo de uso:**
```
/images/products/producto-1.jpg
/images/products/ADH-001.jpg
/images/products/producto-15.jpg
```

**En el código:**
```typescript
{
  id: 1,
  name: 'Adhesivo Cerámico Premium',
  image: '/images/products/producto-1.jpg',
  // ...
}
```

---

### `/public/documents/fichas-tecnicas/`
**Fichas técnicas (PDFs)**
- Un PDF por producto
- Nomenclatura recomendada: `producto-{id}-ficha-tecnica.pdf` o `{sku}-ficha-tecnica.pdf`

**Ejemplo de uso:**
```
/documents/fichas-tecnicas/producto-1-ficha-tecnica.pdf
/documents/fichas-tecnicas/ADH-001-ficha-tecnica.pdf
/documents/fichas-tecnicas/producto-15-ficha-tecnica.pdf
```

**En el código:**
```typescript
{
  id: 1,
  name: 'Adhesivo Cerámico Premium',
  technicalSheet: '/documents/fichas-tecnicas/producto-1-ficha-tecnica.pdf',
  // ...
}
```

---

## 📝 Convenciones de Nomenclatura

### Imágenes de Productos
- **Recomendado:** `producto-{id}.jpg` (ej: `producto-1.jpg`)
- **Alternativa:** `{sku}.jpg` (ej: `ADH-001.jpg`)
- **Formatos:** `.jpg`, `.jpeg`, `.png`, `.webp`

### Fichas Técnicas
- **Recomendado:** `producto-{id}-ficha-tecnica.pdf` (ej: `producto-1-ficha-tecnica.pdf`)
- **Alternativa:** `{sku}-ficha-tecnica.pdf` (ej: `ADH-001-ficha-tecnica.pdf`)
- **Formato:** `.pdf`

---

## 🔗 Cómo Agregar Productos

1. **Sube la imagen del producto** a `/public/images/products/`
2. **Sube la ficha técnica** a `/public/documents/fichas-tecnicas/`
3. **Actualiza el código** en `components/products/ProductsList.tsx` y `components/products/ProductDetail.tsx`:

```typescript
{
  id: 17,
  name: 'Nuevo Producto',
  description: 'Descripción del producto',
  price: 2000,
  category: 'ADHESIVOS',
  stock: 50,
  sku: 'ADH-004',
  image: '/images/products/producto-17.jpg',
  technicalSheet: '/documents/fichas-tecnicas/producto-17-ficha-tecnica.pdf',
}
```

---

## ✅ Checklist al Agregar un Producto

- [ ] Imagen del producto subida a `/images/products/`
- [ ] Ficha técnica subida a `/documents/fichas-tecnicas/`
- [ ] Producto agregado en `ProductsList.tsx`
- [ ] Producto agregado en `ProductDetail.tsx` (si usa datos mock separados)
- [ ] Rutas de imagen y ficha técnica correctas en el código
- [ ] Verificar que la imagen se muestra correctamente
- [ ] Verificar que el botón de descarga funciona



