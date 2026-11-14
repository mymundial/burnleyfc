import { useMemo, useState } from "react";
import { MatchScreen } from "./components/match/MatchScreen.jsx";
import { RESULT_STATUS } from "./logic/resultStatus.js";

// Temporary finalists for the standalone Cup Final prototype.
// Replace these two names with the real finalists when the fixture is known.
const CUP_FINAL_TEAM_1 = "Leyton Orient";
const CUP_FINAL_TEAM_2 = "Stockport County";
const STANDARD_COSMETICS = {};

export default function App() {
  const [score, setScore] = useState([0, 0]);
  const [matchResult, setMatchResult] = useState(null);
  const [matchResetKey, setMatchResetKey] = useState(0);

  const fixture = useMemo(
    () => ({
      id: `cup-final-${CUP_FINAL_TEAM_1}-${CUP_FINAL_TEAM_2}`,
      matchNo: 104,
      stage: "final",
      home: CUP_FINAL_TEAM_1,
      away: CUP_FINAL_TEAM_2,
      homeTeamId: CUP_FINAL_TEAM_1,
      awayTeamId: CUP_FINAL_TEAM_2,
      stadium: "WEMBLEY STADIUM",
      venue: "WEMBLEY STADIUM",
      allowDraw: false,
      requiresWinner: true,
    }),
    [],
  );

  const handleMatchComplete = (result) => {
    if (!result) return;

    setScore([
      Number(result.homeGoals || 0),
      Number(result.awayGoals || 0),
    ]);
    setMatchResult({
      ...result,
      home: result.homeTeam || result.home,
      away: result.awayTeam || result.away,
      won: Boolean(result.userWon),
      status: result.userWon ? RESULT_STATUS.CHAMPION : RESULT_STATUS.RUNNER_UP,
      week: null,
      opponentShotEvents: result?.attempts?.opponent || [],
    });
  };

  const replayMatch = () => {
    setMatchResetKey((key) => key + 1);
    setScore([0, 0]);
    setMatchResult(null);
  };

  return (
    <MatchScreen
      team={CUP_FINAL_TEAM_1}
      opponent={CUP_FINAL_TEAM_2}
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
    />
  );
}
