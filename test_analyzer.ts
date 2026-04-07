
const { analyzeIntent } = require('./lib/intentAnalyzer');

async function test() {
  try {
    const res = await analyzeIntent("summarize my emails");
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
