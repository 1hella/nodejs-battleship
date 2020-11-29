document.addEventListener('DOMContentLoaded', () => {
    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const displayGrid = document.querySelector('.grid-display');
    const ships = document.querySelectorAll('.ship');
    const destroyer = document.querySelector('.destroyer-container');
    const submarine = document.querySelector('.submarine-container');
    const cruiser = document.querySelector('.cruiser-container');
    const battleship = document.querySelector('.battleship-container');
    const carrier = document.querySelector('.carrier-container');
    const startButton = document.querySelector('#start');
    const rotateButton = document.querySelector('#rotate');
    const turnDisplay = document.querySelector('#whose-turn');
    const infoDisplay = document.querySelector('#info');
    const singlePlayerButton = document.querySelector('#single-player-button');
    const multiplayerButton = document.querySelector('#multiplayer-button');
    const userSquares = [];
    const computerSquares = [];
    let isHorizontal = true;
    let isGameOver = false;
    let currentPlayer = 'user';
    const width = 10;
  
    let gameMode = '';
    let playerNum = 0;
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = false;
    let shotFired = -1;

    // Select Player Mode
    singlePlayerButton.addEventListener('click', startSinglePlayer);
    multiplayerButton.addEventListener('click', startMultiplayer);

    function startMultiplayer() {
        gameMode = 'multiPlayer';

        const socket = io();

        // get player number
        socket.on('player-number', num => {
            if (num === -1) {
                infoDisplay.innerHTML = "Sorry, the server is full."
            } else {
                playerNum = parseInt(num);
                if (playerNum === 1) currentPLayer = 'enemy';

                console.log(playerNum)
            }

            // Get other player status
            socket.emit('check-players');
        });

        // Another player has connected or disconnected
        socket.on('player-connection', num => {
            console.log(`PLayer number ${num} has connected or disconnected`);
            playerConnectedOrDisconnected(num);
        });

        // On enemy ready
        socket.on('enemy-ready', num => {
            enemyReady = true;
            playerReady(num);
            if (ready) {
                playGameMulti(socket);
            }
        });

        socket.on('check-players', players => {
            players.forEach((player, i) => {
                if (player.connected) playerConnectedOrDisconnected(i);
                if (player.ready) {
                    playerReady(i);
                    if (i !== playerNum) enemyReady = true;
                }
            })
        })

        startButton.addEventListener('click', () => {
            if (allShipsPlaced) playGameMulti(socket)
            else infoDisplay.innerHTML = 'Please place all ships';
        });

        function playerConnectedOrDisconnected(num) {
            let player = `.p${parseInt(num) + 1}`;
            document.querySelector(`${player} .connected span`).classList.toggle('green');
            if (parseInt(num) === playerNum) {
                document.querySelector(player).style.fontWeight = 'bold';
            }
        }
    }

    function startSinglePlayer() {
        gameMode = 'singlePlayer'
        shipArray.forEach(ship => generate(ship));
        startButton.addEventListener('click', playGameSingle);
    }

    function createBoard(grid, squares, width) {
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            square.dataset.id = i;
            grid.appendChild(square);
            squares.push(square);
        }
    }

    createBoard(userGrid, userSquares, width);
    createBoard(computerGrid, computerSquares, width);

    const shipArray = [
        {
            name: 'destroyer',
            directions: [
                [0, 1],
                [0, width]
            ]
        },
        {
            name: 'submarine',
            directions: [
                [0, 1, 2],
                [0, width, width * 2]
            ]
        },
        {
            name: 'cruiser',
            directions: [
                [0, 1, 2],
                [0, width, width * 2]
            ]
        },
        {
            name: 'battleship',
            directions: [
                [0, 1, 2, 3],
                [0, width, width * 2, width * 3]
            ]
        },
        {
            name: 'carrier',
            directions: [
                [0, 1, 2, 3, 4],
                [0, width, width * 2, width * 3, width * 4]
            ]
        }
    ];

    function generate(ship) {
        let randomDirection = Math.floor(Math.random() * ship.directions.length);
        let current = ship.directions[randomDirection];
        if (randomDirection === 0) direction = 1;
        if (randomDirection === 1) direction = 10;
        let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)));

        const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'));
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1);
        const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0);

        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name));
        else generate(ship);
    }

    function rotate() {
        destroyer.classList.toggle('destroyer-container-vertical');
        submarine.classList.toggle('submarine-container-vertical');
        cruiser.classList.toggle('cruiser-container-vertical');
        battleship.classList.toggle('battleship-container-vertical');
        carrier.classList.toggle('carrier-container-vertical');
        if (isHorizontal) {
            isHorizontal = false;
        } else {
            isHorizontal = true;
        }
    }

    rotateButton.addEventListener('click', rotate);

    //move around user ship
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragover', dragOver))
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    userSquares.forEach(square => square.addEventListener('drop', dragDrop))
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

    let selectedShipNameWithIndex;
    let draggedShip;
    let draggedShipLength;

    ships.forEach(ship => ship.addEventListener('mousedown', e => {
        selectedShipNameWithIndex = e.target.id;
        console.log(selectedShipNameWithIndex);
    }));

    function dragStart() {
        draggedShip = this;
        draggedShipLength = this.children.length;
        console.log(draggedShip);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragEnter(e) {
        e.preventDefault();
    }

    function dragLeave() {
        console.log('drag leave');
    }

    function dragDrop() {
        let shipNameWithLastId = draggedShip.lastElementChild.id;
        let shipClass = shipNameWithLastId.slice(0, -2);
        console.log(shipClass);
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
        let shipLastId = lastShipIndex + parseInt(this.dataset.id);
        console.log(shipLastId);
        const notAllowedHorizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 2, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63, 73, 83, 93];
        const notAllowedVertical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60];

        let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex);
        let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex);

        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));

        shipLastId = shipLastId - selectedShipIndex;
        console.log(shipLastId);

        if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
            for (let i = 0; i < draggedShipLength; i++) {
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', shipClass);
            }
            //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
            //index-1 , index-2 and so on, the ship will rebound back to the displayGrid.
        } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
            for (let i = 0; i < draggedShipLength; i++) {
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + width * i].classList.add('taken', shipClass);
            }
        } else return;

        displayGrid.removeChild(draggedShip);
        if (!displayGrid.querySelector('.ship')) {
            allShipsPlaced = true;
        }
    }

    function dragEnd() {
        console.log('dragend');
    }

    // game logic for multiplayer
    function playGameMulti(socket) {
        if (isGameOver) return;
        if (!ready) {
            socket.emit('player-ready');
            ready = true;
            playerReady(playerNum);
        }

        if (enemyReady) {
            if (currentPlayer === 'user') {
                turnDisplay.innerHTML = 'Your Turn';
            }
            if (currentPlayer === 'enemy') {
                turnDisplay.innerHTML = 'Enemy\`s Turn';
            }
        }
    }

    function playerReady(num) {
        let player = `.p${parseInt(num) + 1}`;
        document.querySelector(`${player} .ready span`).classList.toggle('green');
    }

    // game logic for single player
    function playGameSingle() {
        if (isGameOver) return;
        if (currentPlayer === 'user') {
            turnDisplay.innerHTML = 'Your Turn';
            computerSquares.forEach(square => square.addEventListener('click', e => {
                revealSquare(square);
            }))
        } else if (currentPlayer === 'computer') {
            turnDisplay.innerHTML = 'Computer\'s Turn';
            // function computerTurn
            setTimeout(computerTurn, 1000);
        }
    }

    let destroyerCount = 0;
    let submarineCount = 0;
    let cruiserCount = 0;
    let battleshipCount = 0;
    let carrierCount = 0;

    function revealSquare(square) {
        if (square.classList.contains('boom') || square.classList.contains('miss')) return;
        if (square.classList.contains('destroyer')) destroyerCount++;
        if (square.classList.contains('submarine')) submarineCount++;
        if (square.classList.contains('cruiser')) cruiserCount++;
        if (square.classList.contains('battleship')) battleshipCount++;
        if (square.classList.contains('carrier')) carrierCount++;

        if (square.classList.contains('taken')) {
            square.classList.add('boom');
            console.log('click');
        } else {
            square.classList.add('miss');
        }

        checkForWins()
        currentPlayer = 'computer';
        console.log(destroyerCount);
        playGameSingle();
    }

    let cpuDestroyerCount = 0;
    let cpuSubmarineCount = 0;
    let cpuCruiserCount = 0;
    let cpuBattleshipCount = 0;
    let cpuCarrierCount = 0;

    function computerTurn() {
        let random = Math.floor(Math.random() * userSquares.length);
        if (userSquares[random].classList.contains('boom') || userSquares[random].classList.contains('miss')) computerTurn();
        if (userSquares[random].classList.contains('taken')) {
            userSquares[random].classList.add('boom'); 
        } else {
            userSquares[random].classList.add('miss');
        }
        if (userSquares[random].classList.contains('destroyer')) cpuDestroyerCount++;
        if (userSquares[random].classList.contains('submarine')) cpuSubmarineCount++;
        if (userSquares[random].classList.contains('cruiser')) cpuCruiserCount++;
        if (userSquares[random].classList.contains('battleship')) cpuBattleshipCount++;
        if (userSquares[random].classList.contains('carrier')) cpuCarrierCount++;

        checkForWins()
        currentPlayer = 'user';
        turnDisplay.innerHTML = 'Your Turn';
    }

    function checkForWins() {
        if (destroyerCount === 2) {
            infoDisplay.innerHTML = 'You sunk the computer\'s destroyer';
            destroyerCount = 10;
        }
        if (submarineCount === 3) {
            infoDisplay.innerHTML = 'You sunk the computer\'s submarine';
            submarineCount = 10;
        }
        if (cruiserCount === 3) {
            infoDisplay.innerHTML = 'You sunk the computer\'s cruiser';
            cruiserCount = 10;
        }
        if (battleshipCount === 4) {
            infoDisplay.innerHTML = 'You sunk the computer\'s battleship';
            battleshipCount = 10;
        }
        if (carrierCount === 5) {
            infoDisplay.innerHTML = 'You sunk the computer\'s carrier';
            carrierCount = 10;
        }

        if (cpuDestroyerCount === 2) {
            infoDisplay.innerHTML = 'The computer sunk your destroyer';
            cpuDestroyerCount = 10;
        }
        if (cpuSubmarineCount === 3) {
            infoDisplay.innerHTML = 'The computer sunk your submarine';
            cpuSubmarineCount = 10;
        }
        if (cpuCruiserCount === 3) {
            infoDisplay.innerHTML = 'The computer sunk your cruiser';
            cpuCruiserCount = 10;
        }
        if (cpuBattleshipCount === 4) {
            infoDisplay.innerHTML = 'The computer sunk your battleship';
            cpuBattleshipCount = 10;
        }
        if (cpuCarrierCount === 5) {
            infoDisplay.innerHTML = 'The computer sunk your carrier';
            cpuCarrierCount = 10;
        }

        if (destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount === 50) {
            infoDisplay.innerHTML = 'YOU WIN';
            gameOver()
        }

        if (cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount === 50) {
            infoDisplay.innerHTML = 'COMPUTER WINS';
            gameOver();
        }

        function gameOver() {
            isGameOver = true;
            startButton.removeEventListener('click', playGameSingle);
        }
    }
});