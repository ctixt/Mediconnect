import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function DonationQRCodeScreen({ route }: any) {
  const { request } = route.params;

  const qrValue = JSON.stringify({
    requestId: request.id,
    medicineId: request.medicineId,
    medicineName: request.medicineName,
    status: request.status,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Código QR de la solicitud</Text>

      <View style={styles.qrBox}>
        <QRCode value={qrValue} size={220} />
      </View>

      <Text style={styles.text}>Solicitud: {request.id}</Text>
      <Text style={styles.text}>Medicamento: {request.medicineName}</Text>
      <Text style={styles.text}>Estado: {request.status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    marginTop: 6,
  },
});