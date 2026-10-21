# Material para las pruebas con usuarios

Insumos para el guion de pruebas, el manual de usuario y la encuesta de satisfacción de
SegSoft.

| Archivo | Qué es |
|---|---|
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

## Fuera de este repositorio

El **manual de usuario y guion de pruebas** (PDF de 33 páginas) y el **script de Google
Apps Script** que crea la encuesta (`crear-encuesta-segsoft.gs`) se hicieron aparte y no
están versionados aquí.
