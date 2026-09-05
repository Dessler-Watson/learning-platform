 EduPlay

## 1. Descripcion general

EduPlay es una plataforma educativa basada en juegos, disenada para apoyar el aprendizaje de estudiantes de primaria y secundaria mediante actividades interactivas y dinamicas de gamificacion.

La plataforma busca resolver la dificultad de complementar la ensenanza tradicional con herramientas digitales que permitan a los estudiantes aprender de una manera mas entretenida, participativa y motivadora.

Permite que los docentes creen cursos, actividades y salas de juego, donde pueden preparar preguntas y utilizar herramientas de inteligencia artificial como apoyo para la generacion de contenido educativo. Por otro lado, los estudiantes pueden ingresar a las salas mediante un codigo proporcionado por el docente, responder actividades y obtener puntos y rangos de acuerdo con su desempeno.

De esta manera, EduPlay combina educacion, videojuegos, gamificacion e inteligencia artificial para crear una experiencia de aprendizaje mas interactiva y competitiva.

## 2. Tecnologias utilizadas

- Next.js: Framework principal para la estructura y API.
- React: Motor de la interfaz de usuario.
- TypeScript: Tipado estatico para mayor seguridad en el codigo.
- Tailwind CSS: Estilos para la interfaz visual.
- Three.js y React Three Fiber: Renderizado de los mundos 3D en los juegos.
- React Three Rapier: Motor de fisica dentro de los entornos 3D.
- Framer Motion: Animaciones en la interfaz de usuario.
- Zustand: Gestion del estado global de la aplicacion.
- React Hook Form + Zod: Validacion y manejo de formularios.
- Lucide React: Libreria de iconos.
- Google Gemini API: Inteligencia artificial para generar preguntas y contenido.

## 3. Estructura del proyecto

A continuacion se detalla la organizacion de carpetas y la funcion de cada una:

```
EduPlay/
├── src/                          # Codigo fuente de la aplicacion
│   ├── app/                      # Next.js App Router (Rutas y Pages)
│   │   ├── api/                  # Endpoints del servidor (API Routes)
│   │   ├── camino-decisiones/    # Juego 3D: Camino de las Decisiones
│   │   ├── lava-conocimiento/    # Juego 3D: Lava del Conocimiento
│   │   ├── panel/                # Panel del Docente (CRUD, Monitoreo, Admin)
│   │   └── ...                   # Rutas del estudiante (login, registro, perfil)
│   │
│   ├── games/                    # Logica especifica de los juegos (mundo, UI, config)
│   ├── engine/                   # Motor 3D y utilidades de Three.js
│   ├── shared/                   # Codigo compartido (avatares, configs, refs)
│   ├── stores/                   # Estado global (Zustand stores)
│   ├── lib/                      # Utilidades y conexion a datos JSON
│   ├── ui/                       # Componentes visuales y pantallas reutilizables
│   └── education/                # Banco de preguntas estatico
│
├── data/                         # Base de datos local (archivos JSON)
├── public/                       # Imagenes, avatares y recursos estaticos
├── package.json                  # Configuracion del proyecto y dependencias
└── README.md                     # Documentacion del proyecto
```

## 4. Instalacion basica

### Requisitos

- Node.js 18.17 o superior.
- npm o pnpm.

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
GEMINI_API_KEY=tu_clave_aqui
```

Nota: La clave es necesaria unicamente para la generacion de preguntas con IA desde el panel docente.

4. No requiere instalacion de base de datos:

EduPlay utiliza archivos JSON en la carpeta `data/` como almacenamiento local. No se requiere configurar servidores SQL ni ejecutar migraciones.

## 5. Ejecucion del sistema

### Modo desarrollo

```bash
npm run dev
```

Acceder desde el navegador en `http://localhost:3000`.

### Rutas principales

- Raiz: Pantalla de inicio y seleccion de rol.
- /estudiante: Menu de acceso del estudiante.
- /ingresar: Inicio de sesion.
- /registro: Registro de nuevo usuario.
- /panel: Panel de control del docente.
- /camino-decisiones: Juego interactivo 3D.
- /lava-conocimiento: Juego interactivo 3D.

### Produccion

Para compilar y ejecutar en produccion:

```bash
npm run build
npm run start
```

## 6. Seguridad y Buenas Practicas

EduPlay aplica diferentes medidas y buenas practicas para proteger la informacion de los usuarios y mantener un funcionamiento seguro de la plataforma.

- Control de acceso por roles: la plataforma diferencia entre usuarios estudiantes y docentes, permitiendo que cada tipo de usuario acceda a las funcionalidades correspondientes.
- Proteccion de credenciales: las credenciales y configuraciones sensibles no deben almacenarse directamente dentro del codigo fuente, sino mediante variables de entorno.
- Validacion de datos: los datos introducidos por los usuarios deben ser validados antes de ser procesados, reduciendo el riesgo de informacion incorrecta o manipulada.
- Autorizacion de operaciones: las acciones relacionadas con cursos, salas, actividades y contenido docente deben estar restringidas a los usuarios que tengan los permisos correspondientes.
- Proteccion de informacion sensible: las claves de API y demas datos privados utilizados por los servicios externos se mantienen mediante variables de entorno y no se incluyen directamente en el codigo publico.
