# Lente Abierto MX · Plataforma Editorial de Galerías, Entrega Privada & Portafolio Fotográfico

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://lenteabiertomx.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase Firestore](https://img.shields.io/badge/Cloud_Firestore-Sync-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Instagram](https://img.shields.io/badge/@lente.abierto.mx-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/lente.abierto.mx)

Plataforma web profesional de exhibición, entrega privada de colecciones, portafolio editorial descargable en PDF y gestión integral diseñada a la medida para **Lente Abierto MX** (`@lente.abierto.mx`), dirigida por el fotógrafo **Martín Castillo**.

Con una arquitectura moderna, limpia y 100% responsiva (móvil, tablet y escritorio), combina sincronización en tiempo real en la nube (**Firebase Cloud Firestore**), integración directa con **Google Drive**, enlaces compartibles por colección, navegación nativa Atrás/Adelante del navegador, centro de notificaciones en tiempo real sincronizado en la nube, generador de portafolio PDF con código QR, control de vigencia de descargas, marcas de agua dinámicas y un CMS completo personalizable sin tocar código.

🌐 **Sitio en Producción:** [https://lenteabiertomx.vercel.app](https://lenteabiertomx.vercel.app)  
📸 **Instagram Oficial:** [@lente.abierto.mx](https://instagram.com/lente.abierto.mx)  
📞 **Contacto Directo:** +52 777 374 3420 · `casm830903@gmail.com`

---

## 📑 Tabla de Contenidos

1. [Visión General & Filosofía](#-visión-general--filosofía)
2. [Arquitectura de Base de Datos & Reglas Anti-Spam](#-arquitectura-de-base-de-datos--reglas-anti-spam)
3. [Características Principales](#-características-principales)
   - [1. Navegación Editorial & Historial Nativo del Navegador](#-1-navegación-editorial--historial-nativo-del-navegador)
   - [2. Galerías Editoriales, Encuadre Íntegro, Ordenamiento, Vistas y Favoritos](#-2-galerías-editoriales-encuadre-íntegro-ordenamiento-vistas-y-favoritos)
   - [3. Exportador de Portafolio Profesional en PDF (Sin IA, con Fecha Viva & QR)](#-3-exportador-de-portafolio-profesional-en-pdf-sin-ia-con-fecha-viva--qr)
   - [4. Campanita de Notificaciones en Tiempo Real Sincronizada en la Nube](#-4-campanita-de-notificaciones-en-tiempo-real-sincronizada-en-la-nube)
   - [5. Enlaces Compartibles Directos y Fechas de Vigencia](#-5-enlaces-compartibles-directos-y-fechas-de-vigencia)
   - [6. Portal Privado de Clientes, Descargas (.JPG / .ZIP), Validación 10 Dígitos & Auditoría](#-6-portal-privado-de-clientes-descargas-jpg--zip-validación-10-dígitos--auditoría)
   - [7. Seguridad Anticopia & Marcas de Agua Avanzadas](#-7-seguridad-anticopia--marcas-de-agua-avanzadas)
   - [8. Sincronización Inteligente con Google Drive](#-8-sincronización-inteligente-con-google-drive)
   - [9. CMS Completo, Instagram Oficial, Temas & Footer Fijo](#-9-cms-completo-instagram-oficial-temas--footer-fijo)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Stack Tecnológico](#-stack-tecnológico)
6. [Instalación y Desarrollo Local](#-instalación-y-desarrollo-local)
7. [Despliegue y Publicación](#-despliegue-y-publicación)
8. [Seguridad, Usuarios & Super Administrador Secreto](#-seguridad-usuarios--super-administrador-secreto)
9. [Contacto & Autor](#-contacto--autor)

---

## 🌟 Visión General & Filosofía

**Lente Abierto MX** es una plataforma de entrega fotográfica de autor que documenta bodas de destino, retratos editoriales, deportes y arquitectura mexicana en luz natural en destinos como **Cuernavaca, CDMX, Oaxaca, San Miguel de Allende y Riviera Maya**.

La plataforma otorga al estudio **independencia total** frente a suscripciones de terceros, permitiendo:

- Presentar directamente la **Biografía** al abrir el sitio, seguida de **Galerías**, **Portal Clientes** y **Contacto**.
- Persistir todos los cambios y registros (logotipo, favicon, textos, temas, usuarios, orden de galerías, publicaciones de Instagram, auditoría de descargas, favoritos y estado de notificaciones leídas) en **Cloud Firestore**, con alertas visuales en pantalla (verde/rojo) que confirman o advierten ante cualquier fallo de guardado.
- Entregar colecciones completas con PIN de apertura, PIN de descarga, fecha de expiración automática, solicitud de PIN por WhatsApp y enlace directo (`?galeria=...`).
- Importar y re-sincronizar carpetas desde **Google Drive** en un clic sin almacenar pesados archivos RAW en la base de datos.
- Generar en segundos un **Portafolio Editorial en PDF** listo para enviar a clientes y wedding planners sin depender de servicios de IA externos.

---

## ☁️ Arquitectura de Base de Datos & Reglas Anti-Spam

Toda la plataforma opera sincronizada en tiempo real con **Firebase Cloud Firestore** (`onSnapshot`), utilizando respaldo local y cola de reintento automático (`flushPendingCloudLogs`) para garantizar que ningún registro de descarga o favorito se pierda ante caídas temporales de red:

| Colección Firestore | Función |
| :--- | :--- |
| `galleries` | Colecciones fotográficas, orden manual (`displayOrder`), metadatos, URLs de portada/fotos, configuración de marcas de agua, PINs, `viewsCount` y fecha de expiración (`expiresAt`). |
| `siteConfig` (`main`) | Configuración global del CMS: logotipo, favicon, título SEO, textos del footer, biografía, principios, equipo técnico, publicaciones oficiales de Instagram, datos de contacto, paquetes de inversión, tema visual activo y estado sincronizado `adminNotifications` (`clearedBeforeMs` y `readIds`). |
| `users` | Cuentas registradas de fotógrafos, colaboradores, editores, asistentes y clientes (nombre, correo, teléfono y credenciales sincronizadas entre dispositivos). |
| `inquiries` | Bandeja de cotizaciones y mensajes enviados desde la sección de Contacto. |
| `downloadLogs` | Auditoría en tiempo real de descargas individuales (con miniatura de la foto y acceso directo al visor) y archivos `.ZIP` realizadas por clientes. |
| `favoriteLogs` | Registro en vivo de fotografías marcadas como favoritas ❤️ (con miniatura, correo y teléfono del cliente) para selección de álbum o retoque. |

### Reglas de Seguridad (`firestore.rules`), Esquema (`firebase-blueprint.json`) y Anti-Spam
- **Cero Envío Masivo de Correos / Cero Riesgo de Spam o Baneo:** La plataforma **no** envía correos automáticos masivos (SMTP/newsletter/bots) ni mensajes automatizados por WhatsApp. Las notificaciones viven dentro del propio Backend (campanita sincronizada en Firestore) y cualquier contacto por WhatsApp se abre manualmente bajo acción directa del usuario (`https://wa.me/...`).
- **Listas Blancas Estrictas (`keys().hasOnly(...)`) en Todas las Colecciones:** `firestore.rules` bloquea campos no declarados, inyecciones de propiedades ocultas y documentos inflados en `galleries`, `siteConfig`, `inquiries`, `downloadLogs`, `favoriteLogs` y `users`.
- **Validación Estricta de Correo, Teléfono y Límites:** Validación por expresión regular de correo electrónico en servidor (`firestore.rules`) y cliente, validación obligatoria de teléfono numérico de **10 dígitos**, estado inicial forzado `status == 'nuevo'` en cotizaciones, campo trampa invisible anti-bots (*honeypot*) y enfriamiento anti-duplicados en formularios y registros de descarga.
- **Protección de Integridad & Cuota:** Bloqueo total de borrado sobre `siteConfig/main`, límite acotado (`+1` por actualización) en el contador `viewsCount`, tope en arreglos de notificaciones (`<= 300` IDs) y proxy `/api/download` protegido contra URLs privadas o locales.
- **Notificaciones de Guardado (`CloudSyncToast`):** Ventana emergente verde cuando los cambios o registros se sincronizan con éxito en Firestore y alerta roja detallada en caso de error de conexión o permisos.

---

## ✨ Características Principales

### 1. Navegación Editorial & Historial Nativo del Navegador
- **Inicio Directo en Biografía:** Al entrar al portal (o hacer clic en el logotipo), el visitante ve primero la semblanza profesional, fotografía de autor, principios de trabajo, sección editable de **Equipo & Tecnologías de Alta Gama** y publicaciones.
- **Botones Atrás / Adelante Reales (`pushState` + `popstate`):** Navegar entre secciones (`Biografía`, `Galerías`, `Portal Clientes`, `Contacto`, `Perfil`, `Backend`), abrir o cerrar una galería y abrir o cerrar el visor Lightbox se sincroniza con el historial del navegador y el gesto "Atrás" en celulares, sin saturar el historial al pasar de una fotografía a otra dentro del visor.
- **Identidad Visual Unificada:** El logotipo y favicon configurados en el CMS se reflejan automáticamente en la barra superior, pie de página, ventana de inicio de sesión, modal de descarga con PIN, acceso administrativo, portal de clientes y encabezado de cada galería.

### 2. Galerías Editoriales, Encuadre Íntegro, Ordenamiento, Vistas y Favoritos
- **Portadas Íntegras sin Recortes (`object-contain` + Fondo Ambiental):** Tanto las tarjetas del catálogo como el banner principal de cada galería muestran la fotografía completa respetando su proporción original (horizontal, cuadrada o vertical) sobre un halo ambiental difuminado, garantizando que nunca se corten rostros ni bordes en PC, tablet o móvil.
- **Cabecera Editorial Responsiva:** Barra editorial limpia de tres zonas debajo de la portada (marca, título principal y botón *"Ver galería"*), descripción y metadatos sin encimarse sobre la fotografía.
- **Ordenamiento Manual de Colecciones (`displayOrder`):** Desde el panel de Backend puedes subir o bajar el orden en que aparecen tus galerías en el catálogo público.
- **Ordenamiento Rápido de Fotografías:** Dentro de cada galería y dentro del mismo visor **Lightbox**, los clientes pueden ordenar al instante por **Orden original**, **Más recientes**, **Más antiguas**, **Nombre A–Z** o **Aleatorio** (con botón de mezcla).
- **Indicadores en Tiempo Real:** Cada colección muestra sus insignias de privacidad (🔒), marca de agua (🛡️), **contador de vistas único por sesión (👁️)** y **contador en vivo de fotografías favoritas (❤️)** sincronizado con Firestore.
- **Visor Lightbox Inmersivo:** Zoom táctil/clic, pantalla completa, navegación por teclado o flechas, selección de favoritos y ficha técnica **EXIF** condicional cuando la fotografía contiene metadatos genuinos.

### 3. Exportador de Portafolio Profesional en PDF (Sin IA, con Fecha Viva & QR)
Disponible directamente en la cabecera del Backend mediante el botón **`Exportar Portafolio (PDF)`**:
- **100% Determinista y Offline-Ready:** Generado con **jsPDF + Canvas + QRCode**, sin llamadas ni costos de IA.
- **Dos Estilos Editoriales:** Tema **Oscuro Editorial** (para pantallas y envío por WhatsApp/correo) y **Claro Imprimible** (fondo blanco optimizado para impresión física).
- **Fecha Actual Automática:** Inserta dinámicamente el mes y año vigentes en portada y contraportada.
- **Contenido Completo del Estudio:** Portada con fotografía principal y logotipo, semblanza y biografía del fotógrafo, principios de trabajo, equipo y tecnología, selección customizable de galerías con fotografías proporcionales sin deformación ni recortes, guía de paquetes/inversión configurable, datos de contacto **clicables** (WhatsApp, Instagram, correo y web) y **código QR escaneable** hacia el portafolio digital.

### 4. Campanita de Notificaciones en Tiempo Real Sincronizada en la Nube
Integrada en el encabezado del panel **Backend**:
- **Centro Unificado de Alertas:** Agrupa automáticamente las últimas **descargas** (individuales y `.ZIP`), **favoritos** ❤️ marcados por clientes y **cotizaciones** recibidas en Contacto, con miniatura de la foto y tiempo relativo.
- **Limpieza Sincronizada entre Navegadores y Dispositivos:** El estado de notificaciones leídas (`clearedBeforeMs` y `readIds`) se guarda en Firestore (`siteConfig/main.adminNotifications`), de modo que al marcar leídas o eliminar notificaciones en una computadora o celular, permanecen limpias al iniciar sesión en cualquier otro navegador o dispositivo.

### 5. Enlaces Compartibles Directos y Fechas de Vigencia
- **URL Directa por Galería (`?galeria=<slug-o-id>`):** Los botones **Compartir** y las invitaciones generadas para **WhatsApp** desde el panel administrativo copian un enlace directo a la colección.
- **Desbloqueo Automático por Enlace Privado:** Si alguien abre el enlace directo de una colección privada con PIN de apertura, se muestra automáticamente un modal de desbloqueo con el logotipo del estudio antes de revelar las fotos.
- **Fecha de Expiración Opcional:** Al crear o editar una galería puedes definir una fecha límite (con atajos de **+30 días**, **+90 días**, fecha manual o **Sin límite**). Al vencer la vigencia, los clientes siguen viendo la galería con marca de agua en pantalla, pero se deshabilitan automáticamente las descargas individuales y en `.ZIP`.

### 6. Portal Privado de Clientes, Descargas (.JPG / .ZIP), Validación 10 Dígitos & Auditoría
- **100% Confidencial:** Las claves PIN nunca se exponen en el frontend público.
- **Validación Estricta de Datos de Contacto:** Al registrarse, marcar una fotografía como favorita, descargar fotos o enviar una cotización en Contacto, el sistema valida nombre completo, correo electrónico válido y número telefónico estricto de **10 dígitos numéricos** (bloqueando letras, espacios o correos en el campo teléfono).
- **Solicitud Directa de PIN por WhatsApp:** En el modal de descarga, si un visitante del portafolio aún no cuenta con el PIN de descarga, puede hacer clic en *"Si no tienes PIN, solicítalo aquí"* para abrir WhatsApp con un mensaje prellenado indicando exactamente la galería o foto solicitada.
- **Descarga Individual y Masiva `.ZIP`:** Empaquetado limpio en máxima resolución en el cliente con **JSZip** y registro automático en Firestore con protección antiduplicados.
- **Tabla de Descargas Responsiva y Sin Recortes:** Vista optimizada en el Backend con fecha/hora compacta y columnas adaptativas para visualizar siempre **Tipo** y **Archivo** completos sin recortes horizontales.
- **Miniaturas en Descargas y Favoritos + Salto Directo:** Tanto en la pestaña **Descargas** como en **Favoritos** del Backend, las fotografías individuales muestran su miniatura y al hacer clic abren directamente la fotografía exacta dentro de su galería y visor Lightbox.
- **Herramientas de Laboratorio:** Copiado en un clic de la lista exacta de archivos seleccionados para buscarlos en **Adobe Lightroom**, contacto por WhatsApp al cliente y exportación a CSV.

### 7. Seguridad Anticopia & Marcas de Agua Avanzadas
- **Motor Canvas Dinámico (`WatermarkCanvas`):** Protección visual no destructiva sobre las pruebas en pantalla, configurable por galería con:
  - Texto personalizado (ej. `LENTE ABIERTO MX`).
  - **Tamaño:** `XS`, `S`, `M`, `L` y `XL`.
  - **Posición (8 modos):** Centro, patrón diagonal repetido, aleatoria, esquinas superior/inferior izquierda/derecha y centro inferior.
  - **Color personalizado y transparencia graduable**, con vista previa en vivo en el editor.
- **Bloqueos Preventivos:** Inhabilitación de clic derecho y arrastre de imágenes en galerías y visor.

### 8. Sincronización Inteligente con Google Drive
- **Importación Directa sin Sobrecargar la Base:** Los metadatos y referencias ligeras de imagen apuntan a Google Drive (mediante Google Apps Script o cuenta autorizada de Google Drive dentro del backend), optimizando el uso de almacenamiento en Firestore para cientos de galerías.
- **Botón `🔄 Actualizar desde Drive`:** Disponible en cada galería registrada dentro del backend para detectar automáticamente fotografías agregadas, actualizadas o eliminadas en la carpeta de Drive origen.

### 9. CMS Completo, Instagram Oficial, Temas & Footer Fijo
Todo el sitio es personalizable desde **Backend → Personalizar Sitio (CMS)**:
- **Identidad, SEO y Marca:** Nombre de marca, eslogan, título `<title>`, meta descripción, subida o URL de **Logotipo** y **Favicon**, además de textos editables del **Footer** y leyenda de seguridad.
- **Publicaciones Oficiales de Instagram (`@lente.abierto.mx`):** Administra tarjetas reales con el enlace directo de cada publicación de Instagram (`postUrl`), pie de foto, imagen personalizada (optimizada automáticamente) o selector directo de cualquier foto de tus galerías. Al hacer clic en una tarjeta del sitio, el visitante abre la publicación exacta en Instagram.
- **Apariencia & Temas de Temporada con Viñetas Adaptativas:** Selector instantáneo de paletas de temporada (Oscuro Editorial, Blanco Galería, Navidad, Halloween, San Valentín, Primavera) y selectores individuales de color para fondo, tarjetas, tipografía, títulos y acentos. Incluye un compendio propio de iconos vectoriales fotográficos (cámara, obturador, cámara vintage y lente) que cambian visualmente según el tema activo (por ejemplo, gorrito de Santa en Navidad o gotas de sangre en Halloween).
- **Sonido de Obturador (1 Shot) con Control en Pie de Página:** Retroalimentación sonora sutil y nítida de un disparo único de obturador mecánico generada localmente con Web Audio API al interactuar con botones, tarjetas y fotografías, con botón dedicado para silenciar o reactivar en el pie de página.
- **Biografía & Equipo Técnico:** Edición completa de retrato, cita principal, trayectoria, principios de trabajo, publicaciones y tarjetas dinámicas de **Equipo & Tecnologías de Alta Gama**.
- **Contacto, Paquetes & Footer Fijo:** Teléfono, WhatsApp, Instagram, ubicación, editor dinámico de paquetes e inversión y enlaces fijos de **Biografía**, **Instagram** y **WhatsApp** en la barra de derechos reservados del pie de página.

---

## 📁 Estructura del Proyecto

```text
lenteabiertomx/
├── .github/
│   └── workflows/
│       └── deploy.yml                  # Despliegue automático a GitHub Pages
├── api/
│   └── download.ts                     # Endpoint serverless seguro para descarga limpia de archivos
├── firebase-blueprint.json             # Definición estructural de colecciones Firestore
├── firestore.rules                     # Reglas de seguridad, validación y anti-spam de Cloud Firestore
├── src/
│   ├── components/
│   │   ├── AdminAuthModal.tsx          # Acceso validado al panel Backend
│   │   ├── AdminNotificationBell.tsx   # Campanita de notificaciones sincronizada en Firestore
│   │   ├── AdminPanel.tsx              # Panel completo (Galerías, Drive, CMS, Temas, Usuarios, Descargas, Favoritos)
│   │   ├── AuthModal.tsx               # Registro e inicio de sesión directo contra la base de datos
│   │   ├── BiographyPage.tsx           # Página de inicio con biografía, principios y equipo técnico
│   │   ├── ClientPortalPage.tsx        # Portal privado de acceso por PIN
│   │   ├── CloudSyncToast.tsx          # Alertas de estado de guardado en Firestore (verde/rojo)
│   │   ├── ContactPage.tsx             # Contacto, WhatsApp directo, tarifas y formulario anti-spam
│   │   ├── FavoriteAuthModal.tsx       # Registro obligatorio con teléfono de 10 dígitos al marcar favoritos
│   │   ├── Footer.tsx                  # Pie de página dinámico con enlaces fijos (Biografía, Instagram, WhatsApp)
│   │   ├── GalleryGrid.tsx             # Catálogo público con encuadre íntegro, orden manual, filtros y vigencia
│   │   ├── GalleryView.tsx             # Vista editorial de galería, ordenamiento rápido, descargas y compartir
│   │   ├── InstagramFeed.tsx           # Carrusel oficial @lente.abierto.mx con enlace directo por publicación
│   │   ├── Navbar.tsx                  # Barra de navegación unificada (Biografía, Galerías, Portal, Contacto)
│   │   ├── PhotoLightbox.tsx           # Visor de alta definición con zoom, ordenamiento, EXIF y descarga
│   │   ├── PinModal.tsx                # Verificación de PIN, validación de 10 dígitos, WhatsApp y log de descargas
│   │   ├── PortfolioExportModal.tsx    # Configurador modal para exportar el Portafolio PDF del estudio
│   │   ├── UserProfilePage.tsx         # Perfil editable de usuario y colecciones asignadas
│   │   └── WatermarkCanvas.tsx         # Motor de renderizado de marcas de agua en tiempo real
│   ├── services/
│   │   ├── cloudFeedback.ts            # Emisor global de alertas de éxito/error de sincronización
│   │   ├── firebase.ts                 # Inicialización de Firebase App, Firestore y acceso Drive
│   │   ├── firestoreSync.ts            # Suscripciones en vivo, escritura y utilidades Super Admin
│   │   ├── googleDrive.ts              # Lector de carpetas Drive / Apps Script y extracción de fotos
│   │   ├── portfolioPdfGenerator.ts    # Generador editorial de portafolio PDF con jsPDF + QRCode
│   │   ├── storage.ts                  # Estado predeterminado, cola offline, vigencia y logs antiduplicados
│   │   ├── userService.ts              # Gestión de usuarios en BD, sesiones y validación administrativa
│   │   └── zipDownloader.ts            # Generación cliente de archivos .ZIP con JSZip
│   ├── utils/
│   │   ├── imageCompressor.ts          # Compresión optimizada para portadas, logotipos y publicaciones
│   │   └── themePresets.ts             # Presets de temas de temporada y contraste CSS
│   ├── types/
│   │   └── index.ts                    # Interfaces TypeScript del dominio completo
│   ├── App.tsx                         # Router principal, historial del navegador y tema global
│   ├── index.css                       # Tailwind CSS v4 y variables CSS dinámicas de tema
│   └── main.tsx                        # Punto de entrada React 19
├── index.html                          # Plantilla HTML principal y metadatos SEO
├── package.json                        # Dependencias optimizadas y scripts (dev, build, lint)
├── tsconfig.json                       # Configuración de TypeScript
└── vite.config.ts                      # Configuración de Vite con chunks comprimidos y proxy seguro
```

---

## 🛠️ Stack Tecnológico

- **Frontend Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Optimización:** [Vite 8](https://vitejs.dev/) (`esbuild` minificado + `manualChunks` comprimidos)
- **Base de Datos en Tiempo Real:** [Firebase Cloud Firestore](https://firebase.google.com/)
- **Estilos & Temas:** [Tailwind CSS v4](https://tailwindcss.com/) + CSS Custom Properties dinámicas
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Exportación PDF & QR:** [jsPDF](https://parall.ax/products/jspdf) + [qrcode](https://github.com/soldair/node-qrcode)
- **Compresión `.ZIP`:** [JSZip](https://stuk.github.io/jszip/)
- **Tipografías:** Cormorant Garamond (editorial) y Plus Jakarta Sans / Inter (interfaz)

---

## 🚀 Instalación y Desarrollo Local

Requisitos previos: [Node.js](https://nodejs.org/) v18+ o [Bun](https://bun.sh/).

```bash
# 1. Clonar el repositorio
git clone https://github.com/mrcastillos/lenteabiertomx.git

# 2. Entrar en la carpeta del proyecto
cd lenteabiertomx

# 3. Instalar dependencias
npm install   # o bun install

# 4. Iniciar servidor de desarrollo (puerto 3000)
npm run dev
```

### Compilación y Verificación

```bash
# Generar compilación optimizada y comprimida para producción en /dist
npm run build

# Verificar tipos de TypeScript
npm run lint
```

---

## 🌐 Despliegue y Publicación

### Opción A: Vercel (Recomendado)
1. Conecta tu repositorio en [Vercel](https://vercel.com) (`Add New... → Project`).
2. Vercel detecta automáticamente Vite (`npm run build` / `bun run build`, salida `dist`) y la función `/api/download`.
3. Cada push a la rama `main` despliega automáticamente la nueva versión en vivo.

### Opción B: GitHub Pages
El repositorio incluye `.github/workflows/deploy.yml`. En GitHub ve a **Settings → Pages → Source** y selecciona **`GitHub Actions`** para compilar y publicar automáticamente.

---

## 🔐 Seguridad, Usuarios & Super Administrador Secreto

- **Sin Auto-Login al Entrar:** Al abrir el sitio, ningún usuario aparece con sesión iniciada por defecto. Los visitantes ven el portafolio público limpio y los clientes pueden acceder con su cuenta o PIN sin sesiones pre-cargadas.
- **Autenticación Basada en la Propia Base de Datos:** El inicio de sesión estándar de usuarios y colaboradores funciona directamente contra la colección `users` en Firestore (usuario/correo y contraseña).
- **Roles y Gestión de Equipo:** Desde **Backend → Usuarios y Accesos** se pueden crear, editar, asignar galerías y administrar cuentas con roles diferenciados (`fotografo`, `colaborador`, `asistente`, `editor`, `cliente`).
- **Usuario Secreto Super Administrador (Modo Oculto):** La plataforma cuenta con una **cuenta secreta de Super Administrador oculta** (no listada en el frontend, ni en la tabla de usuarios del backend, ni expuesta en documentos públicos). Sus credenciales son privadas del propietario del proyecto y desbloquean un panel avanzado exclusivo capaz de:
  - Auditar el uso de documentos y bytes por colección en **Cloud Firestore**.
  - Vaciar colecciones operativas de la base de datos.
  - Ejecutar un **restablecimiento total de fábrica** del sitio de forma controlada.

---

## 📩 Contacto & Autor

* **Fotógrafo & Director:** Martín Castillo
* **Marca:** Lente Abierto MX
* **Instagram:** [@lente.abierto.mx](https://instagram.com/lente.abierto.mx)
* **WhatsApp:** [+52 777 374 3420](https://wa.me/527773743420)
* **Correo Electrónico:** [casm830903@gmail.com](mailto:casm830903@gmail.com)
* **Cobertura:** Cuernavaca · Ciudad de México · Oaxaca · San Miguel de Allende · Destinos Nacionales e Internacionales.

---

*Lente Abierto MX © Todos los derechos reservados. Plataforma de fotografía documental, editorial y entrega privada en alta fidelidad.*
