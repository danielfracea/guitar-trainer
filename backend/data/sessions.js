// In-memory sessions storage
let sessions = [];
let nextId = 1;

function getSessions() {
  return sessions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getSession(id) {
  return sessions.find(s => s.id === id) || null;
}

function addSession(data) {
  const session = {
    id: nextId++,
    date: data.date || new Date().toISOString(),
    templateId: data.templateId || null,
    templateName: data.templateName || null,
    exercises: data.exercises || [],
    totalDuration: data.totalDuration || 0,
    notes: data.notes || '',
    mood: data.mood || null,
    completed: data.completed !== undefined ? data.completed : true
  };
  sessions.push(session);
  return session;
}

function updateSession(id, data) {
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...data, id };
  return sessions[idx];
}

function deleteSession(id) {
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return false;
  sessions.splice(idx, 1);
  return true;
}

module.exports = { getSessions, getSession, addSession, updateSession, deleteSession };
