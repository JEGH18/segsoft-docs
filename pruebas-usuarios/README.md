# Material para las pruebas con usuarios

Insumos para el guion de pruebas, el manual de usuario y la encuesta de satisfacción de
SegSoft.

| Archivo | Qué es |
|---|---|
| [guion/SegSoft - Guion de pruebas con usuarios.pdf](guion/) | **Guion de pruebas (v2.0)**: 5 páginas en tono formal. Una página de instrucciones, una por rol (Developer D-1 a D-7, Auditor A-1 a A-6, Security Admin S-1 a S-6) con resultado esperado y casillas, y una de notas para el facilitador. Fuente: `guion/guion-pruebas.html` |
| [encuesta/crear-encuesta-segsoft.gs](encuesta/crear-encuesta-segsoft.gs) | Script de Google Apps Script que crea la **encuesta de satisfacción (v2, tono formal)** y su hoja de respuestas; `calcularPuntajesSUS` agrega el puntaje SUS de cada respuesta. Listado de todas las preguntas: [encuesta/encuesta-formal.md](encuesta/encuesta-formal.md); cambios frente a la versión 1: [encuesta/cambios-v1-v2.md](encuesta/cambios-v1-v2.md). El script de la versión 1, que creó el formulario publicado en octubre, está en `encuesta/crear-encuesta-segsoft-v1.gs` |
| [contexto-segsoft-para-guion-y-encuesta.md](contexto-segsoft-para-guion-y-encuesta.md) | Descripción completa de la aplicación para escribir el guion y la encuesta: roles y permisos, pantallas, valores esperados por pantalla, checklist de tareas por rol (D-01…D-15, A-01…A-12, S-01…S-12), limitaciones conocidas, insumos para la encuesta y el mapa de capturas |
| `proyecto-vulnerable.zip` | Tienda en línea con muchos hallazgos: 8,85 % de cumplimiento ponderado, 42 hallazgos (17 críticos) |
| `proyecto-intermedio.zip` | La misma tienda, parcialmente corregida: 88,68 %, 5 hallazgos medios |
| `proyecto-limpio.zip` | La misma tienda, corregida: 100 %, 0 hallazgos |
| [InterfazSegSoft/](InterfazSegSoft/) | 48 capturas de la interfaz a 1920 × 955. Las `Screenshot From …` se tomaron a mano con **admin**; las numeradas del 10 al 43 siguen el orden del guion y cubren los tres roles |

Los valores de los ZIP se midieron con las 23 políticas activas. Los proyectos salen del
repositorio [JEGH18/SegSoft-Pruebas](https://github.com/JEGH18/SegSoft-Pruebas); cada ZIP
contiene la carpeta del proyecto, tal como lo subiría un participante.

La sección 12 del documento de contexto relaciona cada captura con la pantalla, la sección
y las tareas del guion que ilustra.

## Guion y encuesta (versión 2)

Cambios frente a la versión 1 (manual de 33 páginas y encuesta con tuteo), según la
retroalimentación del profesor ("el libreto debe ser corto, no es un manual de usuario"; "la
encuesta en tono formal, evitar tutear"):

- **Guion corto:** sustituye al manual. Cada participante usa solo la página de su rol.
- **Tono formal** ("usted") en el guion y en la encuesta.
- **Entorno desplegado:** `https://segsoft-frontend.vercel.app` en lugar de `localhost:5173`.
- **Cuentas:** el Developer crea la suya con «Crear cuenta» (tarea D-1). Las de Auditor y
  Security Admin las entrega el facilitador; las contraseñas ya no aparecen en el documento.
- **Encuesta:** tareas por rol alineadas con el guion v2 (incluye «Crear su cuenta»), opción
  «Gestión de usuarios y roles desde la interfaz» en lugar de «Registro y gestión de
  usuarios», y cálculo del puntaje SUS.

Para generar el PDF del guion: abrir `guion/guion-pruebas.html` en Chrome o Edge → Imprimir →
Guardar como PDF (A4, con gráficos de fondo).

Para crear la encuesta: ver las instrucciones al inicio de `encuesta/crear-encuesta-segsoft.gs`.
Crea un formulario nuevo; el enlace del formulario anterior deja de ser el vigente.
