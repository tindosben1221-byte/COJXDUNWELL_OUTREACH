import React from 'react';
import { ScreeningRecord, ScreeningToolId } from '../types';
import { Users, UserCheck, CheckCircle, AlertCircle, Save, Plus, ArrowRight, ShieldCheck, HeartPulse, Flame, Brain, FileSignature, Stethoscope } from 'lucide-react';

interface PersonSelectorBarProps {
  toolId: ScreeningToolId;
  toolTitle: string;
  selectedPersonId: string;
  onSelectPerson: (personId: string) => void;
  onSaveToolInfo: () => void;
  isSaving?: boolean;
  activePerson?: ScreeningRecord;
  pendingPersons: ScreeningRecord[];
  completedPersons: ScreeningRecord[];
  showCompleted: boolean;
  onToggleShowCompleted: (show: boolean) => void;
  onGoToPersonalDetails: () => void;
}

export const PersonSelectorBar: React.FC<PersonSelectorBarProps> = ({
  toolId,
  toolTitle,
  selectedPersonId,
  onSelectPerson,
  onSaveToolInfo,
  isSaving = false,
  activePerson,
  pendingPersons,
  completedPersons,
  showCompleted,
  onToggleShowCompleted,
  onGoToPersonalDetails,
}) => {
  const personsToDisplay = showCompleted
    ? [...pendingPersons, ...completedPersons]
    : pendingPersons;

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-lg text-white mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Title & Queue Counter */}
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
              Tool Station Queue
            </span>
            <span className="text-xs text-blue-200 font-semibold">{toolTitle}</span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Select Person from Dropdown</span>
          </h4>
          <p className="text-xs text-blue-200/90 mt-0.5">
            Choose a person below, complete this tool, then click <strong>"Save Info"</strong>. The person will be automatically saved and removed from this dropdown.
          </p>
        </div>

        {/* Dropdown & Save Button Group */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Dropdown */}
          <div className="relative flex-1 sm:w-72">
            <select
              id={`person-select-${toolId}`}
              value={selectedPersonId}
              onChange={(e) => onSelectPerson(e.target.value)}
              className="w-full bg-white text-slate-900 font-extrabold text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border-2 border-amber-400 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="">
                {pendingPersons.length > 0
                  ? `-- Select a Person (${pendingPersons.length} waiting) --`
                  : '-- No pending persons in queue --'}
              </option>
              {personsToDisplay.map((p) => {
                const isCompleted = p.completedTools?.includes(toolId);
                return (
                  <option key={p.id} value={p.id}>
                    {isCompleted ? '✓ [Done] ' : '⏳ '}
                    {p.personal.fullName} ({p.personal.age}y {p.personal.gender}) - {p.refNumber}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Save Info Button */}
          <button
            type="button"
            onClick={onSaveToolInfo}
            disabled={!selectedPersonId || isSaving}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-md transition ${
              !selectedPersonId || isSaving
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-lg cursor-pointer transform active:scale-95'
            }`}
            title="Saves this screening tool to the selected person's database record and removes them from this dropdown"
          >
            <Save className="w-4 h-4" />
            <span>Save Info</span>
          </button>
        </div>
      </div>

      {/* Secondary Bar: Active Person Card + Queue Controls */}
      <div className="mt-4 pt-3 border-t border-blue-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        {activePerson ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded">
              CURRENT CLIENT:
            </span>
            <strong className="text-white text-sm font-black">{activePerson.personal.fullName}</strong>
            <span className="text-blue-300">|</span>
            <span className="text-amber-300 font-mono font-bold">{activePerson.refNumber}</span>
            <span className="text-blue-300">|</span>
            <span className="text-slate-200">
              {activePerson.personal.age}y, {activePerson.personal.gender} ({activePerson.personal.nationality})
            </span>
            <span className="text-blue-300">|</span>
            <span className="text-blue-200 italic">
              Spot: {activePerson.personal.physicalAddress}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-200 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {pendingPersons.length > 0
                ? 'Please select a person from the dropdown above to screen and save their info.'
                : 'All enrolled clients have completed this tool! Enroll a new person under Personal Details.'}
            </span>
          </div>
        )}

        {/* Action / Toggle Options */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs flex-wrap">
          {/* Enroll New Person button */}
          <button
            type="button"
            onClick={onGoToPersonalDetails}
            className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 hover:underline font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll New Person</span>
          </button>

          {/* Toggle show completed */}
          {completedPersons.length > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-blue-200 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => onToggleShowCompleted(e.target.checked)}
                className="rounded border-blue-400 text-amber-400 focus:ring-0 cursor-pointer"
              />
              <span>Show completed ({completedPersons.length})</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
