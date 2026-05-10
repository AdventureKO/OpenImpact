import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JOURNEY_STEP_LABELS } from '@/constants/donationJourney';

type Props = {
  currentStep: number;
};

export function DonationJourneyBar({ currentStep }: Props) {
  const step = Math.min(Math.max(Math.floor(currentStep), 0), JOURNEY_STEP_LABELS.length - 1);
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {JOURNEY_STEP_LABELS.map((label, i) => {
          const done = i <= step;
          const active = i === step;
          return (
            <View key={label} style={styles.segmentWrap}>
              <View style={[styles.dot, done ? styles.dotDone : styles.dotTodo, active && styles.dotActive]} />
              <Text style={[styles.label, done ? styles.labelDone : styles.labelTodo]} numberOfLines={2}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / JOURNEY_STEP_LABELS.length) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  track: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  segmentWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
    backgroundColor: '#ddd',
  },
  dotDone: { backgroundColor: '#27ae60' },
  dotTodo: { backgroundColor: '#e0e0e0' },
  dotActive: { borderWidth: 2, borderColor: '#1e8449' },
  label: { fontSize: 9, textAlign: 'center' },
  labelDone: { color: '#333', fontWeight: '600' },
  labelTodo: { color: '#999' },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: '#eee', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#27ae60', borderRadius: 2 },
});
