import { Player, MatchRecord } from '../types/chess';
import { getTierTitleByRating } from './aiJudge';

export const ADMIN_PASSWORD = 'chessadmin123';

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p_1',
    name: '王天一',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 2180,
    highestRating: 2210,
    matchesPlayed: 45,
    wins: 35,
    losses: 4,
    draws: 6,
    tierTitle: '特级大师',
    createdAt: Date.now() - 86400000 * 30,
    note: '等级分第一人，外号“外星人”，残局功力深厚。',
  },
  {
    id: 'p_2',
    name: '郑惟桐',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 2150,
    highestRating: 2165,
    matchesPlayed: 42,
    wins: 31,
    losses: 5,
    draws: 6,
    tierTitle: '特级大师',
    createdAt: Date.now() - 86400000 * 28,
    note: '“蜀山少侠”，布局精密如飞刀，算度精准。',
  },
  {
    id: 'p_3',
    name: '许银川',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 2110,
    highestRating: 2190,
    matchesPlayed: 50,
    wins: 36,
    losses: 5,
    draws: 9,
    tierTitle: '特级大师',
    createdAt: Date.now() - 86400000 * 40,
    note: '“许仙”，六届全国冠军，“半壁江山”，残棋圣手。',
  },
  {
    id: 'p_4',
    name: '蒋川',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    rating: 1980,
    highestRating: 2040,
    matchesPlayed: 38,
    wins: 25,
    losses: 8,
    draws: 5,
    tierTitle: '国家大师',
    createdAt: Date.now() - 86400000 * 20,
    note: '盲棋吉尼斯世界纪录保持者，攻杀凶悍凌厉。',
  },
  {
    id: 'p_5',
    name: '赵鑫鑫',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    rating: 1940,
    highestRating: 1995,
    matchesPlayed: 36,
    wins: 23,
    losses: 9,
    draws: 4,
    tierTitle: '国家大师',
    createdAt: Date.now() - 86400000 * 18,
    note: '“六脉神剑”，善用双炮弃子抢攻，气势恢宏。',
  },
  {
    id: 'p_6',
    name: '孟辰',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    rating: 1890,
    highestRating: 1920,
    matchesPlayed: 29,
    wins: 18,
    losses: 7,
    draws: 4,
    tierTitle: '国家大师',
    createdAt: Date.now() - 86400000 * 15,
    note: '棋风剽悍，中局力量巨大，胜负感极强。',
  },
  {
    id: 'p_7',
    name: '洪智',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rating: 1820,
    highestRating: 1880,
    matchesPlayed: 30,
    wins: 17,
    losses: 9,
    draws: 4,
    tierTitle: '棋协大师',
    createdAt: Date.now() - 86400000 * 12,
    note: '“乱战天王”，乱中取胜能力首屈一指。',
  },
  {
    id: 'p_8',
    name: '孙勇征',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rating: 1760,
    highestRating: 1800,
    matchesPlayed: 26,
    wins: 14,
    losses: 8,
    draws: 4,
    tierTitle: '棋协大师',
    createdAt: Date.now() - 86400000 * 10,
    note: '“棋天大圣”，上海名将，棋风稳健细腻。',
  },
];

const STORAGE_KEYS = {
  PLAYERS: 'xiangqi_players_v1',
  MATCHES: 'xiangqi_matches_v1',
  IS_ADMIN: 'xiangqi_is_admin',
};

// Memory cache for synchronous calls
let cachedPlayers: Player[] = INITIAL_PLAYERS;
let cachedMatches: MatchRecord[] = [];

// Initialize memory cache from localStorage
if (typeof window !== 'undefined') {
  try {
    const rawP = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (rawP) cachedPlayers = JSON.parse(rawP);
    const rawM = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (rawM) cachedMatches = JSON.parse(rawM);
  } catch {
    // Ignore
  }
}

/**
 * Fetch players from server and update local cache
 */
export async function syncPlayersFromServer(): Promise<Player[]> {
  try {
    const res = await fetch('/api/players');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.players)) {
        cachedPlayers = data.players;
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(data.players));
        return data.players;
      }
    }
  } catch (err) {
    console.warn('Network fetch error, using local fallback:', err);
  }
  return getStoredPlayers();
}

/**
 * Fetch matches from server and update local cache
 */
export async function syncMatchesFromServer(): Promise<MatchRecord[]> {
  try {
    const res = await fetch('/api/matches');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        cachedMatches = data.matches;
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(data.matches));
        return data.matches;
      }
    }
  } catch (err) {
    console.warn('Network fetch matches error, using local fallback:', err);
  }
  return getStoredMatches();
}

export function getStoredPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (raw) {
      cachedPlayers = JSON.parse(raw);
      return cachedPlayers;
    }
  } catch {
    // Ignore
  }
  return cachedPlayers;
}

export function savePlayers(players: Player[]): void {
  cachedPlayers = players;
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
}

export function findPlayerByName(name: string): Player | undefined {
  const players = getStoredPlayers();
  const trimmed = name.trim().toLowerCase();
  return players.find(p => p.name.trim().toLowerCase() === trimmed);
}

export async function addMemberAsync(name: string, rating: number = 1500, note?: string): Promise<{ success: boolean; message: string; player?: Player }> {
  const existing = findPlayerByName(name);
  if (existing) {
    return { success: false, message: `成员「${name}」已存在，无需重复添加！` };
  }

  // Send to server
  try {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD,
      },
      body: JSON.stringify({ name, rating, note }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      await syncPlayersFromServer();
      return { success: true, message: data.message, player: data.player };
    } else {
      return { success: false, message: data.message || '添加失败' };
    }
  } catch {
    // Local fallback
    const players = getStoredPlayers();
    const { title } = getTierTitleByRating(rating);
    const newPlayer: Player = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      rating,
      highestRating: rating,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      tierTitle: title,
      createdAt: Date.now(),
      note: note || '天梯新晋棋手',
    };
    players.push(newPlayer);
    savePlayers(players);
    return { success: true, message: `已在本地添加成员「${name}」`, player: newPlayer };
  }
}

export async function updateMemberAsync(playerId: string, updates: Partial<Player>): Promise<boolean> {
  try {
    const res = await fetch(`/api/players/${playerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await syncPlayersFromServer();
      return true;
    }
  } catch (err) {
    console.warn('Update member server failed, fallback to local', err);
  }

  // Local fallback
  const players = getStoredPlayers();
  const idx = players.findIndex(p => p.id === playerId);
  if (idx === -1) return false;
  const current = players[idx];
  const updatedRating = updates.rating ?? current.rating;
  const { title } = getTierTitleByRating(updatedRating);
  players[idx] = {
    ...current,
    ...updates,
    tierTitle: title,
    highestRating: Math.max(current.highestRating, updatedRating),
  };
  savePlayers(players);
  return true;
}

export async function deleteMemberAsync(playerId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/players/${playerId}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': ADMIN_PASSWORD,
      },
    });
    if (res.ok) {
      await syncPlayersFromServer();
      return true;
    }
  } catch (err) {
    console.warn('Delete member server failed, fallback to local', err);
  }

  // Local fallback
  const players = getStoredPlayers();
  const filtered = players.filter(p => p.id !== playerId);
  if (filtered.length === players.length) return false;
  savePlayers(filtered);
  return true;
}

export function getStoredMatches(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (raw) {
      cachedMatches = JSON.parse(raw);
      return cachedMatches;
    }
  } catch {
    // Ignore
  }
  return cachedMatches;
}

export async function saveMatchRecordAsync(
  record: MatchRecord,
  playerUpdates?: { id: string; rating: number; matchesPlayed: number; wins: number; losses: number; draws: number }[]
): Promise<void> {
  // Update local memory & storage first
  const matches = getStoredMatches();
  matches.unshift(record);
  cachedMatches = matches;
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));

  // Sync to server so other admins see it!
  try {
    await fetch('/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': ADMIN_PASSWORD,
      },
      body: JSON.stringify({
        match: record,
        playerUpdates,
      }),
    });
    await syncPlayersFromServer();
    await syncMatchesFromServer();
  } catch (err) {
    console.warn('Match sync to server failed, stored locally:', err);
  }
}

export function getAdminStatus(): boolean {
  return localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
}

export function setAdminStatus(status: boolean): void {
  localStorage.setItem(STORAGE_KEYS.IS_ADMIN, String(status));
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const trimmed = password.trim();
  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: trimmed }),
    });
    if (res.ok) {
      setAdminStatus(true);
      return true;
    }
  } catch {
    // Local fallback
  }

  const isValid = trimmed === ADMIN_PASSWORD;
  if (isValid) {
    setAdminStatus(true);
  }
  return isValid;
}
