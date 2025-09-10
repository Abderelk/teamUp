import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase/config';
import { Alert } from 'react-native';

export interface ImageUploadResult {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// Demander les permissions pour la caméra et la galerie
export async function requestImagePermissions(): Promise<boolean> {
  try {
    // Permission pour la galerie
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    // Permission pour la caméra
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (galleryStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'Cette application a besoin d\'accéder à votre galerie et à votre caméra pour partager des images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la demande de permissions:', error);
    return false;
  }
}

// Montrer le sélecteur d'options (caméra/galerie)
export async function showImagePickerOptions(): Promise<ImagePicker.ImagePickerResult | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Sélectionner une image',
      'Choisissez comment vous souhaitez ajouter une image',
      [
        {
          text: 'Caméra',
          onPress: async () => {
            const result = await pickImageFromCamera();
            resolve(result);
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            const result = await pickImageFromGallery();
            resolve(result);
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
}

// Prendre une photo avec la caméra
export async function pickImageFromCamera(options: ImagePickerOptions = {}): Promise<ImagePicker.ImagePickerResult | null> {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? 0.8,
      base64: false,
    });

    return result;
  } catch (error) {
    console.error('Erreur lors de la prise de photo:', error);
    Alert.alert('Erreur', 'Impossible d\'accéder à la caméra');
    return null;
  }
}

// Sélectionner une image depuis la galerie
export async function pickImageFromGallery(options: ImagePickerOptions = {}): Promise<ImagePicker.ImagePickerResult | null> {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? 0.8,
      base64: false,
    });

    return result;
  } catch (error) {
    console.error('Erreur lors de la sélection d\'image:', error);
    Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
    return null;
  }
}

// Redimensionner et optimiser l'image
export async function processImage(
  imageUri: string, 
  options: ImagePickerOptions = {}
): Promise<string> {
  try {
    const { maxWidth = 1080, maxHeight = 1080, quality = 0.8 } = options;
    
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image:', error);
    throw new Error('Impossible de traiter l\'image');
  }
}

// Uploader l'image vers Firebase Storage
export async function uploadImageToFirebase(
  imageUri: string,
  path: string,
  fileName?: string
): Promise<ImageUploadResult> {
  try {
    // Récupérer le blob de l'image
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Générer un nom de fichier unique si non fourni
    const finalFileName = fileName || `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    // Créer la référence Firebase Storage
    const imageRef = ref(storage, `${path}/${finalFileName}`);
    
    // Upload du blob
    const uploadResult = await uploadBytes(imageRef, blob);
    
    // Récupérer l'URL de téléchargement
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Récupérer les métadonnées de l'image
    const img = new Image();
    img.src = imageUri;
    
    return new Promise((resolve) => {
      img.onload = () => {
        resolve({
          url: downloadURL,
          width: img.width,
          height: img.height,
          size: blob.size,
        });
      };
      
      img.onerror = () => {
        resolve({
          url: downloadURL,
          width: 0,
          height: 0,
          size: blob.size,
        });
      };
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    throw new Error('Impossible d\'uploader l\'image');
  }
}

// Fonction complète pour sélectionner, traiter et uploader une image
export async function selectAndUploadImage(
  storagePath: string,
  options: ImagePickerOptions = {}
): Promise<ImageUploadResult | null> {
  try {
    // Sélectionner l'image
    const pickerResult = await showImagePickerOptions();
    
    if (!pickerResult || pickerResult.canceled || !pickerResult.assets?.[0]) {
      return null;
    }

    const selectedImage = pickerResult.assets[0];
    
    // Traiter l'image (redimensionner et optimiser)
    const processedUri = await processImage(selectedImage.uri, options);
    
    // Uploader vers Firebase
    const uploadResult = await uploadImageToFirebase(processedUri, storagePath);
    
    return uploadResult;
    
  } catch (error) {
    console.error('Erreur lors de la sélection/upload d\'image:', error);
    Alert.alert(
      'Erreur',
      'Impossible de traiter l\'image. Veuillez réessayer.',
      [{ text: 'OK' }]
    );
    return null;
  }
}

// Supprimer une image de Firebase Storage
export async function deleteImageFromFirebase(imageUrl: string): Promise<boolean> {
  try {
    // Extraire le chemin depuis l'URL Firebase
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('URL Firebase invalide');
    }
    
    const imagePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, imagePath);
    
    // Supprimer l'image
    // await deleteObject(imageRef);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    return false;
  }
}