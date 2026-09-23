import { useEffect, useState } from 'react';
import { Accessibility, Check, Cloud, Save, Settings as SettingsIcon, Target, Trash2, Zap } from 'lucide-react';
import { clearHistory } from '@/lib/examHistory';
import { DEFAULT_SETTINGS, type UserSettings } from '@/lib/userSettings';
import { useSettings } from '@/lib/SettingsContext';
import { toast } from 'sonner';
import { PageHeader, Panel, StatusChip } from '@/components/product/ProductUI';

export default function SettingsPage() {
  const { settings, update, loaded } = useSettings();
  const [draft, setDraft] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (loaded) setDraft(settings);
  }, [loaded, settings]);

  const updateField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await update(draft);
      setSavedAt(Date.now());
      toast.success('Training settings saved');
      window.setTimeout(() => setSavedAt(null), 2000);
    } catch {
      toast.error('Settings could not be saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Training controls"
        title="Tune the trainer, not the exam standard."
        description="These preferences change your study workflow and simulator ergonomics. Full exam forms remain 90 questions / 90 minutes with the same domain weighting."
        icon={<SettingsIcon className="h-4 w-4" />}
        actions={
          <button
            onClick={onSave}
            disabled={saving || !loaded}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-45"
          >
            {savedAt ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {savedAt ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Training goals" eyebrow="Progress" description="Dashboard goal meters use these values directly.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Daily active minutes">
              <NumberInput min={5} max={240} value={draft.daily_minutes_goal} onChange={(value) => updateField('daily_minutes_goal', value)} />
            </Field>
            <Field label="Weekly question target">
              <NumberInput min={10} max={1000} value={draft.weekly_question_target} onChange={(value) => updateField('weekly_question_target', value)} />
            </Field>
            <Field label="Target exam date" className="sm:col-span-2">
              <input
                type="date"
                value={draft.target_exam_date ?? ''}
                onChange={(event) => updateField('target_exam_date', event.target.value || null)}
                className="w-full rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-sm"
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Quick-start behavior" eyebrow="Defaults" description="Your default mode powers the Dashboard quick-start action.">
          <Field label="Default training mode">
            <select
              value={draft.default_mode}
              onChange={(event) => updateField('default_mode', event.target.value as UserSettings['default_mode'])}
              className="w-full rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-sm"
            >
              <option value="tutor">Tutor — feedback-first learning</option>
              <option value="sprint">Sprint — configured quick set</option>
              <option value="exam">Exam — full simulation</option>
            </select>
          </Field>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-[11px] leading-5 text-muted-foreground">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Confidence-rating configuration is intentionally hidden until confidence is actually captured and analyzed end to end.</span>
          </div>
        </Panel>

        <Panel title="Exam ergonomics" eyebrow="Simulation" description="These controls affect interruption handling and focus—not scoring or content difficulty.">
          <div className="space-y-2">
            <ToggleRow
              label="Allow interruption pause"
              help="Covers the active question and stops both countdown and per-question timing."
              checked={draft.exam_pause_enabled}
              onChange={(value) => updateField('exam_pause_enabled', value)}
            />
            <ToggleRow
              label="Auto fullscreen on exam start"
              help="Requests browser fullscreen when a full form begins."
              checked={draft.exam_auto_fullscreen}
              onChange={(value) => updateField('exam_auto_fullscreen', value)}
            />
            <ToggleRow
              label="Focus-change notice"
              help="Records focus changes while the exam is running; paused sessions are ignored."
              checked={draft.exam_focus_notice}
              onChange={(value) => updateField('exam_focus_notice', value)}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Amber warning · seconds">
              <NumberInput min={60} max={5400} value={draft.amber_threshold_seconds} onChange={(value) => updateField('amber_threshold_seconds', value)} />
            </Field>
            <Field label="Red warning · seconds">
              <NumberInput min={30} max={1800} value={draft.red_threshold_seconds} onChange={(value) => updateField('red_threshold_seconds', value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Training set sizes" eyebrow="Practice" description="These values only affect drills; full exam simulations remain fixed.">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Sprint">
              <NumberInput min={10} max={60} value={draft.sprint_question_count} onChange={(value) => updateField('sprint_question_count', value)} />
            </Field>
            <Field label="Random drill">
              <NumberInput min={10} max={100} value={draft.random_question_count} onChange={(value) => updateField('random_question_count', value)} />
            </Field>
            <Field label="PBQ Lab">
              <NumberInput min={1} max={25} value={draft.pbq_set_size} onChange={(value) => updateField('pbq_set_size', value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Accessibility" eyebrow="Interface" description="Applied globally through the shared Settings provider.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Font size">
              <select
                value={draft.font_size}
                onChange={(event) => updateField('font_size', event.target.value as UserSettings['font_size'])}
                className="w-full rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-sm"
              >
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </Field>
            <div className="flex items-end">
              <ToggleRow
                label="Reduce motion"
                help="Disables nonessential transitions and animations."
                checked={draft.reduce_motion}
                onChange={(value) => updateField('reduce_motion', value)}
                compact
              />
            </div>
          </div>
        </Panel>

        <Panel title="Anonymous cloud backup" eyebrow="Data" description="Attempts and settings are written to device-scoped Supabase rows protected by row-level security.">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3">
            <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div className="text-[11px] leading-5 text-muted-foreground">
              Progress remains local-first. The browser identity used for backup is not displayed because it also participates in data access control. Clearing browser storage can create a new anonymous identity; there is no account recovery flow.
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4 border-destructive/30" title="Danger zone" eyebrow="Local data">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Clear local training history</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Removes local exam history and question stats. Cloud backup rows are not deleted by this action.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Clear all local exam history and question stats? This cannot be undone locally.')) {
                clearHistory();
                toast.success('Local training history cleared');
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-xs font-semibold text-destructive-foreground hover:opacity-90"
          >
            <Trash2 className="h-4 w-4" />
            Clear local history
          </button>
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberInput({ min, max, value, onChange }: { min: number; max: number; value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(event) => {
        const parsed = Number(event.target.value);
        if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
      }}
      className="w-full rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-sm"
    />
  );
}

function ToggleRow({
  label,
  help,
  checked,
  onChange,
  compact = false,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  compact?: boolean;
}) {
  return (
    <label className={`flex w-full cursor-pointer items-start justify-between gap-4 rounded-xl border border-border bg-muted/20 ${compact ? 'px-3 py-2.5' : 'px-3 py-3'}`}>
      <span>
        <span className="block text-xs font-semibold">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{help}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
      />
    </label>
  );
}
