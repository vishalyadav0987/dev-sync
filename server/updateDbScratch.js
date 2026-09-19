import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Live Two Sum Analyzer</title>
<style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1e1e1e; color: #d4d4d4; margin: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    
    /* Top Input Bar */
    #input-bar { background: #252526; padding: 10px 20px; display: flex; gap: 15px; border-bottom: 1px solid #333; align-items: center; justify-content: center; z-index: 11; }
    #input-bar label { font-weight: bold; color: #fff; }
    #input-bar input { background: #3c3c3c; color: #fff; border: 1px solid #555; padding: 6px 10px; border-radius: 4px; font-family: monospace; font-size: 15px; }
    #input-arr { width: 300px; }
    #input-target { width: 80px; }
    #btn-load { padding: 6px 15px; font-size: 14px; cursor: pointer; background: #4caf50; color: white; border: none; border-radius: 4px; font-weight: bold; }
    #btn-load:hover { background: #388e3c; }

    /* Live Variables Dashboard */
    #dashboard { background: #2d2d30; padding: 15px 20px; display: flex; flex-wrap: wrap; gap: 15px; border-bottom: 2px solid #007acc; font-family: monospace; font-size: 15px; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 10; }
    .var-box { background: #1e1e1e; border: 1px solid #555; padding: 4px 12px; border-radius: 4px; display: flex; gap: 8px; min-width: 80px; justify-content: space-between; align-items: center; }
    .var-name { color: #569cd6; font-weight: bold; }
    .var-val { color: #b5cea8; }

    /* Main Layout */
    #main-container { display: flex; flex: 1; overflow: hidden; }
    
    /* Left Panel: Visualization & Controls */
    #left-panel { flex: 1; padding: 20px; display: flex; flex-direction: column; align-items: center; border-right: 1px solid #333; overflow-y: auto; position: relative; }
    
    /* Array Visualization */
    .section-title { margin-bottom: 10px; color: #9cdcfe; font-weight: bold; font-family: monospace; font-size: 16px; width: 100%; text-align: center; }
    #array-container { display: flex; gap: 5px; margin-bottom: 30px; flex-wrap: wrap; justify-content: center; }
    .arr-cell-wrapper { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .arr-cell { width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; font-size: 20px; font-weight: bold; background: #1e1e1e; border: 2px solid #555; color: #fff; border-radius: 4px; transition: all 0.2s; }
    .arr-idx { font-size: 12px; color: #888; font-family: monospace; }
    
    /* Hash Map Visualization */
    #map-container { display: flex; flex-direction: column; gap: 5px; width: 250px; margin-bottom: 30px; background: #1e1e1e; border: 2px solid #555; border-radius: 6px; padding: 10px; }
    .map-header { display: flex; justify-content: space-between; font-weight: bold; color: #888; border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 5px; font-family: monospace; }
    .map-row { display: flex; justify-content: space-between; padding: 5px; background: #252526; border-radius: 3px; font-family: monospace; font-size: 16px; transition: background 0.2s; }
    .map-key { color: #ce9178; }
    .map-val { color: #b5cea8; }

    /* Highlights */
    .highlight-active { background: #007acc !important; border-color: #007acc !important; color: white; transform: scale(1.05); }
    .highlight-check { border-color: #ffeb3b !important; color: #ffeb3b; }
    .highlight-found { background: #4caf50 !important; border-color: #4caf50 !important; color: white; transform: scale(1.05); }
    .highlight-map-check { background: #5a5a18 !important; }
    .highlight-map-found { background: #2a5a2a !important; }

    .controls { display: flex; gap: 10px; margin-bottom: 15px; }
    button { padding: 8px 16px; font-size: 14px; cursor: pointer; background: #007acc; color: white; border: none; border-radius: 4px; font-weight: bold; transition: background 0.2s; }
    button:hover { background: #005f9e; }
    button:disabled { background: #555; cursor: not-allowed; }
    
    #status { margin-top: 10px; font-size: 16px; min-height: 40px; text-align: center; color: #ce9178; font-family: monospace; background: #252526; padding: 10px; border-radius: 5px; width: 90%; }

    /* Right Panel: Code */
    #right-panel { flex: 1; background: #1e1e1e; padding: 20px; overflow-y: auto; font-family: Consolas, 'Courier New', monospace; font-size: 15px; line-height: 1.6; white-space: pre; position: relative; }
    .code-line { display: flex; padding: 2px 0; border-radius: 3px; transition: background 0.2s; }
    .line-num { color: #858585; width: 35px; text-align: right; margin-right: 15px; user-select: none; }
    .code-text { color: #d4d4d4; }
    .code-line.active-line { background: #264f78; border-left: 4px solid #569cd6; }
    
    /* Syntax highlighting */
    .kw { color: #569cd6; }
    .type { color: #4ec9b0; }
    .func { color: #dcdcaa; }
    .str { color: #ce9178; }
    .comment { color: #6a9955; }
</style>
</head>
<body>

    <div id="input-bar">
        <label for="input-arr">Array (nums):</label>
        <input type="text" id="input-arr" value="2, 7, 11, 15">
        <label for="input-target">Target:</label>
        <input type="number" id="input-target" value="9">
        <button id="btn-load" onclick="initAnalyzer()">Load & Restart</button>
    </div>

    <div id="dashboard">
        <div class="var-box"><span class="var-name">target</span><span class="var-val" id="var-target">-</span></div>
        <div class="var-box"><span class="var-name">i</span><span class="var-val" id="var-i">-</span></div>
        <div class="var-box"><span class="var-name">nums[i]</span><span class="var-val" id="var-num">-</span></div>
        <div class="var-box"><span class="var-name">complement</span><span class="var-val" id="var-comp">-</span></div>
    </div>

    <div id="main-container">
        <div id="left-panel">
            <div class="section-title">vector&lt;int&gt; nums</div>
            <div id="array-container"></div>
            
            <div class="section-title">unordered_map&lt;int, int&gt; numMap</div>
            <div id="map-container">
                <div class="map-header"><span>Key (Num)</span><span>Value (Index)</span></div>
                <div id="map-body"></div>
            </div>

            <div class="controls">
                <button id="btn-prev" onclick="stepBack()" disabled>◄ Previous Step</button>
                <button id="btn-next" onclick="stepForward()">Next Step ►</button>
                <button id="btn-auto" onclick="toggleAuto()">Auto Run</button>
            </div>
            <div id="status">Click "Load & Restart" or "Next Step" to begin.</div>
        </div>

        <div id="right-panel">
<div class="code-line" id="line-1"><span class="line-num">1</span><span class="code-text"><span class="kw">class</span> <span class="type">Solution</span> {</span></div>
<div class="code-line" id="line-2"><span class="line-num">2</span><span class="code-text"><span class="kw">public</span>:</span></div>
<div class="code-line" id="line-3"><span class="line-num">3</span><span class="code-text">    <span class="type">vector</span>&lt;<span class="type">int</span>&gt; <span class="func">twoSum</span>(<span class="type">vector</span>&lt;<span class="type">int</span>&gt;& nums, <span class="type">int</span> target) {</span></div>
<div class="code-line" id="line-4"><span class="line-num">4</span><span class="code-text">        <span class="type">unordered_map</span>&lt;<span class="type">int</span>, <span class="type">int</span>&gt; numMap;</span></div>
<div class="code-line" id="line-5"><span class="line-num">5</span><span class="code-text">        <span class="kw">for</span> (<span class="type">int</span> i = 0; i &lt; nums.size(); i++) {</span></div>
<div class="code-line" id="line-6"><span class="line-num">6</span><span class="code-text">            <span class="type">int</span> complement = target - nums[i];</span></div>
<div class="code-line" id="line-7"><span class="line-num">7</span><span class="code-text">            <span class="kw">if</span> (numMap.find(complement) != numMap.end()) {</span></div>
<div class="code-line" id="line-8"><span class="line-num">8</span><span class="code-text">                <span class="kw">return</span> {numMap[complement], i};</span></div>
<div class="code-line" id="line-9"><span class="line-num">9</span><span class="code-text">            }</span></div>
<div class="code-line" id="line-10"><span class="line-num">10</span><span class="code-text">            numMap[nums[i]] = i;</span></div>
<div class="code-line" id="line-11"><span class="line-num">11</span><span class="code-text">        }</span></div>
<div class="code-line" id="line-12"><span class="line-num">12</span><span class="code-text">        <span class="kw">return</span> {};</span></div>
<div class="code-line" id="line-13"><span class="line-num">13</span><span class="code-text">    }</span></div>
<div class="code-line" id="line-14"><span class="line-num">14</span><span class="code-text">};</span></div>
        </div>
    </div>

<script>
    let nums = [];
    let target = 0;
    let history = []; 
    let currentStateIdx = -1;
    let autoInterval = null;
    let generator = null;

    const arrContainer = document.getElementById('array-container');
    const mapBody = document.getElementById('map-body');
    const statusDiv = document.getElementById('status');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    function parseInput() {
        const arrInput = document.getElementById('input-arr').value;
        target = parseInt(document.getElementById('input-target').value) || 0;
        
        nums = arrInput.split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(Number)
            .filter(n => !isNaN(n));
            
        if(nums.length === 0) nums = [2, 7, 11, 15]; // fallback
    }

    function renderInitialArray() {
        arrContainer.innerHTML = '';
        nums.forEach((num, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'arr-cell-wrapper';
            
            const cell = document.createElement('div');
            cell.className = 'arr-cell';
            cell.id = \`arr-cell-\${idx}\`;
            cell.textContent = num;
            
            const label = document.createElement('div');
            label.className = 'arr-idx';
            label.textContent = \`i=\${idx}\`;
            
            wrapper.appendChild(cell);
            wrapper.appendChild(label);
            arrContainer.appendChild(wrapper);
        });
        mapBody.innerHTML = '<div style="text-align:center; color:#666; font-size: 13px; margin-top: 10px;">Map is empty</div>';
    }

    // JS Generator simulating C++ Logic Step-by-Step
    function* runTwoSumAlgo() {
        let mapData = {};
        let baseVars = { i: '-', num: '-', comp: '-', target: target };
        
        yield { line: 3, msg: \`Calling twoSum(nums, target = \${target})\`, vars: { ...baseVars }, hArr: [], mapData: { ...mapData }, checkKey: null };
        
        yield { line: 4, msg: \`Initialized empty unordered_map 'numMap'\`, vars: { ...baseVars }, hArr: [], mapData: { ...mapData }, checkKey: null };

        for (let i = 0; i < nums.length; i++) {
            baseVars.i = i;
            baseVars.num = nums[i];
            
            yield { line: 5, msg: \`Loop start: i = \${i}, nums[i] = \${nums[i]}\`, vars: { ...baseVars }, hArr: [{idx: i, type: 'active'}], mapData: { ...mapData }, checkKey: null };
            
            let comp = target - nums[i];
            baseVars.comp = comp;
            yield { line: 6, msg: \`Calculated complement: \${target} - \${nums[i]} = \${comp}\`, vars: { ...baseVars }, hArr: [{idx: i, type: 'active'}], mapData: { ...mapData }, checkKey: null };
            
            yield { line: 7, msg: \`Checking if numMap contains complement (\${comp})\`, vars: { ...baseVars }, hArr: [{idx: i, type: 'active'}], mapData: { ...mapData }, checkKey: comp };
            
            if (mapData.hasOwnProperty(comp)) {
                let matchIdx = mapData[comp];
                yield { line: 8, msg: \`Found \${comp} in map at index \${matchIdx}! Returning pair.\`, vars: { ...baseVars }, 
                        hArr: [{idx: i, type: 'found'}, {idx: matchIdx, type: 'found'}], mapData: { ...mapData }, checkKey: comp, success: true };
                return;
            }
            
            yield { line: 10, msg: \`Complement \${comp} not found. Adding nums[\${i}] (\${nums[i]}) to map.\`, vars: { ...baseVars }, hArr: [{idx: i, type: 'active'}], mapData: { ...mapData }, checkKey: null };
            
            mapData[nums[i]] = i; // Add to map
            
            yield { line: 10, msg: \`Added key: \${nums[i]}, value: \${i} to numMap.\`, vars: { ...baseVars }, hArr: [{idx: i, type: 'active'}], mapData: { ...mapData }, checkKey: null };
        }
        
        baseVars = { i: '-', num: '-', comp: '-', target: target };
        yield { line: 12, msg: \`Loop finished. No pair found. Returning empty vector.\`, vars: { ...baseVars }, hArr: [], mapData: { ...mapData }, checkKey: null };
    }

    function updateUI(state) {
        // Variables Dashboard
        document.getElementById('var-target').textContent = state.vars.target;
        document.getElementById('var-i').textContent = state.vars.i;
        document.getElementById('var-num').textContent = state.vars.num;
        document.getElementById('var-comp').textContent = state.vars.comp;

        // Reset Array Highlights
        document.querySelectorAll('.arr-cell').forEach(c => {
            c.classList.remove('highlight-active', 'highlight-found');
        });
        
        // Apply Array Highlights
        state.hArr.forEach(hl => {
            const el = document.getElementById(\`arr-cell-\${hl.idx}\`);
            if(el) {
                if(hl.type === 'active') el.classList.add('highlight-active');
                if(hl.type === 'found') el.classList.add('highlight-found');
            }
        });

        // Render Map
        mapBody.innerHTML = '';
        const keys = Object.keys(state.mapData);
        if(keys.length === 0) {
            mapBody.innerHTML = '<div style="text-align:center; color:#666; font-size: 13px; margin-top: 10px;">Map is empty</div>';
        } else {
            keys.forEach(k => {
                const row = document.createElement('div');
                row.className = 'map-row';
                
                // Highlight logic for map checks
                if (state.checkKey !== null) {
                    if (k == state.checkKey && state.success) row.classList.add('highlight-map-found');
                    else if (k == state.checkKey) row.classList.add('highlight-map-check');
                }

                row.innerHTML = \`<span class="map-key">\${k}</span><span class="map-val">\${state.mapData[k]}</span>\`;
                mapBody.appendChild(row);
            });
        }

        // Status & Code Highlight
        statusDiv.textContent = state.msg;
        if(state.success) statusDiv.style.color = '#4caf50';
        else statusDiv.style.color = '#ce9178';

        document.querySelectorAll('.code-line').forEach(l => l.classList.remove('active-line'));
        const activeLine = document.getElementById(\`line-\${state.line}\`);
        if(activeLine) {
            activeLine.classList.add('active-line');
            activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        btnPrev.disabled = currentStateIdx <= 0;
    }

    function stepForward() {
        if (currentStateIdx === history.length - 1) {
            const next = generator.next();
            if(next.done) {
                statusDiv.textContent = "Execution Finished!";
                return;
            }
            // Deep copy mapData to preserve state history
            next.value.mapData = JSON.parse(JSON.stringify(next.value.mapData));
            history.push(next.value);
            
            // Post sync state to parent if needed
            if (window.parent) {
                window.parent.postMessage({ type: "VISUALIZATION_STATE", currentStep: currentStateIdx + 1, totalSteps: history.length, isPlaying: !!autoInterval }, "*");
            }
        }
        currentStateIdx++;
        updateUI(history[currentStateIdx]);
        if (window.parent) window.parent.postMessage({ type: "VISUALIZATION_STATE", currentStep: currentStateIdx, totalSteps: history.length, isPlaying: !!autoInterval }, "*");
    }

    function stepBack() {
        if(currentStateIdx > 0) {
            currentStateIdx--;
            updateUI(history[currentStateIdx]);
            if (window.parent) {
                window.parent.postMessage({ type: "VISUALIZATION_STATE", currentStep: currentStateIdx, totalSteps: history.length, isPlaying: !!autoInterval }, "*");
            }
        }
    }

    function toggleAuto() {
        const btn = document.getElementById('btn-auto');
        if(autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
            btn.textContent = "Auto Run";
            btn.style.background = "#007acc";
        } else {
            autoInterval = setInterval(stepForward, 600); // Slower interval for better readability
            btn.textContent = "Pause Run";
            btn.style.background = "#f44336";
        }
        if (window.parent) window.parent.postMessage({ type: "VISUALIZATION_STATE", currentStep: Math.max(0, currentStateIdx), totalSteps: history.length, isPlaying: !!autoInterval }, "*");
    }

    function initAnalyzer() {
        if(autoInterval) toggleAuto();
        parseInput();
        renderInitialArray();
        history = [];
        currentStateIdx = -1;
        generator = runTwoSumAlgo();
        stepForward();
    }

    // Boot
    initAnalyzer();

    // Listen for SEEK messages from parent container
    
    // Listen for SEEK messages from parent container
    window.addEventListener('message', function(e) {
        if (!e.data) return;
        if (e.data.type === 'SEEK' && typeof e.data.step === 'number') {
            const targetStep = Math.max(0, e.data.step);
            
            while (history.length - 1 < targetStep) {
                const next = generator.next();
                if (next.done) break;
                next.value.mapData = JSON.parse(JSON.stringify(next.value.mapData));
                history.push(next.value);
            }
            
            currentStateIdx = Math.min(targetStep, history.length - 1);
            if (currentStateIdx >= 0) {
                updateUI(history[currentStateIdx]);
                if (window.parent) window.parent.postMessage({ type: "VISUALIZATION_STATE", currentStep: currentStateIdx, totalSteps: history.length, isPlaying: !!autoInterval }, "*");
            }
        } else if (e.data.type === 'PLAY') {
            if (!autoInterval) toggleAuto();
        } else if (e.data.type === 'PAUSE') {
            if (autoInterval) toggleAuto();
        }
    });


</script>
</body>
</html>`;

async function updateDB() {
    console.log("Updating DB with new HTML...");
    const problem = await prisma.problem.findUnique({ where: { slug: 'two-sum-seeded' } });
    if (problem) {
        await prisma.problemApproach.updateMany({
            where: { problemId: problem.id },
            data: { visualHtml: htmlContent }
        });
        console.log("DB updated successfully!");
    } else {
        console.log("Could not find problem 'two-sum-seeded'");
    }
}

updateDB()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
