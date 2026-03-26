import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { brand } from '@/constants/Colors';
import { getDailyScanCount, incrementScanCount } from '@/lib/storage';

const FREE_SCAN_LIMIT = 10;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const lastScannedRef = useRef<string>('');

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    const barcode = result.data;
    if (scanned || barcode === lastScannedRef.current) return;

    setScanned(true);
    lastScannedRef.current = barcode;

    const count = await getDailyScanCount();
    if (count >= FREE_SCAN_LIMIT) {
      Alert.alert(
        'Daily Limit Reached',
        'You\'ve used all 10 free scans today. Upgrade to Peel Pro for unlimited scanning.',
        [
          { text: 'Maybe Later', onPress: () => setScanned(false) },
          { text: 'Upgrade', onPress: () => { setScanned(false); /* TODO: paywall */ } },
        ]
      );
      return;
    }

    await incrementScanCount();
    router.push(`/product/${barcode}`);

    // Allow scanning again after navigating back
    setTimeout(() => {
      setScanned(false);
      lastScannedRef.current = '';
    }, 2000);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionEmoji}>Camera</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Peel needs your camera to scan product barcodes and show you what's really inside.
        </Text>
        <Pressable
          testID="grant-camera-button"
          style={({ pressed }) => [styles.permissionButton, pressed && styles.permissionButtonPressed]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>Scan a Product</Text>
            <Pressable
              testID="flash-toggle"
              style={styles.flashButton}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Text style={styles.flashIcon}>{flashOn ? 'ON' : 'OFF'}</Text>
            </Pressable>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

          <View style={styles.bottomHint}>
            <Text style={styles.hintText}>
              {scanned ? 'Processing...' : 'Point at a barcode to scan'}
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 20,
  },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  flashButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  flashIcon: { fontSize: 20 },
  scanArea: {
    width: 260, height: 260, alignSelf: 'center', position: 'relative',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderColor: '#FFFFFF', borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderColor: '#FFFFFF', borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderColor: '#FFFFFF', borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderColor: '#FFFFFF', borderBottomRightRadius: 8,
  },
  bottomHint: {
    alignItems: 'center', paddingBottom: 120,
  },
  hintText: {
    fontSize: 16, color: '#FFFFFF', fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24,
  },
  permissionContainer: {
    flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  permissionEmoji: { fontSize: 64, marginBottom: 24 },
  permissionTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  permissionText: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  permissionButton: { backgroundColor: brand.primary, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 40 },
  permissionButtonPressed: { backgroundColor: brand.primaryDark },
  permissionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
