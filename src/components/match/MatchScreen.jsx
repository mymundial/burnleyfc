import { useMemo, useRef, useState } from "react";
import { FullPitchExtensionBackground, Shell } from "../layout/Layout.jsx";
import FootballGame from "./FootballGame.jsx";
import AppTopBar from "../ui/AppTopBar.jsx";
import EndMatchModal from "./EndMatchModal.jsx";
import {
  createFallbackFixture,
  modalButton,
  teamToGameTeam,
  toCompletedGameResult,
} from "../../logic/matchPresentation.js";
import { MC_SELECTION_LAYOUT } from "../../styles/theme.js";
import { isTerminalShareResult } from "../../logic/podium.js";
import { CompetitionLeaderboardModal } from "../competition/CompetitionUI.jsx";

const getDisplayUsername = () => "GUEST";

export function MatchScreen({
  team,
  opponent,
  score,
  matchResult,
  modalDismissed = false,
  onDismissModal,
  onQuickWin,
  onMatchComplete,
  onNextMatch,
  onChangeTeams,
  onViewBracket,
  onPlayAgain,
  onOpenTrophies,
  hasNewTrophy = false,
  menuProps,
  stageLabel = "GROUP STAGE",
  fixture,
  groupRows = [],
  qualifiedTeams = new Set(),
  selectedGroup = "A",
  userForm = [],
  campaignId = "default",
  podium = null,
  activeCosmetics = null,
  twoPlayerMode = false,
  simulateAwayPenalties = false,
  activeMatchSnapshot = null,
  onActiveMatchSnapshot = null,
  matchResetKey = 0,
  playerCareerStats = null,
  campaignAssistStars = null,
  replayOnly = false,
  introMode = false,
  homeMenuVisible = true,
  competitionMode = false,
  competitionLeaderboard = null,
  submissionState = "idle",
  currentScore = null,
  entrant = null,
  onHome,
  onEnterCompetition,
  onPractice,
  onRetrySubmission,
}) {
  const [matchBusy, setMatchBusy] = useState(false);
  const shareCaptureRef = useRef(null);
  const username = useMemo(() => getDisplayUsername(), [matchResult]);
  const burnleyTeamName = "Burnley";
  const opponentTeamName = "Preston North End";
  const isTerminalResult = isTerminalShareResult({ result: matchResult, fixture, stageLabel, podium, team: burnleyTeamName });
  const userTeam = teamToGameTeam(burnleyTeamName);
  const opponentTeam = teamToGameTeam(opponentTeamName);
  const fallbackFixture = fixture ? { ...fixture, homeTeamId: burnleyTeamName, awayTeamId: opponentTeamName } : createFallbackFixture({ team: burnleyTeamName, opponent: opponentTeamName });
  const completedResult = toCompletedGameResult(matchResult, fallbackFixture);

  return (
    <Shell>
      <FullPitchExtensionBackground />
      <div className="relative z-[2] flex h-[100dvh] flex-col overflow-x-visible overflow-y-hidden bg-[linear-gradient(180deg,#561A42_0%,#4C183B_52%,#320F27_100%)]">
        <AppTopBar
          title="BURNLEY FC"
          brandTitleSrc="/assets/branding/burnley-fc-wordmark.png"
          brandTitleAlt="BURNLEY FC"
          style={{ height: MC_SELECTION_LAYOUT.topBarHeight, background: "linear-gradient(180deg, #561A42 0%, #4C183B 52%, #320F27 100%)" }}
          logoSrc={null}
          rightLogoSrc={null}
          titleClassName="tracking-[0.04em] text-[clamp(23px,5.4vw,30px)]"
        />

        <div ref={shareCaptureRef} className="relative min-h-0 flex-1 overflow-x-visible overflow-y-hidden bg-[linear-gradient(180deg,#561A42_0%,#4C183B_52%,#320F27_100%)]">
          <FootballGame
            key={`${fallbackFixture.id || fallbackFixture.matchId || "match"}:${team || ""}:${opponent || ""}:${matchResetKey}`}
            userTeam={userTeam}
            opponentTeam={opponentTeam}
            fixture={fallbackFixture}
            campaignId={campaignId}
            onMatchComplete={onMatchComplete || onQuickWin}
            completedResult={completedResult}
            endActionLabel={matchResult && modalDismissed ? modalButton(matchResult) : "FULL TIME"}
            endActionEnabled={Boolean(matchResult && modalDismissed)}
            onEndAction={onNextMatch}
            onBusyChange={setMatchBusy}
            // The Burnley pitch has no end-of-match badge: retain ball, goalkeeper and goal behind the result modal.
            showChampionsBadge={false}
            podiumBadgeMode={null}
            activeCosmetics={activeCosmetics}
            username={username}
            twoPlayerMode={twoPlayerMode}
            simulateAwayPenalties={simulateAwayPenalties}
            suddenDeathEnabled={!competitionMode}
            stageLabelOverride={twoPlayerMode ? stageLabel : null}
            activeMatchSnapshot={activeMatchSnapshot}
            onActiveMatchSnapshot={onActiveMatchSnapshot}
            playerCareerStats={playerCareerStats}
            campaignAssistStars={campaignAssistStars}
            introMode={introMode}
            homeMenuVisible={homeMenuVisible}
            onEnterCompetition={onEnterCompetition}
            onPractice={onPractice}
          />
        </div>

        {matchResult && !modalDismissed && !competitionMode && (
          <EndMatchModal
            result={matchResult}
            fixture={fallbackFixture}
            onNext={onNextMatch}
            onChangeTeams={onChangeTeams}
            onDismiss={onDismissModal}
            onOpenMenu={() => {
              menuProps?.onToggleMenu?.();
            }}
            onOpenTrophies={onOpenTrophies}
            hasNewTrophy={hasNewTrophy}
            onViewBracket={onViewBracket}
            onPlayAgain={onPlayAgain}
            groupRows={groupRows}
            qualifiedTeams={qualifiedTeams}
            userTeam={team}
            selectedGroup={selectedGroup}
            stageLabel={stageLabel}
            userForm={userForm}
            shareCaptureRef={shareCaptureRef}
            podium={podium}
            username={username}
            twoPlayerMode={twoPlayerMode}
            stageLabelOverride={twoPlayerMode ? stageLabel : null}
            replayOnly={replayOnly}
            onHome={onHome}
            onEnterCompetition={onEnterCompetition}
            isPractice={!competitionMode}
          />
        )}
        {matchResult && competitionMode && (
          <CompetitionLeaderboardModal
            leaderboard={competitionLeaderboard}
            submitState={submissionState}
            currentScore={currentScore}
            entrant={entrant}
            onHome={onHome}
            onReplay={onNextMatch}
            onRetry={onRetrySubmission}
          />
        )}

      </div>
    </Shell>
  );
}
