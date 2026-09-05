'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Controller, useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Calendar, ArrowLeft } from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { audioManager } from '@/shared/lib/audio';
import { AvatarPicker } from '@/ui/components/AvatarPicker';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function aniosDisponibles(): number[] {
  const actual = new Date().getFullYear();
  return Array.from({ length: 19 }, (_, i) => actual - i);
}

function fechaValida(dia: string, mes: string, anio: string): Date | null {
  const d = Number(dia);
  const m = Number(mes);
  const a = Number(anio);
  if (!dia || !mes || !anio || !d || !m || !a) return null;
  const fecha = new Date(a, m - 1, d);
  if (fecha.getFullYear() !== a || fecha.getMonth() !== m - 1 || fecha.getDate() !== d) return null;
  return fecha;
}

function calcularEdad(fecha: Date | null): number | null {
  if (!fecha) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;
  return edad;
}

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  fecha_dia: z.string().min(1, 'Selecciona el dia'),
  fecha_mes: z.string().min(1, 'Selecciona el mes'),
  fecha_anio: z.string().min(1, 'Selecciona el año'),
  sexo: z.enum(['masculino', 'femenino'], 'Selecciona tu sexo'),
  email: z.string().min(1, 'El correo es obligatorio').email('Correo no valido'),
  password: z.string().min(1, 'La contrasena es obligatoria').min(4, 'Minimo 4 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function RegisterScreen() {
  const {
    register, handleSubmit, control, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      nombre: '', apellido: '', fecha_dia: '', fecha_mes: '', fecha_anio: '',
      sexo: undefined, email: '', password: '',
    },
  });

  const [avatarId, setAvatarId] = useState(1);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const watchedFecha = watch(['fecha_dia', 'fecha_mes', 'fecha_anio']);
  const fecha = fechaValida(watchedFecha[0], watchedFecha[1], watchedFecha[2]);
  const edad = calcularEdad(fecha);
  const edadInvalida = edad !== null && edad < 3;

  const onSubmit = async (data: FormData) => {
    if (edadInvalida) return;
    setRegisterError(null);
    setRegistering(true);
    try {
      const fechaNac = fechaValida(data.fecha_dia, data.fecha_mes, data.fecha_anio)!;
      const anio = fechaNac.getFullYear();
      const mes = String(fechaNac.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaNac.getDate()).padStart(2, '0');
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          apellido: data.apellido,
          correo: data.email,
          avatar_id: avatarId,
          fecha_nacimiento: `${anio}-${mes}-${dia}`,
          sexo: data.sexo,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setRegisterError(result.error || 'No se pudo crear la cuenta');
        setRegistering(false);
        return;
      }
      localStorage.setItem('eduplay_user', JSON.stringify({
        id_usuario: result.usuario.id_usuario,
        nombre: result.usuario.nombre,
        avatar_id: result.usuario.avatar.id_avatar,
        correo: result.usuario.correo,
        modo: 'registrado',
      }));
      window.location.href = '/inicio';
    } catch {
      setRegisterError('Error de conexion. Intenta de nuevo.');
      setRegistering(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-8">
      <Background />

      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 250, damping: 20 }}
        className="relative z-10 w-full max-w-md rounded-[28px] border-2 border-white/70 bg-[#FFD8D8] p-7 shadow-game-lg backdrop-blur-xl"
      >
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { window.location.href = '/estudiante'; }}
          className="mb-4 flex items-center gap-2 text-sm font-black text-surface-500 transition-colors hover:text-surface-700"
        >
          <ArrowLeft size={18} /> Volver
        </motion.button>

        <div className="mb-5 text-center">
          <motion.div
            key={avatarId}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mx-auto mb-2 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-game-lg"
            style={{ background: '#fff7ef' }}
          >
            <img
              src={`/images/avatares/avatar${avatarId}.png`}
              alt="Tu avatar"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </motion.div>
          <h1 className="text-2xl font-black text-surface-800">Crear cuenta</h1>
          <p className="mt-1 text-sm font-bold text-surface-500">Completa tus datos para comenzar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <InputRow icon={<User size={16} />} type="text" placeholder="Nombre" error={errors.nombre?.message} register={register('nombre')} />
            <InputRow icon={<User size={16} />} type="text" placeholder="Apellido" error={errors.apellido?.message} register={register('apellido')} />
          </div>

          <div>
            <p className="mb-1.5 ml-1 flex items-center gap-2 text-xs font-black text-surface-600">
              <Calendar size={14} className="text-edu-orange" /> Fecha de nacimiento
            </p>
            <div className="grid grid-cols-3 gap-2">
              <SelectBox
                placeholder="Dia"
                options={Array.from({ length: 31 }, (_, i) => String(i + 1))}
                error={!!errors.fecha_dia}
                register={register('fecha_dia')}
              />
              <SelectBox
                placeholder="Mes"
                options={MESES.map((m, i) => ({ value: String(i + 1), label: m }))}
                error={!!errors.fecha_mes}
                register={register('fecha_mes')}
              />
              <SelectBox
                placeholder="Año"
                options={aniosDisponibles().map((a) => ({ value: String(a), label: String(a) }))}
                error={!!errors.fecha_anio}
                register={register('fecha_anio')}
              />
            </div>
            {edad !== null && (
              <p
                className={`mt-1.5 ml-1 inline-block rounded-full px-3 py-1 text-xs font-black ${
                  edadInvalida ? 'bg-edu-pink-light/40 text-edu-pink' : 'bg-[#407516]/15 text-[#407516]'
                }`}
              >
                Tu edad: {edad} {edad === 1 ? 'año' : 'años'}
              </p>
            )}
            {edadInvalida && (
              <p className="ml-1 mt-1 text-xs font-black text-edu-pink">
                La aplicacion es para estudiantes de 3 años en adelante
              </p>
            )}
            {errors.fecha_dia?.message && (
              <p className="ml-1 mt-1 text-xs font-black text-edu-pink">{errors.fecha_dia?.message}</p>
            )}
          </div>

          <div>
            <p className="mb-1.5 ml-1 text-xs font-black text-surface-600">Sexo</p>
            <div className="grid grid-cols-2 gap-2">
              <Controller
                control={control}
                name="sexo"
                render={({ field }) => (
                  <>
                    {[['masculino', 'Masculino'], ['femenino', 'Femenino']].map(([valor, etiqueta]) => {
                      const activo = field.value === valor;
                      return (
                        <button
                          key={valor}
                          type="button"
                          onClick={() => field.onChange(valor)}
                          className={`rounded-xl border-2 py-3 text-sm font-black transition-all ${
                            activo
                              ? 'border-[#407516] bg-[#407516] text-white shadow-card'
                              : 'border-surface-200 bg-white text-surface-500 hover:border-[#407516]/40'
                          }`}
                        >
                          <span className="mr-1.5 text-base">{valor === 'masculino' ? '\u2642' : '\u2640'}</span>
                          {etiqueta}
                        </button>
                      );
                    })}
                  </>
                )}
              />
            </div>
            {errors.sexo?.message && (
              <p className="ml-1 mt-1 text-xs font-black text-edu-pink">{errors.sexo?.message}</p>
            )}
          </div>

          <InputRow icon={<Mail size={18} />} type="email" placeholder="Correo electronico" error={errors.email?.message} register={register('email')} />
          <InputRow icon={<Lock size={18} />} type="password" placeholder="Contrasena" error={errors.password?.message} register={register('password')} />

          <div className="mt-1">
            <p className="mb-2 text-center text-xs font-black text-surface-500">Elige tu avatar</p>
            <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
          </div>

          {registerError && (
            <p className="text-center text-sm font-black text-edu-pink">{registerError}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, y: 2 }}
            type="submit"
            disabled={registering || edadInvalida}
            className="btn-game mt-1 w-full rounded-xl bg-[#407516] py-4 text-base text-white disabled:opacity-70"
            style={{ boxShadow: edadInvalida ? undefined : '0 6px 0 rgba(64, 117, 22, 0.4), 0 8px 24px rgba(64,117,22,0.3)' }}
          >
            {registering ? 'Creando cuenta...' : 'Crear cuenta'}
          </motion.button>
        </form>

        <p className="mt-5 text-center text-sm font-bold text-surface-500">
          Ya tienes cuenta?{' '}
          <button onClick={() => { audioManager.play('navigate'); window.location.href = '/ingresar'; }} className="font-black text-[#407516] transition-colors hover:text-edu-blue-dark">
            Inicia sesion
          </button>
        </p>
      </motion.div>
    </main>
  );
}

function InputRow({
  icon,
  type,
  placeholder,
  error,
  register,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-0 flex h-full items-center text-edu-orange">
          {icon}
        </div>
        <input
          {...register}
          type={type}
          placeholder={placeholder}
          className={`input-game pl-11 text-sm ${error ? 'border-edu-pink' : ''}`}
        />
      </div>
      {error && <p className="ml-1 mt-1 text-xs font-black text-edu-pink">{error}</p>}
    </div>
  );
}

function SelectBox({
  placeholder,
  options,
  error,
  register,
}: {
  placeholder: string;
  options: Array<string | { value: string; label: string }>;
  error: boolean;
  register: UseFormRegisterReturn;
}) {
  return (
    <select
      {...register}
      defaultValue=""
      className={`input-game w-full px-3 py-3 text-sm ${error ? 'border-edu-pink' : ''}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}