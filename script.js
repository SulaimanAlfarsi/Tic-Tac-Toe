// Initialise game state
let playerTurn = "X";
let gameMode = "computer";
let humanPlayer = "X";
let computerPlayer = "O";
let difficulty = "easy";
let winner = false;
let isDraw = false;
let computerThinking = false;
let winningPattern = null;
let board = Array(10).fill("");
let messageTimer = null;
let confettiTimer = null;

const playerTurnBox = document.getElementsByClassName("player-turn-box")[0];
const gameMessage = document.getElementById("game-message");
const gameModeSelect = document.getElementById("game-mode");
const symbolLabel = document.getElementById("symbol-label");
const symbolSelect = document.getElementById("player-symbol");
const difficultySelect = document.getElementById("difficulty");
const difficultyControl = document.getElementById("difficulty-control");
const newGameButton = document.getElementById("new-game");

const winningPatterns = [
    [1, 2, 3], // Horizontal rows
    [4, 5, 6],
    [7, 8, 9],
    [1, 4, 7], // Vertical columns
    [2, 5, 8],
    [3, 6, 9],
    [1, 5, 9], // Diagonals
    [3, 5, 7]
];

function markWinningPattern(pattern) {
    boxes.forEach(box => {
        const boxIndex = Number(box.id);
        box.classList.toggle("winner-cell", pattern.includes(boxIndex));
        box.classList.toggle("dimmed-cell", !pattern.includes(boxIndex));
    });
}

function celebrateWinner() {
    if (typeof confetti !== "function") {
        return;
    }

    stopWinnerCelebration();
    launchConfettiBurst();

    confettiTimer = setInterval(launchConfettiBurst, 900);
}

function stopWinnerCelebration() {
    clearInterval(confettiTimer);
    confettiTimer = null;
}

function launchConfettiBurst() {
    confetti({
        particleCount: 70,
        spread: 80,
        origin: { x: 0.5, y: 0.65 }
    });

    confetti({
        particleCount: 45,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 }
    });

    confetti({
        particleCount: 45,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 }
    });
}

function clearBoardStyles() {
    boxes.forEach(box => {
        box.classList.remove("disabled", "winner-cell", "dimmed-cell", "invalid-cell", "move-cell");
    });
}

function getNextPlayer(currentPlayer) {
    return currentPlayer === "X" ? "O" : "X";
}

function getPlayerName(currentPlayer) {
    if (gameMode === "players") {
        return currentPlayer === humanPlayer ? "Player 1" : "Player 2";
    }

    return currentPlayer === humanPlayer ? "You" : "Computer";
}

function updateTurnStatus() {
    if (gameMode === "players") {
        updateStatus(getPlayerName(playerTurn) + " (" + playerTurn + ") Turn", "info");
        return;
    }

    updateStatus("Your " + humanPlayer + " Turn", "info");
}

function getBoardValue(index) {
    return board[index];
}

function setBoardValue(index, value) {
    board[index] = value;
    const box = document.getElementById(index.toString());
    box.innerHTML = value;
    box.classList.remove("move-cell");
    void box.offsetWidth;
    box.classList.add("move-cell");
}

function getAvailableMoves() {
    const moves = [];
    for (let index = 1; index <= 9; index++) {
        if (!getBoardValue(index)) {
            moves.push(index);
        }
    }

    return moves;
}

function setBoardEnabled(isEnabled) {
    boxes.forEach(box => {
        box.classList.toggle("disabled", !isEnabled);
    });
}

function updateStatus(message, type = "info") {
    playerTurnBox.classList.remove("info", "success", "warning", "error");
    playerTurnBox.classList.add(type);
    playerTurnBox.innerHTML = "<h1>" + message + "</h1>";
}

function showMessage(message, type = "info") {
    clearTimeout(messageTimer);
    gameMessage.textContent = message;
    gameMessage.className = "message-box show " + type;

    messageTimer = setTimeout(() => {
        gameMessage.className = "message-box";
    }, 2200);
}

function clearMessage() {
    clearTimeout(messageTimer);
    gameMessage.textContent = "";
    gameMessage.className = "message-box";
}

// Function to reload game
function reloadGame() {
    startNewGame();
}

function findPatternMatch(currentPlayer, pattern) {
    console.log("inside pattern" + pattern);

    for (const index of pattern) {
        if (getBoardValue(index) !== currentPlayer) {
            return false;
        }
    }

    return true;
}

function checkIfCurrentPlayerWon(currentPlayer) {
    for (const pattern of winningPatterns) {
        let isPatternMatch = findPatternMatch(currentPlayer, pattern);
        if (isPatternMatch) {
            winningPattern = pattern;
            markWinningPattern(pattern);

            return true;
        }
    }

    return false;
}

function hasPlayerWon(testBoard, currentPlayer) {
    return winningPatterns.some(pattern =>
        pattern.every(index => testBoard[index] === currentPlayer)
    );
}

function isBoardFull() {
    return getAvailableMoves().length === 0;
}

function getRandomMove() {
    const availableMoves = getAvailableMoves();
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getWinningMove(currentPlayer) {
    for (const move of getAvailableMoves()) {
        const boardCopy = [...board];
        boardCopy[move] = currentPlayer;
        if (hasPlayerWon(boardCopy, currentPlayer)) {
            return move;
        }
    }

    return null;
}

function getMediumMove() {
    return getWinningMove(computerPlayer)
        || getWinningMove(humanPlayer)
        || (getBoardValue(5) ? null : 5)
        || getRandomMove();
}

function minimax(testBoard, currentPlayer) {
    if (hasPlayerWon(testBoard, computerPlayer)) {
        return { score: 10 };
    }

    if (hasPlayerWon(testBoard, humanPlayer)) {
        return { score: -10 };
    }

    const availableMoves = [];
    for (let index = 1; index <= 9; index++) {
        if (!testBoard[index]) {
            availableMoves.push(index);
        }
    }

    if (availableMoves.length === 0) {
        return { score: 0 };
    }

    const moves = availableMoves.map(index => {
        const boardCopy = [...testBoard];
        boardCopy[index] = currentPlayer;
        const nextPlayer = currentPlayer === computerPlayer ? humanPlayer : computerPlayer;
        const result = minimax(boardCopy, nextPlayer);
        return {
            index,
            score: result.score
        };
    });

    if (currentPlayer === computerPlayer) {
        return moves.reduce((bestMove, move) => move.score > bestMove.score ? move : bestMove);
    }

    return moves.reduce((bestMove, move) => move.score < bestMove.score ? move : bestMove);
}

function getHardMove() {
    return minimax([...board], computerPlayer).index;
}

function getComputerMove() {
    if (difficulty === "hard") {
        return getHardMove();
    }

    if (difficulty === "medium") {
        return Math.random() < 0.75 ? getMediumMove() : getRandomMove();
    }

    return getRandomMove();
}

function finishMove(currentPlayer) {
    winner = checkIfCurrentPlayerWon(currentPlayer);

    if (winner) {
        const winnerName = getPlayerName(currentPlayer) + " Wins";
        const statusType = gameMode === "players" || currentPlayer === humanPlayer ? "success" : "error";
        updateStatus(winnerName + " <button class='restart-button' onclick='reloadGame()'>Restart</button>", statusType);
        showMessage(currentPlayer + " completed three in a row.", statusType === "error" ? "warning" : "info");
        celebrateWinner();
        setBoardEnabled(false);
        return true;
    }

    if (isBoardFull()) {
        isDraw = true;
        updateStatus("Draw <button class='restart-button' onclick='reloadGame()'>Restart</button>", "warning");
        showMessage("No empty boxes left. Start a new game.", "warning");
        setBoardEnabled(false);
        return true;
    }

    return false;
}

function makeMove(boxIndex, currentPlayer) {
    setBoardValue(boxIndex, currentPlayer);
    return finishMove(currentPlayer);
}

function computerMove() {
    if (winner || isDraw) {
        return;
    }

    computerThinking = true;
    setBoardEnabled(false);
    updateStatus("Computer " + computerPlayer + " Turn", "warning");
    showMessage("Computer is choosing a move...", "info");

    setTimeout(() => {
        const computerChoice = getComputerMove();
        if (computerChoice) {
            makeMove(computerChoice, computerPlayer);
        }

        computerThinking = false;

        if (!winner && !isDraw) {
            playerTurn = humanPlayer;
            setBoardEnabled(true);
            updateStatus("Your " + humanPlayer + " Turn", "info");
            clearMessage();
        }
    }, 350);
}

function startNewGame() {
    gameMode = gameModeSelect.value;
    humanPlayer = symbolSelect.value;
    computerPlayer = humanPlayer === "X" ? "O" : "X";
    difficulty = difficultySelect.value;
    playerTurn = "X";
    winner = false;
    isDraw = false;
    computerThinking = false;
    winningPattern = null;
    board = Array(10).fill("");
    clearMessage();
    stopWinnerCelebration();
    difficultyControl.classList.toggle("hidden", gameMode === "players");
    symbolLabel.textContent = gameMode === "players" ? "Player 1" : "You play";

    boxes.forEach(box => {
        box.innerHTML = "";
    });
    clearBoardStyles();

    setBoardEnabled(true);

    if (gameMode === "computer" && computerPlayer === "X") {
        updateStatus("Computer X Turn", "warning");
        computerMove();
    }
    else {
        updateTurnStatus();
    }
}

// Add event listener to all the div having class box
function handleBoxClick() {
    // If we got our winner then say user to restart game
    if (winner) {
        showMessage("The game is finished. Press Restart to play again.", "warning");
        return;
    }

    console.log("Box " + this.id + " was clicked.");

    if (gameMode === "computer" && (computerThinking || playerTurn !== humanPlayer)) {
        showMessage("Wait for the computer to finish its turn.", "info");
        return;
    }

    if (getBoardValue(Number(this.id))) {
        // If box has something in it then the same box should not clicked more than once.
        showMessage("This box is already filled. Choose an empty box.", "warning");
        this.classList.add("invalid-cell");
        setTimeout(() => {
            this.classList.remove("invalid-cell");
        }, 350);
        return;
    }

    // Change text inside box
    const currentPlayer = gameMode === "players" ? playerTurn : humanPlayer;
    const gameEnded = makeMove(Number(this.id), currentPlayer);

    if (gameEnded) {
        return;
    }

    if (gameMode === "players") {
        playerTurn = getNextPlayer(playerTurn);
        updateTurnStatus();
    }
    else {
        playerTurn = computerPlayer;
        computerMove();
    }
}

const boxes = document.querySelectorAll('.box');

boxes.forEach(box => {
    box.addEventListener('click', handleBoxClick);
});

newGameButton.addEventListener("click", startNewGame);
gameModeSelect.addEventListener("change", startNewGame);
symbolSelect.addEventListener("change", startNewGame);
difficultySelect.addEventListener("change", startNewGame);

startNewGame();
