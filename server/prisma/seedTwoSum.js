import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Two Sum problem with multiple approaches...");

  // Ensure Array category exists
  let arrayCategory = await prisma.category.findUnique({
    where: { slug: 'arrays' }
  });

  if (!arrayCategory) {
    arrayCategory = await prisma.category.create({
      data: {
        name: 'Arrays',
        slug: 'arrays',
      }
    });
    console.log("Created 'Arrays' category.");
  } else {
    console.log("Found 'Arrays' category.");
  }

  // Define problem
  const twoSumProblem = {
    title: "Two Sum",
    slug: "two-sum-seeded", // Using a unique slug for seeded
    statement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "EASY",
    tags: ["Array", "Hash Table"],
    cppCode: "// Please select an approach below to view its code.",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    edgeCases: ["Empty array", "No solution exists", "Negative numbers"],
    approachNotes: "There are multiple ways to solve this problem. Explore the approaches below.",
    visualHtml: `
<!DOCTYPE html>
<html>
<head>
    <title>Two Sum Overview</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .box { padding: 2rem; border-radius: 1rem; background: #1e293b; text-align: center; }
    </style>
</head>
<body>
    <div class="box">
        <h2>Two Sum</h2>
        <p>Select an approach from the tabs to visualize it.</p>
    </div>
</body>
</html>
`,
    categoryId: arrayCategory.id,
  };

  const approaches = [
    {
      title: "Brute Force",
      cppCode: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        int n = nums.size();
        for (int i = 0; i < n - 1; i++) {
            for (int j = i + 1; j < n; j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {}; // No solution found
    }
};`,
      timeComplexity: "O(N^2)",
      spaceComplexity: "O(1)",
      approachNotes: "The brute force approach checks every possible pair of numbers to see if they add up to the target. This is simple but slow for large arrays.",
      visualHtml: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .array-container { display: flex; gap: 10px; margin-top: 20px; }
        .array-item { width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; background: #334155; border: 2px solid #475569; border-radius: 8px; font-size: 1.2rem; position: relative; }
        .array-item.pointer-i { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }
        .array-item.pointer-j { border-color: #3b82f6; background: rgba(59, 130, 246, 0.2); }
        .array-item.found { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }
        .pointer-label { position: absolute; bottom: -25px; font-size: 0.8rem; font-weight: bold; }
        .pointer-i .pointer-label { color: #ef4444; }
        .pointer-j .pointer-label { color: #3b82f6; }
        .controls { margin-top: 40px; display: flex; gap: 10px; }
        button { padding: 10px 20px; border: none; border-radius: 6px; background: #6366f1; color: white; cursor: pointer; font-weight: bold; }
        button:disabled { background: #475569; cursor: not-allowed; }
        .status { margin-top: 20px; font-size: 1.2rem; min-height: 1.5rem; }
    </style>
</head>
<body>
    <h2>Two Sum - Brute Force Visualization</h2>
    <div>Target: <strong>9</strong></div>
    <div class="array-container" id="arrayContainer">
        <!-- Generated via JS -->
    </div>
    <div class="status" id="statusText">Press Start to begin execution.</div>
    <div class="controls">
        <button id="btnStart" onclick="startExecution()">Start</button>
        <button id="btnNext" onclick="nextStep()" disabled>Next Step</button>
        <button id="btnReset" onclick="reset()">Reset</button>
    </div>

    <script>
        const nums = [2, 7, 11, 15];
        const target = 9;
        let i = 0;
        let j = 1;
        let state = 'init'; // init, checking, found, done
        
        const arrayContainer = document.getElementById('arrayContainer');
        const statusText = document.getElementById('statusText');
        const btnStart = document.getElementById('btnStart');
        const btnNext = document.getElementById('btnNext');
        
        function render() {
            arrayContainer.innerHTML = '';
            nums.forEach((num, index) => {
                const el = document.createElement('div');
                el.className = 'array-item';
                el.innerText = num;
                
                if (state !== 'init') {
                    if (state === 'found' && (index === i || index === j)) {
                        el.classList.add('found');
                    } else {
                        if (index === i) {
                            el.classList.add('pointer-i');
                            const label = document.createElement('div');
                            label.className = 'pointer-label';
                            label.innerText = 'i';
                            el.appendChild(label);
                        }
                        if (index === j) {
                            el.classList.add('pointer-j');
                            const label = document.createElement('div');
                            label.className = 'pointer-label';
                            label.innerText = 'j';
                            el.appendChild(label);
                        }
                    }
                }
                
                arrayContainer.appendChild(el);
            });
        }
        
        function startExecution() {
            i = 0;
            j = 1;
            state = 'checking';
            btnStart.disabled = true;
            btnNext.disabled = false;
            updateStatus();
            render();
            // Send initial state to IDE
            window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 1, currentLine: 5, variables: { i, j, "nums[i]": nums[i], "nums[j]": nums[j] } } }, "*");
        }
        
        function nextStep() {
            if (state === 'found' || state === 'done') return;
            
            if (nums[i] + nums[j] === target) {
                state = 'found';
                statusText.innerHTML = \`<span style="color:#22c55e">Found solution! \${nums[i]} + \${nums[j]} = \${target}. Indices: [\${i}, \${j}]</span>\`;
                btnNext.disabled = true;
                window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 2, currentLine: 8, variables: { i, j, "nums[i]": nums[i], "nums[j]": nums[j], result: [i, j] } } }, "*");
            } else {
                j++;
                if (j >= nums.length) {
                    i++;
                    j = i + 1;
                }
                if (i >= nums.length - 1) {
                    state = 'done';
                    statusText.innerText = "No solution found.";
                    btnNext.disabled = true;
                } else {
                    updateStatus();
                    window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 2, currentLine: 7, variables: { i, j, "nums[i]": nums[i], "nums[j]": nums[j] } } }, "*");
                }
            }
            render();
        }
        
        function updateStatus() {
            statusText.innerHTML = \`Checking: nums[\${i}] + nums[\${j}] &rarr; \${nums[i]} + \${nums[j]} = \${nums[i]+nums[j]}\`;
        }
        
        function reset() {
            state = 'init';
            i = 0;
            j = 1;
            btnStart.disabled = false;
            btnNext.disabled = true;
            statusText.innerText = "Press Start to begin execution.";
            render();
            window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 0, currentLine: 3, variables: {} } }, "*");
        }
        
        render();
    </script>
</body>
</html>`,
      order: 1
    },
    {
      title: "Two-Pass Hash Table",
      cppCode: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> numMap;
        int n = nums.size();

        // Build the hash table
        for (int i = 0; i < n; i++) {
            numMap[nums[i]] = i;
        }

        // Find the complement
        for (int i = 0; i < n; i++) {
            int complement = target - nums[i];
            if (numMap.count(complement) && numMap[complement] != i) {
                return {i, numMap[complement]};
            }
        }

        return {}; // No solution found
    }
};`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)",
      approachNotes: "This approach creates a hash map mapping elements to their indices. In a second pass, it checks if the required complement exists in the map.",
      visualHtml: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .array-container, .map-container { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; justify-content: center;}
        .array-item { width: 50px; height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #334155; border: 2px solid #475569; border-radius: 8px; position: relative; }
        .array-item .val { font-size: 1.2rem; }
        .array-item .idx { font-size: 0.6rem; color: #94a3b8; margin-top: 2px;}
        .array-item.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.2); }
        .array-item.found { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }
        
        .map-item { padding: 8px 12px; background: #1e293b; border: 1px solid #475569; border-radius: 6px; display: flex; gap: 8px; align-items: center;}
        .map-key { font-weight: bold; color: #a78bfa; }
        .map-val { color: #f472b6; }
        .map-item.highlight { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }

        .section-title { margin-top: 20px; font-size: 1rem; color: #cbd5e1; }
        .controls { margin-top: 30px; display: flex; gap: 10px; }
        button { padding: 10px 20px; border: none; border-radius: 6px; background: #6366f1; color: white; cursor: pointer; font-weight: bold; }
        button:disabled { background: #475569; cursor: not-allowed; }
        .status { margin-top: 20px; font-size: 1.1rem; min-height: 1.5rem; text-align: center; }
    </style>
</head>
<body>
    <h2>Two Sum - Two-Pass Hash Table</h2>
    <div>Target: <strong>9</strong></div>
    
    <div class="section-title">Array:</div>
    <div class="array-container" id="arrayContainer"></div>
    
    <div class="section-title">Hash Map { value: index }:</div>
    <div class="map-container" id="mapContainer"></div>

    <div class="status" id="statusText">Press Start to begin execution.</div>
    <div class="controls">
        <button id="btnStart" onclick="startExecution()">Start</button>
        <button id="btnNext" onclick="nextStep()" disabled>Next Step</button>
        <button id="btnReset" onclick="reset()">Reset</button>
    </div>

    <script>
        const nums = [2, 7, 11, 15];
        const target = 9;
        let mapData = {};
        let i = 0;
        let pass = 1; // 1: build map, 2: find complement
        let state = 'init';
        
        const arrayContainer = document.getElementById('arrayContainer');
        const mapContainer = document.getElementById('mapContainer');
        const statusText = document.getElementById('statusText');
        const btnStart = document.getElementById('btnStart');
        const btnNext = document.getElementById('btnNext');
        
        function render() {
            // Render array
            arrayContainer.innerHTML = '';
            nums.forEach((num, index) => {
                const el = document.createElement('div');
                el.className = 'array-item';
                if (state !== 'init' && index === i && state !== 'found') el.classList.add('active');
                if (state === 'found' && (index === i || index === mapData[target - nums[i]])) el.classList.add('found');
                
                el.innerHTML = \`<div class="val">\${num}</div><div class="idx">idx:\${index}</div>\`;
                arrayContainer.appendChild(el);
            });

            // Render map
            mapContainer.innerHTML = '';
            if (Object.keys(mapData).length === 0) {
                mapContainer.innerHTML = '<span style="color:#64748b">Empty</span>';
            } else {
                for (const [key, val] of Object.entries(mapData)) {
                    const el = document.createElement('div');
                    el.className = 'map-item';
                    if (state === 'found' && parseInt(key) === target - nums[i]) el.classList.add('highlight');
                    el.innerHTML = \`{\ <span class="map-key">\${key}</span>: <span class="map-val">\${val}</span> }\`;
                    mapContainer.appendChild(el);
                }
            }
        }
        
        function startExecution() {
            i = 0;
            pass = 1;
            mapData = {};
            state = 'running';
            btnStart.disabled = true;
            btnNext.disabled = false;
            updateStatus();
            render();
            window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 1, currentLine: 8, variables: { i, map: JSON.stringify(mapData) } } }, "*");
        }
        
        function nextStep() {
            if (state === 'found' || state === 'done') return;
            
            if (pass === 1) {
                // Building map
                mapData[nums[i]] = i;
                statusText.innerHTML = \`Pass 1: Added nums[\${i}]=\${nums[i]} to map.\`;
                window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 2, currentLine: 9, variables: { i, "nums[i]": nums[i], map: JSON.stringify(mapData) } } }, "*");
                i++;
                if (i >= nums.length) {
                    pass = 2;
                    i = 0;
                }
            } else if (pass === 2) {
                // Finding complement
                const complement = target - nums[i];
                if (mapData[complement] !== undefined && mapData[complement] !== i) {
                    state = 'found';
                    statusText.innerHTML = \`<span style="color:#22c55e">Found complement \${complement} in map at index \${mapData[complement]}! Result: [\${i}, \${mapData[complement]}]</span>\`;
                    btnNext.disabled = true;
                    window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 3, currentLine: 16, variables: { i, complement, result: [i, mapData[complement]] } } }, "*");
                } else {
                    statusText.innerHTML = \`Pass 2: Complement for \${nums[i]} is \${complement}. Not in map (or same index).\`;
                    window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 3, currentLine: 15, variables: { i, complement, "nums[i]": nums[i] } } }, "*");
                    i++;
                    if (i >= nums.length) {
                        state = 'done';
                        statusText.innerText = "No solution found.";
                        btnNext.disabled = true;
                    }
                }
            }
            render();
        }
        
        function updateStatus() {
            if (pass === 1) {
                statusText.innerHTML = \`Pass 1: Building Map. Current index: \${i}\`;
            } else {
                statusText.innerHTML = \`Pass 2: Finding Complement. Current index: \${i}\`;
            }
        }
        
        function reset() {
            state = 'init';
            i = 0;
            pass = 1;
            mapData = {};
            btnStart.disabled = false;
            btnNext.disabled = true;
            statusText.innerText = "Press Start to begin execution.";
            render();
        }
        
        render();
    </script>
</body>
</html>`,
      order: 2
    },
    {
      title: "One-Pass Hash Table",
      cppCode: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> numMap;
        int n = nums.size();

        for (int i = 0; i < n; i++) {
            int complement = target - nums[i];
            if (numMap.count(complement)) {
                return {numMap[complement], i};
            }
            numMap[nums[i]] = i;
        }

        return {}; // No solution found
    }
};`,
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)",
      approachNotes: "The most optimal approach. It iterates through the array and checks if the complement of the current element is already in the hash map. If not, it adds the current element to the hash map. This guarantees $O(N)$ time in a single pass.",
      visualHtml: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .array-container, .map-container { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; justify-content: center;}
        .array-item { width: 50px; height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #334155; border: 2px solid #475569; border-radius: 8px; position: relative; }
        .array-item .val { font-size: 1.2rem; }
        .array-item .idx { font-size: 0.6rem; color: #94a3b8; margin-top: 2px;}
        .array-item.active { border-color: #f59e0b; background: rgba(245, 158, 11, 0.2); }
        .array-item.found { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }
        
        .map-item { padding: 8px 12px; background: #1e293b; border: 1px solid #475569; border-radius: 6px; display: flex; gap: 8px; align-items: center;}
        .map-key { font-weight: bold; color: #38bdf8; }
        .map-val { color: #c084fc; }
        .map-item.highlight { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }

        .section-title { margin-top: 20px; font-size: 1rem; color: #cbd5e1; }
        .controls { margin-top: 30px; display: flex; gap: 10px; }
        button { padding: 10px 20px; border: none; border-radius: 6px; background: #6366f1; color: white; cursor: pointer; font-weight: bold; }
        button:disabled { background: #475569; cursor: not-allowed; }
        .status { margin-top: 20px; font-size: 1.1rem; min-height: 1.5rem; text-align: center; }
    </style>
</head>
<body>
    <h2>Two Sum - One-Pass Hash Table</h2>
    <div>Target: <strong>9</strong></div>
    
    <div class="section-title">Array:</div>
    <div class="array-container" id="arrayContainer"></div>
    
    <div class="section-title">Hash Map { value: index }:</div>
    <div class="map-container" id="mapContainer"></div>

    <div class="status" id="statusText">Press Start to begin execution.</div>
    <div class="controls">
        <button id="btnStart" onclick="startExecution()">Start</button>
        <button id="btnNext" onclick="nextStep()" disabled>Next Step</button>
        <button id="btnReset" onclick="reset()">Reset</button>
    </div>

    <script>
        const nums = [2, 7, 11, 15];
        const target = 9;
        let mapData = {};
        let i = 0;
        let subStep = 0; // 0: check complement, 1: add to map
        let state = 'init';
        
        const arrayContainer = document.getElementById('arrayContainer');
        const mapContainer = document.getElementById('mapContainer');
        const statusText = document.getElementById('statusText');
        const btnStart = document.getElementById('btnStart');
        const btnNext = document.getElementById('btnNext');
        
        function render() {
            // Render array
            arrayContainer.innerHTML = '';
            nums.forEach((num, index) => {
                const el = document.createElement('div');
                el.className = 'array-item';
                if (state !== 'init' && index === i && state !== 'found') el.classList.add('active');
                if (state === 'found' && (index === i || index === mapData[target - nums[i]])) el.classList.add('found');
                
                el.innerHTML = \`<div class="val">\${num}</div><div class="idx">idx:\${index}</div>\`;
                arrayContainer.appendChild(el);
            });

            // Render map
            mapContainer.innerHTML = '';
            if (Object.keys(mapData).length === 0) {
                mapContainer.innerHTML = '<span style="color:#64748b">Empty</span>';
            } else {
                for (const [key, val] of Object.entries(mapData)) {
                    const el = document.createElement('div');
                    el.className = 'map-item';
                    if (state === 'found' && parseInt(key) === target - nums[i]) el.classList.add('highlight');
                    el.innerHTML = \`{\ <span class="map-key">\${key}</span>: <span class="map-val">\${val}</span> }\`;
                    mapContainer.appendChild(el);
                }
            }
        }
        
        function startExecution() {
            i = 0;
            subStep = 0;
            mapData = {};
            state = 'running';
            btnStart.disabled = true;
            btnNext.disabled = false;
            updateStatus();
            render();
            window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 1, currentLine: 7, variables: { i, map: JSON.stringify(mapData) } } }, "*");
        }
        
        function nextStep() {
            if (state === 'found' || state === 'done') return;
            
            const currentNum = nums[i];
            const complement = target - currentNum;
            
            if (subStep === 0) {
                if (mapData[complement] !== undefined) {
                    state = 'found';
                    statusText.innerHTML = \`<span style="color:#22c55e">Found complement \${complement} in map at index \${mapData[complement]}! Result: [\${mapData[complement]}, \${i}]</span>\`;
                    btnNext.disabled = true;
                    window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 3, currentLine: 10, variables: { i, complement, result: [mapData[complement], i] } } }, "*");
                } else {
                    statusText.innerHTML = \`Complement for \${currentNum} is \${complement}. Not in map. Proceeding to add \${currentNum} to map.\`;
                    subStep = 1;
                    window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 2, currentLine: 9, variables: { i, complement, "nums[i]": currentNum } } }, "*");
                }
            } else if (subStep === 1) {
                mapData[currentNum] = i;
                statusText.innerHTML = \`Added nums[\${i}]=\${currentNum} to map.\`;
                window.parent.postMessage({ type: "SYNC_STATE", payload: { step: 2, currentLine: 12, variables: { i, map: JSON.stringify(mapData) } } }, "*");
                subStep = 0;
                i++;
                if (i >= nums.length) {
                    state = 'done';
                    statusText.innerText = "No solution found.";
                    btnNext.disabled = true;
                }
            }
            render();
        }
        
        function updateStatus() {
            statusText.innerHTML = \`Processing index \${i} (value: \${nums[i]}).\`;
        }
        
        function reset() {
            state = 'init';
            i = 0;
            subStep = 0;
            mapData = {};
            btnStart.disabled = false;
            btnNext.disabled = true;
            statusText.innerText = "Press Start to begin execution.";
            render();
        }
        
        render();
    </script>
</body>
</html>`,
      order: 3
    }
  ];

  // Upsert problem
  let problem = await prisma.problem.findUnique({
    where: { slug: twoSumProblem.slug }
  });

  if (problem) {
    // Delete old approaches
    await prisma.problemApproach.deleteMany({
      where: { problemId: problem.id }
    });
    // Update problem
    problem = await prisma.problem.update({
      where: { id: problem.id },
      data: twoSumProblem
    });
    console.log("Updated Two Sum problem.");
  } else {
    problem = await prisma.problem.create({
      data: twoSumProblem
    });
    console.log("Created Two Sum problem.");
  }

  // Add approaches
  for (const approach of approaches) {
    await prisma.problemApproach.create({
      data: {
        ...approach,
        problemId: problem.id
      }
    });
    console.log("Added approach: " + approach.title);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
