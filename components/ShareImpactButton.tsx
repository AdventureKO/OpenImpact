import React from "react";
import {
    Alert,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ShareImpactProps {
  donationAmount: number;
  causeName: string;
  causeId?: string;
  impact?: {
    meals?: number;
    trees?: number;
    families?: number;
  };
}

export function ShareImpactButton({
  donationAmount,
  causeName,
  causeId,
  impact,
}: ShareImpactProps) {
  const shareOnSocial = async (
    platform: "twitter" | "facebook" | "generic",
  ) => {
    const impactText = impact
      ? `I just donated $${donationAmount.toFixed(2)} to "${causeName}" and my impact includes:\n• ${impact.meals || 0} meals provided\n• ${impact.trees || 0} trees planted\n• ${impact.families || 0} families reached`
      : `I just donated $${donationAmount.toFixed(2)} to "${causeName}" on OpenImpact to make a real difference.`;

    const messages = {
      twitter: `${impactText}\n\nTrack my impact & verify transparency with me on @OpenImpact #GiveWithImpact`,
      facebook: `${impactText}\n\nI'm using OpenImpact to give transparently and track real impact. Join me!`,
      generic: impactText,
    };

    try {
      const message = messages[platform];

      if (platform === "generic") {
        const result = await Share.share({
          message: `${message}\n\nDownload OpenImpact to give with full transparency and verify where your donation goes.`,
          title: "My Donation Impact on OpenImpact",
        });

        if (result.action === Share.dismissedAction) {
          return;
        }
      } else {
        // For specific platforms, copy to clipboard and show instructions
        // In a real app, you'd use deep linking to the platform
        Alert.alert("Share", `Share this message:\n\n${message}`, [
          {
            text: "Copy to Clipboard",
            onPress: () => {
              // Copy to clipboard (would need expo-clipboard)
              Alert.alert("Success", "Message copied! Share it on " + platform);
            },
          },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📢 Share Your Impact</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => shareOnSocial("twitter")}
          style={[styles.button, styles.twitterBtn]}
        >
          <Text style={styles.buttonText}>𝕏 Twitter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => shareOnSocial("facebook")}
          style={[styles.button, styles.facebookBtn]}
        >
          <Text style={styles.buttonText}>f Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => shareOnSocial("generic")}
          style={[styles.button, styles.genericBtn]}
        >
          <Text style={styles.buttonText}>↗️ Share</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Share your donation & impact to inspire others to give transparently
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1f2937",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  twitterBtn: {
    backgroundColor: "#000",
  },
  facebookBtn: {
    backgroundColor: "#1877f2",
  },
  genericBtn: {
    backgroundColor: "#10b981",
  },
  description: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
});

export default ShareImpactButton;
