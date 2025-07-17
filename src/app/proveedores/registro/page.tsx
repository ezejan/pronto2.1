'use client';
import { useState } from 'react';
import { db, auth } from '@/firebase/config';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import SelectPartido from '@/components/SelectPartido';
import SelectRubro from '@/components/SelectRubro';
import SelectEspecialidad from '@/components/SelectEspecialidad';
import Image from 'next/image';

export default function RegistroProveedor() {
  const [datos, setDatos] = useState({
    nombre: '',
    rubro: '',
    especialidad: '',
    zona: '',
    telefono: '',
    email: '',
    password: '',
  });

  const actualizarDato = (campo: string, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const registrarProveedor = async () => {
    try {
      const credenciales = await createUserWithEmailAndPassword(
        auth,
        datos.email,
        datos.password,
      );

      await sendEmailVerification(credenciales.user);

      await addDoc(collection(db, 'proveedores'), {
        nombre: datos.nombre,
        rubro: datos.rubro,
        especialidad: datos.especialidad,
        zona: datos.zona,
        telefono: datos.telefono,
        email: datos.email,
        uid: credenciales.user.uid,
        fechaRegistro: new Date(),
      });

      alert('¡Registro exitoso! Revisá tu email para verificar tu cuenta.');
      setDatos({
        nombre: '',
        rubro: '',
        especialidad: '',
        zona: '',
        telefono: '',
        email: '',
        password: '',
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al registrar:', error);
        alert(error.message);
      } else {
        console.error('Error desconocido:', error);
        alert('Ocurrió un error desconocido');
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <Image
        src="/fondo-prontoapp.png"
        alt="Fondo ilustrado"
        fill
        priority
        className="object-cover -z-10"
      />
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Registro de Proveedor
        </h1>

        <input
          className="w-full mb-3 p-2 border rounded text-gray-800"
          placeholder="Nombre completo"
          value={datos.nombre}
          onChange={(e) => actualizarDato('nombre', e.target.value)}
        />

        <SelectRubro
          value={datos.rubro}
          onChange={(e) => actualizarDato('rubro', e.target.value)}
          label="Seleccioná un rubro"
        />

        <SelectEspecialidad
          rubro={datos.rubro}
          value={datos.especialidad}
          onChange={(e) => actualizarDato('especialidad', e.target.value)}
          label="Seleccioná una especialidad"
        />

        <SelectPartido
          value={datos.zona}
          onChange={(e) => actualizarDato('zona', e.target.value)}
          label="Seleccioná tu partido"
        />

        <input
          className="w-full mb-3 p-2 border rounded text-gray-800"
          placeholder="Teléfono"
          value={datos.telefono}
          onChange={(e) => actualizarDato('telefono', e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 border rounded text-gray-800"
          type="email"
          placeholder="Email"
          value={datos.email}
          onChange={(e) => actualizarDato('email', e.target.value)}
        />

        <input
          className="w-full mb-4 p-2 border rounded text-gray-800"
          type="password"
          placeholder="Contraseña"
          value={datos.password}
          onChange={(e) => actualizarDato('password', e.target.value)}
        />

        <button
          onClick={registrarProveedor}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}
