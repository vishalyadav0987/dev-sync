import fs from 'fs';
import { prisma } from './src/lib/prisma.js';

const html = fs.readFileSync('sudoku_viz.html', 'utf8');

const cppCode = `class Solution {
public:
    bool isSafe(vector<vector<char>>& board, int row, int col, char dig){
        // horizontal checking
        for(int j=0; j<9; j++){
            if(board[row][j] == dig){
                return false;
            }
        }

        // vertically checking
        for(int i=0; i<9; i++){
            if(board[i][col] == dig){
                return false;
            }
        }

        int stRow = (row/3) * 3;
        int stCol = (col/3) * 3;

        for(int sr=stRow; sr<=stRow+2; sr++){
            for(int sc=stCol; sc<=stCol+2; sc++){
                if(board[sr][sc] == dig){
                    return false;
                }
            }
        }
        return true;
    }

    bool solve(vector<vector<char>>& board, int row, int col) {
        if (row == 9) {
            return true;
        }

        int nextRow = row, nextCol = col + 1;
        if (col == 9) {
            nextRow = row + 1;
            nextCol = 0;
        }

        if (board[row][col] != '.') {
            return solve(board, nextRow, nextCol);
        }

        for (char dig = '1'; dig <= '9'; dig++) {
            if (isSafe(board, row, col, dig)) {
                board[row][col] = dig;
                if(solve(board, nextRow, nextCol)){
                    return true;
                }
                board[row][col] = '.'; // backtrack
            }
        }
        return false;
    }
};`;

const data = {
  title: 'Sudoku Solver',
  slug: 'sudoku-solver',
  statement: 'Write a program to solve a Sudoku puzzle by filling the empty cells. A sudoku solution must satisfy all of the following rules:\n1. Each of the digits 1-9 must occur exactly once in each row.\n2. Each of the digits 1-9 must occur exactly once in each column.\n3. Each of the digits 1-9 must occur exactly once in each of the 9 3x3 sub-boxes of the grid.',
  difficulty: 'HARD',
  tags: ['backtracking', 'recursion'],
  cppCode: cppCode,
  timeComplexity: 'O(9^(n*n))',
  spaceComplexity: 'O(n*n)',
  edgeCases: ['Empty board', 'Already solved board'],
  approachNotes: 'Use backtracking. For each empty cell, try placing digits 1-9. Check if it is safe to place the digit. If it is safe, move to the next cell. If no digit can be placed, backtrack and try a different digit for the previous cell.',
  visualHtml: html,
  categoryId: 'e9934255-12ca-47a8-a951-fb89a6942fd3',
  isPublished: true
};

prisma.problem.upsert({
  where: { slug: 'sudoku-solver' },
  update: { ...data },
  create: { ...data }
}).then(p => {
  console.log('Inserted:', p.title);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
