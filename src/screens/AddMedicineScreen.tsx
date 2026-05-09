import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from '../config/firebase';

export default function AddMedicineScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [active, setActive] = useState('');
  const [mg, setMg] = useState('');
  const [lot, setLot] = useState('');
  const [expiration, setExpiration] = useState('');
  const [quantity, setQuantity] = useState('');
  const [packageStatus, setPackageStatus] = useState('');
  const [barcode, setBarcode] = useState('');
  const [medicinePhoto, setMedicinePhoto] = useState<string | null>(null);

  const [role, setRole] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(db, 'users', user.uid));

    if (snap.exists()) {
      const userRole = String(snap.data().role || '').trim().toLowerCase();
      setRole(userRole);

      if (userRole !== 'donante') {
        Alert.alert(
          'Acceso denegado',
          'No tienes permiso para registrar medicamentos'
        );
      }
    }
  };

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

  const openBarcodeScanner = () => {
    navigation.navigate('BarcodeScanner', {
      onBarcodeScanned: (code: string) => {
        setBarcode(code);
      },
    });
  };

  const takeMedicinePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos permiso para usar la cámara.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setMedicinePhoto(result.assets[0].uri);
    }
  };

  const saveMedicine = async () => {
    if (role !== 'donante') {
      Alert.alert('Error', 'No autorizado');
      return;
    }

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
        'Completa todos los datos obligatorios del medicamento.'
      );
      return;
    }

    const quantityNumber = Number(quantity);

    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      Alert.alert('Cantidad inválida', 'La cantidad debe ser mayor a cero.');
      return;
    }

    if (!validateExpirationDate()) return;

    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado.');
        return;
      }

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      await addDoc(collection(db, 'medicines'), {
        name: name.trim(),
        active: active.trim(),
        mg: mg.trim(),
        lot: lot.trim(),
        expiration: expiration.trim(),
        quantity: quantityNumber,
        packageStatus: packageStatus.trim(),
        barcode: barcode.trim() || null,
        medicinePhoto: medicinePhoto || null,

        donorLatitude:
          typeof userData.latitude === 'number' ? userData.latitude : null,
        donorLongitude:
          typeof userData.longitude === 'number' ? userData.longitude : null,
        donorLocationUpdatedAt: userData.locationUpdatedAt || null,

        donationStatus: 'publicado',
        validationStatus: 'pendiente',
        userId: user.uid,
        createdAt: new Date(),
      });

      Alert.alert('Éxito', 'Medicamento publicado correctamente');

      setName('');
      setActive('');
      setMg('');
      setLot('');
      setExpiration('');
      setQuantity('');
      setPackageStatus('');
      setBarcode('');
      setMedicinePhoto(null);
      setSelectedDate(new Date());
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo guardar el medicamento');
    }
  };

  if (role && role !== 'donante') {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>No autorizado</Text>
        <Text style={styles.deniedText}>
          Solo los donantes pueden registrar medicamentos.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar medicamento</Text>
      <Text style={styles.subtitle}>
        Ingresa los datos del medicamento disponible para donación.
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
          placeholder="Miligramos. Ej: 500mg"
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
          placeholder="Estado del empaque. Ej: sellado, buen estado"
          value={packageStatus}
          onChangeText={setPackageStatus}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        <Pressable style={styles.secondaryButton} onPress={openBarcodeScanner}>
          <Text style={styles.secondaryButtonText}>
            Escanear código de barras
          </Text>
        </Pressable>

        <TextInput
          placeholder="Código de barras"
          value={barcode}
          onChangeText={setBarcode}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        <Pressable style={styles.secondaryButton} onPress={takeMedicinePhoto}>
          <Text style={styles.secondaryButtonText}>
            Tomar foto del empaque
          </Text>
        </Pressable>

        {medicinePhoto && (
          <Image source={{ uri: medicinePhoto }} style={styles.photoPreview} />
        )}

        <Pressable style={styles.saveButton} onPress={saveMedicine}>
          <Text style={styles.saveButtonText}>Publicar donación</Text>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Regla de seguridad</Text>
        <Text style={styles.infoText}>
          El sistema rechazará medicamentos vencidos o que venzan en 30 días o
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
  secondaryButton: {
    backgroundColor: '#E5F4EA',
    borderWidth: 1,
    borderColor: '#BFE3CB',
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#2E7D4F',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#E5F4EA',
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
  center: {
    flex: 1,
    backgroundColor: '#F1F8F4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 8,
  },
  deniedText: {
    fontSize: 15,
    color: '#7F1D1D',
    textAlign: 'center',
  },
});