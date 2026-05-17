/**
 * Home screen widget (iOS 16+).
 *
 * expo-widget-kit n'est pas encore disponible sur npm.
 * Ce fichier définit la logique de données du widget ;
 * le rendu natif SwiftUI sera ajouté lors du build iOS natif
 * via un target Xcode séparé.
 *
 * Les données transitent par MMKV (app group partagé).
 */
import { createMMKV } from 'react-native-mmkv';
import { formatDurationShort } from '../src/core/formatter';
import type { ConversionEntry } from '../src/types';

const WIDGET_MMKV_KEY = 'widget_recent_conversions';
const WEEKLY_HOURS_KEY = 'widget_weekly_hours';

// Shared storage via iOS App Group
const sharedStorage = createMMKV({
  id: 'timeprice-widget',
  // path must match "group.com.timeprice.widget" entitlement in Xcode
});

export function writeWidgetData(
  recentEntries: ConversionEntry[],
  weeklyHours: number,
): void {
  const last2 = recentEntries.slice(0, 2);
  sharedStorage.set(WIDGET_MMKV_KEY, JSON.stringify(last2));
  sharedStorage.set(WEEKLY_HOURS_KEY, weeklyHours);
  // TODO: call WidgetKit.reloadAllTimelines() once native module is available
}

export function readWidgetData(): {
  entries: ConversionEntry[];
  weeklyHours: number;
} {
  const raw = sharedStorage.getString(WIDGET_MMKV_KEY);
  const entries: ConversionEntry[] = raw ? (JSON.parse(raw) as ConversionEntry[]) : [];
  const weeklyHours = sharedStorage.getNumber(WEEKLY_HOURS_KEY) ?? 35;
  return { entries, weeklyHours };
}

export function getWidgetPayload(entries: ConversionEntry[], weeklyHours: number) {
  if (entries.length === 0) {
    return {
      kind: 'timeprice_widget',
      entries: [],
      placeholder: 'Ouvrez TimePrice pour commencer',
    };
  }

  return {
    kind: 'timeprice_widget',
    entries: entries.slice(0, 2).map((e) => ({
      label: e.label ?? `${e.priceAmount} ${e.priceCurrency}`,
      duration: formatDurationShort(e.durationMinutes, weeklyHours),
      category: e.category,
    })),
  };
}
