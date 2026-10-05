# Reporte estructurado de cumplimiento

HU **Generar reporte estructurado de cumplimiento**. Al terminar un análisis,
un AUDITOR o SECURITY_ADMIN congela sus resultados en un **reporte inmutable**,
que alimenta la vista técnica, la vista ejecutiva y las exportaciones PDF y
SARIF.

## Endpoints

Todos exigen rol **AUDITOR** o **SECURITY_ADMIN** (403 para el resto).

| Método y ruta | Respuesta |
|---|---|
| `POST /api/v1/analyses/{id}/reports` | `201` + `Location: /api/v1/reports/{reportId}` y cuerpo `{id, analysisId, status, checksum, generatedAt, url}` · `404` si el análisis no existe · `422` si no está `COMPLETED` |
| `GET /api/v1/reports/{id}` | Reporte estructurado, vista técnica · `404` · `409` si el contenido no coincide con su checksum |
| `GET /api/v1/reports/{id}?view=executive` | Vista ejecutiva (ver más abajo) · `400` si `view` no es `technical` ni `executive` |
| `GET /api/v1/reports?repositoryId=…` | Histórico paginado (`page`, `size` ≤ 100), del más reciente al más antiguo; también `?analysisId=…` o sin filtro. Cada fila indica `integrityVerified` |
| `GET /api/v1/reports/{id}/export?format=pdf\|sarif` | Ver [exportaciones-cache-rendimiento.md](exportaciones-cache-rendimiento.md) |

Mensaje del 422 (incluye el estado actual):
`Solo se pueden generar reportes de análisis completados (estado actual: CANCELLED)`.

> El endpoint anterior `POST /api/v1/reports` (con `{analysisId}` en el cuerpo)
> se eliminó y ahora responde `405 Method Not Allowed`.

## Estructura del reporte (`GET /api/v1/reports/{id}`)

| Sección | Contenido |
|---|---|
| `metadata` | `reportId`, `analysisId`, `repositoryId`, `repoName`, rama, `generatedAt`, `generatedBy`, inicio y fin del análisis, reglas ejecutadas |
| `executiveSummary` | % de cumplimiento global y ponderado, total de políticas (cumplen / no cumplen / en revisión), total de hallazgos, altos y críticos, `highestSeverity`, errores de reglas y **recomendaciones priorizadas** |
| `policyResults` | Estado de cada política: categoría, marco, control, peso y hallazgos *(solo vista técnica)* |
| `findingsBySeverity` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` con `count` y, en la vista técnica, los hallazgos con ubicación y evidencia enmascarada |
| `claudeCodeSecurityCoverage` | Siempre las **5 categorías** del catálogo: políticas evaluadas, cumplen / no cumplen / revisión, hallazgos y % de cumplimiento (`null` = sin cobertura) |
| `frameworkCoverage` | Resumen por marco (ISO 27001, OWASP Top 10, OWASP ASVS, NIST SP 800-53…), con los **controles** evaluados y su peor estado *(controles solo en la vista técnica)* |
| `traceabilityReference` | Enlaces de *drill-down*: el propio reporte en ambas vistas, el histórico del repositorio, el análisis, sus resultados y hallazgos, la plantilla del detalle de hallazgo, las exportaciones y, por política, su ficha y su trazabilidad |

Además: `id`, `status` (`GENERATED`), `view`, `schemaVersion`, `checksum`,
`integrityVerified` y `exportFormats`.

**Contrato:** el documento valida contra
[`structured-report.schema.json`](https://github.com/JEGH18/segsoft-backend/blob/main/src/main/resources/report/structured-report.schema.json)
(JSON Schema draft-07). El schema también garantiza que la vista ejecutiva **no**
incluye `policyResults`, hallazgos individuales ni controles.

### Vista técnica y vista ejecutiva

| | Técnica | Ejecutiva |
|---|---|---|
| Métricas, recomendaciones, severidades | ✓ | ✓ |
| 5 categorías de Claude Code Security | ✓ | ✓ |
| Cobertura por marco | ✓ con controles | ✓ sin controles |
| Resultados por política | ✓ | — |
| Hallazgos, rutas y snippets de evidencia | ✓ | — |

### Recomendaciones

Una por cada política que no cumple o requiere revisión (máximo 10). Se ordenan
de la más urgente a la menos urgente: primero la severidad más alta de sus
hallazgos, luego la cantidad de hallazgos altos o críticos y por último el peso
de la política. La acción es la sugerencia que más se repite en sus hallazgos;
si no traen ninguna, se usa una acción genérica.

## Inmutabilidad

Los resultados se **copian** al contenido del reporte al generarlo. Cambios
posteriores en el repositorio, las políticas, las reglas o los hallazgos no
llegan a un reporte existente: el reporte nunca se actualiza solo.

Tres capas lo garantizan:

1. **Aplicación:** la entidad `Report` es `@Immutable` de Hibernate, que nunca
   emite `UPDATE` para ella.
2. **Base de datos:** el trigger `trg_reports_append_only` (migración V33)
   rechaza todo `UPDATE` y `DELETE` sobre `reports`, venga del cliente que
   venga:
   ```
   ERROR:  reports es append-only: no se permite modificar el reporte <id>
   ```
   Hay una única excepción. Las FK `analysis_id` y `generated_by` son
   `ON DELETE SET NULL`, así que borrar el repositorio, el análisis o el
   usuario solo pone esas columnas en `NULL`. Ambos datos siguen dentro del
   contenido congelado, y el reporte sigue completo y verificable.
3. **Checksum:** ver la sección siguiente.

## Integridad: checksum SHA-256

- `content` es **JSONB**. PostgreSQL normaliza el JSONB (reordena claves y
  quita espacios), así que el checksum no se calcula sobre los bytes, sino
  sobre una **forma canónica del JSON**: claves ordenadas, sin espacios
  insignificantes y números sin ceros redundantes. Es la misma calculada
  desde el JSON recién serializado o desde lo que devuelve JSONB
  (`ReportChecksum`).
- El checksum se calcula al generar el reporte y se **recalcula en cada
  lectura y exportación**. Si no coincide, la respuesta es `409
  REPORT_INTEGRITY_ERROR`, se registra `REPORT_INTEGRITY_VIOLATION` en la
  auditoría y el reporte no se muestra ni se exporta. En el histórico aparece
  como *Alterado*.
- El formato canónico está **congelado**: `ReportChecksumTest` lo fija con un
  valor calculado de forma independiente (Python `hashlib`). Cambiarlo
  invalidaría todos los reportes existentes.

### Migración de reportes anteriores (V32)

Los reportes creados antes de esta HU guardaban el contenido como texto, con un
checksum sobre sus bytes exactos. La migración Java `V32__reports_content_jsonb`:

1. pasa el contenido a la columna JSONB `content`;
2. **re-sella** con el checksum canónico solo los reportes cuyo checksum
   anterior todavía verificaba;
3. deja con su checksum original los que ya estaban alterados, que siguen
   fallando la verificación. La migración nunca "lava" una manipulación previa.

Resultado en la base de desarrollo (12 reportes): los 11 íntegros siguen
verificando y el reporte alterado a propósito en la HU del PDF sigue detectado.

## Contenido congelado (schema v3)

`reports.content` guarda `ReportContent` en su versión 3: metadatos, resumen,
cobertura por categoría, resultados por política, hallazgos, reglas
ejecutadas, **cobertura por marco** y **recomendaciones**, todo calculado y
congelado al generar el reporte (`ReportGeneratorService`). Los reportes v1 y
v2 no traen las dos últimas; para ellos se derivan al consultarlos, con las
mismas funciones y a partir de sus propios datos congelados.

## Interfaz (`segsoft-frontend`)

- **Resultados del análisis → Generar reporte:** llama a
  `POST /api/v1/analyses/{id}/reports` y abre la vista del reporte.
- **Vista del reporte** (`/reports/:id`): selector **Vista técnica / Vista
  ejecutiva**. La vista elegida queda en la URL (`?view=executive`), así que se
  puede compartir un enlace a la vista ejecutiva. Muestra las secciones del
  reporte, con enlaces de drill-down al análisis, a cada política y al
  histórico del repositorio, y los botones de descarga PDF/SARIF.
- **Histórico** (`/reports`, o `/reports?repositoryId=…` desde un reporte): con
  filtro por repositorio y estado de integridad de cada reporte.

## Pruebas y pipeline

| Prueba | Qué verifica |
|---|---|
| `ReportGeneratorServiceTest` | Consolidación: las 5 categorías, cobertura por marco y peor estado por control, orden, acción y tope de las recomendaciones, enmascarado |
| `ReportChecksumTest` | Independencia del orden de claves, espacios y formato numérico (supervivencia a JSONB), detección de cambios y formato congelado |
| `StructuredReportSchemaTest` | Las dos vistas, de reportes actuales y antiguos, validan contra el JSON Schema; el schema rechaza una vista ejecutiva con hallazgos y una técnica incompleta |
| `ReportServiceTest`, `ReportControllerTest`, `AnalysisReportControllerTest` | 201 + `Location`, 404, 422 con el estado, 409, 405, vistas, histórico y roles |
| `StructuredReportIntegrationTest` (PostgreSQL) | Generación persistida como JSONB y `GENERATED`; JSON Schema sobre respuestas reales; 422 para `CANCELLED`, `FAILED`, `RUNNING` y `QUEUED`; **inmutabilidad** (editar hallazgos, resultados, políticas y repositorio no altera el reporte); **append-only** (UPDATE y DELETE rechazados); borrar el repositorio conserva el reporte; **manipulación** del JSONB detectada por el checksum (409 + auditoría); histórico por repositorio |

El workflow **CI Backend - Reportes** (`segsoft-backend/.github/workflows/ci-backend.yml`)
corre estas suites, incluida la validación del JSON Schema, y las de
integración contra un PostgreSQL 15 de servicio en cada push a `main` y en cada
pull request. Por ahora no corre todo `mvn test`: el resto del proyecto arrastra
25 fallos previos y ajenos a los reportes (están listados en el workflow).
