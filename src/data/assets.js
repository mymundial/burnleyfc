import goalMp3 from "../assets/goal.mp3";
import missMp3 from "../assets/miss.mp3";
const branding = {
  mondayLogo: "/assets/branding/efl-trophy-badge.png",
  mondayCupAd: "/assets/branding/jersey-mikes-subs.png",
  mondayFlat: "/assets/branding/efl-trophy-badge.png",
  logo2: "/assets/branding/efl-trophy-badge.png",
  myMundialLogo: "/assets/branding/brothers.webp",
  brothersDark: "/assets/branding/brothers2.webp",
  trophyAd: "/assets/branding/trophy-ad.png",
  trophyPixel: "/assets/branding/trophy_pixel.png",
};

const badges = {
  champion: "/assets/badges/mc-champs2.webp",
  runnerUp: "/assets/badges/mc-runner-up.webp",
  third: "/assets/badges/mc-third-place.webp",
};

const game = {
  ball: "/assets/game/efl-ball.png",
  goalkeeper: "/assets/game/gk1.png",
};

const challenges = {
  weeklyChallengeCapeVerdeBadge: "/assets/challenges/weekly_challenge_beat_cape_verde_badge.webp",
};

const sounds = {
  goalSound: goalMp3,
  missSound: missMp3,
  userShot: "https://raw.githubusercontent.com/mymundial/mymundial/415282fcde8c537de643f76e83d168f413ee6735/shot2mon.wav",
  opponentShot: "https://raw.githubusercontent.com/mymundial/mymundial/415282fcde8c537de643f76e83d168f413ee6735/Shot5.wav",
};

export const ASSETS = {
  branding,
  badges,
  game,
  sounds,
  challenges,

  // Backwards-compatible aliases for existing components during migration.
  mondayLogo: branding.mondayLogo,
  mondayCupAd: branding.mondayCupAd,
  mondayFlat: branding.mondayFlat,
  myMundialLogo: branding.myMundialLogo,
  brothersLogo: branding.myMundialLogo,
  brothersDarkLogo: branding.brothersDark,
  trophyAd: branding.trophyAd,
  trophyPixel: branding.trophyPixel,
  ball: game.ball,
  goalkeeper: game.goalkeeper,
  weeklyChallengeCapeVerdeBadge: challenges.weeklyChallengeCapeVerdeBadge,
  championBadge: badges.champion,
  runnerUpBadge: badges.runnerUp,
  thirdPlaceBadge: badges.third,
};
