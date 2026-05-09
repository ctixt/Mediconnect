import React, { useEffect, useState } from 'react';
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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [medicalNeed, setMedicalNeed] = useState('');
  const [institution, setInstitution] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        navigation.replace('Login');
        return;
      }

      const snap = await getDoc(doc(db, 'users', user.uid));

      if (snap.exists()) {
        const data = snap.data();

        setRole(String(data.role || '').trim().toLowerCase());
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setLocation(data.location || '');
        setMedicalNeed(data.medicalNeed || '');
        setInstitution(data.institution || '');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado.');
        return;
      }

      if (!fullName.trim() || !phone.trim() || !location.trim()) {
        Alert.alert(
          'Campos incompletos',
          'Completa nombre, teléfono/contacto y ubicación aproximada.'
        );
        return;
      }

      const dataToUpdate: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        updatedAt: new Date(),
      };

      if (role === 'receptor') {
        dataToUpdate.medicalNeed = medicalNeed.trim();
      }

      if (role === 'validador') {
        dataToUpdate.institution = institution.trim();
      }

      await updateDoc(doc(db, 'users', user.uid), dataToUpdate);

      Alert.alert('Perfil actualizado', 'Tus datos fueron guardados correctamente.');
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar perfil</Text>

      <Text style={styles.subtitle}>
        Actualiza tus datos personales. El rol no se puede cambiar desde esta pantalla por seguridad.
      </Text>

      <View style={styles.card}>
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
          placeholderTextColor="#789287"
          keyboardType="phone-pad"
        />

        <TextInput
          placeholder="Ubicación aproximada"
          value={location}
          onChangeText={setLocation}
          style={styles.input}
          placeholderTextColor="#789287"
        />

        {role === 'receptor' && (
          <TextInput
            placeholder="Necesidad médica general"
            value={medicalNeed}
            onChangeText={setMedicalNeed}
            style={styles.input}
            placeholderTextColor="#789287"
          />
        )}

        {role === 'validador' && (
          <TextInput
            placeholder="Institución o centro de trabajo"
            value={institution}
            onChangeText={setInstitution}
            style={styles.input}
            placeholderTextColor="#789287"
          />
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Rol actual</Text>
          <Text style={styles.infoText}>
            Tu rol actual es: {role || 'No definido'}. Este dato solo debe modificarse desde Firebase o por un administrador.
          </Text>
        </View>

        <Pressable style={styles.saveButton} onPress={updateProfile}>
          <Text style={styles.saveButtonText}>Guardar cambios</Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
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
  title: {
    fontSize: 28,
    fontWeight: '900',
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
    borderRadius: 20,
    padding: 18,
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
  infoBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  infoTitle: {
    color: '#166534',
    fontWeight: '900',
    marginBottom: 4,
  },
  infoText: {
    color: '#166534',
    lineHeight: 20,
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
    fontWeight: '900',
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
    fontWeight: '900',
  },
});