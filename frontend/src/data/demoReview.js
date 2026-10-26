// C++ DSA Zero-Token Demo Sample Code & Precomputed Reviews
// Pure C++ Two Sum DSA Problem using namespace std with zero token consumption and no database counter increment.

export const DEMO_SAMPLE_CODE = `using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Performance Issue: Nested O(n^2) brute-force search causes Time Limit Exceeded (TLE)
    for (int i = 0; i < nums.size(); i++) {
        for (int j = i + 1; j < nums.size(); j++) {
            if (nums[i] + nums[j] == target) {
                return {i, j};
            }
        }
    }
    return {};
}
`;

export const DEMO_REMEDIATED_CODE = `using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    if (nums.size() < 2) return {};
    // Optimal O(n) single-pass hash map solution
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}
`;

export const DEMO_PRECOMPUTED_REVIEW = {
  id: 0,
  source_url: 'two_sum.cpp',
  language: 'cpp',
  code_snippet: DEMO_SAMPLE_CODE.trim(),
  health_score: {
    score: 72,
    grade: 'C',
    style_score: 85,
    bug_score: 75,
    security_score: 80,
    performance_score: 55
  },
  performance: [
    {
      id: 'demo_perf',
      line: 'Line 4',
      issue: 'Brute-force nested loops produce quadratic O(n^2) time complexity, causing Time Limit Exceeded (TLE) on large constraints (N >= 10^4)',
      impact: 'high',
      severity: 'high',
      detected_line: 'for (int i = 0; i < nums.size(); i++) {',
      suggestion: 'Use an unordered_map hash table to achieve optimal O(n) linear time complexity with single-pass lookup',
      target_snippet: `for (int i = 0; i < nums.size(); i++) {
        for (int j = i + 1; j < nums.size(); j++) {
            if (nums[i] + nums[j] == target) {
                return {i, j};
            }
        }
    }`,
      remediation_code: `unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }`
    }
  ],
  bugs: [
    {
      id: 'demo_bug',
      line: 'Line 3',
      issue: 'Missing input boundary check for empty or single-element vector inputs',
      severity: 'low',
      detected_line: 'vector<int> twoSum(vector<int>& nums, int target) {',
      suggestion: 'Add early exit condition below function header: `if (nums.size() < 2) return {};`',
      remediation_code: 'if (nums.size() < 2) return {};',
      action: 'insert_below'
    }
  ],
  style: [
    {
      id: 'demo_style',
      line: 'Line 3',
      issue: 'Function parameter `vector<int>& nums` passed by mutable reference without modification intent',
      severity: 'info',
      detected_line: 'vector<int> twoSum(vector<int>& nums, int target) {',
      suggestion: 'Pass as const reference: `vector<int> twoSum(const vector<int>& nums, int target) {`',
      target_snippet: 'vector<int> twoSum(vector<int>& nums, int target) {',
      remediation_code: 'vector<int> twoSum(const vector<int>& nums, int target) {'
    }
  ],
  security: [
    {
      id: 'demo_sec',
      line: 'Line 7',
      issue: 'Potential signed integer overflow in `nums[i] + nums[j]` if array elements approach INT_MAX or INT_MIN',
      severity: 'medium',
      cwe_id: 'CWE-190',
      detected_line: 'if (nums[i] + nums[j] == target) {',
      suggestion: 'Use safe complement subtraction: `if (target - nums[i] == nums[j]) {` to prevent integer overflow',
      target_snippet: 'if (nums[i] + nums[j] == target) {',
      remediation_code: 'if (target - nums[i] == nums[j]) {'
    }
  ],
  summary: `### Executive Multi-Agent Audit Summary (C++ DSA)

CodeReviewPro multi-agent audit completed for **Two Sum C++ solution** (0 API tokens consumed).

- **Big-O Performance Warning:** Nested loops produce $O(n^2)$ time complexity, which will result in **Time Limit Exceeded (TLE)** on standard platform constraints ($N \\ge 10^4$).
- **Runtime Edge Case:** Add boundary check \`if (nums.size() < 2) return {};\` for single-element or empty vector inputs.
- **Clean Code & Idiomatic C++:** Function signature should declare read-only vector input as \`const vector<int>&\` for const-correctness.

✨ **1-Click Remediation Ready:** Click **Apply Fixes** below to inspect the optimal $O(n)$ hash map solution.`,
  remediated_code: DEMO_REMEDIATED_CODE.trim(),
  created_at: new Date().toISOString(),
  agent_statuses: {
    style: 'ok',
    bugs: 'ok',
    security: 'ok',
    performance: 'ok'
  },
  is_demo: true
};

export const DEMO_PERFECT_REVIEW = {
  id: 0,
  source_url: 'two_sum.cpp',
  language: 'cpp',
  code_snippet: DEMO_REMEDIATED_CODE.trim(),
  health_score: {
    score: 100,
    grade: 'A+',
    style_score: 100,
    bug_score: 100,
    security_score: 100,
    performance_score: 100
  },
  performance: [],
  bugs: [],
  style: [],
  security: [],
  summary: `### Verification Audit: Optimal DSA Solution Verified!

Multi-agent audit verified the remediated Two Sum solution. Single-pass $O(n)$ time complexity with $O(n)$ auxiliary space achieved via \`unordered_map\`.

- **Time Complexity:** $O(n)$ (Optimal single pass)
- **Space Complexity:** $O(n)$ (Hash table lookup)
- **Platform Acceptance:** 100% Passes all LeetCode / GFG constraints without TLE
- **Code Health Grade:** A+`,
  remediated_code: DEMO_REMEDIATED_CODE.trim(),
  created_at: new Date().toISOString(),
  agent_statuses: {
    style: 'ok',
    bugs: 'ok',
    security: 'ok',
    performance: 'ok'
  },
  is_demo: true
};

/**
 * Checks if the given code snippet matches the C++ DSA demo sample.
 */
export function isDemoSample(code = '', filename = '') {
  if (!code && !filename) return false;
  const trimmed = (code || '').trim();
  const lowerFile = (filename || '').toLowerCase();

  if (trimmed === DEMO_SAMPLE_CODE.trim() || trimmed === DEMO_REMEDIATED_CODE.trim()) {
    return true;
  }
  if (lowerFile === 'two_sum.cpp' || lowerFile === 'sample_two_sum.cpp') {
    return true;
  }
  if (trimmed.includes('twoSum') && trimmed.includes('nums') && trimmed.includes('target')) {
    return true;
  }
  if (lowerFile === 'user_profile.py' || lowerFile === 'payment_service.py') {
    return true;
  }
  return false;
}

/**
 * Retrieves the appropriate pre-computed review or perfect review.
 */
export function getDemoReviewForCode(code = '') {
  const trimmed = (code || '').trim();
  if (trimmed === DEMO_REMEDIATED_CODE.trim()) {
    return {
      ...DEMO_PERFECT_REVIEW,
      code_snippet: trimmed,
      created_at: new Date().toISOString()
    };
  }
  return {
    ...DEMO_PRECOMPUTED_REVIEW,
    code_snippet: trimmed || DEMO_SAMPLE_CODE.trim(),
    created_at: new Date().toISOString()
  };
}

export const isAnyDemoSample = isDemoSample;
