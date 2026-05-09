import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Campos incompletos',
        'Ingresa tu correo y contraseña para continuar.'
      );
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const user = userCredential.user;

      const userSnap = await getDoc(doc(db, 'users', user.uid));

      if (userSnap.exists()) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'RoleSelect' }],
        });
      }
    } catch (error: any) {
      console.log(error);

      let message = 'No se pudo iniciar sesión. Verifica tus datos.';

      if (error.code === 'auth/invalid-email') {
        message = 'El correo ingresado no tiene un formato válido.';
      }

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        message = 'Correo o contraseña incorrectos.';
      }

      if (error.code === 'auth/too-many-requests') {
        message =
          'Se realizaron demasiados intentos. Intenta nuevamente más tarde.';
      }

      Alert.alert('Error de inicio de sesión', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoCross}>+</Text>
          </View>

          <Text style={styles.appName}>MediConnect</Text>
          <Text style={styles.appSubtitle}>
            Trazabilidad y donación segura de medicamentos
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.description}>
            Accede con tu cuenta para continuar con tu rol dentro del sistema.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              placeholder="ejemplo@correo.com"
              value={email}
              style={styles.input}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#789287"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>

            <View style={styles.passwordBox}>
              <TextInput
                placeholder="Ingresa tu contraseña"
                value={password}
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                placeholderTextColor="#789287"
              />

              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeButtonText}>
                  {showPassword ? 'Ocultar' : 'Ver'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={login}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Ingresar</Text>
            )}
          </Pressable>

          <View style={styles.registerBox}>
            <Text style={styles.registerText}>¿Aún no tienes cuenta?</Text>

            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Crear cuenta</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Acceso por roles</Text>
          <Text style={styles.infoText}>
            La app habilita funciones diferentes para donantes, receptores,
            validadores y administradores.
          </Text>
        </View>

        <View style={styles.creditsBox}>
          <Text style={styles.creditsTitle}>Hecho por:</Text>
          <Text style={styles.creditsText}>Nombre 1</Text>
          <Text style={styles.creditsText}>Nombre 2</Text>
          <Text style={styles.creditsText}>Nombre 3</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F1F8F4',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#F1F8F4',
    padding: 22,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#1F4D36',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#A7F3D0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  logoCross: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '900',
    marginTop: -4,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1F4D36',
    letterSpacing: 0.3,
  },
  appSubtitle: {
    color: '#4F6F5D',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D8EBDD',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#1F4D36',
    marginBottom: 6,
  },
  description: {
    color: '#4F6F5D',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 13,
  },
  label: {
    color: '#24513A',
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BFDCC8',
    backgroundColor: '#FAFFFB',
    padding: 13,
    borderRadius: 14,
    color: '#1F3D2B',
    fontSize: 15,
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDCC8',
    backgroundColor: '#FAFFFB',
    borderRadius: 14,
    paddingLeft: 13,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    color: '#1F3D2B',
    fontSize: 15,
  },
  eyeButton: {
    backgroundColor: '#E5F4EA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BFE3CB',
  },
  eyeButtonText: {
    color: '#1F4D36',
    fontWeight: '900',
    fontSize: 12,
  },
  loginButton: {
    backgroundColor: '#2E7D4F',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
  },
  registerBox: {
    marginTop: 18,
    alignItems: 'center',
  },
  registerText: {
    color: '#4F6F5D',
    fontSize: 14,
    marginBottom: 5,
  },
  registerLink: {
    color: '#1F4D36',
    fontSize: 15,
    fontWeight: '900',
  },
  infoBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 18,
    padding: 14,
    marginTop: 18,
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
    fontSize: 13,
  },
  creditsBox: {
    marginTop: 18,
    alignItems: 'center',
    opacity: 0.75,
  },
  creditsTitle: {
    color: '#4F6F5D',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  creditsText: {
    color: '#4F6F5D',
    fontSize: 12,
    lineHeight: 17,
  },
});