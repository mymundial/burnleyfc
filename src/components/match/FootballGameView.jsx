import {
  DEFAULT_ASSETS,
  GAME,
  DIRECTIONS,
  PHASE,
  normaliseTeam,
  pointForDirection,
  getDirection,
  keeperTransform,
  ballTransform,
  shotTravelMs,
  keeperTravelMs,
} from "../../logic/penaltyEngine.js";
import { PHASE_ACCURACY } from "../../logic/shotMeter.js";
import { getPodiumBadgeVisuals } from "../../logic/matchVisuals.js";
import { resolveRenderedExportVisuals } from "../../logic/exportVisuals.js";
import { PODIUM_BADGE_MODE } from "../../logic/resultStatus.js";
import SharedCrowdBackdrop from "../crowd/SharedCrowdBackdrop.jsx";

const MONDAY_CUP_AD_SRC = "/assets/branding/vertu-logo.png";
const CLARETS_CROWD_SRC = "/assets/game/clarets-stadium-crowd.png";
const CLARET_BUTTON_GRADIENT = "linear-gradient(180deg, #7B185A 0%, #650748 44%, #500037 100%)";
const CYAN_BUTTON_GRADIENT = "linear-gradient(180deg, #A0D9F7 0%, #7EC6F1 48%, #58ADE2 100%)";

function PowerChargeMeter({ value, ideal = GAME.powerIdeal, charging = false, fillRef = null }) {
  const left = `${ideal[0]}%`;
  const width = `${ideal[1] - ideal[0]}%`;

  return (
    <div
      className="relative h-10 overflow-hidden rounded-[clamp(14px,2.2vh,28px)] border p-[3px] ring-0"
      style={{
        contain: "layout paint",
        background: "linear-gradient(180deg, #30373B 0%, #252C30 46%, #171C20 100%)",
        borderColor: "rgba(150,160,166,0.17)",
        boxShadow: "0 7px 16px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 3px rgba(0,0,0,0.33)",
      }}
    >
      <div className="relative h-full overflow-hidden rounded-[clamp(12px,2vh,24px)] bg-[#141A20] shadow-[inset_0_2px_5px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.12))]" />
        <div
          className="absolute inset-y-0 rounded-[7px] border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.17),inset_0_-2px_4px_rgba(0,0,0,0.22)]"
          style={{ left, width, background: CLARET_BUTTON_GRADIENT }}
        />
        <div className="absolute inset-y-[-3px] left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-[#7EC6F1] shadow-[0_0_7px_rgba(126,198,241,0.75)]" />
        <div
          ref={fillRef}
          className="absolute inset-y-[-2px] z-[2] w-[4px] rounded-full bg-[#F7D117] shadow-[0_0_9px_rgba(247,209,23,0.78)]"
          style={{ left: `${value}%`, transform: "translateX(-50%)", willChange: "transform" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.08))]" />
      </div>
    </div>
  );
}

function AccuracyMeter({ value, ideal, running = false, fillRef = null }) {
  const left = `${ideal[0]}%`;
  const width = `${ideal[1] - ideal[0]}%`;

  return (
    <div
      className="relative h-10 overflow-hidden rounded-[clamp(14px,2.2vh,28px)] border p-[3px] ring-0"
      style={{
        contain: "layout paint",
        background: "linear-gradient(180deg, #30373B 0%, #252C30 46%, #171C20 100%)",
        borderColor: "rgba(150,160,166,0.17)",
        boxShadow: "0 7px 16px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -2px 3px rgba(0,0,0,0.33)",
      }}
    >
      <div className="relative h-full overflow-hidden rounded-[clamp(12px,2vh,24px)] bg-[#141A20] shadow-[inset_0_2px_5px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.12))]" />
        <div
          className="absolute inset-y-0 rounded-[7px] border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.17),inset_0_-2px_4px_rgba(0,0,0,0.22)]"
          style={{ left, width, background: CLARET_BUTTON_GRADIENT }}
        />
        <div className="absolute inset-y-[-3px] left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-[#7EC6F1] shadow-[0_0_7px_rgba(126,198,241,0.75)]" />
        <div
          ref={fillRef}
          className="absolute inset-y-[-2px] z-[2] w-[3px] rounded-full bg-[#F7D117] shadow-[0_0_9px_rgba(247,209,23,0.78)]"
          style={{ left: `${value}%`, transform: "translateX(-50%)", willChange: "transform" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.08))]" />
      </div>
    </div>
  );
}


function CrowdBackdrop({ visuals = null, useClaretsImage = false } = {}) {
  const goalLine = GAME.goal.top + GAME.goal.height;
  const boardHeight = 8;
  const boardTop = goalLine - boardHeight;
  const crowd = visuals?.crowd || {};

  // The full 1920px-wide crowd image fills this region proportionally.
  // The existing game-window overflow provides the crop, not an image edit.
  // Preserve the drawn crowd for share/export variants.
  if (useClaretsImage) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden"
        style={{
          height: `${boardTop}%`,
          backgroundImage: `url("${CLARETS_CROWD_SRC}")`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#1c1419",
        }}
      />
    );
  }

  return (
    <SharedCrowdBackdrop
      density={crowd.density ?? 1}
      rowCount={crowd.rowCount ?? 16}
      className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden"
      style={{ height: `${boardTop}%` }}
      personOpacityScale={crowd.personOpacityScale ?? 1}
    />
  );
}

function LedAdvertisingHoard({ visuals = null } = {}) {
  const goalLine = GAME.goal.top + GAME.goal.height;
  const boardHeight = 8;
  const adBoard = visuals?.adBoard || {};
  const glow = adBoard.glow || {};
  const showGlow = Boolean(glow.enabled);
  return (
    <div className="pointer-events-none absolute inset-x-0 z-[2] overflow-hidden border-t border-[#24031B] shadow-[0_-8px_24px_rgba(0,0,0,0.42)]" style={{ bottom: `${100 - goalLine}%`, height: `${boardHeight}%`, background: "linear-gradient(180deg, #561A42 0%, #4C183B 52%, #320F27 100%)" }}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(0,0,0,0.22))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[#F5F1E8]/10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-black/25" />
      <div className="relative mx-auto flex h-full items-center justify-center" style={{ maxWidth: `${adBoard.maxWidthPercent ?? 61}%` }}>
        {showGlow && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5F1E8]"
            style={{
              width: `${glow.widthPercent ?? 112}%`,
              height: `${glow.heightPercent ?? 82}%`,
              opacity: glow.opacity ?? 0.055,
              filter: `blur(${glow.blurPx ?? 10}px)`,
            }}
            aria-hidden="true"
          />
        )}
        <img src={MONDAY_CUP_AD_SRC} alt="Vertu" className="relative z-[1] w-full object-contain" style={{ height: `${adBoard.logoHeightPercent ?? 56}%`, opacity: adBoard.logoOpacity ?? 0.92, filter: adBoard.logoFilter || "brightness(0.98) drop-shadow(0 0 9px rgba(245,241,232,0.16))" }} draggable={false} crossOrigin="anonymous" />
      </div>
    </div>
  );
}


function pitchMowStyleForVariant(goalLine, variant = "game") {
  if (variant === "none") {
    return {
      top: `${goalLine}%`,
      backgroundColor: "transparent",
      backgroundImage: "none",
      backgroundSize: "100% 100%",
      backgroundRepeat: "repeat",
      boxShadow: "none",
    };
  }

  // Main playable match: display the approved grass artwork only inside
  // the pitch area below the goal line. Other page backgrounds and share
  // preview/export variants retain their existing appearance.
  if (variant !== "export") {
    return {
      top: `${goalLine}%`,
      backgroundColor: "#0d6c3d",
      backgroundImage: 'url("/assets/game/clarets-pitch-grass.png")',
      backgroundPosition: "center center",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
    };
  }

  return {
    top: `${goalLine}%`,
    backgroundColor: "#0b5f35",
    backgroundImage: [
      "linear-gradient(90deg, #0f7444 0% 11.111%, #0b5f35 11.111% 22.222%, #0f7444 22.222% 33.333%, #0b5f35 33.333% 44.444%, #0f7444 44.444% 55.555%, #0b5f35 55.555% 66.666%, #0f7444 66.666% 77.777%, #0b5f35 77.777% 88.888%, #0f7444 88.888% 100%)",
      "radial-gradient(circle at 50% 0%, rgba(247,209,23,0.045), transparent 34%)",
      "linear-gradient(180deg, rgba(245,241,232,0.018) 0%, rgba(5,26,17,0.10) 100%)",
    ].join(", "),
    backgroundSize: "100% 100%, 100% 100%, 100% 100%",
    backgroundRepeat: "no-repeat",
    boxShadow: "inset 0 24px 46px rgba(4,24,15,0.06), inset 0 -42px 76px rgba(4,24,15,0.18)",
  };
}

function GoalFrame({ showAim, aimDirection, netOpacity = 0.55 }) {
  const goal = GAME.goal;
  return (
    <div className="absolute z-[3] overflow-hidden border-[clamp(5px,1.55vw,8px)] border-b-0 border-[#f5f1e8] bg-[#0d6c3d]/30" style={{ left: `${goal.left}%`, top: `${goal.top}%`, width: `${goal.width}%`, height: `${goal.height}%` }}>
      <div className="absolute inset-0" style={{ opacity: netOpacity, backgroundImage: "repeating-linear-gradient(90deg, transparent 0%, transparent 1.8%, rgba(245,241,232,0.18) 2.0%, transparent 2.2%), repeating-linear-gradient(180deg, transparent 0%, transparent 2.6%, rgba(245,241,232,0.16) 2.8%, transparent 3.1%), linear-gradient(135deg, transparent 0%, transparent 49%, rgba(245,241,232,0.08) 49.4%, transparent 50%)", backgroundSize: "100% 100%, 100% 100%, 8px 8px" }} />
      {showAim && (
        <div className="absolute h-[clamp(30px,9vw,40px)] w-[clamp(30px,9vw,40px)] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-[3px] border-[#F7D117] bg-[#F7D117]/18 shadow-[0_0_10px_rgba(247,209,23,0.6),0_0_22px_rgba(247,209,23,0.24)]" style={{ left: `${((aimDirection.col + 0.5) / 3) * 100}%`, top: `${((aimDirection.row + 0.5) / 3) * 100}%`, animationDuration: "1.1s" }}>
          <div className="absolute inset-[-18%] animate-ping rounded-full border-2 border-[#F7D117]/70" style={{ animationDuration: "1.35s" }} />
          <div className="absolute inset-[30%] rounded-full bg-[#F7D117] shadow-[0_0_10px_rgba(247,209,23,0.9)]" />
        </div>
      )}
    </div>
  );
}

function actorLayerTransform(point) {
  return `translate3d(${Number(point?.x || 0)}%, ${Number(point?.y || 0)}%, 0)`;
}

function ballResultAnimationClass(shot, shotActive) {
  if (!shotActive) return "";
  if (shot?.goal) return "mc-ball-result-goal";
  const savedByKeeper = shot?.keeperDirection?.id && shot?.chosenDirection?.id && shot.keeperDirection.id === shot.chosenDirection.id;
  return savedByKeeper ? "mc-ball-result-save" : "mc-ball-result-miss";
}

export function Pitch({ ballPoint, keeperPoint, shot, shotActive, activeTeam, defenderTeam, showAim, aimDirection, assets, stageLabel = "GROUP STAGE", showChampionsBadge = false, podiumBadgeMode = null, badgeTransform = null, hideMatchActors = false, pitchMowVariant = "game", showAdBoard = true, showPitchMarkings = true, twoPlayerMode = false, exportVisualTuning = false }) {
  const exportVisuals = resolveRenderedExportVisuals(exportVisualTuning);
  const goalLine = GAME.goal.top + GAME.goal.height;
  const activeBadgeMode = podiumBadgeMode || (showChampionsBadge ? PODIUM_BADGE_MODE.CHAMPION : null);
  const podiumBadge = getPodiumBadgeVisuals(activeBadgeMode, { useShieldBadge: twoPlayerMode });
  const showPodiumBadge = Boolean(podiumBadge);
  const badgeOffsetX = Number(badgeTransform?.x || 0);
  const badgeOffsetY = Number(badgeTransform?.y || 0);
  const badgeScale = Number(badgeTransform?.scale || 1) || 1;
  const badgeGlowOpacityScale = Math.max(0, Math.min(1, Number(exportVisuals?.badge?.glowOpacityScale ?? 1)));
  const badgeEditorTransform = badgeTransform
    ? `translate(${badgeOffsetX}px, ${badgeOffsetY}px) scale(${badgeScale})`
    : undefined;
  const keeperAnimationClass = shotActive ? (shot?.goal ? "mc-keeper-result-dive" : "mc-keeper-result-save") : "";
  const ballAnimationClass = ballResultAnimationClass(shot, shotActive);
  const keeperMs = keeperTravelMs(shot);
  const ballMs = shotTravelMs(shot);
  return (
    <section className={`relative h-full flex-1 shrink overflow-hidden ${pitchMowVariant === "none" ? "bg-transparent" : "bg-[#0d6c3d]"}`}>
      <style>{`
        @keyframes mcKeeperSaveResult {
          0% { transform: translate3d(0,0,0); }
          42% { transform: translate3d(0,-1.5px,0); }
          78% { transform: translate3d(0,-0.5px,0); }
          100% { transform: translate3d(0,0,0); }
        }
        @keyframes mcKeeperDiveResult {
          0% { transform: translate3d(0,0,0); }
          46% { transform: translate3d(0,-1.5px,0); }
          80% { transform: translate3d(0,-0.5px,0); }
          100% { transform: translate3d(0,0,0); }
        }
        @keyframes mcBallGoalResult {
          0% { transform: translate3d(0,0,0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate3d(0,0,0) rotate(58deg) scale(0.94); opacity: 0.92; }
        }
        @keyframes mcBallSaveResult {
          0% { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
          100% { transform: translate3d(0,0,0) rotate(36deg) scale(0.96); }
        }
        @keyframes mcBallMissResult {
          0% { transform: translate3d(0,0,0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate3d(0,0,0) rotate(48deg) scale(0.88); opacity: 0.86; }
        }
        .mc-keeper-result-save { animation: mcKeeperSaveResult var(--mc-keeper-travel-ms, 520ms) cubic-bezier(0.22,1,0.36,1) both; }
        .mc-keeper-result-dive { animation: mcKeeperDiveResult var(--mc-keeper-travel-ms, 560ms) cubic-bezier(0.22,1,0.36,1) both; }
        .mc-ball-result-goal { animation: mcBallGoalResult var(--mc-ball-travel-ms, 620ms) cubic-bezier(0.08,0.78,0.16,1) both; will-change: transform, opacity; }
        .mc-ball-result-save { animation: mcBallSaveResult var(--mc-ball-travel-ms, 480ms) cubic-bezier(0.08,0.78,0.16,1) both; will-change: transform; }
        .mc-ball-result-miss { animation: mcBallMissResult var(--mc-ball-travel-ms, 620ms) cubic-bezier(0.08,0.78,0.16,1) both; will-change: transform, opacity; }
      `}</style>
      <CrowdBackdrop visuals={exportVisuals} useClaretsImage={pitchMowVariant === "game"} />
      {pitchMowVariant === "game" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[56px]"
          style={{ background: "linear-gradient(180deg, rgba(12,3,11,0.83) 0%, rgba(12,3,11,0.44) 38%, rgba(12,3,11,0) 100%)" }}
        />
      )}
      {showAdBoard && <LedAdvertisingHoard visuals={exportVisuals} />}
      {showPodiumBadge && (
        <div
          className="pointer-events-none absolute left-1/2 z-[7] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{ top: `${(goalLine - 8) / 2}%`, width: "99.825%", height: "74.415%" }}
          aria-hidden="true"
        >
          <div className="absolute inset-0" style={{ transform: badgeEditorTransform, transformOrigin: "center" }}>
            <div
              className="absolute left-1/2 top-[54%] h-[56%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{ background: podiumBadge.glowOuter, opacity: badgeGlowOpacityScale }}
            />
            <div
              className="absolute left-1/2 top-[54%] h-[38%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
              style={{ background: podiumBadge.glowInner, opacity: badgeGlowOpacityScale }}
            />
            <img
              src={podiumBadge.src}
              alt={podiumBadge.alt}
              className="relative z-[1] h-full w-full object-contain"
              style={{ filter: podiumBadge.shadow, transform: `scale(${podiumBadge.pitchScale || 1})` }}
              draggable={false}
            />
          </div>
        </div>
      )}
      <div {...(pitchMowVariant === "none" ? {} : { "data-share-force-pitch": "true" })} className="absolute bottom-0 left-0 right-0" style={pitchMowStyleForVariant(goalLine, pitchMowVariant)} />
      {showPitchMarkings && (
        <>
          <div className="absolute left-0 right-0 z-[4] h-2 bg-[#f5f1e8]" style={{ top: `${goalLine}%` }} />
          <div
            className="pointer-events-none absolute z-[3] rounded-b-[999px] border-b-[clamp(5px,1.55vw,8px)] border-l-[clamp(5px,1.55vw,8px)] border-r-[clamp(5px,1.55vw,8px)] border-[#f5f1e8]"
            style={{ left: "5%", top: `${goalLine}%`, width: "90%", height: "24.2%" }}
          />
        </>
      )}
      <GoalFrame showAim={showAim} aimDirection={aimDirection} netOpacity={exportVisuals?.goal?.netOpacity ?? 0.55} />
      {showPitchMarkings && <div className="absolute h-[clamp(8px,2.4vw,12px)] w-[clamp(8px,2.4vw,12px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5f1e8]" style={{ left: `${GAME.spot.x}%`, top: `${GAME.spot.y}%` }} />}
      {!hideMatchActors && !showPodiumBadge && (
        <div
          className="pointer-events-none absolute inset-0 z-[4]"
          style={{
            transform: actorLayerTransform(keeperPoint),
            transitionProperty: "transform",
            transitionDuration: `${keeperMs}ms`,
            transitionTimingFunction: shotActive ? "cubic-bezier(0.18, 0.82, 0.24, 1)" : "cubic-bezier(0.22, 1, 0.36, 1)",
            overflow: "visible",
          }}
        >
          <div
            className="absolute left-0 top-0 grid h-[clamp(38px,10.8vw,48px)] w-[clamp(38px,10.8vw,48px)] place-items-center rounded-full border-2"
            style={{
              background: defenderTeam.primaryColour,
              borderColor: defenderTeam.textColour,
              transform: keeperTransform(shot?.keeperDirection ?? getDirection("CM"), shotActive),
              transformOrigin: "center",
              overflow: "visible",
              transitionProperty: "transform",
              transitionDuration: `${keeperMs}ms`,
              transitionTimingFunction: shotActive ? "cubic-bezier(0.22, 1, 0.36, 1)" : "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <img
              src={assets.goalkeeper}
              alt="Goalkeeper"
              className={`h-[clamp(1.72rem,7.2vw,2.1rem)] w-[clamp(1.72rem,7.2vw,2.1rem)] object-contain ${keeperAnimationClass}`}
              style={{ "--mc-keeper-travel-ms": `${keeperMs}ms` }}
              draggable={false}
            />
          </div>
        </div>
      )}
      {!hideMatchActors && !showPodiumBadge && !shotActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[4] h-[12px] w-[38px] rounded-full"
          style={{
            left: `${GAME.spot.x}%`,
            top: `${GAME.spot.y}%`,
            transform: "translate(-50%, 11px)",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.22) 48%, rgba(0,0,0,0) 76%)",
            filter: "blur(2px)",
          }}
        />
      )}
      {!hideMatchActors && !showPodiumBadge && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] will-change-transform"
          style={{
            transform: actorLayerTransform(ballPoint),
            transitionProperty: "transform",
            transitionDuration: `${ballMs}ms`,
            transitionTimingFunction: shotActive ? "cubic-bezier(0.08, 0.78, 0.16, 1)" : "cubic-bezier(0.22, 1, 0.36, 1)",
            overflow: "visible",
            backfaceVisibility: "hidden",
          }}
        >
          <div
            className="absolute left-0 top-0 grid h-[clamp(32px,9.2vw,40px)] w-[clamp(32px,9.2vw,40px)] place-items-center will-change-transform"
            style={{
              transform: ballTransform(shotActive),
              transformOrigin: "center",
              transitionProperty: "transform",
              transitionDuration: `${ballMs}ms`,
              transitionTimingFunction: shotActive ? "cubic-bezier(0.08, 0.78, 0.16, 1)" : "cubic-bezier(0.22, 1, 0.36, 1)",
              overflow: "visible",
              contain: "layout style",
              backfaceVisibility: "hidden",
            }}
          >
            <img
              src={assets.ball}
              alt="Ball"
              className={`h-[clamp(30px,7.5vw,36px)] w-[clamp(30px,7.5vw,36px)] object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)] ${ballAnimationClass}`}
              style={{ "--mc-ball-travel-ms": `${ballMs}ms` }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </section>
  );
}


export function MatchPitchPreview({ userTeam, opponentTeam, stageLabel = "FINAL", assets = {}, showActors = false, pitchMowVariant = "game", showAdBoard = true, showPitchMarkings = true, exportVisualTuning = false, podiumBadgeMode = null, badgeTransform = null }) {
  const user = normaliseTeam(userTeam, "Team A");
  const opponent = normaliseTeam(opponentTeam, "Team B");
  const mergedAssets = {
    ...DEFAULT_ASSETS,
    ...assets,
    sounds: { ...DEFAULT_ASSETS.sounds, ...(assets?.sounds || {}) },
  };
  return (
    <Pitch
      ballPoint={GAME.spot}
      keeperPoint={pointForDirection(getDirection("CM"))}
      shot={null}
      shotActive={false}
      activeTeam={user}
      defenderTeam={opponent}
      showAim={false}
      aimDirection={getDirection("CM")}
      assets={mergedAssets}
      stageLabel={stageLabel}
      hideMatchActors={!showActors}
      pitchMowVariant={pitchMowVariant}
      showAdBoard={showAdBoard}
      showPitchMarkings={showPitchMarkings}
      podiumBadgeMode={podiumBadgeMode}
      badgeTransform={badgeTransform}
      exportVisualTuning={exportVisualTuning}
    />
  );
}

function ConfirmButton({ onClick, disabled = false, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-[clamp(44px,5.1dvh,62px)] min-h-[44px] w-full place-items-center rounded-[clamp(14px,2.2vh,28px)] border-[1.5px] px-4 text-center home-copy-bold text-[clamp(18px,2.35dvh,27px)] font-black leading-none text-[#5F0041] disabled:cursor-default disabled:opacity-65"
      style={{
        background: CYAN_BUTTON_GRADIENT,
        borderColor: "#9CCEEB",
        boxShadow: "0 8px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -2px 3px rgba(34,87,121,0.22)",
      }}
    >
      <span className="block w-full whitespace-nowrap text-center">{children}</span>
    </button>
  );
}

export function ControlOverlay({
  phase,
  selected,
  setSelected,
  handleConfirmDirection,
  powerValue,
  powerCharging,
  powerFillRef,
  handleLockPower,
  powerTargetZone,
  accuracyValue,
  accuracyRunning,
  accuracyFillRef,
  handleLockAccuracy,
  accuracyTargetZone,
  opponentTeam,
  endActionLabel = "MATCH COMPLETE",
  endActionEnabled = false,
  onEndAction,
}) {
  const canChoose = phase === PHASE.DIRECTION;
  const canPower = phase === PHASE.POWER;
  const canAccuracy = phase === PHASE_ACCURACY;
  const titleClass = "home-copy-bold text-center text-[clamp(18px,2.25dvh,27px)] font-black tracking-[0.08em] text-[#f5f1e8] drop-shadow-md";

  return (
    <section className="pointer-events-none absolute bottom-[max(42px,calc(env(safe-area-inset-bottom)+30px))] left-[4%] right-[4%] z-30 h-[min(28%,176px)]">
      {canChoose && (
        <div className="pointer-events-auto absolute inset-x-[4%] bottom-0 top-0 flex flex-col">
          <div key="direction-grid" className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-[clamp(7px,1.55vw,13px)]">
            {DIRECTIONS.map((direction) => (
              <button
                key={direction.id}
                type="button"
                onClick={(event) => { event.currentTarget.blur(); setSelected(direction); }}
                className={`relative isolate flex min-h-0 appearance-none items-center justify-center overflow-hidden rounded-[clamp(14px,2.2vh,28px)] border-[1.5px] home-copy-bold text-[clamp(16px,2.15vh,26px)] font-black leading-none outline-none transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 ${selected.id === direction.id ? "text-[#5F0041]" : "text-white"}`}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  contain: "layout paint",
                  transform: "translateZ(0)",
                  background: selected.id === direction.id ? CYAN_BUTTON_GRADIENT : CLARET_BUTTON_GRADIENT,
                  borderColor: selected.id === direction.id ? "#9CCEEB" : "#934D7B",
                  boxShadow: selected.id === direction.id
                    ? "0 7px 15px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 3px rgba(34,87,121,0.22)"
                    : "0 7px 15px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,195,233,0.14), inset 0 -2px 3px rgba(23,0,16,0.25)",
                }}
              >
                <span className="pointer-events-none relative z-[1] flex h-full w-full max-h-full max-w-full select-none items-center justify-center leading-none no-underline decoration-transparent" style={{ textDecoration: "none" }}>{direction.arrow}</span>
              </button>
            ))}
          </div>
          <div className="h-[5%]" />
          <ConfirmButton onClick={handleConfirmDirection}>CONFIRM DIRECTION</ConfirmButton>
        </div>
      )}
      {canPower && (
        <div className="pointer-events-auto absolute inset-x-[4%] bottom-0 flex flex-col gap-[clamp(8px,1.05dvh,16px)]">
          <div className={titleClass}>SHOT POWER</div>
          <PowerChargeMeter value={powerValue} ideal={powerTargetZone} charging={powerCharging} fillRef={powerFillRef} />
          <ConfirmButton onClick={handleLockPower}>TAP FOR POWER</ConfirmButton>
        </div>
      )}
      {canAccuracy && (
        <div className="pointer-events-auto absolute inset-x-[4%] bottom-0 flex flex-col gap-[clamp(8px,1.05dvh,16px)]">
          <div className={titleClass}>SHOT ACCURACY</div>
          <AccuracyMeter value={accuracyValue} ideal={accuracyTargetZone} running={accuracyRunning} fillRef={accuracyFillRef} />
          <ConfirmButton onClick={handleLockAccuracy}>TAP FOR ACCURACY</ConfirmButton>
        </div>
      )}
      {!canChoose && !canPower && !canAccuracy && (
        <div className="pointer-events-auto absolute inset-x-[4%] bottom-0">
          <ConfirmButton onClick={endActionEnabled ? onEndAction : undefined} disabled={!endActionEnabled}>
            {phase === PHASE.SHOT ? "SHOT IN PROGRESS" : phase === PHASE.AI_WAIT ? `${opponentTeam.name.toUpperCase()} SHOOTING` : endActionLabel}
          </ConfirmButton>
        </div>
      )}
    </section>
  );
}

export function TemporaryMatchButtons({ onPerfectWin, onRandomWin }) {
  const buttonClass = "rounded-[0.55rem] border border-[#F7D117]/24 bg-[#062819]/86 px-2.5 py-1.5 text-center home-copy-bold text-[7px] uppercase leading-none tracking-[0.08em] text-[#F7D117] shadow-[0_5px_12px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(245,241,232,0.08)] active:scale-[0.98]";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[clamp(118px,16dvh,162px)] z-40 flex justify-center">
      <div className="pointer-events-auto flex max-w-[92%] items-center justify-center gap-2 rounded-[0.75rem] border border-[#F5F1E8]/10 bg-[#031D13]/60 px-2 py-1.5 backdrop-blur-[2px]">
        <button type="button" className={buttonClass} onClick={onPerfectWin}>
          TEMP 5-0 PERFECT
        </button>
        <button type="button" className={buttonClass} onClick={onRandomWin}>
          TEMP RANDOM WIN
        </button>
      </div>
    </div>
  );
}
