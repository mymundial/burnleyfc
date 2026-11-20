import { useEffect, useState } from "react";
import { MC_SELECTION_LAYOUT } from "../../styles/theme.js";
import { fivePlaceLeaderboard } from "../../logic/leaderboardDisplay.js";
import CompetitionTerms from "./CompetitionTerms.jsx";

const BURNLEY_CREST = "/assets/branding/burnley-club-logo.png";
const BLUE_BUTTON = "flex h-[clamp(48px,5.6dvh,62px)] min-h-[48px] w-full items-center justify-center rounded-[clamp(14px,2.2vh,28px)] border-[1.5px] border-[#9CCEEB] bg-[linear-gradient(180deg,#A0D9F7_0%,#7EC6F1_48%,#58ADE2_100%)] px-3 text-center home-copy-bold text-[clamp(16px,2.3dvh,25px)] uppercase leading-none tracking-[0.05em] text-[#5F0041] shadow-[0_8px_18px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.30),inset_0_-2px_3px_rgba(34,87,121,0.22)] active:scale-[0.98] disabled:opacity-60";
const PANEL_BACKGROUND = {
  backgroundColor: "#4C183B",
  backgroundImage: "linear-gradient(180deg,#561A42 0%,#4C183B 52%,#320F27 100%)",
};
const RECOVERY_ERROR_HOLD_MS = 3000;
const INNER = "rounded-[1.35rem] border border-[#F5F1E8]/14 bg-[#21091B]/30 p-2.5 text-[#F5F1E8] shadow-[inset_0_1px_0_rgba(245,241,232,0.06)]";

function CloseIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" /></svg>;
}
function StarIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="m12 2.8 2.75 5.75 6.35.9-4.6 4.45 1.1 6.3L12 17.3l-5.6 2.9 1.1-6.3-4.6-4.45 6.35-.9L12 2.8Z" /></svg>;
}
function AtIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.7" /><path d="M16.4 9.7v5.5c0 2.4 4.2 1.3 4.1-2.4M16.4 12.6a4.4 4.4 0 1 1-8.8 0 4.4 4.4 0 0 1 8.8 0Z" /></svg>;
}
function ModalFrame({ children, label, expanded = false, entrySized = false }) {
  return <div className="fixed inset-0 isolate flex items-center justify-center overflow-y-auto bg-[#160A16]/60 px-3 py-[max(14px,env(safe-area-inset-top))] backdrop-blur-[4px]" role="dialog" aria-modal="true" aria-label={label} style={{ zIndex: 2147483647 }}>
    <div className={`relative z-[1] flex w-full max-w-[408px] flex-col items-stretch ${expanded ? "h-[min(90dvh,760px)] max-h-[calc(100dvh-28px)]" : ""}`}>
      <div className={`relative w-full overflow-hidden rounded-[2rem] border border-[#F5F1E8]/14 text-center text-[#F5F1E8] shadow-[0_24px_54px_rgba(0,0,0,0.36),inset_0_-2px_6px_rgba(0,0,0,0.08)] ${expanded ? "flex min-h-0 flex-1 flex-col" : entrySized ? "flex flex-col" : ""}`} style={entrySized ? { ...PANEL_BACKGROUND, minHeight: "calc(260px + clamp(48px, 5.6dvh, 62px))" } : PANEL_BACKGROUND}>
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.09))]" aria-hidden="true" />
        <div className={`relative p-3 ${expanded ? "flex min-h-0 flex-1 flex-col" : entrySized ? "flex flex-1 flex-col" : ""}`}>{children}</div>
      </div>
    </div>
  </div>;
}
function ModalHeader({ title, onClose }) {
  return <div className="mb-2 grid h-[58px] grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2">
    <img src={BURNLEY_CREST} alt="Burnley FC" draggable={false} className="h-10 w-10 object-contain drop-shadow-[0_5px_8px_rgba(0,0,0,0.3)]" />
    <div className="home-copy-bold truncate whitespace-nowrap uppercase leading-none tracking-[0.075em] text-[clamp(21px,6.3vw,28px)]">{title}</div>
    <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center text-white active:scale-[0.96]" aria-label="Close"><CloseIcon /></button>
  </div>;
}

// Match the Monday Cup home anchors: the badge is centred against the goal,
// and the menu begins just below the goal line. Both percentages are measured
// from the PITCH, never the scoreboard or the complete game viewport.
const HOME_GOAL_LINE_PERCENT = MC_SELECTION_LAYOUT.goalTopPercent + MC_SELECTION_LAYOUT.goalHeightPercent;
const HOME_BADGE_CENTER_Y = `${(HOME_GOAL_LINE_PERCENT - MC_SELECTION_LAYOUT.adBoardHeightPercent) / 2}%`;
const HOME_MENU_TOP = `calc(${HOME_GOAL_LINE_PERCENT}% + 20px)`;

export function CompetitionHomeOverlay({ onCompetition, onPractice, showButtons = true }) {
  return <div className="pointer-events-none absolute inset-0 z-[40]">
    <div className="absolute left-1/2 z-[1] flex h-[clamp(95px,16dvh,145px)] w-[45%] -translate-x-1/2 -translate-y-1/2 items-center justify-center" style={{ top: HOME_BADGE_CENTER_Y }}>
      <div aria-hidden="true" className="absolute h-[74%] w-[70%] rounded-full bg-[#F7D117]/12 blur-3xl" />
      <img src={BURNLEY_CREST} alt="" draggable={false} className="relative h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.33)]" />
    </div>
    {showButtons && <div className="pointer-events-auto absolute left-[5%] right-[5%] z-[2] overflow-hidden rounded-[1.65rem] border-[1.5px] border-[#934D7B] p-3 text-white shadow-[inset_0_1px_0_rgba(245,241,232,0.04)]" style={{ top: HOME_MENU_TOP, ...PANEL_BACKGROUND }}>
      <div className="flex flex-col gap-3 px-1 py-1">
        <button type="button" onClick={onCompetition} className={BLUE_BUTTON}>ENTER COMPETITION</button>
        <button type="button" onClick={onPractice} className={BLUE_BUTTON}>PRACTICE MODE</button>
      </div>
    </div>}
  </div>;
}

function FormInput({ icon, ...props }) {
  return <label className="flex h-[42px] w-full items-center overflow-hidden rounded-full border border-[#F5F1E8]/16 bg-[#260C20]/64 px-2 text-[#F5F1E8] shadow-[inset_0_1px_0_rgba(245,241,232,0.06),0_6px_14px_rgba(0,0,0,0.10)]">
    <span className="grid w-[32px] shrink-0 place-items-center opacity-80">{icon}</span>
    <input {...props} className="home-copy-bold h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-[17px] uppercase text-[#F5F1E8] outline-none placeholder:uppercase placeholder:text-[#F5F1E8]/60" />
  </label>;
}

export function CompetitionWelcomeBackModal({ username, onContinue, onSwitchPlayer, onClose, busy = false, error = "" }) {
  return <ModalFrame label="Welcome back to the competition">
    <ModalHeader title="WELCOME BACK" onClose={onClose} />
    <div className="flex flex-col gap-2">
      <div className={`${INNER} flex flex-col items-center justify-center gap-2 p-4`}>
        <p className="home-copy-bold text-center text-[17px] uppercase leading-tight text-[#F5F1E8]/60">READY FOR ANOTHER GO?</p>
        <p className="home-copy-bold max-w-full break-words text-center text-[clamp(21px,6vw,28px)] uppercase leading-tight text-[#F5F1E8]">{username}</p>
      </div>
      <button type="button" onClick={onContinue} disabled={busy} className={BLUE_BUTTON}>{busy ? "CHECKING..." : "CONTINUE"}</button>
      {error && <p role="alert" className="home-copy-bold text-center text-[12px] uppercase text-[#F7D117]">{error}</p>}
      <button type="button" onClick={onSwitchPlayer} className="home-copy-bold cursor-pointer self-center text-center text-[clamp(12px,3vw,14px)] uppercase leading-tight tracking-[0.04em] text-[#8FD0F2] underline underline-offset-[3px] decoration-[#8FD0F2]/75">NOT YOU?</button>
    </div>
  </ModalFrame>;
}

export function CompetitionRegistrationModal({ onClose, onRegister, onStartRecovery, schedule, initialUsername = "", initialEmail = "" }) {
  const [username, setUsername] = useState(String(initialUsername).toUpperCase().slice(0, 12));
  const [email, setEmail] = useState(initialEmail);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [view, setView] = useState("entry");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  useEffect(() => {
    if (!error) return undefined;
    const timeout = setTimeout(() => setError(""), RECOVERY_ERROR_HOLD_MS);
    return () => clearTimeout(timeout);
  }, [error]);
  const validUsername = /^[A-Z0-9]{1,12}$/.test(username.trim());
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 254;
  const formReady = validUsername && validEmail && termsAccepted;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || !formReady) return;
    const cleanUsername = username.trim().replace(/[^a-z0-9]/gi, "").slice(0, 12);
    const cleanEmail = email.trim().toLowerCase();
    setError("");
    setFieldError(null);
    setSaving(true);
    try { await onRegister({ username: cleanUsername, email: cleanEmail, termsAccepted }); }
    catch (cause) {
      const message = String(cause?.message || "REGISTRATION FAILED").toUpperCase();
      if (message === "USERNAME ALREADY TAKEN") setFieldError({ field: "username", message });
      else if (message === "EMAIL ADDRESS ALREADY REGISTERED") setView("recovery");
      else setError("REGISTRATION FAILED. PLEASE TRY AGAIN");
    }
    finally { setSaving(false); }
  };

  const handleRecovery = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try { await onStartRecovery({ username: username.trim(), email: email.trim().toLowerCase() }); setView("recoverySent"); }
    catch (cause) { setError(String(cause?.message || "EMAIL RECOVERY UNAVAILABLE").toUpperCase()); }
    finally { setSaving(false); }
  };

  if (view === "recovery" || view === "recoverySent") {
    return <ModalFrame label="Recover competition entry">
      <ModalHeader title="WELCOME BACK" onClose={onClose} />
      <div className="flex flex-col gap-2">
        <div className={`${INNER} flex flex-col gap-2 p-4 text-center home-copy-bold uppercase leading-tight`}>
          {view === "recovery" ? <>
            <p className="text-[17px] text-[#F5F1E8]/60">AN ACCOUNT ALREADY EXISTS WITH THIS EMAIL ADDRESS</p>
            <p className="text-[clamp(21px,6vw,28px)] text-[#F5F1E8]">VERIFY YOUR EMAIL TO CONTINUE</p>
          </> : <p className="text-[17px] text-[#F5F1E8]/60">IF AN ACCOUNT EXISTS, WE'VE SENT A SIGN-IN LINK. CHECK YOUR EMAIL AND FOLLOW THE LINK.</p>}
        </div>
        {view === "recovery" && <button type="button" onClick={handleRecovery} disabled={saving} className={`${BLUE_BUTTON} ${error ? "text-[clamp(12px,2.6vw,16px)]" : ""}`} aria-live="polite">{saving ? "SENDING..." : error || "SEND SIGN-IN LINK"}</button>}
        <button type="button" onClick={() => { setView("entry"); setError(""); setEmail(""); }} className="home-copy-bold self-center text-center text-[13px] uppercase text-[#8FD0F2] underline underline-offset-[3px]">USE DIFFERENT EMAIL</button>
      </div>
    </ModalFrame>;
  }

  if (view === "terms") {
    return <ModalFrame label="Competition terms and conditions" expanded>
      <ModalHeader title="TERMS AND CONDITIONS" onClose={onClose} />
      <div className={`${INNER} min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 text-left [scrollbar-width:thin] [scrollbar-color:#9CCEEB_transparent]`} tabIndex={0} aria-label="Scroll through the terms and conditions">
        <CompetitionTerms schedule={schedule} />
      </div>
      <button type="button" onClick={() => setView("entry")} className={`${BLUE_BUTTON} mt-3 h-[48px] min-h-[48px] shrink-0 text-[clamp(15px,3.8vw,21px)]`}>BACK TO COMPETITION ENTRY</button>
    </ModalFrame>;
  }

  return <ModalFrame label="Competition registration" entrySized>
    <ModalHeader title="ENTER COMPETITION" onClose={onClose} />
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className={`${INNER} flex flex-col gap-2 p-3`}>
        <FormInput icon={<StarIcon />} type="text" aria-label="Username" placeholder="USERNAME" value={username} onChange={(event) => { setUsername(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)); setFieldError(null); setError(""); }} required maxLength={12} autoComplete="nickname" autoCapitalize="characters" spellCheck={false} />
        {fieldError?.field === "username" && <p role="alert" className="text-center home-copy-bold text-[12px] uppercase leading-tight text-[#F7D117]">{fieldError.message}</p>}
        <FormInput icon={<AtIcon />} type="email" aria-label="Email address" placeholder="EMAIL ADDRESS" value={email} onChange={(event) => { setEmail(event.target.value); setFieldError(null); setError(""); }} required autoComplete="email" autoCapitalize="off" spellCheck={false} />
        {fieldError?.field === "email" && <p role="alert" className="text-center home-copy-bold text-[12px] uppercase leading-tight text-[#F7D117]">{fieldError.message}</p>}
        <div className="my-2 flex w-full items-center justify-center gap-2 rounded-[0.9rem] px-1 text-center">
          <input id="burnley-terms-consent" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} aria-required="true" className="h-4 w-4 shrink-0 cursor-pointer accent-[#7EC6F1]" />
          <div className="home-copy-bold text-[clamp(10px,2.7vw,12px)] uppercase leading-[1.3] tracking-[0.04em] text-[#F5F1E8]">
            <label htmlFor="burnley-terms-consent" className="cursor-pointer">I AGREE TO THE </label>
            <button type="button" className="cursor-pointer text-[#8FD0F2] underline underline-offset-[3px] decoration-[#8FD0F2]/75" onClick={() => { setError(""); setView("terms"); }}>TERMS AND CONDITIONS</button>
          </div>
        </div>
      </div>
      {error && <p role="alert" className="text-center home-copy-bold text-[12px] uppercase leading-tight text-[#F7D117]">{error}</p>}
      <button type="submit" disabled={saving || !formReady} className={`${BLUE_BUTTON} disabled:cursor-not-allowed disabled:opacity-50`}>{saving ? "REGISTERING..." : "SUBMIT"}</button>
    </form>
  </ModalFrame>;
}

export function CompetitionRecoveryLinkModal({ link, onFinish, onRename, onClose }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(link?.username || "");
  const [verifiedTicket, setVerifiedTicket] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!error) return undefined;
    const timeout = setTimeout(() => setError(""), RECOVERY_ERROR_HOLD_MS);
    return () => clearTimeout(timeout);
  }, [error]);
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = verifiedTicket
        ? await onRename({ username, recoveryTicket: verifiedTicket })
        : await onFinish({ username, email: email.toLowerCase().trim(), oobCode: link.oobCode });
      if (result?.needsUsername) {
        setVerifiedTicket(result.recoveryTicket);
        setError("USERNAME ALREADY TAKEN");
      }
    } catch (cause) { setError(String(cause?.message || "RECOVERY FAILED. PLEASE TRY AGAIN").toUpperCase()); }
    finally { setBusy(false); }
  };
  return <ModalFrame label="Verify account recovery">
    <ModalHeader title="WELCOME BACK" onClose={onClose} />
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className={`${INNER} flex flex-col gap-2 p-3`}>
        <p className="home-copy-bold text-center text-[17px] uppercase text-[#F5F1E8]/60">{verifiedTicket ? "CHOOSE A NEW USERNAME" : "CONFIRM YOUR EMAIL TO CONTINUE"}</p>
        <FormInput icon={<StarIcon />} type="text" aria-label="Username" placeholder="USERNAME" value={username} onChange={(event) => { setUsername(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)); setError(""); }} required maxLength={12} />
        {!verifiedTicket && <FormInput icon={<AtIcon />} type="email" aria-label="Email address" placeholder="EMAIL ADDRESS" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} required autoComplete="email" />}
      </div>
      <button type="submit" disabled={busy || !/^[A-Z0-9]{1,12}$/.test(username) || (!verifiedTicket && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))} className={`${BLUE_BUTTON} ${error ? "text-[clamp(12px,2.6vw,16px)]" : ""}`} aria-live="polite">{busy ? "VERIFYING..." : error || (verifiedTicket ? "CONTINUE" : "VERIFY EMAIL")}</button>
    </form>
  </ModalFrame>;
}

export function CompetitionAvailabilityModal({ status, startAt, endAt, leaderboard, onClose }) {
  const upcoming = status === "upcoming";
  const title = upcoming ? "COMING SOON" : status === "closed" ? "COMPETITION CLOSED" : "COMPETITION UNAVAILABLE";
  const when = upcoming ? startAt : endAt;
  const date = when ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(when)) : "";
  return <ModalFrame label={title}>
    <ModalHeader title={title} onClose={onClose} />
    <div className={`${INNER} p-4 text-center home-copy-bold text-[17px] uppercase leading-tight text-[#F5F1E8]/60`}>
      {upcoming ? `THE COMPETITION OPENS ${date}` : status === "closed" ? `THE COMPETITION CLOSED ${date}. FINAL RESULTS REMAIN AVAILABLE.` : "COMPETITION ENTRY IS CURRENTLY UNAVAILABLE."}
    </div>
    {status === "closed" && <div className={`${INNER} mt-2`}>
      <h3 className="mb-2 home-copy-bold text-center text-[17px] uppercase">FINAL LEADERBOARD</h3>
      <LeaderboardHeader />
      {fivePlaceLeaderboard(leaderboard?.top5).map((row) => <LeaderboardRow key={row.id} row={row} />)}
    </div>}
    <button type="button" className={`${BLUE_BUTTON} mt-3`} onClick={onClose}>CLOSE</button>
  </ModalFrame>;
}

const LB_GRID = "10% 80% 10%";
const LB_TEXT = "home-copy-bold text-[clamp(10px,2.9vw,12px)] uppercase leading-none tracking-[0.02em]";
function LeaderboardSection({ title, children }) {
  return <div className={INNER}>
    <h3 className="mb-2 text-center home-copy-bold text-[clamp(15px,4.1vw,19px)] uppercase leading-none tracking-[0.11em]">{title}</h3>
    {children}
  </div>;
}
function LeaderboardHeader() {
  return <div className="grid items-center gap-0 px-1.5 pb-1.5 text-center home-copy-bold text-[8px] uppercase leading-none tracking-[0.055em]" style={{ gridTemplateColumns: LB_GRID }}>
    <span>RANK</span><span className="text-center">USERNAME</span><span>SCORE</span>
  </div>;
}
function LeaderboardRow({ row, isUser = false }) {
  const rank = Number(row?.rank) || null;
  const isPodium = rank === 1 || rank === 2 || rank === 3;
  const border = rank === 1 ? "border-[#B98224]/88 ring-1 ring-[#D99A2B]/26"
    : rank === 2 ? "border-[#C8C8C8]/80 ring-1 ring-[#F5F1E8]/28"
    : rank === 3 ? "border-[#CD7F32]/80 ring-1 ring-[#CD7F32]/30"
    : isUser ? "border-[#F7D117]/88 ring-1 ring-[#F7D117]/34"
    : "border-[#F5F1E8]/14 ring-1 ring-[#F5F1E8]/10";
  const rankColor = rank === 1 ? "text-[#D99A2B]"
    : rank === 2 ? "text-[#C8C8C8]"
    : rank === 3 ? "text-[#CD7F32]"
    : isUser ? "text-[#F7D117]"
    : "text-white";
  const usernameColor = isUser ? "text-[#F7D117]" : "text-white";
  const scoreColor = isUser ? "text-[#F7D117]" : "text-white";
  return <div className={`grid h-[40px] items-center gap-0 rounded-[1.05rem] border bg-[#21091B]/58 px-1.5 py-0 text-[#F5F1E8] shadow-[0_6px_14px_rgba(0,0,0,0.10)] ${border}`} style={{ gridTemplateColumns: LB_GRID }}>
    <div className={`flex h-full min-w-0 items-center justify-center ${LB_TEXT} ${rankColor}`}>#{rank || "--"}</div>
    <div className={`flex h-full min-w-0 items-center justify-center truncate text-center ${LB_TEXT} ${usernameColor}`}>{row?.username || "—"}</div>
    <div className={`flex h-full min-w-0 items-center justify-center tabular-nums ${LB_TEXT} ${scoreColor}`}>{row?.score !== null && row?.score !== undefined && Number.isFinite(Number(row.score)) ? row.score : "—"}</div>
  </div>;
}

export function CompetitionLeaderboardModal({ leaderboard, submitState, currentScore, entrant, onHome, onReplay, onRetry }) {
  const ownRow = leaderboard?.myRanking || {
    rank: null,
    username: entrant?.username || "GUEST",
    score: currentScore?.points ?? null,
  };
  const topRows = fivePlaceLeaderboard(leaderboard?.top5);
  return <ModalFrame label="Matchday competition leaderboard">
    <ModalHeader title="LEADERBOARD" onClose={onHome} />
    {/* Both sections and all six rows remain mounted while results arrive, keeping modal height stable. */}
    <div className="max-h-[calc(100dvh-198px)] space-y-2 overflow-y-auto pb-0">
      <LeaderboardSection title="MY RANKING">
        <LeaderboardHeader />
        <LeaderboardRow row={ownRow} isUser />
      </LeaderboardSection>
      <LeaderboardSection title="TOP 5">
        <LeaderboardHeader />
        <div className="space-y-1.5">
          {topRows.map((row) => <LeaderboardRow key={row.rank} row={row} isUser={Boolean(row.isUser)} />)}
        </div>
      </LeaderboardSection>
    </div>
    {submitState === "error" && <div className="mt-2 text-center"><p role="alert" className="home-copy-bold text-[12px] uppercase text-[#F7D117]">SCORE NOT SUBMITTED · CHECK YOUR CONNECTION</p><button type="button" onClick={onRetry} className="mt-2 home-copy-bold text-[12px] uppercase text-[#F5F1E8] underline">RETRY SUBMISSION</button></div>}
    <button type="button" onClick={onReplay} className={`${BLUE_BUTTON} mt-2`}>REPLAY</button>
  </ModalFrame>;
}
