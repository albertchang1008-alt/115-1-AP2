import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from datetime import date

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/prune-evidence.py'
spec = importlib.util.spec_from_file_location('prune', SCRIPT)
prune = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prune)

class EvidenceTests(unittest.TestCase):
    def test_strict_seven_day_boundary_and_invalid_dates(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ['2026-10-15', '2026-10-16', '2026-10-23', '2026-10-24', '2026-02-30', 'notes']:
                (root/name).mkdir()
            rows, ignored = prune.inventory(root, date(2026,10,23))
            self.assertEqual([r['date'] for r in rows if r['eligible']], ['2026-10-15'])
            self.assertEqual(ignored, ['2026-02-30', 'notes'])

    def test_manifest_commits_and_symlinks_never_followed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); folder = root/'2026-10-15'; folder.mkdir()
            payload = json.dumps({'commit':'a'*40, 'nested':{'baseCommit':'b'*8, 'token':'secret'}})
            (folder/'manifest.json').write_text(payload)
            (folder/'screen.png').write_bytes(b'123')
            (folder/'loop').symlink_to(root, target_is_directory=True)
            (root/'2026-10-14').symlink_to(folder, target_is_directory=True)
            rows, ignored = prune.inventory(root,date(2026,10,23))
            self.assertEqual(rows[0]['bytes'], len(payload.encode())+3)
            self.assertEqual(rows[0]['commits'], ['a'*40,'b'*8])
            self.assertIn('2026-10-14',ignored)

    def test_cli_default_is_non_destructive(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp)/'2026-10-01';folder.mkdir();file=folder/'keep.txt';file.write_text('keep')
            result=subprocess.run([sys.executable,str(SCRIPT),'--root',tmp,'--today','2026-10-23'],capture_output=True,text=True,check=True)
            self.assertIn('DRY-RUN',result.stdout);self.assertIn('Deleted: 0',result.stdout)
            self.assertEqual(file.read_text(),'keep')

    def test_protected_repository_root_is_rejected(self):
        result=subprocess.run([sys.executable,str(SCRIPT),'--root',str(SCRIPT.parents[1])],capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0)

if __name__=='__main__':unittest.main()
