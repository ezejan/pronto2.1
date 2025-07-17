'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatDrawer from '@/components/ChatDrawer';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) {
    router.push('/login');
    return null;
  }

  if (!params || !params.chatId) {
    alert('No se pudo abrir el chat, faltan datos');
    router.back();
    return null;
  }

  const raw = params.chatId;
  const chatId = Array.isArray(raw) ? raw[0] : raw;
  const proveedorEmail = decodeURIComponent(chatId);
  const userEmail = user.email!;

  console.log(
    'Abriendo chat con proveedorEmail:',
    proveedorEmail,
    'y user:',
    userEmail,
  );

  return (
    <ChatDrawer
      chatId={proveedorEmail}
      userEmail={userEmail}
      onClose={() => router.back()}
    />
  );
}
