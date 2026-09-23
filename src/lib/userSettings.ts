/**
 * User Settings — cloud-synced where the existing Supabase schema supports it,
 * with local-only training controls layered on top.
 */
import { cloud, deviceId } from '@/integrations/supabase/deviceClient';

export interface UserSettings {
  default_mode: 'tutor' | 'sprint' | 'exam';
  daily_minutes_goal: number;
  weekly_question_target: number;
  target_exam_date: string | null;
  font_size: 'small' | 'normal' | 'large';
  reduce_motion: boolean;
  amber_threshold_seconds: number;
  red_threshold_seconds: number;
  confidence_required: 'off' | 'optional' | 'required';

  // Local-only training controls. Keeping these local avoids breaking older
  // user_settings schemas while still giving the simulator useful flexibility.
  exam_pause_enabled: boolean;
  exam_auto_fullscreen: boolean;
  exam_focus_notice: boolean;
  sprint_question_count: number;
  random_question_count: number;
  pbq_set_size: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  default_mode: 'tutor',
  daily_minutes_goal: 30,
  weekly_question_target: 100,
  target_exam_date: null,
  font_size: 'normal',
  reduce_motion: false,
  amber_threshold_seconds: 1200,
  red_threshold_seconds: 300,
  confidence_required: 'optional',
  exam_pause_enabled: true,
  exam_auto_fullscreen: false,
  exam_focus_notice: true,
  sprint_question_count: 30,
  random_question_count: 50,
  pbq_set_size: 10,
};

const KEY = 'secplus-user-settings';

const CLOUD_KEYS: (keyof UserSettings)[] = [
  'default_mode',
  'daily_minutes_goal',
  'weekly_question_target',
  'target_exam_date',
  'font_size',
  'reduce_motion',
  'amber_threshold_seconds',
  'red_threshold_seconds',
  'confidence_required',
];

export function loadSettingsLocal(): UserSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function fetchSettings(): Promise<UserSettings> {
  const local = loadSettingsLocal();
  try {
    const { data } = await cloud.from('user_settings').select('*').eq('device_id', deviceId).maybeSingle();
    if (data) {
      // Cloud values win for fields the existing schema owns; local-only
      // training controls remain intact.
      const merged = { ...DEFAULT_SETTINGS, ...local, ...data } as UserSettings;
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('[settings] fetch failed, using local', e);
  }
  return local;
}

export async function saveSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const merged = { ...loadSettingsLocal(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(merged));

  const cloudPayload = Object.fromEntries(
    CLOUD_KEYS.map((key) => [key, merged[key]])
  );

  try {
    await cloud.from('user_settings').upsert(
      { device_id: deviceId, ...cloudPayload, updated_at: new Date().toISOString() },
      { onConflict: 'device_id' }
    );
  } catch (e) {
    console.warn('[settings] cloud save failed, kept local', e);
  }
  return merged;
}
