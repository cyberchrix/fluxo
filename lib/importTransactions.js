import Papa from "papaparse";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

//
// --- NORMALIZE KEYS (🔥 FIX ACCENTS) ---
//
function normalizeKey(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

//
// --- DETECT FIELDS ---
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
// --- GENERATE ID ---
//
function generateId(t) {
  return `${t.date}-${t.amount}-${t.description}`
    .toLowerCase()
    .replace(/\s+/g, "");
}

//
// --- CATEGORIZE ---
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
// --- CLEAN DESCRIPTION (🔥 SMART + SAFE) ---
//
function cleanDescription(desc) {
  if (!desc) return "Transaction";

  let cleaned = desc
    // supprime carte
    .replace(/carte x\d+\s*\d{2}\/\d{2}/i, "")
    .replace(/carte x\d+/i, "")

    // garde mots utiles
    .replace(/prelevement europeen/i, "Prélèvement")
    .replace(/prelevement/i, "Prélèvement")
    .replace(/virement/i, "Virement")

    // supprime codes longs
    .replace(/\d{6,}/g, "")

    // supprime suffixes techniques
    .replace(/\bIOPD\b/i, "")
    .replace(/\bCB\b/i, "")

    .replace(/\s+/g, " ")
    .trim();

  // 🔥 EXTRACTION INTELLIGENTE
  const words = cleaned.split(" ");

  // garder mots lisibles uniquement
  const validWords = words.filter((w) => {
    return w.length > 2 && !/^\d+$/.test(w);
  });

  const result = validWords.join(" ");

  return result || "Transaction";
}

//
// --- NORMALIZE ROW ---
//
function normalize(row, fields) {
  const rawDate = row[fields.dateKey];
  const rawAmount = row[fields.amountKey];

  // 🔥 PRIORITE DETAIL
  const rawDescription =
    row[fields.detailKey] || row[fields.descriptionKey] || "";

  // DEBUG (tu peux supprimer après)
  console.log("RAW DESC:", rawDescription);

  const date = dayjs(rawDate, ["DD/MM/YYYY", "YYYY-MM-DD"], true);

  const amount = parseFloat(
    String(rawAmount).replace(/\s/g, "").replace(",", "."),
  );

  const category = categorize(rawDescription);
  const description = cleanDescription(rawDescription);

  return {
    date: date.isValid() ? date.format("YYYY-MM-DD") : null,
    amount,
    description,
    category,
  };
}

//
// --- MAIN IMPORT ---
//
export function importTransactions(file, existingTransactions = []) {
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

      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          resolve({
            newTransactions: [],
            duplicates: [],
            ignored: [],
            totalImported: 0,
            totalDuplicates: 0,
            totalIgnored: 0,
          });
          return;
        }

        const fields = detectFields(results.data[0]);

        console.log("FIELDS:", fields);
        console.log("ROW SAMPLE:", results.data[0]);

        const existingIds = new Set(existingTransactions.map(generateId));

        const newTransactions = [];
        const duplicates = [];
        const ignored = [];

        results.data.forEach((row) => {
          const t = normalize(row, fields);

          if (!t.date || isNaN(t.amount)) {
            ignored.push(row);
            return;
          }

          const id = generateId(t);

          if (existingIds.has(id)) {
            duplicates.push(t);
          } else {
            newTransactions.push({ ...t, id });
            existingIds.add(id);
          }
        });

        resolve({
          newTransactions,
          duplicates,
          ignored,
          totalImported: newTransactions.length,
          totalDuplicates: duplicates.length,
          totalIgnored: ignored.length,
        });
      },

      error: (err) => {
        console.error("Parse error:", err);
        resolve({
          newTransactions: [],
          duplicates: [],
          ignored: [],
          totalImported: 0,
          totalDuplicates: 0,
          totalIgnored: 0,
        });
      },
    });
  });
}
