import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Flying and non-flying items - comprehensive lists
const FLYING_ITEMS = [
  // Birds
  'Eagle', 'Sparrow', 'Butterfly', 'Parrot', 'Crow', 'Pigeon', 'Bat', 'Owl',
  'Hawk', 'Seagull', 'Hummingbird', 'Pelican', 'Flamingo', 'Swan', 'Duck',
  'Goose', 'Stork', 'Crane', 'Falcon', 'Vulture', 'Woodpecker', 'Robin',
  'Peacock', 'Toucan', 'Macaw', 'Cockatoo', 'Kingfisher', 'Albatross',
  'Canary', 'Finch', 'Cardinal', 'Blue Jay', 'Raven', 'Magpie', 'Swallow',
  'Nightingale', 'Lark', 'Warbler', 'Oriole', 'Starling', 'Cuckoo', 'Koel',
  'Bulbul', 'Myna', 'Kite Bird', 'Osprey', 'Condor', 'Hornbill', 'Hoopoe',
  'Puffin', 'Tern', 'Cormorant', 'Heron', 'Egret', 'Ibis', 'Spoonbill',
  'Quail', 'Pheasant', 'Partridge', 'Grouse', 'Ptarmigan', 'Roadrunner',
  'Bluebird', 'Chickadee', 'Wren', 'Nuthatch', 'Titmouse', 'Grosbeak',

  // Insects that fly
  'Bee', 'Wasp', 'Dragonfly', 'Mosquito', 'Fly', 'Moth', 'Ladybug', 'Firefly',
  'Beetle', 'Hornet', 'Bumblebee', 'Cicada', 'Grasshopper', 'Locust',
  'Mayfly', 'Damselfly', 'Lacewing', 'Hoverfly', 'Crane Fly', 'Gnat',
  'Fruit Fly', 'Horse Fly', 'Deer Fly', 'Bot Fly', 'Blow Fly', 'Sawfly',
  'Stonefly', 'Caddisfly', 'Termite', 'Flying Ant', 'Mantis', 'Katydid',

  // Flying machines
  'Airplane', 'Helicopter', 'Drone', 'Kite', 'Rocket', 'Balloon', 'Blimp',
  'Glider', 'Hang Glider', 'Paraglider', 'Hot Air Balloon', 'Jet', 'Biplane',
  'Seaplane', 'Fighter Jet', 'Bomber', 'Cargo Plane', 'Airship', 'Zeppelin',
  'Space Shuttle', 'Spacecraft', 'Satellite', 'UFO', 'Flying Saucer',
  'Paper Airplane', 'Frisbee', 'Boomerang', 'Flying Disc', 'Parachute',

  // Other flying things
  'Pterodactyl', 'Flying Fish', 'Flying Squirrel', 'Flying Fox', 'Sugar Glider',
  'Fairy', 'Angel', 'Dragon', 'Phoenix', 'Griffin', 'Pegasus', 'Thunderbird',
  'Garuda', 'Roc', 'Hippogriff', 'Wyvern', 'Sprite', 'Pixie',
  'Superman', 'Iron Man', 'Thor', 'Wonder Woman', 'Supergirl',
  'Dandelion Seed', 'Maple Seed', 'Feather', 'Leaf', 'Pollen', 'Spore',
  'Arrow', 'Javelin', 'Shuttlecock', 'Golf Ball', 'Baseball', 'Frisbee'
];

const NON_FLYING_ITEMS = [
  // Land animals
  'Dog', 'Cat', 'Elephant', 'Lion', 'Tiger', 'Horse', 'Cow', 'Sheep',
  'Goat', 'Pig', 'Rabbit', 'Snake', 'Lizard', 'Penguin', 'Ostrich', 'Emu',
  'Giraffe', 'Zebra', 'Hippo', 'Rhino', 'Buffalo', 'Bison', 'Moose', 'Elk',
  'Deer', 'Antelope', 'Gazelle', 'Kangaroo', 'Koala', 'Wombat', 'Platypus',
  'Panda', 'Bear', 'Polar Bear', 'Wolf', 'Fox', 'Coyote', 'Hyena', 'Jackal',
  'Leopard', 'Cheetah', 'Jaguar', 'Panther', 'Cougar', 'Lynx', 'Bobcat',
  'Monkey', 'Gorilla', 'Chimpanzee', 'Orangutan', 'Baboon', 'Lemur',
  'Sloth', 'Armadillo', 'Anteater', 'Aardvark', 'Hedgehog', 'Porcupine',
  'Beaver', 'Otter', 'Badger', 'Skunk', 'Raccoon', 'Opossum', 'Mole',
  'Hamster', 'Guinea Pig', 'Chinchilla', 'Ferret', 'Gerbil', 'Mouse', 'Rat',
  'Squirrel', 'Chipmunk', 'Prairie Dog', 'Groundhog', 'Marmot',
  'Camel', 'Llama', 'Alpaca', 'Donkey', 'Mule', 'Pony', 'Ox', 'Yak',

  // Sea animals
  'Fish', 'Shark', 'Whale', 'Dolphin', 'Turtle', 'Crocodile', 'Alligator',
  'Octopus', 'Squid', 'Jellyfish', 'Starfish', 'Seahorse', 'Lobster', 'Crab',
  'Shrimp', 'Clam', 'Oyster', 'Mussel', 'Snail', 'Slug', 'Sea Urchin',
  'Seal', 'Sea Lion', 'Walrus', 'Manatee', 'Dugong', 'Orca', 'Narwhal',
  'Stingray', 'Manta Ray', 'Eel', 'Barracuda', 'Tuna', 'Salmon', 'Trout',
  'Catfish', 'Goldfish', 'Koi', 'Piranha', 'Swordfish', 'Marlin',

  // Amphibians & Reptiles
  'Frog', 'Toad', 'Salamander', 'Newt', 'Axolotl', 'Caecilian',
  'Iguana', 'Chameleon', 'Gecko', 'Komodo Dragon', 'Monitor Lizard',
  'Cobra', 'Python', 'Anaconda', 'Viper', 'Rattlesnake', 'Boa',

  // Vehicles (ground/water)
  'Car', 'Bus', 'Train', 'Bicycle', 'Motorcycle', 'Boat', 'Ship',
  'Truck', 'Van', 'Jeep', 'SUV', 'Taxi', 'Ambulance', 'Fire Truck',
  'Police Car', 'Tractor', 'Bulldozer', 'Excavator', 'Crane', 'Forklift',
  'Scooter', 'Skateboard', 'Roller Skates', 'Tricycle', 'Unicycle',
  'Submarine', 'Yacht', 'Canoe', 'Kayak', 'Raft', 'Ferry', 'Cruise Ship',
  'Tank', 'Armored Car', 'Hovercraft', 'Snowmobile', 'ATV', 'Golf Cart',

  // Household items
  'Table', 'Chair', 'Book', 'Phone', 'Computer', 'Television', 'Clock',
  'Lamp', 'Sofa', 'Bed', 'Desk', 'Cabinet', 'Drawer', 'Mirror', 'Rug',
  'Curtain', 'Pillow', 'Blanket', 'Mattress', 'Wardrobe', 'Bookshelf',
  'Refrigerator', 'Microwave', 'Oven', 'Stove', 'Toaster', 'Blender',
  'Washing Machine', 'Dryer', 'Dishwasher', 'Vacuum', 'Iron', 'Fan',

  // Food items
  'Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Watermelon', 'Pineapple',
  'Strawberry', 'Blueberry', 'Cherry', 'Peach', 'Plum', 'Pear', 'Kiwi',
  'Coconut', 'Papaya', 'Guava', 'Lychee', 'Pomegranate', 'Fig', 'Date',
  'Carrot', 'Potato', 'Tomato', 'Onion', 'Garlic', 'Ginger', 'Cabbage',
  'Broccoli', 'Cauliflower', 'Spinach', 'Lettuce', 'Cucumber', 'Pepper',
  'Pizza', 'Burger', 'Sandwich', 'Taco', 'Burrito', 'Sushi', 'Pasta',
  'Rice', 'Bread', 'Cake', 'Cookie', 'Ice Cream', 'Chocolate', 'Candy',

  // Nature (non-flying)
  'Tree', 'Flower', 'Grass', 'Rock', 'Mountain', 'River', 'Ocean',
  'Lake', 'Pond', 'Waterfall', 'Cave', 'Desert', 'Forest', 'Jungle',
  'Island', 'Volcano', 'Glacier', 'Canyon', 'Valley', 'Cliff', 'Beach',
  'Mushroom', 'Cactus', 'Bamboo', 'Palm Tree', 'Oak Tree', 'Pine Tree',
  'Rose', 'Tulip', 'Sunflower', 'Daisy', 'Lily', 'Orchid', 'Lotus',

  // Insects (non-flying)
  'Ant', 'Spider', 'Scorpion', 'Centipede', 'Millipede', 'Earthworm',
  'Caterpillar', 'Tick', 'Flea', 'Lice', 'Bedbug', 'Cockroach', 'Cricket',

  // Mythical (non-flying)
  'Unicorn', 'Mermaid', 'Centaur', 'Minotaur', 'Cyclops', 'Medusa',
  'Werewolf', 'Vampire', 'Zombie', 'Goblin', 'Troll', 'Ogre', 'Giant',
  'Kraken', 'Leviathan', 'Hydra', 'Cerberus', 'Sphinx', 'Yeti', 'Bigfoot'
];

const GAME_STATES = {
  START: 'start',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver',
};

export default function App() {
  const [gameState, setGameState] = useState(GAME_STATES.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [currentItem, setCurrentItem] = useState('');
  const [canFly, setCanFly] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3000);
  const [streak, setStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const gameLoopRef = useRef(null);

  // Load high score on mount
  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('chidiyaUdHighScore');
      if (saved) setHighScore(parseInt(saved, 10));
    } catch (e) {
      console.log('Error loading high score');
    }
  };

  const saveHighScore = async (newScore) => {
    try {
      if (newScore > highScore) {
        await AsyncStorage.setItem('chidiyaUdHighScore', newScore.toString());
        setHighScore(newScore);
      }
    } catch (e) {
      console.log('Error saving high score');
    }
  };

  const getRandomItem = useCallback(() => {
    const isFlying = Math.random() > 0.5;
    const items = isFlying ? FLYING_ITEMS : NON_FLYING_ITEMS;
    const item = items[Math.floor(Math.random() * items.length)];
    return { item, canFly: isFlying };
  }, []);

  const getTimeForLevel = useCallback((lvl) => {
    // Start with 3 seconds, decrease by 200ms per level, minimum 1 second
    return Math.max(1000, 3000 - (lvl - 1) * 200);
  }, []);

  const nextQuestion = useCallback(() => {
    const { item, canFly: flies } = getRandomItem();
    setCurrentItem(item);
    setCanFly(flies);
    setTimeLeft(getTimeForLevel(level));

    // Animate item appearance
    scaleAnim.setValue(0.5);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [level, getRandomItem, getTimeForLevel, scaleAnim]);

  const startGame = useCallback(() => {
    setGameState(GAME_STATES.PLAYING);
    setScore(0);
    setLives(3);
    setLevel(1);
    setStreak(0);
    nextQuestion();
  }, [nextQuestion]);

  // Game timer
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return;

    gameLoopRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          // Time's up - wrong answer
          handleAnswer(null);
          return getTimeForLevel(level);
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, level, getTimeForLevel]);

  const showFeedbackAnimation = (isCorrect) => {
    setShowFeedback(isCorrect);
    feedbackAnim.setValue(1);
    Animated.timing(feedbackAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => setShowFeedback(null));
  };

  const shakeScreen = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleAnswer = useCallback((userSaysFlies) => {
    if (gameState !== GAME_STATES.PLAYING) return;

    const isCorrect = userSaysFlies === canFly;

    if (isCorrect) {
      // Correct answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const points = 10 + streak * 2 + level * 5;
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      showFeedbackAnimation(true);

      // Level up every 5 correct answers
      if ((score + points) >= level * 50) {
        setLevel((prev) => prev + 1);
      }
    } else {
      // Wrong answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeScreen();
      setStreak(0);
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState(GAME_STATES.GAME_OVER);
          saveHighScore(score);
          return 0;
        }
        return newLives;
      });
      showFeedbackAnimation(false);
    }

    if (lives > 1 || isCorrect) {
      nextQuestion();
    }
  }, [gameState, canFly, streak, level, score, lives, nextQuestion, saveHighScore]);

  const renderStartScreen = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>CHIDIYA UD!</Text>
      <Text style={styles.subtitle}>The Flying Game</Text>

      <View style={styles.instructionsBox}>
        <Text style={styles.instructionTitle}>How to Play</Text>
        <Text style={styles.instruction}>A word will appear on screen</Text>
        <Text style={styles.instruction}>Tap FLY if it can fly</Text>
        <Text style={styles.instruction}>Tap NO if it cannot</Text>
        <Text style={styles.instruction}>Speed increases each level!</Text>
      </View>

      {highScore > 0 && (
        <Text style={styles.highScoreText}>Best: {highScore}</Text>
      )}

      <TouchableOpacity
        style={styles.playButton}
        onPress={startGame}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.buttonGradient}
        >
          <Text style={styles.playButtonText}>PLAY</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGameScreen = () => (
    <Animated.View
      style={[
        styles.gameContainer,
        { transform: [{ translateX: shakeAnim }] }
      ]}
    >
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>LEVEL</Text>
          <Text style={styles.hudValue}>{level}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>LIVES</Text>
          <Text style={styles.hudValue}>{'❤️'.repeat(lives)}</Text>
        </View>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerContainer}>
        <View
          style={[
            styles.timerBar,
            {
              width: `${(timeLeft / getTimeForLevel(level)) * 100}%`,
              backgroundColor: timeLeft < 1000 ? '#e74c3c' : '#667eea'
            }
          ]}
        />
      </View>

      {/* Streak */}
      {streak > 2 && (
        <Text style={styles.streakText}>{streak} Streak! 🔥</Text>
      )}

      {/* Current Item */}
      <View style={styles.itemContainer}>
        <Animated.Text
          style={[
            styles.itemText,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {currentItem}
        </Animated.Text>
        <Text style={styles.questionText}>Can it fly?</Text>
      </View>

      {/* Feedback */}
      {showFeedback !== null && (
        <Animated.View
          style={[
            styles.feedback,
            { opacity: feedbackAnim }
          ]}
        >
          <Text style={[
            styles.feedbackText,
            { color: showFeedback ? '#2ecc71' : '#e74c3c' }
          ]}>
            {showFeedback ? '✓ CORRECT!' : '✗ WRONG!'}
          </Text>
        </Animated.View>
      )}

      {/* Answer Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.answerButton, styles.flyButton]}
          onPress={() => handleAnswer(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonEmoji}>🦅</Text>
          <Text style={styles.answerButtonText}>FLY!</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.answerButton, styles.noButton]}
          onPress={() => handleAnswer(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonEmoji}>🚫</Text>
          <Text style={styles.answerButtonText}>NO</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderGameOverScreen = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.gameOverTitle}>GAME OVER</Text>

      <View style={styles.scoreBox}>
        <Text style={styles.finalScoreLabel}>Final Score</Text>
        <Text style={styles.finalScore}>{score}</Text>
        {score > highScore && score > 0 && (
          <Text style={styles.newHighScore}>NEW HIGH SCORE! 🎉</Text>
        )}
      </View>

      <View style={styles.statsBox}>
        <Text style={styles.statText}>Level Reached: {level}</Text>
        <Text style={styles.statText}>Best Score: {Math.max(highScore, score)}</Text>
      </View>

      <TouchableOpacity
        style={styles.playButton}
        onPress={startGame}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.buttonGradient}
        >
          <Text style={styles.playButtonText}>PLAY AGAIN</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => setGameState(GAME_STATES.START)}
        activeOpacity={0.8}
      >
        <Text style={styles.homeButtonText}>HOME</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        {gameState === GAME_STATES.START && renderStartScreen()}
        {gameState === GAME_STATES.PLAYING && renderGameScreen()}
        {gameState === GAME_STATES.GAME_OVER && renderGameOverScreen()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gameContainer: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#667eea',
    textAlign: 'center',
    textShadowColor: 'rgba(102, 126, 234, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 20,
    color: '#a0a0a0',
    marginBottom: 40,
  },
  instructionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    width: '100%',
    maxWidth: 300,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  instruction: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    marginVertical: 5,
  },
  highScoreText: {
    fontSize: 18,
    color: '#feca57',
    marginBottom: 20,
  },
  playButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  hudItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 10,
    color: '#888',
    letterSpacing: 1,
  },
  hudValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  timerContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 4,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#feca57',
    textAlign: 'center',
    marginBottom: 10,
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(102, 126, 234, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  questionText: {
    fontSize: 20,
    color: '#a0a0a0',
    marginTop: 20,
  },
  feedback: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 32,
    fontWeight: '900',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 30,
  },
  answerButton: {
    width: width * 0.4,
    paddingVertical: 25,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  flyButton: {
    backgroundColor: '#2ecc71',
    shadowColor: '#2ecc71',
  },
  noButton: {
    backgroundColor: '#e74c3c',
    shadowColor: '#e74c3c',
  },
  buttonEmoji: {
    fontSize: 36,
    marginBottom: 5,
  },
  answerButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  gameOverTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#e74c3c',
    marginBottom: 30,
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  finalScoreLabel: {
    fontSize: 16,
    color: '#888',
  },
  finalScore: {
    fontSize: 64,
    fontWeight: '900',
    color: '#fff',
  },
  newHighScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#feca57',
    marginTop: 10,
  },
  statsBox: {
    marginBottom: 30,
  },
  statText: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginVertical: 5,
  },
  homeButton: {
    marginTop: 15,
    padding: 15,
  },
  homeButtonText: {
    fontSize: 16,
    color: '#888',
  },
});
