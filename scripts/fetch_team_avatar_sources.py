"""Fetch pinned, hash-verified source assets. No credentials or application installs."""
import argparse,hashlib,json,pathlib,subprocess
parser=argparse.ArgumentParser();parser.add_argument('destination',type=pathlib.Path);args=parser.parse_args()
manifest=json.loads(pathlib.Path(__file__).with_name('team-avatar-sources.json').read_text())
for item in manifest['sources']:
 target=args.destination/item['path'];target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256']:continue
 temporary=target.with_suffix(target.suffix+'.download')
 subprocess.run(['curl','--fail','--silent','--show-error','--location','--max-time','120',item['url'],'-o',str(temporary)],check=True)
 if hashlib.sha256(temporary.read_bytes()).hexdigest()!=item['sha256']:
  temporary.unlink();raise RuntimeError('Checksum mismatch: '+item['path'])
 temporary.replace(target)
print('Verified',len(manifest['sources']),'source files.')
