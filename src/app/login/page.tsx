'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { logError } from '@/utils/logError';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !clave) {
      setError('Email y contraseña son obligatorios');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        clave,
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError('Debés verificar tu correo antes de ingresar.');
        return;
      }

      const tipos = [
        { tipo: 'proveedor', ruta: '/proveedores' },
        { tipo: 'solicitante', ruta: '/solicitante' },
      ];

      let encontrado = false;

      for (const { tipo, ruta } of tipos) {
        const coleccion = tipo === 'proveedor' ? 'proveedores' : 'solicitantes';
        const ref = collection(db, coleccion);
        const q = query(ref, where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          router.push(ruta);
          encontrado = true;
          break;
        }
      }

      if (!encontrado) {
        setError('No se encontró tu perfil en proveedores ni solicitantes.');
      }
    } catch (err: unknown) {
      logError(err, 'login');
      let mensaje = 'Error al iniciar sesión.';
      if (err instanceof Error) {
        mensaje += ' ' + err.message;
      }
      setError(mensaje);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 px-4">
      <Image
        src="/fondo-prontoapp.png"
        alt="Fondo ilustrado"
        fill
        priority
        className="object-cover -z-10 opacity-30"
      />
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo-prontoapp.png"
            alt="Logo ProntoApp"
            width={100}
            height={100}
          />
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Iniciar sesión
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border border-gray-300 rounded text-gray-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-2 border border-gray-300 rounded text-gray-800"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-600 text-sm font-semibold">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#13797e] hover:bg-[#1c989e] text-white font-semibold py-2 px-4 rounded"
          >
            Ingresar
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          ¿No tenés cuenta?{' '}
          <a href="/registro" className="text-blue-700 hover:underline">
            Registrate
          </a>
        </p>
      </div>
    </div>
  );
}
