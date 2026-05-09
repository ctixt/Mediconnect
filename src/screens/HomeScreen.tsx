import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  useEffect(() => {
    navigation.replace('Dashboard');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
      <Text>Redirigiendo...</Text>
    </View>
  );
}