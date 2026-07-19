'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CreatePreguntaDTO } from '@/types';

interface PreguntaFormProps {
  initialData?: Partial<CreatePreguntaDTO>;
  onSubmit: (data: CreatePreguntaDTO) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function PreguntaForm({ initialData, onSubmit, onCancel, loading }: PreguntaFormProps) {
  const [formData, setFormData] = useState<CreatePreguntaDTO>({
    categoria_id: initialData?.categoria_id || 1,
    pregunta: initialData?.pregunta || '',
    opcion_a: initialData?.opcion_a || '',
    opcion_b: initialData?.opcion_b || '',
    opcion_c: initialData?.opcion_c || '',
    opcion_d: initialData?.opcion_d || '',
    respuesta_correcta: initialData?.respuesta_correcta || 'a',
    dificultad: initialData?.dificultad || 'media',
    explicacion: initialData?.explicacion || '',
    puntos: initialData?.puntos || 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categorias = [
    { value: 1, label: 'Mundo 1 - Categoría 1' },
    { value: 2, label: 'Mundo 1 - Categoría 2' },
    { value: 3, label: 'Mundo 2 - Categoría 1' },
    { value: 4, label: 'Mundo 2 - Categoría 2' },
    { value: 5, label: 'Mundo 3 - Categoría 1' },
    { value: 6, label: 'Mundo 3 - Categoría 2' },
  ];

  const dificultades = [
    { value: 'facil', label: 'Fácil' },
    { value: 'media', label: 'Media' },
    { value: 'dificil', label: 'Difícil' },
  ];

  const respuestas = [
    { value: 'a', label: 'Opción A' },
    { value: 'b', label: 'Opción B' },
    { value: 'c', label: 'Opción C' },
    { value: 'd', label: 'Opción D' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Select
        label="Categoría"
        value={formData.categoria_id}
        onChange={(e) => setFormData({ ...formData, categoria_id: Number(e.target.value) })}
        options={categorias}
        required
      />

      <Input
        label="Pregunta"
        value={formData.pregunta}
        onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
        placeholder="Escribe la pregunta aquí..."
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Opción A"
          value={formData.opcion_a}
          onChange={(e) => setFormData({ ...formData, opcion_a: e.target.value })}
          placeholder="Opción A"
          required
        />
        <Input
          label="Opción B"
          value={formData.opcion_b}
          onChange={(e) => setFormData({ ...formData, opcion_b: e.target.value })}
          placeholder="Opción B"
          required
        />
        <Input
          label="Opción C (opcional)"
          value={formData.opcion_c || ''}
          onChange={(e) => setFormData({ ...formData, opcion_c: e.target.value })}
          placeholder="Opción C"
        />
        <Input
          label="Opción D (opcional)"
          value={formData.opcion_d || ''}
          onChange={(e) => setFormData({ ...formData, opcion_d: e.target.value })}
          placeholder="Opción D"
        />
      </div>

      <Select
        label="Respuesta Correcta"
        value={formData.respuesta_correcta}
        onChange={(e) => setFormData({ ...formData, respuesta_correcta: e.target.value as CreatePreguntaDTO['respuesta_correcta'] })}
        options={respuestas}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Dificultad"
          value={formData.dificultad}
          onChange={(e) => setFormData({ ...formData, dificultad: e.target.value as CreatePreguntaDTO['dificultad'] })}
          options={dificultades}
          required
        />
        <Input
          label="Puntos"
          type="number"
          value={formData.puntos}
          onChange={(e) => setFormData({ ...formData, puntos: Number(e.target.value) })}
          min="1"
          max="100"
          required
        />
      </div>

      <Input
        label="Explicación (opcional)"
        value={formData.explicacion || ''}
        onChange={(e) => setFormData({ ...formData, explicacion: e.target.value })}
        placeholder="Explicación de la respuesta correcta..."
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" loading={loading}>
          {initialData ? 'Actualizar' : 'Crear'} Pregunta
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
