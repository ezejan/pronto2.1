'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/firebase/config';
import {
  updateDoc,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// --- Tipos ---
interface PresupuestoData {
  proveedorEmail: string;
  monto: number;
  mensaje?: string;
  fecha: { seconds: number; nanoseconds: number }; // Firestore Timestamp
  seleccionado?: boolean;
}
interface Presupuesto extends PresupuestoData {
  id: string;
}
interface PedidoData {
  rubro: string;
  especialidad: string;
  zona: string;
  descripcion: string;
  estado: string;
  fecha: { seconds: number; nanoseconds: number }; // Firestore Timestamp
}

export default function DetallePedidoPage() {
  const { loading } = useAuth();
  const router = useRouter();
  const params = useParams() as Record<string, string | string[]>;

  // Puede venir como string o array (por si hay slug catchall)
  const rawId = params?.id;
  const id =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

  const [pedido, setPedido] = useState<PedidoData | null>(null);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const activeStates = ['pendiente', 'en curso'];

  // --- Cargar detalle ---
  const loadDetalle = async () => {
    if (!id) return;
    const pedidoSnap = await getDoc(doc(db, 'pedidos', id));
    if (!pedidoSnap.exists()) {
      setPedido(null);
      return;
    }
    setPedido(pedidoSnap.data() as PedidoData);

    const presSnap = await getDocs(
      query(
        collection(db, 'pedidos', id, 'presupuestos'),
        orderBy('fecha', 'desc'),
      ),
    );
    setPresupuestos(
      presSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as PresupuestoData),
      })),
    );
  };

  useEffect(() => {
    loadDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Acciones Presupuestos ---
  const handleAccept = async (pr: Presupuesto) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'pedidos', id), { estado: 'aceptado' });
      await updateDoc(doc(db, 'pedidos', id, 'presupuestos', pr.id), {
        seleccionado: true,
      });
      setToast('Presupuesto aceptado, redirigiendo...');
      setTimeout(() => {
        setToast(null);
        router.replace(`/chat/${encodeURIComponent(pr.proveedorEmail)}`);
      }, 1500);
    } catch {
      alert('Ocurrió un error al aceptar el presupuesto');
    }
  };

  const handleReject = async (pr: Presupuesto) => {
    if (!id) return;
    await deleteDoc(doc(db, 'pedidos', id, 'presupuestos', pr.id));
    await loadDetalle();
  };

  // --- Cancelar pedido ---
  const handleCancelPedido = async () => {
    if (!id) return;
    if (confirm('¿Seguro que querés cancelar este pedido?')) {
      await updateDoc(doc(db, 'pedidos', id), { estado: 'cancelado' });
      router.replace('/solicitante');
    }
  };

  // --- Loader & Validaciones ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Cargando…
      </div>
    );
  }
  if (!id) {
    return (
      <div className="p-4 text-center text-red-600">ID de pedido inválido.</div>
    );
  }
  if (!pedido) {
    return (
      <div className="p-4 text-center text-gray-600">
        No se encontró el pedido.
      </div>
    );
  }

  const isActive = activeStates.includes(pedido.estado);

  // --- UI ---
  return (
    <div className="pt-16 px-4 max-w-xl mx-auto space-y-6">
      {/* Back & Title */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">
          Detalle del pedido
        </h1>
      </div>

      {/* Pedido Info */}
      <div className="pedido-card bg-white rounded-lg shadow-md p-6 border-l-4 border-[#13797e] space-y-2">
        <p className="text-lg font-medium">
          {pedido.rubro} – {pedido.especialidad}
        </p>
        <p className="text-sm text-gray-500 capitalize">
          Estado: {pedido.estado}
        </p>
        <p className="text-sm text-gray-600">{pedido.descripcion}</p>
        <p className="text-xs text-gray-400">
          {new Date(pedido.fecha.seconds * 1000).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">Zona: {pedido.zona}</p>
        {/* --- Botón cancelar --- */}
        {isActive && (
          <button
            onClick={handleCancelPedido}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          >
            Cancelar pedido
          </button>
        )}
      </div>

      {/* Presupuestos */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Presupuestos</h2>

        {/* Si no hay presupuestos */}
        {!presupuestos.length ? (
          <p className="text-gray-500">
            {isActive
              ? 'Aún no recibiste presupuestos.'
              : 'No hay presupuestos registrados.'}
          </p>
        ) : isActive ? (
          // Vista activa con acciones
          presupuestos.map((pr) => (
            <div
              key={pr.id}
              className="pedido-card flex items-center justify-between bg-gray-50 rounded-lg p-4"
            >
              <div>
                <p className="font-medium">{pr.proveedorEmail}</p>
                <p className="text-sm text-gray-500">${pr.monto}</p>
                {pr.mensaje && (
                  <p className="text-xs text-gray-700 italic mt-1">
                    {pr.mensaje}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(pr)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded"
                  title="Rechazar presupuesto"
                >
                  <TrashIcon className="h-5 w-5 inline" />
                </button>
                <button
                  onClick={() => handleAccept(pr)}
                  className="px-3 py-1 bg-green-500 text-white rounded"
                  title="Aceptar presupuesto"
                >
                  <CheckIcon className="h-5 w-5 inline" />
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/chat/${encodeURIComponent(pr.proveedorEmail)}`,
                    )
                  }
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                  title="Chatear"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 inline" />
                </button>
              </div>
            </div>
          ))
        ) : (
          // Vista cerrada con presupuesto seleccionado
          presupuestos
            .filter((p) => p.seleccionado)
            .map((p) => (
              <div
                key={p.id}
                className="pedido-card bg-gray-50 rounded-lg p-4 border-l-4 border-green-500"
              >
                <p className="font-medium">Proveedor: {p.proveedorEmail}</p>
                <p className="text-sm text-gray-500">Monto: ${p.monto}</p>
                <button
                  onClick={() =>
                    router.push(`/chat/${encodeURIComponent(p.proveedorEmail)}`)
                  }
                  className="mt-3 px-3 py-1 bg-blue-500 text-white rounded"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 inline" /> Mensaje
                </button>
              </div>
            ))
        )}
      </section>

      {/* TOAST (aparece abajo centrado si hay mensaje) */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
