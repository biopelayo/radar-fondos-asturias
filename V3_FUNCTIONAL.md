# Radar Fondos Asturias — V3 funcional

Estado: 2026-09-08
Rama: `codex/v2`

## Qué resuelve ya

V3 convierte el catálogo V2 validado en una cartera personal de decisiones:

- carga las 105 oportunidades desde shards públicos y verifica sus hashes SHA-256 antes de mostrarlas;
- permite optimizar por ingresos rápidos, creación de negocio, ciencia/datos o cartera equilibrada;
- cruza señales con el perfil privado guardado solo en el navegador;
- distingue solicitud directa, consorcio europeo, proveedor/socio y acceso por verificar;
- explica encaje, evidencia disponible, bloqueos y siguientes acciones;
- penaliza anuncios administrativos que no parecen financiación accionable;
- enlaza cada candidato con Evidence Lab V2 y conserva la misma referencia oficial;
- permite exportar el informe estratégico en JSON e iniciar/continuar un expediente local;
- soporta rutas compartibles mediante hash, por ejemplo `#strategy-v3` y `#evidence-v2`.

## Contrato de verdad

- Un score es una prioridad de revisión, no una declaración de elegibilidad.
- Capital publicado no significa capital accesible ni concesión esperada.
- Los campos sin claim documental permanecen `Por verificar`.
- V3 no firma, presenta ni envía solicitudes.
- Perfil, capital propio y expedientes no se incluyen en Git ni en los datos públicos.

## Qué falta para que decida con evidencia completa

La siguiente frontera no es otro rediseño: es H2, la ingestión documental. Debe descargar y versionar bases, convocatorias y anexos; extraer por página beneficiarios, cuantía, gastos, incompatibilidades, plazo y vía de presentación; y enlazar cada dato con su fragmento oficial. Después entran el evaluador de reglas four-state, escenarios económicos reales y el generador de expedientes DOCX/PDF/ZIP.

## Gate de publicación

V3 puede vivir en paralelo a la V1, pero la V1 pública no se sustituye hasta que tests, build, revisión visual, datos sin secretos y recorrido estrategia→evidencia→expediente estén verdes. La presentación electrónica seguirá siendo siempre manual.
