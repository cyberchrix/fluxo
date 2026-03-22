"use client";

import { useState } from "react";
import { importTransactions } from "@/lib/importTransactions";

export default function ImportPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const existing = JSON.parse(localStorage.getItem("transactions") || "[]");

      const res = await importTransactions(file, existing);

      const updated = [...existing, ...res.newTransactions];

      localStorage.setItem("transactions", JSON.stringify(updated));

      setResult(res);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'import 😢");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-6 text-center">
          Importer mes dépenses
        </h1>

        {/* UPLOAD */}
        <div className="bg-gray-900 p-6 rounded-xl shadow mb-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="w-full border border-gray-700 bg-black p-3 rounded-lg cursor-pointer"
          />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center text-blue-400 animate-pulse">
            Import en cours...
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-6 space-y-3 animate-fade-in">
            {/* SUCCESS */}
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-xl">
              <span>✅ Nouvelles transactions</span>
              <span className="text-lg font-bold">{result.totalImported}</span>
            </div>

            {/* DUPLICATES */}
            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-xl">
              <span>⚠️ Doublons ignorés</span>
              <span className="text-lg font-bold">
                {result.totalDuplicates}
              </span>
            </div>

            {/* IGNORED */}
            {result.totalIgnored > 0 && (
              <div className="flex items-center justify-between bg-gray-800 border border-gray-700 text-gray-400 px-4 py-3 rounded-xl">
                <span>ℹ️ Lignes ignorées</span>
                <span className="text-lg font-bold">{result.totalIgnored}</span>
              </div>
            )}

            {/* GLOBAL MESSAGE */}
            <div className="bg-blue-500/10 border border-blue-500 text-blue-400 p-4 rounded-xl text-center">
              🎉 Import réussi — tes données sont à jour
            </div>

            {/* NAVIGATION */}
            <div className="text-center mt-4">
              <a
                href="/dashboard"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                → Voir mon dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
