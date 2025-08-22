"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [mochila, setMochila] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    const audio = new Audio("/bark.mp3");
    audio.play();
    setMochila(true);
  };

  useEffect(() => {
    if (mochila) {
      const timer = setTimeout(() => {
        router.push("/zonas");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [mochila, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-white font-bold"
      style={{
        backgroundImage: "linear-gradient(135deg, #1c3921, #4caf50), url('/anime-bg.jpg')",
        backgroundSize: "cover",
        backgroundBlendMode: "overlay",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 className="text-3xl sm:text-5xl mb-6 drop-shadow-xl">
        ¿Preparado para repartir?
      </h1>

      <div className="relative w-72 h-72 mb-6">
        <Image
          src={mochila ? "/dog-with-bag.png" : "/dog.png"}
          alt="Perrito repartidor"
          layout="fill"
          objectFit="contain"
          className="transition-all duration-1000 ease-in-out"
        />
      </div>

      <button
        onClick={handleClick}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold py-3 px-8 rounded-full text-xl shadow-lg transition-all duration-300"
      >
        ¡wau! digo sí 🐾
      </button>
    </div>
  );
}
