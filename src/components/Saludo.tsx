// src/components/Saludo.tsx
import React, { useState } from 'react';

export default function Saludo() {
  const [mostrar, setMostrar] = useState(false);

  return (
    <div>
      <button onClick={() => setMostrar(true)}>Mostrar saludo</button>
      {mostrar && <p>¡Hola, ProntoApp!</p>}
    </div>
  );
}
