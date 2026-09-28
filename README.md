# PDG SegSoft — Universidad Icesi

Sistema de análisis automatizado de cumplimiento de políticas de seguridad en software.
Detecta vulnerabilidades en repositorios de código fuente en 5 categorías: SQL Injection, XSS, Authentication Failure, Insecure Data Handling y Dependency Vulnerability.

---

## Estructura del monorepo

```
segsoft/
├── backend/
│   ├── backend-spring/   # API REST principal (Spring Boot 3 / Java 17)
│   └── engine-python/    # Motor de análisis de reglas (FastAPI / Python 3.11)
├── frontend/
│   └── pdgseg-frontend/  # SPA (React 18 + Vite 5 + TypeScript)
├── docs/                 # Documentación técnica (mapeo SARIF, ADRs)
├── docker-compose.yml
└── bitbucket-pipelines.yml
```

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

## Levantar el entorno completo con Docker Compose

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales antes de continuar

# 2. Levantar todos los servicios
docker-compose up --build
```

Servicios disponibles:

| Servicio        | URL                          |
|-----------------|------------------------------|
| Spring Boot API | http://localhost:8080        |
| Swagger UI      | http://localhost:8080/swagger-ui.html |
| Motor Python    | http://localhost:8001        |
| Grafana         | http://localhost:3001        |

---

## Desarrollo local por módulo

### Backend Spring Boot

```bash
cd backend/backend-spring
# Requiere PostgreSQL corriendo en localhost:5432
# Usar el perfil dev:
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Motor Python

```bash
cd backend/engine-python
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend/pdgseg-frontend
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
| `JWT_PRIVATE_KEY`          | Clave privada RS256 en PEM para firma de tokens JWT |
| `INTERNAL_SERVICE_TOKEN`   | Token secreto para comunicación Spring ↔ Python (≥32 chars) |
| `ENGINE_BASE_URL`          | URL base del motor Python |
| `SANDBOX_ROOT`             | Directorio raíz para clonar repositorios analizados |
| `MAX_REPO_SIZE_MB`         | Tamaño máximo de repositorio en MB (default: 100) |
| `MAX_FILE_COUNT`           | Máximo número de archivos por repositorio (default: 5000) |
| `MAX_COMPRESSION_RATIO`    | Ratio máximo de compresión para detectar zip bombs (default: 100) |
| `ALLOWED_GIT_DOMAINS`      | Dominios Git permitidos (separados por coma) |
| `RULE_TIMEOUT_MS`          | Timeout por regla de análisis en milisegundos (default: 30000) |
| `TRACEABILITY_RETENTION_DAYS` | Días de retención de registros de trazabilidad (default: 365) |
| `VITE_API_BASE_URL`        | URL base de la API para el frontend |

---

## Correr los tests

### Spring Boot

```bash
cd backend/backend-spring
mvn test
```

### Motor Python

```bash
cd backend/engine-python
pytest tests/ -v
bandit -c bandit.yml -r app/
```

### Frontend

```bash
cd frontend/pdgseg-frontend
npm test
npm run test:e2e
```

---

## Agregar al tutor como colaborador en Bitbucket

1. Ir al repositorio en Bitbucket: **Settings → User and group access**
2. Buscar el correo del tutor en el campo de búsqueda
3. Seleccionar el rol **Read** (o **Write** si el tutor necesita hacer comentarios en PRs)
4. Confirmar con **Add**
