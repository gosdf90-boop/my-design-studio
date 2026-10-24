"""Package only static app assets; never include source, credentials, or local data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
built = root / 'dist'
if not (built / 'index.html').is_file():
    raise SystemExit('Run npm run build first.')
target = root / 'my-atelier-deploy.zip'
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for file in sorted(built.rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(built))
with ZipFile(target) as archive:
    assert 'index.html' in archive.namelist()
    assert archive.testzip() is None
print(f'{target.name}: {target.stat().st_size:,} bytes; ready for static hosting')
