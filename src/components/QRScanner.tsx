import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
}

export default function QRScanner({ visible, onClose, onCodeScanned }: QRScannerProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    const inviteCode = data.trim().toUpperCase();
    
    if (/^[A-Z0-9]{6}$/.test(inviteCode)) {
      onCodeScanned(inviteCode);
      onClose();
      return;
    }
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.code && typeof parsed.code === 'string') {
        onCodeScanned(parsed.code.trim().toUpperCase());
        onClose();
        return;
      }
    } catch (e) {
      // Fallback to raw text
    }
    
    onCodeScanned(inviteCode);
    onClose();
  };

  const resetScanner = () => {
    setScanned(false);
  };

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Scanner QR</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.centerContent}>
            <Text style={[styles.message, { color: colors.text }]}>
              Demande d'autorisation pour la caméra...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Scanner QR</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.centerContent}>
            <Ionicons name="camera-off" size={64} color={colors.textSecondary} />
            <Text style={[styles.message, { color: colors.text }]}>
              Accès à la caméra refusé
            </Text>
            <Text style={[styles.subMessage, { color: colors.textSecondary }]}>
              Veuillez autoriser l'accès à la caméra dans les paramètres pour scanner des QR codes
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              style={[styles.button, { backgroundColor: '#1a73e8' }]}
            >
              <Text style={styles.buttonText}>Autoriser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, { backgroundColor: colors.textSecondary }]}
            >
              <Text style={styles.buttonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Scanner QR</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.scanner}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft, { borderColor: '#1a73e8' }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: '#1a73e8' }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: '#1a73e8' }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: '#1a73e8' }]} />
            </View>
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={[styles.instructionText, { color: colors.text }]}>
            Placez le QR code dans le cadre pour le scanner
          </Text>
          {scanned && (
            <TouchableOpacity
              onPress={resetScanner}
              style={[styles.button, { backgroundColor: '#1a73e8' }]}
            >
              <Text style={styles.buttonText}>Scanner à nouveau</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        paddingTop: 34,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});