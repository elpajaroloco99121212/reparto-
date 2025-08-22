"use client";

import { useState } from "react";

export default function Page() {
  const [input, setInput] = useState("");
  const [addresses, setAddresses] = useState<
    { text: string; valid: boolean | null }[]
  >([]);

  // Detecta cuando escribís una nueva línea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Para cada línea hacemos validación en vivo
    Promise.all(lines.map((line) => validateAddress(line))).then((results) => {
      setAddresses(
        lines.map((line, i) => ({ text: line, valid: results[i] }))
      );
    });
  };

  // Función que consulta Nominatim (gratis)
  const validateAddress = async (address: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address + ", Buenos Aires, Argentina"
        )}`
      );
      const data = await res.json();
      return data.length > 0; // true si encontró la dirección
    } catch (err) {
      return false;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        🚚 App Reparto – Optimización de Rutas
      </h1>

      {/* Input de direcciones */}
      <div className="w-full max-w-2xl">
        <label className="block text-gray-700 mb-2">
          Ingresá las direcciones (una por línea):
        </label>
        <textarea
          className="w-full h-40 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={input}
          onChange={handleInputChange}
          placeholder="Ejemplo: Belgrano 893, Quilmes&#10;Zapiola 55A, Bernal"
        />
      </div>

      {/* Lista de direcciones validadas */}
      <div className="w-full max-w-2xl mt-6 space-y-2">
        {addresses.map((addr, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 border rounded-md bg-white shadow-sm"
          >
            <span>{addr.text}</span>
            {addr.valid === null ? (
              <span className="text-gray-400">⏳</span>
            ) : addr.valid ? (
              <span className="text-green-600 font-bold">✔️ Válida</span>
            ) : (
              <span className="text-red-600 font-bold">❌ No encontrada</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
