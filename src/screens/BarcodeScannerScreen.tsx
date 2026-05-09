import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function BarcodeScannerScreen({ navigation, route }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleScan = ({ data, type }: any) => {
    if (scanned) return;

    setScanned(true);

    Alert.alert(
      'Código detectado',
      `Tipo: ${type}\nCódigo: ${data}`,
      [
        {
          text: 'Usar código',
          onPress: () => {
            if (route.params?.onBarcodeScanned) {
              route.params.onBarcodeScanned(data);
            }

            navigation.goBack();
          },
        },
        {
          text: 'Escanear otra vez',
          onPress: () => setScanned(false),
        },
      ]
    );
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoCross}>+</Text>
          </View>

          <Text style={styles.permissionTitle}>Permiso de cámara</Text>

          <Text style={styles.permissionText}>
            MediConnect necesita acceso a la cámara para escanear códigos de
            barras y registrar medicamentos con mayor precisión.
          </Text>

          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Dar permiso</Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'code93',
            'itf14',
            'codabar',
            'qr',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      <View style={styles.scanFrameWrapper}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      <View style={styles.overlay}>
        <Text style={styles.title}>Escanear código de barras</Text>

        <Text style={styles.subtitle}>
          Coloca el código dentro del recuadro y mantén el teléfono estable.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Este código se guardará en el registro del medicamento para mejorar
            la identificación y trazabilidad.
          </Text>
        </View>

        {scanned && (
          <Pressable
            style={styles.scanAgainButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.scanAgainButtonText}>Escanear otra vez</Text>
          </Pressable>
        )}

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver al formulario</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F1F8F4',
    justifyContent: 'center',
    padding: 22,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#1F4D36',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  logoCross: {
    color: '#FFFFFF',
    fontSize: 50,
    fontWeight: '900',
    marginTop: -4,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F4D36',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    color: '#4F6F5D',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  permissionButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 15,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 10,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#E5F4EA',
    borderRadius: 15,
    paddingVertical: 13,
    width: '100%',
    borderWidth: 1,
    borderColor: '#BFE3CB',
  },
  cancelButtonText: {
    color: '#1F4D36',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  scanFrameWrapper: {
    position: 'absolute',
    top: '27%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanFrame: {
    width: 270,
    height: 170,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.45)',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  corner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderColor: '#A7F3D0',
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 18,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 18,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 18,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 18,
  },
  overlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
    backgroundColor: 'rgba(241, 248, 244, 0.97)',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D8EBDD',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F4D36',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#4F6F5D',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  infoText: {
    color: '#166534',
    lineHeight: 19,
    fontSize: 13,
  },
  scanAgainButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 15,
    paddingVertical: 13,
    marginBottom: 10,
  },
  scanAgainButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#BFE3CB',
  },
  backButtonText: {
    color: '#1F4D36',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
});