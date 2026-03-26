import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
          { text: 'Upgrade', onPress: () => { setScanned(false); router.push('/paywall'); } },
        ]
      );
      return;
    }

    await incrementScanCount();
    router.push(`/product/${barcode}`);

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
        <LinearGradient colors={['#F0FDF4', '#FFFFFF']} style={StyleSheet.absoluteFill} />
        <View style={styles.permissionIconWrap}>
          <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={40} color={brand.primary} />
          </LinearGradient>
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Peel needs your camera to scan product barcodes and show you what's really inside.
        </Text>
        <Pressable
          testID="grant-camera-button"
          style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}
          onPress={requestPermission}
        >
          <LinearGradient colors={['#16A34A', '#15803D']} style={styles.permissionButton}>
            <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </LinearGradient>
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
              style={[styles.flashButton, flashOn && styles.flashButtonOn]}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
            {scanned && (
              <View style={styles.scanningOverlay}>
                <View style={styles.scanningDot} />
              </View>
            )}
          </View>

          <View style={styles.bottomHint}>
            <View style={[styles.hintPill, scanned && styles.hintPillActive]}>
              {scanned ? (
                <Ionicons name="hourglass-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="scan-outline" size={16} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.hintText}>
                {scanned ? 'Processing...' : 'Point at a barcode to scan'}
              </Text>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 28;
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  flashButtonOn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  scanArea: {
    width: 270, height: 270, alignSelf: 'center', position: 'relative',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderColor: '#FFFFFF', borderTopLeftRadius: 10,
  },
  cornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderColor: '#FFFFFF', borderTopRightRadius: 10,
  },
  cornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderColor: '#FFFFFF', borderBottomLeftRadius: 10,
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderColor: '#FFFFFF', borderBottomRightRadius: 10,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  scanningDot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#16A34A',
    shadowColor: '#16A34A', shadowOpacity: 0.6, shadowRadius: 12,
  },
  bottomHint: {
    alignItems: 'center', paddingBottom: 120,
  },
  hintPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: 26, backdropFilter: 'blur(10px)',
  },
  hintPillActive: {
    backgroundColor: 'rgba(22,163,74,0.7)',
  },
  hintText: {
    fontSize: 15, color: '#FFFFFF', fontWeight: '600',
  },
  permissionContainer: {
    flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  permissionIconWrap: {
    marginBottom: 28,
    shadowColor: '#16A34A', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  permissionIcon: {
    width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
  },
  permissionTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  permissionText: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  permissionButton: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 36,
    shadowColor: '#16A34A', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  permissionButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
