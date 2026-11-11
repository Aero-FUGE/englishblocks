import {LearningLobby} from './components/LearningLobby';
import {persistBoard,restoreBoard} from './utils/boardDraft';
import {cloudSync} from './utils/cloudSync';
import {FriendsPage} from './components/FriendsPage';
import {PrankToast} from './components/PrankToast';
import {useSocialActivity} from './utils/useSocialActivity';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LevelData, UserProfile, WordBlock } from './types/game';
import { SENTENCE_BANK } from './data/sentenceBank';
import { CatWardrobeModal, CatCollection, EMPTY_COLLECTION } from './components/CatWardrobeModal';
import { rewardForHints } from './data/catShop';
import { evaluateCurrentAssembly } from './utils/translationEvaluator';
import { sound } from './utils/sound';
import { resumeLevelIndex } from './utils/progress';
import { recordLevelTime } from './utils/timing';
import { exactSlotMatches, filledAnswerBoard } from './utils/answer';
import { playUiClickForTarget } from './utils/uiSounds';
import { useCloudSync } from './utils/useCloudSync';
import { CloudSyncModal } from './components/CloudSyncModal';
import { RailState, InsertSide, newRail, putFirstAvailable, insertFromPool, takeBack, moveByInsertion, emptyRail } from './utils/railState';

// Components
import { LeftSidebar } from './components/LeftSidebar';
import { TopProgress } from './components/TopProgress';
import { MainStudyBoard } from './components/MainStudyBoard';
import { WordCardModal } from './components/WordCardModal';
import { SuccessCelebrationModal } from './components/SuccessCelebrationModal';
import { ProfileModal } from './components/ProfileModal';
import { LevelSelectorModal } from './components/LevelSelectorModal';
import { GrammarHintModal } from './components/GrammarHintModal';
import { SoundStudioModal } from './components/SoundStudioModal';
import { SettingsModal } from './components/SettingsModal';
import { LayoutEditor, usePublishedLayout, readLayout, isMobilePreview, applyElementLayouts } from './components/LayoutEditor';

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_main',
  name: '浮歌',
  avatar: '🐰',
  themeColor: 'green',
  currentLevelIndex: 0,
  progressVersion: 3,
  completedLevelIds: [],
  masteredWordIds: [],
  mistakeHistory: [],
  starredWordIds: [],
  streakDays: 3,
  totalAttempts: 0,
  correctAttempts: 0,
  soundEnabled: true,
  speechEnabled: true,
  totalWordGoal: 2004,
  totalSentenceGoal: 1190,
  timingRecords: {},
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const layout = usePublishedLayout();
  useEffect(() => { const timer = window.setTimeout(() => setShowSplash(false), 950); return () => window.clearTimeout(timer); }, []);
  // Single User Profile state from LocalStorage
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('word_candy_single_profile_v3');
      if (saved) {
        const parsed: UserProfile = {...DEFAULT_PROFILE, ...JSON.parse(saved)};
        return {...parsed, currentLevelIndex: resumeLevelIndex(parsed, SENTENCE_BANK), progressVersion: 3};
      }
    } catch {}
    return DEFAULT_PROFILE;
  });

  const [collection,setCollection] = useState<CatCollection>(()=>{try {const raw=localStorage.getItem('english_blocks_cat_collection_v1');return raw?{...EMPTY_COLLECTION,...JSON.parse(raw)}:EMPTY_COLLECTION;}catch{return EMPTY_COLLECTION;}});
  const [wardrobeOpen,setWardrobeOpen] = useState(false);
  const [hintCount,setHintCount] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  // Modals
  const [selectedWordForModal, setSelectedWordForModal] = useState<WordBlock | null>(null);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [isSoundStudioOpen, setIsSoundStudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudOpen,setIsCloudOpen]=useState(false);
  const [inStudy,setInStudy]=useState(false);
  const [season,setSeason]=useState(()=>{try{return localStorage.getItem('englishblocks_season')||document.documentElement.dataset.season||'spring';}catch{return 'spring';}});
  useEffect(()=>{document.documentElement.dataset.season=season;try{localStorage.setItem('englishblocks_season',season);}catch{}},[season]);
  useEffect(()=>{document.documentElement.dataset.learningPage=inStudy?'study':'lobby';return()=>{delete document.documentElement.dataset.learningPage;};},[inStudy]);
  const [friendsOpen,setFriendsOpen]=useState(()=>location.hash==='#friends');
  const [pranksOpen,setPranksOpen]=useState(false);
  const studyScroll=React.useRef(0);
  const openFriends=()=>{studyScroll.current=window.scrollY;location.hash='friends';setFriendsOpen(true);};
  const closeFriends=()=>{history.replaceState(null,'',location.pathname+location.search);setFriendsOpen(false);requestAnimationFrame(()=>window.scrollTo({top:studyScroll.current}));};
  useEffect(()=>{const change=()=>setFriendsOpen(location.hash==='#friends');window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
  useEffect(()=>{document.documentElement.dataset.friendsOpen=String(friendsOpen);if(friendsOpen)window.scrollTo({top:0});return()=>{delete document.documentElement.dataset.friendsOpen;};},[friendsOpen]);

  const [lastFishReward,setLastFishReward] = useState(0);
  const [lastSpeedReward, setLastSpeedReward] = useState(0);
  const [lastCompletionMs, setLastCompletionMs] = useState(0);
  const [lastPersonalBest, setLastPersonalBest] = useState(false);

  // One stopwatch per whole question (all phases included); counted only while actively playing.
  // The ref is authoritative so React rerenders / 250ms display ticks cannot reset time.
  const clock = React.useRef({begun:false, finished:false, runningSince:null as number|null, accumulated:0});
  const everRevealed = React.useRef(false);
  const checkLocked = React.useRef(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [clockActive, setClockActive] = useState(false);
  const [clockStarted, setClockStarted] = useState(false);
  const [clockFinished, setClockFinished] = useState(false);
  const [overFiveMinutes, setOverFiveMinutes] = useState(false);
  const getClockMs = useCallback(() => clock.current.accumulated +
    (clock.current.runningSince === null ? 0 : Math.max(0, performance.now()-clock.current.runningSince)), []);
  const pauseClock = useCallback(() => {
    const current = clock.current;
    if (current.runningSince !== null) {
      current.accumulated += Math.max(0, performance.now()-current.runningSince);
      current.runningSince = null;
      setClockActive(false);
      setElapsedMs(current.accumulated);
    }
  }, []);
  const startClock = useCallback(() => {
    const current = clock.current;
    if (current.finished || current.begun) return;
    current.begun = true;
    setClockStarted(true);
    if (!document.hidden) {
      current.runningSince = performance.now();
      setClockActive(true);
    }
  }, []);
  const resumeClock = useCallback(() => {
    const current = clock.current;
    if (current.begun && !current.finished && current.runningSince === null && !document.hidden) {
      current.runningSince = performance.now();
      setClockActive(true);
    }
  }, []);
  const resetClock = useCallback(() => {
    clock.current = {begun:false, finished:false, runningSince:null, accumulated:0};
    everRevealed.current = false;
    checkLocked.current = false;
    setClockActive(false);
    setClockStarted(false);
    setClockFinished(false);
    setOverFiveMinutes(false);
    setElapsedMs(0);
  }, []);
  const finishClock = useCallback(() => {
    const duration = getClockMs();
    clock.current = {...clock.current, accumulated:duration, runningSince:null, finished:true};
    setElapsedMs(duration);
    setClockActive(false);
    setClockFinished(true);
    return duration;
  }, [getClockMs]);
  // Background / settings / wardrobe should not consume an active challenge.
  const browsingMenu = wardrobeOpen || isWordModalOpen || isProfileModalOpen ||
    isLevelSelectorOpen || isSoundStudioOpen || isSettingsOpen || isHintModalOpen || isCloudOpen || friendsOpen || !inStudy;
  useEffect(() => {
    if (browsingMenu) pauseClock();
    else resumeClock();
  }, [browsingMenu, pauseClock, resumeClock]);
  useEffect(() => {
    const onVisibility = () => document.hidden ? pauseClock() : (!browsingMenu && resumeClock());
    document.addEventListener('visibilitychange',onVisibility);
    return () => document.removeEventListener('visibilitychange',onVisibility);
  }, [browsingMenu, pauseClock, resumeClock]);
  useEffect(() => {
    if (!clockActive) return;
    const timer = window.setInterval(() => {
      const ms = getClockMs();
      // Update only when the displayed second changes. Frequent React rerenders
      // used to destabilize HTML5 drag-and-drop in the original game.
      setElapsedMs(previous => Math.floor(previous / 1000) === Math.floor(ms / 1000) ? previous : ms);
      // One late quip per question: the translator does not chatter on every tick.
      if (ms > 300_000) setOverFiveMinutes(true);
    }, 250);
    return () => window.clearInterval(timer);
  }, [clockActive, getClockMs]);

  useEffect(()=>{localStorage.setItem('english_blocks_cat_collection_v1',JSON.stringify(collection));},[collection]);
  // Current Level
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(() => resumeLevelIndex(profile, SENTENCE_BANK));
  const currentLevel: LevelData = useMemo(() => {
    return SENTENCE_BANK[currentLevelIndex] || SENTENCE_BANK[0];
  }, [currentLevelIndex]);

  // Current learning phase tier (1: 初级, 2: 中级, 3: 高级, 4: 专业)
  const currentTier = currentLevel.tier || 1;

  // Tiered Assembly Phase index (for Level 5 super long sentences)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);

  // A single atomic board state: avoid separate, potentially inconsistent updates.
  // Every slot is explicit `null` until filled (never a sparse JS array).
  const [board, updateBoard] = useState<RailState>({slots: [], pool: []});
  const boardContext = React.useRef({level:currentLevel.id,phase:0,owner:cloudSync.getState().user?.id||'local'});
  const setBoard = useCallback((action:React.SetStateAction<RailState>) => {
    const context={...boardContext.current};
    updateBoard(previous=>{const next=typeof action==='function'?action(previous):action;
      persistBoard(context.owner,context.level,context.phase,next);return next;});
  },[]);
  const slottedWords = board.slots;
  const candidateWords = board.pool;

  // State flags
  const [isWobbling, setIsWobbling] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Completed lessons open as a preserved exhibit. Replay is always unscored.
  const [reviewMode, setReviewMode] = useState(false);
  const [completedView, setCompletedView] = useState(false);
  const replayLevelRef = React.useRef<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);



  // Save profile to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('word_candy_single_profile_v3', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  // Account sync replaces the anonymous shared LAN save. Local saves remain available offline.
  const cloud = useCloudSync(profile,collection,(snapshot)=>{
    setProfile({...DEFAULT_PROFILE,...snapshot.profile});
    setCollection({...EMPTY_COLLECTION,...snapshot.collection});
    setSoundEnabled(sound.enabled);
    resetClock();setHintCount(0);setAnswerRevealed(false);setIsSuccessModalOpen(false);
    completedIdsRef.current=snapshot.profile.completedLevelIds;
    replayLevelRef.current=null;
    initLevel(SENTENCE_BANK[resumeLevelIndex(snapshot.profile,SENTENCE_BANK)]||SENTENCE_BANK[0],0);
    setCurrentLevelIndex(resumeLevelIndex(snapshot.profile, SENTENCE_BANK));
    setCurrentPhaseIndex(0);
    setIsLevelSelectorOpen(false);
  },()=>clock.current.begun&&!clock.current.finished);

  const social=useSocialActivity(cloud.user?.id,currentLevel.id);

  // Shuffle helper function
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const completedIdsRef = React.useRef(profile.completedLevelIds);
  completedIdsRef.current = profile.completedLevelIds;
  // Initialize level words when level or phase changes
  const initLevel = useCallback(
    (level: LevelData, phaseIdx = 0) => {
      checkLocked.current = false;
      setHintCount(0);
      setAnswerRevealed(false);
      setIsCorrect(false);
      setIsWobbling(false);
      const replaying = replayLevelRef.current === level.id;
      const previouslyCompleted = !replaying && completedIdsRef.current.includes(level.id);
      setCompletedView(previouslyCompleted);
      setReviewMode(replaying);

      let targetWords = level.words;

      // If tiered mode is active for Level 5
      if (level.tieredAssembly && level.tieredAssembly.phases[phaseIdx]) {
        const phase = level.tieredAssembly.phases[phaseIdx];
        targetWords = level.words.filter((w) => phase.wordIds.includes(w.id));
      }

      // Shuffle candidate bank
      const fresh = newRail(targetWords, shuffleArray);
      const owner=cloudSync.getState().user?.id||'local';
      boardContext.current={level:level.id,phase:phaseIdx,owner};
      setBoard(previouslyCompleted ? filledAnswerBoard(fresh, level, phaseIdx) :
        replaying ? fresh : restoreBoard(owner,level.id,phaseIdx,targetWords)||fresh);
    },
    // Completion list is intentionally read on level entry only.
    []
  );

  useEffect(() => {
    initLevel(currentLevel, currentPhaseIndex);
  }, [currentLevel, currentPhaseIndex, initLevel, cloud.user?.id]);
  useEffect(() => { resetClock(); }, [currentLevel.id, resetClock]);

  // Expected words count for the current challenge
  const expectedCount = useMemo(() => {
    if (
      currentLevel.tieredAssembly &&
      currentLevel.tieredAssembly.phases[currentPhaseIndex]
    ) {
      return currentLevel.tieredAssembly.phases[currentPhaseIndex].wordIds.length;
    }
    return currentLevel.correctSequence.length;
  }, [currentLevel, currentPhaseIndex]);

  // Dynamic Word Mastery Calculation
  const masteredWordsCount = useMemo(() => {
    const wordSet = new Set<string>();
    SENTENCE_BANK.forEach((lvl) => {
      if (profile.completedLevelIds.includes(lvl.id)) {
        lvl.words.forEach((w) => wordSet.add(w.cleanWord.toLowerCase()));
      }
    });
    profile.masteredWordIds.forEach((id) => wordSet.add(id));
    return wordSet.size;
  }, [profile.completedLevelIds, profile.masteredWordIds]);

  // Evaluate current assembly continuously for Mimi cat translator reaction
  const evaluation = useMemo(() => {
    return evaluateCurrentAssembly(slottedWords, currentLevel, currentPhaseIndex);
  }, [slottedWords, currentLevel, currentPhaseIndex]);

  const matchedSlots = useMemo(() => exactSlotMatches(slottedWords, currentLevel, currentPhaseIndex), [slottedWords, currentLevel, currentPhaseIndex]);
  const matchedCount = matchedSlots.filter(Boolean).length;

  const revealFullAnswer = () => {
    everRevealed.current = true;
    setHintCount(3);
    setAnswerRevealed(true);
  };
  const fillFullAnswer = () => {
    everRevealed.current = true;
    setAnswerRevealed(true);
    setBoard(prev => filledAnswerBoard(prev, currentLevel, currentPhaseIndex));
    setIsHintModalOpen(false);
  };

  // Mimi Cat emotion change sound effect
  const lastMascotEmotionRef = React.useRef(evaluation.emotion);
  useEffect(() => {
    if (lastMascotEmotionRef.current !== evaluation.emotion) {
      lastMascotEmotionRef.current = evaluation.emotion;
      // 拼词过程只更新表情，不自动播放猫叫，避免每放一个词都吵。
    }
  }, [evaluation.emotion, slottedWords.length]);

  // One action -> one atomic update. Even rapid repeated drops cannot duplicate a word.
  const handleWordClickFromCandidate = (word: WordBlock) => {
    if (!isCorrect && !completedView) { if (!reviewMode) startClock(); setBoard(prev => putFirstAvailable(prev, word.id)); }
  };
  const handleRemoveWordFromRail = (index: number) => {
    if (!isCorrect && !completedView) setBoard(prev => takeBack(prev, index));
  };
  const handleMoveWordInRail = (fromIndex: number, toIndex: number, side: InsertSide = 'before') => {
    if (!isCorrect && !completedView) setBoard(prev => moveByInsertion(prev, fromIndex, toIndex, side));
  };
  const handleDropWordToSlot = (targetIndex: number, candidateId?: string, side: InsertSide = 'before') => {
    if (!isCorrect && !completedView && candidateId) { if (!reviewMode) startClock(); setBoard(prev => insertFromPool(prev, targetIndex, candidateId, side)); }
  };
  const handleClearAll = () => {
    if (isCorrect || completedView) return;
    sound.playShuffle();
    setBoard(emptyRail);
  };
  const handleShuffleCandidates = () => {
    setBoard(prev => ({...prev, pool: shuffleArray(prev.pool)}));
  };

  const beginUnscoredReplay = () => {
    replayLevelRef.current = currentLevel.id;
    resetClock();
    setCompletedView(false);
    setReviewMode(true);
    setIsCorrect(false);
    setHintCount(0);
    setAnswerRevealed(false);
    checkLocked.current = false;
    setBoard(newRail(currentLevel.tieredAssembly?.phases[currentPhaseIndex] ? currentLevel.words.filter(w => currentLevel.tieredAssembly!.phases[currentPhaseIndex].wordIds.includes(w.id)) : currentLevel.words, shuffleArray));
  };

  // Check sentence trigger
  const handleCheckSentence = () => {
    if (isCorrect || completedView || checkLocked.current) return;
    const isNowCorrect = evaluation.isCorrect;
    if(isNowCorrect) social.record(currentPhaseIndex,slottedWords);
    if (isNowCorrect) checkLocked.current = true;
    const hasMorePhases = Boolean(currentLevel.tieredAssembly &&
      currentPhaseIndex < currentLevel.tieredAssembly.phases.length - 1);
    const assisted = answerRevealed || everRevealed.current;
    // Stop only when the *whole level* is finished, not after a partial assembly phase.
    const finalElapsed = isNowCorrect && !hasMorePhases ? finishClock() : 0;
    const timing = isNowCorrect && !hasMorePhases
      ? recordLevelTime(profile.timingRecords?.[String(currentLevel.id)], finalElapsed, assisted)
      : null;

    if (!reviewMode) setProfile((p) => {
      const total = p.totalAttempts + 1;
      const correct = isNowCorrect ? p.correctAttempts + 1 : p.correctAttempts;
      const newCompleted =
        isNowCorrect && !p.completedLevelIds.includes(currentLevel.id)
          ? [...p.completedLevelIds, currentLevel.id]
          : p.completedLevelIds;

      const newWords = isNowCorrect ? currentLevel.words.map((w) => w.cleanWord.toLowerCase()) : [];
      const updatedMastered = Array.from(new Set([...p.masteredWordIds, ...newWords]));

      const mistakes = !isNowCorrect
        ? [
            ...p.mistakeHistory,
            {
              levelId: currentLevel.id,
              wrongSentence: evaluation.currentText,
              targetSentence: currentLevel.targetEnglish,
              timestamp: Date.now(),
            },
          ]
        : p.mistakeHistory;

      return {
        ...p,
        totalAttempts: total,
        correctAttempts: correct,
        completedLevelIds: newCompleted,
        masteredWordIds: updatedMastered,
        mistakeHistory: mistakes,
        // After a successful final phase, refreshing must resume at the NEXT lesson.
        currentLevelIndex: isNowCorrect && !(currentLevel.tieredAssembly && currentPhaseIndex < currentLevel.tieredAssembly.phases.length - 1)
          ? Math.min(currentLevelIndex + 1, SENTENCE_BANK.length - 1)
          : p.currentLevelIndex,
        progressVersion: 3,
        timingRecords: timing ? {...p.timingRecords, [String(currentLevel.id)]: timing.record} : p.timingRecords,
      };
    });

    if (isNowCorrect) {
      if (reviewMode) {
        if (hasMorePhases) {
          setCurrentPhaseIndex(prev => prev + 1);
          return;
        }
        replayLevelRef.current = null;
        setIsCorrect(true);
        setCompletedView(true);
        setReviewMode(false);
        setLastFishReward(0);
        setLastSpeedReward(0);
        setLastCompletionMs(0);
        setLastPersonalBest(false);
        setReplayCelebration(true);
        sound.playVictory();
        setTimeout(() => setIsSuccessModalOpen(true), 350);
        return;
      }
      setReplayCelebration(false);
      const key=String(currentLevel.id);
      const previous=collection.bestHints[key];
      // 只在首次通关或刷新该关最佳提示次数时发放差额，避免重复刷同一题无限领分。
      const reward=assisted ? 0 : previous===undefined?rewardForHints(hintCount):Math.max(0,rewardForHints(hintCount)-rewardForHints(previous));
      const speedReward = timing?.speedReward ?? 0;
      setLastFishReward(reward+speedReward);
      setLastSpeedReward(speedReward);
      if (timing) { setLastCompletionMs(finalElapsed); setLastPersonalBest(timing.isPersonalBest); }
      setCollection(p=>({...p,fish:p.fish+reward+speedReward,bestHints: assisted ? p.bestHints : {...p.bestHints,[key]:Math.min(p.bestHints[key]??99,hintCount)}}));
      setIsCorrect(true);
      sound.playVictory(); // Always play the celebration SFX, independent of BGM playback.

      if (hasMorePhases) {
        sound.playVictory();
        setTimeout(() => {
          setCurrentPhaseIndex((prev) => prev + 1);
        }, 800);
      } else {
        // Begin the selected English voice right after a successful answer;
        // do not add the old half-second celebration-modal delay.
        if (sound.autoReadOnSuccess) sound.speakText(currentLevel.targetEnglish);
        setTimeout(() => {
          setIsSuccessModalOpen(true);
        }, 500);
      }
    } else {
      setIsWobbling(true);
      sound.playWobble();
      setTimeout(() => {
        setIsWobbling(false);
      }, 500);
    }
  };

  // Next level navigation
  const handleNextLevel = () => {
    replayLevelRef.current = null;
    setIsSuccessModalOpen(false);
    setReplayCelebration(false);
    setCurrentPhaseIndex(0);
    const nextIdx = (currentLevelIndex + 1) % SENTENCE_BANK.length;
    setCurrentLevelIndex(nextIdx);
    setProfile(p => ({...p, currentLevelIndex: nextIdx, progressVersion: 3}));
  };

  const handleReplayCurrent = () => {
    setReplayCelebration(false);
    setIsSuccessModalOpen(false);
    resetClock();
    beginUnscoredReplay();
  };

  const handleJumpToLevel = (levelId: number) => {
    const idx = SENTENCE_BANK.findIndex((l) => l.id === levelId);
    if (idx !== -1) {
      setInStudy(true);
      replayLevelRef.current = null;
      resetClock();
      if (idx === currentLevelIndex) initLevel(currentLevel, 0);
      setCurrentLevelIndex(idx);
      setCurrentPhaseIndex(0);
      setProfile(p => ({...p, currentLevelIndex: idx, progressVersion: 3}));
    }
  };

  const handleSelectTier = (tier: number) => {
    const firstLevelOfTier = SENTENCE_BANK.find((l) => l.tier === tier);
    if (firstLevelOfTier) {
      handleJumpToLevel(firstLevelOfTier.id);
    }
  };

  // Word inspect modal handlers
  const handleOpenWordInfo = (word: WordBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWordForModal(word);
    setIsWordModalOpen(true);
    sound.playPop(1.1);
  };

  const handleToggleStarWord = (wordId: string) => {
    setProfile((p) => {
      const exists = p.starredWordIds.includes(wordId);
      return {
        ...p,
        starredWordIds: exists
          ? p.starredWordIds.filter((id) => id !== wordId)
          : [...p.starredWordIds, wordId],
      };
    });
  };

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sound.setMasterEnabled(nextState);
  };

  // Restore BGM at startup. Browsers may require the first user gesture.
  useEffect(() => {
    let cancelled = false;
    let attempted = false;
    const start = () => {
      if (cancelled || attempted || sound.bgmRestoring) return;
      attempted = true;
      if (sound.bgmVolume > 0) void sound.startBgm();
    };
    start();
    const timer = window.setInterval(start, 200);
    const gesture = () => {
      if (!cancelled && !sound.bgmPlaying && !sound.bgmLoading && sound.bgmVolume > 0) void sound.startBgm();
    };
    window.addEventListener('pointerdown', gesture, { once: true });
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener('pointerdown', gesture); };
  }, []);

  const [layoutDraft, setLayoutDraft] = useState(layout.initial);
  useEffect(()=>{
    const update=()=>setLayoutDraft(readLayout());
    window.addEventListener('storage',update);
    window.addEventListener('englishblocks-layout-updated',update);
    return ()=>{window.removeEventListener('storage',update);window.removeEventListener('englishblocks-layout-updated',update)};
  },[]);
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
  // Owner-only shortcut; no permanent edit button in the published game.
  useEffect(() => {
    if (!layout.developerMode) return;
    const toggle = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault(); setLayoutEditorOpen(open => !open);
      }
    };
    window.addEventListener('keydown', toggle);
    return () => window.removeEventListener('keydown', toggle);
  }, [layout.developerMode]);
  useEffect(()=>{const id=window.requestAnimationFrame(()=>applyElementLayouts(layout.developerMode ? layoutDraft : {...layoutDraft, elements: {}}));return ()=>window.cancelAnimationFrame(id)},[layoutDraft,completedView,reviewMode,layout.developerMode]);
  const developerMode = layout.developerMode;
  const layoutStyle = (key: 'sidebar' | 'progress' | 'board'): React.CSSProperties => ({
    transform: `translate(${layoutDraft[key].x}px, ${layoutDraft[key].y}px)`,
    zoom: layoutDraft[key].scale / 100,
  });
  const [replayCelebration, setReplayCelebration] = useState(false);

  return (
    <>
    <div style={friendsOpen||!inStudy?{display:'none'}:undefined} className="eb-game-shell min-h-screen cozy-window-bg relative flex flex-col justify-between overflow-x-hidden p-4 md:p-6 lg:p-7 selection:bg-amber-100 selection:text-amber-950" onClickCapture={(event) => playUiClickForTarget(event.target)}>
      {showSplash && <div id="eb-splash" role="status" aria-label="英语拼块正在启动"><div className="eb-splash-card"><img src="./assets/brand-mimi-a.png" alt="咪咪"/><h1>英语拼块</h1><p>WORD BLOCK GARDEN</p><div className="eb-splash-bar"><span /></div><small>正在准备你的学习花园…</small></div></div>}
      {developerMode && layoutEditorOpen && <LayoutEditor value={layoutDraft} onChange={setLayoutDraft} onClose={() => setLayoutEditorOpen(false)} />}
      {/* ATMOSPHERIC BACKGROUND DECORATIONS (Sunlit leaves & wooden window details) */}
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-20 bg-gradient-to-bl from-emerald-300 via-yellow-200 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none opacity-20 bg-gradient-to-tr from-amber-200 via-orange-100 to-transparent blur-2xl" />

      {/* MAIN CONTAINER: SIDEBAR + MAIN CONTENT AREA */}
      <div className="eb-layout relative z-10 w-full mx-auto flex flex-col lg:flex-row items-stretch flex-1" style={{maxWidth: `${layoutDraft.pageWidth}px`, gap: `${layoutDraft.gap}px`}}>
        {/* RIGHT PLAYGROUND COLUMN */}
        <div className="eb-game-main flex-1 flex flex-col justify-start">
          {/* TOP PROGRESS CAPSULES (Matching Screenshot) */}
          <header className="eb-study-heading"><button type="button" onClick={()=>{persistBoard(boardContext.current.owner,currentLevel.id,currentPhaseIndex,board);pauseClock();setInStudy(false);window.scrollTo({top:0});}}>← 返回大厅</button><div><strong>第 {currentLevel.levelNumber} 关</strong><span>已完成 {profile.completedLevelIds.length} / {SENTENCE_BANK.length} 关</span></div></header>
          {completedView && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C6DCC7] bg-[#F0F8ED] px-4 py-3 text-sm text-[#426C50]"><span>已通关 · 这是你上次拼好的完整句子</span><button type="button" onClick={beginUnscoredReplay} className="rounded-full bg-white border border-[#AACBAF] px-4 py-2 font-bold hover:bg-[#E1F0E1]">重新拼一次（不计时、不积分）</button><button type="button" onClick={() => {setReplayCelebration(true);setLastFishReward(0);setLastSpeedReward(0);setLastCompletionMs(0);setLastPersonalBest(false);sound.playVictory();setIsSuccessModalOpen(true);}} className="rounded-full bg-white border border-[#AACBAF] px-4 py-2 font-bold hover:bg-[#E1F0E1]">重看通关庆祝</button></div>}
          {reviewMode && <div className="mt-3 rounded-2xl border border-[#D6DCCB] bg-[#F8F8EE] px-4 py-2 text-sm text-[#63765B]">自由复习中 · 不计时、不积分、不覆盖原成绩</div>}
          <div data-eb-edit="status" className="mt-3 flex flex-wrap justify-end gap-3 text-xs text-[#64785A]">
            {social.learningError&&<span role="status">{social.learningError}<button className="underline" onClick={social.retryRecord}>重试确认</button></span>}
            <span>提示 {hintCount}/3 · 本关预计 +{completedView || reviewMode || answerRevealed ? 0 : rewardForHints(hintCount)} 🐟</span>
          </div>
          {/* MAIN STUDY BOARD CARD (Matching Screenshot with Mimi peeking) */}
          <div data-eb-edit="board" className="mt-2 eb-full-height-board" style={{...layoutStyle('board'), '--eb-board-scale': layoutDraft.board.scale / 100} as React.CSSProperties}>
            <MainStudyBoard
              studyActive={inStudy&&!friendsOpen}
              onOpenCloud={()=>setIsCloudOpen(true)}
              activeCat={collection.activeCat}
              catOutfit={collection.equipped?.[collection.activeCat] || {}}
              catPose={collection.poses?.[collection.activeCat] || 'peek'}
              catExpression={collection.expressions?.[collection.activeCat] || 'smile'}
              challengeStarted={clockStarted && !completedView && !reviewMode}
              challengeElapsedMs={elapsedMs}
              challengeFinished={clockFinished}
              level={currentLevel}
              currentPhaseIndex={currentPhaseIndex}
              slottedWords={slottedWords}
              candidateWords={candidateWords}
              expectedCount={expectedCount}
              matchedSlots={matchedSlots}
              matchedCount={matchedCount}
              isCorrect={isCorrect || completedView}
              isWobbling={isWobbling}
              evaluation={evaluation}
              timeRoast={overFiveMinutes && !isCorrect}
              onWordClick={handleWordClickFromCandidate}
              onRemoveWord={handleRemoveWordFromRail}
              onMoveWord={handleMoveWordInRail}
              onWordInfo={handleOpenWordInfo}
              onDropWordToSlot={handleDropWordToSlot}
              onClearAll={handleClearAll}
              onShuffle={handleShuffleCandidates}
              onCheckSentence={handleCheckSentence}
              onShowHint={() => { sound.playSlot('hint'); setIsHintModalOpen(true); }}
              onDragStartWord={() => { if (!reviewMode && !completedView) startClock(); /* drag itself starts a challenge */ }}
            />
          </div>
        </div>
      </div>

      <CloudSyncModal open={isCloudOpen} onClose={()=>setIsCloudOpen(false)} local={{profile,collection}} />
      <CatWardrobeModal open={wardrobeOpen} onClose={()=>setWardrobeOpen(false)} collection={collection} setCollection={setCollection} unlockedTier={Math.max(currentTier,...SENTENCE_BANK.filter(l=>profile.completedLevelIds.includes(l.id)).map(l=>l.tier))} />
      {/* MODALS */}
      {/* Vocabulary Detail Modal */}
      <WordCardModal
        isOpen={isWordModalOpen}
        word={selectedWordForModal}
        isStarred={
          selectedWordForModal
            ? profile.starredWordIds.includes(selectedWordForModal.id)
            : false
        }
        onToggleStar={handleToggleStarWord}
        onClose={() => setIsWordModalOpen(false)}
      />

      {/* Level Passed Celebration Modal */}
      <SuccessCelebrationModal
        isOpen={isSuccessModalOpen}
        level={currentLevel}
        totalSentencesGoal={profile.totalSentenceGoal}
        completedCount={profile.completedLevelIds.length}
        onNextLevel={handleNextLevel}
        onReplay={handleReplayCurrent}
        fishReward={lastFishReward}
        usedFullAnswer={replayCelebration || answerRevealed || everRevealed.current}
        isReview={replayCelebration}
        completedMs={lastCompletionMs}
        speedReward={lastSpeedReward}
        personalBest={lastPersonalBest}
      />

      {/* Learning Stats & Word Goals Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        wordsMasteredCount={masteredWordsCount}
        totalWordsGoal={profile.totalWordGoal}
        onUpdateProfileName={(newName) => {
          setProfile((p) => ({ ...p, name: newName }));
        }}
        onJumpToLevel={handleJumpToLevel}
        currentLevel={currentLevel}
        fishCount={collection.fish}
      />

      {/* Level Selector Modal (Anti-spoiler: Hides English in Unfinished levels) */}
      <LevelSelectorModal
        isOpen={isLevelSelectorOpen}
        currentLevelId={currentLevel.id}
        completedLevelIds={profile.completedLevelIds}
        onSelectLevel={handleJumpToLevel}
        onClose={() => setIsLevelSelectorOpen(false)}
      />

      {/* Grammar Hint Modal */}
      <GrammarHintModal
        hintCount={hintCount}
        onMoreHint={() => setHintCount(p=>Math.min(3,p+1))}
        isOpen={isHintModalOpen}
        level={currentLevel}
        phaseIndex={currentPhaseIndex}
        onClose={() => setIsHintModalOpen(false)}
        answerRevealed={answerRevealed}
        onRevealAnswer={revealFullAnswer}
        onFillAnswer={fillFullAnswer}
      />

      {/* Sound Studio Modal (Kitten meow sound effect slots & custom audio file upload) */}
      <SoundStudioModal
        isOpen={isSoundStudioOpen}
        onClose={() => setIsSoundStudioOpen(false)}
      />

      {/* Settings Modal (User profile, avatar, targets, speech rate & progress reset) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onOpenCloud={()=>{setIsSettingsOpen(false);setIsCloudOpen(true);}}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={(updated) => {
          setProfile((p) => ({ ...p, ...updated }));
        }}
        onResetProgress={() => {
          setProfile(DEFAULT_PROFILE);
          resetClock();
          setCurrentLevelIndex(0);
          setCurrentPhaseIndex(0);
          initLevel(SENTENCE_BANK[0]);
        }}
      />
    </div>
    {!inStudy&&!friendsOpen&&<LearningLobby name={profile.name} collection={collection} level={currentLevel.levelNumber} completed={profile.completedLevelIds.length} total={SENTENCE_BANK.length} words={masteredWordsCount} season={season} onSeason={setSeason} onContinue={()=>{setInStudy(true);window.scrollTo({top:0});}} actions={[
      {label:'关卡选择',icon:'▦',onClick:()=>setIsLevelSelectorOpen(true)},
      {label:'学习进度',icon:'🌿',onClick:()=>setIsProfileModalOpen(true)},
      {label:'好友小窝',icon:'🏡',onClick:openFriends,detail:social.pending?`${social.pending} 封小窝来信`:undefined},
      {label:'音乐设置',icon:'♫',onClick:()=>setIsSoundStudioOpen(true)},
      {label:'小猫衣柜',icon:'🎀',onClick:()=>setWardrobeOpen(true)},
      {label:'云端存档',icon:'☁',onClick:()=>setIsCloudOpen(true),detail:cloud.user?cloud.status:'登录并同步'},
      {label:'游戏设置',icon:'⚙',onClick:()=>setIsSettingsOpen(true)}
    ]}/>}
    {friendsOpen&&<FriendsPage userId={cloud.user?.id} onBack={closeFriends} onLogin={()=>setIsCloudOpen(true)}/>}
    {!friendsOpen&&!inStudy&&<PrankToast key={cloud.user?.id||'local'} inbox={social.inbox} wallet={social.wallet} open={pranksOpen} onClose={()=>setPranksOpen(false)} onViewAll={openFriends}/>}
    </>
  );
}
