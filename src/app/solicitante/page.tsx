'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { db, auth } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signOut, updateEmail } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import useRequireRole from '@/hooks/useRequireRole';
import Link from 'next/link';
import {
  PlusIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UsersIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import SelectEspecialidad from '@/components/SelectEspecialidad';
import SelectPartido from '@/components/SelectPartido';
import BottomNav from '@/components/BottomNav';
import { logError } from '@/utils/logError';

// --- Tipos Firestore ---
interface PresupuestoData {
  proveedorEmail: string;
  monto: number;
  fecha: unknown;
  mensaje?: string;
  seleccionado?: boolean;
}
interface Presupuesto extends PresupuestoData {
  id: string;
  pedidoId: string;
}
interface PedidoData {
  rubro: string;
  especialidad: string;
  zona: string;
  descripcion: string;
  contactoEmail: string;
  telefono: string;
  email: string;
  estado: string;
  fecha: unknown;
}
interface Pedido extends PedidoData {
  id: string;
  presupuestos: Presupuesto[];
}
interface Proveedor {
  id: string;
  nombre: string;
  email: string;
  especialidades?: string[];
  rating?: number;
  zona?: string;
}

type Tab = 'pedidos' | 'historial' | 'proveedores' | 'perfil';

export default function PanelSolicitante() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const authorized = useRequireRole('solicitante');

  // pestaña activa
  const [activeTab, setActiveTab] = useState<Tab>('pedidos');

  // Nuevo Pedido inline
  const [showForm, setShowForm] = useState(false);
  const [paso, setPaso] = useState(1);
  const [datosForm, setDatosForm] = useState({
    rubro: '',
    especialidad: '',
    zona: '',
    descripcion: '',
    telefono: '',
    contactoEmail: '',
  });

  // Datos
  const [historial, setHistorial] = useState<Pedido[]>([]);
  const [pedidosActivos, setPedidosActivos] = useState<Pedido[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Notificaciones
  const [notifications, setNotifications] = useState<Presupuesto[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  // Perfil
  const [profile, setProfile] = useState<{
    id: string;
    nombre: string;
    telefono: string;
    zona: string;
    email: string;
  } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formProfile, setFormProfile] = useState({
    nombre: '',
    telefono: '',
    zona: '',
    email: '',
  });

  const closedStates = ['aceptado', 'completado', 'cancelado'];
  const activeStates = ['pendiente', 'en curso'];

  // carga toda la data
  const loadAll = useCallback(async () => {
    if (!user?.email) return;

    // 1) Pedidos
    const pedidosSnap = await getDocs(
      query(collection(db, 'pedidos'), where('email', '==', user.email)),
    );
    const docs = pedidosSnap.docs
      .map((d) => ({ id: d.id, data: d.data() as PedidoData }))
      .sort((a, b) => {
        // Corregido para evitar el error de tipo "unknown"
        const fechaA = (a.data.fecha as { seconds?: number })?.seconds ?? 0;
        const fechaB = (b.data.fecha as { seconds?: number })?.seconds ?? 0;
        return fechaB - fechaA;
      });
    // 2) Historial (cerrados)
    setHistorial(
      docs
        .filter((d) => closedStates.includes(d.data.estado))
        .slice(0, 4)
        .map((d) => ({ id: d.id, ...d.data, presupuestos: [] })),
    );

    // 3) Activos + presupuestos
    const activos = docs
      .filter((d) => activeStates.includes(d.data.estado))
      .slice(0, 4);
    const activosWithPresu: Pedido[] = await Promise.all(
      activos.map(async (entry) => {
        const ps = await getDocs(
          query(
            collection(db, 'pedidos', entry.id, 'presupuestos'),
            orderBy('fecha', 'desc'),
          ),
        );
        const pres: Presupuesto[] = ps.docs.map((p) => ({
          id: p.id,
          pedidoId: entry.id,
          ...(p.data() as PresupuestoData),
        }));
        return { id: entry.id, ...entry.data, presupuestos: pres };
      }),
    );
    setPedidosActivos(activosWithPresu);

    // 4) Notificaciones
    setNotifications(activosWithPresu.flatMap((p) => p.presupuestos));

    // 5) Proveedores
    let provSnap;
    if (activosWithPresu.length) {
      provSnap = await getDocs(
        query(
          collection(db, 'proveedores'),
          where('zona', '==', activosWithPresu[0].zona),
        ),
      );
    } else {
      provSnap = await getDocs(collection(db, 'proveedores'));
    }
    setProveedores(
      provSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Proveedor, 'id'>),
      })),
    );

    // 6) Perfil
    const perfilQ = query(
      collection(db, 'solicitantes'),
      where('email', '==', user.email),
    );
    const perfilSnap = await getDocs(perfilQ);
    if (!perfilSnap.empty) {
      const dp = perfilSnap.docs[0];
      const d = dp.data() as {
        nombre?: string;
        telefono?: string;
        zona?: string;
        email: string;
      };
      setProfile({
        id: dp.id,
        nombre: d.nombre || '',
        telefono: d.telefono || '',
        zona: d.zona || '',
        email: d.email,
      });
      setFormProfile({
        nombre: d.nombre || '',
        telefono: d.telefono || '',
        zona: d.zona || '',
        email: d.email,
      });
    }
  }, [user]);

  // al montar y cambiar user
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // abrir chat
  const goToChat = (target: string) => {
    router.push(`/chat/${target}`);
    setShowNotif(false);
  };

  // Handlers Nuevo Pedido
  const actualizarDato = (campo: string, valor: string) =>
    setDatosForm((p) => ({ ...p, [campo]: valor }));
  const validarPaso = () => {
    if (paso === 1 && !datosForm.rubro)
      return (alert('Seleccioná un rubro'), false);
    if (paso === 2 && !datosForm.especialidad)
      return (alert('Seleccioná especialidad'), false);
    if (paso === 3 && !datosForm.zona) return (alert('Ingresá zona'), false);
    if (paso === 4 && !datosForm.descripcion)
      return (alert('Describe tu pedido'), false);
    if (paso === 5 && (!datosForm.telefono || !datosForm.contactoEmail))
      return (alert('Teléfono y email son obligatorios'), false);
    return true;
  };
  const enviarPedido = async () => {
    try {
      const ref = await addDoc(collection(db, 'pedidos'), {
        ...datosForm,
        email: user?.email,
        fecha: serverTimestamp(),
        estado: 'pendiente',
      });
      // WhatsApp
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefono: datosForm.telefono,
          nombre: datosForm.contactoEmail,
          rubro: datosForm.rubro,
          especialidad: datosForm.especialidad,
          zona: datosForm.zona,
          pedidoId: ref.id,
        }),
      });
      alert('¡Pedido enviado!');
      setShowForm(false);
      setPaso(1);
      setDatosForm({
        rubro: '',
        especialidad: '',
        zona: '',
        descripcion: '',
        telefono: '',
        contactoEmail: '',
      });
      await loadAll();
    } catch (err) {
      logError(err, 'solicitante');
      alert('Error al enviar pedido');
    }
  };

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center h-screen">Cargando…</div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-gray-200 shadow flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-prontoapp.png"
            alt="ProntoApp Logo"
            width={55}
            height={55}
            className="object-contain"
          />
          <h1 className="text-lg font-bold text-[#13797e]">ProntoApp</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 p-2 rounded-full bg-[#13797e]/10 hover:bg-[#13797e]/20"
          >
            <PlusIcon className="h-5 w-5 text-[#13797e]" />
            <span className="text-sm text-[#13797e] font-medium">
              Nuevo Pedido
            </span>
          </button>

          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => setShowNotif((v) => !v)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <BellIcon className="h-5 w-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white border rounded shadow-lg z-30 text-black">
                <div className="flex justify-between items-center px-4 py-2 border-b">
                  <span className="font-semibold">Notificaciones</span>
                  <button onClick={() => setShowNotif(false)}>
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-800">Sin notificaciones</p>
                ) : (
                  notifications.map((pr) => (
                    <div
                      key={pr.id}
                      className="px-4 py-2 hover:bg-gray-50 border-b cursor-pointer"
                      onClick={() => goToChat(pr.proveedorEmail)}
                    >
                      <p className="text-sm">
                        <strong>{pr.proveedorEmail}</strong> ofertó{' '}
                        <strong>${pr.monto}</strong>
                      </p>
                      <p className="text-xs text-gray-800">
                        Pedido: {pr.pedidoId}
                      </p>
                      <p className="text-xs text-gray-700">
                        {(() => {
                          const fecha = pr.fecha as { seconds?: number };
                          return new Date(
                            (fecha.seconds ?? 0) * 1000,
                          ).toLocaleString();
                        })()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-16 pb-24 px-4 max-w-xl mx-auto space-y-8">
        {/* Inline Nuevo Pedido */}
        {showForm && (
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-2"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Nuevo Pedido ({paso}/5)
            </h2>

            {/* Paso 1: Rubro */}
            {paso === 1 && (
              <div className="mb-4">
                <label className="font-semibold mb-1 block">
                  ¿Qué rubro necesitás?
                </label>
                <select
                  className="w-full p-2 border rounded text-gray-800"
                  value={datosForm.rubro}
                  onChange={(e) => actualizarDato('rubro', e.target.value)}
                >
                  <option value="">Seleccioná un rubro</option>
                  <option>Servicios para el Hogar</option>
                  <option>Fletes</option>
                </select>
              </div>
            )}

            {/* Paso 2: Especialidad */}
            {paso === 2 && (
              <SelectEspecialidad
                rubro={datosForm.rubro}
                value={datosForm.especialidad}
                onChange={(e) => actualizarDato('especialidad', e.target.value)}
                label="Seleccioná especialidad"
              />
            )}

            {/* Paso 3: Zona */}
            {paso === 3 && (
              <SelectPartido
                label="¿En qué partido estás?"
                value={datosForm.zona}
                onChange={(e) => actualizarDato('zona', e.target.value)}
              />
            )}

            {/* Paso 4: Descripción */}
            {paso === 4 && (
              <div className="mb-4">
                <label className="font-semibold mb-1 block">
                  Descripción breve
                </label>
                <textarea
                  rows={3}
                  className="w-full p-2 border rounded text-gray-800"
                  value={datosForm.descripcion}
                  onChange={(e) =>
                    actualizarDato('descripcion', e.target.value)
                  }
                />
              </div>
            )}

            {/* Paso 5: Contacto */}
            {paso === 5 && (
              <div className="space-y-2 mb-4">
                <div>
                  <label className="block font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded text-gray-800"
                    value={datosForm.telefono}
                    onChange={(e) => actualizarDato('telefono', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Email de contacto
                  </label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded text-gray-800"
                    value={datosForm.contactoEmail}
                    onChange={(e) =>
                      actualizarDato('contactoEmail', e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {/* Navegación pasos */}
            <div className="flex justify-between mt-6">
              {paso > 1 && (
                <button
                  onClick={() => setPaso(paso - 1)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Anterior
                </button>
              )}
              {paso < 5 ? (
                <button
                  onClick={() => validarPaso() && setPaso(paso + 1)}
                  className="px-4 py-2 bg-[#13797e] text-white rounded"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={enviarPedido}
                  className="px-4 py-2 bg-[#db6439] text-white rounded"
                >
                  Enviar Pedido
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pestañas */}
        {!showForm && (
          <>
            {/* 🚗 Pedidos en curso */}
            {activeTab === 'pedidos' && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-[#13797e]" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Pedidos en curso
                  </h2>
                </div>
                {pedidosActivos.length > 0 ? (
                  <div className="space-y-4">
                    {pedidosActivos.map((p) => (
                      <div
                        key={p.id}
                        className="card bg-white rounded-lg shadow-md p-4 flex justify-between items-center border-l-4 border-[#13797e]"
                      >
                        <div>
                          <p className="font-medium">
                            {p.rubro} – {p.especialidad}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            Estado: {p.estado}
                          </p>
                        </div>
                        <Link
                          href={`/detallePedido/${p.id}`}
                          className="px-4 py-2 bg-[#13797e] text-white rounded"
                        >
                          Ver detalle
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay pedidos pendientes.</p>
                )}
              </section>
            )}

            {/* 🕒 Historial */}
            {activeTab === 'historial' && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ClockIcon className="h-6 w-6 text-[#13797e]" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Historial (últimos 4)
                  </h2>
                </div>
                {historial.length > 0 ? (
                  <div className="space-y-4">
                    {historial.map((p) => (
                      <div
                        key={p.id}
                        className="card bg-white rounded-lg shadow-md p-4 flex justify-between items-center border-l-4 border-gray-300"
                      >
                        <div>
                          <p className="font-medium">
                            {p.rubro} – {p.especialidad}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {p.estado}
                          </p>
                        </div>
                        <Link
                          href={`/detallePedido/${p.id}`}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                        >
                          Detalle
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No tenés pedidos anteriores.</p>
                )}
              </section>
            )}

            {/* 👥 Proveedores */}
            {activeTab === 'proveedores' && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <UsersIcon className="h-6 w-6 text-[#13797e]" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Proveedores disponibles
                  </h2>
                </div>
                {proveedores.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {proveedores.map((p) => {
                      const esp = Array.isArray(p.especialidades)
                        ? p.especialidades.join(', ')
                        : 'N/D';
                      return (
                        <div
                          key={p.id}
                          className="proveedor-card bg-white rounded-lg shadow-md p-4 border-l-4 border-[#13797e] space-y-1"
                        >
                          <p className="font-medium">{p.nombre}</p>
                          <p className="text-sm text-gray-500">{p.email}</p>
                          <p className="text-sm capitalize">{esp}</p>
                          <p className="text-sm text-gray-500">
                            ⭐ {p.rating ?? 'N/D'}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {p.zona ?? 'N/D'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Link
                              href={`/perfilProveedor/${p.id}`}
                              className="flex-1 text-center text-sm bg-blue-100 text-blue-700 py-1 rounded"
                            >
                              Ver perfil
                            </Link>
                            <button
                              onClick={() => goToChat(p.email)}
                              className="p-2 bg-blue-500 rounded"
                            >
                              <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No hay proveedores disponibles.
                  </p>
                )}
              </section>
            )}

            {/* 🧑 Perfil */}
            {activeTab === 'perfil' && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="h-6 w-6 text-[#13797e]" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Mi perfil
                  </h2>
                </div>
                {!profile ? (
                  <p className="text-gray-500">Cargando perfil…</p>
                ) : editMode ? (
                  <div className="card bg-white rounded-lg shadow-md p-4 space-y-4 relative">
                    <button
                      onClick={() => setEditMode(false)}
                      className="absolute top-3 right-3 p-1"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                      <label className="block text-sm font-medium">Email</label>
                      <input
                        type="email"
                        className="w-full border p-2 rounded text-gray-800"
                        value={formProfile.email}
                        onChange={(e) =>
                          setFormProfile((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Nombre
                      </label>
                      <input
                        className="w-full border p-2 rounded text-gray-800"
                        value={formProfile.nombre}
                        onChange={(e) =>
                          setFormProfile((p) => ({
                            ...p,
                            nombre: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Teléfono
                      </label>
                      <input
                        className="w-full border p-2 rounded text-gray-800"
                        value={formProfile.telefono}
                        onChange={(e) =>
                          setFormProfile((p) => ({
                            ...p,
                            telefono: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Zona</label>
                      <input
                        className="w-full border p-2 rounded text-gray-800"
                        value={formProfile.zona}
                        onChange={(e) =>
                          setFormProfile((p) => ({
                            ...p,
                            zona: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // 1) Auth email
                          if (
                            formProfile.email !== profile.email &&
                            auth.currentUser
                          ) {
                            await updateEmail(
                              auth.currentUser,
                              formProfile.email,
                            );
                          }
                          // 2) Firestore
                          await updateDoc(
                            doc(db, 'solicitantes', profile.id),
                            formProfile,
                          );
                          // 3) state local
                          setProfile((p) => (p ? { ...p, ...formProfile } : p));
                          setEditMode(false);
                        }}
                        className="px-4 py-2 bg-[#13797e] text-white rounded"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setFormProfile({
                            nombre: profile.nombre,
                            telefono: profile.telefono,
                            zona: profile.zona,
                            email: profile.email,
                          });
                        }}
                        className="px-4 py-2 bg-gray-200 rounded"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card bg-white rounded-lg shadow-md p-4 space-y-2">
                    <p>
                      <strong>Nombre:</strong> {profile.nombre}
                    </p>
                    <p>
                      <strong>Email:</strong> {profile.email}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {profile.telefono}
                    </p>
                    <p>
                      <strong>Zona:</strong> {profile.zona}
                    </p>
                    <button
                      onClick={() => setEditMode(true)}
                      className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded"
                    >
                      Editar perfil
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
}
