'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { signOut, updateEmail } from 'firebase/auth';
import { db, auth } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import useRequireRole from '@/hooks/useRequireRole';
import { logError } from '@/utils/logError';
import {
  BellIcon,
  ArrowLeftOnRectangleIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BottomNavProveedor, {
  TabProveedor,
} from '@/components/BottomNavProveedor';

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

interface PresupuestoData {
  proveedorEmail: string;
  monto: number;
  fecha: Date;
  mensaje?: string;
  seleccionado?: boolean;
}

interface Presupuesto extends PresupuestoData {
  id: string;
  pedidoId: string;
}

interface ProveedorProfile {
  id: string;
  nombre: string;
  rubro: string;
  especialidad: string;
  zona: string;
  telefono: string;
  email: string;
}

export default function PanelProveedores() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const authorized = useRequireRole('proveedor');

  const [activeTab, setActiveTab] = useState<TabProveedor>('nuevos');
  const [pedidosNuevos, setPedidosNuevos] = useState<Pedido[]>([]);
  const [pedidosAceptados, setPedidosAceptados] = useState<Pedido[]>([]);
  const [pedidoActual, setPedidoActual] = useState<Pedido | null>(null);

  const [profile, setProfile] = useState<ProveedorProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formProfile, setFormProfile] = useState({
    nombre: '',
    rubro: '',
    especialidad: '',
    zona: '',
    telefono: '',
    email: '',
  });

  const [nombre, setNombre] = useState('');
  const [disponibilidad, setDisponibilidad] = useState('');
  const [tiempoEstimado, setTiempoEstimado] = useState('');
  const [materialesIncluidos, setMaterialesIncluidos] = useState(false);
  const [presupuesto, setPresupuesto] = useState('');
  const [presupuestoError, setPresupuestoError] = useState('');

  const loadData = React.useCallback(async () => {
    if (!user?.email) return;

    const provSnap = await getDocs(
      query(collection(db, 'proveedores'), where('email', '==', user.email)),
    );
    if (provSnap.empty) return;
    const dp = provSnap.docs[0];
    const perfil = dp.data() as Omit<ProveedorProfile, 'id'>;
    setProfile({ id: dp.id, ...perfil });
    setFormProfile({
      nombre: perfil.nombre || '',
      rubro: perfil.rubro || '',
      especialidad: perfil.especialidad || '',
      zona: perfil.zona || '',
      telefono: perfil.telefono || '',
      email: perfil.email || '',
    });

    const { rubro, zona } = perfil;

    const allSnap = await getDocs(
      query(
        collection(db, 'pedidos'),
        where('rubro', '==', rubro),
        where('zona', '==', zona),
      ),
    );

    const pedidos: Pedido[] = allSnap.docs.map((d) => ({
      ...(d.data() as Pedido),
    }));

    const nuevos: Pedido[] = [];
    const aceptados: Pedido[] = [];

    for (const p of pedidos) {
      const presSnap = await getDocs(
        query(
          collection(db, 'pedidos', p.id, 'presupuestos'),
          orderBy('fecha', 'desc'),
        ),
      );
      const presupuestos: Presupuesto[] = presSnap.docs.map((d) => ({
        id: d.id,
        pedidoId: p.id,
        ...(d.data() as PresupuestoData),
      }));
      const myPres = presupuestos.find(
        (pre) => pre.proveedorEmail === user.email,
      );
      if (!myPres) {
        nuevos.push(p);
      } else if (myPres.seleccionado) {
        aceptados.push(p);
      }
    }

    setPedidosNuevos(nuevos);
    setPedidosAceptados(aceptados);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [user, loadData]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const enviarPresupuesto = async () => {
    if (
      !pedidoActual ||
      !nombre ||
      !disponibilidad ||
      !tiempoEstimado ||
      !presupuesto
    ) {
      setPresupuestoError('Todos los campos son obligatorios');
      return;
    }

    setPresupuestoError('');
    try {
      await addDoc(collection(db, 'pedidos', pedidoActual.id, 'presupuestos'), {
        proveedorEmail: user?.email,
        monto: Number(presupuesto),
        mensaje: `Nombre: ${nombre}\nDisponibilidad: ${disponibilidad}\nTiempo estimado: ${tiempoEstimado}\nIncluye materiales: ${materialesIncluidos ? 'Sí' : 'No'}`,
        fecha: new Date(),
      });

      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: pedidoActual.telefono,
          nombre: pedidoActual.email,
          rubro: pedidoActual.rubro,
          especialidad: pedidoActual.especialidad,
          zona: pedidoActual.zona,
          pedidoId: pedidoActual.id,
          respuesta: `¡Hola! Te envío mi presupuesto:\n\n$${presupuesto} pesos\n\nDetalle:\nNombre: ${nombre}\nDisponibilidad: ${disponibilidad}\nTiempo estimado: ${tiempoEstimado}\nIncluye materiales: ${materialesIncluidos ? 'Sí' : 'No'}\n\nGracias por usar ProntoApp.`,
        }),
      });

      alert('¡Presupuesto enviado correctamente!');
      setPedidoActual(null);
      setNombre('');
      setDisponibilidad('');
      setTiempoEstimado('');
      setMaterialesIncluidos(false);
      setPresupuesto('');
      await loadData();
    } catch (error) {
      logError(error, 'enviar-presupuesto');
      alert('Error al enviar presupuesto.');
    }
  };

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center h-screen">Cargando…</div>
    );
  }

  // JSX de la interfaz principal
  return (
    <div>
      {/* Aquí va tu interfaz visual: header, tabs, cards, etc. */}
      {/* Si querés el JSX de ejemplo, avisame y te lo agrego */}
    </div>
  );
}
