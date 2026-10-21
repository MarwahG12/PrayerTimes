import { ScrollView, Text, View } from 'react-native';

const COLORS = {
  background: '#0d1b2a',
  surface: '#1b2d45',
  border: '#1e3a5f',
  gold: '#c9a84c',
  muted: '#7a8fa6',
  white: '#ffffff',
};

export default function ExploreScreen() {
  const features = [
    {
      number: '01',
      title: 'Daily Prayer Times',
      description:
        'Check Fajr, Dhuhr, Asr, Maghrib and Isha timings for your selected city.',
    },
    {
      number: '02',
      title: 'City Selection',
      description:
        'Choose a city to load its prayer timings and update the Qibla direction.',
    },
    {
      number: '03',
      title: 'Qibla Direction',
      description:
        'Find the calculated bearing from your selected city towards the Kaaba.',
    },
  ];

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
      contentContainerStyle={{
        padding: 22,
        paddingTop: 55,
        paddingBottom: 35,
      }}
    >
      <Text
        style={{
          color: COLORS.gold,
          fontSize: 13,
          letterSpacing: 3,
          fontWeight: '600',
        }}
      >
        PRAYERTIMES
      </Text>

      <Text
        style={{
          color: COLORS.white,
          fontSize: 28,
          fontWeight: '700',
          marginTop: 10,
        }}
      >
        Explore
      </Text>

      <Text
        style={{
          color: COLORS.muted,
          fontSize: 15,
          lineHeight: 23,
          marginTop: 10,
          marginBottom: 26,
        }}
      >
        Explore the available features of your PrayerTimes app.
      </Text>

      {features.map((feature) => (
        <View
          key={feature.number}
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 16,
            padding: 20,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              color: COLORS.gold,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 2,
            }}
          >
            FEATURE {feature.number}
          </Text>

          <Text
            style={{
              color: COLORS.white,
              fontSize: 18,
              fontWeight: '600',
              marginTop: 9,
            }}
          >
            {feature.title}
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 14,
              lineHeight: 21,
              marginTop: 8,
            }}
          >
            {feature.description}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}