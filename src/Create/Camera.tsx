// src/Create/Camera.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
  AppState,
  Image,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureScreenWithTemplate } from '../utils/ScreenshotMerger';

// Template images - SMALL & TRANSPARENT
const TEMPLATE_IMAGES = {
  dog: require('../assets/dog-icon.png'),      // 150x150 transparent
  cat: require('../assets/cat-icon.png'),      // 150x150 transparent  
  cow: require('../assets/cow-icon.png'),      // 150x150 transparent
  parrot: require('../assets/parrot-icon.png'), // 150x150 transparent
  bunny: require('../assets/bunny-icon.png'),   // 150x150 transparent
};

export default function CameraScreen({ navigation, route }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasStoragePermission, setHasStoragePermission] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [templatePosition, setTemplatePosition] = useState('top-right'); // Position state
  const cameraRef = useRef(null);
  const screenRef = useRef(null);

  const devices = useCameraDevices();
  const device = devices?.find((d) => d.position === (isFrontCamera ? 'front' : 'back')) ?? devices?.[0] ?? null;

  // Route params-ல் இருந்து டெம்ப்ளேட்டை பெறுவது
  useEffect(() => {
    console.log('📸 Camera Screen - Route params:', route.params);
    
    if (route.params?.selectedTemplate) {
      const template = route.params.selectedTemplate;
      console.log('✅ Template received:', template.name);
      
      const templateName = template.name.toLowerCase();
      const templateImage = TEMPLATE_IMAGES[templateName] || TEMPLATE_IMAGES.dog;
      
      setSelectedTemplate({
        ...template,
        icon: templateImage
      });
    }
  }, [route.params]);

  // Template position change செய்யும் function
  const changeTemplatePosition = () => {
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const currentIndex = positions.indexOf(templatePosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setTemplatePosition(positions[nextIndex]);
    console.log('🔄 Template position changed to:', positions[nextIndex]);
  };

  // Template position-க்கான styles
  const getTemplatePositionStyle = () => {
    switch(templatePosition) {
      case 'top-left':
        return styles.templateTopLeft;
      case 'top-right':
        return styles.templateTopRight;
      case 'bottom-left':
        return styles.templateBottomLeft;
      case 'bottom-right':
        return styles.templateBottomRight;
      default:
        return styles.templateTopRight;
    }
  };

  // Permission functions (முன்பு போல)
  const checkStoragePermission = async () => {
    try {
      let storageGranted = false;
      
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const hasImagesPerm = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          );
          storageGranted = hasImagesPerm;
        } else {
          const hasStoragePerm = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          storageGranted = hasStoragePerm;
        }
      } else {
        storageGranted = true;
      }
      
      setHasStoragePermission(storageGranted);
      return storageGranted;
    } catch (error) {
      console.error('Error checking storage permission:', error);
      return false;
    }
  };

  const requestStoragePermission = async () => {
    try {
      let storageGranted = false;
      
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Storage Permission',
              message: 'This app needs access to your storage to save photos.',
              buttonPositive: 'OK',
            }
          );
          storageGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to your storage to save photos.',
              buttonPositive: 'OK',
            }
          );
          storageGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        }
      } else {
        storageGranted = true;
      }
      
      setHasStoragePermission(storageGranted);
      return storageGranted;
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      return false;
    }
  };

  const checkCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const hasCameraPerm = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        
        if (hasCameraPerm) {
          setHasCameraPermission(true);
          setCameraInitialized(true);
          return true;
        }
        
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs camera access to take photos and videos.',
            buttonPositive: 'OK',
          }
        );
        
        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        setHasCameraPermission(granted);
        setCameraInitialized(true);
        return granted;
      } else {
        const cameraStatus = await Camera.requestCameraPermission();
        const granted = cameraStatus === 'granted';
        setHasCameraPermission(granted);
        setCameraInitialized(true);
        return granted;
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setCameraInitialized(true);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeCamera = async () => {
      if (!mounted) return;

      try {
        const cameraGranted = await checkCameraPermission();
        if (cameraGranted) {
          await checkStoragePermission();
        }
      } catch (error) {
        console.error('Error initializing camera:', error);
      }
    };

    const timer = setTimeout(() => {
      initializeCamera();
    }, 1000);

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && mounted) {
        await checkStoragePermission();
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  const handleFlipCamera = () => setIsFrontCamera((prev) => !prev);

  // படத்தை கேலரியில் சேமிக்கும் செயல்பாடு
  const saveImageToGallery = async (imagePath) => {
    try {
      if (CameraRoll && CameraRoll.save) {
        await CameraRoll.save(imagePath, { 
          type: 'photo', 
          album: 'Reals2Chat' 
        });
        console.log('✅ Photo saved with CameraRoll');
        return true;
      }
      
      const Share = await import('react-native-share');
      const shareOptions = {
        url: imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`,
        type: 'image/jpeg',
        saveToFiles: true,
      };
      
      await Share.default.open(shareOptions);
      console.log('✅ Photo saved with react-native-share');
      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  };

  // படம் எடுக்கும் செயல்பாடு
  const handleCapture = async () => {
    if (!cameraRef.current || !cameraInitialized || isTakingPhoto) {
      Alert.alert('தகவல்', 'கேமரா தயாராக இல்லை.');
      return;
    }

    setIsTakingPhoto(true);

    try {
      const hasPermission = await checkStoragePermission();
      
      if (!hasPermission) {
        const requested = await requestStoragePermission();
        if (!requested) {
          setShowPermissionModal(true);
          setIsTakingPhoto(false);
          return;
        }
      }

      console.log('📸 Capturing photo...');
      console.log('🎭 Selected template:', selectedTemplate?.name);
      console.log('📍 Template position:', templatePosition);
      
      let finalImagePath;

      if (selectedTemplate) {
        // Screenshot capture
        try {
          console.log('🖼️ Attempting screenshot capture...');
          const screenshotPath = await captureScreenWithTemplate(screenRef);
          
          if (screenshotPath) {
            finalImagePath = screenshotPath;
            console.log('✅ Screenshot captured with template');
          } else {
            throw new Error('Screenshot capture failed');
          }
        } catch (screenshotError) {
          console.error('❌ Screenshot failed, using normal photo:', screenshotError);
          // Fallback: Normal camera photo
          const photo = await cameraRef.current.takePhoto({
            flash: 'off',
            qualityPrioritization: 'quality',
          });
          finalImagePath = photo.path;
        }
      } else {
        // Normal photo without template
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'quality',
        });
        finalImagePath = photo.path;
      }

      console.log('✅ Final image path:', finalImagePath);

      // படத்தை சேமிக்கவும்
      const saved = await saveImageToGallery(finalImagePath);
      
      if (saved) {
        Alert.alert(
          'வெற்றி! 🎉', 
          selectedTemplate 
            ? `"${selectedTemplate.name}" டெம்ப்ளேட்டுடன் புகைப்படம் சேமிக்கப்பட்டது!\nPosition: ${templatePosition}` 
            : 'புகைப்படம் சேமிக்கப்பட்டது!'
        );
      } else {
        Alert.alert('தகவல்', 'புகைப்படம் எடுக்கப்பட்டது ஆனால் சேமிக்கப்படவில்லை.');
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('பிழை', `புகைப்படத்தை எடுக்க முடியவில்லை: ${error.message}`);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleOpenGallery = async () => {
    const hasPermission = await checkStoragePermission();
    
    if (!hasPermission) {
      const requested = await requestStoragePermission();
      if (!requested) {
        setShowPermissionModal(true);
        return;
      }
    }

    try {
      const result = await launchImageLibrary({ 
        mediaType: 'photo', 
        selectionLimit: 1 
      });
      
      if (result.didCancel) return;
      
      if (result.errorCode) {
        Alert.alert('பிழை', `படத் தேர்வாளர் பிழை: ${result.errorMessage}`);
        return;
      }

      console.log('Selected file:', result.assets?.[0]);
    } catch (error) {
      console.error('Open gallery error:', error);
      Alert.alert('பிழை', `கேலரியைத் திறக்க முடியவில்லை: ${error.message}`);
    }
  };

  const handleOpenTemplates = () => {
    navigation.navigate('Templates');
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    console.log('🗑️ Template cleared');
  };

  const openAppSettings = () => {
    Linking.openSettings();
    setShowPermissionModal(false);
  };

  // Loading state
  if (!cameraInitialized) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <View style={styles.centeredContainer}>
          <Text style={styles.loadingText}>கேமரா தயாராகிறது...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasCameraPermission) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <View style={styles.centeredContainer}>
          <Icon name="camera-off" size={50} color="white" />
          <Text style={styles.text}>கேமரா அனுமதி தேவை</Text>
          <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
            <Text style={styles.buttonText}>மீண்டும் முயற்சிக்கவும்</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <View style={styles.centeredContainer}>
          <Icon name="error-outline" size={50} color="white" />
          <Text style={styles.text}>கேமரா சாதனம் எதுவும் கிடைக்கவில்லை</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View ref={screenRef} style={styles.screenshotContainer} collapsable={false}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={cameraInitialized && hasCameraPermission}
          photo={true}
        />
        
        {/* டெம்ப்ளேட் ஓவர்லே - SMALL & CORNER POSITION */}
        {selectedTemplate && (
          <View style={[styles.templateOverlay, getTemplatePositionStyle()]}>
            <Image 
              source={selectedTemplate.icon} 
              style={styles.templateImage}
              resizeMode="contain"
            />
            <View style={styles.templateControls}>
              <Text style={styles.templateName}>{selectedTemplate.name}</Text>
              <View style={styles.templateButtons}>
                <TouchableOpacity onPress={changeTemplatePosition} style={styles.positionButton}>
                  <Icon name="open-with" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearTemplate} style={styles.clearButton}>
                  <Icon name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.sideButton} onPress={handleOpenGallery}>
            <Icon name="photo-library" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isTakingPhoto}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sideButton} onPress={handleOpenTemplates}>
            <Icon name="dashboard" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
          <Icon name="flip-camera-ios" size={28} color="white" />
        </TouchableOpacity>

        {!selectedTemplate && (
          <View style={styles.templateHint}>
            <Text style={styles.templateHintText}>
              டெம்ப்ளேட் தேர்வு செய்ய கீழே உள்ள ஐகானை கிளிக் செய்யவும்
            </Text>
          </View>
        )}

        {/* Template Position Indicator */}
        {selectedTemplate && (
          <View style={styles.positionIndicator}>
            <Text style={styles.positionText}>
              Position: {templatePosition}
            </Text>
          </View>
        )}
      </View>

      {showPermissionModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Icon name="error-outline" size={50} color="#FF3B30" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>அனுமதி மறுக்கப்பட்டது</Text>
            <Text style={styles.modalText}>
              சேமிப்பு அனுமதி இல்லாமல் புகைப்படத்தை சேமிக்க முடியாது.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.settingsButton]}
                onPress={openAppSettings}
              >
                <Text style={styles.settingsButtonText}>அமைப்புகளைத் திறக்கவும்</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPermissionModal(false)}
              >
                <Text style={styles.cancelButtonText}>ரத்துசெய்</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  screenshotContainer: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
  },
  flipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Template Overlay Base Style
  templateOverlay: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  // Different Template Positions
  templateTopLeft: {
    top: 80,
    left: 20,
  },
  templateTopRight: {
    top: 80,
    right: 20,
  },
  templateBottomLeft: {
    bottom: 120,
    left: 20,
  },
  templateBottomRight: {
    bottom: 120,
    right: 20,
  },
  // Smaller Template Image
  templateImage: {
    width: 100,  // SMALLER SIZE
    height: 100, // SMALLER SIZE
    opacity: 0.9,
  },
  templateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  templateName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  templateButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateHint: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  templateHintText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
  positionIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  positionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    lineHeight: 22,
  },
  modalButtons: {
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  settingsButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  settingsButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});









































































// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Platform,
//   PermissionsAndroid,
//   Alert,
//   Linking,
//   AppState,
// } from 'react-native';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
// import { launchImageLibrary } from 'react-native-image-picker';
// import { CameraRoll } from '@react-native-camera-roll/camera-roll';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import RNFS from 'react-native-fs';

// export default function CameraView({ navigation }) {
//   const [hasCameraPermission, setHasCameraPermission] = useState(false);
//   const [hasStoragePermission, setHasStoragePermission] = useState(false);
//   const [isFrontCamera, setIsFrontCamera] = useState(false);
//   const [showPermissionModal, setShowPermissionModal] = useState(false);
//   const [isTakingPhoto, setIsTakingPhoto] = useState(false);
//   const cameraRef = useRef(null);

//   const devices = useCameraDevices();
//   const device = devices?.find((d) => d.position === (isFrontCamera ? 'front' : 'back')) ?? devices?.[0] ?? null;

//   // Function to check storage permission status
//   const checkStoragePermission = async () => {
//     try {
//       let storageGranted = false;
      
//       if (Platform.OS === 'android') {
//         if (Platform.Version >= 33) {
//           // For Android 13+ - Check READ_MEDIA_IMAGES permission
//           const hasImagesPerm = await PermissionsAndroid.check(
//             PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
//           );
//           storageGranted = hasImagesPerm;
//           console.log('READ_MEDIA_IMAGES permission:', hasImagesPerm);
//         } else {
//           // For Android <13 - Check WRITE_EXTERNAL_STORAGE permission
//           const hasStoragePerm = await PermissionsAndroid.check(
//             PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
//           );
//           storageGranted = hasStoragePerm;
//           console.log('WRITE_EXTERNAL_STORAGE permission:', hasStoragePerm);
//         }
//       } else {
//         // For iOS, we assume granted as CameraRoll handles permissions
//         storageGranted = true;
//       }
      
//       console.log('Storage permission checked:', storageGranted);
//       setHasStoragePermission(storageGranted);
//       return storageGranted;
//     } catch (error) {
//       console.error('Error checking storage permission:', error);
//       return false;
//     }
//   };

//   // Function to request storage permission
//   const requestStoragePermission = async () => {
//     try {
//       let storageGranted = false;
      
//       if (Platform.OS === 'android') {
//         if (Platform.Version >= 33) {
//           // For Android 13+ - Request READ_MEDIA_IMAGES permission
//           const result = await PermissionsAndroid.request(
//             PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
//             {
//               title: 'Storage Permission',
//               message: 'This app needs access to your storage to save photos.',
//               buttonPositive: 'OK',
//             }
//           );
//           storageGranted = result === PermissionsAndroid.RESULTS.GRANTED;
//           console.log('READ_MEDIA_IMAGES permission result:', result);
//         } else {
//           // For Android <13 - Request WRITE_EXTERNAL_STORAGE permission
//           const result = await PermissionsAndroid.request(
//             PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
//             {
//               title: 'Storage Permission',
//               message: 'This app needs access to your storage to save photos.',
//               buttonPositive: 'OK',
//             }
//           );
//           storageGranted = result === PermissionsAndroid.RESULTS.GRANTED;
//           console.log('WRITE_EXTERNAL_STORAGE permission result:', result);
//         }
//       } else {
//         // For iOS
//         storageGranted = true;
//       }
      
//       console.log('Storage permission requested:', storageGranted);
//       setHasStoragePermission(storageGranted);
//       return storageGranted;
//     } catch (error) {
//       console.error('Error requesting storage permission:', error);
//       return false;
//     }
//   };

//   useEffect(() => {
//     const requestPermissions = async () => {
//       try {
//         // Camera permission
//         const cameraStatus = await Camera.requestCameraPermission();
//         let cameraGranted = cameraStatus === 'granted';
        
//         if (Platform.OS === 'android') {
//           const cam = await PermissionsAndroid.request(
//             PermissionsAndroid.PERMISSIONS.CAMERA,
//             {
//               title: 'Camera Permission',
//               message: 'This app needs camera access to take photos and videos.',
//               buttonPositive: 'OK',
//             }
//           );
//           cameraGranted = cam === PermissionsAndroid.RESULTS.GRANTED;
//         }
        
//         setHasCameraPermission(cameraGranted);
//         console.log('Camera permission granted:', cameraGranted);

//         // Request storage permission
//         await requestStoragePermission();
//       } catch (error) {
//         console.error('Error requesting permissions:', error);
//       }
//     };

//     requestPermissions();

//     // Add event listener for when app comes to foreground
//     const subscription = AppState.addEventListener('change', async (nextAppState) => {
//       if (nextAppState === 'active') {
//         // Re-check permissions when app returns to foreground
//         await checkStoragePermission();
//       }
//     });

//     return () => {
//       subscription.remove();
//     };
//   }, []);

//   const handleFlipCamera = () => setIsFrontCamera((prev) => !prev);

//   // Alternative method to save image using react-native-share
//   const saveImageToGallery = async (imagePath) => {
//     try {
//       // First try CameraRoll if available
//       if (CameraRoll && CameraRoll.save) {
//         const result = await CameraRoll.save(imagePath, { type: 'photo', album: 'Reals2Chat' });
//         console.log('Photo saved with CameraRoll:', result);
//         return true;
//       }
      
//       // Fallback: Use react-native-share to save to gallery
//       const Share = await import('react-native-share');
//       const shareOptions = {
//         url: `file://${imagePath}`,
//         type: 'image/jpeg',
//         saveToFiles: true,
//       };
      
//       const result = await Share.default.open(shareOptions);
//       console.log('Photo saved with react-native-share:', result);
//       return true;
//     } catch (error) {
//       console.error('Error saving image:', error);
//       return false;
//     }
//   };

//   const handleCapture = async () => {
//     if (!cameraRef.current || isTakingPhoto) {
//       return;
//     }

//     setIsTakingPhoto(true);

//     // Double-check permission before capturing
//     const hasPermission = await checkStoragePermission();
    
//     if (!hasPermission) {
//       // If no permission, try to request it
//       const requested = await requestStoragePermission();
//       if (!requested) {
//         setShowPermissionModal(true);
//       }
//       setIsTakingPhoto(false);
//       return;
//     }

//     try {
//       const photo = await cameraRef.current.takePhoto({
//         flash: 'off',
//         qualityPrioritization: 'balanced',
//       });

//       console.log('Photo captured:', photo);

//       // Try to save the photo to gallery
//       const saved = await saveImageToGallery(photo.path);
      
//       if (saved) {
//         Alert.alert('Success', 'Photo saved to gallery!');
//       } else {
//         Alert.alert(
//           'Info', 
//           `Photo captured but not saved to gallery. Path: ${photo.path}\n\nPlease check storage permissions.`
//         );
//       }
//     } catch (error) {
//       console.error('Capture error:', error);
//       Alert.alert('Error', `Failed to capture photo: ${error.message}`);
//     } finally {
//       setIsTakingPhoto(false);
//     }
//   };

//   const handleOpenGallery = async () => {
//     // Check storage permission before opening gallery
//     const hasPermission = await checkStoragePermission();
    
//     if (!hasPermission) {
//       // If no permission, try to request it
//       const requested = await requestStoragePermission();
//       if (!requested) {
//         setShowPermissionModal(true);
//         return;
//       }
//     }

//     try {
//       const result = await launchImageLibrary({ 
//         mediaType: 'photo', 
//         selectionLimit: 1 
//       });
      
//       if (result.didCancel) {
//         return;
//       }
      
//       if (result.errorCode) {
//         Alert.alert('Error', `Image picker error: ${result.errorMessage}`);
//         return;
//       }

//       console.log('File selected:', result.assets?.[0]);
//       // Handle the selected image here
//     } catch (error) {
//       console.error('Open gallery error:', error);
//       Alert.alert('Error', `Failed to open gallery: ${error.message}`);
//     }
//   };

//   const openAppSettings = () => {
//     Linking.openSettings();
//     setShowPermissionModal(false);
//   };

//   const handleRetryPermission = async () => {
//     const granted = await requestStoragePermission();
//     if (!granted) {
//       setShowPermissionModal(true);
//     } else {
//       setShowPermissionModal(false);
//     }
//   };

//   if (!hasCameraPermission) {
//     return (
//       <SafeAreaView style={styles.centeredContainer}>
//         <View style={styles.centeredContainer}>
//           <Icon name="camera-off" size={50} color="white" />
//           <Text style={styles.text}>Camera permission required</Text>
//           <TouchableOpacity style={styles.button} onPress={() => Linking.openSettings()}>
//             <Text style={styles.buttonText}>Open Settings</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!device) {
//     return (
//       <SafeAreaView style={styles.centeredContainer}>
//         <View style={styles.centeredContainer}>
//           <Icon name="error-outline" size={50} color="white" />
//           <Text style={styles.text}>No camera device found</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <Camera
//         ref={cameraRef}
//         style={StyleSheet.absoluteFill}
//         device={device}
//         isActive={true}
//         photo={true}
//       />
      
//       <View style={styles.controlsContainer}>
//         <TouchableOpacity style={styles.sideButton} onPress={handleOpenGallery}>
//           <Icon name="photo-library" size={28} color="white" />
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
//           onPress={handleCapture}
//           disabled={isTakingPhoto}
//         >
//           <View style={styles.captureInner} />
//         </TouchableOpacity>
        
//         <TouchableOpacity style={styles.sideButton} onPress={handleFlipCamera}>
//           <Icon name="flip-camera-ios" size={28} color="white" />
//         </TouchableOpacity>
//       </View>

//       {/* Permission Denied Modal */}
//       {showPermissionModal && (
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Icon name="error-outline" size={50} color="#FF3B30" style={styles.modalIcon} />
//             <Text style={styles.modalTitle}>Permission Denied</Text>
//             <Text style={styles.modalText}>
//               Cannot save photo without storage permission. Please enable it in settings.
//             </Text>
            
//             <View style={styles.modalButtons}>
//               <TouchableOpacity 
//                 style={[styles.modalButton, styles.settingsButton]}
//                 onPress={openAppSettings}
//               >
//                 <Text style={styles.settingsButtonText}>OPEN SETTINGS</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity 
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => setShowPermissionModal(false)}
//               >
//                 <Text style={styles.cancelButtonText}>CANCEL</Text>
//               </TouchableOpacity>

//               <TouchableOpacity 
//                 style={[styles.modalButton, styles.retryButton]}
//                 onPress={handleRetryPermission}
//               >
//                 <Text style={styles.retryButtonText}>RETRY</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   centeredContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },
//   text: {
//     color: '#FFF',
//     fontSize: 16,
//     marginTop: 12,
//     marginBottom: 20,
//   },
//   button: {
//     backgroundColor: '#FF3B30',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 5,
//   },
//   buttonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   controlsContainer: {
//     position: 'absolute',
//     bottom: 40,
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingHorizontal: 30,
//   },
//   sideButton: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   captureButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     borderWidth: 4,
//     borderColor: 'white',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   captureButtonDisabled: {
//     opacity: 0.5,
//   },
//   captureInner: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#FF3B30',
//   },
//   // Modal styles
//   modalContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//   },
//   modalContent: {
//     width: '80%',
//     backgroundColor: 'white',
//     borderRadius: 10,
//     padding: 20,
//     alignItems: 'center',
//   },
//   modalIcon: {
//     marginBottom: 15,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: '#333',
//   },
//   modalText: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//     color: '#555',
//     lineHeight: 22,
//   },
//   modalButtons: {
//     width: '100%',
//   },
//   modalButton: {
//     paddingVertical: 12,
//     borderRadius: 5,
//     alignItems: 'center',
//     marginVertical: 5,
//   },
//   settingsButton: {
//     backgroundColor: '#FF3B30',
//   },
//   cancelButton: {
//     backgroundColor: '#E0E0E0',
//   },
//   retryButton: {
//     backgroundColor: '#4CAF50',
//   },
//   settingsButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   cancelButtonText: {
//     color: '#333',
//     fontWeight: 'bold',
//   },
//   retryButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
// });