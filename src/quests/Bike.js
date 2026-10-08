import { getLang } from '../i18n.js';

// Franzi's bike (with a witch's broom strapped on). You can borrow it for karma; leave it lying around
// for a while and she fetches it back. When Franzi rushes to an emergency she rides it herself.

const RENT = 10;          // karma
const IDLE_BACK = 75;     // seconds lying around before Franzi takes it back

export class FranziBike {
  constructor(game, bike) {
    this.game = game;
    this.bike = bike;
    this.reset();
  }

  get franzi() { return this.game.npcs.get('franzi'); }
  get cost() { return RENT; }

  reset() {
    this.rented = false;
    this.idleT = 0;
    this.rider = null;
    this.parkAtFranzi();
  }

  /** Next to Franzi's current home (her tent once it stands). */
  parkAtFranzi() {
    const f = this.franzi;
    if (!f) return;
    const h = f.home;
    this.bike.place({ x: h.x + 1.6, z: h.z - 1.2 }, 0.6);
    this.bike.speed = 0;
    this.bike.unstick(null, 0.1);
  }

  nearFranzi(dist = 14) {
    const f = this.franzi;
    return !!f && !f.hidden && this.bike.position.distanceTo(f.position) < dist;
  }

  /** Small-talk option at Franzi's. */
  canRent() { return !this.rented && !this.rider && this.nearFranzi(); }

  rent() {
    const g = this.game, de = getLang() === 'de';
    if (g.quests.state.karma < RENT) return false;
    g.quests.state.karma -= RENT;
    this.rented = true;
    this.idleT = 0;
    g.ui.toast(de ? `🚲 Franzis Hexenrad gehört dir (−${RENT} ✺). Steht neben ihr, E zum Aufsteigen. Lässt du es länger liegen, holt sie es sich zurück.` : `🚲 Franzi's witch bike is yours (−${RENT} ✺). It's next to her, E to get on. Leave it lying around too long and she takes it back.`);
    g.refreshHUD();
    return true;
  }

  canRide() { return this.rented && !this.rider; }

  update(dt) {
    const g = this.game;
    const f = this.franzi;
    if (!f) return;
    const driven = g.player.vehicle === this.bike;
    // Franzi rushing to an emergency takes her bike along
    const tk = f.task;
    if (!this.rider && tk && tk.phase === 'go' && (tk.speed || 0) >= 5 && !this.rented && !driven && this.nearFranzi(8)) {
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
    if (driven) { this.idleT = 0; return; }
    // lying around: after a while Franzi fetches it back (when nobody's looking)
    const pp = g.player.position;
    const unseen = this.bike.position.distanceTo(pp) > 25;
    if (this.rented) {
      this.idleT += dt;
      if (this.idleT > IDLE_BACK && unseen && !f.task) {
        this.rented = false;
        this.parkAtFranzi();
        g.ui.toast(getLang() === 'de' ? '🚲 Franzi hat ihr Hexenrad wieder abgeholt.' : '🚲 Franzi fetched her witch bike back.');
      }
    } else if (!this.nearFranzi(12) && unseen && f.position.distanceTo(pp) > 25 && !f.task) {
      this.parkAtFranzi(); // she rode somewhere and came back on foot – the bike follows "later"
    }
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
