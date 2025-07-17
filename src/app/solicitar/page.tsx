'use client';

import { useState } from 'react';
import { db, auth } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import SelectPartido from '@/components/SelectPartido';
import SelectEspecialidad from '@/components/SelectEspecialidad';
import { useAuth } from '@/context/AuthContext';
import useRequireRole from '@/hooks/useRequireRole';
import { logError } from '@/utils/logError';

export default function Solicitar() {
  const { user, loading } = useAuth();
  const authorized = useRequireRole('solicitante');
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState({
    rubro: '',
    especialidad: '',
    zona: '',
    descripcion: '',
    telefono: '',
    contactoEmail: '',
  });

  const actualizarDato = (campo: string, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const validarPaso = () => {
    if (paso === 1 && !datos.rubro) {
      alert('Por favor seleccioná un rubro.');
      return false;
    }
    if (paso === 2 && !datos.especialidad) {
      alert('Por favor seleccioná una especialidad.');
      return false;
    }
    if (paso === 3 && !datos.zona) {
      alert('Por favor ingresá tu zona o ubicación.');
      return false;
    }
    if (paso === 4 && !datos.descripcion) {
      alert('Por favor escribí una breve descripción.');
      return false;
    }
    if (paso === 5 && (!datos.telefono || !datos.contactoEmail)) {
      alert('Por favor ingresá tu teléfono y email de contacto.');
      return false;
    }
    return true;
  };

  const enviarPedido = async () => {
    try {
      const docRef = await addDoc(collection(db, 'pedidos'), {
        rubro: datos.rubro,
        especialidad: datos.especialidad,
        zona: datos.zona,
        descripcion: datos.descripcion,
        telefono: datos.telefono,
        contactoEmail: datos.contactoEmail,
        email: user?.email,
        fecha: serverTimestamp(),
        estado: 'pendiente',
      });

      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: datos.telefono,
          nombre: datos.contactoEmail,
          rubro: datos.rubro,
          especialidad: datos.especialidad,
          zona: datos.zona,
          pedidoId: docRef.id,
        }),
      });

      alert('¡Pedido enviado correctamente!');
      setPaso(1);
      setDatos({
        rubro: '',
        especialidad: '',
        zona: '',
        descripcion: '',
        telefono: '',
        contactoEmail: '',
      });
    } catch (error) {
      logError(error, 'solicitar');
      alert('Hubo un error al enviar el pedido.');
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700 text-center">
          Para solicitar un servicio, primero tenés que iniciar sesión.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <Image
        src="/fondo-prontoapp.png"
        alt="Fondo ilustrado"
        fill
        priority
        className="object-cover -z-10"
      />

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={async () => {
          try {
            await signOut(auth);
            window.location.href = '/login';
          } catch (error) {
            logError(error, 'solicitar-logout');
            alert('Hubo un error al cerrar sesión.');
          }
        }}
        className="absolute top-6 right-6 text-gray-700 hover:text-gray-900 font-medium"
      >
        Cerrar sesión
      </button>

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-xl w-full max-w-2xl animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-6">
          Formulario de Pedido ({paso}/5)
        </h1>

        {paso === 1 && (
          <div className="mb-4">
            <label className="font-semibold mb-2 block">
              ¿Qué rubro necesitás?
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
              value={datos.rubro}
              onChange={(e) => actualizarDato('rubro', e.target.value)}
            >
              <option value="">Seleccioná un rubro</option>
              <option>Servicios para el Hogar</option>
              <option>Fletes</option>
            </select>
          </div>
        )}
        {paso === 2 && (
          <SelectEspecialidad
            rubro={datos.rubro}
            value={datos.especialidad}
            onChange={(e) => actualizarDato('especialidad', e.target.value)}
            label="Seleccioná una especialidad"
          />
        )}
        {paso === 3 && (
          <SelectPartido
            label="¿En qué partido estás?"
            value={datos.zona}
            onChange={(e) => actualizarDato('zona', e.target.value)}
          />
        )}
        {paso === 4 && (
          <div className="mb-4">
            <label className="font-semibold mb-2 block">
              Breve descripción de lo que necesitás:
            </label>
            <textarea
              rows={4}
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
              placeholder="Ej: Se cortó la luz y necesito electricista urgente."
              value={datos.descripcion}
              onChange={(e) => actualizarDato('descripcion', e.target.value)}
            />
          </div>
        )}
        {paso === 5 && (
          <div className="mb-4">
            <label className="font-semibold mb-2 block">
              Datos de contacto:
            </label>
            <input
              type="text"
              placeholder="Teléfono"
              className="w-full p-2 mb-3 border border-gray-300 rounded text-gray-800"
              value={datos.telefono}
              onChange={(e) => actualizarDato('telefono', e.target.value)}
            />
            <input
              type="email"
              placeholder="Email de contacto"
              className="w-full p-2 border border-gray-300 rounded text-gray-800"
              value={datos.contactoEmail}
              onChange={(e) => actualizarDato('contactoEmail', e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-between mt-6">
          {paso > 1 && (
            <button
              className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
              onClick={() => setPaso(paso - 1)}
            >
              Anterior
            </button>
          )}
          {paso < 5 ? (
            <button
              className="bg-[#13797e] hover:bg-[#1c989e] text-white py-2 px-6 rounded ml-auto"
              onClick={() => validarPaso() && setPaso(paso + 1)}
            >
              Siguiente
            </button>
          ) : (
            <button
              className="bg-[#db6439] hover:bg-[#00945f] text-white py-2 px-6 rounded ml-auto"
              onClick={enviarPedido}
            >
              Enviar Pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
