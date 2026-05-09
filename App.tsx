import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddMedicineScreen from './src/screens/AddMedicineScreen';
import RoleSelectScreen from './src/screens/RoleSelectScreen';
import RoleGateScreen from './src/screens/RoleGateScreen';
import MedicineListScreen from './src/screens/MedicineListScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RequestsScreen from './src/screens/RequestsScreen';
import DonationQRCodeScreen from './src/screens/DonationQRCodeScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import BarcodeScannerScreen from './src/screens/BarcodeScannerScreen';
import EditMedicineScreen from './src/screens/EditMedicineScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="RoleGate"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#F1F8F4',
          },
          headerTintColor: '#1F4D36',
          headerTitleStyle: {
            fontWeight: '800',
          },
        }}
      >
        <Stack.Screen
          name="RoleGate"
          component={RoleGateScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Iniciar sesión',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            title: 'Crear cuenta',
          }}
        />

        <Stack.Screen
          name="RoleSelect"
          component={RoleSelectScreen}
          options={{
            title: 'Seleccionar rol',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'MediConnect',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Inicio',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="AddMedicine"
          component={AddMedicineScreen}
          options={{
            title: 'Registrar medicamento',
          }}
        />

        <Stack.Screen
          name="MedicineList"
          component={MedicineListScreen}
          options={{
            title: 'Medicamentos',
          }}
        />

        <Stack.Screen
          name="Requests"
          component={RequestsScreen}
          options={{
            title: 'Solicitudes',
          }}
        />

        <Stack.Screen
          name="DonationQR"
          component={DonationQRCodeScreen}
          options={{
            title: 'Código QR',
          }}
        />

        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{
            title: 'Escanear QR',
          }}
        />

        <Stack.Screen
          name="BarcodeScanner"
          component={BarcodeScannerScreen}
          options={{
            title: 'Escanear código',
          }}
        />

        <Stack.Screen
          name="EditMedicine"
          component={EditMedicineScreen}
          options={{
            title: 'Editar medicamento',
          }}
        />

        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{
            title: 'Panel administrativo',
          }}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Mi perfil',
          }}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            title: 'Editar perfil',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}