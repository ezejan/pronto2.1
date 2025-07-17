// src/app/proveedores/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
// import { PlusIcon } from '@heroicons/react/24/outline';  // 🔴 Comentado: no se usa
import Link from 'next/link';

interface Pedido {
  id: string;
  rubro: string;
  especialidad: string;
  zona: string;
  descripcion: string;
  telefono: string;
  email: string;
  estado?: string;
}

export default function ProveedorDetallePage() {
  const { user, loading } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    const fetchPedidos = async () => {
      if (!user?.email) return;
      const provSnap = await getDocs(
        query(collection(db, 'proveedores'), where('email', '==', user.email)),
      );
      if (provSnap.empty) return;
      const { rubro, zona } = provSnap.docs[0].data() as {
        rubro: string;
        zona: string;
      };

      const todosSnap = await getDocs(collection(db, 'pedidos'));
      const todos = todosSnap.docs.map(
        (d): Pedido => ({ ...(d.data() as Pedido) }),
      );
      setPedidos(todos.filter((p) => p.rubro === rubro && p.zona === zona));
    };
    fetchPedidos();
  }, [user]);

  if (loading) {
    return <div>Cargando…</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tus Pedidos</h1>
      {pedidos.length === 0 ? (
        <p>No hay pedidos en tu zona y rubro.</p>
      ) : (
        pedidos.map((p) => (
          <div key={p.id} className="mb-4 border-b pb-4">
            <div>
              <strong>
                {p.rubro} / {p.especialidad}
              </strong>{' '}
              ({p.zona})
            </div>
            <div className="text-sm">{p.descripcion}</div>
            <Link href={`/proveedores/${p.id}`}>
              <button className="mt-2 ml-2 bg-[#13797e] text-white px-4 py-1 rounded">
                Ver detalles
              </button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
