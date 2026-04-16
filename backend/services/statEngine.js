const { spawn } = require('child_process');
const path = require('path');

/**
 * Universal bridge service to orchestrate the Python MCP statistical engine.
 */
const runStatisticalAnalysis = (data, config = {}) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../python/mcp_wrapper.py');
    
    // Pass STDIN flag to trigger standard input mode, and safely serialize the configuration block
    const pythonProcess = spawn('python', [scriptPath, 'STDIN', JSON.stringify(config)]);
    
    let outputData = '';
    let errorData = '';
    
    // Pipe huge un-paginated JSON datasets directly into python via native sys.stdin
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();
    
    // Collect JSON output cleanly
    pythonProcess.stdout.on('data', (chunk) => {
      outputData += chunk.toString();
    });
    
    // Collect runtime errors / warnings
    pythonProcess.stderr.on('data', (chunk) => {
      errorData += chunk.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${errorData}`));
      }
      
      try {
        const result = JSON.parse(outputData);
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python Output: ${err.message}. Output Preview: ${outputData.substring(0, 500)}...`));
      }
    });
  });
};

module.exports = {
  runStatisticalAnalysis,
};
