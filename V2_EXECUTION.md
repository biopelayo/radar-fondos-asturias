# Radar Fondos Asturias — V2 Execution Board

Estado de referencia: 2026-09-07  
Documento rector: [V2_MASTER_PLAN.md](./V2_MASTER_PLAN.md)

## 0. Cómo usar este tablero

Este documento convierte el master plan en una secuencia de entrega verificable. La unidad de avance no es una capa técnica terminada, sino un recorrido vertical que acerque una publicación oficial a una decisión o expediente capaz de producir dinero real.

Estados:

- ✅ **HECHO HOY**: existe en el repositorio o en el circuito local, se ha inspeccionado y tiene evidencia de ejecución.
- 🟡 **EN CURSO AHORA**: hay artefactos iniciales, pero aún no cruza sus criterios ni forma parte del flujo principal.
- ⬜ **PENDIENTE**: no existe o solo está descrito en el master plan.
- ⛔ **FUERA DE ALCANCE**: no se implementará como automatización del producto.

Lanes responsables:

- **DATOS**: conectores, contratos, documentos, extracción, resolución, reglas y publicación.
- **UI**: experiencia, workspace local, accesibilidad, dossier, exportaciones y analítica local.
- **OPERACIÓN**: CI/CD, programación, alertas, seguridad, observabilidad y release.

Cada ítem tiene una única lane accountable aunque necesite colaboración. Los criterios son binarios y deben quedar respaldados por tests, fixtures, capturas o artefactos de ejecución.

---

## 1. Resultado y límites de ejecución

### Resultado V2

Una persona debe poder pasar de “ha aparecido una convocatoria” a:

1. entender qué ofrece y cuánto podría obtener realmente;
2. comprobar requisitos contra hechos privados locales;
3. abrir la norma, página y fragmento que justifican cada dato crítico;
4. resolver faltantes y decidir go/no-go;
5. preparar y exportar un expediente reproducible;
6. revisar, firmar y presentar manualmente;
7. registrar concesión, contrato, factura y cobro.

### Límites

- Nada firma ni presenta automáticamente.
- No se almacenan certificados ni claves.
- Ningún dato privado entra en Git, Pages, logs o artefactos públicos.
- La versión estática/gratuita es el producto base completo.
- Backend, sincronización, avisos remotos personalizados e IA son opt-in posteriores.
- Un score nunca sustituye la lectura de requisitos ni la evidencia.

---

## 2. Baseline verificado hoy

### 2.1 Producto y UI

- ✅ React 18 + TypeScript + Vite con build estático para GitHub Pages.
- ✅ Mesa de decisión con ledger, ficha, requisitos genéricos, fuentes, bloqueos y acción “Preparar candidatura”.
- ✅ Vistas de radar, expedientes básicos, plazos, fuentes, perfil y ajustes.
- ✅ Lenguaje que advierte que la elegibilidad no está garantizada y que firma/presentación son manuales.
- ✅ Diseño Gazette Lab / Dossier Workbench documentado, responsive y con semántica/foco básicos.
- ✅ Perfil, guardadas y registros mínimos de expediente permanecen en localStorage.
- ✅ Importación/exportación JSON del perfil, actualmente sin cifrar.
- 🟡 EvidenceWorkspace V2 y sus tipos de presentación están creados como componente aislado; no están integrados en App ni conectados a documentos reales.

### 2.2 Datos

- ✅ Colectores activos para BDNS, BOE, BOPA y EU Funding & Tenders.
- ✅ Snapshot observado hoy: 91 señales, sin error de fuente en esa ejecución.
- ✅ sourceStatus por las cuatro fuentes con count, collectedCount, checkedAt y lastSuccessAt.
- ✅ Si una fuente falla, se conservan sus registros previos y la actualización queda marcada como parcial.
- ✅ Si todas fallan, no se sobrescriben los datasets.
- ✅ Escritura coordinada y rollback de public/data/opportunities.json y src/data/opportunities.generated.json.
- ✅ Validación V1 de campos obligatorios, HTTPS, fechas, score, amount, fuente e IDs duplicados.
- 🟡 Contratos TypeScript V2 para Opportunity, SourceRecord, Document, Claim, OpportunityVersion, ChangeEvent y SourceHealth, con validadores iniciales. Compilan, pero aún no son el contrato compartido Python/JSON Schema ni alimentan el catálogo.
- ⬜ El modelo publicado sigue siendo plano y source-centric.
- ⬜ Los 91 registros siguen usando requisitos genéricos, no reglas extraídas.
- ⬜ No hay grafo documental, versiones semánticas ni deduplicación cross-source.

### 2.3 Operación

- ✅ Scripts locales para recolectar, validar, compilar, publicar y notificar.
- ✅ Programación local documentada a las 09:00 y 17:00, con logs fuera de Git.
- ✅ Configuración local de Gmail protegida por el usuario de Windows y soporte de varios destinatarios.
- ✅ El envío oculta destinatarios entre sí y convierte rechazos parciales en error.
- ✅ Workflow de GitHub Actions preparado con colección, test, build, publicación y digest.
- ⚠️ El workflow existe en el repositorio, pero su activación remota no está confirmada; no debe marcarse como operativo hasta comprobar una ejecución en GitHub.
- ✅ Once pruebas unitarias Python pasan.
- ✅ Typecheck y build de producción pasan hoy.
- ⬜ No hay Vitest, Playwright, axe, corpus PDF/OCR ni gates de datos V2.

### 2.4 Deuda que no debe maquillarse

- El score es heurístico por palabras clave y recibe otro boost por texto libre del perfil.
- “verified” identifica una referencia oficial, no procedencia por campo.
- amount mezcla una cifra única con instrumentos económicamente distintos.
- deadline soporta una sola fecha y un booleano.
- Opportunity.state mezcla estado público y flujo privado.
- Fuentes en la UI son una tabla estática, no health real.
- localStorage no es una bóveda, no tiene migraciones y no ofrece cifrado en reposo.
- “Preparar candidatura” solo crea un ApplicationRecord mínimo.
- El digest no mantiene un journal idempotente de eventos.
- No existe modo offline PWA ni última copia buena en IndexedDB.

---

## 3. Matriz V1 → V2

| ID | Estado | V1 actual verificable | Gap / V2 objetivo | Entregable | Depende de | Owner | Criterio verificable |
|---|---|---|---|---|---|---|---|
| G01 | 🟡 | Interfaces V2 y validadores TS iniciales, aislados | Un contrato compartido y ejecutable en Python y TS | JSON Schema 2.0, tipos generados, validadores, vocabularios y ADR de IDs | — | DATOS | Fixtures válidos/erróneos producen el mismo resultado en Python y TS |
| G02 | ⬜ | IDs source + reference | IDs estables para oportunidad, registro, documento, claim, versión y evento | Librería de canonicalización y hashing | G01 | DATOS | Dos replays idénticos generan IDs y hashes idénticos |
| G03 | ⬜ | Un registro plano por publicación | Oportunidad viva separada de sus apariciones | Opportunity + SourceRecord + relaciones | G01–G02 | DATOS | Una BDNS enlazada con BOE/BOPA produce una oportunidad y varias apariciones |
| G04 | ⬜ | Un campo verified por evidencia | Procedencia por campo | Claim<T> + EvidencePointer | G01, G08 | DATOS | Todo campo crítico confirmado resuelve a documento/revisión/página/fragmento |
| G05 | ⬜ | El registro se sobrescribe por fuente | Versiones inmutables y diff semántico | OpportunityVersion + ChangeEvent | G02–G04 | DATOS | Una ampliación crea nueva versión y evento urgente sin alterar la anterior |
| G06 | ✅ parcial | Cuatro colectores en un script | Adaptadores con contrato, cursor, versión y health | Paquete adapters + registry | G01 | DATOS | Cada fuente ejecuta discover/hydrate/normalize/health con fixture propio |
| G07 | ✅ parcial | Reintentos y conservación por fuente | Ingesta incremental, ETag/cursor y reconciliación | Estado incremental por conector | G06 | DATOS | Repetir ventana no duplica; not_modified evita trabajo; reconciliación detecta cierres |
| G08 | ⬜ | BOE/BOPA a nivel sumario; BDNS/F&T metadata | Descubrimiento de documentos oficiales | DocumentCandidate + clasificador de rol | G06 | DATOS | Convocatoria fixture descubre bases, convocatoria, anexos y tramitación |
| G09 | ⬜ | No descarga/parsea PDFs | Texto, tablas y OCR selectivo | Pipeline PDF/OCR limitado y auditable | G08 | DATOS | Corpus digital/scan produce texto por página, hash, método y calidad |
| G10 | ⬜ | Requisitos genéricos | Beneficiario, plazo, dinero, costes y presentación extraídos | Extractores deterministas + review queue | G04, G09 | DATOS | Métricas de corpus alcanzan gates y baja confianza queda “Por verificar” |
| G11 | ⬜ | Dedup solo por ID de fuente | Resolución cross-source de alta precisión | Resolver + possibleSameAs | G02–G04 | DATOS | ≥99 % precisión en al menos 200 pares revisados; ambiguos no se fusionan |
| G12 | ⬜ | Sin PLACSP/TED | Carril de contratación español/europeo | Adaptadores PLACSP/TED, CPV/NUTS, lotes y pliegos | G06, G08 | DATOS | Licitación end-to-end con valor, plazo, solvencia, pliegos y fuente |
| G13 | ⬜ | Sin SEKUENS/Red.es/CDTI/local | Enriquecimiento oficial y cobertura regional/local | Adaptadores Nivel B con política de autoridad | G03, G06 | DATOS | Una página complementaria enriquece sin crear duplicado |
| G14 | ✅ parcial | Funding & Tenders por términos fijos | Cobertura UE por facets, programas y gestión compartida | F&T ampliado + fuentes UE Nivel C | G06 | DATOS | Fixture multilingual y programa compartido normalizan al mismo contrato |
| G15 | ✅ parcial | sourceStatus en dataset; UI global fresh/partial/stale | Health V2 por fuente y calidad | health.json, UI Fuentes dinámica y alarmas | G01, G06 | OPERACIÓN | Cero inesperado/fallo/obsolescencia aparecen por fuente y disparan gate |
| G16 | ✅ parcial | Perfil de texto libre en localStorage | Facts tipados con origen, verificación y caducidad | ProfileFact store + formulario progresivo | G01 | UI | Facts migran, se editan y nunca aparecen en tráfico o build |
| G17 | ⬜ | Requisitos preasignados por el colector | Motor de reglas four-state | AST de reglas + evaluador | G04, G10, G16 | DATOS | Golden rules al 100 %; unknown nunca pasa |
| G18 | ✅ parcial | Keyword score único | Ranking post-elegibilidad por familia | Score breakdown versionado | G10, G17 | DATOS | Bloqueo no se compensa; componentes reconcilian cifra; familias difieren |
| G19 | ⬜ | amount único y capital global sumado | Semántica económica y escenarios | FinancialStructure + calculadoras | G01, G10 | DATOS | UI distingue dotación, máximo, ayuda estimada, coste, margen y cobro |
| G20 | ✅ parcial | Ficha con enlaces y requisitos | Dossier conectado a claims, documentos y versiones | DossierOpportunity V2 | G03–G05, G10 | UI | Desde un dato crítico se abre su evidencia exacta |
| G21 | 🟡 | EvidenceWorkspace aislado | Evidence Lab integrado y persistente | Ruta/screen, adaptador real, revisión local | G04, G09, G20 | UI | claim→documento→página funciona; conflictos/fallback/a11y pasan E2E |
| G22 | ⬜ | No hay comparación real | Comparador 2–4 oportunidades homogéneas | Tabla/escenarios con scroll honesto | G18–G20 | UI | Comparación mantiene semántica y no mezcla familias incompatibles |
| G23 | ✅ parcial | ApplicationRecord mínimo | Expediente versionado con tareas, evidencia y audit log | ApplicationDossier + workspace | G16–G20 | UI | Expediente fija oportunidad/reglas/perfil y sobrevive a reload |
| G24 | ⬜ | Sin memoria/presupuesto/checklist real | Estudio de preparación por familia | Módulos dossier + templates | G19, G23 | UI | Grant y procurement generan módulos apropiados y bloqueos visibles |
| G25 | ✅ parcial | Export JSON del perfil sin cifrar | Exportaciones de candidatura y backup seguro | DOCX/PDF/CSV/ICS/ZIP + backup AES-GCM | G23–G24 | UI | Round-trip íntegro; manifest con hashes, versiones, fuentes y advertencias |
| G26 | ✅ parcial | Guardadas localStorage y digest por snapshot | Journal de eventos y alertas idempotentes | Change feed + seen/snooze/escalation + ICS/digest | G05, G15 | OPERACIÓN | Evento idéntico se notifica una vez; cambio de plazo escala |
| G27 | ⬜ | Sin analítica de resultado | Funnel y dinero real local | LocalEvent + Outcome + panel | G23 | UI | Distingue detectado/solicitado/concedido/facturado/cobrado |
| G28 | ⬜ | Fetch no-store y fallback bundled | PWA con snapshot transaccional y offline | Manifest/checksums, IndexedDB cache, service worker | G01, G15 | UI | Offline abre guardadas/expedientes; actualización corrupta conserva anterior |
| G29 | ✅ parcial | Validación propia V1 y 17 tests Python, incluidos 6 contratos V2 | Pirámide de pruebas V2 | Fixtures, property tests, Vitest, Playwright, axe, PDF corpus | Todos por incremento | OPERACIÓN | npm test + suite E2E/datos pasan con informes archivados |
| G30 | ✅ parcial | Secretos fuera de web, HTTPS y rollback | Threat model y hardening completo | Allowlist, límites, sanitización, CSP, supply chain | G01, G08, G25, G28 | OPERACIÓN | Security fixtures, secret/PII scan y acciones fijadas por SHA pasan |
| G31 | ✅ parcial | Workflow único preparado y circuito local operativo | Workflows separados y publicación atómica sin doble run | collect/publish/build/deploy/digest | G01, G15 | OPERACIÓN | Fallo parcial/rollback ensayados; ejecución remota confirmada |
| G32 | ⬜ | Sin backend ni IA | Extensiones opt-in desacopladas | Interfaces de sync/OCR/AI tras feature flags | V2 estática estable | OPERACIÓN | Suite completa pasa con flags off; cero hecho IA sin cita |
| G33 | ✅ | Copy actual insiste en control humano | Mantener cierre manual de la cadena | Gate y copy permanente | Todos | UI | No existe código de firma/presentación; exportación termina en instrucciones de revisión |

---

## 4. Orden de ejecución: ocho hitos verticales

Los hitos son secuenciales en su gate, no necesariamente en su desarrollo. DATOS, UI y OPERACIÓN pueden trabajar en paralelo dentro del hito siempre que no inventen contratos locales incompatibles.

### H1 — Una oportunidad V2 confiable en la UI

**Estado:** 🟡 EN CURSO AHORA  
**Valor:** demostrar el spine completo sin cambiar todavía todas las fuentes.

Incluye:

- cerrar G01–G03 y G15 mínimo;
- convertir una oportunidad V1 mediante un migrador/adapter;
- publicarla con manifest/health V2;
- renderizarla en una ficha compatible;
- mostrar procedencia de SourceRecord y calidad sin afirmar claims inexistentes;
- conectar los tipos V2 ya iniciados, eliminando duplicados entre dominio y tipos temporales de UI.

Dependencias: ninguna.

Release slice:

- una señal actual llega a Opportunity V2;
- schema y hash se validan antes de mostrarse;
- V1 sigue disponible detrás de adapter durante la migración;
- UI muestra “Por verificar” para campos sin claim;
- tests de contrato Python/TS y build verdes.

No entra:

- OCR, elegibilidad completa o exportación.

### H2 — Una ayuda asturiana realmente accionable

**Estado:** ⬜ SIGUIENTE  
**Valor:** pasar de metadatos a evidencia suficiente para decidir si merece tiempo.

Incluye:

- G04–G05 y G08–G10;
- flujo BDNS + BOE/BOPA + sede/procedimiento para un caso real;
- documentos, revisiones, roles y relaciones;
- extracción de plazo, beneficiario, importe/intensidad, costes y ruta;
- Evidence Lab integrado en modo lectura;
- evento de corrección/ampliación.

Dependencias: H1.

Release slice:

- cada campo crítico confirmado abre página y fragmento;
- conflictos se muestran;
- la revisión anterior permanece;
- un PDF no procesable no rompe la oportunidad;
- el usuario obtiene siguiente paso y fuente oficial.

### H3 — Contratación y cobertura que amplía dinero real

**Estado:** ⬜ PENDIENTE  
**Valor:** incorporar ingresos por contrato y fuentes de alto valor sin confundirlos con ayudas.

Incluye:

- G11–G14;
- PLACSP y TED;
- CPV/NUTS, lotes, valor, plazos, solvencia y pliegos;
- SEKUENS, Red.es, CDTI y fuentes asturianas/locales como enriquecimiento;
- F&T ampliado y programas UE compartidos;
- dedup y relaciones cross-source.

Dependencias: H1; utiliza Evidence pipeline de H2.

Release slice:

- una licitación completa aparece en carril procurement;
- no se suma a “ayuda potencial”;
- fórmula económica distingue valor, coste y margen;
- una publicación TED/PLACSP duplicada se une con precisión;
- una fuente complementaria enriquece sin duplicar.

### H4 — Decisión privada de elegibilidad y prioridad

**Estado:** ⬜ PENDIENTE  
**Valor:** responder “¿puedo, me compensa y qué falta?”.

Incluye:

- G16–G19;
- ProfileFact tipado y migración desde V1;
- reglas hard/soft/documentary/review;
- cuatro estados;
- ranking por familia;
- comparador y escenarios financieros.

Dependencias: H2; usa familias de H3 cuando estén disponibles.

Release slice:

- unknown nunca es elegible;
- cada regla muestra dato privado y cita pública;
- un bloqueo se antepone al score;
- cantidad accesible y cofinanciación son comprensibles;
- evaluación se fija con versiones de perfil, regla y oportunidad;
- ningún ProfileFact sale del dispositivo en pruebas de red.

### H5 — Evidence Lab de revisión y cambio

**Estado:** 🟡 UI INICIADA; INTEGRACIÓN PENDIENTE  
**Valor:** convertir la confianza y el cambio en operaciones revisables, no etiquetas.

Incluye:

- G20–G22;
- integrar EvidenceWorkspace con datos V2;
- navegación claim→fuente, búsqueda, zoom, fallback y revisión;
- anotaciones locales ancladas a revisión;
- diff entre versiones;
- Triage ↔ Evidence;
- comparador de oportunidades y escenarios.

Dependencias: H2 y H4.

Release slice:

- seleccionar claim enfoca documento/página;
- revisión local no se confunde con oficial;
- un claim stale no se confirma sin reanclar;
- teclado, foco, lector, 200 %, 320 px y reduced motion pasan;
- el visor degradado mantiene cita y enlace oficial;
- el dossier completo conserva título, referencia y siguiente acción.

### H6 — Del go/no-go al paquete de candidatura

**Estado:** ⬜ PENDIENTE  
**Valor:** reducir trabajo real de preparación sin automatizar la presentación.

Incluye:

- G23–G25;
- IndexedDB/OPFS y migraciones;
- ApplicationDossier;
- estudio de preparación;
- checklist, tareas, cronograma, memoria, presupuesto y QA;
- templates por familia;
- DOCX/PDF/CSV/ICS/ZIP;
- backup cifrado.

Dependencias: H4–H5.

Release slice:

- expediente fija snapshots y sobrevive reload;
- cambio oficial posterior genera aviso, no reescritura;
- paquete reproduce fuentes, versiones y advertencias;
- backup cifrado restaura exactamente;
- “Exportar para revisión” es el final automático;
- firma y presentación siguen fuera.

### H7 — Bucle diario resiliente

**Estado:** ⬜ PENDIENTE  
**Valor:** no perder oportunidades ni plazos aunque fallen red o fuentes.

Incluye:

- G26–G28 y G15 completo;
- Today/Triage;
- journal idempotente;
- alertas, snooze, escalation e ICS;
- analítica local;
- PWA y última copia buena;
- sources/health real.

Dependencias: H5–H6.

Release slice:

- “desde tu última visita” es determinista;
- una alerta no se duplica;
- cambio urgente escala;
- guardadas y expedientes abren offline;
- catálogo corrupto no reemplaza snapshot;
- analítica distingue dinero publicado, solicitado, concedido y cobrado.

### H8 — Release V2 y extensiones seguras

**Estado:** ⬜ PENDIENTE  
**Valor:** convertir el conjunto en una operación sostenible y desplegable.

Incluye:

- G29–G33;
- pruebas completas;
- seguridad y supply chain;
- workflows separados;
- performance budgets;
- accesibilidad y onboarding;
- rollback;
- documentación operativa;
- seams opcionales para backend/IA con flags off.

Dependencias: H1–H7.

Release slice:

- todos los release gates del master y checklist inferior pasan;
- ejecución GitHub remota confirmada o circuito local declarado como único scheduler;
- rollback y recuperación ensayados;
- datos/secretos scan limpio;
- suite completa verde con backend/IA desactivados;
- publicación V2 no contiene ruta de firma o envío.

---

## 5. Dependencias críticas

    G01 contrato compartido
      ├── G02 identidad
      │     ├── G03 oportunidad viva
      │     ├── G05 versiones/cambios
      │     └── G11 resolución/dedup
      ├── G06 adaptadores
      │     ├── G08 documentos
      │     │     ├── G09 PDF/OCR
      │     │     └── G10 claims
      │     ├── G12 PLACSP/TED
      │     └── G13/G14 cobertura
      └── G15 health

    G10 claims + G16 profile
      └── G17 elegibilidad
            ├── G18 ranking
            ├── G19 economía
            └── G20 dossier
                  ├── G21 Evidence Lab
                  ├── G22 comparador
                  └── G23 expediente
                        ├── G24 preparación
                        ├── G25 export
                        ├── G26 alertas
                        ├── G27 analítica
                        └── G28 offline

    G29–G31 acompañan todos los hitos y cierran H8.

Reglas:

- No extraer reglas antes de fijar Claim y EvidencePointer.
- No integrar Evidence Lab con mocks permanentes; su adapter debe desaparecer al conectar H2.
- No migrar datos privados a IndexedDB sin schemaVersion, tests y rollback.
- No enviar alerta personalizada remota desde datos públicos.
- No activar IA antes de completar el camino determinista.

---

## 6. Política de ownership y Definition of Done

### DATOS

Done significa:

- contrato versionado;
- fixtures positivos, negativos y de cambio;
- salida determinista;
- procedencia;
- métricas de precisión;
- degradación explícita;
- documentación de fuente y parserVersion.

No es done:

- “funciona con la página de hoy”;
- regex sin fixture;
- campo crítico sin claim;
- dedup no revisado;
- scraper que convierte error en cero resultados.

### UI

Done significa:

- conectado a contrato real;
- estados loading/empty/error/stale/offline;
- interacción teclado y foco;
- responsive;
- datos privados locales;
- copy sin promesas;
- test de flujo;
- acción reversible o exportable.

No es done:

- mock aislado;
- color como única señal;
- cifra sin semántica;
- botón “Preparar” sin workspace;
- pantalla sin ruta de fallo.

### OPERACIÓN

Done significa:

- CI y evidencia de ejecución;
- permisos mínimos;
- rollback;
- health/alerta;
- budgets;
- runbook;
- secret/PII scan;
- fallo ensayado.

No es done:

- workflow solo presente pero nunca ejecutado;
- secreto opcional que falla silenciosamente;
- logs sin retención;
- despliegue que depende de un estado local no documentado.

---

## 7. Checklist de release V2 estática

### Valor y control humano

- [ ] Una ayuda asturiana recorre detección → evidencia → elegibilidad → expediente → exportación.
- [ ] Una licitación recorre el mismo flujo con economía y requisitos propios.
- [ ] Se muestra importe accesible, no solo presupuesto global.
- [ ] Cada bloqueo tiene consecuencia y siguiente acción.
- [ ] La automatización termina en paquete para revisión.
- [ ] No existe firma, certificado o presentación automática.

### Datos y procedencia

- [ ] JSON Schema 2.0 es fuente de verdad.
- [ ] Python y TypeScript validan los mismos fixtures.
- [ ] IDs/versiones son deterministas.
- [ ] Todo campo crítico confirmado tiene evidencia.
- [ ] Corrección/ampliación crea versión y evento.
- [ ] Conflictos y baja confianza permanecen visibles.
- [ ] Dedup automático alcanza ≥99 % precisión en corpus etiquetado.
- [ ] Ningún zero-result sustituye datos previos sin gate.

### Fuentes

- [ ] BDNS, BOE, BOPA y F&T funcionan con adapters V2.
- [ ] PLACSP y TED funcionan como procurement.
- [ ] Al menos una fuente SEKUENS/Red.es/CDTI enriquece un registro sin duplicar.
- [ ] Cobertura Asturias/local tiene fuente y estado real.
- [ ] F&T usa facets/multilingüe y existe ruta para gestión compartida.
- [ ] UI Fuentes consume health real.

### Elegibilidad y dinero

- [ ] Motor four-state pasa golden suite al 100 %.
- [ ] Unknown nunca equivale a cumple.
- [ ] Hard blockers preceden score.
- [ ] Score visible reconcilia sus componentes.
- [ ] Fórmulas separan familias.
- [ ] Financiación, contrato, margen, solicitado, concedido y cobrado son conceptos distintos.
- [ ] Evaluación fija versiones de oportunidad, reglas y perfil.

### Evidence Lab

- [ ] Claim abre documento/revisión/página/fragmento.
- [ ] Búsqueda, zoom, paginado y fallback son operables.
- [ ] Revisión humana local no se etiqueta como verificación oficial.
- [ ] Cita stale exige reanclaje.
- [ ] Diff de versiones identifica cambios materiales.
- [ ] Anotaciones se fijan a revisión y no derivan silenciosamente.

### Workspace y exportación

- [ ] Workspace privado usa IndexedDB/OPFS versionado.
- [ ] Migración desde V1 está probada.
- [ ] Expediente conserva snapshots y audit log.
- [ ] Grant y procurement generan módulos propios.
- [ ] ZIP incluye manifest, hashes, fuentes, versiones y advertencias.
- [ ] DOCX/PDF/CSV/ICS se generan localmente.
- [ ] Backup cifrado realiza round-trip íntegro.
- [ ] Storage full, import inválido y passphrase errónea tienen recuperación.

### Privacidad y seguridad

- [ ] Test de red demuestra que ProfileFact, documentos y expediente no salen.
- [ ] Scan de Git/build/logs no encuentra PII, certificados ni secretos.
- [ ] URLs/hosts/MIME/redirects/bytes/páginas están limitados.
- [ ] HTML, CSV y ZIP tienen fixtures hostiles.
- [ ] CSP y service worker no exponen datos privados.
- [ ] Acciones fijadas por SHA y permisos mínimos.
- [ ] IA/backend están off por defecto y no son necesarios.

### Offline, accesibilidad y rendimiento

- [ ] Snapshot nuevo se instala transaccionalmente.
- [ ] Snapshot corrupto conserva copia anterior.
- [ ] Guardadas y expedientes abren offline.
- [ ] 320 px y 200 % son utilizables.
- [ ] Teclado completa triage, evidencia y export.
- [ ] Foco, live regions y nombres accesibles están probados.
- [ ] Axe no reporta serious/critical.
- [ ] Reduced motion es autoritativo.
- [ ] Índice inicial <500 KB sin comprimir.
- [ ] JS inicial <250 KB gzip sin exportadores lazy.
- [ ] Ningún shard >1 MB sin excepción registrada.

### Operación

- [ ] health.json incluye ejecución, fuente, volumen, latencia, errores y cobertura.
- [ ] Dos fallos consecutivos o caída >70 % generan alerta.
- [ ] Dataset global cumple objetivo de frescura de 36 h o muestra stale.
- [ ] Workflows collect/publish/build/deploy/digest están separados.
- [ ] No hay doble run por commit de datos.
- [ ] Fallo parcial, fallo total, rollback y manual run están ensayados.
- [ ] GitHub Actions remoto está confirmado o se documenta scheduler local único.
- [ ] Runbook de recuperación está actualizado.

### Opcionales

- [ ] Suite completa pasa con flags de backend/IA apagados.
- [ ] Consentimiento por documento y borrado/exportación están probados.
- [ ] Ningún output IA se promueve a hecho oficial sin cita y validación.
- [ ] Claves de proveedor no aparecen en bundle.

---

## 8. Primer corte de trabajo autorizado

### Ahora

1. **DATOS:** cerrar G01 con JSON Schema y fixtures compartidos; revisar los tipos/validadores V2 ya iniciados.
2. **DATOS:** implementar migrador V1 → Opportunity/SourceRecord V2 para un fixture BDNS.
3. **UI:** adaptar EvidenceWorkspace al contrato de dominio definitivo sin duplicar tipos.
4. **UI:** añadir una ruta V2 no predeterminada que muestre el caso migrado y estados “Por verificar”.
5. **OPERACIÓN:** integrar validación del contrato en npm test y conservar los 17 tests actuales.
6. **OPERACIÓN:** añadir gate que impida publicar el shard V2 si schema/hash fallan.

### Evidencia exigida para cerrar H1

- fixture V1 y snapshot V2 esperado;
- test Python y test TS del mismo contrato;
- hash estable en doble ejecución;
- captura de la ficha V2 con fuente/calidad;
- captura/error de payload inválido rechazado;
- npm test, typecheck y build verdes;
- git diff sin datos privados ni secretos.

### No empezar todavía

- generación IA;
- sync remoto;
- OCR masivo;
- presentación electrónica;
- refactor visual global;
- nuevos rankings sobre campos sin evidencia.

---

## 9. Registro de decisiones de ejecución

| Decisión | Motivo | Estado |
|---|---|---|
| V2 es compatible por adapter durante la migración | Evita reescritura total y mantiene la app utilizable | Activa |
| Opportunity pública y WorkspaceOpportunityState privada se separan | Evita publicar decisiones del usuario y aclara lifecycle | Activa |
| Claim es la unidad de verificación | Permite trazabilidad y conflicto por campo | Activa |
| Hitos verticales, no capas aisladas | Cada corte debe acercar dinero real | Activa |
| Procurement tiene carril y fórmula propios | Un contrato no es una subvención | Activa |
| Evidence Lab es superficie principal | El usuario debe poder auditar la recomendación | Activa |
| Perfil y expediente permanecen locales | Compromiso de privacidad del producto | Activa |
| Backend/IA llegan después de la V2 estática | Evita dependencia, coste y fuga de datos | Activa |
| Firma y presentación son siempre manuales | Seguridad, legalidad y control humano | Permanente |

---

## 10. Criterio de éxito final

La V2 estará terminada cuando una oportunidad oficial real pueda convertirse, con evidencia trazable y datos privados que no salen del dispositivo, en una decisión explicada y un expediente exportable; cuando cambios y fallos no borren el contexto; y cuando el sistema ayude a solicitar, contratar y cobrar dinero sin fingir certeza ni actuar en nombre de la persona.
