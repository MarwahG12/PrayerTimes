import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';

function convertTo12Hour(time) {
  if (!time) {
    return '--:--';
  }

  const [hourString, minute] = time.split(':');

  let hour = Number(hourString);

  const ampm = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${ampm}`;
}

export const fetchPrayerTimes = createAsyncThunk(
  'prayer/fetchPrayerTimes',

  async ({ city, country }, { rejectWithValue }) => {
    try {
      const today = new Date();

      const date =
        `${today.getDate()}-` +
        `${today.getMonth() + 1}-` +
        `${today.getFullYear()}`;

      const url =
        `https://api.aladhan.com/v1/timingsByCity/${date}` +
        `?city=${encodeURIComponent(city)}` +
        `&country=${encodeURIComponent(country)}` +
        '&method=1';

      const response = await fetch(url);

      if (!response.ok) {
        return rejectWithValue(
          'Prayer times service is currently unavailable.'
        );
      }

      const result = await response.json();

      if (
        result.code !== 200 ||
        !result.data ||
        !result.data.timings
      ) {
        return rejectWithValue(
          'Prayer timings were not found for this city.'
        );
      }

      const times = result.data.timings;

      return {
        Fajr: convertTo12Hour(times.Fajr),
        Dhuhr: convertTo12Hour(times.Dhuhr),
        Asr: convertTo12Hour(times.Asr),
        Maghrib: convertTo12Hour(times.Maghrib),
        Isha: convertTo12Hour(times.Isha),
      };
    } catch (error) {
      return rejectWithValue(
        'Network error. Check your internet connection.'
      );
    }
  }
);

const initialState = {
  timings: null,
  city: 'Sargodha',
  country: 'Pakistan',
  loading: false,
  error: null,
};

const prayerSlice = createSlice({
  name: 'prayer',

  initialState,

  reducers: {
    setCity: (state, action) => {
      state.city = action.payload;
    },

    setCountry: (state, action) => {
      state.country = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPrayerTimes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPrayerTimes.fulfilled, (state, action) => {
        state.loading = false;
        state.timings = action.payload;
        state.error = null;
      })

      .addCase(fetchPrayerTimes.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload ||
          'Could not fetch prayer times. Please try again.';
      });
  },
});

export const { setCity, setCountry } = prayerSlice.actions;

export default prayerSlice.reducer;