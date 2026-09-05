'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, Building2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { usePanelStore } from '../store/usePanelStore';
import { audioManager } from '../lib/audio';
import { AnimatedBackground } from '../components/shared/AnimatedBackground';
import { RolUsuario } from '../types';

export default function LoginPage() {
  const router = useRouter();
  const login = usePanelStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [rol, setRol] = useState<RolUsuario>('docente');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; institucion?: string; general?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string; institucion?: string; general?: string } = {};
    if (!email.trim()) newErrors.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@gmail\.com$/.test(email)) newErrors.email = 'El correo debe ser un correo Gmail válido (@gmail.com)';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    if (!institucion.trim()) newErrors.institucion = 'La institución es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    await new Promise((r) => setTimeout(r, 800));
    const result = login(email, password, institucion, rol);
    setLoading(false);
    if (result.success) {
      router.push('/panel');
      router.refresh();
    } else {
      setErrors({ general: result.error || 'Credenciales incorrectas' });
    }
  };

  const demoAccounts = [
    { email: 'roberto.admin@gmail.com', password: 'admin123', name: 'Roberto Admin', role: 'admin' as RolUsuario, institucion: 'Universidad Nacional' },
    { email: 'ana.garcia@gmail.com', password: 'demo123', name: 'Ana García', role: 'docente' as RolUsuario, institucion: 'Universidad Nacional' },
    { email: 'carlos.lopez@gmail.com', password: 'demo123', name: 'Carlos López', role: 'docente' as RolUsuario, institucion: 'Instituto Tecnológico' },
  ];

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
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 250, damping: 20 }}
          >
            <Card variant="cyan">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-foreground">Bienvenido de vuelta</h2>
                  <p className="text-sm text-gray-400 mt-1">Inicia sesión para continuar</p>
                </div>

                {errors.general && (
                  <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errors.general}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="correo@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => validate()}
                        className="pl-11"
                        disabled={loading}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {errors.email && (
                      <p id="email-error" className="text-sm text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.email}
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => validate()}
                        className="pl-11 pr-11"
                        disabled={loading}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? 'password-error' : undefined}
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
                    {errors.password && (
                      <p id="password-error" className="text-sm text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Institución</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Nombre de tu institución"
                        value={institucion}
                        onChange={(e) => setInstitucion(e.target.value)}
                        onBlur={() => validate()}
                        className="pl-11"
                        disabled={loading}
                        aria-invalid={!!errors.institucion}
                        aria-describedby={errors.institucion ? 'institucion-error' : undefined}
                      />
                    </div>
                    {errors.institucion && (
                      <p id="institucion-error" className="text-sm text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {errors.institucion}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                      <Select value={rol} onValueChange={(v) => setRol(v as RolUsuario)} disabled={loading}>
                        <SelectTrigger className="pl-11">
                          <SelectValue placeholder="Selecciona tu rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="docente">Docente</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading} onClick={() => audioManager.play('submit')}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </Button>
                </form>

                <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                  <p className="text-xs text-gray-400 mb-4">Cuentas de demostración</p>
                  <div className="space-y-2">
                    {demoAccounts.map((account, i) => (
                      <motion.div
                        key={account.email}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-12"
                          onClick={() => {
                            audioManager.play('select');
                            setEmail(account.email);
                            setPassword(account.password);
                            setInstitucion(account.institucion);
                            setRol(account.role);
                            setErrors({});
                          }}
                          disabled={loading}
                        >
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-xl',
                             account.role === 'admin' ? 'bg-amber-50' : 'bg-[#00A0B5]/10'
                          )}>
                            {account.role === 'admin'
                              ? <Shield className="h-4 w-4 text-amber-500" />
                               : <Mail className="h-4 w-4 text-[#00A0B5]" />
                            }
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-sm">{account.name}</p>
                            <p className="text-xs text-gray-400">{account.email} · {account.role === 'admin' ? 'Admin' : 'Docente'}</p>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-gray-400">
                    ¿Olvidaste tu contraseña?
                  </p>
                  <p className="text-sm text-gray-500">
                    ¿No tienes cuenta?{' '}
                    <button
                      onClick={() => { audioManager.play('navigate'); router.push('/panel/register'); }}
                       className="font-bold text-[#00A0B5] hover:underline"
                    >
                      Crear cuenta
                    </button>
                  </p>
                  <button
                    onClick={() => { audioManager.play('navigate'); router.push('/'); }}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#00A0B5]/30 bg-[#00A0B5]/10 px-4 py-2.5 text-sm font-semibold text-[#00A0B5] transition-all duration-200 hover:bg-[#00A0B5]/20 hover:border-[#00A0B5]/50 hover:shadow-md hover:shadow-[#00A0B5]/10 active:scale-95"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
