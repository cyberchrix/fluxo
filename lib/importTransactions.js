import Papa from "papaparse";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { saveTransactions } from "@/lib/db";

dayjs.extend(customParseFormat);

//
// --- NORMALIZE KEYS (ACCENTS SAFE)
//
function normalizeKey(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

//
// --- DETECT FIELDS
//
function detectFields(row) {
  const keys = Object.keys(row);

  return {
    dateKey: keys.find((k) => normalizeKey(k).includes("date")),
    amountKey: keys.find((k) => normalizeKey(k).includes("montant")),
    detailKey: keys.find((k) => normalizeKey(k).includes("detail")),
    descriptionKey: keys.find((k) => normalizeKey(k).includes("libell")),
  };
}

//
// --- GENERATE ID
//
function generateId(t) {
  return `${t.date}-${t.amount}-${t.description}`
    .toLowerCase()
    .replace(/\s+/g, "");
}

//
// --- CATEGORIZE
//
function categorize(description) {
  if (!description) return "other";

  const desc = description.toLowerCase();

  if (desc.includes("carte")) return "card";
  if (desc.includes("prelevement")) return "subscription";
  if (desc.includes("virement")) return "transfer";
  if (desc.includes("cotisation")) return "fees";

  return "other";
}

//
// --- CLEAN DESCRIPTION
//
function cleanDescription(desc) {
  if (!desc) return "Transaction";

  let cleaned = desc
    .replace(/carte x\d+\s*\d{2}\/\d{2}/i, "")
    .replace(/carte x\d+/i, "")
    .replace(/prelevement europeen/i, "Prélèvement")
    .replace(/prelevement/i, "Prélèvement")
    .replace(/virement/i, "Virement")
    .replace(/\d{6,}/g, "")
    .replace(/\bIOPD\b/i, "")
    .replace(/\bCB\b/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 3) {
    return desc.slice(0, 25);
  }

  return cleaned;
}

//
// --- NORMALIZE ROW
//
function normalize(row, fields) {
  const rawDate = row[fields.dateKey];
  const rawAmount = row[fields.amountKey];

  const rawDescription =
    row[fields.detailKey] || row[fields.descriptionKey] || "";

  const date = dayjs(rawDate, ["DD/MM/YYYY", "YYYY-MM-DD"], true);

  const amount = parseFloat(
    String(rawAmount).replace(/\s/g, "").replace(",", "."),
  );

  const description = cleanDescription(rawDescription);

  return {
    id: generateId({
      date: date.format("YYYY-MM-DD"),
      amount,
      description,
    }),
    date: date.isValid() ? date.format("YYYY-MM-DD") : null,
    amount,
    description,
    category: categorize(rawDescription),
  };
}

//
// --- 🔥 DEDUPLICATION (FIX SUPABASE ERROR)
//
function deduplicate(transactions) {
  const map = new Map();

  transactions.forEach((t) => {
    map.set(t.id, t);
  });

  return Array.from(map.values());
}

//
// --- MAIN IMPORT
//
export function importTransactions(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
      encoding: "ISO-8859-1",

      beforeFirstChunk: (chunk) => {
        const lines = chunk.split("\n");
        return lines.slice(1).join("\n");
      },

      complete: async (results) => {
        if (!results.data?.length) {
          resolve({ newTransactions: [] });
          return;
        }

        const fields = detectFields(results.data[0]);

        const parsedTransactions = [];
        const ignored = [];

        results.data.forEach((row) => {
          const t = normalize(row, fields);

          if (!t.date || isNaN(t.amount)) {
            ignored.push(row);
          } else {
            parsedTransactions.push(t);
          }
        });

        // 🔥 FIX DOUBLONS
        const uniqueTransactions = deduplicate(parsedTransactions);

        console.log("TOTAL:", parsedTransactions.length);
        console.log("UNIQUE:", uniqueTransactions.length);

        // 🔥 SAVE TO SUPABASE
        await saveTransactions(uniqueTransactions);

        resolve({
          newTransactions: uniqueTransactions,
          totalImported: uniqueTransactions.length,
          totalIgnored: ignored.length,
        });
      },
    });
  });
}
