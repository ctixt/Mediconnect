import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function QRScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const checkAccess = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        navigation.replace('Login');
        return;
      }

      const snap = await getDoc(doc(db, 'users', user.uid));

      if (!snap.exists()) {
        setAuthorized(false);
        return;
      }

      const data = snap.data();
      const userRole = String(data.role || '').trim().toLowerCase();

      setRole(userRole);

      const isAdmin = userRole === 'admin';

      const isAuthorizedValidator =
        userRole === 'validador' &&
        data.validatorAuthorized === true &&
        data.validatorStatus === 'autorizado';

      setAuthorized(isAdmin || isAuthorizedValidator);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo verificar el acceso al escáner.');
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async ({ data }: any) => {
    if (scanned || !authorized) return;

    setScanned(true);

    try {
      const parsed = JSON.parse(data);
      const requestId = parsed.requestId;

      if (!requestId) {
        Alert.alert('QR inválido', 'El código no contiene una solicitud válida.');
        setScanned(false);
        return;
      }

      await updateDoc(doc(db, 'requests', requestId), {
        status: 'entregado',
        scannedAt: new Date(),
        scannedBy: auth.currentUser?.uid,
        confirmedByRole: role,
      });

      Alert.alert('Entrega confirmada', 'La donación fue confirmada por QR.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'QR inválido o sin permisos para confirmar entrega.');
      setScanned(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Verificando acceso...</Text>
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={styles.deniedContainer}>
        <View style={styles.deniedCard}>
          <Text style={styles.deniedTitle}>Acceso no autorizado</Text>

          <Text style={styles.deniedText}>
            Solo los validadores autorizados por un administrador pueden
            escanear códigos QR y confirmar entregas.
          </Text>

          <Text style={styles.deniedNote}>
            Si tu cuenta aparece como pendiente, espera la certificación del
            administrador.
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Permiso de cámara requerido</Text>

        <Text style={styles.permissionText}>
          Necesitamos acceso a la cámara para escanear el código QR de la
          donación.
        </Text>

        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Dar permiso</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      <View style={styles.overlayBottom}>
        <Text style={styles.scannerTitle}>Escanear QR de entrega</Text>

        <Text style={styles.scannerText}>
          Apunta la cámara al código QR generado para confirmar la recepción de
          la donación.
        </Text>

        {scanned && (
          <Pressable
            style={styles.scanAgainButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.scanAgainButtonText}>Escanear otra vez</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#F1F8F4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  loadingText: {
    marginTop: 8,
    color: '#4F6F5D',
  },
  deniedContainer: {
    flex: 1,
    backgroundColor: '#F1F8F4',
    justifyContent: 'center',
    padding: 22,
  },
  deniedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deniedTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#991B1B',
    marginBottom: 8,
  },
  deniedText: {
    color: '#7F1D1D',
    lineHeight: 21,
    marginBottom: 10,
  },
  deniedNote: {
    color: '#4F6F5D',
    lineHeight: 20,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 15,
    paddingVertical: 14,
  },
  backButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  permissionTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#1F4D36',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    color: '#4F6F5D',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlayBottom: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 28,
    backgroundColor: 'rgba(241, 248, 244, 0.95)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
  },
  scannerTitle: {
    color: '#1F4D36',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 5,
  },
  scannerText: {
    color: '#4F6F5D',
    lineHeight: 20,
    marginBottom: 12,
  },
  scanAgainButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 14,
    paddingVertical: 13,
  },
  scanAgainButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
});