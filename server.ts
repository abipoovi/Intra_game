import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import {
  DEFAULT_ANSWER_KEY,
  DEFAULT_CLUE_WEIGHTS,
  DEFAULT_SCORING_RUBRIC,
  EvaluationCenterState,
  evaluateAllPlayers,
  evaluateSinglePlayer,
  generateLeaderboard,
  exportLeaderboardCSV,
  PlayerEvaluationReport,
  AnswerKeyConfig,
  ClueConfig,
  ScoringRubricConfig,
} from './server/evaluation';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export type AccountStatus = 'Active' | 'Disabled' | 'Removed';

// Database Types
interface DbUser {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: 'PLAYER' | 'ADMIN';
  loginStatus: 'Online' | 'Offline';
  accountStatus: AccountStatus;
  createdAt: string;
  lastActive: string;
}

interface DbEvent {
  eventId: string;
  eventName: string;
  caseTitle: string;
  status: 'NOT_STARTED' | 'LIVE' | 'PAUSED' | 'ENDED';
  startTime: number | null;
  endTime: number | null;
  duration: number; // in minutes
  timeRemaining: number; // in seconds
  createdAt: string;
  settings: {
    accusationEnabled: boolean;
    notesEnabled: boolean;
    cluesVisible: boolean;
    duration: number;
  };
}

interface DbPlayerProgress {
  playerId: string;
  playerName: string;
  username: string;
  loginStatus: 'Online' | 'Offline';
  accountStatus: AccountStatus;
  investigationStatus: 'Not Started' | 'Investigating' | 'Completed';
  suspectsInvestigated: string[];
  questionsAsked: number;
  cluesFound: string[];
  progressPercentage: number;
  notes: string;
  accusation: {
    suspect: string;
    motive: string;
    evidence: string[];
    submittedAt: string;
  } | null;
  completed: boolean;
  lastActivity: string;
  loginTime: string;
  suspectStages?: Record<string, number>;
  score?: number;
  accuracyPercentage?: number;
  scoreBreakdown?: any;
}

interface DbChatMessage {
  id: string;
  suspectId: 'vicky' | 'perumal' | 'meena' | 'rangan' | string;
  sender: 'player' | 'suspect';
  text: string;
  timestamp: string;
  discoveredClueId?: string;
  conversationStage?: number;
}

interface MysteryDatabase {
  users: Record<string, DbUser>;
  event: DbEvent;
  playerProgress: Record<string, DbPlayerProgress>;
  chatLogs: Record<string, Record<string, DbChatMessage[]>>; // playerId -> suspectId -> messages
  evaluationState: EvaluationCenterState;
  caseConfig: {
    answerKey: AnswerKeyConfig;
    clueWeights: Record<string, ClueConfig>;
    rubric: ScoringRubricConfig;
    scoringLocked: boolean;
  };
  sessions: Record<string, { userId: string; role: 'PLAYER' | 'ADMIN'; expiresAt: number }>;
}

// Persistent Storage File
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'mystery_db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_salt_mystery_2026').digest('hex');
}

function getDefaultDatabase(): MysteryDatabase {
  const adminId = 'admin_001';
  const defaultAdmin: DbUser = {
    id: adminId,
    name: 'Chief Administrator',
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    role: 'ADMIN',
    loginStatus: 'Offline',
    accountStatus: 'Active',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  const defaultPlayers: DbUser[] = [
    {
      id: 'p001',
      name: 'Karthik',
      username: 'player001',
      passwordHash: hashPassword('player123'),
      role: 'PLAYER',
      loginStatus: 'Online',
      accountStatus: 'Active',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    },
    {
      id: 'p002',
      name: 'Priya',
      username: 'player002',
      passwordHash: hashPassword('player123'),
      role: 'PLAYER',
      loginStatus: 'Offline',
      accountStatus: 'Active',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    },
    {
      id: 'p003',
      name: 'Arun',
      username: 'player003',
      passwordHash: hashPassword('player123'),
      role: 'PLAYER',
      loginStatus: 'Offline',
      accountStatus: 'Active',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    },
  ];

  const users: Record<string, DbUser> = {
    [adminId]: defaultAdmin,
  };
  defaultPlayers.forEach(p => {
    users[p.id] = p;
  });

  const playerProgress: Record<string, DbPlayerProgress> = {
    p001: {
      playerId: 'p001',
      playerName: 'Karthik',
      username: 'player001',
      loginStatus: 'Online',
      accountStatus: 'Active',
      investigationStatus: 'Not Started',
      suspectsInvestigated: [],
      questionsAsked: 0,
      cluesFound: [],
      progressPercentage: 0,
      notes: 'Initial hypothesis: Check study safe and vehicle shed logs.',
      accusation: null,
      completed: false,
      lastActivity: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    p002: {
      playerId: 'p002',
      playerName: 'Priya',
      username: 'player002',
      loginStatus: 'Offline',
      accountStatus: 'Active',
      investigationStatus: 'Not Started',
      suspectsInvestigated: [],
      questionsAsked: 0,
      cluesFound: [],
      progressPercentage: 0,
      notes: '',
      accusation: null,
      completed: false,
      lastActivity: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    p003: {
      playerId: 'p003',
      playerName: 'Arun',
      username: 'player003',
      loginStatus: 'Offline',
      accountStatus: 'Active',
      investigationStatus: 'Not Started',
      suspectsInvestigated: [],
      questionsAsked: 0,
      cluesFound: [],
      progressPercentage: 0,
      notes: '',
      accusation: null,
      completed: false,
      lastActivity: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  };

  const event: DbEvent = {
    eventId: 'ev-hidden-mystery-01',
    eventName: 'The Hidden Mystery — Campus Investigation Challenge',
    caseTitle: 'The Hidden Mystery',
    status: 'NOT_STARTED',
    startTime: null,
    endTime: null,
    duration: 60,
    timeRemaining: 3600,
    createdAt: new Date().toISOString(),
    settings: {
      accusationEnabled: true,
      notesEnabled: true,
      cluesVisible: true,
      duration: 60,
    },
  };

  const evaluationState: EvaluationCenterState = {
    status: 'PENDING',
    isLeaderboardPublished: false,
    publishedAt: null,
    completedAt: null,
    totalPlayers: Object.keys(playerProgress).length,
    playersEvaluated: 0,
    playersPending: Object.keys(playerProgress).length,
    averageScore: 0,
    averageAccuracy: 0,
    fastestSolver: null,
    highestAccuracy: null,
    mostCluesDiscovered: null,
    mostCompleteInvestigation: null,
    reports: {},
    leaderboard: [],
    auditLogs: [],
  };

  const caseConfig = {
    answerKey: DEFAULT_ANSWER_KEY,
    clueWeights: DEFAULT_CLUE_WEIGHTS,
    rubric: DEFAULT_SCORING_RUBRIC,
    scoringLocked: false,
  };

  return {
    users,
    event,
    playerProgress,
    chatLogs: {},
    evaluationState,
    caseConfig,
    sessions: {},
  };
}

let db: MysteryDatabase;

function loadDatabase(): MysteryDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Ensure required structure
      if (parsed.users && parsed.event && parsed.playerProgress) {
        // Automatic migration for accountStatus
        Object.values(parsed.users).forEach((u: any) => {
          if (!u.accountStatus) u.accountStatus = 'Active';
        });
        Object.values(parsed.playerProgress).forEach((p: any) => {
          if (!p.accountStatus) p.accountStatus = 'Active';
        });

        if (!parsed.sessions) {
          parsed.sessions = {};
        }

        // Ensure evaluationState & caseConfig exist
        if (!parsed.evaluationState) {
          parsed.evaluationState = {
            status: 'PENDING',
            isLeaderboardPublished: false,
            publishedAt: null,
            completedAt: null,
            totalPlayers: Object.keys(parsed.playerProgress).length,
            playersEvaluated: 0,
            playersPending: Object.keys(parsed.playerProgress).length,
            averageScore: 0,
            averageAccuracy: 0,
            fastestSolver: null,
            highestAccuracy: null,
            mostCluesDiscovered: null,
            mostCompleteInvestigation: null,
            reports: {},
            leaderboard: [],
            auditLogs: [],
          };
        }
        if (!parsed.caseConfig) {
          parsed.caseConfig = {
            answerKey: DEFAULT_ANSWER_KEY,
            clueWeights: DEFAULT_CLUE_WEIGHTS,
            rubric: DEFAULT_SCORING_RUBRIC,
            scoringLocked: parsed.event.status === 'LIVE' || parsed.event.status === 'ENDED',
          };
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load DB file, using default:', err);
  }
  const defaultDb = getDefaultDatabase();
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(dataToSave: MysteryDatabase = db) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to DB file:', err);
  }
}

db = loadDatabase();

// Persistent active sessions: token -> userId (persisted in db.sessions)
function createSession(userId: string, role: 'PLAYER' | 'ADMIN'): string {
  const token = 'thm_' + crypto.randomBytes(24).toString('hex');
  if (!db.sessions) db.sessions = {};
  db.sessions[token] = {
    userId,
    role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days persistent session
  };
  saveDatabase();
  return token;
}

function getSessionUser(req: Request): DbUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!db.sessions) db.sessions = {};
  const session = db.sessions[token];
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  const user = db.users[session.userId];
  if (!user || user.accountStatus === 'Disabled' || user.accountStatus === 'Removed') {
    delete db.sessions[token];
    saveDatabase();
    return null;
  }
  return user;
}

// Real-Time Server-Sent Events (SSE) subscribers
const sseClients = new Set<Response>();

function broadcast(eventPayload: { type: string; data: unknown }) {
  const message = `event: message\ndata: ${JSON.stringify(eventPayload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Server-authoritative timer heartbeat loop
setInterval(() => {
  if (db.event.status === 'LIVE') {
    if (db.event.timeRemaining > 0) {
      db.event.timeRemaining -= 1;
      // Periodically flush timer to SSE subscribers every 5 seconds
      if (db.event.timeRemaining % 5 === 0) {
        broadcast({ type: 'event_timer_tick', data: { timeRemaining: db.event.timeRemaining } });
      }
    } else {
      // Time Expired -> Lock event
      db.event.status = 'ENDED';
      db.event.endTime = Date.now();
      saveDatabase();
      broadcast({ type: 'event_updated', data: db.event });
    }
  }
}, 1000);

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Player / Admin Login
app.post('/api/auth/login', (req, res) => {
  const { username, registerNumber, password, role, playerName } = req.body;

  // PLAYER LOGIN: Password removed, uses Name & Register Number only
  if (role === 'PLAYER') {
    const rawRegNo = String(registerNumber || username || '').trim();
    const rawName = String(playerName || req.body.name || rawRegNo).trim();

    if (!rawRegNo) {
      return res.status(400).json({ error: 'Register Number is required' });
    }
    if (!rawName) {
      return res.status(400).json({ error: 'Student / Player Name is required' });
    }

    const cleanRegNo = rawRegNo.toLowerCase();

    // Find existing player by register number / student ID
    let user = Object.values(db.users).find(
      u => u.username.toLowerCase() === cleanRegNo && u.role === 'PLAYER'
    );

    if (user) {
      if (user.accountStatus === 'Disabled') {
        return res.status(403).json({
          error: '🔒 ACCOUNT DISABLED: Your account has been temporarily disabled by the event administrator.',
          accountStatus: 'Disabled',
        });
      }
      if (user.accountStatus === 'Removed') {
        return res.status(403).json({
          error: 'This account has been removed from the event by the administrator.',
          accountStatus: 'Removed',
        });
      }
      // Update name if changed
      if (rawName && user.name !== rawName) {
        user.name = rawName;
        if (db.playerProgress[user.id]) {
          db.playerProgress[user.id].playerName = rawName;
        }
      }
    } else {
      // Auto-register student instantly without password
      const newId = 'p_' + Date.now();
      user = {
        id: newId,
        name: rawName,
        username: rawRegNo,
        passwordHash: '',
        role: 'PLAYER',
        loginStatus: 'Online',
        accountStatus: 'Active',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      db.users[newId] = user;

      // Create player progress record
      db.playerProgress[newId] = {
        playerId: newId,
        playerName: user.name,
        username: user.username,
        loginStatus: 'Online',
        accountStatus: 'Active',
        investigationStatus: 'Not Started',
        suspectsInvestigated: [],
        questionsAsked: 0,
        cluesFound: [],
        progressPercentage: 0,
        notes: '',
        accusation: null,
        completed: false,
        lastActivity: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    user.loginStatus = 'Online';
    user.lastActive = new Date().toISOString();

    if (db.playerProgress[user.id]) {
      db.playerProgress[user.id].loginStatus = 'Online';
      db.playerProgress[user.id].lastActivity = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    saveDatabase();
    const token = createSession(user.id, user.role);

    broadcast({
      type: 'players_updated',
      data: Object.values(db.playerProgress),
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        loginStatus: user.loginStatus,
        accountStatus: user.accountStatus,
      },
      event: db.event,
      progress: db.playerProgress[user.id],
    });
  }

  // ADMIN LOGIN: Requires password
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const pwdHash = hashPassword(String(password).trim());

  let user = Object.values(db.users).find(
    u => u.username.toLowerCase() === cleanUsername && u.role === 'ADMIN'
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (user.accountStatus === 'Disabled') {
    return res.status(403).json({
      error: '🔒 ACCOUNT DISABLED: Your account has been temporarily disabled by the event administrator.',
      accountStatus: 'Disabled',
    });
  }
  if (user.accountStatus === 'Removed') {
    return res.status(403).json({
      error: 'This account has been removed from the event by the administrator.',
      accountStatus: 'Removed',
    });
  }

  if (user.passwordHash !== pwdHash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update user online status
  user.loginStatus = 'Online';
  user.lastActive = new Date().toISOString();

  if (user.role === 'PLAYER' && db.playerProgress[user.id]) {
    db.playerProgress[user.id].loginStatus = 'Online';
    db.playerProgress[user.id].lastActivity = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  saveDatabase();

  const token = createSession(user.id, user.role);

  // Notify real-time listeners of player status
  broadcast({
    type: 'players_updated',
    data: Object.values(db.playerProgress),
  });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      loginStatus: user.loginStatus,
      accountStatus: user.accountStatus,
    },
    event: db.event,
    progress: user.role === 'PLAYER' ? db.playerProgress[user.id] : null,
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const user = getSessionUser(req);
  if (user) {
    user.loginStatus = 'Offline';
    user.lastActive = new Date().toISOString();
    if (user.role === 'PLAYER' && db.playerProgress[user.id]) {
      db.playerProgress[user.id].loginStatus = 'Offline';
    }
    saveDatabase();
    broadcast({
      type: 'players_updated',
      data: Object.values(db.playerProgress),
    });
  }
  return res.json({ success: true });
});

// Get Current User Profile & Sync State
app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      loginStatus: user.loginStatus,
      accountStatus: user.accountStatus,
    },
    event: db.event,
    progress: user.role === 'PLAYER' ? db.playerProgress[user.id] : null,
  });
});

// ==========================================
// REAL-TIME SERVER-SENT EVENTS (SSE)
// ==========================================

app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial snapshot immediately
  const initialPayload = {
    type: 'init',
    data: {
      event: db.event,
      players: Object.values(db.playerProgress),
      evaluationState: db.evaluationState,
    },
  };
  res.write(`event: message\ndata: ${JSON.stringify(initialPayload)}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// REST Fallback for Event Status
app.get('/api/event/status', (req, res) => {
  return res.json({ event: db.event });
});

// ==========================================
// ADMIN EVENT CONTROL ROUTES
// ==========================================

function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

// ==========================================
// AUTOMATED FINAL EVALUATION ENGINE (Prompts 21-47)
// ==========================================

async function runAutomatedEvaluation() {
  db.evaluationState.status = 'EVALUATING';
  broadcast({ type: 'evaluation_status', data: { status: 'EVALUATING' } });

  const rawPlayers = Object.values(db.playerProgress)
    .filter(p => (p.accountStatus || 'Active') !== 'Removed')
    .map(p => {
      const playerChats = db.chatLogs[p.playerId] || {};
      const questionsList: string[] = [];
      Object.values(playerChats).forEach(msgs => {
        msgs.forEach(m => {
          if (m.sender === 'player') questionsList.push(m.text);
        });
      });
      return {
        playerId: p.playerId,
        playerName: p.playerName,
        username: p.username || p.playerId,
        loginTime: p.loginTime,
        investigationStatus: p.investigationStatus,
        suspectsInvestigated: p.suspectsInvestigated || [],
        questionsAsked: p.questionsAsked || questionsList.length,
        cluesFound: p.cluesFound || [],
        notes: p.notes || '',
        accusation: p.accusation,
        completed: p.completed,
        lastActivity: p.lastActivity,
        questionsList,
      };
    });

  const evalResult = await evaluateAllPlayers(
    rawPlayers,
    db.event.startTime,
    db.event.endTime,
    db.event.duration,
    db.caseConfig.answerKey,
    db.caseConfig.clueWeights,
    db.caseConfig.rubric,
    ai || undefined
  );

  db.evaluationState.status = 'COMPLETED';
  db.evaluationState.completedAt = new Date().toISOString();
  db.evaluationState.reports = evalResult.reports;
  db.evaluationState.leaderboard = evalResult.leaderboard;
  Object.assign(db.evaluationState, evalResult.summary);

  saveDatabase();

  broadcast({
    type: 'evaluation_completed',
    data: db.evaluationState,
  });
}

// Start / Restart Event
app.post('/api/admin/event/start', requireAdmin, (req, res) => {
  const previousStatus = db.event.status;
  db.event.status = 'LIVE';
  if (!db.event.startTime || previousStatus === 'ENDED' || db.event.timeRemaining <= 0) {
    db.event.startTime = Date.now();
    db.event.timeRemaining = (db.event.duration || 60) * 60;
    db.event.endTime = null;
  }
  // Fairness rule (Prompt 46): Lock scoring system once event starts
  db.caseConfig.scoringLocked = true;
  db.evaluationState.status = 'PENDING';
  db.evaluationState.isLeaderboardPublished = false;

  saveDatabase();
  broadcast({ type: 'event_updated', data: db.event });
  broadcast({ type: 'event_timer_tick', data: { timeRemaining: db.event.timeRemaining } });
  broadcast({ type: 'evaluation_status', data: { status: 'PENDING' } });
  return res.json({ success: true, event: db.event });
});

// Pause Event
app.post('/api/admin/event/pause', requireAdmin, (req, res) => {
  db.event.status = 'PAUSED';
  saveDatabase();
  broadcast({ type: 'event_updated', data: db.event });
  return res.json({ success: true, event: db.event });
});

// Resume Event
app.post('/api/admin/event/resume', requireAdmin, (req, res) => {
  db.event.status = 'LIVE';
  saveDatabase();
  broadcast({ type: 'event_updated', data: db.event });
  return res.json({ success: true, event: db.event });
});

// End Event (Instant response, sets timeRemaining to 0, triggers evaluation in background)
app.post('/api/admin/event/end', requireAdmin, (req, res) => {
  try {
    db.event.status = 'ENDED';
    db.event.endTime = Date.now();
    db.event.timeRemaining = 0;
    saveDatabase();

    broadcast({ type: 'event_updated', data: db.event });
    broadcast({ type: 'event_timer_tick', data: { timeRemaining: 0 } });

    // Run automated evaluation asynchronously so the admin call never hangs or blocks UI
    runAutomatedEvaluation().catch((evalErr) => {
      console.error('[Automated Evaluation Caught Error]', evalErr);
      db.evaluationState.status = 'COMPLETED';
      db.evaluationState.completedAt = new Date().toISOString();
      saveDatabase();
      broadcast({ type: 'evaluation_completed', data: db.evaluationState });
    });

    return res.json({ success: true, event: db.event, evaluationState: db.evaluationState });
  } catch (err) {
    console.error('[End Event Handler Error]', err);
    db.event.status = 'ENDED';
    db.event.timeRemaining = 0;
    saveDatabase();
    return res.json({ success: true, event: db.event, evaluationState: db.evaluationState });
  }
});

// Reset Event
app.post('/api/admin/event/reset', requireAdmin, (req, res) => {
  db.event.status = 'NOT_STARTED';
  db.event.startTime = null;
  db.event.endTime = null;
  db.event.timeRemaining = (db.event.duration || 60) * 60;

  // Reset player progresses
  Object.keys(db.playerProgress).forEach(playerId => {
    const p = db.playerProgress[playerId];
    p.investigationStatus = 'Not Started';
    p.suspectsInvestigated = [];
    p.questionsAsked = 0;
    p.cluesFound = [];
    p.progressPercentage = 0;
    p.notes = '';
    p.accusation = null;
    p.completed = false;
  });

  // Clear chat logs
  db.chatLogs = {};

  // Reset evaluation state & unlock scoring
  db.evaluationState = {
    status: 'PENDING',
    isLeaderboardPublished: false,
    publishedAt: null,
    completedAt: null,
    totalPlayers: Object.keys(db.playerProgress).length,
    playersEvaluated: 0,
    playersPending: Object.keys(db.playerProgress).length,
    averageScore: 0,
    averageAccuracy: 0,
    fastestSolver: null,
    highestAccuracy: null,
    mostCluesDiscovered: null,
    mostCompleteInvestigation: null,
    reports: {},
    leaderboard: [],
    auditLogs: [],
  };
  db.caseConfig.scoringLocked = false;

  saveDatabase();
  broadcast({ type: 'event_updated', data: db.event });
  broadcast({ type: 'players_updated', data: Object.values(db.playerProgress) });
  broadcast({ type: 'evaluation_status', data: { status: 'PENDING' } });
  return res.json({ success: true, event: db.event });
});

// Update Event Settings
app.post('/api/admin/event/settings', requireAdmin, (req, res) => {
  const { eventName, caseTitle, duration, accusationEnabled, notesEnabled, cluesVisible } = req.body;

  if (eventName) db.event.eventName = eventName;
  if (caseTitle) db.event.caseTitle = caseTitle;
  if (typeof duration === 'number' && duration > 0) {
    db.event.duration = duration;
    db.event.settings.duration = duration;
    if (db.event.status === 'NOT_STARTED') {
      db.event.timeRemaining = duration * 60;
    }
  }
  if (typeof accusationEnabled === 'boolean') db.event.settings.accusationEnabled = accusationEnabled;
  if (typeof notesEnabled === 'boolean') db.event.settings.notesEnabled = notesEnabled;
  if (typeof cluesVisible === 'boolean') db.event.settings.cluesVisible = cluesVisible;

  saveDatabase();
  broadcast({ type: 'event_updated', data: db.event });
  return res.json({ success: true, event: db.event });
});

// ==========================================
// EVALUATION API ROUTES (Prompts 33-46)
// ==========================================

// Get Evaluation Status & Summary
app.get('/api/admin/evaluation/status', requireAdmin, (req, res) => {
  return res.json({
    status: db.evaluationState.status,
    isLeaderboardPublished: db.evaluationState.isLeaderboardPublished,
    completedAt: db.evaluationState.completedAt,
    publishedAt: db.evaluationState.publishedAt,
    summary: {
      totalPlayers: db.evaluationState.totalPlayers,
      playersEvaluated: db.evaluationState.playersEvaluated,
      playersPending: db.evaluationState.playersPending,
      averageScore: db.evaluationState.averageScore,
      averageAccuracy: db.evaluationState.averageAccuracy,
      fastestSolver: db.evaluationState.fastestSolver,
      highestAccuracy: db.evaluationState.highestAccuracy,
      mostCluesDiscovered: db.evaluationState.mostCluesDiscovered,
      mostCompleteInvestigation: db.evaluationState.mostCompleteInvestigation,
    },
  });
});

// Get Full Evaluation Center Results
app.get('/api/admin/evaluation/results', requireAdmin, (req, res) => {
  return res.json({ evaluationState: db.evaluationState });
});

// Get Individual Player Evaluation Report
app.get('/api/admin/evaluation/player/:playerId', requireAdmin, (req, res) => {
  const { playerId } = req.params;
  const report = db.evaluationState.reports[playerId];
  if (!report) {
    return res.status(404).json({ error: 'Evaluation report not found for this player' });
  }
  return res.json({ report });
});

// Admin Manual Override of Score / Accuracy (Prompt 44)
app.post('/api/admin/evaluation/override', requireAdmin, (req, res) => {
  const adminUser = getSessionUser(req);
  const { playerId, investigationScore, finalAnswerScore, reasoningScore, accuracyPercentage, reason } = req.body;

  if (!playerId || !reason || !String(reason).trim()) {
    return res.status(400).json({ error: 'Player ID and a detailed reason for manual override are required.' });
  }

  const report = db.evaluationState.reports[playerId];
  if (!report) {
    return res.status(404).json({ error: 'Player report not found to override.' });
  }

  const originalScore = report.finalScore;
  const originalAccuracy = report.accuracyPercentage;

  if (typeof investigationScore === 'number') {
    report.scoreBreakdown.investigationScore = Math.min(report.scoreBreakdown.investigationMax, Math.max(0, investigationScore));
  }
  if (typeof finalAnswerScore === 'number') {
    report.scoreBreakdown.finalAnswerScore = Math.min(report.scoreBreakdown.finalAnswerMax, Math.max(0, finalAnswerScore));
  }
  if (typeof reasoningScore === 'number') {
    report.scoreBreakdown.reasoningScore = Math.min(report.scoreBreakdown.reasoningMax, Math.max(0, reasoningScore));
  }

  // Recalculate total score
  const newTotal = Math.min(100, Math.max(0, Math.round(
    (report.scoreBreakdown.investigationScore +
     report.scoreBreakdown.finalAnswerScore +
     report.scoreBreakdown.reasoningScore +
     report.scoreBreakdown.timeScore) * 10
  ) / 10));

  report.finalScore = newTotal;
  report.scoreBreakdown.totalScore = newTotal;

  if (typeof accuracyPercentage === 'number') {
    report.accuracyPercentage = Math.min(100, Math.max(0, Math.round(accuracyPercentage * 10) / 10));
  }

  report.manualOverride = {
    originalScore,
    newScore: report.finalScore,
    originalAccuracy,
    newAccuracy: report.accuracyPercentage,
    adminName: adminUser?.name || 'Administrator',
    reason: String(reason).trim(),
    modifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Add to Audit Trail (Prompt 44)
  db.evaluationState.auditLogs.unshift({
    playerId,
    action: 'SCORE_OVERRIDE',
    details: `Score adjusted from ${originalScore} to ${report.finalScore} (Accuracy ${originalAccuracy}% -> ${report.accuracyPercentage}%) by ${adminUser?.name}. Reason: ${reason}`,
    timestamp: new Date().toISOString(),
  });

  // Re-run Leaderboard to reflect adjusted rank
  db.evaluationState.leaderboard = generateLeaderboard(db.evaluationState.reports);

  saveDatabase();
  broadcast({
    type: 'evaluation_updated',
    data: db.evaluationState,
  });

  return res.json({
    success: true,
    report,
    leaderboard: db.evaluationState.leaderboard,
  });
});

// Publish Leaderboard to Players (Prompt 39)
app.post('/api/admin/evaluation/publish', requireAdmin, (req, res) => {
  db.evaluationState.isLeaderboardPublished = true;
  db.evaluationState.publishedAt = new Date().toISOString();

  saveDatabase();
  broadcast({
    type: 'leaderboard_published',
    data: {
      leaderboard: db.evaluationState.leaderboard,
      publishedAt: db.evaluationState.publishedAt,
    },
  });

  return res.json({
    success: true,
    message: 'Final Leaderboard successfully published to all players.',
    publishedAt: db.evaluationState.publishedAt,
  });
});

// Re-Evaluate on Demand
app.post('/api/admin/evaluation/re-evaluate', requireAdmin, async (req, res) => {
  await runAutomatedEvaluation();
  return res.json({ success: true, evaluationState: db.evaluationState });
});

// Export CSV (Prompt 45)
app.get('/api/admin/evaluation/export/csv', requireAdmin, (req, res) => {
  const csvData = exportLeaderboardCSV(db.evaluationState.leaderboard);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="hidden_mystery_leaderboard.csv"');
  return res.send(csvData);
});

// Case Config (Answer Key, Clue Weights, Rubric) (Prompt 23, 24, 26, 46)
app.get('/api/admin/case-config', requireAdmin, (req, res) => {
  return res.json({
    answerKey: db.caseConfig.answerKey,
    clueWeights: db.caseConfig.clueWeights,
    rubric: db.caseConfig.rubric,
    scoringLocked: db.caseConfig.scoringLocked,
  });
});

app.put('/api/admin/case-config', requireAdmin, (req, res) => {
  if (db.caseConfig.scoringLocked) {
    return res.status(403).json({
      error: 'Fairness rule locked: Scoring configuration cannot be modified once the event has started.',
    });
  }

  const { answerKey, clueWeights, rubric } = req.body;
  if (answerKey) db.caseConfig.answerKey = { ...db.caseConfig.answerKey, ...answerKey };
  if (clueWeights) db.caseConfig.clueWeights = { ...db.caseConfig.clueWeights, ...clueWeights };
  if (rubric) db.caseConfig.rubric = { ...db.caseConfig.rubric, ...rubric };

  saveDatabase();
  return res.json({ success: true, message: 'Case configuration updated successfully.' });
});

// Public / Player Leaderboard (Scores restricted to Admin)
app.get('/api/evaluation/leaderboard', (req, res) => {
  const user = getSessionUser(req);
  const isAdmin = user && user.role === 'ADMIN';

  if (!isAdmin) {
    return res.json({
      isPublished: false,
      leaderboard: [],
      message: 'Scores and official rankings are restricted exclusively to the Chief Administrator page.',
    });
  }

  return res.json({
    isPublished: db.evaluationState.isLeaderboardPublished,
    publishedAt: db.evaluationState.publishedAt,
    leaderboard: db.evaluationState.leaderboard,
  });
});

// Player's Personal Evaluation Report (Scores restricted to Admin)
app.get('/api/player/evaluation/my-result', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'PLAYER') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const progress = db.playerProgress[user.id];
  return res.json({
    isPublished: false,
    isSubmitted: !!progress?.accusation,
    submittedAt: progress?.accusation?.submittedAt || null,
    message: 'Official score generation and criteria analysis are restricted to the Chief Administrator page.',
    report: null,
  });
});

// Get All Players for Admin Monitoring
app.get('/api/admin/players', requireAdmin, (req, res) => {
  return res.json({
    players: Object.values(db.playerProgress),
  });
});

// Get Detailed Player Profile for Admin
app.get('/api/admin/players/:playerId', requireAdmin, (req, res) => {
  const { playerId } = req.params;
  const progress = db.playerProgress[playerId];
  if (!progress) {
    return res.status(404).json({ error: 'Player not found' });
  }
  const chats = db.chatLogs[playerId] || {};
  return res.json({
    progress,
    chatLogs: chats,
  });
});

// ==========================================
// ADVANCED ADMIN USER MANAGEMENT (Prompt 21-25)
// ==========================================

// Get All Registered Users for User Management Table
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const usersList = Object.values(db.users)
    .filter(u => u.role === 'PLAYER')
    .map(u => {
      const p = db.playerProgress[u.id];
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        loginStatus: u.loginStatus,
        accountStatus: u.accountStatus || 'Active',
        progressPercentage: p?.progressPercentage || 0,
        investigationStatus: p?.investigationStatus || 'Not Started',
        questionsAsked: p?.questionsAsked || 0,
        cluesFoundCount: p?.cluesFound?.length || 0,
        lastActivity: p?.lastActivity || u.lastActive,
        createdAt: u.createdAt,
      };
    });
  return res.json({ users: usersList });
});

// Edit Player Account (Prompt 22)
app.put('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { name, username, password, accountStatus } = req.body;
  const user = db.users[userId];
  if (!user || user.role !== 'PLAYER') {
    return res.status(404).json({ error: 'Player account not found' });
  }

  if (name && String(name).trim()) {
    user.name = String(name).trim();
  }

  if (username && String(username).trim()) {
    const cleanUsername = String(username).trim().toLowerCase();
    // Check if new username collides with another user
    const existing = Object.values(db.users).find(u => u.id !== userId && u.username.toLowerCase() === cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken by another user' });
    }
    user.username = cleanUsername;
  }

  if (password && String(password).trim().length > 0) {
    user.passwordHash = hashPassword(String(password).trim());
  }

  if (accountStatus && ['Active', 'Disabled', 'Removed'].includes(accountStatus)) {
    user.accountStatus = accountStatus;
    if (accountStatus === 'Disabled' || accountStatus === 'Removed') {
      user.loginStatus = 'Offline';
      // Invalidate active sessions
      for (const [token, s] of Object.entries(db.sessions || {})) {
        if (s.userId === userId) {
          delete db.sessions[token];
        }
      }
      broadcast({ type: 'user_disabled', data: { userId } });
    }
  }

  // Synchronize PlayerProgress table
  if (db.playerProgress[userId]) {
    db.playerProgress[userId].playerName = user.name;
    db.playerProgress[userId].username = user.username;
    db.playerProgress[userId].accountStatus = user.accountStatus;
    if (user.accountStatus !== 'Active') {
      db.playerProgress[userId].loginStatus = 'Offline';
    }
  }

  saveDatabase();
  broadcast({ type: 'players_updated', data: Object.values(db.playerProgress) });

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      loginStatus: user.loginStatus,
      accountStatus: user.accountStatus,
    },
    players: Object.values(db.playerProgress),
  });
});

// Reset Password (Prompt 22)
app.post('/api/admin/users/:userId/reset-password', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const user = db.users[userId];
  if (!user || user.role !== 'PLAYER') {
    return res.status(404).json({ error: 'Player account not found' });
  }

  const newPassword = req.body.password?.trim() || 'investigate_' + Math.floor(1000 + Math.random() * 9000);
  user.passwordHash = hashPassword(newPassword);

  saveDatabase();
  return res.json({
    success: true,
    message: `Password updated for ${user.name}`,
    temporaryPassword: newPassword,
  });
});

// Disable / Enable Player (Prompt 24)
app.post('/api/admin/users/:userId/status', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { accountStatus } = req.body;
  const user = db.users[userId];
  if (!user || user.role !== 'PLAYER') {
    return res.status(404).json({ error: 'Player account not found' });
  }

  if (!['Active', 'Disabled'].includes(accountStatus)) {
    return res.status(400).json({ error: 'Invalid accountStatus. Must be Active or Disabled' });
  }

  user.accountStatus = accountStatus;
  if (accountStatus === 'Disabled') {
    user.loginStatus = 'Offline';
    for (const [token, s] of Object.entries(db.sessions || {})) {
      if (s.userId === userId) {
        delete db.sessions[token];
      }
    }
    broadcast({ type: 'user_disabled', data: { userId } });
  }

  if (db.playerProgress[userId]) {
    db.playerProgress[userId].accountStatus = accountStatus;
    if (accountStatus === 'Disabled') {
      db.playerProgress[userId].loginStatus = 'Offline';
    }
  }

  saveDatabase();
  broadcast({ type: 'players_updated', data: Object.values(db.playerProgress) });

  return res.json({
    success: true,
    accountStatus: user.accountStatus,
    players: Object.values(db.playerProgress),
  });
});

// Force Logout (Prompt 25)
app.post('/api/admin/users/:userId/force-logout', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.loginStatus = 'Offline';
  for (const [token, s] of Object.entries(db.sessions || {})) {
    if (s.userId === userId) {
      delete db.sessions[token];
    }
  }

  if (db.playerProgress[userId]) {
    db.playerProgress[userId].loginStatus = 'Offline';
  }

  saveDatabase();
  broadcast({ type: 'force_logout', data: { userId } });
  broadcast({ type: 'players_updated', data: Object.values(db.playerProgress) });

  return res.json({
    success: true,
    message: `Forced logout for ${user.name}`,
    players: Object.values(db.playerProgress),
  });
});

// Remove Player (Prompt 23)
app.delete('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const user = db.users[userId];
  if (!user || user.role !== 'PLAYER') {
    return res.status(404).json({ error: 'Player account not found' });
  }

  const isPermanent = req.query.permanent === 'true';

  if (isPermanent) {
    delete db.users[userId];
    delete db.playerProgress[userId];
    delete db.chatLogs[userId];
  } else {
    // Soft-delete approach (auditing preserved)
    user.accountStatus = 'Removed';
    user.loginStatus = 'Offline';
    if (db.playerProgress[userId]) {
      db.playerProgress[userId].accountStatus = 'Removed';
      db.playerProgress[userId].loginStatus = 'Offline';
    }
  }

  for (const [token, s] of Object.entries(db.sessions || {})) {
    if (s.userId === userId) {
      delete db.sessions[token];
    }
  }

  saveDatabase();
  broadcast({ type: 'force_logout', data: { userId } });
  broadcast({ type: 'players_updated', data: Object.values(db.playerProgress) });

  return res.json({
    success: true,
    message: isPermanent ? `Permanently deleted player ${userId}` : `Soft-deleted player ${user.name} (data preserved for audit)`,
    players: Object.values(db.playerProgress),
  });
});

// ==========================================
// SUSPECT AI INTERROGATION & PLAYER PROGRESS
// ==========================================

// Multi-Stage Suspect Conversation State Tracker (0 = Initial denial, 1 = Defensive answers, 2 = Partial info, 3 = Critical confession)
const suspectConversationStages: Record<string, Record<string, number>> = {};

function getSuspectStage(userId: string, suspectId: string): number {
  if (db.playerProgress[userId]?.suspectStages?.[suspectId] !== undefined) {
    return Math.min(3, Math.max(0, db.playerProgress[userId].suspectStages![suspectId]));
  }
  if (!suspectConversationStages[userId]) suspectConversationStages[userId] = {};
  if (typeof suspectConversationStages[userId][suspectId] !== 'number') {
    suspectConversationStages[userId][suspectId] = 0;
  }
  return Math.min(3, Math.max(0, suspectConversationStages[userId][suspectId]));
}

function setSuspectStage(userId: string, suspectId: string, stage: number): void {
  const target = Math.min(3, Math.max(0, stage));
  if (!suspectConversationStages[userId]) suspectConversationStages[userId] = {};
  const current = getSuspectStage(userId, suspectId);
  if (target > current) {
    suspectConversationStages[userId][suspectId] = target;
    if (db.playerProgress[userId]) {
      if (!db.playerProgress[userId].suspectStages) {
        db.playerProgress[userId].suspectStages = {};
      }
      db.playerProgress[userId].suspectStages![suspectId] = target;
    }
  }
}

const SUSPECT_SYSTEM_PROMPTS: Record<string, string> = {
  vicky: `You are Vicky, the 28-year-old nephew of businessman Varadarajan in "The Hidden Mystery" investigation game.
Public Personality: Calm, polite, cooperative, confident, perfectly poised.
Hidden Truth: You are in severe financial debt (₹85 Lakh) from a collapsed business deal. Creditors are threatening asset seizure. Varadarajan announced he was finalizing a new property settlement deed disinheriting you in favor of Meena. You offered cook Perumal ₹10 Lakh to flip the main electrical breaker at exactly 9:42 PM. During the 8-minute blackout (9:42 PM - 9:50 PM), you entered the study, confronted Varadarajan for the deed, a violent scuffle occurred, you killed Varadarajan and took the deed.
CRITICAL INVESTIGATION PACING & ANTI-SPOILER RULES:
- NEVER REVEAL THE ANSWER QUICKLY OR CONFESS EARLY. This is a game of suspense.
- If asked direct spoiler questions ("Who did it?", "Are you the killer?", "Did you kill him?", "Tell me the answer"), DO NOT CONFESS. Act offended, claim innocence, state that you loved your uncle, and demand that the interrogator present actual physical evidence.
- Stage 0 (Initial Denial): Act composed, polite, and sorrowful. Claim you arrived at 9:30 PM for a routine family visit. During the power cut, claim you were having water in the living room or waiting quietly. Deny any involvement.
- Stage 1 (Defensive Answers): If asked about your finances or why you were here, become defensive: "My business investments are private. Why are you questioning me when rival Rangan publicly threatened uncle?" Deflect toward Rangan.
- Stage 2 (Partial Information): If confronted with the 9:42 PM blackout or property settlement, show cracks and admit only partial facts: admit uncle was discussing property settlement deed, but claim you stayed in the reception room.
- Stage 3 (Critical Confession): ONLY when the detective confronts you with the undeniable combination of Perumal's bribe + the 9:42 PM power cut + your debt/settlement deed + the study murder, break down in a desperate, furious confession: You paid Perumal ₹10 Lakh to cut power, confronted uncle for the deed, he threatened to call the police, you panicked and killed him.
- Never state you are an AI. Never break character.`,

  perumal: `You are Perumal, the 56-year-old family cook in "The Hidden Mystery" investigation game.
Public Personality: Nervous, respectful, emotional, cautious, wiping trembling hands on your apron ("Ayya", "Swami", "Amma").
Hidden Truth: Your daughter Kavitha's wedding is next month and you desperately needed money. Vicky offered you ₹10 Lakh in cash if you pulled down the main electrical breaker at exactly 9:42 PM. You agreed, believing Vicky only wanted darkness to retrieve family papers. You did NOT know Vicky planned to kill Varadarajan. During the blackout, you heard angry shouts and a struggle from the study, leaving you terrified. You turned power back on at 9:50 PM. You kept quiet out of fear of being accused of murder.
CRITICAL INVESTIGATION PACING & ANTI-SPOILER RULES:
- NEVER REVEAL THE ANSWER QUICKLY OR CONFESS EARLY.
- If asked direct questions ("Who killed him?", "Did Vicky kill him?", "Are you guilty?"), DO NOT immediately say Vicky paid you or that you pulled the breaker. Cry, pray to God, and claim you are just a poor cook who was boiling night milk in the kitchen.
- Stage 0 (Initial Denial): Deny any knowledge. "Ayya, I was in the kitchen boiling night milk. Power cuts are common here."
- Stage 1 (Defensive Answers): If asked why you were near the breaker or about wedding money, become agitated, stammer, and ask why the police suspect a poor cook.
- Stage 2 (Partial Information): If pressed about the 9:40 PM movement or meeting Vicky, slip nervous details: admit hearing buzzing by the breaker or speaking with Vicky about dinner provisions.
- Stage 3 (Critical Confession): ONLY when confronted with the breaker switch tampering AND the ₹10 Lakh cash/advance deposit slip under the flour tin, confess in tears: Vicky paid ₹10 Lakh to turn off breaker at 9:42 PM, you heard the struggle in the dark study, restored power at 9:50 PM, and you were terrified of being blamed.
- Never state you are an AI. Never break character.`,

  meena: `You are Meena, the 24-year-old daughter of Varadarajan in "The Hidden Mystery" investigation game.
Public Personality: Calm but emotionally affected, grieving, observant, guarded.
Hidden Truth: Six months ago, your architectural studio faced a cash crisis and you secretly took ₹25 Lakh from your father's business account, planning to replace it. When father announced he was finalizing the property settlement, you panicked that he would discover the deficit. During the 9:42 PM blackout, you secretly went toward the study to retrieve and hide the financial ledger. You were near the study in the dark, but YOU DID NOT KILL YOUR FATHER. You heard someone struggling inside the dark study, panicked, grabbed the ledger, and ran back to your room.
CRITICAL INVESTIGATION PACING & ANTI-SPOILER RULES:
- NEVER REVEAL THE ANSWER QUICKLY OR ADMIT YOUR AUDIT SECRET IMMEDIATELY.
- If directly asked if you killed father, express shock, horror, and grief.
- Stage 0 (Initial Denial): Claim you were upstairs in your room during the entire blackout.
- Stage 1 (Defensive Answers): If asked about company accounts or being seen in the corridor, defend yourself: "I am his daughter and an architect—handling accounts is normal."
- Stage 2 (Partial Information): Admit you left your bedroom during the blackout and heard shouting downstairs.
- Stage 3 (Critical Confession): When confronted with evidence of being near the study during the blackout or the missing ledger, confess your secret: you only took the ledger to hide your withdrawal, you heard a fight inside the dark study, and saw Vicky leaving the wing when lights returned at 9:50 PM. You did NOT kill your father (Red Herring).
- Never state you are an AI. Never break character.`,

  rangan: `You are Rangan, the 58-year-old former business partner and current rival of Varadarajan in "The Hidden Mystery".
Public Personality: Aggressive, proud, defensive, sharp-tongued, impatient.
Truth: You and Varadarajan had a fierce land dispute over the bypass commercial land. You called his study at 9:20 PM threatening a criminal fraud lawsuit ("Tomorrow, we'll settle this"). You are NOT the murderer. At 9:30 PM to 10:15 PM, you were at the Nilgiris Town Police Station filing a formal complaint against Varadarajan. The station duty diary and CCTV prove your alibi.
CRITICAL INVESTIGATION PACING & ANTI-SPOILER RULES:
- NEVER GIVE AWAY ANSWERS EASILY.
- If asked if you killed him or who did it, bark that you fight battles in court through advocates, not through petty violence.
- Stage 0 (Initial Denial): Act hostile and refuse to provide an alibi casually: "I don't answer amateur interrogators; talk to my advocate."
- Stage 1 (Defensive Answers): Defend your dispute as legitimate business litigation; warn detective against defamation.
- Stage 2 (Partial Information): When pressed on the 9:20 PM phone call, admit you called to warn him before heading into town.
- Stage 3 (Critical Alibi / Revelation): When pressed on your whereabouts between 9:30 PM and 10:00 PM, reveal you were at the Town Police Station. Present your verified police station acknowledgement receipt and CCTV record.
- Never state you are an AI. Never break character.`,

  // Legacy fallbacks for compatibility
  arjun: `You are Vicky, the nephew of Varadarajan in "The Hidden Mystery". Calm, polite, cooperative, but secretly in debt and guilty of the 9:42 PM blackout murder.`,
  kamatchi: `You are Perumal, the family cook in "The Hidden Mystery". Nervous, respectful, secretly bribed ₹10 Lakh by Vicky to pull the main electrical breaker at 9:42 PM.`,
};

function detectClueDiscovery(suspectId: string, _userText: string, aiReply: string, stage: number = 0): string | undefined {
  const reply = aiReply.toLowerCase();

  // Clues require the suspect to actually reveal them in conversation, not merely the player typing words
  // PERUMAL
  if (suspectId === 'perumal' || suspectId === 'kamatchi') {
    if (stage >= 2 && (reply.includes('breaker') || reply.includes('switch') || reply.includes('tripped') || reply.includes('cut the lights') || reply.includes('switched off the main'))) {
      return 'clue-breaker-tripped';
    }
    if (stage >= 2 && (reply.includes('10 lakh') || reply.includes('flour tin') || reply.includes('deposit slip') || reply.includes('advance') || reply.includes('kavitha') || reply.includes('wedding debts'))) {
      return 'clue-advance-payment';
    }
  }

  // VICKY
  if (suspectId === 'vicky' || suspectId === 'arjun') {
    if (stage >= 2 && (reply.includes('85 lakh') || reply.includes('bankruptcy') || reply.includes('creditor') || reply.includes('loan commitments') || reply.includes('financial ruin'))) {
      return 'clue-failed-deal';
    }
    if (stage >= 2 && (reply.includes('settlement deed') || reply.includes('spare tire') || reply.includes('disinherit') || reply.includes('property settlement') || reply.includes('take back the settlement'))) {
      return 'clue-missing-settlement';
    }
    if (stage >= 2 && (reply.includes('watch') || reply.includes('cuff') || reply.includes('mantlepiece') || reply.includes('scuffle') || reply.includes('struck his head'))) {
      return 'clue-vicky-watch';
    }
  }

  // MEENA
  if (suspectId === 'meena') {
    if (stage >= 2 && (reply.includes('ledger') || reply.includes('25 lakh') || reply.includes('closet') || reply.includes('deficit') || reply.includes('architectural studio'))) {
      return 'clue-meena-ledger';
    }
  }

  // RANGAN
  if (suspectId === 'rangan') {
    if (stage >= 2 && (reply.includes('police station') || reply.includes('cctv') || reply.includes('acknowledgement receipt') || reply.includes('sub-inspector') || reply.includes('diary entry'))) {
      return 'clue-police-cctv';
    }
  }

  return undefined;
}

// Track recent replies per player-suspect pair to strictly prevent verbatim repetition
const playerSuspectHistory: Record<string, string[]> = {};

function pickNonRepeating(key: string, candidates: string[]): string {
  if (!playerSuspectHistory[key]) {
    playerSuspectHistory[key] = [];
  }
  const history = playerSuspectHistory[key];
  const available = candidates.filter(c => !history.includes(c));
  const pool = available.length > 0 ? available : candidates;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  history.push(chosen);
  if (history.length > 5) {
    history.shift();
  }
  return chosen;
}

// Intelligent Multi-Stage Dynamic Dialogue Engine (Prompts 21-47 & New Story Rules)
// 1. NEVER REPEAT: Bot never repeats previous responses verbatim; rephrases naturally each time.
// 2. GENERAL QUESTIONS: For unrelated questions, answers casually in character without bringing up crime.
// 3. MULTI-STAGE LYING & RESISTANCE: 0 = Initial denial, 1 = Defensive answers, 2 = Partial information, 3 = Critical confession.
// 4. NEVER TELL ANSWERS QUICKLY: Suspects resist direct questions and confess ONLY when pressed through sustained interrogation with verified clues.
function getSuspectFallbackReply(suspectId: string, userText: string, playerId: string = 'global'): string {
  const q = userText.toLowerCase();
  const histKey = `${playerId}_${suspectId}`;
  const currentStage = getSuspectStage(playerId, suspectId);
  const playerChats = db.chatLogs[playerId]?.[suspectId] || [];
  const questionCount = playerChats.filter(m => m.sender === 'player').length;

  // RULE 0: DIRECT BLUNT QUESTIONS NEVER GET INSTANT ANSWERS OR CONFESSIONS
  const isDirectSpoilerQuestion =
    q.includes('who is the killer') ||
    q.includes('who killed') ||
    q.includes('who murder') ||
    q.includes('are you the killer') ||
    q.includes('did you kill') ||
    q.includes('did you murder') ||
    q.includes('tell me who') ||
    q.includes('tell me the answer') ||
    q.includes('who did it') ||
    q.includes('who is guilty');

  if (isDirectSpoilerQuestion) {
    if (suspectId === 'vicky' || suspectId === 'arjun') {
      return pickNonRepeating(histKey, [
        "What an absurd and insulting question! I came here for a quiet family dinner. If you want to accuse someone of murder, Inspector, find actual forensic proof rather than pointing fingers at grieving relatives.",
        "I will not tolerate wild slander! Uncle Varadarajan was the head of our family. Ask your questions based on verifiable facts, or I will have my advocate present.",
      ]);
    }
    if (suspectId === 'perumal' || suspectId === 'kamatchi') {
      return pickNonRepeating(histKey, [
        "Aiyo swami! Me, kill the master?! I have cooked his meals and served this family faithfully for twenty years! Master looked after my family like his own children! Please don't throw terrible accusations at a poor servant!",
        "Swami, God is my witness! I am just a humble cook. How could I ever harm the master who fed us? Stop terrifying an innocent man, ayya!",
      ]);
    }
    if (suspectId === 'meena') {
      return pickNonRepeating(histKey, [
        "How can you even utter such a thing?! Varadarajan was my father! I am grieving his loss and you sit here asking if I murdered him?! Ask sensible questions or leave me in peace.",
        "That is sickening. I want the monster who took my father caught and punished. Do your job and inspect the evidence properly.",
      ]);
    }
    if (suspectId === 'rangan') {
      return pickNonRepeating(histKey, [
        "Are you out of your mind?! If I wanted Varadarajan eliminated, I wouldn't have hired high-court advocates to file criminal fraud petitions against him! I fight my battles in court. Produce evidence or get out of my way!",
        "Ridiculous amateur deduction! Business rivals don't sneak into houses in the dark. Stop barking up the wrong tree and inspect his own household!",
      ]);
    }
  }

  // ========================================================
  // 1. VICKY (Nephew - Prime Culprit: Calm -> Defensive -> Cracking -> Confession)
  // ========================================================
  if (suspectId === 'vicky' || suspectId === 'arjun') {
    const hasPerumalOrBribe = q.includes('perumal') || q.includes('10 lakh') || q.includes('bribe') || q.includes('cook') || q.includes('paid') || q.includes('deposit') || q.includes('advance');
    const hasBreakerOrBlackout = q.includes('breaker') || q.includes('power cut') || q.includes('blackout') || q.includes('lights') || q.includes('9:42') || q.includes('dark');
    const hasDebtOrSettlement = q.includes('debt') || q.includes('failed deal') || q.includes('85 lakh') || q.includes('creditor') || q.includes('settlement') || q.includes('deed') || q.includes('disinherit') || q.includes('will') || q.includes('safe');
    const hasStudyOrMurder = q.includes('study') || q.includes('kill') || q.includes('murder') || q.includes('scuffle') || q.includes('confront') || q.includes('cufflink') || q.includes('watch') || q.includes('body');

    // BREAKING POINT CONFESSION (Stage 3: Critical Confession)
    // STRICT CONDITION: Must have undergone sustained questioning (stage >= 2 && questionCount >= 4)
    // AND must be confronted with the multi-clue smoking guns:
    // (Perumal bribe/deposit slip + blackout breaker + debt/settlement deed)
    if (currentStage >= 2 && questionCount >= 4 &&
        ((hasPerumalOrBribe && hasBreakerOrBlackout && (hasDebtOrSettlement || hasStudyOrMurder)) ||
         (hasPerumalOrBribe && hasDebtOrSettlement && hasStudyOrMurder))) {
      setSuspectStage(playerId, suspectId, 3);
      return pickNonRepeating(histKey, [
        "Alright, STOP! Enough! Don't look at me like that! You have no idea what it feels like to be staring into total financial ruin! My creditors were going to seize everything I owned—my firm, my reputation, my dignity! Uncle knew I was drowning in ₹85 Lakh of debt, but instead of helping, he smirked and said he was signing over the entire commercial estate to Meena's trust and leaving me with nothing! Yes, I paid Perumal ₹10 Lakh to pull the main electrical breaker at 9:42 PM! I only wanted darkness to slip into the study safe and take back the settlement deed! But Uncle was sitting by his desk with a flashlight. When I demanded the deed, he grabbed the telephone and shouted that he was calling the police on me! I panicked... I wrestled him... he fell and struck his head on the desk mantlepiece! I took the deed, the lights came back on at 9:50 PM, and I walked out! It was an accident, I swear it!",
        "Stop pushing! You've pieced the whole thing together. I was facing ₹85 Lakh in bankruptcy and creditor warrants. When Uncle told me he was cutting me out of the property settlement, my life was over. I promised Perumal ₹10 Lakh for his daughter's wedding to pull the main breaker at 9:42 PM so the cameras and lights went pitch dark. I went to the study to destroy the deed before tomorrow's registration. But Uncle resisted, grabbed me by the collar, and during the scuffle he collapsed! The deed is hidden inside the spare tire of my sedan outside. Take it... just don't parade me in front of the press!",
      ]);
    }

    // STAGE 2: Partial Information (Under Heavy Pressure / Slipped Details)
    // Only if questionCount >= 4 and player specifically presses with evidence
    if (currentStage >= 1 && questionCount >= 4 && hasDebtOrSettlement) {
      setSuspectStage(playerId, suspectId, 2);
      return pickNonRepeating(histKey, [
        "Yes, my firm had financial setbacks in recent commercial trades, but I am in active talks with lenders. Uncle knew about my loan commitments. That is strictly private family finance, not a motive for violence.",
        "Uncle mentioned he was reviewing family property distribution. That is standard estate planning for any wealthy family. Why are you treating an ordinary conversation as a motive?",
        "Inspector, you are grasping at straws. Just because I have debt commitments doesn't place me anywhere near the study during the thunderstorm blackout.",
      ]);
    }

    if (currentStage >= 1 && questionCount >= 4 && hasPerumalOrBribe) {
      setSuspectStage(playerId, suspectId, 2);
      return pickNonRepeating(histKey, [
        "Perumal? What are you implying? He is the household cook. I only spoke to him at 9:30 PM to ask for a glass of water.",
        "I have known Perumal since childhood. If I offered him a small hand loan for his daughter's wedding, that is simple family charity. Stop inventing conspiracies.",
      ]);
    }

    // STAGE 1: Defensive Answers (Mild Deflection toward Rangan)
    if (questionCount >= 2 && (hasStudyOrMurder || hasBreakerOrBlackout || q.includes('alibi') || q.includes('where') || q.includes('time') || q.includes('9:30'))) {
      setSuspectStage(playerId, suspectId, 1);
      return pickNonRepeating(histKey, [
        "I arrived at 9:30 PM. Cook Perumal greeted me at the foyer, and I asked about Uncle. I was invited here for dinner and a quiet evening. I have nothing to hide.",
        "The power tripped around 9:42 PM, yes. The entire house went dark. I stayed in the reception room waiting for candles. When the power returned at 9:50 PM, I walked down the hall and heard the commotion.",
        "I was in the front wing of the house during the evening. If you want suspects, go interrogate Rangan—he publicly threatened Uncle over the bypass land dispute!",
      ]);
    }

    // GENERAL UNRELATED QUESTIONS (Rule 2: casual answer without bringing up crime)
    if (q.includes('cloth') || q.includes('suit') || q.includes('watch') || q.includes('wear') || q.includes('cufflink')) {
      return pickNonRepeating(histKey, [
        "This is an imported tailored linen blazer and formal trousers. I take pride in dressing appropriately for business and family dinners.",
        "Just my everyday business attire. Why would my wardrobe have any relevance to your investigation, Inspector?",
      ]);
    }

    if (q.includes('food') || q.includes('dinner') || q.includes('eat') || q.includes('drink')) {
      return pickNonRepeating(histKey, [
        "Perumal served traditional South Indian fare earlier. I only had a glass of water when I arrived at 9:30 PM.",
        "I had dinner in town before driving up to the estate. I only took some black coffee here.",
      ]);
    }

    if (q.includes('job') || q.includes('work') || q.includes('business')) {
      return pickNonRepeating(histKey, [
        "I manage commercial property contracts and regional supply logistics. It is demanding, high-stakes work.",
        "I oversee private trade investments across the southern corridor.",
      ]);
    }

    if (q.includes('weather') || q.includes('rain')) {
      return pickNonRepeating(histKey, [
        "The evening was humid and overcast. You could sense a heavy mountain storm brewing across the valley.",
        "The night air was unusually still right before the blackout hit.",
      ]);
    }

    // STAGE 0: Initial Denial (Default polite denial)
    return pickNonRepeating(histKey, [
      "I am doing everything in my power to assist you, Inspector. Uncle Varadarajan was the pillar of our family, and finding the truth is my top priority.",
      "I have given you an accurate account of my arrival at 9:30 PM. Please pursue verifiable facts rather than groundless speculation.",
      "As Varadarajan's nephew, I demand justice as much as anyone in this house. Ask whatever you wish.",
    ]);
  }

  // ========================================================
  // 2. PERUMAL (The Cook - Nervous -> Defensive -> Cracking -> Confession)
  // ========================================================
  if (suspectId === 'perumal' || suspectId === 'kamatchi') {
    const hasBreakerOrPanel =
      q.includes('breaker') ||
      q.includes('panel') ||
      q.includes('switch') ||
      q.includes('fuse') ||
      q.includes('power cut') ||
      q.includes('blackout') ||
      q.includes('9:42') ||
      q.includes('9:40') ||
      q.includes('electric') ||
      q.includes('turn off') ||
      q.includes('tripped');
    const hasMoneyOrWedding =
      q.includes('10 lakh') ||
      q.includes('wedding') ||
      q.includes('daughter') ||
      q.includes('bribe') ||
      q.includes('deposit') ||
      q.includes('flour tin') ||
      q.includes('advance');
    const hasVicky = q.includes('vicky') || q.includes('nephew') || q.includes('thambi');

    // BREAKING POINT CONFESSION (Stage 3: Critical Confession)
    // STRICT CONDITION: Must be stage >= 2 && questionCount >= 4 AND both breaker & cash deposit slip mentioned
    if (currentStage >= 2 && questionCount >= 4 && hasBreakerOrPanel && hasMoneyOrWedding) {
      setSuspectStage(playerId, suspectId, 3);
      return pickNonRepeating(histKey, [
        "Aiyo Perumale, forgive me! I will tell the absolute truth, please don't lock me in jail! Vicky thambi approached me two days ago. He offered me ₹10 Lakh in cash for my daughter Kavitha's wedding expenses if I switched off the main electrical breaker at exactly 9:42 PM! He swore on everything holy that he only needed five minutes of darkness to retrieve family papers from the study! I swear on my daughter's life, I didn't know he was going to harm Varadarajan ayya! At 9:42 PM, I pulled down the breaker switch. But a few minutes later in the dark, I heard angry shouting and a heavy crash from the study! I was so frightened my legs gave out! At 9:50 PM, I switched the breaker back on. Then I saw Vicky walking away from the corridor adjusting his cuffs! I was so terrified that people would blame me that I kept quiet! The bank deposit slip for the ₹2 Lakh advance Vicky gave me is hidden under the kitchen flour tin!",
        "Swami, have mercy on this old cook! I confessed everything to God! Vicky thambi promised me ₹10 Lakh to clear my daughter's wedding debts if I cut the electricity at 9:42 PM sharp. He told me it was just a harmless prank to take a document! When the lights were out, I heard violent scuffling from the study. At 9:50 PM, I turned the power back on and found out master was dead. I never touched master, swami! Vicky is the one who entered the study in the dark!",
      ]);
    }

    // STAGE 2: Partial Information (Nervous / Slipped Details under direct pressure)
    if (currentStage >= 1 && questionCount >= 4 && hasBreakerOrPanel) {
      setSuspectStage(playerId, suspectId, 2);
      return pickNonRepeating(histKey, [
        "Swami, the lights flickered and went out with thunder at 9:42 PM. I fumbled in the dark kitchen for candles. I am an old cook, I know nothing about circuit breaker panels, ayya!",
        "The fuse box outside was making a strange buzzing sound during the drizzle, so I stepped out with an umbrella to see if a wire had sparked. I didn't touch anything, I swear by God!",
      ]);
    }

    if (currentStage >= 1 && questionCount >= 4 && hasMoneyOrWedding) {
      setSuspectStage(playerId, suspectId, 2);
      return pickNonRepeating(histKey, [
        "Aiyo ayya, why are you asking about my daughter Kavitha's wedding?! We borrowed modest hand loans from our village community. Why are you dragging my family into this terrible police affair?",
        "Vicky thambi was polite and offered good wishes for Kavitha's wedding when he arrived for dinner, yes. That is normal family respect, ayya! Don't make a crime out of kindness!",
      ]);
    }

    // STAGE 1: Defensive Answers
    if (questionCount >= 2 && (q.includes('9:42') || q.includes('9:50') || q.includes('kitchen') || q.includes('corridor') || q.includes('who') || q.includes('see') || hasVicky)) {
      setSuspectStage(playerId, suspectId, 1);
      return pickNonRepeating(histKey, [
        "The power went out suddenly at 9:42 PM, ayya. I was boiling the master's night milk in the kitchen. When the whole house went dark, I couldn't find my matchbox for several minutes.",
        "Around 9:50 PM, the lights flickered back on. That's when I heard Miss Meena crying out near the study. I ran out with my apron and saw the door open.",
        "Why would an old cook touch the main breaker, ayya? Power cuts are very common in this mountain region during heavy clouds.",
      ]);
    }

    // GENERAL UNRELATED QUESTIONS
    if (q.includes('food') || q.includes('dinner') || q.includes('cook') || q.includes('milk') || q.includes('recipe')) {
      return pickNonRepeating(histKey, [
        "I have cooked master's meals for twenty years, ayya. Steamed rice, pepper rasam, and his nighttime warm milk without sugar.",
        "Master Varadarajan always preferred simple, traditional home-cooked vegetarian food. I took care of his diet like my own family.",
      ]);
    }

    if (q.includes('routine') || q.includes('morning') || q.includes('job')) {
      return pickNonRepeating(histKey, [
        "I wake up at five every morning, swami, sweep the kitchen courtyard, and grind fresh batter. My whole life is this household.",
        "I have served two generations of this family honestly, ayya. God knows my heart.",
      ]);
    }

    if (q.includes('cloth') || q.includes('wear')) {
      return pickNonRepeating(histKey, [
        "Just my simple cotton kitchen dhoti and apron, ayya. When you spend all day over firewood and stove, you dress for labor.",
      ]);
    }

    // STAGE 0: Initial Denial (Default humble denial)
    return pickNonRepeating(histKey, [
      "Ayya, I only speak what an innocent servant knows. Master Varadarajan was like a father to all of us on this property.",
      "Swami, ask me anything about the kitchen or food. I pray to our family deity that whoever harmed master is punished by God.",
      "The kitchen is cold tonight, ayya. I don't know how this house will survive without our master.",
    ]);
  }

  // ========================================================
  // 3. MEENA (Daughter - Red Herring: Guarded -> Confession)
  // ========================================================
  if (suspectId === 'meena') {
    const hasLedgerOrMoney = q.includes('ledger') || q.includes('account') || q.includes('25 lakh') || q.includes('withdraw') || q.includes('passbook') || q.includes('firm') || q.includes('studio') || q.includes('deficit');
    const hasStudyOrBlackout = q.includes('study') || q.includes('blackout') || q.includes('hallway') || q.includes('corridor') || q.includes('9:42') || q.includes('dark') || q.includes('door');

    // BREAKING POINT CONFESSION (Stage 3: Critical Confession - Exonerates Meena)
    if (currentStage >= 2 && questionCount >= 4 && hasLedgerOrMoney && hasStudyOrBlackout) {
      setSuspectStage(playerId, suspectId, 3);
      return pickNonRepeating(histKey, [
        "I have to tell you the truth, even if it makes me look terrible. Six months ago, my architectural studio ran into a severe cash deficit, and I secretly withdrew ₹25 Lakh from one of father's commercial firm accounts. I intended to replace every rupee before he ever noticed! But yesterday, father announced he was reviewing all company accounts to finalize the property settlement. I was terrified he would discover my deficit! When the lights went out at 9:42 PM, I slipped downstairs in the dark to take the financial ledger from his study desk and hide it! But as I reached the study door, I heard violent shouting and someone struggling inside in the pitch black! Terrified, I grabbed the ledger from the side-table and fled back to my room! I DID NOT KILL MY FATHER! When the electricity returned at 9:50 PM, I saw Vicky walking out of that corridor adjusting his clothes! The ledger is hidden in my closet—take it, but please believe me, I loved my father!",
        "Officer, please listen to me! I only went near the study during the blackout because of my own financial shame. I took ₹25 Lakh from father's business account for my studio, and I needed to hide the account passbook before father's morning audit. While I was near the study threshold in the dark, I heard a violent physical scuffle inside! Someone was confronting father! I panicked and ran upstairs. When the lights came back on at 9:50 PM, Vicky was emerging from that very hallway! I am not a killer!",
      ]);
    }

    // STAGE 2: Partial Information (Admits being downstairs)
    if ((currentStage >= 1 || questionCount >= 3) && (hasLedgerOrMoney || hasStudyOrBlackout)) {
      setSuspectStage(playerId, suspectId, 2);
      return pickNonRepeating(histKey, [
        "Alright... don't jump to horrific conclusions! I wasn't in my bedroom the entire eight minutes! I stepped out into the hallway during the blackout, but not to harm my father!",
        "Father's study was on the ground floor. When the blackout occurred at 9:42 PM, the house was pitch black. I remember feeling a chill and hearing muffled sounds downstairs.",
        "Father announced a complete property review yesterday, yes. It made everyone in the house anxious, but that doesn't mean I would ever lay a finger on him!",
      ]);
    }

    // STAGE 1: Defensive Answers
    if (questionCount >= 2 && (q.includes('settlement') || q.includes('will') || q.includes('account') || q.includes('where') || q.includes('room'))) {
      setSuspectStage(playerId, suspectId, 1);
      return pickNonRepeating(histKey, [
        "Why are you prying into our company bank accounts?! I am his daughter and an architect—handling business finances is completely normal in our family!",
        "Father was planning to finalize a settlement deed this morning. He told us he wanted the estate holdings protected under a single responsible trust.",
        "I was upstairs when the power went out. My bedroom is right above the inner courtyard.",
      ]);
    }

    // GENERAL UNRELATED QUESTIONS
    if (q.includes('job') || q.includes('work') || q.includes('architect') || q.includes('design')) {
      return pickNonRepeating(histKey, [
        "I run a heritage restoration architectural studio. Father always took pride in traditional South Indian stone and woodwork.",
        "Architecture requires precision and patience. I have been working on restoring heritage sites across the state.",
      ]);
    }

    if (q.includes('cloth') || q.includes('wear') || q.includes('shawl')) {
      return pickNonRepeating(histKey, [
        "A simple handloom cotton salwar and woolen shawl. The mountain draft in this house is sharp at night.",
      ]);
    }

    if (q.includes('food') || q.includes('eat') || q.includes('dinner')) {
      return pickNonRepeating(histKey, [
        "Perumal brought dinner earlier, but I barely had an appetite. My stomach has been in knots all night.",
      ]);
    }

    // STAGE 0: Initial Denial (Default sorrowful denial)
    return pickNonRepeating(histKey, [
      "Officer, please keep searching. Father would never willingly leave his study with the safe open and lights off.",
      "I have answered everything I know. If you find any real forensic trace of whoever broke into that study, please tell me.",
      "This house was father's sanctuary. Knowing someone violated it in the dark breaks my heart.",
    ]);
  }

  // ========================================================
  // 4. RANGAN (Rival - Hostile -> Alibi Verified)
  // ========================================================
  if (suspectId === 'rangan') {
    const hasPoliceOrAlibi = q.includes('alibi') || q.includes('where') || q.includes('police') || q.includes('station') || q.includes('cctv') || q.includes('time') || q.includes('diary');
    const hasDisputeOrThreat = q.includes('dispute') || q.includes('land') || q.includes('threat') || q.includes('bypass') || q.includes('court') || q.includes('partner') || q.includes('9:20') || q.includes('call');

    // BREAKING POINT / VERIFIED ALIBI (Stage 3: Critical Alibi / Revelation)
    if (questionCount >= 3 && hasPoliceOrAlibi && (hasDisputeOrThreat || q.includes('murder') || q.includes('kill') || q.includes('9:42'))) {
      setSuspectStage(playerId, suspectId, 3);
      return pickNonRepeating(histKey, [
        "You want verifiable proof? Check the Nilgiris Town Police Station register, Detective! From 9:30 PM to 10:15 PM, I was sitting right across from Sub-Inspector Ganesan lodging a formal cheating complaint against Varadarajan! Their station CCTV, duty officer diary, and my stamped petition copy prove I was miles away in the center of town when the murder happened at 9:45 PM! Here is my certified complaint acknowledgement slip with the official seal and timestamp! I wanted Varadarajan in a civil courtroom, not dead! If he's dead, my land injunction stalls! Whoever killed him did me no favors—go look inside his own greedy family!",
        "Check with Sub-Inspector Ganesan at the Town Police Station! At 9:20 PM, I phoned Varadarajan's study warning him I was heading straight to the police station. He told me: 'Tomorrow, we'll settle this,' and hung up. I was so furious that I drove straight to the police station, walked in at 9:30 PM, and was filing my affidavit when your 9:42 PM blackout occurred! My alibi is airtight and stamped in government ink!",
      ]);
    }

    // STAGE 2: Partial Information (Reveals Phone Call)
    if ((currentStage >= 1 || questionCount >= 2) && (q.includes('9:20') || q.includes('phone') || q.includes('call'))) {
      setSuspectStage(playerId, suspectId, 2);
      return pickNonRepeating(histKey, [
        "Yes! That 9:20 PM phone call to his study was ME! I called to give him one final chance before I filed a formal police complaint regarding the bypass survey swindle! He told me coldly: 'Tomorrow, we'll settle this,' and cut the line! So I drove straight to the police station!",
        "I called his landline at twenty past nine. We argued about the commercial land title. He was arrogant as always. But calling a business rival to warn him about legal action is not a crime!",
      ]);
    }

    // STAGE 1: Defensive Answers (Hostile & Litigious)
    if (hasDisputeOrThreat || q.includes('threat') || q.includes('varadarajan')) {
      setSuspectStage(playerId, suspectId, 1);
      return pickNonRepeating(histKey, [
        "Varadarajan swindled the highway survey rights right out of our joint venture! Of course I shouted at him at the Chamber of Commerce! That was corporate talk! My lawyers were drafting court injunctions.",
        "Threatening legal action and court seizure is business, Inspector! I don't need to sneak through someone's garden in the dark like a common thug to win a land dispute!",
      ]);
    }

    // GENERAL UNRELATED QUESTIONS
    if (q.includes('cloth') || q.includes('wear') || q.includes('suit')) {
      return pickNonRepeating(histKey, [
        "A formal business suit. I am a prominent contractor and property developer; I dress for high-level meetings.",
      ]);
    }

    if (q.includes('job') || q.includes('business') || q.includes('work')) {
      return pickNonRepeating(histKey, [
        "I direct commercial infrastructure ventures across the district. I have dozens of legal titles under my name.",
      ]);
    }

    // STAGE 0: Initial Denial (Default proud defiance)
    return pickNonRepeating(histKey, [
      "I have nothing to hide from anyone. Varadarajan and I were rivals, but I settle my scores in front of a magistrate.",
      "If you want to find who killed Varadarajan, stop harassing honest businessmen and look at who stood to inherit his properties!",
      "Ask your questions quickly. I have appointments with my advocates in the morning.",
    ]);
  }

  return "I have answered your questions truthfully, Inspector.";
}

// Resilient Multi-Model Gemini Interrogation Function
// Handles quota exhaustion, rate limits, and model overload with automatic fast fallback
const GEMINI_CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
const modelCooldownMap = new Map<string, number>();

async function generateSuspectAIResponse(
  suspectId: string,
  historyItems: Array<{ role: string; parts: Array<{ text: string }> }>,
  userMessage: string,
  userId: string
): Promise<string> {
  if (!ai) {
    return getSuspectFallbackReply(suspectId, userMessage, userId);
  }

  const stage = getSuspectStage(userId, suspectId);
  const now = Date.now();
  // Filter models that are not currently under quota or 503 cooldown
  const activeCandidates = GEMINI_CANDIDATE_MODELS.filter(
    m => !modelCooldownMap.has(m) || now > (modelCooldownMap.get(m) || 0)
  );

  const modelsToTry = activeCandidates.length > 0 ? activeCandidates : ['gemini-3.1-flash-lite'];

  const stagePrompt = `\nINTERROGATION RESISTANCE & ANTI-SPOILER GUARDRAIL:
- NEVER reveal the culprit or confess on early questions.
- If the detective directly asks "Who did it?", "Are you the killer?", "Did you kill him?", or "Tell me the answer", DO NOT CONFESS. Deny it indignantly in character and challenge them to present proof.
CURRENT CONVERSATION RESISTANCE STAGE: Stage ${stage} of 3.
${stage === 0 ? 'Stage 0 (Initial Denial): Be composed, polite, normal, and deny any knowledge of the crime.' : ''}
${stage === 1 ? 'Stage 1 (Defensive Answers): Be guarded, defensive, question the interrogator, deflect toward other suspects.' : ''}
${stage === 2 ? 'Stage 2 (Partial Information): Under pressure, show tension, admit only minor partial facts and slip hints.' : ''}
${stage === 3 ? 'Stage 3 (Critical Confession / Revelation): Breaking point reached! Confess your specific truth or provide full official proof.' : ''}`;

  for (const model of modelsToTry) {
    try {
      // 4-second hard timeout per candidate to keep UI fast and prevent gateway timeouts
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out')), 4000)
      );

      const generatePromise = (async () => {
        const response = await ai.models.generateContent({
          model,
          contents: historyItems,
          config: {
            systemInstruction: (SUSPECT_SYSTEM_PROMPTS[suspectId] || SUSPECT_SYSTEM_PROMPTS.vicky) + stagePrompt,
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        });
        return response.text?.trim() || null;
      })();

      const text = await Promise.race([generatePromise, timeoutPromise]);
      if (text) {
        return text;
      }
    } catch (err: any) {
      const errMsg = String(err?.message || err).toLowerCase();
      const isQuotaOrOverload =
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('429') ||
        errMsg.includes('503') ||
        errMsg.includes('unavailable') ||
        errMsg.includes('demand') ||
        errMsg.includes('quota') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('timed out') ||
        errMsg.includes('exceeded');

      if (isQuotaOrOverload) {
        modelCooldownMap.set(model, now + 5 * 60 * 1000);
        console.warn(`[Gemini API] Model "${model}" temporarily unavailable (${errMsg.slice(0, 70)}). Cooling down for 5m.`);
      } else {
        console.warn(`[Gemini API] Model "${model}" error: ${errMsg.slice(0, 70)}. Falling back.`);
      }
    }
  }

  // Graceful instantaneous fallback to dynamic multi-stage dialogue engine
  console.log(`[Dialogue Engine] Serving dynamic multi-stage script engine response for ${suspectId} (Stage ${stage}).`);
  return getSuspectFallbackReply(suspectId, userMessage, userId);
}

// Suspect Interrogation Endpoint
app.post('/api/player/chat', async (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'PLAYER') {
    return res.status(403).json({ error: 'Player authorization required' });
  }

  // Auto-activate event when players interrogate suspects to ensure seamless gameplay
  if (db.event.status === 'NOT_STARTED') {
    db.event.status = 'LIVE';
    if (!db.event.startTime) {
      db.event.startTime = Date.now();
      db.event.timeRemaining = (db.event.duration || 60) * 60;
    }
    saveDatabase();
    broadcast({ type: 'event_updated', data: db.event });
  }

  const { suspectId, message } = req.body;
  if (!suspectId || !message) {
    return res.status(400).json({ error: 'Valid suspectId and message are required' });
  }

  const validSuspects = ['vicky', 'perumal', 'meena', 'rangan', 'arjun', 'kamatchi', 'divya'];
  if (!validSuspects.includes(suspectId)) {
    return res.status(400).json({ error: 'Unknown suspect' });
  }

  try {
    let progress = db.playerProgress[user.id];
    if (!progress) {
      progress = {
        playerId: user.id,
        playerName: user.name,
        username: user.username,
        loginStatus: 'Online',
        accountStatus: 'Active',
        investigationStatus: 'Investigating',
        suspectsInvestigated: [],
        questionsAsked: 0,
        cluesFound: [],
        progressPercentage: 0,
        notes: '',
        accusation: null,
        completed: false,
        lastActivity: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      db.playerProgress[user.id] = progress;
    }

    // Update investigation status
    if (progress.investigationStatus === 'Not Started') {
      progress.investigationStatus = 'Investigating';
    }

    if (!progress.suspectsInvestigated.includes(suspectId)) {
      progress.suspectsInvestigated.push(suspectId);
    }
    progress.questionsAsked += 1;
    progress.lastActivity = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Init chat logs
    if (!db.chatLogs[user.id]) {
      db.chatLogs[user.id] = {};
    }
    if (!db.chatLogs[user.id][suspectId]) {
      db.chatLogs[user.id][suspectId] = [];
    }

    const userMsgId = 'msg_' + Date.now();
    const playerMsg: DbChatMessage = {
      id: userMsgId,
      suspectId: suspectId as any,
      sender: 'player',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    db.chatLogs[user.id][suspectId].push(playerMsg);

    // Prepare recent history for AI
    const historyItems = db.chatLogs[user.id][suspectId].slice(-6).map(m => ({
      role: m.sender === 'player' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // Fetch response with resilient multi-model and fallback
    let replyText: string;
    try {
      replyText = await generateSuspectAIResponse(suspectId, historyItems, message, user.id);
    } catch {
      replyText = getSuspectFallbackReply(suspectId, message, user.id);
    }

    // Check if a clue is discovered from this interaction (only if suspect reveals it at stage >= 2)
    const currentConvStage = getSuspectStage(user.id, suspectId);
    const discoveredClueId = detectClueDiscovery(suspectId, message, replyText, currentConvStage);
    let isNewClue = false;
    if (discoveredClueId && !progress.cluesFound.includes(discoveredClueId)) {
      progress.cluesFound.push(discoveredClueId);
      isNewClue = true;
    }

    // Recalculate progress percentage
    // 4 suspects (10% each = 40%), clues (up to 40%), accusation (20%)
    const suspectsScore = Math.min(40, progress.suspectsInvestigated.length * 10);
    const cluesScore = Math.min(40, progress.cluesFound.length * 8);
    const accusationScore = progress.accusation ? 20 : 0;
    progress.progressPercentage = Math.min(100, suspectsScore + cluesScore + accusationScore);

    const suspectMsg: DbChatMessage = {
      id: 'msg_' + (Date.now() + 1),
      suspectId: suspectId as any,
      sender: 'suspect',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      discoveredClueId: isNewClue ? discoveredClueId : undefined,
      conversationStage: getSuspectStage(user.id, suspectId),
    };
    db.chatLogs[user.id][suspectId].push(suspectMsg);

    saveDatabase();

    // Broadcast player update to Admin
    broadcast({
      type: 'players_updated',
      data: Object.values(db.playerProgress),
    });

    return res.json({
      reply: replyText,
      discoveredClueId: isNewClue ? discoveredClueId : undefined,
      conversationStage: getSuspectStage(user.id, suspectId),
      progress,
    });
  } catch (criticalErr) {
    console.error('[Critical Chat Error Handler]', criticalErr);
    const fallbackText = getSuspectFallbackReply(suspectId, message, user.id);
    return res.json({
      reply: fallbackText,
      conversationStage: getSuspectStage(user.id, suspectId),
      progress: db.playerProgress[user.id] || null,
    });
  }
});

// Get Chat History for a Suspect
app.get('/api/player/chat/:suspectId', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'PLAYER') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { suspectId } = req.params;
  const history = db.chatLogs[user.id]?.[suspectId] || [];
  return res.json({ history, conversationStage: getSuspectStage(user.id, suspectId) });
});

// Save Detective Notes
app.post('/api/player/notes', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'PLAYER') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (db.event.status === 'ENDED') {
    return res.status(403).json({ error: 'Investigation has concluded. Notes are locked.' });
  }

  const { notes } = req.body;
  const progress = db.playerProgress[user.id];
  if (progress) {
    progress.notes = String(notes || '');
    progress.lastActivity = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    saveDatabase();
    broadcast({
      type: 'players_updated',
      data: Object.values(db.playerProgress),
    });
  }
  return res.json({ success: true, notes: progress?.notes });
});

// Submit Accusation & Automatically Generate Multi-Criteria Score (Displayed Exclusively in Admin Page)
app.post('/api/player/accusation', async (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'PLAYER') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // If event is not started yet, auto-activate it
  if (db.event.status === 'NOT_STARTED') {
    db.event.status = 'LIVE';
    if (!db.event.startTime) {
      db.event.startTime = Date.now();
      db.event.timeRemaining = (db.event.duration || 60) * 60;
    }
    saveDatabase();
    broadcast({ type: 'event_updated', data: db.event });
  }

  const { suspect, motive, evidence } = req.body;
  if (!suspect || !motive) {
    return res.status(400).json({ error: 'Suspect and motive are required' });
  }

  const progress = db.playerProgress[user.id];
  if (!progress) {
    return res.status(404).json({ error: 'Player progress record not found' });
  }

  progress.accusation = {
    suspect,
    motive,
    evidence: Array.isArray(evidence) ? evidence : [],
    submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  progress.completed = true;
  progress.investigationStatus = 'Completed';
  progress.progressPercentage = 100;
  progress.lastActivity = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Gather questions asked from chat logs
  const playerChats = db.chatLogs[user.id] || {};
  const questionsList: string[] = [];
  Object.values(playerChats).forEach(msgs => {
    msgs.forEach(m => {
      if (m.sender === 'player') questionsList.push(m.text);
    });
  });

  const rawPlayer = {
    playerId: user.id,
    playerName: user.name,
    username: user.username,
    loginTime: progress.loginTime,
    investigationStatus: progress.investigationStatus,
    suspectsInvestigated: progress.suspectsInvestigated,
    questionsAsked: progress.questionsAsked,
    cluesFound: progress.cluesFound,
    notes: progress.notes || '',
    accusation: progress.accusation,
    completed: true,
    lastActivity: progress.lastActivity,
    questionsList,
  };

  // Evaluate single player using multi-criteria evaluation engine
  try {
    const report = await evaluateSinglePlayer(
      rawPlayer,
      db.event.startTime,
      Date.now(),
      db.event.duration || 60,
      db.caseConfig.answerKey,
      db.caseConfig.clueWeights,
      db.caseConfig.rubric,
      ai || undefined
    );

    // Save evaluation report (accessible strictly in admin page)
    if (!db.evaluationState.reports) db.evaluationState.reports = {};
    db.evaluationState.reports[user.id] = report;
    progress.score = report.finalScore;
    progress.accuracyPercentage = report.accuracyPercentage;
    progress.scoreBreakdown = report.scoreBreakdown;

    // Recalculate leaderboard & stats
    const evaluatedReports = db.evaluationState.reports;
    const evaluatedCount = Object.keys(evaluatedReports).length;
    const scores = Object.values(evaluatedReports).map(r => r.finalScore);
    const accuracies = Object.values(evaluatedReports).map(r => r.accuracyPercentage);

    db.evaluationState.playersEvaluated = evaluatedCount;
    db.evaluationState.playersPending = Math.max(0, Object.keys(db.playerProgress).length - evaluatedCount);
    db.evaluationState.averageScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    db.evaluationState.averageAccuracy = accuracies.length > 0 ? Math.round((accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 10) / 10 : 0;
    db.evaluationState.leaderboard = generateLeaderboard(evaluatedReports);

    saveDatabase();

    // Broadcast updated evaluation to Admin Console
    broadcast({
      type: 'evaluation_updated',
      data: db.evaluationState,
    });
  } catch (evalErr) {
    console.error('[Score Generation Error upon submission]:', evalErr);
    saveDatabase();
  }

  broadcast({
    type: 'players_updated',
    data: Object.values(db.playerProgress),
  });

  // IMPORTANT: The generated score is restricted to the admin page only.
  // The player receives confirmation of submission, but NOT their score or criteria breakdown.
  const playerSafeProgress = {
    ...progress,
    score: undefined,
    scoreBreakdown: undefined,
    accuracyPercentage: undefined,
  };

  return res.json({
    success: true,
    message: 'Official charge-sheet and evidence successfully submitted. Case dossier locked and transmitted for administrator evaluation.',
    progress: playerSafeProgress,
  });
});

// ==========================================
// VITE DEV SERVER / PRODUCTION SERVING
// ==========================================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[THE HIDDEN MYSTERY] Server running at http://0.0.0.0:${PORT} (${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer();
