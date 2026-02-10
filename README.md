# Chidiya Ud! - The Flying Game

A classic Indian game reimagined as a mobile app. Test your reflexes - can you tell what flies and what doesn't?

## Features

- Fast-paced gameplay with increasing difficulty
- Haptic feedback for correct/wrong answers
- Streak bonuses for consecutive correct answers
- High score tracking
- Beautiful gradient UI with smooth animations
- Works on iOS and Android

## How to Play

1. A word appears on screen
2. Tap **FLY** if it can fly (birds, airplanes, insects)
3. Tap **NO** if it cannot fly (animals, objects, vehicles)
4. Speed increases with each level
5. You have 3 lives - don't lose them all!

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

- **iOS**: Press `i` to open in iOS Simulator
- **Android**: Press `a` to open in Android Emulator
- **Physical Device**: Scan QR code with Expo Go app

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Tech Stack

- React Native with Expo
- expo-haptics for tactile feedback
- expo-linear-gradient for beautiful gradients
- AsyncStorage for high score persistence
- Reanimated for smooth animations

## License

MIT License - Agent X Inc
