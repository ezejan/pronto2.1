'use client';
import React from 'react';

interface Props {
  rubro: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
}

export default function SelectEspecialidad({
  rubro,
  value,
  onChange,
  label,
}: Props) {
  const opciones: Record<string, string[]> = {
    'Servicios para el Hogar': [
      'Electricista',
      'Plomero',
      'Gasista',
      'Cerrajero',
      'Pintor',
    ],
    Fletes: ['Con Camión', 'Con Utilitario', 'Con Carro', 'Flete Nacional'],
  };

  const especialidades = opciones[rubro] || [];

  return (
    <div className="mb-4">
      {label && <label className="font-semibold mb-2 block">{label}</label>}
      <select
        className="w-full p-2 border border-gray-300 rounded text-gray-800"
        value={value}
        onChange={onChange}
        disabled={especialidades.length === 0}
      >
        <option value="">Seleccioná una especialidad</option>
        {especialidades.map((esp) => (
          <option key={esp} value={esp}>
            {esp}
          </option>
        ))}
      </select>
    </div>
  );
}
