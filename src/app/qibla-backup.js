
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useSelector } from 'react-redux';

const COLORS = {
  background: '#0d1b2a',
  surface: '#1b2d45',
  border: '#1e3a5f',
  gold: '#c9a84c',
  muted: '#7a8fa6',
  white: '#ffffff',
  error: '#ff6b6b',
};

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function getDirection(angle) {
  const directions = [
    'North',
    'North East',
    'East',
    'South East',
    'South',
    'South West',
    'West',
    'North West',
  ];

  return directions[
    Math.round(normalizeAngle(angle) / 45) % 8
  ];
}

function calculateQiblaAngle(latitude, longitude) {
  const kaabaLatitude = 21.4225;
  const kaabaLongitude = 39.8262;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const toDegrees = (radians) => (radians * 180) / Math.PI;

  const lat = toRadians(latitude);
  const kaabaLat = toRadians(kaabaLatitude);
  const longitudeDifference = toRadians(
    kaabaLongitude - longitude
  );

  const x =
    Math.sin(longitudeDifference) * Math.cos(kaabaLat);

  const y =
    Math.cos(lat) * Math.sin(kaabaLat) -
    Math.sin(lat) *
      Math.cos(kaabaLat) *
      Math.cos(longitudeDifference);

  return normalizeAngle(toDegrees(Math.atan2(x, y)));
}

export default function QiblaScreen() {
  const { city, country } = useSelector(
    (state) => state.prayer
  );

  const [qiblaAngle, setQiblaAngle] = useState(null);
  const [heading, setHeading] = useState(null);
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationText, setLocationText] = useState(
    'Tap Refresh Location to get your location.'
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshLocation = () => {
    setRefreshKey((previous) => previous + 1);
  };

  // Check whether the phone has a compass sensor.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let subscription;

      async function startCompass() {
        try {
          const available =
            await Magnetometer.isAvailableAsync();

          if (!active) {
            return;
          }

          setSensorAvailable(available);

          if (available) {
            Magnetometer.setUpdateInterval(150);

            subscription = Magnetometer.addListener((data) => {
              if (!active) {
                return;
              }

              const angle =
                Math.atan2(-data.x, data.y) *
                (180 / Math.PI);

              setHeading(normalizeAngle(angle));
            });
          } else {
            setHeading(null);
          }
        } catch (sensorError) {
          if (active) {
            setSensorAvailable(false);
            setHeading(null);
          }
        }
      }

      startCompass();

      return () => {
        active = false;

        if (subscription) {
          subscription.remove();
        }
      };
    }, [])
  );

  // Refresh the GPS location whenever the button is tapped.
  useEffect(() => {
    let active = true;

    async function loadLocation() {
      setLoading(true);
      setError('');
      setLocationText('Getting your current location...');

      try {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          throw new Error(
            'Location permission denied. Open phone Settings > Apps > PrayerTimes > Permissions > Location, allow access, then refresh.'
          );
        }

        let position = null;

        try {
          // Do not let a slow GPS request keep the screen loading forever.
          position = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise((resolve) => {
              setTimeout(() => resolve(null), 15000);
            }),
          ]);
        } catch (gpsError) {
          position = null;
        }

        if (!position) {
          position = await Location.getLastKnownPositionAsync({});
        }

        if (!position) {
          throw new Error(
            'Location not found. Turn on your phone Location/GPS setting, then tap Refresh Location again. Try near a window or outdoors.'
          );
        }

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const angle = calculateQiblaAngle(latitude, longitude);

        if (!active) {
          return;
        }

        setQiblaAngle(angle);

        let accuracy = position.coords.accuracy;

        if (accuracy === null || accuracy === undefined) {
          setLocationText(
            `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          );
        } else {
          setLocationText(
            `GPS accuracy: approximately ${Math.round(accuracy)} metres`
          );
        }
      } catch (locationError) {
        if (active) {
          setError(
            locationError.message ||
              'Could not get your location. Please try again.'
          );
          setQiblaAngle(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLocation();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  let arrowRotation = 0;

  if (
    qiblaAngle !== null &&
    sensorAvailable &&
    heading !== null
  ) {
    arrowRotation = normalizeAngle(qiblaAngle - heading);
  } else if (qiblaAngle !== null) {
    arrowRotation = qiblaAngle;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
        }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: COLORS.gold,
            fontSize: 13,
            letterSpacing: 3,
            fontWeight: '600',
          }}
        >
          QIBLA DIRECTION
        </Text>

        <Text
          style={{
            color: COLORS.white,
            fontSize: 25,
            fontWeight: '700',
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          🧭 {city || 'Current Location'}
        </Text>

        <Text
          style={{
            color: COLORS.muted,
            fontSize: 13,
            marginTop: 5,
          }}
        >
          {country || ''}
        </Text>

        <View
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            width: '100%',
            marginTop: 20,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: COLORS.gold,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {sensorAvailable
              ? 'Compass sensor detected'
              : 'GPS Qibla mode'}
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 19,
            }}
          >
            {sensorAvailable
              ? 'A compass sensor is available on this device.'
              : 'Your location can calculate Qibla direction, but GPS alone cannot track phone rotation.'}
          </Text>
        </View>

        {/* Refresh button stays visible even while loading. */}
        <Pressable
          onPress={refreshLocation}
          style={{
            backgroundColor: COLORS.gold,
            paddingVertical: 15,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 22,
            elevation: 3,
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

        {loading && (
          <View
            style={{
              alignItems: 'center',
              marginTop: 8,
              marginBottom: 20,
            }}
          >
            <ActivityIndicator
              size="large"
              color={COLORS.gold}
            />

            <Text
              style={{
                color: COLORS.white,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              Getting location and calculating Qibla...
            </Text>
          </View>
        )}

        {!!error && !loading && (
          <View
            style={{
              width: '100%',
              padding: 16,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.error,
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: COLORS.error,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {!loading && !error && qiblaAngle !== null && (
          <View
            style={{
              width: '100%',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: COLORS.surface,
                borderWidth: 3,
                borderColor: COLORS.gold,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 22,
              }}
            >
              <Text
                style={{
                  position: 'absolute',
                  top: 12,
                  color: COLORS.white,
                  fontSize: 17,
                  fontWeight: '700',
                }}
              >
                N
              </Text>

              <Text
                style={{
                  position: 'absolute',
                  bottom: 12,
                  color: COLORS.muted,
                  fontWeight: '700',
                }}
              >
                S
              </Text>

              <Text
                style={{
                  position: 'absolute',
                  right: 15,
                  color: COLORS.muted,
                  fontWeight: '700',
                }}
              >
                E
              </Text>

              <Text
                style={{
                  position: 'absolute',
                  left: 15,
                  color: COLORS.muted,
                  fontWeight: '700',
                }}
              >
                W
              </Text>

              <View
                style={{
                  alignItems: 'center',
                  transform: [
                    { rotate: `${arrowRotation}deg` },
                  ],
                }}
              >
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 14,
                    borderRightWidth: 14,
                    borderBottomWidth: 32,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor: COLORS.gold,
                  }}
                />

                <View
                  style={{
                    width: 5,
                    height: 55,
                    backgroundColor: COLORS.gold,
                    borderRadius: 3,
                  }}
                />

                <Text
                  style={{
                    fontSize: 28,
                    marginTop: 3,
                  }}
                >
                  🕋
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 22,
                alignItems: 'center',
                width: '100%',
                borderWidth: 1,
                borderColor: COLORS.gold,
              }}
            >
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 12,
                  letterSpacing: 2,
                  fontWeight: '600',
                }}
              >
                QIBLA BEARING
              </Text>

              <Text
                style={{
                  color: COLORS.gold,
                  fontSize: 46,
                  fontWeight: '700',
                  marginTop: 8,
                }}
              >
                {Math.round(qiblaAngle)}°
              </Text>

              <Text
                style={{
                  color: COLORS.white,
                  fontSize: 18,
                  marginTop: 4,
                }}
              >
                {getDirection(qiblaAngle)}
              </Text>

              {sensorAvailable && heading !== null && (
                <Text
                  style={{
                    color: COLORS.white,
                    marginTop: 12,
                    textAlign: 'center',
                  }}
                >
                  Sensor heading: {Math.round(heading)}°
                </Text>
              )}

              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 12,
                  marginTop: 14,
                  textAlign: 'center',
                  lineHeight: 19,
                }}
              >
                {locationText}
              </Text>

              {!sensorAvailable && (
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 13,
                    marginTop: 12,
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  This direction is calculated relative to
                  North. The arrow cannot follow your phone's
                  rotation without a supported compass sensor.
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
