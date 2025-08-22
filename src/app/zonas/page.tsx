"use client";

import { useState } from "react";

export default function Page() {
  const [direcciones, setDirecciones] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [resultado, setResultado] = useState<string[]>([]);
  const [googleLink, setGoogleLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [validaciones, setValidaciones] = useState<{ [key: string]: boolean | null }>({});

  // Validar dirección en Nominatim
  const validarDireccion = async (direccion: string) => {
    if (!direccion.trim()) return null;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          direccion
        )}&addressdetails=1`
      );
      const data = await res.json();
      return data.length > 0;
    } catch {
      return false;
    }
  };

  // Cada vez que el usuario escribe, validamos todas las direcciones
  const handleDireccionesChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDirecciones(value);

    const lineas = value.split("\n").map((d) => d.trim()).filter(Boolean);

    const resultados = await Promise.all(lineas.map((d) => validarDireccion(d)));

    const estado: { [key: string]: boolean | null } = {};
    lineas.forEach((linea, i) => {
      estado[linea] = resultados[i];
    });

    setValidaciones(estado);
  };

  const obtenerCoordenadas = async (direccion: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          direccion
        )}&addressdetails=1`
      );
      const data = await res.json();
      return data[0] ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
    } catch {
      return null;
    }
  };

  const calcularDistancia = ([lat1, lon1]: number[], [lat2, lon2]: number[]) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const calcularRuta = async () => {
    if (!inicio.trim() || !fin.trim()) {
      alert("Por favor completá punto de inicio y destino final.");
      return;
    }

    setLoading(true);

    const puntos = [
      { tipo: "inicio", direccion: inicio.trim() },
      ...direcciones
        .split("\n")
        .map((d) => d.trim())
        .filter(Boolean)
        .map((direccion) => ({ tipo: "intermedia", direccion })),
      { tipo: "fin", direccion: fin.trim() },
    ];

    const puntosConCoord = await Promise.all(
      puntos.map(async (p) => {
        const coord = await obtenerCoordenadas(p.direccion);
        return coord ? { ...p, coord } : null;
      })
    );

    const validos = puntosConCoord.filter(Boolean) as {
      tipo: string;
      direccion: string;
      coord: number[];
    }[];

    const inicioCoord = validos.find((p) => p.tipo === "inicio");
    const finCoord = validos.find((p) => p.tipo === "fin");

    if (!inicioCoord || !finCoord) {
      alert("No se pudieron obtener coordenadas válidas para inicio o fin.");
      setLoading(false);
      return;
    }

    const intermedias = validos.filter((p) => p.tipo === "intermedia");

    let ordenadas: typeof intermedias = [];
    let actual = inicioCoord;
    let restantes = [...intermedias];
    while (restantes.length > 0) {
      restantes.sort(
        (a, b) =>
          calcularDistancia(actual.coord, a.coord) - calcularDistancia(actual.coord, b.coord)
      );
      const siguiente = restantes.shift()!;
      ordenadas.push(siguiente);
      actual = siguiente;
    }

    const todasOrdenadas = [inicioCoord, ...ordenadas, finCoord];

    const resultadoEtiquetado = todasOrdenadas.map((p, idx) => `${idx + 1}. ${p.direccion}`);
    setResultado(resultadoEtiquetado);

    const origin = encodeURIComponent(inicioCoord.direccion);
    const destination = encodeURIComponent(finCoord.direccion);
    const waypoints = todasOrdenadas
      .slice(1, -1)
      .map((p) => encodeURIComponent(p.direccion))
      .join("%7C");

    const googleMapsURL = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${origin}&destination=${destination}&waypoints=${waypoints}&avoid=tolls`;

    setGoogleLink(googleMapsURL);

    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4 bg-gradient-to-br from-green-600 via-green-800 to-black min-h-screen text-white font-bold">
      <h1 className="text-3xl text-center mb-4 drop-shadow-lg">
        🚚 App Reparto - Rutas Inteligentes
      </h1>

      <div className="space-y-3 max-w-xl mx-auto">
        <input
          type="text"
          placeholder="📍 Punto de inicio (ej: Av. Rivadavia 4000)"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          className="w-full p-3 border border-green-400 rounded-xl shadow-md text-black"
        />

        <textarea
          placeholder="📦 Ingresá las direcciones, una por línea"
          value={direcciones}
          onChange={handleDireccionesChange}
          className="w-full p-3 border border-green-400 rounded-xl shadow-md h-40 text-black"
        />

        {/* Lista con validación ✔️ ❌ */}
        <div className="space-y-1">
          {Object.entries(validaciones).map(([linea, estado], i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-white text-green-800 rounded-md p-2 shadow"
            >
              <span>{linea}</span>
              {estado === null ? (
                <span className="text-gray-400">⏳</span>
              ) : estado ? (
                <span className="text-green-600 font-bold">✔️</span>
              ) : (
                <span className="text-red-600 font-bold">❌</span>
              )}
            </div>
          ))}
        </div>

        <input
          type="text"
          placeholder="🏠 Destino final (ej: Calle Falsa 123)"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          className="w-full p-3 border border-green-400 rounded-xl shadow-md text-black"
        />

        <button
          onClick={calcularRuta}
          className="bg-white text-green-800 px-6 py-3 rounded-xl hover:bg-green-200 shadow-lg w-full"
          disabled={loading}
        >
          {loading ? "Calculando ruta..." : "🚀 Calcular Ruta Inteligente"}
        </button>
      </div>

      {loading && (
        <div className="max-w-xl mx-auto mt-4 text-center text-white font-semibold">
          <div className="w-full bg-green-300 rounded-full h-2.5 mb-4 overflow-hidden">
            <div className="bg-green-600 h-2.5 animate-pulse w-full"></div>
          </div>
          Procesando las direcciones, por favor espera...
        </div>
      )}

      {resultado.length > 0 && !loading && (
        <div className="space-y-4 max-w-xl mx-auto bg-white text-green-800 rounded-xl p-4 shadow-lg border border-green-400 font-bold">
          <h2 className="text-xl">🗺️ Paradas ordenadas:</h2>
          <ul className="list-disc list-inside">
            {resultado.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <a
            href={googleLink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline block"
          >
            🌐 Ver ruta optimizada en Google Maps ↗
          </a>
        </div>
      )}
    </div>
  );
}
