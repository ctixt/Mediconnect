import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../config/firebase';

export default function EditMedicineScreen({ route, navigation }: any) {
  const { medicine } = route.params;

  const getInitialDate = () => {
    const savedDate = new Date(medicine.expiration);

    if (isNaN(savedDate.getTime())) {
      return new Date();
    }

    return savedDate;
  };

  const [name, setName] = useState(medicine.name || '');
  const [active, setActive] = useState(medicine.active || '');
  const [mg, setMg] = useState(medicine.mg || '');
  const [lot, setLot] = useState(medicine.lot || '');
  const [expiration, setExpiration] = useState(medicine.expiration || '');
  const [quantity, setQuantity] = useState(String(medicine.quantity || ''));
  const [packageStatus, setPackageStatus] = useState(
    medicine.packageStatus || ''
  );
  const [barcode, setBarcode] = useState(medicine.barcode || '');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getInitialDate());

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      setExpiration(formatDate(date));
    }
  };

  const validateExpirationDate = () => {
    const today = new Date();
    const expDate = new Date(expiration);

    if (!expiration || isNaN(expDate.getTime())) {
      Alert.alert(
        'Fecha inválida',
        'Selecciona una fecha de vencimiento válida.'
      );
      return false;
    }

    const diffDays =
      (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (diffDays <= 30) {
      Alert.alert(
        'Medicamento rechazado',
        'El medicamento está vencido o vence en 30 días o menos.'
      );
      return false;
    }

    return true;
  };

  const updateMedicine = async () => {
    if (
      !name.trim() ||
      !active.trim() ||
      !mg.trim() ||
      !lot.trim() ||
      !expiration.trim() ||
      !quantity.trim() ||
      !packageStatus.trim()
    ) {
      Alert.alert(
        'Campos incompletos',
        'Completa todos los datos obligatorios.'
      );
      return;
    }

    const quantityNumber = Number(quantity);

    if (isNaN(quantityNumber) || quantityNumber < 0) {
      Alert.alert('Cantidad inválida', 'La cantidad debe ser 0 o mayor.');
      return;
    }

    if (!validateExpirationDate()) return;

    try {
      await updateDoc(doc(db, 'medicines', medicine.id), {
        name: name.trim(),
        active: active.trim(),
        mg: mg.trim(),
        lot: lot.trim(),
        expiration: expiration.trim(),
        quantity: quantityNumber,
        packageStatus: packageStatus.trim(),
        barcode: barcode.trim() || null,
        donationStatus: quantityNumber <= 0 ? 'agotado' : 'publicado',
        updatedAt: new Date(),
      });

      Alert.alert(
        'Actualizado',
        'El medicamento fue actualizado correctamente.'
      );
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo actualizar el medicamento.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar medicamento</Text>
      <Text style={styles.subtitle}>
        Actualiza la información del medicamento publicado.
      </Text>

      <View style={styles.card}>
        <TextInput
          placeholder="Nombre del medicamento"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        <TextInput
          placeholder="Compuesto activo"
          value={active}
          onChangeText={setActive}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        <TextInput
          placeholder="Miligramos"
          value={mg}
          onChangeText={setMg}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        <TextInput
          placeholder="Lote"
          value={lot}
          onChangeText={setLot}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        <Pressable
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={expiration ? styles.dateText : styles.datePlaceholder}>
            {expiration || 'Seleccionar fecha de vencimiento'}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <TextInput
          placeholder="Cantidad disponible"
          value={quantity}
          onChangeText={setQuantity}
          style={styles.input}
          keyboardType="numeric"
          placeholderTextColor="#789287"
        />

        <TextInput
          placeholder="Estado del empaque"
          value={packageStatus}
          onChangeText={setPackageStatus}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        <TextInput
          placeholder="Código de barras"
          value={barcode}
          onChangeText={setBarcode}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        <Pressable style={styles.saveButton} onPress={updateMedicine}>
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Regla de seguridad</Text>
        <Text style={styles.infoText}>
          No se permite guardar medicamentos vencidos o que venzan en 30 días o
          menos.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F1F8F4',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F4D36',
    marginTop: 20,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#4F6F5D',
    marginBottom: 18,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BFDCC8',
    backgroundColor: '#FAFFFB',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    color: '#1F3D2B',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#BFDCC8',
    backgroundColor: '#FAFFFB',
    padding: 13,
    marginBottom: 12,
    borderRadius: 12,
  },
  dateText: {
    color: '#1F3D2B',
    fontWeight: '700',
  },
  datePlaceholder: {
    color: '#789287',
  },
  saveButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelButton: {
    backgroundColor: '#E5F4EA',
    borderWidth: 1,
    borderColor: '#BFE3CB',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#2E7D4F',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoTitle: {
    color: '#166534',
    fontWeight: '800',
    marginBottom: 4,
  },
  infoText: {
    color: '#166534',
    lineHeight: 20,
  },
});