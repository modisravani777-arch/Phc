import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { api } from '../lib/api';
import { FacilitySchedule, SchedulePayload, ScheduleType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

const todayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const emptyForm = (date: string): SchedulePayload => ({
  title: '',
  schedule_type: 'MEDICAL_CAMP',
  date,
  start_time: '',
  end_time: '',
  location: '',
  notes: '',
});

const typeLabels: Record<ScheduleType, string> = {
  MEDICAL_CAMP: 'Medical camp',
  APPOINTMENT: 'Appointment',
  MEETING: 'Meeting',
  OTHER: 'Other',
};

export const ScheduleCalendarPage: React.FC = () => {
  const { facility } = useAuth();
  const { success, error: toastError } = useToast();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [schedules, setSchedules] = useState<FacilitySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SchedulePayload>(emptyForm(todayKey()));
  const [isSaving, setIsSaving] = useState(false);

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      setSchedules(await api.getSchedules());
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to load schedules');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const scheduleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    schedules.forEach((schedule) => counts.set(schedule.date, (counts.get(schedule.date) || 0) + 1));
    return counts;
  }, [schedules]);

  const selectedSchedules = schedules.filter((schedule) => schedule.date === selectedDate);
  const firstDayOffset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const daysInGrid = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;
  const calendarDays = Array.from({ length: daysInGrid }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index - firstDayOffset + 1);
    return {
      date,
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      isCurrentMonth: date.getMonth() === month.getMonth(),
    };
  });

  const openNewSchedule = () => {
    setEditingId(null);
    setForm(emptyForm(selectedDate));
    setModalOpen(true);
  };

  const openEditSchedule = (schedule: FacilitySchedule) => {
    setEditingId(schedule.id);
    setForm({
      title: schedule.title,
      schedule_type: schedule.schedule_type,
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      location: schedule.location,
      notes: schedule.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.updateSchedule(editingId, form);
        success('Schedule updated');
      } else {
        await api.createSchedule(form);
        success('Schedule added');
      }
      setModalOpen(false);
      setSelectedDate(form.date);
      setMonth(new Date(`${form.date}T00:00:00`));
      await loadSchedules();
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (schedule: FacilitySchedule) => {
    if (!window.confirm(`Delete "${schedule.title}"?`)) return;
    try {
      await api.deleteSchedule(schedule.id);
      success('Schedule deleted');
      await loadSchedules();
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to delete schedule');
    }
  };

  const changeMonth = (amount: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200/70 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-600">Appointments & camps</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Schedule calendar</h1>
          <p className="mt-1 text-sm text-slate-500">Choose a date to view the planned activities.</p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openNewSchedule}>
          Add schedule
        </Button>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <button
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-extrabold text-navy-900">
              {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
            <button
              aria-label="Next month"
              onClick={() => changeMonth(1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, key, isCurrentMonth }) => {
              const isSelected = selectedDate === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl text-sm transition ${
                    isSelected ? 'bg-brand-600 font-bold text-white shadow-md' :
                    isCurrentMonth ? 'text-navy-800 hover:bg-brand-50' : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {date.getDate()}
                  {(scheduleCounts.get(key) || 0) > 0 && (
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
          {isLoading && <p className="mt-4 text-center text-xs text-slate-400">Loading schedules…</p>}
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-600">Selected date</div>
              <h2 className="mt-1 text-lg font-extrabold text-navy-900">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
              {selectedSchedules.length} {selectedSchedules.length === 1 ? 'schedule' : 'schedules'}
            </span>
          </div>

          {selectedSchedules.length ? (
            <div className="space-y-3">
              {selectedSchedules.map((schedule) => {
                const canManage = schedule.facility_code === facility?.code;
                return (
                  <article key={schedule.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-lg bg-teal-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                          {typeLabels[schedule.schedule_type]}
                        </span>
                        <h3 className="mt-2 font-bold text-navy-900">{schedule.title}</h3>
                        {schedule.facility_code !== facility?.code && (
                          <p className="mt-1 text-xs text-slate-500">{schedule.facility_name}</p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex gap-1">
                          <button aria-label="Edit schedule" onClick={() => openEditSchedule(schedule)} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-brand-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button aria-label="Delete schedule" onClick={() => handleDelete(schedule)} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      {(schedule.start_time || schedule.end_time) && (
                        <div className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-brand-500" />{schedule.start_time || 'Time not set'}{schedule.end_time ? ` – ${schedule.end_time}` : ''}</div>
                      )}
                      {schedule.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand-500" />{schedule.location}</div>}
                      {schedule.notes && <p className="pt-1 text-slate-500">{schedule.notes}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-10 text-center">
              <CalendarDays className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-600">Nothing scheduled for this date</p>
              <button onClick={openNewSchedule} className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-800">Add a schedule</button>
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Update schedule' : 'Add schedule'}
        subtitle="Add a camp, appointment, meeting, or other activity."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <label className="block text-xs font-bold text-slate-600">
            Title
            <input required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-600">
              Type
              <select value={form.schedule_type} onChange={(event) => setForm({ ...form, schedule_type: event.target.value as ScheduleType })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm">
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Date
              <input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm" />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Start
              <input type="time" value={form.start_time || ''} onChange={(event) => setForm({ ...form, start_time: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm" />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              End
              <input type="time" value={form.end_time || ''} onChange={(event) => setForm({ ...form, end_time: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm" />
            </label>
          </div>
          <label className="block text-xs font-bold text-slate-600">
            Location
            <input value={form.location || ''} onChange={(event) => setForm({ ...form, location: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm" />
          </label>
          <label className="block text-xs font-bold text-slate-600">
            Notes
            <textarea rows={3} value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm" />
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>{editingId ? 'Save changes' : 'Add schedule'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
