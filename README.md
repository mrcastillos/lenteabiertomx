# Lente Abierto MX · Plataforma de Galerías & Portafolio Fotográfico de Autor

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://lenteabiertomx.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase Firestore](https://img.shields.io/badge/Cloud_Firestore-Sync-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Instagram](https://img.shields.io/badge/@lente.abierto.mx-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/lente.abierto.mx)

Plataforma web profesional de exhibición, entrega privada y gestión fotográfica diseñada a la medida para **Lente Abierto MX** (`@lente.abierto.mx`), dirigida por el fotógrafo **Martín Castillo**.

Con un diseño editorial cinematográfico 100% responsivo (móvil, tablet y escritorio), combina sincronización en tiempo real en la nube (**Firebase Cloud Firestore**), integración directa con **Google Drive**, enlaces compartibles por colección, navegación nativa Atrás/Adelante del navegador, control de vigencia de descargas, marcas de agua dinámicas y un CMS completo personalizable sin tocar código.

🌐 **Sitio en Producción:** [https://lenteabiertomx.vercel.app](https://lenteabiertomx.vercel.app)  
📸 **Instagram Oficial:** [@lente.abierto.mx](https://instagram.com/lente.abierto.mx)  
📞 **Contacto Directo:** +52 777 374 3420 · `casm830903@gmail.com`

---

## 📑 Tabla de Contenidos

1. [Visión General & Filosofía](#-visión-general--filosofía)
2. [Arquitectura de Base de Datos & Sincronización en la Nube](#-arquitectura-de-base-de-datos--sincronización-en-la-nube)
3. [Características Principales](#-características-principales)
   - [Navegación Editorial & Historial Nativo del Navegador](#-1-navegación-editorial--historial-nativo-del-navegador)
   - [Galerías Editoriales, Ordenamiento, Vistas y Favoritos](#-2-galerías-editoriales-ordenamiento-vistas-y-favoritos)
   - [Enlaces Compartibles Directos y Fechas de Vigencia](#-3-enlaces-compartibles-directos-y-fechas-de-vigencia)
   - [Portal Privado de Clientes, Descargas (.JPG / .ZIP) & Auditoría](#-4-portal-privado-de-clientes-descargas-jpg--zip--auditoría)
   - [Seguridad Anticopia & Marcas de Agua Avanzadas](#-5-seguridad-anticopia--marcas-de-agua-avanzadas)
   - [Sincronización Inteligente con Google Drive](#-6-sincronización-inteligente-con-google-drive)
   - [CMS Completo, Instagram Oficial, Temas & Footer Fijo](#-7-cms-completo-instagram-oficial-temas--footer-fijo)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Stack Tecnológico](#-stack-tecnológico)
6. [Instalación y Desarrollo Local](#-instalación-y-desarrollo-local)
7. [Despliegue y Publicación](#-despliegue-y-publicación)
8. [Seguridad, Usuarios & Super Administrador Secreto](#-seguridad-usuarios--super-administrador-secreto)
9. [Contacto & Autor](#-contacto--autor)

---

## 🌟 Visión General & Filosofía

**Lente Abierto MX** documenta bodas de destino, retratos editoriales, deportes y arquitectura mexicana en luz natural en destinos como **Cuernavaca, CDMX, Oaxaca, San Miguel de Allende y Riviera Maya**.

La plataforma otorga al estudio **independencia total** frente a suscripciones externas, permitiendo:

- Presentar directamente la **Biografía** al abrir el sitio, seguida de **Galerías**, **Portal Clientes** y **Contacto**.
- Persistir todos los cambios y registros (logotipo, favicon, textos, temas, usuarios, orden de galerías, publicaciones de Instagram, auditoría de descargas y favoritos) en **Cloud Firestore**, con alertas visuales en pantalla (verde/rojo) que confirman o advierten ante cualquier fallo de guardado.
- Entregar colecciones completas con PIN de apertura, PIN de descarga, fecha de expiración automática, solicitud de PIN por WhatsApp y enlace directo (`?galeria=...`).
- Importar y re-sincronizar carpetas desde **Google Drive** en un clic sin almacenar pesados archivos RAW en la base de datos.

---

## ☁️ Arquitectura de Base de Datos & Sincronización en la Nube

Toda la plataforma opera sincronizada en tiempo real con **Firebase Cloud Firestore** (`onSnapshot`), utilizando respaldo local y cola de reintento automático (`flushPendingCloudLogs`) para garantizar que ningún registro de descarga o favorito se pierda ante caídas temporales de red:

| Colección Firestore | Función |
| :--- | :--- |
| `galleries` | Colecciones fotográficas, orden manual (`displayOrder`), metadatos, URLs de portada/fotos, configuración de marcas de agua, PINs, `viewsCount` y fecha de expiración (`expiresAt`). |
| `siteConfig` (`main`) | Configuración global del CMS: logotipo, favicon, título SEO, textos del footer, biografía, principios, equipo técnico, publicaciones oficiales de Instagram, datos de contacto, paquetes de inversión y tema visual activo. |
| `users` | Cuentas registradas de fotógrafos, colaboradores, editores, asistentes y clientes (nombre, correo, teléfono y credenciales sincronizadas entre dispositivos). |
| `inquiries` | Bandeja de cotizaciones y mensajes enviados desde la sección de Contacto. |
| `downloadLogs` | Auditoría en tiempo real de descargas individuales (con miniatura de la foto y acceso directo al visor) y archivos `.ZIP` realizadas por clientes. |
| `favoriteLogs` | Registro en vivo de fotografías marcadas como favoritas ❤️ (con miniatura, correo y teléfono del cliente) para selección de álbum o retoque. |

- **Reglas de Seguridad (`firestore.rules`) y Esquema (`firebase-blueprint.json`):** Validación estructural de documentos, límites seguros de tamaño e índices, inmutabilidad en registros de auditoría y cotizaciones, protección contra borrado accidental de `siteConfig/main` e incremento atómico del contador de vistas.
- **Notificaciones de Guardado (`CloudSyncToast`):** Ventana emergente verde cuando los cambios o registros se sincronizan con éxito en Firestore y alerta roja detallada en caso de error de conexión o permisos.

---

## ✨ Características Principales

### 1. Navegación Editorial & Historial Nativo del Navegador
- **Inicio Directo en Biografía:** Al entrar al portal (o hacer clic en el logotipo), el visitante ve primero la semblanza profesional, fotografía de autor, principios de trabajo, sección editable de **Equipo & Tecnologías de Alta Gama** y publicaciones.
- **Botones Atrás / Adelante Reales (`pushState` + `popstate`):** Navegar entre secciones (`Biografía`, `Galerías`, `Portal Clientes`, `Contacto`, `Perfil`, `Backend`), abrir o cerrar una galería y abrir o cerrar el visor Lightbox se sincroniza con el historial del navegador y el gesto "Atrás" en celulares, sin saturar el historial al pasar de una fotografía a otra dentro del visor.
- **Identidad Visual Unificada:** El logotipo y favicon configurados en el CMS se reflejan automáticamente en la barra superior, pie de página, ventana de inicio de sesión, modal de descarga con PIN, acceso administrativo, portal de clientes y encabezado de cada galería.

### 2. Galerías Editoriales, Ordenamiento, Vistas y Favoritos
- **Cabecera Editorial Responsiva:** Portada limpia de ancho completo en la parte superior y, debajo, barra editorial de tres zonas (marca, título principal y botón *"Ver galería"*), descripción y metadatos sin encimarse sobre la fotografía.
- **Ordenamiento Manual de Colecciones (`displayOrder`):** Desde el panel de Backend puedes subir o bajar el orden en que aparecen tus galerías en el catálogo público.
- **Ordenamiento Rápido de Fotografías:** Dentro de cada galería y dentro del mismo visor **Lightbox**, los clientes pueden ordenar al instante por **Orden original**, **Más recientes**, **Más antiguas**, **Nombre A–Z** o **Aleatorio** (con botón de mezcla).
- **Indicadores en Tiempo Real:** Cada colección muestra sus insignias de privacidad (🔒), marca de agua (🛡️), **contador de vistas único por sesión (👁️)** y **contador en vivo de fotografías favoritas (❤️)** sincronizado con Firestore.
- **Visor Lightbox Inmersivo:** Zoom táctil/clic, pantalla completa, navegación por teclado o flechas, selección de favoritos y ficha técnica **EXIF** condicional cuando la fotografía contiene metadatos genuinos.

### 3. Enlaces Compartibles Directos y Fechas de Vigencia
- **URL Directa por Galería (`?galeria=<slug-o-id>`):** Los botones **Compartir** y las invitaciones generadas para **WhatsApp** desde el panel administrativo copian un enlace directo a la colección.
- **Desbloqueo Automático por Enlace Privado:** Si alguien abre el enlace directo de una colección privada con PIN de apertura, se muestra automáticamente un modal de desbloqueo con el logotipo del estudio antes de revelar las fotos.
- **Fecha de Expiración Opcional:** Al crear o editar una galería puedes definir una fecha límite (con atajos de **+30 días**, **+90 días**, fecha manual o **Sin límite**). Al vencer la vigencia, los clientes siguen viendo la galería con marca de agua en pantalla, pero se deshabilitan automáticamente las descargas individuales y en `.ZIP`.

### 4. Portal Privado de Clientes, Descargas (.JPG / .ZIP) & Auditoría
- **100% Confidencial:** Las claves PIN nunca se exponen en el frontend público.
- **Datos Obligatorios de Contacto:** Al registrarse, marcar una fotografía como favorita o iniciar una descarga, el sistema valida nombre completo, correo electrónico válido y teléfono de contacto (mínimo 10 dígitos).
- **Solicitud Directa de PIN por WhatsApp:** En el modal de descarga, si un visitante del portafolio aún no cuenta con el PIN de descarga, puede hacer clic en *"Si no tienes PIN, solicítalo aquí"* para abrir WhatsApp con un mensaje prellenado indicando exactamente la galería o foto solicitada.
- **Descarga Individual y Masiva `.ZIP`:** Empaquetado limpio en máxima resolución en el cliente con **JSZip** y registro automático en Firestore.
- **Miniaturas en Descargas y Favoritos + Salto Directo:** Tanto en la pestaña **Descargas** como en **Favoritos** del Backend, las fotografías individuales muestran su miniatura y al hacer clic abren directamente la fotografía exacta dentro de su galería y visor Lightbox.
- **Herramientas de Laboratorio:** Copiado en un clic de la lista exacta de archivos seleccionados para buscarlos en **Adobe Lightroom**, contacto por WhatsApp al cliente y exportación a CSV.

### 5. Seguridad Anticopia & Marcas de Agua Avanzadas
- **Motor Canvas Dinámico (`WatermarkCanvas`):** Protección visual no destructiva sobre las pruebas en pantalla, configurable por galería con:
  - Texto personalizado (ej. `LENTE ABIERTO MX`).
  - **Tamaño:** `XS`, `S`, `M`, `L` y `XL`.
  - **Posición (8 modos):** Centro, patrón diagonal repetido, aleatoria, esquinas superior/inferior izquierda/derecha y centro inferior.
  - **Color personalizado y transparencia graduable**, con vista previa en vivo en el editor.
- **Bloqueos Preventivos:** Inhabilitación de clic derecho y arrastre de imágenes en galerías y visor.

### 6. Sincronización Inteligente con Google Drive
- **Importación Directa sin Sobrecargar la Base:** Los metadatos y referencias ligeras de imagen apuntan a Google Drive (mediante Google Apps Script o cuenta autorizada de Google Drive dentro del backend), optimizando el uso de almacenamiento gratuito en Firestore para cientos de galerías.
- **Botón `🔄 Actualizar desde Drive`:** Disponible en cada galería registrada dentro del backend para detectar automáticamente fotografías agregadas, actualizadas o eliminadas en la carpeta de Drive origen.

### 7. CMS Completo, Instagram Oficial, Temas & Footer Fijo
Todo el sitio es personalizable desde **Backend → Personalizar Sitio (CMS)**:
- **Identidad, SEO y Marca:** Nombre de marca, eslogan, título `<title>`, meta descripción, subida o URL de **Logotipo** y **Favicon**, además de textos editables del **Footer** y leyenda de seguridad.
- **Publicaciones Oficiales de Instagram (`@lente.abierto.mx`):** Administra tarjetas reales con el enlace directo de cada publicación de Instagram (`postUrl`), pie de foto, imagen personalizada (optimizada automáticamente) o selector directo de cualquier foto de tus galerías. Al hacer clic en una tarjeta del sitio, el visitante abre la publicación exacta en Instagram.
- **Apariencia & Temas de Temporada:** Selector instantáneo de paletas de temporada (Oscuro Editorial, Blanco Galería, Navidad, Halloween, Primavera, Elegante Azul/Oro) y selectores individuales de color para fondo, tarjetas, tipografía, títulos y acentos.
- **Biografía & Equipo Técnico:** Edición completa de retrato, cita principal, trayectoria, principios de trabajo, publicaciones y tarjetas dinámicas de **Equipo & Tecnologías de Alta Gama**.
- **Contacto, Paquetes & Footer Fijo:** Teléfono, WhatsApp, Instagram, ubicación, editor dinámico de paquetes e inversión y enlaces fijos de **Biografía**, **Instagram** y **WhatsApp** en la barra de derechos reservados del pie de página.

---

## 📁 Estructura del Proyecto

```text
lenteabiertomx/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Despliegue automático a GitHub Pages
├── api/
│   └── download.ts                 # Endpoint serverless para descarga limpia de archivos
├── public/
│   └── assets/                     # Activos gráficos y recursos estáticos
├── firebase-blueprint.json         # Definición estructural de colecciones Firestore
├── firestore.rules                 # Reglas de seguridad y validación de Cloud Firestore
├── src/
│   ├── components/
│   │   ├── AdminAuthModal.tsx      # Acceso cifrado/validado al panel Backend
│   │   ├── AdminPanel.tsx          # Panel completo (Galerías, Drive, CMS, Temas, Usuarios, Descargas, Favoritos)
│   │   ├── AuthModal.tsx           # Registro e inicio de sesión directo contra la base de datos
│   │   ├── BiographyPage.tsx       # Página de inicio con biografía, principios y equipo técnico
│   │   ├── ClientPortalPage.tsx    # Portal privado de acceso por PIN
│   │   ├── CloudSyncToast.tsx      # Ventanas emergentes de estado de guardado en Firestore (verde/rojo)
│   │   ├── ContactPage.tsx         # Contacto, WhatsApp directo, tarifas y formulario
│   │   ├── FavoriteAuthModal.tsx   # Registro obligatorio de cliente al seleccionar fotos favoritas
│   │   ├── Footer.tsx              # Pie de página dinámico con enlaces fijos (Biografía, Instagram, WhatsApp)
│   │   ├── GalleryGrid.tsx         # Catálogo público con orden manual, filtros, vistas, favoritos y vigencia
│   │   ├── GalleryView.tsx         # Vista editorial de galería, ordenamiento rápido, descargas y compartir
│   │   ├── InstagramFeed.tsx       # Carrusel oficial @lente.abierto.mx con enlace directo por publicación
│   │   ├── Navbar.tsx              # Barra de navegación unificada (Biografía, Galerías, Portal, Contacto)
│   │   ├── PhotoLightbox.tsx       # Visor de alta definición con zoom, ordenamiento, EXIF y descarga
│   │   ├── PinModal.tsx            # Verificación de PIN, solicitud por WhatsApp y registro de descargas
│   │   ├── UserProfilePage.tsx     # Perfil editable de usuario y colecciones asignadas
│   │   └── WatermarkCanvas.tsx     # Motor de renderizado de marcas de agua en tiempo real
│   ├── services/
│   │   ├── cloudFeedback.ts        # Emisor global de alertas de éxito/error de sincronización
│   │   ├── firebase.ts             # Inicialización de Firebase App, Firestore y token de Drive
│   │   ├── firestoreSync.ts        # Suscripciones en vivo, escritura y utilidades Super Admin
│   │   ├── googleDrive.ts          # Lector de carpetas Drive / Apps Script y extracción de fotos
│   │   ├── storage.ts              # Estado predeterminado, helpers de compartir, vigencia, cola y logs
│   │   ├── userService.ts          # Gestión de usuarios en BD, sesiones y validación secreta
│   │   └── zipDownloader.ts        # Generación cliente de archivos .ZIP con JSZip
│   ├── utils/
│   │   ├── imageCompressor.ts      # Compresión optimizada para portadas, logotipos y publicaciones
│   │   └── themePresets.ts         # Presets de temas de temporada y contraste CSS
│   ├── types/
│   │   └── index.ts                # Interfaces TypeScript del dominio completo
│   ├── App.tsx                     # Router principal, historial del navegador y tema global
│   ├── index.css                   # Tailwind CSS v4 y variables CSS dinámicas de tema
│   └── main.tsx                    # Punto de entrada React 19
├── index.html                      # Plantilla HTML principal y metadatos SEO
├── package.json                    # Dependencias y scripts (dev, build, lint)
├── tsconfig.json                   # Configuración de TypeScript
└── vite.config.ts                  # Configuración de Vite y proxy de desarrollo
```

---

## 🛠️ Stack Tecnológico

- **Frontend Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server:** [Vite 8](https://vitejs.dev/)
- **Base de Datos en Tiempo Real:** [Firebase Cloud Firestore](https://firebase.google.com/)
- **Estilos & Temas:** [Tailwind CSS v4](https://tailwindcss.com/) + CSS Custom Properties dinámicas
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Compresión `.ZIP`:** [JSZip](https://stuk.github.io/jszip/)
- **Tipografías:** Cormorant Garamond (editorial) y Plus Jakarta Sans / Inter (interfaz)

---

## 🚀 Instalación y Desarrollo Local

Requisitos previos: [Node.js](https://nodejs.org/) v18 o superior.

```bash
# 1. Clonar el repositorio
git clone https://github.com/mrcastillos/lenteabiertomx.git

# 2. Entrar en la carpeta del proyecto
cd lenteabiertomx

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo (puerto 3000)
npm run dev
```

### Compilación y Verificación

```bash
# Generar compilación optimizada para producción en /dist
npm run build

# Verificar tipos de TypeScript
npm run lint
```

---

## 🌐 Despliegue y Publicación

### Opción A: Vercel (Recomendado)
1. Conecta tu repositorio en [Vercel](https://vercel.com) (`Add New... → Project`).
2. Vercel detecta automáticamente Vite (`npm run build` / salida `dist`).
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

> 💡 **Recomendación de Producción:** Si planeas abrir el acceso administrativo a múltiples equipos externos en entornos de alto tráfico, revisa y ajusta `firestore.rules` para reforzar aún más las políticas de autenticación según tus necesidades.

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
