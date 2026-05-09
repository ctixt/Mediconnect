import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import * as Location from 'expo-location';
import { auth, db } from '../config/firebase';

export default function DashboardScreen({ navigation }: any) {
  const [role, setRole] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [validatorAuthorized, setValidatorAuthorized] = useState(false);
  const [validatorStatus, setValidatorStatus] = useState<string>('');

  const [pendingAdminAlerts, setPendingAdminAlerts] = useState(0);

  useEffect(() => {
    loadRole();
  }, []);

  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Sesión activa',
        'Para salir de la app, utiliza el botón "Cerrar sesión".',
        [
          {
            text: 'Entendido',
            style: 'cancel',
          },
        ]
      );

      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (role !== 'admin') return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map((docItem) => docItem.data());

      const pendingValidators = users.filter(
        (user: any) =>
          user.role === 'validador' &&
          user.validatorAuthorized !== true &&
          user.validatorStatus === 'pendiente'
      );

      setPendingAdminAlerts(pendingValidators.length);
    });

    return () => unsubscribe();
  }, [role]);

  const loadRole = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        navigation.replace('Login');
        return;
      }

      const snap = await getDoc(doc(db, 'users', user.uid));

      if (!snap.exists()) {
        navigation.replace('RoleSelect');
        return;
      }

      const data = snap.data();
      const userRole = String(data.role || '').trim().toLowerCase();

      setRole(userRole);
      setFullName(data.fullName || '');

      if (userRole === 'validador') {
        setValidatorAuthorized(data.validatorAuthorized === true);
        setValidatorStatus(data.validatorStatus || 'pendiente');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cargar el panel.');
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentLocation = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado.');
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'No se pudo acceder a la ubicación del dispositivo.'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      await updateDoc(doc(db, 'users', user.uid), {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        locationUpdatedAt: new Date(),
      });

      Alert.alert('Ubicación guardada', 'Tu ubicación actual fue registrada.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo guardar la ubicación.');
    }
  };

  const logout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Login');
            } catch (error) {
              console.log(error);
              Alert.alert('Error', 'No se pudo cerrar sesión.');
            }
          },
        },
      ]
    );
  };

  const OptionButton = ({
    title,
    description,
    onPress,
    badgeCount = 0,
  }: {
    title: string;
    description: string;
    onPress: () => void;
    badgeCount?: number;
  }) => (
    <Pressable style={styles.optionButton} onPress={onPress}>
      <View style={styles.optionHeader}>
        <Text style={styles.optionTitle}>{title}</Text>

        {badgeCount > 0 && (
          <View style={styles.badgeAlert}>
            <Text style={styles.badgeAlertText}>{badgeCount}</Text>
          </View>
        )}
      </View>

      <Text style={styles.optionDescription}>{description}</Text>
    </Pressable>
  );

  const renderValidatorOptions = () => {
    if (!validatorAuthorized) {
      return (
        <View style={styles.pendingValidatorBox}>
          <Text style={styles.pendingValidatorTitle}>
            Cuenta pendiente de autorización
          </Text>

          <Text style={styles.pendingValidatorText}>
            Tu perfil de validador fue creado, pero todavía no ha sido
            certificado por un administrador. Cuando sea autorizado, podrás
            aprobar/rechazar solicitudes y escanear códigos QR.
          </Text>

          <Text style={styles.pendingValidatorStatus}>
            Estado actual: {validatorStatus || 'pendiente'}
          </Text>
        </View>
      );
    }

    return (
      <>
        <OptionButton
          title="Revisar solicitudes"
          description="Aprueba o rechaza solicitudes con observaciones de validación."
          onPress={() => navigation.navigate('Requests')}
        />

        <OptionButton
          title="Escanear QR"
          description="Confirma entregas escaneando el código QR de la donación."
          onPress={() => navigation.navigate('QRScanner')}
        />
      </>
    );
  };

  const renderOptions = () => {
    switch (role) {
      case 'donante':
        return (
          <>
            <OptionButton
              title="Registrar medicamento"
              description="Publica una nueva donación con lote, vencimiento, foto y código."
              onPress={() => navigation.navigate('AddMedicine')}
            />

            <OptionButton
              title="Ver mis medicamentos"
              description="Consulta tus medicamentos publicados, edita registros o elimina donaciones propias."
              onPress={() => navigation.navigate('MedicineList')}
            />

            <OptionButton
              title="Solicitudes recibidas"
              description="Revisa quién solicitó tus donaciones y el avance de entrega."
              onPress={() => navigation.navigate('Requests')}
            />
          </>
        );

      case 'receptor':
        return (
          <>
            <OptionButton
              title="Ver medicamentos disponibles"
              description="Busca donaciones publicadas y solicita las que necesitas."
              onPress={() => navigation.navigate('MedicineList')}
            />

            <OptionButton
              title="Mis solicitudes"
              description="Consulta si tus solicitudes están pendientes, aprobadas, rechazadas o entregadas."
              onPress={() => navigation.navigate('Requests')}
            />
          </>
        );

      case 'validador':
        return renderValidatorOptions();

      case 'admin':
        return (
          <>
            <OptionButton
              title="Panel administrativo"
              description={
                pendingAdminAlerts > 0
                  ? `Tienes ${pendingAdminAlerts} validador(es) pendiente(s) de revisión.`
                  : 'Consulta reportes, resultados y estadísticas generales del sistema.'
              }
              badgeCount={pendingAdminAlerts}
              onPress={() => navigation.navigate('AdminDashboard')}
            />

            <OptionButton
              title="Medicamentos registrados"
              description="Revisa el inventario general registrado en la plataforma."
              onPress={() => navigation.navigate('MedicineList')}
            />

            <OptionButton
              title="Solicitudes del sistema"
              description="Consulta el historial de solicitudes, aprobaciones y entregas."
              onPress={() => navigation.navigate('Requests')}
            />
          </>
        );

      default:
        return (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>Rol no definido.</Text>
          </View>
        );
    }
  };

  const getRoleLabel = () => {
    if (role === 'donante') return 'Donante';
    if (role === 'receptor') return 'Receptor';
    if (role === 'validador') {
      return validatorAuthorized ? 'Validador autorizado' : 'Validador pendiente';
    }
    if (role === 'admin') return 'Administrador';
    return 'Usuario';
  };

  const getRoleDescription = () => {
    if (role === 'donante') {
      return 'Registra medicamentos seguros y da seguimiento a tus donaciones.';
    }

    if (role === 'receptor') {
      return 'Busca medicamentos disponibles, solicítalos y confirma su recepción.';
    }

    if (role === 'validador') {
      if (!validatorAuthorized) {
        return 'Tu cuenta de validador está pendiente de certificación por un administrador.';
      }

      return 'Revisa solicitudes, valida seguridad y confirma trazabilidad.';
    }

    if (role === 'admin') {
      if (pendingAdminAlerts > 0) {
        return `Tienes ${pendingAdminAlerts} validador(es) pendiente(s) de autorización.`;
      }

      return 'Supervisa resultados, reportes, usuarios, medicamentos y solicitudes del sistema.';
    }

    return 'Completa tu perfil para continuar.';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando panel...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.appTitle}>MediConnect</Text>

      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextBox}>
            <Text style={styles.greeting}>
              Hola{fullName ? `, ${fullName}` : ''}
            </Text>

            <Text style={styles.roleBadge}>{getRoleLabel()}</Text>
          </View>

          {role === 'admin' && pendingAdminAlerts > 0 && (
            <View style={styles.adminNotificationBadge}>
              <View style={styles.adminNotificationDot} />
              <Text style={styles.adminNotificationText}>
                {pendingAdminAlerts}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.roleDescription}>{getRoleDescription()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Opciones disponibles</Text>

      {renderOptions()}

      <Pressable
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.profileButtonText}>Ver mi perfil</Text>
      </Pressable>

      {role !== 'admin' && (
        <Pressable style={styles.locationButton} onPress={saveCurrentLocation}>
          <Text style={styles.locationButtonText}>
            Guardar mi ubicación actual
          </Text>
        </Pressable>
      )}

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F1F8F4',
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: '#F1F8F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4F6F5D',
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1F4D36',
    marginTop: 20,
    marginBottom: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextBox: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F4D36',
    marginBottom: 10,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontWeight: '800',
    marginBottom: 12,
    overflow: 'hidden',
  },
  roleDescription: {
    color: '#4F6F5D',
    fontSize: 15,
    lineHeight: 21,
  },
  adminNotificationBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 8,
  },
  adminNotificationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    position: 'absolute',
    top: -1,
    right: -1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  adminNotificationText: {
    color: '#991B1B',
    fontWeight: '900',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#24513A',
    marginBottom: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  optionTitle: {
    color: '#1F4D36',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    flex: 1,
  },
  optionDescription: {
    color: '#4F6F5D',
    fontSize: 14,
    lineHeight: 20,
  },
  badgeAlert: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
    marginBottom: 4,
  },
  badgeAlertText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  pendingValidatorBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  pendingValidatorTitle: {
    color: '#854D0E',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  pendingValidatorText: {
    color: '#713F12',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  pendingValidatorStatus: {
    color: '#854D0E',
    fontWeight: '900',
  },
  profileButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    marginTop: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  profileButtonText: {
    color: '#1F4D36',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
  },
  locationButton: {
    backgroundColor: '#A7F3D0',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#34D399',
    marginTop: 0,
    marginBottom: 10,
  },
  locationButtonText: {
    color: '#064E3B',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 28,
  },
  logoutButtonText: {
    color: '#991B1B',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: {
    color: '#92400E',
    fontWeight: '700',
  },
});