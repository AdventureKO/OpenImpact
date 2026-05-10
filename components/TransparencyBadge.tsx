import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateTransparencyScore } from '@/utils/transparencyScore';

export default function TransparencyBadge({ projectId }: { projectId: string }) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await calculateTransparencyScore(projectId);
        setScore(res.percentageAssigned);
      } catch (e) {
        console.warn('badge calc failed', e);
      }
    })();
  }, [projectId]);

  if (score === null) return null;

  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'High Transparency' : score >= 50 ? 'Good Tracking' : 'Partial Allocations';

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{score}% {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginVertical: 8 },
  text: { color: '#fff', fontWeight: '700', fontSize: 12 }
});
