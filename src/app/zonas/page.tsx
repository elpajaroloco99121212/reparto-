"use client";

import { useState, useEffect } from "react";
import { MapPin, CheckCircle, XCircle } from "lucide-react";
import debounce from "lodash.debounce";

type ValidationState = "pending" | "valid" | "invalid" | null;

async function validateAddress(address: string): Promise<boolean> {
  if (!address.trim()) return false;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await res.json();
    return data.length > 0;
  } catch {
    return false;
  }
}

export default function Home() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [validations, setValidations] = useState<Record<number, ValidationState>>({});
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startValidation, setStartValidation] = useState<ValidationState>(null);
  const [endValidation, setEndValidation] = useState<ValidationState>(null);

  // Debounced validator
  const debouncedValidate = debounce(async (text: string, index?: number, field?: "start" | "end") => {
    if (field === "start") {
      const ok = await validateAddress(text);
      setStartValidation(ok ? "valid" : "invalid");
    } else if (field === "end") {
      const ok = await validateAddress(text);
      setEndValidation(ok ? "valid" : "invalid");
    } else if (index !== undefined) {
      const ok = await validateAddress(text);
      setValidations((prev) => ({ ...prev, [index]: ok ? "valid" : "invalid" }));
    }
  }, 400);

  const handleAddressChange = (value: string) => {
    const lines = value.split("\n");
    setAddresses(lines);
    lines.forEach((line, idx) => {
      if (line.trim()) {
        setValidations((prev) => ({ ...prev, [idx]: "pending" }));
        debouncedValidate(line, idx);
      }
    });
  };

  const renderValidationIcon = (state: ValidationState) => {
    if (state === "pending") return <span className="text-gray-400">...</span>;
    if (state === "valid") return <CheckCircle className="text-green-500 inline w-5 h-5" />;
    if (state === "invalid") return <XCircle className="text-red-500 inline w-5 h-5" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white shadow-xl rounded-2xl grid grid-cols-3">
        {/* Columna izquierda */}
        <div className="col-span-2 p-6 space-y-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" /> App Reparto Inteligente
          </h1>

          {/* Punto de inicio */}
          <div>
            <label className="block font-semibold">Punto de inicio:</label>
            <input
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setStartValidation("pending");
                debouncedValidate(e.target.value, undefined, "start");
              }}
              placeholder="Ej: Quilmes, Belgrano 893"
              className="w-full p-2 border rounded-lg"
            />
            {renderValidationIcon(startValidation)}
          </div>

          {/* Punto final */}
          <div>
            <label className="block font-semibold">Destino final:</label>
            <input
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setEndValidation("pending");
                debouncedValidate(e.target.value, undefined, "end");
              }}
              placeholder="Ej: Florencio Varela, Av. San Martín 123"
              className="w-full p-2 border rounded-lg"
            />
            {renderValidationIcon(endValidation)}
          </div>

          {/* Direcciones */}
          <div>
            <label className="block font-semibold">Ingresa las direcciones (una por línea):</label>
            <textarea
              rows={6}
              className="w-full p-2 border rounded-lg"
              placeholder="Ej: Wilde, Helguera 5899&#10;Bernal, Zapiola 55A"
              onChange={(e) => handleAddressChange(e.target.value)}
            ></textarea>
            <ul className="mt-2 space-y-1">
              {addresses.map((addr, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span>{addr}</span> {renderValidationIcon(validations[idx])}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Columna derecha con logo */}
        <div className="col-span-1 flex items-center justify-center p-6 border-l">
          <img
            src="/logo.png"
            alt="Logo"
            className="max-w-[150px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
