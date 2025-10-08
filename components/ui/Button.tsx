import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: object;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', style, disabled }: ButtonProps) {
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryText : styles.secondaryText;

  return (
    <View style={style}>
      <Pressable
        style={[buttonStyle, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={textStyle}>{title}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  primaryText: {
    color: 'white',
    fontSize: FontSizes.body,
    fontWeight: 'bold',
  },
  secondaryText: {
    color: Colors.light.primary,
    fontSize: FontSizes.body,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});

// To make the base styles available for extension if needed
styles.primaryButton = { ...styles.baseButton, ...styles.primaryButton };
styles.secondaryButton = { ...styles.baseButton, ...styles.secondaryButton };
