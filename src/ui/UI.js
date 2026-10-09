import * as THREE from 'three';
import { GROUND_SIZE, PLOTS, SITE_BOUNDS as WORLD_BOUNDS, P } from '../world/layout.js';
import { ITEMS } from '../items/itemData.js';
import { L, t } from '../i18n.js';

const $ = (id) => document.getElementById(id);

// vehicles on the maps
const VEH_ICON = { quad: '🏍️', radlader: '🚜', bike: '🚲', scooter: '🛴' };
const VEH_COL = (v) => (v.id === 'quad' ? (v.broken ? '#ff5a4a' : '#ff9a4a') : v.id === 'bike' ? '#7fd0d0' : v.id === 'scooter' ? '#c0c8d0' : '#f2b319');

export class UI {
  constructor() {
    this.dialogOpen = false;
    this.dialogClosedAt = 0;
    this.bubbleEls = new Map();
    this.minimap = $('minimap').getContext('2d');
    this.pmap = $('pmap').getContext('2d');
    this._dialogKey = null;

    $('modal-close').onclick = () => this.closeModal();
  }

  // ------------------------------------------------------------ screens
  setLoading(p, text) {
    // progress ring around the logo (circumference of r=48 → 301.6)
    if (p != null) $('loading-ring').style.strokeDashoffset = (301.6 * (1 - Math.min(1, Math.max(0, p)))).toFixed(1);
    if (text && $('loading-text').textContent !== text) {
      const el = $('loading-text');
      el.textContent = text;
      el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); // soft fade for every new line
    }
  }
  hideLoading() {
    const el = $('loading');
    el.classList.add('done'); // fades out while the menu logo builds itself up
    setTimeout(() => el.classList.add('hidden'), 650);
  }

  /** The Trikaya wordmark, cut into letters that get "craned in" one by one (cutter lives in index.html). */
  buildBrandLetters() {
    document.querySelectorAll('.brand-word').forEach((w) => window.trikayaWord?.(w));
  }

  showMenu(hasSave) {
    const menu = $('menu');
    clearTimeout(this.menuHideT);
    this.buildBrandLetters();
    const wasHidden = menu.classList.contains('hidden') || menu.classList.contains('unbuild');
    menu.classList.remove('hidden', 'unbuild');
    if (wasHidden) { menu.classList.remove('build'); void menu.offsetWidth; menu.classList.add('build'); }
    $('btn-continue').classList.toggle('hidden', !hasSave);
    $('btn-new').textContent = hasSave ? t('menu.reset') : t('menu.start');
    $('btn-new').classList.toggle('primary', !hasSave);
    $('btn-continue').classList.toggle('primary', hasSave);
    $('hud').classList.add('hidden');
  }
  hideMenu() {
    const menu = $('menu');
    if (menu.classList.contains('hidden')) return;
    // the logo takes itself apart, then the menu goes away
    menu.classList.remove('build');
    menu.classList.add('unbuild');
    clearTimeout(this.menuHideT);
    this.menuHideT = setTimeout(() => { menu.classList.add('hidden'); menu.classList.remove('unbuild'); }, 900);
  }
  showHUD(v = true) { $('hud').classList.toggle('hidden', !v); }

  modal(html) {
    $('modal-body').innerHTML = html;
    $('modal').classList.remove('hidden');
    this.modalOpen = true;
  }
  closeModal() {
    $('modal').classList.add('hidden');
    this.modalOpen = false;
    this.onModalClose?.();
  }

  showPause(v) { $('pause').classList.toggle('hidden', !v); }

  // ------------------------------------------------------------ HUD pieces
  stats(karma, pct, money = 0, tickets = 0) {
    $('karma').textContent = karma;
    const m = $('money');
    m.textContent = `${money < 0 ? '−' : ''}${Math.abs(Math.round(money)).toLocaleString('de-DE')} €`;
    m.classList.toggle('neg', money < 0);
    $('tickets').textContent = tickets.toLocaleString('de-DE');
    $('ready-pct').textContent = `${Math.round(pct * 100)}%`;
    $('ready-fill').style.width = `${pct * 100}%`;
  }

  tracker(qs, playerPos, drama) {
    if (document.body.classList.contains('touch')) { this.trackerCompact(qs, playerPos, drama); return; }
    const el = $('tracker');
    const active = Object.keys(qs.state.active);
    let html = '';
    const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    const timedQid = qs.timer?.qid;
    const dramaCards = [];
    for (const e of drama?.events || []) {
      if (!e.discovered) continue;
      const d = e.pos() ? Math.round(Math.hypot(e.pos().x - playerPos.x, e.pos().z - playerPos.z)) : 0;
      const left = Math.max(0, Math.ceil(e.deadline - e.t));
      const waiting = e.blocked && !drama.tent;
      const timeTxt = e.helping ? L({ de: 'Hilfe ist unterwegs', en: 'help is on the way' }) : waiting ? L({ de: 'wartet auf das Awareness-Zelt', en: 'waiting for the awareness tent' }) : `⏱ ${clock(left)} ${L({ de: 'bis es zu spät ist', en: 'before it\'s too late' })}`;
      dramaCards.push(`<div class="track drama ${!e.helping && !waiting && left < 30 ? 'urgent' : ''}"><div class="tt">⚠️ ${L(e.def.title)}${e.victims[0] ? `: ${drama.victimName(e)}` : ''}</div><div class="ts">${e.helping ? `${e.helping.def.name} ${L({ de: 'ist unterwegs…', en: 'is on the way…' })}` : drama.taskText(e)}</div><div class="td">${d} m · ${timeTxt}</div></div>`);
    }
    // the timed job goes first, then drama, then everything else
    active.sort((a, b) => (b === timedQid) - (a === timedQid));
    if (timedQid && !active.includes(timedQid)) active.unshift(timedQid);
    let dramaDone = false;
    const flushDrama = () => { if (!dramaDone) { html += dramaCards.join(''); dramaDone = true; } };
    if (!timedQid) flushDrama();
    const allAvail = qs.available();
    const avail = allAvail.filter((q) => !q.errand);
    const favs = allAvail.filter((q) => q.errand);
    // how many main jobs are still between you and the evening / bedtime
    const days = qs.game.days;
    if (days) {
      const left = days.jobs(days.day, days.isNight).filter((q) => !qs.isDone(q.id)).length;
    }
    if (favs.length) {
      const fn = [...new Set(favs.map((q) => q.giver))].map((g) => qs.game.npcs.get(g)).filter(Boolean);
      if (fn.length) html += `<div class="track hint dim"><div class="ts"><b style="color:#6fdc6a">!</b> ${L({ de: 'Gefallen (freiwillig) bei', en: 'Favours (optional) from' })}: ${fn.map((n) => n.def.name).join(', ')}</div></div>`;
    }
    if (avail.length) {
      const names = [...new Set(avail.map((q) => q.giver))].map((g) => qs.game.npcs.get(g)).filter(Boolean);
      const list = names.map((n) => `<b>${n.def.name}</b>${avail.some((q) => q.giver === n.def.id && q.timeLimit) ? ' ⏱' : ''}`).join(', ');
      if (!active.length || names.length) {
        html += `<div class="track hint ${active.length ? 'dim' : ''}"><div class="tt">${t('hud.jobAvail')}</div><div class="ts">${names.length === 1 ? t('hud.talkTo', { name: names[0].def.name, role: L(names[0].def.role) }) : `${L({ de: 'Jobs bei', en: 'Jobs from' })}: ${list}`}</div></div>`;
      }
    }
    if (!active.length && !allAvail.length) {
      if (qs.state.completed.length) {
        html += `<div class="track hint"><div class="tt">${t('hud.allDone')}</div><div class="ts">${t('hud.allDoneSub')}</div></div>`;
      }
    }
    for (const qid of active) {
      const q = qs.quests[qid];
      const step = qs.currentStep(qid);
      if (!step) continue;
      const tracked = qs.state.tracked === qid;
      let extra = '';
      if (step.type === 'pickup' && step.items.length > 1) {
        extra = '<ul>' + step.items.map((it) => `<li class="${qs.state.inventory.includes(it.item) ? 'got' : ''}">${L(ITEMS[it.item].name)}${ITEMS[it.item].heavy ? ' 🚜' : ''}</li>`).join('') + '</ul>';
      } else if (step.type === 'work') {
        const a = qs.state.active[qid];
        extra = `<div class="td">${a.done.length}/${step.targets.length}</div>`;
      }
      let dist = '';
      if (tracked) {
        const objs = qs.objectives(qid);
        if (objs.length) {
          const d = Math.min(...objs.map((o) => Math.hypot(o.pos.x - playerPos.x, o.pos.z - playerPos.z)));
          dist = `<div class="td">${Math.round(d)} m${objs[0].radius ? ' · ' + t('hud.searchArea') : ''}</div>`;
        }
      }
      const isTimed = qid === timedQid;
      const tl = isTimed ? Math.ceil(qs.timer.left) : 0;
      const timerRow = isTimed ? `<div class="tbar ${tl < 30 ? 'urgent' : ''}">⏱ ${clock(tl)} <span>${L({ de: 'Zeit-Mission, hat Vorrang!', en: 'timed job, do this first!' })}</span></div>` : '';
      html += `<div class="track ${isTimed ? 'timed' : ''} ${tracked || isTimed ? '' : 'dim'}">${timerRow}<div class="tt">${L(q.title)}</div><div class="ts">${qs.stepText(qid)}${step.type === 'wait' && qs.state.active[qid].waitLeft > 0 ? ` <b>⏳ ${Math.ceil(qs.state.active[qid].waitLeft)} s</b>` : ''}</div>${extra}${dist}</div>`;
      if (isTimed) flushDrama();
    }
    flushDrama();
    if (el._last !== html) { el.innerHTML = html; el._last = html; }
  }

  /**
   * Phones: one slim line per running job and per job/favour waiting to be picked up. Tap the list to
   * unfold it (full text: job title + current step, who to talk to, jobs left today) or fold it back.
   * Colour = kind: job / timed / favour / emergency / new.
   */
  trackerCompact(qs, playerPos, drama) {
    const el = $('tracker');
    if (!el._tap) {
      el._tap = true;
      el.classList.add('compact');
      el.addEventListener('pointerdown', (e) => e.stopPropagation()); // not the joystick / camera
      el.addEventListener('click', (e) => { e.stopPropagation(); el.classList.toggle('open'); el.scrollTop = 0; el._last = null; }); // click: not when scrolling
    }
    const open = el.classList.contains('open');
    const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    const strip = (s) => String(s || '').replace(/<[^>]+>/g, '');
    const dist = (objs) => (objs.length ? `${Math.round(Math.min(...objs.map((o) => Math.hypot(o.pos.x - playerPos.x, o.pos.z - playerPos.z))))} m` : '');
    const row = (kind, icon, text, meta, extra = '') => `<div class="trow k-${kind} ${extra}"><span class="ti">${icon}</span><span class="tx">${text}</span>${meta ? `<span class="tm">${meta}</span>` : ''}</div>`;
    const rows = [];
    const timedQid = qs.timer?.qid;
    // emergencies first
    for (const e of drama?.events || []) {
      if (!e.discovered) continue;
      const left = Math.max(0, Math.ceil(e.deadline - e.t));
      const waiting = e.blocked && !drama.tent;
      const meta = [e.pos() ? `${Math.round(Math.hypot(e.pos().x - playerPos.x, e.pos().z - playerPos.z))} m` : '', e.helping ? '🏃' : waiting ? '⛺' : `⏱ ${clock(left)}`].filter(Boolean).join(' · ');
      const txt = strip(e.helping ? `${L(e.def.title)}: ${e.helping.def.name} ${L({ de: 'kommt', en: 'is coming' })}` : drama.taskText(e));
      rows.push(row('drama', '⚠️', open ? `<b>${L(e.def.title)}</b><br>${txt}` : txt, meta));
    }
    // running jobs
    const active = Object.keys(qs.state.active).sort((a, b) => (b === timedQid) - (a === timedQid));
    for (const qid of active) {
      const q = qs.quests[qid], step = qs.currentStep(qid), a = qs.state.active[qid];
      if (!step) continue;
      const timed = qid === timedQid;
      const meta = [];
      if (timed) meta.push(`⏱ ${clock(Math.ceil(qs.timer.left))}`);
      if (step.type === 'wait' && a.waitLeft > 0) meta.push(`⏳ ${Math.ceil(a.waitLeft)} s`);
      if (step.type === 'work') meta.push(`${a.done.length}/${step.targets.length}`);
      if (step.type === 'pickup' && step.items.length > 1) meta.push(`${step.items.filter((it) => qs.state.inventory.includes(it.item)).length}/${step.items.length}`);
      const tracked = qs.state.tracked === qid;
      const d = dist(qs.objectives(qid));
      if (d && (tracked || timed || open)) meta.push(d);
      const kind = timed ? 'timed' : q.errand ? 'fav' : 'job';
      const txt = strip(qs.stepText(qid));
      rows.push(row(kind, timed ? '⏱' : q.errand ? '💚' : '★', open ? `<b>${L(q.title)}</b><br>${txt}` : txt, meta.join(' · '), tracked || timed ? 'on' : 'dim'));
    }
    // waiting to be picked up: one line each, with who gives it
    for (const q of qs.available()) {
      const n = qs.game.npcs.get(q.giver);
      if (!n) continue;
      const txt = open ? `<b>${L(q.title)}</b><br>${L({ de: `Sprich mit ${n.def.name}`, en: `Talk to ${n.def.name}` })}${q.errand ? L({ de: ' (freiwillig)', en: ' (optional)' }) : ''}` : `${n.def.name}: ${L(q.title)}`;
      rows.push(row(q.errand ? 'fav' : 'new', q.errand ? '💚' : '<b>!</b>', txt, q.timeLimit ? '⏱' : '', 'dim'));
    }
    if (!rows.length && qs.state.completed.length) rows.push(row('hint', '🎉', strip(t('hud.allDone')), ''));
    const html = rows.join('');
    if (el._last !== html) { el.innerHTML = html; el._last = html; }
  }

  effects(list) {
    const el = $('effects');
    const html = list.map((x) => `<span>${x}</span>`).join('');
    if (el._last !== html) { el.innerHTML = html; el._last = html; }
  }

  dayText(txt) {
    const el = $('day-text');
    if (el.textContent !== txt) el.textContent = txt;
  }

  fade(on) { $('fade').classList.toggle('on', on); }

  ticketTick() {
    const el = $('tickets');
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
  }

  /** Floating money change next to the budget. */
  moneyFloat(amount, reason) {
    const d = document.createElement('div');
    d.className = `money-float ${amount < 0 ? 'neg' : 'pos'}`;
    d.textContent = `${amount < 0 ? '−' : '+'}${Math.abs(Math.round(amount)).toLocaleString('de-DE')} € ${reason || ''}`;
    $('money-floats').appendChild(d);
    setTimeout(() => d.remove(), 3600);
  }

  toast(text) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = text;
    const box = $('toasts');
    box.appendChild(d);
    if (document.body.classList.contains('touch')) while (box.children.length > 2) box.firstChild.remove(); // phones: max two at once
    setTimeout(() => d.remove(), 3800);
  }

  prompt(label, disabled) {
    const el = $('prompt');
    if (!label) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.classList.toggle('disabled', !!disabled);
    const html = disabled ? label : `<span class="kbd">E</span>${label}`;
    if (el._last !== html) { el.innerHTML = html; el._last = html; }
  }

  progress(frac, label) {
    const el = $('progress');
    if (frac == null) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    $('progress-fill').style.width = `${frac * 100}%`;
    if (label) $('progress-label').textContent = label;
  }

  inventory(ids) {
    const html = ids.map((id) => `<div class="inv-slot">${ITEMS[id]?.icon || '📦'}<span class="inv-name">${L(ITEMS[id]?.name)}</span></div>`).join('');
    $('inventory').innerHTML = html;
  }

  stamina(v, max = 1) {
    // a banana makes the bar itself longer
    const w = `${Math.round(160 * max)}px`;
    if ($('stamina').style.width !== w) { $('stamina').style.width = w; $('stamina-fill').style.background = max > 1 ? '#f5d142' : ''; }
    $('stamina-fill').style.width = `${(v / max) * 100}%`;
    $('stamina').style.opacity = v / max > 0.98 ? 0 : 1;
  }

  vehicleHud(v) {
    const el = $('vehicle-hud');
    if (!v) { if (!el.classList.contains('hidden')) el.classList.add('hidden'); $('hint').textContent = t('hud.hint'); return; }
    el.classList.remove('hidden');
    $('hint').textContent = t(v.o?.hop ? 'hud.hintRide' : 'hud.hintDrive');
    let html = `<div class="vh-name">${L(v.name)}</div><div class="vh-speed">${Math.round(v.kmh)} <span>${t('hud.speed')}</span></div>`;
    if (v.fuel !== undefined) html += `<div class="vh-fuel"><span>${t('hud.fuel')}</span><div class="bar"><div style="width:${Math.round(v.fuel * 100)}%"></div></div></div>`;
    if (v.broken) html += `<div class="vh-broken">💥 ${t('p.quadBroken')}</div>`;
    if (el._last !== html) { el.innerHTML = html; el._last = html; }
  }

  forceRefresh() {
    $('tracker')._last = null;
    $('prompt')._last = null;
    $('vehicle-hud')._last = null;
    $('hint').textContent = t('hud.hint');
  }

  banner(top, title, sub, ms = 3500) {
    $('banner-top').textContent = top;
    $('banner-title').textContent = title;
    $('banner-sub').textContent = sub || '';
    const b = $('banner');
    b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => b.classList.add('hidden'), ms);
  }

  // ------------------------------------------------------------ dialog
  /**
   * Show dialog lines one after another. `speakers` resolves who -> {name, role, portrait}.
   * If `choices` given, they are shown on the last line; resolves with the chosen index.
   */
  dialog(lines, speakers, choices) {
    return new Promise((resolve) => {
      this.dialogOpen = true;
      const box = $('dialog');
      box.classList.remove('hidden');
      let i = 0, typing = null, full = '';
      const textEl = $('dialog-text');
      const choiceEl = $('dialog-choices');

      const finishTyping = () => { clearInterval(typing); typing = null; textEl.textContent = full; };
      const show = () => {
        const l = lines[i];
        const s = speakers(l.who);
        $('dialog-name').textContent = s.name;
        $('dialog-role').textContent = s.role || '';
        $('dialog-portrait').textContent = s.portrait || '🙂';
        full = l.text;
        textEl.textContent = '';
        let k = 0;
        clearInterval(typing);
        typing = setInterval(() => {
          k += 2;
          textEl.textContent = full.slice(0, k);
          if (k >= full.length) finishTyping();
        }, 16);
        this.onDialogBlip?.();
        const last = i === lines.length - 1;
        choiceEl.innerHTML = '';
        if (last && choices) {
          choices.forEach((c, ci) => {
            const b = document.createElement('button');
            b.className = 'btn' + (ci === 0 ? ' primary' : '');
            b.innerHTML = `<span class="kbd">${ci + 1}</span> ${c}`;
            b.onclick = (e) => { e.stopPropagation(); close(ci); };
            choiceEl.appendChild(b);
          });
          $('dialog-hint').textContent = t(matchMedia('(pointer: coarse)').matches ? 'd.chooseTouch' : 'd.choose');
        } else {
          $('dialog-hint').textContent = t(matchMedia('(pointer: coarse)').matches ? 'd.continueTouch' : 'd.continue');
        }
      };
      const next = () => {
        if (typing) { finishTyping(); return; }
        if (i === lines.length - 1 && choices) return;
        i++;
        if (i >= lines.length) close(0);
        else show();
      };
      const close = (result) => {
        finishTyping();
        box.classList.add('hidden');
        window.removeEventListener('keydown', onKey, true);
        box.onclick = null;
        document.removeEventListener('pointerdown', onClickAnywhere, true);
        this.dialogOpen = false;
        this.dialogClosedAt = performance.now();
        resolve(result);
      };
      const onKey = (e) => {
        if (['KeyE', 'Space', 'Enter'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); next(); }
        if (choices && i === lines.length - 1 && !typing) {
          const k = /^Digit([1-9])$/.exec(e.code);
          if (k && +k[1] <= choices.length) close(+k[1] - 1);
        }
      };
      // pointer-locked clicks don't hit the box, so listen globally
      const onClickAnywhere = (e) => {
        if (e.target.closest?.('.dialog-choices')) return;
        if (e.button === 0 || e.pointerType === 'touch') next();
      };
      window.addEventListener('keydown', onKey, true);
      setTimeout(() => document.addEventListener('pointerdown', onClickAnywhere, true), 50);
      show();
    });
  }

  // ------------------------------------------------------------ world-space overlays
  overlays(npcs, camera, playerPos) {
    const w = window.innerWidth, h = window.innerHeight;
    const v = new THREE.Vector3();
    const seen = new Set();
    // at most 4 speech bubbles (the nearest) – crowds would otherwise flood the screen
    const talking = new Set(npcs.filter((n) => n.bubble && n.position.distanceTo(playerPos) < 32)
      .sort((a, b) => a.position.distanceTo(playerPos) - b.position.distanceTo(playerPos)).slice(0, 4).map((n) => n.def.id));
    for (const n of npcs) {
      const d = n.position.distanceTo(playerPos);
      const bub = n.bubble && talking.has(n.def.id) ? n.bubble : null;
      const show = bub || d < 11;
      if (!show) continue;
      v.set(n.position.x, n.position.y + (bub ? 2.35 : 2.15) + (n.marker.visible ? 0.55 : 0), n.position.z).project(camera);
      if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) continue;
      seen.add(n.def.id);
      let el = this.bubbleEls.get(n.def.id);
      if (!el) { el = document.createElement('div'); $('bubbles').appendChild(el); this.bubbleEls.set(n.def.id, el); }
      const html = bub
        ? `<span class="bn">${n.def.name}</span>${bub.text}`
        : `${n.def.name}`;
      const cls = bub ? 'bubble' : 'nametag';
      if (el._html !== html) { el.innerHTML = html; el._html = html; }
      if (el.className !== cls) el.className = cls;
      el.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
      el.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
      el.style.opacity = bub ? Math.min(1, bub.t * 2) : Math.max(0, 1 - (d - 7) / 4);
    }
    for (const [id, el] of this.bubbleEls) if (!seen.has(id)) { el.remove(); this.bubbleEls.delete(id); }
  }

  // ------------------------------------------------------------ maps
  setMapSource(groundCanvas) {
    // downscaled map + labels for the minimap / big map
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const ctx = c.getContext('2d');
    ctx.drawImage(groundCanvas, 0, 0, 1024, 1024);
    this.mapCanvas = c;
  }

  /** opts: ctx (other canvas), range (metres to the edge), mark (extra white dot, e.g. the player while flying) */
  drawMinimap(player, heading, camYaw, objectives, npcs, qs, vehicles, opts = {}) {
    const ctx = opts.ctx || this.minimap;
    const S = 220, R = S / 2;
    const range = opts.range || 75; // metres from centre to edge
    const k = R / range;
    const mapPx = 1024 / GROUND_SIZE;
    ctx.save();
    ctx.clearRect(0, 0, S, S);
    ctx.beginPath(); ctx.arc(R, R, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#3b5a2a'; ctx.fillRect(0, 0, S, S);
    ctx.translate(R, R);
    ctx.rotate(camYaw);
    // map image: world (x,z) -> map px ((x/GS+0.5)*1024)
    const scale = k / mapPx;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.drawImage(this.mapCanvas, -(player.x / GROUND_SIZE + 0.5) * 1024, -(player.z / GROUND_SIZE + 0.5) * 1024);
    ctx.restore();
    const toM = (p) => [(p.x - player.x) * k, (p.z - player.z) * k];
    // NPCs
    for (const n of npcs) {
      const [x, y] = toM(n.position);
      if (Math.hypot(x, y) > R) continue;
      const mk = qs.npcMarker(n.def.id);
      ctx.fillStyle = mk === '!' ? '#ffd21f' : mk === '?' ? '#7fe0ff' : mk === 'fav' ? '#6fdc6a' : '#f4ecd8';
      ctx.beginPath(); ctx.arc(x, y, mk ? 5 : 3, 0, 7); ctx.fill();
      if (mk) { ctx.save(); ctx.rotate(-camYaw); ctx.fillStyle = '#1b1206'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const rx = x * Math.cos(camYaw) - y * Math.sin(camYaw); const ry = x * Math.sin(camYaw) + y * Math.cos(camYaw); ctx.fillText(mk === 'fav' ? '!' : mk, rx, ry + 0.5); ctx.restore(); }
    }
    // vehicles
    for (const v of Object.values(vehicles || {})) {
      const [x, y] = toM(v.position);
      if (Math.hypot(x, y) > R || v.driver) continue;
      ctx.fillStyle = VEH_COL(v);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate(-camYaw); ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const rx = x * Math.cos(camYaw) - y * Math.sin(camYaw), ry = x * Math.sin(camYaw) + y * Math.cos(camYaw);
      ctx.fillText(VEH_ICON[v.id] || '🚗', rx, ry + 0.5); ctx.restore();
    }
    // objectives
    for (const o of objectives) {
      if (!o.pos) continue;
      let [x, y] = toM(o.pos);
      const d = Math.hypot(x, y);
      if (o.radius && d < R + o.radius * k) {
        ctx.strokeStyle = '#5ad1ff'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.fillStyle = 'rgba(90,209,255,0.18)';
        ctx.beginPath(); ctx.arc(x, y, o.radius * k, 0, 7); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      }
      if (d > R - 10) { x = (x / d) * (R - 10); y = (y / d) * (R - 10); }
      ctx.fillStyle = o.drama ? '#ff4a3a' : o.radius ? '#5ad1ff' : '#ffb020';
      ctx.strokeStyle = '#1b1206'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, o.hint ? 4 + Math.sin(performance.now() / 200) : o.drama ? 7 : 6, 0, 7); ctx.fill(); ctx.stroke();
    }
    if (opts.mark) { // where you actually stand
      const [x, y] = toM(opts.mark);
      if (Math.hypot(x, y) < R) { ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); ctx.stroke(); }
    }
    // player arrow (or the drone camera)
    ctx.save();
    ctx.rotate(-heading);
    ctx.fillStyle = opts.arrow || '#ffffff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(6, -6); ctx.lineTo(0, -3); ctx.lineTo(-6, -6); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
    // north indicator
    ctx.save();
    ctx.translate(R, R);
    const nx = Math.sin(-camYaw) * (R - 12), ny = -Math.cos(-camYaw) * (R - 12);
    ctx.fillStyle = '#e8a33a'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny);
    ctx.restore();
  }

  showBigMap(v) {
    $('bigmap').classList.toggle('hidden', !v);
    this.bigMapOpen = v;
  }

  drawBigMap(player, heading, objectives, npcs, qs, built, vehicles) {
    const cv = $('bigmap-canvas');
    const ctx = cv.getContext('2d');
    const S = cv.width;
    // crop to world bounds (square)
    const cx = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2, cz = (WORLD_BOUNDS.minZ + WORLD_BOUNDS.maxZ) / 2;
    const span = Math.max(WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX, WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ) + 10;
    const k = S / span;
    const toC = (p) => [(p.x - cx) * k + S / 2, (p.z - cz) * k + S / 2];
    const mapPx = 1024 / GROUND_SIZE;
    ctx.clearRect(0, 0, S, S);
    const sx = ((cx - span / 2) / GROUND_SIZE + 0.5) * 1024, sy = ((cz - span / 2) / GROUND_SIZE + 0.5) * 1024;
    ctx.drawImage(this.mapCanvas, sx, sy, span * mapPx, span * mapPx, 0, 0, S, S);
    // plots
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [id, pl] of Object.entries(PLOTS)) {
      if (pl.prebuilt) continue;
      const [x, y] = toC(pl.pos);
      const isBuilt = built.some((b) => b.plot === id);
      ctx.fillStyle = isBuilt ? 'rgba(120,220,120,0.85)' : 'rgba(255,224,102,0.35)';
      ctx.strokeStyle = isBuilt ? '#2c6b2c' : '#8a6b10';
      ctx.lineWidth = 2;
      const s = pl.size * k * 0.8;
      ctx.fillRect(x - s / 2, y - s / 2, s, s); ctx.strokeRect(x - s / 2, y - s / 2, s, s);
      ctx.font = 'bold 13px "Baloo 2", sans-serif';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText(pl.label, x, y + s / 2 + 10); ctx.fillText(pl.label, x, y + s / 2 + 10);
    }
    // area labels
    const labels = [['CREW BASE', P(1019, 391)], ['Crew & Artist Camp', P(700, 320)], ['Parkplatz', P(1030, 250)], ['Küche', P(445, 530)], ['Mainstage', P(370, 520)], ['TSV Allach', P(725, 710)], ['Hängemattenwald', P(215, 705)], ['FESTIVAL', P(420, 700)], ['Enterstraße', P(900, 480)], ['Gündinger Weg', P(1195, 150)]];
    ctx.font = 'bold 16px "Baloo 2", sans-serif';
    for (const [t, p] of labels) {
      const [x, y] = toC(p);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 4;
      ctx.strokeText(t, x, y); ctx.fillText(t, x, y);
    }
    // npcs with markers
    for (const n of npcs) {
      const mk = qs.npcMarker(n.def.id);
      const [x, y] = toC(n.position);
      ctx.fillStyle = mk === '!' ? '#ffd21f' : mk === '?' ? '#7fe0ff' : mk === 'fav' ? '#6fdc6a' : 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(x, y, mk ? 8 : 4, 0, 7); ctx.fill();
      if (mk) { ctx.fillStyle = '#1b1206'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(mk === 'fav' ? '!' : mk, x, y + 1); }
    }
    for (const v of Object.values(vehicles || {})) {
      if (v.driver) continue;
      const [x, y] = toC(v.position);
      ctx.fillStyle = VEH_COL(v);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); ctx.stroke();
      ctx.font = '12px sans-serif'; ctx.fillText(VEH_ICON[v.id] || '🚗', x, y + 1);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px "Baloo 2", sans-serif';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText(L(v.name), x, y - 14); ctx.fillText(L(v.name), x, y - 14);
    }
    for (const o of objectives) {
      if (!o.pos) continue;
      const [x, y] = toC(o.pos);
      if (o.radius) {
        ctx.fillStyle = 'rgba(90,209,255,0.25)'; ctx.strokeStyle = '#5ad1ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, o.radius * k, 0, 7); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = o.drama ? '#ff4a3a' : o.radius ? '#5ad1ff' : '#ffb020'; ctx.strokeStyle = '#000';
      ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.stroke();
    }
    const [px, py] = toC(player);
    ctx.save(); ctx.translate(px, py); ctx.rotate(-heading);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(8, -8); ctx.lineTo(0, -4); ctx.lineTo(-8, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
