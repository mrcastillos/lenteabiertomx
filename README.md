# Lente Abierto MX · Plataforma de Galerías & Portafolio Fotográfico de Autor

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://lenteabiertomx.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Instagram](https://img.shields.io/badge/@lente.abierto.mx-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/lente.abierto.mx)

Plataforma web profesional de exhibición, entrega privada y comercialización fotográfica diseñada a la medida para **Lente Abierto MX** (@lente.abierto.mx), dirigida por el fotógrafo **Martín Castillo**. 

Inspirada en el estándar internacional de la industria (Pixieset, Pic-Time y ShootProof), ofrece una experiencia de alta gama para parejas y clientes editoriales, combinando una estética editorial cinematográfica con herramientas avanzadas de gestión, seguridad anticopia, descarga en alta resolución y trazabilidad de clientes.

🌐 **Sitio en Producción:** [https://lenteabiertomx.vercel.app](https://lenteabiertomx.vercel.app)  
📸 **Instagram Oficial:** [@lente.abierto.mx](https://instagram.com/lente.abierto.mx)  
📞 **Contacto Directo:** +52 777 374 3420 · `casm830903@gmail.com`

---

## 📑 Tabla de Contenidos

1. [Visión General & Filosofía](#-visión-general--filosofía)
2. [Características Principales](#-características-principales)
   - [Galerías Editoriales & Portafolio de Autor](#1-galerías-editoriales--portafolio-de-autor)
   - [Portal Privado de Clientes](#2-portal-privado-de-clientes-acceso-seguro-por-pin)
   - [Sistema de Descargas (.JPG y .ZIP Masivo)](#3-sistema-de-descargas-alta-definición)
   - [Selección de Favoritos para Maquila de Álbumes](#4-selección-de-favoritos-para-maquila-de-álbumes)
   - [Seguridad Anticopia & Marcas de Agua Dinámicas](#5-seguridad-anticopia--marcas-de-agua-dinámicas)
   - [Feed Dinámico de Instagram](#6-feed-dinámico-de-instagram-lenteabiertomx)
   - [Panel de Control Administrativo (CMS Completo)](#7-panel-de-control-administrativo-cms-completo)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Stack Tecnológico](#-stack-tecnológico)
5. [Instalación y Desarrollo Local](#-instalación-y-desarrollo-local)
6. [Despliegue y Publicación](#-despliegue-y-publicación)
   - [Despliegue en Vercel](#opción-a-vercel-recomendado-producción-actual)
   - [Despliegue en GitHub Pages](#opción-b-github-pages-vía-github-actions)
7. [Seguridad y Credenciales](#-seguridad-y-credenciales)
8. [Licencia & Créditos](#-licencia--créditos)

---

## 🌟 Visión General & Filosofía

**Lente Abierto MX** documenta bodas de destino, retratos en claroscuro y arquitectura mexicana en luz natural en destinos como **Cuernavaca, CDMX, Oaxaca, San Miguel de Allende y Riviera Maya**.

Esta plataforma elimina la dependencia de suscripciones mensuales a servicios externos, otorgando al fotógrafo el **control total e independiente** de sus entregas, sus clientes y sus contenidos, permitiendo:

- Entregar galerías de boda completas con claves PIN privadas.
- Conocer exactamente qué cliente descarga fotografías o selecciona favoritos para su álbum físico.
- Modificar textos, biografía, precios, paquetes y fotos de perfil directamente desde el backend sin tocar código fuente.
- Sincronizar colecciones enteras desde carpetas de **Google Drive**.

---

## ✨ Características Principales

### 1. Galerías Editoriales & Portafolio de Autor
- **Diseño Editorial:** Cuadrículas fluidas (masonry dinámico) que respetan la proporción nativa de cada fotografía (horizontal, vertical, panorámica).
- **Filtro de Categorías Dinámico:** Bodas, Retratos, Editorial, Arquitectura, Eventos, XV Años y Maternidad (creación y edición de categorías desde el backend).
- **Visor Lightbox de Alta Definición:** Navegación por teclado (flechas), zoom táctil, pantalla completa y visualización en tiempo real de metadatos **EXIF fotográficos** (cuerpo de cámara, lente, apertura, velocidad de obturación e ISO).

### 2. Portal Privado de Clientes (Acceso Seguro por PIN)
- **100% Confidencial:** A diferencia de sitios públicos, las contraseñas y claves PIN **nunca se exponen en pantalla**.
- Los clientes ingresan su clave PIN exclusiva (enviada por el fotógrafo vía WhatsApp o correo) para desbloquear su colección privada.
- Enlace directo a WhatsApp de soporte (+52 777 374 3420) para clientes que requieran asistencia con su clave.

### 3. Sistema de Descargas (Alta Definición)
- **Descarga Individual .JPG:** Descarga limpia directa con cabeceras de disposición de archivo nativas del navegador (evita que la imagen se abra como una simple pestaña de Google).
- **Descarga Masiva en .ZIP:** Compresión en tiempo real en el cliente mediante **JSZip**, empaquetando todas las fotografías de la colección en máxima resolución.
- **Auditoría de Descargas (Backend Log):** Registra nombre del cliente, correo electrónico validado, teléfono, galería descargada y marca de tiempo exacta para seguimiento de entrega.

### 4. Selección de Favoritos para Maquila de Álbumes
- **Experiencia de Selección:** Los clientes hacen clic en el icono de corazón ❤️ para armar su selección de fotografías preferidas para el álbum impreso o retoque final.
- **Captura de Datos:** Validación de correo y datos del cliente en la primera selección.
- **Herramienta para el Fotógrafo en el Backend:**
  - Visualización de selecciones agrupadas por cliente.
  - **Botón «Copiar Lista de Fotos»:** Copia en un clic todos los nombres de archivo para pegarlos directo en la barra de búsqueda de **Adobe Lightroom** o enviarlos al laboratorio de encuadernación.
  - **Botón Directo de WhatsApp:** Inicia chat con el cliente con el conteo de fotos seleccionadas pre-redactado.
  - **Exportación CSV:** Descarga la relación completa de selecciones en formato compatible con Excel.

### 5. Seguridad Anticopia & Marcas de Agua Dinámicas
- **Marcas de Agua Personalizables:** Renderizado sobre las pruebas fotográficas con texto de autor (`LENTE ABIERTO MX`), opacidad graduable y estilos configurables (patrón diagonal o sello central).
- **Protección Anticopia:** Desactivación de menú contextual (clic derecho) e inhabilitación de arrastre de imágenes para proteger la autoría del material antes del pago o entrega final.

### 6. Feed Dinámico de Instagram (@lente.abierto.mx)
- Carrusel interactivo integrado en el pie del portafolio con la identidad de `@lente.abierto.mx`.
- **Modo Aleatorio (Shuffle):** Permite explorar diferentes tomas del feed.
- **Sincronización Inteligente:** Botón en el CMS para sincronizar con 1 clic las fotos de las galerías reales con las tarjetas de Instagram.
- Enlaces directos a las publicaciones oficiales y al perfil de la red social.

### 7. Panel de Control Administrativo (CMS Completo)
Acceso privado para el fotógrafo con múltiples módulos operativos:

| Módulo | Funcionalidades |
| :--- | :--- |
| **Colecciones & Galerías** | Crear nuevas galerías, asignar títulos, slugs, portadas, fechas, categorías y claves PIN de apertura y descarga. |
| **Subida & Google Drive** | Importar fotos locales o sincronizar carpetas de Google Drive mediante Google Apps Script API o enlaces públicos. |
| **Editor de Fotografías** | Edición de títulos, pies de foto, orientación, metadatos EXIF y ordenación por arrastre. |
| **Marcas de Agua** | Activar/desactivar, cambiar texto, tamaño, opacidad y patrón de superposición en tiempo real. |
| **CMS Biografía & Perfil** | Actualizar fotografía de perfil de Martín Castillo, manifiesto, años de experiencia, premios y principios de trabajo sin tocar HTML. |
| **Tarifas & Paquetes** | Configurar servicios de cobertura (Paquete Esencial, Documental Completo, Cobertura Master), costos, entregables y cotizador. |
| **Seguridad & Colaboradores** | Cambiar credenciales del Administrador, crear cuentas de Asistente o Editor con permisos diferenciados. |
| **Auditoría & CRM** | Historial de descargas con PIN, Registro de Favoritos para álbumes y bandeja de entrada de cotizaciones de clientes. |

---

## 📁 Estructura del Proyecto

```text
lenteabiertomx/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automatización de GitHub Pages con GitHub Actions
├── api/
│   └── download.ts             # Función Serverless para streaming y descarga limpia (.jpg / .zip)
├── public/
│   ├── assets/                 # Activos gráficos, logos e iconografía
│   └── favicon.svg             # Favicon vectorial de Lente Abierto MX
├── src/
│   ├── components/
│   │   ├── AdminPanel.tsx          # Panel CMS completo con todas las pestañas de gestión
│   │   ├── BiographyPage.tsx       # Sección editorial de biografía y filosofía
│   │   ├── ClientPortalPage.tsx    # Portal privado de acceso por PIN (sin códigos expuestos)
│   │   ├── ContactPage.tsx         # Formulario de contacto, cotizaciones y WhatsApp
│   │   ├── FavoriteAuthModal.tsx   # Modal de registro de datos del cliente para favoritos
│   │   ├── GalleryCard.tsx         # Tarjeta de presentación de colección con badges
│   │   ├── GalleryView.tsx         # Vista de galería completa con selector y descargas
│   │   ├── Hero.tsx                # Cabecera editorial con llamadas a la acción
│   │   ├── InstagramFeed.tsx       # Feed interactivo oficial de @lente.abierto.mx
│   │   ├── Navbar.tsx              # Barra de navegación principal y estado de sesión
│   │   ├── PhotoLightbox.tsx       # Visor inmersivo con EXIF, zoom y favoritos
│   │   ├── PricingModal.tsx        # Detalle de paquetes, coberturas y tarifas
│   │   └── WatermarkOverlay.tsx    # Motor de renderizado de marcas de agua dinámicas
│   ├── services/
│   │   ├── storage.ts              # Persistencia local con datos iniciales de autor
│   │   └── zipDownloader.ts        # Motor de compresión y descarga por lotes
│   ├── types/
│   │   └── index.ts                # Interfaces TypeScript (Galerías, EXIF, Logs, CMS)
│   ├── App.tsx                     # Orquestador principal de vistas y estados
│   ├── index.css                   # Importación y configuración de Tailwind CSS
│   └── main.tsx                    # Punto de entrada de React 19
├── index.html                  # Plantilla HTML con tipografía Cormorant Garamond & metadatos SEO
├── package.json                # Dependencias del proyecto y scripts
├── tsconfig.json               # Configuración de compilador TypeScript
├── vercel.json                 # Enrutamiento de SPA y cabeceras para Vercel
└── vite.config.ts              # Configuración de Vite, Tailwind CSS y Proxy de descargas
```

---

## 🛠️ Stack Tecnológico

- **Frontend Core:** [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Bundler & Dev Server:** [Vite 6 / 8](https://vitejs.dev/) (con rutas base relativas para compatibilidad universal)
- **Estilos & Diseño:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Empaquetado de Archivos:** [JSZip](https://stuk.github.io/jszip/) para la generación cliente de archivos `.zip`
- **Tipografías:** Cormorant Garamond (títulos editoriales) y Plus Jakarta Sans (interfaz moderna y legible)
- **Despliegue Serverless:** Compatible de forma nativa con **Vercel**, **Netlify** y **GitHub Pages**.

---

## 🚀 Instalación y Desarrollo Local

Requisitos previos: Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

```bash
# 1. Clonar el repositorio
git clone https://github.com/mrcastillos/lenteabiertomx.git

# 2. Entrar en la carpeta del proyecto
cd lenteabiertomx

# 3. Instalar las dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm run dev
```

El servidor local se iniciará de forma predeterminada en `http://localhost:3000` (o `http://localhost:5173`).

### Compilación para Producción

Para compilar el proyecto y generar los archivos estáticos listos para cualquier servidor web:

```bash
npm run build
```

El resultado se genera en la carpeta `/dist`.

Para verificar la integridad del código TypeScript y sintaxis:

```bash
npm run lint
```

---

## 🌐 Despliegue y Publicación

### Opción A: Vercel (Recomendado & Enlace Actual)

La plataforma se encuentra actualmente desplegada y funcionando en:  
👉 **[https://lenteabiertomx.vercel.app](https://lenteabiertomx.vercel.app)**

Pasos para sincronizar con tu propia cuenta de Vercel:
1. Inicia sesión en [Vercel](https://vercel.com) con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** → **"Project"**.
3. Selecciona el repositorio **`lenteabiertomx`**.
4. Vercel detectará el proyecto Vite automáticamente. Haz clic en **Deploy**.
5. Cada nuevo commit en la rama principal (`main`) actualizará el sitio en vivo en cuestión de segundos.

### Opción B: GitHub Pages (vía GitHub Actions)

El repositorio incluye el archivo `.github/workflows/deploy.yml` para compilar y desplegar automáticamente en GitHub Pages sin costo:

1. En tu repositorio de GitHub, ve a la pestaña **Settings** (Configuración).
2. En la barra lateral izquierda, selecciona **Pages**.
3. En la sección **Build and deployment** → **Source**, selecciona:  
   👉 **`GitHub Actions`**.
4. ¡Listo! La acción compilará el código y publicará tu sitio en `https://mrcastillos.github.io/lenteabiertomx/`.

---

## 🔐 Seguridad y Credenciales

### Acceso Inicial al Panel de Administración

Para acceder al CMS del fotógrafo:
1. Haz clic en el icono de **candado / llave** en la barra superior o ve a la pestaña **Administración**.
2. Ingresa las credenciales maestras:
   - **Usuario:** `admi`
   - **Contraseña:** `Mar.830903`

> 💡 **Nota de Seguridad:** Tanto el nombre de usuario como la contraseña y los correos de notificación pueden modificarse en cualquier momento desde la pestaña **Seguridad & Colaboradores** dentro del propio panel.

---

## 📩 Contacto & Autor

* **Fotógrafo & Director:** Martín Castillo
* **Marca:** Lente Abierto MX
* **Instagram:** [@lente.abierto.mx](https://instagram.com/lente.abierto.mx)
* **WhatsApp:** [+52 777 374 3420](https://wa.me/527773743420)
* **Correo Electrónico:** [casm830903@gmail.com](mailto:casm830903@gmail.com)
* **Ubicación:** Cuernavaca · Ciudad de México · Cobertura en toda la República Mexicana y Destinos Internacionales.

---

*Lente Abierto MX © Todos los derechos reservados. Desarrollado como plataforma de alta fidelidad para fotografía documental y de autor.*
