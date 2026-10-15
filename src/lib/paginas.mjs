// Registro de páginas del sitio (arquitectura de información).
// Las descripciones son neutrales: no afirman nada sobre la escuela.

export const SECCIONES = [
  {
    clave: 'conocenos',
    titulo: 'Conócenos',
    descripcion: 'Información general sobre el plantel, su identidad y su comunidad.',
  },
  {
    clave: 'oferta-educativa',
    titulo: 'Oferta educativa',
    descripcion: 'Grados, asignaturas y actividades académicas del plantel.',
  },
  {
    clave: 'estudiantes-y-familias',
    titulo: 'Estudiantes y familias',
    descripcion: 'Trámites, calendario y orientación para estudiantes, madres, padres y tutores.',
  },
  {
    clave: 'vida-escolar',
    titulo: 'Vida escolar',
    descripcion: 'Actividades culturales, deportivas, cívicas y proyectos de la comunidad escolar.',
  },
];

// tipo: texto | tramite | faq
// contenidoFuturo: qué incluirá la página cuando la escuela entregue información aprobada.
export const PAGINAS = [
  { clave: 'conocenos-historia', seccion: 'conocenos', slug: 'historia', titulo: 'Historia institucional', tipo: 'texto',
    descripcion: 'Historia del plantel y fecha oficial de fundación.',
    contenidoFuturo: ['Historia del plantel', 'Fecha oficial de fundación', 'Hechos relevantes aprobados por la dirección'] },
  { clave: 'conocenos-identidad', seccion: 'conocenos', slug: 'identidad', titulo: 'Misión, visión y valores', tipo: 'texto',
    descripcion: 'Identidad institucional: misión, visión, valores y lema.',
    contenidoFuturo: ['Misión', 'Visión', 'Valores', 'Lema institucional, si existe'] },
  { clave: 'conocenos-modelo-educativo', seccion: 'conocenos', slug: 'modelo-educativo', titulo: 'Modelo educativo', tipo: 'texto',
    descripcion: 'Enfoque educativo del plantel.',
    contenidoFuturo: ['Enfoque educativo vigente', 'Programas institucionales activos'] },
  { clave: 'conocenos-autoridades', seccion: 'conocenos', slug: 'autoridades', titulo: 'Autoridades y organigrama', tipo: 'texto',
    descripcion: 'Autoridades escolares y organigrama autorizado.',
    contenidoFuturo: ['Autoridades escolares vigentes', 'Organigrama autorizado', 'Áreas de atención y sus funciones'] },
  { clave: 'conocenos-instalaciones', seccion: 'conocenos', slug: 'instalaciones', titulo: 'Instalaciones y ubicación', tipo: 'texto',
    descripcion: 'Espacios del plantel y cómo llegar.',
    contenidoFuturo: ['Espacios e instalaciones confirmados', 'Dirección validada y mapa', 'Fotografías autorizadas'] },

  { clave: 'oferta-primer-grado', seccion: 'oferta-educativa', slug: 'primer-grado', titulo: 'Primer grado', tipo: 'texto',
    descripcion: 'Información de primer grado.', contenidoFuturo: ['Información del grado validada por la dirección'] },
  { clave: 'oferta-segundo-grado', seccion: 'oferta-educativa', slug: 'segundo-grado', titulo: 'Segundo grado', tipo: 'texto',
    descripcion: 'Información de segundo grado.', contenidoFuturo: ['Información del grado validada por la dirección'] },
  { clave: 'oferta-tercer-grado', seccion: 'oferta-educativa', slug: 'tercer-grado', titulo: 'Tercer grado', tipo: 'texto',
    descripcion: 'Información de tercer grado.', contenidoFuturo: ['Información del grado validada por la dirección'] },
  { clave: 'oferta-asignaturas', seccion: 'oferta-educativa', slug: 'asignaturas', titulo: 'Asignaturas', tipo: 'texto',
    descripcion: 'Asignaturas del plan de estudios vigente.', contenidoFuturo: ['Asignaturas por grado del plan vigente'] },
  { clave: 'oferta-tecnologias-talleres', seccion: 'oferta-educativa', slug: 'tecnologias-talleres', titulo: 'Tecnologías y talleres', tipo: 'texto',
    descripcion: 'Tecnologías o talleres que el plantel confirme.',
    contenidoFuturo: ['Nombre oficial de cada tecnología o taller', 'Grados en que se imparte', 'Descripción de cada taller'] },
  { clave: 'oferta-actividades-complementarias', seccion: 'oferta-educativa', slug: 'actividades-complementarias', titulo: 'Actividades complementarias', tipo: 'texto',
    descripcion: 'Actividades complementarias que realmente se ofrecen.', contenidoFuturo: ['Actividades confirmadas por la dirección'] },

  { clave: 'familias-inscripcion', seccion: 'estudiantes-y-familias', slug: 'inscripcion', titulo: 'Inscripción de nuevo ingreso', tipo: 'tramite',
    descripcion: 'Requisitos, fechas y pasos para la inscripción de nuevo ingreso.',
    contenidoFuturo: ['A quién va dirigido', 'Periodo y fecha límite', 'Requisitos y pasos', 'Formatos oficiales', 'Dónde, cómo y en qué horario', 'Canal institucional de dudas'] },
  { clave: 'familias-reinscripcion', seccion: 'estudiantes-y-familias', slug: 'reinscripcion', titulo: 'Reinscripción de segundo y tercer grado', tipo: 'tramite',
    descripcion: 'Requisitos, fechas y pasos para la reinscripción.',
    contenidoFuturo: ['A quién va dirigido', 'Periodo y fecha límite', 'Requisitos y pasos', 'Formatos oficiales', 'Dónde, cómo y en qué horario', 'Canal institucional de dudas'] },
  { clave: 'familias-requisitos', seccion: 'estudiantes-y-familias', slug: 'requisitos', titulo: 'Requisitos y documentos', tipo: 'texto',
    descripcion: 'Documentos que se solicitan para los trámites escolares.', contenidoFuturo: ['Lista de documentos por trámite', 'Formatos descargables'] },
  { clave: 'familias-calendario', seccion: 'estudiantes-y-familias', slug: 'calendario', titulo: 'Calendario escolar', tipo: 'texto',
    descripcion: 'Calendario del ciclo escolar vigente.', contenidoFuturo: ['Calendario del ciclo escolar vigente', 'Fechas de evaluación y entrega de calificaciones'] },
  { clave: 'familias-evaluaciones-tramites', seccion: 'estudiantes-y-familias', slug: 'evaluaciones-tramites', titulo: 'Evaluaciones y trámites', tipo: 'texto',
    descripcion: 'Trámites escolares que el plantel gestiona.', contenidoFuturo: ['Trámites que gestiona el plantel y cómo solicitarlos'] },
  { clave: 'familias-acuerdos-escolares', seccion: 'estudiantes-y-familias', slug: 'acuerdos-escolares', titulo: 'Acuerdos escolares', tipo: 'texto',
    descripcion: 'Acuerdos de convivencia autorizados.', contenidoFuturo: ['Acuerdos escolares vigentes autorizados'] },
  { clave: 'familias-preguntas-frecuentes', seccion: 'estudiantes-y-familias', slug: 'preguntas-frecuentes', titulo: 'Preguntas frecuentes', tipo: 'faq',
    descripcion: 'Respuestas a dudas frecuentes de estudiantes y familias.', contenidoFuturo: ['Preguntas y respuestas validadas por la dirección'] },
  { clave: 'familias-orientacion-apoyo', seccion: 'estudiantes-y-familias', slug: 'orientacion-apoyo', titulo: 'Orientación y canales de apoyo', tipo: 'texto',
    descripcion: 'Servicios de orientación y acompañamiento confirmados.', contenidoFuturo: ['Servicios de orientación que existan', 'Cómo solicitar apoyo'] },
  { clave: 'familias-participacion', seccion: 'estudiantes-y-familias', slug: 'participacion-familiar', titulo: 'Reuniones y participación familiar', tipo: 'texto',
    descripcion: 'Reuniones y participación de las familias.', contenidoFuturo: ['Calendario de reuniones', 'Comités o asociaciones reconocidos, si existen'] },

  { clave: 'vida-academicas', seccion: 'vida-escolar', slug: 'actividades-academicas', titulo: 'Actividades académicas', tipo: 'texto',
    descripcion: 'Actividades académicas de la comunidad escolar.', contenidoFuturo: ['Actividades académicas confirmadas'] },
  { clave: 'vida-cultura-artes', seccion: 'vida-escolar', slug: 'cultura-y-artes', titulo: 'Cultura y artes', tipo: 'texto',
    descripcion: 'Actividades culturales y artísticas.', contenidoFuturo: ['Actividades culturales y artísticas confirmadas'] },
  { clave: 'vida-deportes', seccion: 'vida-escolar', slug: 'deportes', titulo: 'Deportes y educación física', tipo: 'texto',
    descripcion: 'Actividades deportivas y de educación física.', contenidoFuturo: ['Disciplinas y actividades confirmadas'] },
  { clave: 'vida-eventos-civicos', seccion: 'vida-escolar', slug: 'eventos-civicos', titulo: 'Eventos cívicos', tipo: 'texto',
    descripcion: 'Ceremonias y eventos cívicos.', contenidoFuturo: ['Eventos cívicos confirmados'] },
  { clave: 'vida-proyectos', seccion: 'vida-escolar', slug: 'proyectos-y-exposiciones', titulo: 'Proyectos y exposiciones', tipo: 'texto',
    descripcion: 'Proyectos y exposiciones estudiantiles.', contenidoFuturo: ['Proyectos y exposiciones autorizados'] },
  { clave: 'vida-galeria', seccion: 'vida-escolar', slug: 'galeria', titulo: 'Galería', tipo: 'texto',
    descripcion: 'Galería de eventos con autorización de imagen.',
    contenidoFuturo: ['Fotografías con autorización documentada de imagen'] },
  { clave: 'vida-reconocimientos', seccion: 'vida-escolar', slug: 'reconocimientos', titulo: 'Reconocimientos', tipo: 'texto',
    descripcion: 'Reconocimientos aprobados.', contenidoFuturo: ['Reconocimientos aprobados con autorización cuando corresponda'] },
];

export const MENU = [
  { titulo: 'Inicio', ruta: '' },
  { titulo: 'Conócenos', ruta: 'conocenos/' },
  { titulo: 'Oferta educativa', ruta: 'oferta-educativa/' },
  { titulo: 'Estudiantes y familias', ruta: 'estudiantes-y-familias/' },
  { titulo: 'Vida escolar', ruta: 'vida-escolar/' },
  { titulo: 'Avisos', ruta: 'avisos/' },
  { titulo: 'Documentos', ruta: 'documentos/' },
  { titulo: 'Contacto', ruta: 'contacto/' },
];

export function rutaPagina(p) {
  return `${p.seccion}/${p.slug}/`;
}

export function paginasDeSeccion(seccion) {
  return PAGINAS.filter((p) => p.seccion === seccion);
}

// Organización por público (parte de la arquitectura de información híbrida:
// tareas en accesos rápidos + público en perfiles + áreas en secciones).
export const PERFILES = [
  {
    clave: 'familias',
    titulo: 'Madres, padres y tutores',
    enlaces: [
      { titulo: 'Reinscripción', ruta: 'estudiantes-y-familias/reinscripcion/' },
      { titulo: 'Calendario escolar', ruta: 'estudiantes-y-familias/calendario/' },
      { titulo: 'Orientación y apoyo', ruta: 'estudiantes-y-familias/orientacion-apoyo/' },
    ],
  },
  {
    clave: 'estudiantes',
    titulo: 'Estudiantes',
    enlaces: [
      { titulo: 'Avisos vigentes', ruta: 'avisos/' },
      { titulo: 'Asignaturas', ruta: 'oferta-educativa/asignaturas/' },
      { titulo: 'Vida escolar', ruta: 'vida-escolar/' },
    ],
  },
  {
    clave: 'aspirantes',
    titulo: 'Aspirantes y visitantes',
    enlaces: [
      { titulo: 'Inscripción de nuevo ingreso', ruta: 'estudiantes-y-familias/inscripcion/' },
      { titulo: 'Oferta educativa', ruta: 'oferta-educativa/' },
      { titulo: 'Contacto y ubicación', ruta: 'contacto/' },
    ],
  },
];
