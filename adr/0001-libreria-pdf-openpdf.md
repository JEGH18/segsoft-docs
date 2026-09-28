# ADR 0001 — Librería para generar reportes PDF: OpenPDF

- **Estado:** Aceptada
- **Fecha:** 2026-09-28
- **HU relacionada:** Exportar reporte de cumplimiento en formato PDF

## Contexto

El backend Spring Boot debe generar el PDF del reporte de cumplimiento
(`GET /api/v1/reports/{id}/export?format=pdf`). El PDF se comparte con
stakeholders ejecutivos y se archiva como evidencia de auditoría, así que
necesitamos tablas, colores, encabezados y pies por página, enlaces internos
(índice) y metadatos del documento. La HU propone dos candidatas: OpenPDF o
iText 7.

## Opciones consideradas

| Criterio | OpenPDF 1.3.x | iText 7 / 8 (Core) |
|---|---|---|
| Licencia | **LGPL-2.1 / MPL-2.0** (dual) | **AGPL-3.0** o licencia comercial de pago |
| Obligación al distribuir | Solo publicar cambios hechos *a la propia librería*. El código de SegSoft sigue siendo nuestro. | Liberar **todo el código fuente de SegSoft** a quien use el sistema, incluso solo por red (cláusula de red de la AGPL, §13), o comprar licencia comercial. |
| API | Heredera de iText 2.1.7 (`com.lowagie.*`): `PdfPTable`, `PdfPageEventHelper`, fuentes base-14 | Más moderna (layout engine, `Div`, PDF/UA), pero con mayor curva de aprendizaje |
| Dependencias transitivas | Ninguna en runtime | Varios módulos (`kernel`, `layout`, `io`, …) |
| Estado | Mantenida por la comunidad LibrePDF, versiones activas | Mantenida por Apryse |

## Decisión

Usar **OpenPDF**, con la versión fijada en el `pom.xml` del backend
(`<openpdf.version>1.3.35</openpdf.version>`).

La razón principal es la licencia. SegSoft se despliega como servicio web: con
iText bajo AGPL, cualquier usuario del sistema podría exigir el código fuente
completo del backend, y la única alternativa sería comprar una licencia
comercial. La LGPL/MPL de OpenPDF solo obliga a publicar modificaciones a la
propia librería, y no la modificamos.

Técnicamente, OpenPDF cubre todo lo que exige la plantilla (ver
[reporte-pdf-plantilla.md](../reporte-pdf-plantilla.md)): tablas con
encabezados repetidos, colores por celda, eventos de página para numeración y
checksum en el pie, destinos locales para el índice y metadatos del documento.

### Por qué 1.3.35 y no 2.x

La línea 1.3.x conserva la API `com.lowagie.*` y funciona con Java 17. Subir a
2.x no aporta nada que la HU necesite. Si más adelante se actualiza, basta con
cambiar la propiedad `openpdf.version` y volver a correr
`PdfReportExporterTest`.

## Análisis SCA

Consulta a [OSV.dev](https://osv.dev) (que agrega GitHub Advisory Database y
NVD) el 2026-09-28:

| Artefacto | Alcance | Vulnerabilidades conocidas |
|---|---|---|
| `com.github.librepdf:openpdf:1.3.35` | compile | ninguna |
| `org.apache.pdfbox:pdfbox:3.0.7` (+ `fontbox`, `pdfbox-io`) | **test** | ninguna |

`openpdf` no arrastra dependencias transitivas de runtime
(`mvn dependency:tree -Dincludes=com.github.librepdf`). PDFBox (Apache-2.0)
solo se usa en los tests, como parser independiente para validar los PDF
generados y extraer su texto. Por eso no llega al JAR desplegado.

Esta consulta debe repetirse cuando se actualice la versión. El pipeline de CI
debería incorporar un escaneo SCA automático (OWASP Dependency-Check o
`osv-scanner`).

## Consecuencias

- El PDF usa las fuentes base-14 (Helvetica y Courier) sin embeberlas. Cubren
  WinAnsi (español incluido). Los caracteres fuera de ese juego se sustituyen
  por `?` de forma explícita, para que no desaparezcan en silencio.
- Si en el futuro se requiere PDF/A (archivo a largo plazo) o PDF/UA
  (accesibilidad), habrá que embeber fuentes TTF y reevaluar la librería.
- El diseño de exportadores (`ReportExporter`) aísla la librería: cambiarla
  solo afecta a `PdfReportExporter`.
