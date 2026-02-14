import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.card}>
          <Text style={styles.title}>This screen does not exist.</Text>
          <Text style={styles.subtitle}>If you followed a broken link, head back home.</Text>

          <Link href="/" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Go to Home</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
  },
  card: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.card2,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    maxWidth: 320,
  },
  primaryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.text,
  },
  primaryButtonText: {
    color: theme.colors.bg,
    fontSize: 12,
    fontWeight: '900',
  },
});
