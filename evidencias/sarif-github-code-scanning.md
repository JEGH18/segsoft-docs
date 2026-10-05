# Evidencia: upload del SARIF de SegSoft a GitHub Code Scanning

HU **Exportar reporte de cumplimiento en formato SARIF 2.1.0**, subtarea *Test
de upload a GitHub Code Scanning*.

- **Fecha:** 2026-10-04
- **Repositorio de prueba:** [JEGH18/SegSoft-Pruebas](https://github.com/JEGH18/SegSoft-Pruebas) (público)
- **Workflow:** [`.github/workflows/segsoft-code-scanning.yml`](https://github.com/JEGH18/SegSoft-Pruebas/blob/main/.github/workflows/segsoft-code-scanning.yml), con `github/codeql-action/upload-sarif@v4`

## Procedimiento

1. **Analizar `main` en SegSoft** (backend local, rama `feature/exportar-reporte-sarif`): ZIP de la raíz del repositorio sin
   `docs/`, `.github/` ni `.segsoft/`, con todas las políticas activas. Después se generó el reporte y se exportó con
   `GET /api/v1/reports/{id}/export?format=sarif`.
2. **Commit en `main`**
   ([`a2736be`](https://github.com/JEGH18/SegSoft-Pruebas/commit/a2736bea2fc36cd2724e3a6bfff68c5e6fd38011)) con el workflow y
   `.segsoft/segsoft.sarif`. El workflow lo subió a Code Scanning.
3. **PR de prueba** [#1](https://github.com/JEGH18/SegSoft-Pruebas/pull/1), que no se mergea:
   - introduce a propósito una inyección SQL en `proyecto-limpio/reportes/reportes/db.py:20`;
   - actualiza el SARIF con el análisis de la rama
     ([`4d69e78`](https://github.com/JEGH18/SegSoft-Pruebas/commit/4d69e785b1edad6011e3e715e50f357562cd6a2f)).

Antes de subirlo se comprobó que las 47 ubicaciones del SARIF existen en el
repositorio y que sus líneas están en rango. También se comprobó que ningún
valor con forma de secreto quedó sin enmascarar.

## Resultados (consultados con la API de GitHub)

### Ejecuciones del workflow

| Evento | Rama | Commit | Resultado |
|---|---|---|---|
| `push` | `main` | `a2736be` | [success](https://github.com/JEGH18/SegSoft-Pruebas/actions/runs/37241546211) |
| `pull_request` | `prueba/segsoft-sarif-pr` | `4d69e78` | [success](https://github.com/JEGH18/SegSoft-Pruebas/actions/runs/37241634889) |

Log del paso `upload-sarif` en `main`: `Validating .segsoft/segsoft.sarif` →
`Adding fingerprints` → `Successfully uploaded results` →
`Analysis upload status is complete`.

### Análisis registrados en Code Scanning

| Análisis | Ref | Herramienta | Categoría | Resultados | Reglas | Errores / warnings |
|---|---|---|---|---|---|---|
| 1890026159 | `refs/heads/main` | PDG-SegSoft 0.1.0 | `pdg-segsoft` | 47 | 24 | ninguno |
| 1890029112 | `refs/pull/1/merge` | PDG-SegSoft 0.1.0 | `pdg-segsoft` | 49 | 24 | ninguno |

GitHub **aceptó ambos SARIF sin errores ni advertencias**.

### Alertas en la pestaña Security (rama `main`, herramienta PDG-SegSoft)

| Severidad en GitHub | Alertas | `level` SARIF |
|---|---|---|
| Critical | 17 | `error` (CRITICAL) |
| High | 18 | `error` (HIGH) |
| Medium | 12 | `warning` (MEDIUM) |
| **Total** | **47** | |

Por proyecto: `proyecto-vulnerable` 42, `proyecto-intermedio` 5 y
`proyecto-limpio` 0. Cada alerta muestra la descripción de la regla, la
política incumplida, las etiquetas (`security`, categoría, `external/cwe/…`) y
el enlace `helpUri` a CWE u OWASP.

### Anotaciones en el PR #1

Check [**PDG-SegSoft**](https://github.com/JEGH18/SegSoft-Pruebas/runs/111551365051), conclusión `failure`:
*"2 new alerts including 1 critical severity security vulnerability"*.

| Nivel | Ubicación | Regla |
|---|---|---|
| failure | `proyecto-limpio/reportes/reportes/db.py:20` | Consulta SQL construida con f-string en vez de parámetros vinculados |
| warning | `proyecto-limpio/reportes/reportes/db.py:20` | Consulta SELECT * sin filtro de columnas sensibles |

GitHub solo anota las alertas **nuevas en las líneas que cambia el PR**. Las 47
alertas que ya existían en `main` no se repiten en el PR.

## Capturas pendientes

GitHub solo muestra las alertas de Code Scanning a usuarios con acceso de
escritura, así que las capturas deben tomarse con la sesión de JEGH18 y
adjuntarse a la subtarea:

- [ ] **Security → Code scanning**, filtrado por la herramienta PDG-SegSoft (47 alertas):
      https://github.com/JEGH18/SegSoft-Pruebas/security/code-scanning?query=tool%3APDG-SegSoft
- [ ] **Detalle de una alerta**, con mensaje, regla, CWE y enlace de ayuda:
      https://github.com/JEGH18/SegSoft-Pruebas/security/code-scanning/47
- [ ] **PR #1 → Files changed**, con las anotaciones en `db.py:20`:
      https://github.com/JEGH18/SegSoft-Pruebas/pull/1/files
- [ ] **PR #1 → Checks → Code scanning results → PDG-SegSoft**:
      https://github.com/JEGH18/SegSoft-Pruebas/pull/1/checks
