"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, CheckCircle, XCircle } from "lucide-react";

type ValidationState = "pending" | "valid" | "invalid" | null;

async function validateAddress(address: string, controller: AbortController): Promise<boolean> {
  if (!address.trim()) return false;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
      { signal: controller.signal }
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

  // refs para cancelar requests previos
  const startController = useRef<AbortController | null>(null);
  const endController = useRef<AbortController | null>(null);
  const lineControllers = useRef<Record<number, AbortController>>({});

  // Valida dirección de inicio o fin
  const validateField = async (text: string, field: "start" | "end") => {
    if (field === "start") {
      if (startController.current) startController.current.abort();
      startController.current = new AbortController();
      setStartValidation("pending");
      const ok = await validateAddress(text, startController.current);
      setStartValidation(ok ? "valid" : "invalid");
    } else {
      if (endController.current) endController.current.abort();
      endController.current = new AbortController();
      setEndValidation("pending");
      const ok = await validateAddress(text, endController.current);
      setEndValidation(ok ? "valid" : "invalid");
    }
  };

  // Valida cada línea de direcciones
  const validateLine = async (text: string, index: number) => {
    if (lineControllers.current[index]) lineControllers.current[index].abort();
    const controller = new AbortController();
    lineControllers.current[index] = controller;
    setValidations((prev) => ({ ...prev, [index]: "pending" }));
    const ok = await validateAddress(text, controller);
    setValidations((prev) => ({ ...prev, [index]: ok ? "valid" : "invalid" }));
  };

  const handleAddressChange = (value: string) => {
    const lines = value.split("\n");
    setAddresses(lines);
    lines.forEach((line, idx) => {
      if (line.trim()) {
        validateLine(line, idx);
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
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 space-y-4">
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
              validateField(e.target.value, "start");
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
              validateField(e.target.value, "end");
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
    </div>
  );
}
