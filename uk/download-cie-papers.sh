#!/bin/bash
# Download CIE Past Papers for Physics (9702) and Chemistry (9701)
# Usage: bash download-cie-papers.sh [physics|chemistry|both]
# Source: PapaCambridge

SUBJECT="${1:-both}"
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload"

download_cie() {
    local SYLLABUS=$1
    local SUBJECT_DIR=$2
    local DEST="${BASE_DIR}/${SUBJECT_DIR}/papers/cie"
    local COUNT=0
    local SKIP=0

    mkdir -p "$DEST"
    echo "=== Downloading CIE ${SYLLABUS} papers to ${DEST} ==="

    for YEAR in $(seq 15 24); do
        for SESS in m s w; do
            for PAPER in 1 2 3 4 5; do
                for VARIANT in 1 2 3; do
                    for DOCTYPE in qp ms; do
                        FNAME="${SYLLABUS}_${SESS}${YEAR}_${DOCTYPE}_${PAPER}${VARIANT}.pdf"

                        # Skip if already downloaded and valid
                        if [ -f "${DEST}/${FNAME}" ] && [ "$(file -b --mime-type "${DEST}/${FNAME}")" = "application/pdf" ]; then
                            SKIP=$((SKIP + 1))
                            continue
                        fi

                        URL="${BASE_URL}/${FNAME}"
                        HTTP_CODE=$(curl -s -o "${DEST}/${FNAME}" -w "%{http_code}" -L --max-time 15 "$URL")

                        if [ "$HTTP_CODE" = "200" ]; then
                            # Verify it's actually a PDF
                            MIME=$(file -b --mime-type "${DEST}/${FNAME}")
                            if [ "$MIME" = "application/pdf" ]; then
                                COUNT=$((COUNT + 1))
                                echo "  ✓ ${FNAME}"
                            else
                                rm -f "${DEST}/${FNAME}"
                            fi
                        else
                            rm -f "${DEST}/${FNAME}"
                        fi
                    done
                done
            done
        done
        echo "  Year 20${YEAR} complete (${COUNT} downloaded so far, ${SKIP} skipped)"
    done

    echo "=== ${SYLLABUS}: ${COUNT} new PDFs downloaded, ${SKIP} already existed ==="

    # Update manifest.json with only valid PDFs
    echo "Updating manifest.json..."
    cd "$DEST"
    python3 -c "
import os, json
files = []
for f in sorted(os.listdir('.')):
    if f.endswith('.pdf'):
        size = os.path.getsize(f)
        if size > 1000:
            files.append({'name': f, 'size': size})
with open('manifest.json', 'w') as mf:
    json.dump(files, mf, indent=2)
print(f'Manifest updated: {len(files)} valid PDFs')
"
}

if [ "$SUBJECT" = "physics" ] || [ "$SUBJECT" = "both" ]; then
    download_cie "9702" "a-level-physics"
fi

if [ "$SUBJECT" = "chemistry" ] || [ "$SUBJECT" = "both" ]; then
    download_cie "9701" "a-level-chemistry"
fi

echo ""
echo "Done! Deploy with:"
echo "  npx wrangler pages deploy . --project-name=gitblog1104 --commit-dirty=true"
