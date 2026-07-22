import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'PA_db',
  });

  await client.connect();

  console.log('\n=== INICIANDO SEED DE BASE DE DATOS ===\n');

  // 1. Actualizar contraseñas de usuarios existentes
  console.log('1. Actualizando contraseñas de usuarios existentes...');
  const newPassword = await bcrypt.hash('Password123', 10);
  await client.query('UPDATE usuarios SET "contraseña" = $1', [newPassword]);
  console.log('   ✓ Contraseñas actualizadas a "Password123"\n');

  // 2. Agregar más usuarios estudiantes
  console.log('2. Agregando más usuarios estudiantes...');
  const nuevosEstudiantes = [
    ['Ana Martínez', 'ana.martinez@ejemplo.com', 'estudiante'],
    ['Carlos Ruiz', 'carlos.ruiz@ejemplo.com', 'estudiante'],
    ['María González', 'maria.gonzalez@ejemplo.com', 'estudiante'],
    ['Juan Pérez', 'juan.perez@ejemplo.com', 'estudiante'],
    ['Sofía Ramírez', 'sofia.ramirez@ejemplo.com', 'estudiante'],
    ['Diego Torres', 'diego.torres@ejemplo.com', 'estudiante'],
    ['Valentina López', 'valentina.lopez@ejemplo.com', 'estudiante'],
    ['Mateo Hernández', 'mateo.hernandez@ejemplo.com', 'estudiante'],
  ];

  for (const [nombre, correo, rol] of nuevosEstudiantes) {
    await client.query(
      'INSERT INTO usuarios (nombre, correo, "contraseña", rol, estado) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (correo) DO NOTHING',
      [nombre, correo, newPassword, rol, 'activo']
    );
  }
  console.log('   ✓ 8 nuevos estudiantes agregados\n');

  // 3. Agregar más preguntas
  console.log('3. Agregando más preguntas...');
  const nuevasPreguntas = [
    // Categoría 1 - Derechos Humanos (Mundo 1)
    [1, '¿Qué institución protege los derechos humanos a nivel mundial?', 'La ONU', 'La OMS', 'La UNESCO', 'El FMI', 'a', 'facil', 'La ONU es la principal organización internacional que protege los derechos humanos', 10],
    [1, '¿Cuál es un derecho fundamental de los niños?', 'Derecho al juego', 'Derecho a votar', 'Derecho a conducir', 'Derecho a trabajar', 'a', 'facil', 'El derecho al juego es fundamental para el desarrollo de los niños', 10],
    [1, '¿Qué significa el derecho a la libre expresión?', 'Poder decir lo que quieras sin consecuencias', 'Poder expresar opiniones respetando a otros', 'Poder gritar en lugares públicos', 'Poder insultar a otros', 'b', 'media', 'La libre expresión implica responsabilidad y respeto', 15],
    
    // Categoría 2 - Igualdad de Género (Mundo 1)
    [2, '¿Qué es el empoderamiento femenino?', 'Dar poder solo a mujeres', 'Fortalecer la capacidad de las mujeres para tomar decisiones', 'Quitar poder a los hombres', 'Crear leyes solo para mujeres', 'b', 'media', 'El empoderamiento busca equidad, no superioridad', 15],
    [2, '¿En qué año las mujeres pudieron votar en México?', '1917', '1953', '1970', '1985', 'b', 'media', 'Las mujeres mexicanas obtuvieron el derecho al voto en 1953', 15],
    [2, '¿Qué es la discriminación por género?', 'Tratar diferente a alguien por su género', 'Tratar igual a todos', 'Respetar las diferencias', 'Ninguna de las anteriores', 'a', 'facil', 'La discriminación por género es tratar de forma desigual por razón de género', 10],
    
    // Categoría 3 - Prevención de Violencia (Mundo 1)
    [3, '¿Cuál es el primer paso para prevenir la violencia?', 'Identificar situaciones de riesgo', 'Ignorar el problema', 'Esperar a que pase', 'Buscar culpables', 'a', 'facil', 'Identificar riesgos es fundamental para la prevención', 10],
    [3, '¿Qué es la violencia psicológica?', 'Golpes y moretones', 'Insultos, humillaciones y control', 'Robar pertenencias', 'Ninguna de las anteriores', 'b', 'media', 'La violencia psicológica daña la autoestima y salud mental', 15],
    [3, '¿A quién debes acudir si sufres violencia?', 'A un amigo', 'A las autoridades competentes', 'A nadie', 'A las redes sociales', 'b', 'facil', 'Las autoridades pueden brindar protección y apoyo', 10],
    
    // Categoría 4 - Derechos Humanos Avanzado (Mundo 2)
    [4, '¿Qué es el derecho internacional humanitario?', 'Leyes de guerra', 'Normas que protegen a personas en conflictos armados', 'Derechos de los soldados', 'Tratados comerciales', 'b', 'dificil', 'Protege a personas que no participan en conflictos armados', 20],
    [4, '¿Qué son los derechos de tercera generación?', 'Derechos civiles', 'Derechos económicos', 'Derechos de solidaridad y medio ambiente', 'Derechos políticos', 'c', 'dificil', 'Incluyen derecho al desarrollo, paz y medio ambiente sano', 20],
    [4, '¿Qué es la Comisión Interamericana de Derechos Humanos?', 'Una ONG', 'Un órgano de la OEA que protege derechos humanos', 'Una empresa', 'Un partido político', 'b', 'media', 'La CIDH es un órgano principal de la OEA', 15],
    
    // Categoría 5 - Igualdad de Género Avanzado (Mundo 2)
    [5, '¿Qué es la interseccionalidad en estudios de género?', 'Estudiar solo género', 'Analizar cómo se cruzan género, raza, clase y otras identidades', 'Estudiar biología', 'Ninguna de las anteriores', 'b', 'dificil', 'La interseccionalidad analiza múltiples formas de discriminación', 20],
    [5, '¿Qué es la paridad de género?', '50% hombres y 50% mujeres en puestos de decisión', 'Más mujeres que hombres', 'Solo hombres en el poder', 'Ninguna de las anteriores', 'a', 'media', 'La paridad busca representación equitativa', 15],
    [5, '¿Qué país nórdico lidera en igualdad de género?', 'Noruega', 'Islandia', 'Suecia', 'Finlandia', 'b', 'dificil', 'Islandia ha sido el país más igualitario por más de una década', 20],
    
    // Categoría 6 - Prevención de Violencia Avanzado (Mundo 2)
    [6, '¿Qué es el ciclo de la violencia?', 'Un tipo de ejercicio', 'Patrón repetitivo de abuso con fases de tensión, explosión y luna de miel', 'Una película', 'Ninguna de las anteriores', 'b', 'dificil', 'El ciclo de violencia explica por qué las víctimas permanecen en relaciones abusivas', 20],
    [6, '¿Qué es la violencia estructural?', 'Violencia en edificios', 'Violencia institucionalizada en sistemas sociales', 'Violencia física', 'Ninguna de las anteriores', 'b', 'dificil', 'La violencia estructural está embedded en instituciones y normas sociales', 20],
    [6, '¿Qué es una orden de restricción?', 'Una orden de compra', 'Medida legal que prohíbe al agresor acercarse a la víctima', 'Una receta médica', 'Ninguna de las anteriores', 'b', 'media', 'Las órdenes de restricción protegen legalmente a las víctimas', 15],
    
    // Más preguntas para Mundo 3 (Estudio)
    [1, '¿Qué artículo de la Constitución Mexicana garantiza la educación?', 'Artículo 1', 'Artículo 3', 'Artículo 27', 'Artículo 123', 'b', 'facil', 'El Artículo 3 garantiza el derecho a la educación', 10],
    [2, '¿Qué es la equidad de género en el trabajo?', 'Pagar menos a mujeres', 'Mismo salario por mismo trabajo sin importar género', 'Solo contratar hombres', 'Ninguna de las anteriores', 'b', 'facil', 'La equidad laboral busca igualdad de oportunidades y salarios', 10],
    [3, '¿Qué hacer si presencias violencia escolar?', 'Ignorarlo', 'Reportarlo a un adulto de confianza', 'Grabarlo para redes sociales', 'Unirte al agresor', 'b', 'facil', 'Reportar la violencia es responsabilidad de todos', 10],
  ];

  for (const pregunta of nuevasPreguntas) {
    await client.query(
      'INSERT INTO preguntas (categoria_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, dificultad, explicacion, puntos) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      pregunta
    );
  }
  console.log(`   ✓ ${nuevasPreguntas.length} nuevas preguntas agregadas\n`);

  // 4. Agregar más progreso de usuarios
  console.log('4. Agregando más datos de progreso...');
  const nuevosProgresos = [
    [4, 1, 6, 600, 550, 7, 2, 5],
    [4, 2, 5, 480, 420, 5, 3, 2],
    [4, 3, 7, 700, 650, 8, 1, 7],
    [5, 1, 4, 350, 320, 4, 3, 1],
    [5, 2, 3, 280, 250, 3, 4, 0],
    [5, 3, 5, 500, 450, 6, 2, 4],
    [8, 1, 8, 900, 850, 10, 1, 9],
    [8, 2, 7, 750, 700, 8, 2, 6],
    [8, 3, 9, 1100, 1050, 12, 1, 11],
    [9, 1, 5, 450, 400, 5, 3, 2],
    [9, 2, 4, 380, 350, 4, 4, 1],
    [9, 3, 6, 550, 500, 6, 2, 3],
    [10, 1, 3, 250, 220, 3, 5, 0],
    [10, 2, 2, 180, 150, 2, 6, 0],
    [10, 3, 4, 320, 280, 4, 4, 1],
    [11, 1, 7, 680, 620, 7, 2, 5],
    [11, 2, 6, 580, 520, 6, 3, 4],
    [11, 3, 8, 800, 750, 9, 1, 8],
    [12, 1, 4, 380, 340, 4, 3, 2],
    [12, 2, 5, 450, 400, 5, 2, 3],
    [12, 3, 6, 520, 480, 6, 2, 4],
    [13, 1, 9, 1200, 1150, 13, 0, 12],
    [13, 2, 8, 1050, 1000, 11, 1, 10],
    [13, 3, 10, 1400, 1350, 15, 0, 14],
    [14, 1, 2, 150, 120, 2, 5, 0],
    [14, 2, 1, 80, 50, 1, 6, 0],
    [14, 3, 3, 220, 180, 3, 4, 1],
    [15, 1, 6, 580, 520, 6, 2, 4],
    [15, 2, 5, 480, 420, 5, 3, 2],
    [15, 3, 7, 680, 620, 7, 2, 5],
  ];

  for (const [usuario_id, juego_id, liga_id, experiencia, copas, victorias, derrotas, racha] of nuevosProgresos) {
    await client.query(
      'INSERT INTO progreso_usuario_juego (usuario_id, juego_id, liga_id, experiencia, copas, victorias, derrotas, racha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (usuario_id, juego_id) DO NOTHING',
      [usuario_id, juego_id, liga_id, experiencia, copas, victorias, derrotas, racha]
    );
  }
  console.log(`   ✓ ${nuevosProgresos.length} nuevos registros de progreso agregados\n`);

  // 5. Agregar salas de juego
  console.log('5. Agregando salas de juego...');
  const salas = [
    [1, 2, 'SALA001', 'publica', 'jugando', 8],
    [1, 3, 'SALA002', 'publica', 'esperando', 8],
    [2, 4, 'SALA003', 'publica', 'finalizada', 8],
    [2, 8, 'SALA004', 'publica', 'jugando', 8],
    [3, 9, 'SALA005', 'publica', 'esperando', 8],
    [1, 11, 'SALA006', 'privada', 'jugando', 4],
    [2, 12, 'SALA007', 'publica', 'finalizada', 8],
    [3, 13, 'SALA008', 'publica', 'esperando', 8],
  ];

  for (const [juego_id, creador_id, codigo, tipo, estado, max_jugadores] of salas) {
    await client.query(
      'INSERT INTO salas (juego_id, creador_id, codigo, tipo, estado, max_jugadores) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (codigo) DO NOTHING',
      [juego_id, creador_id, codigo, tipo, estado, max_jugadores]
    );
  }
  console.log(`   ✓ ${salas.length} salas de juego agregadas\n`);

  // 6. Agregar partidas
  console.log('6. Agregando partidas...');
  const partidas = [
    [1, '2026-07-15 10:00:00', '2026-07-15 10:15:00', 2],
    [2, '2026-07-15 11:00:00', '2026-07-15 11:20:00', 3],
    [3, '2026-07-15 14:00:00', '2026-07-15 14:10:00', 4],
    [4, '2026-07-16 09:00:00', '2026-07-16 09:25:00', 8],
    [5, '2026-07-16 15:00:00', '2026-07-16 15:18:00', 9],
    [6, '2026-07-17 10:00:00', '2026-07-17 10:12:00', 11],
    [7, '2026-07-17 16:00:00', '2026-07-17 16:22:00', 12],
    [8, '2026-07-18 08:00:00', '2026-07-18 08:15:00', 13],
  ];

  for (const [sala_id, fecha_inicio, fecha_fin, ganador_id] of partidas) {
    const existingPartida = await client.query(
      'SELECT id_partida FROM partidas WHERE sala_id = $1 AND fecha_inicio = $2',
      [sala_id, fecha_inicio]
    );
    if (existingPartida.rows.length === 0) {
      await client.query(
        'INSERT INTO partidas (sala_id, fecha_inicio, fecha_fin, ganador_id) VALUES ($1, $2, $3, $4)',
        [sala_id, fecha_inicio, fecha_fin, ganador_id]
      );
    }
  }
  console.log(`   ✓ ${partidas.length} partidas procesadas\n`);

  // 7. Agregar resultados de partidas
  console.log('7. Agregando resultados de partidas...');
  const resultados = [
    [1, 2, 85, 50, 1, 8, 2],
    [1, 3, 70, 30, 2, 7, 3],
    [1, 4, 60, 20, 3, 6, 4],
    [2, 2, 90, 60, 1, 9, 1],
    [2, 3, 75, 40, 2, 7, 3],
    [2, 5, 55, 10, 3, 5, 5],
    [3, 3, 95, 70, 1, 9, 1],
    [3, 4, 80, 50, 2, 8, 2],
    [4, 8, 100, 80, 1, 10, 0],
    [4, 9, 85, 60, 2, 8, 2],
    [5, 9, 88, 65, 1, 9, 1],
    [5, 10, 72, 45, 2, 7, 3],
    [6, 11, 92, 75, 1, 9, 1],
    [6, 12, 78, 55, 2, 8, 2],
    [7, 12, 85, 60, 1, 8, 2],
    [7, 13, 95, 80, 2, 10, 0],
    [8, 13, 98, 85, 1, 10, 0],
    [8, 14, 65, 35, 2, 6, 4],
  ];

  for (const [partida_id, usuario_id, puntaje, copas, posicion, correctas, incorrectas] of resultados) {
    await client.query(
      'INSERT INTO resultados (partida_id, usuario_id, puntaje, copas, posicion, correctas, incorrectas) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [partida_id, usuario_id, puntaje, copas, posicion, correctas, incorrectas]
    );
  }
  console.log(`   ✓ ${resultados.length} resultados agregados\n`);

  // 8. Agregar respuestas detalladas
  console.log('8. Agregando respuestas detalladas...');
  const respuestas = [];
  for (let partidaId = 1; partidaId <= 8; partidaId++) {
    for (let userId = 2; userId <= 5; userId++) {
      for (let i = 1; i <= 5; i++) {
        const preguntaId = Math.floor(Math.random() * 19) + 1;
        const esCorrecta = Math.random() > 0.3;
        const respuesta = esCorrecta ? 'a' : 'b';
        const tiempoRespuesta = Math.floor(Math.random() * 30) + 5;
        respuestas.push([partidaId, userId, preguntaId, respuesta, esCorrecta, tiempoRespuesta]);
      }
    }
  }

  for (const respuesta of respuestas) {
    await client.query(
      'INSERT INTO respuestas (partida_id, usuario_id, pregunta_id, respuesta, es_correcta, tiempo_respuesta) VALUES ($1, $2, $3, $4, $5, $6)',
      respuesta
    );
  }
  console.log(`   ✓ ${respuestas.length} respuestas agregadas\n`);

  // 9. Agregar estadísticas de usuario por juego
  console.log('9. Agregando estadísticas de usuario por juego...');
  const estadisticas = [
    [2, 1, 15, 10, 5, 85, 25, 12.5],
    [2, 2, 12, 8, 4, 70, 30, 15.2],
    [3, 1, 18, 12, 6, 90, 20, 11.8],
    [3, 2, 14, 9, 5, 75, 25, 14.5],
    [4, 1, 20, 14, 6, 95, 15, 10.2],
    [4, 2, 16, 11, 5, 80, 20, 13.8],
    [5, 1, 10, 6, 4, 60, 40, 18.5],
    [5, 2, 8, 5, 3, 55, 45, 20.1],
    [8, 1, 25, 18, 7, 100, 10, 9.5],
    [8, 2, 22, 15, 7, 85, 15, 12.0],
    [9, 1, 18, 12, 6, 88, 22, 13.2],
    [9, 2, 15, 10, 5, 72, 28, 16.8],
    [10, 1, 12, 7, 5, 65, 35, 17.5],
    [10, 2, 10, 6, 4, 58, 42, 19.2],
    [11, 1, 22, 16, 6, 92, 18, 11.0],
    [11, 2, 19, 13, 6, 78, 22, 14.2],
    [12, 1, 15, 10, 5, 75, 25, 15.8],
    [12, 2, 13, 8, 5, 68, 32, 17.0],
    [13, 1, 28, 20, 8, 98, 12, 8.8],
    [13, 2, 25, 17, 8, 88, 12, 11.5],
    [14, 1, 8, 4, 4, 50, 50, 22.0],
    [14, 2, 6, 3, 3, 45, 55, 24.5],
    [15, 1, 20, 14, 6, 85, 25, 13.0],
    [15, 2, 17, 11, 6, 72, 28, 15.5],
  ];

  for (const [usuario_id, juego_id, partidas, victorias, derrotas, correctas, incorrectas, tiempo_promedio] of estadisticas) {
    await client.query(
      'INSERT INTO estadisticas_usuario_juego (usuario_id, juego_id, partidas, victorias, derrotas, correctas, incorrectas, tiempo_promedio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (usuario_id, juego_id) DO NOTHING',
      [usuario_id, juego_id, partidas, victorias, derrotas, correctas, incorrectas, tiempo_promedio]
    );
  }
  console.log(`   ✓ ${estadisticas.length} registros de estadísticas agregados\n`);

  // 10. Agregar amigos
  console.log('10. Agregando relaciones de amistad...');
  const amigos = [
    [2, 3],
    [2, 4],
    [3, 5],
    [4, 8],
    [5, 9],
    [8, 11],
    [9, 12],
    [10, 13],
    [11, 14],
    [12, 15],
  ];

  for (const [usuario1_id, usuario2_id] of amigos) {
    await client.query(
      'INSERT INTO amigos (usuario1_id, usuario2_id) VALUES ($1, $2)',
      [usuario1_id, usuario2_id]
    );
  }
  console.log(`   ✓ ${amigos.length} relaciones de amistad agregadas\n`);

  // 11. Agregar curso_estudiante
  console.log('11. Agregando estudiantes a cursos...');
  const cursoEstudiante = [
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 8],
    [2, 9],
    [2, 10],
    [3, 11],
    [3, 12],
    [3, 13],
    [4, 14],
    [4, 15],
    [4, 2],
  ];

  for (const [curso_id, usuario_id] of cursoEstudiante) {
    await client.query(
      'INSERT INTO curso_estudiante (curso_id, usuario_id) VALUES ($1, $2) ON CONFLICT (curso_id, usuario_id) DO NOTHING',
      [curso_id, usuario_id]
    );
  }
  console.log(`   ✓ ${cursoEstudiante.length} estudiantes inscritos en cursos\n`);

  console.log('=== SEED COMPLETADO EXITOSAMENTE ===\n');
  console.log('Credenciales de prueba para el panel docente:');
  console.log('  Email: ana@ejemplo.com');
  console.log('  Password: Password123');
  console.log('  Rol: docente\n');
  console.log('  Email: luis@ejemplo.com');
  console.log('  Password: Password123');
  console.log('  Rol: docente\n');

  await client.end();
}

seedDatabase().catch(console.error);
