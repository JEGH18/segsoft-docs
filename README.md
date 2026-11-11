# PDG SegSoft — Universidad Icesi

Sistema de análisis automatizado de cumplimiento de políticas de seguridad en software.
Detecta vulnerabilidades en repositorios de código fuente en 5 categorías: SQL Injection, XSS, Authentication Failure, Insecure Data Handling y Dependency Vulnerability.

---

## Repositorios

El proyecto se divide en cinco repositorios. Los oficiales están en **p2tools**
(Bitbucket Server de la Icesi); GitHub (`JEGH18/…`) es un espejo.

| Repositorio | Contenido | p2tools |
|---|---|---|
| `segsoft-backend` | API REST principal (Spring Boot 3 / Java 17) | `https://pi2tools.icesi.edu.co/bitbucket/scm/segsoft/segsoft-backend.git` |
| `segsoft-motorpython` | Motor de análisis de reglas (FastAPI / Python 3.11) | `https://pi2tools.icesi.edu.co/bitbucket/scm/segsoft/segsoft-motorpython.git` |
| `segsoft-frontend` | SPA (React 18 + Vite 5 + TypeScript) | `https://pi2tools.icesi.edu.co/bitbucket/scm/segsoft/segsoft-frontend.git` |
| `segsoft-cli` | CLI `pdgseg` para ejecutar el análisis desde pipelines CI/CD (Python, paquete `pdgseg-cli`) | Solo en GitHub por ahora: `https://github.com/JEGH18/segsoft-cli` |
| `segsoft-docs` | Documentación técnica (este repositorio) | `https://pi2tools.icesi.edu.co/bitbucket/scm/segsoft/segsoft-docs.git` |

Por SSH (solo desde la red de la Icesi o con VPN):
`ssh://git@pi2tools.icesi.edu.co:7999/segsoft/<repositorio>.git`.

El CI corre en el Jenkins de p2tools con el `Jenkinsfile` de cada repositorio de código:
ver [ci-jenkins-p2tools.md](ci-jenkins-p2tools.md).

El análisis también se puede ejecutar desde la línea de comandos y desde pipelines (GitHub Actions,
GitLab CI, Jenkins) con el CLI `pdgseg` y un token de API personal (en la aplicación: ícono de llave →
Tokens de API). Instalación, `.pdgseg.yml`, códigos de salida y ejemplos de pipelines: ver el
[README de segsoft-cli](https://github.com/JEGH18/segsoft-cli#readme). El backend y el frontend se
analizan a sí mismos con él en `.github/workflows/segsoft.yml` (dogfooding).

El despliegue (frontend en Vercel; backend, motor y PostgreSQL con Docker en un servidor)
está documentado en `segsoft-backend/deploy/README.md`.

Cualquier persona puede crear una cuenta DEVELOPER desde la aplicación: ver
[registro-usuarios.md](registro-usuarios.md).

El material para las pruebas con usuarios (contexto para el guion y la encuesta, proyectos
ZIP de prueba y capturas de la interfaz) está en [pruebas-usuarios/](pruebas-usuarios/).

---

## Requisitos

| Herramienta    | Versión mínima |
|----------------|----------------|
| Java           | 17             |
| Maven          | 3.9            |
| Python         | 3.11           |
| Node.js        | 20             |
| Docker Desktop | 4.x            |

---

## Levantar el backend, el motor y PostgreSQL con Docker Compose

El `docker-compose.yml` está en `segsoft-backend/deploy/` (no en la raíz) y espera
`segsoft-backend` y `segsoft-motorpython` clonados uno al lado del otro:

```bash
cd segsoft-backend/deploy
./generar-env.sh <dominio-del-backend> <origen-del-frontend>   # crea deploy/.env
docker compose up -d --build
```

Levanta PostgreSQL, el motor (solo en la red interna de Docker), el backend (en
`127.0.0.1:8080`) y Caddy con HTTPS. Detalle en `segsoft-backend/deploy/README.md`.
Swagger UI queda en `/swagger-ui.html` del backend. No hay Grafana en el despliegue actual.

---

## Desarrollo local por módulo

### Backend Spring Boot

```bash
cd segsoft-backend
# Requiere PostgreSQL corriendo en localhost:5432
# Usar el perfil dev:
# El repositorio no trae el Maven wrapper (mvnw): usar Maven 3.9 instalado.
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Motor Python

```bash
cd segsoft-motorpython
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd segsoft-frontend
cp .env.example .env
npm install
npm run dev
# Disponible en http://localhost:5173
```

---

## Variables de entorno requeridas

| Variable                   | Descripción |
|----------------------------|-------------|
| `DB_URL`                   | URL JDBC de PostgreSQL para Spring Boot |
| `DB_USER`                  | Usuario de base de datos |
| `DB_PASSWORD`              | Contraseña de base de datos |
| `DB_POSTGRES_DB`           | Nombre de la base de datos (PostgreSQL container) |
| `DB_POSTGRES_USER`         | Usuario del container PostgreSQL |
| `DB_POSTGRES_PASSWORD`     | Contraseña del container PostgreSQL |
| `JWT_SECRET`               | Secreto HMAC-SHA256 (HS256) con el que se firman los tokens JWT (≥32 caracteres). `JWT_PRIVATE_KEY` existe en la configuración pero no se usa |
| `INTERNAL_SERVICE_TOKEN`   | Token secreto para comunicación Spring ↔ Python (≥32 chars) |
| `ENGINE_BASE_URL`          | URL base del motor Python |
| `SANDBOX_ROOT`             | Directorio raíz para clonar repositorios analizados |
| `MAX_REPO_SIZE_MB`         | Tamaño máximo de repositorio en MB (default: 100) |
| `MAX_FILE_COUNT`           | Máximo número de archivos por repositorio (default: 5000) |
| `MAX_COMPRESSION_RATIO`    | Ratio máximo de compresión para detectar zip bombs (default: 100) |
| `MAX_EXTRACTED_SIZE_MB`    | Tope absoluto de lo que puede ocupar un ZIP descomprimido, en MB (default: 500). Se revisa mientras se escribe |
| `ENGINE_BATCH_SIZE`        | Archivos que el backend envía al motor por petición, por regla (default: 100, máximo 500) |
| `ENGINE_READ_TIMEOUT_MS`   | Timeout de lectura de una petición al motor (default: 180000; debe superar `BATCH_TIMEOUT_SECONDS` del motor) |
| `ALLOWED_GIT_DOMAINS`      | Dominios Git permitidos (separados por coma) |
| `RULE_TIMEOUT_MS`          | Sin uso en el código actual. El límite real lo aplica el motor: ver abajo |
| `TRACEABILITY_RETENTION_DAYS` | Días de retención de registros de trazabilidad (default: 365) |
| `MAX_EXPORT_SIZE_MB`       | Tamaño máximo de un PDF/SARIF exportado en MB (default: 50); si se supera, HTTP 422 |
| `EXPORT_CACHE_DIR`         | Directorio de la caché de exportaciones (default: `${java.io.tmpdir}/pdgseg-export-cache`) |
| `EXPORT_CACHE_TTL`         | Vigencia de una exportación cacheada, ISO-8601 (default: `PT1H`; `PT0S` la desactiva) |
| `EXPORT_CACHE_CLEANUP_INTERVAL` | Frecuencia de limpieza de exportaciones expiradas (default: `PT15M`) |
| `VITE_API_BASE_URL`        | URL base de la API para el frontend (vacía en producción: se usa el proxy `/api` de Vercel) |
| `VITE_UPLOAD_BASE_URL`     | URL del backend a la que el frontend sube los ZIP directamente, sin pasar por el proxy de Vercel, que rechaza cuerpos de más de ~4.5 MB. En producción está en `segsoft-frontend/.env.production` |

Variables del motor (`segsoft-motorpython`):

| Variable                   | Descripción |
|----------------------------|-------------|
| `INTERNAL_SERVICE_TOKEN`   | El mismo token que el backend |
| `SANDBOX_ROOT`             | El motor solo lee archivos dentro de esta carpeta, después de resolver `..` y enlaces simbólicos (en la imagen Docker: `/tmp/pdgseg-sandbox`) |
| `RULE_TIMEOUT_SECONDS`     | Tiempo máximo de una regla sobre un archivo (default: 5). Un patrón con *backtracking* catastrófico se corta con `RULE_TIMEOUT` |
| `BATCH_TIMEOUT_SECONDS`    | Tiempo máximo de una petición por lotes (default: 120); los archivos que no alcanzan a revisarse reciben el error `BATCH_TIMEOUT` |
| `MAX_AST_FILE_BYTES`       | Archivos `.py` más grandes que esto se revisan con heurísticas por línea en vez de `ast` (default: 2 MB) |

---

## Correr los tests

### Spring Boot

```bash
cd segsoft-backend
mvn test
# Tests de integración: requieren PostgreSQL en localhost:5432/pdgseg_test
# (o SPRING_DATASOURCE_URL apuntando a otra base)
mvn test -Pintegration-tests
```

### Motor Python

```bash
cd segsoft-motorpython
pytest tests/ -v          # unitarios + validación de precisión/cobertura
bandit -c bandit.yml -r app/
```

### Frontend

```bash
cd segsoft-frontend
npm test
npm run test:e2e
```

---

## Agregar al tutor como colaborador en Bitbucket

1. Ir al repositorio en Bitbucket: **Settings → User and group access**
2. Buscar el correo del tutor en el campo de búsqueda
3. Seleccionar el rol **Read** (o **Write** si el tutor necesita hacer comentarios en PRs)
4. Confirmar con **Add**
