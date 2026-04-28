import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Animated, Alert, TextInput, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { ChevronLeft, Star, Fuel, Gauge, Zap, Users, ShieldCheck, MapPin, Calendar as CalendarIcon, Clock, CreditCard, Banknote } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { PricingService, City } from '@/services/pricing';
import * as Location from 'expo-location';
import { useAuthStore } from '@/store/useAuthStore';
import { bookingsAPI } from '@/services/api';

export default function CarDetailsScreen() {
  const { id, make, model, rate, image } = useLocalSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [pickupLocation, setPickupLocation] = useState('Sydney International Airport');
  const [returnLocation, setReturnLocation] = useState('Sydney International Airport');
  const [pickupDate, setPickupDate] = useState('2026-05-10');
  const [returnDate, setReturnDate] = useState('2026-05-15');
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [returnTime, setReturnTime] = useState('10:00 AM');

  const [selectedCity, setSelectedCity] = useState<City>('Sydney');
  const [days, setDays] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [addons, setAddons] = useState({
    insurance: false,
    gps: false,
    driver: false
  });

  const basePrice = parseFloat(rate as string);
  let addonTotal = 0;
  if (addons.insurance) addonTotal += 50 * days;
  if (addons.gps) addonTotal += 15 * days;
  if (addons.driver) addonTotal += 100 * days;

  const pricing = PricingService.calculateTotal(basePrice, days, selectedCity);
  const finalTotal = pricing.total + addonTotal;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const nextStep = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const bookingData = {
          id: Math.floor(Math.random() * 10000),
          customer_name: user?.name || 'Guest User',
          car_make: make,
          car_model: model,
          pickup_date: pickupDate,
          return_date: returnDate,
          pickup_location: pickupLocation,
          return_location: returnLocation,
          total_amount: finalTotal,
          status: 'confirmed'
        };

        // Save locally for immediate feedback
        const existing = await AsyncStorage.getItem('local_bookings');
        const localBookings = existing ? JSON.parse(existing) : [];
        localBookings.unshift(bookingData);
        await AsyncStorage.setItem('local_bookings', JSON.stringify(localBookings));

        // If not in demo mode, actually try the API
        if (user?.id !== 'DEMO') {
          try {
            await bookingsAPI.create(bookingData);
          } catch (e) {
            console.log('API failed, saved locally instead');
          }
        } else {
          await new Promise(r => setTimeout(r, 1000));
        }

        Alert.alert(
          "Booking Successful",
          `Your reservation for ${make} ${model} is confirmed!`,
          [{ text: "OK", onPress: () => router.replace('/(tabs)/bookings') }]
        );
      } catch (err: any) {
        Alert.alert("Error", "Something went wrong saving your booking.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<'pickup' | 'return'>('pickup');

  const handleLocationPick = async (setter: (v: string) => void) => {
    Alert.alert(
      'Choose Location',
      'Select your pick-up spot:',
      [
        {
          text: 'Use My Current Location',
          onPress: async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') return;
              const loc = await Location.getCurrentPositionAsync({});
              const [address] = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
              if (address) setter(`${address.streetNumber || ''} ${address.street || ''}, ${address.city || ''}`);
            } catch (e) {
              Alert.alert('Error', 'Could not sync location');
            }
          }
        },
        { text: 'Sydney Intl. Airport', onPress: () => setter('Sydney International Airport') },
        { text: 'Melbourne City Center', onPress: () => setter('Melbourne City Center') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCalendar = (target: 'pickup' | 'return') => {
    setCalendarTarget(target);
    setShowCalendar(true);
  };

  const selectDate = (date: string) => {
    if (calendarTarget === 'pickup') setPickupDate(date);
    else setReturnDate(date);
    setShowCalendar(false);
  };

  const handleTimePick = (setter: (v: string) => void) => {
    Alert.alert('Select Time', 'Choose pick-up time:', [
      { text: '09:00 AM', onPress: () => setter('09:00 AM') },
      { text: '10:00 AM', onPress: () => setter('10:00 AM') },
      { text: '12:00 PM', onPress: () => setter('12:00 PM') },
      { text: '02:00 PM', onPress: () => setter('02:00 PM') },
      { text: '05:00 PM', onPress: () => setter('05:00 PM') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.sectionTitle}>1. Pick up & Return Details</Text>
            <TouchableOpacity style={styles.inputGroup} onPress={() => handleLocationPick(setPickupLocation)}>
              <Text style={styles.label}>Pick up Location</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={18} color={Colors.primary} />
                <Text style={styles.inputText}>{pickupLocation}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.inputGroup} onPress={() => handleLocationPick(setReturnLocation)}>
              <Text style={styles.label}>Return Location</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={18} color={Colors.primary} />
                <Text style={styles.inputText}>{returnLocation}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity style={[styles.inputGroup, { flex: 1.5 }]} onPress={() => openCalendar('pickup')}>
                <Text style={styles.label}>Pick up Date</Text>
                <View style={styles.inputWrapper}>
                  <CalendarIcon size={18} color={Colors.primary} />
                  <Text style={styles.inputText}>{pickupDate}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]} onPress={() => handleTimePick(setPickupTime)}>
                <Text style={styles.label}>Time</Text>
                <View style={styles.inputWrapper}>
                  <Clock size={18} color={Colors.primary} />
                  <Text style={styles.inputText}>{pickupTime}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={[styles.inputGroup, { flex: 1.5 }]} onPress={() => openCalendar('return')}>
                <Text style={styles.label}>Return Date</Text>
                <View style={styles.inputWrapper}>
                  <CalendarIcon size={18} color={Colors.primary} />
                  <Text style={styles.inputText}>{returnDate}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]} onPress={() => handleTimePick(setReturnTime)}>
                <Text style={styles.label}>Time</Text>
                <View style={styles.inputWrapper}>
                  <Clock size={18} color={Colors.primary} />
                  <Text style={styles.inputText}>{returnTime}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.sectionTitle}>2. Choose Add-ons</Text>
            <AddonItem
              label="Full Insurance"
              price="$50/day"
              active={addons.insurance}
              onToggle={() => setAddons(p => ({ ...p, insurance: !p.insurance }))}
            />
            <AddonItem
              label="GPS Navigator"
              price="$15/day"
              active={addons.gps}
              onToggle={() => setAddons(p => ({ ...p, gps: !p.gps }))}
            />
            <AddonItem
              label="Pro Driver"
              price="$100/day"
              active={addons.driver}
              onToggle={() => setAddons(p => ({ ...p, driver: !p.driver }))}
            />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.sectionTitle}>3. Payment Method</Text>
            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'card' && styles.activePayment]}
              onPress={() => setPaymentMethod('card')}
            >
              <CreditCard size={24} color={paymentMethod === 'card' ? '#fff' : Colors.primary} />
              <View>
                <Text style={[styles.paymentTitle, paymentMethod === 'card' && styles.activePaymentText]}>Credit / Debit Card</Text>
                <Text style={[styles.paymentSub, paymentMethod === 'card' && styles.activePaymentText]}>Secure payment via Stripe</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'cash' && styles.activePayment]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Banknote size={24} color={paymentMethod === 'cash' ? '#fff' : Colors.primary} />
              <View>
                <Text style={[styles.paymentTitle, paymentMethod === 'cash' && styles.activePaymentText]}>Cash on Pickup</Text>
                <Text style={[styles.paymentSub, paymentMethod === 'cash' && styles.activePaymentText]}>Pay at the rental counter</Text>
              </View>
            </TouchableOpacity>
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.sectionTitle}>4. Booking Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Car</Text>
                <Text style={styles.summaryValue}>{make} {model}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pick-up</Text>
                <Text style={styles.summaryValue}>{pickupDate} at {pickupTime}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Return</Text>
                <Text style={styles.summaryValue}>{returnDate} at {returnTime}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total Price</Text>
                <Text style={styles.summaryTotalValue}>${finalTotal}</Text>
              </View>
            </View>
            <View style={styles.guaranteeBox}>
              <ShieldCheck size={20} color={Colors.success} />
              <Text style={styles.guaranteeText}>Best price guarantee and free cancellation up to 24h before pickup.</Text>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
          <ChevronLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Step {step} of 4</Text>
        <View style={styles.stepIndicator}>
          {[1, 2, 3, 4].map(s => (
            <View key={s} style={[styles.stepDot, step >= s && styles.activeDot]} />
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: (image as string) || 'https://images.remote.com/car-placeholder.png' }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <Animated.View style={[styles.infoContainer, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>${finalTotal.toFixed(0)}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={nextStep}
        >
          <Text style={styles.bookBtnText}>
            {step === 4 ? 'Confirm & Book' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Simulated Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <Text style={styles.modalTitle}>Select {calendarTarget === 'pickup' ? 'Pick-up' : 'Return'} Date</Text>
            <Text style={styles.modalSubtitle}>May 2026</Text>

            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={`day-header-${i}`} style={styles.dayLabel}>{d}</Text>
              ))}
              {[...Array(9)].map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
              {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(d => (
                <TouchableOpacity
                  key={`date-${d}`}
                  style={[styles.dayCell, (calendarTarget === 'pickup' ? pickupDate : returnDate) === `2026-05-${d}` && styles.activeDay]}
                  onPress={() => selectDate(`2026-05-${d}`)}
                >
                  <Text style={[styles.dayText, (calendarTarget === 'pickup' ? pickupDate : returnDate) === `2026-05-${d}` && styles.activeDayText]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.closeModal} onPress={() => setShowCalendar(false)}>
              <Text style={styles.closeModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AddonItem({ label, price, active, onToggle }: any) {
  return (
    <TouchableOpacity
      style={[styles.addonItem, active && styles.activeAddon]}
      onPress={onToggle}
    >
      <View style={styles.addonLeft}>
        <View style={[styles.checkbox, active && styles.checked]}>
          {active && <ShieldCheck size={14} color="#fff" />}
        </View>
        <Text style={[styles.addonLabel, active && styles.activeAddonText]}>{label}</Text>
      </View>
      <Text style={[styles.addonPrice, active && styles.activeAddonText]}>{price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 12,
  },
  scroll: {
    paddingBottom: 150,
  },
  imageContainer: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '80%',
    height: '100%',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 500,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  addonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeAddon: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  addonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  addonPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activeAddonText: {
    color: '#fff',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePayment: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  paymentSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activePaymentText: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 25,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  inputText: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayLabel: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  dayCell: {
    width: '14%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  activeDay: {
    backgroundColor: Colors.primary,
  },
  activeDayText: {
    color: '#fff',
  },
  closeModal: {
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#FF4444',
    fontWeight: '800',
    fontSize: 16,
  },

  summaryTotalLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '900',
  },
  summaryTotalValue: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '900',
  },
  guaranteeBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    lineHeight: 18,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 20,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
