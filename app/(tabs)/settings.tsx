import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Linking,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../src/store/profileStore';
import { useHistoryStore } from '../../src/store/historyStore';
import { usePremium } from '../../src/hooks/usePremium';
import { computeHourlyRate } from '../../src/core/converter';
import { useLocaleStore } from '../../src/store/localeStore';
import { t } from '../../src/i18n';
import { colors } from '../../src/theme';
import type { Locale, SalaryFrequency, UserProfile } from '../../src/types';
import Constants from 'expo-constants';

const GUIDE_URL = 'https://owodalabs.com/guide/owoda-guide-pratique.pdf';

const LOCALES: Array<{ code: Locale; label: string; flag: string }> = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
];

const FREQUENCY_CODES: SalaryFrequency[] = ['hourly', 'daily', 'weekly', 'monthly', 'annual'];

// ── Edit profile modal ───────────────────────────────────────────────────────
type EditModalProps = {
  profile: UserProfile;
  visible: boolean;
  onClose: () => void;
  onSave: (patch: Partial<UserProfile>) => void;
};

function EditProfileModal({ profile, visible, onClose, onSave }: EditModalProps) {
  const [name, setName]       = useState(profile.name);
  const [gross, setGross]     = useState(String(profile.grossSalary));
  const [net, setNet]         = useState(String(profile.netSalary));
  const [freq, setFreq]       = useState<SalaryFrequency>(profile.frequency);
  const [useNet, setUseNet]   = useState(profile.useNetSalary);
  const [hours, setHours]     = useState(String(profile.weeklyHours));

  const handleSave = () => {
    const grossNum = parseFloat(gross.replace(',', '.'));
    const netNum   = parseFloat(net.replace(',', '.'));
    const hoursNum = parseFloat(hours);
    if (!name.trim())             { Alert.alert(t('common.error'), t('validation.profileNameRequired')); return; }
    if (isNaN(grossNum) || grossNum <= 0) { Alert.alert(t('common.error'), t('validation.salaryRequired')); return; }
    onSave({
      name:         name.trim(),
      grossSalary:  grossNum,
      netSalary:    isNaN(netNum) ? grossNum * 0.77 : netNum,
      frequency:    freq,
      useNetSalary: useNet,
      weeklyHours:  isNaN(hoursNum) ? 35 : hoursNum,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={edit.overlay}>
        <View style={edit.sheet}>
          <View style={edit.handle} />
          <Text style={edit.title}>{t('settings.editProfile')}</Text>

          {/* Name */}
          <Text style={edit.label}>{t('settings.profileName')}</Text>
          <TextInput
            style={edit.input}
            value={name}
            onChangeText={setName}
            placeholder={t('onboarding.defaultProfileName')}
            placeholderTextColor={colors.textMuted}
          />

          {/* Gross salary */}
          <Text style={edit.label}>{t('onboarding.grossLabel')}</Text>
          <View style={edit.row}>
            <TextInput
              style={[edit.input, { flex: 1 }]}
              value={gross}
              onChangeText={setGross}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={edit.currency}>{profile.currency}</Text>
          </View>

          {/* Net salary */}
          <Text style={edit.label}>{t('onboarding.netLabel')}</Text>
          <View style={edit.row}>
            <TextInput
              style={[edit.input, { flex: 1 }]}
              value={net}
              onChangeText={setNet}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={edit.currency}>{profile.currency}</Text>
          </View>

          {/* Use net toggle */}
          <View style={edit.toggleRow}>
            <Text style={edit.toggleLabel}>{t('settings.useNet')}</Text>
            <Switch
              value={useNet}
              onValueChange={setUseNet}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Frequency */}
          <Text style={edit.label}>{t('settings.frequency')}</Text>
          <View style={edit.freqGrid}>
            {FREQUENCY_CODES.map((code) => (
              <TouchableOpacity
                key={code}
                onPress={() => setFreq(code)}
                style={[edit.freqChip, freq === code && edit.freqChipActive]}
              >
                <Text style={freq === code ? edit.freqTextActive : edit.freqTextInactive}>
                  {t(`onboarding.frequency.${code}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weekly hours */}
          <Text style={edit.label}>{t('onboarding.weeklyHoursLabel')}</Text>
          <TextInput
            style={edit.input}
            value={hours}
            onChangeText={setHours}
            keyboardType="decimal-pad"
            placeholder="35"
            placeholderTextColor={colors.textMuted}
          />

          {/* Buttons */}
          <View style={edit.buttons}>
            <TouchableOpacity onPress={onClose} style={edit.cancelBtn}>
              <Text style={edit.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={edit.saveBtn}>
              <Text style={edit.saveText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const edit = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(13,31,15,0.45)' },
  sheet:    { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12, maxHeight: '92%' },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  title:    { color: colors.textDark, fontWeight: '800', fontSize: 20, marginBottom: 16 },
  label:    { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input:    { backgroundColor: colors.bg, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, color: colors.textDark, fontSize: 16, fontWeight: '600' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currency: { color: colors.textMid, fontWeight: '700', fontSize: 15, minWidth: 40 },
  toggleRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  toggleLabel: { color: colors.textDark, fontSize: 14, fontWeight: '600' },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  freqChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, backgroundColor: colors.bg, borderColor: colors.border },
  freqChipActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  freqTextActive:   { color: colors.primary, fontSize: 13, fontWeight: '700' },
  freqTextInactive: { color: colors.textMid,  fontSize: 13, fontWeight: '500' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border },
  cancelText: { color: colors.textMid, fontWeight: '700', fontSize: 15 },
  saveBtn:  { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.primary },
  saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});

// ── Main screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const profiles     = useProfileStore((s) => s.profiles);
  const activeId     = useProfileStore((s) => s.activeProfileId);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const deleteProfile = useProfileStore((s) => s.deleteProfile);
  const { canUse, isPremium } = usePremium();
  const clearHistory = useHistoryStore((s) => s.clear);
  const { locale, setLocale } = useLocaleStore();

  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? null;

  const handleDeleteProfile = (id: string) => {
    Alert.alert(t('settings.deleteProfile'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteProfile(id) },
    ]);
  };

  const handleClearHistory = () => {
    Alert.alert(t('settings.deleteHistory') + ' ?', t('settings.irreversible'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: clearHistory },
    ]);
  };

  const handleAddProfile = () => {
    if (!canUse('multi_profile')) {
      router.push('/paywall');
      return;
    }
    router.push('/onboarding');
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const freqLabel = (f: SalaryFrequency) => t(`onboarding.frequency.${f}`);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>OWODA</Text>
          <Text style={styles.brandTagline}>{t('converter.tagline')}</Text>
        </View>
        <Text style={styles.screenTitle}>{t('settings.title')}</Text>

        {/* Profiles */}
        <SectionLabel label={t('settings.profiles')} />
        <View style={styles.card}>
          {profiles.map((p, idx) => (
            <View key={p.id} style={[styles.profileRow, idx < profiles.length - 1 && styles.rowBorder]}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{p.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{p.name}</Text>
                <Text style={styles.profileSub}>
                  {p.grossSalary.toLocaleString()} {p.currency} · {freqLabel(p.frequency)}
                </Text>
                <Text style={styles.profileRate}>
                  ≈ {Math.round(computeHourlyRate(p)).toLocaleString()} {p.currency}/h
                </Text>
              </View>
              {p.id === activeId && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{t('settings.active')}</Text>
                </View>
              )}
              {/* Edit button */}
              <TouchableOpacity
                onPress={() => setEditingProfile(p)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={`${t('settings.editLabel')} ${p.name}`}
              >
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
              {profiles.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleDeleteProfile(p.id)}
                  style={styles.iconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('settings.deleteLabel')} ${p.name}`}
                >
                  <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={handleAddProfile} style={styles.addProfileRow} accessibilityRole="button" accessibilityLabel={t('settings.addProfile')}>
            <Text style={styles.addProfileText}>+ {t('settings.addProfile')}</Text>
            {!canUse('multi_profile') && <Text style={styles.proBadge}>PRO</Text>}
          </TouchableOpacity>
        </View>

        {/* Active profile quick-toggles */}
        {activeProfile && (
          <>
            <SectionLabel label={t('settings.activeOptions')} />
            <View style={styles.card}>
              <RowToggle
                label={t('settings.useNet')}
                value={activeProfile.useNetSalary}
                onToggle={() => updateProfile(activeProfile.id, { useNetSalary: !activeProfile.useNetSalary })}
              />
              <View style={styles.divider} />
              <RowToggle
                label={t('settings.includeCommute')}
                value={activeProfile.includeCommute}
                onToggle={() => updateProfile(activeProfile.id, { includeCommute: !activeProfile.includeCommute })}
              />
            </View>
          </>
        )}

        {/* Language */}
        <SectionLabel label={t('settings.language')} />
        <View style={styles.card}>
          {LOCALES.map((l, idx) => (
            <TouchableOpacity
              key={l.code}
              onPress={() => setLocale(l.code)}
              style={[styles.localeRow, idx < LOCALES.length - 1 && styles.rowBorder]}
              accessibilityRole="radio"
              accessibilityLabel={l.label}
              accessibilityState={{ checked: locale === l.code }}
            >
              <Text style={styles.localeFlag}>{l.flag}</Text>
              <Text style={[styles.localeLabel, locale === l.code && styles.localeLabelActive]}>
                {l.label}
              </Text>
              {locale === l.code && (
                <View style={styles.localeCheck}>
                  <Text style={styles.localeCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Ma bibliothèque */}
        <SectionLabel label={t('settings.library')} />
        {isPremium ? (
          <View style={styles.card}>
            <View style={styles.libraryCard}>
              {/* Left: book icon */}
              <View style={styles.libraryIconWrap}>
                <Text style={styles.libraryIcon}>📘</Text>
              </View>
              {/* Right: info */}
              <View style={styles.libraryInfo}>
                <View style={styles.libraryTitleRow}>
                  <Text style={styles.libraryTitle}>{t('settings.libraryGuideName')}</Text>
                  <View style={styles.libraryBadge}>
                    <Text style={styles.libraryBadgeText}>{t('settings.libraryGuideBadge')}</Text>
                  </View>
                </View>
                <Text style={styles.librarySubtitle}>{t('settings.libraryGuideSubtitle')}</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(GUIDE_URL)}
                  style={styles.libraryButton}
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.libraryDownload')}
                >
                  <Text style={styles.libraryButtonText}>⬇ {t('settings.libraryDownload')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.libraryLockedRow}>
              <Text style={styles.libraryLockedText}>{t('settings.libraryPremiumOnly')}</Text>
              <TouchableOpacity
                onPress={() => router.push('/paywall')}
                style={styles.libraryLockedBtn}
                accessibilityRole="button"
              >
                <Text style={styles.libraryLockedBtnText}>{t('settings.libraryDiscoverPremium')} →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Privacy */}
        <SectionLabel label={t('settings.privacy')} />
        <View style={styles.privacyCard}>
          <Text style={styles.privacyText}>{t('settings.privacyNote')}</Text>
          <Text style={styles.privacySubtext}>{t('settings.noTrackers')}</Text>
        </View>

        {/* Premium */}
        {!isPremium && (
          <TouchableOpacity onPress={() => router.push('/paywall')} style={styles.premiumBanner} accessibilityRole="button">
            <View style={styles.premiumBannerLeft}>
              <Text style={styles.premiumBannerTitle}>Owoda Premium</Text>
              <Text style={styles.premiumBannerSub}>{t('settings.premiumFeatures')}</Text>
            </View>
            <View style={styles.premiumArrowWrap}>
              <Text style={styles.premiumArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Danger */}
        <SectionLabel label={t('settings.dangerZone')} />
        <View style={styles.card}>
          <TouchableOpacity onPress={handleClearHistory} style={styles.dangerRow} accessibilityRole="button">
            <Text style={styles.dangerText}>{t('settings.deleteHistory')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>{t('settings.version')} {version} · Owoda</Text>
      </ScrollView>

      {/* Edit profile modal */}
      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          visible={editingProfile !== null}
          onClose={() => setEditingProfile(null)}
          onSave={(patch) => updateProfile(editingProfile.id, patch)}
        />
      )}
    </SafeAreaView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function RowToggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 16, paddingBottom: 60 },
  brandRow: { marginBottom: 4 },
  brandName: { fontSize: 13, fontWeight: '900', color: colors.primary, letterSpacing: 3 },
  brandTagline: { fontSize: 10, color: colors.accent, fontWeight: '600', letterSpacing: 0.3, marginTop: 1 },
  screenTitle: { color: colors.textDark, fontSize: 26, fontWeight: '800', marginBottom: 20, marginTop: 8 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.divider, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  profileAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  profileInfo: { flex: 1 },
  profileName: { color: colors.textDark, fontWeight: '700', fontSize: 14 },
  profileSub: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  profileRate: { color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  activeBadge: { backgroundColor: colors.primaryTint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.primary + '40' },
  activeBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  iconBtn: { padding: 4 },
  editIcon: { fontSize: 16 },
  deleteIcon: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  addProfileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.divider },
  addProfileText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  proBadge: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14 },
  toggleLabel: { color: colors.textDark, flex: 1, marginRight: 16, fontSize: 14 },
  localeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  localeFlag: { fontSize: 20 },
  localeLabel: { flex: 1, color: colors.textDark, fontSize: 15, fontWeight: '500' },
  localeLabelActive: { color: colors.primary, fontWeight: '700' },
  localeCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  localeCheckText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  privacyCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.divider },
  privacyText: { color: colors.textMid, fontSize: 13, lineHeight: 20 },
  privacySubtext: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  premiumBanner: { backgroundColor: colors.primary, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumBannerLeft: { flex: 1 },
  premiumBannerTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  premiumBannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 },
  premiumArrowWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  premiumArrow: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  dangerRow: { paddingHorizontal: 14, paddingVertical: 14 },
  dangerText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  versionText: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 },

  // Library
  libraryCard: { flexDirection: 'row', padding: 14, gap: 14, alignItems: 'flex-start' },
  libraryIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#E8F4FD',
    alignItems: 'center', justifyContent: 'center',
  },
  libraryIcon: { fontSize: 26, lineHeight: 32 },
  libraryInfo: { flex: 1 },
  libraryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  libraryTitle: { color: colors.textDark, fontWeight: '800', fontSize: 14, flex: 1 },
  libraryBadge: {
    backgroundColor: colors.primaryTint,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  libraryBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  librarySubtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginBottom: 12 },
  libraryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  libraryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  libraryLockedRow: { padding: 16, alignItems: 'center', gap: 12 },
  libraryLockedText: { color: colors.textMid, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  libraryLockedBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  libraryLockedBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
