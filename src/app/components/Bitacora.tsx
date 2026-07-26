'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { SectionTitle, EmptyState } from './ui/SectionTitle';
import { Button, IconButton } from './ui/Button';
import { Collapse } from './ui/Collapse';
import { Skeleton, CargandoTexto } from './ui/Skeleton';
import { Input, Textarea } from './ui/Field';
import { useI18n } from '@/i18n/I18nProvider';

type LogEntry = {
  id: string;
  entry_date: string;
  text: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function Bitacora() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ entry_date: today(), text: '' });

  async function fetchLogs() {
    const { data, error } = await supabase
      .from('log_entries')
      .select('*')
      .order('entry_date', { ascending: false });
    if (error) console.error(error);
    else setLogs(data);
  }

  function nueva() {
    setEditing(null);
    setForm({ entry_date: today(), text: '' });
    setOpen(true);
  }

  function editar(l: LogEntry) {
    setEditing(l.id);
    setForm({ entry_date: l.entry_date, text: l.text });
    setOpen(true);
  }

  function cerrar() {
    setOpen(false);
    setEditing(null);
    setForm({ entry_date: today(), text: '' });
  }

  async function deleteLog(id: string) {
    const { error } = await supabase.from('log_entries').delete().eq('id', id);
    if (error) console.error(error);
    else fetchLogs();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.text.trim()) return;

    const { error } = editing
      ? await supabase.from('log_entries').update(form).eq('id', editing)
      : await supabase.from('log_entries').insert({ ...form, user_id: user.id });

    if (error) console.error(error);
    else {
      await fetchLogs();
      cerrar();
    }
  }

  useEffect(() => {
    (async () => {
      await fetchLogs();
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <>
        <Skeleton filas={3} />
        <CargandoTexto>{t('common.loading')}</CargandoTexto>
      </>
    );

  return (
    <div className="anim-subir">
      <SectionTitle
        action={
          <Button onClick={() => (open ? cerrar() : nueva())}>
            <Plus size={13} strokeWidth={2.25} aria-hidden />
            {t('log.new')}
          </Button>
        }
      >
        {t('log.title')}
      </SectionTitle>

      <Collapse open={open}>
        <form
          onSubmit={handleSubmit}
          className="mb-3 rounded-[10px] border border-dashed border-line-strong bg-surface p-3.5"
        >
          <div className="mb-2 grid gap-2">
            <Input
              type="date"
              value={form.entry_date}
              onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
              aria-label={t('log.date')}
              className="sm:max-w-44"
            />
            <Textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder={t('log.example')}
              aria-label={t('log.entry')}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={cerrar}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {editing ? t('common.saveChanges') : t('common.save')}
            </Button>
          </div>
        </form>
      </Collapse>

      {logs.length === 0 ? (
        <EmptyState>{t('log.empty')}</EmptyState>
      ) : (
        <div className="anim-lista">
          {logs.map((l) => (
            <div key={l.id} className="mb-2.5 border-l-2 border-sage py-1 pl-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-sage-deep tabular-nums">
                  {l.entry_date}
                </span>
                <div className="flex shrink-0 gap-1.5">
                  <IconButton label={t('actions.editEntry')} onClick={() => editar(l)}>
                    <Pencil size={13} strokeWidth={2} aria-hidden />
                  </IconButton>
                  <IconButton label={t('actions.deleteEntry')} onClick={() => deleteLog(l.id)}>
                    <X size={13} strokeWidth={2} aria-hidden />
                  </IconButton>
                </div>
              </div>
              <p className="mt-0.5 text-[13px]">{l.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
