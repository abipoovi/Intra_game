import React, { useState } from 'react';
import { Award, AlertCircle, CheckCircle, ShieldAlert, FileText, Send, HelpCircle, Footprints, Flame, ZapOff } from 'lucide-react';
import { CLUES } from '../data/gameData';
import { CaseSubmission, ClueId } from '../types/game';
import { playBuzzer, playClick } from '../utils/audio';

interface CaseResolutionProps {
  onSubmitCase: (submission: CaseSubmission) => void;
  isTimeExpired: boolean;
  timeRemaining: number;
}

const CULPRIT_OPTIONS = [
  { value: 'Vicky', label: 'Vicky (The Nephew)' },
  { value: 'Divya', label: 'Divya (The Daughter)' },
  { value: 'Perumal', label: 'Perumal (The Cook)' },
  { value: 'Vicky + Perumal', label: 'Vicky + Perumal (Co-Conspirators)' },
];

const CLUE_CHOICES = [
  {
    title: 'Red Clay Footprints',
    desc: 'Fresh red mud footprints found under the bedroom window',
    icon: Footprints,
  },
  {
    title: 'Half-Burned Letter',
    desc: 'Scrap reading "...cutting you out of the property..."',
    icon: Flame,
  },
  {
    title: 'Pulled EB Main Fuse',
    desc: 'Main power switch outside pulled down at 11:15 PM',
    icon: ZapOff,
  },
];

export const CaseResolution: React.FC<CaseResolutionProps> = ({
  onSubmitCase,
  isTimeExpired,
  timeRemaining,
}) => {
  const [selectedCulprit, setSelectedCulprit] = useState<string>('');
  const [selectedClues, setSelectedClues] = useState<string[]>([]);
  const [motiveText, setMotiveText] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleToggleClue = (clueTitle: string) => {
    playClick();
    if (selectedClues.includes(clueTitle)) {
      setSelectedClues(selectedClues.filter((c) => c !== clueTitle));
    } else {
      if (selectedClues.length >= 2) {
        // limit to 2 as per requirement
        setSelectedClues([selectedClues[1], clueTitle]);
      } else {
        setSelectedClues([...selectedClues, clueTitle]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTimeExpired) return;

    if (!selectedCulprit) {
      playBuzzer();
      setErrorBanner('Please select the prime culprit or conspirators.');
      return;
    }

    if (selectedClues.length !== 2) {
      playBuzzer();
      setErrorBanner('You must select exactly 2 key clues to build a solid prosecution case.');
      return;
    }

    if (!motiveText.trim()) {
      playBuzzer();
      setErrorBanner('Please write a brief summary of the motive and method.');
      return;
    }

    setErrorBanner(null);
    onSubmitCase({
      culprit: selectedCulprit,
      selectedClues,
      motive: motiveText,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 font-serif">
              Submit Case Resolution Report
            </h1>
            <p className="text-xs text-zinc-400">
              Tamil Nadu Police Official CID Charge-Sheet & Final Accusation
            </p>
          </div>
        </div>
        <p className="text-xs text-zinc-300 mt-2 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80 leading-relaxed">
          Inspector, once you present this charge-sheet to the Magistrate, the court will issue immediate arrest warrants.
          Ensure your culprit selection and forensic evidence are airtight before the culprit catches their flight from Chennai Airport!
        </p>
      </div>

      {/* Error notification banner if any */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-red-950/70 border-2 border-red-500 text-red-200 text-sm flex items-start gap-3 shadow-lg animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-xs uppercase tracking-wide text-red-300 font-mono">
              CHARGE-SHEET INCOMPLETE
            </div>
            <div>{errorBanner}</div>
          </div>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Culprit Dropdown */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-zinc-200 uppercase tracking-wide font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Identify the Culprit(s)</span>
            </label>
            <span className="text-xs text-zinc-500">Required Selection</span>
          </div>

          <p className="text-xs text-zinc-400">
            Select who executed the sabotage, break-in, and abduction of Varadarajan:
          </p>

          <select
            value={selectedCulprit}
            onChange={(e) => {
              setSelectedCulprit(e.target.value);
              setErrorBanner(null);
            }}
            disabled={isTimeExpired}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            <option value="">-- Select Prime Culprit or Conspirators --</option>
            {CULPRIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Clues Checkbox (Select 2 key clues) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-zinc-200 uppercase tracking-wide font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Select Exactly 2 Key Evidences for Prosecution</span>
            </label>
            <span className={`text-xs font-mono font-bold ${selectedClues.length === 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Selected: {selectedClues.length} / 2
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            Which two pieces of physical evidence definitively prove the culprit's presence and coordination?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {CLUE_CHOICES.map((choice) => {
              const isChecked = selectedClues.includes(choice.title);
              const Icon = choice.icon;
              return (
                <div
                  key={choice.title}
                  onClick={() => !isTimeExpired && handleToggleClue(choice.title)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isChecked
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  } ${isTimeExpired ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${isChecked ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>
                    <h3 className="font-bold text-sm font-serif mb-1">{choice.title}</h3>
                    <p className="text-xs text-zinc-400 leading-normal">{choice.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Motive Textbox */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-zinc-200 uppercase tracking-wide font-mono flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>Deduction & Motive Summary</span>
            </label>
            <span className="text-xs text-zinc-500">Detective Notes</span>
          </div>

          <p className="text-xs text-zinc-400">
            Summarize how the crime occurred during the 11:15 PM blackout and what motive drove the conspirators:
          </p>

          <textarea
            rows={3}
            value={motiveText}
            onChange={(e) => {
              setMotiveText(e.target.value);
              setErrorBanner(null);
            }}
            disabled={isTimeExpired}
            placeholder="e.g. Vicky was drowning in race-course debts and learned Uncle Varadarajan was cutting him out of the ₹50 Crore will. He bribed Perumal with ₹10 Lakhs to cut the power..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isTimeExpired}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-zinc-950 font-extrabold text-base md:text-lg tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.55)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            <span>SUBMIT OFFICIAL CHARGE-SHEET</span>
          </button>
        </div>
      </form>
    </div>
  );
};
