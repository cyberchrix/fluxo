"use client";

import { useEffect, useState } from "react";
import {
  groupByDayDetailed,
  groupByCategory,
  sortByDateDesc,
} from "@/lib/groupBy";
import { detectMerchant, merchantConfig } from "@/lib/merchant";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("transactions") || "[]");
    setTransactions(data);
  }, []);

  // --- MOIS ---
  const months = [
    ...new Set(transactions.map((t) => t.date?.slice(0, 7))),
  ].filter(Boolean);

  const sortedMonths = months.sort((a, b) => (a < b ? 1 : -1));

  useEffect(() => {
    if (sortedMonths.length && !selectedMonth) {
      setSelectedMonth(sortedMonths[0]);
    }
  }, [transactions]);

  // --- FILTRE TYPE ---
  const filteredTransactions =
    filter === "card"
      ? transactions.filter((t) => t.category === "card")
      : transactions;

  // --- FILTRE MOIS + DEPENSES ---
  const monthTransactions = selectedMonth
    ? filteredTransactions.filter(
        (t) => t.date.startsWith(selectedMonth) && t.amount < 0,
      )
    : [];

  // --- GROUP ---
  const daily = groupByDayDetailed(monthTransactions);
  const categories = groupByCategory(monthTransactions);
  const sortedDaily = sortByDateDesc(Object.entries(daily));

  const totalMonth = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  // --- TOGGLE ---
  const toggleDay = (day) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  // --- LABELS ---
  const categoryLabels = {
    card: "Carte",
    subscription: "Abonnement",
    transfer: "Virement",
    fees: "Frais",
    other: "Autre",
  };

  function formatMonth(month) {
    const [year, m] = month.split("-");
    const date = new Date(year, m - 1);

    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard Fluxo</h1>

      {/* FILTER */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all" ? "bg-white text-black" : "bg-gray-800"
          }`}
        >
          Tout
        </button>

        <button
          onClick={() => setFilter("card")}
          className={`px-4 py-2 rounded ${
            filter === "card" ? "bg-white text-black" : "bg-gray-800"
          }`}
        >
          Cartes
        </button>
      </div>

      {/* SELECT MONTH */}
      <div className="mb-6">
        <select
          value={selectedMonth || ""}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-gray-900 border border-gray-700 p-3 rounded-lg w-full"
        >
          {sortedMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
      </div>

      {/* TOTAL */}
      <div className="bg-gray-900 p-6 rounded-xl mb-8">
        <h2 className="text-gray-400 mb-2">
          Dépenses {selectedMonth ? formatMonth(selectedMonth) : ""}
        </h2>
        <p className="text-3xl font-bold">
          {Math.abs(totalMonth).toFixed(2)} €
        </p>
      </div>

      {/* CATEGORIES */}
      <div className="bg-gray-900 p-6 rounded-xl mb-8">
        <h2 className="text-gray-400 mb-4">Dépenses par catégorie</h2>

        <div className="space-y-2">
          {Object.entries(categories).map(([cat, amount]) => (
            <div key={cat} className="flex justify-between">
              <span>{categoryLabels[cat] || cat}</span>
              <span>{Math.abs(amount).toFixed(2)} €</span>
            </div>
          ))}
        </div>
      </div>

      {/* DAILY COLLAPSIBLE */}
      <div className="bg-gray-900 p-6 rounded-xl">
        <h2 className="text-gray-400 mb-4">Dépenses par jour</h2>

        <div className="space-y-4">
          {sortedDaily.map(([day, data]) => {
            const isOpen = expandedDays[day];

            return (
              <div key={day} className="border-b border-gray-800 pb-3">
                {/* HEADER */}
                <div
                  onClick={() => toggleDay(day)}
                  className="flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{day}</span>
                    <span className="text-gray-500 text-sm">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>

                  <span className="font-semibold">
                    {Math.abs(data.total).toFixed(2)} €
                  </span>
                </div>

                {/* DETAILS */}
                {isOpen && (
                  <div className="mt-3 ml-4 space-y-2 text-sm text-gray-400 animate-fade-in">
                    {data.items.map((t, i) => {
                      const merchantKey = detectMerchant(t.description);
                      const merchant = merchantConfig[merchantKey];

                      return (
                        <div
                          key={i}
                          className="flex justify-between items-center gap-2"
                        >
                          {/* LEFT */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* ICON EURO */}
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                              €
                            </div>

                            {/* LABEL */}
                            <span
                              className="truncate flex-1 max-w-[180px] sm:max-w-[260px]"
                              title={t.description}
                            >
                              {merchant.name !== "Transaction"
                                ? merchant.name
                                : t.description}
                            </span>
                          </div>

                          {/* AMOUNT */}
                          <span className="shrink-0">
                            {Math.abs(t.amount).toFixed(2)} €
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
