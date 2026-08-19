export const LANGUAGES = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "hi", label: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "ru", label: "Russian", native: "Русский", dir: "ltr" },
  { code: "zh", label: "Chinese", native: "中文", dir: "ltr" },
  { code: "pt", label: "Portuguese", native: "Português", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
] as const;

export const BRICS_COUNTRIES = [
  { code: "BR", name: "Brazil", capital: { lat: -15.793889, lng: -47.882778 }, accent: "#1b6a42" },
  { code: "RU", name: "Russia", capital: { lat: 55.7558, lng: 37.6173 }, accent: "#2c4d9c" },
  { code: "IN", name: "India", capital: { lat: 28.6139, lng: 77.209 }, accent: "#e7a800" },
  { code: "CN", name: "China", capital: { lat: 39.9042, lng: 116.4074 }, accent: "#d52029" },
  { code: "ZA", name: "South Africa", capital: { lat: -25.7479, lng: 28.2293 }, accent: "#2e5a88" },
] as const;

export const CATEGORIES = [
  { value: "water", label: "Water access" },
  { value: "sanitation", label: "Sanitation" },
  { value: "transport", label: "Transport" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "energy", label: "Energy" },
  { value: "digital", label: "Digital access" },
  { value: "climate", label: "Climate resilience" },
  { value: "public_safety", label: "Public safety" },
  { value: "agriculture", label: "Farmer advisory" },
] as const;

export const STATUS_META = {
  submitted: { label: "Submitted", tone: "bg-neutral-100 text-neutral-700 border-neutral-300" },
  reviewed: { label: "Reviewed", tone: "bg-amber-50 text-amber-800 border-amber-300" },
  prioritized: { label: "Prioritized", tone: "bg-red-50 text-red-800 border-red-300" },
  actioned: { label: "Actioned", tone: "bg-emerald-50 text-emerald-800 border-emerald-300" },
} as const;

export function categoryLabel(value: string) {
  return CATEGORIES.find(category => category.value === value)?.label ?? value.replaceAll("_", " ");
}

export function countryName(value: string) {
  return BRICS_COUNTRIES.find(country => country.code === value)?.name ?? value;
}
