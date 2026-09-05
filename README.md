# EduPlay

## 1. Descripcion general

EduPlay es una plataforma educativa basada en juegos, disenada para apoyar el aprendizaje de estudiantes de primaria y secundaria mediante actividades interactivas y dinamicas de gamificacion.

La plataforma busca resolver la dificultad de complementar la ensenanza tradicional con herramientas digitales que permitan a los estudiantes aprender de una manera mas entretenida, participativa y motivadora.

Permite que los docentes creen cursos, actividades y salas de juego, donde pueden preparar preguntas y utilizar herramientas de inteligencia artificial como apoyo para la generacion de contenido educativo. Por otro lado, los estudiantes pueden ingresar a las salas mediante un codigo proporcionado por el docente, responder actividades y obtener puntos y rangos de acuerdo con su desempeno.

De esta manera, EduPlay combina educacion, videojuegos, gamificacion e inteligencia artificial para crear una experiencia de aprendizaje mas interactiva y competitiva.

## 2. Tecnologias utilizadas

| Tecnologia | Version | Uso en EduPlay |
|---|---|---|
| Next.js | 14.2 | Framework principal (App Router, API Routes, SSR/SSG) |
| React | 18.3 | Motor de componentes UI y renderizado |
| TypeScript | 5.4 | Tipado estatico en todo el proyecto |
| Tailwind CSS | 3.4 | Estilos utilitarios para toda la interfaz |
| Three.js | 0.160 | Motor de renderizado 3D para los juegos |
| @react-three/fiber | 8.15 | Puente React -- Three.js para construir escenas 3D con componentes |
| @react-three/drei | 9.88 | Utilidades 3D (texto 3D, Html embebido, contact shadows) |
| @react-three/rapier | 1.3 | Motor de fisica en los juegos 3D (gravedad, colisiones, cuerpos rigidos) |
| Framer Motion | 11.0 | Animaciones de transicion, hover, modales y feedback visual |
| Zustand | 4.5 | Gestion de estado global (juegos y panel docente) |
| React Hook Form | 7.82 | Formularios de login, registro y perfil con control eficiente |
| Zod | 4.4 | Validacion de schemas para formularios y respuestas de IA |
| @hookform/resolvers | 5.4 | Integracion Zod + React Hook Form |
| Lucide React | 1.35 | Biblioteca de iconos en toda la interfaz |
| clsx + tailwind-merge | 2.1 / 3.6 | Composicion condicional de clases Tailwind |
| class-variance-authority | 0.7 | Variantes tipadas de componentes UI del panel |
| @radix-ui (dialog, alert-dialog, avatar, label, select, slot) | v1-v2 | Componentes accesibles del panel docente |
| Google Gemini API | gemini-3.5-flash | Generacion de preguntas educativas con IA |

## 3. Instalacion basica

### Requisitos

- Node.js 18.17 o superior
- npm (incluido con Node.js) o pnpm

### Pasos

1. Clonar el repositorio:

```bash
git clone https://github.com/Dessler-Watson/learning-platform.git
cd learning-platform
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variable de entorno para IA:

Crear un archivo `.env` en la raiz del proyecto con la siguiente variable:

```
GEMINI_API_KEY=tu_api_key_aqui
```

La clave de Google Gemini es necesaria unicamente para la funcion de generacion de preguntas con IA desde el panel docente. Sin ella, la aplicacion funciona normalmente pero el boton de "Generar con IA" devolvera un error. La clave se obtiene en Google AI Studio (https://aistudio.google.com/).

4. No requiere base de datos:

EduPlay utiliza archivos JSON locales (`data/*.json`) como base de datos en disco. No se necesita instalar PostgreSQL, MySQL, ni ejecutar migraciones de Prisma. Los datos se leen y escriben directamente en los archivos de la carpeta `data/`.

5. (Opcional) Verificar la instalacion:

```bash
npm run build
```

## 4. Ejecucion del sistema

### Modo desarrollo

```bash
npm run dev
```

La aplicacion se inicia en http://localhost:3000

### Acceso desde el navegador

| Ruta | Funcion |
|---|---|
| http://localhost:3000 | Pantalla principal (selector de rol: Estudiante / Profesor) |
| http://localhost:3000/estudiante | Menu de acceso del estudiante |
| http://localhost:3000/ingresar | Inicio de sesion del estudiante |
| http://localhost:3000/registro | Registro de nuevo estudiante |
| http://localhost:3000/invitado | Acceso rapido sin cuenta |
| http://localhost:3000/inicio | Panel/dashboard del estudiante |
| http://localhost:3000/camino-decisiones | Juego: Camino de las Decisiones |
| http://localhost:3000/lava-conocimiento | Juego: Lava del Conocimiento |
| http://localhost:3000/panel | Panel docente |
| http://localhost:3000/panel/login | Inicio de sesion del docente |
| http://localhost:3000/panel/register | Registro del docente |

### Produccion

```bash
npm run build
npm run start
```

## 5. Seguridad y Buenas Practicas

EduPlay aplica diferentes medidas y buenas practicas para proteger la informacion de los usuarios y mantener un funcionamiento seguro de la plataforma.

- Control de acceso por roles: la plataforma diferencia entre usuarios estudiantes y docentes, permitiendo que cada tipo de usuario acceda a las funcionalidades correspondientes.
- Proteccion de credenciales: las credenciales y configuraciones sensibles no deben almacenarse directamente dentro del codigo fuente, sino mediante variables de entorno.
- Validacion de datos: los datos introducidos por los usuarios deben ser validados antes de ser procesados, reduciendo el riesgo de informacion incorrecta o manipulada.
- Autorizacion de operaciones: las acciones relacionadas con cursos, salas, actividades y contenido docente deben estar restringidas a los usuarios que tengan los permisos correspondientes.
- Proteccion de informacion sensible: las claves de API y demas datos privados utilizados por los servicios externos se mantienen mediante variables de entorno y no se incluyen directamente en el codigo publico.
