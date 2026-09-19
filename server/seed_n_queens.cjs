const fs = require('fs');
const path = require('path');

async function seed() {
  const token = 'set-a-long-random-secret-here';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    'x-guest-id': '12345678-1234-1234-1234-123456789012'
  };

  // 1. Create category
  const catRes = await fetch('http://127.0.0.1:4000/api/admin/categories', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Backtracking', order: 1 })
  });
  const catData = await catRes.json();
  console.log('Category created:', catData);

  // 2. Read HTML and escape it into an iframe (or just use raw since we extract it now)
  const rawHtml = fs.readFileSync(path.join(__dirname, 'nqueens.html'), 'utf8');

  // 3. Create problem
  const problemPayload = {
    title: "N-Queens",
    statement: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.\n\nGiven an integer n, return all distinct solutions to the n-queens puzzle.",
    difficulty: "HARD",
    tags: ["backtracking", "recursion"],
    cppCode: `bool isSafe(vector<string> &board, int row, int col, int n) {
    // vertical check
    for(int i=0; i<row; i++) {
        if(board[i][col] == 'Q') return false;
    }
    // left diagonal
    for(int i=row-1, j=col-1; i>=0 && j>=0; i--, j--) {
        if(board[i][j] == 'Q') return false;
    }
    // right diagonal
    for(int i=row-1, j=col+1; i>=0 && j<n; i--, j++) {
        if(board[i][j] == 'Q') return false;
    }
    return true;
}

void nQueens(vector<string> &board, int row, int n, vector<vector<string>> &ans) {
    if(row == n) {
        ans.push_back(board);
        return;
    }
    for(int j=0; j<n; j++) {
        if(isSafe(board, row, j, n)) {
            board[row][j] = 'Q';
            nQueens(board, row+1, n, ans);
            board[row][j] = '.'; // Backtrack
        }
    }
}`,
    timeComplexity: "O(N!)",
    spaceComplexity: "O(N^2)",
    edgeCases: ["n = 1", "n = 2 (no solution)", "n = 3 (no solution)"],
    approachNotes: "We use backtracking to place queens row by row, checking for safety in the same column, left diagonal, and right diagonal.",
    visualHtml: rawHtml,
    categoryId: catData.id
  };

  const probRes = await fetch('http://127.0.0.1:4000/api/admin/problems', {
    method: 'POST',
    headers,
    body: JSON.stringify(problemPayload)
  });
  const probData = await probRes.json();
  console.log('Problem created:', probData.title, probData.id);
}

seed().catch(console.error);
