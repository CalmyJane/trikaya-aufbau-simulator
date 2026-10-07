import { L } from '../i18n.js';

// Festival finances. Tickets sell by themselves (faster the more is built), everything costs money,
// random bills arrive – and the festival never, ever makes a profit. That's the joke.

export const TICKET_PRICE = 79;
export const START_BUDGET = -8500; // "Minus aus dem Vorjahr"

const BILLS = [
  { de: 'GEMA-Vorauszahlung', en: 'GEMA prepayment', min: 1200, max: 2600 },
  { de: 'Bauzaun-Miete', en: 'Fence rental', min: 700, max: 1400 },
  { de: 'Veranstalter-Versicherung', en: 'Event insurance', min: 900, max: 1800 },
  { de: 'Palette Klopapier (die gute)', en: 'Pallet of toilet paper (the good one)', min: 350, max: 600 },
  { de: 'Gaffa-Tape, 80 Rollen', en: 'Gaffa tape, 80 rolls', min: 400, max: 800 },
  { de: 'Kabelbinder (alle)', en: 'Cable ties (all of them)', min: 150, max: 420 },
  { de: 'Genehmigung Landratsamt', en: 'District office permit', min: 800, max: 1500 },
  { de: 'Pizza für die Crew', en: 'Pizza for the crew', min: 250, max: 520 },
  { de: 'Diesel für den Generator', en: 'Generator diesel', min: 500, max: 1100 },
  { de: 'Nachzahlung Stromanbieter', en: 'Electricity back-payment', min: 600, max: 1600 },
  { de: 'Mate. Sehr viel Mate.', en: 'Mate. A lot of mate.', min: 300, max: 700 },
];


export class Economy {
  constructor(game) {
    this.game = game;
    this.ticketAcc = 0;
    this.billT = 70 + Math.random() * 60;
  }

  get state() { return this.game.quests.state; }

  /** Pay something. reason: { de, en } or string. */
  spend(amount, reason) {
    if (!amount) return;
    this.state.money -= amount;
    this.game.ui.moneyFloat(-amount, L(reason));
    this.game.audio.coin?.(false);
    this.game.refreshHUD();
  }

  earn(amount, reason) {
    this.state.money += amount;
    if (reason) this.game.ui.moneyFloat(amount, L(reason));
    this.game.refreshHUD();
  }

  update(dt, readiness) {
    const st = this.state;
    if (!this.game.quests.isDone('q0_leo') && !this.game.quests.isActive('q0_leo')) return; // pre-sale starts once you're crew
    // ticket sales: tickets per minute grow with readiness
    const perMin = 1.5 + readiness * 16 + (this.game.world.night > 0.5 ? 2 : 0);
    this.ticketAcc += (perMin / 60) * dt * (0.6 + Math.random() * 0.8);
    while (this.ticketAcc >= 1) {
      this.ticketAcc -= 1;
      st.tickets = (st.tickets || 0) + 1;
      st.money += TICKET_PRICE;
      this.game.ui.ticketTick();
    }
    // random bills
    this.billT -= dt;
    if (this.billT <= 0) {
      this.billT = 90 + Math.random() * 70;
      const b = BILLS[Math.floor(Math.random() * BILLS.length)];
      this.spend(Math.round((b.min + Math.random() * (b.max - b.min)) / 10) * 10, b);
    }
    // the festival never makes a profit. Ever.
    if (st.money > -250) {
      const b = BILLS[9];
      this.spend(st.money + 750 + Math.round(Math.random() * 20) * 50, b);
      this.game.ui.toast(L({ de: '🙃 Fast im Plus gewesen. Fast.', en: '🙃 Almost made a profit. Almost.' }));
    }
  }
}
