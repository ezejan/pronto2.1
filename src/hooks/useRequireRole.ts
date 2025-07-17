'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function useRequireRole(
  requiredRole: 'proveedor' | 'solicitante',
) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user || loading) return;

      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/rol', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Error al consultar el rol');
          router.push('/login');
          return;
        }

        const data = await res.json();

        if (data.rol === requiredRole) {
          setAuthorized(true);
        } else {
          console.warn('Rol incorrecto. Redirigiendo...');
          router.push('/login');
        }
      } catch (err) {
        console.error('Error en useRequireRole:', err);
        router.push('/login');
      }
    };

    checkRole();
  }, [user, loading, requiredRole, router]);

  return authorized;
}
