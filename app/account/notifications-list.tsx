import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Notification, NotificationType } from '../../src/types';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllUserNotifications,
} from '../../src/services/firebase/notifications';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';

const { width } = Dimensions.get('window');

type SortOption = 'newest' | 'oldest' | 'unread';
type FilterOption = 'all' | NotificationType;

const FILTER_OPTIONS: { value: FilterOption; label: string; icon: string }[] = [
  { value: 'all', label: 'Toutes', icon: 'notifications' },
  { value: 'event_invite', label: 'Invitations', icon: 'calendar' },
  { value: 'event_update', label: 'Mises à jour', icon: 'refresh' },
  { value: 'event_cancelled', label: 'Annulations', icon: 'close-circle' },
  { value: 'team_invite', label: 'Équipes', icon: 'people' },
  { value: 'team_message', label: 'Messages', icon: 'chatbubble' },
  { value: 'general', label: 'Générales', icon: 'information-circle' }
];

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'newest', label: 'Récentes', icon: 'arrow-down' },
  { value: 'oldest', label: 'Anciennes', icon: 'arrow-up' },
  { value: 'unread', label: 'Non lues', icon: 'radio-button-off' }
];

export default function NotificationsListScreen() {
  const { userProfile } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showOptions, setShowOptions] = useState(false);

  const loadNotifications = async () => {
    if (!userProfile?.uid) return;

    try {
      const notificationsData = await getUserNotifications(userProfile.uid);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      
      // Afficher un message d'erreur plus informatif
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('index')) {
        showError('Configuration Firebase en cours. Veuillez réessayer dans quelques instants.');
      } else {
        showError('Impossible de charger les notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      showError('Impossible de marquer comme lu');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userProfile?.uid) return;

    try {
      await markAllNotificationsAsRead(userProfile.uid);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      showSuccess('Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      showError('Impossible de marquer toutes les notifications comme lues');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const confirmDelete = () => {
      Alert.alert(
        'Supprimer',
        'Supprimer cette notification ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteNotification(notificationId);
                setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
                showSuccess('Notification supprimée');
              } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showError('Impossible de supprimer');
              }
            }
          }
        ]
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer cette notification ?')) {
        try {
          await deleteNotification(notificationId);
          setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
          showSuccess('Notification supprimée');
        } catch (error) {
          showError('Impossible de supprimer');
        }
      }
    } else {
      confirmDelete();
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!userProfile?.uid || notifications.length === 0) return;

    const confirmDeleteAll = () => {
      Alert.alert(
        'Tout supprimer',
        `Supprimer toutes les ${notifications.length} notifications ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Tout supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAllUserNotifications(userProfile.uid);
                setNotifications([]);
                showSuccess('Toutes les notifications supprimées');
              } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showError('Impossible de supprimer toutes les notifications');
              }
            }
          }
        ]
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer toutes les ${notifications.length} notifications ?`)) {
        try {
          await deleteAllUserNotifications(userProfile.uid);
          setNotifications([]);
          showSuccess('Toutes les notifications supprimées');
        } catch (error) {
          showError('Impossible de supprimer toutes les notifications');
        }
      }
    } else {
      confirmDeleteAll();
    }
  };


  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    if (notification.type === 'event_invite' || notification.type === 'event_update' || notification.type === 'event_cancelled') {
      const eventId = notification.data?.eventId;
      if (eventId) {
        router.push(`/event/${eventId}` as any);
      }
    } else if (notification.type === 'team_invite' || notification.type === 'team_message') {
      const teamId = notification.data?.teamId;
      if (teamId) {
        console.log('Navigate to team:', teamId);
      }
    }
  };

  // Filtrage et tri
  useEffect(() => {
    let filtered = [...notifications];

    if (filterBy !== 'all') {
      filtered = filtered.filter(notif => notif.type === filterBy);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        case 'oldest':
          return a.createdAt.toMillis() - b.createdAt.toMillis();
        case 'unread':
          if (a.isRead === b.isRead) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return a.isRead ? 1 : -1;
        default:
          return 0;
      }
    });

    setFilteredNotifications(filtered);
  }, [notifications, sortBy, filterBy]);

  useEffect(() => {
    loadNotifications();
  }, [userProfile?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'event_invite':
      case 'event_update':
        return 'calendar';
      case 'event_cancelled':
        return 'calendar-clear';
      case 'team_invite':
      case 'team_message':
        return 'people';
      case 'general':
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'event_invite':
        return '#007AFF';
      case 'event_update':
        return '#FF9500';
      case 'event_cancelled':
        return '#FF3B30';
      case 'team_invite':
      case 'team_message':
        return '#34C759';
      case 'general':
      default:
        return '#8E8E93';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const currentFilter = FILTER_OPTIONS.find(f => f.value === filterBy);
  const currentSort = SORT_OPTIONS.find(s => s.value === sortBy);

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={18}
            color={getNotificationColor(item.type)}
          />
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.notificationInfo}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>
            {item.createdAt.toDate().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteNotification(item.id);
          }}
        >
          <Ionicons name="close" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header compact */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.optionsBtn} onPress={() => setShowOptions(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filtres compacts */}
      <View style={styles.quickFilters}>
        <TouchableOpacity 
          style={styles.filterChip}
          onPress={() => setShowOptions(true)}
        >
          <Ionicons name={currentFilter?.icon as any} size={14} color="#007AFF" />
          <Text style={styles.filterText}>{currentFilter?.label}</Text>
          <Ionicons name="chevron-down" size={12} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterChip}
          onPress={() => setShowOptions(true)}
        >
          <Ionicons name={currentSort?.icon as any} size={14} color="#007AFF" />
          <Text style={styles.filterText}>{currentSort?.label}</Text>
        </TouchableOpacity>
        
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllBtn}
            onPress={handleMarkAllAsRead}
          >
            <Ionicons name="checkmark-done" size={14} color="#34C759" />
          </TouchableOpacity>
        )}
      </View>

      {/* Liste des notifications */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous êtes à jour !
            </Text>
          </View>
        )}
      />

      {/* Modal d'options */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Options</Text>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filtrer</Text>
              {FILTER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, filterBy === option.value && styles.selectedOption]}
                  onPress={() => {
                    setFilterBy(option.value);
                    setShowOptions(false);
                  }}
                >
                  <Ionicons name={option.icon as any} size={18} color="#007AFF" />
                  <Text style={styles.optionText}>{option.label}</Text>
                  {filterBy === option.value && (
                    <Ionicons name="checkmark" size={18} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trier</Text>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, sortBy === option.value && styles.selectedOption]}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowOptions(false);
                  }}
                >
                  <Ionicons name={option.icon as any} size={18} color="#007AFF" />
                  <Text style={styles.optionText}>{option.label}</Text>
                  {sortBy === option.value && (
                    <Ionicons name="checkmark" size={18} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  handleMarkAllAsRead();
                  setShowOptions(false);
                }}
              >
                <Ionicons name="checkmark-done" size={18} color="#34C759" />
                <Text style={[styles.optionText, { color: '#34C759' }]}>
                  Marquer tout comme lu
                </Text>
              </TouchableOpacity>
            )}

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  handleDeleteAllNotifications();
                  setShowOptions(false);
                }}
              >
                <Ionicons name="trash" size={18} color="#FF3B30" />
                <Text style={[styles.optionText, { color: '#FF3B30' }]}>
                  Tout supprimer
                </Text>
              </TouchableOpacity>
            )}

          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionsBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  markAllBtn: {
    backgroundColor: '#F2F2F7',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  notificationInfo: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: '600',
  },
  body: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: '#8E8E93',
  },
  deleteBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  selectedOption: {
    backgroundColor: '#F2F2F7',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
});