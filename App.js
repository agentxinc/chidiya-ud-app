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
import { getRandomItem } from './data/items';

const { width } = Dimensions.get('window');

const GAME_STATES = {
  START: 'start',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver',
};

// Brief feedback pause to prevent accidental double-taps (ms)
const ANSWER_DEBOUNCE_MS = 300;

const notifyAnswer = async (isCorrect) => {
  if (Platform.OS === 'web') return;
  try {
    await Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );
  } catch {
    // Haptics are optional on devices that do not support them.
  }
};

const SkyDecor = () => (
  <View style={styles.skyDecor} pointerEvents="none">
    <View style={[styles.glowOrb, styles.glowOrbTop]} />
    <View style={[styles.glowOrb, styles.glowOrbBottom]} />
    <Text style={[styles.cloud, styles.cloudOne]}>☁</Text>
    <Text style={[styles.cloud, styles.cloudTwo]}>☁</Text>
    <Text style={[styles.sparkle, styles.sparkleOne]}>✦</Text>
    <Text style={[styles.sparkle, styles.sparkleTwo]}>✦</Text>
    <Text style={[styles.sparkle, styles.sparkleThree]}>·</Text>
  </View>
);

export default function App() {
  const [gameState, setGameState] = useState(GAME_STATES.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [currentItem, setCurrentItem] = useState('');
  const [canFly, setCanFly] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3000);
  const [streak, setStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const gameLoopRef = useRef(null);
  const answerLockRef = useRef(false);
  const nextQuestionTimeoutRef = useRef(null);

  useEffect(() => () => {
    clearInterval(gameLoopRef.current);
    clearTimeout(nextQuestionTimeoutRef.current);
  }, []);

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

  // Use imported getRandomItem from data/items.js
  const getNextItem = useCallback(() => {
    return getRandomItem();
  }, []);

  const getTimeForLevel = useCallback((lvl) => {
    // Start with 3 seconds, decrease by 200ms per level, minimum 1 second
    return Math.max(1000, 3000 - (lvl - 1) * 200);
  }, []);

  const nextQuestion = useCallback((questionLevel) => {
    const { item, canFly: flies } = getNextItem();
    setCurrentItem(item);
    setCanFly(flies);
    setTimeLeft(getTimeForLevel(questionLevel));
    answerLockRef.current = false;
    setIsAnswering(false);

    // Animate item appearance
    scaleAnim.setValue(0.5);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [getNextItem, getTimeForLevel, scaleAnim]);

  const startGame = useCallback(() => {
    setGameState(GAME_STATES.PLAYING);
    setScore(0);
    setLives(3);
    setLevel(1);
    setStreak(0);
    setIsNewHighScore(false);
    feedbackAnim.stopAnimation();
    setShowFeedback(null);
    clearTimeout(nextQuestionTimeoutRef.current);
    nextQuestion(1);
  }, [nextQuestion, feedbackAnim]);

  const showFeedbackAnimation = (isCorrect, points = 0) => {
    feedbackAnim.stopAnimation();
    setShowFeedback({ isCorrect, points });
    feedbackAnim.setValue(1);
    Animated.timing(feedbackAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowFeedback(null);
    });
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
    // Lock immediately: state alone cannot block taps queued before a render.
    if (gameState !== GAME_STATES.PLAYING || answerLockRef.current) return;
    answerLockRef.current = true;
    clearInterval(gameLoopRef.current);
    setIsAnswering(true);

    const isCorrect = timeLeft > 0 && userSaysFlies === canFly;
    let nextLevel = level;
    notifyAnswer(isCorrect);

    if (isCorrect) {
      const points = 10 + streak * 2 + level * 5;
      const nextScore = score + points;
      nextLevel = Math.floor(nextScore / 50) + 1;
      setScore(nextScore);
      setLevel(nextLevel);
      setStreak(streak + 1);
      showFeedbackAnimation(true, points);
    } else {
      shakeScreen();
      setStreak(0);
      const nextLives = Math.max(0, lives - 1);
      setLives(nextLives);
      showFeedbackAnimation(false);
      if (nextLives === 0) {
        setIsNewHighScore(score > highScore);
        setGameState(GAME_STATES.GAME_OVER);
        saveHighScore(score);
        return;
      }
    }

    nextQuestionTimeoutRef.current = setTimeout(() => {
      nextQuestion(nextLevel);
    }, ANSWER_DEBOUNCE_MS);
  }, [gameState, canFly, streak, level, score, lives, highScore, timeLeft, nextQuestion, saveHighScore]);

  // Pause the countdown while feedback is shown. Keep state updaters pure.
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING || isAnswering) return;
    const interval = setInterval(() => {
      if (answerLockRef.current) return;
      setTimeLeft((prev) => Math.max(0, prev - 100));
    }, 100);
    gameLoopRef.current = interval;
    return () => clearInterval(interval);
  }, [gameState, isAnswering]);

  // Resolve expiry with the current question, score and lives.
  useEffect(() => {
    if (timeLeft === 0 && gameState === GAME_STATES.PLAYING && !isAnswering) {
      handleAnswer(null);
    }
  }, [timeLeft, gameState, isAnswering, handleAnswer]);

  const renderStartScreen = () => (
    <View style={styles.centerContainer}>
      <View style={styles.logoMark}>
        <Text style={styles.logoBird}>🕊️</Text>
      </View>
      <View style={styles.eyebrowBadge}>
        <Text style={styles.eyebrowText}>QUICK THINKING • FAST FINGERS</Text>
      </View>
      <Text style={styles.title}>CHIDIYA UD!</Text>
      <Text style={styles.subtitle}>What belongs in the sky?</Text>

      <View style={styles.instructionsBox}>
        <Text style={styles.instructionTitle}>HOW TO PLAY</Text>
        <View style={styles.instructionRow}>
          <View style={styles.stepBubble}><Text style={styles.stepNumber}>1</Text></View>
          <Text style={styles.instruction}>Read the item on the card</Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.stepBubble}><Text style={styles.stepNumber}>2</Text></View>
          <Text style={styles.instruction}>Choose FLY or CAN'T FLY</Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.stepBubble}><Text style={styles.stepNumber}>3</Text></View>
          <Text style={styles.instruction}>Build your streak before time runs out</Text>
        </View>
      </View>

      {highScore > 0 && (
        <View style={styles.highScoreBadge}>
          <Text style={styles.highScoreIcon}>🏆</Text>
          <Text style={styles.highScoreText}>PERSONAL BEST  {highScore}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.playButton}
        onPress={startGame}
        accessibilityRole="button"
        accessibilityLabel="Play"
        accessibilityHint="Starts a new game of Chidiya Ud"
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#7C5CFC', '#4B8CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.playButtonText}>TAKE FLIGHT  →</Text>
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
      <View style={styles.timerHeader}>
        <Text style={styles.timerLabel}>TIME TO DECIDE</Text>
        <Text style={styles.timerValue}>{(timeLeft / 1000).toFixed(1)}s</Text>
      </View>
      <View style={styles.timerContainer}>
        <LinearGradient
          colors={timeLeft < 1000 ? ['#FF8A7A', '#FF4D6D'] : ['#62E6FF', '#7C5CFC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.timerBar, { width: `${(timeLeft / getTimeForLevel(level)) * 100}%` }]}
        />
      </View>

      {/* Streak */}
      {streak > 2 && (
        <View style={styles.streakBadge}><Text style={styles.streakText}>🔥 {streak} ANSWER STREAK</Text></View>
      )}

      {/* Current Item */}
      <View style={styles.itemContainer}>
        <Animated.View style={[styles.itemCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardPrompt}>CAN IT FLY?</Text>
          <Text style={styles.itemText}>{currentItem}</Text>
          <View style={styles.cardDivider} />
          <Text style={styles.questionText}>Trust your instinct!</Text>
        </Animated.View>
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
            { color: showFeedback.isCorrect ? '#2ecc71' : '#e74c3c' }
          ]} accessibilityLiveRegion="polite">
            {showFeedback.isCorrect ? `✓ CORRECT! +${showFeedback.points}` : '✗ WRONG!'}
          </Text>
        </Animated.View>
      )}

      {/* Answer Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.answerButton}
          onPress={() => handleAnswer(true)}
          disabled={isAnswering}
          accessibilityRole="button"
          accessibilityLabel="Fly"
          accessibilityHint="Answers that the current item can fly"
          accessibilityState={{ disabled: isAnswering }}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#27D7A1', '#12A878']} style={styles.answerGradient}>
            <Text style={styles.buttonEmoji}>🪽</Text>
            <Text style={styles.answerButtonText}>FLY</Text>
            <Text style={styles.answerHint}>YES, IT CAN</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.answerButton}
          onPress={() => handleAnswer(false)}
          disabled={isAnswering}
          accessibilityRole="button"
          accessibilityLabel="Can’t fly"
          accessibilityHint="Answers that the current item cannot fly"
          accessibilityState={{ disabled: isAnswering }}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#FF6B7A', '#E94262']} style={styles.answerGradient}>
            <Text style={styles.buttonEmoji}>✕</Text>
            <Text style={styles.answerButtonText}>NO</Text>
            <Text style={styles.answerHint}>CAN'T FLY</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderGameOverScreen = () => (
    <View style={styles.centerContainer}>
      <View style={styles.gameOverIcon}><Text style={styles.gameOverEmoji}>🏁</Text></View>
      <Text style={styles.gameOverTitle}>GAME OVER</Text>
      <Text style={styles.gameOverSubtitle}>Great flight! Ready for another round?</Text>

      <View style={styles.scoreBox}>
        <Text style={styles.finalScoreLabel}>Final Score</Text>
        <Text style={styles.finalScore}>{score}</Text>
        {isNewHighScore && (
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
        accessibilityRole="button"
        accessibilityLabel="Play Again"
        accessibilityHint="Starts a new game with three lives"
        activeOpacity={0.8}
      >
      <LinearGradient
          colors={['#7C5CFC', '#4B8CFF']}
          style={styles.buttonGradient}
        >
          <Text style={styles.playButtonText}>PLAY AGAIN  ↻</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => setGameState(GAME_STATES.START)}
        accessibilityRole="button"
        accessibilityLabel="Home"
        accessibilityHint="Returns to the start screen"
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
        colors={['#0B1026', '#111D44', '#162A5A']}
        style={styles.gradient}
      >
        <SkyDecor />
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
    overflow: 'hidden',
  },
  skyDecor: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(105, 92, 255, 0.16)',
  },
  glowOrbTop: {
    top: -110,
    right: -90,
  },
  glowOrbBottom: {
    bottom: -150,
    left: -110,
    backgroundColor: 'rgba(36, 211, 238, 0.10)',
  },
  cloud: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.06)',
    fontSize: 96,
  },
  cloudOne: { top: '18%', left: -25 },
  cloudTwo: { bottom: '18%', right: -20, fontSize: 120 },
  sparkle: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.28)',
    fontSize: 18,
  },
  sparkleOne: { top: '12%', left: '14%' },
  sparkleTwo: { top: '32%', right: '10%', fontSize: 12 },
  sparkleThree: { bottom: '20%', left: '18%', fontSize: 32 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  gameContainer: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(93, 128, 255, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
  },
  logoMark: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  logoBird: { fontSize: 48 },
  eyebrowBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(98, 230, 255, 0.12)',
    marginBottom: 10,
  },
  eyebrowText: {
    color: '#7DEBFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  subtitle: {
    fontSize: 17,
    color: '#AAB6D8',
    marginTop: 6,
    marginBottom: 28,
  },
  instructionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.13)',
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 360,
  },
  instructionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7DEBFF',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  stepBubble: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 92, 252, 0.35)',
    marginRight: 12,
  },
  stepNumber: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  instruction: {
    flex: 1,
    fontSize: 13,
    color: '#D5DDF3',
  },
  highScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254, 202, 87, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  highScoreIcon: { fontSize: 15, marginRight: 7 },
  highScoreText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FECA57',
  },
  playButton: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  buttonGradient: {
    paddingVertical: 17,
    paddingHorizontal: 48,
    borderRadius: 18,
  },
  playButtonText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#fff',
    textAlign: 'center',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  hudItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 11,
    paddingHorizontal: 9,
    minWidth: width > 380 ? 100 : 82,
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 9,
    color: '#8692B6',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  hudValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#fff',
    marginTop: 3,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  timerLabel: {
    color: '#8996BC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  timerContainer: {
    height: 7,
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
    fontSize: 11,
    fontWeight: '900',
    color: '#FFD66B',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  streakBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(254, 202, 87, 0.12)',
    borderRadius: 15,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginBottom: 12,
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCard: {
    width: '100%',
    maxWidth: 430,
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 8,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    width: 75,
    height: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#69E5FF',
  },
  cardPrompt: {
    color: '#7DEBFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 18,
  },
  itemText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -1,
    textShadowColor: 'rgba(86, 122, 255, 0.55)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  cardDivider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginTop: 20,
  },
  questionText: {
    fontSize: 13,
    color: '#AAB6D8',
    marginTop: 12,
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
    justifyContent: 'space-between',
    gap: 14,
    paddingTop: 22,
    paddingBottom: 30,
  },
  answerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 9,
  },
  answerGradient: {
    paddingVertical: 17,
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonEmoji: {
    fontSize: 29,
    marginBottom: 3,
  },
  answerButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  answerHint: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  gameOverIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255, 107, 122, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  gameOverEmoji: { fontSize: 38 },
  gameOverTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  gameOverSubtitle: {
    color: '#AAB6D8',
    fontSize: 14,
    marginTop: 7,
    marginBottom: 25,
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.13)',
    padding: 30,
    minWidth: 240,
    alignItems: 'center',
    marginBottom: 20,
  },
  finalScoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#8996BC',
  },
  finalScore: {
    fontSize: 64,
    fontWeight: '900',
    color: '#7DEBFF',
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
