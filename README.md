# Lente Abierto MX - Portafolio y Galerías Pixieset

Portafolio fotográfico profesional para **Lente Abierto MX** (@lente.abierto.mx) estilo Pixieset, con galerías con PIN de descarga, marcas de agua anticaptura dinámicas, descarga individual y completa en ZIP, integración con Google Drive, portal de clientes y panel de administración completo.

---

## ⚠️ ¿Por qué se veía en blanco en GitHub?

En React + Vite + TypeScript, los navegadores **no pueden leer directamente archivos `.tsx`** (como `src/main.tsx`).
Cuando subes los archivos directamente a GitHub y abres `index.html` o usas GitHub Pages básico sin compilar, el navegador intenta leer `/src/main.tsx` como texto plano y por eso la pantalla se queda **completamente en blanco**.

Para que funcione en internet, el proyecto debe **compilarse** (convertir el TypeScript en JavaScript estándar dentro de la carpeta `dist/`).

Hemos configurado **3 formas sencillísimas** para que funcione:

---

## 🚀 Opción 1: Activar GitHub Pages automático (Recomendada - 100% Gratis)

Ya incluimos el archivo de automatización en `.github/workflows/deploy.yml` y la ruta relativa en `vite.config.ts`. Solo debes activar una casilla en tu repositorio de GitHub:

1. Ve a tu repositorio en GitHub: `https://github.com/mrcastillos/lenteabiertomx`
2. Haz clic en la pestaña **Settings** (Configuración) arriba a la derecha.
3. En el menú de la izquierda, haz clic en **Pages**.
4. En la sección **Build and deployment** -> **Source**, cambia de *"Deploy from a branch"* a:
   👉 **`GitHub Actions`**
5. ¡Listo! Cada vez que subas cambios o vayas a la pestaña **Actions** y ejecutes el flujo, GitHub compilará el proyecto automáticamente y te dará el enlace público funcionando al 100% (ejemplo: `https://mrcastillos.github.io/lenteabiertomx/`).

---

## ⚡ Opción 2: Despliegue en 1 clic en Vercel o Netlify (Súper Rápido)

Vercel y Netlify compilan automáticamente proyectos de Vite sin configurar nada:

1. Entra a [Vercel.com](https://vercel.com) o [Netlify.com](https://netlify.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New Project"** (o "Import repository").
3. Selecciona tu repositorio **`lenteabiertomx`**.
4. Deja todo por defecto (detectará automáticamente que es Vite) y haz clic en **Deploy**.
5. En 30 segundos tendrás tu sitio en vivo con HTTPS gratuito y dominio personalizado si lo deseas.

---

## 💻 Opción 3: Probarlo en tu computadora localmente

Si tienes Node.js instalado en tu computadora:

```bash
# 1. Clona tu repositorio
git clone https://github.com/mrcastillos/lenteabiertomx.git
cd lenteabiertomx

# 2. Instala las dependencias
npm install

# 3. Inicia el servidor de desarrollo local
npm run dev
```

Abre en tu navegador la dirección que indique la terminal (usualmente `http://localhost:3000` o `http://localhost:5173`).

Para generar los archivos estáticos listos para subir a cualquier hosting:
```bash
npm run build
```
Esto generará la carpeta `dist/` con todo el sitio compilado.

---

## 🔐 Credenciales del Panel de Administración

- **Usuario:** `admi`
- **Contraseña:** `Mar.830903`
*(Ambos pueden cambiarse desde el Panel de Administración en la pestaña de Seguridad y Colaboradores)*.
