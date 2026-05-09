import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  Image,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function RequestsScreen({ navigation }: any) {
  const [requests, setRequests] = useState<any[]>([]);
  const [role, setRole] = useState('');

  const [validatorAuthorized, setValidatorAuthorized] = useState(false);
  const [validatorStatus, setValidatorStatus] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [validatorObservation, setValidatorObservation] = useState('');

  useEffect(() => {
    loadRole();
  }, []);

  useEffect(() => {
    if (!role) return;

    const userId = auth.currentUser?.uid;

    if (!userId) return;

    let requestsQuery;

    if (role === 'receptor') {
      requestsQuery = query(
        collection(db, 'requests'),
        where('receiverId', '==', userId)
      );
    } else if (role === 'donante') {
      requestsQuery = query(
        collection(db, 'requests'),
        where('donorId', '==', userId)
      );
    } else {
      requestsQuery = collection(db, 'requests');
    }

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const data: any[] = [];

        snapshot.forEach((docItem) => {
          data.push({ id: docItem.id, ...docItem.data() });
        });

        data.sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : 0;

          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : 0;

          return dateB - dateA;
        });

        setRequests(data);
      },
      (error) => {
        console.log('Error al cargar solicitudes:', error);
        Alert.alert(
          'Error',
          'No se pudieron cargar las solicitudes. Revisa los permisos del usuario.'
        );
      }
    );

    return () => unsubscribe();
  }, [role]);

  const loadRole = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(db, 'users', user.uid));

    if (snap.exists()) {
      const data = snap.data();
      const userRole = String(data.role || '').trim().toLowerCase();

      setRole(userRole);

      if (userRole === 'validador') {
        setValidatorAuthorized(data.validatorAuthorized === true);
        setValidatorStatus(data.validatorStatus || 'pendiente');
      }
    }
  };

  const openObservationModal = (request: any, status: string) => {
    if (
      role === 'validador' &&
      (!validatorAuthorized || validatorStatus !== 'autorizado')
    ) {
      Alert.alert(
        'Acceso no autorizado',
        'Tu cuenta de validador todavía no ha sido autorizada por un administrador.'
      );
      return;
    }

    setSelectedRequest(request);
    setNewStatus(status);
    setValidatorObservation('');
  };

  const closeObservationModal = () => {
    setSelectedRequest(null);
    setNewStatus('');
    setValidatorObservation('');
  };

  const confirmValidation = async () => {
    if (!selectedRequest || !newStatus) return;

    if (
      role === 'validador' &&
      (!validatorAuthorized || validatorStatus !== 'autorizado')
    ) {
      Alert.alert(
        'Acceso no autorizado',
        'No puedes aprobar o rechazar solicitudes porque tu cuenta no está autorizada.'
      );
      closeObservationModal();
      return;
    }

    if (!validatorObservation.trim()) {
      Alert.alert(
        'Observación requerida',
        'Escribe una observación antes de continuar.'
      );
      return;
    }

    try {
      const requestRef = doc(db, 'requests', selectedRequest.id);
      const medicineRef = doc(db, 'medicines', selectedRequest.medicineId);

      if (newStatus === 'aprobado') {
        await runTransaction(db, async (transaction) => {
          const medicineSnap = await transaction.get(medicineRef);

          if (!medicineSnap.exists()) {
            throw new Error('El medicamento ya no existe.');
          }

          const medicineData = medicineSnap.data();
          const currentQuantity = Number(medicineData.quantity || 0);
          const requestedQty = Number(selectedRequest.requestedQuantity || 1);

          if (currentQuantity < requestedQty) {
            throw new Error('No hay suficiente cantidad disponible.');
          }

          const newQuantity = currentQuantity - requestedQty;

          transaction.update(requestRef, {
            status: 'aprobado',
            validatorObservation: validatorObservation.trim(),
            reviewedAt: new Date(),
            reviewedBy: auth.currentUser?.uid,
          });

          transaction.update(medicineRef, {
            quantity: newQuantity,
            validationStatus: 'validado',
            donationStatus: newQuantity <= 0 ? 'agotado' : 'publicado',
            updatedAt: new Date(),
          });
        });
      } else {
        await updateDoc(requestRef, {
          status: 'rechazado',
          validatorObservation: validatorObservation.trim(),
          reviewedAt: new Date(),
          reviewedBy: auth.currentUser?.uid,
        });
      }

      Alert.alert('Listo', `Solicitud ${newStatus}`);
      closeObservationModal();
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo actualizar la solicitud'
      );
    }
  };

  const getTitle = () => {
    if (role === 'receptor') return 'Mis solicitudes';
    if (role === 'validador') return 'Solicitudes por validar';
    if (role === 'donante') return 'Solicitudes de mis donaciones';
    if (role === 'admin') return 'Solicitudes del sistema';
    return 'Solicitudes';
  };

  const canValidateRequests =
    role === 'validador' &&
    validatorAuthorized &&
    validatorStatus === 'autorizado';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>

      <Text style={styles.subtitle}>
        {role === 'validador'
          ? canValidateRequests
            ? 'Revisa la información antes de aprobar o rechazar una solicitud.'
            : 'Tu cuenta de validador está pendiente de autorización.'
          : role === 'admin'
          ? 'Consulta el historial general de solicitudes registradas.'
          : 'Consulta el estado de las solicitudes registradas.'}
      </Text>

      {role === 'validador' && !canValidateRequests && (
        <View style={styles.pendingValidatorBox}>
          <Text style={styles.pendingValidatorTitle}>
            Validador pendiente de autorización
          </Text>
          <Text style={styles.pendingValidatorText}>
            Puedes consultar la pantalla, pero no puedes aprobar ni rechazar
            solicitudes hasta que un administrador certifique tu cuenta.
          </Text>
          <Text style={styles.pendingValidatorStatus}>
            Estado actual: {validatorStatus || 'pendiente'}
          </Text>
        </View>
      )}

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay solicitudes para mostrar.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.medicinePhoto && (
              <Image source={{ uri: item.medicinePhoto }} style={styles.photo} />
            )}

            <Text style={styles.medicineName}>{item.medicineName}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Compuesto:</Text>
              <Text style={styles.value}>
                {item.medicineActive || 'No registrado'}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Lote:</Text>
              <Text style={styles.value}>
                {item.medicineLot || 'No registrado'}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Vence:</Text>
              <Text style={styles.value}>
                {item.medicineExpiration || 'No registrado'}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Cantidad:</Text>
              <Text style={styles.value}>{item.requestedQuantity || 1}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Urgencia:</Text>
              <Text style={styles.value}>{item.urgency || 'No registrada'}</Text>
            </View>

            {typeof item.approximateDistanceKm === 'number' && (
              <View style={styles.distanceBox}>
                <Text style={styles.distanceText}>
                  Distancia aproximada: {item.approximateDistanceKm.toFixed(2)} km
                </Text>
              </View>
            )}

            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Motivo de la necesidad</Text>
              <Text style={styles.detailText}>
                {item.requestReason || 'No registrado'}
              </Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Datos de entrega/contacto</Text>
              <Text style={styles.detailText}>
                {item.deliveryInfo || 'No registrado'}
              </Text>
            </View>

            {item.validatorObservation && (
              <View style={styles.observationBox}>
                <Text style={styles.observationLabel}>
                  Observación del validador
                </Text>
                <Text style={styles.observationText}>
                  {item.validatorObservation}
                </Text>
              </View>
            )}

            <View style={styles.statusBox}>
              <Text style={styles.statusText}>Estado: {item.status}</Text>
            </View>

            {canValidateRequests && item.status === 'pendiente' && (
              <View style={styles.actionBox}>
                <Pressable
                  style={styles.approveButton}
                  onPress={() => openObservationModal(item, 'aprobado')}
                >
                  <Text style={styles.actionButtonText}>Aprobar solicitud</Text>
                </Pressable>

                <Pressable
                  style={styles.rejectButton}
                  onPress={() => openObservationModal(item, 'rechazado')}
                >
                  <Text style={styles.actionButtonText}>Rechazar solicitud</Text>
                </Pressable>
              </View>
            )}

            {role === 'receptor' && item.status === 'aprobado' && (
              <View style={styles.actionBox}>
                <Pressable
                  style={styles.qrButton}
                  onPress={() =>
                    navigation.navigate('DonationQR', { request: item })
                  }
                >
                  <Text style={styles.actionButtonText}>Ver QR para entrega</Text>
                </Pressable>

                <Text style={styles.ownerNote}>
                  Muestra este QR al validador autorizado para confirmar la
                  entrega.
                </Text>
              </View>
            )}

            {role === 'receptor' && item.status === 'entregado' && (
              <Text style={styles.ownerNote}>
                Donación recibida y confirmada correctamente por QR.
              </Text>
            )}

            {role === 'donante' && (
              <Text style={styles.ownerNote}>
                Esta solicitud pertenece a una de tus donaciones.
              </Text>
            )}

            {role === 'admin' && (
              <Text style={styles.ownerNote}>
                Registro visible desde el módulo administrativo.
              </Text>
            )}
          </View>
        )}
      />

      <Modal visible={!!selectedRequest} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {newStatus === 'aprobado'
                  ? 'Aprobar solicitud'
                  : 'Rechazar solicitud'}
              </Text>

              <Text style={styles.modalSubtitle}>
                Medicamento: {selectedRequest?.medicineName}
              </Text>

              <TextInput
                placeholder="Escribe la observación del validador"
                value={validatorObservation}
                onChangeText={setValidatorObservation}
                style={styles.input}
                placeholderTextColor="#789287"
                multiline
              />

              <Pressable
                style={
                  newStatus === 'aprobado'
                    ? styles.approveButton
                    : styles.rejectButton
                }
                onPress={confirmValidation}
              >
                <Text style={styles.actionButtonText}>
                  Confirmar {newStatus}
                </Text>
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={closeObservationModal}>
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
  pendingValidatorBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  pendingValidatorTitle: {
    color: '#854D0E',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 5,
  },
  pendingValidatorText: {
    color: '#713F12',
    lineHeight: 20,
    marginBottom: 8,
  },
  pendingValidatorStatus: {
    color: '#854D0E',
    fontWeight: '900',
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
  medicineName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1F4D36',
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
    width: 100,
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
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  distanceText: {
    color: '#075985',
    fontWeight: '800',
  },
  detailBox: {
    backgroundColor: '#F3FBF6',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CDEAD6',
  },
  detailLabel: {
    color: '#24513A',
    fontWeight: '800',
    marginBottom: 4,
  },
  detailText: {
    color: '#375A44',
    lineHeight: 20,
  },
  observationBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  observationLabel: {
    color: '#854D0E',
    fontWeight: '800',
    marginBottom: 4,
  },
  observationText: {
    color: '#713F12',
    lineHeight: 20,
  },
  statusBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusText: {
    color: '#166534',
    fontWeight: '800',
  },
  actionBox: {
    marginTop: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 14,
    paddingVertical: 13,
  },
  rejectButton: {
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    paddingVertical: 13,
  },
  qrButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 13,
  },
  actionButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  ownerNote: {
    color: '#4F6F5D',
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 20,
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
    minHeight: 95,
    textAlignVertical: 'top',
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
});