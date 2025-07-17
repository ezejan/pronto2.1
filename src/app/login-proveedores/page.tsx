'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { logError } from '@/utils/logError';

export default function LoginProveedores() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Email y contraseña son obligatorios');
      return;
    }

    // 🔐 Simulación de validación
    const validEmail = 'proveedor@prontoapp.com';
    const validPassword = '123456';

    if (email === validEmail && password === validPassword) {
      setError('');
      router.push('/proveedores'); // Redirige al panel
    } else {
      logError('Credenciales inválidas', 'login-proveedores');
      setError('Email o contraseña incorrectos.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 px-4">
      {/* Fondo ilustrado */}
      <Image
        src="/fondo-prontoapp.png"
        alt="Fondo ilustrado"
        fill
        priority
        className="object-cover opacity-20 -z-10"
      />

      <form
        onSubmit={handleLogin}
        className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-xl max-w-md w-full animate-fade-in"
      >
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Iniciar sesión - Proveedores
        </h1>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4 text-gray-800"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-6 text-gray-800"
          required
        />
        <button
          type="submit"
          className="w-full bg-[#db6439] hover:bg-[#00945f] text-white font-semibold py-2 rounded transition"
        >
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}
