import { BoardGrid, Piece, PieceColor, PieceType, Position, Move } from '../types/chess';

// Standard Chinese piece names
export const PIECE_NAMES: Record<PieceColor, Record<PieceType, string>> = {
  red: {
    k: '帅',
    a: '仕',
    b: '相',
    n: '傌',
    r: '俥',
    c: '炮',
    p: '兵',
  },
  black: {
    k: '将',
    a: '士',
    b: '象',
    n: '馬',
    r: '車',
    c: '砲',
    p: '卒',
  },
};

export const CHINESE_NUMS_RED = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
export const CHINESE_NUMS_BLACK = ['１', '２', '３', '４', '５', '６', '７', '８', '９'];

/**
 * Creates the starting 10x9 board layout
 */
export function createInitialBoard(): BoardGrid {
  const board: BoardGrid = Array(10)
    .fill(null)
    .map(() => Array(9).fill(null));

  // Helper to place piece
  const setPiece = (r: number, c: number, type: PieceType, color: PieceColor, index: number) => {
    board[r][c] = {
      id: `${color}_${type}_${index}_${r}_${c}`,
      type,
      color,
    };
  };

  // Black pieces (Row 0..3)
  const backRowBlack: PieceType[] = ['r', 'n', 'b', 'a', 'k', 'a', 'b', 'n', 'r'];
  backRowBlack.forEach((type, col) => setPiece(0, col, type, 'black', col));
  setPiece(2, 1, 'c', 'black', 1);
  setPiece(2, 7, 'c', 'black', 2);
  [0, 2, 4, 6, 8].forEach((col, idx) => setPiece(3, col, 'p', 'black', idx));

  // Red pieces (Row 6..9)
  const backRowRed: PieceType[] = ['r', 'n', 'b', 'a', 'k', 'a', 'b', 'n', 'r'];
  backRowRed.forEach((type, col) => setPiece(9, col, type, 'red', col));
  setPiece(7, 1, 'c', 'red', 1);
  setPiece(7, 7, 'c', 'red', 2);
  [0, 2, 4, 6, 8].forEach((col, idx) => setPiece(6, col, 'p', 'red', idx));

  return board;
}

export function cloneBoard(board: BoardGrid): BoardGrid {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

/**
 * Check if king coords are within the Palace (九宫格)
 */
export function isInPalace(r: number, c: number, color: PieceColor): boolean {
  if (c < 3 || c > 5) return false;
  if (color === 'black') {
    return r >= 0 && r <= 2;
  } else {
    return r >= 7 && r <= 9;
  }
}

/**
 * Find King/General coordinates
 */
export function findKing(board: BoardGrid, color: PieceColor): Position | null {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color && piece.type === 'k') {
        return { r, c };
      }
    }
  }
  return null;
}

/**
 * Rule: Flying General (飞将 / 对脸将)
 * The two kings cannot be on the same column without any intervening piece.
 */
export function areKingsFacing(board: BoardGrid): boolean {
  const redKing = findKing(board, 'red');
  const blackKing = findKing(board, 'black');
  if (!redKing || !blackKing) return false;
  if (redKing.c !== blackKing.c) return false;

  const col = redKing.c;
  const minR = Math.min(redKing.r, blackKing.r);
  const maxR = Math.max(redKing.r, blackKing.r);

  for (let r = minR + 1; r < maxR; r++) {
    if (board[r][col] !== null) {
      return false; // Intervening piece found
    }
  }
  return true; // Kings are directly facing each other!
}

/**
 * Generates pseudo-legal candidate target squares for a piece (ignoring check)
 */
export function getPseudoLegalMoves(board: BoardGrid, pos: Position): Position[] {
  const piece = board[pos.r][pos.c];
  if (!piece) return [];
  const { type, color } = piece;
  const { r, c } = pos;
  const moves: Position[] = [];

  const addIfValid = (nr: number, nc: number) => {
    if (nr < 0 || nr > 9 || nc < 0 || nc > 8) return;
    const target = board[nr][nc];
    if (!target || target.color !== color) {
      moves.push({ r: nr, c: nc });
    }
  };

  switch (type) {
    case 'k': {
      // King: 1 step orthogonal within palace
      const deltas = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ];
      for (const [dr, dc] of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (isInPalace(nr, nc, color)) {
          addIfValid(nr, nc);
        }
      }
      break;
    }

    case 'a': {
      // Advisor: 1 step diagonal within palace
      const deltas = [
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ];
      for (const [dr, dc] of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (isInPalace(nr, nc, color)) {
          addIfValid(nr, nc);
        }
      }
      break;
    }

    case 'b': {
      // Elephant: 2 squares diagonally, cannot cross river, eye of elephant must be clear
      const deltas = [
        [-2, -2, -1, -1],
        [-2, 2, -1, 1],
        [2, -2, 1, -1],
        [2, 2, 1, 1],
      ];
      for (const [dr, dc, eyeR, eyeC] of deltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr > 9 || nc < 0 || nc > 8) continue;

        // River restriction: Red stays in r: 5..9, Black stays in r: 0..4
        if (color === 'red' && nr < 5) continue;
        if (color === 'black' && nr > 4) continue;

        // Eye of elephant (塞象眼) check
        if (board[r + eyeR][c + eyeC] === null) {
          addIfValid(nr, nc);
        }
      }
      break;
    }

    case 'n': {
      // Horse: moves in L-shape, blocked if horse leg is obstructed (蹩马腿)
      // [stepR, stepC, legR, legC]
      const horseMoves = [
        [-2, -1, -1, 0],
        [-2, 1, -1, 0],
        [2, -1, 1, 0],
        [2, 1, 1, 0],
        [-1, -2, 0, -1],
        [1, -2, 0, -1],
        [-1, 2, 0, 1],
        [1, 2, 0, 1],
      ];
      for (const [dr, dc, legDr, legDc] of horseMoves) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr > 9 || nc < 0 || nc > 8) continue;

        // Horse leg must be free
        if (board[r + legDr][c + legDc] === null) {
          addIfValid(nr, nc);
        }
      }
      break;
    }

    case 'r': {
      // Chariot: straight line in 4 directions
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          const target = board[nr][nc];
          if (target === null) {
            moves.push({ r: nr, c: nc });
          } else {
            if (target.color !== color) {
              moves.push({ r: nr, c: nc });
            }
            break; // Ray blocked
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'c': {
      // Cannon: moves like rook when empty; captures by jumping over exactly 1 piece
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        let jumped = false;
        while (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8) {
          const target = board[nr][nc];
          if (!jumped) {
            if (target === null) {
              moves.push({ r: nr, c: nc });
            } else {
              jumped = true; // First piece encountered acts as screen
            }
          } else {
            // Already jumped over 1 screen piece
            if (target !== null) {
              if (target.color !== color) {
                moves.push({ r: nr, c: nc }); // Capture enemy piece
              }
              break; // Cannot jump past a second piece
            }
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'p': {
      // Soldier/Pawn
      const isRed = color === 'red';
      const forward = isRed ? -1 : 1;
      const crossedRiver = isRed ? r <= 4 : r >= 5;

      // Forward step
      addIfValid(r + forward, c);

      // Horizontal steps after crossing river
      if (crossedRiver) {
        addIfValid(r, c - 1);
        addIfValid(r, c + 1);
      }
      break;
    }
  }

  return moves;
}

/**
 * Check if the given color is currently in check
 */
export function isCheck(board: BoardGrid, color: PieceColor): boolean {
  // If kings are facing directly, both are in invalid/check state
  if (areKingsFacing(board)) {
    return true;
  }

  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const opponentColor: PieceColor = color === 'red' ? 'black' : 'red';

  // Check if any opponent piece can attack kingPos
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponentColor) {
        const attackedSquares = getPseudoLegalMoves(board, { r, c });
        if (attackedSquares.some(pos => pos.r === kingPos.r && pos.c === kingPos.c)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get all strictly LEGAL moves for a piece at pos (filters out self-check and flying general)
 */
export function getLegalMoves(board: BoardGrid, pos: Position): Position[] {
  const piece = board[pos.r][pos.c];
  if (!piece) return [];

  const pseudoMoves = getPseudoLegalMoves(board, pos);
  const legalMoves: Position[] = [];

  for (const target of pseudoMoves) {
    // Simulate move
    const testBoard = cloneBoard(board);
    testBoard[target.r][target.c] = testBoard[pos.r][pos.c];
    testBoard[pos.r][pos.c] = null;

    // Must not result in flying general or check on own king
    if (!areKingsFacing(testBoard) && !isCheck(testBoard, piece.color)) {
      legalMoves.push(target);
    }
  }

  return legalMoves;
}

/**
 * Check if player of `color` has any legal moves available
 */
export function hasAnyLegalMoves(board: BoardGrid, color: PieceColor): boolean {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { r, c });
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

/**
 * Converts a move to Traditional Chinese Xiangqi notation
 * (e.g. 炮二平五, 马８进７, 车一进一, 兵七进一)
 */
export function toChineseNotation(boardBefore: BoardGrid, from: Position, to: Position): string {
  const piece = boardBefore[from.r][from.c];
  if (!piece) return '未知步';

  const { color, type } = piece;
  const isRed = color === 'red';
  const pieceChar = PIECE_NAMES[color][type];

  // Column numbers in traditional Xiangqi:
  // Red side: col 0 is '九', col 8 is '一'
  // Black side: col 0 is '１', col 8 is '９'
  const getColChar = (c: number): string => {
    return isRed ? CHINESE_NUMS_RED[c] : CHINESE_NUMS_BLACK[c];
  };

  const fromColChar = getColChar(from.c);
  const toColChar = getColChar(to.c);

  // Check for duplicate pieces of the same type in the same file (e.g., 前炮 / 后炮, 前车 / 后车)
  let prefix = '';
  if (['r', 'c', 'n', 'p'].includes(type)) {
    const sameFilePieces: { r: number; c: number }[] = [];
    for (let r = 0; r < 10; r++) {
      const p = boardBefore[r][from.c];
      if (p && p.color === color && p.type === type) {
        sameFilePieces.push({ r, c: from.c });
      }
    }

    if (sameFilePieces.length === 2) {
      sameFilePieces.sort((a, b) => a.r - b.r);
      const isTop = from.r === sameFilePieces[0].r;
      // In Red view, smaller row index is "Front" (closer to enemy), larger row index is "Rear"
      if (isRed) {
        prefix = isTop ? '前' : '后';
      } else {
        // In Black view, larger row index is "Front" (closer to enemy), smaller is "Rear"
        prefix = isTop ? '后' : '前';
      }
    }
  }

  let action = '';
  let distanceOrCol = '';

  const dr = to.r - from.r;
  const dc = to.c - from.c;

  // For straight/diagonal moves:
  // '进' (advance) moves forward (Red r decreases, Black r increases)
  // '退' (retreat) moves backward (Red r increases, Black r decreases)
  // '平' (traverse) moves horizontally
  const isAdvance = isRed ? dr < 0 : dr > 0;
  const isRetreat = isRed ? dr > 0 : dr < 0;

  if (dr === 0) {
    action = '平';
    distanceOrCol = toColChar;
  } else if (['r', 'c', 'p', 'k'].includes(type)) {
    // For pieces moving in straight lines: step count is used for 进/退
    action = isAdvance ? '进' : '退';
    const steps = Math.abs(dr);
    distanceOrCol = isRed ? CHINESE_NUMS_RED[9 - steps] : CHINESE_NUMS_BLACK[steps - 1];
  } else {
    // For diagonal pieces (Horse, Advisor, Elephant): destination column is used for 进/退
    action = isAdvance ? '进' : '退';
    distanceOrCol = toColChar;
  }

  if (prefix) {
    return `${prefix}${pieceChar}${action}${distanceOrCol}`;
  } else {
    return `${pieceChar}${fromColChar}${action}${distanceOrCol}`;
  }
}

/**
 * Converts a move to standard ICCS algebraic notation (e.g. h2e2)
 */
export function toICCSNotation(from: Position, to: Position): string {
  const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
  const fromStr = `${cols[from.c]}${9 - from.r}`;
  const toStr = `${cols[to.c]}${9 - to.r}`;
  return `${fromStr}${toStr}`;
}

/**
 * Serializes board state to standard Xiangqi FEN string
 */
export function boardToFEN(board: BoardGrid, activeColor: PieceColor = 'red'): string {
  const rows: string[] = [];
  for (let r = 0; r < 10; r++) {
    let emptyCount = 0;
    let rowStr = '';
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        const char = p.color === 'red' ? p.type.toUpperCase() : p.type.toLowerCase();
        rowStr += char;
      }
    }
    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    rows.push(rowStr);
  }

  return `${rows.join('/')} ${activeColor === 'red' ? 'w' : 'b'} - - 0 1`;
}

/**
 * Generates standard PGN text format for Chinese Chess
 */
export function exportToPGN(
  moves: Move[],
  redPlayer: string,
  blackPlayer: string,
  result: string,
  eventName: string = '中国象棋天梯排位赛'
): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  let pgn = `[Event "${eventName}"]\n`;
  pgn += `[Site "楚汉争雄象棋对弈平台"]\n`;
  pgn += `[Date "${dateStr}"]\n`;
  pgn += `[Red "${redPlayer}"]\n`;
  pgn += `[Black "${blackPlayer}"]\n`;
  pgn += `[Result "${result}"]\n\n`;

  // Moves formatting
  let moveIndex = 1;
  for (let i = 0; i < moves.length; i += 2) {
    const redMove = moves[i];
    const blackMove = moves[i + 1];
    if (blackMove) {
      pgn += `${moveIndex}. ${redMove.notation} ${blackMove.notation}  `;
    } else {
      pgn += `${moveIndex}. ${redMove.notation}  `;
    }
    if (moveIndex % 4 === 0) pgn += '\n';
    moveIndex++;
  }

  pgn += `\n${result}\n`;
  return pgn;
}
