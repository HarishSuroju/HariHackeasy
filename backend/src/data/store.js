/**
 * In-memory data store for the hackathon event platform.
 *
 * NOTE: This is intentionally an in-memory store (no external DB) to keep the
 * hackathon build simple. State does not persist across server restarts.
 * Each mutation returns a fresh reference so consumers never mutate shared
 * state directly.
 */

const MAX_ALERTS = 20;

const state = {
  announcement: 'Welcome to NexusHack 2026! Keynote starting in Hall A at 1:00 PM. Lunch served at the Atrium.',
  updatedAt: new Date().toISOString(),
  alerts: [
    {
      id: 1,
      type: 'info',
      title: 'Event is live',
      message: 'Welcome to NexusHack 2026. Check the schedule for upcoming sessions.',
      createdAt: new Date().toISOString(),
    },
  ],
  zones: [
    { id: 1, name: 'Main Stage / Keynote Hall', type: 'Stage', location: 'Building A, Ground Floor', status: 'Normal Traffic', capacity: '65%', icon: 'fa-microphone-lines', lat: 12.9719, lng: 77.5948, accessibleRoute: true, wheelchairAccess: true, elevator: true, quietSpace: false, accessibleRestroom: true },
    { id: 2, name: 'Tech Hall A (Hackathon Arena)', type: 'Workshop', location: 'Building B, 1st Floor', status: 'Busy Zone', capacity: '88%', icon: 'fa-laptop-code', lat: 12.9725, lng: 77.5954, accessibleRoute: false, wheelchairAccess: false, elevator: false, quietSpace: false, accessibleRestroom: false },
    { id: 3, name: 'Central Food Court & Cafe', type: 'Food', location: 'Atrium Central', status: 'Congested', capacity: '94%', icon: 'fa-utensils', lat: 12.9715, lng: 77.5958, accessibleRoute: true, wheelchairAccess: true, elevator: false, quietSpace: false, accessibleRestroom: true },
    { id: 4, name: 'Restrooms & Water Station', type: 'Facility', location: 'East Wing Corridor', status: 'Normal Traffic', capacity: '30%', icon: 'fa-restroom', lat: 12.9722, lng: 77.5961, accessibleRoute: true, wheelchairAccess: true, elevator: false, quietSpace: false, accessibleRestroom: true },
    { id: 5, name: 'Help Desk & Registration', type: 'Support', location: 'Main Entrance Foyer', status: 'Normal Traffic', capacity: '45%', icon: 'fa-circle-question', lat: 12.9712, lng: 77.5945, accessibleRoute: true, wheelchairAccess: true, elevator: false, quietSpace: true, accessibleRestroom: false },
    { id: 6, name: 'Quiet Lounge & Mentor Pods', type: 'Networking', location: 'Building C, 2nd Floor', status: 'Normal Traffic', capacity: '25%', icon: 'fa-couch', lat: 12.9728, lng: 77.5947, accessibleRoute: false, wheelchairAccess: false, elevator: true, quietSpace: true, accessibleRestroom: false },
  ],
  schedule: [
    { id: 1, title: 'Opening Keynote: Future of Smart Events', time: '09:00 AM - 10:00 AM', location: 'Main Stage', category: 'AI', speaker: 'Dr. Elena Vance' },
    { id: 2, title: 'Building Scalable Web Apps under 12 Hours', time: '10:30 AM - 12:00 PM', location: 'Tech Hall A', category: 'Web', speaker: 'Alex Rivera' },
    { id: 3, title: 'AI & Cloud Integration Workshop', time: '01:00 PM - 02:30 PM', location: 'Tech Hall A', category: 'AI', speaker: 'Sarah Chen' },
  ],
};

let nextId = 1000; // Monotonic counter, safer than Date.now() under rapid/concurrent writes.
const generateId = () => nextId++;

function recordAlert(type, title, message) {
  const alert = { id: generateId(), type, title, message, createdAt: new Date().toISOString() };
  state.alerts = [alert, ...state.alerts].slice(0, MAX_ALERTS);
  state.updatedAt = alert.createdAt;
  return alert;
}

function getState() {
  return state;
}

function setAnnouncement(announcement) {
  state.announcement = announcement;
  recordAlert('announcement', 'Live announcement', announcement);
  return state;
}

function addSession(session) {
  const newSession = { id: generateId(), ...session };
  state.schedule.push(newSession);
  recordAlert('schedule', 'New session added', `${newSession.title} is now on the live schedule.`);
  return newSession;
}

function updateSession(id, changes) {
  const session = state.schedule.find(item => item.id === id);
  if (!session) return null;
  Object.assign(session, changes);
  recordAlert('schedule', 'Schedule updated', `${session.title} has been updated.`);
  return session;
}

function removeSession(id) {
  const before = state.schedule.length;
  state.schedule = state.schedule.filter(item => item.id !== id);
  const removed = state.schedule.length !== before;
  if (removed) recordAlert('alert', 'Schedule change', 'A session was removed from the live schedule.');
  return removed;
}

function addZone(zone) {
  const newZone = { id: generateId(), ...zone };
  state.zones.push(newZone);
  recordAlert('venue', 'New venue added', `${newZone.name} is now available on the event map.`);
  return newZone;
}

function updateZone(id, changes) {
  const zone = state.zones.find(item => item.id === id);
  if (!zone) return null;
  Object.assign(zone, changes);
  recordAlert('venue', 'Venue updated', `${zone.name} information was updated.`);
  return zone;
}

function removeZone(id) {
  const before = state.zones.length;
  state.zones = state.zones.filter(item => item.id !== id);
  const removed = state.zones.length !== before;
  if (removed) recordAlert('alert', 'Venue change', 'A venue was removed from the event map.');
  return removed;
}

module.exports = {
  getState,
  setAnnouncement,
  addSession,
  updateSession,
  removeSession,
  addZone,
  updateZone,
  removeZone,
  recordAlert,
};
