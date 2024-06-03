(function (root) {
  var sudoku = (root.sudoku = {});

  sudoku.DIGITS = "123456789";
  var ROWS = "ABCDEFGHI";
  var COLS = sudoku.DIGITS;
  var SQUARES = null;

  var UNITS = null;
  var SQUARE_UNITS_MAP = null;
  var SQUARE_PEERS_MAP = null;

  var MIN_GIVENS = 17;
  var NR_SQUARES = 81;

  sudoku.BLANK_CHAR = ".";
  sudoku.BLANK_BOARD =
    "...................................................." +
    ".............................";
  function initialize() {
    SQUARES = sudoku._cross(ROWS, COLS);
    UNITS = sudoku._get_all_units(ROWS, COLS);
    SQUARE_UNITS_MAP = sudoku._get_square_units_map(SQUARES, UNITS);
    SQUARE_PEERS_MAP = sudoku._get_square_peers_map(SQUARES, SQUARE_UNITS_MAP);
  }

  sudoku.solve = function (board, reverse) {
    var report = sudoku.validate_board(board);
    if (report !== true) {
      throw report;
    }
    var nr_givens = 0;
    for (var i in board) {
      if (
        board[i] !== sudoku.BLANK_CHAR &&
        sudoku._in(board[i], sudoku.DIGITS)
      ) {
        ++nr_givens;
      }
    }
    if (nr_givens < MIN_GIVENS) {
      throw "Too few givens. Minimum givens is " + MIN_GIVENS;
    }

    // Default reverse to false
    reverse = reverse || false;

    var candidates = sudoku._get_candidates_map(board);
    var result = sudoku._search(candidates, reverse);

    if (result) {
      var solution = "";
      for (var square in result) {
        solution += result[square];
      }
      return solution;
    }
    return false;
  };

  sudoku._get_candidates_map = function (board) {
    var report = sudoku.validate_board(board);
    if (report !== true) {
      throw report;
    }

    var candidate_map = {};
    var squares_values_map = sudoku._get_square_vals_map(board);

    // Start by assigning every digit as a candidate to every square
    for (var si in SQUARES) {
      candidate_map[SQUARES[si]] = sudoku.DIGITS;
    }

    // For each non-blank square, assign its value in the candidate map and
    // propigate.
    for (var square in squares_values_map) {
      var val = squares_values_map[square];

      if (sudoku._in(val, sudoku.DIGITS)) {
        var new_candidates = sudoku._assign(candidate_map, square, val);

        // Fail if we can't assign val to square
        if (!new_candidates) {
          return false;
        }
      }
    }

    return candidate_map;
  };

  sudoku._search = function (candidates, reverse) {
    if (!candidates) {
      return false;
    }
    reverse = reverse || false;

    var max_nr_candidates = 0;
    var max_candidates_square = null;
    for (var si in SQUARES) {
      var square = SQUARES[si];

      var nr_candidates = candidates[square].length;

      if (nr_candidates > max_nr_candidates) {
        max_nr_candidates = nr_candidates;
        max_candidates_square = square;
      }
    }
    if (max_nr_candidates === 1) {
      return candidates;
    }

    var min_nr_candidates = 10;
    var min_candidates_square = null;
    for (si in SQUARES) {
      var square = SQUARES[si];

      var nr_candidates = candidates[square].length;

      if (nr_candidates < min_nr_candidates && nr_candidates > 1) {
        min_nr_candidates = nr_candidates;
        min_candidates_square = square;
      }
    }
    var min_candidates = candidates[min_candidates_square];
    if (!reverse) {
      for (var vi in min_candidates) {
        var val = min_candidates[vi];
        var candidates_copy = JSON.parse(JSON.stringify(candidates));
        var candidates_next = sudoku._search(
          sudoku._assign(candidates_copy, min_candidates_square, val)
        );

        if (candidates_next) {
          return candidates_next;
        }
      }
    } else {
      for (var vi = min_candidates.length - 1; vi >= 0; --vi) {
        var val = min_candidates[vi];
        var candidates_copy = JSON.parse(JSON.stringify(candidates));
        var candidates_next = sudoku._search(
          sudoku._assign(candidates_copy, min_candidates_square, val),
          reverse
        );

        if (candidates_next) {
          return candidates_next;
        }
      }
    }
    return false;
  };

  sudoku._assign = function (candidates, square, val) {
    var other_vals = candidates[square].replace(val, "");
    for (var ovi in other_vals) {
      var other_val = other_vals[ovi];

      var candidates_next = sudoku._eliminate(candidates, square, other_val);

      if (!candidates_next) {
        return false;
      }
    }

    return candidates;
  };

  sudoku._eliminate = function (candidates, square, val) {
    if (!sudoku._in(val, candidates[square])) {
      return candidates;
    }
    candidates[square] = candidates[square].replace(val, "");
    var nr_candidates = candidates[square].length;
    if (nr_candidates === 1) {
      var target_val = candidates[square];

      for (var pi in SQUARE_PEERS_MAP[square]) {
        var peer = SQUARE_PEERS_MAP[square][pi];

        var candidates_new = sudoku._eliminate(candidates, peer, target_val);

        if (!candidates_new) {
          return false;
        }
      }
    }
    if (nr_candidates === 0) {
      return false;
    }
    for (var ui in SQUARE_UNITS_MAP[square]) {
      var unit = SQUARE_UNITS_MAP[square][ui];

      var val_places = [];
      for (var si in unit) {
        var unit_square = unit[si];
        if (sudoku._in(val, candidates[unit_square])) {
          val_places.push(unit_square);
        }
      }

      // If there's no place for this value, we have a contradition!
      // return false
      if (val_places.length === 0) {
        return false;

        // Otherwise the value can only be in one place. Assign it there.
      } else if (val_places.length === 1) {
        var candidates_new = sudoku._assign(candidates, val_places[0], val);

        if (!candidates_new) {
          return false;
        }
      }
    }

    return candidates;
  };

  sudoku._get_square_vals_map = function (board) {
    var squares_vals_map = {};
    if (board.length != SQUARES.length) {
      throw "Board/squares length mismatch.";
    } else {
      for (var i in SQUARES) {
        squares_vals_map[SQUARES[i]] = board[i];
      }
    }

    return squares_vals_map;
  };

  sudoku._get_square_units_map = function (squares, units) {
    var square_unit_map = {};
    for (var si in squares) {
      var cur_square = squares[si];
      var cur_square_units = [];
      for (var ui in units) {
        var cur_unit = units[ui];

        if (cur_unit.indexOf(cur_square) !== -1) {
          cur_square_units.push(cur_unit);
        }
      }
      square_unit_map[cur_square] = cur_square_units;
    }

    return square_unit_map;
  };

  sudoku._get_square_peers_map = function (squares, units_map) {
    var square_peers_map = {};
    for (var si in squares) {
      var cur_square = squares[si];
      var cur_square_units = units_map[cur_square];
      var cur_square_peers = [];
      for (var sui in cur_square_units) {
        var cur_unit = cur_square_units[sui];

        for (var ui in cur_unit) {
          var cur_unit_square = cur_unit[ui];

          if (
            cur_square_peers.indexOf(cur_unit_square) === -1 &&
            cur_unit_square !== cur_square
          ) {
            cur_square_peers.push(cur_unit_square);
          }
        }
      }
      square_peers_map[cur_square] = cur_square_peers;
    }

    return square_peers_map;
  };

  sudoku._get_all_units = function (rows, cols) {
    var units = [];

    for (var ri in rows) {
      units.push(sudoku._cross(rows[ri], cols));
    }

    for (var ci in cols) {
      units.push(sudoku._cross(rows, cols[ci]));
    }

    var row_squares = ["ABC", "DEF", "GHI"];
    var col_squares = ["123", "456", "789"];
    for (var rsi in row_squares) {
      for (var csi in col_squares) {
        units.push(sudoku._cross(row_squares[rsi], col_squares[csi]));
      }
    }

    return units;
  };

  sudoku.validate_board = function (board) {
    if (!board) {
      return "Empty board";
    }
    return true;
  };

  sudoku._cross = function (a, b) {
    var result = [];
    for (var ai in a) {
      for (var bi in b) {
        result.push(a[ai] + b[bi]);
      }
    }
    return result;
  };

  sudoku._in = function (v, seq) {
    return seq.indexOf(v) !== -1;
  };

  initialize();
})(this);
