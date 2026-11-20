import { useEffect, useMemo, useRef, useState } from "react";
import { ASSETS } from "../../data/assets.js";
import {
  DEFAULT_ASSETS,
  LED_YELLOW,
  GAME,
  DIRECTIONS,
  PHASE,
  COMMENTARY,
  clamp,
  getDirection,
  randomDirection,
  normaliseTeam,
  pointForDirection,
  keeperTransform,
  ballTransform,
  shotTravelMs,
  keeperTravelMs,
  classifyPower,
  resolvePenalty,
  buildAiPenaltyAttempt,
  applyGoldenGloveSecondRead,
  playSound,
  decideMatchState,
  stageLabelForFixture,
  buildResult,
} from "../../logic/penaltyEngine.js";
import { Scoreboard } from "./Scoreboard.jsx";
import SharedCrowdBackdrop from "../crowd/SharedCrowdBackdrop.jsx";
import { GOLDEN_BALL_SRC, GOLDEN_GLOVE_SRC, readActiveCosmetics } from "../../logic/cosmetics.js";
import {
  DEFAULT_ACCURACY_SWEEP_MS,
  PHASE_ACCURACY,
  POWER_SWEEP_MS,
  accuracyOutcomeForValue,
  accuracySpeedForPower,
  accuracyKeeperReadChanceForValue,
  displayedMeterValue,
  directionLabel,
  getAccuracyTargetZone,
  getPowerTargetZone,
  isAccuracyInTargetZone,
  isPowerInTargetZone,
  meterPoints,
} from "../../logic/shotMeter.js";
import { getPodiumBadgeVisuals } from "../../logic/matchVisuals.js";
import { PODIUM_BADGE_MODE } from "../../logic/resultStatus.js";
import { playerCareerStarRating } from "../../logic/playerCareer.js";
import { meterValueAtTime } from "../../logic/meterTiming.js";
import { precisionPoints, scoringMeterStop, scoreMatchdayAttempts, SCORING_SHOTS } from "../../logic/matchdayScoring.js";

import { ControlOverlay, Pitch, TemporaryMatchButtons } from "./FootballGameView.jsx";
import { CompetitionHomeOverlay } from "../competition/CompetitionUI.jsx";
export { MatchPitchPreview } from "./FootballGameView.jsx";

const USER_SHOT_RESULT_DELAY_MS = 150;
const USER_SHOT_RESULT_VOLUME = 0.5;
const SHOT_OUTCOME_HOLD_MS = 250;
const FINAL_SHOT_OUTCOME_HOLD_MS = 900;
const USER_TO_OPPONENT_DELAY_MS = 500;
const MATCH_COMPLETE_MODAL_DELAY_MS = 1100;

export default function FootballGame({ userTeam, opponentTeam, fixture, assets = {}, onMatchComplete, completedResult = null, endActionLabel = "MATCH COMPLETE", endActionEnabled = false, onEndAction, showChampionsBadge = false, podiumBadgeMode = null, activeCosmetics: activeCosmeticsProp = null, username = "", twoPlayerMode = false, simulateAwayPenalties = false, suddenDeathEnabled = true, competitionMode = false, stageLabelOverride = null, activeMatchSnapshot = null, onActiveMatchSnapshot = null, onFlashStyleChange = null, playerCareerStats = null, campaignAssistStars = null, introMode = false, homeMenuVisible = true, onEnterCompetition, onPractice }) {
  // Keep the Burnley two-player presentation (scoreboard, end modal, branding)
  // while restoring the existing automatic opponent penalty engine.
  const opponentIsHuman = twoPlayerMode && !simulateAwayPenalties;
  const user = useMemo(() => normaliseTeam(userTeam, "Team A"), [userTeam]);
  const opponent = useMemo(() => normaliseTeam(opponentTeam, "Team B"), [opponentTeam]);
  const livePlayerCareerStars = useMemo(() => (playerCareerStats ? playerCareerStarRating(playerCareerStats) : null), [playerCareerStats]);
  const playerCareerStars = useMemo(() => {
    const lockedStars = Number(campaignAssistStars);
    return Number.isFinite(lockedStars) ? lockedStars : livePlayerCareerStars;
  }, [campaignAssistStars, livePlayerCareerStars]);
  const storedActiveCosmetics = useMemo(() => readActiveCosmetics(), [fixture?.id, completedResult?.fixtureId, completedResult?.matchNo]);
  const activeCosmetics = activeCosmeticsProp || storedActiveCosmetics || {};
  const powerTargetZone = useMemo(() => getPowerTargetZone(activeCosmetics, playerCareerStars), [activeCosmetics, playerCareerStars]);
  const accuracyTargetZone = useMemo(() => getAccuracyTargetZone(activeCosmetics, playerCareerStars), [activeCosmetics, playerCareerStars]);
  const mergedAssets = useMemo(() => ({
    ...DEFAULT_ASSETS,
    ...assets,
    ball: activeCosmetics?.goldenBall ? GOLDEN_BALL_SRC : (assets?.ball || DEFAULT_ASSETS.ball),
    goalkeeper: activeCosmetics?.goldenGlove ? GOLDEN_GLOVE_SRC : (assets?.goalkeeper || DEFAULT_ASSETS.goalkeeper),
    sounds: { ...DEFAULT_ASSETS.sounds, ...(assets?.sounds || {}) },
  }), [assets, activeCosmetics]);
  const stageLabel = stageLabelOverride || stageLabelForFixture(fixture);

  const [phase, setPhase] = useState(PHASE.DIRECTION);
  const [shootingSide, setShootingSide] = useState("user");
  const [selected, setSelected] = useState(getDirection("CM"));
  const [lockedDirection, setLockedDirection] = useState(null);
  const [powerValue, setPowerValue] = useState(0);
  const [powerCharging, setPowerCharging] = useState(false);
  const [lockedPower, setLockedPower] = useState(null);
  const lockedPowerScoringRef = useRef(null);
  const [accuracyValue, setAccuracyValue] = useState(0);
  const [accuracyRunning, setAccuracyRunning] = useState(false);
  const [accuracySweepMs, setAccuracySweepMs] = useState(DEFAULT_ACCURACY_SWEEP_MS);
  const accuracySweepMsRef = useRef(DEFAULT_ACCURACY_SWEEP_MS);
  const powerValueRef = useRef(0);
  const powerFrameRef = useRef(null);
  const powerStartMsRef = useRef(null);
  const powerFillRef = useRef(null);
  const accuracyFillRef = useRef(null);
  const accuracyValueRef = useRef(0);
  const accuracyFrameRef = useRef(null);
  const accuracyStartMsRef = useRef(null);
  const [score, setScore] = useState({ user: 0, opponent: 0 });
  const [attempts, setAttempts] = useState({ user: [], opponent: [] });
  const [shot, setShot] = useState(null);
  const [ticker, setTicker] = useState(`${user.name.toUpperCase()} TO SHOOT`);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [winnerSide, setWinnerSide] = useState(null);

  const activeTeam = shootingSide === "user" ? user : opponent;
  const defenderTeam = shootingSide === "user" ? opponent : user;
  const shotActive = phase === PHASE.SHOT && Boolean(shot);
  const ballPoint = shot?.targetPoint ?? GAME.spot;
  const keeperPoint = shot ? pointForDirection(shot.keeperDirection) : pointForDirection(getDirection("CM"));
  const aimDirection = lockedDirection ?? selected;
  const showAim = phase === PHASE.DIRECTION;

  const isKnockoutShootout = Boolean(fixture?.requiresWinner);
  const matchFinished = phase === PHASE.FINISHED || hasCompleted;
  const afterRegulationTie =
    !competitionMode && suddenDeathEnabled &&
    isKnockoutShootout &&
    attempts.user.length >= GAME.regulationPens &&
    attempts.opponent.length >= GAME.regulationPens &&
    score.user === score.opponent;
  // Once a new sudden-death round has been opened for the user, keep that
  // extra marker slot visible through direction, power, accuracy and the shot
  // animation. Previously it only existed during PHASE.DIRECTION, so both
  // scoreboard rows briefly contracted as soon as the user started the shot.
  const startingUserSuddenDeath =
    afterRegulationTie &&
    !matchFinished &&
    shootingSide === "user";
  const hideMatchActors = matchFinished;
  const fixtureSnapshotKey = useMemo(() => {
    const id = fixture?.id || fixture?.fixtureId || fixture?.matchId || "fixture";
    const matchNo = fixture?.matchNo || fixture?.matchNumber || "";
    return `${id}:${matchNo}:${user.id}:${opponent.id}:${stageLabel}`;
  }, [fixture?.id, fixture?.fixtureId, fixture?.matchId, fixture?.matchNo, fixture?.matchNumber, user.id, opponent.id, stageLabel]);
  const lastSnapshotKeyRef = useRef(null);
  const restoreAppliedRef = useRef(null);
  const localSnapshotUpdatedAtRef = useRef(null);
  const aiRestoreTimeoutRef = useRef(null);
  const aiTurnTimeoutRef = useRef(null);
  const turnTimeoutRef = useRef(null);
  const matchCompleteTimeoutRef = useRef(null);
  const completionPendingRef = useRef(false);
  const matchCompletionDispatchedRef = useRef(false);

  const safeAttempts = (value) => ({
    user: Array.isArray(value?.user) ? value.user : [],
    opponent: Array.isArray(value?.opponent) ? value.opponent : [],
  });

  const safeScore = (value, fallbackAttempts = attempts) => {
    const userScore = Number(value?.user);
    const opponentScore = Number(value?.opponent);
    if (Number.isFinite(userScore) && Number.isFinite(opponentScore)) {
      return { user: userScore, opponent: opponentScore };
    }
    const source = safeAttempts(fallbackAttempts);
    return {
      user: source.user.filter((attempt) => attempt?.goal).length,
      opponent: source.opponent.filter((attempt) => attempt?.goal).length,
    };
  };

  const snapshotMatchesFixture = (snapshot) => {
    if (!snapshot || snapshot.completed) return false;
    const snapshotFixtureKey = snapshot.fixtureSnapshotKey || snapshot.fixtureKey || null;
    if (snapshotFixtureKey && snapshotFixtureKey !== fixtureSnapshotKey) return false;
    const snapshotFixtureId = snapshot.fixtureId || snapshot.matchId || null;
    const currentFixtureId = fixture?.id || fixture?.fixtureId || fixture?.matchId || null;
    if (snapshotFixtureId && currentFixtureId && snapshotFixtureId !== currentFixtureId) return false;
    if (snapshot.teamId && snapshot.teamId !== user.id) return false;
    if (snapshot.opponentId && snapshot.opponentId !== opponent.id) return false;
    return true;
  };

  const nextTurnFromAttempts = (attemptSource, scoreSource = score) => {
    const nextAttempts = safeAttempts(attemptSource);
    const nextScore = safeScore(scoreSource, nextAttempts);
    const matchState = decideMatchState({ attempts: nextAttempts, score: nextScore, fixture, suddenDeathEnabled, competitionMode });
    if (matchState.finished) {
      return { phase: PHASE.FINISHED, shootingSide: "user", ticker: matchState.draw ? "DRAW!" : `${(matchState.winnerSide === "user" ? user.name : opponent.name).toUpperCase()} WINS!`, winnerSide: matchState.winnerSide || null, completed: true };
    }
    if (nextAttempts.user.length > nextAttempts.opponent.length) {
      return {
        phase: opponentIsHuman ? PHASE.DIRECTION : PHASE.AI_WAIT,
        shootingSide: "opponent",
        ticker: `${opponent.name.toUpperCase()} TO SHOOT`,
        winnerSide: null,
        completed: false,
      };
    }
    return {
      phase: PHASE.DIRECTION,
      shootingSide: "user",
      ticker: `${user.name.toUpperCase()} TO SHOOT`,
      winnerSide: null,
      completed: false,
    };
  };

  const buildActiveSnapshot = (overrides = {}) => {
    const sourceAttempts = safeAttempts(overrides.attempts || attempts);
    const sourceScore = safeScore(overrides.score || score, sourceAttempts);
    const turn = overrides.turn || nextTurnFromAttempts(sourceAttempts, sourceScore);
    return {
      version: 1,
      fixtureSnapshotKey,
      fixtureId: fixture?.id || fixture?.fixtureId || fixture?.matchId || null,
      matchNo: fixture?.matchNo || fixture?.matchNumber || null,
      stageLabel,
      teamId: user.id,
      teamName: user.name,
      opponentId: opponent.id,
      opponentName: opponent.name,
      score: sourceScore,
      attempts: sourceAttempts,
      matchdayScore: scoreMatchdayAttempts(sourceAttempts),
      phase: overrides.phase || turn.phase,
      shootingSide: overrides.shootingSide || turn.shootingSide,
      ticker: overrides.ticker || turn.ticker,
      winnerSide: overrides.winnerSide ?? turn.winnerSide ?? null,
      completed: Boolean(overrides.completed ?? turn.completed),
      updatedAt: Date.now(),
    };
  };

  const emitActiveSnapshot = (overrides = {}) => {
    if (completedResult || hasCompleted) return;
    if (typeof onActiveMatchSnapshot !== "function") return;
    const snapshot = buildActiveSnapshot(overrides);
    const snapshotKey = JSON.stringify({
      fixtureSnapshotKey: snapshot.fixtureSnapshotKey,
      score: snapshot.score,
      attemptsUser: snapshot.attempts.user.map((attempt) => Boolean(attempt?.goal)),
      attemptsOpponent: snapshot.attempts.opponent.map((attempt) => Boolean(attempt?.goal)),
      phase: snapshot.phase,
      shootingSide: snapshot.shootingSide,
      completed: snapshot.completed,
    });
    if (lastSnapshotKeyRef.current === snapshotKey) return;
    lastSnapshotKeyRef.current = snapshotKey;
    localSnapshotUpdatedAtRef.current = snapshot.updatedAt;
    onActiveMatchSnapshot(snapshot);
  };

  const suddenDeathMarkerSlots = competitionMode ? GAME.regulationPens : Math.max(
    GAME.regulationPens,
    attempts.user.length,
    attempts.opponent.length,
    startingUserSuddenDeath ? Math.max(attempts.user.length, attempts.opponent.length) + 1 : 0
  );


  function clearGameplayTimeouts({ keepMatchComplete = false } = {}) {
    if (aiRestoreTimeoutRef.current) {
      window.clearTimeout(aiRestoreTimeoutRef.current);
      aiRestoreTimeoutRef.current = null;
    }
    if (aiTurnTimeoutRef.current) {
      window.clearTimeout(aiTurnTimeoutRef.current);
      aiTurnTimeoutRef.current = null;
    }
    if (turnTimeoutRef.current) {
      window.clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }
    if (!keepMatchComplete && matchCompleteTimeoutRef.current) {
      window.clearTimeout(matchCompleteTimeoutRef.current);
      matchCompleteTimeoutRef.current = null;
    }
  }

  useEffect(() => () => clearGameplayTimeouts(), []);

  const resetGame = () => {
    clearGameplayTimeouts();
    completionPendingRef.current = false;
    matchCompletionDispatchedRef.current = false;
    setPhase(PHASE.DIRECTION);
    setShootingSide("user");
    setSelected(getDirection("CM"));
    setLockedDirection(null);
    setPowerValue(0);
    powerValueRef.current = 0;
    setPowerCharging(false);
    setLockedPower(null);
    lockedPowerScoringRef.current = null;
    setAccuracyValue(0);
    accuracyValueRef.current = 0;
    setAccuracyRunning(false);
    setAccuracySweepMs(DEFAULT_ACCURACY_SWEEP_MS);
    accuracySweepMsRef.current = DEFAULT_ACCURACY_SWEEP_MS;
    powerStartMsRef.current = null;
    accuracyStartMsRef.current = null;
    if (powerFrameRef.current) cancelAnimationFrame(powerFrameRef.current);
    if (accuracyFrameRef.current) cancelAnimationFrame(accuracyFrameRef.current);
    setScore({ user: 0, opponent: 0 });
    setAttempts({ user: [], opponent: [] });
    setShot(null);
    setTicker(`${user.name.toUpperCase()} TO SHOOT`);
    setHasCompleted(false);
    setWinnerSide(null);
    lastSnapshotKeyRef.current = null;
    restoreAppliedRef.current = null;
    localSnapshotUpdatedAtRef.current = null;
    if (aiRestoreTimeoutRef.current) {
      window.clearTimeout(aiRestoreTimeoutRef.current);
      aiRestoreTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!completedResult && (hasCompleted || completionPendingRef.current)) return;
    if (activeMatchSnapshot?.updatedAt && activeMatchSnapshot.updatedAt === localSnapshotUpdatedAtRef.current) return;

    if (completedResult) {
      completionPendingRef.current = false;
      clearGameplayTimeouts();
      const userIsHome = completedResult.home === user.id;
      setScore({
        user: userIsHome ? completedResult.homeGoals : completedResult.awayGoals,
        opponent: userIsHome ? completedResult.awayGoals : completedResult.homeGoals,
      });
      const completedAttempts = completedResult.attempts || {};
      setAttempts({
        user: Array.isArray(completedAttempts.user) ? completedAttempts.user : [],
        opponent: Array.isArray(completedAttempts.opponent) ? completedAttempts.opponent : [],
      });
      setShot(null);
      setShootingSide("user");
      setWinnerSide(completedResult.isDraw ? null : completedResult.won ? "user" : "opponent");
      setTicker(completedResult.isDraw ? "DRAW!" : `${(completedResult.won ? user.name : opponent.name).toUpperCase()} WINS!`);
      setPhase(PHASE.FINISHED);
      setHasCompleted(true);
      return;
    }

    if (snapshotMatchesFixture(activeMatchSnapshot)) {
      if (activeMatchSnapshot?.updatedAt && activeMatchSnapshot.updatedAt === localSnapshotUpdatedAtRef.current) return;
      const restoreKey = `${activeMatchSnapshot.fixtureSnapshotKey || fixtureSnapshotKey}:${activeMatchSnapshot.updatedAt || ""}:${activeMatchSnapshot.attempts?.user?.length || 0}:${activeMatchSnapshot.attempts?.opponent?.length || 0}`;
      if (restoreAppliedRef.current === restoreKey) return;
      restoreAppliedRef.current = restoreKey;
      if (aiRestoreTimeoutRef.current) {
        window.clearTimeout(aiRestoreTimeoutRef.current);
        aiRestoreTimeoutRef.current = null;
      }
      const restoredAttempts = safeAttempts(activeMatchSnapshot.attempts);
      const restoredScore = safeScore(activeMatchSnapshot.score, restoredAttempts);
      const nextTurn = nextTurnFromAttempts(restoredAttempts, restoredScore);

      setScore(restoredScore);
      setAttempts(restoredAttempts);
      setShot(null);
      setSelected(getDirection("CM"));
      setLockedDirection(null);
      setPowerValue(0);
      powerValueRef.current = 0;
      setPowerCharging(false);
      setLockedPower(null);
      setAccuracyValue(0);
      accuracyValueRef.current = 0;
      setAccuracyRunning(false);
      setAccuracySweepMs(DEFAULT_ACCURACY_SWEEP_MS);
      accuracySweepMsRef.current = DEFAULT_ACCURACY_SWEEP_MS;
      setShootingSide(nextTurn.shootingSide);
      setTicker(nextTurn.ticker);
      setWinnerSide(nextTurn.winnerSide);
      setHasCompleted(Boolean(nextTurn.completed));
      setPhase(nextTurn.phase);

      if (!opponentIsHuman && !nextTurn.completed && nextTurn.shootingSide === "opponent") {
        aiRestoreTimeoutRef.current = window.setTimeout(() => {
          aiRestoreTimeoutRef.current = null;
          const aiDirection = randomDirection();
          const aiAttempt = buildAiPenaltyAttempt({ team: opponent, direction: aiDirection, playerCareerStars });
          const keeperDirection = activeCosmetics?.goldenGlove
            ? applyGoldenGloveSecondRead({ targetDirection: aiDirection, firstKeeperDirection: aiAttempt.keeperDirection })
            : aiAttempt.keeperDirection;
          commitShot("opponent", aiDirection, aiAttempt.power, restoredScore, restoredAttempts, keeperDirection);
        }, GAME.aiWaitMs + USER_TO_OPPONENT_DELAY_MS);
      }
      return;
    }

    resetGame();
    // The fixture id is the parent-controlled reset boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureSnapshotKey, user.id, opponent.id, completedResult?.fixtureId, completedResult?.matchNo, activeMatchSnapshot?.updatedAt, hasCompleted]);

  function finishTurn(nextAttempts, nextScore, side) {
    const matchState = decideMatchState({ attempts: nextAttempts, score: nextScore, fixture, suddenDeathEnabled, competitionMode });
    if (matchState.finished) {
      // This transition may be reached by both the shot timer and the
      // regulation-complete fallback. Only submit the result once.
      if (matchCompletionDispatchedRef.current) return;
      matchCompletionDispatchedRef.current = true;
      completionPendingRef.current = true;
      const result = buildResult({ fixture, userTeam: user, opponentTeam: opponent, score: nextScore, winnerSide: matchState.winnerSide, isDraw: matchState.draw, attempts: nextAttempts });
      setPhase(PHASE.FINISHED);
      setWinnerSide(matchState.winnerSide);
      const winnerName = matchState.winnerSide === "user" ? user.name : opponent.name;
      setTicker(matchState.draw ? "DRAW!" : `${winnerName.toUpperCase()} WINS!`);
      setHasCompleted(true);
      if (matchCompleteTimeoutRef.current) window.clearTimeout(matchCompleteTimeoutRef.current);
      matchCompleteTimeoutRef.current = window.setTimeout(() => {
        matchCompleteTimeoutRef.current = null;
        onMatchComplete?.(result);
      }, MATCH_COMPLETE_MODAL_DELAY_MS);
      return;
    }

    if (side === "user") {
      setShootingSide("opponent");
      setTicker(`${opponent.name.toUpperCase()} TO SHOOT`);
      setShot(null);
      setSelected(getDirection("CM"));
      setLockedDirection(null);
      setPowerValue(0);
      powerValueRef.current = 0;
      setPowerCharging(false);
      setLockedPower(null);
      setAccuracyValue(0);
      accuracyValueRef.current = 0;
      setAccuracyRunning(false);
      setAccuracySweepMs(DEFAULT_ACCURACY_SWEEP_MS);
      accuracySweepMsRef.current = DEFAULT_ACCURACY_SWEEP_MS;
      if (opponentIsHuman) {
        setPhase(PHASE.DIRECTION);
        emitActiveSnapshot({ attempts: nextAttempts, score: nextScore, phase: PHASE.DIRECTION, shootingSide: "opponent", ticker: `${opponent.name.toUpperCase()} TO SHOOT` });
        return;
      }
      setPhase(PHASE.AI_WAIT);
      emitActiveSnapshot({ attempts: nextAttempts, score: nextScore, phase: PHASE.AI_WAIT, shootingSide: "opponent", ticker: `${opponent.name.toUpperCase()} TO SHOOT` });
      if (aiTurnTimeoutRef.current) window.clearTimeout(aiTurnTimeoutRef.current);
      aiTurnTimeoutRef.current = window.setTimeout(() => {
        aiTurnTimeoutRef.current = null;
        const aiDirection = randomDirection();
        const aiAttempt = buildAiPenaltyAttempt({ team: opponent, direction: aiDirection, playerCareerStars });
        const keeperDirection = activeCosmetics?.goldenGlove
          ? applyGoldenGloveSecondRead({ targetDirection: aiDirection, firstKeeperDirection: aiAttempt.keeperDirection })
          : aiAttempt.keeperDirection;
        commitShot("opponent", aiDirection, aiAttempt.power, nextScore, nextAttempts, keeperDirection);
      }, GAME.aiWaitMs + USER_TO_OPPONENT_DELAY_MS);
      return;
    }

    setShootingSide("user");
    setTicker(`${user.name.toUpperCase()} TO SHOOT`);
    setShot(null);
    setSelected(getDirection("CM"));
    setLockedDirection(null);
    setPowerValue(0);
    powerValueRef.current = 0;
    setPowerCharging(false);
    setLockedPower(null);
    setAccuracyValue(0);
    accuracyValueRef.current = 0;
    setAccuracyRunning(false);
    setAccuracySweepMs(DEFAULT_ACCURACY_SWEEP_MS);
    accuracySweepMsRef.current = DEFAULT_ACCURACY_SWEEP_MS;
    setPhase(PHASE.DIRECTION);
    emitActiveSnapshot({ attempts: nextAttempts, score: nextScore, phase: PHASE.DIRECTION, shootingSide: "user", ticker: `${user.name.toUpperCase()} TO SHOOT` });
  }

  // A completed five-round competition must never return to DIRECTION or
  // AI_WAIT. If a delayed callback or state restoration leaves the controls
  // open after regulation, finalise the recorded result without another kick.
  useEffect(() => {
    if (!competitionMode || completedResult || hasCompleted || phase === PHASE.SHOT) return;
    if (attempts.user.length < GAME.regulationPens || attempts.opponent.length < GAME.regulationPens) return;
    clearGameplayTimeouts();
    finishTurn(attempts, score, "opponent");
    // The finalisation function is idempotent via matchCompletionDispatchedRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionMode, completedResult, hasCompleted, phase, attempts, score]);

  function commitShot(side, direction, power, currentScore = score, currentAttempts = attempts, plannedKeeperDirection = null, accuracy = null, accuracyOutcome = null, scoringPower = null, scoringAccuracy = null) {
    if (hasCompleted || completionPendingRef.current || matchCompletionDispatchedRef.current) return;
    // Defence in depth: never permit a sixth Competition Mode penalty, even if
    // a stale or delayed callback tries to submit another shot.
    if (competitionMode && currentAttempts[side].length >= GAME.regulationPens) {
      if (currentAttempts.user.length >= GAME.regulationPens && currentAttempts.opponent.length >= GAME.regulationPens) {
        finishTurn(currentAttempts, currentScore, side);
      }
      return;
    }

    if (side === "user" || opponentIsHuman) {
      playSound(mergedAssets.sounds.userShot, 0.82);
    } else {
      playSound(mergedAssets.sounds.opponentShot, 0.82);
    }

    const shotNumber = currentAttempts[side].length + 1;
    const safePower = clamp(Number(power) || 0, 0, 100);
    const safeAccuracy = accuracy === null || accuracy === undefined ? null : clamp(Number(accuracy) || 0, 0, 100);
    // Preserve the whole-number meter outcome for gameplay, while recording the
    // precise half-step tap positions for the separate competition score.
    const scoredPower = scoringPower === null ? safePower : scoringMeterStop(scoringPower);
    const scoredAccuracy = scoringAccuracy === null ? safeAccuracy : scoringMeterStop(scoringAccuracy);
    const humanShot = side === "user" || opponentIsHuman;
    const keeperReadChance = humanShot && safeAccuracy !== null && accuracyOutcome === "onTarget"
      ? accuracyKeeperReadChanceForValue(safeAccuracy, activeCosmetics, playerCareerStars)
      : null;
    const keeperDirection = plannedKeeperDirection || (humanShot ? null : randomDirection());
    const resolved = resolvePenalty({
      direction,
      power,
      keeperDirection,
      middleBypass: false,
      accuracyOutcome,
      keeperReadChance,
    });

    window.setTimeout(() => {
      playSound(
        resolved.goal ? mergedAssets.sounds.goalSound : mergedAssets.sounds.missSound,
        USER_SHOT_RESULT_VOLUME
      );
    }, USER_SHOT_RESULT_DELAY_MS);
    const shotDirectionId = direction?.id || null;
    const resolvedKeeperId = resolved.keeperDirection?.id || keeperDirection?.id || null;
    const savedByKeeper = Boolean(!resolved.goal && resolved.code === shotDirectionId && resolvedKeeperId === shotDirectionId);
    const attemptRecord = {
      shotNumber,
      side,
      result: resolved.result,
      shotResult: resolved.result,
      goal: Boolean(resolved.goal),
      power: safePower,
      powerValue: scoredPower,
      powerPoints: side === "user" ? meterPoints(safePower, 50) : 0,
      accuracy: safeAccuracy,
      accuracyValue: scoredAccuracy,
      accuracyPoints: side === "user" ? meterPoints(safeAccuracy, 50) : 0,
      matchdayPoints: side === "user" && shotNumber <= SCORING_SHOTS
        ? precisionPoints(scoredPower) + precisionPoints(scoredAccuracy) : 0,
      targetZone: isPowerInTargetZone(safePower, activeCosmetics, playerCareerStars),
      accuracyTargetZone: safeAccuracy !== null && isAccuracyInTargetZone(safeAccuracy, activeCosmetics, playerCareerStars),
      accuracyOutcome,
      keeperReadChance: keeperReadChance === null ? null : keeperReadChance,
      directionSelected: directionLabel(direction),
      directionId: shotDirectionId,
      row: direction?.row,
      col: direction?.col,
      code: resolved.code,
      keeperDirectionId: resolvedKeeperId,
      keeperRow: resolved.keeperDirection?.row ?? keeperDirection?.row ?? null,
      keeperCol: resolved.keeperDirection?.col ?? keeperDirection?.col ?? null,
      savedByKeeper,
      keeperSave: savedByKeeper,
      quality: resolved.quality,
      isSuddenDeath: currentAttempts[side].length >= GAME.regulationPens,
    };
    const nextScore = { ...currentScore, [side]: currentScore[side] + (resolved.goal ? 1 : 0) };
    const nextAttempts = { ...currentAttempts, [side]: [...currentAttempts[side], attemptRecord] };

    const nextMatchState = decideMatchState({ attempts: nextAttempts, score: nextScore, fixture, suddenDeathEnabled, competitionMode });
    const isFinalShot = Boolean(nextMatchState.finished);
    if (isFinalShot) {
      completionPendingRef.current = true;
    }

    setShot({ ...resolved, accuracy });
    setShootingSide(side);
    setScore(nextScore);
    setAttempts(nextAttempts);
    setTicker(resolved.commentary);
    setPhase(PHASE.SHOT);
    if (!isFinalShot) {
      emitActiveSnapshot({ attempts: nextAttempts, score: nextScore, phase: PHASE.SHOT, shootingSide: side, ticker: resolved.commentary });
    }
    const outcomeHoldMs = isFinalShot ? FINAL_SHOT_OUTCOME_HOLD_MS : SHOT_OUTCOME_HOLD_MS;
    if (turnTimeoutRef.current) window.clearTimeout(turnTimeoutRef.current);
    turnTimeoutRef.current = window.setTimeout(() => {
      turnTimeoutRef.current = null;
      finishTurn(nextAttempts, nextScore, side);
    }, GAME.shotMs + outcomeHoldMs);
  }

  function handleConfirmDirection() {
    if (phase !== PHASE.DIRECTION) return;
    setLockedDirection(selected);
    setPowerValue(0);
    powerValueRef.current = 0;
    setPowerCharging(false);
    setLockedPower(null);
    lockedPowerScoringRef.current = null;
    setAccuracyValue(0);
    accuracyValueRef.current = 0;
    setAccuracyRunning(false);
    setPhase(PHASE.POWER);
  }

  function positionMeterNeedle(fillRef, safeValue) {
    const node = fillRef?.current;
    if (!node) return;
    const track = node.parentElement;
    const trackWidth = track?.clientWidth || 0;
    if (trackWidth > 0) {
      node.style.left = "0px";
      node.style.transform = `translate3d(${(safeValue / 100) * trackWidth}px, 0, 0) translateX(-50%)`;
      node.dataset.meterValue = String(safeValue);
      return;
    }
    node.style.left = `${safeValue}%`;
    node.style.transform = "translateX(-50%)";
    node.dataset.meterValue = String(safeValue);
  }

  function setPowerVisual(nextPower, commitState = false) {
    const safePower = clamp(nextPower, 0, 100);
    powerValueRef.current = safePower;
    positionMeterNeedle(powerFillRef, safePower);
    if (commitState) setPowerValue(safePower);
  }

  function setAccuracyVisual(nextAccuracy, commitState = false) {
    const safeAccuracy = clamp(nextAccuracy, 0, 100);
    accuracyValueRef.current = safeAccuracy;
    positionMeterNeedle(accuracyFillRef, safeAccuracy);
    if (commitState) setAccuracyValue(safeAccuracy);
  }

  function stopPowerFrame() {
    if (powerFrameRef.current) {
      cancelAnimationFrame(powerFrameRef.current);
      powerFrameRef.current = null;
    }
  }

  function stopAccuracyFrame() {
    if (accuracyFrameRef.current) {
      cancelAnimationFrame(accuracyFrameRef.current);
      accuracyFrameRef.current = null;
    }
  }

  function startPowerMeter() {
    stopPowerFrame();
    setPowerCharging(true);
    const start = performance.now();
    powerStartMsRef.current = start;
    setPowerVisual(0, true);

    const tick = (now) => {
      setPowerVisual(meterValueAtTime(start, now, POWER_SWEEP_MS));
      powerFrameRef.current = requestAnimationFrame(tick);
    };
    powerFrameRef.current = requestAnimationFrame(tick);
  }

  function startAccuracyMeter() {
    stopAccuracyFrame();
    setAccuracyRunning(true);
    const start = performance.now();
    accuracyStartMsRef.current = start;
    const sweep = accuracySweepMsRef.current;
    setAccuracyVisual(0, true);

    const tick = (now) => {
      setAccuracyVisual(meterValueAtTime(start, now, sweep));
      accuracyFrameRef.current = requestAnimationFrame(tick);
    };
    accuracyFrameRef.current = requestAnimationFrame(tick);
  }

  function handleLockPower(event) {
    if (phase !== PHASE.POWER || !lockedDirection || hasCompleted) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();

    // Sample the elapsed-time marker at the tap, not the last paint frame.
    const tappedAt = performance.now();
    const rawPower = meterValueAtTime(powerStartMsRef.current, tappedAt, POWER_SWEEP_MS);
    const finalPower = displayedMeterValue(rawPower);
    lockedPowerScoringRef.current = competitionMode ? scoringMeterStop(rawPower) : null;
    stopPowerFrame();
    setPowerCharging(false);
    setPowerVisual(finalPower);
    powerValueRef.current = finalPower;
    setPowerValue(finalPower);

    const nextAccuracySpeed = accuracySpeedForPower(finalPower, activeCosmetics, playerCareerStars);
    setLockedPower(finalPower);
    setAccuracySweepMs(nextAccuracySpeed);
    accuracySweepMsRef.current = nextAccuracySpeed;
    setAccuracyValue(0);
    accuracyValueRef.current = 0;
    setPhase(PHASE_ACCURACY);
  }

  function handleLockAccuracy(event) {
    if (phase !== PHASE_ACCURACY || !lockedDirection || hasCompleted) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();

    // Capture precise tap time, independent of requestAnimationFrame timing.
    const tappedAt = performance.now();
    const rawAccuracy = meterValueAtTime(accuracyStartMsRef.current, tappedAt, accuracySweepMsRef.current);
    const finalAccuracy = displayedMeterValue(rawAccuracy);
    const scoredAccuracy = competitionMode ? scoringMeterStop(rawAccuracy) : null;
    stopAccuracyFrame();
    setAccuracyRunning(false);
    setAccuracyVisual(finalAccuracy);
    accuracyValueRef.current = finalAccuracy;
    setAccuracyValue(finalAccuracy);

    const finalPower = clamp(lockedPower ?? powerValueRef.current, 0, 100);
    const accuracyOutcome = accuracyOutcomeForValue(finalAccuracy, lockedDirection, activeCosmetics, playerCareerStars);
    commitShot(opponentIsHuman ? shootingSide : "user", lockedDirection, finalPower, score, attempts, null, finalAccuracy, accuracyOutcome, lockedPowerScoringRef.current, scoredAccuracy);
  }

  useEffect(() => {
    if (phase === PHASE.POWER && lockedDirection && !hasCompleted) {
      startPowerMeter();
      return () => stopPowerFrame();
    }
    stopPowerFrame();
    setPowerCharging(false);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lockedDirection?.id, hasCompleted]);

  useEffect(() => {
    if (phase === PHASE_ACCURACY && lockedDirection && !hasCompleted) {
      startAccuracyMeter();
      return () => stopAccuracyFrame();
    }
    stopAccuracyFrame();
    setAccuracyRunning(false);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lockedDirection?.id, hasCompleted]);

  useEffect(() => {
    return () => {
      stopPowerFrame();
      stopAccuracyFrame();
      if (aiRestoreTimeoutRef.current) {
        window.clearTimeout(aiRestoreTimeoutRef.current);
        aiRestoreTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createTempAttempt(side, shotNumber, goal, { perfect = false, isSuddenDeath = false } = {}) {
    const direction = getDirection("CM");
    const power = perfect ? 50 : Math.round(35 + Math.random() * 30);
    const accuracy = perfect ? 50 : Math.round(35 + Math.random() * 30);
    const result = goal ? "goal" : "save";

    return {
      shotNumber,
      side,
      result,
      shotResult: result,
      goal: Boolean(goal),
      power,
      powerValue: power,
      powerPoints: side === "user" ? meterPoints(power, 50) : 0,
      accuracy,
      accuracyValue: accuracy,
      accuracyPoints: side === "user" ? meterPoints(accuracy, 50) : 0,
      targetZone: side === "user" ? isPowerInTargetZone(power, activeCosmetics, playerCareerStars) : false,
      accuracyTargetZone: side === "user" ? isAccuracyInTargetZone(accuracy, activeCosmetics, playerCareerStars) : false,
      accuracyOutcome: perfect ? "onTarget" : null,
      directionSelected: directionLabel(direction),
      directionId: direction?.id,
      row: direction?.row,
      col: direction?.col,
      quality: result,
      isSuddenDeath,
      finalMatchOutcome: "win",
      userWon: side === "user",
      matchWon: side === "user",
      matchDrawn: false,
    };
  }

  function completeTemporaryWin({ userGoals = 5, opponentGoals = 0, perfect = false } = {}) {
    if (hasCompleted) return;

    stopPowerFrame();
    stopAccuracyFrame();

    const safeUserGoals = clamp(Math.round(Number(userGoals) || 1), 1, 5);
    const safeOpponentGoals = clamp(Math.round(Number(opponentGoals) || 0), 0, Math.max(0, safeUserGoals - 1));
    const userAttempts = Array.from({ length: 5 }).map((_, index) =>
      createTempAttempt("user", index + 1, index < safeUserGoals, { perfect })
    );
    const opponentAttempts = Array.from({ length: 5 }).map((_, index) =>
      createTempAttempt("opponent", index + 1, index < safeOpponentGoals, { perfect: false })
    );
    const nextScore = { user: safeUserGoals, opponent: safeOpponentGoals };
    const nextAttempts = { user: userAttempts, opponent: opponentAttempts };
    const result = buildResult({
      fixture,
      userTeam: user,
      opponentTeam: opponent,
      score: nextScore,
      winnerSide: "user",
      isDraw: false,
      attempts: nextAttempts,
    });

    setScore(nextScore);
    setAttempts(nextAttempts);
    setShot(null);
    setShootingSide("user");
    setPhase(PHASE.FINISHED);
    setWinnerSide("user");
    setTicker(`${user.name.toUpperCase()} WINS!`);
    setHasCompleted(true);
    onMatchComplete?.(result);
  }

  function completeTemporaryPerfectWin() {
    completeTemporaryWin({ userGoals: 5, opponentGoals: 0, perfect: true });
  }

  function completeTemporaryRandomWin() {
    const userGoals = 1 + Math.floor(Math.random() * 5);
    const opponentGoals = Math.floor(Math.random() * userGoals);
    completeTemporaryWin({ userGoals, opponentGoals, perfect: false });
  }

  function tickerStyle() {
    const finalTeam = winnerSide === "user" ? user : winnerSide === "opponent" ? opponent : null;
    if (phase === PHASE.FINISHED && finalTeam) return { background: finalTeam.primaryColour, color: finalTeam.textColour };
    if (phase === PHASE.FINISHED && !finalTeam) return { background: user.primaryColour, color: user.textColour };
    if (ticker === COMMENTARY.goal) return { background: activeTeam.primaryColour, color: activeTeam.textColour, animation: "goalFlash 0.82s steps(1, end) 1 forwards", "--goal-bg": activeTeam.primaryColour, "--goal-fg": activeTeam.textColour };
    if (ticker === COMMENTARY.save) return { background: defenderTeam.primaryColour, color: defenderTeam.textColour };
    return { background: activeTeam.primaryColour, color: activeTeam.textColour };
  }

  function tickerTeam() {
    const finalTeam = winnerSide === "user" ? user : winnerSide === "opponent" ? opponent : null;
    if (phase === PHASE.FINISHED && finalTeam) return finalTeam;
    if (phase === PHASE.FINISHED && !finalTeam) return user;
    if (ticker === COMMENTARY.save) return defenderTeam;
    return activeTeam;
  }

  const currentTickerStyle = tickerStyle();

  useEffect(() => {
    onFlashStyleChange?.(currentTickerStyle);
  }, [onFlashStyleChange, currentTickerStyle.background, currentTickerStyle.color, currentTickerStyle.animation, currentTickerStyle["--goal-bg"], currentTickerStyle["--goal-fg"]]);

  return (
    <div className="home-main-font relative flex h-full min-h-0 w-full flex-col overflow-x-visible overflow-y-hidden bg-[#0d6c3d] text-[#f5f1e8]">
      <style>{`
        .led-text-glow { color: #F7D117; text-shadow: 0 0 0.65px rgba(247,209,23,0.32); }
        .pen-marker-goal { box-shadow: 0 0 5px rgba(34,197,94,0.72), 0 0 10px rgba(34,197,94,0.25); }
        .pen-marker-save { box-shadow: 0 0 5px rgba(239,68,68,0.72), 0 0 10px rgba(239,68,68,0.25); }
        .pen-marker-empty { box-shadow: 0 0 5px rgba(247,209,23,0.42), 0 0 9px rgba(247,209,23,0.18); }
        @keyframes goalFlash {
          0%, 19.9% { background: var(--goal-bg); color: var(--goal-fg); }
          20%, 39.9% { background: var(--goal-fg); color: var(--goal-bg); }
          40%, 59.9% { background: var(--goal-bg); color: var(--goal-fg); }
          60%, 79.9% { background: var(--goal-fg); color: var(--goal-bg); }
          80%, 100% { background: var(--goal-bg); color: var(--goal-fg); }
        }
      `}</style>
      <Scoreboard userTeam={user} opponentTeam={opponent} score={score} attempts={attempts} ticker={introMode ? "PLAY TO WIN A BURNLEY FC E-GIFT CARD!" : ticker} tickerStyle={currentTickerStyle} tickerTeam={tickerTeam()} stageLabel="CHAMPIONSHIP" totalMarkerSlots={suddenDeathMarkerSlots} username={twoPlayerMode ? "TURF MOOR" : username} usernameEnabled={twoPlayerMode || Boolean(username)} usernameTone="yellow" />
      {/* Launch build: temporary result/debug buttons hidden. */}
      <Pitch ballPoint={ballPoint} keeperPoint={keeperPoint} shot={shot} shotActive={shotActive} activeTeam={activeTeam} defenderTeam={defenderTeam} showAim={!introMode && showAim} aimDirection={aimDirection} assets={mergedAssets} stageLabel={stageLabel} showChampionsBadge={showChampionsBadge} podiumBadgeMode={podiumBadgeMode} hideMatchActors={introMode || hideMatchActors} twoPlayerMode={twoPlayerMode} homeOverlay={introMode ? <CompetitionHomeOverlay onCompetition={onEnterCompetition} onPractice={onPractice} showButtons={homeMenuVisible} /> : null} />
      {!introMode && <ControlOverlay
        phase={phase}
        selected={selected}
        setSelected={setSelected}
        handleConfirmDirection={handleConfirmDirection}
        powerValue={powerValue}
        powerCharging={powerCharging}
        powerFillRef={powerFillRef}
        handleLockPower={handleLockPower}
        powerTargetZone={powerTargetZone}
        accuracyValue={accuracyValue}
        accuracyRunning={accuracyRunning}
        accuracyFillRef={accuracyFillRef}
        handleLockAccuracy={handleLockAccuracy}
        accuracyTargetZone={accuracyTargetZone}
        opponentTeam={opponent}
        endActionLabel={endActionLabel}
        endActionEnabled={endActionEnabled}
        onEndAction={onEndAction}
      />}
    </div>
  );
}
