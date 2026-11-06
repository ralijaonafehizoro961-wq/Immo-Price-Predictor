// Step 1: import React tools
import { useEffect, useState } from "react";

// Step 2: set the constants
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const SQM_TO_SQFT = 10.7639;
const INPUT =
  "h-10 w-full border border-neutral-400 bg-white px-3 focus:border-black focus:outline-none";

const INITIAL_FORM = {
  livingM2: "110",
  lotM2: "525",
  bedrooms: "3",
  bathrooms: "1",
  floors: "1",
  waterfront: "0",
  view: "0",
  condition: "3",
  grade: "7",
  yearBuilt: "1955",
  renovated: "0",
  zipcode: "",
};

const YES_NO = [
  ["0", "Non"],
  ["1", "Oui"],
];

const FLOORS = [
  ["1", "1"],
  ["1.5", "1,5"],
  ["2", "2"],
  ["2.5", "2,5"],
  ["3", "3"],
  ["3.5", "3,5"],
];

const VIEW = [
  ["0", "0 - Aucune"],
  ["1", "1 - Passable"],
  ["2", "2 - Moyenne"],
  ["3", "3 - Bonne"],
  ["4", "4 - Excellente"],
];

const CONDITION = [
  ["1", "1 - Mauvais"],
  ["2", "2 - Passable"],
  ["3", "3 - Moyen"],
  ["4", "4 - Bon"],
  ["5", "5 - Très bon"],
];

const GRADE_LABELS = { 1: "Très faible", 7: "Moyenne", 13: "Excellente" };
const GRADE = Array.from({ length: 13 }, (_, i) => {
  const value = String(i + 1);
  const label = GRADE_LABELS[i + 1]
    ? `${value} - ${GRADE_LABELS[i + 1]}`
    : value;
  return [value, label];
});

const EXPLANATIONS = [
  ["Surface habitable", "Surface intérieure de la maison, en mètres carrés."],
  ["Surface du terrain", "Surface de tout le terrain, en mètres carrés."],
  ["Chambres", "Nombre de chambres."],
  [
    "Salles de bain",
    "Nombre de salles de bain. Une pièce avec seulement des toilettes et un lavabo compte 0,5.",
  ],
  [
    "Étages",
    "Nombre d'étages. 1,5 veut dire un étage plus des combles aménagés.",
  ],
  ["Année de construction", "Année à laquelle la maison a été construite."],
  ["Rénovée", "Oui si la maison a été rénovée au moins une fois."],
  [
    "Bord de l'eau",
    "Oui si la maison donne directement sur l'eau (lac ou mer).",
  ],
  ["Vue", "Qualité de la vue, de 0 (aucune) à 4 (excellente)."],
  ["État général", "État de la maison, de 1 (mauvais) à 5 (très bon)."],
  [
    "Qualité de construction",
    "Qualité de la construction et des matériaux, de 1 à 13. Le niveau 7 est moyen.",
  ],
  [
    "Code postal",
    "Quartier de la maison dans le comté de King (région de Seattle, États-Unis).",
  ],
];

// Step 3: build small form pieces
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} className={INPUT}>
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  );
}

// Step 4: build the main page
export default function App() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [zipcodes, setZipcodes] = useState([]);
  const [price, setPrice] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/zipcodes`)
      .then((response) => response.json())
      .then((data) => {
        setZipcodes(data.zipcodes);
        const first = data.zipcodes.includes("98178")
          ? "98178"
          : data.zipcodes[0];
        setForm((current) => ({ ...current, zipcode: first }));
      })
      .catch(() =>
        setError("Impossible de joindre l'API. Le serveur est-il lancé ?"),
      );
  }, []);

  const update = (name) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPrice(null);

    const payload = {
      sqft_living: Math.round(Number(form.livingM2) * SQM_TO_SQFT),
      sqft_lot: Math.round(Number(form.lotM2) * SQM_TO_SQFT),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      floors: Number(form.floors),
      waterfront: Number(form.waterfront),
      view: Number(form.view),
      condition: Number(form.condition),
      grade: Number(form.grade),
      year_built: Number(form.yearBuilt),
      renovated: Number(form.renovated),
      zipcode: form.zipcode,
    };

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          "Vérifie les valeurs saisies : certaines sont en dehors des limites.",
        );
        return;
      }
      setPrice(data.price);
    } catch {
      setError("Impossible de joindre l'API. Le serveur est-il lancé ?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-white px-5 py-8 text-black">
      <header className="border-b-2 border-black pb-4">
        <h1 className="font-serif text-4xl font-bold tracking-tight">
          Immo Price Predictor
        </h1>
        <p className="mt-1 text-neutral-700">Estimation du prix d'une maison</p>
      </header>

      <main className="mt-8 grid gap-8 md:grid-cols-[320px_1fr]">
        <aside className="relative min-h-64 overflow-hidden border border-black">
          <img
            src="/house.jpg"
            alt=""
            draggable={false}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-100"
          />
          <div className="relative flex h-full min-h-64 flex-col justify-end p-5">
            <p className="inline-block bg-white px-3 py-2 font-serif text-xl font-semibold leading-snug text-black">
              Estime la valeur d'une maison à partir de ses caractéristiques.
            </p>
          </div>
        </aside>

        <section>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Surface habitable (m²)">
              <input
                type="number"
                min="25"
                max="1300"
                required
                value={form.livingM2}
                onChange={update("livingM2")}
                className={INPUT}
              />
            </Field>
            <Field label="Surface du terrain (m²)">
              <input
                type="number"
                min="40"
                max="150000"
                required
                value={form.lotM2}
                onChange={update("lotM2")}
                className={INPUT}
              />
            </Field>
            <Field label="Chambres">
              <input
                type="number"
                min="1"
                max="9"
                step="1"
                required
                value={form.bedrooms}
                onChange={update("bedrooms")}
                className={INPUT}
              />
            </Field>
            <Field label="Salles de bain">
              <input
                type="number"
                min="0.5"
                max="8"
                step="0.25"
                required
                value={form.bathrooms}
                onChange={update("bathrooms")}
                className={INPUT}
              />
            </Field>
            <Field label="Étages">
              <Select
                value={form.floors}
                onChange={update("floors")}
                options={FLOORS}
              />
            </Field>
            <Field label="Année de construction">
              <input
                type="number"
                min="1900"
                max="2026"
                step="1"
                required
                value={form.yearBuilt}
                onChange={update("yearBuilt")}
                className={INPUT}
              />
            </Field>
            <Field label="Rénovée">
              <Select
                value={form.renovated}
                onChange={update("renovated")}
                options={YES_NO}
              />
            </Field>
            <Field label="Bord de l'eau">
              <Select
                value={form.waterfront}
                onChange={update("waterfront")}
                options={YES_NO}
              />
            </Field>
            <Field label="Vue">
              <Select
                value={form.view}
                onChange={update("view")}
                options={VIEW}
              />
            </Field>
            <Field label="État général">
              <Select
                value={form.condition}
                onChange={update("condition")}
                options={CONDITION}
              />
            </Field>
            <Field label="Qualité de construction">
              <Select
                value={form.grade}
                onChange={update("grade")}
                options={GRADE}
              />
            </Field>
            <Field label="Code postal">
              <Select
                value={form.zipcode}
                onChange={update("zipcode")}
                options={zipcodes.map((code) => [code, code])}
              />
            </Field>

            <button
              type="submit"
              disabled={loading || !form.zipcode}
              className="h-11 bg-black px-6 font-medium text-white hover:bg-neutral-800 disabled:opacity-50 sm:col-span-2"
            >
              {loading ? "Calcul en cours..." : "Estimer le prix"}
            </button>
          </form>

          <div className="mt-6 border border-black p-5" aria-live="polite">
            {price !== null && (
              <>
                <p className="text-sm uppercase tracking-wide text-neutral-700">
                  Prix estimé
                </p>
                <p className="font-serif text-4xl font-bold">
                  {price.toLocaleString("fr-FR")} $
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  En dollars américains.
                </p>
              </>
            )}
            {error && <p>{error}</p>}
            {price === null && !error && <p>Le prix estimé s'affichera ici.</p>}
          </div>
        </section>
      </main>

      <section className="mt-10 border-t border-black pt-6">
        <h2 className="font-serif text-2xl font-bold">
          Que saisir dans le formulaire ?
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm leading-relaxed md:grid-cols-2">
          {EXPLANATIONS.map(([term, description]) => (
            <div key={term}>
              <dt className="font-bold">{term}</dt>
              <dd className="text-neutral-700">{description}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-neutral-700">
          L'estimation vient d'un modèle de machine learning entraîné sur
          environ 21 000 ventes réelles dans le comté de King (États-Unis) en
          2014 et 2015. Les prix sont en dollars américains et l'erreur moyenne
          du modèle est d'environ 74 000 dollars.
        </p>
      </section>
    </div>
  );
}
