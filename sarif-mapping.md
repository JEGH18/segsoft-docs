# Exportación SARIF 2.1.0: mapeo de dominio e integración CI/CD

SegSoft exporta cada reporte de cumplimiento en
[SARIF 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/sarif-v2.1.0-errata01-os-complete.html)
para que los hallazgos aparezcan como alertas y anotaciones en plataformas de
CI/CD (GitHub Code Scanning, Azure DevOps, GitLab, SonarQube…).

```
GET /api/v1/reports/{id}/export?format=sarif
Authorization: Bearer <JWT de un usuario AUDITOR o SECURITY_ADMIN>

200  Content-Type: application/sarif+json
     Content-Disposition: attachment; filename="segsoft-report-{id}.sarif"
```

| Respuesta | Cuándo |
|---|---|
| `200` | SARIF generado **y validado** contra el schema oficial |
| `400` `UNSUPPORTED_FORMAT` | `format` distinto de `pdf` o `sarif` (el cuerpo lista `supportedFormats`) |
| `403` | El usuario no es AUDITOR ni SECURITY_ADMIN |
| `404` | El reporte no existe |
| `409` `REPORT_INTEGRITY_ERROR` | El checksum del reporte no coincide con su contenido |
| `500` `SARIF_VALIDATION_ERROR` | El SARIF generado no cumple el schema; **no se envía**, la respuesta trae `traceId` y las violaciones quedan en el log |

Implementación (`segsoft-backend`):

- `export/sarif/SarifReportExporter.java`: implementa la Strategy `ReportExporter`.
- `export/sarif/SarifSchemaValidator.java`: validación con everit-json-schema.
- `src/main/resources/sarif/sarif-schema-2.1.0.json`: schema oficial OASIS
  (errata01), incluido en el proyecto para validar sin acceso a red.

---

## 1. Mapeo del modelo de dominio a SARIF

El SARIF se genera desde el **contenido congelado del reporte**
(`reports.content_json`), el mismo que usa el PDF. Por eso las dos
exportaciones de un reporte describen exactamente los mismos resultados.

### Documento y ejecución (`run`)

| Dominio | SARIF | Notas |
|---|---|---|
| — | `$schema` | URI del schema oficial OASIS 2.1.0 (errata01) |
| — | `version` | `"2.1.0"` |
| Reporte | `runs[0]` | Un único *run* por reporte |
| Herramienta | `runs[0].tool.driver.name` | `"PDG-SegSoft"` |
| Versión del backend (`pom.xml`) | `tool.driver.version`, `tool.driver.semanticVersion` | Inyectada por el filtrado de recursos de Maven |
| — | `tool.driver.informationUri`, `tool.driver.organization` | URL del proyecto, `"Universidad Icesi"` |
| `Report.id` | `runs[0].automationDetails.id` | `pdg-segsoft/{reportId}`. GitHub usa lo que va hasta la última `/` como *categoría*, así que cada subida reemplaza a la anterior |
| Origen Git (`gitUrl`, `branch`) | `runs[0].versionControlProvenance[0]` | Solo para repositorios Git, con las **credenciales eliminadas** de la URL |
| Inicio y fin del análisis | `invocations[0].startTimeUtc` / `endTimeUtc` | ISO-8601 en UTC. `executionSuccessful: true`, porque solo se exportan análisis `COMPLETED` |
| Reglas ejecutadas, errores de reglas | `invocations[0].properties` | `rulesExecuted`, `rulesTotal`, `ruleExecutionErrors` |
| Metadatos del reporte | `runs[0].properties` | `reportId`, `reportStatus`, `reportChecksum`, `reportGeneratedAt`, `analysisId`, `repositoryName`, `compliancePercentage`, `weightedCompliancePercentage`, `policiesEvaluated`, `totalFindings` |

### Reglas (`runs[0].tool.driver.rules[]`)

> La HU las llama `runs[0].rules`; en SARIF 2.1.0 las reglas viven dentro del
> *driver* de la herramienta, y solo así el documento es válido.

Se listan **todas las reglas que ejecutó el análisis**, incluidas las que no
produjeron hallazgos. Salen del snapshot de políticas y reglas congelado al
iniciar el análisis. Los reportes generados antes de esta versión
(schema v1 del contenido) no guardan esa lista; en ese caso las reglas se
derivan de los hallazgos.

| Dominio (`Rule` / `Policy`) | SARIF (`reportingDescriptor`) | Ejemplo |
|---|---|---|
| `Rule.id` (UUID) | `id` | `11111111-0000-0000-0000-000000000001` |
| `payload.description` en PascalCase sin tildes | `name` | `ConcatenacionDirectaDeCadenasEnQuerySql` |
| `payload.description` | `shortDescription.text` | `Concatenación directa de cadenas en query SQL` |
| Descripción + política + categoría + CWE | `fullDescription.text` | — |
| `Rule.cweId` → página CWE; sin CWE, la página OWASP Top 10 de la categoría | `helpUri` | `https://cwe.mitre.org/data/definitions/89.html` |
| `Rule.severity` | `defaultConfiguration.level` | ver tabla de niveles |
| `Rule.severity` | `properties["security-severity"]` | `9.5` / `8.0` / `5.5` / `2.0` |
| `security` + categoría + CWE | `properties.tags` | `["security", "sql-injection", "external/cwe/cwe-89"]` |
| `severity`, `category`, `type`, `policyId`, `policyName` | `properties.*` | — |

`helpUri` de respaldo por categoría (cuando la regla no tiene CWE):

| Categoría | `helpUri` |
|---|---|
| `SQL_INJECTION` | https://owasp.org/Top10/A03_2021-Injection/ |
| `XSS` | https://owasp.org/Top10/A03_2021-Injection/ |
| `AUTHENTICATION_FAILURE` | https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/ |
| `INSECURE_DATA_HANDLING` | https://owasp.org/Top10/A02_2021-Cryptographic_Failures/ |
| `DEPENDENCY_VULNERABILITY` | https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/ |

### Hallazgos (`runs[0].results[]`)

| Dominio (`Finding`) | SARIF (`result`) | Notas |
|---|---|---|
| `Finding.rule.id` | `ruleId`, `ruleIndex` | `ruleIndex` apunta a la posición en `driver.rules` |
| `Finding.severity` | `level` | ver tabla de niveles |
| Descripción de la regla + política + acción sugerida | `message.text` | Saneado y con secretos enmascarados |
| `Finding.filePath` | `locations[0].physicalLocation.artifactLocation.uri` | **Relativa a la raíz del repositorio analizado** (ver más abajo) |
| — | `artifactLocation.uriBaseId` | `%SRCROOT%` (raíz del repositorio) |
| `Finding.lineNumber` | `region.startLine` | Se omite `region` si no hay línea (el hallazgo queda a nivel de archivo) |
| `Finding.evidenceSnippet` | `region.snippet.text` | **Enmascarado de nuevo** (`api_key=*****`) |
| `id`, `severity`, `category`, `policyId`, `policyName`, `cweId`, `fileSha256` | `properties.*` | Trazabilidad con SegSoft |

Los resultados se ordenan por severidad (de crítica a baja), luego por ruta y
luego por línea.

### Niveles

| Severidad SegSoft | `level` SARIF | `security-severity` | Severidad en GitHub |
|---|---|---|---|
| `CRITICAL` | `error` | `9.5` | Critical |
| `HIGH` | `error` | `8.0` | High |
| `MEDIUM` | `warning` | `5.5` | Medium |
| `LOW` | `note` | `2.0` | Low |

GitHub calcula la severidad de seguridad a partir de `security-severity`
(≥ 9.0 crítica, 7.0–8.9 alta, 4.0–6.9 media, < 4.0 baja). Solo la tiene en
cuenta si la regla lleva la etiqueta `security`.

### Rutas relativas a la raíz del repositorio

`artifactLocation.uri` es una *URI reference* relativa que se resuelve contra
`%SRCROOT%`:

| Ruta almacenada | `uri` SARIF |
|---|---|
| `src/main/App.java` | `src/main/App.java` |
| `./src/main/App.java`, `/src/main/App.java` | `src/main/App.java` |
| `src\main\App.java` | `src/main/App.java` |
| `C:\repo\App.java` | `repo/App.java` |
| `src/web/mi archivo.js` | `src/web/mi%20archivo.js` |
| `docs/configuración.md` | `docs/configuraci%C3%B3n.md` |
| `../../etc/passwd` | *(sin ubicación: sale de la raíz)* |

Para repositorios Git, la raíz es la del clon, así que las rutas coinciden con
las del repositorio en GitHub. Para un ZIP, la raíz es la del archivo
comprimido: si el ZIP envuelve el proyecto en una carpeta, esa carpeta forma
parte de la ruta.

### Confidencialidad

Todos los textos pasan por `ReportTextSanitizer`: elimina caracteres de
control, *bidi overrides* y caracteres de ancho cero, y enmascara secretos con
`SecretMaskingService`, aunque el motor ya lo haya hecho. Las URLs Git se
publican sin `usuario:contraseña@`.

### Validación contra el schema oficial

Cada documento se valida con **everit-json-schema** contra
`sarif-schema-2.1.0.json` **antes** de devolverse:

1. Si es válido, se responde `200` con el archivo.
2. Si no lo es, se lanza `SarifValidationException`. El handler global
   registra `SARIF inválido descartado, no se envió al cliente [traceId=…]
   violaciones=[…]` en el log y responde `500 SARIF_VALIDATION_ERROR` con el
   `traceId`, **sin** el archivo y sin exponer las violaciones al cliente.

---

## 2. Ejemplo

Generado por `SarifReportExporter` a partir de un reporte con **un hallazgo de
cada categoría del catálogo de SegSoft** (Inyección SQL, XSS, Fallas de
autenticación, Manejo inseguro de datos y Dependencias vulnerables). Es válido
contra el schema oficial (everit y `jsonschema` de Python con verificación de
formatos).

El archivo completo está en [ejemplos/reporte-ejemplo.sarif](ejemplos/reporte-ejemplo.sarif).

<details>
<summary>Ver el SARIF completo</summary>

```json
{
  "$schema" : "https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json",
  "version" : "2.1.0",
  "runs" : [ {
    "tool" : {
      "driver" : {
        "name" : "PDG-SegSoft",
        "version" : "0.1.0",
        "semanticVersion" : "0.1.0",
        "informationUri" : "https://github.com/JEGH18/segsoft-backend",
        "organization" : "Universidad Icesi",
        "rules" : [ {
          "id" : "11111111-0000-0000-0000-000000000001",
          "name" : "ConcatenacionDirectaDeCadenasEnQuerySql",
          "shortDescription" : {
            "text" : "Concatenación directa de cadenas en query SQL"
          },
          "fullDescription" : {
            "text" : "Concatenación directa de cadenas en query SQL. Política: «Consultas parametrizadas obligatorias». Categoría: SQL_INJECTION. CWE-89."
          },
          "helpUri" : "https://cwe.mitre.org/data/definitions/89.html",
          "defaultConfiguration" : {
            "level" : "error"
          },
          "properties" : {
            "tags" : [ "security", "sql-injection", "external/cwe/cwe-89" ],
            "security-severity" : "9.5",
            "severity" : "CRITICAL",
            "category" : "SQL_INJECTION",
            "ruleType" : "PATTERN_REGEX",
            "policyId" : "22222222-0000-0000-0000-000000000001",
            "policyName" : "Consultas parametrizadas obligatorias"
          }
        }, {
          "id" : "11111111-0000-0000-0000-000000000006",
          "name" : "ConsultaSelectSinFiltroDeColumnasSensibles",
          "shortDescription" : {
            "text" : "Consulta SELECT * sin filtro de columnas sensibles"
          },
          "fullDescription" : {
            "text" : "Consulta SELECT * sin filtro de columnas sensibles. Política: «Consultas parametrizadas obligatorias». Categoría: SQL_INJECTION. CWE-89."
          },
          "helpUri" : "https://cwe.mitre.org/data/definitions/89.html",
          "defaultConfiguration" : {
            "level" : "warning"
          },
          "properties" : {
            "tags" : [ "security", "sql-injection", "external/cwe/cwe-89" ],
            "security-severity" : "5.5",
            "severity" : "MEDIUM",
            "category" : "SQL_INJECTION",
            "ruleType" : "PATTERN_REGEX",
            "policyId" : "22222222-0000-0000-0000-000000000001",
            "policyName" : "Consultas parametrizadas obligatorias"
          }
        }, {
          "id" : "11111111-0000-0000-0000-000000000002",
          "name" : "AsignacionDirectaAInnerhtmlSinEscape",
          "shortDescription" : {
            "text" : "Asignación directa a innerHTML sin escape"
          },
          "fullDescription" : {
            "text" : "Asignación directa a innerHTML sin escape. Política: «Codificación de salida HTML». Categoría: XSS. CWE-79."
          },
          "helpUri" : "https://cwe.mitre.org/data/definitions/79.html",
          "defaultConfiguration" : {
            "level" : "error"
          },
          "properties" : {
            "tags" : [ "security", "xss", "external/cwe/cwe-79" ],
            "security-severity" : "8.0",
            "severity" : "HIGH",
            "category" : "XSS",
            "ruleType" : "PATTERN_REGEX",
            "policyId" : "22222222-0000-0000-0000-000000000002",
            "policyName" : "Codificación de salida HTML"
          }
        }, {
          "id" : "11111111-0000-0000-0000-000000000003",
          "name" : "CredencialesEmbebidasEnElCodigo",
          "shortDescription" : {
            "text" : "Credenciales embebidas en el código"
          },
          "fullDescription" : {
            "text" : "Credenciales embebidas en el código. Política: «No almacenar secretos en código fuente». Categoría: AUTHENTICATION_FAILURE. CWE-798."
          },
          "helpUri" : "https://cwe.mitre.org/data/definitions/798.html",
          "defaultConfiguration" : {
            "level" : "error"
          },
          "properties" : {
            "tags" : [ "security", "authentication-failure", "external/cwe/cwe-798" ],
            "security-severity" : "8.0",
            "severity" : "HIGH",
            "category" : "AUTHENTICATION_FAILURE",
            "ruleType" : "PATTERN_REGEX",
            "policyId" : "22222222-0000-0000-0000-000000000003",
            "policyName" : "No almacenar secretos en código fuente"
          }
        }, {
          "id" : "11111111-0000-0000-0000-000000000004",
          "name" : "DatosSensiblesAlmacenadosSinCifrado",
          "shortDescription" : {
            "text" : "Datos sensibles almacenados sin cifrado"
          },
          "fullDescription" : {
            "text" : "Datos sensibles almacenados sin cifrado. Política: «Cifrado de datos sensibles en reposo». Categoría: INSECURE_DATA_HANDLING."
          },
          "helpUri" : "https://owasp.org/Top10/A02_2021-Cryptographic_Failures/",
          "defaultConfiguration" : {
            "level" : "warning"
          },
          "properties" : {
            "tags" : [ "security", "insecure-data-handling" ],
            "security-severity" : "5.5",
            "severity" : "MEDIUM",
            "category" : "INSECURE_DATA_HANDLING",
            "ruleType" : "CONFIG_CHECK",
            "policyId" : "22222222-0000-0000-0000-000000000004",
            "policyName" : "Cifrado de datos sensibles en reposo"
          }
        }, {
          "id" : "11111111-0000-0000-0000-000000000005",
          "name" : "DependenciaConVulnerabilidadConocida",
          "shortDescription" : {
            "text" : "Dependencia con vulnerabilidad conocida"
          },
          "fullDescription" : {
            "text" : "Dependencia con vulnerabilidad conocida. Política: «Remediación oportuna de vulnerabilidades en componentes». Categoría: DEPENDENCY_VULNERABILITY. CWE-1104."
          },
          "helpUri" : "https://cwe.mitre.org/data/definitions/1104.html",
          "defaultConfiguration" : {
            "level" : "note"
          },
          "properties" : {
            "tags" : [ "security", "dependency-vulnerability", "external/cwe/cwe-1104" ],
            "security-severity" : "2.0",
            "severity" : "LOW",
            "category" : "DEPENDENCY_VULNERABILITY",
            "ruleType" : "DEPENDENCY_CHECK",
            "policyId" : "22222222-0000-0000-0000-000000000005",
            "policyName" : "Remediación oportuna de vulnerabilidades en componentes"
          }
        } ]
      }
    },
    "automationDetails" : {
      "id" : "pdg-segsoft/0f8f7c1e-4c1a-4f3e-9d7a-2b6c1d0e9a11"
    },
    "versionControlProvenance" : [ {
      "repositoryUri" : "https://github.com/acme/payments.git",
      "branch" : "main"
    } ],
    "invocations" : [ {
      "executionSuccessful" : true,
      "startTimeUtc" : "2026-09-28T06:16:35Z",
      "endTimeUtc" : "2026-09-28T06:17:17Z",
      "properties" : {
        "rulesExecuted" : 24,
        "rulesTotal" : 24,
        "ruleExecutionErrors" : 0
      }
    } ],
    "results" : [ {
      "ruleId" : "11111111-0000-0000-0000-000000000001",
      "ruleIndex" : 0,
      "level" : "error",
      "message" : {
        "text" : "Concatenación directa de cadenas en query SQL. Política incumplida: «Consultas parametrizadas obligatorias». Acción sugerida: Usar PreparedStatement con parámetros."
      },
      "locations" : [ {
        "physicalLocation" : {
          "artifactLocation" : {
            "uri" : "src/main/java/com/acme/UserDao.java",
            "uriBaseId" : "%SRCROOT%"
          },
          "region" : {
            "startLine" : 42,
            "snippet" : {
              "text" : "stmt.executeQuery(\"SELECT * FROM users WHERE id=\" + id);"
            }
          }
        }
      } ],
      "properties" : {
        "findingId" : "fad9c20a-7059-3745-a5be-b19dffb72940",
        "severity" : "CRITICAL",
        "category" : "SQL_INJECTION",
        "policyId" : "22222222-0000-0000-0000-000000000001",
        "policyName" : "Consultas parametrizadas obligatorias",
        "cweId" : "CWE-89"
      }
    }, {
      "ruleId" : "11111111-0000-0000-0000-000000000002",
      "ruleIndex" : 2,
      "level" : "error",
      "message" : {
        "text" : "Asignación directa a innerHTML sin escape. Política incumplida: «Codificación de salida HTML». Acción sugerida: Usar textContent o sanitizar con DOMPurify."
      },
      "locations" : [ {
        "physicalLocation" : {
          "artifactLocation" : {
            "uri" : "src/web/mi%20archivo.js",
            "uriBaseId" : "%SRCROOT%"
          },
          "region" : {
            "startLine" : 18,
            "snippet" : {
              "text" : "panel.innerHTML = userInput;"
            }
          }
        }
      } ],
      "properties" : {
        "findingId" : "7764456e-69e4-3455-94e7-f3887f7b8abf",
        "severity" : "HIGH",
        "category" : "XSS",
        "policyId" : "22222222-0000-0000-0000-000000000002",
        "policyName" : "Codificación de salida HTML",
        "cweId" : "CWE-79"
      }
    }, {
      "ruleId" : "11111111-0000-0000-0000-000000000003",
      "ruleIndex" : 3,
      "level" : "error",
      "message" : {
        "text" : "Credenciales embebidas en el código. Política incumplida: «No almacenar secretos en código fuente». Acción sugerida: Mover la clave a un gestor de secretos."
      },
      "locations" : [ {
        "physicalLocation" : {
          "artifactLocation" : {
            "uri" : "config/settings.py",
            "uriBaseId" : "%SRCROOT%"
          },
          "region" : {
            "startLine" : 7,
            "snippet" : {
              "text" : "API_KEY = \"*****\""
            }
          }
        }
      } ],
      "properties" : {
        "findingId" : "9b67fdec-6d6e-395a-992a-81d05a77a7dc",
        "severity" : "HIGH",
        "category" : "AUTHENTICATION_FAILURE",
        "policyId" : "22222222-0000-0000-0000-000000000003",
        "policyName" : "No almacenar secretos en código fuente",
        "cweId" : "CWE-798"
      }
    }, {
      "ruleId" : "11111111-0000-0000-0000-000000000004",
      "ruleIndex" : 4,
      "level" : "warning",
      "message" : {
        "text" : "Datos sensibles almacenados sin cifrado. Política incumplida: «Cifrado de datos sensibles en reposo». Acción sugerida: Habilitar cifrado en reposo."
      },
      "locations" : [ {
        "physicalLocation" : {
          "artifactLocation" : {
            "uri" : "deploy/app.yml",
            "uriBaseId" : "%SRCROOT%"
          }
        }
      } ],
      "properties" : {
        "findingId" : "d432e016-2efe-3f35-abf8-48912a9eee17",
        "severity" : "MEDIUM",
        "category" : "INSECURE_DATA_HANDLING",
        "policyId" : "22222222-0000-0000-0000-000000000004",
        "policyName" : "Cifrado de datos sensibles en reposo"
      }
    }, {
      "ruleId" : "11111111-0000-0000-0000-000000000005",
      "ruleIndex" : 5,
      "level" : "note",
      "message" : {
        "text" : "Dependencia con vulnerabilidad conocida. Política incumplida: «Remediación oportuna de vulnerabilidades en componentes». Acción sugerida: Actualizar requests a 2.32.0 o superior."
      },
      "locations" : [ {
        "physicalLocation" : {
          "artifactLocation" : {
            "uri" : "requirements.txt",
            "uriBaseId" : "%SRCROOT%"
          },
          "region" : {
            "startLine" : 3,
            "snippet" : {
              "text" : "requests==2.19.0"
            }
          }
        }
      } ],
      "properties" : {
        "findingId" : "0f8a8c27-6b24-395e-94eb-fcfebc9932e0",
        "severity" : "LOW",
        "category" : "DEPENDENCY_VULNERABILITY",
        "policyId" : "22222222-0000-0000-0000-000000000005",
        "policyName" : "Remediación oportuna de vulnerabilidades en componentes",
        "cweId" : "CWE-1104"
      }
    } ],
    "properties" : {
      "reportId" : "0f8f7c1e-4c1a-4f3e-9d7a-2b6c1d0e9a11",
      "reportStatus" : "GENERATED",
      "reportChecksum" : "9f2c4e1b7a3d5f60c8e9b1a2d3c4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6",
      "reportGeneratedAt" : "2026-09-28T06:21:35Z",
      "analysisId" : "85db2d64-9c6f-4dd2-8eb0-254ab3496a8d",
      "repositoryName" : "acme-payments",
      "compliancePercentage" : 16.67,
      "weightedCompliancePercentage" : 12.50,
      "policiesEvaluated" : 6,
      "totalFindings" : 5
    }
  } ]
}
```

</details>

Fíjate en el ejemplo:

- La regla `…0006` aparece en `rules` aunque no tiene resultados, porque se
  ejecutó.
- La ruta `./src\web\mi archivo.js` se publica como `src/web/mi%20archivo.js`.
- El hallazgo de `deploy/app.yml` no tiene línea, así que no lleva `region`.
- El secreto de `config/settings.py` aparece como `API_KEY = "*****"`.
- La URL Git `https://ci-bot:ghp_…@github.com/acme/payments.git` se publica
  sin credenciales.

---

## 3. Integración con GitHub Actions (Code Scanning)

### Requisitos

- **Code Scanning habilitado:** gratuito en repositorios públicos; en privados
  requiere GitHub Advanced Security.
- **SegSoft accesible desde el runner:** un despliegue público o un
  *self-hosted runner* en la red de SegSoft.
- **Usuario de servicio con rol AUDITOR** en SegSoft. Sus credenciales van en
  los *secrets* `SEGSOFT_URL`, `SEGSOFT_USER` y `SEGSOFT_PASSWORD`.

> **Limitación actual:** los API tokens (`pdgseg_…`, creados en
> `/api/v1/auth/api-tokens`) todavía no los acepta `JwtAuthenticationFilter`,
> así que el pipeline debe hacer login con usuario y contraseña. Cuando el
> filtro los acepte, basta con reemplazar el paso de login por
> `Authorization: Bearer $SEGSOFT_API_TOKEN`.

### Workflow

`.github/workflows/segsoft.yml`:

```yaml
name: SegSoft compliance

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write   # necesario para subir SARIF a Code Scanning

jobs:
  segsoft:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7   # upload-sarif necesita el código para ubicar los hallazgos

      - name: Analizar con SegSoft y exportar SARIF
        env:
          SEGSOFT_URL: ${{ secrets.SEGSOFT_URL }}
          SEGSOFT_USER: ${{ secrets.SEGSOFT_USER }}
          SEGSOFT_PASSWORD: ${{ secrets.SEGSOFT_PASSWORD }}
          SEGSOFT_POLICY_SET_ID: ${{ vars.SEGSOFT_POLICY_SET_ID }}
          GIT_URL: ${{ github.server_url }}/${{ github.repository }}.git
          BRANCH: ${{ github.head_ref || github.ref_name }}
        run: |
          set -euo pipefail
          api() { curl -sSf -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' "$@"; }

          TOKEN=$(curl -sSf -X POST "$SEGSOFT_URL/api/v1/auth/login" -H 'Content-Type: application/json' \
            -d "{\"username\":\"$SEGSOFT_USER\",\"password\":\"$SEGSOFT_PASSWORD\"}" | jq -r .accessToken)

          # 1. Clonar el repositorio (rama del PR) en SegSoft y esperar el inventario
          REPO=$(api -X POST "$SEGSOFT_URL/api/v1/repositories/git" \
            -d "{\"gitUrl\":\"$GIT_URL\",\"branch\":\"$BRANCH\"}" | jq -r .id)
          until [ "$(api "$SEGSOFT_URL/api/v1/repositories/$REPO" | jq -r .status)" = READY_FOR_ANALYSIS ]; do sleep 5; done

          # 2. Seleccionar las políticas a partir de un Policy Set
          api -X POST "$SEGSOFT_URL/api/v1/repositories/$REPO/policy-selection/apply-set" \
            -d "{\"policySetId\":\"$SEGSOFT_POLICY_SET_ID\"}" > /dev/null

          # 3. Ejecutar el análisis y esperar a que termine
          ANALYSIS=$(api -X POST "$SEGSOFT_URL/api/v1/analyses" -d "{\"repositoryId\":\"$REPO\"}" | jq -r .id)
          while :; do
            STATUS=$(api "$SEGSOFT_URL/api/v1/analyses/$ANALYSIS" | jq -r .status)
            case "$STATUS" in COMPLETED) break ;; FAILED|CANCELLED) echo "Análisis $STATUS"; exit 1 ;; esac
            sleep 5
          done

          # 4. Congelar el reporte y exportarlo en SARIF
          REPORT=$(api -X POST "$SEGSOFT_URL/api/v1/reports" -d "{\"analysisId\":\"$ANALYSIS\"}" | jq -r .id)
          api -o segsoft.sarif "$SEGSOFT_URL/api/v1/reports/$REPORT/export?format=sarif"

      - name: Subir a GitHub Code Scanning
        uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: segsoft.sarif
```

Si el análisis ya existe en SegSoft (por ejemplo, lo ejecutó un auditor desde
la interfaz), basta con el paso 4 y con "Subir a GitHub Code Scanning",
usando el id de ese análisis.

### Qué se ve en GitHub

- **Security → Code scanning:** una alerta por hallazgo, con la herramienta
  "PDG-SegSoft", la severidad derivada de `security-severity`, la descripción
  de la regla y el enlace a `helpUri` (CWE u OWASP).
- **Pull requests:** el check *Code scanning results / PDG-SegSoft* y
  **anotaciones en las líneas que el PR modifica**. GitHub solo anota las
  alertas que caen dentro del diff.
- **Subidas sucesivas:** reemplazan a las anteriores de la misma categoría
  (`pdg-segsoft/`); las alertas que desaparecen se cierran como *fixed*.

### Límites de GitHub a tener en cuenta

| Límite | Valor |
|---|---|
| Tamaño del archivo SARIF (comprimido gzip) | 10 MB |
| Resultados por *run* | 25 000 (se muestran los 5 000 primeros por severidad) |
| Reglas por *run* | 25 000 |

### Verificar un archivo localmente

```bash
# Validación contra el schema oficial, con el mismo archivo que usa el backend
pip install jsonschema
python -c "import json,jsonschema; s=json.load(open('sarif-schema-2.1.0.json')); \
  jsonschema.Draft4Validator(s).validate(json.load(open('segsoft.sarif'))); print('SARIF válido')"
```
