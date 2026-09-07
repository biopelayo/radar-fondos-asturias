# Radar Fondos Asturias — V2 Master Plan

## 0. Propósito del documento

Este documento define una V2 ambiciosa, ejecutable y verificable de Radar Fondos Asturias. Consolida producto, experiencia, arquitectura, datos, operación y criterios de salida. Su objetivo no es maximizar el número de anuncios almacenados, sino convertir publicaciones oficiales dispersas en oportunidades que una persona pueda evaluar, preparar y presentar con fundamento.

La V2 conserva dos límites no negociables:

- Los datos privados permanecen en el dispositivo salvo consentimiento explícito para una función opcional.
- El sistema no firma, identifica electrónicamente ni presenta solicitudes. La decisión final, la firma y el envío son siempre humanos.

La versión estática y gratuita debe entregar valor completo por sí sola. Los servicios remotos y la IA son mejoras opcionales, nunca dependencias ocultas.

---

## 1. North star

### 1.1 Resultado que debe producir

Radar Fondos Asturias convierte señales oficiales en decisiones y expedientes:

1. Detecta una publicación relevante.
2. La enlaza con sus bases, convocatoria, anexos, correcciones y ampliaciones.
3. Expone qué se sabe, qué documento lo demuestra y qué sigue sin verificarse.
4. Evalúa primero los requisitos excluyentes contra un perfil privado local.
5. Ordena después por valor alcanzable, urgencia, esfuerzo y riesgo.
6. Permite abrir, preparar y exportar un expediente bajo orden expresa.
7. Registra presentación, concesión, cobro y aprendizaje.

### 1.2 Métrica norte

La métrica principal es el número de oportunidades realmente accionables que llegan a una decisión documentada y, cuando procede, a una solicitud completa.

Métricas de resultado:

- oportunidades elegibles o plausiblemente elegibles descubiertas;
- tiempo desde detección hasta decisión;
- expedientes iniciados, completados y presentados;
- dinero solicitado, concedido, contratado, facturado y cobrado;
- horas de preparación ahorradas;
- plazos críticos no perdidos;
- tasa de falsos positivos y decisiones revertidas por evidencia posterior.

No son métricas de éxito por sí solas:

- número bruto de noticias o documentos;
- suma del presupuesto total de los programas;
- un score alto sin elegibilidad demostrada;
- resúmenes generados sin trazabilidad;
- actividad de interfaz sin resultado financiero.

### 1.3 Definición de “accionable”

Una oportunidad es accionable cuando:

- existe una fuente oficial primaria;
- el plazo y el estado están confirmados o claramente marcados como pendientes;
- se conoce quién puede solicitarla;
- se entiende el instrumento económico y el importe accesible, no solo la dotación global;
- los requisitos críticos tienen evidencia documental;
- el motor de elegibilidad ha producido elegible, no elegible, faltan datos o requiere revisión;
- existe un siguiente paso concreto y una ruta oficial de tramitación;
- los conflictos, incertidumbres y bloqueos siguen visibles.

---

## 2. Principios de producto

1. **Evidencia oficial antes que interpretación.** Toda afirmación decisiva debe poder volver a documento, página y fragmento.
2. **Elegibilidad antes que entusiasmo.** Un bloqueo duro precede a cualquier ranking o cantidad llamativa.
3. **Dinero alcanzable antes que dotación publicada.** Se separan presupuesto del programa, máximo por solicitante, gasto elegible, ayuda estimada, contrato, margen y cobro.
4. **Siguiente acción antes que volumen documental.** La ficha debe terminar en una decisión o tarea concreta.
5. **Incertidumbre explícita.** Desconocido nunca significa que cumple.
6. **Local-first real.** Perfil, documentos, notas, cálculos y expedientes no entran en el repositorio público.
7. **Historial inmutable.** Las correcciones y ampliaciones crean versiones; no reescriben silenciosamente el pasado.
8. **Instrumentos separados.** Una licitación no se puntúa como una subvención; un préstamo no es capital concedido.
9. **Humano en control.** El sistema prepara, calcula y comprueba. No firma ni presenta.
10. **IA prescindible y citada.** Si la IA falla o se desactiva, descubrimiento, reglas, ranking y expediente siguen funcionando.
11. **Degradación honesta.** Una fuente caída conserva la última copia buena y muestra su antigüedad.
12. **Accesibilidad bajo densidad.** La interfaz densa sigue siendo navegable por teclado, legible por lector de pantalla y usable al 200 %.

---

## 3. Alcance y no alcance

### 3.1 Alcance de la V2 estática y gratuita

- ingesta programada de metadatos y documentos públicos oficiales;
- catálogo canónico con versiones, relaciones y cambios;
- PLACSP y TED como carril de contratación diferenciado;
- ampliación de BDNS, BOE, BOPA y Funding & Tenders;
- fuentes oficiales complementarias estatales, asturianas, locales y europeas;
- extracción determinista de PDF, tablas y OCR selectivo;
- procedencia por campo y cola de revisión;
- perfil de elegibilidad estructurado y privado;
- reglas explicables y ranking por familia;
- expediente local completo;
- generación local de memoria, checklist, presupuesto, calendario y paquete de entrega;
- alertas dentro de la aplicación, feed público de cambios, correo genérico y exportación ICS;
- analítica local del embudo y resultados;
- PWA, caché, copia conocida buena, exportación y restauración cifrada;
- observabilidad pública de fuentes y calidad;
- despliegue en GitHub Pages y procesamiento público en GitHub Actions.

### 3.2 Mejoras opcionales

- sincronización cifrada entre dispositivos;
- avisos remotos personalizados cuando el navegador está cerrado;
- OCR pesado y conversión de documentos privados;
- colaboración con roles;
- copia de seguridad administrada;
- extracción, resumen y redacción asistidos por IA;
- búsqueda semántica o modelos locales.

### 3.3 Fuera de alcance

- garantía de elegibilidad o concesión;
- asesoramiento jurídico, fiscal o laboral vinculante;
- firma electrónica, custodia de certificados o claves;
- presentación autónoma en sedes electrónicas;
- automatización que suplante una declaración responsable;
- scraping de áreas autenticadas;
- publicación de documentos privados;
- CRM multiusuario o SaaS comercial sobre GitHub Pages;
- predicción de concesión sin datos históricos suficientes;
- ranking único que mezcle subvenciones, financiación, premios y contratos.

---

## 4. Arquitectura de experiencia e información

### 4.1 Dirección UX

La dirección visual se mantiene como **Gazette Lab / Dossier Workbench**: una mesa de trabajo institucional, oscura, reglada y centrada en el expediente. La ficha seleccionada es el objeto principal; la fuente, la frescura, el dinero, el plazo y los bloqueos permanecen visibles.

Decisiones de experiencia:

- escritorio primero, con flujo documental claro en tablet y móvil;
- ledger de oportunidades → dossier → carril de acción;
- visor de evidencia al mismo nivel que el resumen, no escondido en enlaces;
- acid/chartreuse reservado para selección, dinero verificable, cumplimiento y acción;
- cian para procedencia, ámbar para verificar y coral para riesgo o bloqueo;
- color siempre acompañado de palabra, icono, cifra o posición;
- geometría cuadrada, planos tonales y reglas de 1 px; sin tarjetas flotantes;
- español directo: “Por verificar”, “Faltan datos”, “Bloqueo”, “Preparar expediente”;
- el radar es una vista exploratoria secundaria y nunca reemplaza la mesa de decisión.

La V2 no añade una cuarta columna permanente al workbench. Usa dos modos del mismo dossier:

- **Modo Triage:** conserva ledger → dossier → carril de acción para recorrer señales, descartar, guardar o decidir qué merece verificación.
- **Modo Evidence:** al activar “Verificar en fuente”, el ledger se repliega y el dossier se convierte en un split redimensionable de análisis y documento oficial. La oportunidad, el claim activo, la página y la posición de lectura se conservan al alternar entre modos.

El momento distintivo de la experiencia es claim → fuente: pulsar importe, plazo, criterio o riesgo lleva al fragmento exacto del documento, lo resalta una sola vez y muestra su estado de cita. El usuario puede volver al punto de decisión sin perder contexto. El enlace externo queda como salida de respaldo, no como flujo normal.

El refinamiento visual debe aumentar la jerarquía sin cambiar de mundo: título de trabajo corto para escaneo y “Denominación oficial” completa y sin truncar; banda de dinero/elegibilidad/plazo antes del texto largo; plano claro de papel reservado al documento oficial dentro del chrome oscuro; texto de lectura de 13–15 px y metadatos mono de al menos 10 px. El movimiento dura 120–180 ms y solo explica cambio de panel, localización de cita o diff; no hay animación ambiental del radar ni bucles, y reduced motion vuelve estos cambios inmediatos.

### 4.2 Flujos principales

#### Revisión diaria

1. La bandeja muestra nuevas oportunidades y cambios materiales desde la última visita.
2. El usuario filtra por familia, territorio, elegibilidad, plazo y calidad de evidencia.
3. Selecciona una oportunidad y ve el dossier completo.
4. Revisa bloqueos, importe alcanzable y siguiente acción.
5. Descarta, guarda, solicita datos al perfil o abre el expediente.

#### Decisión de elegibilidad

1. El sistema ejecuta reglas duras.
2. Muestra cada criterio, el dato privado usado y la cita oficial.
3. El usuario completa hechos ausentes o marca revisión profesional.
4. El resultado queda congelado con versiones de regla, perfil y oportunidad.
5. Solo después se calcula prioridad.

El recorrido no se divide en pantallas inconexas: desde una fila de elegibilidad, “Ver fuente” abre Modo Evidence en el documento y página correctos; confirmar, corregir o declarar “faltan datos” actualiza esa fila, avanza al siguiente criterio no resuelto y recalcula la decisión solo cuando corresponde. Una corrección o ampliación posterior reabre las citas afectadas y marca la evaluación como pendiente de reconfirmación.

#### Preparación

1. “Preparar candidatura” crea un expediente local asociado a una versión.
2. El sistema propone checklist, cronograma, presupuesto y estructura de memoria.
3. El usuario aporta documentos y valida supuestos.
4. Un control de calidad lista faltantes, incoherencias y cambios oficiales.
5. El usuario exporta el paquete, revisa, firma y presenta manualmente en la sede oficial.

### 4.3 Mapa de pantallas

| Área | Trabajo principal | Información decisiva | Acción primaria |
|---|---|---|---|
| **Hoy / Bandeja** | Triage de novedades y cambios | nueva, cambió, vence, calidad, encaje preliminar | Revisar |
| **Mesa de decisión** | Comparar y seleccionar | elegibilidad, capital alcanzable, plazo, esfuerzo, riesgo | Abrir dossier |
| **Dossier de oportunidad** | Comprender y decidir | resumen, dinero, plazos, reglas, cambios, fuentes | Evaluar / Preparar |
| **Evidence Lab** | Verificar afirmaciones | PDF/HTML, página, OCR, claims, conflictos, versiones | Confirmar o marcar revisión |
| **Elegibilidad** | Resolver requisitos | regla, hecho local, resultado, evidencia, faltante | Completar dato / Decidir |
| **Comparador** | Contrastar 2–4 opciones homogéneas | importe, intensidad, plazo, esfuerzo, riesgo | Elegir prioridad |
| **Guardadas** | Mantener vigilancia | cambios, vencimiento, estado local | Abrir expediente |
| **Expedientes** | Preparar solicitudes | tareas, documentos, presupuesto, memoria, QA | Exportar paquete |
| **Plazos y alertas** | Evitar pérdidas | fecha, confianza, dependencia, severidad | Añadir calendario |
| **Analítica** | Mejorar decisiones | embudo, tiempo, dinero y resultado | Revisar estrategia |
| **Fuentes y salud** | Auditar cobertura | última ejecución, error, volumen, frescura | Reintentar / Ver detalle |
| **Perfil y bóveda** | Gestionar datos privados | hechos, evidencias, caducidad, almacenamiento | Exportar copia cifrada |
| **Ajustes** | Configurar operación | privacidad, caché, alertas, motores opcionales | Guardar localmente |

La jerarquía evita destinos solapados:

- **Mesa** es el workspace raíz y contiene las colas Hoy, Todas, Guardadas y Descartadas, más Ledger/Radar como formas de explorar; Dossier, Evidence Lab, Elegibilidad, Finanzas y Comparador son superficies de trabajo derivadas, no nuevos elementos del rail global.
- **Expedientes** contiene pipeline, estudio de preparación y analítica privada de resultados.
- **Plazos** es transversal a oportunidades y expedientes.
- **Fuentes y salud**, **Perfil y bóveda** y **Ajustes** son utilidades operativas.

Mapa de activación por fase:

- **Fases 1–2:** Mesa sobre el catálogo canónico y Fuentes/salud reales.
- **Fase 3:** Dossier V2, Modo Evidence, visor integrado, citas, versiones y cambios.
- **Fase 4:** Elegibilidad, Comparador y escenarios financieros.
- **Fase 5:** Expedientes, estudio de preparación, bóveda y exportación.
- **Fase 6:** Hoy/alertas, Plazos, analítica, offline y hardening accesible/responsive.

En móvil la navegación primaria debe exponer Mesa, Expedientes, Plazos, Perfil y Más; Mesa abre por defecto la cola Hoy. Fuentes, analítica y ajustes viven en Más. El dossier conserva el título oficial completo y el orden lectura → evidencia → decisión.

### 4.4 Estados que deben diseñarse

- primera visita y perfil vacío;
- catálogo vacío real, sin coincidencias y fallo de fuente;
- carga, actualización parcial, copia obsoleta y modo offline;
- oportunidad abierta, próxima, suspendida, ampliada, cerrada y cancelada;
- datos demo frente a datos oficiales;
- claim confirmado, extraído, conflictivo, de baja confianza o sin evidencia;
- elegible, no elegible, faltan datos y requiere revisión;
- expediente sin iniciar, preparando, listo para revisar, presentado, concedido, denegado y cobrado;
- almacenamiento lleno, migración, restauración fallida y copia cifrada incorrecta;
- función opcional no configurada, sin permiso o agotada;
- documento ilegible, escaneado, sustituido o retirado.

### 4.5 Responsive, accesibilidad y primera sesión

- **≥1280 px:** Modo Triage mantiene las tres regiones actuales; Modo Evidence usa análisis/documento redimensionable y un inspector contextual, nunca cuatro columnas comprimidas.
- **768–1279 px:** ledger como cola replegable; split solo en paisaje cuando ambas regiones conservan ancho de lectura. En vertical, Análisis y Documento alternan conservando claim, página, zoom y foco.
- **<768 px y 200 % de zoom:** una tarea por vista con pestañas **Análisis / Documento / Acciones**. El selector de documento/página y el estado de cita permanecen visibles; comparación y tablas conservan ancho semántico con scroll horizontal. La navegación inferior no tapa acciones ni contenido.
- El divisor del split se opera con teclado y anuncia su tamaño. Documento, claims, historial y acciones son landmarks alcanzables por salto; el foco vuelve al control de origen al cerrar un panel.
- El canvas PDF nunca es la única lectura: existe texto extraído en orden, navegación por páginas/encabezados y lista lineal equivalente de anotaciones. Un salto a evidencia anuncia documento, página y claim sin leer de nuevo toda la pantalla.
- Estados, diffs y anotaciones no dependen de color, hover o posición. Controles táctiles mantienen 44 × 44 px cuando no forman parte de una tabla densa; foco visible de 2 px y contraste AA son obligatorios.
- La primera sesión pide solo residencia/ámbito, forma o situación jurídica, sectores, capacidad de inversión y objetivo. A continuación demuestra con una oportunidad real cómo un hecho cambia una regla; el resto del perfil se solicita en contexto. Demo, dato oficial, hecho privado y supuesto permanecen etiquetados y no se pide subir documentación para entender el producto.

---

## 5. Evidence Lab y visor documental

### 5.1 Objetivo

El Evidence Lab convierte la procedencia en una experiencia verificable. Debe permitir contestar: “¿Qué afirma el sistema, dónde lo dice la Administración y qué cambió?”

### 5.2 Composición

En escritorio, Modo Evidence reutiliza el shell del dossier:

- plano de análisis: criterio/claim activo, valor interpretado, confianza, conflicto, efectos y acción de revisión;
- plano documental dominante: visor PDF/HTML/texto con miniaturas replegables, página, búsqueda, zoom y resaltados;
- árbol documental por rol y versión como rail replegable dentro del plano documental;
- inspector de cita como drawer contextual, no como otra columna siempre abierta;
- franja superior: organismo, referencia, fecha, hash, rol, vigencia y calidad OCR;
- historial/diff bajo demanda que sustituye temporalmente al visor secundario sin perder el claim activo.

En tablet y móvil se aplican las reglas de 4.5. Cambiar entre Análisis, Documento y Acciones conserva documento, página, zoom, fragmento activo y posición de lectura. Si un PDF no admite embed, está retirado o falla por política del origen, el plano muestra el texto oficial extraído y su procedencia, explica la limitación y ofrece “Abrir fuente oficial”; nunca queda un visor vacío.

### 5.3 Interacciones

- al seleccionar un requisito, abrir documento y página exactos;
- al seleccionar un fragmento, ver qué campos dependen de él;
- crear una anotación local con resaltado, nota y categoría —elegibilidad, dinero, plazo, documento, riesgo—, o promover el fragmento a evidencia de un criterio;
- comparar texto y metadatos entre convocatoria, corrección y ampliación;
- aceptar un claim, corregirlo o marcarlo para revisión sin modificar el documento original;
- mostrar citas como oficial localizada, confirmada por el usuario, inferida, conflictiva, desplazada por nueva versión o ausente;
- cuando cambia una revisión, intentar reanclar por texto y coordenadas; si no coincide, conservar la cita anterior y marcarla “requiere reconfirmación”;
- distinguir revisión humana local de verificación oficial;
- copiar cita con referencia, página y URL;
- no usar un resumen generado como sustituto del documento.

### 5.4 Reglas de evidencia

- “Fuente oficial” describe origen; “campo verificado” exige evidencia específica.
- Todo campo crítico verificado tiene documentRevisionId, página/sección y offsets.
- Si dos documentos oficiales discrepan, ambos permanecen visibles hasta aplicar precedencia o revisión.
- El texto OCR conserva coordenadas y una puntuación de calidad.
- Un documento nuevo con el mismo URL pero otro hash es una nueva revisión.
- Los PDFs públicos no se almacenan masivamente en Git; se publican metadatos, hashes, enlaces y fragmentos mínimos.
- Toda anotación y confirmación privada tiene alternativa textual, autor “usuario local”, fecha y documentoRevisionId; nunca altera el PDF ni convierte una inferencia en texto oficial.
- La vista “Qué cambió” prioriza plazo, beneficiarios, cuantía/intensidad, gastos, documentos y presentación; el diff literal completo sigue disponible como segundo nivel.

---

## 6. Arquitectura técnica

### 6.1 Frontera local-first

    Fuentes oficiales públicas
              │
              ▼
    Adaptadores Python en GitHub Actions
              │
              ▼
    Validación → documentos → extracción → resolución → versiones
              │
              ▼
    Catálogo público estático versionado y fragmentado
              │
              ▼
    React + TypeScript + Vite en GitHub Pages
              ├── IndexedDB/OPFS: perfil, documentos y expedientes privados
              ├── reglas y ranking deterministas
              ├── generación local de documentos
              └── analítica y alertas locales

    Servicios remotos/IA: rama opcional con consentimiento explícito

### 6.2 Componentes propuestos

#### Pipeline público

- paquete Python por adaptadores, no un script monolítico;
- contratos JSON Schema versionados;
- normalización y resolución de entidades deterministas;
- adquisición documental con límites;
- extracción PDF/OCR;
- grafo de documentos y oportunidades;
- generador de versiones y eventos;
- validador de calidad;
- publicador atómico de shards y manifiesto.

#### Aplicación

- React/TypeScript/Vite existente;
- store de catálogo público separado del workspace privado;
- IndexedDB versionado; OPFS para blobs si está disponible;
- Web Worker para búsqueda, reglas, hashing y generación pesada;
- PWA con service worker;
- rutas hash compatibles con GitHub Pages;
- módulos de exportación cargados bajo demanda.

#### Salida pública

- data/v2/manifest.json;
- data/v2/health.json;
- índices compactos por familia y geografía;
- detalles fragmentados por prefijo de ID;
- feed reciente de cambios;
- archivos mensuales de cerradas;
- vocabularios y esquemas.

El cliente descarga primero índices ligeros y abre el detalle solo al seleccionar. Una actualización se valida y se instala en IndexedDB en una transacción; si falla, conserva la copia conocida buena anterior.

---

## 7. Modelo canónico y procedencia

### 7.1 Identidad estable

- sourceRecordId: namespace de fuente + identificador externo.
- documentRevisionId: SHA-256 de los bytes.
- opportunityId: UUIDv5/hash de organismo autoritativo + referencia canónica.
- opportunityVersionId: hash del contenido normalizado relevante para decisión.
- alertEventId: hash de oportunidad + transición + tipo + campo.

Los timestamps de recolección no deben cambiar una versión si el contenido sustantivo no cambió.

### 7.2 Opportunity

Campos mínimos:

- schemaVersion, id, family y canonicalReference;
- títulos e idiomas;
- organismo con identificadores;
- ámbito geográfico y lugar de ejecución;
- lifecycleStatus;
- ventanas de solicitud con fecha, hora, zona, modalidad relativa/absoluta y verificación;
- estructura financiera: dotación global, mínimo/máximo por solicitante, intensidad, gasto elegible, moneda, tramo reembolsable y no reembolsable;
- clases de beneficiarios;
- actividades y costes elegibles/excluidos;
- incompatibilidades y régimen de ayudas;
- ruta de presentación, registro y firma exigida;
- referencias a documentos, registros fuente y relaciones;
- currentVersionId, calidad, completitud y conflictos.

No contiene score privado, estado guardado, notas ni fase de candidatura.

### 7.3 SourceRecord

- fuente, ID externo, URL canónica y URL recuperada;
- primera y última observación;
- fecha publicada y actualizada;
- hash y metadatos HTTP;
- versión del adaptador y esquema;
- referencias externas;
- estado de recuperación y error clasificado.

### 7.4 Document

- ID semántico y revisión inmutable;
- URL oficial, rol, MIME, idioma, fecha, tamaño y hash;
- método de extracción, versión, páginas y calidad;
- relaciones: basesDe, convoca, corrige, amplía, sustituye, anexa, instruye o resuelve;
- claims dependientes.

Roles iniciales:

- bases reguladoras;
- convocatoria/extracto;
- corrección;
- ampliación;
- formulario/anexo;
- guía/FAQ;
- instrucciones de presentación;
- resolución y concesión;
- pliego administrativo/técnico;
- anuncio de licitación/adjudicación.

### 7.5 Claim

Cada dato decisivo es Claim<T>:

- path y valor tipado;
- método de extracción y versión;
- confianza;
- uno o varios punteros de evidencia;
- estado de revisión;
- alternativas/conflicto;
- fecha efectiva.

No debe existir un único booleano verified para toda la oportunidad.

### 7.6 OpportunityVersion y ChangeEvent

OpportunityVersion incluye:

- snapshot canónico;
- observedAt y effectiveAt;
- versión anterior;
- documentos y fuentes usados;
- diff semántico;
- versión de reglas de precedencia.

ChangeEvent clasifica:

- informativo;
- relevante;
- urgente;
- cierre/cancelación.

Cambios urgentes: plazo, beneficiarios, cuantía/intensidad, documentos obligatorios, ruta de presentación, suspensión o cancelación.

### 7.7 Modelos privados

- ProfileFact: valor, tipo, origen, verificación, fecha y caducidad.
- EligibilityEvaluation: reglas, resultados, facts usados y versiones.
- WorkspaceOpportunityState: guardada, descartada, pospuesta, leída.
- ApplicationDossier: oportunidad/version fijada, estado, tareas, documentos, presupuesto y audit log.
- LocalDocument: metadatos, blob local, hash, tipo, caducidad y relación.
- Outcome: presentado, concedido, denegado, contratado, facturado, cobrado.

Esto elimina la mezcla actual entre estado público de oportunidad y estado privado de trabajo.

---

## 8. Conectores y cobertura

### 8.1 Contrato de adaptador

Cada conector implementa:

- discover(window, cursor);
- hydrate(record);
- discoverDocuments(package);
- normalize(package);
- health().

Declara:

- autoridad y condición de fuente oficial;
- familias y territorio;
- IDs estables;
- cadencia y cursor;
- rate limits y reintentos;
- licencia/reutilización y robots;
- parserVersion;
- límites de bytes, páginas y tiempo.

### 8.2 Orden de implementación

#### Nivel A — registros autoritativos

1. [BDNS / SNPSAP](https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias): subvenciones de administraciones españolas.
2. [BOE Datos Abiertos](https://www.boe.es/datosabiertos/): disposiciones estatales y referencias jurídicas.
3. [BOPA / miPrincipado](https://miprincipado.asturias.es/bopa): disposiciones asturianas.
4. [PLACSP Datos Abiertos](https://contrataciondelestado.es/wps/portal/DatosAbiertos): contratación española y agregada.
5. [TED Search API](https://docs.ted.europa.eu/api/latest/search.html): contratación europea mediante CPV, NUTS y estados.
6. [EU Funding & Tenders APIs](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/support/apis): convocatorias, topics, actualizaciones, FAQ y proyectos.

#### Nivel B — enriquecimiento oficial

- [SEKUENS](https://www.sekuens.es/);
- [Red.es — convocatorias](https://www.red.es/es/TransparenciayBuen%20Gobierno/Transparencia%20Econ%C3%B3mica/Ayudas-Subvenciones);
- [CDTI — ayudas](https://www.cdti.es/ayudas);
- [Transparencia del Principado — subvenciones](https://transparencia.asturias.es/ast/economica/subvenciones-convocadas-y-concedidas);
- [Trabajastur — ayudas](https://trabajastur.asturias.es/ayudas-y-subvenciones/buscador);
- sedes y agencias oficiales de Oviedo, Gijón, Avilés, grupos LEADER y Cámaras;
- portales PRTR y programas sectoriales oficiales.

Estas páginas deben aportar documentos, guías, hitos o estado a una oportunidad ya registrada cuando exista BDNS/BOE/BOPA/PLACSP. No se crea un duplicado por cada página.

#### Nivel C — cobertura europea ampliada

- programas directos no completamente cubiertos por una única búsqueda;
- Interreg, EIT/KIC, Erasmus+, Creative Europe, LIFE y financiación en cascada oficial;
- portales nacionales y regionales de gestión compartida;
- partner search como evidencia de preparación, no como elegibilidad.

La Comisión diferencia gestión directa y portales nacionales/regionales de fondos compartidos: [National single portals](https://commission.europa.eu/funding-and-tenders/find-funding/funding-management-mode/national-single-portals_en).

### 8.3 Política de fuente

- Primaria: crea o confirma hechos jurídicos.
- Complementaria oficial: enriquece, explica o aporta documentos.
- Descubrimiento: crea un candidato pendiente.
- No oficial: nunca convierte por sí sola un campo en verificado.

Toda cobertura declarada debe proceder de telemetría real del conector, no de una tabla estática.

---

## 9. PDF, OCR y extracción

### 9.1 Etapas

1. descubrir y clasificar enlaces;
2. validar host, redirect, estado, MIME real, tamaño y hash;
3. extraer texto/tablas por página;
4. detectar escaneado por densidad de texto e imágenes;
5. ejecutar OCR español/inglés solo en páginas relevantes y bajo límites;
6. normalizar cabeceras, pies, guiones, fechas, moneda, porcentaje, tablas y referencias;
7. producir claims candidatos con coordenadas y confianza;
8. resolver precedencia y contradicciones;
9. publicar o enviar a revisión.

### 9.2 Herramientas de la capa gratuita

- pypdf/pdfplumber/PyMuPDF para texto y estructura;
- Tesseract/OCRmyPDF para OCR selectivo;
- parsers por fuente para metadatos estructurados;
- reglas y patrones versionados;
- corpus de fixtures y golden files.

### 9.3 Límites operativos

- máximo de bytes, páginas y tiempo por documento;
- límite de redirects y hosts oficiales permitidos;
- control de expansión de ZIP;
- descarga y OCR en entorno efímero;
- no persistir documentos privados;
- no bloquear el catálogo entero por un PDF patológico;
- marcar “documento no procesado” con causa.

### 9.4 Reglas de publicación

Plazo, beneficiario, importe/intensidad, territorio, costes, incompatibilidad y presentación no aparecen como confirmados sin evidencia. Un valor de baja confianza se publica como candidato o “Por verificar”.

---

## 10. Resolución, deduplicación y cambios

Se combinan:

- identificadores autoritativos;
- referencias jurídicas cruzadas;
- hashes de documento;
- organismo + referencia normalizada;
- título, programa, territorio, fechas e importes;
- relaciones explícitas de corrección/ampliación;
- mapeos PLACSP–TED;
- mapeos BDNS–BOE/BOPA–programa.

Solo se fusionan automáticamente coincidencias de alta confianza. El resto se conserva como possibleSameAs. Una fusión nunca borra las apariciones fuente.

Un run repetido con la misma entrada debe producir los mismos IDs, versiones y eventos. Los cambios se calculan por campos semánticos, no por diff de JSON formateado.

---

## 11. Elegibilidad explicable

### 11.1 Perfil estructurado

Hechos locales posibles:

- persona/entidad y forma jurídica;
- residencia, domicilio fiscal, establecimiento y ejecución;
- situación y fechas de empleo/autoempleo;
- tamaño de empresa;
- CNAE/IAE y capacidades;
- plantilla, facturación, balance e inversión disponible;
- historial de minimis;
- registros, certificados, activos y solvencia;
- consorcio, socios y capacidad de ejecución;
- circunstancias sensibles solo si el usuario decide aportarlas.

Cada hecho distingue declarado, documentado, verificado, fecha y caducidad.

### 11.2 Lenguaje de reglas

Operadores:

- all, any y not;
- comparación, rango y pertenencia;
- existencia;
- geografía;
- duración/antigüedad;
- fecha absoluta o relativa;
- cálculo financiero.

Tipos:

- hard: excluyente;
- soft: mejora encaje;
- documentary: exige prueba;
- review: requiere interpretación humana/profesional.

Resultados:

- elegible;
- no elegible;
- faltan datos;
- requiere revisión.

Desconocido nunca equivale a cumple. Las reglas duras se ejecutan antes del ranking.

### 11.3 Explicación

Por cada regla:

- texto normalizado;
- resultado;
- hecho local usado;
- documento/página oficial;
- confianza;
- dato faltante o acción;
- versión del motor.

La evaluación queda fijada al perfil y versión de oportunidad usados.

---

## 12. Ranking y decisión económica

### 12.1 Componentes

- certeza de elegibilidad;
- afinidad estratégica;
- importe realmente accesible o margen contractual;
- cofinanciación y tensión de caja;
- esfuerzo y preparación disponible;
- urgencia y confianza del plazo;
- completitud documental;
- riesgo de ejecución, solvencia o consorcio.

### 12.2 Reglas

- fórmula distinta por familia;
- explicación visible y suma reconciliable;
- versión de fórmula;
- bloqueo duro no se compensa con afinidad;
- “faltan datos” no se oculta en un score;
- no se inventa probabilidad de concesión;
- sin datos históricos, usar escenarios y supuestos explícitos;
- el ranking ordena el trabajo, no limita el acceso a resultados.

### 12.3 Semántica monetaria

Separar siempre:

- dotación global;
- máximo por beneficiario;
- gasto mínimo/máximo;
- intensidad;
- ayuda estimada;
- financiación reembolsable;
- valor estimado de contrato;
- coste de ejecución;
- margen;
- solicitado, concedido, facturado y cobrado.

### 12.4 Comparador y escenarios financieros

El comparador admite 2–4 oportunidades de la misma familia. Mantiene columnas de anchura legible y fija las filas decisivas: bloqueos duros, datos ausentes, importe accesible, intensidad o margen, aportación propia, tensión de caja, plazo, esfuerzo, socios, incompatibilidades y completitud de evidencia. Cada celda decisiva abre su cita o supuesto; “por verificar” nunca puntúa como cero ni como valor medio. La síntesis “por qué A lidera a B” solo usa diferencias visibles y reconciliables.

Cada oportunidad puede tener escenarios **Conservador / Base / Ambicioso** con supuestos editables y fechados. Para subvención calculan gasto elegible, intensidad, tope, cofinanciación, IVA recuperable cuando aplique, costes no elegibles, calendario de pagos y pico de caja; para contrato, coste, margen, hitos de facturación y cobro; para préstamo, desembolso, carencia, cuota y escenario adverso. Las salidas principales son apoyo neto o margen, efectivo propio requerido, pico de circulante y tiempo hasta recuperación. No se añade probabilidad de concesión salvo como supuesto subjetivo introducido y etiquetado por el usuario.

---

## 13. Expedientes y generación documental

### 13.1 Creación

“Preparar expediente” crea localmente:

- snapshot de oportunidad y versión;
- evaluación de elegibilidad;
- lista de bloqueos y supuestos;
- plantilla según familia;
- tareas y responsables;
- audit log.

El expediente se abre como estudio de preparación, no como formulario largo:

- rail de etapas: **Calificación → Evidencia → Plan → Presupuesto → Borrador → Revisión → Paquete → Seguimiento**;
- superficie central dedicada al artefacto activo;
- drawer de evidencia con claims citados, hechos del perfil, documentos y tareas disponibles para insertar o relacionar;
- cabecera persistente con versión fijada, plazo, siguiente puerta y alerta de cambio oficial.

Cada etapa muestra listo, faltan datos, bloqueo o requiere revisión y conserva un criterio de salida explícito. Solo son puertas duras un bloqueo de elegibilidad, totales financieros incoherentes, documento obligatorio ausente o cita crítica obsoleta; el resto advierte sin fingir que la candidatura está completa. Un cambio oficial posterior muestra el diff y qué secciones, cálculos o documentos del expediente quedaron afectados antes de permitir exportar de nuevo.

### 13.2 Módulos comunes

- decisión go/no-go;
- matriz de evidencia;
- checklist de requisitos;
- inventario documental con estado y caducidad;
- cronograma;
- memoria;
- presupuesto, financiación y caja;
- declaraciones e incompatibilidades;
- minimis;
- DNSH/sostenibilidad/publicidad cuando aplique;
- control final;
- obligaciones posconcesión y justificación.

### 13.3 Módulos por familia

- subvención: gastos, intensidad, cofinanciación y criterios;
- contratación: lotes, solvencia, sobres administrativo/técnico/económico, coste y margen;
- UE: PIC, socios, work packages, impactos e hitos;
- préstamo/garantía: repago, garantías, liquidez y escenario adverso;
- premio/aceleradora: criterios, propiedad intelectual, dedicación y contraprestaciones.

### 13.4 Exportaciones

Generación local y bajo orden:

- Markdown/HTML;
- DOCX;
- PDF de lectura;
- CSV/XLSX de presupuesto;
- ICS de plazos;
- ZIP de expediente.

El manifiesto del paquete incluye:

- oportunidad/version;
- hashes;
- plantillas y generadores;
- fuentes;
- campos sin verificar;
- conflictos y bloqueos;
- fecha de generación.

Cada frase se etiqueta como oficial extraída, dato del usuario, cálculo, supuesto o borrador. La exportación no es presentación. El usuario revisa, firma y envía manualmente.

La revisión final ofrece dos lecturas: **problemas**, ordenados por severidad y vinculados al punto editable, y **previsualización del paquete**, que muestra exactamente qué se exportará. Texto generado sin fuente o supuesto declarado no puede perder su etiqueta al pasar a la versión final.

---

## 14. Alertas y analítica

### 14.1 Eventos

- nueva oportunidad;
- nueva versión;
- ampliación o reducción de plazo;
- cambio de beneficiario, cuantía o documentos;
- suspensión/cancelación;
- plazo próximo;
- fuente obsoleta;
- dato privado/documento próximo a caducar.

Cada evento es idempotente. Se agrupan cambios de la misma versión y solo se reavisa por escalado o nueva evidencia.

### 14.2 Canales gratuitos

- bandeja “Desde tu última visita”;
- centro local de avisos;
- notificación del navegador cuando la aplicación está activa y tiene permiso;
- exportación ICS;
- digest genérico de novedades públicas desde GitHub Actions;
- script compañero local para correo personalizado.

La aplicación estática no puede leer el perfil cuando el navegador está cerrado. Los avisos remotos personalizados son opcionales.

### 14.3 Analítica local

- detectada → revisada → guardada → decisión → preparando → presentada → concedida/denegada → cobrada;
- tiempo hasta revisión y presentación;
- fuente y familia con mayor conversión;
- falsos positivos y duplicados;
- plazos perdidos;
- preparación invertida;
- solicitado, concedido, contratado, facturado y cobrado;
- cofinanciación, margen y retorno observado.

Sin telemetría de terceros por defecto. La analítica operativa pública de fuentes está separada de la analítica privada de expedientes.

---

## 15. Privacidad y seguridad

### 15.1 Almacenamiento

- IndexedDB para workspace versionado;
- OPFS/IndexedDB blobs para documentos locales;
- localStorage solo para preferencias no sensibles;
- migraciones explícitas;
- panel de uso, cuota y limpieza;
- exportación/restauración cifrada;
- AES-GCM con clave derivada de frase; la frase no se guarda;
- aviso claro: local no significa cifrado en reposo sin medidas del dispositivo.

### 15.2 Prohibiciones

- certificados, claves, contraseñas, NIF, finanzas o expedientes en Git;
- secretos en bundle o logs;
- API keys en el cliente público;
- subida automática;
- acceso a áreas autenticadas;
- envío a IA sin selección y consentimiento.

### 15.3 Contenido no confiable

Incluso una fuente oficial se procesa como entrada no confiable:

- allowlist de hosts y validación de URLs;
- bloqueo de javascript, data, file, loopback y redes privadas;
- límites de redirect, tamaño, páginas y descompresión;
- validación MIME por magic bytes;
- saneado de HTML;
- protección frente a fórmulas CSV;
- protección ZIP slip/path traversal;
- parser/OCR efímero y con privilegios mínimos.

### 15.4 Cadena de suministro

- lockfiles;
- dependencias mínimas;
- Dependabot/Renovate y auditoría;
- GitHub Actions fijadas por SHA;
- permisos por job;
- secretos no disponibles a PR no confiables;
- CSP compatible con publicación estática;
- sin scripts remotos, anuncios o analytics por defecto.

### 15.5 IA opcional

- desactivada por defecto;
- consentimiento por documento;
- redacción de datos;
- respuesta estructurada;
- citas obligatorias;
- validación determinista posterior;
- baja confianza a revisión;
- ninguna salida de IA se convierte silenciosamente en hecho oficial;
- ruta segura mediante compañero local/BYOK o proxy autenticado; nunca clave en el bundle.

---

## 16. Caché y operación offline

- assets inmutables: cache-first;
- manifiesto: network-first con timeout;
- índices: stale-while-revalidate;
- detalles guardados y versiones fijadas: disponibles offline;
- instalación transaccional tras esquema y hash;
- conservar snapshot actual y anterior;
- banner explícito de offline/obsoleto;
- frescura por fuente;
- aviso de cuota/evicción;
- módulos de generación lazy-loaded;
- fallback sin service worker u OPFS;
- no cachear indefinidamente PDFs oficiales arbitrarios;
- exportar/importar para continuidad.

Presupuesto objetivo:

- índice inicial público inferior a 500 KB sin comprimir;
- JavaScript inicial inferior a 250 KB gzip, excluyendo exportadores lazy;
- ningún shard de detalle superior a 1 MB salvo excepción documentada;
- PWA usable a 320 px y 200 % de zoom.

---

## 17. Observabilidad y operación

### 17.1 health.json

- runId, pipelineVersion y schemaVersion;
- inicio, fin y duración;
- última tentativa y éxito por fuente;
- descubiertas, creadas, actualizadas, cerradas;
- documentos, bytes y páginas OCR;
- errores HTTP/parser/esquema;
- cobertura por campo crítico;
- duplicados, fusiones y conflictos;
- anomalía contra media móvil;
- versión del último dataset bueno.

### 17.2 Comportamiento ante fallos

- fallo de fuente: conservar datos previos y marcar obsolescencia;
- caída brusca de volumen: bloquear publicación;
- esquema inválido/hash incorrecto: bloquear;
- OCR fallido: publicar metadatos con estado pendiente;
- catálogo vacío inesperado: bloquear;
- despliegue fallido: conservar versión anterior;
- reintento manual visible.

### 17.3 Workflows

Separar:

1. colección/validación;
2. publicación de datos;
3. build;
4. despliegue;
5. digest.

Evitar que el commit automático de datos dispare una segunda colección equivalente. Aplicar permisos mínimos por job, concurrency y publicación atómica.

GitHub Pages no ofrece servidor ni debe alojar operaciones sensibles. Límites oficiales: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) y [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

Consecuencias:

- no PDFs masivos ni históricos raw ilimitados en Git;
- catálogo fragmentado y archivo compacto;
- cron no se considera puntual ni infalible;
- refresh local y estado obsoleto siempre disponibles;
- no construir un flujo transaccional o SaaS sobre Pages.

### 17.4 Objetivos operativos

- al menos 95 % de días con dataset global menor de 36 h en ventana móvil de 30 días;
- ninguna fuente puede quedar a cero sin alerta;
- dos fallos consecutivos o caída superior al 70 % generan alerta operativa;
- 100 % de datasets publicados validan esquema y hashes;
- rollback a última versión buena probado.

---

## 18. Estrategia de pruebas

### 18.1 Pipeline

- unitarias de fechas, moneda, porcentajes, IDs y normalización;
- fixtures grabados de cada fuente;
- golden output;
- replay de 30 días;
- propiedades de idempotencia, estabilidad de hash y simetría de dedup;
- fechas relativas, festivos, hora peninsular y DST;
- errores de red, rate limit, schema drift y HTML inesperado.

### 18.2 PDF/OCR

- PDF digital español;
- BOPA/BOE escaneado;
- documento UE multilingüe;
- tablas, rotación y páginas mixtas;
- corrupto, enorme y bomb;
- precisión por campo y no solo texto global.

### 18.3 Aplicación

- Vitest/React Testing Library para reglas, ranking, stores y migraciones;
- Playwright para ruta base Pages, offline, stale/partial, import/export y archivos;
- red interceptada para demostrar que datos privados no salen;
- navegadores Chromium, Firefox y WebKit;
- teclado, lector de pantalla, 200 %, 320 px y reduced motion;
- axe sin fallos serious/critical.

### 18.4 Seguridad

- HTML hostil;
- enlace inseguro;
- fórmula CSV;
- ZIP slip;
- PDF/archivo malformado;
- import JSON manipulado;
- fuga de secretos/PII;
- service worker sirviendo datos privados.

---

## 19. Roadmap y dependencias

### Fase 0 — Contratos y CI

Entrega:

- JSON Schema canónico;
- tipos Python/TypeScript;
- interfaz de conector;
- fixtures y test runners;
- workflows separados;
- baseline de calidad.

Depende de: nada.

Criterios:

- migración de los 87 registros actuales sin pérdida de sourceRef/URL;
- validación idéntica en Python y TypeScript;
- output vacío/inválido no se publica;
- build, typecheck y pruebas base en CI.

### Fase 1 — Colector fiable y datos canónicos

Entrega:

- módulos BDNS/BOE/BOPA/Funding & Tenders;
- manifiesto, health y shards;
- última copia buena;
- IDs y versiones deterministas.

Depende de: Fase 0.

Criterios:

- dos replays producen mismos IDs/versiones;
- fallo parcial conserva datos;
- salud por fuente visible;
- cada registro tiene autoridad, familia, estado y procedencia.

### Fase 2 — Contratación y fuentes complementarias

Entrega:

- PLACSP/TED;
- SEKUENS, Red.es, CDTI y Asturias/local;
- cobertura UE compartida/directa;
- entity resolution.

Depende de: Fase 1.

Criterios:

- backfill revisado de 30 días;
- campos clave estructurados ≥95 % exactos en corpus etiquetado de feeds;
- contratación separada;
- precisión de fusiones automáticas ≥99 % sobre al menos 200 pares revisados;
- ambiguos no se fusionan.

### Fase 3 — Evidence Lab, documentos y cambios

Entrega:

- grafo documental;
- visor;
- PDF/OCR;
- claims;
- correcciones/ampliaciones;
- diff y eventos.

Depende de: Fases 1–2.

Criterios:

- 100 % de campos críticos verificados con puntero de evidencia;
- fechas e importes ≥95 % de precisión en corpus revisado;
- fixture de corrección crea versión/evento esperado;
- run repetido no duplica versiones;
- conflictos visibles.

### Fase 4 — Elegibilidad y ranking

Entrega:

- perfil tipado;
- reglas;
- evaluación cuatro estados;
- ranking por familia;
- explicación.

Depende de: Fase 3.

Criterios:

- 100 % de golden cases;
- unknown nunca pasa;
- bloqueos antes de score;
- componentes suman el score mostrado;
- versiones fijadas.

### Fase 5 — Workspace y expedientes

Entrega:

- IndexedDB/OPFS;
- migraciones;
- bóveda;
- backup cifrado;
- módulos de expediente;
- exportadores.

Depende de: Fase 0 y contrato estable de Fase 4.

Criterios:

- test de red confirma cero salida privada;
- backup round-trip íntegro;
- reload/migración conserva expediente;
- ZIP contiene manifiesto, fuentes y advertencias;
- ninguna ruta firma ni presenta.

### Fase 6 — Alertas, analítica, offline y hardening

Entrega:

- feed de eventos;
- alertas idempotentes;
- ICS/digest;
- analítica local;
- PWA y accesibilidad completa.

Depende de: Fases 3–5.

Criterios:

- evento idéntico se notifica una vez;
- cambio de plazo escala;
- expediente abre offline;
- actualización corrupta conserva copia buena;
- gates de accesibilidad, rendimiento, seguridad y rollback.

### Fase 7 — Piloto opcional backend/IA

Entrega:

- sync cifrado;
- alertas personalizadas;
- OCR pesado;
- IA con citas;
- colaboración opcional.

Depende de: V2 estática estable.

Criterios:

- opt-in y borrado/exportación verificados;
- suite completa verde con IA apagada;
- ningún hecho IA se promueve sin evidencia;
- revisión de privacidad, amenazas, coste y retención.

---

## 20. Release gates

### Gate A — Integridad

- esquemas y hashes válidos;
- IDs únicos;
- migraciones probadas;
- cero secretos o datos personales en build, logs y artefactos.

### Gate B — Evidencia

- todo campo crítico “verificado” tiene cita;
- conflictos visibles;
- fuente caída o stale visible;
- no se presenta metadata oficial como elegibilidad confirmada.

### Gate C — Decisión

- reglas golden al 100 %;
- unknown no pasa;
- score explicado;
- importes usan semántica correcta;
- familias separadas.

### Gate D — Expediente

- versión fijada;
- export reproducible;
- checklist y advertencias;
- firma/presentación manual explícita;
- private network test sin salida.

### Gate E — Experiencia

- flujo diario completado solo con teclado;
- lector de pantalla y foco correcto;
- sin errores axe serious/critical;
- 200 %, 320 px y offline;
- estados escritos, no solo color;
- dossier completo y fuente siempre accesibles.

### Gate F — Operación

- fallo parcial y rollback ensayados;
- health por fuente;
- alertas de volumen/frescura;
- budgets Pages/Actions;
- manual run documentado.

Ninguna fase se considera terminada por “verse completa”. Debe cruzar sus gates con fixtures, corpus revisado y evidencia de ejecución.

---

## 21. Decisiones finales

- La unidad del producto es la oportunidad viva, no el anuncio.
- La unidad de confianza es el claim con evidencia, no el registro completo.
- La unidad de cambio es una versión semántica, no un timestamp.
- La unidad de trabajo privado es el expediente fijado a una versión.
- Elegibilidad filtra antes de ranking.
- El importe mostrado por defecto es el accesible o estimado con supuestos, no la dotación global.
- PLACSP/TED forman un carril comercial separado.
- El Evidence Lab es una superficie principal de la V2.
- GitHub Pages aloja catálogo y aplicación pública; no identidad, secretos ni trámites.
- La V2 gratuita sigue siendo completa sin backend ni IA.
- La automatización termina en un paquete preparado. La persona usuaria revisa, firma y presenta.
