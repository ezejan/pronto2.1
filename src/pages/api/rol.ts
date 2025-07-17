import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '@/firebase/firebaseAdmin';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { logError } from '@/utils/logError';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Sin token' });
    }

    let decoded: { email?: string } | null = null;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return res.status(403).json({ error: 'Token inválido' });
    }

    const email = decoded?.email;
    if (!email) {
      return res.status(400).json({ error: 'Email no encontrado en token' });
    }

    for (const tipo of ['proveedores', 'solicitantes']) {
      const ref = collection(db, tipo);
      const q = query(ref, where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return res.status(200).json({
          rol: tipo === 'proveedores' ? 'proveedor' : 'solicitante',
        });
      }
    }

    return res.status(404).json({ error: 'Rol no encontrado' });
  } catch (error) {
    logError(error, 'rol');
    return res.status(500).json({ error: 'Error al obtener rol' });
  }
}
