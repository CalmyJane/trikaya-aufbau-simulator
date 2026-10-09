import { getLang } from '../i18n.js';

// Borrowable vehicles: Franzi's bike (with a witch's broom strapped on, on the festival ground) and Fabi's
// e-scooter (crew camp). Ask the owner once (small talk) – from then on you may just take it, every ride
// costs a little karma (saved in flags.rentOk_<owner>). You promise to bring it back – you don't have to:
// leave one lying around for a while and its owner quietly fetches it back. So you can cross the site
// in both directions when the quad isn't around. When Franzi rushes to an emergency she rides her bike herself.

const IDLE_BACK = 75;     // seconds lying around before the owner takes it back

class Rental {
  constructor(game, vehicle, { owner, cost, park }) {
    this.game = game;
    this.vehicle = vehicle;
    this.ownerId = owner;
    this.price = cost;
    this.park = park; // [dx, dz, heading] next to the owner's home
    this.reset();
  }

  get owner() { return this.game.npcs.get(this.ownerId); }
  get cost() { return this.price; }
  /** Asked the owner once? Then you may take it whenever it's free. */
  get allowed() { return !!this.game.quests.state.flags['rentOk_' + this.ownerId]; }
  /** Texts in one language: ask, yes, noKarma, firstToast, takeToast, ride, take, needAsk, fetched. */
  text() { return {}; }

  reset() {
    this.rented = false;
    this.idleT = 0;
    this.rider = null;
    this.parkAtOwner();
  }

  /** Next to the owner's current home. */
  parkAtOwner() {
    const f = this.owner;
    if (!f) return;
    const h = f.home, [dx, dz, hd] = this.park;
    this.vehicle.place({ x: h.x + dx, z: h.z + dz }, hd);
    this.vehicle.speed = 0;
    this.vehicle.unstick(null, 0.1);
  }

  nearOwner(dist = 14) {
    const f = this.owner;
    return !!f && !f.hidden && this.vehicle.position.distanceTo(f.position) < dist;
  }

  /** Small-talk option at the owner's (only until you've asked once). */
  canAsk() { return !this.allowed && !this.rider; }

  /** Asking the owner: permission for good + the first ride. */
  ask() {
    if (!this.pay()) return false;
    this.game.quests.state.flags['rentOk_' + this.ownerId] = true;
    this.game.ui.toast(this.text().firstToast);
    return true;
  }

  /** At the vehicle, after you've asked once: just take it (costs a little karma). */
  take() {
    if (!this.pay()) { this.game.ui.toast(this.text().noKarmaToast); return false; }
    this.game.ui.toast(this.text().takeToast);
    return true;
  }

  pay() {
    const g = this.game;
    if (g.quests.state.karma < this.cost) return false;
    g.quests.state.karma -= this.cost;
    this.rented = true;
    this.idleT = 0;
    g.refreshHUD();
    return true;
  }

  update(dt) {
    const g = this.game;
    const f = this.owner;
    if (!f) return;
    if (g.player.vehicle === this.vehicle) { this.idleT = 0; return; }
    // lying around: after a while the owner fetches it back (when nobody's looking)
    const pp = g.player.position;
    const unseen = this.vehicle.position.distanceTo(pp) > 25;
    if (this.rented) {
      this.idleT += dt;
      if (this.idleT > IDLE_BACK && unseen && !f.task) {
        this.rented = false;
        this.parkAtOwner();
        g.ui.toast(this.text().fetched);
      }
    } else if (!this.nearOwner(12) && unseen && f.position.distanceTo(pp) > 25 && !f.task) {
      this.parkAtOwner(); // owner moved (or rode somewhere and came back on foot) – the vehicle follows "later"
    }
  }
}

export class FranziBike extends Rental {
  constructor(game, bike) {
    super(game, bike, { owner: 'franzi', cost: 5, park: [1.6, -1.2, 0.6] });
  }

  get bike() { return this.vehicle; }

  text() {
    const c = this.cost;
    return getLang() === 'de' ? {
      ask: `🚲 Darf ich mir dein Hexenrad ausleihen? (✺ ${c})`,
      yes: 'Klar! Nimm es, wann immer du magst. Aber bring\'s heil zurück – der Besen ist handgebunden.',
      noKarma: 'Ein bisschen Karma brauch ich schon. Für die Kette. Und den Besen.',
      firstToast: `🚲 Franzis Hexenrad gehört dir (−${c} ✺). Ab jetzt darfst du es immer nehmen, jede Fahrt kostet ✺ ${c}. Lässt du es liegen, holt Franzi es sich.`,
      takeToast: `🚲 Hexenrad geliehen (−${c} ✺). Versprochen, du bringst es zurück!`,
      noKarmaToast: `🚲 Zu wenig Karma fürs Hexenrad (✺ ${c}).`,
      ride: '🚲 Hexenrad fahren',
      take: `🚲 Hexenrad nehmen (✺ ${c})`,
      needAsk: '🚲 Frag Franzi, ob du dir ihr Hexenrad ausleihen darfst',
      fetched: '🚲 Franzi hat ihr Hexenrad wieder abgeholt.',
    } : {
      ask: `🚲 Can I borrow your witch bike? (✺ ${c})`,
      yes: 'Sure! Take it whenever you like. But bring it back in one piece – the broom is hand-tied.',
      noKarma: 'I do need a little karma. For the chain. And the broom.',
      firstToast: `🚲 Franzi's witch bike is yours (−${c} ✺). From now on you may always take it, each ride costs ✺ ${c}. Leave it lying around and Franzi fetches it.`,
      takeToast: `🚲 Witch bike borrowed (−${c} ✺). You promised to bring it back!`,
      noKarmaToast: `🚲 Not enough karma for the witch bike (✺ ${c}).`,
      ride: '🚲 Ride the witch bike',
      take: `🚲 Take the witch bike (✺ ${c})`,
      needAsk: '🚲 Ask Franzi if you may borrow her witch bike',
      fetched: '🚲 Franzi fetched her witch bike back.',
    };
  }

  update(dt) {
    const g = this.game;
    const f = this.owner;
    if (!f) return;
    const driven = g.player.vehicle === this.bike;
    // Franzi rushing to an emergency takes her bike along
    const tk = f.task;
    if (!this.rider && tk && tk.phase === 'go' && (tk.speed || 0) >= 5 && !this.rented && !driven && this.nearOwner(8)) {
      this.rider = f;
      f.ridingBike = this.bike;
      f.char.ride = this.bike;
      this.bike.ghost = true;
      tk.speed = 8;
    }
    if (this.rider) {
      if (!f.task || f.task.phase !== 'go') { this.dismount(); return; }
      this.bike.place({ x: f.position.x, z: f.position.z }, f.root.rotation.y);
      return;
    }
    super.update(dt);
  }

  dismount() {
    const f = this.rider;
    this.rider = null;
    this.bike.ghost = false;
    if (!f) return;
    f.ridingBike = null;
    f.char.ride = null;
    f.char.setSitting(false);
    // park the bike next to her
    const h = f.root.rotation.y;
    this.bike.place({ x: f.position.x + Math.cos(h) * 1.2, z: f.position.z - Math.sin(h) * 1.2 }, h);
    this.bike.speed = 0;
    this.bike.unstick(null, 0.1);
  }
}

export class FabiScooter extends Rental {
  constructor(game, scooter) {
    super(game, scooter, { owner: 'fabi', cost: 5, park: [-1.8, 1.4, -0.8] });
  }

  text() {
    const c = this.cost;
    return getLang() === 'de' ? {
      ask: `🛴 Darf ich mir deinen E-Scooter ausleihen? (✺ ${c})`,
      yes: 'Klar, nimm ihn, wann du willst. Bringst du ihn wieder? Versprochen? …Ich weiß eh, wo er ist. Meistens.',
      noKarma: 'Ohne Karma kein Akku. So ist das.',
      firstToast: `🛴 Fabis E-Scooter gehört dir (−${c} ✺). Ab jetzt darfst du ihn immer nehmen, jede Fahrt kostet ✺ ${c}. Lässt du ihn liegen, holt Fabi ihn sich.`,
      takeToast: `🛴 E-Scooter geliehen (−${c} ✺). Versprochen, du bringst ihn zurück!`,
      noKarmaToast: `🛴 Zu wenig Karma für den E-Scooter (✺ ${c}).`,
      ride: '🛴 E-Scooter fahren',
      take: `🛴 E-Scooter nehmen (✺ ${c})`,
      needAsk: '🛴 Frag Fabi, ob du dir seinen E-Scooter ausleihen darfst',
      fetched: '🛴 Fabi hat seinen E-Scooter wieder eingesammelt.',
    } : {
      ask: `🛴 Can I borrow your e-scooter? (✺ ${c})`,
      yes: 'Sure, take it whenever you want. You\'ll bring it back? Promise? …I know where it is anyway. Mostly.',
      noKarma: 'No karma, no battery. That\'s how it is.',
      firstToast: `🛴 Fabi's e-scooter is yours (−${c} ✺). From now on you may always take it, each ride costs ✺ ${c}. Leave it lying around and Fabi fetches it.`,
      takeToast: `🛴 E-scooter borrowed (−${c} ✺). You promised to bring it back!`,
      noKarmaToast: `🛴 Not enough karma for the e-scooter (✺ ${c}).`,
      ride: '🛴 Ride the e-scooter',
      take: `🛴 Take the e-scooter (✺ ${c})`,
      needAsk: '🛴 Ask Fabi if you may borrow his e-scooter',
      fetched: '🛴 Fabi collected his e-scooter again.',
    };
  }
}
