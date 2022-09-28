'use strict';

var promises = require('node:fs/promises');
var core = require('@actions/core');
var github = require('@actions/github');

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var lib = {};

var diffChecker = {};

var coverageDiffer$1 = {};

var helpers = {};

Object.defineProperty(helpers, "__esModule", { value: true });
helpers.getSummaryPercentages = helpers.objectToMap = helpers.mapToObject = void 0;
const mapToObject = (map) => {
    let objMap = {};
    map.forEach((v, k) => {
        objMap[k] = v;
    });
    return objMap;
};
helpers.mapToObject = mapToObject;
const objectToMap = (obj) => new Map(Object.entries(obj));
helpers.objectToMap = objectToMap;
const getSummaryPercentages = (summary) => ({
    lines: summary.lines.pct,
    statements: summary.statements.pct,
    functions: summary.functions.pct,
    branches: summary.branches.pct
});
helpers.getSummaryPercentages = getSummaryPercentages;

Object.defineProperty(coverageDiffer$1, "__esModule", { value: true });
coverageDiffer$1.coverageDiffer = void 0;
const helpers_1 = helpers;
const coverageDiffer = (base, head) => {
    const baseMap = (0, helpers_1.objectToMap)(base);
    const headMap = (0, helpers_1.objectToMap)(head);
    const diffMap = new Map();
    headMap.forEach((v, k) => {
        const fileSummary = baseMap.get(k);
        if (fileSummary) {
            diffMap.set(k, diffSummary(v, fileSummary));
        }
        else {
            diffMap.set(k, { ...v, isNewFile: true });
        }
    });
    return (0, helpers_1.mapToObject)(diffMap);
};
coverageDiffer$1.coverageDiffer = coverageDiffer;
const diffSummary = (summaryA, summaryB) => {
    return {
        lines: diffInfo(summaryA.lines, summaryB.lines),
        statements: diffInfo(summaryA.statements, summaryB.statements),
        functions: diffInfo(summaryA.functions, summaryB.functions),
        branches: diffInfo(summaryA.branches, summaryB.branches),
        isNewFile: false
    };
};
const diffInfo = (infoA, infoB) => {
    return {
        total: infoA.total - infoB.total,
        covered: infoA.covered - infoB.covered,
        skipped: infoA.skipped - infoB.skipped,
        pct: Math.round((infoA.pct - infoB.pct) * 100) / 100
    };
};

var hasRequiredDiffChecker;

function requireDiffChecker () {
	if (hasRequiredDiffChecker) return diffChecker;
	hasRequiredDiffChecker = 1;
	Object.defineProperty(diffChecker, "__esModule", { value: true });
	diffChecker.diffChecker = void 0;
	const coverageDiffer_1 = coverageDiffer$1;
	const helpers_1 = helpers;
	const helpers_2 = helpers;
	const index_1 = requireLib();
	const diffChecker$1 = (base, head, checkCriteria = index_1.defaultOptions.checkCriteria, coverageThreshold = index_1.defaultOptions.coverageThreshold, coverageDecreaseThreshold = index_1.defaultOptions.coverageDecreaseThreshold, newFileCoverageThreshold = coverageThreshold) => {
	    let regression = false;
	    let belowThreshold = false;
	    const diff = (0, coverageDiffer_1.coverageDiffer)(base, head);
	    const diffMap = (0, helpers_1.objectToMap)(diff);
	    const percentageMap = new Map();
	    const coverageDecreased = (x) => x < 0 ? Math.abs(x) >= coverageDecreaseThreshold : false;
	    const isBelowThreshold = (x) => x < coverageThreshold;
	    const isBelowNewFileThreshold = (x) => x < newFileCoverageThreshold;
	    const checkItemBelowThreshold = (diff, coverageToCompare, checkCriteria) => {
	        const condition = diff.isNewFile
	            ? isBelowNewFileThreshold
	            : isBelowThreshold;
	        return checkCoverageForCondition(coverageToCompare, checkCriteria, condition);
	    };
	    const checkItemDecreased = (diff, checkCriteria) => {
	        if (diff.isNewFile)
	            return false;
	        return checkCoverageForCondition(diff, checkCriteria, coverageDecreased);
	    };
	    diffMap.forEach((diff, fileName) => {
	        const diffPercentages = (0, helpers_2.getSummaryPercentages)(diff);
	        if (shouldExcludeItem(diff, diffPercentages)) {
	            return;
	        }
	        const itemDecreased = checkItemDecreased(diff, checkCriteria);
	        const itemBelowThreshold = checkItemBelowThreshold(diff, head[fileName], checkCriteria);
	        if (fileName !== 'total') {
	            if (itemDecreased) {
	                regression = true;
	            }
	        }
	        if (itemBelowThreshold) {
	            belowThreshold = true;
	        }
	        percentageMap.set(fileName, {
	            deltas: {
	                ...diffPercentages
	            },
	            pcts: (0, helpers_2.getSummaryPercentages)(head[fileName]),
	            isNewFile: diff.isNewFile,
	            decreased: itemDecreased,
	            belowThreshold: itemBelowThreshold
	        });
	    });
	    let totals = percentageMap.get('total');
	    if (!totals) {
	        totals = {
	            deltas: { lines: 0, functions: 0, statements: 0, branches: 0 },
	            pcts: {
	                lines: head.total.lines.pct,
	                functions: head.total.functions.pct,
	                statements: head.total.statements.pct,
	                branches: head.total.branches.pct
	            },
	            decreased: false,
	            belowThreshold: checkCoverageForCondition(head.total, checkCriteria, isBelowThreshold),
	            isNewFile: false
	        };
	    }
	    percentageMap.delete('total');
	    return {
	        files: (0, helpers_1.mapToObject)(percentageMap),
	        diff,
	        totals,
	        regression,
	        belowThreshold
	    };
	};
	diffChecker.diffChecker = diffChecker$1;
	const checkCoverageForCondition = (coverage, checkCriteria, condition) => {
	    const diffPercentages = (0, helpers_2.getSummaryPercentages)(coverage);
	    const values = checkCriteria.map((criteria) => diffPercentages[criteria]);
	    return values.some(condition);
	};
	const zeroTest = (x) => x === 0;
	const shouldExcludeItem = (diff, diffPercentages) => {
	    if (diff.isNewFile) {
	        return false;
	    }
	    else {
	        return Object.values(diffPercentages).every(zeroTest);
	    }
	};
	return diffChecker;
}

var resultFormatter$1 = {};

/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

/**
 * Results cache
 */

var res = '';
var cache;

/**
 * Expose `repeat`
 */

var repeatString = repeat$1;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat$1(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }

  // cover common, quick use cases
  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  } else if (res.length >= max) {
    return res.substr(0, max);
  }

  while (max > res.length && num > 1) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    str += str;
  }

  res += str;
  res = res.substr(0, max);
  return res;
}

var repeat = repeatString;

var markdownTable_1 = markdownTable;

var trailingWhitespace = / +$/;

// Characters.
var space = ' ';
var lineFeed = '\n';
var dash = '-';
var colon = ':';
var verticalBar = '|';

var x = 0;
var C = 67;
var L = 76;
var R = 82;
var c = 99;
var l = 108;
var r = 114;

// Create a table from a matrix of strings.
function markdownTable(table, options) {
  var settings = options || {};
  var padding = settings.padding !== false;
  var start = settings.delimiterStart !== false;
  var end = settings.delimiterEnd !== false;
  var align = (settings.align || []).concat();
  var alignDelimiters = settings.alignDelimiters !== false;
  var alignments = [];
  var stringLength = settings.stringLength || defaultStringLength;
  var rowIndex = -1;
  var rowLength = table.length;
  var cellMatrix = [];
  var sizeMatrix = [];
  var row = [];
  var sizes = [];
  var longestCellByColumn = [];
  var mostCellsPerRow = 0;
  var cells;
  var columnIndex;
  var columnLength;
  var largest;
  var size;
  var cell;
  var lines;
  var line;
  var before;
  var after;
  var code;

  // This is a superfluous loop if we don’t align delimiters, but otherwise we’d
  // do superfluous work when aligning, so optimize for aligning.
  while (++rowIndex < rowLength) {
    cells = table[rowIndex];
    columnIndex = -1;
    columnLength = cells.length;
    row = [];
    sizes = [];

    if (columnLength > mostCellsPerRow) {
      mostCellsPerRow = columnLength;
    }

    while (++columnIndex < columnLength) {
      cell = serialize(cells[columnIndex]);

      if (alignDelimiters === true) {
        size = stringLength(cell);
        sizes[columnIndex] = size;

        largest = longestCellByColumn[columnIndex];

        if (largest === undefined || size > largest) {
          longestCellByColumn[columnIndex] = size;
        }
      }

      row.push(cell);
    }

    cellMatrix[rowIndex] = row;
    sizeMatrix[rowIndex] = sizes;
  }

  // Figure out which alignments to use.
  columnIndex = -1;
  columnLength = mostCellsPerRow;

  if (typeof align === 'object' && 'length' in align) {
    while (++columnIndex < columnLength) {
      alignments[columnIndex] = toAlignment(align[columnIndex]);
    }
  } else {
    code = toAlignment(align);

    while (++columnIndex < columnLength) {
      alignments[columnIndex] = code;
    }
  }

  // Inject the alignment row.
  columnIndex = -1;
  columnLength = mostCellsPerRow;
  row = [];
  sizes = [];

  while (++columnIndex < columnLength) {
    code = alignments[columnIndex];
    before = '';
    after = '';

    if (code === l) {
      before = colon;
    } else if (code === r) {
      after = colon;
    } else if (code === c) {
      before = colon;
      after = colon;
    }

    // There *must* be at least one hyphen-minus in each alignment cell.
    size = alignDelimiters
      ? Math.max(
          1,
          longestCellByColumn[columnIndex] - before.length - after.length
        )
      : 1;

    cell = before + repeat(dash, size) + after;

    if (alignDelimiters === true) {
      size = before.length + size + after.length;

      if (size > longestCellByColumn[columnIndex]) {
        longestCellByColumn[columnIndex] = size;
      }

      sizes[columnIndex] = size;
    }

    row[columnIndex] = cell;
  }

  // Inject the alignment row.
  cellMatrix.splice(1, 0, row);
  sizeMatrix.splice(1, 0, sizes);

  rowIndex = -1;
  rowLength = cellMatrix.length;
  lines = [];

  while (++rowIndex < rowLength) {
    row = cellMatrix[rowIndex];
    sizes = sizeMatrix[rowIndex];
    columnIndex = -1;
    columnLength = mostCellsPerRow;
    line = [];

    while (++columnIndex < columnLength) {
      cell = row[columnIndex] || '';
      before = '';
      after = '';

      if (alignDelimiters === true) {
        size = longestCellByColumn[columnIndex] - (sizes[columnIndex] || 0);
        code = alignments[columnIndex];

        if (code === r) {
          before = repeat(space, size);
        } else if (code === c) {
          if (size % 2 === 0) {
            before = repeat(space, size / 2);
            after = before;
          } else {
            before = repeat(space, size / 2 + 0.5);
            after = repeat(space, size / 2 - 0.5);
          }
        } else {
          after = repeat(space, size);
        }
      }

      if (start === true && columnIndex === 0) {
        line.push(verticalBar);
      }

      if (
        padding === true &&
        // Don’t add the opening space if we’re not aligning and the cell is
        // empty: there will be a closing space.
        !(alignDelimiters === false && cell === '') &&
        (start === true || columnIndex !== 0)
      ) {
        line.push(space);
      }

      if (alignDelimiters === true) {
        line.push(before);
      }

      line.push(cell);

      if (alignDelimiters === true) {
        line.push(after);
      }

      if (padding === true) {
        line.push(space);
      }

      if (end === true || columnIndex !== columnLength - 1) {
        line.push(verticalBar);
      }
    }

    line = line.join('');

    if (end === false) {
      line = line.replace(trailingWhitespace, '');
    }

    lines.push(line);
  }

  return lines.join(lineFeed)
}

function serialize(value) {
  return value === null || value === undefined ? '' : String(value)
}

function defaultStringLength(value) {
  return value.length
}

function toAlignment(value) {
  var code = typeof value === 'string' ? value.charCodeAt(0) : x;

  return code === L || code === l
    ? l
    : code === R || code === r
    ? r
    : code === C || code === c
    ? c
    : x
}

var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(resultFormatter$1, "__esModule", { value: true });
resultFormatter$1.resultFormatter = void 0;
const markdown_table_1 = __importDefault(markdownTable_1);
const resultFormatter = (files, total) => {
    const formattedFiles = formatFilesResults(files);
    const formattedTotal = formatTotal(total);
    return `${formattedFiles}${formattedTotal}`;
};
resultFormatter$1.resultFormatter = resultFormatter;
const formatTotal = (total) => {
    const table = [];
    const { lines, branches, functions, statements } = total.pcts;
    const lDelta = formatDelta(total.deltas.lines);
    const bDelta = formatDelta(total.deltas.branches);
    const fDelta = formatDelta(total.deltas.functions);
    const sDelta = formatDelta(total.deltas.statements);
    table.push(['Lines', 'Branches', 'Functions', 'Statements']);
    table.push([
        `${lines}%(${lDelta})`,
        `${branches}%(${bDelta})`,
        `${functions}%(${fDelta})`,
        `${statements}%(${sDelta})`
    ]);
    return '\n\nTotal:\n\n' + (0, markdown_table_1.default)(table);
};
const formatFilesResults = (files) => {
    let noChange = true;
    const table = [];
    const header = [
        'Ok',
        'File (✨=New File)',
        'Lines',
        'Branches',
        'Functions',
        'Statements'
    ];
    table.push(header);
    Object.keys(files).forEach((file) => {
        const { deltas, pcts, decreased, belowThreshold, isNewFile } = files[file];
        const row = [
            decreased || belowThreshold ? '🔴' : '✅',
            `${isNewFile ? '✨ ' : ''}${file}`,
            `${pcts.lines}%<br>(${formatDelta(deltas.lines)})`,
            `${pcts.branches}%<br>(${formatDelta(deltas.branches)})`,
            `${pcts.functions}%<br>(${formatDelta(deltas.functions)})`,
            `${pcts.statements}%<br>(${formatDelta(deltas.statements)})`
        ];
        table.push(row);
        noChange = false;
    });
    return noChange ? 'Coverage values did not change👌.' : (0, markdown_table_1.default)(table);
};
const formatDelta = (num) => {
    return num >= 0 ? `+${num}%` : `${num}%`;
};

var hasRequiredLib;

function requireLib () {
	if (hasRequiredLib) return lib;
	hasRequiredLib = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.diff = exports.defaultOptions = void 0;
		const diffChecker_1 = requireDiffChecker();
		const resultFormatter_1 = resultFormatter$1;
		exports.defaultOptions = {
		    checkCriteria: ['lines', 'branches', 'functions', 'statements'],
		    coverageThreshold: 100,
		    coverageDecreaseThreshold: 0
		};
		function diff(base, head, options = exports.defaultOptions) {
		    const { checkCriteria, coverageThreshold, coverageDecreaseThreshold, newFileCoverageThreshold } = options;
		    const { regression, files, totals, diff, belowThreshold } = (0, diffChecker_1.diffChecker)(base, head, checkCriteria, coverageThreshold, coverageDecreaseThreshold, newFileCoverageThreshold);
		    const results = (0, resultFormatter_1.resultFormatter)(files, totals);
		    return {
		        diff,
		        results,
		        regression,
		        belowThreshold
		    };
		}
		exports.diff = diff;
		exports.default = diff;
} (lib));
	return lib;
}

var libExports = requireLib();

async function main() {
    const githubToken = core.getInput("github-token");
    const headSummaryJsonFilename = core.getInput("head-summary-json");
    const baseSummaryJsonFileName = core.getInput("base-summary-json");
    const coverage = JSON.parse(await promises.readFile(headSummaryJsonFilename, "utf-8"));
    const baseSummary = JSON.parse(await promises.readFile(baseSummaryJsonFileName, "utf-8"));
    const octokit = github.getOctokit(githubToken);
    const { results: body } = libExports.diff(baseSummary, coverage, {});
    const repo = github.context.repo;
    const issue_number = github.context.payload?.pull_request?.number;
    if (issue_number != null) {
        await octokit.rest.issues.createComment({
            ...repo,
            issue_number,
            body,
        });
    }
    else {
        core.info("Skip because context does not have pull_request");
    }
}
main();
