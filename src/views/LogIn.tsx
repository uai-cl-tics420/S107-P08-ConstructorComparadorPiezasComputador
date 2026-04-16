import { Link } from 'react-router-dom'; // Asegúrate de importar Link
import { LogInSignOn } from '@/components/LogIn/LogIn_SignOn';
import '../index.css';

export function LogIn() {
  return (
    <div className='min-h-screen bg-[#0f1117] text-white flex flex-col'>
      <header className='sticky top-0 z-10 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/5 px-6 py-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <Link to='/' className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm'>
              PC
            </div>
            <div>
              <h1 className='text-base font-bold text-white leading-none'>PC Builder</h1>
              <p className='text-gray-500 text-xs mt-0.5'>Compara precios y arma tu PC</p>
            </div>
          </Link>
        </div>
      </header>

      <main className='flex-1 w-full mx-auto px-6 py-12 flex items-center justify-center'>
        <div className='w-full max-w-3xl h-full flex border border-white/5 rounded-2xl overflow-hidden shadow-2xl'>
          <div className='hidden md:flex w-3/7 bg-linear-to-br from-blue-600/20 to-blue-900/40 border-r border-white/5 flex-col items-center justify-center text-center py-3'>
            <div className='flex flex-col items-center gap-4'>
              <div className='w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg'>
                PC
              </div>
              <h2 className='text-3xl font-bold text-white tracking-tight'>PC Builder</h2>
            </div>
            <div className='flex flex-col items-center gap-2 mt-10'>
              <h3 className='text-xl font-semibold text-blue-100'>¡Bienvenido!</h3>
              <p className='text-blue-300/60 text-sm max-w-48 mx-auto'>
                Compara precios, arma tu build ideal y guarda tus configuraciones.
              </p>
            </div>
          </div>

          <div className='flex-1 flex items-center justify-center bg-[#161922]/50 py-6 w-full'>
            <LogInSignOn />
          </div>
        </div>
      </main>
    </div>
  );
}
