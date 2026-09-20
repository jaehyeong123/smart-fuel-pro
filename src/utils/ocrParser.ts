/**
 * Specialized Korean Receipt & Dashboard Odometer OCR Heuristic Parser
 */

export interface ParsedOdometer {
  odometer: number | null;
  confidenceNote: string;
  rawCandidates: number[];
}

export interface ParsedReceipt {
  liters: number | null;
  totalCost: number | null;
  unitPrice: number | null;
  gasStation: string | null;
  date: string | null;
  rawText: string;
}

/**
 * Parses dashboard photo OCR text for Cumulative Odometer (km)
 */
export function parseOdometerText(text: string): ParsedOdometer {
  // Normalize
  const cleaned = text.replace(/,/g, '');
  const lines = cleaned.split('\n');

  const candidates: number[] = [];

  // Pattern 1: explicit km or ODO indicator (e.g., "ODO 58420 km", "124500km", "68412 km")
  const kmRegex = /(?:odo|누적|주행)?\s*([0-9]{3,7})\s*(?:km|k|킬로)?/gi;
  let match;
  while ((match = kmRegex.exec(cleaned)) !== null) {
    const val = parseInt(match[1], 10);
    // Reasonable odometer range (1,000 km to 999,999 km)
    if (val >= 500 && val <= 999999) {
      candidates.push(val);
    }
  }

  // Pattern 2: line-by-line inspection
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for numbers of length 4 to 6 digits on the line
    const nums = trimmed.match(/\b\d{4,6}\b/g);
    if (nums) {
      for (const n of nums) {
        const val = parseInt(n, 10);
        if (val >= 1000 && val <= 999999 && !candidates.includes(val)) {
          candidates.push(val);
        }
      }
    }
  }

  // Filter and pick: usually the largest integer on odometer display is the cumulative mileage
  // (trip meters are usually smaller, clock is 1200 or 2400, temp is 0~40)
  if (candidates.length === 0) {
    return {
      odometer: null,
      confidenceNote: '인식된 주행거리 숫자를 찾지 못했습니다. 직접 입력해주세요.',
      rawCandidates: []
    };
  }

  // Sort descending
  candidates.sort((a, b) => b - a);
  const bestOdo = candidates[0];

  return {
    odometer: bestOdo,
    confidenceNote: `주행거리 ${bestOdo.toLocaleString()} km가 감지되었습니다.`,
    rawCandidates: candidates
  };
}

/**
 * Parses gas receipt OCR text for Liters, Payment, Unit Price, and Station
 */
export function parseReceiptText(text: string): ParsedReceipt {
  let liters: number | null = null;
  let totalCost: number | null = null;
  let unitPrice: number | null = null;
  let gasStation: string | null = null;
  let date: string | null = null;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Detect Gas Station Name / Brand
  const stationBrands = [
    { pattern: /(?:GS|gs|지에스)(?:칼텍스|caltex)?/i, name: 'GS칼텍스' },
    { pattern: /(?:SK|sk|에스케이)(?:에너지|주유소|엔크린)?/i, name: 'SK에너지' },
    { pattern: /(?:S-OIL|S-oil|에쓰오일|에스오일)/i, name: 'S-OIL' },
    { pattern: /(?:현대오일뱅크|HD현대|오일뱅크)/i, name: 'HD현대오일뱅크' },
    { pattern: /(?:알뜰주유소|알뜰|ex주유소)/i, name: '알뜰주유소' },
    { pattern: /(?:농협주유소|NH-OIL|NH주유소)/i, name: '농협 NH-OIL' }
  ];

  for (const line of lines) {
    if (!gasStation) {
      for (const brand of stationBrands) {
        if (brand.pattern.test(line)) {
          gasStation = brand.name;
          // Look if there's branch name after
          const branchMatch = line.match(/(?:주유소|지점|점)\b/);
          if (branchMatch) {
            gasStation = line.substring(0, 25).trim();
          }
          break;
        }
      }
    }
  }

  // Fallback station search: lines containing '주유소'
  if (!gasStation) {
    for (const line of lines) {
      if (line.includes('주유소') || line.includes('충전소')) {
        gasStation = line.replace(/[^\w가-힣\s]/g, '').trim().slice(0, 20);
        break;
      }
    }
  }

  // 2. Detect Fuel Volume (Liters)
  // Usually has decimals (e.g. "35.24", "40.00", "52.830 L")
  // Or keywords: 주유량, 수량, 리터, L
  for (const line of lines) {
    const cleanLine = line.replace(/,/g, '');

    // Pattern A: line contains 주유량 / 수량 followed or preceded by number
    if (/주유량|수\s*량|용\s*량|체\s*적/i.test(cleanLine)) {
      const volMatch = cleanLine.match(/(\d{1,3}(?:\.\d{1,3})?)/);
      if (volMatch) {
        const val = parseFloat(volMatch[1]);
        if (val >= 3 && val <= 180) {
          liters = val;
          break;
        }
      }
    }

    // Pattern B: explicitly tagged with L or 리터
    const lMatch = cleanLine.match(/(\d{1,3}\.\d{1,3})\s*(?:L|l|리터|ℓ)/);
    if (lMatch && !liters) {
      const val = parseFloat(lMatch[1]);
      if (val >= 3 && val <= 180) {
        liters = val;
      }
    }
  }

  // Fallback for liters: search all float numbers between 5.0 and 150.0
  if (!liters) {
    const allFloats = text.match(/\b\d{1,3}\.\d{2,3}\b/g);
    if (allFloats) {
      for (const f of allFloats) {
        const val = parseFloat(f);
        if (val >= 5 && val <= 120) {
          liters = val;
          break;
        }
      }
    }
  }

  // 3. Detect Total Cost (Payment Amount)
  // Look for keywords: 합계, 결제금액, 승인금액, 주유금액, 총액
  for (const line of lines) {
    const cleanLine = line.replace(/,/g, '');
    if (/결제|승인|합계|총액|주유금액|받을금액|신용/i.test(cleanLine)) {
      const priceMatch = cleanLine.match(/(\d{4,7})/);
      if (priceMatch) {
        const val = parseInt(priceMatch[1], 10);
        if (val >= 5000 && val <= 500000) {
          totalCost = val;
          break;
        }
      }
    }
  }

  // Fallback for total cost: look for standard fuel payment chunks (e.g. 30,000 ~ 150,000)
  if (!totalCost) {
    const allNumsWithComma = text.match(/\b\d{1,3},\d{3}\b/g);
    if (allNumsWithComma) {
      const costs = allNumsWithComma
        .map(s => parseInt(s.replace(/,/g, ''), 10))
        .filter(n => n >= 10000 && n <= 300000);
      if (costs.length > 0) {
        // Highest number in that range is almost always the grand total
        totalCost = Math.max(...costs);
      }
    }
  }

  // 4. Detect Unit Price
  for (const line of lines) {
    const cleanLine = line.replace(/,/g, '');
    if (/단가|판매가/i.test(cleanLine)) {
      const unitMatch = cleanLine.match(/(\d{4})/);
      if (unitMatch) {
        const val = parseInt(unitMatch[1], 10);
        if (val >= 1200 && val <= 2600) {
          unitPrice = val;
          break;
        }
      }
    }
  }

  // Auto-calculate missing unit price if we have total cost and liters
  if (!unitPrice && totalCost && liters && liters > 0) {
    unitPrice = Math.round(totalCost / liters);
  } else if (!totalCost && unitPrice && liters && liters > 0) {
    totalCost = Math.round(unitPrice * liters);
  }

  // 5. Date detection (e.g. 2024-05-12 or 2024/05/12)
  const dateMatch = text.match(/\b(202[3-9])[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12][0-9]|3[01])\b/);
  if (dateMatch) {
    date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }

  return {
    liters: liters ? Number(liters.toFixed(2)) : null,
    totalCost,
    unitPrice,
    gasStation,
    date,
    rawText: text
  };
}
