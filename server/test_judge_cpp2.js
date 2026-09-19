import axios from "axios";
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

  const payload = {
    source_code: Buffer.from(fullSource).toString('base64'),
    language_id: 54, // cpp
    stdin: Buffer.from(stdinInput).toString('base64'),
    cpu_time_limit: 2.0,
    memory_limit: 0,
  };

  const response = await axios.post(
    "http://localhost:2358/submissions?base64_encoded=true&wait=true",
    payload
  );

  console.log("Raw Response:", response.data);
  if (response.data.compile_output) {
    console.log("Compile Output:", Buffer.from(response.data.compile_output, 'base64').toString('utf-8'));
  }
}
test().catch(console.error);
