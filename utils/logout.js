import AsyncStorage from '@react-native-async-storage/async-storage';

const logout = async () => {
    try {
        await AsyncStorage.clear();
        return true;
      } catch (error) {
        console.error("Error clearing storage:", error);
        return false;
      }
}
export default logout;
