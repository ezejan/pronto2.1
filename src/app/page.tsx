'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const redireccionar = async () => {
      if (user) {
        try {
          const res = await fetch('/api/rol', {
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          });
          const { rol } = await res.json();
          if (rol === 'proveedor') router.push('/proveedores');
          else if (rol === 'solicitante') router.push('/solicitar');
        } catch (error) {
          console.error('Error al redirigir por rol:', error);
        }
      }
    };

    redireccionar();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600 text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 overflow-hidden">
      <Image
        src="/fondo-prontoapp.png"
        alt="Fondo ilustrado"
        fill
        priority
        className="object-cover z-0 opacity-30 animate-fade-in"
      />

      <div className="z-10 text-center px-6 py-10 animate-fade-in-slow">
        <div className="flex justify-center mb-6 animate-bounce-slow">
          <Image
            src="/logo-prontoapp.png"
            alt="Logo ProntoApp"
            width={120}
            height={120}
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-[#13797e] mb-4">
          ProntoApp
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Conectamos personas con profesionales cerca tuyo. Simple y rápido.
        </p>

        <div className="flex flex-col items-center gap-4 mt-4">
          <Link href="/login">
            <button className="bg-[#13797e] hover:bg-[#1c989e] text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:scale-105 transition-transform duration-300">
              Ingresar a mi cuenta
            </button>
          </Link>

          <Link href="/registro">
            <p className="text-sm text-gray-700 hover:underline">
              ¿No estás registrado? Registrate
            </p>
          </Link>

          {user && (
            <Link href="/perfil">
              <button className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded shadow mt-4">
                Ingresar a mi Panel
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
