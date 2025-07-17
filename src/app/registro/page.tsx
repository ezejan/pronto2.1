'use client';
import { useState, ChangeEvent } from 'react';
import { auth, db } from '@/firebase/config';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { logError } from '@/utils/logError';
import SelectPartido from '@/components/SelectPartido';
import SelectRubro from '@/components/SelectRubro';
import SelectEspecialidad from '@/components/SelectEspecialidad';

type Rol = 'solicitante' | 'proveedor' | '';

interface DatosRegistro {
  nombre: string;
  telefono: string;
  email: string;
  password: string;
  rubro: string;
  especialidad: string;
  zona: string;
}

export default function Registro() {
  const router = useRouter();
  const [rol, setRol] = useState<Rol>('');
  const [datos, setDatos] = useState<DatosRegistro>({
    nombre: '',
    telefono: '',
    email: '',
    password: '',
    rubro: '',
    especialidad: '',
    zona: '',
  });

  const actualizarDato = (campo: keyof DatosRegistro, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleRegistro = async () => {
    if (
      !rol ||
      !datos.nombre ||
      !datos.telefono ||
      !datos.email ||
      !datos.password ||
      !datos.zona
    ) {
      alert('Por favor completá todos los campos obligatorios.');
      return;
    }

    if (rol === 'proveedor' && (!datos.rubro || !datos.especialidad)) {
      alert('Completá rubro y especialidad para proveedores.');
      return;
    }

    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        datos.email,
        datos.password,
      );
      const user = userCredential.user;

      // 2. Enviar verificación de correo
      await sendEmailVerification(user);

      // 3. Guardar datos del perfil en Firestore usando UID como ID
      await setDoc(
        doc(db, rol === 'proveedor' ? 'proveedores' : 'solicitantes', user.uid),
        {
          uid: user.uid,
          nombre: datos.nombre,
          telefono: datos.telefono,
          email: datos.email,
          zona: datos.zona,
          rubro: datos.rubro,
          especialidad: datos.especialidad,
          rol,
          fechaRegistro: new Date(),
        },
      );

      alert('✅ Registro exitoso. Verificá tu email antes de iniciar sesión.');
      router.push('/login');
    } catch (error) {
      logError(error, 'registro');
      // El error de Firebase es tipo unknown, por eso casteamos a { message?: string }
      const mensaje =
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
          ? (error as { message?: string }).message
          : '';
      alert('Ocurrió un error al registrarte. ' + mensaje);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <Image
        src="/fondo-prontoapp.png"
        alt="Fondo ilustrado"
        fill
        priority
        className="object-cover -z-10 opacity-30"
      />
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Registro
        </h1>

        <select
          className="w-full mb-4 p-2 border rounded text-gray-800"
          value={rol}
          onChange={(e) => setRol(e.target.value as Rol)}
        >
          <option value="">Seleccioná tu rol</option>
          <option value="solicitante">Quiero solicitar servicios</option>
          <option value="proveedor">Soy proveedor</option>
        </select>

        <input
          className="w-full mb-3 p-2 border rounded text-gray-800"
          placeholder="Nombre completo"
          value={datos.nombre}
          onChange={(e) => actualizarDato('nombre', e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 border rounded text-gray-800"
          placeholder="Teléfono"
          value={datos.telefono}
          onChange={(e) => actualizarDato('telefono', e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 border rounded text-gray-800"
          placeholder="Email"
          value={datos.email}
          onChange={(e) => actualizarDato('email', e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 border rounded text-gray-800"
          type="password"
          placeholder="Contraseña"
          value={datos.password}
          onChange={(e) => actualizarDato('password', e.target.value)}
        />

        <SelectPartido
          value={datos.zona}
          onChange={(e) => actualizarDato('zona', e.target.value)}
          label="Zona o Partido"
        />

        {rol === 'proveedor' && (
          <>
            <SelectRubro
              value={datos.rubro}
              onChange={(e) => actualizarDato('rubro', e.target.value)}
              label="Rubro"
            />
            <SelectEspecialidad
              rubro={datos.rubro}
              value={datos.especialidad}
              onChange={(e) => actualizarDato('especialidad', e.target.value)}
              label="Especialidad"
            />
          </>
        )}

        <button
          onClick={handleRegistro}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}
