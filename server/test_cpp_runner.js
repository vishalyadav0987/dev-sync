import { CppRunner } from "./src/services/execution/cpp.runner.js";

async function test() {
  const code = `
class Solution {
public:
    vector<int> twoSum(const vector<int>& nums, int target) {
        for(int i=0; i < nums.size(); i++){
            for(int j=i+1;j<nums.size(); j++){
                if (nums[i]+nums[j] == target){
                    return {i,j};
                }
            }
        }
        return {};
    }
};
`;
  const fullSource = CppRunner.generateHarness(code, "twoSum", "vector<int>", ["vector<int>", "int"], ["nums", "target"]);
  const stdinInput = "[2,7,11,15]\n9\n";

  const workDir = await CppRunner.createWorkDir();
  console.log("WorkDir:", workDir);
  try {
    const compRes = await CppRunner.compile(fullSource, workDir);
    if (!compRes.success) {
      console.log("Compile error:", compRes.error);
    } else {
      const runRes = await CppRunner.run(compRes.executablePath, stdinInput);
      console.log("Run result:", runRes);
    }
  } finally {
    await CppRunner.cleanupWorkDir(workDir);
  }
}
test().catch(console.error);
