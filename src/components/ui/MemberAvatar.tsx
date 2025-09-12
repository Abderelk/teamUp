import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { User } from '../../types';
import { getUserInitials } from '../../services/firebase/users';

interface MemberAvatarProps {
  user?: User;
  userId?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  style?: any;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  user,
  userId,
  size = 40,
  backgroundColor = '#007AFF',
  textColor = 'white',
  style
}) => {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    ...styles.container,
    ...style
  };

  const textStyle = {
    color: textColor,
    fontSize: size * 0.4,
    ...styles.text
  };

  // Si on a une photo de profil
  if (user?.profilePicture) {
    return (
      <View style={containerStyle}>
        <Image 
          source={{ uri: user.profilePicture }} 
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </View>
    );
  }

  // Sinon, afficher les initiales
  const initials = user ? getUserInitials(user) : (userId ? userId.slice(0, 2).toUpperCase() : 'U');

  return (
    <View style={containerStyle}>
      <Text style={textStyle} numberOfLines={1}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
});