'use client';
import React from 'react';

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
}

export default function SelectRubro({ value, onChange, label }: Props) {
  const rubros = ['Servicios para el Hogar', 'Fletes'];

  return (
    <div className="mb-4">
      {label && <label className="font-semibold mb-2 block">{label}</label>}
      <select
        className="w-full p-2 border border-gray-300 rounded text-gray-800"
        value={value}
        onChange={onChange}
      >
        <option value="">Seleccioná un rubro</option>
        {rubros.map((rubro) => (
          <option key={rubro} value={rubro}>
            {rubro}
          </option>
        ))}
      </select>
    </div>
  );
}
