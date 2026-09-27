import React, { useState, useMemo } from 'react';
import { useCases } from '../../hooks/useCases';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const SERVICE_LABELS = {
  AJB: 'Akta Jual Beli',
  SKMHT: 'SK Hak Tanggungan',
  HT: 'Hak Tanggungan',
  CV_PT: 'Pendirian PT/CV',
};

// Derive unique clients from the cases list
function deriveClients(cases) {
  const map = {};
  cases.forEach((c) => {
    if (!map[c.clientId]) {
      map[c.clientId] = {
        id: c.clientId,
        name: c.clientName,
        cases: [],
      };
    }
    map[c.clientId].cases.push(c);
  });
  return Object.values(map);
}

import DateFilter from '../../components/common/DateFilter';
import { useAuth } from '../../hooks/useAuth';

export const OwnerClientsPage = () => {
  const { cases: allCases } = useCases();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterDate, setFilterDate] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');

  // Filter cases if user is staff (security safeguard)
  const cases = useMemo(() => {
    if (profile?.role === 'staff') {
      return allCases.filter(c => c.assignedStaffId === profile.id);
    }
    return allCases;
  }, [allCases, profile]);

  // Filter cases dynamically by selected period
  const dateFilteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (!c.entryDate) return false;
      const [yStr, mStr, dStr] = c.entryDate.split('-');
      const cYear = parseInt(yStr, 10);
      const cMonth = parseInt(mStr, 10);
      const cDay = parseInt(dStr, 10);

      if (filterYear !== 'ALL' && cYear !== parseInt(filterYear, 10)) return false;
      if (filterMonth !== 'ALL' && cMonth !== parseInt(filterMonth, 10)) return false;
      if (filterDate !== 'ALL' && cDay !== parseInt(filterDate, 10)) return false;

      return true;
    });
  }, [cases, filterDate, filterMonth, filterYear]);

  const clients = useMemo(() => deriveClients(dateFilteredCases), [dateFilteredCases]);

  const filtered = useMemo(
    () => clients.filter((cl) =>
      cl.name.toLowerCase().includes(search.toLowerCase()) ||
      cl.id.toLowerCase().includes(search.toLowerCase())
    ),
    [clients, search]
  );

  const activeTotal = clients.reduce((acc, cl) => acc + cl.cases.filter((c) => !c.isComplete).length, 0);
  const completedTotal = clients.reduce((acc, cl) => acc + cl.cases.filter((c) => c.isComplete).length, 0);

  return (
    <div className="space-y-stack-lg text-left">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Manajemen Klien</h2>
          <p className="text-body-lg text-on-surface-variant mt-1">Kelola portofolio klien dan riwayat pengurusan berkas akta.</p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-grid">
        {[
          { label: 'Total Klien', value: clients.length, icon: 'group', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Berkas Aktif', value: activeTotal, icon: 'folder_open', color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Berkas Selesai', value: completedTotal, icon: 'task_alt', color: 'text-tertiary', bg: 'bg-tertiary/10' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding flex items-center gap-4">
            <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
              <span className={`material-symbols-outlined ${color} text-[26px]`}>{icon}</span>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{label}</p>
              <p className={`font-extrabold text-[22px] mt-0.5 ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Period Filter Row */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md text-left">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama klien atau ID NIK..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary text-[13px]"
          />
        </div>

        <DateFilter
          date={filterDate}
          month={filterMonth}
          year={filterYear}
          onDateChange={setFilterDate}
          onMonthChange={setFilterMonth}
          onYearChange={setFilterYear}
        />
      </div>

      {/* Client grid + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-grid">
        {/* Client Cards */}
        <div className={`${selectedClient ? 'lg:col-span-7' : 'lg:col-span-12'} grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start`}>
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px] block mb-2 opacity-40">person_search</span>
              <p className="text-[13px]">Klien tidak ditemukan.</p>
            </div>
          ) : (
            filtered.map((cl) => {
              const activeCount = cl.cases.filter((c) => !c.isComplete).length;
              const isSelected = selectedClient?.id === cl.id;
              return (
                <div
                  key={cl.id}
                  onClick={() => setSelectedClient(isSelected ? null : cl)}
                  className={`bg-surface-container-lowest border rounded-xl p-card-padding cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-primary shadow-md' : 'border-outline-variant'}`}
                >
                  {/* Avatar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-extrabold text-primary text-[18px]">
                        {cl.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface text-[14px] truncate">{cl.name}</h4>
                      <p className="text-[11px] text-primary font-semibold">{cl.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-surface-container-low rounded-lg p-2 text-center">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total Berkas</p>
                      <p className="font-extrabold text-on-surface text-[18px] mt-0.5">{cl.cases.length}</p>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-2 text-center">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Aktif</p>
                      <p className={`font-extrabold text-[18px] mt-0.5 ${activeCount > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>{activeCount}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-outline-variant flex justify-between items-center">
                    <span className="text-[11px] text-on-surface-variant">Rasio Penyelesaian</span>
                    <span className="font-bold text-secondary text-[13px]">{cl.cases.length > 0 ? Math.round((cl.cases.filter(c => c.isComplete).length / cl.cases.length) * 100) : 0}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        {selectedClient && (
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200 self-start">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="font-extrabold text-primary text-[24px]">{selectedClient.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-[17px]">{selectedClient.name}</h3>
                  <p className="text-primary text-[12px] font-semibold">{selectedClient.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Berkas', value: selectedClient.cases.length },
                { label: 'Selesai', value: selectedClient.cases.filter((c) => c.isComplete).length },
                { label: 'Aktif', value: selectedClient.cases.filter((c) => !c.isComplete).length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-container-low rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{label}</p>
                  <p className="font-extrabold text-on-surface text-[18px] mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Completion Ratio */}
            <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/20">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Rasio Penyelesaian Klien</p>
              <p className="font-extrabold text-secondary text-[24px] mt-1">
                {selectedClient.cases.length > 0 
                  ? Math.round((selectedClient.cases.filter(c => c.isComplete).length / selectedClient.cases.length) * 100) 
                  : 0}%
              </p>
            </div>

            {/* Cases List */}
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-3">Riwayat Berkas</p>
              <div className="space-y-2">
                {selectedClient.cases.map((c) => (
                  <div key={c.id} className="bg-surface-container-low rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-primary text-[12px]">{c.caseNumber}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{SERVICE_LABELS[c.serviceType] || c.serviceType}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge variant="status" label={c.status} />
                      <p className="text-[10px] text-on-surface-variant mt-1">{formatDate(c.estimationDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerClientsPage;
