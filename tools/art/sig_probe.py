#!/usr/bin/env python3
"""Wait for signature jobs and fetch them, knowing only their ids. A result's address holds the second it finished (UTC), which the submit call
   does not tell: so every second since the submit is tried for each job until its file turns up. Saves reading a status table per batch.
   stdin lines: '<index> <job id>'.   sig_probe.py earth [seconds to look back = 150] [give up after = 240]"""
import sys, json, os, subprocess, time, datetime
planet = sys.argv[1]; back = int(sys.argv[2]) if len(sys.argv) > 2 else 150; limit = int(sys.argv[3]) if len(sys.argv) > 3 else 240
here = os.path.dirname(os.path.abspath(__file__)); man = json.load(open(f'{here}/sigs/req/{planet}_manifest.json')); out = f'/home/claude/scratch/dl/fsig/{planet}'; os.makedirs(out, exist_ok=True)
U = 'https://d8j0ntlcm91z4.cloudfront.net/user_3MStP8inDTZqzXdo8y7jmI6IYMU/hf_'
jobs = [l.split() for l in sys.stdin if len(l.split()) == 2]; todo = {j[1]: man[j[0]] for j in jobs}; t_start = time.time(); lo = t_start - back; first = True
def stamp(t): return datetime.datetime.fromtimestamp(t, datetime.timezone.utc).strftime('%Y%m%d_%H%M%S')
while todo and time.time() - t_start < limit:
    now = time.time(); a = int(lo); urls = []  # every second since the start, every round: a miss on one try must not lose the file
    for jid, name in todo.items():
        ext = name.rsplit('.', 1)[1]
        for t in range(a, int(now) + 2): urls.append(f'{U}{stamp(t)}_{jid}.{ext}')
    r = subprocess.run(['xargs', '-P', '32', '-I', '{}', 'curl', '-s', '-o', '/dev/null', '-I', '-w', '%{http_code} {}\n', '{}'], input='\n'.join(urls), capture_output=True, text=True).stdout
    for line in r.splitlines():
        if line.startswith('200 '):
            url = line[4:]; jid = url.rsplit('_', 1)[1].rsplit('.', 1)[0]
            if jid in todo:
                dst = f'{out}/{todo[jid]}'; subprocess.run(['curl', '-sf', '-o', dst, url])
                if os.path.exists(dst) and os.path.getsize(dst) > 2000: del todo[jid]
    if todo: time.sleep(5)
print(len(jobs) - len(todo), 'of', len(jobs), 'fetched in', int(time.time() - t_start), 's;', len(os.listdir(out)), 'files'); [print('MISSING', j, n) for j, n in todo.items()]
