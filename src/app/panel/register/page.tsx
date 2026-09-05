'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, AlertCircle, User, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { usePanelStore } from '../store/usePanelStore';
import { audioManager } from '../lib/audio';
import { AnimatedBackground } from '../components/shared/AnimatedBackground';

const registerSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  correo: z.string().min(1, 'El correo es obligatorio.').regex(/^[^\s@]+@gmail\.com$/, 'El correo debe ser un correo Gmail válido (@gmail.com).'),
  contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmarContrasena: z.string().min(1, 'Confirma tu contraseña.'),
  institucion: z.string().min(2, 'La institución debe tener al menos 2 caracteres.'),
}).refine((data) => data.contrasena === data.confirmarContrasena, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmarContrasena'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const register = usePanelStore((state) => state.register);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = register({
      nombre: data.nombre,
      correo: data.correo,
      contrasena: data.contrasena,
      institucion: data.institucion,
    });
    setLoading(false);
    if (result.success) {
      router.push('/panel');
      router.refresh();
    } else {
      setServerError(result.error || 'Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#FFF7F2', isolation: 'isolate' }}>
      <AnimatedBackground variant="login" />
      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-6"
          >
            <div className="flex justify-center mb-3">
              <img src="/images/logo.png" alt="Logo" className="h-auto w-28 object-contain drop-shadow-md" draggable={false} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: 'spring', stiffness: 250, damping: 20 }}
          >
            <Card variant="cyan">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-foreground">Crear cuenta</h2>
                  <p className="text-sm text-gray-400 mt-1">Regístrate como docente para comenzar</p>
                </div>

                {serverError && (
                  <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {serverError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Tu nombre completo"
                        {...registerField('nombre')}
                        className="pl-11"
                        disabled={loading}
                        aria-invalid={!!errors.nombre}
                        aria-describedby={errors.nombre ? 'nombre-error' : undefined}
                      />
                    </div>
                    {errors.nombre && (
                      <p id="nombre-error" className="text-sm text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.nombre.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="correo@gmail.com"
                        {...registerField('correo')}
                        className="pl-11"
                        disabled={loading}
                        aria-invalid={!!errors.correo}
                        aria-describedby={errors.correo ? 'correo-error' : undefined}
                      />
                    </div>
                    {errors.correo && (
                      <p id="correo-error" className="text-sm text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.correo.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...registerField('contrasena')}
                        className="pl-11 pr-11"
                        disabled={loading}
                        aria-invalid={!!errors.contrasena}
                        aria-describedby={errors.contrasena ? 'contrasena-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => { audioManager.play('toggle'); setShowPassword(!showPassword); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-foreground"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.contrasena && (
                      <p id="contrasena-error" className="text-sm text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.contrasena.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmar contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...registerField('confirmarContrasena')}
                        className="pl-11 pr-11"
                        disabled={loading}
                        aria-invalid={!!errors.confirmarContrasena}
                        aria-describedby={errors.confirmarContrasena ? 'confirmar-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => { audioManager.play('toggle'); setShowConfirmPassword(!showConfirmPassword); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-foreground"
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmarContrasena && (
                      <p id="confirmar-error" className="text-sm text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.confirmarContrasena.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Institución educativa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Nombre de tu institución"
                        {...registerField('institucion')}
                        className="pl-11"
                        disabled={loading}
                        aria-invalid={!!errors.institucion}
                        aria-describedby={errors.institucion ? 'institucion-error' : undefined}
                      />
                    </div>
                    {errors.institucion && (
                      <p id="institucion-error" className="text-sm text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.institucion.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading} onClick={() => audioManager.play('submit')}>
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      onClick={() => { audioManager.play('navigate'); router.push('/panel/login'); }}
                      className="font-bold text-[#407516] hover:underline"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
