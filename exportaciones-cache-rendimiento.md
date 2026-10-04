# Exportaciones de reportes: caché, límite de tamaño y rendimiento

HU **Optimizar y habilitar la descarga de exportaciones de reportes**.

```
GET /api/v1/reports/{id}/export?format=pdf|sarif
```

| Respuesta | Cuándo |
|---|---|
| `200` + `X-Cache: HIT` | El archivo se sirvió desde la caché |
| `200` + `X-Cache: MISS` | El archivo se generó en esta solicitud y quedó en caché |
| `400` `UNSUPPORTED_FORMAT` | Formato no soportado |
| `404` | El reporte no existe |
| `409` `REPORT_INTEGRITY_ERROR` | El checksum no coincide con el contenido; se verifica **siempre**, también cuando hay archivo en caché |
| `422` `EXPORT_TOO_LARGE` | El archivo supera `MAX_EXPORT_SIZE_MB`; el cuerpo incluye `maxSizeMb` y `sizeBytes` |
| `500` `SARIF_VALIDATION_ERROR` | El SARIF generado no cumple el schema (ver [sarif-mapping.md](sarif-mapping.md)) |

## Caché de exportaciones

Implementación en `segsoft-backend`:

- `export/cache/ExportFileCache.java`: la caché.
- `export/cache/ExportCacheCleanupJob.java`: la limpieza periódica.
- `service/ReportService#export`: el flujo de exportación.

### Clave e invalidación

```
{reportId}_{format}_{checksum}      p. ej. c790c29b-…-ec90404a0219_pdf_6df94a45…3d02
```

- El **checksum** (SHA-256 del contenido del reporte) forma parte de la clave.
  Si el contenido cambia, cambia el checksum y la clave anterior deja de
  usarse, así que nunca se sirve una exportación vieja de un reporte modificado.
- Antes de buscar en la caché se **verifica la integridad**: si alguien altera
  el contenido sin actualizar el checksum, la respuesta es `409` aunque exista
  un archivo cacheado.
- La clave se valida con una expresión estricta (UUID, formato alfanumérico y
  64 caracteres hexadecimales). Ningún valor de la base de datos puede inyectar
  una ruta en el sistema de archivos.

### Almacenamiento y expiración

| Aspecto | Comportamiento |
|---|---|
| Ubicación | `EXPORT_CACHE_DIR` (por defecto `${java.io.tmpdir}/pdgseg-export-cache`); un archivo `<clave>.export` por exportación, con permisos `0600` |
| Escritura | Archivo temporal + `ATOMIC_MOVE`: nunca se sirve un archivo a medio escribir |
| TTL | `EXPORT_CACHE_TTL` (ISO-8601, por defecto `PT1H`), contado desde la generación; leer el archivo no lo extiende. `PT0S` desactiva la caché |
| Expirados | Se descartan al leerlos y además los elimina `ExportCacheCleanupJob` cada `EXPORT_CACHE_CLEANUP_INTERVAL` (por defecto `PT15M`), junto con temporales abandonados |
| Arranque | La caché se vacía al iniciar la aplicación: las exportaciones las renderiza el código desplegado, y un archivo de una versión anterior podría tener otra plantilla u otras reglas de enmascarado |
| Concurrencia | Un candado por clave: varias solicitudes simultáneas del mismo archivo esperan una única generación (en los tests, 8 hilos producen 1 generación) |
| Fallos de disco | Se registran y se tratan como MISS; la caché nunca hace fallar una descarga |

Cada descarga queda en la auditoría (`REPORT_EXPORTED`, con `cache: HIT|MISS`).

## Tamaño máximo de exportación

`MAX_EXPORT_SIZE_MB` (por defecto **50**). Si el archivo generado lo supera:

- se responde **`422 EXPORT_TOO_LARGE`** con un mensaje que indica el tamaño y
  el límite, por ejemplo: *"El archivo exportado ocupa 61.0 MB y supera el
  tamaño máximo permitido de 50 MB (MAX_EXPORT_SIZE_MB)…"*;
- **no se guarda en caché**, de modo que el siguiente intento vuelve a evaluarse;
- un archivo que ya estaba en caché también se rechaza si el límite se redujo
  después de guardarlo.

Tests con límite reducido (1 MB): `ExportSizeLimitTest`,
`ReportServiceTest#export_aFileAboveTheLimitIsRejectedAndNeverCached` y
`ReportServiceTest#export_aCachedFileAboveALoweredLimitIsRejected`.

## Variables de configuración

| Variable | Propiedad | Por defecto |
|---|---|---|
| `MAX_EXPORT_SIZE_MB` | `report.export.max-size-mb` | `50` |
| `EXPORT_CACHE_DIR` | `report.export.cache.dir` | `${java.io.tmpdir}/pdgseg-export-cache` |
| `EXPORT_CACHE_TTL` | `report.export.cache.ttl` | `PT1H` |
| `EXPORT_CACHE_CLEANUP_INTERVAL` | `report.export.cache.cleanup-interval` | `PT15M` |

## Rendimiento medido

Objetivo de la HU: una exportación servida desde caché (`X-Cache: HIT`) responde
en **menos de 200 ms**.

**Entorno:** Intel Core i5-11300H (8 hilos, 3.1 GHz), 15 GB de RAM, OpenJDK
17.0.19, PostgreSQL 18.4 local, SSD. Backend en un único proceso
(`java -jar`), sin réplicas. Fecha: 2026-10-04.

### 1. Servicio, sin base de datos (`ReportExportCachePerformanceTest`)

Se mide el camino real de exportación (`ReportService` con los exportadores
PDF y SARIF reales, validación de schema y caché en disco) sobre un reporte
grande de **500 hallazgos**. Solo el repositorio está simulado. Corre en cada
`mvn test`, también sin Docker.

| Formato | Tamaño | MISS (genera) | HIT p50 | HIT p95 | HIT máx. | n |
|---|---|---|---|---|---|---|
| PDF | 120 KB | 584.7 ms | 0.78 ms | 1.18 ms | 2.66 ms | 50 |
| SARIF | 484 KB | 132.8 ms | 1.32 ms | 1.54 ms | 1.60 ms | 50 |

El test falla si el p95 o el máximo de los HIT llegan a 200 ms.

### 2. HTTP con base de datos (`ReportExportIntegrationTest#cachedExports_respondInLessThan200Ms`)

Petición HTTP completa vía MockMvc: filtro JWT, autorización, consulta del
reporte en PostgreSQL, verificación del checksum y lectura de la caché.

| Formato | HIT p50 | HIT p95 | HIT máx. | n |
|---|---|---|---|---|
| PDF | 6.09 ms | 7.56 ms | 7.67 ms | 30 |
| SARIF | 4.78 ms | 6.35 ms | 10.74 ms | 30 |

### 3. Aplicación en ejecución (`curl`)

`curl` contra `localhost:8080`, con un reporte real de 49 hallazgos (el del
repositorio SegSoft-Pruebas). Se hizo 1 MISS, 5 solicitudes de calentamiento y
50 HIT medidos con `%{time_total}`.

| Formato | Tamaño | MISS | HIT p50 | HIT p95 | HIT máx. |
|---|---|---|---|---|---|
| PDF | 40 KB | 456.0 ms | 7.6 ms | 9.0 ms | 9.5 ms |
| SARIF | 78 KB | 77.7 ms | 5.1 ms | 6.1 ms | 7.0 ms |

### Lectura de los resultados

- Con la caché, un PDF repetido se sirve unas **60 veces más rápido**
  (456 → 7.6 ms) y un SARIF unas 15 veces (78 → 5 ms). Todos los HIT quedan
  **más de un orden de magnitud por debajo** del objetivo de 200 ms.
- En un HIT, el tiempo se va casi todo en la autenticación, la consulta del
  reporte y el SHA-256 de integridad; leer el archivo cuesta alrededor de 1 ms.
- El costo evitado es el render: el PDF es la exportación más cara (más de
  450 ms para un reporte mediano), y es la que más se beneficia.

### Cómo repetir las mediciones

```bash
# 1. Servicio (sin base de datos)
mvn test -Dtest=ReportExportCachePerformanceTest | grep '\[export-cache\]'

# 2. HTTP con base de datos (requiere PostgreSQL/Testcontainers)
mvn test -Pintegration-tests -Dtest=ReportExportIntegrationTest | grep '\[export-cache-http\]'

# 3. Aplicación en ejecución
TOKEN=$(curl -s -X POST localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"auditor","password":"auditor123"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')
for i in $(seq 1 50); do
  curl -s -o /dev/null -w '%{time_total}\n' -H "Authorization: Bearer $TOKEN" \
    "localhost:8080/api/v1/reports/<id>/export?format=pdf"
done
```

## Descarga desde la interfaz

`segsoft-frontend`:

- **Lista de reportes** (`/reports`, menú *Reportes*): reportes generados, del
  más reciente al más antiguo, con cumplimiento, hallazgos e integridad.
- **Vista del reporte** (`/reports/:id`): resumen, metadatos y los botones
  **Descargar PDF** y **Descargar SARIF**.
  - Solo se muestran a **AUDITOR** y **SECURITY_ADMIN**, y para reportes en
    estado **GENERATED**.
  - Mientras se genera el archivo, el botón muestra un indicador ("Generando
    PDF…") y queda deshabilitado; un segundo clic no envía otra solicitud.
  - El archivo se descarga con el nombre de `Content-Disposition`; si vino de
    la caché, se indica "(desde caché)".
  - Errores con mensajes comprensibles: `409` (integridad), `422` (el mensaje
    del servidor con el límite), `500` (con el `traceId` para reportarlo),
    `403`, `404` y fallos de red.
- **Resultados del análisis:** el botón **Generar reporte** congela el análisis
  en un reporte y abre su vista.

El backend expone `X-Cache` y `Content-Disposition` por CORS para que el SPA
pueda leerlos.
