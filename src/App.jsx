import { useEffect, useMemo, useRef, useState } from "react";
import { MatchScreen } from "./components/match/MatchScreen.jsx";
import { CompetitionAvailabilityModal, CompetitionRecoveryLinkModal, CompetitionRegistrationModal, CompetitionWelcomeBackModal } from "./components/competition/CompetitionUI.jsx";
import { scoreMatchdayAttempts } from "./logic/matchdayScoring.js";
import { registerCompetitionPlayer, submitCompetitionScore, fetchCompetitionInfo, validateCompetitionSession, sendCompetitionRecoveryLink, completeCompetitionRecovery, changeRecoveredUsername } from "./logic/competitionClient.js";
import { loadRememberedEntrant, rememberEntrant, forgetRememberedEntrant } from "./logic/competitionSession.js";
import { readRecoveryLink } from "./logic/recoveryLink.js";
import { RESULT_STATUS } from "./logic/resultStatus.js";

// Preserve the exact Burnley vs Preston presentation and gameplay. Each
// fixture deployment targets a separate Firestore project and browser session.
const HOME_TEAM = "Burnley";
const AWAY_TEAM = "Preston North End";
const STANDARD_COSMETICS = {};

export default function App() {
  const [mode, setMode] = useState("home");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [entrant, setEntrant] = useState(null);
  const [fixtureId, setFixtureId] = useState("burnley-preston-matchday");
  const [schedule, setSchedule] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [welcomeBusy, setWelcomeBusy] = useState(false);
  const [welcomeError, setWelcomeError] = useState("");
  const [recoveryLink, setRecoveryLink] = useState(null);
  const [score, setScore] = useState([0, 0]);
  const [matchResult, setMatchResult] = useState(null);
  const [matchResetKey, setMatchResetKey] = useState(0);
  const [competitionLeaderboard, setCompetitionLeaderboard] = useState(null);
  const [submissionState, setSubmissionState] = useState("idle");
  const [currentScore, setCurrentScore] = useState(null);
  const submissionRequest = useRef(0);
  const currentMatchId = useRef(null);

  useEffect(() => {
    // Email link can be opened on another device or from private browsing.
    // Ask for email when redeeming the code; never put it in the URL.
    const link = readRecoveryLink(window.location.href);
    if (link) setRecoveryLink(link);
  }, []);

  const fixture = useMemo(() => ({
    id: `burnley-matchday-${HOME_TEAM}-${AWAY_TEAM}`,
    matchNo: 104,
    stage: "final",
    home: HOME_TEAM,
    away: AWAY_TEAM,
    homeTeamId: HOME_TEAM,
    awayTeamId: AWAY_TEAM,
    stadium: "TURF MOOR",
    venue: "TURF MOOR",
    // Competition is a fixed five-round challenge, not a winner-required
    // knockout. Practice keeps its original sudden-death rules.
    allowDraw: mode === "competition",
    requiresWinner: mode !== "competition",
  }), [mode]);

  const resetMatch = (nextMode) => {
    submissionRequest.current += 1;
    currentMatchId.current = null;
    setMode(nextMode);
    setMatchResetKey((key) => key + 1);
    setScore([0, 0]);
    setMatchResult(null);
    setCurrentScore(null);
    setCompetitionLeaderboard(null);
    setSubmissionState("idle");
    setRegistrationOpen(false);
    setWelcomeOpen(false);
    setWelcomeBusy(false);
    setWelcomeError("");
  };
  const goHome = () => resetMatch("home");
  const startPractice = () => resetMatch("practice");
  const enterCompetition = async () => {
    goHome();
    try {
      const info = await fetchCompetitionInfo();
      setFixtureId(info.fixtureId);
      setSchedule(info.competition);
      if (info.competition?.status !== "open") {
        setAvailability({ ...(info.competition || { status: "unconfigured" }), leaderboard: info });
        return;
      }
      const saved = loadRememberedEntrant(undefined, info.fixtureId);
      setEntrant(saved);
      if (saved) setWelcomeOpen(true);
      else setRegistrationOpen(true);
    } catch {
      // Vite dev mode has no server functions. Permit UI-only previews, but
      // never pretend an unrecorded score has been entered officially.
      if (import.meta.env.DEV) { setEntrant(null); setRegistrationOpen(true); }
      else setAvailability({ status: "unconfigured" });
    }
  };
  const continueCompetition = async () => {
    if (welcomeBusy || !entrant?.token) return;
    setWelcomeBusy(true);
    setWelcomeError("");
    try {
      const verified = await validateCompetitionSession(entrant.token);
      const nextEntrant = { ...entrant, username: verified.username, fixtureId: verified.fixtureId };
      setEntrant(nextEntrant);
      rememberEntrant(nextEntrant);
      resetMatch("competition");
    } catch (error) {
      setWelcomeBusy(false);
      if (error.status === 401) {
        forgetRememberedEntrant(undefined, fixtureId);
        setEntrant(null);
        setWelcomeOpen(false);
        setRegistrationOpen(true);
      } else setWelcomeError("COULD NOT VERIFY ENTRY. PLEASE TRY AGAIN.");
    }
  };
  const switchPlayer = () => {
    // Existing scores remain in Firestore; only this device's session is cleared.
    forgetRememberedEntrant(undefined, fixtureId);
    setEntrant(null);
    resetMatch("home");
    setRegistrationOpen(true);
  };
  const acceptEntrant = (response) => {
    const next = { username: response.username, token: response.token, fixtureId: response.fixtureId, preview: false };
    setEntrant(next);
    setFixtureId(response.fixtureId);
    rememberEntrant(next);
    setRecoveryLink(null);
    if (recoveryLink && typeof window !== "undefined") window.history.replaceState({}, "", window.location.pathname);
    resetMatch("competition");
  };
  const registerEntrant = async (details) => {
    try { acceptEntrant(await registerCompetitionPlayer(details)); }
    catch (error) {
      if (!import.meta.env.DEV || error.message !== "COMPETITION SERVICE UNAVAILABLE") throw error;
      const preview = { username: details.username, token: null, preview: true };
      setEntrant(preview);
      resetMatch("competition");
    }
  };
  const finishRecovery = async (details) => {
    const response = await completeCompetitionRecovery(details);
    if (!response.needsUsername) acceptEntrant(response);
    return response;
  };
  const renameRecoveredPlayer = async (details) => {
    const response = await changeRecoveredUsername(details);
    acceptEntrant(response);
    return response;
  };

  const handleMatchComplete = (result) => {
    if (!result) return;
    setScore([Number(result.homeGoals || 0), Number(result.awayGoals || 0)]);
    setMatchResult({
      ...result,
      home: result.homeTeam || result.home,
      away: result.awayTeam || result.away,
      won: Boolean(result.userWon),
      status: result.userWon ? RESULT_STATUS.CHAMPION : RESULT_STATUS.RUNNER_UP,
      week: null,
      opponentShotEvents: result?.attempts?.opponent || [],
    });
    if (mode === "competition") {
      setCurrentScore(scoreMatchdayAttempts(result?.attempts));
      setCompetitionLeaderboard(null);
      if (!entrant?.token) { setSubmissionState("demo"); return; }
      if (!currentMatchId.current) currentMatchId.current = crypto.randomUUID();
      setSubmissionState("submitting");
      const requestId = ++submissionRequest.current;
      submitCompetitionScore(entrant.token, result, currentMatchId.current)
        .then((data) => { if (requestId === submissionRequest.current) { setCompetitionLeaderboard(data); setSubmissionState("saved"); } })
        .catch(() => { if (requestId === submissionRequest.current) setSubmissionState("error"); });
    }
  };
  const retrySubmission = () => {
    if (!entrant?.token || !matchResult || !currentMatchId.current || submissionState === "submitting") return;
    setSubmissionState("submitting");
    const requestId = ++submissionRequest.current;
    submitCompetitionScore(entrant.token, matchResult, currentMatchId.current)
      .then((data) => { if (requestId === submissionRequest.current) { setCompetitionLeaderboard(data); setSubmissionState("saved"); } })
      .catch(() => { if (requestId === submissionRequest.current) setSubmissionState("error"); });
  };
  const replayMatch = () => resetMatch(mode === "competition" ? "competition" : "practice");

  return <>
    <MatchScreen
      team={HOME_TEAM}
      opponent={AWAY_TEAM}
      score={score}
      matchResult={matchResult}
      modalDismissed={false}
      onMatchComplete={handleMatchComplete}
      onNextMatch={replayMatch}
      matchResetKey={matchResetKey}
      stageLabel="FINAL"
      fixture={fixture}
      activeCosmetics={STANDARD_COSMETICS}
      twoPlayerMode
      simulateAwayPenalties
      replayOnly
      introMode={mode === "home"}
      homeMenuVisible={!registrationOpen && !welcomeOpen && !recoveryLink && !availability}
      competitionMode={mode === "competition"}
      competitionLeaderboard={competitionLeaderboard}
      submissionState={submissionState}
      currentScore={currentScore}
      entrant={entrant}
      onHome={goHome}
      onEnterCompetition={enterCompetition}
      onPractice={startPractice}
      onRetrySubmission={retrySubmission}
    />
    {registrationOpen && <CompetitionRegistrationModal
      onClose={() => setRegistrationOpen(false)}
      onRegister={registerEntrant}
      onStartRecovery={sendCompetitionRecoveryLink}
      schedule={schedule}
    />}
    {welcomeOpen && entrant && <CompetitionWelcomeBackModal
      username={entrant.username}
      onContinue={continueCompetition}
      onSwitchPlayer={switchPlayer}
      onClose={() => setWelcomeOpen(false)}
      busy={welcomeBusy}
      error={welcomeError}
    />}
    {recoveryLink && <CompetitionRecoveryLinkModal
      link={recoveryLink}
      onFinish={finishRecovery}
      onRename={renameRecoveredPlayer}
      onClose={() => { setRecoveryLink(null); window.history.replaceState({}, "", window.location.pathname); }}
    />}
    {availability && <CompetitionAvailabilityModal
      {...availability}
      onClose={() => setAvailability(null)}
    />}
  </>;
}
