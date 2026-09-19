import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function run() {
    try {
        console.log("Seeding manual questions with upsert...");

        // Categories
        const catBacktracking = await prisma.category.upsert({ 
            where: { slug: "backtracking" }, 
            update: {}, 
            create: { name: "Backtracking", slug: "backtracking", order: 1 } 
        });
        const catLinkedList = await prisma.category.upsert({ 
            where: { slug: "linked-list" }, 
            update: {}, 
            create: { name: "Linked List", slug: "linked-list", order: 2 } 
        });
        const catArrays = await prisma.category.upsert({ 
            where: { slug: "arrays" }, 
            update: {}, 
            create: { name: "Arrays", slug: "arrays", order: 3 } 
        });

        // N-Queens
        const rawNQueens = fs.readFileSync("/Users/vishalyadav/Downloads/dsa-portfolio-full/server/nqueens.html", "utf8");
        await prisma.problem.upsert({
            where: { slug: "n-queens" },
            update: { visualHtml: rawNQueens },
            create: {
                title: "N-Queens",
                slug: "n-queens",
                statement: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.\n\nGiven an integer n, return all distinct solutions to the n-queens puzzle.",
                difficulty: "HARD",
                tags: ["backtracking", "recursion"],
                cppCode: "bool isSafe() { return true; }\nvoid nQueens() {}\n",
                timeComplexity: "O(N!)",
                spaceComplexity: "O(N^2)",
                edgeCases: ["n = 1", "n = 2", "n = 3"],
                approachNotes: "Backtracking",
                visualHtml: rawNQueens,
                categoryId: catBacktracking.id
            }
        });

        // Sudoku Solver
        const rawSudoku = fs.readFileSync("/Users/vishalyadav/Downloads/dsa-portfolio-full/server/sudoku_viz.html", "utf8");
        await prisma.problem.upsert({
            where: { slug: "sudoku-solver" },
            update: { visualHtml: rawSudoku },
            create: {
                title: "Sudoku Solver",
                slug: "sudoku-solver",
                statement: "Write a program to solve a Sudoku puzzle by filling the empty cells.",
                difficulty: "HARD",
                tags: ["backtracking", "recursion"],
                cppCode: "bool solveSudoku() { return true; }\n",
                timeComplexity: "O(9^(9*9))",
                spaceComplexity: "O(81)",
                edgeCases: ["Empty board", "Invalid board"],
                approachNotes: "Try 1-9 in empty cells, backtrack if invalid.",
                visualHtml: rawSudoku,
                categoryId: catBacktracking.id
            }
        });

        // Subsets
        await prisma.problem.upsert({
            where: { slug: "subsets" },
            update: {},
            create: {
                title: "Subsets I",
                slug: "subsets",
                statement: "Given an integer array nums of unique elements, return all possible subsets (the power set).",
                difficulty: "MEDIUM",
                tags: ["backtracking", "recursion"],
                cppCode: "void subsets() {}\n",
                timeComplexity: "O(N * 2^N)",
                spaceComplexity: "O(N)",
                categoryId: catBacktracking.id
            }
        });

        // Subsets II
        await prisma.problem.upsert({
            where: { slug: "subsets-ii" },
            update: {},
            create: {
                title: "Subsets II",
                slug: "subsets-ii",
                statement: "Given an integer array nums that may contain duplicates, return all possible subsets (the power set). The solution set must not contain duplicate subsets.",
                difficulty: "MEDIUM",
                tags: ["backtracking", "recursion"],
                cppCode: "void subsetsWithDup() {}\n",
                timeComplexity: "O(N * 2^N)",
                spaceComplexity: "O(N)",
                categoryId: catBacktracking.id
            }
        });

        // Add Two Numbers
        await prisma.problem.upsert({
            where: { slug: "add-two-numbers" },
            update: {},
            create: {
                title: "Add Two Numbers",
                slug: "add-two-numbers",
                statement: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
                difficulty: "MEDIUM",
                tags: ["linked-list", "math"],
                cppCode: "ListNode* addTwoNumbers() { return nullptr; }\n",
                timeComplexity: "O(max(N, M))",
                spaceComplexity: "O(max(N, M))",
                categoryId: catLinkedList.id
            }
        });

        // Two Sum
        await prisma.problem.upsert({
            where: { slug: "two-sum" },
            update: {},
            create: {
                title: "Two Sum",
                slug: "two-sum",
                statement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                difficulty: "EASY",
                tags: ["array", "hash-table"],
                cppCode: "vector<int> twoSum() { return {}; }\n",
                timeComplexity: "O(N)",
                spaceComplexity: "O(N)",
                categoryId: catArrays.id
            }
        });

        console.log("Successfully seeded manual problems!");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
