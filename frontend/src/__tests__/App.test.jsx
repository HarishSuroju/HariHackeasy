import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';

// Leaflet needs real layout/geometry APIs that jsdom doesn't provide, so the
// map itself is out of scope for these unit tests. We mock it to a no-op and
// focus on the app shell logic (tabs, modals, accessibility affordances).
vi.mock('leaflet', () => {
  const api = {};
  api.map = vi.fn(() => api);
  api.setView = vi.fn(() => api);
  api.remove = vi.fn();
  api.tileLayer = vi.fn(() => ({ addTo: vi.fn(() => api) }));
  api.circleMarker = vi.fn(() => {
    const marker = {};
    marker.addTo = vi.fn(() => marker);
    marker.bindTooltip = vi.fn(() => marker);
    marker.on = vi.fn();
    marker.remove = vi.fn();
    return marker;
  });
  return { default: api };
});

const mockState = {
  announcement: 'Test announcement banner',
  updatedAt: new Date().toISOString(),
  alerts: [{ id: 1, type: 'info', title: 'Event is live', message: 'Hello', createdAt: new Date().toISOString() }],
  zones: [
    { id: 1, name: 'Main Stage', type: 'Stage', location: 'Building A', status: 'Normal Traffic', capacity: '65%', icon: 'fa-microphone-lines', lat: 12.9, lng: 77.5, accessibleRoute: true, wheelchairAccess: true, elevator: true, quietSpace: false, accessibleRestroom: true },
  ],
  schedule: [
    { id: 1, title: 'Opening Keynote', time: '09:00 AM - 10:00 AM', location: 'Main Stage', category: 'AI', speaker: 'Dr. Vance' },
  ],
};

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(mockState) })
  );
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the live announcement banner after loading state', async () => {
    render(<App />);
    expect(await screen.findByText('Test announcement banner')).toBeInTheDocument();
  });

  it('has a skip-to-content link as the first focusable element', () => {
    render(<App />);
    expect(screen.getByText('Skip to main content')).toHaveAttribute('href', '#main-content');
  });

  it('switches to the Discover tab and shows scheduled sessions', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test announcement banner');
    await user.click(screen.getByRole('button', { name: /Discover/i }));
    expect(await screen.findByText('Opening Keynote')).toBeInTheDocument();
  });

  it('opens the SOS modal as an accessible dialog and closes it with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test announcement banner');

    await user.click(screen.getByRole('button', { name: /Open emergency and SOS support/i }));
    const dialog = await screen.findByRole('dialog', { name: /emergency support/i });
    expect(dialog).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /emergency support/i })).not.toBeInTheDocument());
  });

  it('rejects an invalid organizer code', async () => {
    global.fetch = vi.fn((url) => {
      if (String(url).includes('/organizer/login')) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ success: false, message: 'Invalid organizer code' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockState) });
    });

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test announcement banner');

    await user.click(screen.getByRole('button', { name: /Organizer login/i }));
    const dialog = await screen.findByRole('dialog', { name: /organizer login/i });
    await user.type(within(dialog).getByLabelText(/six digit organizer code/i), '000000');
    await user.click(within(dialog).getByRole('button', { name: /unlock organizer mode/i }));

    expect(await within(dialog).findByText(/not valid/i)).toBeInTheDocument();
  });
});
