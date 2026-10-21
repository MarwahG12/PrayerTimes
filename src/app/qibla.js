
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

const COLORS = {
  background: '#0d1b2a',
  surface: '#1b2d45',
  border: '#1e3a5f',
  gold: '#c9a84c',
  muted: '#7a8fa6',
  white: '#ffffff',
};

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function getQiblaBearing(latitude, longitude) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const toDegrees = (radians) => (radians * 180) / Math.PI;

  const lat1 = toRadians(latitude);
  const lat2 = toRadians(KAABA_LAT);
  const deltaLon = toRadians(KAABA_LON - longitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);

  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  return normalizeAngle(toDegrees(Math.atan2(y, x)));
}

export default function QiblaScreen() {
  const [loading, setLoading] = useState(true);
  const [bearing, setBearing] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  const refreshLocation = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setError(
          'Location permission allow karein, phir Refresh Location dabayein.'
        );
        return;
      }

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setError(
          'Phone ki Location/GPS setting ON karein, phir dobara try karein.'
        );
        return;
      }

      let position = null;

      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (locationError) {
        position = await Location.getLastKnownPositionAsync();
      }

      if (!position || !position.coords) {
        setError(
          'Current location nahi mil saki. GPS ON karke khuli jagah mein dobara try karein.'
        );
        return;
      }

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setCoordinates({ latitude, longitude });
      setBearing(getQiblaBearing(latitude, longitude));
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (locationError) {
      setError(
        'Location hasil nahi ho saki. Internet aur GPS check karke dobara try karein.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 30,
          flexGrow: 1,
        }}
      >
        <Text
          style={{
            color: COLORS.white,
            fontSize: 28,
            fontWeight: '700',
            textAlign: 'center',
            marginTop: 10,
          }}
        >
          Qibla Direction
        </Text>

        <Text
          style={{
            color: COLORS.muted,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 25,
          }}
        >
          Apni location se Kaaba ki direction maloom karein
        </Text>

        <View
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
            borderWidth: 1,
            borderRadius: 24,
            padding: 22,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 230,
              height: 230,
              borderRadius: 115,
              borderWidth: 3,
              borderColor: COLORS.gold,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.background,
            }}
          >
            <Text
              style={{
                position: 'absolute',
                top: 12,
                color: COLORS.white,
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              N
            </Text>

            <View
              style={{
                width: 150,
                height: 150,
                borderRadius: 75,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: COLORS.gold,
                  fontSize: 58,
                }}
              >
                🕋
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <ActivityIndicator size="large" color={COLORS.gold} />
              <Text
                style={{
                  color: COLORS.muted,
                  marginTop: 10,
                  textAlign: 'center',
                }}
              >
                Location hasil ho rahi hai...
              </Text>
            </View>
          ) : null}

          {bearing !== null && !loading ? (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Text
                style={{
                  color: COLORS.gold,
                  fontSize: 38,
                  fontWeight: '700',
                }}
              >
                {bearing.toFixed(1)}°
              </Text>

              <Text
                style={{
                  color: COLORS.white,
                  fontSize: 16,
                  marginTop: 5,
                }}
              >
                Qibla bearing from true north
              </Text>
            </View>
          ) : null}

          {coordinates !== null ? (
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 15,
              }}
            >
              Latitude: {coordinates.latitude.toFixed(5)}
              {'\n'}
              Longitude: {coordinates.longitude.toFixed(5)}
              {updatedAt ? `\nUpdated: ${updatedAt}` : ''}
            </Text>
          ) : null}

          {error ? (
            <Text
              style={{
                color: '#ffb4ab',
                fontSize: 14,
                textAlign: 'center',
                marginTop: 18,
                lineHeight: 21,
              }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={refreshLocation}
            disabled={loading}
            style={{
              backgroundColor: COLORS.gold,
              borderRadius: 12,
              paddingVertical: 15,
              paddingHorizontal: 20,
              marginTop: 24,
              width: '100%',
              alignItems: 'center',
              opacity: loading ? 0.65 : 1,
            }}
          >
            <Text
              style={{
                color: COLORS.background,
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              ↻  Refresh Location
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 16,
            marginTop: 20,
          }}
        >
          <Text
            style={{
              color: COLORS.gold,
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            Important
          </Text>

          <Text
            style={{
              color: COLORS.white,
              fontSize: 14,
              lineHeight: 22,
            }}
          >
            Aapke vivo Y03 mein E-compass supported nahi hai.
            Is screen par Qibla bearing true north se calculate hoti hai;
            yeh live rotating compass nahi hai. Direction ko phone
            ghumane ke saath align karne ke liye compass sensor wala
            compatible phone darkar hai.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
