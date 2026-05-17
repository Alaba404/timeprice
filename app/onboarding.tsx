import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { nanoid } from 'nanoid/non-secure';
import { useProfileStore } from '../src/store/profileStore';
import { t } from '../src/i18n';
import { colors } from '../src/theme';
import { ALL_CURRENCIES } from '../src/core/currencies';
import type { SalaryFrequency, UserProfile } from '../src/types';

// ─── Validation schemas ───────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().trim().min(1),
  currency: z.string().min(3).max(3),
});

const step2Schema = z.object({
  grossSalary: z.coerce.number().positive(),
  netSalary: z.coerce.number().positive(),
  frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'annual']),
  useNetSalary: z.boolean(),
});

const step3Schema = z.object({
  weeklyHours: z.coerce.number().min(1).max(168),
  paidVacationDays: z.coerce.number().min(0).max(365),
  includeCommute: z.boolean(),
  commuteDailyMinutes: z.coerce.number().min(0).max(1440),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const FREQUENCIES: SalaryFrequency[] = ['hourly', 'daily', 'weekly', 'monthly', 'annual'];

// Featured currencies shown on step 1
const FEATURED_CURRENCIES = ['XOF', 'XAF', 'EUR', 'USD', 'GBP', 'MAD', 'GNF', 'CAD'];
const ONBOARDING_CURRENCIES = ALL_CURRENCIES.filter((c) =>
  FEATURED_CURRENCIES.includes(c.code)
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.bg },
  safeArea:      { flex: 1, backgroundColor: colors.bg },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },

  // Progress bar
  progressTrack: { height: 4, backgroundColor: colors.border },
  progressFill:  { height: 4, backgroundColor: colors.primary },

  // Logo / brand strip
  brandRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8 },
  brandDot:   { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandDotText: { fontSize: 18 },
  brandName:  { fontSize: 22, fontWeight: '800', color: colors.textDark, letterSpacing: -0.5 },

  // Step dots
  stepsRow:  { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, height: 8, borderRadius: 4, backgroundColor: colors.primary },

  // Typography
  heading:    { fontSize: 26, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  subheading: { fontSize: 15, color: colors.textMuted, marginBottom: 28, lineHeight: 22 },
  label:      { fontSize: 14, fontWeight: '600', color: colors.textMid, marginBottom: 6 },
  errorText:  { fontSize: 13, color: colors.danger, marginTop: 4, marginBottom: 4 },

  // Currency row
  currencyRow:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 10 },
  currencyRowSelected: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryTint, marginBottom: 10 },
  currencyFlag:        { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  currencyFlagSel:     { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '30', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  currencyFlagText:    { fontSize: 22 },
  currencyCode:        { fontSize: 15, fontWeight: '700', color: colors.textDark },
  currencyLabel:       { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  currencyBadge:       { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 1 },
  currencyCheck:       { marginLeft: 'auto', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  currencyCheckText:   { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  // Input
  textInput: { backgroundColor: colors.card, color: colors.textDark, fontSize: 18, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border },

  // Gross / Net toggle
  toggleContainer: { flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  toggleBtn:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  toggleBtnActive: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12 },
  toggleText:      { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  toggleTextActive:{ fontSize: 15, fontWeight: '600', color: '#ffffff' },

  // Frequency chips
  chipsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  chipActive:    { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primary },
  chipText:      { fontSize: 14, color: colors.textMid },
  chipTextActive:{ fontSize: 14, color: '#ffffff', fontWeight: '600' },

  // Switch row
  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, marginTop: 8 },
  switchLabel: { fontSize: 15, color: colors.textMid, flex: 1, marginRight: 12 },

  // Tagline accroche (step 1)
  tagline: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#00A86B',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  taglineSep: {
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.55,
    marginBottom: 24,
    marginHorizontal: 4,
  },

  // Buttons
  btnPrimary:     { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnSecondary:   { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryFull: { flex: 1, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText:   { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  btnSecondaryText: { color: colors.textMid, fontSize: 16, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const addProfile = useProfileStore((s) => s.addProfile);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({ name: '', currency: 'XOF' });
  const [step2Data, setStep2Data] = useState<Step2Data>({
    grossSalary: 0,
    netSalary: 0,
    frequency: 'monthly',
    useNetSalary: false,
  });

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { name: '', currency: 'XOF' } });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: step2Data });
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { weeklyHours: 40, paidVacationDays: 21, includeCommute: false, commuteDailyMinutes: 0 },
  });

  const goToStep2 = form1.handleSubmit((data) => { setStep1Data(data); setStep(2); });
  const goToStep3 = form2.handleSubmit((data) => { setStep2Data(data); setStep(3); });

  const finish = form3.handleSubmit(async (data) => {
    const profile: UserProfile = {
      id: nanoid(),
      name: step1Data.name.trim(),
      grossSalary: step2Data.grossSalary,
      netSalary: step2Data.netSalary,
      frequency: step2Data.frequency,
      currency: step1Data.currency,
      weeklyHours: data.weeklyHours,
      paidVacationDays: data.paidVacationDays,
      includeCommute: data.includeCommute,
      commuteDailyMinutes: data.commuteDailyMinutes,
      useNetSalary: step2Data.useNetSalary,
      createdAt: Date.now(),
      isDefault: true,
    };
    await addProfile(profile);
    router.replace('/(tabs)');
  });

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={s.brandRow}>
            <View style={s.brandDot}>
              <Text style={s.brandDotText}>⏱</Text>
            </View>
            <Text style={s.brandName}>Owoda</Text>
          </View>

          {/* Step dots */}
          <View style={s.stepsRow}>
            {([1, 2, 3] as const).map((n) => (
              <View key={n} style={step === n ? s.dotActive : s.dot} />
            ))}
          </View>

          {/* ── STEP 1: Devise ── */}
          {step === 1 && (
            <View>
              {/* Tagline d'accroche */}
              <Text style={s.tagline}>{t('onboarding.tagline')}</Text>
              <View style={s.taglineSep} />

              <Text style={s.heading}>{t('onboarding.step1Title')}</Text>
              <Text style={s.subheading}>{t('onboarding.step1Subtitle')}</Text>

              {/* Nom du profil */}
              <Text style={s.label}>{t('onboarding.nameLabel')}</Text>
              <Controller
                control={form1.control}
                name="name"
                render={({ field, fieldState }) => (
                  <>
                    <TextInput
                      style={[s.textInput, fieldState.error && { borderColor: colors.danger }]}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t('onboarding.namePlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      maxLength={30}
                      returnKeyType="done"
                      autoCapitalize="words"
                    />
                    {fieldState.error && (
                      <Text style={s.errorText}>{t('common.required')}</Text>
                    )}
                  </>
                )}
              />

              {/* Devise */}
              <Text style={[s.label, { marginTop: 20 }]}>{t('onboarding.step1Subtitle')}</Text>
              <Controller
                control={form1.control}
                name="currency"
                render={({ field }) => (
                  <View>
                    {ONBOARDING_CURRENCIES.map((c) => {
                      const selected = field.value === c.code;
                      return (
                        <TouchableOpacity
                          key={c.code}
                          onPress={() => field.onChange(c.code)}
                          style={selected ? s.currencyRowSelected : s.currencyRow}
                          activeOpacity={0.7}
                          accessibilityRole="radio"
                          accessibilityLabel={c.nameFr}
                          accessibilityState={{ checked: selected }}
                        >
                          <View style={selected ? s.currencyFlagSel : s.currencyFlag}>
                            <Text style={s.currencyFlagText}>{c.flag}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.currencyCode}>{c.code}{c.badge ? ` · ${c.badge}` : ''}</Text>
                            <Text style={s.currencyLabel}>{c.nameFr}</Text>
                          </View>
                          {selected && (
                            <View style={s.currencyCheck}>
                              <Text style={s.currencyCheckText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />

              <TouchableOpacity
                onPress={goToStep2}
                style={s.btnPrimary}
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.next')}
              >
                <Text style={s.btnPrimaryText}>{t('onboarding.next')} →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Salaire ── */}
          {step === 2 && (
            <View>
              <Text style={s.heading}>{t('onboarding.step2Title')}</Text>
              <Text style={s.subheading}>{t('onboarding.step2Subtitle')}</Text>

              {/* Net / Brut toggle */}
              <Controller
                control={form2.control}
                name="useNetSalary"
                render={({ field }) => (
                  <View style={s.toggleContainer}>
                    {(['grossLabel', 'netLabel'] as const).map((key, i) => {
                      const active = field.value === (i === 1);
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => field.onChange(i === 1)}
                          style={active ? s.toggleBtnActive : s.toggleBtn}
                          accessibilityRole="tab"
                          accessibilityLabel={t(`onboarding.${key}`)}
                        >
                          <Text style={active ? s.toggleTextActive : s.toggleText}>
                            {t(`onboarding.${key}`)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />

              {/* Salaire brut */}
              <Text style={s.label}>{t('onboarding.grossLabel')} ({step1Data.currency})</Text>
              <Controller
                control={form2.control}
                name="grossSalary"
                render={({ field, fieldState }) => (
                  <>
                    <TextInput
                      style={[s.textInput, fieldState.error && { borderColor: colors.danger }]}
                      keyboardType="decimal-pad"
                      value={field.value === 0 ? '' : String(field.value)}
                      onChangeText={field.onChange}
                      placeholder="0"
                      placeholderTextColor={colors.border}
                    />
                    {fieldState.error && (
                      <Text style={s.errorText}>{t('validation.salaryRequired')}</Text>
                    )}
                  </>
                )}
              />

              {/* Salaire net */}
              <Text style={[s.label, { marginTop: 16 }]}>{t('onboarding.netLabel')} ({step1Data.currency})</Text>
              <Controller
                control={form2.control}
                name="netSalary"
                render={({ field, fieldState }) => (
                  <>
                    <TextInput
                      style={[s.textInput, fieldState.error && { borderColor: colors.danger }]}
                      keyboardType="decimal-pad"
                      value={field.value === 0 ? '' : String(field.value)}
                      onChangeText={field.onChange}
                      placeholder="0"
                      placeholderTextColor={colors.border}
                    />
                    {fieldState.error && (
                      <Text style={s.errorText}>{t('validation.netSalaryRequired')}</Text>
                    )}
                  </>
                )}
              />

              {/* Fréquence */}
              <Text style={[s.label, { marginTop: 20 }]}>{t('onboarding.frequencyLabel')}</Text>
              <Controller
                control={form2.control}
                name="frequency"
                render={({ field }) => (
                  <View style={s.chipsRow}>
                    {FREQUENCIES.map((f) => {
                      const active = field.value === f;
                      return (
                        <TouchableOpacity
                          key={f}
                          onPress={() => field.onChange(f)}
                          style={active ? s.chipActive : s.chip}
                          accessibilityRole="radio"
                          accessibilityLabel={t(`onboarding.frequency.${f}`)}
                          accessibilityState={{ checked: active }}
                        >
                          <Text style={active ? s.chipTextActive : s.chipText}>
                            {t(`onboarding.frequency.${f}`)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />

              <View style={s.btnRow}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={s.btnSecondary}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back')}
                >
                  <Text style={s.btnSecondaryText}>← {t('common.back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goToStep3}
                  style={s.btnPrimaryFull}
                  accessibilityRole="button"
                  accessibilityLabel={t('onboarding.next')}
                >
                  <Text style={s.btnPrimaryText}>{t('onboarding.next')} →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 3: Options avancées ── */}
          {step === 3 && (
            <View>
              <Text style={s.heading}>{t('onboarding.step3Title')}</Text>
              <Text style={s.subheading}>{t('onboarding.step3Subtitle')}</Text>

              {/* Heures / semaine */}
              <Text style={s.label}>{t('onboarding.weeklyHoursLabel')}</Text>
              <Controller
                control={form3.control}
                name="weeklyHours"
                render={({ field, fieldState }) => (
                  <>
                    <TextInput
                      style={[s.textInput, fieldState.error && { borderColor: colors.danger }]}
                      keyboardType="number-pad"
                      value={String(field.value)}
                      onChangeText={field.onChange}
                      accessibilityLabel={t('onboarding.weeklyHoursLabel')}
                    />
                    {fieldState.error && (
                      <Text style={s.errorText}>{t('validation.weeklyHoursRange')}</Text>
                    )}
                  </>
                )}
              />

              {/* Jours de congés */}
              <Text style={[s.label, { marginTop: 16 }]}>{t('onboarding.vacationDaysLabel')}</Text>
              <Controller
                control={form3.control}
                name="paidVacationDays"
                render={({ field }) => (
                  <TextInput
                    style={s.textInput}
                    keyboardType="number-pad"
                    value={String(field.value)}
                    onChangeText={field.onChange}
                    accessibilityLabel={t('onboarding.vacationDaysLabel')}
                  />
                )}
              />

              {/* Inclure le trajet */}
              <Controller
                control={form3.control}
                name="includeCommute"
                render={({ field }) => (
                  <View style={s.switchRow}>
                    <Text style={s.switchLabel}>{t('onboarding.includeCommuteLabel')}</Text>
                    <Switch
                      value={field.value}
                      onValueChange={field.onChange}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#ffffff"
                      accessibilityLabel={t('onboarding.includeCommuteLabel')}
                    />
                  </View>
                )}
              />

              {/* Minutes de trajet (conditionnel) */}
              <Controller
                control={form3.control}
                name="includeCommute"
                render={({ field: commuteField }) =>
                  commuteField.value ? (
                    <>
                      <Text style={[s.label, { marginTop: 16 }]}>{t('onboarding.commuteDailyLabel')}</Text>
                      <Controller
                        control={form3.control}
                        name="commuteDailyMinutes"
                        render={({ field }) => (
                          <TextInput
                            style={s.textInput}
                            keyboardType="number-pad"
                            value={String(field.value)}
                            onChangeText={field.onChange}
                            accessibilityLabel={t('onboarding.commuteDailyLabel')}
                          />
                        )}
                      />
                    </>
                  ) : null
                }
              />

              <View style={s.btnRow}>
                <TouchableOpacity
                  onPress={() => setStep(2)}
                  style={s.btnSecondary}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back')}
                >
                  <Text style={s.btnSecondaryText}>← {t('common.back')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={finish}
                  style={s.btnPrimaryFull}
                  accessibilityRole="button"
                  accessibilityLabel={t('onboarding.finish')}
                >
                  <Text style={s.btnPrimaryText}>{t('onboarding.finish')} ✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
