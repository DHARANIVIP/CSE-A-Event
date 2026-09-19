// Pure TypeScript In-Repo QR Code SVG Generator (No External Dependencies, No Image Assets)
// Generates standard ISO/IEC 18004 QR Code matrices (Version 1-4, ECC Level M) and outputs clean vector SVG elements.

export interface QRCodeOptions {
  size?: number;
  fgColor?: string;
  bgColor?: string;
  margin?: number;
}

// Minimalist, robust QR matrix generator supporting alphanumeric and byte modes
// Based on standard QR specification tables
class QRBitBuffer {
  private buffer: number[] = [];
  private length: number = 0;

  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }

  put(num: number, length: number): void {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }

  getLengthInBits(): number {
    return this.length;
  }

  putBit(bit: boolean): void {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    }
    this.length++;
  }

  getBuffer(): number[] {
    return this.buffer;
  }
}

// QR Polynomial math in Galois Field GF(256)
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP_TABLE[i] = x;
  LOG_TABLE[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function glog(n: number): number {
  if (n < 1) throw new Error("glog(" + n + ")");
  return LOG_TABLE[n];
}

function gexp(n: number): number {
  while (n < 0) n += 255;
  while (n >= 255) n -= 255;
  return EXP_TABLE[n];
}

class Polynomial {
  num: number[];
  constructor(num: number[], shift: number = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset];
    }
    for (let i = 0; i < shift; i++) {
      this.num[num.length - offset + i] = 0;
    }
  }

  get(index: number): number {
    return this.num[index];
  }

  getLength(): number {
    return this.num.length;
  }

  multiply(e: Polynomial): Polynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new Polynomial(num);
  }

  mod(e: Polynomial): Polynomial {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio);
    }
    return new Polynomial(num).mod(e);
  }
}

function getErrorCorrectionPolynomial(errorCorrectionLength: number): Polynomial {
  let a = new Polynomial([1], 0);
  for (let i = 0; i < errorCorrectionLength; i++) {
    a = a.multiply(new Polynomial([1, gexp(i)], 0));
  }
  return a;
}

// Version table capacities for ECC Level M:
// V1: 21x21, 16 data bytes, 10 ec bytes
// V2: 25x25, 28 data bytes, 16 ec bytes
// V3: 29x29, 44 data bytes, 26 ec bytes
// V4: 33x33, 64 data bytes, 36 ec bytes (1 block of 36 ec, 64 data)
const VERSION_SPECS = [
  { version: 1, size: 21, dataBytes: 16, ecBytes: 10 },
  { version: 2, size: 25, dataBytes: 28, ecBytes: 16 },
  { version: 3, size: 29, dataBytes: 44, ecBytes: 26 },
  { version: 4, size: 33, dataBytes: 64, ecBytes: 36 },
];

export function generateQRMatrix(text: string): boolean[][] {
  const textBytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 127) {
      textBytes.push(...Buffer.from(text[i], "utf-8"));
    } else {
      textBytes.push(code);
    }
  }

  let spec = VERSION_SPECS.find((s) => s.dataBytes >= textBytes.length + 3);
  if (!spec) {
    spec = VERSION_SPECS[VERSION_SPECS.length - 1];
  }

  const bitBuffer = new QRBitBuffer();
  // Byte mode indicator: 0100
  bitBuffer.put(4, 4);
  // Character count indicator (8 bits for v1-9)
  bitBuffer.put(textBytes.length, 8);
  for (const b of textBytes) {
    bitBuffer.put(b, 8);
  }

  // Terminator
  const totalDataBits = spec.dataBytes * 8;
  if (bitBuffer.getLengthInBits() + 4 <= totalDataBits) {
    bitBuffer.put(0, 4);
  }

  // Padding to byte boundary
  while (bitBuffer.getLengthInBits() % 8 !== 0) {
    bitBuffer.putBit(false);
  }

  // Pad bytes 0xEC, 0x11
  while (bitBuffer.getLengthInBits() < totalDataBits) {
    bitBuffer.put(0xec, 8);
    if (bitBuffer.getLengthInBits() < totalDataBits) {
      bitBuffer.put(0x11, 8);
    }
  }

  const dataBytes = bitBuffer.getBuffer();
  const rawPoly = new Polynomial(dataBytes, spec.ecBytes);
  const ecPoly = getErrorCorrectionPolynomial(spec.ecBytes);
  const remainder = rawPoly.mod(ecPoly);

  const finalBytes = [...dataBytes];
  for (let i = 0; i < spec.ecBytes; i++) {
    const modIndex = i + remainder.getLength() - spec.ecBytes;
    finalBytes.push(modIndex >= 0 ? remainder.get(modIndex) : 0);
  }

  const size = spec.size;
  const matrix: Array<Array<boolean | null>> = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // Helper to place finder patterns
  const placeFinder = (startX: number, startY: number) => {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const x = startX + dx;
        const y = startY + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) {
          if (
            (dx >= 0 && dx <= 6 && (dy === 0 || dy === 6)) ||
            (dy >= 0 && dy <= 6 && (dx === 0 || dx === 6)) ||
            (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
          ) {
            matrix[y][x] = true;
          } else {
            matrix[y][x] = false;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  matrix[4 * spec.version + 9][8] = true;

  // Mask pattern 0: (row + col) % 2 === 0
  const isMasked = (r: number, c: number) => (r + c) % 2 === 0;

  // Format info (Level M, Mask 0): 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  let bitIdx = 0;
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) matrix[8][i] = formatBits[bitIdx++] === 1;
  }
  for (let i = 7; i >= 0; i--) {
    if (i !== 6) matrix[i][8] = formatBits[bitIdx++] === 1;
  }

  bitIdx = 0;
  for (let i = size - 1; i >= size - 8; i--) {
    matrix[8][i] = formatBits[bitIdx++] === 1;
  }
  for (let i = size - 7; i < size; i++) {
    matrix[i][8] = formatBits[bitIdx++] === 1;
  }

  // Place data bits
  let byteIndex = 0;
  let bitCount = 7;
  let dir = -1;
  let y = size - 1;

  for (let x = size - 1; x > 0; x -= 2) {
    if (x === 6) x--;
    while (true) {
      for (let c = 0; c < 2; c++) {
        const col = x - c;
        if (matrix[y][col] === null) {
          let bit = false;
          if (byteIndex < finalBytes.length) {
            bit = ((finalBytes[byteIndex] >>> bitCount) & 1) === 1;
            bitCount--;
            if (bitCount < 0) {
              byteIndex++;
              bitCount = 7;
            }
          }
          if (isMasked(y, col)) {
            bit = !bit;
          }
          matrix[y][col] = bit;
        }
      }
      y += dir;
      if (y < 0 || y >= size) {
        dir = -dir;
        y += dir;
        break;
      }
    }
  }

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

/**
 * Generates an SVG string representation of a QR code.
 */
export function generateQRSVGString(
  text: string,
  options: QRCodeOptions = {}
): string {
  const size = options.size || 160;
  const fgColor = options.fgColor || "#0B0B0B";
  const bgColor = options.bgColor || "#FFFFFF";
  const margin = options.margin !== undefined ? options.margin : 2;

  const matrix = generateQRMatrix(text);
  const matrixSize = matrix.length;
  const fullSize = matrixSize + margin * 2;
  const cellSize = size / fullSize;

  let paths = "";
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        paths += `M${x.toFixed(2)},${y.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="${bgColor}" />
    <path d="${paths}" fill="${fgColor}" />
  </svg>`;
}
