#!/usr/bin/env python3
"""
DigitalOcean App Platform Environment Variable Update Script

USAGE:
  1. Set environment variables for security:
     export DO_TOKEN="your_do_token"
     export DO_APP_ID="your_app_id"
  
  2. Run the script:
     python3 scripts/update_do_spec.py
     
  Alternatively, pass as command line arguments:
     python3 scripts/update_do_spec.py --token=xxx --app-id=xxx
"""
import json
import subprocess
import sys
import os
import argparse

def main():
    parser = argparse.ArgumentParser(description='Update DO App Platform env vars')
    parser.add_argument('--token', default=os.environ.get('DO_TOKEN'))
    parser.add_argument('--app-id', default=os.environ.get('DO_APP_ID'))
    args = parser.parse_args()
    
    if not args.token or not args.app_id:
        print("Error: DO_TOKEN and DO_APP_ID are required")
        print("Set them as environment variables or pass --token and --app-id")
        sys.exit(1)
    
    print("Fetching current app spec...")
    
    result = subprocess.run([
        "curl", "-s", "-X", "GET",
        "-H", "Content-Type: application/json",
        "-H", f"Authorization: Bearer {args.token}",
        f"https://api.digitalocean.com/v2/apps/{args.app_id}"
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error fetching app: {result.stderr}")
        sys.exit(1)
    
    data = json.loads(result.stdout)
    spec = data['app']['spec']
    
    for service in spec.get('services', []):
        if service.get('name') == 'synoptic-web':
            envs = service.get('envs', [])
            existing_keys = {e['key'] for e in envs}
            
            # Read new_envs from environment or hardcode non-secret values
            new_envs = [
                {"key": "JWT_SECRET", "value": os.environ.get('JWT_SECRET', 'synoptic-secure-jwt-secret-2025-production-key'), "scope": "RUN_TIME", "type": "SECRET"},
                {"key": "NEXT_PUBLIC_APP_URL", "value": "https://getsynoptic.com", "scope": "RUN_AND_BUILD_TIME"},
                {"key": "NEXT_PUBLIC_AI_AGENT_LINGUIST_ID", "value": os.environ.get('AI_AGENT_LINGUIST_ID', ''), "scope": "RUN_AND_BUILD_TIME"},
                {"key": "NEXT_PUBLIC_AI_AGENT_PHILOLOGIST_ID", "value": os.environ.get('AI_AGENT_PHILOLOGIST_ID', ''), "scope": "RUN_AND_BUILD_TIME"},
                {"key": "NEXT_PUBLIC_ENABLE_AI_FEATURES", "value": "true", "scope": "RUN_AND_BUILD_TIME"},
            ]
            
            for new_env in new_envs:
                if new_env['value'] and new_env['key'] not in existing_keys:
                    envs.append(new_env)
                    print(f"+ Adding: {new_env['key']}")
                elif new_env['key'] in existing_keys:
                    print(f"= Already exists: {new_env['key']}")
            
            deduped = []
            seen = set()
            for e in envs:
                if e['key'] == 'DATABASE_URL' and '${' not in e.get('value', ''):
                    print(f"- Removing duplicate: DATABASE_URL (hardcoded)")
                    continue
                if e['key'] not in seen:
                    deduped.append(e)
                    seen.add(e['key'])
            service['envs'] = deduped
            print(f"Total envs: {len(deduped)}")
    
    print("Applying update to DigitalOcean...")
    apply_result = subprocess.run([
        "curl", "-s", "-X", "PUT",
        "-H", "Content-Type: application/json",
        "-H", f"Authorization: Bearer {args.token}",
        "-d", json.dumps({"spec": spec}),
        f"https://api.digitalocean.com/v2/apps/{args.app_id}"
    ], capture_output=True, text=True)
    
    if "error" in apply_result.stdout.lower():
        print(f"Error: {apply_result.stdout}")
        sys.exit(1)
    
    print("✓ App Platform environment variables updated successfully!")
    print("A new deployment will start automatically.")

if __name__ == "__main__":
    main()
