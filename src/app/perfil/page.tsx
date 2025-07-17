'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import Image from 'next/image';

interface Usuario {
  id?: string;
  nombre: string;
  telefono: string;
  email: string;
  rol: 'proveedor' | 'solicitante';
  zona: string;
  rubro?: string;
  especialidad?: string;
}

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!user?.email) return;

      for (const tipo of ['proveedores', 'solicitantes']) {
        const ref = collection(db, tipo);
        const q = query(ref, where('email', '==', user.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docId = snap.docs[0].id;
          const data = snap.docs[0].data() as Usuario;
          setPerfil({
            ...data,
            rol: tipo === 'proveedores' ? 'proveedor' : 'solicitante',
            id: docId,
          });
          break;
        }
      }
    };

    cargarPerfil();
  }, [user]);

  const actualizarDato = (campo: string, valor: string) => {
    setPerfil((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  };

  const guardarCambios = async () => {
    if (!perfil?.id) return;

    try {
      const ref = doc(
        db,
        perfil.rol === 'proveedor' ? 'proveedores' : 'solicitantes',
        perfil.id,
      );
      await updateDoc(ref, {
        nombre: perfil.nombre,
        telefono: perfil.telefono,
        zona: perfil.zona,
        rubro: perfil.rubro || '',
        especialidad: perfil.especialidad || '',
      });

      setEditando(false);
      alert('✅ Cambios guardados con éxito.');
    } catch (err) {
      console.error(err);
      alert('❌ Hubo un error al guardar los cambios.');
    }
  };

  if (loading) return <div className="p-4">Cargando sesión...</div>;
  if (!user || !perfil)
    return <div className="p-4">Iniciá sesión para ver tu perfil.</div>;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-100 to-green-100">
      <Image
        src="/fondo-prontoapp.png"
        alt="Fondo ilustrado"
        fill
        priority
        className="object-cover -z-10 opacity-20"
      />

      <div className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Tu Perfil
        </h1>

        <div className="space-y-3">
          <label className="block">
            <strong>Nombre:</strong>
            <input
              type="text"
              disabled={!editando}
              className="w-full border p-2 rounded mt-1 text-gray-800"
              value={perfil.nombre}
              onChange={(e) => actualizarDato('nombre', e.target.value)}
            />
          </label>

          <label className="block">
            <strong>Teléfono:</strong>
            <input
              type="text"
              disabled={!editando}
              className="w-full border p-2 rounded mt-1 text-gray-800"
              value={perfil.telefono}
              onChange={(e) => actualizarDato('telefono', e.target.value)}
            />
          </label>

          <p>
            <strong>Email:</strong> {perfil.email}
          </p>
          <p>
            <strong>Rol:</strong> {perfil.rol}
          </p>

          <label className="block">
            <strong>Zona:</strong>
            <input
              type="text"
              disabled={!editando}
              className="w-full border p-2 rounded mt-1 text-gray-800"
              value={perfil.zona}
              onChange={(e) => actualizarDato('zona', e.target.value)}
            />
          </label>

          {perfil.rol === 'proveedor' && (
            <>
              <label className="block">
                <strong>Rubro:</strong>
                <input
                  type="text"
                  disabled={!editando}
                  className="w-full border p-2 rounded mt-1 text-gray-800"
                  value={perfil.rubro || ''}
                  onChange={(e) => actualizarDato('rubro', e.target.value)}
                />
              </label>

              <label className="block">
                <strong>Especialidad:</strong>
                <input
                  type="text"
                  disabled={!editando}
                  className="w-full border p-2 rounded mt-1 text-gray-800"
                  value={perfil.especialidad || ''}
                  onChange={(e) =>
                    actualizarDato('especialidad', e.target.value)
                  }
                />
              </label>
            </>
          )}
        </div>

        <div className="flex justify-end mt-6">
          {editando ? (
            <button
              onClick={guardarCambios}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Guardar
            </button>
          ) : (
            <button
              onClick={() => setEditando(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
