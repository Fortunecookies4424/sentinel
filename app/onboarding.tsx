import { useState, useRef } from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useAuthStore } from '@/lib/stores/authStore';
import { SPACING, RADIUS } from '@/lib/theme';
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideOutLeft, runOnJS } from 'react-native-reanimated';
import { ScrollView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const slides: {
  icon: IconName;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}[] = [
  {
    icon: 'shield',
    title: 'Protect Yourself',
    description: 'Sentinel is your personal safety companion. Trigger instant emergency alerts with a single tap whenever you feel unsafe.',
    color: '#2563EB',
    bgColor: 'rgba(37,99,235,0.12)',
  },
  {
    icon: 'map-pin',
    title: 'Share Live Location',
    description: 'Share your real-time location with trusted contacts for a set duration. They\'ll see exactly where you are until you stop sharing.',
    color: '#0891B2',
    bgColor: 'rgba(8,145,178,0.12)',
  },
  {
    icon: 'siren',
    title: 'Emergency SOS',
    description: 'One press activates a 5-second countdown. If not cancelled, every trusted contact is instantly notified with your live GPS location.',
    color: '#DC2626',
    bgColor: 'rgba(220,38,38,0.12)',
  },
  {
    icon: 'users',
    title: 'Trusted Contacts',
    description: 'Build your safety network. Add family and friends who will be alerted during emergencies, with a primary contact for fast response.',
    color: '#7C3AED',
    bgColor: 'rgba(124,58,237,0.12)',
  },
  {
    icon: 'lock',
    title: 'Privacy First',
    description: 'Your data belongs to you. We never track you unless you enable location sharing or activate SOS. All communication is encrypted.',
    color: '#059669',
    bgColor: 'rgba(5,150,105,0.12)',
  },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  const slide = slides[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Typography size="sm" color={theme.textSecondary} weight="medium">Skip</Typography>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          if (index !== currentSlide) setCurrentSlide(index);
        }}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((s, i) => (
          <View key={i} style={styles.slide}>
            <View style={styles.slideContent}>
              <Animated.View
                key={`icon-${i}-${currentSlide === i}`}
                entering={FadeIn.delay(100).springify()}
                style={[styles.iconCircle, { backgroundColor: s.bgColor }]}
              >
                <Icon name={s.icon} size={56} color={s.color} />
              </Animated.View>

              <Animated.View
                key={`text-${i}-${currentSlide === i}`}
                entering={FadeInDown.delay(200)}
              >
                <Typography size="display" weight="bold" color={theme.text} align="center" style={{ letterSpacing: -0.5 }}>
                  {s.title}
                </Typography>
                <Typography size="md" color={theme.textSecondary} align="center" style={{ marginTop: SPACING.md, lineHeight: 24, paddingHorizontal: SPACING.lg }}>
                  {s.description}
                </Typography>
              </Animated.View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === currentSlide ? slide.color : theme.border,
                    width: i === currentSlide ? 28 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Button
          label={currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          fullWidth
          size="lg"
          icon={currentSlide === slides.length - 1 ? 'check' : 'chevron-right'}
          iconPosition="right"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  slide: { width, flex: 1 },
  slideContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  iconCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: SPACING.lg },
  dot: { height: 8, borderRadius: 4 },
});
