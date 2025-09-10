import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  placeholder?: string;
}

export function DateRangePicker({ 
  value, 
  onDateRangeChange, 
  placeholder = "Sélectionner une période" 
}: DateRangePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(value?.start || new Date());
  const [tempEndDate, setTempEndDate] = useState<Date>(value?.end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempStartDate(selectedDate);
      // Ajuster la date de fin si elle est antérieure à la date de début
      if (selectedDate > tempEndDate) {
        setTempEndDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempEndDate(selectedDate);
    }
  };

  const applyDateRange = () => {
    onDateRangeChange({
      start: tempStartDate,
      end: tempEndDate
    });
    setShowModal(false);
  };

  const clearDateRange = () => {
    onDateRangeChange(undefined);
    setShowModal(false);
  };

  const getDisplayText = () => {
    if (!value) return placeholder;
    return `${formatDate(value.start)} - ${formatDate(value.end)}`;
  };

  const getQuickRanges = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const thisWeekend = new Date(today);
    thisWeekend.setDate(today.getDate() + (6 - today.getDay())); // Samedi
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    return [
      {
        label: "Aujourd'hui",
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      {
        label: "Ce week-end",
        start: thisWeekend,
        end: new Date(thisWeekend.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        label: "7 prochains jours",
        start: today,
        end: nextWeek
      },
      {
        label: "30 prochains jours",
        start: today,
        end: nextMonth
      }
    ];
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setShowModal(true)}>
        <View style={styles.content}>
          <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          <Text style={[
            styles.text, 
            !value && styles.placeholder
          ]}>
            {getDisplayText()}
          </Text>
          {value && (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onDateRangeChange(undefined);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner une période</Text>
            <TouchableOpacity onPress={applyDateRange}>
              <Text style={styles.applyButton}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Sélections rapides */}
            <View style={styles.quickRangesContainer}>
              <Text style={styles.sectionTitle}>Sélections rapides</Text>
              {getQuickRanges().map((range, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickRangeButton}
                  onPress={() => {
                    setTempStartDate(range.start);
                    setTempEndDate(range.end);
                  }}
                >
                  <Text style={styles.quickRangeText}>{range.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sélection personnalisée */}
            <View style={styles.customRangeContainer}>
              <Text style={styles.sectionTitle}>Période personnalisée</Text>
              
              {/* Date de début */}
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Date de début</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDate(tempStartDate)}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {/* Date de fin */}
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Date de fin</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDate(tempEndDate)}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton effacer */}
            <TouchableOpacity style={styles.clearRangeButton} onPress={clearDateRange}>
              <Text style={styles.clearRangeText}>Effacer la période</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Pickers natifs */}
        {showStartPicker && (
          <DateTimePicker
            value={tempStartDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={tempEndDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={tempStartDate}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
  },
  placeholder: {
    color: '#8E8E93',
  },
  clearButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  applyButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  quickRangesContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  quickRangeButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  quickRangeText: {
    fontSize: 16,
    color: '#007AFF',
  },
  customRangeContainer: {
    marginBottom: 30,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  clearRangeButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearRangeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});