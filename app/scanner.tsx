import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { t } from '../src/i18n';
import { colors } from '../src/theme';

const PRICE_REGEX = /\b\d{1,3}(?:[. ]\d{3})*(?:[.,]\d{2})?\b/g;

type DetectedPrice = {
  raw: string;
  value: number;
};

function extractPrices(text: string): DetectedPrice[] {
  const matches = [...text.matchAll(PRICE_REGEX)];
  return matches.map((m) => ({
    raw: m[0],
    value: parseFloat(m[0].replace(/\s/g, '').replace(',', '.')),
  }));
}

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [detectedPrices, setDetectedPrices] = useState<DetectedPrice[]>([]);
  const [scanning, setScanning] = useState(false);
  const lastScanTime = useRef(0);

  const handleCapture = useCallback(async () => {
    const now = Date.now();
    if (now - lastScanTime.current < 800 || scanning) return;
    lastScanTime.current = now;
    setScanning(true);
    try {
      const mockText = '19.99 EUR — Café latte 3,50 CHF';
      const prices = extractPrices(mockText).filter((p) => !isNaN(p.value) && p.value > 0);
      setDetectedPrices(prices);
    } catch {
      Alert.alert(t('common.error'));
    } finally {
      setScanning(false);
    }
  }, [scanning]);

  const handleSelectPrice = useCallback((price: DetectedPrice) => {
    router.replace({ pathname: '/(tabs)', params: { scannedPrice: price.value.toString() } });
  }, [router]);

  if (!permission) {
    return <View style={styles.blank} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionSafe}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>{t('scanner.permissionDenied')}</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.allowButton} accessibilityRole="button" accessibilityLabel="Autoriser la caméra">
            <Text style={styles.allowButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
            <Text style={styles.cancelLinkText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" onCameraReady={handleCapture} />

      {/* Viewfinder */}
      <View style={styles.overlay}>
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.hintText}>{t('scanner.hint')}</Text>
      </View>

      {/* Detected prices */}
      {detectedPrices.length > 0 && (
        <View style={styles.pricesContainer}>
          <Text style={styles.detectedLabel}>{t('scanner.detected')}</Text>
          {detectedPrices.map((p) => (
            <TouchableOpacity
              key={p.raw}
              onPress={() => handleSelectPrice(p)}
              style={styles.priceItem}
              accessibilityRole="button"
              accessibilityLabel={`Prix détecté : ${p.raw}. Appuyer pour utiliser.`}
            >
              <Text style={styles.priceRaw}>{p.raw}</Text>
              <View style={styles.confirmBadge}>
                <Text style={styles.confirmText}>{t('scanner.confirm')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bottom controls */}
      <SafeAreaView style={styles.controls} edges={['bottom']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCapture} disabled={scanning} style={[styles.scanButton, scanning && styles.scanButtonDisabled]} accessibilityRole="button" accessibilityLabel="Scanner">
          <Text style={styles.scanText}>{scanning ? 'Analyse…' : '📷 Scanner'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 20;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: colors.bg },
  permissionSafe: { flex: 1, backgroundColor: colors.bg },
  permissionContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  permissionEmoji: { fontSize: 48 },
  permissionTitle: { color: colors.textDark, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  allowButton: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  allowButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  cancelLink: { paddingVertical: 8 },
  cancelLinkText: { color: colors.textMuted, fontWeight: '600' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  viewfinder: { width: 280, height: 160, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: colors.primary },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 4 },
  hintText: { color: '#FFFFFF', textAlign: 'center', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, fontSize: 13, fontWeight: '600', overflow: 'hidden' },
  pricesContainer: { position: 'absolute', bottom: 140, left: 0, right: 0, paddingHorizontal: 20, gap: 8 },
  detectedLabel: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  priceItem: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRaw: { color: colors.textDark, fontWeight: '800', fontSize: 20 },
  confirmBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  confirmText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 16, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, backgroundColor: 'rgba(0,0,0,0.6)' },
  cancelButton: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cancelText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  scanButton: { flex: 2, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary },
  scanButtonDisabled: { opacity: 0.55 },
  scanText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
