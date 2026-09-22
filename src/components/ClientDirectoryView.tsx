import React, { useState, useMemo } from 'react';
import { ScreeningRecord, TriageLevel } from '../types';
import {
  Users,
  Search,
  Calendar,
  Clock,
  MapPin,
  HeartPulse,
  Activity,
  FileText,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Brain,
  Home,
  Baby,
  GraduationCap,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Filter,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Trash2,
  Edit3,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  List,
  Maximize2,
  Check,
  X,
  Share2,
} from 'lucide-react';
import { PdfReportModal } from './PdfReportModal';
import { OUTREACH_SITES } from '../data/mockData';
import { deleteRecord, deduplicateRecordsByName } from '../data/db';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ClientDirectoryViewProps {
  records: ScreeningRecord[];
  onOpenScreeningForm: (recordToEdit?: ScreeningRecord) => void;
  onRefreshRecords?: () => void;
}

// Helper to format ISO timestamp into date and time
function formatDateTime(isoString: string) {
  if (!isoString) return { date: 'N/A', time: 'N/A', full: 'N/A', relative: '' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: 'N/A', time: 'N/A', full: 'N/A', relative: '' };

    const date = d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const time = d.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Relative calculation
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    let relative = '';
    if (diffHours < 1) {
      relative = 'Just now';
    } else if (diffHours < 24) {
      relative = `${Math.floor(diffHours)}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      relative = diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
    }

    return {
      date,
      time,
      full: `${date} at ${time}`,
      relative,
    };
  } catch (e) {
    return { date: 'N/A', time: 'N/A', full: 'N/A', relative: '' };
  }
}

export const ClientDirectoryView: React.FC<ClientDirectoryViewProps> = ({
  records,
  onOpenScreeningForm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [triageFilter, setTriageFilter] = useState<string>('ALL');
  const [shelterFilter, setShelterFilter] = useState<string>('ALL');
  const [htsFilter, setHtsFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'age_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Expanded card state
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Modal full dossier view state
  const [selectedRecordForDossier, setSelectedRecordForDossier] = useState<ScreeningRecord | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<'all' | 'personal' | 'vitals' | 'hts' | 'substance' | 'psychosocial' | 'actionPlan'>('all');

  // Single PDF printing modal
  const [pdfRecord, setPdfRecord] = useState<ScreeningRecord | null>(null);

  // Deduplicate records to eliminate any repeated names
  const uniqueRecords = useMemo(() => deduplicateRecordsByName(records), [records]);

  // Filter & sort logic
  const filteredAndSortedRecords = useMemo(() => {
    let result = uniqueRecords.filter((rec) => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        rec.personal.fullName.toLowerCase().includes(searchLower) ||
        (rec.personal.alias && rec.personal.alias.toLowerCase().includes(searchLower)) ||
        rec.refNumber.toLowerCase().includes(searchLower) ||
        (rec.personal.saIdNumber && rec.personal.saIdNumber.toLowerCase().includes(searchLower)) ||
        (rec.personal.physicalAddress && rec.personal.physicalAddress.toLowerCase().includes(searchLower)) ||
        (rec.personal.phone && rec.personal.phone.toLowerCase().includes(searchLower)) ||
        (rec.personal.nationality && rec.personal.nationality.toLowerCase().includes(searchLower)) ||
        (rec.outreachSite && rec.outreachSite.toLowerCase().includes(searchLower));

      const matchSite = siteFilter === 'ALL' || rec.outreachSite === siteFilter;

      const matchTriage =
        triageFilter === 'ALL' ||
        rec.actionPlan?.triageLevel === triageFilter;

      const matchShelter =
        shelterFilter === 'ALL' ||
        rec.actionPlan?.wantsCojShelter === shelterFilter;

      const matchHts =
        htsFilter === 'ALL' ||
        (htsFilter === 'Reactive' && rec.hts?.testResult?.includes('Reactive (Positive)')) ||
        (htsFilter === 'Non-Reactive' && rec.hts?.testResult?.includes('Non-Reactive')) ||
        (htsFilter === 'Other' && !rec.hts?.testResult?.includes('Reactive'));

      return matchSearch && matchSite && matchTriage && matchShelter && matchHts;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'date_asc') {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === 'name_asc') {
        return a.personal.fullName.localeCompare(b.personal.fullName);
      }
      if (sortBy === 'age_asc') {
        return a.personal.age - b.personal.age;
      }
      return 0;
    });

    return result;
  }, [records, searchTerm, siteFilter, triageFilter, shelterFilter, htsFilter, sortBy]);

  // In-app deletion confirmation state
  const [recordToDelete, setRecordToDelete] = useState<ScreeningRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClient = (record: ScreeningRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecordToDelete(record);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRecord(recordToDelete.id);
      if (selectedRecordForDossier?.id === recordToDelete.id) {
        setSelectedRecordForDossier(null);
      }
      setRecordToDelete(null);
    } catch (err) {
      console.error('Failed to delete record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
                Client Information Directory & Medical Dossiers
              </h2>
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full">
                {records.length} {records.length === 1 ? 'Person' : 'People'} Registered
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Complete chronological database of all screened vulnerable individuals with recorded timestamps, clinical vitals, HIV rapid testing, substance recovery triage, psychosocial mental health indicators, and COJ shelter reintegration plans.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenScreeningForm()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>+ Screen New Person</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & View Controls */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search bar */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, alias, ID, ref#, spot, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-900 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Site Filter */}
          <div className="lg:col-span-2">
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-900"
            >
              <option value="ALL">All Outreach Sites ({records.length})</option>
              {OUTREACH_SITES.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          {/* Shelter Filter */}
          <div className="lg:col-span-2">
            <select
              value={shelterFilter}
              onChange={(e) => setShelterFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-900"
            >
              <option value="ALL">All Shelter Statuses</option>
              <option value="Yes">Wants COJ Shelter</option>
              <option value="Undecided">Undecided / Needs Counseling</option>
              <option value="No">Declines / Prefers Streets</option>
              <option value="Other">Other Housing Need</option>
            </select>
          </div>

          {/* Sort By Date/Time */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="date_desc">Newest Date & Time First</option>
                <option value="date_asc">Oldest Date & Time First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="age_asc">Age (Youngest/Youth)</option>
              </select>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="lg:col-span-2 flex items-center justify-end gap-1">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Dossier Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ledger Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <strong className="text-slate-900 font-mono font-bold">{filteredAndSortedRecords.length}</strong> of{' '}
          <strong className="text-slate-900 font-mono">{records.length}</strong> client records
          {searchTerm && (
            <span> matching &ldquo;<span className="text-blue-900 font-bold">{searchTerm}</span>&rdquo;</span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 italic">
          Click any record to inspect complete clinical information and history
        </div>
      </div>

      {/* ZERO STATE */}
      {filteredAndSortedRecords.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No client records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || siteFilter !== 'ALL'
                ? 'Try adjusting your search terms or clearing the filters above.'
                : 'No client intake forms have been submitted yet. Register the first client to begin.'}
            </p>
          </div>
          {(searchTerm || siteFilter !== 'ALL' || shelterFilter !== 'ALL') ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSiteFilter('ALL');
                setShelterFilter('ALL');
                setTriageFilter('ALL');
                setHtsFilter('ALL');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
            >
              Clear All Filters
            </button>
          ) : (
            <button
              onClick={() => onOpenScreeningForm()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-sm transition"
            >
              + Start Client Intake Screening
            </button>
          )}
        </div>
      )}

      {/* VIEW MODE: CARDS */}
      {viewMode === 'cards' && filteredAndSortedRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedRecords.map((record) => {
            const dateTime = formatDateTime(record.createdAt);
            const isYouth = record.personal.age <= 35;
            const isExpanded = expandedRecordId === record.id;

            return (
              <div
                key={record.id}
                className="bg-white border border-slate-200 hover:border-blue-900/40 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header with Exact Date & Time */}
                <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {record.refNumber}
                        </span>
                        {isYouth && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-2xs">
                            Youth
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-950 transition flex items-center gap-1.5 pt-1">
                        {record.personal.fullName}
                      </h3>
                      {record.personal.alias && (
                        <p className="text-xs text-slate-500 italic">
                          Street Alias: &ldquo;{record.personal.alias}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Triage Badge */}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border shrink-0 ${
                        record.actionPlan?.triageLevel === 'Emergency Medical Care'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : record.actionPlan?.triageLevel?.includes('Urgent')
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : record.actionPlan?.triageLevel?.includes('Moderate')
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {record.actionPlan?.triageLevel?.split('/')[0] || 'Routine'}
                    </span>
                  </div>

                  {/* Date and Time Bar */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-blue-900" />
                      <span className="font-bold text-slate-800">{dateTime.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{dateTime.time}</span>
                      {dateTime.relative && (
                        <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded">
                          {dateTime.relative}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body - Structured Demographic & Clinical Info */}
                <div className="p-4 sm:p-5 pt-3 space-y-3 text-xs flex-1">
                  {/* Demographics row */}
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Demographics</span>
                      <span className="font-bold text-slate-900">
                        {record.personal.age}y • {record.personal.gender}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {record.personal.race} • {record.personal.nationality}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Contact / Spot</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {record.personal.phone || 'No phone'}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        Spot: {record.personal.physicalAddress}
                      </span>
                    </div>
                  </div>

                  {/* Outreach Site */}
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate font-medium">{record.outreachSite}</span>
                  </div>

                  {/* Clinical Indicators Grid */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {/* BP & Vitals */}
                    <div className="bg-blue-50/70 border border-blue-100 p-2 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-black text-blue-900 block">Vitals</span>
                      <span className="font-mono font-black text-slate-900 block">
                        {record.medical?.vitals?.bloodPressureSys}/{record.medical?.vitals?.bloodPressureDia}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">
                        SpO2 {record.medical?.vitals?.oxygenSaturation}%
                      </span>
                    </div>

                    {/* HTS Result */}
                    <div
                      className={`p-2 rounded-xl text-center border ${
                        record.hts?.testResult?.includes('Reactive (Positive)')
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : record.hts?.testResult?.includes('Non-Reactive')
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-black block">HTS Rapid</span>
                      <span className="font-bold text-[11px] truncate block">
                        {record.hts?.testResult?.split('(')[0] || 'Not Done'}
                      </span>
                      <span className="text-[9px] opacity-75 font-semibold">
                        ART: {record.hts?.onArt?.split(' ')[0] || 'N/A'}
                      </span>
                    </div>

                    {/* Shelter Request */}
                    <div
                      className={`p-2 rounded-xl text-center border ${
                        record.actionPlan?.wantsCojShelter === 'Yes'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : record.actionPlan?.wantsCojShelter === 'Undecided'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-black block">COJ Shelter</span>
                      <span className="font-bold text-[11px] truncate block">
                        {record.actionPlan?.wantsCojShelter === 'Yes'
                          ? 'Wants Shelter'
                          : record.actionPlan?.wantsCojShelter === 'Undecided'
                          ? 'Undecided'
                          : 'No Shelter'}
                      </span>
                      <span className="text-[9px] opacity-75 font-semibold">
                        {record.actionPlan?.hasChildrenOnStreets === 'Yes' ? '⚠️ Children' : 'Single'}
                      </span>
                    </div>
                  </div>

                  {/* Collapsible details preview */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
                      <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ID / Passport:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {record.personal.saIdNumber || 'None / Not available'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Language:</span>
                          <span className="font-semibold text-slate-800">
                            {record.personal.homeLanguage}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Substances:</span>
                          <span className="font-semibold text-amber-900 truncate max-w-[170px]">
                            {record.substance?.substanceTypes?.join(', ') || 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Mental Health:</span>
                          <span className="font-semibold text-indigo-900">
                            {record.psychosocial?.analysis?.distressLevel || 'Normal'}
                          </span>
                        </div>
                        {record.actionPlan?.followUpDate && (
                          <div className="flex justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-500">Follow-up Date:</span>
                            <span className="font-mono font-bold text-blue-900">
                              {record.actionPlan.followUpDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 sm:px-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> Quick View
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPdfRecord(record)}
                      className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                      title="Print / Export PDF Dossier"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenScreeningForm(record)}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                      title="Edit / Update Screening Info"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteClient(record, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecordForDossier(record);
                        setActiveDossierTab('all');
                      }}
                      className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Dossier</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE: COMPREHENSIVE DATA TABLE */}
      {viewMode === 'table' && filteredAndSortedRecords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-3">Client Identity & ID</th>
                  <th className="py-3 px-3">Site & Sleeping Spot</th>
                  <th className="py-3 px-3 text-center">Vitals (BP/SpO2)</th>
                  <th className="py-3 px-3 text-center">HTS Test</th>
                  <th className="py-3 px-3">Substance / Addiction</th>
                  <th className="py-3 px-3">COJ Shelter & Reintegration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedRecords.map((record) => {
                  const dateTime = formatDateTime(record.createdAt);
                  const isYouth = record.personal.age <= 35;

                  return (
                    <tr
                      key={record.id}
                      onClick={() => {
                        setSelectedRecordForDossier(record);
                        setActiveDossierTab('all');
                      }}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-900" />
                          <span>{dateTime.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{dateTime.time}</span>
                        </div>
                      </td>

                      {/* Client Identity */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          {record.personal.fullName}
                          {isYouth && (
                            <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                              YOUTH
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-blue-900">{record.refNumber}</span>
                          <span>•</span>
                          <span>{record.personal.gender}, {record.personal.age}y ({record.personal.nationality})</span>
                        </div>
                      </td>

                      {/* Site & Spot */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 block truncate max-w-[150px]">
                          {record.outreachSite}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[170px] italic">
                          {record.personal.physicalAddress}
                        </span>
                      </td>

                      {/* Vitals */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <div className="font-bold text-slate-900">
                          {record.medical?.vitals?.bloodPressureSys}/{record.medical?.vitals?.bloodPressureDia}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          SpO2: {record.medical?.vitals?.oxygenSaturation}% • Pulse: {record.medical?.vitals?.pulseRate}
                        </div>
                      </td>

                      {/* HTS Rapid */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-block ${
                            record.hts?.testResult?.includes('Reactive (Positive)')
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : record.hts?.testResult?.includes('Non-Reactive')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {record.hts?.testResult?.split('(')[0] || 'Not Done'}
                        </span>
                      </td>

                      {/* Substance */}
                      <td className="py-3.5 px-3">
                        <span className="text-xs font-semibold text-slate-800 block truncate max-w-[140px]">
                          {record.substance?.substanceTypes?.slice(0, 2).join(', ') || 'None'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Rehab: {record.substance?.interestInRehabSupport?.split('/')[0] || 'No'}
                        </span>
                      </td>

                      {/* Shelter */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-block ${
                            record.actionPlan?.wantsCojShelter === 'Yes'
                              ? 'bg-emerald-100 text-emerald-800'
                              : record.actionPlan?.wantsCojShelter === 'Undecided'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {record.actionPlan?.wantsCojShelter === 'Yes'
                            ? 'Wants Shelter'
                            : record.actionPlan?.wantsCojShelter === 'Undecided'
                            ? 'Undecided'
                            : 'No Shelter'}
                        </span>
                        {record.actionPlan?.hasChildrenOnStreets === 'Yes' && (
                          <span className="block text-[10px] font-black text-rose-700 mt-0.5">
                            ⚠️ Minor Children on Streets
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setPdfRecord(record)}
                            className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition"
                            title="Export PDF Dossier"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenScreeningForm(record)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClient(record, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: COMPREHENSIVE ORGANIZED CLIENT DOSSIER */}
      {selectedRecordForDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0B2545] to-[#123B6E] text-white p-5 sm:p-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                    {selectedRecordForDossier.refNumber}
                  </span>
                  <span className="text-xs text-blue-200 font-semibold">
                    Screened by: {selectedRecordForDossier.screenerName}
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
                  {selectedRecordForDossier.personal.fullName}
                  {selectedRecordForDossier.personal.alias && (
                    <span className="text-sm font-normal text-blue-200 italic">
                      (&ldquo;{selectedRecordForDossier.personal.alias}&rdquo;)
                    </span>
                  )}
                </h2>
                {/* Date & Time in header */}
                <div className="flex items-center gap-4 text-xs text-blue-100 font-mono pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Intake Date: {formatDateTime(selectedRecordForDossier.createdAt).date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Time: {formatDateTime(selectedRecordForDossier.createdAt).time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {selectedRecordForDossier.outreachSite}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedRecordForDossier;
                    setSelectedRecordForDossier(null);
                    onOpenScreeningForm(rec);
                  }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5"
                  title="Edit Record"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClient(selectedRecordForDossier)}
                  className="px-3 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfRecord(selectedRecordForDossier)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecordForDossier(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex items-center overflow-x-auto px-5 pt-3 bg-slate-50 border-b border-slate-200 gap-1">
              {[
                { id: 'all', label: 'All Information' },
                { id: 'personal', label: '1. Personal Details' },
                { id: 'vitals', label: '2. Vitals & HTS' },
                { id: 'substance', label: '3. Substance Screening' },
                { id: 'psychosocial', label: '4. Mental Health Tick Form' },
                { id: 'actionPlan', label: '5. Shelter & Reintegration' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDossierTab(tab.id as any)}
                  className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                    activeDossierTab === tab.id
                      ? 'border-blue-900 text-blue-950 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dossier Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* SECTION 1: PERSONAL & DEMOGRAPHICS */}
              {(activeDossierTab === 'all' || activeDossierTab === 'personal') && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-900" />
                      1. Personal Demographics & Contact Dossier
                    </h4>
                    <span className="font-mono text-[11px] text-slate-500">
                      ID: {selectedRecordForDossier.personal.saIdNumber || 'No formal ID'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Full Name</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedRecordForDossier.personal.fullName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Age & Gender</span>
                      <span className="font-bold text-slate-900">
                        {selectedRecordForDossier.personal.age} years old • {selectedRecordForDossier.personal.gender}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Race & Nationality</span>
                      <span className="font-bold text-slate-900">
                        {selectedRecordForDossier.personal.race} • {selectedRecordForDossier.personal.nationality}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Home Language</span>
                      <span className="font-bold text-slate-900">{selectedRecordForDossier.personal.homeLanguage}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Sleeping Spot / Physical Address</span>
                      <span className="font-semibold text-slate-900 block">{selectedRecordForDossier.personal.physicalAddress}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Primary Phone</span>
                      <span className="font-semibold text-slate-900">{selectedRecordForDossier.personal.phone || 'None provided'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Emergency Contact</span>
                      <span className="font-semibold text-slate-900 block">
                        {selectedRecordForDossier.personal.emergencyContact || 'No emergency contact on file'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: VITALS & HTS */}
              {(activeDossierTab === 'all' || activeDossierTab === 'vitals') && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-rose-600" />
                      2. Clinical Vitals & HIV Rapid Testing (HTS)
                    </h4>
                    <span className="text-[11px] font-bold text-slate-600">
                      Outcome: <strong className="text-blue-900">{selectedRecordForDossier.medical.vitals.vitalsOutcome}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Pressure</span>
                      <span className="font-mono text-base font-black text-slate-900">
                        {selectedRecordForDossier.medical.vitals.bloodPressureSys}/{selectedRecordForDossier.medical.vitals.bloodPressureDia}
                      </span>
                      <span className="text-[10px] text-slate-500 block">MAP: {selectedRecordForDossier.medical.vitals.map} mmHg</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Pulse Rate</span>
                      <span className="font-mono text-base font-black text-slate-900">
                        {selectedRecordForDossier.medical.vitals.pulseRate} bpm
                      </span>
                      <span className="text-[10px] text-slate-500 block capitalize">
                        {selectedRecordForDossier.medical.vitals.pulseRhythm}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Oxygen (SpO2)</span>
                      <span className="font-mono text-base font-black text-slate-900">
                        {selectedRecordForDossier.medical.vitals.oxygenSaturation}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {selectedRecordForDossier.medical.vitals.oxygenSaturation >= 95 ? 'Normal Saturation' : 'Hypoxia Alert'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Weight & BMI</span>
                      <span className="font-mono text-base font-black text-slate-900">
                        {selectedRecordForDossier.medical.vitals.bmi} kg/m²
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {selectedRecordForDossier.medical.vitals.weightKg}kg • {selectedRecordForDossier.medical.vitals.heightCm}cm
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">HTS Rapid Result</span>
                      <span className="font-bold text-slate-900 text-sm block">
                        {selectedRecordForDossier.hts.testResult}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Known Status Prior: {selectedRecordForDossier.hts.hivStatusKnown}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">ART & Adherence</span>
                      <span className="font-bold text-slate-900 block">{selectedRecordForDossier.hts.onArt}</span>
                      <span className="text-[11px] text-slate-500">PrEP Offered: {selectedRecordForDossier.hts.prepOffered ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Clinic Referral</span>
                      <span className="font-bold text-slate-900 block">{selectedRecordForDossier.hts.referral}</span>
                      <span className="text-[11px] text-slate-500">{selectedRecordForDossier.hts.referralFacility || 'No facility designated'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: SUBSTANCE SCREENING */}
              {(activeDossierTab === 'all' || activeDossierTab === 'substance') && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    3. Substance Use Surveillance & Rehabilitation Interest
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Alcohol Use</span>
                      <span className="font-bold text-slate-900">{selectedRecordForDossier.substance.alcoholUseFrequency}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Drug Use Frequency</span>
                      <span className="font-bold text-slate-900">{selectedRecordForDossier.substance.drugUseFrequency}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Injecting Drugs (IDU)</span>
                      <span className="font-bold text-slate-900">
                        {selectedRecordForDossier.substance.injectingDrugUse ? '⚠️ Yes (IDU Risk)' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Rehab Support Interest</span>
                      <span className="font-bold text-emerald-800">{selectedRecordForDossier.substance.interestInRehabSupport}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Substances Used:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecordForDossier.substance.substanceTypes.map((sub, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold text-[11px]">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: PSYCHOSOCIAL / MENTAL HEALTH */}
              {(activeDossierTab === 'all' || activeDossierTab === 'psychosocial') && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Brain className="w-4 h-4 text-indigo-700" />
                    4. Psychosocial Mental Health Surveillance (Tick Form)
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Distress Score</span>
                      <span className="font-mono text-base font-black text-indigo-950">
                        {selectedRecordForDossier.psychosocial?.analysis?.score || 0} / 12
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Distress Level</span>
                      <span className="font-black text-slate-900 text-xs">
                        {selectedRecordForDossier.psychosocial?.analysis?.distressLevel || 'Normal'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Suicide & Crisis Alert</span>
                      <span className="font-black text-xs">
                        {selectedRecordForDossier.psychosocial?.analysis?.crisisAlert ? (
                          <span className="text-rose-700">⚠️ Active Crisis Alert</span>
                        ) : (
                          <span className="text-emerald-700">No Crisis Alert</span>
                        )}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">GBV / Trauma History</span>
                      <span className="font-black text-xs text-slate-800">
                        {selectedRecordForDossier.psychosocial?.symptoms?.recentGbvOrAssault ? 'Reported' : 'None Reported'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: SHELTER, SOCIAL SUPPORT & REINTEGRATION */}
              {(activeDossierTab === 'all' || activeDossierTab === 'actionPlan') && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Home className="w-4 h-4 text-emerald-700" />
                    5. Shelter, Social Support & Reintegration Plan
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">COJ Shelter Intake</span>
                      <span className="font-black text-slate-900 text-sm block">
                        {selectedRecordForDossier.actionPlan.wantsCojShelter}
                      </span>
                      {selectedRecordForDossier.actionPlan.shelterPreferenceNotes && (
                        <span className="text-[11px] text-slate-600 block">
                          Notes: {selectedRecordForDossier.actionPlan.shelterPreferenceNotes}
                        </span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Children on Streets</span>
                      <span className="font-black text-slate-900 text-sm block">
                        {selectedRecordForDossier.actionPlan.hasChildrenOnStreets === 'Yes'
                          ? `⚠️ Yes (${selectedRecordForDossier.actionPlan.childrenCount || 1} minors)`
                          : 'No minor children'}
                      </span>
                      {selectedRecordForDossier.actionPlan.childrenAges && (
                        <span className="text-[11px] text-slate-600 block">
                          Ages: {selectedRecordForDossier.actionPlan.childrenAges}
                        </span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Past Shelter History</span>
                      <span className="font-black text-slate-900 text-sm block">
                        Stayed before: {selectedRecordForDossier.actionPlan.stayedAtCojShelterBefore}
                      </span>
                      <span className="text-[11px] text-slate-600 block">
                        Freq: {selectedRecordForDossier.actionPlan.shelterFrequency || 'Never'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Development */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Skills Training Interest</span>
                      <span className="font-bold text-emerald-800">
                        {selectedRecordForDossier.actionPlan.interestedInSkillsDevelopment}
                      </span>
                    </div>
                    {selectedRecordForDossier.actionPlan.skillsInterestAreas && selectedRecordForDossier.actionPlan.skillsInterestAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedRecordForDossier.actionPlan.skillsInterestAreas.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-900 rounded-md font-bold text-[10px] border border-emerald-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Case Notes & Follow Up */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Outreach Follow-up Schedule</span>
                      <span className="font-mono font-bold text-blue-900 text-xs">
                        {selectedRecordForDossier.actionPlan.followUpDate ? `Scheduled: ${selectedRecordForDossier.actionPlan.followUpDate}` : 'No date set'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 italic pt-1">
                      Case Notes: {selectedRecordForDossier.actionPlan.screenerNotes || selectedRecordForDossier.actionPlan.counselingDetails || 'Standard outreach surveillance completed.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedRecordForDossier(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteClient(selectedRecordForDossier)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedRecordForDossier;
                    setSelectedRecordForDossier(null);
                    onOpenScreeningForm(rec);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Record</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfRecord(selectedRecordForDossier)}
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal for Single Client */}
      {pdfRecord && (
        <PdfReportModal
          record={pdfRecord}
          onClose={() => setPdfRecord(null)}
        />
      )}

      {/* In-App Permanent Delete Confirmation Dialog */}
      {recordToDelete && (
        <DeleteConfirmModal
          record={recordToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setRecordToDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};
