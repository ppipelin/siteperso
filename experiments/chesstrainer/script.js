var board = document.querySelector("chess-board");
var file;

var tree = {};
var index = [];
var path = [];
var index_subpath = 0;
var color = 1; // white first
var chess_text = document.getElementById("chess_text")
var counter = 1; // counts rounds for display
var board_path;
var board_color;

function showPosition() {
	console.log("Current position as an Object:");
	console.log(board.position);
	console.log("Current position as a FEN string:");
	console.log(board.fen());
}

function loadboard(localpath = board_path, localcolor = board_color) {
	board = document.querySelector("chess-board");
	setTimeout(function () { board.start(); }, 10);
	path = [];
	index_subpath = 0;
	color = 1;
	if (!file) {
		loadGame(localpath, localcolor);
	} else {
		file = document.querySelector(".resize-ta").value;
		createTree();
	}
	chess_text.innerHTML = "";
	chess_text.appendChild(document.createTextNode("loaded"));
	chess_text.appendChild(document.createElement("br"));
	counter = 1;
}

function loadGame(path, color) {
	board_path = path;
	board_color = color;
	readTextFile(path);
	board.orientation = color;
	document.querySelector(".resize-ta").value = file;
	createTree();
}

function readTextFile(filename) {
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", filename, false);
	rawFile.onreadystatechange = function () {
		if (rawFile.readyState === 4) {
			if (rawFile.status === 200 || rawFile.status == 0) {
				var allText = rawFile.responseText;
				file = allText;
			}
		}
	}
	rawFile.send(null);
}

function createTree() {
	var splitted_line = file.split("\n");
	var last_number_tabs = 0;
	tree = { value: splitted_line[0].replace("\t", ""), child: [] };
	index = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];


	for (const line in splitted_line) {
		var line_content = splitted_line[line];

		if (line == 0 || isNullOrWhitespaceOrTabs(line_content) || line_content.search("#") != -1 || line_content.search("<") != -1) continue;
		line_content = line_content.replace(String.fromCharCode(13), "");
		var number_tabs = numberOfTabs(line_content) - 1;
		index[number_tabs]++;

		// if going deeper
		if (number_tabs > last_number_tabs) {
			var current_node = tree;
			for (var i = 0; i < number_tabs; ++i) {
				current_node = current_node.child[index[i]];
			}
			current_node.child.push({ value: line_content.replace(/\t/g, ""), child: [] });
		}
		// if same depth
		else if (number_tabs == last_number_tabs) {
			var current_node = tree;
			for (var i = 0; i < number_tabs; ++i) {
				current_node = current_node.child[index[i]];
			}
			current_node.child.push({ value: line_content.replace(/\t/g, ""), child: [] });
		}
		// if going tabulations back (limited to difference of 10 tabulation)
		else {
			for (var k = 0; k < 10; ++k) {
				if (number_tabs == last_number_tabs - k) {
					var current_node = tree;
					for (var i = 0; i < number_tabs; ++i) {
						current_node = current_node.child[index[i]];
					}
					current_node.child.push({ value: line_content.replace(/\t/g, ""), child: [] });
					for (var i = last_number_tabs; i > number_tabs; --i) {
						index[i] = -1;
					}
				} /*else {
					index[last_number_tabs] = -1;
				}*/
			}
		}
		last_number_tabs = number_tabs;
	}
	console.log(tree);
}

function displayTree() {
	console.log(displayTree_rec(tree, ""));
}

function displayTree_rec(tree, spaces) {
	var text = "";
	spaces += "	";
	if (tree.child && tree.child.length) {
		for (c in tree.child) {
			text += "\n";
			text += displayTree_rec(tree.child[c], spaces);
		}
	}
	return spaces + tree.value + text;
}

function numberOfTabs(text) {
	var count = 0;
	var index = 0;
	while (text.charAt(index++) === "\t") {
		count++;
	}
	return count;
}

function isNullOrWhitespaceOrTabs(text) {
	if (typeof text === "undefined" || text == null) return true;
	return text.replace(/\s/g, "").length < 1;
}

// child_nb is the chosen child
// adds chosen child index to the path
// using negative number rewind the path child_nb times
function selectChild(child_nb) {
	if (!path)
		path = [0];
	if (child_nb < 0) {
		while (child_nb < 0) {
			child_nb++;
			path.pop();
		}
	}
	else {
		path.push(child_nb);
	}
}

async function playAuto(delay = 1000) {
	loadboard();
	var tree_current = tree;
	color = 1;
	while (tree_current && tree_current.child) {
		var child_nb = getRandomInt(0, tree_current.child.length - 1);
		selectChild(child_nb);
		var splitted_value = tree_current.value.split(/ /g);
		for (var i in splitted_value) {
			var move = await parseMoveDelayed(splitted_value[i], delay);
			// console.log(move);
			if (move != "null move")
				movePiece(move);
		}
		tree_current = tree_current.child[child_nb];
	}
}

// return the compbination of move that should be done to continue, null if no next move
function whatNext() {
	var tree_current = tree;

	// Browse the tree based on path, computing current tree
	for (i in path) {
		tree_current = tree_current.child[path[i]];
	}

	var splitted_value = tree_current.value.split(/ /g);
	if (index_subpath >= splitted_value.length) {
		if (!tree_current.child.length) {
			return null;
		}
		var child_nb = getRandomInt(0, tree_current.child.length - 1);
		selectChild(child_nb);
		index_subpath = 0;
		tree_current = tree_current.child[child_nb];
		splitted_value = tree_current.value.split(" ");
	}
	return splitted_value[index_subpath];
}

// plays whatNext move, loadboard() in case of null and continue in case of "null move".
// if black move, play automatically white move.
// ask whatNext() after a move to check if not finished.
function playNext() {
	var next_move = whatNext();
	if (!next_move) {
		loadboard();
		return;
	}
	var move = parseMove(next_move);
	if (move == "null move") {
		console.log("null move");
	} else {
		if (color == 1) {
			chess_text.appendChild(document.createTextNode(counter + ". "));
			chess_text.appendChild(document.createTextNode(next_move));
			chess_text.appendChild(document.createTextNode("--"));
			++counter;
		} else {
			chess_text.appendChild(document.createTextNode(next_move));
			chess_text.appendChild(document.createElement("br"));
		}
		movePiece(move);
		++index_subpath;
		if ((color == 1 && board.orientation == "black") || (color == -1 && board.orientation == "white")) {
			setTimeout(function () { playNext() }, 500);
		}
	}
	// verify not last move
	if (!whatNext()) {
		chess_text.appendChild(document.createTextNode("FINISHED!"));
	}
	document.getElementById("hint_text").innerHTML = whatNext();
}

board.addEventListener("drop", (e) => {
	const { source, target, piece, newPosition, oldPosition, orientation } = e.detail;
	// console.log("dropping " + piece + " : " + source + "-" + target)
	var p;
	switch (piece.charAt(1)) {
		case "K": p = "r"; break;
		case "Q": p = "d"; break;
		case "R": p = "t"; break;
		case "B": p = "f"; break;
		case "N": p = "c"; break;
		default: p = ""; break;
	}

	var combination = source + "-" + target;
	var next_move = whatNext();
	if (!next_move) {
		loadboard();
	}
	var combination_tree = parseMove(next_move);
	const correct_move = combination == combination_tree;
	const correct_move_castling = Array.isArray(combination_tree) && (combination == combination_tree[0] || combination == combination_tree[1]);
	if (correct_move || correct_move_castling) {
		if (color == 1) {
			chess_text.appendChild(document.createTextNode(counter + ". "));
			chess_text.appendChild(document.createTextNode(next_move));
			chess_text.appendChild(document.createTextNode("--"));
			++counter;
		} else {
			chess_text.appendChild(document.createTextNode(next_move));
			chess_text.appendChild(document.createElement("br"));
		}
		if (correct_move) {
			console.log("correct !");
			++index_subpath; // should work because black shouldnt create a branch
			color *= -1;
			setTimeout(function () { playNext(); }, 1000);

		} else if (correct_move_castling) {
			console.log("correct ! (castling)");
			if (combination == combination_tree[0]) {
				board.move(combination_tree[1]);
			} else if (combination == combination_tree[1]) {
				board.move(combination_tree[0]);
			}
			++index_subpath; // should work because black shouldnt create a branch
			color *= -1;
			setTimeout(function () { playNext(); }, 1000);
		}
		document.getElementById("hint_text").innerHTML = whatNext();
	} else {
		if (combination_tree == "null move") {
			setTimeout(function () { loadboard(); }, 10);
		}
		else {
			console.log("incorrect ! moving back : " + target + "-" + source);
			console.log(combination + " should be " + combination_tree + " : (" + next_move + ")");
			setTimeout(function () { board.setPosition(oldPosition); }, 10);
		}
	}
});

function movePiece(move) {
	if (Array.isArray(move)) {
		for (var i in move) {
			if (isNullOrWhitespaceOrTabs(move[i])) {
				++index_subpath;
				playNext();
				return;
			}
			board.move(move[i]);
		}
	} else {
		if (isNullOrWhitespaceOrTabs(move)) {
			++index_subpath;
			playNext();
			return;
		}
		board.move(move);
	}
	color *= -1; // change next turn color
}

// Parses the current move "move" to compute which piece moves where.
// return movements as array  e.g. ["e4-e5"]
function parseMove(move) {
	if (isNullOrWhitespaceOrTabs(move)) return "null move";
	move = move.toLowerCase();
	console.log(move);

	var takes;
	if (move[0] == "x") {
		takes = 1;
		// console.log("Takes");
		move = move.slice(1); // remove x
	}
	if (move[move.length - 1] == "+") {
		// console.log("Check");
		move = move.slice(0, move.length - 1); // remove +
	}

	// King
	if (move[0] == "r") {
		// console.log("r");
		move = move.slice(1); // remove r
		return moveKing(color, move, takes);
	}

	// Queen
	else if (move[0] == "d" && isNaN(move[1])) {
		// console.log("d");
		move = move.slice(1); // remove d
		return moveQueen(color, move, takes);
	}

	// Rook
	else if (move[0] == "t") {
		// console.log("t");
		move = move.slice(1); // remove t
		return moveRook(color, move, takes);
	}

	// Bishop
	else if (move[0] == "f" && isNaN(move[1])) {
		// console.log("f");
		move = move.slice(1); // remove f
		return moveBishop(color, move, takes);
	}

	// Knight or pawn
	else if (move[0] == "c" && isNaN(move[1])) {
		// console.log("c");
		move = move.slice(1); // remove c
		return moveKnight(color, move, takes);
	}

	else if (move[0] == "0") {
		if (move == "0-0") {
			// console.log("kingside castling");
			var line = color == 1 ? 1 : 8;
			return ["e" + line + "-" + "g" + line, "h" + line + "-" + "f" + line];// king & rook
		} else if (move == "0-0-0") {
			// console.log("queenside castling");
			var line = color == 1 ? 1 : 8;
			return ["e" + line + "-" + "c" + line, "a" + line + "-" + "d" + line]; // king & rook
		}
	}

	else if (move[0] == "p") {
		return movePawn(color, move.slice(1), takes)
	}

	else {
		// console.log("p");
		return movePawn(color, move, takes)
	}
}

function parseMoveDelayed(move, delay) {
	var promise = new Promise(function (resolve, reject) {
		window.setTimeout(function () { resolve(parseMove(move)) }, delay);
	});
	return promise;

	// return setTimeout(function(){return parseMove(move)}, delay);
}

function moveKing(color, move, takes) {
	var piece_name = (color == 1 ? "w" : "b") + "K";
	var piece_pos = findPiece(piece_name)[0];
	var combination = piece_pos + "-" + move;
	// console.log(combination);
	return combination;
}

function moveQueen(color, move, takes) {
	var piece_name = (color == 1 ? "w" : "b") + "Q";
	var piece_pos = findPiece(piece_name)[0];
	var combination = piece_pos + "-" + move;
	// console.log(combination);
	return combination;
}

function moveRook(color, move, takes) {
	var piece_name = (color == 1 ? "w" : "b") + "R";
	var piece_pos = findPiece(piece_name);
	var combination;
	for (var i in piece_pos) {
		if (canRookMove(piece_pos[i], move)) {
			if (move.length == 3)
				move = move.slice(1);
			combination = piece_pos[i] + "-" + move;
			// console.log(combination);
			return combination;
		}
	}
	return;
}

function canRookMove(piece_pos, move) {
	var letter_piece = piece_pos.charAt(0);
	var number_piece = parseInt(piece_pos[1]);

	var letter_move = move.charAt(0);
	var number_move = parseInt(move[1]);

	var ambiguity = null; // if ambiguity, equals letter
	if (move.length == 3) {
		letter_move = move.charAt(1);
		number_move = parseInt(move[2]);
		ambiguity = move.charAt(0);
	}

	// adjacency ?
	if (number_piece != number_move && letter_piece != letter_move) return 0;

	// trace line
	for (var i = previousChar(letter_piece); i > letter_move; i = previousChar(i)) {
		if (piece(i + number_piece)) return 0; // line left
	}

	for (var i = nextChar(letter_piece); number_piece == number_move && i < letter_move; i = nextChar(i)) {
		if (piece(i + number_piece)) return 0; // line right
	}

	// trace column
	for (var i = parseInt(number_piece) - 1; letter_piece == letter_move && i > number_move; --i) {
		if (piece(letter_piece + i)) return 0; // column down
	}

	for (var i = parseInt(number_piece) + 1; letter_piece == letter_move && i < number_move; ++i) {
		if (piece(letter_piece + i)) return 0; // column up
	}

	return (ambiguity == null || letter_piece == ambiguity);
}

function moveBishop(color, move, takes) {
	// first Bishop found do the move, no ambiguity tolerated
	var piece_name = (color == 1 ? "w" : "b") + "B";
	var piece_pos = findPiece(piece_name);
	var combination;
	for (var i in piece_pos) {
		if (canBishopMove(piece_pos[i], move)) {
			combination = piece_pos[i] + "-" + move;
		}
	}
	// console.log(combination);
	return combination;
}

function canBishopMove(piece_pos, move) {
	// check diagonality
	if (!diagonality(piece_pos, move)) return 0;

	// upper diagonals
	var i, j;
	for (i = previousChar(piece_pos.charAt(0)), j = parseInt(piece_pos[1]) + 1; i > move.charAt(0) && j < move[1]; i = previousChar(i), ++j) { // letter + number
		// console.log(i,j)
		if (piece(i + j)) return 0; // upper diagonal left
	}

	for (i = nextChar(piece_pos.charAt(0)), j = parseInt(piece_pos[1]) + 1; i < move.charAt(0) && j < move[1]; i = nextChar(i), ++j) { // letter + number
		// console.log(i,j)
		if (piece(i + j)) return 0; // upper diagonal right
	}

	// lower diagonals
	for (i = previousChar(piece_pos.charAt(0)), j = parseInt(piece_pos[1]) - 1; i > move.charAt(0) && j > move[1]; i = previousChar(i), --j) { // letter + number
		// console.log(i,j)
		if (piece(i + j)) return 0; // lower diagonal left
	}

	for (i = nextChar(piece_pos.charAt(0)), j = parseInt(piece_pos[1]) - 1; i < move.charAt(0) && j > move[1]; i = nextChar(i), --j) { // letter + number
		// console.log(i,j)
		if (piece(i + j)) return 0; // lower diagonal left
	}

	return 1;
}

function diagonality(piece_pos, move) {
	var i, j;

	for (i = piece_pos.charAt(0), j = parseInt(piece_pos[1]); insideBoard(i + j); i = previousChar(i), ++j) { // letter + number
		if (i == move[0] && j == move[1]) return 1; // upper diagonal left
	}

	for (i = piece_pos.charAt(0), j = parseInt(piece_pos[1]); insideBoard(i + j); i = nextChar(i), ++j) { // letter + number
		if (i == move[0] && j == move[1]) return 1; // upper diagonal right
	}

	// lower diagonals
	for (i = piece_pos.charAt(0), j = parseInt(piece_pos[1]); insideBoard(i + j); i = previousChar(i), --j) { // letter + number
		if (i == move[0] && j == move[1]) return 1; // lower diagonal left
	}

	for (i = piece_pos.charAt(0), j = parseInt(piece_pos[1]); insideBoard(i + j); i = nextChar(i), --j) { // letter + number
		if (i == move[0] && j == move[1]) return 1; // lower diagonal right
	}

	return 0;
}

function moveKnight(color, move, takes) {
	var piece_name = (color == 1 ? "w" : "b") + "N";
	var piece_pos = findPiece(piece_name);
	var combination;
	for (var i in piece_pos) {
		if (canKnightMove(piece_pos[i], move)) {
			if (move.length == 3) move = move.slice(1);
			combination = piece_pos[i] + "-" + move;
			if (combination) return combination;
		}
	}
	// console.log(combination);
	return combination;
}

function canKnightMove(piece_pos, move) {
	var letter_piece = piece_pos.charAt(0);
	var number_piece = parseInt(piece_pos[1]);

	var letter_move = move.charAt(0);
	var number_move = parseInt(move[1]);

	var ambiguity = null; // if ambiguity, equals letter
	if (move.length == 3) { // ge7
		letter_move = move.charAt(1);
		number_move = parseInt(move[2]);
		ambiguity = move.charAt(0);
	}

	//top
	//top two left
	if (((letter_move == previousChar(letter_piece) && number_move + 2 == number_piece) || (letter_move == previousChar(previousChar(letter_piece)) && number_move + 1 == number_piece)) && insideBoard(move) && (ambiguity == null || letter_piece == ambiguity)) return 1;
	//top two right
	if (((letter_move == nextChar(letter_piece) && number_move + 2 == number_piece) || (letter_move == nextChar(nextChar(letter_piece)) && number_move + 1 == number_piece)) && insideBoard(move) && (ambiguity == null || letter_piece == ambiguity)) return 1;

	//bottom
	//bottom two left
	if (((letter_move == previousChar(letter_piece) && number_move - 2 == number_piece) || (letter_move == previousChar(previousChar(letter_piece)) && number_move - 1 == number_piece)) && insideBoard(move) && (ambiguity == null || letter_piece == ambiguity)) return 1;
	//bottom two right
	if (((letter_move == nextChar(letter_piece) && number_move - 2 == number_piece) || (letter_move == nextChar(nextChar(letter_piece)) && number_move - 1 == number_piece)) && insideBoard(move) && (ambiguity == null || letter_piece == ambiguity)) return 1;

	return 0;
}

function movePawn(color, move, takes) {
	// TODO prise en passant
	var combination;
	if (takes) {
		if (move.length == 2) {
			var column;

			// xbc5 written xc5
			column = color > 0 ? previousChar(move[0]) : nextChar(move[0]);
			var left_case = column + (parseInt(move[1]) - color); // = "b4"

			// xdc5
			column = color > 0 ? nextChar(move[0]) : previousChar(move[0]);
			var right_case = column + (parseInt(move[1]) - color); // = "d4"

			var left = piece(left_case) && piece(left_case)[0] == ((color == 1) ? "w" : "b") && piece(left_case)[1] == "P";
			var right = piece(right_case) && piece(right_case)[0] == ((color == 1) ? "w" : "b") && piece(right_case)[1] == "P";
			combination = (left ? left_case : right_case) + "-" + move[0] + move[1] // d4-c5
		} else {
			// xdc5 from d4 to c5 with ambiguity on which pawn
			combination = move[0] + (parseInt(move[2]) - color) + "-" + move[1] + move[2]; // d4-c5
		}
	} else {
		// c5
		if ((color == 1 && move[1] == 4 || color == -1 && move[1] == 5) && !piece(move[0] + (parseInt(move[1]) - color))) {
			combination = move[0] + (parseInt(move[1]) - 2 * color) + "-" + move[0] + move[1]; // e2-e4
		} else
			combination = move[0] + (parseInt(move[1]) - color) + "-" + move[0] + move[1]; // d4-d5
	}
	// console.log(combination);
	return combination;
}

function findPiece(piece_name) {
	return Object.keys(board.position).filter(key => board.position[key] === piece_name)
}

function piece(p) {
	return board.position[p];
}

function insideBoard(pos) {
	return !(pos.charAt(0) > "h" || pos.charAt(0) < "a" || pos[1] > 8 || pos[1] < 1)
}

function nextChar(c) {
	return String.fromCharCode(c.charCodeAt(0) + 1);
}

function previousChar(c) {
	return String.fromCharCode(c.charCodeAt(0) - 1);
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Text area
// Dealing with Textarea Height
function calcHeight(value) {
	let numberOfLineBreaks = (value.match(/\n/g) || []).length;
	// min-height + lines x line-height + padding + border
	let newHeight = 20 + numberOfLineBreaks * 20 + 12 + 2;
	return newHeight;
}

let textarea = document.querySelector(".resize-ta");
textarea.addEventListener("keyup", () => {
	textarea.style.height = calcHeight(textarea.value) * 0.9 + "px";
});

[].slice.apply(document.getElementsByTagName("textarea")).forEach(function (elem) {
	elem.addEventListener("keydown", function (e) {
		if (e.which === 9) {
			e.preventDefault();
			var curPos = textarea.selectionStart;
			let x = $("#tree_text").val();
			let text_to_insert = "\t";
			$("#tree_text").val(x.slice(0, curPos) + text_to_insert + x.slice(curPos));
			textarea.selectionStart = curPos;
		}
	}, false);
});
