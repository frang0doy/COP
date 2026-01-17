## Importar stock y precios desde Excel (.xlsx)

Este proyecto actualiza productos **por SKU** (no por ID).

### Requisitos

- Un Excel `.xlsx` con columnas que incluyan:
  - **SKU** (ej: `COP-01`)
  - **Precio** (pesos ARS; se guardará como entero)
  - **Stock** (entero)

El importador intenta detectar columnas automáticamente (por nombres como `SKU`, `Precio`, `Stock`).

### Cómo ejecutar (recomendado: primero dry-run)

```bash
npm run import:products -- --file "ruta/al/archivo.xlsx" --dry-run
```

Si el resultado se ve bien, ejecutá sin `--dry-run`:

```bash
npm run import:products -- --file "ruta/al/archivo.xlsx"
```

### Si tus columnas tienen nombres raros

Podés forzar el nombre exacto de columna:

```bash
npm run import:products -- --file "archivo.xlsx" --skuCol "CODIGO" --priceCol "PRECIO" --stockCol "STOCK"
```

### Notas

- Si un SKU no existe en la BD, se reporta como “No encontrado” y **no se crea** automáticamente.
- El precio se interpreta como ARS y se redondea a entero.

