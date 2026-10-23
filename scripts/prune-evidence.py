"""List expired date-named evidence folders; deletion requires explicit --apply."""
import argparse
from datetime import date, datetime, timedelta
import json
import os
from pathlib import Path
import re
import shutil
from zoneinfo import ZoneInfo

DEFAULT_ROOT = Path('/Users/HHC/Documents/ChatGPT/課程平台-驗收證據')
DATE_NAME = re.compile(r'\d{4}-\d{2}-\d{2}')
COMMIT = re.compile(r'[a-fA-F0-9]{7,40}')


def inspect_folder(folder):
    size, commits, manifests = 0, set(), []
    for parent, dirs, files in os.walk(folder, followlinks=False):
        dirs[:] = sorted(d for d in dirs if not (Path(parent) / d).is_symlink())
        for name in sorted(files):
            path = Path(parent) / name
            if path.is_symlink():
                continue
            size += path.stat().st_size
            if name.startswith('manifest') and path.suffix == '.json':
                manifests.append(str(path.relative_to(folder)))
                try:
                    data = json.loads(path.read_text())
                except (OSError, ValueError, UnicodeError):
                    continue
                def visit(value):
                    if isinstance(value, dict):
                        for key, item in value.items():
                            if 'commit' in key.lower() and isinstance(item, str) and COMMIT.fullmatch(item):
                                commits.add(item)
                            visit(item)
                    elif isinstance(value, list):
                        for item in value:
                            visit(item)
                visit(data)
    return size, sorted(commits), manifests


def inventory(root, today):
    cutoff = today - timedelta(days=7)
    rows, ignored = [], []
    if not root.exists():
        return rows, ignored
    for folder in sorted(root.iterdir()):
        if folder.is_symlink() or not folder.is_dir() or not DATE_NAME.fullmatch(folder.name):
            ignored.append(folder.name)
            continue
        try:
            folder_date = date.fromisoformat(folder.name)
        except ValueError:
            ignored.append(folder.name)
            continue
        size, commits, manifests = inspect_folder(folder)
        rows.append(dict(date=folder.name, bytes=size, commits=commits, manifests=manifests,
                         eligible=folder_date < cutoff, inode=folder.stat().st_ino))
    return rows, ignored


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=DEFAULT_ROOT)
    parser.add_argument('--today', type=date.fromisoformat, help='Override Taipei date for reproducible audits')
    parser.add_argument('--apply', action='store_true', help='Delete only listed folders older than seven days')
    args = parser.parse_args()
    root = args.root.absolute()
    repo = Path(__file__).resolve().parents[1]
    if root.is_symlink() or root.resolve() in (Path('/'), Path.home(), repo) or root.resolve() in repo.parents or repo in root.resolve().parents:
        parser.error('Evidence root must be outside repository and cannot be a symlink or protected root')
    today = args.today or datetime.now(ZoneInfo('Asia/Taipei')).date()
    rows, ignored = inventory(root, today)
    eligible = [row for row in rows if row['eligible']]
    print(f"{'APPLY' if args.apply else 'DRY-RUN'} root={root} today={today} cutoff(exclusive)={today-timedelta(days=7)}")
    for row in rows:
        print(f"{'DELETE' if row['eligible'] else 'KEEP'} {row['date']} {row['bytes']} bytes ({row['bytes']/1_000_000:.3f} MB) commits={','.join(row['commits']) or 'unknown'} manifests={','.join(row['manifests']) or 'none'}")
    if ignored:
        print('IGNORED (not date folders or symlinks): ' + ', '.join(ignored))
    total = sum(row['bytes'] for row in eligible)
    print(f"Eligible: {len(eligible)} folders; {total} bytes ({total/1_000_000:.3f} MB)")
    if args.apply:
        for row in eligible:
            folder = root / row['date']
            if folder.is_symlink() or folder.parent.resolve() != root.resolve() or folder.stat().st_ino != row['inode']:
                raise RuntimeError('Folder changed after inventory; stop')
            shutil.rmtree(folder)
            print('DELETED ' + row['date'])
    print(f"Deleted: {len(eligible) if args.apply else 0}")


if __name__ == '__main__':
    main()
