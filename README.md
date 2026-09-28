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
|    |    |    |--- auth/               # Registro, login, sesion e invitados
|    |    |    |--- estudiante/         # Perfil y datos del alumno
|    |    |    |--- salas/             # Creacion y union a salas
|    |    |    |--- practicas/         # Practicas publicadas
|    |    |    |--- panel/             # APIs autenticadas del panel docente
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
|    |    |    |--- services/          # Servicios de datos (cursos, salas, preguntas)
|    |    |    |--- store/             # Estado global del panel (Zustand)
|    |    |    |--- types/             # Definiciones de tipos TypeScript
|    |    |    |--- utils/             # Utilidades y helpers
|    |    |    |--- hooks/             # Hooks personalizados
|    |    |    |--- lib/               # Libreria de audio, IA, etc.
|    |    |    |--- ui/                # Componentes visuales del panel
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
|    |    |
|    |    |--- tierras-hundidas/       # Juego 3: Tierras Hundidas
|    |    |--- entre-abismos/          # Juego 4: Entre Abismos
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
|    |    |--- rooms.ts                # Logica de salas
|    |
|    |--- ui/                          # Componentes de interfaz
|    |    |--- components/             # Botones, Tarjetas, Modales
|    |    |--- screens/                # Pantallas de Login, Registro, Perfil
|
|--- public/                           # Recursos estaticos
     |--- images/
          |--- avatares/               # 13 Iconos culturales
          |--- logo.png
          |--- puntos.png
```

## 4. Instalacion basica

### Requisitos

- Node.js 18.17 o superior.
- PostgreSQL 13+.
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

3. Configurar variables de entorno:

Copiar `.env.example` a `.env.local` y completar:

```
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/eduplay_db
GEMINI_API_KEY=tu_clave_aqui
```

`GEMINI_API_KEY` es solo para generación de preguntas con IA desde el panel.

4. Crear y sembrar la base de datos:

```bash
psql -U postgres -c "CREATE DATABASE eduplay_db;"
psql -U postgres -d eduplay_db -f db/schema.sql
psql -U postgres -d eduplay_db -f db/seed.sql
npm run seed:demo   # usuarios demo admin/teacher con hash scrypt
```

La fuente de verdad es PostgreSQL (`db/schema.sql` + `db/seed.sql`). Ver `db/README.md` y `MIGRACION_POSTGRESQL.md`.

Estado de migración (2026-09-28): **COMPLETA** — E2E 563/563, `tsc`/`build` OK; los restos de prototipo (JSON de `data/`, APIs JSON sin consumidores, componentes y assets sin uso) fueron eliminados en el commit `chore: clean up unused prototype code`.

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
- `/tierras-hundidas`: Juego interactivo 3D.
- `/entre-abismos`: Juego interactivo 3D.
- `/practica`: Practicas publicadas (historial y juego libre).
- `/ligas`: Ligas y clasificacion.
- `/logros`: Logros del estudiante.
- `/configuracion`: Configuracion de la cuenta.
- `/panel`: Panel de control del docente.
- `/panel/login`: Inicio de sesion docente.
- `/panel/register`: Registro de docente.
- `/panel/perfil`: Perfil del docente.
- `/panel/cursos`: Gestion de cursos.
- `/panel/salas`: Gestion de salas.
- `/panel/salas/crear`: Crear nueva sala.
- `/panel/admin/docentes`: Administrar docentes y administradores.
- `/panel/admin/estudiantes`: Administrar estudiantes.
- `/panel/admin/partidas`: Administrar partidas publicas.

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

## 7. Acceso publico con Tailscale Funnel

EduPlay se puede compartir en internet con una **URL HTTPS fija** usando [Tailscale Funnel](https://tailscale.com/kb/1257/funnel), sin comprar dominio ni usar ngrok/Cloudflare:

```
EduPlay local (Next.js)  ->  Tailscale Funnel (background)  ->  https://dessler-watson.tail8e3865.ts.net
```

El Funnel hace proxy **unicamente** al servidor Next.js local (`127.0.0.1:3000`). PostgreSQL **no** se expone a internet (el Funnel no toca el puerto 5432). No hay tokens ni credenciales de Tailscale en el repositorio.

### Configuracion unica (una sola vez)

1. **Instalar Tailscale:** `winget install --id Tailscale.Tailscale --exact`
2. **Iniciar sesion:** `tailscale login` (abre el navegador; MagicDNS y HTTPS ya vienen activos en el tailnet).
3. **Habilitar Funnel (unico paso manual en Tailscale):** al ejecutar `funnel_up.ps1` por primera vez, el script imprime y abre `https://login.tailscale.com/f/funnel?node=...` -> hacer click en **Enable Funnel**. Despues de eso, no hay mas pasos manuales.

### Scripts

| Script | Funcion |
|---|---|
| `scripts/eduplay_up.ps1` | Enciende EduPlay en background, sin terminal abierta. Detecta automaticamente el comando (`package.json` -> `scripts.dev`) y el puerto (proceso en ejecucion -> flag `-p` -> `$env:PORT` -> 3000). |
| `scripts/eduplay_down.ps1` | Apaga el servidor EduPlay. |
| `scripts/funnel_up.ps1` | Activa el Funnel en background hacia `127.0.0.1:<puerto detectado>` y muestra la URL publica. Idempotente (si ya esta activo, solo muestra la URL). |
| `scripts/funnel_down.ps1` | Apaga el Funnel: la URL publica deja de responder. |
| `scripts/funnel_status.ps1` | Estado de Tailscale, Funnel, EduPlay local y acceso publico (frontend + API). |

Todos se ejecutan como:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\<script>.ps1
```

### Flujo de encendido y apagado

**Encender (para compartir):**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\eduplay_up.ps1
powershell -ExecutionPolicy Bypass -File scripts\funnel_up.ps1
```

**Apagar:**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\funnel_down.ps1   # corta la URL publica
powershell -ExecutionPolicy Bypass -File scripts\eduplay_down.ps1  # apaga EduPlay
```

Tambien se pueden combinar: con el Funnel encendido y EduPlay apagado, la URL responde **502**; al re-encender EduPlay vuelve el **200** con la **misma URL**.

**Apagar la PC / reiniciar:** el servicio de Tailscale arranca con Windows y la configuracion del Funnel persiste en disco; al prender de nuevo solo hace falta `eduplay_up.ps1`. La URL **no cambia** nunca (deriva del nombre del nodo + sufijo MagicDNS del tailnet).

### Verificaciones hechas

- E2E completo contra la URL publica: `powershell -ExecutionPolicy Bypass -File scripts\e2e_pg.ps1 -BaseUrl https://dessler-watson.tail8e3865.ts.net` -> **563/563 PASS** (frontend, APIs, login, salas, SSE tiempo real, partidas, resultados).
- IA (Gemini) probada via URL publica (login docente + `POST /api/ai/generate` -> 200 con contenido).
- Ciclos Funnel off/on y app off/on -> misma URL (200), 502 con app apagada, sin respuesta con Funnel apagado.
- Clave de Gemini **exclusivamente server-side**: se lee en `src/app/api/ai/generate/route.ts` desde `process.env.GEMINI_API_KEY` (`.env.local`, nunca commiteado); no existe ninguna variable `NEXT_PUBLIC_GEMINI_*` y el bundle del cliente no contiene la clave. El frontend llama al proxy local `/api/ai/generate`.
