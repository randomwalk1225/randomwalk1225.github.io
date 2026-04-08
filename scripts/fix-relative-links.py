#!/usr/bin/env python3
"""
fix-relative-links.py
HTML 파일의 상대경로 href를 절대경로로 일괄 변환합니다.

사용법:
  python3 scripts/fix-relative-links.py            # 전체 검사 (dry-run)
  python3 scripts/fix-relative-links.py --fix      # 실제 수정
  python3 scripts/fix-relative-links.py --file us/index.html --fix
"""

import re, os, sys, argparse

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 건너뛸 확장자 (asset 파일)
ASSET_EXTS = {'.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico',
              '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.webp'}

def is_asset(href):
    """자산 파일 링크인지 확인 (수정하지 않음)"""
    _, ext = os.path.splitext(href.split('?')[0].split('#')[0])
    if ext.lower() in ASSET_EXTS:
        return True
    if '/assets/' in href:
        return True
    return False

def resolve_href(href, file_rel_path):
    """
    상대경로 href를 절대경로로 변환.
    file_rel_path: repo root 기준 파일 경로 (예: 'us/index.html')
    """
    if href.startswith('/') or href.startswith('http') or href.startswith('mailto:') or href.startswith('#'):
        return None  # 이미 절대경로 또는 건너뛸 것
    if is_asset(href):
        return None

    file_dir = os.path.dirname(file_rel_path)
    # anchor와 query string 분리
    anchor = ''
    query = ''
    base = href
    if '#' in base:
        base, anchor = base.split('#', 1)
        anchor = '#' + anchor
    if '?' in base:
        base, query = base.split('?', 1)
        query = '?' + query

    # 절대경로 계산
    joined = os.path.normpath(os.path.join(file_dir, base))
    abs_url = '/' + joined.replace('\\', '/')
    if abs_url == '/.':
        abs_url = '/'

    return abs_url + query + anchor

def process_file(file_rel_path, fix=False):
    """파일 하나를 검사/수정. (수정된 수, 문제 목록) 반환"""
    full_path = os.path.join(REPO_ROOT, file_rel_path)
    with open(full_path, encoding='utf-8', errors='ignore') as f:
        content = f.read()

    issues = []
    def replacer(m):
        href = m.group(1)
        abs_url = resolve_href(href, file_rel_path)
        if abs_url is None:
            return m.group(0)  # 변경 없음
        issues.append((href, abs_url))
        return f'href="{abs_url}"'

    new_content = re.sub(r'href="([^"]+)"', replacer, content)

    if fix and issues:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

    return issues

def main():
    parser = argparse.ArgumentParser(description='상대경로 href를 절대경로로 변환')
    parser.add_argument('--fix', action='store_true', help='실제 파일 수정')
    parser.add_argument('--file', help='특정 파일만 처리 (repo root 기준)')
    args = parser.parse_args()

    if args.file:
        files = [args.file]
    else:
        files = []
        for root, dirs, filenames in os.walk(REPO_ROOT):
            dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '__pycache__'}]
            for fn in filenames:
                if fn.endswith('.html'):
                    rel = os.path.relpath(os.path.join(root, fn), REPO_ROOT)
                    files.append(rel)

    total_issues = 0
    for f in sorted(files):
        issues = process_file(f, fix=args.fix)
        if issues:
            print(f"\n{'[수정됨]' if args.fix else '[발견]'} {f}")
            for old, new in issues:
                print(f"  {old!r:50s} → {new!r}")
            total_issues += len(issues)

    print(f"\n{'='*60}")
    if args.fix:
        print(f"✅ {total_issues}개 링크 수정 완료")
    else:
        print(f"⚠️  {total_issues}개 상대경로 발견 (수정하려면 --fix 옵션 추가)")

if __name__ == '__main__':
    main()
