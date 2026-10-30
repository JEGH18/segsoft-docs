# SegSoft: Encuesta de satisfacción

Texto que se ve en el formulario (versión 2, tono formal). Lo genera `crear-encuesta-segsoft.gs`; este listado se obtuvo del mismo script.

> Gracias por participar en la prueba de SegSoft, la plataforma de análisis estático de seguridad y cumplimiento normativo del Proyecto de Grado (Universidad Icesi).
>
> Por favor, responda pensando en la sesión de prueba que acaba de realizar con el guion. Se evalúa la aplicación, no a la persona: cualquier dificultad es información valiosa. El tiempo estimado es de 10 minutos.

Mensaje al enviar: «Gracias por su participación. Sus respuestas contribuyen a mejorar SegSoft.»

## Perfil del participante

**1. Nombre o alias** — respuesta corta *(opcional)*

_Opcional. Permite relacionar esta encuesta con su hoja del guion de pruebas._

**2. ¿Con qué rol participó en la prueba?** — opción única *(obligatoria)*

- Developer → sección «Tareas del rol Developer»
- Auditor → sección «Tareas del rol Auditor»
- Security Admin → sección «Tareas del rol Security Admin»

**3. ¿Cuánta experiencia tiene en desarrollo de software?** — opción única *(obligatoria)*

- Ninguna
- Menos de 1 año
- Entre 1 y 3 años
- Más de 3 años

**4. ¿Cuánta experiencia tiene en seguridad de la información o cumplimiento normativo?** — opción única *(obligatoria)*

- Ninguna
- Básica (cursos o lecturas)
- Intermedia (la aplica en proyectos)
- Avanzada (trabaja en el área)

**5. ¿Cuáles de estos marcos normativos conoce?** — casillas *(obligatoria)*

- OWASP Top 10
- OWASP ASVS
- ISO 27001
- NIST SP 800-53
- Ninguno

**6. ¿Ha utilizado herramientas similares?** — casillas *(obligatoria)*

- SonarQube
- Snyk
- GitHub Code Scanning
- Ninguna
- Otro: ____

## Tareas del rol Developer

_Según las tareas D-1 a D-7 del guion._

**7. ¿Pudo completar estas tareas?** — cuadrícula *(obligatoria)*

- Crear su cuenta
- Subir el proyecto ZIP
- Seleccionar y guardar las políticas
- Iniciar el análisis y consultar los resultados
- Filtrar los hallazgos por severidad
- Abrir el detalle de un hallazgo

Columnas: Sí, sin ayuda · Con dificultad · No pudo completarla

**8. Indique su grado de acuerdo con las siguientes afirmaciones** — cuadrícula *(obligatoria)*

- Crear una cuenta es un proceso sencillo y claro
- Los hallazgos indican con claridad dónde está el problema (archivo, línea y evidencia)
- La sección «Cómo solucionarlo» orienta sobre cómo corregir el código
- Queda claro por qué el rol Developer no puede consultar reportes ni editar políticas

Columnas: 1 · Totalmente en desacuerdo · 2 · 3 · 4 · 5 · Totalmente de acuerdo

## Tareas del rol Auditor

_Según las tareas A-1 a A-6 del guion._

**9. ¿Pudo completar estas tareas?** — cuadrícula *(obligatoria)*

- Iniciar sesión con la cuenta entregada
- Analizar un proyecto
- Generar el reporte de cumplimiento
- Cambiar entre la vista técnica y la vista ejecutiva
- Descargar el reporte en PDF y en SARIF
- Consultar el reporte en el histórico

Columnas: Sí, sin ayuda · Con dificultad · No pudo completarla

**10. Indique su grado de acuerdo con las siguientes afirmaciones** — cuadrícula *(obligatoria)*

- La vista ejecutiva es adecuada para presentar los resultados a directivos
- El reporte en PDF serviría como evidencia en una auditoría
- La cobertura por categoría y por marco normativo resulta útil
- La verificación de integridad («Verificada» / «Alterado») genera confianza en los reportes

Columnas: 1 · Totalmente en desacuerdo · 2 · 3 · 4 · 5 · Totalmente de acuerdo

## Tareas del rol Security Admin

_Según las tareas S-1 a S-6 del guion._

**11. ¿Pudo completar estas tareas?** — cuadrícula *(obligatoria)*

- Consultar el banco de políticas
- Registrar una política
- Editar el peso de una política y consultar su historial
- Añadir una regla a una política
- Crear un Policy Set
- Archivar una política

Columnas: Sí, sin ayuda · Con dificultad · No pudo completarla

**12. Indique su grado de acuerdo con las siguientes afirmaciones** — cuadrícula *(obligatoria)*

- Es claro cómo definir una política (marco, control, categoría y peso)
- Es claro cómo definir una regla técnica
- Es claro para qué sirven los Policy Sets y cómo crearlos
- Los mensajes de validación de los formularios son claros

Columnas: 1 · Totalmente en desacuerdo · 2 · 3 · 4 · 5 · Totalmente de acuerdo

## Experiencia general con SegSoft

_Estas preguntas son para todos los roles._

**13. Indique su grado de acuerdo con las siguientes afirmaciones** — cuadrícula *(obligatoria)*

- Desplazarse entre el Dashboard, la Selección de políticas y los Resultados es sencillo
- Subir el proyecto es sencillo y los mensajes de error son claros
- Los filtros, la opción «Seleccionar todas» y el resumen de cobertura facilitan la elección de políticas
- Queda claro que la selección debe guardarse antes de iniciar el análisis
- El análisis y la generación de resultados son rápidos
- La diferencia entre el cumplimiento ponderado y el cumplimiento sin ponderar es clara
- Las severidades y los estados (cumple, no cumple, requiere revisión) son claros
- Las recomendaciones y acciones sugeridas son útiles
- SegSoft protege adecuadamente la información (secretos enmascarados y acceso por rol)
- Los colores de severidad y de estado son fáciles de interpretar
- La combinación de español e inglés en la interfaz no genera confusión

Columnas: 1 · Totalmente en desacuerdo · 2 · 3 · 4 · 5 · Totalmente de acuerdo

## Escala de usabilidad del sistema (SUS)

_Cuestionario estándar de diez afirmaciones. Responda según su primera impresión, sin detenerse demasiado en cada una._

**14. Sobre SegSoft:** — cuadrícula *(obligatoria)*

- 1. Creo que me gustaría usar este sistema con frecuencia
- 2. Encontré el sistema innecesariamente complejo
- 3. Pensé que el sistema era fácil de usar
- 4. Creo que necesitaría el apoyo de una persona técnica para poder usar este sistema
- 5. Encontré que las distintas funciones del sistema estaban bien integradas
- 6. Pensé que había demasiada inconsistencia en el sistema
- 7. Imagino que la mayoría de las personas aprenderían a usar este sistema muy rápidamente
- 8. Encontré el sistema muy engorroso de usar
- 9. Me sentí muy seguro/a usando el sistema
- 10. Necesité aprender muchas cosas antes de poder empezar a usar este sistema

Columnas: 1 · Totalmente en desacuerdo · 2 · 3 · 4 · 5 · Totalmente de acuerdo

## Valoración general y comentarios

**15. En general, ¿qué tan satisfecho/a se encuentra con SegSoft?** — escala *(obligatoria)*

1 a 5: «Nada satisfecho/a» … «Muy satisfecho/a»

**16. ¿Utilizaría SegSoft en un proyecto real?** — opción única *(obligatoria)*

- Sí
- Tal vez
- No

**17. ¿Qué fue lo más útil de SegSoft?** — párrafo *(obligatoria)*

**18. ¿Qué le resultó más confuso o difícil?** — párrafo *(obligatoria)*

**19. ¿Qué funcionalidades le gustaría que tuviera SegSoft?** — casillas *(opcional)*

- Una lista de todos los análisis realizados
- Gestión de usuarios y roles desde la interfaz
- La interfaz completamente en español
- Recomendaciones más específicas para cada hallazgo
- Consulta del inventario de archivos del proyecto desde la interfaz
- Otro: ____

**20. ¿Encontró algún error? Por favor, descríbalo** — párrafo *(opcional)*

_Indique en qué pantalla o tarea del guion ocurrió (por ejemplo, A-5)._

**21. Otros comentarios o sugerencias** — párrafo *(opcional)*

## Navegación

La respuesta a «¿Con qué rol participó en la prueba?» lleva a la sección de ese rol. Al terminarla, cada participante pasa a «Experiencia general con SegSoft», luego al SUS y a la valoración final: nadie ve las secciones de los otros roles.
