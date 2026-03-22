export function detectMerchant(description = "") {
  const desc = description.toLowerCase();

  if (desc.includes("netflix")) return "netflix";
  if (desc.includes("google")) return "google";
  if (desc.includes("amazon")) return "amazon";
  if (desc.includes("mcdonald")) return "mcdonalds";
  if (desc.includes("carrefour")) return "carrefour";
  if (desc.includes("castorama")) return "castorama";

  return "default";
}

export const merchantConfig = {
  netflix: {
    name: "Netflix",
    logo: "https://logo.clearbit.com/netflix.com",
  },
  google: {
    name: "Google",
    logo: "https://logo.clearbit.com/google.com",
  },
  amazon: {
    name: "Amazon",
    logo: "https://logo.clearbit.com/amazon.com",
  },
  mcdonalds: {
    name: "McDonald's",
    logo: "https://logo.clearbit.com/mcdonalds.com",
  },
  carrefour: {
    name: "Carrefour",
    logo: "https://logo.clearbit.com/carrefour.com",
  },
  castorama: {
    name: "Castorama",
    logo: "https://logo.clearbit.com/castorama.fr",
  },
  default: {
    name: "Transaction",
    logo: null,
  },
};
