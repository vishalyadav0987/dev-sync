import { analyzeProblemWithGemini } from "./gemini.js";
import 'dotenv/config';

async function test() {
  try {
    const res = await analyzeProblemWithGemini({
      title: "Two Sum",
      code: "function twoSum(nums, target) { return [0, 1]; }"
    });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}

test();
