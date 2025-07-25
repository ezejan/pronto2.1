// src/components/SelectPartido.tsx
'use client';
import React from 'react';

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
}

export default function SelectPartido({ value, onChange, label }: Props) {
  const partidos = [
    'Adolfo Alsina',
    'Adolfo Gonzales Chaves',
    'Alberti',
    'Almirante Brown',
    'Arrecifes',
    'Avellaneda',
    'Ayacucho',
    'Azul',
    'Bahía Blanca',
    'Balcarce',
    'Baradero',
    'Benito Juárez',
    'Berazategui',
    'Berisso',
    'Bolívar',
    'Bragado',
    'Brandsen',
    'Campana',
    'Cañuelas',
    'Capitán Sarmiento',
    'Carlos Casares',
    'Carlos Tejedor',
    'Carmen de Areco',
    'Castelli',
    'Chacabuco',
    'Chascomús',
    'Chivilcoy',
    'Colón',
    'Coronel Dorrego',
    'Coronel Pringles',
    'Coronel Rosales',
    'Coronel Suárez',
    'Daireaux',
    'Dolores',
    'Ensenada',
    'Escobar',
    'Esteban Echeverría',
    'Exaltación de la Cruz',
    'Ezeiza',
    'Florencio Varela',
    'Florentino Ameghino',
    'General Alvarado',
    'General Alvear',
    'General Arenales',
    'General Belgrano',
    'General Guido',
    'General La Madrid',
    'General Las Heras',
    'General Lavalle',
    'General Paz',
    'General Pinto',
    'General Pueyrredón',
    'General Rodríguez',
    'General San Martín',
    'General Viamonte',
    'General Villegas',
    'Guaminí',
    'Hipólito Yrigoyen',
    'Hurlingham',
    'Ituzaingó',
    'José C. Paz',
    'Junín',
    'La Costa',
    'La Matanza',
    'La Plata',
    'Lanús',
    'Laprida',
    'Las Flores',
    'Leandro N. Alem',
    'Lincoln',
    'Lobería',
    'Lobos',
    'Lomas de Zamora',
    'Luján',
    'Magdalena',
    'Maipú',
    'Malvinas Argentinas',
    'Mar Chiquita',
    'Marcos Paz',
    'Mercedes',
    'Merlo',
    'Monte',
    'Monte Hermoso',
    'Moreno',
    'Morón',
    'Navarro',
    'Necochea',
    'Olavarría',
    'Patagones',
    'Pehuajó',
    'Pellegrini',
    'Pergamino',
    'Pila',
    'Pilar',
    'Pinamar',
    'Presidente Perón',
    'Puán',
    'Punta Indio',
    'Quilmes',
    'Ramallo',
    'Rauch',
    'Rivadavia',
    'Rojas',
    'Roque Pérez',
    'Saavedra',
    'Saladillo',
    'Salliqueló',
    'Salto',
    'San Andrés de Giles',
    'San Antonio de Areco',
    'San Cayetano',
    'San Fernando',
    'San Isidro',
    'San Miguel',
    'San Nicolás',
    'San Pedro',
    'San Vicente',
    'Suipacha',
    'Tandil',
    'Tapalqué',
    'Tigre',
    'Tordillo',
    'Tornquist',
    'Trenque Lauquen',
    'Tres Arroyos',
    'Tres de Febrero',
    'Tres Lomas',
    'Vicente López',
    'Villa Gesell',
    'Villarino',
    'Zárate',
  ];

  return (
    <div className="mb-4">
      {label && <label className="font-semibold mb-2 block">{label}</label>}
      <select
        className="w-full p-2 border border-gray-300 rounded text-gray-800"
        value={value}
        onChange={onChange}
      >
        <option value="">Seleccioná tu partido</option>
        {partidos.map((partido) => (
          <option key={partido} value={partido}>
            {partido}
          </option>
        ))}
      </select>
    </div>
  );
}
