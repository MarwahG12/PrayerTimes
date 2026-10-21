
import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchPrayerTimes,
  setCity,
  setCountry,
} from '../store/prayerSlice';

function convertToMinutes(time) {
  if (!time || typeof time !== 'string') {
    return null;
  }

  const match = time.trim().match(
    /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i
  );

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (minutes > 59) {
    return null;
  }

  if (period) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

function getCurrentPrayer(prayers, now) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const prayerTimes = prayers.map((prayer) => ({
    name: prayer.name,
    minutes: convertToMinutes(prayer.time),
  }));

  if (
    prayerTimes.length === 0 ||
    prayerTimes.some((prayer) => prayer.minutes === null)
  ) {
    return null;
  }

  let currentPrayer = 'Isha';

  for (let i = 0; i < prayerTimes.length; i++) {
    if (currentMinutes >= prayerTimes[i].minutes) {
      currentPrayer = prayerTimes[i].name;
    } else {
      break;
    }
  }

  return currentPrayer;
}

export default function HomeScreen() {
  const dispatch = useDispatch();

  const { timings, city, country, loading, error } = useSelector(
    (state) => state.prayer
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    dispatch(fetchPrayerTimes({ city, country }));
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchText.trim().length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      return undefined;
    }

    let isActive = true;

    const timer = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const url =
          'https://nominatim.openstreetmap.org/search' +
          `?q=${encodeURIComponent(searchText.trim())}` +
          '&format=json&limit=8&addressdetails=1';

        const response = await fetch(url, {
          headers: { 'Accept-Language': 'en' },
        });

        if (!response.ok) {
          throw new Error('City search failed');
        }

        const data = await response.json();

        const cityTypes = [
          'city',
          'town',
          'village',
          'municipality',
        ];

        const filtered = data.filter((item) => {
          return (
            cityTypes.includes(item.type) ||
            cityTypes.includes(item.addresstype)
          );
        });

        if (isActive) {
          setSuggestions(
            filtered.length > 0 ? filtered : data.slice(0, 6)
          );
        }
      } catch (searchError) {
        if (isActive) {
          setSuggestions([]);
        }
      } finally {
        if (isActive) {
          setSearchLoading(false);
        }
      }
    }, 500);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [searchText]);

  function handleCitySelect(selectedCity, selectedCountry) {
    if (!selectedCity || !selectedCountry) {
      return;
    }

    dispatch(setCity(selectedCity));
    dispatch(setCountry(selectedCountry));

    dispatch(
      fetchPrayerTimes({
        city: selectedCity,
        country: selectedCountry,
      })
    );

    setModalVisible(false);
    setSearchText('');
    setSuggestions([]);
  }

  function parseSuggestion(item) {
    const address = item.address || {};

    const cityName =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      item.display_name.split(',')[0].trim();

    const countryName =
      address.country ||
      item.display_name.split(',').pop().trim() ||
      'Unknown';

    const stateName = address.state || address.region || '';

    return { cityName, countryName, stateName };
  }

  const prayers = [
    { name: 'Fajr', time: timings ? timings.Fajr : '--:--', icon: '🌙' },
    { name: 'Dhuhr', time: timings ? timings.Dhuhr : '--:--', icon: '☀️' },
    { name: 'Asr', time: timings ? timings.Asr : '--:--', icon: '🌤️' },
    { name: 'Maghrib', time: timings ? timings.Maghrib : '--:--', icon: '🌅' },
    { name: 'Isha', time: timings ? timings.Isha : '--:--', icon: '🌃' },
  ];

  const currentPrayer = timings
    ? getCurrentPrayer(prayers, now)
    : null;

  const today = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  function closeCityModal() {
    setModalVisible(false);
    setSearchText('');
    setSuggestions([]);
  }

  function refreshPrayerTimes() {
    setNow(new Date());
    dispatch(fetchPrayerTimes({ city, country }));
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0d1b2a' }}
      edges={['top', 'left', 'right']}
    >
      <View style={{ flex: 1, backgroundColor: '#0d1b2a' }}>
        <View
          style={{
            backgroundColor: '#1b2d45',
            paddingTop: 20,
            paddingBottom: 35,
            paddingHorizontal: 24,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#c9a84c',
              fontSize: 13,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Daily Prayer Times
          </Text>

          <Text
            style={{
              color: '#ffffff',
              fontSize: 26,
              fontWeight: '700',
              marginBottom: 6,
            }}
          >
            🕌 {city}
          </Text>

          <Text
            style={{
              color: '#7a8fa6',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {country}
          </Text>

          <Text
            style={{
              color: '#7a8fa6',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {today}
          </Text>

          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#0d1b2a',
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: '#c9a84c',
            }}
          >
            <Text
              style={{
                color: '#c9a84c',
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              📍 Change City
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View
              style={{
                alignItems: 'center',
                marginTop: 40,
                marginBottom: 20,
              }}
            >
              <ActivityIndicator size="large" color="#c9a84c" />
              <Text
                style={{
                  color: '#7a8fa6',
                  marginTop: 12,
                  fontSize: 14,
                }}
              >
                Fetching prayer times...
              </Text>
            </View>
          )}

          {!loading && !!error && (
            <View
              style={{
                backgroundColor: '#1b2d45',
                borderWidth: 1,
                borderColor: '#ff6b6b',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#ff6b6b', fontSize: 14 }}>
                {error}
              </Text>
            </View>
          )}

          {!loading &&
            timings &&
            prayers.map((prayer) => {
              const isCurrent = prayer.name === currentPrayer;

              return (
                <View
                  key={prayer.name}
                  style={{
                    backgroundColor: '#1b2d45',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isCurrent ? '#c9a84c' : '#1e3a5f',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: '#0d1b2a',
                        borderRadius: 12,
                        width: 44,
                        height: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>
                        {prayer.icon}
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={{
                          color: isCurrent ? '#c9a84c' : '#7a8fa6',
                          fontSize: 11,
                          letterSpacing: 2,
                          textTransform: 'uppercase',
                        }}
                      >
                        {isCurrent ? 'Current' : 'Prayer'}
                      </Text>

                      <Text
                        style={{
                          color: '#ffffff',
                          fontSize: 17,
                          fontWeight: '600',
                          marginTop: 2,
                        }}
                      >
                        {prayer.name}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      color: isCurrent ? '#c9a84c' : '#ffffff',
                      fontSize: 20,
                      fontWeight: '700',
                      letterSpacing: 1,
                    }}
                  >
                    {prayer.time}
                  </Text>
                </View>
              );
            })}

          <TouchableOpacity
            onPress={refreshPrayerTimes}
            disabled={loading}
            style={{
              backgroundColor: '#c9a84c',
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              marginTop: 8,
              marginBottom: 20,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                color: '#0d1b2a',
                fontWeight: '700',
                fontSize: 15,
                letterSpacing: 1,
              }}
            >
              ↻ Refresh
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeCityModal}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#000000aa',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: '#1b2d45',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                maxHeight: '80%',
                minHeight: 300,
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: '700',
                  marginBottom: 16,
                }}
              >
                🔍 Search City
              </Text>

              <View
                style={{
                  backgroundColor: '#0d1b2a',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#c9a84c',
                  marginBottom: 12,
                }}
              >
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Type city name worldwide..."
                  placeholderTextColor="#7a8fa6"
                  autoFocus
                  style={{
                    flex: 1,
                    color: '#ffffff',
                    fontSize: 15,
                    paddingVertical: 10,
                  }}
                />

                {searchLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#c9a84c"
                  />
                ) : (
                  <Text style={{ color: '#7a8fa6' }}>🔍</Text>
                )}
              </View>

              <FlatList
                data={suggestions}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item) => String(item.place_id)}
                renderItem={({ item }) => {
                  const {
                    cityName,
                    countryName,
                    stateName,
                  } = parseSuggestion(item);

                  return (
                    <TouchableOpacity
                      onPress={() =>
                        handleCitySelect(cityName, countryName)
                      }
                      style={{
                        padding: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: '#1e3a5f',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>📍</Text>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: 15,
                          }}
                        >
                          {cityName}
                        </Text>

                        <Text
                          style={{
                            color: '#7a8fa6',
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {stateName ? `${stateName}, ` : ''}
                          {countryName}
                        </Text>
                      </View>

                      <Text
                        style={{ color: '#c9a84c', fontSize: 12 }}
                      >
                        Select →
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={() => {
                  if (searchLoading) {
                    return (
                      <Text
                        style={{
                          color: '#7a8fa6',
                          textAlign: 'center',
                          marginTop: 20,
                        }}
                      >
                        Searching cities...
                      </Text>
                    );
                  }

                  if (searchText.trim().length >= 2) {
                    return (
                      <Text
                        style={{
                          color: '#7a8fa6',
                          textAlign: 'center',
                          marginTop: 20,
                        }}
                      >
                        No cities found
                      </Text>
                    );
                  }

                  return (
                    <Text
                      style={{
                        color: '#7a8fa6',
                        textAlign: 'center',
                        marginTop: 20,
                      }}
                    >
                      Start typing to search cities worldwide 🌍
                    </Text>
                  );
                }}
              />

              <TouchableOpacity
                onPress={closeCityModal}
                style={{
                  marginTop: 16,
                  padding: 14,
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#1e3a5f',
                }}
              >
                <Text
                  style={{
                    color: '#7a8fa6',
                    fontWeight: '600',
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
