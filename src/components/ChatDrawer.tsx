'use client';

import React, { useEffect, useRef, useState, FormEvent } from 'react';
import { db } from '@/firebase/config';
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ChatDrawerProps {
  chatId: string;
  userEmail: string;
  onClose?: () => void;
}

interface Mensaje {
  id: string;
  texto: string;
  timestamp: { seconds: number; nanoseconds: number } | null;
  autor: string;
}

export default function ChatDrawer({
  chatId,
  userEmail,
  onClose,
}: ChatDrawerProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [interlocutor, setInterlocutor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // VERIFICACION EXTRA LOGS
  useEffect(() => {
    if (!chatId) {
      console.log('No hay chatId');
      return;
    }
    setLoading(true);

    // Quienes participan en el chat
    const participantes = chatId.split('_');
    const otro = participantes.find((p) => p !== userEmail) || participantes[0];
    setInterlocutor(otro);

    // Creamos el chat si no existe
    const chatDocRef = doc(db, 'chats', chatId);
    getDoc(chatDocRef)
      .then((docSnap: QueryDocumentSnapshot<DocumentData> | any) => {
        if (!docSnap.exists()) {
          setDoc(chatDocRef, { participantes });
          console.log('Chat creado:', chatId, participantes);
        } else {
          console.log('Chat ya existe:', chatId);
        }
      })
      .catch((err: unknown) => {
        console.error('Error getDoc chat:', err);
      });

    // Escuchar mensajes en tiempo real
    const q = query(
      collection(db, 'chats', chatId, 'mensajes'),
      orderBy('timestamp'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: Mensaje[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Mensaje, 'id'>),
        }));
        setMensajes(arr);
        setLoading(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
        console.log('Mensajes cargados:', arr.length);
      },
      (err: unknown) => {
        console.error('onSnapshot error:', err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [chatId, userEmail]);

  // Enviar mensaje
  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const texto = nuevoMensaje.trim();
    if (!texto) return;
    try {
      await addDoc(collection(db, 'chats', chatId, 'mensajes'), {
        texto,
        timestamp: serverTimestamp(),
        autor: userEmail,
      });
      setNuevoMensaje('');
    } catch (err) {
      alert('Error enviando mensaje');
      console.error('addDoc error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-end justify-center md:items-center md:p-10">
      <div className="w-full md:w-[410px] max-h-[90vh] bg-white rounded-t-2xl md:rounded-2xl shadow-lg flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-[#13797e]/10 rounded-t-2xl">
          <div className="font-bold text-[#13797e] truncate">
            {interlocutor || 'Chat'}
          </div>
          <button onClick={onClose}>
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
          {loading ? (
            <div className="text-center text-gray-400">Cargando mensajes…</div>
          ) : mensajes.length === 0 ? (
            <div className="text-center text-gray-400">
              ¡No hay mensajes! Escribí el primero.
            </div>
          ) : (
            mensajes.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.autor === userEmail ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl max-w-xs break-words text-[15px] shadow ${
                    m.autor === userEmail
                      ? 'bg-[#13797e] text-white rounded-br-none'
                      : 'bg-white text-gray-900 border rounded-bl-none'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {m.texto}
                  <div className="text-[10px] mt-1 text-gray-400 text-right">
                    {m.timestamp?.seconds
                      ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' },
                        )
                      : ''}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-3 py-3 border-t bg-white rounded-b-2xl"
        >
          <input
            type="text"
            className="flex-1 p-2 border rounded-xl text-gray-800"
            placeholder="Escribí un mensaje…"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) handleSend();
            }}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="bg-[#13797e] text-white rounded-xl px-4 py-2 font-semibold hover:bg-[#0e5d61] disabled:opacity-50"
            disabled={!nuevoMensaje.trim() || loading}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
