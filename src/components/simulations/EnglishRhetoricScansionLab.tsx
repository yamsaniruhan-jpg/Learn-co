import React, { useMemo, useState } from 'react';
import { BookOpen, RotateCcw } from 'lucide-react';

interface PresetLine {
  label: string;
  meterHint: string;
  text: string;
  rhetoricalNote: string;
}

const PRESETS: PresetLine[] = [
  {
    label: 'Iambic Pentameter (Shakespeare)',
    meterHint: '5 iambs (da-DUM × 5 = 10 syllables)',
    text: 'Shall I compare thee to a summer day',
    rhetoricalNote: 'Regular rising iambic cadence balancing an interrogative opening.',
  },
  {
    label: 'Trochaic Tetrameter (Blake)',
    meterHint: '4 trochees (DUM-da × 4)',
    text: 'Tiger tiger burning bright in the forest night',
    rhetoricalNote: 'Catalectic falling meter drives urgent trochaic percussion.',
  },
  {
    label: 'Periodic Parallelism (Rhetoric)',
    meterHint: 'Anaphora + balanced clauses',
    text: 'We shall fight on the beaches, we shall fight on the landing grounds.',
    rhetoricalNote: 'Anaphora ("we shall fight") amplifies resolve while syntactic parallelism equalizes clauses.',
  },
  {
    label: 'Antithesis & Chiasmus',
    meterHint: 'Inverted AB:BA parallel balance',
    text: 'Ask not what your country can do for you; ask what you can do for your country.',
    rhetoricalNote: 'Chiasmus reverses subject-object symmetry around the semicolon.',
  },
];

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;
  const trimmed = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const matches = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

export const EnglishRhetoricScansionLab: React.FC = () => {
  const [text, setText] = useState<string>(PRESETS[0].text);
  const [meterStyle, setMeterStyle] = useState<'iambic' | 'trochaic'>('iambic');

  const analysis = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordBreakdown = words.map((w) => ({
      word: w,
      syllables: countSyllables(w),
    }));
    const totalSyllables = wordBreakdown.reduce((acc, w) => acc + w.syllables, 0);

    // Build alternating stress contour based on chosen scansion frame
    const symbols: string[] = [];
    for (let i = 0; i < totalSyllables; i++) {
      if (meterStyle === 'iambic') symbols.push(i % 2 === 0 ? '˘' : '´');
      else symbols.push(i % 2 === 0 ? '´' : '˘');
    }

    const clauses = text.split(/[.;!?]+/).filter((s) => s.trim().length > 0);
    const hasSemicolon = text.includes(';');
    const commaCount = (text.match(/,/g) || []).length;
    const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ''));
    const freqMap = new Map<string, number>();
    lowerWords.forEach((w) => {
      if (w.length > 2) freqMap.set(w, (freqMap.get(w) || 0) + 1);
    });
    const repeatedTerms = Array.from(freqMap.entries())
      .filter(([, count]) => count >= 2)
      .map(([w, count]) => `${w} (${count}×)`);

    const feetLabel =
      totalSyllables === 10
        ? 'Pentameter (5 feet)'
        : totalSyllables === 8
        ? 'Tetrameter (4 feet)'
        : totalSyllables === 12
        ? 'Hexameter / Alexandrine (6 feet)'
        : `${Math.round(totalSyllables / 2)}-Foot Cadence`;

    return {
      words,
      wordBreakdown,
      totalSyllables,
      symbols,
      clausesCount: clauses.length,
      hasSemicolon,
      commaCount,
      repeatedTerms,
      feetLabel,
    };
  }, [text, meterStyle]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            English Prosody &amp; Rhetoric Virtual Lab
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            Interactive Metrical Scansion &amp; Syntactic Parallelism Analyzer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Load classical verse or prose rhetoric, edit any line, and inspect syllable counts, metrical feet, repetition tropes, and clause structure.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setText(PRESETS[0].text); setMeterStyle('iambic'); }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Passage
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-500" />
              Canonical Presets
            </div>
            <div className="space-y-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setText(p.text);
                    setMeterStyle(p.label.toLowerCase().includes('trochaic') ? 'trochaic' : 'iambic');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                    text === p.text
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                  }`}
                >
                  <div className="font-bold">{p.label}</div>
                  <div className={`text-[10px] mt-0.5 ${text === p.text ? 'text-violet-100' : 'text-slate-500'}`}>
                    {p.meterHint}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setMeterStyle('iambic')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  meterStyle === 'iambic' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                Iambic (˘ ´)
              </button>
              <button
                type="button"
                onClick={() => setMeterStyle('trochaic')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  meterStyle === 'trochaic' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                Trochaic (´ ˘)
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label htmlFor="scansion-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Line / Rhetorical Excerpt
            </label>
            <textarea
              id="scansion-input"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-serif text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Scansion Strip */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 text-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-violet-300">Metrical Grid ({analysis.feetLabel})</span>
              <span className="text-slate-300 tabular-nums">{analysis.totalSyllables} Syllables · {analysis.words.length} Words</span>
            </div>

            <div className="flex flex-wrap gap-3 py-2">
              {analysis.wordBreakdown.map((item, idx) => (
                <div key={`${item.word}-${idx}`} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-sm font-serif text-slate-100">{item.word}</div>
                  <div className="text-[10px] font-mono text-violet-300 mt-1">
                    {item.syllables} syl
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-sm tracking-widest text-amber-300 overflow-x-auto">
              {analysis.symbols.join(' ')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800">
              <div>
                <span className="text-slate-400 block">Clause Boundaries</span>
                <span className="font-bold text-slate-100 tabular-nums">
                  {analysis.clausesCount} sentence(s) · {analysis.commaCount} comma(s)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Balanced Semicolon</span>
                <span className="font-bold text-slate-100">
                  {analysis.hasSemicolon ? 'Detected (Antithesis / Coordination)' : 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Lexical Repetition</span>
                <span className="font-bold text-violet-300">
                  {analysis.repeatedTerms.length > 0 ? analysis.repeatedTerms.join(', ') : 'Distinct diction'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
