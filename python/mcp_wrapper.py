import sys
import json
from stat_engine import analyze_data

if __name__ == "__main__":
    try:
        input_data = None
        config = {}

        # If data is pushed via stdin pipe (unified data streaming)
        if not sys.stdin.isatty():
            stdin_raw = sys.stdin.read().strip()
            if stdin_raw:
                input_data = json.loads(stdin_raw)
                
        # Fallback to positional arguments
        if not input_data and len(sys.argv) > 1 and sys.argv[1] != "STDIN":
            input_data = sys.argv[1]
            
        if len(sys.argv) > 2:
            config = json.loads(sys.argv[2])
            
        if not input_data:
            raise ValueError("No input dataset provided via stdin stream or arguments")
            
        result = analyze_data(input_data, config)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
