# Mapeo de severidades a SARIF 2.1.0

## Tabla de equivalencias

| Severidad del dominio | Nivel SARIF (`level`) | Descripción SARIF |
|-----------------------|-----------------------|-------------------|
| `CRITICAL`            | `error`               | Requiere corrección inmediata |
| `HIGH`                | `error`               | Fallo de seguridad grave |
| `MEDIUM`              | `warning`             | Vulnerabilidad con riesgo moderado |
| `LOW`                 | `note`                | Observación o mejora recomendada |

## Estructura de un archivo SARIF generado

```json
{
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "pdgseg-engine",
          "version": "0.1.0",
          "informationUri": "https://bitbucket.org/icesi/segsoft",
          "rules": [
            {
              "id": "SQL_INJECTION_001",
              "name": "SqlInjectionViaStringConcat",
              "shortDescription": { "text": "Posible inyección SQL por concatenación directa de parámetros." },
              "properties": { "category": "SQL_INJECTION", "framework": "OWASP_TOP_10_2021" }
            }
          ]
        }
      },
      "results": [
        {
          "ruleId": "SQL_INJECTION_001",
          "level": "error",
          "message": { "text": "Parámetro de usuario concatenado directamente en consulta SQL." },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": { "uri": "src/main/java/co/icesi/UserRepository.java" },
                "region": { "startLine": 42 }
              }
            }
          ]
        },
        {
          "ruleId": "XSS_001",
          "level": "error",
          "message": { "text": "Contenido de usuario insertado sin escapar en el DOM." },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": { "uri": "src/components/UserProfile.tsx" },
                "region": { "startLine": 18 }
              }
            }
          ]
        },
        {
          "ruleId": "AUTH_FAILURE_001",
          "level": "error",
          "message": { "text": "Credenciales hardcodeadas detectadas." },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": { "uri": "src/config/database.js" },
                "region": { "startLine": 7 }
              }
            }
          ]
        },
        {
          "ruleId": "INSECURE_DATA_001",
          "level": "warning",
          "message": { "text": "Datos sensibles almacenados sin cifrado en disco." },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": { "uri": "src/utils/cache.py" },
                "region": { "startLine": 31 }
              }
            }
          ]
        },
        {
          "ruleId": "DEP_VULN_001",
          "level": "error",
          "message": { "text": "Dependencia con CVE crítico conocido: lodash < 4.17.21 (CVE-2021-23337)." },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": { "uri": "package.json" },
                "region": { "startLine": 12 }
              }
            }
          ]
        }
      ]
    }
  ]
}
```
