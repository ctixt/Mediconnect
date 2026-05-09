import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { calculateDistanceKm } from '../utils/distance';

export default function MedicineListScreen({ navigation }: any) {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  const [userLatitude, setUserLatitude] = useState<number | null>(null);
  const [userLongitude, setUserLongitude] = useState<number | null>(null);

  const [selectedMedicine, setSelectedMedicine] = useState<any | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState('');
  const [urgency, setUrgency] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');

  useEffect(() => {
    loadRole();
  }, []);

  useEffect(() => {
    if (role) {
      const unsubscribe = loadMedicines();
      return unsubscribe;
    }
  }, [role]);

  const loadRole = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(db, 'users', user.uid));

    if (snap.exists()) {
      const data = snap.data();
      const userRole = String(data.role || '').trim().toLowerCase();

      setRole(userRole);

      if (
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number'
      ) {
        setUserLatitude(data.latitude);
        setUserLongitude(data.longitude);
      }
    }
  };

  const getTimestampMillis = (value: any) => {
    if (value?.toDate) {
      return value.toDate().getTime();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return 0;
  };

  const formatDate = (value: any) => {
    if (!value) return 'No registrada';

    try {
      const date = value?.toDate ? value.toDate() : new Date(value);

      if (isNaN(date.getTime())) return 'No registrada';

      return date.toLocaleDateString();
    } catch (error) {
      return 'No registrada';
    }
  };

  const isRecentMedicine = (medicine: any) => {
    const createdAt = getTimestampMillis(medicine.createdAt);

    if (!createdAt) return false;

    const now = new Date().getTime();
    const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    return diffDays <= 7;
  };

  const loadMedicines = () => {
    const unsubscribe = onSnapshot(collection(db, 'medicines'), (snapshot) => {
      let data: any[] = [];

      snapshot.forEach((docItem) => {
        data.push({ id: docItem.id, ...docItem.data() });
      });

      const userId = auth.currentUser?.uid;

      if (role === 'donante') {
        data = data.filter((item) => item.userId === userId);
      }

      if (role === 'receptor') {
        data = data.filter(
          (item) =>
            item.donationStatus === 'publicado' &&
            Number(item.quantity || 0) > 0
        );
      }

      data.sort((a, b) => {
        const dateA = getTimestampMillis(a.createdAt);
        const dateB = getTimestampMillis(b.createdAt);

        return dateB - dateA;
      });

      setMedicines(data);
    });

    return unsubscribe;
  };

  const getDistanceText = (medicine: any) => {
    if (
      role !== 'receptor' ||
      userLatitude === null ||
      userLongitude === null ||
      typeof medicine.donorLatitude !== 'number' ||
      typeof medicine.donorLongitude !== 'number'
    ) {
      return null;
    }

    const distance = calculateDistanceKm(
      userLatitude,
      userLongitude,
      medicine.donorLatitude,
      medicine.donorLongitude
    );

    return `${distance.toFixed(2)} km`;
  };

  const filteredMedicines = medicines.filter((item) => {
    const search = searchText.trim().toLowerCase();

    if (!search) return true;

    const name = String(item.name || '').toLowerCase();
    const active = String(item.active || '').toLowerCase();
    const lot = String(item.lot || '').toLowerCase();
    const barcode = String(item.barcode || '').toLowerCase();

    return (
      name.includes(search) ||
      active.includes(search) ||
      lot.includes(search) ||
      barcode.includes(search)
    );
  });

  const openRequestForm = (medicine: any) => {
    setSelectedMedicine(medicine);
    setRequestReason('');
    setRequestedQuantity('1');
    setUrgency('');
    setDeliveryInfo('');
  };

  const closeRequestForm = () => {
    setSelectedMedicine(null);
    setRequestReason('');
    setRequestedQuantity('');
    setUrgency('');
    setDeliveryInfo('');
  };

  const sendRequest = async () => {
    if (!selectedMedicine) return;

    const quantityNumber = Number(requestedQuantity);

    if (
      !requestReason.trim() ||
      !requestedQuantity.trim() ||
      !urgency.trim() ||
      !deliveryInfo.trim()
    ) {
      Alert.alert(
        'Campos incompletos',
        'Completa el motivo, cantidad, urgencia y datos de entrega.'
      );
      return;
    }

    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      Alert.alert(
        'Cantidad inválida',
        'La cantidad solicitada debe ser mayor a cero.'
      );
      return;
    }

    if (quantityNumber > Number(selectedMedicine.quantity)) {
      Alert.alert(
        'Cantidad no disponible',
        `Solo hay ${selectedMedicine.quantity} unidad(es) disponibles.`
      );
      return;
    }

    try {
      await addDoc(collection(db, 'requests'), {
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.name,
        medicineActive: selectedMedicine.active,
        medicineExpiration: selectedMedicine.expiration,
        medicineLot: selectedMedicine.lot,
        medicinePhoto: selectedMedicine.medicinePhoto || null,

        requestedQuantity: quantityNumber,
        requestReason: requestReason.trim(),
        urgency: urgency.trim(),
        deliveryInfo: deliveryInfo.trim(),

        donorId: selectedMedicine.userId,
        receiverId: auth.currentUser?.uid,

        approximateDistanceKm:
          selectedMedicine.donorLatitude &&
          selectedMedicine.donorLongitude &&
          userLatitude !== null &&
          userLongitude !== null
            ? calculateDistanceKm(
                userLatitude,
                userLongitude,
                selectedMedicine.donorLatitude,
                selectedMedicine.donorLongitude
              )
            : null,

        status: 'pendiente',
        createdAt: new Date(),
      });

      Alert.alert(
        'Solicitud enviada',
        'Tu solicitud quedó pendiente de revisión.'
      );

      closeRequestForm();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  const deleteMedicine = async (medicineId: string) => {
    Alert.alert(
      'Eliminar medicamento',
      '¿Seguro que deseas eliminar este medicamento? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'medicines', medicineId));
              Alert.alert(
                'Eliminado',
                'El medicamento fue eliminado correctamente.'
              );
            } catch (error) {
              console.log(error);
              Alert.alert('Error', 'No se pudo eliminar el medicamento.');
            }
          },
        },
      ]
    );
  };

  const getHeaderTitle = () => {
    if (role === 'donante') return 'Mis medicamentos publicados';
    if (role === 'receptor') return 'Medicamentos disponibles';
    if (role === 'validador') return 'Medicamentos registrados';
    if (role === 'admin') return 'Inventario general';
    return 'Medicamentos';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getHeaderTitle()}</Text>

      <Text style={styles.subtitle}>
        {role === 'receptor'
          ? 'Revisa los detalles y la distancia aproximada antes de solicitar una donación.'
          : 'Consulta la información registrada en el sistema, ordenada de más reciente a más antigua.'}
      </Text>

      <TextInput
        placeholder="Buscar por nombre, compuesto, lote o código"
        value={searchText}
        onChangeText={setSearchText}
        style={styles.searchInput}
        placeholderTextColor="#789287"
      />

      <FlatList
        data={filteredMedicines}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No hay medicamentos para mostrar.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const distanceText = getDistanceText(item);
          const recent = isRecentMedicine(item);

          return (
            <View style={styles.card}>
              {item.medicinePhoto && (
                <Image source={{ uri: item.medicinePhoto }} style={styles.photo} />
              )}

              <View style={styles.cardHeader}>
                <Text style={styles.medicineName}>{item.name}</Text>

                {recent && (
                  <View style={styles.recentBadge}>
                    <Text style={styles.recentBadgeText}>Reciente</Text>
                  </View>
                )}
              </View>

              <Text style={styles.createdAtText}>
                Registrado: {formatDate(item.createdAt)}
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>Compuesto:</Text>
                <Text style={styles.value}>{item.active}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Miligramos:</Text>
                <Text style={styles.value}>{item.mg}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Lote:</Text>
                <Text style={styles.value}>{item.lot}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Vencimiento:</Text>
                <Text style={styles.value}>{item.expiration}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Cantidad:</Text>
                <Text style={styles.value}>{item.quantity}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Empaque:</Text>
                <Text style={styles.value}>{item.packageStatus}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Código:</Text>
                <Text style={styles.value}>{item.barcode || 'No registrado'}</Text>
              </View>

              {role === 'receptor' && (
                <View style={styles.distanceBox}>
                  <Text style={styles.distanceText}>
                    {distanceText
                      ? `Distancia aproximada: ${distanceText}`
                      : 'Distancia aproximada: no disponible'}
                  </Text>
                </View>
              )}

              <View style={styles.statusBox}>
                <Text style={styles.statusText}>
                  Donación: {item.donationStatus || 'sin estado'}
                </Text>
                <Text style={styles.statusText}>
                  Validación: {item.validationStatus || 'pendiente'}
                </Text>
              </View>

              {role === 'receptor' && (
                <Pressable
                  style={styles.requestButton}
                  onPress={() => openRequestForm(item)}
                >
                  <Text style={styles.requestButtonText}>
                    Solicitar medicamento
                  </Text>
                </Pressable>
              )}

              {role === 'donante' && (
                <>
                  <Text style={styles.ownerNote}>
                    Este medicamento fue publicado por ti.
                  </Text>

                  <Pressable
                    style={styles.editButton}
                    onPress={() =>
                      navigation.navigate('EditMedicine', { medicine: item })
                    }
                  >
                    <Text style={styles.editButtonText}>Editar medicamento</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteMedicine(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>
                      Eliminar medicamento
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          );
        }}
      />

      <Modal visible={!!selectedMedicine} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>Solicitar medicamento</Text>

              {selectedMedicine && (
                <Text style={styles.modalSubtitle}>
                  {selectedMedicine.name} - disponible:{' '}
                  {selectedMedicine.quantity}
                </Text>
              )}

              <TextInput
                placeholder="Motivo de la necesidad"
                value={requestReason}
                onChangeText={setRequestReason}
                style={styles.input}
                placeholderTextColor="#789287"
                multiline
              />

              <TextInput
                placeholder="Cantidad requerida"
                value={requestedQuantity}
                onChangeText={setRequestedQuantity}
                style={styles.input}
                placeholderTextColor="#789287"
                keyboardType="numeric"
              />

              <TextInput
                placeholder="Urgencia. Ej: baja, media, alta"
                value={urgency}
                onChangeText={setUrgency}
                style={styles.input}
                placeholderTextColor="#789287"
              />

              <TextInput
                placeholder="Datos de entrega o contacto"
                value={deliveryInfo}
                onChangeText={setDeliveryInfo}
                style={styles.input}
                placeholderTextColor="#789287"
                multiline
              />

              <Pressable style={styles.requestButton} onPress={sendRequest}>
                <Text style={styles.requestButtonText}>Enviar solicitud</Text>
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={closeRequestForm}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F4',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F4D36',
    marginTop: 12,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#4F6F5D',
    marginBottom: 16,
    lineHeight: 21,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#BFDCC8',
    backgroundColor: '#FAFFFB',
    padding: 12,
    marginBottom: 14,
    borderRadius: 12,
    color: '#1F3D2B',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D8EBDD',
  },
  emptyText: {
    color: '#4F6F5D',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  photo: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#E5F4EA',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  medicineName: {
    flex: 1,
    fontSize: 21,
    fontWeight: '800',
    color: '#1F4D36',
  },
  recentBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  recentBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '900',
  },
  createdAtText: {
    color: '#4F6F5D',
    fontSize: 13,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 6,
  },
  label: {
    fontWeight: '800',
    color: '#24513A',
    width: 105,
  },
  value: {
    flex: 1,
    color: '#375A44',
  },
  distanceBox: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  distanceText: {
    color: '#075985',
    fontWeight: '800',
  },
  statusBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusText: {
    color: '#166534',
    fontWeight: '700',
    marginBottom: 2,
  },
  requestButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
  },
  requestButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  editButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteButton: {
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 15,
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
  ownerNote: {
    color: '#4F6F5D',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F1F8F4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F4D36',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#4F6F5D',
    marginBottom: 14,
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
});