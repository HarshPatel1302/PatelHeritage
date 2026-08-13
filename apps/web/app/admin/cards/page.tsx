'use client';

import type { CardCategory } from '@prisma/client';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, Plus, Radio, Search, ShieldAlert, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { CARD_CATEGORIES, CARD_CATEGORY_LABELS, maskCardNumber } from '@/lib/cards';

interface CardRow {
  id: string;
  cardNumber: string;
  personName: string;
  category: CardCategory;
  mobileNumber: string | null;
  notes: string | null;
  isActive: boolean;
  punchCount: number;
  lastPunch: { punchedAt: string; result: string } | null;
}

interface DetectedCard {
  id: string;
  cardNumber: string;
  punchedAt: string;
  deviceSerial: string;
}

const MANAGER_ROLES = ['security', 'admin', 'chairman', 'secretary'];

const EMPTY_FORM = {
  cardNumber: '',
  personName: '',
  category: 'OTHER' as CardCategory,
  mobileNumber: '',
  notes: '',
};

/**
 * Card holder management.
 *
 * Two ways to add a card, because typing a 10-digit number off a card is where
 * mistakes happen: manual entry, or enrollment — where the person simply taps
 * their new card on the reader and the number is captured verbatim. Enrollment
 * is preferred precisely because it cannot mistype the number.
 */
export default function CardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [enrolling, setEnrolling] = useState(false);
  const [enrollSince, setEnrollSince] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedCard[]>([]);

  const allowed = user ? MANAGER_ROLES.includes(user.role) : false;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/cards?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
      if (!res.ok) {
        setError('Could not load cards.');
        return;
      }
      setCards((await res.json()).cards);
      setError(null);
    } catch {
      setError('No connection to the server.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (!allowed) return;
    const t = setTimeout(load, 250); // debounce the search box
    return () => clearTimeout(t);
  }, [allowed, load]);

  // Enrollment polls for an unknown card tapped since the moment we started
  // listening, so an old unknown card from earlier is never offered.
  useEffect(() => {
    if (!enrolling || !enrollSince) return;
    const tick = async () => {
      const res = await fetch(`/api/cards/enroll?since=${encodeURIComponent(enrollSince)}`, {
        cache: 'no-store',
      }).catch(() => null);
      if (res?.ok) setDetected((await res.json()).detected);
    };
    void tick();
    const interval = setInterval(tick, 1500);
    return () => clearInterval(interval);
  }, [enrolling, enrollSince]);

  const startEnrolling = () => {
    setEnrollSince(new Date().toISOString());
    setDetected([]);
    setEnrolling(true);
  };

  const assignDetectedCard = (cardNumber: string) => {
    setForm({ ...EMPTY_FORM, cardNumber });
    setEnrolling(false);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardNumber: form.cardNumber,
        personName: form.personName,
        category: form.category,
        mobileNumber: form.mobileNumber || undefined,
        notes: form.notes || undefined,
      }),
    }).catch(() => null);

    setSaving(false);
    if (!res?.ok) {
      setError(res ? ((await res.json().catch(() => ({}))).error ?? 'Could not save.') : 'No connection.');
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    void load();
  };

  const toggleActive = async (card: CardRow) => {
    const verb = card.isActive ? 'Disable' : 'Re-enable';
    if (!confirm(`${verb} the card for ${card.personName}?`)) return;

    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !card.isActive }),
    }).catch(() => null);

    if (!res?.ok) {
      setError('Could not update that card.');
      return;
    }
    void load();
  };

  if (!allowed) {
    return (
      <ProtectedRoute requireAuth>
        <div className="flex min-h-screen items-center justify-center bg-slate-950 pt-24">
          <div className="rounded-xl border border-white/20 bg-white/10 p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
            <p className="mt-2 text-white/70">Only security and committee can manage cards.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-slate-950 px-4 py-8 pt-24">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
              <CreditCard className="h-8 w-8 text-heritage-gold" />
              Society Cards
            </h1>
            <div className="flex gap-3">
              <button
                onClick={startEnrolling}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
              >
                <Radio className="h-4 w-4" />
                Enroll by tapping
              </button>
              <button
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-heritage-gold px-4 py-2 font-semibold text-black hover:bg-yellow-400"
              >
                <Plus className="h-4 w-4" />
                Add card
              </button>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-500/20 px-4 py-3 text-red-200">{error}</p>
          )}

          {/* Enrollment listener */}
          {enrolling && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border-2 border-heritage-gold/50 bg-heritage-gold/10 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xl font-bold text-white">
                    <Loader2 className="h-5 w-5 animate-spin text-heritage-gold" />
                    Waiting for card…
                  </p>
                  <p className="mt-1 text-white/60">
                    Ask the person to tap their new card on the reader now.
                  </p>
                </div>
                <button onClick={() => setEnrolling(false)} className="text-white/50 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {detected.length > 0 && (
                <div className="mt-5 space-y-2">
                  {detected.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-black/30 px-4 py-3"
                    >
                      <div>
                        <p className="font-mono text-2xl font-bold text-heritage-gold">
                          {d.cardNumber}
                        </p>
                        <p className="text-sm text-white/50">
                          {new Date(d.punchedAt).toLocaleTimeString('en-IN', { hour12: false })} ·{' '}
                          {d.deviceSerial}
                        </p>
                      </div>
                      <button
                        onClick={() => assignDetectedCard(d.cardNumber)}
                        className="rounded-lg bg-heritage-gold px-4 py-2 font-semibold text-black"
                      >
                        Assign this card
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-white/40">
                Cards are never registered automatically — you must confirm each assignment.
              </p>
            </motion.div>
          )}

          {/* Create form */}
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={submit}
              className="mb-6 space-y-4 rounded-xl border border-white/15 bg-white/5 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">Card number</span>
                  <input
                    required
                    value={form.cardNumber}
                    onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                    placeholder="0000012345"
                    className="w-full rounded-lg border border-white/20 bg-white/10 p-3 font-mono text-white placeholder-white/30"
                  />
                  <span className="mt-1 block text-xs text-white/35">
                    Leading zeroes matter — type it exactly as printed.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">Person name</span>
                  <input
                    required
                    value={form.personName}
                    onChange={(e) => setForm({ ...form, personName: e.target.value })}
                    placeholder="Ramesh Kumar"
                    className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder-white/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">Category</span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as CardCategory })}
                    className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white"
                  >
                    {CARD_CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">
                        {CARD_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm text-white/60">Mobile (optional)</span>
                  <input
                    value={form.mobileNumber}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-heritage-gold px-6 py-3 font-semibold text-black disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save card'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg bg-white/10 px-6 py-3 text-white"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, card number or mobile…"
              className="w-full rounded-lg border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-white placeholder-white/40"
            />
          </div>

          {/* List */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {loading ? (
              <p className="p-10 text-center text-white/50">Loading…</p>
            ) : cards.length === 0 ? (
              <p className="p-10 text-center text-white/50">
                {query ? 'No cards match that search.' : 'No cards issued yet.'}
              </p>
            ) : (
              <div className="divide-y divide-white/5">
                {cards.map((card) => (
                  <div key={card.id} className="flex flex-wrap items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-white">
                        {card.personName}
                        {!card.isActive && (
                          <span className="ml-2 rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-300">
                            DISABLED
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-white/50">
                        {CARD_CATEGORY_LABELS[card.category]} · {maskCardNumber(card.cardNumber)}
                        {card.mobileNumber && ` · ${card.mobileNumber}`}
                      </p>
                      <p className="text-xs text-white/35">
                        {card.punchCount} punch{card.punchCount === 1 ? '' : 'es'}
                        {card.lastPunch &&
                          ` · last ${new Date(card.lastPunch.punchedAt).toLocaleString('en-IN')}`}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleActive(card)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                        card.isActive
                          ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                      }`}
                    >
                      {card.isActive ? 'Disable' : 'Re-enable'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
