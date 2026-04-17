import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogInSignOn } from '@/components/LogIn/LogIn_SignOn';
import '../index.css';

export function LogIn() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden'
    >

      {/* Grid de fondo — sutil, técnico */}
      <div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none' />
      {/* Viñeta perimetral */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,#050505_100%)] pointer-events-none' />

      {/* Logo — top left */}
      <div className='absolute top-6 left-6 z-20'>
        <Link to='/' className='group flex flex-col gap-0.5'>
          <span className='font-mono text-sm font-bold text-white tracking-[0.12em] uppercase group-hover:text-zinc-300 transition-colors duration-200'>
            PC·BUILDER
          </span>
          <span className='font-mono text-[9px] text-zinc-700 tracking-[0.2em] uppercase'>
            Compara · Arma · Ahorra
          </span>
        </Link>
      </div>

      {/* GlassCard */}
      <div className='relative w-full max-w-sm mx-auto px-4 z-10'>
        <div className='absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-white/10 via-white/3 to-transparent pointer-events-none' />

        <div className='relative rounded-2xl border border-[#222] bg-[#0A0A0A]/95 backdrop-blur-xl z-10 overflow-hidden'>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' />

          <LogInSignOn onAuthSuccess={() => navigate('/')} />
        </div>
      </div>

      {/* Footer */}
      <p className='absolute bottom-6 font-mono text-[9px] text-zinc-800 uppercase tracking-widest z-10'>
        PC Builder — Versión Beta
      </p>
    </motion.div>
  );
}
