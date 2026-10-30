/**
 * SegSoft — Encuesta de satisfacción (prueba con usuarios)
 *
 * Cómo usarlo:
 *  1. Entra a https://script.google.com con tu cuenta de Google y pulsa "Nuevo proyecto".
 *  2. Borra el código de ejemplo, pega TODO este archivo y guarda (Ctrl + S).
 *  3. Arriba elige la función "crearEncuestaSegSoft" y pulsa "Ejecutar".
 *  4. Autoriza los permisos que pide Google (es tu propia cuenta).
 *  5. Abre "Registro de ejecución": ahí salen los enlaces para editar y para compartir el formulario,
 *     y el de la hoja de cálculo donde llegan las respuestas.
 *
 * El formulario queda en tu Google Drive y lo puedes seguir editando a mano.
 */
function crearEncuestaSegSoft() {
  var form = FormApp.create('SegSoft — Encuesta de satisfacción');
  form.setDescription(
    'Gracias por probar SegSoft, la plataforma de análisis estático de seguridad y cumplimiento normativo ' +
    'del Proyecto de Grado (Universidad Icesi).\n\n' +
    'Responde pensando en la sesión de prueba que acabas de hacer con el guion. No evaluamos a la persona: ' +
    'evaluamos la aplicación, así que cualquier dificultad es información valiosa. Toma unos 10 minutos.'
  );
  form.setProgressBar(true);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('¡Gracias! Tus respuestas nos ayudan a mejorar SegSoft.');

  var TAREA_COLS = ['Sí, sin ayuda', 'Con dificultad', 'No pude'];
  var LIKERT_COLS = ['1 · Muy en desacuerdo', '2', '3', '4', '5 · Muy de acuerdo'];

  // ---------------------------------------------------------------- 1. Perfil
  form.addSectionHeaderItem()
    .setTitle('Perfil del participante');

  form.addTextItem()
    .setTitle('Nombre o alias')
    .setHelpText('Opcional. Sirve para relacionar esta encuesta con tu hoja del guion de pruebas.');

  var rolItem = form.addMultipleChoiceItem()
    .setTitle('¿Con qué rol probaste SegSoft?')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cuánta experiencia tienes en desarrollo de software?')
    .setChoiceValues(['Ninguna', 'Menos de 1 año', 'Entre 1 y 3 años', 'Más de 3 años'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cuánta experiencia tienes en seguridad de la información o cumplimiento normativo?')
    .setChoiceValues([
      'Ninguna',
      'Básica (cursos o lecturas)',
      'Intermedia (la aplico en proyectos)',
      'Avanzada (trabajo en el área)'
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('¿Cuáles de estos marcos normativos conoces?')
    .setChoiceValues(['OWASP Top 10', 'OWASP ASVS', 'ISO 27001', 'NIST SP 800-53', 'Ninguno'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('¿Has usado herramientas similares?')
    .setChoiceValues(['SonarQube', 'Snyk', 'GitHub Code Scanning', 'Ninguna'])
    .showOtherOption(true)
    .setRequired(true);

  // ---------------------------------------------------------------- 2a. Developer
  var pDev = form.addPageBreakItem()
    .setTitle('Tareas del rol Developer')
    .setHelpText('Según lo que hiciste en el guion (tareas D-01 a D-15).');

  form.addGridItem()
    .setTitle('¿Pudiste completar estas tareas?')
    .setRows([
      'Subir el proyecto ZIP',
      'Seleccionar y guardar las políticas',
      'Iniciar el análisis y llegar a Resultados',
      'Interpretar los indicadores de cumplimiento',
      'Filtrar los hallazgos por severidad',
      'Abrir el detalle de un hallazgo'
    ])
    .setColumns(TAREA_COLS)
    .setRequired(true);

  form.addGridItem()
    .setTitle('¿Qué tan de acuerdo estás con estas afirmaciones?')
    .setRows([
      'Los hallazgos indican con claridad dónde está el problema (archivo, línea, evidencia)',
      'La sección «Cómo solucionarlo» me ayuda a saber cómo corregir el código',
      'Entendí por qué mi rol no puede ver reportes ni editar políticas'
    ])
    .setColumns(LIKERT_COLS)
    .setRequired(true);

  // ---------------------------------------------------------------- 2b. Auditor
  var pAud = form.addPageBreakItem()
    .setTitle('Tareas del rol Auditor')
    .setHelpText('Según lo que hiciste en el guion (tareas A-01 a A-12).');

  form.addGridItem()
    .setTitle('¿Pudiste completar estas tareas?')
    .setRows([
      'Analizar un proyecto',
      'Generar el reporte de cumplimiento',
      'Cambiar entre vista técnica y vista ejecutiva',
      'Descargar el reporte en PDF',
      'Descargar el reporte en SARIF',
      'Consultar el histórico de reportes'
    ])
    .setColumns(TAREA_COLS)
    .setRequired(true);

  form.addGridItem()
    .setTitle('¿Qué tan de acuerdo estás con estas afirmaciones?')
    .setRows([
      'La vista ejecutiva sirve para presentar los resultados a directivos',
      'El PDF serviría como evidencia en una auditoría',
      'La cobertura por categoría y por marco normativo es útil',
      'La verificación de integridad (Verificada / Alterado) me da confianza en los reportes'
    ])
    .setColumns(LIKERT_COLS)
    .setRequired(true);

  // ---------------------------------------------------------------- 2c. Security Admin
  var pAdm = form.addPageBreakItem()
    .setTitle('Tareas del rol Security Admin')
    .setHelpText('Según lo que hiciste en el guion (tareas S-01 a S-12).');

  form.addGridItem()
    .setTitle('¿Pudiste completar estas tareas?')
    .setRows([
      'Registrar una política',
      'Editar el peso de una política y ver su historial',
      'Añadir una regla a una política',
      'Archivar y restaurar una política',
      'Crear un Policy Set',
      'Aplicar un Policy Set a un repositorio'
    ])
    .setColumns(TAREA_COLS)
    .setRequired(true);

  form.addGridItem()
    .setTitle('¿Qué tan de acuerdo estás con estas afirmaciones?')
    .setRows([
      'Es claro cómo definir una política (marco, control, categoría, peso)',
      'Es claro cómo definir reglas (regex, configuración, dependencias)',
      'Es claro para qué sirven los Policy Sets y cómo crearlos',
      'Los mensajes de validación de los formularios son claros'
    ])
    .setColumns(LIKERT_COLS)
    .setRequired(true);

  // ---------------------------------------------------------------- 3. Experiencia general
  var pComun = form.addPageBreakItem()
    .setTitle('Tu experiencia con SegSoft')
    .setHelpText('Estas preguntas son para todos los roles.');

  form.addGridItem()
    .setTitle('¿Qué tan de acuerdo estás con estas afirmaciones?')
    .setRows([
      'Moverme entre Dashboard, Selección de políticas y Resultados fue fácil',
      'Subir el proyecto fue fácil y los mensajes de error son claros',
      'Los filtros, «Seleccionar todas» y el resumen de cobertura facilitan elegir políticas',
      'Entendí que debía guardar la selección antes de iniciar el análisis',
      'El análisis y la generación de resultados fueron rápidos',
      'Entendí la diferencia entre cumplimiento ponderado y sin ponderar',
      'Las severidades y los estados (cumple, no cumple, requiere revisión) son claros',
      'Las recomendaciones y acciones sugeridas son útiles',
      'Confío en cómo SegSoft protege la información (secretos enmascarados, acceso por rol)',
      'Los colores de severidad y estado son fáciles de interpretar',
      'La mezcla de español e inglés en la interfaz no me confundió'
    ])
    .setColumns(LIKERT_COLS)
    .setRequired(true);

  // ---------------------------------------------------------------- 4. SUS
  form.addPageBreakItem()
    .setTitle('Escala de usabilidad del sistema (SUS)')
    .setHelpText('Cuestionario estándar de 10 afirmaciones. Responde con tu primera impresión, sin pensarlo demasiado.');

  form.addGridItem()
    .setTitle('Sobre SegSoft:')
    .setRows([
      '1. Creo que me gustaría usar este sistema con frecuencia',
      '2. Encontré el sistema innecesariamente complejo',
      '3. Pensé que el sistema era fácil de usar',
      '4. Creo que necesitaría el apoyo de una persona técnica para poder usar este sistema',
      '5. Encontré que las distintas funciones del sistema estaban bien integradas',
      '6. Pensé que había demasiada inconsistencia en el sistema',
      '7. Imagino que la mayoría de las personas aprenderían a usar este sistema muy rápidamente',
      '8. Encontré el sistema muy engorroso de usar',
      '9. Me sentí muy seguro/a usando el sistema',
      '10. Necesité aprender muchas cosas antes de poder empezar a usar este sistema'
    ])
    .setColumns(LIKERT_COLS)
    .setRequired(true);

  // ---------------------------------------------------------------- 5. Cierre
  form.addPageBreakItem()
    .setTitle('Valoración general y comentarios');

  form.addScaleItem()
    .setTitle('En general, ¿qué tan satisfecho/a estás con SegSoft?')
    .setBounds(1, 5)
    .setLabels('Nada satisfecho/a', 'Muy satisfecho/a')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Usarías SegSoft en un proyecto real?')
    .setChoiceValues(['Sí', 'Tal vez', 'No'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Qué fue lo más útil de SegSoft?')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('¿Qué fue lo más confuso o difícil?')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('¿Qué funcionalidades te gustaría que tuviera?')
    .setChoiceValues([
      'Una lista de todos los análisis realizados',
      'Registro y gestión de usuarios',
      'La interfaz completamente en español',
      'Recomendaciones más específicas para cada hallazgo',
      'Ver el inventario de archivos del proyecto desde la interfaz'
    ])
    .showOtherOption(true);

  form.addParagraphTextItem()
    .setTitle('¿Encontraste algún error? Descríbelo')
    .setHelpText('Indica en qué pantalla o tarea del guion ocurrió (por ejemplo, A-05).');

  form.addParagraphTextItem()
    .setTitle('Otros comentarios o sugerencias');

  // ---------------------------------------------------------------- Ramificación por rol
  // Developer -> sección Developer; Auditor -> sección Auditor; Admin -> sección Admin.
  rolItem.setChoices([
    rolItem.createChoice('Developer (dev / usuario)', pDev),
    rolItem.createChoice('Auditor (auditor)', pAud),
    rolItem.createChoice('Security Admin (admin)', pAdm)
  ]);
  // Al terminar la sección Developer o Auditor se salta a las preguntas comunes.
  pAud.setGoToPage(pComun);   // aplica al final de la sección Developer
  pAdm.setGoToPage(pComun);   // aplica al final de la sección Auditor

  // ---------------------------------------------------------------- Hoja de respuestas
  var hoja = SpreadsheetApp.create('SegSoft — Respuestas encuesta de satisfacción');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  Logger.log('Editar el formulario:  ' + form.getEditUrl());
  Logger.log('Enlace para compartir: ' + form.getPublishedUrl());
  Logger.log('Hoja de respuestas:    ' + hoja.getUrl());
}
