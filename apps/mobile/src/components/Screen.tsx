import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native'
import { spacing, useTheme } from '../theme'

/** Contêiner de tela com rolagem, fundo do tema e espaçamento padrão. */
export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  ...props
}: ScrollViewProps & { scroll?: boolean }) {
  const { colors } = useTheme()
  if (!scroll) {
    return <View style={[styles.flex, { backgroundColor: colors.background }]}>{children}</View>
  }
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useTheme()
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  card: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.sm },
})
