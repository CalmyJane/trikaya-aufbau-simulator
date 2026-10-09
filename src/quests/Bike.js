import { getLang } from '../i18n.js';

// Borrowable vehicles: Franzi's bike (with a witch's broom strapped on, on the festival ground) and Fabi's
// e-scooter (crew camp). You borrow them for karma and promise to bring them back – you don't have to:
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
  /** Toast texts: { rentedDe, rentedEn, fetchedDe, fetchedEn }. */
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

  /** Small-talk option at the owner's. */
  canRent() { return !this.rented && !this.rider && this.nearOwner(); }

  rent() {
    const g = this.game, de = getLang() === 'de';
    if (g.quests.state.karma < this.cost) return false;
    g.quests.state.karma -= this.cost;
    this.rented = true;
    this.idleT = 0;
    g.ui.toast(this.text()[de ? 'rentedDe' : 'rentedEn']);
    g.refreshHUD();
    return true;
  }

  canRide() { return this.rented && !this.rider; }

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
        g.ui.toast(this.text()[getLang() === 'de' ? 'fetchedDe' : 'fetchedEn']);
      }
    } else if (!this.nearOwner(12) && unseen && f.position.distanceTo(pp) > 25 && !f.task) {
      this.parkAtOwner(); // owner moved (or rode somewhere and came back on foot) – the vehicle follows "later"
    }
  }
}

export class FranziBike extends Rental {
  constructor(game, bike) {
    super(game, bike, { owner: 'franzi', cost: 10, park: [1.6, -1.2, 0.6] });
  }

  get bike() { return this.vehicle; }

  text() {
    return {
      rentedDe: `🚲 Franzis Hexenrad gehört dir (−${this.cost} ✺). Steht neben ihr, E zum Aufsteigen. Du hast versprochen, es zurückzubringen – lässt du es länger liegen, holt sie es sich.`,
      rentedEn: `🚲 Franzi's witch bike is yours (−${this.cost} ✺). It's next to her, E to get on. You promised to bring it back – leave it lying around too long and she fetches it.`,
      fetchedDe: '🚲 Franzi hat ihr Hexenrad wieder abgeholt.',
      fetchedEn: '🚲 Franzi fetched her witch bike back.',
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
    super(game, scooter, { owner: 'fabi', cost: 10, park: [-1.8, 1.4, -0.8] });
  }

  text() {
    return {
      rentedDe: `🛴 Fabis E-Scooter gehört dir (−${this.cost} ✺). Steht bei ihm im Crew Camp, E zum Aufsteigen. Versprochen, du bringst ihn zurück? Sonst holt er ihn sich irgendwann.`,
      rentedEn: `🛴 Fabi's e-scooter is yours (−${this.cost} ✺). It's next to him in the crew camp, E to get on. You promised to bring it back? Otherwise he'll fetch it at some point.`,
      fetchedDe: '🛴 Fabi hat seinen E-Scooter wieder eingesammelt.',
      fetchedEn: '🛴 Fabi collected his e-scooter again.',
    };
  }
}
