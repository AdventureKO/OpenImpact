import React from 'react';
import FundraiserDetail from '../components/FundraiserDetail';

export default function FundraiserDetailScreen({ route, navigation }) {
  const { project } = route.params || {};
  return <FundraiserDetail project={project} onBack={() => navigation.goBack()} />;
}
