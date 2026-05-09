import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../config/firebase';

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const snap = await getDoc(doc(db, 'users', user.uid));

      if (snap.exists()) {
        setProfile(snap.data());
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const takeProfilePhoto = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado.');
        return;
      }

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
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;

      setUpdatingPhoto(true);

      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: imageUri,
        profileImageUpdatedAt: new Date(),
      });

      setProfile((prev: any) => ({
        ...prev,
        profileImage: imageUri,
        profileImageUpdatedAt: new Date(),
      }));

      Alert.alert('Foto actualizada', 'Tu foto de perfil fue guardada.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo actualizar la foto.');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const chooseProfilePhoto = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado.');
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos permiso para acceder a tus imágenes.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;

      setUpdatingPhoto(true);

      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: imageUri,
        profileImageUpdatedAt: new Date(),
      });

      setProfile((prev: any) => ({
        ...prev,
        profileImage: imageUri,
        profileImageUpdatedAt: new Date(),
      }));

      Alert.alert('Foto actualizada', 'Tu foto de perfil fue guardada.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo actualizar la foto.');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const getRoleLabel = () => {
    if (profile?.role === 'donante') return 'Donante';
    if (profile?.role === 'receptor') return 'Receptor';
    if (profile?.role === 'validador') return 'Validador';
    if (profile?.role === 'admin') return 'Administrador';
    return 'Usuario';
  };

  const getRoleDescription = () => {
    if (profile?.role === 'donante') {
      return 'Usuario que registra medicamentos disponibles para donación.';
    }

    if (profile?.role === 'receptor') {
      return 'Usuario que busca y solicita medicamentos disponibles.';
    }

    if (profile?.role === 'validador') {
      return 'Usuario encargado de revisar y validar solicitudes.';
    }

    if (profile?.role === 'admin') {
      return 'Usuario con acceso a reportes y gestión administrativa.';
    }

    return 'Perfil registrado en MediConnect.';
  };

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | null | undefined;
  }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {value !== null && value !== undefined && value !== ''
          ? String(value)
          : 'No registrado'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No se encontró información del perfil.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Pressable
            style={styles.photoContainer}
            onPress={() => {
              if (profile.profileImage) {
                setShowImageModal(true);
              }
            }}
          >
            {profile.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>
                  {profile.fullName
                    ? profile.fullName.charAt(0).toUpperCase()
                    : 'U'}
                </Text>
              </View>
            )}
          </Pressable>

          {profile.profileImage && (
            <Text style={styles.tapHint}>Toca la foto para verla completa</Text>
          )}

          <Text style={styles.name}>{profile.fullName || 'Usuario'}</Text>
          <Text style={styles.roleBadge}>{getRoleLabel()}</Text>
          <Text style={styles.roleDescription}>{getRoleDescription()}</Text>

          <View style={styles.photoActions}>
            <Pressable
              style={styles.primaryButton}
              onPress={takeProfilePhoto}
              disabled={updatingPhoto}
            >
              <Text style={styles.primaryButtonText}>
                {profile.profileImage ? 'Cambiar con cámara' : 'Tomar foto'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={chooseProfilePhoto}
              disabled={updatingPhoto}
            >
              <Text style={styles.secondaryButtonText}>
                Elegir desde galería
              </Text>
            </Pressable>

            <Pressable
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editButtonText}>Editar perfil</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Información general</Text>

          <InfoRow label="Correo" value={profile.email} />
          <InfoRow label="Teléfono/contacto" value={profile.phone} />
          <InfoRow label="Ubicación aproximada" value={profile.location} />

          {profile.role === 'donante' && (
            <InfoRow label="Tipo de donante" value={profile.donorType} />
          )}

          {profile.role === 'receptor' && (
            <>
              <InfoRow label="Tipo de receptor" value={profile.receiverType} />
              <InfoRow label="Necesidad médica" value={profile.medicalNeed} />
            </>
          )}

          {profile.role === 'validador' && (
            <>
              <InfoRow label="Tipo de validador" value={profile.validatorType} />
              <InfoRow label="Institución" value={profile.institution} />
            </>
          )}

          {profile.role === 'admin' && (
            <InfoRow label="Acceso" value="Módulo administrativo y reportes" />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ubicación GPS</Text>

          <InfoRow label="Latitud" value={profile.latitude} />
          <InfoRow label="Longitud" value={profile.longitude} />

          <Text style={styles.note}>
            Estos datos se utilizan para calcular la distancia aproximada entre
            donantes y receptores.
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Perfil MediConnect</Text>
          <Text style={styles.infoText}>
            La foto de perfil ayuda a identificar mejor a los usuarios dentro
            del proceso de donación y trazabilidad.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalCard}>
            {profile.profileImage && (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.fullProfileImage}
              />
            )}

            <Pressable
              style={styles.closeImageButton}
              onPress={() => setShowImageModal(false)}
            >
              <Text style={styles.closeImageButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#4F6F5D',
  },
  emptyText: {
    color: '#4F6F5D',
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: '#1F4D36',
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  photoContainer: {
    marginBottom: 6,
  },
  profileImage: {
    width: 115,
    height: 115,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#A7F3D0',
    backgroundColor: '#DCFCE7',
  },
  profilePlaceholder: {
    width: 115,
    height: 115,
    borderRadius: 60,
    backgroundColor: '#DCFCE7',
    borderWidth: 4,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 42,
    fontWeight: '900',
    color: '#166534',
  },
  tapHint: {
    color: '#DCFCE7',
    fontSize: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: '#A7F3D0',
    color: '#064E3B',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    fontWeight: '900',
    marginBottom: 10,
    overflow: 'hidden',
  },
  roleDescription: {
    color: '#DCFCE7',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  photoActions: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#A7F3D0',
    borderRadius: 15,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#064E3B',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: '#1F4D36',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
  },
  editButton: {
    backgroundColor: '#E5F4EA',
    borderRadius: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#BFE3CB',
  },
  editButtonText: {
    color: '#1F4D36',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#24513A',
    marginBottom: 12,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5F4EA',
    paddingVertical: 10,
  },
  label: {
    color: '#24513A',
    fontWeight: '800',
    marginBottom: 3,
  },
  value: {
    color: '#375A44',
    lineHeight: 20,
  },
  note: {
    marginTop: 12,
    color: '#4F6F5D',
    fontSize: 13,
    lineHeight: 19,
  },
  infoBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
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
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  imageModalCard: {
    width: '100%',
    backgroundColor: '#F1F8F4',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
  },
  fullProfileImage: {
    width: '100%',
    height: 360,
    borderRadius: 20,
    resizeMode: 'cover',
    backgroundColor: '#DCFCE7',
  },
  closeImageButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 15,
    paddingVertical: 13,
    paddingHorizontal: 28,
    marginTop: 14,
    width: '100%',
  },
  closeImageButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
  },
});