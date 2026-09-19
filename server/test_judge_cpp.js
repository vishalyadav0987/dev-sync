import axios from "axios";
import { Judge0Runner } from "./src/services/execution/judge0.runner.js";
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

  const res = await Judge0Runner.run(fullSource, "cpp", stdinInput, 2000, 256);
  console.log("Result:", res);
}
test().catch(console.error);
