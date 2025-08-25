import { View, type ViewProps } from 'react-native';
import { Colors } from '../src/constants/Colors';
import { useColorScheme } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor = theme === 'light' ? lightColor : darkColor;

  return <View style={[{ backgroundColor: backgroundColor ?? Colors[theme].background }, style]} {...otherProps} />;
}
