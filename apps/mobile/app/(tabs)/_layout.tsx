import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router/js-tabs'
import { useTheme } from '../../src/theme'

export default function TabsLayout() {
  const { colors, font } = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: font(18), fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 64,
        },
        tabBarLabelStyle: { fontSize: font(13), fontWeight: '600' },
        tabBarItemStyle: { minHeight: 48 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarAccessibilityLabel: 'Mapa de locais',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="lista"
        options={{
          title: 'Lista',
          tabBarAccessibilityLabel: 'Lista de locais, alternativa ao mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarAccessibilityLabel: 'Ranking da comunidade',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil e configurações de acessibilidade',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
