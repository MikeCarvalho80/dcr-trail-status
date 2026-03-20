import { useState, useMemo } from 'react';
import { CopyIcon, CheckIcon, EyeIcon, PlusIcon, TrashIcon, DatabaseIcon } from 'lucide-react';
import type { Park, Region, State, ClosureWindow } from '../data/parks';
import { submitParkToDb } from '../lib/parkSubmissions';
import { isSupabaseConfigured } from '../lib/supabase';

const REGIONS: Region[] = [
  'Greater Boston', 'South Shore', 'North Shore', 'MetroWest',
  'Central MA', 'Pioneer Valley', 'Berkshires', 'Cape & Islands',
  'Southern NH', 'Central NH', 'Western NH',
  'Southern VT', 'Central VT',
  'Southern Maine', 'Midcoast Maine', 'Western Maine',
  'Rhode Island', 'Connecticut',
  'Hudson Valley', 'Upstate NY', 'NYC & Long Island',
  'Northern NJ', 'Central NJ',
  'Eastern PA', 'Central PA', 'Poconos',
  'Maryland', 'Delaware',
];

const STATES: State[] = ['MA', 'NH', 'VT', 'ME', 'RI', 'CT', 'NY', 'NJ', 'PA', 'MD', 'DE'];

const CLOSURE_TYPES = ['advisory', 'formal', 'seasonal'] as const;
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Beginner-Intermediate', 'Intermediate-Advanced', 'Advanced-Expert'];

interface FormData {
  name: string;
  region: Region;
  state: State;
  manager: string;
  url: string;
  lat: string;
  lng: string;
  parking: string;
  closureType: 'formal' | 'seasonal' | 'advisory';
  closureRule: string;
  hasClosureDates: boolean;
  closureStartMonth: string;
  closureStartDay: string;
  closureEndMonth: string;
  closureEndDay: string;
  additionalClosures: {
    label: string;
    type: 'formal' | 'seasonal' | 'advisory';
    startMonth: string;
    startDay: string;
    endMonth: string;
    endDay: string;
    rule: string;
  }[];
  notes: string;
  difficulty: string;
  miles: string;
  nemba: string;
  source: string;
}

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateCode(data: FormData): string {
  const id = generateId(data.name);
  const today = new Date().toISOString().split('T')[0];

  const closureStart = data.hasClosureDates
    ? `{ month: ${data.closureStartMonth}, day: ${data.closureStartDay} }`
    : 'null';
  const closureEnd = data.hasClosureDates
    ? `{ month: ${data.closureEndMonth}, day: ${data.closureEndDay} }`
    : 'null';

  let addClosures = '';
  if (data.additionalClosures.length > 0) {
    const items = data.additionalClosures.map((c) =>
      `      { label: "${c.label}", type: "${c.type}", start: { month: ${c.startMonth}, day: ${c.startDay} }, end: { month: ${c.endMonth}, day: ${c.endDay} }, rule: "${c.rule}" }`
    ).join(',\n');
    addClosures = `\n    additionalClosures: [\n${items},\n    ],`;
  }

  return `  {
    id: "${id}",
    name: "${data.name}",
    region: "${data.region}",
    state: "${data.state}",
    manager: "${data.manager}",
    url: "${data.url}",
    lat: ${parseFloat(data.lat).toFixed(4)},
    lng: ${parseFloat(data.lng).toFixed(4)},
    parking: "${data.parking}",
    closureType: "${data.closureType}",
    closureRule: "${data.closureRule}",
    closureStart: ${closureStart},
    closureEnd: ${closureEnd},${addClosures}
    notes: "${data.notes}",
    difficulty: "${data.difficulty}",
    miles: "${data.miles}",
    nemba: "${data.nemba}",${data.source ? `\n    source: "${data.source}",` : ''}
    lastVerified: "${today}",
  },`;
}

const INITIAL_FORM: FormData = {
  name: '', region: 'Greater Boston', state: 'MA', manager: '', url: '', lat: '', lng: '',
  parking: '', closureType: 'advisory', closureRule: '', hasClosureDates: false,
  closureStartMonth: '3', closureStartDay: '1', closureEndMonth: '4', closureEndDay: '15',
  additionalClosures: [], notes: '', difficulty: 'Intermediate', miles: '', nemba: '', source: '',
};

export function AdminForm() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dbSubmitting, setDbSubmitting] = useState(false);
  const [dbResult, setDbResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function addClosure() {
    setForm((prev) => ({
      ...prev,
      additionalClosures: [...prev.additionalClosures, {
        label: '', type: 'seasonal', startMonth: '10', startDay: '1',
        endMonth: '12', endDay: '31', rule: '',
      }],
    }));
  }

  function removeClosure(idx: number) {
    setForm((prev) => ({
      ...prev,
      additionalClosures: prev.additionalClosures.filter((_, i) => i !== idx),
    }));
  }

  function updateClosure(idx: number, key: string, val: string) {
    setForm((prev) => ({
      ...prev,
      additionalClosures: prev.additionalClosures.map((c, i) =>
        i === idx ? { ...c, [key]: val } : c
      ),
    }));
  }

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!form.name.trim()) e.push('Name is required');
    if (!form.url.trim()) e.push('URL is required');
    if (!form.lat || isNaN(parseFloat(form.lat))) e.push('Valid latitude is required');
    if (!form.lng || isNaN(parseFloat(form.lng))) e.push('Valid longitude is required');
    if (!form.parking.trim()) e.push('Parking address is required');
    if (!form.closureRule.trim()) e.push('Closure rule is required');
    if (!form.miles.trim()) e.push('Trail miles is required');
    if (!form.manager.trim()) e.push('Manager is required');
    if (form.hasClosureDates) {
      const sm = parseInt(form.closureStartMonth), sd = parseInt(form.closureStartDay);
      const em = parseInt(form.closureEndMonth), ed = parseInt(form.closureEndDay);
      if (sm < 1 || sm > 12 || sd < 1 || sd > 31) e.push('Invalid closure start date');
      if (em < 1 || em > 12 || ed < 1 || ed > 31) e.push('Invalid closure end date');
    }
    return e;
  }, [form]);

  const code = generateCode(form);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDbSubmit() {
    if (errors.length > 0 || dbSubmitting) return;
    setDbSubmitting(true);
    setDbResult(null);

    const result = await submitParkToDb({
      park_name: form.name,
      region: form.region,
      state: form.state,
      manager: form.manager,
      url: form.url,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      parking: form.parking,
      closure_type: form.closureType,
      closure_rule: form.closureRule,
      closure_start: form.hasClosureDates
        ? { month: parseInt(form.closureStartMonth), day: parseInt(form.closureStartDay) }
        : null,
      closure_end: form.hasClosureDates
        ? { month: parseInt(form.closureEndMonth), day: parseInt(form.closureEndDay) }
        : null,
      additional_closures: form.additionalClosures.length > 0
        ? form.additionalClosures.map((c) => ({
            label: c.label, type: c.type, rule: c.rule,
            start: { month: parseInt(c.startMonth), day: parseInt(c.startDay) },
            end: { month: parseInt(c.endMonth), day: parseInt(c.endDay) },
          }))
        : null,
      notes: form.notes,
      difficulty: form.difficulty,
      miles: form.miles,
      nemba: form.nemba,
      source: form.source,
    });

    setDbSubmitting(false);
    setDbResult(result.ok
      ? { ok: true, msg: 'Submitted for review!' }
      : { ok: false, msg: result.error ?? 'Submission failed' }
    );
    if (result.ok) setTimeout(() => setDbResult(null), 3000);
  }

  const inputClass = "w-full bg-bg-primary border border-bg-elevated rounded-lg px-3 py-2 font-mono text-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary/30";
  const labelClass = "font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1 block";
  const selectClass = inputClass;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-[800px] lg:max-w-[960px] mx-auto px-4 py-6 desktop-scale">
        <header className="mb-6">
          <h1 className="font-mono text-[22px] font-bold text-text-primary">
            Add New Park
          </h1>
          <p className="font-mono text-[12px] text-text-secondary mt-1">
            Fill in the park details below. The generated TypeScript code can be copied into parks.ts.
          </p>
          <a
            href="?admin=review"
            className="font-mono text-[12px] text-status-open hover:underline mt-1 inline-block"
          >
            Review submissions →
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            {/* Basic Info */}
            <section className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-4 space-y-3">
              <h2 className="font-mono text-[13px] font-bold text-text-primary">Basic Info</h2>

              <div>
                <label className={labelClass}>Park Name</label>
                <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g., Blue Hills Reservation" />
                {form.name && (
                  <span className="font-mono text-[12px] text-text-muted mt-0.5 block">
                    ID: {generateId(form.name)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Region</label>
                  <select className={selectClass} value={form.region}
                    onChange={(e) => set('region', e.target.value as Region)}>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <select className={selectClass} value={form.state}
                    onChange={(e) => set('state', e.target.value as State)}>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Manager</label>
                  <input className={inputClass} value={form.manager} onChange={(e) => set('manager', e.target.value)}
                    placeholder="e.g., DCR, NEMBA" />
                </div>
                <div>
                  <label className={labelClass}>NEMBA Chapter</label>
                  <input className={inputClass} value={form.nemba} onChange={(e) => set('nemba', e.target.value)}
                    placeholder="e.g., GB NEMBA, or N/A" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Official URL</label>
                <input className={inputClass} value={form.url} onChange={(e) => set('url', e.target.value)}
                  placeholder="https://..." type="url" />
              </div>
            </section>

            {/* Location */}
            <section className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-4 space-y-3">
              <h2 className="font-mono text-[13px] font-bold text-text-primary">Location</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latitude</label>
                  <input className={inputClass} value={form.lat} onChange={(e) => set('lat', e.target.value)}
                    placeholder="42.2163" type="number" step="0.0001" />
                </div>
                <div>
                  <label className={labelClass}>Longitude</label>
                  <input className={inputClass} value={form.lng} onChange={(e) => set('lng', e.target.value)}
                    placeholder="-71.1086" type="number" step="0.0001" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Parking Address</label>
                <input className={inputClass} value={form.parking} onChange={(e) => set('parking', e.target.value)}
                  placeholder="e.g., Houghton's Pond, 840 Hillside St, Milton" />
              </div>
            </section>

            {/* Trail Details */}
            <section className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-4 space-y-3">
              <h2 className="font-mono text-[13px] font-bold text-text-primary">Trail Details</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Difficulty</label>
                  <select className={selectClass} value={form.difficulty}
                    onChange={(e) => set('difficulty', e.target.value)}>
                    {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Trail Miles</label>
                  <input className={inputClass} value={form.miles} onChange={(e) => set('miles', e.target.value)}
                    placeholder="e.g., 25+ or 10" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea className={inputClass + ' h-20 resize-y'} value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Trail description, conditions notes, etc." />
              </div>

              <div>
                <label className={labelClass}>Source (optional)</label>
                <input className={inputClass} value={form.source} onChange={(e) => set('source', e.target.value)}
                  placeholder="URL for closure policy source" />
              </div>
            </section>

            {/* Closure Policy */}
            <section className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-4 space-y-3">
              <h2 className="font-mono text-[13px] font-bold text-text-primary">Closure Policy</h2>

              <div>
                <label className={labelClass}>Closure Type</label>
                <select className={selectClass} value={form.closureType}
                  onChange={(e) => set('closureType', e.target.value as typeof form.closureType)}>
                  {CLOSURE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Closure Rule</label>
                <input className={inputClass} value={form.closureRule} onChange={(e) => set('closureRule', e.target.value)}
                  placeholder="e.g., Closed Dec 1 – Mar 15 or as posted" />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.hasClosureDates}
                    onChange={(e) => set('hasClosureDates', e.target.checked)}
                    className="rounded border-bg-elevated" />
                  <span className="font-mono text-[12px] text-text-secondary">Has specific closure dates</span>
                </label>
              </div>

              {form.hasClosureDates && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Start (Month/Day)</label>
                    <div className="flex gap-1">
                      <input className={inputClass} value={form.closureStartMonth}
                        onChange={(e) => set('closureStartMonth', e.target.value)}
                        type="number" min="1" max="12" placeholder="M" />
                      <input className={inputClass} value={form.closureStartDay}
                        onChange={(e) => set('closureStartDay', e.target.value)}
                        type="number" min="1" max="31" placeholder="D" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>End (Month/Day)</label>
                    <div className="flex gap-1">
                      <input className={inputClass} value={form.closureEndMonth}
                        onChange={(e) => set('closureEndMonth', e.target.value)}
                        type="number" min="1" max="12" placeholder="M" />
                      <input className={inputClass} value={form.closureEndDay}
                        onChange={(e) => set('closureEndDay', e.target.value)}
                        type="number" min="1" max="31" placeholder="D" />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Closures */}
              <div className="pt-2 border-t border-text-muted/25">
                <div className="flex items-center justify-between mb-2">
                  <span className={labelClass + ' mb-0'}>Additional Closures</span>
                  <button onClick={addClosure}
                    className="flex items-center gap-1 font-mono text-[11px] text-status-open hover:underline">
                    <PlusIcon className="w-3 h-3" /> Add
                  </button>
                </div>

                {form.additionalClosures.map((closure, idx) => (
                  <div key={idx} className="bg-bg-primary rounded-lg p-3 mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-text-muted">Closure {idx + 1}</span>
                      <button onClick={() => removeClosure(idx)} className="text-text-muted hover:text-status-closed">
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputClass} value={closure.label}
                        onChange={(e) => updateClosure(idx, 'label', e.target.value)}
                        placeholder="Label (e.g., Hunting season)" />
                      <select className={selectClass} value={closure.type}
                        onChange={(e) => updateClosure(idx, 'type', e.target.value)}>
                        {CLOSURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <input className={inputClass} value={closure.startMonth}
                        onChange={(e) => updateClosure(idx, 'startMonth', e.target.value)}
                        type="number" min="1" max="12" placeholder="SM" />
                      <input className={inputClass} value={closure.startDay}
                        onChange={(e) => updateClosure(idx, 'startDay', e.target.value)}
                        type="number" min="1" max="31" placeholder="SD" />
                      <input className={inputClass} value={closure.endMonth}
                        onChange={(e) => updateClosure(idx, 'endMonth', e.target.value)}
                        type="number" min="1" max="12" placeholder="EM" />
                      <input className={inputClass} value={closure.endDay}
                        onChange={(e) => updateClosure(idx, 'endDay', e.target.value)}
                        type="number" min="1" max="31" placeholder="ED" />
                    </div>
                    <input className={inputClass} value={closure.rule}
                      onChange={(e) => updateClosure(idx, 'rule', e.target.value)}
                      placeholder="Rule description" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Output Panel */}
          <div className="lg:sticky lg:top-4 self-start space-y-4">
            {/* Validation */}
            {errors.length > 0 && (
              <div className="bg-status-closed/10 border border-status-closed/30 rounded-xl px-4 py-3">
                <div className="font-mono text-[11px] font-semibold text-status-closed mb-1">Validation</div>
                <ul className="font-mono text-[11px] text-status-closed/80 space-y-0.5">
                  {errors.map((e) => <li key={e}>• {e}</li>)}
                </ul>
              </div>
            )}

            {/* Preview Card */}
            <div>
              <button onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 font-mono text-[12px] font-semibold text-text-secondary hover:text-text-primary mb-2">
                <EyeIcon className="w-3.5 h-3.5" /> {showPreview ? 'Hide' : 'Show'} Preview
              </button>
              {showPreview && form.name && (
                <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3 mb-4">
                  <div className="font-mono text-[14px] font-bold text-text-primary">{form.name}</div>
                  <div className="font-mono text-[11px] text-text-muted mt-0.5">
                    {form.region} · {form.state} · {form.manager}
                  </div>
                  <div className="font-mono text-[11px] text-text-secondary mt-1">
                    {form.difficulty} · {form.miles} mi · {form.closureType}
                  </div>
                  {form.notes && (
                    <div className="font-mono text-[11px] text-text-muted mt-2 leading-relaxed">
                      {form.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generated Code */}
            <div className="bg-bg-secondary border border-bg-elevated rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-text-muted/25">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">
                  Generated Code
                </span>
                <div className="flex items-center gap-3">
                  {isSupabaseConfigured && (
                    <button onClick={handleDbSubmit} disabled={errors.length > 0 || dbSubmitting}
                      className="flex items-center gap-1 font-mono text-[11px] font-semibold text-status-caution hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
                      <DatabaseIcon className="w-3 h-3" />
                      {dbSubmitting ? 'Submitting...' : dbResult?.ok ? 'Submitted!' : 'Submit to DB'}
                    </button>
                  )}
                  <button onClick={handleCopy} disabled={errors.length > 0}
                    className="flex items-center gap-1 font-mono text-[11px] font-semibold text-status-open hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
                    {copied ? <><CheckIcon className="w-3 h-3" /> Copied!</> : <><CopyIcon className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>
              <pre className="px-4 py-3 overflow-x-auto font-mono text-[11px] text-text-secondary leading-relaxed max-h-[500px] overflow-y-auto">
                {code}
              </pre>
            </div>

            {/* DB submission result */}
            {dbResult && (
              <div className={`font-mono text-[11px] ${dbResult.ok ? 'text-status-open' : 'text-status-closed'}`}>
                {dbResult.msg}
              </div>
            )}

            {/* Reset */}
            <button onClick={() => setForm(INITIAL_FORM)}
              className="font-mono text-[12px] text-text-muted hover:text-text-primary">
              Reset form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
