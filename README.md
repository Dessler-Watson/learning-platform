# EduPlay

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

```
EduPlay/
|
|--- Configuracion y raiz
|    .gitignore
|    next.config.js
|    package.json
|    postcss.config.js
|    tailwind.config.ts
|    tsconfig.json
|    README.md
|
|--- src/
|    |
|    |--- app/                         # Next.js App Router (paginas y API)
|    |    |
|    |    |--- api/                    # Endpoints REST del servidor
|    |    |    |--- ai/generate/       # Proxy a Google Gemini IA
|    |    |    |--- avatares/          # Lista de avatares
|    |    |    |--- cuestionarios/     # CRUD cuestionarios
|    |    |    |--- cursos/            # CRUD cursos e inscripciones
|    |    |    |--- dashboard/         # KPIs y metricas
|    |    |    |--- estadisticas/      # Estadisticas agregadas
|    |    |    |--- estudiante/perfil/ # Perfil del estudiante
|    |    |    |--- juegos/            # Lista de juegos
|    |    |    |--- preguntas/         # CRUD preguntas
|    |    |    |--- salas/             # CRUD salas
|    |    |    |--- salas/unirse/      # Unirse a sala por codigo
|    |    |    |--- usuarios/          # CRUD usuarios
|    |    |
|    |    |--- camino-decisiones/      # Ruta del juego 3D "Camino de Decisiones"
|    |    |--- configuracion/          # Configuracion de cuenta estudiante
|    |    |--- estudiante/             # Sub-menu de acceso estudiante
|    |    |--- ingresar/               # Login del estudiante
|    |    |--- inicio/                 # Dashboard del estudiante
|    |    |--- invitado/               # Acceso rapido sin cuenta
|    |    |--- lava-conocimiento/      # Ruta del juego 3D "Lava del Conocimiento"
|    |    |--- login-docente/          # Login docente (ruta alternativa)
|    |    |--- logros/                 # Logros y medallas
|    |    |--- panel/                  # PANEL DOCENTE COMPLETO
|    |    |    |--- admin/docentes/    # Administracion de docentes
|    |    |    |--- components/        # Componentes propios del panel
|    |    |    |    |--- layout/       # PanelLayout, Sidebar, Topbar
|    |    |    |    |--- shared/       # AIGenerateModal, AnimatedBackground,
|    |    |    |                       # BackButton, EmptyState, GameCard,
|    |    |    |                       # PageHeader, SearchBar, SoundToggle,
|    |    |    |                       # StatsCard, StatusBadge
|    |    |    |--- cursos/            # CRUD de cursos (lista y preguntas)
|    |    |    |--- cursos/[id]/preguntas/ # Preguntas por curso
|    |    |    |--- data/              # Datos en memoria del panel
|    |    |    |    |--- actividad.ts
|    |    |    |    |--- cursos.ts
|    |    |    |    |--- docentes.ts
|    |    |    |    |--- estudiantes.ts
|    |    |    |    |--- juegos.ts
|    |    |    |    |--- preguntas.ts
|    |    |    |    |--- respuestas.ts
|    |    |    |    |--- resultados.ts
|    |    |    |    |--- salas.ts
|    |    |    |--- hooks/             # useClickLock, useMediaQuery
|    |    |    |--- juegos/[id]/cursos/# Cursos filtrados por juego
|    |    |    |--- lib/               # aiGenerator.ts (cliente IA), audio.ts
|    |    |    |--- login/             # Login del docente
|    |    |    |--- perfil/            # Perfil del docente
|    |    |    |--- register/          # Registro del docente
|    |    |    |--- salas/             # Gestion de salas
|    |    |    |    |--- crear/        # Formulario crear sala
|    |    |    |    |--- [id]/lobby/   # Lobby de espera
|    |    |    |    |--- [id]/monitoreo/ # Monitoreo en vivo
|    |    |    |    |--- [id]/resultados/ # Resumen resultados
|    |    |    |--- services/          # Servicios CRUD (en memoria)
|    |    |    |--- store/             # usePanelStore (Zustand)
|    |    |    |--- types/             # Tipos TypeScript del panel
|    |    |    |--- ui/                # Componentes UI (Radix)
|    |    |    |    |--- avatar.tsx
|    |    |    |    |--- button.tsx
|    |    |    |    |--- card.tsx
|    |    |    |    |--- confirm-dialog.tsx
|    |    |    |    |--- dialog.tsx
|    |    |    |    |--- game-icons.tsx
|    |    |    |    |--- input.tsx
|    |    |    |    |--- label.tsx
|    |    |    |    |--- select.tsx
|    |    |    |    |--- textarea.tsx
|    |    |    |    |--- toast.tsx
|    |    |    |--- utils/             # Funcion cn() (clsx + tailwind-merge)
|    |    |    |--- layout.tsx         # Layout del panel
|    |    |    |--- page.tsx           # Dashboard del docente
|    |    |    |--- panel.css          # Estilos propios del panel
|    |    |
|    |    |--- perfil/                 # Perfil del estudiante
|    |    |--- registro/               # Registro del estudiante
|    |    |--- sala-espera/            # Sala de espera antes del juego
|    |    |--- globals.css             # Estilos globales
|    |    |--- layout.tsx              # Layout raiz
|    |    |--- page.tsx                # Pantalla principal (selector de rol)
|    |
|    |--- education/                   # Banco de preguntas estatico
|    |    |--- question-bank/
|    |         |--- dignidad-mujer.ts  # 21 preguntas tematicas
|    |
|    |--- games/                       # Logica y escenas de los juegos
|    |    |
|    |    |--- decision-road/          # Juego: Camino de las Decisiones
|    |    |    |--- logic/
|    |    |    |    |--- GameFlow.tsx  # Carga preguntas y controla fases
|    |    |    |--- ui/
|    |    |    |    |--- DecisionHUD.tsx       # HUD (progreso + puntos)
|    |    |    |    |--- FeedbackOverlay.tsx   # Correcto/Incorrecto
|    |    |    |    |--- QuestionPanel.tsx     # Panel de preguntas
|    |    |    |    |--- ResultsScreen.tsx     # Pantalla de resultados
|    |    |    |--- world/
|    |    |    |    |--- CharacterDissolve.tsx # Efecto de disolucion
|    |    |    |    |--- DecisionWorld.tsx     # Escena 3D principal
|    |    |    |    |--- DoorSystem.tsx        # Puertas de preguntas
|    |    |    |    |--- FinishLine.tsx        # Linea de meta
|    |    |    |    |--- Path.tsx              # Camino y paredes
|    |    |    |--- config.ts                  # Configuracion del juego
|    |    |    |--- types.ts                   # Tipos TypeScript
|    |    |
|    |    |--- lava-knowledge/         # Juego: Lava del Conocimiento
|    |    |    |--- logic/
|    |    |    |    |--- LavaGameFlow.tsx      # Carga preguntas y rondas
|    |    |    |    |--- RoundManager.tsx      # Timer y respuestas bots
|    |    |    |--- ui/
|    |    |    |    |--- LavaHUD.tsx           # HUD del juego
|    |    |    |--- world/
|    |    |    |    |--- Arena.tsx             # Arena de juego
|    |    |    |    |--- LavaCamera.tsx        # Camara del juego
|    |    |    |    |--- LavaSurface.tsx       # Shader de lava
|    |    |    |    |--- LavaWorld.tsx         # Escena 3D principal
|    |    |    |    |--- PlayerTowers.tsx      # Torres con avatares
|    |    |    |--- config.ts                  # Configuracion
|    |    |    |--- types.ts                   # Tipos TypeScript
|    |
|    |--- engine/                      # Motor 3D compartido
|    |    |--- camera/
|    |    |    |--- CameraController.tsx  # Camara 3ra persona
|    |    |--- effects/
|    |    |    |--- PostProcessing.tsx    # Post-procesamiento (no usado)
|    |    |--- lighting/
|    |    |    |--- Lighting.tsx          # Iluminacion de escenas
|    |    |--- renderer/
|    |    |    |--- GameCanvas.tsx        # Entry point Camino de Decisiones
|    |    |    |--- LavaCanvas.tsx        # Entry point Lava del Conocimiento
|    |
|    |--- shared/                      # Codigo compartido entre juegos
|    |    |--- characters/
|    |    |    |--- CharacterController.tsx  # Control del personaje 3D
|    |    |    |--- RobloxAvatar.tsx         # Modelo Roblox
|    |    |--- config/
|    |    |    |--- game.config.ts           # Config de camara y personaje
|    |    |--- hooks/
|    |    |    |--- useKeyboard.ts           # Hook de teclado
|    |    |--- lib/
|    |    |    |--- audio.ts                 # audioManager (sonidos)
|    |    |--- refs/
|    |    |    |--- characterRef.ts          # Referencia al personaje
|    |    |--- types/
|    |    |    |--- game.ts                  # Tipos compartidos
|    |    |--- utils/
|    |    |    |--- helpers.ts               # clamp, utilidades
|    |    |--- world/
|    |    |    |--- effects/
|    |    |    |    |--- ParticleField.tsx   # Campo de particulas
|    |    |    |--- environment/
|    |    |         |--- Clouds.tsx          # Nubes
|    |    |         |--- Sky.tsx             # Cielo
|    |
|    |--- stores/                      # Estado global (Zustand)
|    |    |--- game.store.ts            # Estado de Camino de Decisiones
|    |    |--- lava.store.ts            # Estado de Lava del Conocimiento
|    |
|    |--- lib/                         # Utilidades generales
|    |    |--- avatares.ts              # Mapeo id --> nombre/imagen
|    |    |--- data.ts                  # Lectura/escritura de JSON
|    |    |--- rooms.ts                 # Logica de salas (mock)
|    |
|    |--- ui/                          # Componentes de interfaz
|    |    |--- components/
|    |    |    |--- navigation/
|    |    |    |    |--- GameMenuButton.tsx
|    |    |    |    |--- TopBar.tsx
|    |    |    |--- primitives/
|    |    |    |    |--- Background.tsx
|    |    |    |    |--- DoodleBackground.tsx
|    |    |    |    |--- DoodleBackground.module.css
|    |    |    |    |--- GameCard.tsx
|    |    |    |--- AvatarPicker.tsx
|    |    |    |--- Button.tsx
|    |    |    |--- Card.tsx
|    |    |    |--- index.ts            # Barrel (no usado)
|    |    |    |--- Modal.tsx
|    |    |    |--- ProgressBar.tsx
|    |    |    |--- Skeleton.tsx
|    |    |    |--- Toast.tsx
|    |    |
|    |    |--- screens/
|    |    |    |--- access/
|    |    |    |    |--- GuestNameScreen.tsx   # Nombre + avatar (invitado)
|    |    |    |    |--- LoginScreen.tsx       # Login estudiante
|    |    |    |    |--- RegisterScreen.tsx    # Registro estudiante
|    |    |    |--- account/
|    |    |    |    |--- AccountConfigScreen.tsx # Configuracion cuenta
|    |    |    |--- achievements/
|    |    |    |    |--- AchievementsScreen.tsx  # Logros y medallas
|    |    |    |--- dashboard/
|    |    |    |    |--- DashboardScreen.tsx     # Dashboard estudiante
|    |    |    |    |--- ProfileModal.tsx        # Modal de perfil
|    |    |    |--- profile/
|    |    |    |    |--- ProfileScreen.tsx       # Perfil estudiante
|    |    |    |--- waiting/
|    |    |    |    |--- WaitingRoomScreen.tsx   # Sala de espera
|    |    |    |--- welcome/
|    |    |    |    |--- SettingsModal.tsx       # Modal ajustes (no usado)
|    |    |    |    |--- WelcomeBackground.tsx   # Fondo bienvenida (no usado)
|    |    |    |    |--- WelcomePage.tsx         # Pantalla bienvenida (no usada)
|    |    |    |    |--- WoodenButton.tsx        # Boton madera (no usado)
|    |    |    |    |--- WoodenButton.module.css
|    |    |
|    |    |--- tokens/
|    |    |    |--- animations.ts
|    |    |    |--- colors.ts
|    |    |    |--- index.ts
|    |    |    |--- spacing.ts
|    |    |    |--- typography.ts
|
|--- data/                           # Base de datos en archivos JSON
|    |--- avatares.json               # Catalogo de avatares
|    |--- categorias.json              # Categorias de preguntas
|    |--- cuestionarios.json           # Cuestionarios
|    |--- cursos.json                  # Cursos creados
|    |--- curso_estudiante.json        # Inscripciones a cursos
|    |--- estadisticas.json            # Estadisticas agregadas
|    |--- juegos.json                  # Catalogo de juegos
|    |--- juego_cuestionario.json      # Relacion juego-cuestionario
|    |--- ligas.json                   # Configuracion de ligas/rangos
|    |--- partidas.json                # Registro de partidas
|    |--- preguntas.json               # Banco de preguntas
|    |--- progreso.json                # Progreso por estudiante
|    |--- resultados.json              # Resultados de partidas
|    |--- salas.json                   # Salas activas
|    |--- usuarios.json                # Usuarios registrados
|
|--- public/                          # Recursos estaticos
|    |--- images/
|         |--- avatares/
|         |    |--- guardabarranco.png
|         |    |--- gueguense.png
|         |    |--- ideay.png
|         |    |--- leon.png
|         |    |--- madrono.png
|         |    |--- mariposa.png
|         |    |--- mascara.png
|         |    |--- nacatamal.png
|         |    |--- sacuanjoche.png
|         |--- rangos/
|         |    |--- bronce.png
|         |    |--- diamante.png
|         |    |--- oro.png
|         |    |--- plata.png
|         |--- welcome/
|         |    |--- welcome-bg.jpg
|         |    |--- welcome-bg.webp
|         |    |--- wooden-button.png
|         |--- logo.png
|         |--- puntos.png
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
