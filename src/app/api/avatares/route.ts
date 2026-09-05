import { NextResponse } from 'next/server';
import { readData } from '@/lib/data';

interface Avatar { id_avatar: number; nombre: string; imagen: string; desbloqueado?: boolean; }

export async function GET() {
  const avatares = readData<Avatar>('avatares');
  return NextResponse.json(avatares);
}
