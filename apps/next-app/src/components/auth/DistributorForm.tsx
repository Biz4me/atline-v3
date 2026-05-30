"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Lock,
  UserX,
  X,
} from "lucide-react";

type Mode = "locked" | "manual" | "pending";
type SponsorStatus = "idle" | "valid" | "invalid";

interface Props {
  lockedRef: string | null;
  sponsorName: string | null;
}

function capitalizeName(value: string): string {
  return value
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part.length === 0
            ? ""
            : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join("-")
    )
    .join(" ");
}

export default function DistributorForm({ lockedRef, sponsorName }: Props) {
  // Mode
  const [mode, setMode] = useState<Mode>(lockedRef ? "locked" : "manual");

  // Champs identité
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // Recherche parrain par nom exact
  const [sponsorName_, setSponsorName_] = useState("");
  const [sponsorStatus, setSponsorStatus] = useState<SponsorStatus>("idle");
  const [resolvedSponsor, setResolvedSponsor] = useState<{
    name: string;
    referralCode: string;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Soumission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Recherche parrain (debounce 600ms) ───────────────────────────────────────
  useEffect(() => {
    if (mode !== "manual") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = sponsorName_.trim();
    if (trimmed.length < 3) {
      setSponsorStatus("idle");
      setResolvedSponsor(null);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search-sponsor?name=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        if (data.found) {
          setSponsorStatus("valid");
          setResolvedSponsor({
            name: data.name,
            referralCode: data.referralCode,
          });
        } else {
          setSponsorStatus("invalid");
          setResolvedSponsor(null);
        }
      } catch {
        setSponsorStatus("idle");
      } finally {
        setSearching(false);
      }
    }, 600);
  }, [sponsorName_, mode]);

  // ── Soumission ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const effectiveCode =
      mode === "locked"
        ? lockedRef
        : mode === "manual" && sponsorStatus === "valid"
        ? resolvedSponsor?.referralCode ?? null
        : null;

    const body = effectiveCode
      ? { name: fullName, email, password, referralCode: effectiveCode }
      : { name: fullName, email, password, pendingPlacement: true };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    setSuccess(true);

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (signInRes?.ok) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login?registered=1";
    }
  }

  // Bouton actif si : locked, pending, parrain trouvé, ou champ vide (pending auto)
  const canSubmit =
    mode === "locked" ||
    mode === "pending" ||
    (mode === "manual" && sponsorStatus === "valid") ||
    (mode === "manual" && sponsorName_.trim() === "");

  // ── Success ──────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <CheckCircle2 className="text-green-500" size={48} />
        <p className="text-[#1e3c5c] font-semibold text-lg">Compte créé !</p>
        <p className="text-gray-500 text-sm text-center">Connexion en cours…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── MODE LOCKED : cookie ───────────────────────────────────────────── */}
      {mode === "locked" && (
        <div className="bg-[#f4b342]/10 border border-[#f4b342]/40 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={14} className="text-[#f4b342]" />
            <span className="text-xs font-semibold text-[#f4b342] uppercase tracking-wide">
              Parrain
            </span>
          </div>
          <p className="text-sm text-[#1e3c5c] font-medium">
            {sponsorName ?? lockedRef}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Parrain confirmé automatiquement
          </p>
        </div>
      )}

      {/* ── MODE MANUAL : recherche par nom exact ─────────────────────────── */}
      {mode === "manual" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Nom et prénom de votre parrain{" "}
            <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={sponsorName_}
              onChange={(e) => setSponsorName_(capitalizeName(e.target.value))}
              placeholder="Ex : Jean Dupont"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 transition-all ${
                sponsorStatus === "valid"
                  ? "border-green-400 focus:ring-green-300"
                  : sponsorStatus === "invalid"
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-200 focus:ring-[#f4b342]"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {searching && (
                <Loader2 size={15} className="animate-spin text-gray-400" />
              )}
              {!searching && sponsorStatus === "valid" && (
                <CheckCircle2 size={15} className="text-green-500" />
              )}
              {!searching && sponsorStatus === "invalid" && (
                <X size={15} className="text-red-400" />
              )}
            </div>
          </div>

          {/* Feedback */}
          {sponsorStatus === "valid" && resolvedSponsor && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 size={12} />
              Parrain trouvé :{" "}
              <span className="font-semibold ml-1">{resolvedSponsor.name}</span>
            </p>
          )}
          {sponsorStatus === "invalid" && (
            <div className="space-y-1">
              <p className="text-xs text-red-500">
                Parrain introuvable dans notre réseau.
              </p>
              <button
                type="button"
                onClick={() => setMode("pending")}
                className="text-xs text-[#1e3c5c] hover:underline font-medium"
              >
                Demander un parrain à Atline →
              </button>
            </div>
          )}

          {/* Lien "sans parrain" si champ vide */}
          {sponsorStatus === "idle" && sponsorName_.trim() === "" && (
            <button
              type="button"
              onClick={() => setMode("pending")}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              {"Je ne connais pas mon parrain →"}
            </button>
          )}
        </div>
      )}

      {/* ── MODE PENDING : demande de parrain ─────────────────────────────── */}
      {mode === "pending" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX size={15} className="text-blue-500" />
              <span className="text-sm font-medium text-blue-800">
                Demande de parrain
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("manual");
                setSponsorName_("");
                setSponsorStatus("idle");
              }}
              className="text-xs text-blue-400 hover:text-blue-600 underline"
            >
              {"J'ai un parrain"}
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-1 leading-relaxed">
            Notre équipe vous assignera un parrain sous{" "}
            <strong>24h maximum</strong>. Votre parrain dispose de{" "}
            <strong>30 jours</strong> pour vous confirmer.
          </p>
        </div>
      )}

      {/* ── Erreur ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* ── Prénom + Nom ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Prénom
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(capitalizeName(e.target.value))}
            required
            autoComplete="given-name"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4b342] focus:border-transparent transition-all"
            placeholder="Jean"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(capitalizeName(e.target.value))}
            required
            autoComplete="family-name"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4b342] focus:border-transparent transition-all"
            placeholder="Dupont"
          />
        </div>
      </div>

      {/* ── Email ─────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.toLowerCase())}
          required
          autoComplete="email"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f4b342] focus:border-transparent transition-all"
          placeholder="vous@exemple.com"
        />
      </div>

      {/* ── Mot de passe ──────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#f4b342] focus:border-transparent transition-all"
            placeholder="8 caractères minimum"
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="w-full bg-[#1e3c5c] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#2b5580] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Création du compte…
          </>
        ) : (
          "Créer mon compte distributeur"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Déjà un compte ?{" "}
        <a
          href="/login"
          className="text-[#1e3c5c] hover:underline font-medium"
        >
          Se connecter
        </a>
      </p>
    </form>
  );
}
