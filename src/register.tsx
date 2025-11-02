import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './utiliti/config';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Enhanced theme for professional look
const theme = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  secondary: '#0EA5E9',
  accent: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { width, height } = Dimensions.get('window');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const alertSlideAnim = useRef(new Animated.Value(-100)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [gender, setGender] = useState('male');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Verification states
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showPhoneOTPModal, setShowPhoneOTPModal] = useState(false);
  const [showEmailOTPModal, setShowEmailOTPModal] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState(['', '', '', '', '', '']);
  const [emailOTP, setEmailOTP] = useState(['', '', '', '', '', '']);
  const phoneOTPFRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
  const emailOTPFRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
  const [phoneConfirmation, setPhoneConfirmation] = useState<any>(null);
  const [emailOTPGenerated, setEmailOTPGenerated] = useState('');
  const [sendingOTP, setSendingOTP] = useState({ phone: false, email: false });
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  // Animation for screen entry
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.elastic(0.8),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Clean up registration flag when component unmounts
  useEffect(() => {
    return () => {
      AsyncStorage.removeItem('isRegistering');
    };
  }, []);

  // Toast alert animation (slide from top)
  const showQuickAlert = (message: string, type: string = 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
    Animated.sequence([
      Animated.timing(alertSlideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(alertSlideAnim, {
        toValue: -100,
        duration: 300,
        delay: 2500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAlertVisible(false);
      setAlertMessage('');
    });
  };

  // Button highlight animation
  const triggerButtonHighlight = () => {
    Animated.sequence([
      Animated.timing(buttonAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validateIndianPhoneNumber = (number: string) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(number);
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
    return regex.test(password);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateOfBirth;
    setShowDatePicker(Platform.OS === 'ios');
    setDateOfBirth(currentDate);
  };

  // Phone verification functions
  const handleSendPhoneOTP = async () => {
    if (!phone) {
      showQuickAlert('Please enter a phone number', 'error');
      return;
    }
    if (!validateIndianPhoneNumber(phone)) {
      showQuickAlert('Please enter a valid Indian phone number', 'error');
      return;
    }
    triggerButtonHighlight();
    showQuickAlert('Sending OTP to phone...', 'success');
    try {
      setSendingOTP({ ...sendingOTP, phone: true });
      // Set flag to indicate we're in registration process
      await AsyncStorage.setItem('isRegistering', 'true');
      const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
      setPhoneConfirmation(confirmation);
      setShowPhoneOTPModal(true);
    } catch (error: any) {
      console.error('Phone OTP error:', error.code, error.message);
      showQuickAlert('Failed to send OTP. Please try again.', 'error');
      // Clear flag on error
      await AsyncStorage.removeItem('isRegistering');
    } finally {
      setSendingOTP({ ...sendingOTP, phone: false });
    }
  };

  const handlePhoneOTPChange = async (text: string, index: number) => {
    const newOTP = [...phoneOTP];
    newOTP[index] = text;
    setPhoneOTP(newOTP);
    if (text && index < 5) {
      phoneOTPFRefs.current[index + 1]?.focus();
    }
    // Auto-verify when 6 digits are entered
    if (index === 5 && text) {
      const otp = newOTP.join('');
      if (otp.length === 6) {
        try {
          setLoading(true);
          await phoneConfirmation.confirm(otp);
          // Immediately sign out to prevent automatic navigation
          await auth().signOut();
          setPhoneVerified(true);
          setShowPhoneOTPModal(false);
          setPhoneOTP(['', '', '', '', '', '']);
          showQuickAlert('Phone number verified successfully', 'success');
        } catch (error: any) {
          console.error('Phone OTP verification error:', error.code, error.message);
          showQuickAlert('Invalid OTP', 'error');
          setPhoneOTP(['', '', '', '', '', '']); // Reset OTP on failure
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handlePhoneOTPKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !phoneOTP[index] && index > 0) {
      phoneOTPFRefs.current[index - 1]?.focus();
    }
  };

  const getPhoneOTPValue = () => {
    return phoneOTP.join('');
  };

  const handleVerifyPhoneOTP = async () => {
    const otp = getPhoneOTPValue();
    if (otp.length !== 6) {
      showQuickAlert('Please enter a 6-digit OTP', 'error');
      return;
    }
    triggerButtonHighlight();
    try {
      setLoading(true);
      await phoneConfirmation.confirm(otp);
      // Immediately sign out to prevent automatic navigation
      await auth().signOut();
      setPhoneVerified(true);
      setShowPhoneOTPModal(false);
      setPhoneOTP(['', '', '', '', '', '']);
      showQuickAlert('Phone number verified successfully', 'success');
    } catch (error: any) {
      console.error('Phone OTP verification error:', error.code, error.message);
      showQuickAlert('Invalid OTP', 'error');
      setPhoneOTP(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  // Email verification functions
  const handleSendEmailOTP = async () => {
    if (!email) {
      showQuickAlert('Please enter an email address', 'error');
      return;
    }
    if (!validateEmail(email)) {
      showQuickAlert('Please enter a valid email address', 'error');
      return;
    }
    triggerButtonHighlight();
    showQuickAlert('Sending OTP to email...', 'success');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setEmailOTPGenerated(otp);
    try {
      setSendingOTP({ ...sendingOTP, email: true });
      const response = await fetch(`${API_URL}/api/auth/send-otp-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || 'User',
          otp,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowEmailOTPModal(true);
      } else {
        showQuickAlert(data.message || 'Failed to send OTP', 'error');
      }
    } catch (error: any) {
      console.error('Email OTP error:', error);
      showQuickAlert('Failed to send OTP. Please check your connection', 'error');
    } finally {
      setSendingOTP({ ...sendingOTP, email: false });
    }
  };

  const handleEmailOTPChange = (text: string, index: number) => {
    const newOTP = [...emailOTP];
    newOTP[index] = text;
    setEmailOTP(newOTP);
    if (text && index < 5) {
      emailOTPFRefs.current[index + 1]?.focus();
    }
    // Auto-verify when 6 digits are entered
    if (index === 5 && text) {
      const otp = newOTP.join('');
      if (otp.length === 6) {
        try {
          setLoading(true);
          if (otp === emailOTPGenerated) {
            setEmailVerified(true);
            setShowEmailOTPModal(false);
            setEmailOTP(['', '', '', '', '', '']);
            showQuickAlert('Email verified successfully', 'success');
          } else {
            showQuickAlert('Invalid OTP', 'error');
            setEmailOTP(['', '', '', '', '', '']);
          }
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleEmailOTPKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !emailOTP[index] && index > 0) {
      emailOTPFRefs.current[index - 1]?.focus();
    }
  };

  const getEmailOTPValue = () => {
    return emailOTP.join('');
  };

  const handleVerifyEmailOTP = () => {
    const otp = getEmailOTPValue();
    if (otp.length !== 6) {
      showQuickAlert('Please enter a 6-digit OTP', 'error');
      return;
    }
    triggerButtonHighlight();
    try {
      setLoading(true);
      if (otp === emailOTPGenerated) {
        setEmailVerified(true);
        setShowEmailOTPModal(false);
        setEmailOTP(['', '', '', '', '', '']);
        showQuickAlert('Email verified successfully', 'success');
      } else {
        showQuickAlert('Invalid OTP', 'error');
        setEmailOTP(['', '', '', '', '', '']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !phone || !email || !password || !confirmPassword) {
      showQuickAlert('Please fill all fields', 'error');
      return;
    }
    if (!validateIndianPhoneNumber(phone)) {
      showQuickAlert('Please enter a valid Indian phone number', 'error');
      return;
    }
    if (!validateEmail(email)) {
      showQuickAlert('Please enter a valid email address', 'error');
      return;
    }
    if (!validatePassword(password)) {
      showQuickAlert(
        'Password must contain at least 1 uppercase, 1 lowercase, 1 special character, 1 number, and be 8-15 characters long',
        'error'
      );
      return;
    }
    if (password !== confirmPassword) {
      showQuickAlert('Passwords do not match', 'error');
      return;
    }
    if (!phoneVerified && !emailVerified) {
      showQuickAlert('Please verify either your phone number or email address', 'error');
      return;
    }
    setLoading(true);
    try {
      const formattedDateOfBirth = dateOfBirth.toISOString().split('T')[0];
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          dateOfBirth: formattedDateOfBirth,
          gender,
          isPhoneVerified: phoneVerified,
          isEmailVerified: emailVerified,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // Clear registration flag and navigate to Main
        await AsyncStorage.removeItem('isRegistering');
        showQuickAlert('Registration successful!', 'success');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        showQuickAlert(data.message || 'Registration failed', 'error');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      showQuickAlert(`Network error: ${error.message}. Please check your connection and try again.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isPhoneValid = validateIndianPhoneNumber(phone);
  const isEmailValid = validateEmail(email);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
      {/* Background with gradient circles */}
      <View style={styles.background}>
        <View style={[styles.gradientCircle, styles.circle1]} />
        <View style={[styles.gradientCircle, styles.circle2]} />
        <View style={[styles.gradientCircle, styles.circle3]} />
        <View style={[styles.gradientCircle, styles.circle4]} />
      </View>
      {/* Quick Alert */}
     {alertVisible && (
  <Animated.View
    style={[
      styles.alertContainer,
      {
        transform: [{ translateY: alertSlideAnim }],
        backgroundColor: alertType === 'success' ? theme.success : theme.error,
      },
    ]}
  >
    <Icon
      name={alertType === 'success' ? 'check-circle' : 'error'}
      size={20}
      color="#FFF"
      style={styles.alertIcon}
    />
    <Text style={styles.alertText}>{alertMessage}</Text>
  </Animated.View>
)}

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Animated Logo */}
        <Animated.View
          style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2504/2504957.png' }}
              style={styles.logo}
            />
          </View>
          <Text style={styles.appName}>Reals TO Chat</Text>
          <Text style={styles.tagline}>Create. Connect. Chat.</Text>
        </Animated.View>
        {/* Registration Form */}
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>Create Account</Text>
            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
                importantForAutofill="no"
                textContentType="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <View style={styles.phoneInputWrapper}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Phone Number"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="none"
                />
              </View>
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    phoneVerified ? styles.verifiedButton : isPhoneValid ? styles.validButton : styles.unverifiedButton,
                    (sendingOTP.phone || loading) && styles.disabledButton,
                  ]}
                  onPress={handleSendPhoneOTP}
                  disabled={phoneVerified || sendingOTP.phone || loading || !isPhoneValid}
                >
                  {sendingOTP.phone ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : phoneVerified ? (
                    <Icon name="check-circle" size={20} color="#FFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.emailInput}
                placeholder="Email Address"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
                importantForAutofill="no"
                textContentType="none"
              />
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    emailVerified ? styles.verifiedButton : isEmailValid ? styles.validButton : styles.unverifiedButton,
                    (sendingOTP.email || loading) && styles.disabledButton,
                  ]}
                  onPress={handleSendEmailOTP}
                  disabled={emailVerified || sendingOTP.email || loading || !isEmailValid}
                >
                  {sendingOTP.email ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : emailVerified ? (
                    <Icon name="check-circle" size={20} color="#FFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
                importantForAutofill="no"
                textContentType="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
                importantForAutofill="no"
                textContentType="none"
              />
            </View>
            <TouchableOpacity style={styles.datePickerContainer} onPress={() => setShowDatePicker(true)}>
              <Icon name="event" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <Text style={styles.datePickerText}>{formatDate(dateOfBirth)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
            <Text style={styles.genderLabel}>Gender</Text>
            <View style={styles.genderContainer}>
              {['male', 'female', 'other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.genderOption, gender === option && styles.selectedGender]}
                  onPress={() => setGender(option)}
                >
                  <Text style={[styles.genderText, gender === option && styles.selectedGenderText]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, styles.registerButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Create Account</Text>
                  <Icon name="arrow-forward" size={20} color="#FFF" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={styles.cancelButtonText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
      {/* Phone OTP Modal */}
      <Modal
        visible={showPhoneOTPModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhoneOTPModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Phone Number</Text>
              <Text style={styles.modalSubtitle}>Enter the 6-digit code sent to +91{phone}</Text>
            </View>
            <View style={styles.otpContainer}>
              {phoneOTP.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (phoneOTPFRefs.current[index] = ref)}
                  style={styles.otpDigitInput}
                  value={digit}
                  onChangeText={(text) => handlePhoneOTPChange(text, index)}
                  onKeyPress={(e) => handlePhoneOTPKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={index === 0}
                  textAlign="center"
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="none"
                />
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowPhoneOTPModal(false);
                  setPhoneOTP(['', '', '', '', '', '']);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleVerifyPhoneOTP}
                >
                  <Text style={styles.modalButtonPrimaryText}>Verify</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>
      {/* Email OTP Modal */}
      <Modal
        visible={showEmailOTPModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailOTPModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Email Address</Text>
              <Text style={styles.modalSubtitle}>Enter the 6-digit code sent to {email}</Text>
            </View>
            <View style={styles.otpContainer}>
              {emailOTP.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (emailOTPFRefs.current[index] = ref)}
                  style={styles.otpDigitInput}
                  value={digit}
                  onChangeText={(text) => handleEmailOTPChange(text, index)}
                  onKeyPress={(e) => handleEmailOTPKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={index === 0}
                  textAlign="center"
                  autoCorrect={false}
                  spellCheck={false}
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="none"
                />
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowEmailOTPModal(false);
                  setEmailOTP(['', '', '', '', '', '']);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleVerifyEmailOTP}
                >
                  <Text style={styles.modalButtonPrimaryText}>Verify</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.3,
  },
  circle1: {
    width: Dimensions.get('window').width * 1.5,
    height: Dimensions.get('window').width * 1.5,
    backgroundColor: theme.primary,
    top: -Dimensions.get('window').width * 0.7,
    left: -Dimensions.get('window').width * 0.3,
  },
  circle2: {
    width: Dimensions.get('window').width * 1.2,
    height: Dimensions.get('window').width * 1.2,
    backgroundColor: theme.secondary,
    bottom: -Dimensions.get('window').width * 0.5,
    right: -Dimensions.get('window').width * 0.4,
  },
  circle3: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
    backgroundColor: theme.accent,
    bottom: Dimensions.get('window').height * 0.2,
    left: -Dimensions.get('window').width * 0.2,
  },
  circle4: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
    backgroundColor: theme.surface,
    top: Dimensions.get('window').height * 0.3,
    right: -Dimensions.get('window').width * 0.1,
  },
  alertContainer: {
    position: 'absolute',
    top: Dimensions.get('window').height * 0.12,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  alertIcon: {
    marginRight: 8,
  },
  alertText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Dimensions.get('window').height * 0.03,
    marginBottom: 10,
  },
  logoWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: 'white',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: theme.textSecondary,
    letterSpacing: 0.3,
  },
  formContainer: {
    width: '90%',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryCode: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emailInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  verifyButton: {
    width: 70,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unverifiedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  validButton: {
    backgroundColor: theme.primary,
  },
  verifiedButton: {
    backgroundColor: theme.success,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  datePickerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  genderLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  genderOption: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedGender: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  genderText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  selectedGenderText: {
    color: 'white',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    flexDirection: 'row',
  },
  registerButton: {
    backgroundColor: theme.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  otpDigitInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonPrimary: {
    backgroundColor: theme.primary,
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonPrimaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
});

// Memoize to optimize for live real-time app
export default React.memo(RegisterScreen);














































// import React, { useEffect, useRef, useState } from 'react';
// import {
//   Animated,
//   Dimensions,
//   Easing,
//   Image,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   Modal,
//   Platform,
//   ActivityIndicator,
//   KeyboardAvoidingView,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import auth from '@react-native-firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import API_URL from './utiliti/config';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// // Enhanced theme for professional look
// const theme = {
//   background: '#121212',
//   surface: '#1E1E1E',
//   text: '#FFFFFF',
//   textSecondary: 'rgba(255, 255, 255, 0.7)',
//   primary: '#6366F1',
//   primaryLight: '#818CF8',
//   secondary: '#0EA5E9',
//   accent: '#8B5CF6',
//   success: '#10B981',
//   error: '#EF4444',
//   warning: '#F59E0B',
// };

// const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
//   const { width, height } = Dimensions.get('window');
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(30)).current;
//   const scaleAnim = useRef(new Animated.Value(0.9)).current;
//   const alertSlideAnim = useRef(new Animated.Value(-100)).current;
//   const buttonAnim = useRef(new Animated.Value(1)).current;
  
//   // Form state
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [dateOfBirth, setDateOfBirth] = useState(new Date());
//   const [gender, setGender] = useState('male');
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [loading, setLoading] = useState(false);
  
//   // Verification states
//   const [phoneVerified, setPhoneVerified] = useState(false);
//   const [emailVerified, setEmailVerified] = useState(false);
//   const [showPhoneOTPModal, setShowPhoneOTPModal] = useState(false);
//   const [showEmailOTPModal, setShowEmailOTPModal] = useState(false);
//   const [phoneOTP, setPhoneOTP] = useState(['', '', '', '', '', '']);
//   const [emailOTP, setEmailOTP] = useState(['', '', '', '', '', '']);
//   const phoneOTPFRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
//   const emailOTPFRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
//   const [phoneConfirmation, setPhoneConfirmation] = useState<any>(null);
//   const [emailOTPGenerated, setEmailOTPGenerated] = useState('');
//   const [sendingOTP, setSendingOTP] = useState({ phone: false, email: false });
  
//   // Alert state
//   const [alertVisible, setAlertVisible] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertType, setAlertType] = useState('error');

//   // Animation for screen entry
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 700,
//         easing: Easing.out(Easing.back(1)),
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 900,
//         easing: Easing.elastic(0.8),
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, [fadeAnim, slideAnim, scaleAnim]);

//   // Clean up registration flag when component unmounts
//   useEffect(() => {
//     return () => {
//       AsyncStorage.removeItem('isRegistering');
//     };
//   }, []);

//   // Toast alert animation (slide from top)
//   const showQuickAlert = (message: string, type: string = 'error') => {
//     setAlertMessage(message);
//     setAlertType(type);
//     setAlertVisible(true);
//     Animated.sequence([
//       Animated.timing(alertSlideAnim, {
//         toValue: 0,
//         duration: 300,
//         easing: Easing.out(Easing.ease),
//         useNativeDriver: true,
//       }),
//       Animated.timing(alertSlideAnim, {
//         toValue: -100,
//         duration: 300,
//         delay: 2500,
//         easing: Easing.in(Easing.ease),
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       setAlertVisible(false);
//       setAlertMessage('');
//     });
//   };

//   // Button highlight animation
//   const triggerButtonHighlight = () => {
//     Animated.sequence([
//       Animated.timing(buttonAnim, {
//         toValue: 1.05,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//       Animated.timing(buttonAnim, {
//         toValue: 1,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const validateIndianPhoneNumber = (number: string) => {
//     const regex = /^[6-9]\d{9}$/;
//     return regex.test(number);
//   };

//   const validateEmail = (email: string) => {
//     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return regex.test(email);
//   };

//   const validatePassword = (password: string) => {
//     const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
//     return regex.test(password);
//   };

//   const handleDateChange = (event: any, selectedDate?: Date) => {
//     const currentDate = selectedDate || dateOfBirth;
//     setShowDatePicker(Platform.OS === 'ios');
//     setDateOfBirth(currentDate);
//   };

//   // Phone verification functions
//   const handleSendPhoneOTP = async () => {
//     if (!phone) {
//       showQuickAlert('Please enter a phone number', 'error');
//       return;
//     }
//     if (!validateIndianPhoneNumber(phone)) {
//       showQuickAlert('Please enter a valid Indian phone number', 'error');
//       return;
//     }
//     triggerButtonHighlight();
//     showQuickAlert('Sending OTP to phone...', 'success');
//     try {
//       setSendingOTP({ ...sendingOTP, phone: true });
//       // Set flag to indicate we're in registration process
//       await AsyncStorage.setItem('isRegistering', 'true');
//       const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
//       setPhoneConfirmation(confirmation);
//       setShowPhoneOTPModal(true);
//     } catch (error: any) {
//       console.error('Phone OTP error:', error.code, error.message);
//       showQuickAlert('Failed to send OTP. Please try again.', 'error');
//       // Clear flag on error
//       await AsyncStorage.removeItem('isRegistering');
//     } finally {
//       setSendingOTP({ ...sendingOTP, phone: false });
//     }
//   };

//   const handlePhoneOTPChange = async (text: string, index: number) => {
//     const newOTP = [...phoneOTP];
//     newOTP[index] = text;
//     setPhoneOTP(newOTP);
//     if (text && index < 5) {
//       phoneOTPFRefs.current[index + 1]?.focus();
//     }
//     // Auto-verify when 6 digits are entered
//     if (index === 5 && text) {
//       const otp = newOTP.join('');
//       if (otp.length === 6) {
//         try {
//           setLoading(true);
//           await phoneConfirmation.confirm(otp);
//           // Immediately sign out to prevent automatic navigation
//           await auth().signOut();
//           setPhoneVerified(true);
//           setShowPhoneOTPModal(false);
//           setPhoneOTP(['', '', '', '', '', '']);
//           showQuickAlert('Phone number verified successfully', 'success');
//         } catch (error: any) {
//           console.error('Phone OTP verification error:', error.code, error.message);
//           showQuickAlert('Invalid OTP', 'error');
//           setPhoneOTP(['', '', '', '', '', '']); // Reset OTP on failure
//         } finally {
//           setLoading(false);
//         }
//       }
//     }
//   };

//   const handlePhoneOTPKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === 'Backspace' && !phoneOTP[index] && index > 0) {
//       phoneOTPFRefs.current[index - 1]?.focus();
//     }
//   };

//   const getPhoneOTPValue = () => {
//     return phoneOTP.join('');
//   };

//   const handleVerifyPhoneOTP = async () => {
//     const otp = getPhoneOTPValue();
//     if (otp.length !== 6) {
//       showQuickAlert('Please enter a 6-digit OTP', 'error');
//       return;
//     }
//     triggerButtonHighlight();
//     try {
//       setLoading(true);
//       await phoneConfirmation.confirm(otp);
//       // Immediately sign out to prevent automatic navigation
//       await auth().signOut();
//       setPhoneVerified(true);
//       setShowPhoneOTPModal(false);
//       setPhoneOTP(['', '', '', '', '', '']);
//       showQuickAlert('Phone number verified successfully', 'success');
//     } catch (error: any) {
//       console.error('Phone OTP verification error:', error.code, error.message);
//       showQuickAlert('Invalid OTP', 'error');
//       setPhoneOTP(['', '', '', '', '', '']);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Email verification functions
//   const handleSendEmailOTP = async () => {
//     if (!email) {
//       showQuickAlert('Please enter an email address', 'error');
//       return;
//     }
//     if (!validateEmail(email)) {
//       showQuickAlert('Please enter a valid email address', 'error');
//       return;
//     }
//     triggerButtonHighlight();
//     showQuickAlert('Sending OTP to email...', 'success');
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     setEmailOTPGenerated(otp);
//     try {
//       setSendingOTP({ ...sendingOTP, email: true });
//       const response = await fetch(`${API_URL}/api/auth/send-otp-email`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           email,
//           name: name || 'User',
//           otp,
//         }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setShowEmailOTPModal(true);
//       } else {
//         showQuickAlert(data.message || 'Failed to send OTP', 'error');
//       }
//     } catch (error: any) {
//       console.error('Email OTP error:', error);
//       showQuickAlert('Failed to send OTP. Please check your connection', 'error');
//     } finally {
//       setSendingOTP({ ...sendingOTP, email: false });
//     }
//   };

//   const handleEmailOTPChange = (text: string, index: number) => {
//     const newOTP = [...emailOTP];
//     newOTP[index] = text;
//     setEmailOTP(newOTP);
//     if (text && index < 5) {
//       emailOTPFRefs.current[index + 1]?.focus();
//     }
//     // Auto-verify when 6 digits are entered
//     if (index === 5 && text) {
//       const otp = newOTP.join('');
//       if (otp.length === 6) {
//         try {
//           setLoading(true);
//           if (otp === emailOTPGenerated) {
//             setEmailVerified(true);
//             setShowEmailOTPModal(false);
//             setEmailOTP(['', '', '', '', '', '']);
//             showQuickAlert('Email verified successfully', 'success');
//           } else {
//             showQuickAlert('Invalid OTP', 'error');
//             setEmailOTP(['', '', '', '', '', '']);
//           }
//         } finally {
//           setLoading(false);
//         }
//       }
//     }
//   };

//   const handleEmailOTPKeyPress = (e: any, index: number) => {
//     if (e.nativeEvent.key === 'Backspace' && !emailOTP[index] && index > 0) {
//       emailOTPFRefs.current[index - 1]?.focus();
//     }
//   };

//   const getEmailOTPValue = () => {
//     return emailOTP.join('');
//   };

//   const handleVerifyEmailOTP = () => {
//     const otp = getEmailOTPValue();
//     if (otp.length !== 6) {
//       showQuickAlert('Please enter a 6-digit OTP', 'error');
//       return;
//     }
//     triggerButtonHighlight();
//     try {
//       setLoading(true);
//       if (otp === emailOTPGenerated) {
//         setEmailVerified(true);
//         setShowEmailOTPModal(false);
//         setEmailOTP(['', '', '', '', '', '']);
//         showQuickAlert('Email verified successfully', 'success');
//       } else {
//         showQuickAlert('Invalid OTP', 'error');
//         setEmailOTP(['', '', '', '', '', '']);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async () => {
//     if (!name || !phone || !email || !password || !confirmPassword) {
//       showQuickAlert('Please fill all fields', 'error');
//       return;
//     }
//     if (!validateIndianPhoneNumber(phone)) {
//       showQuickAlert('Please enter a valid Indian phone number', 'error');
//       return;
//     }
//     if (!validateEmail(email)) {
//       showQuickAlert('Please enter a valid email address', 'error');
//       return;
//     }
//     if (!validatePassword(password)) {
//       showQuickAlert(
//         'Password must contain at least 1 uppercase, 1 lowercase, 1 special character, 1 number, and be 8-15 characters long',
//         'error'
//       );
//       return;
//     }
//     if (password !== confirmPassword) {
//       showQuickAlert('Passwords do not match', 'error');
//       return;
//     }
//     if (!phoneVerified && !emailVerified) {
//       showQuickAlert('Please verify either your phone number or email address', 'error');
//       return;
//     }
//     setLoading(true);
//     try {
//       const formattedDateOfBirth = dateOfBirth.toISOString().split('T')[0];
//       const response = await fetch(`${API_URL}/api/auth/register`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           name,
//           phone,
//           email,
//           password,
//           dateOfBirth: formattedDateOfBirth,
//           gender,
//           isPhoneVerified: phoneVerified,
//           isEmailVerified: emailVerified,
//         }),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         // Clear registration flag and navigate to home
//         await AsyncStorage.removeItem('isRegistering');
//         showQuickAlert('Registration successful!', 'success');
//         navigation.navigate('Login');
//       } else {
//         showQuickAlert(data.message || 'Registration failed', 'error');
//       }
//     } catch (error: any) {
//       console.error('Registration error:', error);
//       showQuickAlert(`Network error: ${error.message}. Please check your connection and try again.`, 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date: Date) => {
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const isPhoneValid = validateIndianPhoneNumber(phone);
//   const isEmailValid = validateEmail(email);

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.background} />
//       {/* Background with gradient circles */}
//       <View style={styles.background}>
//         <View style={[styles.gradientCircle, styles.circle1]} />
//         <View style={[styles.gradientCircle, styles.circle2]} />
//         <View style={[styles.gradientCircle, styles.circle3]} />
//         <View style={[styles.gradientCircle, styles.circle4]} />
//       </View>
//       {/* Quick Alert */}
//      {alertVisible && (
//   <Animated.View
//     style={[
//       styles.alertContainer,
//       {
//         transform: [{ translateY: alertSlideAnim }],
//         backgroundColor: alertType === 'success' ? theme.success : theme.error,
//       },
//     ]}
//   >
//     <Icon
//       name={alertType === 'success' ? 'check-circle' : 'error'}
//       size={20}
//       color="#FFF"
//       style={styles.alertIcon}
//     />
//     <Text style={styles.alertText}>{alertMessage}</Text>
//   </Animated.View>
// )}

//       {/* Content */}
//       <KeyboardAvoidingView
//         style={styles.content}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
//       >
//         {/* Animated Logo */}
//         <Animated.View
//           style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}
//         >
//           <View style={styles.logoWrapper}>
//             <Image
//               source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2504/2504957.png' }}
//               style={styles.logo}
//             />
//           </View>
//           <Text style={styles.appName}>Reals TO Chat</Text>
//           <Text style={styles.tagline}>Create. Connect. Chat.</Text>
//         </Animated.View>
//         {/* Registration Form */}
//         <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
//           <ScrollView
//             contentContainerStyle={styles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//           >
//             <Text style={styles.sectionTitle}>Create Account</Text>
//             <View style={styles.inputContainer}>
//               <Icon name="person" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Full Name"
//                 placeholderTextColor={theme.textSecondary}
//                 value={name}
//                 onChangeText={setName}
//                 autoCapitalize="words"
//                 autoCorrect={false}
//                 spellCheck={false}
//                 autoComplete="off"
//                 importantForAutofill="no"
//                 textContentType="none"
//               />
//             </View>
//             <View style={styles.inputContainer}>
//               <Icon name="phone" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//               <View style={styles.phoneInputWrapper}>
//                 <Text style={styles.countryCode}>+91</Text>
//                 <TextInput
//                   style={styles.phoneInput}
//                   placeholder="Phone Number"
//                   placeholderTextColor={theme.textSecondary}
//                   keyboardType="phone-pad"
//                   value={phone}
//                   onChangeText={setPhone}
//                   maxLength={10}
//                   autoCorrect={false}
//                   spellCheck={false}
//                   autoComplete="off"
//                   importantForAutofill="no"
//                   textContentType="none"
//                 />
//               </View>
//               <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
//                 <TouchableOpacity
//                   style={[
//                     styles.verifyButton,
//                     phoneVerified ? styles.verifiedButton : isPhoneValid ? styles.validButton : styles.unverifiedButton,
//                     (sendingOTP.phone || loading) && styles.disabledButton,
//                   ]}
//                   onPress={handleSendPhoneOTP}
//                   disabled={phoneVerified || sendingOTP.phone || loading || !isPhoneValid}
//                 >
//                   {sendingOTP.phone ? (
//                     <ActivityIndicator size="small" color="#FFF" />
//                   ) : phoneVerified ? (
//                     <Icon name="check-circle" size={20} color="#FFF" />
//                   ) : (
//                     <Text style={styles.verifyButtonText}>Verify</Text>
//                   )}
//                 </TouchableOpacity>
//               </Animated.View>
//             </View>
//             <View style={styles.inputContainer}>
//               <Icon name="email" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//               <TextInput
//                 style={styles.emailInput}
//                 placeholder="Email Address"
//                 placeholderTextColor={theme.textSecondary}
//                 keyboardType="email-address"
//                 value={email}
//                 onChangeText={setEmail}
//                 autoCapitalize="none"
//                 autoCorrect={false}
//                 spellCheck={false}
//                 autoComplete="off"
//                 importantForAutofill="no"
//                 textContentType="none"
//               />
//               <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
//                 <TouchableOpacity
//                   style={[
//                     styles.verifyButton,
//                     emailVerified ? styles.verifiedButton : isEmailValid ? styles.validButton : styles.unverifiedButton,
//                     (sendingOTP.email || loading) && styles.disabledButton,
//                   ]}
//                   onPress={handleSendEmailOTP}
//                   disabled={emailVerified || sendingOTP.email || loading || !isEmailValid}
//                 >
//                   {sendingOTP.email ? (
//                     <ActivityIndicator size="small" color="#FFF" />
//                   ) : emailVerified ? (
//                     <Icon name="check-circle" size={20} color="#FFF" />
//                   ) : (
//                     <Text style={styles.verifyButtonText}>Verify</Text>
//                   )}
//                 </TouchableOpacity>
//               </Animated.View>
//             </View>
//             <View style={styles.inputContainer}>
//               <Icon name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Password"
//                 placeholderTextColor={theme.textSecondary}
//                 secureTextEntry
//                 value={password}
//                 onChangeText={setPassword}
//                 autoCapitalize="none"
//                 autoCorrect={false}
//                 spellCheck={false}
//                 autoComplete="off"
//                 importantForAutofill="no"
//                 textContentType="none"
//               />
//             </View>
//             <View style={styles.inputContainer}>
//               <Icon name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Confirm Password"
//                 placeholderTextColor={theme.textSecondary}
//                 secureTextEntry
//                 value={confirmPassword}
//                 onChangeText={setConfirmPassword}
//                 autoCapitalize="none"
//                 autoCorrect={false}
//                 spellCheck={false}
//                 autoComplete="off"
//                 importantForAutofill="no"
//                 textContentType="none"
//               />
//             </View>
//             <TouchableOpacity style={styles.datePickerContainer} onPress={() => setShowDatePicker(true)}>
//               <Icon name="event" size={20} color={theme.textSecondary} style={styles.inputIcon} />
//               <Text style={styles.datePickerText}>{formatDate(dateOfBirth)}</Text>
//             </TouchableOpacity>
//             {showDatePicker && (
//               <DateTimePicker
//                 value={dateOfBirth}
//                 mode="date"
//                 display="default"
//                 onChange={handleDateChange}
//                 maximumDate={new Date()}
//               />
//             )}
//             <Text style={styles.genderLabel}>Gender</Text>
//             <View style={styles.genderContainer}>
//               {['male', 'female', 'other'].map((option) => (
//                 <TouchableOpacity
//                   key={option}
//                   style={[styles.genderOption, gender === option && styles.selectedGender]}
//                   onPress={() => setGender(option)}
//                 >
//                   <Text style={[styles.genderText, gender === option && styles.selectedGenderText]}>
//                     {option.charAt(0).toUpperCase() + option.slice(1)}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <TouchableOpacity
//               style={[styles.button, styles.registerButton, loading && styles.disabledButton]}
//               onPress={handleSubmit}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator size="small" color="#FFFFFF" />
//               ) : (
//                 <>
//                   <Text style={styles.buttonText}>Create Account</Text>
//                   <Icon name="arrow-forward" size={20} color="#FFF" style={styles.buttonIcon} />
//                 </>
//               )}
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
//               <Text style={styles.cancelButtonText}>Already have an account? Sign In</Text>
//             </TouchableOpacity>
//           </ScrollView>
//         </Animated.View>
//       </KeyboardAvoidingView>
//       {/* Phone OTP Modal */}
//       <Modal
//         visible={showPhoneOTPModal}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setShowPhoneOTPModal(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Verify Phone Number</Text>
//               <Text style={styles.modalSubtitle}>Enter the 6-digit code sent to +91{phone}</Text>
//             </View>
//             <View style={styles.otpContainer}>
//               {phoneOTP.map((digit, index) => (
//                 <TextInput
//                   key={index}
//                   ref={(ref) => (phoneOTPFRefs.current[index] = ref)}
//                   style={styles.otpDigitInput}
//                   value={digit}
//                   onChangeText={(text) => handlePhoneOTPChange(text, index)}
//                   onKeyPress={(e) => handlePhoneOTPKeyPress(e, index)}
//                   keyboardType="number-pad"
//                   maxLength={1}
//                   autoFocus={index === 0}
//                   textAlign="center"
//                   autoCorrect={false}
//                   spellCheck={false}
//                   autoComplete="off"
//                   importantForAutofill="no"
//                   textContentType="none"
//                 />
//               ))}
//             </View>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalButtonSecondary]}
//                 onPress={() => {
//                   setShowPhoneOTPModal(false);
//                   setPhoneOTP(['', '', '', '', '', '']);
//                 }}
//               >
//                 <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
//               </TouchableOpacity>
//               <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
//                 <TouchableOpacity
//                   style={[styles.modalButton, styles.modalButtonPrimary]}
//                   onPress={handleVerifyPhoneOTP}
//                 >
//                   <Text style={styles.modalButtonPrimaryText}>Verify</Text>
//                 </TouchableOpacity>
//               </Animated.View>
//             </View>
//           </View>
//         </View>
//       </Modal>
//       {/* Email OTP Modal */}
//       <Modal
//         visible={showEmailOTPModal}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={() => setShowEmailOTPModal(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Verify Email Address</Text>
//               <Text style={styles.modalSubtitle}>Enter the 6-digit code sent to {email}</Text>
//             </View>
//             <View style={styles.otpContainer}>
//               {emailOTP.map((digit, index) => (
//                 <TextInput
//                   key={index}
//                   ref={(ref) => (emailOTPFRefs.current[index] = ref)}
//                   style={styles.otpDigitInput}
//                   value={digit}
//                   onChangeText={(text) => handleEmailOTPChange(text, index)}
//                   onKeyPress={(e) => handleEmailOTPKeyPress(e, index)}
//                   keyboardType="number-pad"
//                   maxLength={1}
//                   autoFocus={index === 0}
//                   textAlign="center"
//                   autoCorrect={false}
//                   spellCheck={false}
//                   autoComplete="off"
//                   importantForAutofill="no"
//                   textContentType="none"
//                 />
//               ))}
//             </View>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.modalButtonSecondary]}
//                 onPress={() => {
//                   setShowEmailOTPModal(false);
//                   setEmailOTP(['', '', '', '', '', '']);
//                 }}
//               >
//                 <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
//               </TouchableOpacity>
//               <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
//                 <TouchableOpacity
//                   style={[styles.modalButton, styles.modalButtonPrimary]}
//                   onPress={handleVerifyEmailOTP}
//                 >
//                   <Text style={styles.modalButtonPrimaryText}>Verify</Text>
//                 </TouchableOpacity>
//               </Animated.View>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.background,
//   },
//   background: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   gradientCircle: {
//     position: 'absolute',
//     borderRadius: 500,
//     opacity: 0.3,
//   },
//   circle1: {
//     width: Dimensions.get('window').width * 1.5,
//     height: Dimensions.get('window').width * 1.5,
//     backgroundColor: theme.primary,
//     top: -Dimensions.get('window').width * 0.7,
//     left: -Dimensions.get('window').width * 0.3,
//   },
//   circle2: {
//     width: Dimensions.get('window').width * 1.2,
//     height: Dimensions.get('window').width * 1.2,
//     backgroundColor: theme.secondary,
//     bottom: -Dimensions.get('window').width * 0.5,
//     right: -Dimensions.get('window').width * 0.4,
//   },
//   circle3: {
//     width: Dimensions.get('window').width * 0.8,
//     height: Dimensions.get('window').width * 0.8,
//     backgroundColor: theme.accent,
//     bottom: Dimensions.get('window').height * 0.2,
//     left: -Dimensions.get('window').width * 0.2,
//   },
//   circle4: {
//     width: Dimensions.get('window').width * 0.6,
//     height: Dimensions.get('window').width * 0.6,
//     backgroundColor: theme.surface,
//     top: Dimensions.get('window').height * 0.3,
//     right: -Dimensions.get('window').width * 0.1,
//   },
//   alertContainer: {
//     position: 'absolute',
//     top: Dimensions.get('window').height * 0.12,
//     left: 20,
//     right: 20,
//     padding: 12,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     zIndex: 1000,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   alertIcon: {
//     marginRight: 8,
//   },
//   alertText: {
//     color: '#FFF',
//     fontSize: 14,
//     fontWeight: '500',
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     paddingVertical: 10,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginTop: Dimensions.get('window').height * 0.03,
//     marginBottom: 10,
//   },
//   logoWrapper: {
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     padding: 15,
//     borderRadius: 20,
//     marginBottom: 10,
//   },
//   logo: {
//     width: 60,
//     height: 60,
//     tintColor: 'white',
//   },
//   appName: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: 'white',
//     marginBottom: 5,
//     letterSpacing: 0.5,
//   },
//   tagline: {
//     fontSize: 14,
//     color: theme.textSecondary,
//     letterSpacing: 0.3,
//   },
//   formContainer: {
//     width: '90%',
//     backgroundColor: theme.surface,
//     borderRadius: 20,
//     padding: 20,
//     marginTop: 10,
//     maxHeight: '75%',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4.65,
//     elevation: 8,
//   },
//   scrollContent: {
//     paddingBottom: 10,
//   },
//   sectionTitle: {
//     color: 'white',
//     fontSize: 22,
//     marginBottom: 25,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//     height: 50,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     marginBottom: 15,
//     paddingHorizontal: 10,
//   },
//   inputIcon: {
//     marginRight: 10,
//   },
//   input: {
//     flex: 1,
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '500',
//     paddingVertical: 8,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
//   phoneInputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   countryCode: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '500',
//     marginRight: 5,
//   },
//   phoneInput: {
//     flex: 1,
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '500',
//     paddingVertical: 8,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
//   emailInput: {
//     flex: 1,
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '500',
//     paddingVertical: 8,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
//   verifyButton: {
//     width: 70,
//     height: 30,
//     borderRadius: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   unverifiedButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   validButton: {
//     backgroundColor: theme.primary,
//   },
//   verifiedButton: {
//     backgroundColor: theme.success,
//   },
//   verifyButtonText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   datePickerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//     height: 50,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     marginBottom: 15,
//     paddingHorizontal: 15,
//   },
//   datePickerText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '500',
//     marginLeft: 10,
//   },
//   genderLabel: {
//     color: theme.textSecondary,
//     fontSize: 14,
//     marginBottom: 8,
//     marginLeft: 5,
//   },
//   genderContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginBottom: 20,
//   },
//   genderOption: {
//     flex: 1,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 10,
//     marginHorizontal: 5,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//   },
//   selectedGender: {
//     backgroundColor: theme.primary,
//     borderColor: theme.primary,
//   },
//   genderText: {
//     color: theme.textSecondary,
//     fontSize: 14,
//   },
//   selectedGenderText: {
//     color: 'white',
//     fontWeight: '500',
//   },
//   button: {
//     width: '100%',
//     height: 50,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 5,
//     flexDirection: 'row',
//   },
//   registerButton: {
//     backgroundColor: theme.primary,
//   },
//   disabledButton: {
//     opacity: 0.5,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   buttonIcon: {
//     marginLeft: 8,
//   },
//   cancelButton: {
//     marginTop: 15,
//     padding: 10,
//   },
//   cancelButtonText: {
//     color: theme.textSecondary,
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     padding: 20,
//   },
//   modalContent: {
//     width: '90%',
//     backgroundColor: theme.surface,
//     borderRadius: 16,
//     padding: 24,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   modalHeader: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: 'white',
//     marginBottom: 8,
//   },
//   modalSubtitle: {
//     fontSize: 14,
//     color: theme.textSecondary,
//     textAlign: 'center',
//   },
//   otpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginBottom: 24,
//   },
//   otpDigitInput: {
//     width: 40,
//     height: 50,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.1)',
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.05)',
//     color: '#FFFFFF',
//     fontSize: 20,
//     fontWeight: '600',
//     textAlign: 'center',
//     marginHorizontal: 4,
//     includeFontPadding: false,
//     textAlignVertical: 'center',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//   },
//   modalButton: {
//     flex: 1,
//     height: 45,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginHorizontal: 5,
//   },
//   modalButtonPrimary: {
//     backgroundColor: theme.primary,
//   },
//   modalButtonSecondary: {
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   modalButtonPrimaryText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   modalButtonSecondaryText: {
//     color: theme.textSecondary,
//     fontSize: 16,
//   },
// });

// // Memoize to optimize for live real-time app
// export default React.memo(RegisterScreen);


