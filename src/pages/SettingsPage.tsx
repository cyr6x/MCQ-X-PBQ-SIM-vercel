import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Trash2, Cloud, Save, Check } from 'lucide-react';
import { clearHistory } from '@/lib/examHistory';
import { deviceId } from '@/integrations/supabase/deviceClient';
import { DEFAULT_SETTINGS, type UserSettings } from '@/lib/userSettings';
import { useSettings } from '@/lib/SettingsContext';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, update, loaded } = useSettings();
  const [s, setS] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => { if (loaded) setS(settings); }, [loaded, settings]);

  const updateField = <K extends keyof UserSettings>(k: K, v: UserSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  const onSave = async () => {
    setSaving(true);
    await update(s);
    setSaving(false);
    setSavedAt(Date.now());
    toast.success('Settings saved');
    setTimeout(() => setSavedAt(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={onSave}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {savedAt ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save changes'}</>}
        </button>
      </div>

      <Section title="Study goals">
        <Field label="Daily minutes goal">
          <input type="number" min={5} max={240} value={s.daily_minutes_goal}
            onChange={(e) => updateField('daily_minutes_goal', Number(e.target.value))}
            className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md" />
        </Field>
        <Field label="Weekly question target">
          <input type="number" min={10} max={1000} value={s.weekly_question_target}
            onChange={(e) => updateField('weekly_question_target', Number(e.target.value))}
            className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md" />
        </Field>
        <Field label="Target exam date">
          <input type="date" value={s.target_exam_date ?? ''}
            onChange={(e) => updateField('target_exam_date', e.target.value || null)}
            className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md" />
        </Field>
      </Section>

      <Section title="Exam preferences">
        <Field label="Default mode">
          <select value={s.default_mode}
            onChange={(e) => updateField('default_mode', e.target.value as UserSettings['default_mode'])}
            className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md">
            <option value="tutor">Tutor — instant feedback</option>
            <option value="sprint">Sprint — 30 questions, fast</option>
            <option value="exam">Exam — 90 questions, timed</option>
          </select>
        </Field>
        <Field label="Confidence rating">
          <select value={s.confidence_required}
            onChange={(e) => updateField('confidence_required', e.target.value as UserSettings['confidence_required'])}
            className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md">
            <option value="off">Off</option>
            <option value="optional">Optional</option>
            <option value="required">Required per question</option>
          </select>
        </Field>
        <ToggleRow
          label="Allow interruption pause"
          help="Stops the exam timer and covers the question until you resume."
          checked={s.exam_pause_enabled}
          onChange={(value) => updateField('exam_pause_enabled', value)}
        />
        <ToggleRow
          label="Auto fullscreen on exam start"
          help="Useful for dedicated mock sessions; leave off when multitasking."
          checked={s.exam_auto_fullscreen}
          onChange={(value) => updateField('exam_auto_fullscreen', value)}
        />
        <ToggleRow
          label="Focus-change notice"
          help="Records when the active exam tab loses focus unless the exam is paused."
          checked={s.exam_focus_notice}
          onChange={(value) => updateField('exam_focus_notice', value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amber timer threshold (s)">
            <input type="number" min={60} max={5400} value={s.amber_threshold_seconds}
              onChange={(e) => updateField('amber_threshold_seconds', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md" />
          </Field>
          <Field label="Red timer threshold (s)">
            <input type="number" min={30} max={1800} value={s.red_threshold_seconds}
              onChange={(e) => updateField('red_threshold_seconds', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md" />
          </Field>
        </div>
      </Section>

      <Section title="Training set sizes">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Sprint questions">
            <input type="number" min={10} max={60} value={s.sprint_question_count}
              onChange={(e) => updateField('sprint_question_count', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md" />
          </Field>
          <Field label="Random drill questions">
            <input type="number" min={10} max={100} value={s.random_question_count}
              onChange={(e) => updateField('random_question_count', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md" />
          </Field>
          <Field label="PBQ lab set size">
            <input type="number" min={1} max={25} value={s.pbq_set_size}
              onChange={(e) => updateField('pbq_set_size', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md" />
          </Field>
        </div>
        <p className="text-[11px] leading-5 text-muted-foreground">
          Full exam simulations stay at 90 questions / 90 minutes. These controls only change training drills.
        </p>
      </Section>

      <Section title="Accessibility">
        <Field label="Font size">
          <select value={s.font_size}
            onChange={(e) => updateField('font_size', e.target.value as UserSettings['font_size'])}
            className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-md">
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={s.reduce_motion}
            onChange={(e) => updateField('reduce_motion', e.target.checked)}
            className="w-4 h-4" />
          Reduce motion (disables animations)
        </label>
      </Section>

      <section className="rounded-xl border border-border bg-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-4 h-4 text-success" />
          <h2 className="text-sm font-semibold">Cloud sync</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Your progress is stored anonymously under this device identity. Save this ID to access your data from another browser — there is no password recovery.
        </p>
        <div className="bg-muted rounded-md px-3 py-2 font-mono text-xs break-all select-all">{deviceId}</div>
      </section>

      <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <h2 className="text-sm font-semibold mb-2 text-destructive">Danger zone</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Permanently delete all local exam history and question stats on this device.
        </p>
        <button
          onClick={() => {
            if (confirm('Clear all local exam history and stats? This cannot be undone.')) {
              clearHistory();
              window.location.reload();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-destructive text-destructive-foreground font-semibold hover:opacity-90"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear local history
        </button>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 mb-4 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({ label, help, checked, onChange }: { label: string; help: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 px-3 py-3 cursor-pointer">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{help}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-current"
      />
    </label>
  );
}
