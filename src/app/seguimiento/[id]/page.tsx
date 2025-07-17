'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';

interface Pedido {
  rubro: string;
  especialidad: string;
  zona: string;
  descripcion: string;
  telefono: string;
  email: string;
  estado?: string;
}

interface Respuesta {
  id: string;
  respuesta: string;
  fecha: { seconds: number; nanoseconds: number };
  pedidoId?: string;
  [key: string]: unknown; // Para permitir propiedades adicionales si existen
}

export default function SeguimientoPedido() {
  const params = useParams();
  let id = '';
  if (params && typeof params === 'object' && 'id' in params) {
    const paramId = (params as { id?: string | string[] }).id;
    if (typeof paramId === 'string') id = paramId;
    else if (Array.isArray(paramId)) id = paramId[0];
  }

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [respuestas, setRespuestas] = useState<any[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      const docRef = doc(db, 'pedidos', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPedido(docSnap.data() as Pedido);
      }

      const respuestasSnap = await getDocs(collection(db, 'respuestas'));
      const respuestasData: Respuesta[] = respuestasSnap.docs
        .filter((docu) => docu.data().pedidoId === id)
        .map((docu) => ({
          id: docu.id,
          ...docu.data(),
        })) as Respuesta[];

      setRespuestas(respuestasData);
    };
    cargarDatos();
  }, [id]);

  if (!pedido) return <div className="p-4">Cargando pedido...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 relative">
      {/* Botón de cerrar sesión si hay usuario */}
      {user && (
        <button
          onClick={async () => {
            try {
              await signOut(auth);
              window.location.href = '/login';
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Error al cerrar sesión:', error);
              alert('Hubo un error al cerrar sesión.');
            }
          }}
          className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded"
        >
          Cerrar sesión
        </button>
      )}

      <h1 className="text-3xl font-bold mb-4">Seguimiento de tu Pedido</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <p>
          <strong>Rubro:</strong> {pedido.rubro}
        </p>
        <p>
          <strong>Especialidad:</strong> {pedido.especialidad}
        </p>
        <p>
          <strong>Zona:</strong> {pedido.zona}
        </p>
        <p>
          <strong>Descripción:</strong> {pedido.descripcion}
        </p>
        <p>
          <strong>Estado:</strong> {pedido.estado || 'Nuevo'}
        </p>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Respuestas de Proveedores</h2>
        {respuestas.length === 0 && <p>No hay respuestas aún.</p>}
        {respuestas.map((r, i) => (
          <div key={i} className="border-t pt-2 mt-2">
            <p>
              <strong>Respuesta:</strong> {r.respuesta}
            </p>
            <p className="text-sm text-gray-500">
              {r.fecha?.seconds
                ? new Date(r.fecha.seconds * 1000).toLocaleString()
                : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
