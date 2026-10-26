# SegSoft: contexto para elaborar el guion de pruebas de usuario y la encuesta de satisfacción

> **Para la IA que use este documento.** Describe el estado **real y verificado** de
> SegSoft al 2026-10-05 (versión de `main` en los cuatro repositorios). Todos los
> valores, textos de pantalla, mensajes de error y resultados esperados se
> obtuvieron ejecutando la aplicación, no de especificaciones. Úsalos tal cual.
>
> - **No inventes** funcionalidades que no estén aquí.
> - Respeta el **formato de guion entregado por la universidad**: este documento
>   solo aporta el contenido.
> - La sección 9 lista las **limitaciones conocidas**. Esas cosas no deben
>   presentarse como fallas a reportar, salvo que el objetivo sea medir su
>   impacto.
> - La sección 12 asocia las **capturas de pantalla** de la carpeta
>   `InterfazSegSoft/` a cada paso, para usarlas como guía visual en el
>   manual o guion.

---

## 1. Qué es SegSoft

SegSoft es una plataforma web de **análisis estático de seguridad y cumplimiento
normativo** de código fuente. Es el Proyecto de Grado (PDG) de la Universidad
Icesi.

Flujo general:

1. El usuario **sube un proyecto**, como ZIP o como URL de un repositorio Git.
2. **Elige las políticas de seguridad** con las que quiere evaluarlo. Las
   políticas están alineadas con OWASP, ISO 27001, NIST SP 800-53 y DevSecOps.
3. El sistema **ejecuta el análisis** y muestra los **hallazgos**:
   vulnerabilidades o malas prácticas, con archivo, línea, severidad y evidencia.
4. Calcula el **porcentaje de cumplimiento** por política, por categoría y por
   marco normativo.
5. Un auditor puede **generar un reporte de cumplimiento inmutable** y
   **exportarlo en PDF** (para personas) o en **SARIF** (para pipelines CI/CD y
   GitHub Code Scanning).

**Catálogo de 5 categorías ("Claude Code Security"):**
- SQL Injection
- Cross-Site Scripting (XSS)
- Fallo de autenticación
- Manejo inseguro de datos
- Vulnerabilidad en dependencias

**Público objetivo:**
- Desarrolladores: analizan su propio código.
- Auditores: revisan, reportan y archivan evidencia.
- Administradores de seguridad: gestionan el banco de políticas y los Policy Sets.

---

## 2. Acceso y preparación del entorno

| Elemento | Valor |
|---|---|
| URL de la aplicación (entorno local) | `http://localhost:5173` (cambia si se despliega en otro servidor) |
| Navegadores probados | Chromium y Electron. Las exportaciones PDF se verificaron con los motores de Chrome (PDFium) y Firefox (pdf.js) |
| Idioma de la interfaz | Español, con algunos términos en inglés (ver sección 9) |

### Cuentas de prueba

Las crea automáticamente el sistema en entornos que no son de producción.

| Usuario | Contraseña | Rol | Para qué usarla |
|---|---|---|---|
| `admin` | `admin123` | SECURITY_ADMIN | Todo: gestionar políticas, reglas y Policy Sets, y además lo de auditor |
| `auditor` | `auditor123` | AUDITOR | Analizar, ver cualquier análisis y generar y exportar reportes |
| `dev` | `dev123` | DEVELOPER | Analizar sus propios repositorios. No ve reportes |
| `usuario` | `usuario123` | DEVELOPER | Segundo desarrollador, para probar que no ve lo de otro |

> ⚠️ **Advertencia para el guion.** Tras **5 contraseñas incorrectas seguidas**,
> la cuenta se **bloquea 30 minutos**, y el mensaje sigue siendo "Credenciales
> inválidas". Como las cuentas son compartidas, el caso de bloqueo debe hacerse
> con cuidado o al final de la sesión. Lo recomendable es no incluirlo en un
> guion que usen varias personas a la vez.

**Crear cuenta (registro):** desde el login, el enlace **"Crear cuenta"** abre `/register`.
Cualquiera puede crear una cuenta con rol **DEVELOPER** (usuario de 3 a 50 caracteres que
empieza por letra, guardado en minúsculas; contraseña de 12 o más caracteres con mayúscula,
minúscula, número y carácter especial). Al crearla entra directo al Dashboard. Las cuentas
AUDITOR y SECURITY_ADMIN no se pueden crear desde la aplicación: son las del despliegue. No
hay pantalla de gestión de usuarios (cambiar roles, deshabilitar cuentas). Detalle en
[registro-usuarios.md](../registro-usuarios.md).

### Datos de prueba: tres proyectos ZIP

Están en `pruebas-usuarios/` y salen del repositorio
[JEGH18/SegSoft-Pruebas](https://github.com/JEGH18/SegSoft-Pruebas). Son la
**misma tienda en línea** (backend Java/Spring, reportes en Python/Django y
frontend React) en tres estados de remediación:

| Archivo | Propósito | Qué mide |
|---|---|---|
| `proyecto-vulnerable.zip` | Código con muchas vulnerabilidades intencionales | Que el sistema **detecte** problemas (*recall*) |
| `proyecto-intermedio.zip` | Parcialmente corregido | Que la **clasificación por severidad** y el estado "Requiere revisión" funcionen |
| `proyecto-limpio.zip` | Código seguro, parecido a los patrones vulnerables | Que el sistema **no** reporte falsos positivos (*precisión*) |

Los valores exactos esperados de cada uno están en la sección 6.

---

## 3. Roles y permisos

| Acción | DEVELOPER | AUDITOR | SECURITY_ADMIN |
|---|---|---|---|
| Iniciar y cerrar sesión | ✓ | ✓ | ✓ |
| Subir un repositorio (ZIP o Git) | ✓ | ✓ | ✓ |
| Seleccionar políticas y lanzar el análisis de **su propio** repositorio | ✓ | ✓ | ✓ |
| Modificar la selección de políticas de un repositorio **ajeno** | ✗ | ✗ | ✓ |
| Ver resultados de **sus** análisis | ✓ | ✓ | ✓ |
| Ver resultados de análisis **ajenos** | ✗ (mensaje "Este análisis no está disponible para tu usuario.") | ✓ | ✓ |
| Ver el banco de políticas y el detalle de una política | ✓ (solo lectura) | ✓ (solo lectura) | ✓ |
| Registrar, editar, archivar o restaurar políticas | ✗ | ✗ | ✓ |
| Añadir o archivar reglas de una política | ✗ | ✗ | ✓ |
| Ver Policy Sets | ✓ | ✓ | ✓ |
| Crear, editar, archivar o restaurar Policy Sets | ✗ | ✗ | ✓ |
| Aplicar un Policy Set a un repositorio | ✓ (en su repositorio) | ✓ | ✓ |
| Botón **Generar reporte** en resultados | ✗ (no aparece) | ✓ | ✓ |
| Menú **Reportes**: lista, vista del reporte y descargas | ✗ (mensaje "Los reportes de cumplimiento están disponibles para los roles Auditor y Security Admin.") | ✓ | ✓ |

---

## 4. Mapa de la aplicación

**Menú superior:** Dashboard · Análisis · Policies · Policy Sets · Reportes. A la
derecha aparecen el usuario, su rol y el botón **Cerrar sesión**.

| Pantalla | Ruta | Cómo se llega |
|---|---|---|
| Inicio de sesión | `/login` | Al abrir la app sin sesión |
| Dashboard ("Analiza tu proyecto") | `/` | Menú *Dashboard* |
| Selección de políticas | `/repositories/{id}/policy-selection` | Automático tras subir un repositorio |
| Resultados del análisis | `/analyses/{id}/results` | Automático al terminar el análisis, o menú *Análisis* (solo el **último** análisis abierto en ese navegador) |
| Banco de políticas | `/policies` | Menú *Policies* |
| Detalle de política | `/policies/{id}` | Clic en una política |
| Policy Sets | `/policy-sets` | Menú *Policy Sets* |
| Detalle de Policy Set | `/policy-sets/{id}` | Clic en un Policy Set |
| Reportes (histórico) | `/reports` | Menú *Reportes* |
| Vista del reporte | `/reports/{id}` | Tras *Generar reporte* o desde la lista |
| Inventario de archivos | `/repositories/{id}/files` | **Sin enlace en la interfaz**: solo escribiendo la URL (ver sección 9) |

---

## 5. Funcionalidades en detalle (lo que el probador debe verificar)

### 5.1 Inicio de sesión y sesión

- **Pantalla:** "Bienvenido / Ingresa tus credenciales para continuar". Campos
  **Usuario** (placeholder `nombre.usuario`) y **Contraseña**.
- **Validaciones del formulario:**
  - Usuario vacío → "El usuario es requerido".
  - Contraseña vacía → "La contraseña es requerida".
- **Credenciales incorrectas:** "Credenciales inválidas".
- **Al entrar:** lleva al Dashboard.
- **La sesión se mantiene sola:** el token se renueva de forma transparente;
  dura 8 horas como máximo.
- **Cerrar sesión:** vuelve a `/login`, y las rutas protegidas redirigen al
  login.

### 5.2 Dashboard: cargar un proyecto

- **Título:** "Analiza tu proyecto" (captura 2).
- **Selector de modo:** botones **"Subir archivo ZIP"** y **"URL de
  repositorio Git"**.
- **Dos modos de carga:**
  - **ZIP:** arrastrar o seleccionar un `.zip`. Muestra "Soporta .zip · Máx
    100 MB".
  - **Git:** campos **URL del repositorio** (`https://github.com/usuario/repo.git`),
    **Rama** (`main` por defecto) y **Token de acceso (opcional)**, este último
    solo para repositorios privados. Debajo del token se lee "Se usa una sola
    vez para clonar y no se almacena ni se muestra en ningún lado." (captura 3).
- **Opcional:** en la sección **"FRAMEWORKS SOPORTADOS · AGRUPAR POR NORMA"**
  ("Elige un framework para preseleccionar sus políticas al continuar"), elegir
  una tarjeta para **preseleccionar** sus políticas. Cada tarjeta muestra
  cuántas políticas tiene: DevSecOps 3, ISO 27001 7, NIST SP 800-53 5, OWASP
  ASVS 4, OWASP Top 10 4. La tarjeta elegida queda resaltada con borde.
  - Si existen Policy Sets, aparece además una sección para elegir uno. Hoy no
    se ve, porque no hay ninguno.
- **Botón:** "Subir y continuar a selección de políticas" o "Clonar y continuar
  a selección de políticas".
- **Validaciones y errores:**
  - Archivo que no es ZIP → "Solo se aceptan archivos .zip".
  - Sin archivo → "Selecciona un archivo ZIP".
  - Más de 100 MB → "El archivo supera el límite de 100 MB".
  - Git sin URL → "Ingresa la URL del repositorio Git".
  - Dominio distinto de github.com, gitlab.com o bitbucket.org → "Dominio Git
    no permitido: …".
  - URL con usuario y contraseña incluidos → "La URL no debe incluir
    credenciales. Para repositorios privados, use el campo de token de acceso."
  - URL o rama incorrectas → "El clonado falló. Verifique que la URL y la rama
    sean correctas y que el repositorio sea público."
  - Límite interno de 5 000 archivos por repositorio.
- **Expiración:** el repositorio subido **expira a las 24 horas**. Después no se
  puede volver a analizar, pero sus resultados y reportes se conservan.

### 5.3 Selección de políticas

- **Encabezado:** "Selección de políticas · Repositorio: {id}".
- **Filtros en una sola fila:** buscador por nombre, **categoría** y
  **framework**.
- **Tabla:** casilla por política, Nombre, Categoría, Framework y Control. Clic
  en la fila o en la casilla para marcarla.
- **Casilla "Seleccionar todas (23)":**
  - Marca o desmarca todas las políticas visibles.
  - Con filtros activos dice **"Seleccionar las N políticas filtradas"**, solo
    actúa sobre esas y conserva las ya marcadas.
  - Queda **indeterminada (–)** cuando solo algunas están marcadas.
- **Aplicar un Policy Set** (si existe alguno): muestra una vista previa con las
  políticas que incluye, y los botones "Aplicar este Policy Set" y "Cancelar".
  Si después se cambia algo a mano, aparece **"Selección modificada"**, con
  opción de **"Guardar como nuevo Policy Set"**.
- **Panel "Resumen de selección":**
  - Número de políticas seleccionadas.
  - **Cobertura por categoría** (5 categorías con su conteo).
  - Aviso "Faltan N categorías por cubrir" si alguna queda en 0.
- **Botones:**
  1. **"Guardar selección"**. Es obligatorio guardar antes de analizar; el
     mensaje de confirmación es "Selección guardada correctamente.".
  2. **"Iniciar análisis →"**. Queda deshabilitado (en gris, con el texto
     "Guarda la selección primero") mientras no haya una selección guardada. Durante el proceso muestra "En cola..." y luego
     "Analizando código...". Al terminar **navega solo a Resultados** (toma unos
     segundos).
- **Error:** si se intenta cambiar la selección con un análisis en curso: "No
  se puede modificar la selección mientras exista un análisis en curso".

### 5.4 Resultados del análisis

- **Indicadores** (captura 5):
  - **Cumplimiento ponderado**, con 2 decimales y debajo "X% sin ponderar".
  - **Políticas evaluadas**.
  - **Conformes**.
  - **No conformes / revisión**.
- **"Findings por severidad":** CRITICAL, HIGH, MEDIUM y LOW, más el total.
- **"Distribución por categoría":** gráfico circular con el **porcentaje** de
  hallazgos de cada categoría. Las categorías se muestran con su nombre técnico
  (`SQL_INJECTION`, `XSS`…).
- **"Resultados por política":** Política, Estado, Findings y Críticos/Altos.
  El estado se muestra **en inglés**: `COMPLIANT` (verde), `NON_COMPLIANT`
  (rojo) o `REQUIRES_REVIEW` (ámbar) (captura 5).
- **Filtros de hallazgos:** severidad y categoría (chips), política (lista) y
  archivo (texto, por ejemplo `src/main/...`).
- **Tabla de hallazgos (paginada):** Severidad, Categoría, Política, Archivo,
  Línea, CWE y "Ver detalle".
- **Panel de detalle de un hallazgo:**
  - Política.
  - **Acción sugerida**, o "Esta regla no trae una recomendación específica
    todavía…".
  - Archivo, Línea (o "Archivo completo"), CWE y Tipo de regla.
  - **Evidencia**: el fragmento de código, con **secretos enmascarados** como
    `password = *****`.
- **Botón "Generar reporte"** (solo AUDITOR y SECURITY_ADMIN, y solo con el
  análisis completado): crea el reporte y abre su vista.

### 5.5 Reportes de cumplimiento

- **Generar:** desde Resultados. El reporte queda **congelado**: si después
  cambian las políticas o el análisis, el reporte **no cambia**.
- **Vista del reporte** (`/reports/{id}`, captura 9):
  - **Encabezado:** "Reporte de cumplimiento", insignia **Generado**, y
    repositorio con fecha y autor.
  - **Selector "Vista técnica / Vista ejecutiva".** La vista queda en la URL
    (`?view=executive`), así que el enlace se puede compartir.
  - **En ambas vistas:**
    - Cumplimiento global y ponderado, con barra de color: verde ≥ 80 %,
      ámbar ≥ 50 %, rojo < 50 %.
    - Políticas evaluadas (cumplen, no cumplen y en revisión).
    - Hallazgos y severidad máxima.
    - **Recomendaciones priorizadas** (hasta 10).
    - Hallazgos por severidad.
    - **Cobertura de las 5 categorías** ("Sin cobertura" si no hubo políticas
      de esa categoría).
    - **Cobertura por marco normativo.**
  - **Solo en la vista técnica:**
    - Controles de cada marco (por ejemplo `A03:2021`, `A.8.24`), coloreados por
      estado.
    - Tabla "Resultados por política" con enlace a cada política.
    - **"Hallazgos detallados"**: archivo, línea, CWE, evidencia y acción
      sugerida.
    - **"Metadatos y trazabilidad"**: enlace al análisis, "Ver histórico de
      reportes" del repositorio y checksum SHA-256.
  - **La vista ejecutiva no muestra código** ni rutas de archivos: está pensada
    para personas no técnicas.
- **Exportaciones** (botones **Descargar PDF** y **Descargar SARIF**):
  - Durante la generación el botón muestra "Generando PDF…" y queda
    deshabilitado.
  - Al terminar: "Descargado segsoft-report-{id}.pdf".
  - Si el archivo se sirvió desde caché, se añade **"(desde caché)"**. Es lo
    normal desde la segunda descarga del mismo formato; la primera tarda unos
    0,5 s y las siguientes son casi instantáneas.
  - **El PDF incluye:**
    - portada con metadatos e índice;
    - 1. Resumen ejecutivo;
    - 2. Cobertura por categoría;
    - 3. Resultados por política;
    - 4. Hallazgos detallados, ordenados de crítica a baja;
    - numeración "Página X de Y" y checksum en el pie de cada página;
    - secretos enmascarados.
  - **El SARIF** es un archivo JSON estándar (SARIF 2.1.0) que se puede subir a
    GitHub Code Scanning.
- **Histórico** (menú *Reportes*):
  - **Tabla** (captura 8): Repositorio (nombre del archivo y debajo el id del
    reporte), Generado (fecha y hora), Por, Cumplimiento, Hallazgos e
    **Integridad** ("Verificada" en verde o "Alterado" en rojo). Ordenada del
    más reciente al más antiguo.
  - **Filtro por repositorio:** se activa con "Ver histórico de reportes" y se
    quita con "Ver todos".
- **Integridad:**
  - Si alguien altera un reporte directamente en la base de datos, la lista lo
    marca como **"Alterado"**.
  - Al abrirlo, la app muestra "El contenido de este reporte no coincide con su
    checksum: fue alterado después de generarse. No se muestra ni se puede
    exportar…".
  - En el entorno local actual hay un ejemplo: un reporte de `demo.zip` marcado
    "Alterado".
- **Mensajes de error al descargar:**
  - 409 → "El reporte no superó la verificación de integridad (checksum) y no se
    descargó…".
  - 422 → mensaje con el tamaño y el límite de 50 MB.
  - 500 → "El servidor no pudo generar el archivo… reporta el código {traceId}…".
  - Sin red → "No se pudo contactar al servidor…".

### 5.6 Banco de políticas (menú *Policies*)

- **"Banco de Políticas de Seguridad"** (captura 6):
  - Botón **"+ Nueva política"** (solo SECURITY_ADMIN).
  - **Filtros:** "Buscar por nombre...", categorías, marcos y estados.
  - Contador "23 políticas encontradas".
  - **Tabla:** Nombre, Categoría, Marco, Control, Detalle 27002, Estado (insignia
    verde "Activa") y Peso.
  - **10 políticas por página:** "Página 1 de 3", con "← Anterior" y
    "Siguiente →".
- **Registrar política** (solo SECURITY_ADMIN, "Registrar nueva política"):
  - **Nombre** \* (máximo 200 caracteres; "El nombre es obligatorio").
  - **Descripción** \* (entre 20 y 500 caracteres; "La descripción debe tener al
    menos 20 caracteres").
  - **Marco normativo** \* y **Categoría** \*.
  - **Control** (los controles se cargan del catálogo del marco; para
    "Personalizado" es texto libre, por ejemplo `TEAM-XSS-01`).
  - **Guía de implementación ISO/IEC 27002** (opcional).
  - **Errores:**
    - "Ya existe una política con ese nombre y marco normativo."
    - "No hay un control definido para esa combinación de marco y categoría."
- **Detalle de política:**
  - **Campos editables** (solo SECURITY_ADMIN y solo políticas activas):
    descripción, **peso de criticidad (1-100)** (se usa en el cumplimiento
    ponderado) y aplicabilidad (JSON).
  - **Campos que no se editan:** marco, control y categoría (tooltip "No
    editable…").
  - **Otras secciones:** "Reglas activas", "Ejecutable", **Trazabilidad**
    (controles NIST y guía ISO 27002) e **Historial de cambios**.
  - **Archivar política:** confirmación "La política dejará de aparecer en
    listados… y no podrá seleccionarse para nuevos análisis. No se elimina
    físicamente". Luego se puede **Restaurar**.
  - Otros roles ven "Solo SECURITY_ADMIN puede editar políticas.".
- **Reglas de una política** (solo SECURITY_ADMIN, botón "Añadir regla"):
  - **Campos comunes:** Tipo, Severidad, CWE ID (por ejemplo `CWE-89`) y
    Lenguajes (por ejemplo `java,python`).
  - **Campos según el tipo:**
    - **Patrón Regex** o **Consulta AST:** "Patrón Regex".
    - **Config Check:** "Clave de configuración" (por ejemplo
      `server.ssl.enabled`) y "Condición" ("Debe existir" o "No debe tener
      valor…", con "Valor prohibido").
    - **Dependencias:** "Ecosistema" (Maven, npm o PyPI), groupId y artifact,
      "Versión vulnerable <" y CVE (por ejemplo `CVE-2021-44228`).

### 5.7 Policy Sets

- **Qué son:** conjuntos reutilizables de políticas que estandarizan un perfil
  de cumplimiento.
- **Lista** (captura 7):
  - Botón **"+ Nuevo Policy Set"** (solo SECURITY_ADMIN).
  - Buscador "Buscar Policy Set por nombre..." y filtro Activos/Archivados.
  - Tabla: Nombre, Descripción, Políticas, Estado y Versión.
  - Sin sets se muestra "0 Policy Sets" y "No hay Policy Sets registrados.
    Cree uno para estandarizar sus análisis.".
- **Crear** (solo SECURITY_ADMIN):
  - **Nombre** \* ("El nombre es obligatorio") y **Descripción** (opcional).
  - Tabla de políticas activas con buscador y **"Seleccionar todas"**.
  - Al menos una política ("Debe incluir al menos una política.").
  - Botón "Crear Policy Set".
- **Detalle:**
  - Cobertura por categoría y composición editable; la versión sube al guardar.
  - **Archivar y restaurar.** No se puede archivar si hay análisis en curso que
    dependen del set.
  - **"Aplicar a repositorio"**: lleva al Dashboard con el set preseleccionado.
- **Estado actual:** **no hay ningún Policy Set creado**. El guion debe incluir
  crear uno (como admin) antes de probar aplicarlo.

---

## 6. Valores esperados con los proyectos de prueba

**Condiciones:** subir cada ZIP desde el Dashboard, marcar **todas** las
políticas activas (23) con "Seleccionar todas", **Guardar selección** y
**Iniciar análisis**.

| Indicador | proyecto-vulnerable | proyecto-intermedio | proyecto-limpio |
|---|---|---|---|
| Cumplimiento ponderado, en **Resultados** (número grande) | **8.85%** | **88.68%** | **100%** |
| Cumplimiento simple, en **Resultados** ("sin ponderar") | **8.7%** | **86.96%** | **100%** |
| Cumplimiento global, en el **reporte** y la **lista de reportes** (1 decimal) | **8,7 %** | **87 %** | **100 %** |
| Cumplimiento ponderado, en el **reporte** (1 decimal) | **8,9 %** | **88,7 %** | **100 %** |
| Cumplimiento ponderado, en el **PDF** (redondeo "half-even" de Java) | **8,8 %** | **88,7 %** | **100 %** |
| Tarjetas "Conformes" / "No conformes / revisión" en **Resultados** | 2 / 21 | 20 / 3 | 23 / 0 |
| Políticas evaluadas | 23 | 23 | 23 |
| Cumplen / No cumplen / Requieren revisión | **2 / 18 / 3** | **20 / 0 / 3** | **23 / 0 / 0** |
| Hallazgos totales | **42** | **5** | **0** |
| Crítica / Alta / Media / Baja | **17 / 18 / 7 / 0** | **0 / 0 / 5 / 0** | 0 / 0 / 0 / 0 |
| Severidad máxima | Crítica | Media | Sin hallazgos |
| Hallazgos por categoría (conteo en el reporte): SQL Injection | 7 | 3 | 0 |
| XSS | 6 | 1 | 0 |
| Fallo de autenticación | 6 | 0 | 0 |
| Manejo inseguro de datos | 11 | 0 | 0 |
| Vulnerabilidad en dependencias | 12 | 1 | 0 |
| "Distribución por categoría" en **Resultados** (% de hallazgos) | SQL 16.67 · XSS 14.29 · Autenticación 14.29 · Datos 26.19 · Dependencias 28.57 | SQL 60 · XSS 20 · Autenticación 0 · Datos 0 · Dependencias 20 | sin datos |
| Cumplimiento por marco: ISO 27001 | 0 % | 71,43 % | 100 % |
| OWASP Top 10 2021 | 25 % | 100 % | 100 % |
| OWASP ASVS | 0 % | 75 % | 100 % |
| NIST SP 800-53 | 20 % | 100 % | 100 % |
| DevSecOps | 0 % | 100 % | 100 % |
| Recomendación n.º 1 | "No almacenar secretos en código fuente" | "Actualización periódica de dependencias" | No hay recomendaciones ("Todas las políticas evaluadas se cumplen…") |

**Formato de los números:** el mismo valor se ve distinto según la pantalla.
- En **Resultados del análisis**: punto decimal y hasta dos decimales (por
  ejemplo `88.68%`).
- En la **vista del reporte** y la **lista de reportes**: coma decimal, un
  decimal como máximo y espacio antes del `%` (por ejemplo `87 %`, `8,9 %`).
- El guion debe pedir el valor **según la pantalla** que se esté revisando.

La captura 5 corresponde al **proyecto intermedio**: 88.68 % ponderado,
"86.96% sin ponderar", 23 evaluadas, 20 conformes, 3 no conformes/revisión,
MEDIUM 5 y 5 findings totales.

La captura 9 corresponde al **proyecto limpio**: 100 %, 23 cumplen y 0
hallazgos.

**Nota:** el README del repositorio de pruebas dice 43 hallazgos para el
proyecto vulnerable. El valor vigente es **42**, porque una regla de cifrado
duplicada se eliminó del catálogo. El detalle esperado por archivo y línea está
en `SegSoft-Pruebas/docs/<proyecto>.expected_findings.yml` y en
`docs/<proyecto>.md` (incluye falsos negativos conocidos del motor).

---

## 7. Catálogo actual de políticas (23 activas, todas ejecutables)

| Categoría | Política | Marco | Control | Peso |
|---|---|---|---|---|
| Fallo de autenticación | Autenticación multifactor para roles privilegiados | ISO 27001 | A.8.5 | 92 |
| Fallo de autenticación | Bloqueo de cuenta tras intentos fallidos | ISO 27001 | A.8.5 | 85 |
| Fallo de autenticación | Gestión segura de credenciales de autenticación | NIST SP 800-53 | IA-5 | 88 |
| Fallo de autenticación | Política de contraseñas seguras | OWASP Top 10 2021 | A07:2021 | 90 |
| Fallo de autenticación | Tokens JWT con expiración y rotación | OWASP ASVS | V3.5.1 | 88 |
| Dependencias | Actualización periódica de dependencias | ISO 27001 | A.8.8 | 75 |
| Dependencias | Escaneo de dependencias en CI/CD | DevSecOps | – | 85 |
| Dependencias | Prohibición de dependencias con CVE crítico | OWASP Top 10 2021 | A06:2021 | 92 |
| Dependencias | Remediación oportuna de vulnerabilidades en componentes | NIST SP 800-53 | SI-2 | 82 |
| Dependencias | Verificación de integridad de artefactos | DevSecOps | – | 78 |
| Manejo inseguro de datos | Cifrado de datos sensibles en reposo | ISO 27001 | A.8.24 | 90 |
| Manejo inseguro de datos | No almacenar secretos en código fuente | DevSecOps | – | 95 |
| Manejo inseguro de datos | Registro seguro sin datos sensibles | OWASP ASVS | V7.1.1 | 80 |
| Manejo inseguro de datos | Transmisión cifrada con TLS 1.2+ | ISO 27001 | A.8.24 | 88 |
| Manejo inseguro de datos | Uso de algoritmos criptográficos aprobados | NIST SP 800-53 | SC-13 | 90 |
| SQL Injection | Control de acceso a datos por rol | ISO 27001 | A.8.28 | 75 |
| SQL Injection | Prevención de SQL Injection con consultas parametrizadas | OWASP Top 10 2021 | A03:2021 | 90 |
| SQL Injection | Validación de entradas antes de construir consultas SQL | NIST SP 800-53 | SI-10 | 85 |
| SQL Injection | Validación de entradas en capa de acceso a datos | OWASP ASVS | V5.3.4 | 80 |
| XSS | Codificación de salida HTML | OWASP Top 10 2021 | A03:2021 | 85 |
| XSS | Content Security Policy obligatoria | OWASP ASVS | V14.4.3 | 70 |
| XSS | Sanitización de contenido generado por usuarios | ISO 27001 | A.8.26 | 80 |
| XSS | Validación de entradas antes de renderizar contenido dinámico | NIST SP 800-53 | SI-10 | 80 |

**Totales por marco:** ISO 27001 = 7, NIST SP 800-53 = 5, OWASP ASVS = 4,
OWASP Top 10 2021 = 4, DevSecOps = 3.

**Totales por categoría:** Autenticación = 5, Dependencias = 5, Datos = 5,
SQL Injection = 4, XSS = 4.

**Reglas activas:** 24 (16 de patrón regex, 5 de configuración y 3 de
dependencias).

---

## 8. Lista de verificación por rol (insumo para los casos del guion)

Cada ítem tiene un resultado esperado observable. Los identificadores son
sugeridos; la IA debe adaptarlos al formato de la universidad.

### Desarrollador (`dev`)
| ID | Acción | Resultado esperado |
|---|---|---|
| D-01 | Iniciar sesión con `dev` / `dev123` | Entra al Dashboard; arriba a la derecha dice `dev DEVELOPER` |
| D-02 | Iniciar sesión con la contraseña incorrecta (una vez) | "Credenciales inválidas" |
| D-03 | Subir `proyecto-vulnerable.zip` | Pasa a "Selección de políticas" |
| D-04 | Subir un archivo que no sea `.zip` | "Solo se aceptan archivos .zip" |
| D-05 | Usar "Seleccionar todas (23)" | Las 23 marcadas; el resumen dice 23 y la cobertura 4/4/5/5/5 |
| D-06 | Filtrar por framework ISO 27001 y usar "Seleccionar las 7 políticas filtradas" | Solo las 7 de ISO quedan marcadas; al quitar el filtro, la casilla general queda indeterminada |
| D-07 | Intentar "Iniciar análisis" sin guardar | Botón deshabilitado, con el texto "Guarda la selección primero" |
| D-08 | Guardar selección e iniciar el análisis | "Selección guardada correctamente."; luego "Analizando código…" y llega a Resultados |
| D-09 | Revisar los indicadores de Resultados | Valores de la sección 6 (vulnerable: "8.85%" ponderado, "8.7% sin ponderar", 23 evaluadas, 2 conformes, 21 no conformes/revisión y 42 findings totales) |
| D-10 | Filtrar hallazgos por severidad CRITICAL | 17 hallazgos |
| D-11 | Abrir el detalle de un hallazgo con secreto | La evidencia muestra el secreto como `*****` |
| D-12 | Buscar el botón "Generar reporte" | No aparece |
| D-13 | Abrir el menú *Reportes* | Mensaje de acceso restringido a Auditor y Security Admin |
| D-14 | Abrir el banco de políticas y una política | Solo lectura ("Solo SECURITY_ADMIN puede editar políticas.") |
| D-15 | Abrir con `usuario` un análisis de `dev` (URL copiada) | "Este análisis no está disponible para tu usuario." |

### Auditor (`auditor`)
| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Analizar `proyecto-intermedio.zip` con todas las políticas | 5 hallazgos, todos de severidad Media; 20 cumplen y 3 requieren revisión |
| A-02 | Pulsar **Generar reporte** | Abre la vista del reporte en **Vista técnica** |
| A-03 | Cambiar a **Vista ejecutiva** | Desaparecen la tabla de políticas, los hallazgos detallados y el código; quedan las métricas, las recomendaciones y las 5 categorías; la URL termina en `?view=executive` |
| A-04 | Revisar "Cobertura por categoría" | Las 5 categorías, con su porcentaje |
| A-05 | Descargar PDF | Se descarga `segsoft-report-{id}.pdf`; el PDF tiene portada, índice, las 4 secciones, "Página X de Y" y el checksum en el pie |
| A-06 | Descargar PDF otra vez | Mensaje "(desde caché)" y respuesta casi instantánea |
| A-07 | Descargar SARIF | Se descarga `segsoft-report-{id}.sarif` |
| A-08 | Menú *Reportes* | El reporte aparece con integridad "Verificada" |
| A-09 | "Ver histórico de reportes" desde un reporte | La lista se filtra a ese repositorio; "Ver todos" quita el filtro |
| A-10 | Abrir un análisis de otro usuario | Lo ve (el auditor tiene acceso de lectura a todo) |
| A-11 | Analizar `proyecto-limpio.zip` y generar su reporte | 100 % de cumplimiento, 0 hallazgos, sin recomendaciones |
| A-12 | Abrir el reporte marcado "Alterado" (solo en el entorno local actual) | Mensaje de reporte alterado; no se muestra ni se exporta |

### Administrador de seguridad (`admin`)
| ID | Acción | Resultado esperado |
|---|---|---|
| S-01 | Registrar una política con una descripción de menos de 20 caracteres | "La descripción debe tener al menos 20 caracteres" |
| S-02 | Registrar una política válida con marco "Personalizado" y control `TEAM-XSS-01` | Aparece en el banco como Activa |
| S-03 | Registrar otra política con el mismo nombre y marco | "Ya existe una política con ese nombre y marco normativo." |
| S-04 | Cambiar el peso de una política y guardar | Se guarda; el historial de cambios registra el evento |
| S-05 | Añadir una regla de tipo Patrón Regex a su política | La regla aparece en la tabla de reglas |
| S-06 | Archivar la política creada | Pide confirmación; pasa a Archivada y deja de aparecer en la selección para análisis; se puede Restaurar |
| S-07 | Crear un Policy Set sin políticas | "Debe incluir al menos una política." |
| S-08 | Crear el Policy Set "Perfil OWASP" con las políticas OWASP (filtro y "Seleccionar todas") | Se crea en versión 1 |
| S-09 | Editar el Policy Set y quitar una política | La versión sube a 2 |
| S-10 | "Aplicar a repositorio" desde el Policy Set y subir un ZIP | La selección aparece con la vista previa del set; "Aplicar este Policy Set" la aplica |
| S-11 | En la selección, cambiar una casilla después de aplicar el set | Aviso "Selección modificada" con opción "Guardar como nuevo Policy Set" |
| S-12 | Archivar y restaurar el Policy Set | Cambia de estado; en la lista se filtra por Activos o Archivados |

---

## 9. Limitaciones conocidas (no son fallas a reportar)

- **Menú *Análisis*:** abre solo el **último análisis visto en ese navegador**.
  No existe una lista de todos los análisis. Si nunca se analizó nada en ese
  navegador, muestra "Aún no has ejecutado ningún análisis".
- **Inventario de archivos:** existe (`/repositories/{id}/files`, con filtros
  por lenguaje y tipo de artefacto), pero **no tiene enlace** en la interfaz.
- **Usuarios:** el registro solo crea cuentas DEVELOPER, y no hay gestión de usuarios: para
  tener un AUDITOR o un SECURITY_ADMIN hay que usar las cuentas del despliegue.
- **Idioma mixto:**
  - El menú dice "Policies" y "Policy Sets".
  - En Resultados se usa "Findings" y las severidades salen en inglés
    (CRITICAL, HIGH…).
  - La vista del reporte y el PDF están en español ("Hallazgos", "Crítica",
    "Alta"…).
- **Motor basado en reglas** (sobre todo expresiones regulares): tiene
  **falsos negativos conocidos**, documentados en `SegSoft-Pruebas/docs/`.
- **Estados en Resultados:** la tabla "Resultados por política" muestra los
  estados en inglés (`COMPLIANT`, `NON_COMPLIANT`, `REQUIRES_REVIEW`), mientras
  que el reporte usa "Cumple", "No cumple" y "Requiere revisión".
- **Entradas "repo.zip" en el histórico:** el histórico de este entorno local
  ya tiene varios reportes llamados `repo.zip`, generados al medir los valores
  esperados. No son de los probadores. Para una sesión limpia conviene usar una
  base de datos nueva o advertirlo.
- **Recomendaciones:** varias usan un texto genérico ("Corregir los hallazgos que
  incumplen la política…") cuando la regla no trae una acción sugerida
  específica.
- **Repositorios:** expiran a las 24 horas; después hay que volver a subirlos
  para analizar de nuevo.
- **Bloqueo de cuenta:** 5 intentos fallidos bloquean 30 minutos, con el mismo
  mensaje "Credenciales inválidas".
- **Límite de peticiones:** el banco de políticas acepta 60 solicitudes por
  minuto por usuario y dirección IP; un uso normal no lo alcanza.
- **Interfaz sin pruebas de usabilidad móvil:** está diseñada para escritorio,
  aunque los filtros se adaptan a pantallas pequeñas.

---

## 10. Insumos para la encuesta de satisfacción

**Objetivo sugerido:** evaluar la usabilidad, la utilidad percibida y la
claridad de los resultados de SegSoft, según el rol del participante.

**Perfil del participante a preguntar al inicio:**
- rol con el que probó (desarrollador, auditor o administrador);
- experiencia en desarrollo de software y en seguridad o cumplimiento;
- si conoce OWASP o ISO 27001;
- si ha usado herramientas similares (SonarQube, Snyk, GitHub Code Scanning…).

**Dimensiones a evaluar, con las funcionalidades concretas que cubre cada una:**

| Dimensión | Qué evaluar en SegSoft |
|---|---|
| Facilidad de uso general | Navegación del menú, login y flujo Dashboard → Selección → Resultados |
| Carga del proyecto | Subir el ZIP o la URL Git, claridad de los mensajes de error |
| Selección de políticas | Filtros, "Seleccionar todas", Policy Sets, resumen de cobertura por categoría, obligación de guardar antes de analizar |
| Rapidez | Tiempo del análisis (segundos), de generación del reporte y de descarga del PDF y SARIF (con caché) |
| Comprensión de resultados | Indicadores de cumplimiento (simple y ponderado), severidades, filtros y detalle del hallazgo (evidencia, CWE, acción sugerida) |
| Utilidad de las recomendaciones | Acciones sugeridas y recomendaciones priorizadas del reporte |
| Reportes | Vista técnica frente a ejecutiva, cobertura por categoría y por marco, histórico e integridad |
| Exportaciones | Calidad y presentación del PDF; utilidad del SARIF para CI/CD |
| Confianza | Enmascarado de secretos, verificación de integridad, reporte inmutable, control de acceso por rol |
| Gestión (solo admin) | Registrar y editar políticas y reglas, Policy Sets |
| Consistencia visual e idioma | Mezcla español/inglés, claridad de etiquetas y colores de severidad y estado |

**Tipos de pregunta sugeridos:**
- Escala Likert de 1 a 5 por dimensión.
- El cuestionario estándar **SUS** (System Usability Scale, 10 ítems) para tener
  una métrica comparable.
- Preguntas sobre tareas concretas ("¿Pudiste generar y descargar el PDF sin
  ayuda?": sí / con dificultad / no).
- Preguntas abiertas: qué fue lo más útil, qué fue lo más confuso, qué
  funcionalidad falta (por ejemplo, la lista de todos los análisis o la gestión
  de usuarios) y si lo usarían en un proyecto real.
- Preguntas específicas por rol:
  - **Auditor:** "¿La vista ejecutiva sirve para presentar a directivos?",
    "¿El PDF serviría como evidencia de auditoría?".
  - **Desarrollador:** "¿Los hallazgos indican con claridad dónde y cómo
    corregir?".
  - **Administrador:** "¿Es claro cómo definir políticas, reglas y Policy
    Sets?".

---

## 11. Glosario

| Término | Significado en SegSoft |
|---|---|
| **Política** | Requisito de seguridad del banco (por ejemplo "Prevención de SQL Injection…"), asociado a un marco, un control, una categoría y un **peso** de criticidad (1-100) |
| **Regla** | Verificación automática que implementa una política: patrón regex, consulta AST, chequeo de configuración o de dependencias |
| **Policy Set** | Conjunto reutilizable de políticas (un perfil de cumplimiento), con versión |
| **Hallazgo (finding)** | Coincidencia de una regla en el código, con archivo, línea, severidad, CWE y evidencia |
| **Severidad** | Crítica, Alta, Media o Baja (CRITICAL, HIGH, MEDIUM, LOW) |
| **Estado de una política** | **Cumple**: sin hallazgos. **No cumple**: al menos un hallazgo de severidad alta o crítica. **Requiere revisión**: tiene hallazgos, pero todos de severidad media o baja, y un humano debe confirmarlos |
| **Cumplimiento** | Porcentaje de políticas que cumplen |
| **Cumplimiento ponderado** | Igual, pero cada política pesa según su **peso de criticidad** |
| **CWE** | Common Weakness Enumeration, el identificador estándar del tipo de debilidad (por ejemplo CWE-89 para SQL Injection) |
| **Reporte de cumplimiento** | Fotografía **inmutable** de un análisis completado, con checksum SHA-256 para detectar alteraciones |
| **Vista técnica / ejecutiva** | Dos lecturas del mismo reporte: completa (con código) o resumida (solo métricas y recomendaciones) |
| **SARIF** | Formato estándar (Static Analysis Results Interchange Format) para que herramientas CI/CD muestren los hallazgos como anotaciones en el código |
| **Marco normativo** | Estándar de referencia: OWASP Top 10 2021, OWASP ASVS, ISO 27001 (con guía ISO 27002), NIST SP 800-53, DevSecOps o Personalizado |

---

## 12. Capturas de la interfaz (`InterfazSegSoft/`)

Carpeta: `pruebas-usuarios/InterfazSegSoft/`. Capturas a 1920 × 955 px,
tomadas con la cuenta **admin** (SECURITY_ADMIN), así que muestran también los
botones de administración.

| N.º | Archivo | Pantalla | Qué se ve | Sección | Casos del guion |
|---|---|---|---|---|---|
| 1 | `Screenshot From 2026-10-05 01-18-00.png` | Inicio de sesión | Logo, "Bienvenido", campos Usuario y Contraseña, botón **Ingresar →**, pie "PDG SegSoft — Universidad Icesi" | 5.1 | D-01, D-02 |
| 2 | `Screenshot From 2026-10-05 01-18-16.png` | Dashboard, modo ZIP | Menú superior; "Analiza tu proyecto"; botones "Subir archivo ZIP" (activo) y "URL de repositorio Git"; zona "Arrastra tu código fuente aquí"; botón "Subir y continuar a selección de políticas"; tarjetas de frameworks con su número de políticas | 5.2 | D-03, D-04 |
| 3 | `Screenshot From 2026-10-05 01-18-41.png` | Dashboard, modo Git | Campos URL del repositorio, Rama (`main`) y Token de acceso (opcional), con la nota de que el token no se almacena; botón "Clonar y continuar a selección de políticas"; tarjeta **ISO 27001** seleccionada | 5.2 | carga por Git, preselección por marco |
| 4 | `Screenshot From 2026-10-05 01-18-55.png` | Selección de políticas (vacía) | Filtros en una fila; "Seleccionar todas (23)" sin marcar; tabla Sel./Nombre/Categoría/Framework/Control; "Resumen de selección" en 0 con "Faltan 5 categorías por cubrir"; "Guardar selección"; "Iniciar análisis →" deshabilitado con "Guarda la selección primero" | 5.3 | D-05, D-06, D-07 |
| 5 | `Screenshot From 2026-10-05 01-19-07.png` | Resultados del análisis (proyecto intermedio) | Botón "Generar reporte"; 88.68% ponderado (86.96% sin ponderar); 23 / 20 / 3; "Findings por severidad" (MEDIUM 5); gráfico "Distribución por categoría"; tabla "Resultados por política" con `COMPLIANT` / `REQUIRES_REVIEW` | 5.4 | D-08, D-09, A-01, A-02 |
| 6 | `Screenshot From 2026-10-05 01-19-19.png` | Banco de políticas | "+ Nueva política"; filtros; "23 políticas encontradas"; tabla con Detalle 27002, Estado "Activa" y Peso; "Página 1 de 3" | 5.6 | D-14, S-01…S-06 |
| 7 | `Screenshot From 2026-10-05 01-19-26.png` | Policy Sets (vacío) | "+ Nuevo Policy Set"; buscador; filtro "Activos"; "0 Policy Sets"; mensaje "No hay Policy Sets registrados…" | 5.7 | S-07, S-08 |
| 8 | `Screenshot From 2026-10-05 01-19-31.png` | Reportes de cumplimiento (histórico) | Tabla Repositorio / Generado / Por / Cumplimiento / Hallazgos / Integridad ("Verificada") | 5.5 | A-08, A-09 |
| 9 | `Screenshot From 2026-10-05 01-19-38.png` | Vista del reporte, **vista técnica** (proyecto limpio) | "← Reportes"; "Reporte de cumplimiento" con insignia "Generado"; selector Vista técnica / Vista ejecutiva; "Exportaciones" con Descargar PDF y Descargar SARIF; indicadores 100 % / 100 % / 23 / 0; "Recomendaciones priorizadas" ("Todas las políticas evaluadas se cumplen…"); "Hallazgos por severidad"; "Cobertura por categoría de Claude Code Security"; "Cobertura por marco normativo" con controles | 5.5 | A-02, A-04, A-05, A-07, A-11 |

**Sugerencia de nombres** para citarlas en el manual (los archivos no se
renombraron):

| N.º | Nombre sugerido |
|---|---|
| 1 | `01-login.png` |
| 2 | `02-dashboard-zip.png` |
| 3 | `03-dashboard-git.png` |
| 4 | `04-seleccion-politicas.png` |
| 5 | `05-resultados-analisis.png` |
| 6 | `06-banco-politicas.png` |
| 7 | `07-policy-sets.png` |
| 8 | `08-reportes-historico.png` |
| 9 | `09-reporte-vista-tecnica.png` |

### Capturas complementarias (`InterfazSegSoft/`, del 10 al 43)

Tomadas el 2026-10-05 con Playwright, a la misma resolución (1920 × 955) y
sobre el entorno local. El flujo principal usa `proyecto-vulnerable.zip`, con
las 23 políticas, y se hizo con **admin**. Las capturas 37 a 43 se tomaron con
**auditor** y **dev**, para mostrar qué cambia según el rol. El número va en el
nombre del archivo y sigue el orden del guion.

**Inicio de sesión, carga y selección**

| Archivo | Rol | Qué se ve | Sección | Casos del guion |
|---|---|---|---|---|
| `10-login-error.png` | — | Login con contraseña incorrecta: recuadro rojo "Credenciales inválidas" | 5.1 | D-02 |
| `11-dashboard-zip-cargado.png` | admin | ZIP elegido (`proyecto-vulnerable.zip`, tamaño) antes de "Subir y continuar…" | 5.2 | D-03 |
| `12-seleccion-filtrada-iso.png` | admin | Filtro ISO 27001 y "Seleccionar las 7 políticas filtradas" marcado; resumen 7 y cobertura 1/1/2/2/1; "Iniciar análisis" deshabilitado | 5.3 | D-06, D-07 |
| `13-seleccion-todas.png` | admin | "Seleccionar todas (23)" marcado; resumen 23 y cobertura 4/4/5/5/5 | 5.3 | D-05 |
| `14-seleccion-guardada.png` | admin | "Selección guardada correctamente." y "Iniciar análisis →" habilitado | 5.3 | D-08 |
| `15-analizando.png` | admin | Análisis lanzado: indicador "En cola..." (luego "Analizando código...") | 5.3 | D-08 |

**Resultados del análisis**

| Archivo | Rol | Qué se ve | Sección | Casos del guion |
|---|---|---|---|---|
| `16-resultados-vulnerable.png` | admin | Proyecto vulnerable: 8.85% ponderado ("8.7% sin ponderar"), 23 / 2 / 21; CRITICAL 17, HIGH 18, MEDIUM 7, LOW 0; 42 findings totales; distribución 16.67 / 14.29 / 14.29 / 26.19 / 28.57; estados `NON_COMPLIANT` | 5.4 | D-09 |
| `17-hallazgos-filtros-tabla.png` | admin | Filtros de hallazgos (Severidad, Categoría, Política, Archivo) y tabla de hallazgos | 5.4 | D-10 |
| `18-hallazgos-filtro-critical.png` | admin | Filtro CRITICAL activo: solo hallazgos críticos | 5.4 | D-10 |
| `19-detalle-hallazgo-secreto.png` | admin | Panel lateral de un hallazgo de "No almacenar secretos en código fuente": severidad Crítica, "Cómo solucionarlo", archivo `JwtService.java` línea 10, CWE-798, tipo de regla, evidencia `private final String secret = *****;` | 5.4 | D-11 |

**Reporte**

| Archivo | Rol | Qué se ve | Sección | Casos del guion |
|---|---|---|---|---|
| `20-reporte-tecnico-vulnerable.png` | admin | Parte superior del reporte del proyecto vulnerable, en vista técnica: 8,7 % / 8,9 % / 23 ("2 cumplen · 18 no cumplen · 3 en revisión") / 42 con severidad máxima Crítica; inicio de "Recomendaciones priorizadas" | 5.5 | A-02 |
| `21a-reporte-severidad-cobertura.png` | admin | Hallazgos por severidad (Crítica 17, Alta 18, Media 7, Baja 0) y cobertura por categoría y por marco | 5.5 | A-04 |
| `21b-reporte-cobertura-marcos.png` | admin | Cobertura por marco normativo con los chips de controles (solo vista técnica) | 5.5 | A-03, A-04 |
| `21c-reporte-resultados-politica.png` | admin | Tabla "Resultados por política" en español ("Cumple", "No cumple", "Requiere revisión"), solo vista técnica | 5.5 | A-03 |
| `21d-reporte-hallazgos-detallados.png` | admin | "Hallazgos detallados (42)", agrupados por severidad, con ruta, CWE y evidencia enmascarada (`*****`) | 5.5 | A-03, D-11 |
| `21e-reporte-metadatos-trazabilidad.png` | admin | "Metadatos y trazabilidad": ids, checksum SHA-256 y enlace "Ver histórico de reportes" | 5.5 | A-09 |
| `22-descarga-pdf.png` | admin | Tras "Descargar PDF": "Descargado segsoft-report-{id}.pdf" | 5.5 | A-05 |
| `23-descarga-pdf-cache.png` | admin | Segunda descarga: "Descargado … .pdf (desde caché)" | 5.5 | A-06 |
| `24-descarga-sarif.png` | admin | "Descargado segsoft-report-{id}.sarif" | 5.5 | A-07 |
| `25-reporte-ejecutivo-vulnerable.png` | admin | Mismo reporte en **Vista ejecutiva** (botón activo); la parte superior es igual a la técnica | 5.5 | A-03 |
| `25b-reporte-ejecutivo-secciones.png` | admin | Vista ejecutiva más abajo: cobertura por marco **sin** chips de controles | 5.5 | A-03 |
| `26-reporte-ejecutivo-vulnerable-completo.png` | admin | Vista ejecutiva completa (página entera, 1920 × 1943), sin la tabla de políticas ni los hallazgos detallados | 5.5 | A-03 |
| `27-historico-filtrado.png` | admin | Histórico filtrado: "Histórico de un repositorio: proyecto-vulnerable.zip" con "Ver todos" | 5.5 | A-09 |
| `28-pdf-paginas-1-4.png` | — | Páginas 1 a 4 del PDF: portada con metadatos, índice, resumen ejecutivo y cobertura por categoría, y resultados por política | 5.5 | A-05 |
| `29-pdf-hallazgos.png` | — | Página 7 del PDF: bloques de hallazgos con franja de color, ubicación, evidencia, acción sugerida y pie con checksum | 5.5 | A-05 |

**Administración (SECURITY_ADMIN)**

| Archivo | Rol | Qué se ve | Sección | Casos del guion |
|---|---|---|---|---|
| `30-formulario-nueva-politica.png` | admin | Formulario "Registrar nueva política" vacío | 5.6 | S-02 |
| `31-formulario-politica-error.png` | admin | Validaciones: "La descripción debe tener al menos 20 caracteres", "Selecciona un marco normativo", "Selecciona una categoría" | 5.6 | S-01 |
| `32-detalle-politica.png` | admin | Detalle de "Uso de algoritmos criptográficos aprobados": insignia Activa, "Archivar", descripción, peso, versión, marco, control, categoría y "Guardar cambios" | 5.6 | S-04, S-06 |
| `33-detalle-politica-trazabilidad-historial.png` | admin | Trazabilidad (control SC-13), "Reglas técnicas (2)" y botón "+ Añadir regla" | 5.6 | S-05 |
| `34-formulario-anadir-regla.png` | admin | Formulario de regla abierto (Tipo "Patrón Regex", Severidad, CWE ID, Lenguajes, Patrón) e "Historial de cambios" | 5.6 | S-05 |
| `35-formulario-nuevo-policy-set.png` | admin | Formulario "Crear Policy Set": nombre, descripción y tabla de políticas con "Seleccionar todas (23)" | 5.7 | S-08 |
| `36-policy-set-sin-politicas-error.png` | admin | Intento de crear "Perfil OWASP" sin políticas: "Debe incluir al menos una política." | 5.7 | S-07 |

**Vistas por rol**

| Archivo | Rol | Qué se ve | Sección | Casos del guion |
|---|---|---|---|---|
| `37-auditor-dashboard.png` | auditor | Dashboard con `auditor AUDITOR` arriba a la derecha | 5.2 | — |
| `38-auditor-banco-politicas.png` | auditor | Banco de políticas **sin** "+ Nueva política" | 5.6 | — |
| `39-auditor-reportes.png` | auditor | Lista de reportes con integridad "Verificada" | 5.5 | A-08 |
| `40-dev-dashboard.png` | dev | Dashboard con `dev DEVELOPER` | 5.2 | D-01 |
| `41-dev-reportes-restringido.png` | dev | Reportes: "Los reportes de cumplimiento están disponibles para los roles Auditor y Security Admin." | 5.5 | D-13 |
| `42-dev-politica-solo-lectura.png` | dev | Detalle de política en solo lectura: "Solo SECURITY_ADMIN puede editar políticas.", sin "Archivar" | 5.6 | D-14 |
| `43-dev-resultados-sin-generar-reporte.png` | dev | Resultados del proyecto intermedio (88.68%) **sin** el botón "Generar reporte" | 5.4 | D-12 |

### Sin captura

- **"Generando PDF…":** dura menos de un segundo, así que no se pudo capturar.
- **Detalle de un Policy Set y "Aplicar a repositorio" (S-08 a S-12):** no se
  tomaron para no dejar un Policy Set creado en el entorno. El guion asume que
  no hay ninguno, y los probadores lo crean en S-08.
- **Reporte "Alterado" (A-12):** depende del reporte manipulado del entorno
  local.

### Observaciones al tomar las capturas

- **Redondeo del PDF:** para el proyecto vulnerable, el PDF muestra el
  cumplimiento ponderado como **8,8 %**, mientras que la vista web del reporte
  muestra **8,9 %**. El valor real es 8,85 y se redondea distinto en cada lado.
  El global es 8,7 % en ambos.
- **Detalle de hallazgo (captura 19):** en algunas reglas, "Cómo solucionarlo"
  muestra un texto genérico ("Esta regla no trae una recomendación específica
  todavía…").
- **Datos que quedaron en el entorno:**
  - un reporte de `proyecto-vulnerable.zip` generado por admin;
  - un análisis de `proyecto-intermedio.zip` hecho por dev;
  - los repositorios subidos, que expiran a las 24 h.
- **Cuenta `dev`:** tiene registrado un intento de login fallido de la
  captura 10. El contador se reinicia con un login correcto, que ya ocurrió.
