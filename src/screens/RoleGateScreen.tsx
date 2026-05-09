import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function RoleGateScreen({ navigation }: any) {

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        navigation.replace('Login');
        return;
      }

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        navigation.replace('Dashboard');
        return;
      }

      const data = docSnap.data();

      // 🔥 Aquí decidimos a dónde va cada rol
      if (data.role === 'donante') {
        navigation.replace('Home');
      } else if (data.role === 'receptor') {
        navigation.replace('Home'); // luego lo cambiaremos
      } else if (data.role === 'validador') {
        navigation.replace('Home'); // luego lo cambiaremos
      }

    } catch (error) {
      console.log(error);
      navigation.replace('Login');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Cargando...</Text>
    </View>
  );
}