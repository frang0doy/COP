## Importar stock y precios desde Excel (.xlsx)

Este proyecto puede actualizar productos **por SKU**, **por Nombre** o **por ID**.

### Requisitos

- Un Excel `.xlsx` con columnas que incluyan:
  - **Precio** (pesos ARS; se guardará como entero)
  - **Stock** (entero)

Y además, **una** de estas opciones para identificar el producto:

- **Nombre/Producto** (si no tenés códigos), o
- **SKU** (si existe en tu catálogo), o
- **ID** (si ya manejás IDs internos).

El importador intenta detectar columnas automáticamente (por nombres como `SKU`, `Precio`, `Stock`, `Nombre`, `Producto`, `ID`, etc.).

### Importar por nombre (recomendado si no tenés códigos)

```bash
npm run import:products -- --file "ruta/al/archivo.xlsx" --matchBy name --dry-run
```

Si el resultado se ve bien, ejecutá sin `--dry-run`:

```bash
npm run import:products -- --file "ruta/al/archivo.xlsx" --matchBy name
```

Notas:

- El nombre se **normaliza** (quita acentos/símbolos y espacios extra).
- Si hay **dos productos con el mismo nombre normalizado**, se marca como **Ambiguo** y no se actualiza esa fila.

### Cómo ejecutar (recomendado: primero dry-run)

```bash
npm run import:products -- --file "ruta/al/archivo.xlsx" --matchBy sku --dry-run
```

Si el resultado se ve bien, ejecutá sin `--dry-run`:

```bash
npm run import:products -- --file "ruta/al/archivo.xlsx" --matchBy sku
```

### Si tus columnas tienen nombres raros

Podés forzar el nombre exacto de columna:

```bash
npm run import:products -- --file "archivo.xlsx" --matchBy name --nameCol "PRODUCTO" --priceCol "PRECIO" --stockCol "STOCK"
```

### Notas

- Si un identificador no existe en la BD, se reporta como “No encontrado” y **no se crea** automáticamente.
- El precio se interpreta como ARS y se redondea a entero.

