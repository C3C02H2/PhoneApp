import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, screenPadding } from '../theme';
import { statsAPI, CalendarData } from '../api/stats';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const CalendarScreen: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await statsAPI.getCalendar(year, month);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const goBack = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const goForward = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  const yesCount = data ? Object.values(data.days).filter(v => v === true).length : 0;
  const noCount = data ? Object.values(data.days).filter(v => v === false).length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goBack} style={styles.navBtn}>
            <Text style={styles.navBtnText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
          <TouchableOpacity onPress={goForward} style={styles.navBtn}>
            <Text style={styles.navBtnText}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={styles.weekdayText}>{d}</Text>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent.main} style={{ marginTop: spacing.xxl }} />
        ) : (
          <View style={styles.grid}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const value = data?.days[dateStr];
              const isToday =
                day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

              let bgColor = 'transparent';
              let textColor = colors.primary.disabled;
              if (value === true) { bgColor = colors.success.main; textColor = '#000'; }
              else if (value === false) { bgColor = colors.error.main; textColor = '#000'; }

              return (
                <View
                  key={day}
                  style={[
                    styles.dayCell,
                    { backgroundColor: bgColor },
                    isToday && styles.dayCellToday,
                  ]}
                >
                  <Text style={[styles.dayText, { color: textColor }]}>{day}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success.main }]} />
            <Text style={styles.legendText}>Yes ({yesCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error.main }]} />
            <Text style={styles.legendText}>No ({noCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary.disabled }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const CELL_SIZE = 40;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingHorizontal: screenPadding.horizontal, paddingTop: spacing.huge, paddingBottom: spacing.massive },
  title: { ...typography.h1, color: colors.primary.main, marginBottom: spacing.xxl },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  navBtn: { padding: spacing.md },
  navBtnText: { ...typography.h2, color: colors.accent.main },
  monthLabel: { ...typography.h3, color: colors.primary.main },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm },
  weekdayText: { ...typography.labelSmall, color: colors.primary.disabled, width: CELL_SIZE, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 2,
  },
  dayCellToday: { borderWidth: 2, borderColor: colors.accent.main },
  dayText: { ...typography.label, fontSize: 14 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.xxl },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { ...typography.caption, color: colors.primary.muted },
});
