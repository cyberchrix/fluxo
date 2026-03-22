"use client";

import { useEffect, useState } from "react";
import {
  groupByDayDetailed,
  groupByCategory,
  sortByDateDesc,
} from "@/lib/groupBy";
import { fetchTransactions } from "@/lib/db";

// 📊 Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

console.log("ENV:", process.env.NEXT_PUBLIC_SUPABASE_URL);

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});

  // 🔥 LOAD FROM SUPABASE
  useEffect(() => {
    async function load() {
      const data = await fetchTransactions();
      setTransactions(data);
    }
    load();
  }, []);

  // --- MONTHS
  const months = [
    ...new Set(transactions.map((t) => t.date?.slice(0, 7))),
  ].filter(Boolean);

  const sortedMonths = months.sort((a, b) => (a < b ? 1 : -1));

  useEffect(() => {
    if (sortedMonths.length && !selectedMonth) {
      setSelectedMonth(sortedMonths[0]);
    }
  }, [transactions]);

  // --- FILTER TYPE
  const filteredTransactions =
    filter === "card"
      ? transactions.filter((t) => t.category === "card")
      : transactions;

  // --- FILTER MONTH + EXPENSES
  const monthTransactions = selectedMonth
    ? filteredTransactions.filter(
        (t) => t.date.startsWith(selectedMonth) && t.amount < 0,
      )
    : [];

  // --- GROUP
  const daily = groupByDayDetailed(monthTransactions);
  const categories = groupByCategory(monthTransactions);
  const sortedDaily = sortByDateDesc(Object.entries(daily));

  const totalMonth = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  // 📊 GRAPH
  const chartData = sortedDaily
    .slice()
    .reverse()
    .map(([day, data]) => ({
      date: day.slice(5),
      amount: Math.abs(data.total),
    }));

  // --- TOGGLE
  const toggleDay = (day) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  function formatMonth(month) {
    const [year, m] = month.split("-");
    return new Date(year, m - 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fluxo</h1>

      {/* FILTER */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className="px-4 py-2 rounded bg-white text-black"
        >
          Tout
        </button>
        <button
          onClick={() => setFilter("card")}
          className="px-4 py-2 rounded bg-gray-800"
        >
          Cartes
        </button>
      </div>

      {/* MONTH */}
      <select
        value={selectedMonth || ""}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="mb-6 bg-gray-900 p-3 rounded-lg w-full"
      >
        {sortedMonths.map((m) => (
          <option key={m} value={m}>
            {formatMonth(m)}
          </option>
        ))}
      </select>

      {/* TOTAL */}
      <div className="bg-gray-900 p-6 rounded-xl mb-6">
        <h2>Dépenses {formatMonth(selectedMonth || "")}</h2>
        <p className="text-3xl font-bold">
          {Math.abs(totalMonth).toFixed(2)} €
        </p>
      </div>

      {/* GRAPH */}
      <div className="bg-gray-900 p-6 rounded-xl mb-6 h-60">
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip formatter={(v) => `${v.toFixed(2)} €`} />
            <Line type="monotone" dataKey="amount" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* DAILY */}
      <div className="bg-gray-900 p-6 rounded-xl">
        {sortedDaily.map(([day, data]) => {
          const isOpen = expandedDays[day];

          return (
            <div key={day} className="mb-4">
              <div
                onClick={() => toggleDay(day)}
                className="flex justify-between cursor-pointer"
              >
                <span>{day}</span>
                <span>{Math.abs(data.total).toFixed(2)} €</span>
              </div>

              {isOpen && (
                <div className="mt-2 ml-4 space-y-1 text-sm">
                  {data.items.map((t, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate max-w-[200px]">
                        {t.description}
                      </span>
                      <span>{Math.abs(t.amount).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
