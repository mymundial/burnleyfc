// Terms and Conditions proposed for Burnley FC review. This content is not a
// separate page: the registration modal shows it in a scrollable view.
// The "BACK TO COMPETITION ENTRY" action never grants consent.
const STORE = "https://shop.burnleyfc.com";
const PRIVACY = "https://www.burnleyfootballclub.com/legal-information-club-policies";

const linkStyle = "text-[#8FD0F2] underline underline-offset-[3px] decoration-[#8FD0F2]/75";

function formatSchedule(value) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}
export default function CompetitionTerms({ schedule = null }) {
  const scheduleAvailable = schedule?.startAt && schedule?.endAt;

  return <div className="burnley-terms-body pb-2 text-left text-[#F5F1E8]">
    <section>
      <h3>1. Competition organiser</h3>
      <p>The competition is promoted by The Burnley Football &amp; Athletic Company Limited, Turf Moor, Harry Potts Way, Burnley, Lancashire, BB10 4BX ("Burnley FC").</p>
    </section>
    <section>
      <h3>2. Competition dates and times</h3>
      <p>The competition opens at <strong>{scheduleAvailable ? formatSchedule(schedule.startAt) : "10:00am on Sunday 6 December 2026"}</strong> and closes at <strong>{scheduleAvailable ? formatSchedule(schedule.endAt) : "2:00pm on Sunday 6 December 2026"}</strong> (UK local time).</p>
      <p>Only valid scores received before the closing time will count.</p>
    </section>
    <section>
      <h3>3. Eligibility</h3>
      <p>Entry is free and open to UK residents aged 13 and over. Participants under 18 must have parental or guardian permission.</p>
      <p>Employees directly involved in administering the competition, and their immediate families, are excluded.</p>
      <p>No purchase or match ticket is required.</p>
    </section>
    <section>
      <h3>4. How to enter</h3>
      <p>Select ENTER COMPETITION, provide a username and valid email address, accept these Terms and Conditions and complete the penalty challenge.</p>
      <p>Email addresses will not appear on the public leaderboard. Verification is not required for first-time entry; a secure email link is required only if an existing entrant needs to recover access after losing their saved session.</p>
    </section>
    <section>
      <h3>5. Competition attempts</h3>
      <p>Unlimited attempts are permitted during the competition period. Only each participant's <strong>highest valid score</strong> counts.</p>
      <p>Practice Mode scores are excluded. Each participant may win one prize only.</p>
    </section>
    <section>
      <h3>6. Scoring</h3>
      <p>Players earn up to <strong>1,000 points</strong> across their first five penalties.</p>
      <p>Each penalty awards up to <strong>100 points for accuracy</strong> and <strong>100 points for power</strong>. Each meter scores from 0 at either end to 100 at its centre, with points decreasing evenly as the stopped position moves away from the centre (0–100–0).</p>
      <p>The competition ends after five penalties per team, including when scores are level. There is no sudden death in Competition Mode.</p>
      <p>Goals and match results do not affect the points total.</p>
    </section>
    <section>
      <h3>7. Leaderboard and tie-breakers</h3>
      <p>Players are ranked by their highest valid score. Ties are resolved in this order:</p>
      <ol className="ml-5 list-decimal space-y-0.5">
        <li>Most goals scored in the first five penalties.</li>
        <li>Highest total accuracy points.</li>
        <li>Most perfect-centre meter stops.</li>
        <li>Earliest valid server-recorded submission.</li>
      </ol>
      <p>If a player submits the same points total again, their original best-score record is retained; only a strictly higher points total replaces it. Any remaining tie will be resolved by an independently supervised random draw.</p>
      <p>Final rankings are subject to verification.</p>
    </section>
    <section>
      <h3>8. Prizes</h3>
      <p>The three highest-ranked eligible participants will receive:</p>
      <ul className="ml-4 list-disc space-y-0.5">
        <li><strong>Gold — 1st place:</strong> £20 Burnley FC E-Gift Card.</li>
        <li><strong>Silver — 2nd place:</strong> £15 Burnley FC E-Gift Card.</li>
        <li><strong>Bronze — 3rd place:</strong> £10 Burnley FC E-Gift Card.</li>
      </ul>
      <p>All prizes are the official Clarets Store E-Gift Card, <strong>product code 2500360</strong>.</p>
      <p><strong>Total prize fund: £45.</strong> Prizes are non-transferable and cannot be exchanged for cash.</p>
    </section>
    <section>
      <h3>9. Winner notification</h3>
      <p>Burnley FC will email winners by <strong>Wednesday 9 December 2026</strong>, within three working days of competition closure.</p>
      <p>Winners have <strong>14 calendar days</strong> from notification to claim their prize.</p>
      <p>The Club will make reasonable contact attempts, including a reminder. Unclaimed prizes may be offered to the next eligible participant.</p>
    </section>
    <section>
      <h3>10. Prize delivery and redemption</h3>
      <p>Winners will receive their E-Gift Cards electronically at their registered email address, normally within seven working days of claiming.</p>
      <p>Gift cards are redeemable online at <a className={linkStyle} href={STORE} target="_blank" rel="noopener noreferrer">shop.burnleyfc.com</a>, using the instructions provided with each card.</p>
      <p><strong>E-Gift Cards will be valid for 12 months from the date of issue.</strong> The expiry date will be clearly stated on each card. Any additional redemption restrictions will be disclosed before the competition opens.</p>
    </section>
    <section>
      <h3>11. Returns and exchanges</h3>
      <p>Purchases made using E-Gift Cards are subject to the Clarets Store's returns policy.</p>
      <p>Where a return is accepted, the gift-card-funded amount may be restored as gift-card credit. Any additional payments will be handled in accordance with applicable consumer law.</p>
      <p>Statutory consumer rights remain unaffected.</p>
    </section>
    <section>
      <h3>12. Fair play and verification</h3>
      <p>Automated gameplay, score manipulation, fraudulent entries and interference with the leaderboard are prohibited.</p>
      <p>Burnley FC may verify results and disqualify entries where there is reasonable evidence of a breach.</p>
      <p>Only successfully recorded competition scores count. The Club may take reasonable action to resolve technical issues fairly.</p>
    </section>
    <section>
      <h3>13. Personal information and privacy</h3>
      <p>Usernames, email addresses, numbers of completed games, highest scores and the registration terms-acceptance record are collected to administer the competition, maintain the leaderboard and contact winners.</p>
      <p>Usernames and scores may appear publicly. Email addresses remain private and will not be used for unrelated marketing without a separate lawful basis.</p>
      <p>Personal information will be handled in accordance with <a className={linkStyle} href={PRIVACY} target="_blank" rel="noopener noreferrer">Burnley FC's Privacy Notice</a> and retained only as reasonably necessary.</p>
    </section>
    <section>
      <h3>14. Publication of winners</h3>
      <p>Burnley FC may publish winning usernames and scores.</p>
      <p>Limited winner information may also be disclosed where required by promotional rules. Winners may request restrictions on the publication of their personal information.</p>
    </section>
    <section>
      <h3>15. General conditions</h3>
      <p>Burnley FC may amend, suspend or cancel the competition only where circumstances beyond its reasonable control make this necessary and where doing so is fair to participants.</p>
      <p>These terms are governed by the laws of England and Wales, without affecting applicable mandatory consumer rights.</p>
      <p><strong>By entering, participants confirm that they have read and agree to these Terms and Conditions.</strong></p>
    </section>
  </div>;
}
