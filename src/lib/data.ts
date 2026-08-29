import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

export function readData<T>(file: string): T[] {
  const filePath = join(DATA_DIR, `${file}.json`);
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export function writeData<T>(file: string, data: T[]): void {
  const filePath = join(DATA_DIR, `${file}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getNextId(file: string): number {
  const data = readData<Record<string, unknown>>(file);
  if (data.length === 0) return 1;
  const ids = data.map(item => {
    const id = item.id ?? item.id_usuario ?? item.id_pregunta ?? item.id_categoria ?? item.id_cuestionario ?? item.id_juego ?? item.id_sala ?? item.id_curso ?? item.id_partida ?? item.id_resultado ?? item.id_progreso ?? item.id_estadistica ?? item.id_avatar ?? item.id_liga ?? 0;
    return typeof id === 'number' ? id : 0;
  });
  return Math.max(...ids) + 1;
}
