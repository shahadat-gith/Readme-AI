import path from 'path';

// Regex patterns to detect function, class, and module boundaries across languages
const BOUNDARY_PATTERNS = [
  /^\s*(export\s+)?(default\s+)?(async\s+)?function\s+\w*\s*\(/m,
  /^\s*(export\s+)?class\s+\w+/m,
  /^\s*(export\s+)?(default\s+)?(const|let|var)\s+\w+\s*=\s*(\([^)]*\)|[\w<>]+)\s*[=:]\s*(\(|async|function)/m,
  /^\s*(export\s+)?interface\s+\w+/m,
  /^\s*(export\s+)?type\s+\w+\s*=/m,
  /^\s*(export\s+)?enum\s+\w+/m,
  /^\s*module\s+\w+/m,
  /^\s*(public|private|protected|static)?\s*(async\s+)?\w+\s*\([^)]*\)\s*{/m,
  /^\s*def\s+\w+\s*\(/m,
  /^\s*class\s+\w+/m,
  /^\s*(pub\s+)?(async\s+)?fn\s+\w+/m,
  /^\s*func\s+\w+/m,
  /^\s*function\s+\w+/m,
];

function isBoundaryLine(line) {
  return BOUNDARY_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Chunks source code by function/class/module boundaries for more meaningful segments.
 * Falls back to line-based sliding window for files without clear boundaries.
 *
 * @param {Array<{filePath: string, content: string}>} files
 * @param {number} maxLinesPerChunk - Max lines per chunk for fallback.
 * @param {number} overlapLinesCount - Line overlap for fallback sliding window.
 * @returns {Array<Object>} Structured array of code chunks.
 */
export function chunkSourceCode(files, maxLinesPerChunk = 60, overlapLinesCount = 15) {
  const codeSegments = [];

  for (const file of files) {
    const extension = path.extname(file.filePath).toLowerCase();
    const lines = file.content.split('\n');

    // Small files: keep as single chunk
    if (lines.length <= maxLinesPerChunk) {
      codeSegments.push({
        filePath: file.filePath,
        chunk: file.content,
        metadata: {
          startLine: 1,
          endLine: lines.length,
          language: extension.replace('.', ''),
        },
      });
      continue;
    }

    // Try to find function/class boundaries
    const boundaries = [];
    for (let i = 0; i < lines.length; i++) {
      if (isBoundaryLine(lines[i])) {
        boundaries.push(i);
      }
    }

    // If boundary-based chunking is feasible (at least 2 boundaries), use it
    if (boundaries.length >= 2) {
      for (let i = 0; i < boundaries.length; i++) {
        const startLine = boundaries[i];
        const endLine = i + 1 < boundaries.length ? boundaries[i + 1] : lines.length;
        const chunkContent = lines.slice(startLine, endLine).join('\n').trim();

        if (chunkContent.length > 0) {
          codeSegments.push({
            filePath: file.filePath,
            chunk: chunkContent,
            metadata: {
              startLine: startLine + 1,
              endLine,
              language: extension.replace('.', ''),
            },
          });
        }
      }
    } else {
      // Fallback: sliding window chunking for files without clear boundaries
      let startPointer = 0;
      while (startPointer < lines.length) {
        const endPointer = Math.min(startPointer + maxLinesPerChunk, lines.length);

        codeSegments.push({
          filePath: file.filePath,
          chunk: lines.slice(startPointer, endPointer).join('\n'),
          metadata: {
            startLine: startPointer + 1,
            endLine: endPointer,
            language: extension.replace('.', ''),
          },
        });

        startPointer += maxLinesPerChunk - overlapLinesCount;
      }
    }
  }

  return codeSegments;
}
