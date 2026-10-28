import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const ADMIN_PASSWORD = 'chessadmin123';
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'chess_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredData {
  players: any[];
  matches: any[];
  lastUpdated: number;
}

const INITIAL_PLAYERS = [
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

function readData(): StoredData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }

  // Fallback initial
  const defaultData: StoredData = {
    players: INITIAL_PLAYERS,
    matches: [],
    lastUpdated: Date.now(),
  };
  writeData(defaultData);
  return defaultData;
}

function writeData(data: StoredData): void {
  try {
    data.lastUpdated = Date.now();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

// Admin validation helper
function checkAdminAuth(req: Request, res: Response, next: () => void) {
  const pwd = req.headers['x-admin-password'] || req.body?.adminPassword;
  if (pwd !== ADMIN_PASSWORD) {
    res.status(403).json({ success: false, message: '管理员权限验证失败，密码错误！' });
    return;
  }
  next();
}

// API Routes
// 1. Verify admin password
app.post('/api/admin/verify', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: '验证通过' });
  } else {
    res.status(401).json({ success: false, message: '密码错误' });
  }
});

// 2. Get all players (public)
app.get('/api/players', (_req: Request, res: Response) => {
  const data = readData();
  res.json({ success: true, players: data.players, lastUpdated: data.lastUpdated });
});

// 3. Add new player (Admin only)
app.post('/api/players', checkAdminAuth, (req: Request, res: Response) => {
  const { name, rating, note } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ success: false, message: '选手姓名不能为空！' });
    return;
  }

  const data = readData();
  const trimmed = name.trim();
  const exists = data.players.some((p: any) => p.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    res.status(400).json({ success: false, message: `成员「${trimmed}」已在榜单中！` });
    return;
  }

  const initialRating = Number(rating) || 1500;
  let tierTitle = '初涉江湖';
  if (initialRating >= 2100) tierTitle = '特级大师';
  else if (initialRating >= 1900) tierTitle = '国家大师';
  else if (initialRating >= 1700) tierTitle = '棋协大师';
  else if (initialRating >= 1550) tierTitle = '业余豪强';
  else if (initialRating >= 1400) tierTitle = '江湖高手';

  const newPlayer = {
    id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmed,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmed)}`,
    rating: initialRating,
    highestRating: initialRating,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    tierTitle,
    createdAt: Date.now(),
    note: note?.trim() || '天梯新晋棋手',
  };

  data.players.push(newPlayer);
  writeData(data);
  res.json({ success: true, message: `成功添加成员「${trimmed}」！`, player: newPlayer });
});

// 4. Update player details/score (Admin only)
app.put('/api/players/:id', checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = readData();
  const idx = data.players.findIndex((p: any) => p.id === id);

  if (idx === -1) {
    res.status(404).json({ success: false, message: '未找到该成员' });
    return;
  }

  const current = data.players[idx];
  const updatedRating = updates.rating !== undefined ? Number(updates.rating) : current.rating;

  let tierTitle = current.tierTitle;
  if (updatedRating >= 2100) tierTitle = '特级大师';
  else if (updatedRating >= 1900) tierTitle = '国家大师';
  else if (updatedRating >= 1700) tierTitle = '棋协大师';
  else if (updatedRating >= 1550) tierTitle = '业余豪强';
  else if (updatedRating >= 1400) tierTitle = '江湖高手';
  else tierTitle = '初涉江湖';

  data.players[idx] = {
    ...current,
    ...updates,
    rating: updatedRating,
    tierTitle,
    highestRating: Math.max(current.highestRating, updatedRating),
  };

  writeData(data);
  res.json({ success: true, player: data.players[idx] });
});

// 5. Delete player (Admin only)
app.delete('/api/players/:id', checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const data = readData();
  const initialLen = data.players.length;
  data.players = data.players.filter((p: any) => p.id !== id);

  if (data.players.length === initialLen) {
    res.status(404).json({ success: false, message: '未找到该成员' });
    return;
  }

  writeData(data);
  res.json({ success: true, message: '成员已移除' });
});

// 6. Get all matches (public)
app.get('/api/matches', (_req: Request, res: Response) => {
  const data = readData();
  res.json({ success: true, matches: data.matches || [] });
});

// 7. Save match record and automatically update players (Admin only)
app.post('/api/matches', checkAdminAuth, (req: Request, res: Response) => {
  const { match, playerUpdates } = req.body;
  if (!match) {
    res.status(400).json({ success: false, message: '缺少比赛数据' });
    return;
  }

  const data = readData();
  if (!data.matches) data.matches = [];
  data.matches.unshift(match);

  // If match comes with updated player stats, apply them
  if (Array.isArray(playerUpdates)) {
    playerUpdates.forEach((pu: any) => {
      const idx = data.players.findIndex((p: any) => p.id === pu.id);
      if (idx !== -1) {
        const cur = data.players[idx];
        const newRating = pu.rating ?? cur.rating;

        let tierTitle = cur.tierTitle;
        if (newRating >= 2100) tierTitle = '特级大师';
        else if (newRating >= 1900) tierTitle = '国家大师';
        else if (newRating >= 1700) tierTitle = '棋协大师';
        else if (newRating >= 1550) tierTitle = '业余豪强';
        else if (newRating >= 1400) tierTitle = '江湖高手';
        else tierTitle = '初涉江湖';

        data.players[idx] = {
          ...cur,
          ...pu,
          tierTitle,
          highestRating: Math.max(cur.highestRating, newRating),
        };
      }
    });
  }

  writeData(data);
  res.json({ success: true, message: '对局结果与积分已同步保存到云端服务器！' });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
