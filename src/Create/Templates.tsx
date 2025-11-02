// // src/Create/Templates.tsx
// import React, { useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRoute } from '@react-navigation/native';

// const TemplatesScreen = ({ navigation }) => {
//   const route = useRoute();
//   const { onSelectTemplate } = route.params || {};
//   const [selectedCategory, setSelectedCategory] = useState('Animals');
  
//   // Categories (alphabetical order, 26+)
//   const categories = [
//     'Animals', 'Beauty', 'Classic', 'Daily', 'Dreamy', 'Effects', 
//     'Fantasy', 'Fashion', 'Fitness', 'Food', 'Funny', 'Gaming',
//     'Halloween', 'Love', 'Music', 'Nature', 'Party', 'Sports',
//     'Travel', 'Vintage', 'Wedding', 'Work', 'Art', 'Kids', 'Men',
//     'Women', 'Technology', 'Summer', 'Winter'
//   ];
  
//   // Animal templates with icons
//   const animalTemplates = [
//     { id: 1, name: 'Dog', icon: require('../assets/dog-icon.png') },
//     { id: 2, name: 'Cat', icon: require('../assets/cat-icon.png') },
//     { id: 3, name: 'Cow', icon: require('../assets/cow-icon.png') },
//     { id: 4, name: 'Parrot', icon: require('../assets/parrot-icon.png') },
//     { id: 5, name: 'Bunny', icon: require('../assets/bunny-icon.png') },
//     // Add more animals as needed
//   ];
  
//   // Beauty templates
//   const beautyTemplates = [
//     { id: 1, name: 'Glamour', icon: require('../assets/glamour-icon.png') },
//     { id: 2, name: 'Natural', icon: require('../assets/natural-icon.png') },
//     // Add more beauty templates as needed
//   ];
  
//   // Get templates for current category
//   const getCurrentTemplates = () => {
//     switch(selectedCategory) {
//       case 'Animals':
//         return animalTemplates;
//       case 'Beauty':
//         return beautyTemplates;
//       // Add more categories as needed
//       default:
//         return animalTemplates;
//     }
//   };
  
//   const handleTemplateSelect = (template) => {
//     if (onSelectTemplate) {
//       onSelectTemplate(template);
//     }
//     navigation.goBack();
//   };
  
//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Select Templates</Text>
//       </View>
      
//       {/* Horizontal category list */}
//       <ScrollView 
//         horizontal 
//         showsHorizontalScrollIndicator={false}
//         style={styles.categoriesContainer}
//       >
//         {categories.map((category, index) => (
//           <TouchableOpacity
//             key={index}
//             style={[
//               styles.categoryButton,
//               selectedCategory === category && styles.selectedCategoryButton
//             ]}
//             onPress={() => setSelectedCategory(category)}
//           >
//             <Text 
//               style={[
//                 styles.categoryText,
//                 selectedCategory === category && styles.selectedCategoryText
//               ]}
//             >
//               {category}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
      
//       {/* Templates grid */}
//       <ScrollView style={styles.templatesContainer}>
//         <View style={styles.templatesGrid}>
//           {getCurrentTemplates().map((template) => (
//             <TouchableOpacity
//               key={template.id}
//               style={styles.templateItem}
//               onPress={() => handleTemplateSelect(template)}
//             >
//               <Image source={template.icon} style={styles.templateIcon} />
//               <Text style={styles.templateName}>{template.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   header: {
//     padding: 15,
//     alignItems: 'center',
//   },
//   title: {
//     color: '#FFF',
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   categoriesContainer: {
//     paddingVertical: 10,
//     paddingHorizontal: 5,
//   },
//   categoryButton: {
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     marginHorizontal: 5,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.1)',
//   },
//   selectedCategoryButton: {
//     backgroundColor: '#FF3B30',
//   },
//   categoryText: {
//     color: '#FFF',
//     fontSize: 14,
//   },
//   selectedCategoryText: {
//     fontWeight: 'bold',
//   },
//   templatesContainer: {
//     flex: 1,
//     padding: 10,
//   },
//   templatesGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   templateItem: {
//     width: '30%',
//     aspectRatio: 1,
//     marginBottom: 15,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'rgba(255,255,255,0.1)',
//     borderRadius: 10,
//     padding: 10,
//   },
//   templateIcon: {
//     width: 50,
//     height: 50,
//     marginBottom: 5,
//   },
//   templateName: {
//     color: '#FFF',
//     fontSize: 12,
//     textAlign: 'center',
//   },
// });

// export default TemplatesScreen;







// src/Create/Templates.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Temporary icons - உங்கள் own icons-ஐ பயன்படுத்தவும்
const TEMP_ICONS = {
  dog: require('../assets/dog-icon.png'),
  cat: require('../assets/cat-icon.png'),
  // Add more as needed
};

const TemplatesScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('Animals');
  
  const categories = [
    'Animals', 'Beauty', 'Classic', 'Daily', 'Dreamy', 'Effects', 
    'Fantasy', 'Fashion', 'Fitness', 'Food', 'Funny', 'Gaming',
    'Halloween', 'Love', 'Music', 'Nature', 'Party', 'Sports',
    'Travel', 'Vintage', 'Wedding', 'Work', 'Art', 'Kids', 'Men',
    'Women'
  ];
  
  const animalTemplates = [
    { id: 1, name: 'Dog', icon: TEMP_ICONS.dog },
    { id: 2, name: 'Cat', icon: TEMP_ICONS.cat },
    { id: 3, name: 'Cow', icon: TEMP_ICONS.dog }, // Temporary
    { id: 4, name: 'Parrot', icon: TEMP_ICONS.cat }, // Temporary
    { id: 5, name: 'Bunny', icon: TEMP_ICONS.dog }, // Temporary
  ];
  
  const beautyTemplates = [
    { id: 1, name: 'Glamour', icon: TEMP_ICONS.cat },
    { id: 2, name: 'Natural', icon: TEMP_ICONS.dog },
  ];
  
  const getCurrentTemplates = () => {
    switch(selectedCategory) {
      case 'Animals':
        return animalTemplates;
      case 'Beauty':
        return beautyTemplates;
      default:
        return animalTemplates;
    }
  };
  
// Templates.tsx-ல் handleTemplateSelect function
const handleTemplateSelect = (template) => {
  console.log('🎯 Template selected in Templates screen:', template.name);
  navigation.navigate('Camera', { 
    selectedTemplate: template 
  });
};
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Templates</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Horizontal category list */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Templates grid */}
      <ScrollView style={styles.templatesContainer}>
        <View style={styles.templatesGrid}>
          {getCurrentTemplates().map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateItem}
              onPress={() => handleTemplateSelect(template)}
            >
              <Image source={template.icon} style={styles.templateIcon} />
              <Text style={styles.templateName}>{template.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  selectedCategoryButton: {
    backgroundColor: '#FF3B30',
  },
  categoryText: {
    color: '#FFF',
    fontSize: 14,
  },
  selectedCategoryText: {
    fontWeight: 'bold',
  },
  templatesContainer: {
    flex: 1,
    padding: 10,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateItem: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 10,
  },
  templateIcon: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  templateName: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default TemplatesScreen;






































































































































// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   StatusBar,
//   FlatList,
//   Image,
// } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { theme } from '../../styles/theme';

// const templates = [
//   { id: '1', name: 'NEW', image: 'https://picsum.photos/200/200' },
//   { id: '2', name: 'TRENDING', image: 'https://picsum.photos/200/200?1' },
//   { id: '3', name: 'POPULAR', image: 'https://picsum.photos/200/200?2' },
//   { id: '4', name: 'Sports Car', image: 'https://picsum.photos/200/200?3' },
//   { id: '5', name: 'Nature', image: 'https://picsum.photos/200/200?4' },
//   { id: '6', name: 'NEW', image: 'https://picsum.photos/200/200?5' },
//   { id: '7', name: 'Fashion', image: 'https://picsum.photos/200/200?6' },
//   { id: '8', name: 'Food', image: 'https://picsum.photos/200/200?7' },
//   { id: '9', name: 'Home', image: 'https://picsum.photos/200/200?8' },
// ];

// const TemplatesScreen = ({ navigation }) => {
//   const renderTemplate = ({ item }) => (
//     <TouchableOpacity style={styles.templateItem}>
//       <Image source={{ uri: item.image }} style={styles.templateImage} />
//       <View style={styles.templateBadge}>
//         <Text style={styles.templateBadgeText}>{item.name}</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.headerBg} />
//       <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.container}>
//         <View style={styles.containerInner}>
//           <View style={styles.header}>
//             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
//               <Icon name="arrow-back" size={24} color={theme.textPrimary} />
//             </TouchableOpacity>
//             <Text style={styles.headerTitle}>Templates</Text>
//             <View style={{ width: 40 }} />
//           </View>

//           <View style={styles.content}>
//             <Text style={styles.sectionDescription}>
//               Select a pre-designed template to get started quickly.
//             </Text>
//             <FlatList
//               data={templates}
//               renderItem={renderTemplate}
//               keyExtractor={(item) => item.id}
//               numColumns={3}
//               contentContainerStyle={styles.templateGrid}
//             />
//           </View>
//         </View>
//       </LinearGradient>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   containerInner: {
//     flex: 1,
//     maxWidth: 480,
//     width: '100%',
//     alignSelf: 'center',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     backgroundColor: 'rgba(18, 24, 38, 0.95)',
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.08)',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: theme.textPrimary,
//   },
//   headerIcon: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     flex: 1,
//     padding: 15,
//   },
//   sectionDescription: {
//     fontSize: 16,
//     color: theme.textSecondary,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   templateGrid: {
//     paddingTop: 10,
//   },
//   templateItem: {
//     flex: 1,
//     aspectRatio: 1,
//     borderRadius: 10,
//     overflow: 'hidden',
//     margin: 5,
//   },
//   templateImage: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   templateBadge: {
//     position: 'absolute',
//     top: 5,
//     right: 5,
//     backgroundColor: theme.accentColor,
//     paddingVertical: 2,
//     paddingHorizontal: 5,
//     borderRadius: 3,
//   },
//   templateBadgeText: {
//     fontSize: 10,
//     color: theme.textPrimary,
//   },
// });

// export default TemplatesScreen;


