import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { validateEmail } from '../../src/constants/validation';
import { useAuth } from '../../src/hooks/useAuth';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const { resetPassword } = useAuth();
    const router = useRouter();

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (emailError) {
            setEmailError(null);
        }
    };

    const validateForm = (): boolean => {
        const emailValidation = validateEmail(email);
        setEmailError(emailValidation);
        return !emailValidation;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(email);
            setEmailSent(true);
            Alert.alert(
                'Email envoyé !',
                'Un email de réinitialisation de mot de passe a été envoyé à votre adresse email en français. Vérifiez votre boîte de réception et votre dossier spam/indésirables, puis suivez les instructions.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            Alert.alert(
                'Erreur',
                error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
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
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={Colors.light.tint} />
                        </TouchableOpacity>
                        
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-closed-outline" size={48} color={Colors.light.tint} />
                        </View>
                        
                        <Text style={styles.title}>Mot de passe oublié ?</Text>
                        <Text style={styles.subtitle}>
                            Pas de souci ! Entrez votre adresse email et nous vous enverrons 
                            un lien pour réinitialiser votre mot de passe.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Adresse email</Text>
                            <View style={[styles.inputWrapper, emailError && styles.inputError]}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color={emailError ? '#EF4444' : '#9CA3AF'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="votre@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="email"
                                    editable={!emailSent}
                                />
                            </View>
                            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
                        </View>

                        {/* Reset Button */}
                        <TouchableOpacity
                            style={[
                                styles.resetButton, 
                                (isLoading || emailSent) && styles.resetButtonDisabled
                            ]}
                            onPress={handleResetPassword}
                            disabled={isLoading || emailSent}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="mail-outline" size={20} color="white" style={styles.buttonIcon} />
                                    <Text style={styles.resetButtonText}>Envoyer l'email</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Success Message */}
                        {emailSent && (
                            <View style={styles.successContainer}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                                <Text style={styles.successMessage}>
                                    Email de réinitialisation envoyé à {email}
                                </Text>
                            </View>
                        )}

                        {/* Back to Login */}
                        <TouchableOpacity onPress={navigateToLogin} style={styles.backToLoginContainer}>
                            <Ionicons name="chevron-back" size={16} color={Colors.light.tint} />
                            <Text style={styles.backToLoginText}>Retour à la connexion</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Additional Help */}
                    <View style={styles.helpContainer}>
                        <View style={styles.spamWarning}>
                            <Ionicons name="warning-outline" size={20} color="#F59E0B" style={styles.warningIcon} />
                            <Text style={styles.spamWarningText}>
                                ⚠️ N'oubliez pas de vérifier votre dossier spam/indésirables !
                            </Text>
                        </View>
                        <Text style={styles.helpText}>
                            Vous n'arrivez pas à recevoir l'email ? Vérifiez votre dossier spam ou
                        </Text>
                        <TouchableOpacity onPress={handleResetPassword} disabled={isLoading}>
                            <Text style={[styles.helpLink, isLoading && styles.helpLinkDisabled]}>
                                renvoyer l'email
                            </Text>
                        </TouchableOpacity>
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
        alignItems: 'center',
        marginBottom: 48,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: -8,
        padding: 8,
        zIndex: 1,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.light.tint + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    form: {
        width: '100%',
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 24,
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
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
        marginLeft: 4,
    },
    resetButton: {
        backgroundColor: Colors.light.tint,
        borderRadius: 12,
        height: 52,
        flexDirection: 'row',
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
    resetButtonDisabled: {
        opacity: 0.6,
    },
    buttonIcon: {
        marginRight: 8,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
    },
    successMessage: {
        fontSize: 14,
        color: '#10B981',
        marginLeft: 8,
        flex: 1,
    },
    backToLoginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    backToLoginText: {
        fontSize: 16,
        color: Colors.light.tint,
        fontWeight: '500',
        marginLeft: 4,
    },
    helpContainer: {
        alignItems: 'center',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    helpText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
    },
    helpLink: {
        fontSize: 14,
        color: Colors.light.tint,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    helpLinkDisabled: {
        opacity: 0.5,
    },
    spamWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FCD34D',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        width: '100%',
    },
    warningIcon: {
        marginRight: 8,
    },
    spamWarningText: {
        fontSize: 14,
        color: '#92400E',
        fontWeight: '500',
        flex: 1,
        lineHeight: 18,
    },
});