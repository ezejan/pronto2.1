// src/components/BottomNav.tsx
'use client';

import { Dispatch, SetStateAction } from 'react';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  UsersIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

type Tab = 'pedidos' | 'historial' | 'proveedores' | 'perfil';

export default function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
}) {
  const items: { tab: Tab; icon: React.ElementType; label: string }[] = [
    { tab: 'pedidos', icon: ClipboardDocumentListIcon, label: 'Pedidos' },
    { tab: 'historial', icon: ClockIcon, label: 'Historial' },
    { tab: 'proveedores', icon: UsersIcon, label: 'Proveedores' },
    { tab: 'perfil', icon: UserIcon, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around h-14 z-20">
      {items.map(({ tab, icon: Icon, label }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex flex-col items-center justify-center flex-1"
          >
            <Icon
              className={`h-6 w-6 mb-1 transition-colors ${
                isActive ? 'text-[#13797e]' : 'text-gray-400'
              }`}
            />
            <span
              className={`text-xs transition-colors ${
                isActive ? 'text-[#13797e]' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
