# EduPlay

## 1. Descripcion general

EduPlay es una plataforma educativa basada en juegos, disenada para apoyar el aprendizaje de estudiantes de primaria y secundaria mediante actividades interactivas y dinamicas de gamificacion.

La plataforma busca resolver la dificultad de complementar la ensenanza tradicional con herramientas digitales que permitan a los estudiantes aprender de una manera mas entretenida, participativa y motivadora.

Permite que los docentes creen cursos, actividades y salas de juego, donde pueden preparar preguntas y utilizar herramientas de inteligencia artificial como apoyo para la generacion de contenido educativo. Por otro lado, los estudiantes pueden ingresar a las salas mediante un codigo proporcionado por el docente, responder actividades y obtener puntos y rangos de acuerdo con su desempeno.

De esta manera, EduPlay combina educacion, videojuegos, gamificacion e inteligencia artificial para crear una experiencia de aprendizaje mas interactiva y competitiva.

### Roles

- **Estudiante:** Plataforma de juegos 3D donde el estudiante se registra o entra como invitado, accede a su dashboard, selecciona juegos, se une a salas con codigos y participa en partidas educativas con graficos 3D en tiempo real.
- **Docente:** Sub-aplicacion administrativa donde el docente puede crear cursos, gestionar preguntas (con generacion asistida por IA), crear salas de juego con codigos de acceso, monitorear partidas en vivo y revisar resultados individuales y grupales.
- **Administrador:** Panel avanzado para gestionar cuentas de docentes, crear cuentas de docentes y administradores, y administrar instituciones.

## 2. Tecnologias utilizadas

- Next.js: Framework principal para la estructura y API.
- React: Motor de la interfaz de usuario.
- TypeScript: Tipado estatico para mayor seguridad en el codigo.
- Tailwind CSS: Estilos para la interfaz visual.
- Three.js (0.160): Biblioteca de graficos 3D para WebGL.
- React Three Fiber (8.15): Integracion declarativa de Three.js con React.
- React Three Rapier (1.3): Motor de fisicas para colisiones, gravedad y movimiento.
- React Three Drei (9.88): Utilidades y helpers para R3F (camaras, luces, textos 3D).
- Framer Motion: Animaciones en la interfaz de usuario.
- Zustand: Gestion del estado global de la aplicacion.
- React Hook Form + Zod: Validacion y manejo de formularios.
- Lucide React: Libreria de iconos.
- Google Gemini API: Inteligencia artificial para generar preguntas y contenido.

## 3. Estructura del proyecto

```
EduPlay/
|
|--- Configuracion y raiz
|    .gitignore
|    next.config.js
|    package.json
|    tailwind.config.ts
|    tsconfig.json
|    README.md
|
|--- src/
|    |
|    |--- app/                         # Next.js App Router (Paginas y API)
|    |    |--- api/                    # Endpoints REST del servidor
|    |    |    |--- ai/                # Generacion de contenido con IA
|    |    |    |--- estudiantes/       # Perfil y datos del alumno
|    |    |    |--- salas/             # Creacion y union a salas
|    |    |    |--- cursos/            # Gestion de cursos
|    |    |    |--- preguntas/         # Banco de preguntas
|    |    |    |--- dashboard/         # Metricas del docente
|    |    |
|    |    |--- camino-decisiones/      # Ruta del Juego 1 (3D)
|    |    |--- lava-conocimiento/      # Ruta del Juego 2 (3D)
|    |    |--- panel/                  # PANEL DOCENTE COMPLETO
|    |    |    |--- admin/             # Gestion de administradores y docentes
|    |    |    |    |--- docentes/     # CRUD de docentes y admins
|    |    |    |--- components/        # Layout, Sidebar, Tarjetas, Modales
|    |    |    |    |--- layout/       # Sidebar, Topbar
|    |    |    |    |--- shared/       # GameCard, SearchBar, EmptyState, BackButton, AIGenerateModal
|    |    |    |--- cursos/            # CRUD de cursos y actividades
|    |    |    |    |--- [id]/         # Detalle de curso y preguntas
|    |    |    |--- juegos/            # Cursos por modo de juego
|    |    |    |    |--- [id]/         # Cursos filtrados por juego
|    |    |    |--- salas/             # Crear sala, Lobby, Monitor en vivo
|    |    |    |    |--- crear/        # Formulario de creacion
|    |    |    |    |--- [id]/         # Lobby, monitoreo y resultados
|    |    |    |--- login/             # Autenticacion docente
|    |    |    |--- register/          # Registro de docente
|    |    |    |--- perfil/            # Perfil del docente
|    |    |    |--- configuracion/     # Configuracion general
|    |    |    |--- services/          # Servicios de datos (cursos, salas, preguntas)
|    |    |    |--- store/             # Estado global del panel (Zustand)
|    |    |    |--- types/             # Definiciones de tipos TypeScript
|    |    |    |--- utils/             # Utilidades y helpers
|    |    |    |--- hooks/             # Hooks personalizados
|    |    |    |--- lib/               # Libreria de audio, IA, etc.
|    |    |    |--- ui/                # Componentes visuales (Button, Card, Dialog, etc.)
|    |    |
|    |    |--- estudiante/             # Menu de acceso estudiante
|    |    |--- ingresar/               # Login estudiante
|    |    |--- inicio/                 # Dashboard del estudiante
|    |    |--- logros/                 # Sistema de recompensas
|    |
|    |--- games/                       # Logica y Escenas 3D
|    |    |--- decision-road/          # Juego 1: Camino de Decisiones
|    |    |    |--- logic/             # Flujo del juego y preguntas
|    |    |    |--- ui/                # HUD y Feedback visual
|    |    |    |--- world/             # Escenario 3D y personajes
|    |    |
|    |    |--- lava-knowledge/         # Juego 2: Lava del Conocimiento
|    |    |    |--- logic/             # Rondas y temporizador
|    |    |    |--- ui/                # HUD
|    |    |    |--- world/             # Arena 3D, lava y torres
|    |
|    |--- engine/                      # Motor Three.js
|    |    |--- camera/                 # Control de camara
|    |    |--- renderer/               # Canvas 3D principal
|    |    |--- lighting/               # Iluminacion de escenas
|    |
|    |--- shared/                      # Codigo compartido
|    |    |--- characters/             # Avatares y control de personaje
|    |    |--- config/                 # Configuraciones generales
|    |    |--- world/                  # Cielo, nubes y efectos
|    |
|    |--- stores/                      # Estado global (Zustand)
|    |    |--- game.store.ts           # Estado Juego 1
|    |    |--- lava.store.ts           # Estado Juego 2
|    |
|    |--- lib/                         # Utilidades
|    |    |--- data.ts                 # Lectura de JSON (Base de datos)
|    |    |--- rooms.ts                # Logica de salas
|    |
|    |--- ui/                          # Componentes de interfaz
|    |    |--- components/             # Botones, Tarjetas, Modales
|    |    |--- screens/                # Pantallas de Login, Registro, Perfil
|    |    |--- tokens/                 # Colores y estilos base
|
|--- data/                             # Base de datos local (JSON)
|    |--- usuarios.json
|    |--- cursos.json
|    |--- salas.json
|    |--- preguntas.json
|    |--- resultados.json
|    |--- avatares.json
|    |--- ... (otros datos)
|
|--- public/                           # Recursos estaticos
     |--- images/
          |--- avatares/               # 9 Iconos culturales
          |--- rangos/                 # Bronce, Plata, Oro, Diamante
          |--- logo.png
          |--- puntos.png
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

Crear un archivo `.env.local` en la raiz del proyecto con la siguiente variable:

```
GEMINI_API_KEY=tu_clave_aqui
```

Nota: La clave es necesaria unicamente para la generacion de preguntas con IA desde el panel docente.

4.  Instalacion de base de datos pendiente:

EduPlay utiliza archivos JSON en la carpeta `data/` El proyecto cuenta ya con su diagrama de base de datos ( PostgreSQL).

## 5. Ejecucion del sistema

### Modo desarrollo

```bash
npm run dev
```

Acceder desde el navegador en `http://localhost:3000`.

### Rutas principales

- `/`: Pantalla de inicio y seleccion de rol.
- `/estudiante`: Menu de acceso del estudiante.
- `/ingresar`: Inicio de sesion estudiante.
- `/registro`: Registro de nuevo estudiante.
- `/inicio`: Dashboard del estudiante.
- `/camino-decisiones`: Juego interactivo 3D.
- `/lava-conocimiento`: Juego interactivo 3D.
- `/panel`: Panel de control del docente.
- `/panel/login`: Inicio de sesion docente.
- `/panel/register`: Registro de docente.
- `/panel/perfil`: Perfil del docente.
- `/panel/cursos`: Gestion de cursos.
- `/panel/salas`: Gestion de salas.
- `/panel/salas/crear`: Crear nueva sala.
- `/panel/admin/docentes`: Administrar docentes y administradores.

### Produccion

Para compilar y ejecutar en produccion:

```bash
npm run build
npm run start
```

## 6. Seguridad y Buenas Practicas

EduPlay aplica diferentes medidas y buenas practicas para proteger la informacion de los usuarios y mantener un funcionamiento seguro de la plataforma.

- Control de acceso por roles: la plataforma diferencia entre usuarios estudiantes, docentes y administradores, permitiendo que cada tipo de usuario acceda a las funcionalidades correspondientes.
- Proteccion de credenciales: las credenciales y configuraciones sensibles no deben almacenarse directamente dentro del codigo fuente, sino mediante variables de entorno.
- Validacion de datos: los datos introducidos por los usuarios deben ser validados antes de ser procesados, reduciendo el riesgo de informacion incorrecta o manipulada.
- Autorizacion de operaciones: las acciones relacionadas con cursos, salas, actividades y contenido docente deben estar restringidas a los usuarios que tengan los permisos correspondientes.
- Proteccion de informacion sensible: las claves de API y demas datos privados utilizados por los servicios externos se mantienen mediante variables de entorno y no se incluyen directamente en el codigo publico.
