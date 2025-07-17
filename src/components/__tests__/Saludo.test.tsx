import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // 👈 esto es clave
import Saludo from '../Saludo';

describe('Saludo', () => {
  it('muestra el saludo al hacer clic', () => {
    render(<Saludo />);
    const boton = screen.getByRole('button', { name: /mostrar saludo/i });
    fireEvent.click(boton);
    expect(screen.getByText('¡Hola, ProntoApp!')).toBeInTheDocument();
  });
});
