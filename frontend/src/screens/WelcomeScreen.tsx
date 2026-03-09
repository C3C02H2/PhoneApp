import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const [showFail, setShowFail] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const handleNo = () => {
    setShowFail(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setShowFail(false));
    }, 4000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />

      <View style={styles.content}>
        <Text style={styles.brand}>DoYouTry</Text>

        <Text style={styles.question}>Do you try?</Text>

        {/* Glowing question mark */}
        <View style={styles.glowWrap}>
          <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
          <View style={styles.questionCircle}>
            <Text style={styles.questionMark}>?</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.yesBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
            <Text style={styles.yesBtnText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.noBtn} onPress={handleNo} activeOpacity={0.8}>
            <Text style={styles.noBtnText}>No</Text>
          </TouchableOpacity>
        </View>

        {showFail && (
          <Animated.View style={[styles.failWrap, { opacity: fadeAnim }]}>
            <Text style={styles.failText}>You already failed.</Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const RING = 160;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  brand: { fontSize: 20, fontWeight: '700', color: colors.accent.main, letterSpacing: 1, marginBottom: spacing.xl },
  question: { ...typography.h1, color: colors.primary.main, textAlign: 'center', marginBottom: spacing.xxxl, fontSize: 26 },

  glowWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxxl, width: RING + 40, height: RING + 40 },
  glowRing: {
    position: 'absolute', width: RING + 40, height: RING + 40, borderRadius: (RING + 40) / 2,
    borderWidth: 2, borderColor: colors.accent.main,
  },
  questionCircle: {
    width: RING, height: RING, borderRadius: RING / 2,
    backgroundColor: colors.background.secondary, borderWidth: 2.5,
    borderColor: colors.accent.main, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent.main, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  questionMark: { fontSize: 64, fontWeight: '300', color: colors.accent.main },

  buttons: { width: '100%', gap: spacing.md },
  yesBtn: {
    backgroundColor: colors.accent.main, borderRadius: borderRadius.lg, paddingVertical: 16,
    alignItems: 'center',
  },
  yesBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  noBtn: {
    borderWidth: 1, borderColor: colors.border.light, borderRadius: borderRadius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  noBtnText: { fontSize: 17, fontWeight: '600', color: colors.primary.muted },

  failWrap: { marginTop: spacing.xxl, alignItems: 'center' },
  failText: { ...typography.h3, color: colors.error.main, fontStyle: 'italic' },
});
