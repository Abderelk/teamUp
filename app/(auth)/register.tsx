import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../src/constants/Colors';
import {
    getPasswordStrength,
    normalizeName,
    validateConfirmPassword,
    validateEmail,
    validateFirstName,
    validateLastName,
    validatePassword
} from '../../src/constants/validation';
import { useAuth } from '../../src/hooks/useAuth';

export default function RegisterScreen() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<{
        strength: 'weak' | 'medium' | 'strong';
        message: string;
    } | null>(null);
    const [errors, setErrors] = useState({
        firstName: null as string | null,
        lastName: null as string | null,
        email: null as string | null,
        password: null as string | null,
        confirmPassword: null as string | null,
    });

    const { register, loading, error, clearError, loginWithGoogle } = useAuth();
    const router = useRouter();

    // La redirection est maintenant gérée par _layout.tsx
    // Pas besoin de logique de redirection ici

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Calculer la force du mot de passe
        if (field === 'password') {
            if (value.length > 0) {
                setPasswordStrength(getPasswordStrength(value));
            } else {
                setPasswordStrength(null);
            }
        }

        // Effacer l'erreur du champ quand l'utilisateur tape
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }

        // Effacer l'erreur générale
        if (error) {
            clearError();
        }
    };

    const handleDisplayNameBlur = (field: 'firstName' | 'lastName') => {
        if (formData[field].trim()) {
            const normalized = normalizeName(formData[field]);
            setFormData(prev => ({ ...prev, [field]: normalized }));
        }
    };

    const validateForm = (): boolean => {
        const firstNameError = validateFirstName(formData.firstName);
        const lastNameError = validateLastName(formData.lastName);
        const emailError = validateEmail(formData.email);
        const passwordError = validatePassword(formData.password);
        const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);

        setErrors({
            firstName: firstNameError,
            lastName: lastNameError,
            email: emailError,
            password: passwordError,
            confirmPassword: confirmPasswordError,
        });

        return !firstNameError && !lastNameError && !emailError && !passwordError && !confirmPasswordError;
    };

    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        await register(formData.email, formData.password, formData.firstName, formData.lastName);
    };

    const navigateToLogin = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={Colors.light.tint} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Rejoindre TeamUp</Text>
                        <Text style={styles.subtitle}>Créez votre compte pour commencer à jouer</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* First Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Prénom</Text>
                            <View style={[styles.inputWrapper, errors.firstName && styles.inputError]}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={errors.firstName ? '#EF4444' : '#9CA3AF'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Votre prénom"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.firstName}
                                    onChangeText={(text) => handleInputChange('firstName', text)}
                                    onBlur={() => handleDisplayNameBlur('firstName')}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    autoComplete="given-name"
                                />
                            </View>
                            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                        </View>

                        {/* Last Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nom de famille</Text>
                            <View style={[styles.inputWrapper, errors.lastName && styles.inputError]}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={errors.lastName ? '#EF4444' : '#9CA3AF'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Votre nom de famille"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.lastName}
                                    onChangeText={(text) => handleInputChange('lastName', text)}
                                    onBlur={() => handleDisplayNameBlur('lastName')}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    autoComplete="family-name"
                                />
                            </View>
                            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Adresse email</Text>
                            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color={errors.email ? '#EF4444' : '#9CA3AF'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="votre@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.email}
                                    onChangeText={(text) => handleInputChange('email', text)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="email"
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Mot de passe</Text>
                            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={errors.password ? '#EF4444' : '#9CA3AF'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Minimum 6 caractères"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.password}
                                    onChangeText={(text) => handleInputChange('password', text)}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="new-password"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                            {/* Password Strength Indicator */}
                            {passwordStrength && (
                                <View style={styles.passwordStrengthContainer}>
                                    <View style={styles.passwordStrengthBar}>
                                        <View
                                            style={[
                                                styles.passwordStrengthFill,
                                                passwordStrength.strength === 'weak' && styles.strengthWeak,
                                                passwordStrength.strength === 'medium' && styles.strengthMedium,
                                                passwordStrength.strength === 'strong' && styles.strengthStrong,
                                            ]}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            styles.passwordStrengthText,
                                            passwordStrength.strength === 'weak' && { color: '#EF4444' },
                                            passwordStrength.strength === 'medium' && { color: '#F59E0B' },
                                            passwordStrength.strength === 'strong' && { color: '#10B981' },
                                        ]}
                                    >
                                        Force: {passwordStrength.message}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirmer le mot de passe</Text>
                            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={errors.confirmPassword ? '#EF4444' : '#9CA3AF'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Retapez votre mot de passe"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="new-password"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                        </View>

                        {/* Terms and Conditions */}
                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                En créant un compte, vous acceptez nos{' '}
                                <Text style={styles.termsLink}>Conditions d&apos;utilisation</Text>
                                {' '}et notre{' '}
                                <Text style={styles.termsLink}>Politique de confidentialité</Text>
                            </Text>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                                <Text style={styles.errorMessage}>{error}</Text>
                            </View>
                        )}

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.registerButtonText}>Créer mon compte</Text>
                            )}
                        </TouchableOpacity>

                        {/* Social Login Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>ou s&apos;inscrire avec</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social Login Buttons */}
                        <View style={styles.socialButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.socialButton, styles.googleButton]}
                                onPress={loginWithGoogle}
                                disabled={loading}
                            >
                                <Ionicons name="logo-google" size={20} color="#DB4437" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Déjà un compte ? </Text>
                            <TouchableOpacity onPress={navigateToLogin}>
                                <Text style={styles.loginLink}>Se connecter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    flex: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    header: {
        marginBottom: 40,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 8,
        marginBottom: 16,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.tint,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        height: 52,
    },
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.text,
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
        marginLeft: 4,
    },
    termsContainer: {
        marginBottom: 24,
    },
    termsText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
        textAlign: 'center',
    },
    termsLink: {
        color: Colors.light.tint,
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    errorMessage: {
        fontSize: 14,
        color: '#EF4444',
        marginLeft: 8,
        flex: 1,
    },
    registerButton: {
        backgroundColor: Colors.light.tint,
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: Colors.light.tint,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    registerButtonDisabled: {
        opacity: 0.6,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: '#6B7280',
    },
    loginLink: {
        fontSize: 14,
        color: Colors.light.tint,
        fontWeight: '600',
    },
    passwordStrengthContainer: {
        marginTop: 8,
    },
    passwordStrengthBar: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        marginBottom: 4,
    },
    passwordStrengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthWeak: {
        width: '33%',
        backgroundColor: '#EF4444',
    },
    strengthMedium: {
        width: '66%',
        backgroundColor: '#F59E0B',
    },
    strengthStrong: {
        width: '100%',
        backgroundColor: '#10B981',
    },
    passwordStrengthText: {
        fontSize: 12,
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        fontSize: 14,
        color: '#6B7280',
        marginHorizontal: 16,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        height: 52,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    googleButton: {
        borderColor: '#DB4437',
    },
    facebookButton: {
        borderColor: '#4267B2',
    },
    socialButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
});
