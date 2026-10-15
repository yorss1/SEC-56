# Pendientes de validación

Documento para la dirección de la Escuela Secundaria Técnica No. 56 "Carlos Martínez Balmori" y para quien mantenga el sitio. Lista cada dato o contenido que **debe confirmarse antes de publicar el sitio como portal oficial**, quién debe validarlo y dónde se usa.

**Cómo se publica un dato.** Cada dato institucional vive en `content/site.json` con `estado` y `publicar`. El sitio solo muestra un dato si `publicar` es `true`, y los datos pendientes o sensibles exigen además `aprobadoPor` y `aprobadoEn` (AAAA-MM-DD); sin eso la compilación falla. El contenido de las páginas vive en `content/paginas/<clave>.json` y se publica cambiando `estado` a `aprobado` con `aprobadoPor` y `aprobadoEn`.

**Fuente de lo ya localizado:** *Dossier de investigación web* del 14 de octubre de 2026. El dossier no es una publicación oficial de la escuela. Las referencias a "§" son secciones del dossier.

Marca cada casilla cuando el dato esté confirmado **por escrito** por la persona responsable.

## 0. Autorización del sitio

- [ ] **Autorización expresa de la dirección para publicar este sitio como portal oficial.** Validador: dirección. Se registra en `content/site.json` → `autorizacion` (otorgada, responsable, fecha). Mientras no exista, el sitio solo compila en modo demostración (banner visible, `noindex`).
- [ ] **Dominio oficial.** Validador: dirección (y quien administre el dominio). El dossier no encontró un dominio oficial confirmado. Se usa en la variable `SITE_URL` de la compilación.
- [ ] **Persona o área responsable de actualizar el sitio**, y de aprobar publicaciones. Validador: dirección. Campo `responsableContenido`; hoy no se muestra en el sitio.

## 1. Identidad

| # | Dato | Qué se sabe (dossier) | Validador | Dónde se usa | Estado actual en el sitio |
|---|---|---|---|---|---|
| 1.1 | Nombre oficial y escritura autorizada | "Escuela Secundaria Técnica No. 56 “Carlos Martínez Balmori”" coincide en varias fuentes (§2.1) | Dirección | Encabezado, pie, título y portada | Publicado como dato del dossier |
| 1.2 | Nombre corto | "Secundaria Técnica 56" (§2.1) | Dirección | Títulos de las pestañas del navegador | Publicado |
| 1.3 | Nivel, municipio y entidad | Secundaria técnica pública de educación básica; Tulancingo de Bravo, Hidalgo (§1) | Dirección | Portada | Publicado |
| 1.4 | **CCT** 13DST0058M | Aparece en directorio y registro SEP (§2.3). El dossier sugiere mostrarla solo si la dirección lo aprueba | Dirección | Portada y pie | **No publicado** (`publicar: false`) |
| 1.5 | Logotipo, escudo y reglas de uso | No hay recursos autorizados | Dirección | Encabezado y favicon | Marcador tipográfico "56" provisional; **no es el escudo oficial** |
| 1.6 | Colores institucionales / manual de identidad | Paleta indicada por la escuela: #0B2347, #B30000, #F8F9FA, #FFFFFF, #1E293B. Falta el manual de identidad oficial | Dirección | `assets/site.css` (variables `--c-*`) | Aplicada; confirmar con el manual |
| 1.7 | Fotografías oficiales de fachada e instalaciones | No hay | Dirección | Instalaciones y galería | Sin imágenes |
| 1.8 | Lema, misión, visión y valores | No localizados (§12) | Dirección | `/conocenos/identidad/` | Página en preparación |
| 1.9 | Historia y **fecha oficial de fundación** | Las fuentes discrepan: 1 de septiembre de 1992 vs. operación desde 1996 (§1) | Dirección | `/conocenos/historia/` | **No publicado**; no se afirma ninguna fecha |

## 2. Contacto y ubicación

| # | Dato | Qué se sabe (dossier) | Validador | Dónde se usa | Estado actual |
|---|---|---|---|---|---|
| 2.1 | **Domicilio completo** | Calle Profesor Cosme Hernández Ortega s/n, Tulancingo de Bravo, Hidalgo (§2.4) | Dirección / administración | Contacto, pie, enlace al mapa | **No publicado** |
| 2.2 | **Colonia** | Las fuentes discrepan: El Paraíso / Lomas del Paraíso (§2.4) | Dirección | Aún no se muestra en ninguna plantilla: al validarla, inclúyela dentro del texto de `direccion` | No publicado |
| 2.3 | **Código postal** | 43684 en registros consultados; un documento histórico consigna 43680 (§2.4) | Dirección | Contacto (junto al domicilio) | **No publicado** |
| 2.4 | **Teléfono institucional** | 775 755 1590 en un directorio de terceros; confirmar vigencia (§1) | Dirección | Contacto y pie | **No publicado** |
| 2.5 | **Correo institucional** | El dossier cita un correo histórico de un servicio gratuito que no debe publicarse sin confirmación. **No se guardó en el repositorio a propósito** | Dirección | Contacto y pie | No publicado; valor vacío |
| 2.6 | Horario de atención administrativa | No localizado | Dirección | Contacto | No publicado |
| 2.7 | Horarios exactos de turno matutino y vespertino | Los directorios indican ambos turnos, sin horarios (§2.2) | Dirección | Contacto | No publicado |
| 2.8 | Redes sociales **oficiales** | No confirmadas | Dirección | Contacto | No publicado |
| 2.9 | Mapa | Depende de validar el domicilio | Dirección | Contacto: el enlace "Ver en mapa" aparece solo con domicilio publicado; **no se incrusta ningún mapa de terceros** | No disponible |
| 2.10 | Turnos (matutino/vespertino) | Directorio de terceros (§2.2) | Dirección | Reservado: ninguna plantilla lo muestra todavía | No publicado |

## 3. Estructura de la escuela

| # | Contenido | Página | Validador | Estado |
|---|---|---|---|---|
| 3.1 | Autoridades actuales (el dossier **no** confirma la dirección escolar vigente) | `/conocenos/autoridades/` | Dirección | En preparación. No se copió personal de directorios históricos |
| 3.2 | Organigrama autorizado y áreas que realmente existen | `/conocenos/autoridades/` | Dirección | En preparación |
| 3.3 | Directorio público aprobado | `/conocenos/autoridades/` | Dirección | En preparación |
| 3.4 | Permiso para publicar nombres, fotografías y perfiles del personal | — | Dirección | Pendiente |
| 3.5 | Modelo educativo y programas institucionales activos (p. ej. el dossier solo acredita que la escuela figuró en una lista de 2022 del Programa Nacional de Inglés; **no** que siga activo) | `/conocenos/modelo-educativo/` | Dirección | En preparación |
| 3.6 | Instalaciones y espacios confirmados (biblioteca, laboratorios, aula digital, etc.) | `/conocenos/instalaciones/` | Dirección | En preparación |

## 4. Oferta académica

| # | Contenido | Página | Validador | Estado |
|---|---|---|---|---|
| 4.1 | Información de primer, segundo y tercer grado | `/oferta-educativa/primer-grado/`, `segundo-grado/`, `tercer-grado/` | Dirección / subdirección académica | En preparación |
| 4.2 | Asignaturas por grado del plan vigente | `/oferta-educativa/asignaturas/` | Dirección | En preparación |
| 4.3 | **Tecnologías o talleres**, con nombre oficial, grados y descripción (el dossier no localizó una lista fiable; no se inventó ninguna) | `/oferta-educativa/tecnologias-talleres/` | Dirección | En preparación |
| 4.4 | Actividades complementarias o extracurriculares que realmente se ofrecen | `/oferta-educativa/actividades-complementarias/` | Dirección | En preparación |

## 5. Control escolar y trámites

| # | Contenido | Página | Validador | Estado |
|---|---|---|---|---|
| 5.1 | **Inscripción de nuevo ingreso:** a quién va dirigida, periodo y fecha límite, requisitos, pasos, formatos, dónde y cómo, horarios, canal de dudas, ciclo escolar | `/estudiantes-y-familias/inscripcion/` (clave `familias-inscripcion`) | Control escolar / dirección | En preparación. Todos los campos son obligatorios al aprobar |
| 5.2 | **Reinscripción** de segundo y tercer grado (mismos campos) | `/estudiantes-y-familias/reinscripcion/` (clave `familias-reinscripcion`) | Control escolar / dirección | En preparación |
| 5.3 | Requisitos y documentos por trámite; formatos descargables oficiales | `/estudiantes-y-familias/requisitos/` y `/documentos/` | Control escolar | En preparación |
| 5.4 | **Calendario escolar** del ciclo vigente | `/estudiantes-y-familias/calendario/` y `/documentos/` | Dirección | En preparación |
| 5.5 | Evaluaciones y trámites que el plantel gestiona (constancias, boletas, etc.) | `/estudiantes-y-familias/evaluaciones-tramites/` | Control escolar | En preparación |
| 5.6 | Acuerdos escolares autorizados | `/estudiantes-y-familias/acuerdos-escolares/` | Dirección | En preparación |
| 5.7 | Preguntas frecuentes validadas | `/estudiantes-y-familias/preguntas-frecuentes/` | Dirección | En preparación |
| 5.8 | Servicios de orientación, trabajo social y canales de apoyo que existan (el dossier solo cita una mención histórica de Trabajo Social) | `/estudiantes-y-familias/orientacion-apoyo/` | Dirección | En preparación |
| 5.9 | Reuniones y participación familiar; comités o asociaciones reconocidos | `/estudiantes-y-familias/participacion-familiar/` | Dirección | En preparación |
| 5.10 | **Política para publicar resultados de admisión sin exponer datos personales** (el sitio no publica listados nominales de aspirantes) | — | Dirección + revisión jurídica | Pendiente de definir |

> **Importante.** El blog `tec56poligono.blogspot.com` no fue reutilizado. Antes de aprovechar cualquiera de sus avisos o documentos, la escuela debe confirmar que corresponde al plantel, que sigue vigente y que autoriza su uso. Tampoco se debe usar nada de los dos sitios homónimos señalados en el dossier (§3.5).

## 6. Vida escolar

| # | Contenido | Página | Validador | Estado |
|---|---|---|---|---|
| 6.1 | Actividades académicas, culturales y artísticas confirmadas | `/vida-escolar/actividades-academicas/`, `cultura-y-artes/` | Dirección | En preparación |
| 6.2 | Deportes, educación física y vida saludable | `/vida-escolar/deportes/` | Dirección | En preparación |
| 6.3 | Eventos cívicos | `/vida-escolar/eventos-civicos/` | Dirección | En preparación |
| 6.4 | Proyectos y exposiciones autorizados | `/vida-escolar/proyectos-y-exposiciones/` | Dirección | En preparación |
| 6.5 | Galería: fotografías con **autorización documentada de imagen** de cada menor o su tutor | `/vida-escolar/galeria/` | Dirección | En preparación. Los avisos no admiten imágenes en esta versión |
| 6.6 | Reconocimientos aprobados | `/vida-escolar/reconocimientos/` | Dirección | En preparación |

## 7. Legal, privacidad y seguridad

| # | Contenido | Validador | Estado |
|---|---|---|---|
| 7.1 | **Aviso de privacidad integral** aplicable al sitio y a formularios: responsable, finalidades, destinatarios, conservación, medios para ejercer derechos. Se publica en `content/paginas/privacidad.json` | Responsable institucional y, si corresponde, asesoría jurídica | Pendiente. La página muestra un resumen técnico del sitio y un mensaje de "pendiente de aprobación" |
| 7.2 | Política de uso del sitio (si la dirección decide que procede). Clave `politica-uso` | Dirección | Pendiente |
| 7.3 | Destinatario institucional de los mensajes del formulario de contacto | Dirección | Pendiente. Mientras tanto, el formulario **no se muestra** |
| 7.4 | Reglas de conservación de mensajes y documentos publicados | Responsable institucional | Pendiente |
| 7.5 | Autorizaciones de imagen de menores (formato y resguardo) | Dirección | Pendiente |
| 7.6 | Protocolos de seguridad escolar que puedan hacerse públicos | Dirección | Pendiente |
| 7.7 | Revisión de accesibilidad con tecnologías de asistencia antes del lanzamiento | Quien mantenga el sitio | Pendiente. La página de accesibilidad **no declara conformidad** |

## 8. Datos del dossier que NO se muestran como actuales

- **Estadísticas 2022–2023** (matrícula, grupos, aulas, computadoras): son históricas y de un directorio de terceros. No se incluyeron. Si la escuela quiere publicar cifras, debe entregarlas actualizadas y autorizarlas. El verificador de compilación falla si aparecen las cifras del dossier.
- **Nombres del personal** de directorios con datos de nómina de 2023: no se incluyeron.
- **Contenido de los sitios homónimos** (otra escuela "Técnica 56" en otra entidad): prohibido; el verificador de compilación falla si aparecen sus dominios o nombres.
