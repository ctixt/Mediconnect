import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

type UserRole = 'donante' | 'receptor' | 'validador' | '';

export default function RoleSelectScreen({ navigation }: any) {
  const [role, setRole] = useState<UserRole>('');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [donorType, setDonorType] = useState('');
  const [receiverType, setReceiverType] = useState('');
  const [medicalNeed, setMedicalNeed] = useState('');

  const [validatorType, setValidatorType] = useState('');
  const [institution, setInstitution] = useState('');

  const saveProfile = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado');
        return;
      }

      if (!role || !fullName.trim() || !phone.trim() || !location.trim()) {
        Alert.alert(
          'Campos incompletos',
          'Completa el rol, nombre, teléfono/contacto y ubicación aproximada.'
        );
        return;
      }

      if (role === 'donante' && !donorType) {
        Alert.alert('Campo incompleto', 'Selecciona el tipo de donante.');
        return;
      }

      if (role === 'receptor' && (!receiverType || !medicalNeed.trim())) {
        Alert.alert(
          'Campos incompletos',
          'Completa el tipo de receptor y la necesidad médica.'
        );
        return;
      }

      if (role === 'validador' && (!validatorType || !institution.trim())) {
        Alert.alert(
          'Campos incompletos',
          'Completa el tipo de validador y la institución.'
        );
        return;
      }

      setLoading(true);

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role,
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),

        donorType: role === 'donante' ? donorType : null,

        receiverType: role === 'receptor' ? receiverType : null,
        medicalNeed: role === 'receptor' ? medicalNeed.trim() : null,

        validatorType: role === 'validador' ? validatorType : null,
        institution: role === 'validador' ? institution.trim() : null,

        validatorAuthorized: role === 'validador' ? false : null,
        validatorStatus: role === 'validador' ? 'pendiente' : null,
        validatorAuthorizedAt: null,
        validatorAuthorizedBy: null,

        profileImage: null,
        createdAt: new Date(),
      });

      if (role === 'validador') {
        Alert.alert(
          'Perfil creado',
          'Tu perfil fue guardado correctamente. Tu cuenta de validador quedará pendiente hasta que un administrador la autorice.'
        );
      } else {
        Alert.alert('Perfil creado', 'Tu perfil fue guardado correctamente.');
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);

    setDonorType('');
    setReceiverType('');
    setMedicalNeed('');
    setValidatorType('');
    setInstitution('');
  };

  const RoleCard = ({
    title,
    description,
    value,
  }: {
    title: string;
    description: string;
    value: UserRole;
  }) => (
    <Pressable
      style={[styles.roleCard, role === value && styles.roleCardActive]}
      onPress={() => selectRole(value)}
    >
      <Text
        style={[
          styles.roleCardTitle,
          role === value && styles.roleCardTitleActive,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.roleCardDescription,
          role === value && styles.roleCardDescriptionActive,
        ]}
      >
        {description}
      </Text>
    </Pressable>
  );

  const SmallOptionButton = ({
    title,
    selected,
    onPress,
  }: {
    title: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      style={[styles.smallButton, selected && styles.smallButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.smallButtonText,
          selected && styles.smallButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );

  const getRoleLabel = () => {
    if (role === 'donante') return 'Donante';
    if (role === 'receptor') return 'Receptor';
    if (role === 'validador') return 'Validador pendiente de autorización';
    return '';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoCross}>+</Text>
        </View>

        <Text style={styles.title}>Crear perfil</Text>

        <Text style={styles.subtitle}>
          Selecciona tu rol y completa los datos necesarios para usar
          MediConnect.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Selecciona tu rol</Text>

        <RoleCard
          title="Donante"
          value="donante"
          description="Persona o farmacia que desea donar medicamentos en buen estado."
        />

        <RoleCard
          title="Receptor"
          value="receptor"
          description="Paciente, ONG o centro de salud que necesita solicitar medicamentos."
        />

        <RoleCard
          title="Validador"
          value="validador"
          description="Personal autorizado que revisará solicitudes y verificará la trazabilidad."
        />

        <View style={styles.adminNotice}>
          <Text style={styles.adminNoticeTitle}>Rol administrador</Text>
          <Text style={styles.adminNoticeText}>
            El rol administrador no puede seleccionarse desde esta pantalla. Se
            asigna manualmente por seguridad.
          </Text>
        </View>
      </View>

      {role !== '' && (
        <View style={styles.card}>
          <Text style={styles.badge}>Rol seleccionado: {getRoleLabel()}</Text>

          <Text style={styles.sectionTitle}>Datos generales</Text>

          <TextInput
            placeholder="Nombre completo"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            placeholderTextColor="#789287"
          />

          <TextInput
            placeholder="Teléfono o contacto"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
            placeholderTextColor="#789287"
          />

          <TextInput
            placeholder="Ubicación aproximada"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            placeholderTextColor="#789287"
          />

          {role === 'donante' && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Tipo de donante</Text>

              <SmallOptionButton
                title="Persona"
                selected={donorType === 'persona'}
                onPress={() => setDonorType('persona')}
              />

              <SmallOptionButton
                title="Farmacia"
                selected={donorType === 'farmacia'}
                onPress={() => setDonorType('farmacia')}
              />
            </View>
          )}

          {role === 'receptor' && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Tipo de receptor</Text>

              <SmallOptionButton
                title="Paciente"
                selected={receiverType === 'paciente'}
                onPress={() => setReceiverType('paciente')}
              />

              <SmallOptionButton
                title="ONG"
                selected={receiverType === 'ong'}
                onPress={() => setReceiverType('ong')}
              />

              <SmallOptionButton
                title="Centro de salud"
                selected={receiverType === 'centro_salud'}
                onPress={() => setReceiverType('centro_salud')}
              />

              <TextInput
                placeholder="Necesidad médica general o categoría"
                value={medicalNeed}
                onChangeText={setMedicalNeed}
                style={styles.input}
                placeholderTextColor="#789287"
              />
            </View>
          )}

          {role === 'validador' && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Tipo de validador</Text>

              <SmallOptionButton
                title="Personal médico"
                selected={validatorType === 'medico'}
                onPress={() => setValidatorType('medico')}
              />

              <SmallOptionButton
                title="Enfermería"
                selected={validatorType === 'enfermeria'}
                onPress={() => setValidatorType('enfermeria')}
              />

              <SmallOptionButton
                title="ONG autorizada"
                selected={validatorType === 'ong'}
                onPress={() => setValidatorType('ong')}
              />

              <SmallOptionButton
                title="Centro de salud"
                selected={validatorType === 'centro_salud'}
                onPress={() => setValidatorType('centro_salud')}
              />

              <TextInput
                placeholder="Institución o centro de trabajo"
                value={institution}
                onChangeText={setInstitution}
                style={styles.input}
                placeholderTextColor="#789287"
              />

              <View style={styles.validatorNotice}>
                <Text style={styles.validatorNoticeTitle}>
                  Validación requerida
                </Text>
                <Text style={styles.validatorNoticeText}>
                  Las cuentas de validador quedan pendientes. Un administrador
                  deberá autorizar la cuenta antes de que pueda aprobar,
                  rechazar solicitudes o escanear códigos QR.
                </Text>
              </View>
            </View>
          )}

          <Pressable
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={saveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar perfil</Text>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F1F8F4',
  },
  heroCard: {
    backgroundColor: '#1F4D36',
    borderRadius: 26,
    padding: 22,
    marginTop: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#DCFCE7',
    borderWidth: 4,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoCross: {
    color: '#166534',
    fontSize: 48,
    fontWeight: '900',
    marginTop: -4,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#DCFCE7',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#24513A',
    marginBottom: 10,
  },
  roleCard: {
    backgroundColor: '#F3FBF6',
    borderWidth: 1,
    borderColor: '#CDEAD6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  roleCardActive: {
    backgroundColor: '#2E7D4F',
    borderColor: '#2E7D4F',
  },
  roleCardTitle: {
    color: '#1F4D36',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  roleCardTitleActive: {
    color: '#FFFFFF',
  },
  roleCardDescription: {
    color: '#4F6F5D',
    fontSize: 13,
    lineHeight: 19,
  },
  roleCardDescriptionActive: {
    color: '#DCFCE7',
  },
  adminNotice: {
    backgroundColor: '#FEF9C3',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 6,
  },
  adminNoticeTitle: {
    color: '#854D0E',
    fontWeight: '900',
    marginBottom: 4,
  },
  adminNoticeText: {
    color: '#713F12',
    lineHeight: 19,
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontWeight: '900',
    marginBottom: 14,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BFDCC8',
    backgroundColor: '#FAFFFB',
    padding: 13,
    marginBottom: 12,
    borderRadius: 14,
    color: '#1F3D2B',
  },
  block: {
    marginTop: 6,
    marginBottom: 6,
  },
  smallButton: {
    backgroundColor: '#F3FBF6',
    borderWidth: 1,
    borderColor: '#CDEAD6',
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  smallButtonActive: {
    backgroundColor: '#A7F3D0',
    borderColor: '#34D399',
  },
  smallButtonText: {
    color: '#2F6F4E',
    textAlign: 'center',
    fontWeight: '700',
  },
  smallButtonTextActive: {
    color: '#064E3B',
    fontWeight: '900',
  },
  validatorNotice: {
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 4,
    marginBottom: 8,
  },
  validatorNoticeTitle: {
    color: '#075985',
    fontWeight: '900',
    marginBottom: 4,
  },
  validatorNoticeText: {
    color: '#075985',
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 15,
    paddingVertical: 15,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
  },
});