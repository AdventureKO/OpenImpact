import { Platform } from 'react-native';

// Default mock server address for common dev environments.
// - Android emulator (10.0.2.2)
// - iOS simulator / web (localhost)
export const MOCK_SERVER_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export default MOCK_SERVER_URL;

