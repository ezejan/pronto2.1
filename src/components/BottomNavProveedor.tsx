'use client';
import { Dispatch, SetStateAction } from 'react';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export type TabProveedor = 'nuevos' | 'aceptados' | 'perfil';

interface BottomNavProveedorProps {
  activeTab: TabProveedor;
  setActiveTab: Dispatch<SetStateAction<TabProveedor>>;
}

const items: {
  tab: TabProveedor;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { tab: 'nuevos', icon: ClipboardDocumentListIcon, label: 'Nuevos' },
  { tab: 'aceptados', icon: CheckCircleIcon, label: 'Aceptados' },
  { tab: 'perfil', icon: UserIcon, label: 'Perfil' },
];

export default function BottomNavProveedor({
  activeTab,
  setActiveTab,
}: BottomNavProveedorProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around h-14 z-20">
      {items.map(({ tab, icon: Icon, label }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex flex-col items-center justify-center flex-1"
            type="button"
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
