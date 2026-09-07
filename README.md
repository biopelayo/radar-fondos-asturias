# Radar Fondos Asturias

Aplicación personal, pública y gratuita para detectar oportunidades de financiación y convertirlas en expedientes verificables. El objetivo no es acumular titulares: es identificar qué merece tiempo, qué requisito falta y cuál es el siguiente paso para poder solicitar dinero de forma legal y realista.

## Qué funciona en este MVP

- Recolección diaria desde **BDNS/SNPSAP**, **BOE**, **BOPA** y **EU Funding & Tenders**.
- Filtrado temático para autoempleo, empresa, turismo, vivienda, comercio, digitalización, IA, datos, biología, biomedicina, investigación, docencia, energía y medio rural.
- Ranking inicial por territorio, afinidad temática, capital publicado y calidad del plazo extraído.
- Mesa de decisión con evidencia oficial, bloqueos, requisitos y acción manual para abrir un expediente.
- Radar visual, pipeline de candidaturas, inventario de fuentes y perfil de elegibilidad.
- Perfil y expedientes guardados exclusivamente en `localStorage` del navegador.
- Actualización programada a las 09:00 y control vespertino mediante la automatización local del propietario.
- Resumen por Gmail cuando se activa explícitamente la configuración privada.

Los datos mostrados son señales para investigar, no una garantía de elegibilidad o concesión. Antes de actuar hay que leer las bases y utilizar la sede electrónica oficial.

## Privacidad

El repositorio no debe contener datos personales, certificados, contraseñas ni borradores privados. `.local/` y `.env*` están excluidos de Git. El archivo local `.local/profile.private.json` contiene el perfil inicial preparado para su propietario y se importa manualmente desde **Perfil privado → Importar JSON**.

El certificado electrónico nunca se lee ni se almacena en la aplicación. La preparación, firma y presentación de una candidatura requieren siempre una orden y revisión humana expresa.

## Ejecutar en local

Requisitos: Node.js 20+ y Python 3.12+.

```bash
npm install
python scripts/collect.py
npm run dev
```

La compilación de producción se verifica con:

```bash
npm run build
```

## Aplicación pública

[Abrir Radar Fondos Asturias](https://biopelayo.github.io/radar-fondos-asturias/)

La versión actual se publica desde la rama `gh-pages`. El equipo Windows del propietario ejecuta el circuito completo —recolectar, validar, compilar, registrar ambos datasets, publicar y avisar— a las 09:00 y a las 17:00 mediante tareas programadas. Los logs privados quedan en `.local/logs/`.

La programación local se puede reparar o reinstalar con:

```powershell
.\scripts\install_schedule.ps1
```

El workflow de GitHub Actions está preparado localmente pero no se publica hasta que la autorización de GitHub incluya el permiso `workflow`. Cuando se active, permitirá que la recolección, el commit del dataset, el despliegue y el correo funcionen directamente en GitHub sin depender del equipo local.

El workflow preparado corre a las `06:35 UTC` y `15:30 UTC`, equivalentes aproximadamente a 07:35/08:35 y 16:30/17:30 en Madrid según horario de invierno/verano. GitHub no garantiza ejecución exacta al minuto y puede introducir retrasos. En repositorios públicos, GitHub puede desactivar los cron tras periodos largos de inactividad; conviene comprobarlo periódicamente.

### Avisos por Gmail

Crear estos secretos en **Settings → Secrets and variables → Actions**:

- `GMAIL_ADDRESS`: cuenta remitente.
- `GMAIL_APP_PASSWORD`: contraseña de aplicación de Google, nunca la contraseña normal.
- `ALERT_EMAIL`: destinatario; si se omite se usa la cuenta remitente.

La automatización de correo falla de forma visible si faltan esas credenciales. Para una ejecución que no deba enviar correo se puede establecer explícitamente `RADAR_EMAIL_OPTIONAL=1`.

Mientras la actualización se ejecute desde el equipo del propietario, el correo puede configurarse sin guardar la contraseña en texto plano:

```powershell
.\scripts\configure_email.ps1
```

El script solicita una contraseña de aplicación de Google de forma oculta y la cifra con la protección de datos de Windows para el usuario actual. El archivo resultante queda dentro de `.local/` y nunca se publica. `send_digest_local.ps1` admite varios destinatarios separados por comas.

## Arquitectura

```text
Fuentes oficiales
  ├─ BDNS API
  ├─ BOE Datos Abiertos
  ├─ BOPA sumario oficial
  └─ EU Funding & Tenders API
          ↓
scripts/collect.py
          ↓
public/data/opportunities.json
          ↓
React + TypeScript + Vite
          ↓
GitHub Pages + perfil privado local
```

## Próximas fases

- Añadir PLACSP/TED para contratación pública como carril comercial separado.
- Añadir SEKUENS, Cámaras de Comercio, Red.es, CDTI y otras fuentes complementarias con conectores auditables.
- Extraer con mayor precisión documentos, beneficiarios, fechas, intensidad y compatibilidades.
- Motor de reglas personalizable y lista de palabras clave desde la propia interfaz.
- Generador de memoria, presupuesto, cronograma y checklist solo bajo orden del usuario.
- Alertas urgentes diferenciales, evitando correos repetidos.

## Licencia

MIT. El software es gratuito; las publicaciones oficiales conservan sus propios avisos y condiciones de reutilización.
