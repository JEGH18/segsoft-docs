/**
 * SegSoft: encuesta de satisfacción (versión 2, tono formal).
 *
 * Crea el formulario de Google y su hoja de respuestas en la cuenta de quien lo ejecuta.
 *   1. https://script.google.com → Nuevo proyecto.
 *   2. Reemplazar el código de ejemplo por este archivo y guardar.
 *   3. Elegir la función crearEncuestaSegSoft y pulsar Ejecutar (la primera vez pide autorización).
 *   4. En "Registro de ejecución" aparecen los enlaces para editar, compartir y ver las respuestas.
 *
 * Después de recibir respuestas, ejecutar calcularPuntajesSUS: agrega a la hoja de respuestas una
 * pestaña "Puntaje SUS" con el puntaje de 0 a 100 de cada participante.
 *
 * Las tareas por rol corresponden al guion de pruebas v2.0 (D-1 a D-7, A-1 a A-6, S-1 a S-6).
 */

var ESCALA_ACUERDO = ['1 · Totalmente en desacuerdo', '2', '3', '4', '5 · Totalmente de acuerdo'];
var LOGRO_TAREA = ['Sí, sin ayuda', 'Con dificultad', 'No pudo completarla'];
var TITULO_SUS = 'Sobre SegSoft:';

function crearEncuestaSegSoft() {
  var form = FormApp.create('SegSoft: Encuesta de satisfacción');
  form.setDescription(
      'Gracias por participar en la prueba de SegSoft, la plataforma de análisis estático de seguridad y ' +
      'cumplimiento normativo del Proyecto de Grado (Universidad Icesi).\n\n' +
      'Por favor, responda pensando en la sesión de prueba que acaba de realizar con el guion. Se evalúa la ' +
      'aplicación, no a la persona: cualquier dificultad es información valiosa. El tiempo estimado es de 10 minutos.')
    .setProgressBar(true)
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setConfirmationMessage('Gracias por su participación. Sus respuestas contribuyen a mejorar SegSoft.');

  // ── 1. Perfil del participante ───────────────────────────────────────────────
  form.addSectionHeaderItem().setTitle('Perfil del participante');
  form.addTextItem()
    .setTitle('Nombre o alias')
    .setHelpText('Opcional. Permite relacionar esta encuesta con su hoja del guion de pruebas.');
  var rol = form.addMultipleChoiceItem()
    .setTitle('¿Con qué rol participó en la prueba?')
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('¿Cuánta experiencia tiene en desarrollo de software?')
    .setChoiceValues(['Ninguna', 'Menos de 1 año', 'Entre 1 y 3 años', 'Más de 3 años'])
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('¿Cuánta experiencia tiene en seguridad de la información o cumplimiento normativo?')
    .setChoiceValues(['Ninguna', 'Básica (cursos o lecturas)', 'Intermedia (la aplica en proyectos)',
                      'Avanzada (trabaja en el área)'])
    .setRequired(true);
  form.addCheckboxItem()
    .setTitle('¿Cuáles de estos marcos normativos conoce?')
    .setChoiceValues(['OWASP Top 10', 'OWASP ASVS', 'ISO 27001', 'NIST SP 800-53', 'Ninguno'])
    .setRequired(true);
  form.addCheckboxItem()
    .setTitle('¿Ha utilizado herramientas similares?')
    .setChoiceValues(['SonarQube', 'Snyk', 'GitHub Code Scanning', 'Ninguna'])
    .showOtherOption(true)
    .setRequired(true);

  // ── 2. Secciones por rol (cada participante ve solo la suya) ────────────────
  var paginaDeveloper = form.addPageBreakItem()
    .setTitle('Tareas del rol Developer')
    .setHelpText('Según las tareas D-1 a D-7 del guion.');
  grilla(form, '¿Pudo completar estas tareas?', [
    'Crear su cuenta',
    'Subir el proyecto ZIP',
    'Seleccionar y guardar las políticas',
    'Iniciar el análisis y consultar los resultados',
    'Filtrar los hallazgos por severidad',
    'Abrir el detalle de un hallazgo'
  ], LOGRO_TAREA);
  grilla(form, 'Indique su grado de acuerdo con las siguientes afirmaciones', [
    'Crear una cuenta es un proceso sencillo y claro',
    'Los hallazgos indican con claridad dónde está el problema (archivo, línea y evidencia)',
    'La sección «Cómo solucionarlo» orienta sobre cómo corregir el código',
    'Queda claro por qué el rol Developer no puede consultar reportes ni editar políticas'
  ], ESCALA_ACUERDO);

  var paginaAuditor = form.addPageBreakItem()
    .setTitle('Tareas del rol Auditor')
    .setHelpText('Según las tareas A-1 a A-6 del guion.');
  grilla(form, '¿Pudo completar estas tareas?', [
    'Iniciar sesión con la cuenta entregada',
    'Analizar un proyecto',
    'Generar el reporte de cumplimiento',
    'Cambiar entre la vista técnica y la vista ejecutiva',
    'Descargar el reporte en PDF y en SARIF',
    'Consultar el reporte en el histórico'
  ], LOGRO_TAREA);
  grilla(form, 'Indique su grado de acuerdo con las siguientes afirmaciones', [
    'La vista ejecutiva es adecuada para presentar los resultados a directivos',
    'El reporte en PDF serviría como evidencia en una auditoría',
    'La cobertura por categoría y por marco normativo resulta útil',
    'La verificación de integridad («Verificada» / «Alterado») genera confianza en los reportes'
  ], ESCALA_ACUERDO);

  var paginaAdmin = form.addPageBreakItem()
    .setTitle('Tareas del rol Security Admin')
    .setHelpText('Según las tareas S-1 a S-6 del guion.');
  grilla(form, '¿Pudo completar estas tareas?', [
    'Consultar el banco de políticas',
    'Registrar una política',
    'Editar el peso de una política y consultar su historial',
    'Añadir una regla a una política',
    'Crear un Policy Set',
    'Archivar una política'
  ], LOGRO_TAREA);
  grilla(form, 'Indique su grado de acuerdo con las siguientes afirmaciones', [
    'Es claro cómo definir una política (marco, control, categoría y peso)',
    'Es claro cómo definir una regla técnica',
    'Es claro para qué sirven los Policy Sets y cómo crearlos',
    'Los mensajes de validación de los formularios son claros'
  ], ESCALA_ACUERDO);

  // ── 3. Preguntas para todos los roles ────────────────────────────────────────
  var paginaExperiencia = form.addPageBreakItem()
    .setTitle('Experiencia general con SegSoft')
    .setHelpText('Estas preguntas son para todos los roles.');
  grilla(form, 'Indique su grado de acuerdo con las siguientes afirmaciones', [
    'Desplazarse entre el Dashboard, la Selección de políticas y los Resultados es sencillo',
    'Subir el proyecto es sencillo y los mensajes de error son claros',
    'Los filtros, la opción «Seleccionar todas» y el resumen de cobertura facilitan la elección de políticas',
    'Queda claro que la selección debe guardarse antes de iniciar el análisis',
    'El análisis y la generación de resultados son rápidos',
    'La diferencia entre el cumplimiento ponderado y el cumplimiento sin ponderar es clara',
    'Las severidades y los estados (cumple, no cumple, requiere revisión) son claros',
    'Las recomendaciones y acciones sugeridas son útiles',
    'SegSoft protege adecuadamente la información (secretos enmascarados y acceso por rol)',
    'Los colores de severidad y de estado son fáciles de interpretar',
    'La combinación de español e inglés en la interfaz no genera confusión'
  ], ESCALA_ACUERDO);

  form.addPageBreakItem()
    .setTitle('Escala de usabilidad del sistema (SUS)')
    .setHelpText('Cuestionario estándar de diez afirmaciones. Responda según su primera impresión, ' +
                 'sin detenerse demasiado en cada una.');
  // Orden y redacción estándar del SUS: impares positivas, pares negativas (ver calcularPuntajesSUS).
  grilla(form, TITULO_SUS, [
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
  ], ESCALA_ACUERDO);

  form.addPageBreakItem().setTitle('Valoración general y comentarios');
  form.addScaleItem()
    .setTitle('En general, ¿qué tan satisfecho/a se encuentra con SegSoft?')
    .setBounds(1, 5)
    .setLabels('Nada satisfecho/a', 'Muy satisfecho/a')
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('¿Utilizaría SegSoft en un proyecto real?')
    .setChoiceValues(['Sí', 'Tal vez', 'No'])
    .setRequired(true);
  form.addParagraphTextItem().setTitle('¿Qué fue lo más útil de SegSoft?').setRequired(true);
  form.addParagraphTextItem().setTitle('¿Qué le resultó más confuso o difícil?').setRequired(true);
  form.addCheckboxItem()
    .setTitle('¿Qué funcionalidades le gustaría que tuviera SegSoft?')
    .setChoiceValues([
      'Una lista de todos los análisis realizados',
      'Gestión de usuarios y roles desde la interfaz',
      'La interfaz completamente en español',
      'Recomendaciones más específicas para cada hallazgo',
      'Consulta del inventario de archivos del proyecto desde la interfaz'
    ])
    .showOtherOption(true);
  form.addParagraphTextItem()
    .setTitle('¿Encontró algún error? Por favor, descríbalo')
    .setHelpText('Indique en qué pantalla o tarea del guion ocurrió (por ejemplo, A-5).');
  form.addParagraphTextItem().setTitle('Otros comentarios o sugerencias');

  // ── Navegación ───────────────────────────────────────────────────────────────
  // La respuesta del rol decide la sección siguiente.
  rol.setChoices([
    rol.createChoice('Developer', paginaDeveloper),
    rol.createChoice('Auditor', paginaAuditor),
    rol.createChoice('Security Admin', paginaAdmin)
  ]);
  // setGoToPage en un salto de página define a dónde va la sección ANTERIOR a ese salto:
  // al terminar Developer y Auditor se pasa directo a la experiencia general, sin ver las otras
  // secciones de rol. Security Admin ya continúa ahí de forma natural.
  paginaAuditor.setGoToPage(paginaExperiencia);
  paginaAdmin.setGoToPage(paginaExperiencia);

  var hoja = SpreadsheetApp.create('SegSoft: Respuestas de la encuesta de satisfacción');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  Logger.log('Editar el formulario: ' + form.getEditUrl());
  Logger.log('Enlace para los participantes: ' + form.getPublishedUrl());
  Logger.log('Hoja de respuestas: ' + hoja.getUrl());
  Logger.log('Para calcular el SUS, ejecute calcularPuntajesSUS con este ID de formulario: ' + form.getId());
}

/** Agrega una cuadrícula obligatoria (cada fila requiere respuesta). */
function grilla(form, titulo, filas, columnas) {
  return form.addGridItem().setTitle(titulo).setRows(filas).setColumns(columnas).setRequired(true);
}

/**
 * Calcula el puntaje SUS (0 a 100) de cada respuesta y lo escribe en la pestaña "Puntaje SUS" de la
 * hoja de respuestas. Ítems impares: respuesta − 1; pares: 5 − respuesta; la suma se multiplica por
 * 2,5. Un puntaje mayor que 68 se considera por encima del promedio.
 *
 * formId: el ID que imprime crearEncuestaSegSoft (o el de la URL de edición del formulario).
 */
function calcularPuntajesSUS(formId) {
  var form = FormApp.openById(formId);
  var hoja = SpreadsheetApp.openById(form.getDestinationId());
  var datos = hoja.getSheets()[0].getDataRange().getValues();
  var encabezados = datos[0];

  // Columnas del SUS: "Sobre SegSoft: [N. ...]", en el orden de los ítems.
  var columnas = [];
  for (var n = 1; n <= 10; n++) {
    var indice = encabezados.findIndex(function (h) {
      return String(h).indexOf(TITULO_SUS + ' [' + n + '.') === 0;
    });
    if (indice < 0) throw new Error('No se encontró la columna del ítem SUS ' + n);
    columnas.push(indice);
  }
  var colNombre = encabezados.indexOf('Nombre o alias');
  var colRol = encabezados.indexOf('¿Con qué rol participó en la prueba?');

  var salida = [['Marca temporal', 'Nombre o alias', 'Rol', 'Puntaje SUS (0-100)']];
  for (var fila = 1; fila < datos.length; fila++) {
    var suma = 0;
    for (var i = 0; i < 10; i++) {
      var valor = parseInt(String(datos[fila][columnas[i]]).charAt(0), 10);
      suma += (i % 2 === 0) ? valor - 1 : 5 - valor;
    }
    salida.push([datos[fila][0], colNombre >= 0 ? datos[fila][colNombre] : '',
                 colRol >= 0 ? datos[fila][colRol] : '', suma * 2.5]);
  }

  var pestaña = hoja.getSheetByName('Puntaje SUS') || hoja.insertSheet('Puntaje SUS');
  pestaña.clear();
  pestaña.getRange(1, 1, salida.length, salida[0].length).setValues(salida);
  if (salida.length > 1) {
    pestaña.getRange(salida.length + 2, 3).setValue('Promedio');
    pestaña.getRange(salida.length + 2, 4).setFormula('=AVERAGE(D2:D' + salida.length + ')');
  }
  Logger.log('Puntajes SUS calculados para ' + (salida.length - 1) + ' respuesta(s).');
}
