# CI en p2tools (Jenkins)

Los repositorios oficiales del proyecto están en p2tools (Bitbucket Server 7.21):

| Repositorio | HTTPS | SSH (red Icesi o VPN) |
|---|---|---|
| segsoft-backend | `https://pi2tools.icesi.edu.co/bitbucket/scm/segsoft/segsoft-backend.git` | `ssh://git@pi2tools.icesi.edu.co:7999/segsoft/segsoft-backend.git` |
| segsoft-frontend | `https://pi2tools.icesi.edu.co/bitbucket/scm/segsoft/segsoft-frontend.git` | `ssh://git@pi2tools.icesi.edu.co:7999/segsoft/segsoft-frontend.git` |
| segsoft-motorpython | `https://pi2tools.icesi.edu.co/bitbucket/scm/segsoft/segsoft-motorpython.git` | `ssh://git@pi2tools.icesi.edu.co:7999/segsoft/segsoft-motorpython.git` |
| segsoft-docs | `https://pi2tools.icesi.edu.co/bitbucket/scm/segsoft/segsoft-docs.git` | `ssh://git@pi2tools.icesi.edu.co:7999/segsoft/segsoft-docs.git` |

Bitbucket Server **no ejecuta pipelines propios** (`bitbucket-pipelines.yml` es solo de
Bitbucket Cloud). El CI corre en el **Jenkins de p2tools**
(`https://pi2tools.icesi.edu.co/jenkins/`, versión 2.541.3), y cada repositorio de código
tiene su `Jenkinsfile`. Los workflows de `.github/workflows/` se conservan para el espejo
en GitHub y hacen lo mismo.

## Pipelines

| Repositorio | Etapas | Imágenes |
|---|---|---|
| segsoft-backend | 1. Tests unitarios y JSON Schema de los reportes · 2. Tests de integración contra un PostgreSQL 15 propio del build | `maven:3.9-eclipse-temurin-17`, `postgres:15` |
| segsoft-frontend | Dependencias (`npm ci`) · Lint · Tests unitarios (Vitest) · Build de producción | `node:20` |
| segsoft-motorpython | Dependencias · Validación de precisión y cobertura (`tests/validation/`) | `python:3.11-slim` |

Todos publican sus resultados con el plugin JUnit, así que Jenkins muestra cuántas pruebas
corrieron y cuáles fallaron.

**Backend: solo las suites de reportes.** El `mvn test` completo arrastra 25 fallos previos
y ajenos a los reportes (PolicyControllerTest, PolicyControllerSearchTest,
RuleControllerTest y AuthServiceTest). Cuando se corrijan, el pipeline puede pasar a
`mvn verify -Pintegration-tests`.

### Tests de integración sin falsos verdes

Los tests de integración (`*IntegrationTest`) usan un PostgreSQL real: el de
`application-test.yml` (`localhost:5432/pdgseg_test`) o el que indiquen
`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` y `SPRING_DATASOURCE_PASSWORD`.
`PostgreSQLContainerBase` comprueba la conexión antes de que Spring cargue el contexto:

| Situación | Resultado |
|---|---|
| Hay base de datos | Corren todos (hoy 21 en las suites de reportes) |
| No hay base de datos, en local | Se omiten y Maven los muestra como `Skipped` |
| No hay base de datos y `CI=true` | **Fallan** con "Base de datos de integración no disponible en …" |

Antes, la clase base solo comprobaba que hubiera Docker. Si no lo había (o si la versión de
Docker no era compatible con Testcontainers 1.20), JUnit abortaba la clase y Surefire
reportaba **0 tests, 0 omitidos**: un build verde sin haber probado nada. Los pipelines
fijan `CI=true`.

## Requisitos en Jenkins

- Plugins: **Pipeline**, **Docker Pipeline**, **JUnit** y **Git** (o Bitbucket Server
  Integration / Bitbucket Branch Source).
- Un agente con **Docker**. Los contenedores pueden correr con un usuario sin permisos de
  root y sin `HOME` escribible: las cachés de Maven, npm y pip quedan dentro del workspace,
  y el frontend no descarga el binario de Cypress (`CYPRESS_INSTALL_BINARY=0`).
- Salida a internet desde los contenedores, para descargar dependencias de Maven Central,
  npm y PyPI.

## Configurar los jobs (una vez por repositorio)

Requiere permiso para crear jobs en el Jenkins de p2tools (si no lo tienes, pídeselo al
administrador o al tutor).

1. **Token de Bitbucket.** En p2tools Bitbucket: avatar → *Manage account* → *HTTP access
   tokens* → *Create token*, con permiso de lectura de repositorios.
2. **Credencial en Jenkins.** *Manage Jenkins* → *Credentials* → *Add credentials* →
   *Username with password*: tu usuario de Bitbucket y el token. ID sugerido:
   `p2tools-bitbucket`.
3. **Job.** *New Item* → nombre del repositorio (por ejemplo `segsoft-backend`) →
   **Multibranch Pipeline**.
   - *Branch Sources* → *Git* → *Project Repository*: la URL HTTPS de la tabla de arriba;
     *Credentials*: `p2tools-bitbucket`.
   - *Build Configuration*: *by Jenkinsfile*, ruta `Jenkinsfile`.
   - *Scan Multibranch Pipeline Triggers*: *Periodically if not otherwise run*, cada 5
     minutos (o el webhook del paso 4).
4. **Webhook (opcional).** Si el Jenkins tiene el plugin *Bitbucket Server Integration*,
   el job puede usarlo como *Branch Source* y registrar el webhook en Bitbucket. Si no,
   basta con el escaneo periódico del paso 3.
5. Repetir para `segsoft-frontend` y `segsoft-motorpython`. `segsoft-docs` no tiene
   pipeline.

Con un Multibranch Pipeline, Jenkins construye `main` y también cada rama y cada pull
request, y Bitbucket muestra el estado del build en el PR cuando el plugin lo soporta.

## Verificación

Hecha el 2026-10-21, sin acceso al Jenkins de p2tools (pide inicio de sesión):

1. **Sintaxis:** los tres `Jenkinsfile` pasan el validador de pipelines declarativos de un
   Jenkins 2.541.3 (la misma versión de p2tools), con Pipeline, Docker Pipeline, JUnit y Git.
2. **Ejecución en Jenkins:** los tres pipelines corrieron completos en ese Jenkins local,
   con `docker.image().inside`, el PostgreSQL del build y la publicación JUnit:

   | Pipeline | Resultado | Tests publicados en Jenkins |
   |---|---|---|
   | segsoft-backend | SUCCESS | 191 (170 unitarios + 21 de integración contra PostgreSQL) |
   | segsoft-frontend | SUCCESS | 133, más lint y build |
   | segsoft-motorpython | SUCCESS | 4 |

   La única diferencia con los `Jenkinsfile` del repositorio fue la red: el Docker local
   (rootless) solo tiene salida a internet con `--network host`, así que la copia de prueba
   usó esa red en lugar de `--link`.
3. **Usuario sin privilegios:** las etapas se ejecutaron en las mismas imágenes con
   `-u 1000:1000` y `HOME=/`, como lo haría un agente de Jenkins sin root. Esa prueba
   detectó que la instalación de Cypress fallaba (no podía escribir en `/.cache`) y llevó a
   `CYPRESS_INSTALL_BINARY=0`.
4. **Tests de integración:** comprobados los tres casos de la tabla anterior (con base de
   datos, sin base de datos en local y sin base de datos con `CI=true`).

**Pendiente:** crear los jobs en el Jenkins de p2tools (pasos de arriba) y confirmar el
primer build. Depende de que sus agentes tengan Docker.
