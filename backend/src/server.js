const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const ORGANIZER_CODE = process.env.ORGANIZER_CODE || '123456';

app.use(cors());
app.use(express.json());

// In-Memory Database for Hackathon Speed
let appState = {
  announcement: "Welcome to NexusHack 2026! Keynote starting in Hall A at 1:00 PM. Lunch served at the Atrium.",
  updatedAt: new Date().toISOString(),
  alerts: [{ id: 1, type: 'info', title: 'Event is live', message: 'Welcome to NexusHack 2026. Check the schedule for upcoming sessions.', createdAt: new Date().toISOString() }],
  zones: [
    { id: 1, name: "Main Stage / Keynote Hall", type: "Stage", location: "Building A, Ground Floor", status: "Normal Traffic", capacity: "65%", icon: "fa-microphone-lines", lat: 12.9719, lng: 77.5948, accessibleRoute: true, wheelchairAccess: true, elevator: true, quietSpace: false, accessibleRestroom: true },
    { id: 2, name: "Tech Hall A (Hackathon Arena)", type: "Workshop", location: "Building B, 1st Floor", status: "Busy Zone", capacity: "88%", icon: "fa-laptop-code", lat: 12.9725, lng: 77.5954, accessibleRoute: false, wheelchairAccess: false, elevator: false, quietSpace: false, accessibleRestroom: false },
    { id: 3, name: "Central Food Court & Cafe", type: "Food", location: "Atrium Central", status: "Congested", capacity: "94%", icon: "fa-utensils", lat: 12.9715, lng: 77.5958, accessibleRoute: true, wheelchairAccess: true, elevator: false, quietSpace: false, accessibleRestroom: true },
    { id: 4, name: "Restrooms & Water Station", type: "Facility", location: "East Wing Corridor", status: "Normal Traffic", capacity: "30%", icon: "fa-restroom", lat: 12.9722, lng: 77.5961, accessibleRoute: true, wheelchairAccess: true, elevator: false, quietSpace: false, accessibleRestroom: true },
    { id: 5, name: "Help Desk & Registration", type: "Support", location: "Main Entrance Foyer", status: "Normal Traffic", capacity: "45%", icon: "fa-circle-question", lat: 12.9712, lng: 77.5945, accessibleRoute: true, wheelchairAccess: true, elevator: false, quietSpace: true, accessibleRestroom: false },
    { id: 6, name: "Quiet Lounge & Mentor Pods", type: "Networking", location: "Building C, 2nd Floor", status: "Normal Traffic", capacity: "25%", icon: "fa-couch", lat: 12.9728, lng: 77.5947, accessibleRoute: false, wheelchairAccess: false, elevator: true, quietSpace: true, accessibleRestroom: false }
  ],
  schedule: [
    { id: 1, title: "Opening Keynote: Future of Smart Events", time: "09:00 AM - 10:00 AM", location: "Main Stage", category: "AI", speaker: "Dr. Elena Vance" },
    { id: 2, title: "Building Scalable Web Apps under 12 Hours", time: "10:30 AM - 12:00 PM", location: "Tech Hall A", category: "Web", speaker: "Alex Rivera" },
    { id: 3, title: "AI & Cloud Integration Workshop", time: "01:00 PM - 02:30 PM", location: "Tech Hall A", category: "AI", speaker: "Sarah Chen" }
  ]
};

const recordAlert = (type, title, message) => {
  const alert = { id: Date.now(), type, title, message, createdAt: new Date().toISOString() };
  appState.alerts = [alert, ...appState.alerts].slice(0, 20);
  appState.updatedAt = alert.createdAt;
  return alert;
};

// GET full state
app.get('/api/state', (req, res) => {
  res.json(appState);
});

app.post('/api/organizer/login', (req, res) => {
  const { code } = req.body;
  if (String(code || '') === ORGANIZER_CODE) return res.json({ success: true });
  res.status(401).json({ success: false, message: 'Invalid organizer code' });
});

// POST update announcement
app.post('/api/announcement', (req, res) => {
  const { announcement } = req.body;
  if (announcement) {
    appState.announcement = announcement;
    recordAlert('announcement', 'Live announcement', announcement);
    return res.json({ success: true, announcement: appState.announcement, alerts: appState.alerts, updatedAt: appState.updatedAt });
  }
  res.status(400).json({ success: false, message: "Announcement text required" });
});

// POST add new schedule session (Organizer Upload)
app.post('/api/schedule', (req, res) => {
  const { title, time, location, category, speaker } = req.body;
  if (!title || !time || !location) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  const newSession = { id: Date.now(), title, time, location, category: category || 'General', speaker: speaker || 'TBA' };
  appState.schedule.push(newSession);
  recordAlert('schedule', 'New session added', `${newSession.title} is now on the live schedule.`);
  res.json({ success: true, schedule: appState.schedule });
});

app.patch('/api/schedule/:id', (req, res) => {
  const session = appState.schedule.find(item => item.id === Number(req.params.id));
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  Object.assign(session, req.body);
  recordAlert('schedule', 'Schedule updated', `${session.title} has been updated.`);
  res.json({ success: true, schedule: appState.schedule });
});

app.delete('/api/schedule/:id', (req, res) => {
  const originalLength = appState.schedule.length;
  appState.schedule = appState.schedule.filter(item => item.id !== Number(req.params.id));
  if (appState.schedule.length === originalLength) return res.status(404).json({ success: false, message: 'Session not found' });
  recordAlert('alert', 'Schedule change', 'A session was removed from the live schedule.');
  res.json({ success: true, schedule: appState.schedule });
});

app.post('/api/zones', (req, res) => {
  const { name, type, location, status, capacity, icon, lat, lng, accessibleRoute, wheelchairAccess, elevator, quietSpace, accessibleRestroom } = req.body;
  if (!name || !location || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, message: 'Name, location, latitude and longitude are required' });
  }
  const zone = {
    id: Date.now(), name, type: type || 'Venue', location,
    status: status || 'Normal Traffic', capacity: capacity || '0%',
    icon: icon || 'fa-location-dot', lat: Number(lat), lng: Number(lng),
    accessibleRoute: Boolean(accessibleRoute), wheelchairAccess: Boolean(wheelchairAccess), elevator: Boolean(elevator), quietSpace: Boolean(quietSpace), accessibleRestroom: Boolean(accessibleRestroom)
  };
  appState.zones.push(zone);
  recordAlert('venue', 'New venue added', `${zone.name} is now available on the event map.`);
  res.json({ success: true, zones: appState.zones });
});

// PATCH update zone crowd status
app.patch('/api/zones/:id', (req, res) => {
  const zoneId = parseInt(req.params.id);
  const { status, capacity } = req.body;
  const zone = appState.zones.find(z => z.id === zoneId);
  if (zone) {
    Object.assign(zone, req.body, {
      lat: req.body.lat === undefined ? zone.lat : Number(req.body.lat),
      lng: req.body.lng === undefined ? zone.lng : Number(req.body.lng)
    });
    recordAlert('venue', 'Venue updated', `${zone.name} information was updated.`);
    return res.json({ success: true, zones: appState.zones });
  }
  res.status(404).json({ success: false, message: "Zone not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

app.delete('/api/zones/:id', (req, res) => {
  const originalLength = appState.zones.length;
  appState.zones = appState.zones.filter(zone => zone.id !== Number(req.params.id));
  if (appState.zones.length === originalLength) return res.status(404).json({ success: false, message: 'Venue not found' });
  recordAlert('alert', 'Venue change', 'A venue was removed from the event map.');
  res.json({ success: true, zones: appState.zones });
});