class Pokemon {
    constructor(name, type, hp, attack, defense, moves) {
        this.name = name;
        this.type = type;
        this.hp = hp;
        this.maxHp = hp;
        this.attack = attack;
        this.defense = defense;
        this.moves = moves;
    }

    setHp(hp) {
        this.hp = hp < 0 ? 0 : hp;
    }
}

class Trainer {
    constructor(name, startX, startY) {
        this.name = name;
        this.party = [];
        this.x = startX;
        this.y = startY;
        this.badges = 0;
    }

    addPokemon(pokemon) {
        if (this.party.length < 6) this.party.push(pokemon);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
}

const gameMap = {
    width: 10,
    height: 10,
    grid: Array(10).fill().map(() => Array(10).fill("Grass")),
    wildPokemon: {
        "Grass": [
            new Pokemon("Pikachu", "Electric", 35, 55, 40, ["Thunderbolt", "Quick Attack"]),
            new Pokemon("Caterpie", "Bug", 45, 30, 35, ["Tackle", "String Shot"])
        ],
        "Fogspire": [
            new Pokemon("Zara's Electivire", "Electric", 60, 75, 60, ["Thunderbolt", "Shock Wave"])
        ]
};

gameMap.grid[2][2] = "Fogspire"; // Example city
gameMap.grid[4][4] = "Emberpeak"; // Example mountain

let player = new Trainer("Player", 0, 0);
const output = document.getElementById('output');
const mapDiv = document.getElementById('map');

function initGame() {
    if (!localStorage.getItem('pokemonCalexSave')) {
        const starters = [
            new Pokemon("Tidezon", "Water/Rock", 50, 50, 50, ["Water Gun", "Rock Throw"]),
            new Pokemon("Grasspel", "Grass/Ground", 50, 45, 55, ["Absorb", "Tackle"]),
            new Pokemon("Firevox", "Fire/Psychic", 50, 55, 45, ["Ember", "Confusion"])
        ];
        const choice = prompt("Choose your starter: Tidezon, Grasspel, Firevox");
        player.addPokemon(starters.find(p => p.name.toLowerCase() === choice.toLowerCase()) || starters[0]);
        saveGame();
    } else {
        loadGame();
    }
    renderMap();
}

function renderMap() {
    mapDiv.innerHTML = '';
    const tileSize = 30;
    for (let y = 0; y < gameMap.height; y++) {
        for (let x = 0; x < gameMap.width; x++) {
            const tile = document.createElement('div');
            tile.style.width = tile.style.height = `${tileSize}px`;
            tile.style.position = 'absolute';
            tile.style.left = `${x * tileSize}px`;
            tile.style.top = `${y * tileSize}px`;
            tile.style.backgroundColor = gameMap.grid[y][x] === "Grass" ? "green" : "gray";
            mapDiv.appendChild(tile);
        }
    }
    const playerTile = document.createElement('div');
    playerTile.style.width = playerTile.style.height = `${tileSize}px`;
    playerTile.style.position = 'absolute';
    playerTile.style.left = `${player.x * tileSize}px`;
    playerTile.style.top = `${player.y * tileSize}px`;
    playerTile.style.backgroundColor = 'red';
    mapDiv.appendChild(playerTile);
}

function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;
    if (newX >= 0 && newX < gameMap.width && newY >= 0 && newY < gameMap.height) {
        player.move(dx, dy);
        output.textContent = `Moved to (${newX}, ${newY})\nLocation: ${gameMap.grid[newY][newX]}`;
        renderMap();
        if (Math.random() < 0.3) {
            const wildPokemon = gameMap.wildPokemon[gameMap.grid[newY][newX]]?.[Math.floor(Math.random() * 2)];
            if (wildPokemon) {
                startBattle(wildPokemon);
            }
        }
        saveGame();
    } else {
        output.textContent = "Cannot move out of bounds!";
    }
}

function challengeGym() {
    const location = gameMap.grid[player.y][player.x];
    if (location === "Fogspire") {
        const gymLeaderPokemon = gameMap.wildPokemon["Fogspire"][0];
        startBattle(gymLeaderPokemon, true);
    } else {
        output.textContent = "No gym here!";
    }
}

function startBattle(opponentPokemon, isGym = false) {
    const battleContainer = document.getElementById('battle-container');
    const battleOutput = document.getElementById('battle-output');
    const battleControls = document.getElementById('battle-controls');
    battleContainer.style.display = 'block';
    output.style.display = 'none';
    controls.style.display = 'none';

    battleOutput.textContent = `Your ${player.party[0].name} (HP: ${player.party[0].hp}/${player.party[0].maxHp})\nOpponent ${opponentPokemon.name} (HP: ${opponentPokemon.hp}/${opponentPokemon.maxHp})`;
    battleControls.innerHTML = '';
    player.party[0].moves.forEach((move, i) => {
        const btn = document.createElement('button');
        btn.textContent = move;
        btn.onclick = () => performAttack(i, opponentPokemon, isGym);
        battleControls.appendChild(btn);
    });
    const runBtn = document.createElement('button');
    runBtn.textContent = "Run";
    runBtn.onclick = () => attemptRun();
    battleControls.appendChild(runBtn);
}

function performAttack(moveIndex, opponentPokemon, isGym) {
    const move = player.party[0].moves[moveIndex];
    const damage = calculateDamage(player.party[0], opponentPokemon, move);
    opponentPokemon.setHp(opponentPokemon.hp - damage);
    updateBattleText(opponentPokemon);
    if (opponentPokemon.hp <= 0) {
        endBattle(isGym ? "Gym Leader defeated! Badge earned." : "Wild Pokémon defeated!", isGym);
    } else {
        opponentTurn(opponentPokemon, isGym);
    }
}

function opponentTurn(opponentPokemon, isGym) {
    const move = opponentPokemon.moves[Math.floor(Math.random() * opponentPokemon.moves.length)];
    const damage = calculateDamage(opponentPokemon, player.party[0], move);
    player.party[0].setHp(player.party[0].hp - damage);
    updateBattleText(opponentPokemon);
    if (player.party[0].hp <= 0) {
        endBattle("Your Pokémon fainted!", false);
    }
}

function calculateDamage(attacker, defender, move) {
    const typeChart = {
        "Water/Rock": {"Fire/Psychic": 2.0, "Grass/Ground": 0.5},
        "Grass/Ground": {"Water/Rock": 2.0, "Fire/Psychic": 0.5},
        "Fire/Psychic": {"Grass/Ground": 2.0, "Water/Rock": 0.5},
        "Electric": {"Water/Rock": 2.0, "Grass/Ground": 0.5},
        "Bug": {"Grass/Ground": 2.0, "Fire/Psychic": 0.5}
    };
    const effectiveness = typeChart[attacker.type]?.[defender.type] || 1.0;
    const baseDamage = Math.max((attacker.attack * 2) / defender.defense, 0);
    return Math.floor(baseDamage * effectiveness);
}

function updateBattleText(opponentPokemon) {
    document.getElementById('battle-output').textContent = `Your ${player.party[0].name} (HP: ${player.party[0].hp}/${player.party[0].maxHp})\nOpponent ${opponentPokemon.name} (HP: ${opponentPokemon.hp}/${opponentPokemon.maxHp})`;
}

function endBattle(message, isGym) {
    const battleOutput = document.getElementById('battle-output');
    battleOutput.textContent += `\n${message}`;
    if (isGym && message.includes("Badge")) player.badges++;
    setTimeout(() => {
        document.getElementById('battle-container').style.display = 'none';
        output.style.display = 'block';
        controls.style.display = 'flex';
        output.textContent = message;
        saveGame();
    }, 2000);
}

function attemptRun() {
    if (Math.random() < 0.5) {
        endBattle("Got away safely!", false);
    } else {
        document.getElementById('battle-output').textContent += "\nCouldn't escape!";
        opponentTurn(opponentPokemon);
    }
}

function saveGame() {
    const saveData = {
        x: player.x,
        y: player.y,
        badges: player.badges,
        party: player.party.map(p => ({
            name: p.name,
            type: p.type,
            hp: p.hp,
            maxHp: p.maxHp,
            attack: p.attack,
            defense: p.defense,
            moves: p.moves
        }))
    };
    localStorage.setItem('pokemonCalexSave', JSON.stringify(saveData));
}

function loadGame() {
    const saveData = JSON.parse(localStorage.getItem('pokemonCalexSave'));
    if (saveData) {
        player.setPosition(saveData.x, saveData.y);
        player.badges = saveData.badges;
        player.party = saveData.party.map(p => new Pokemon(p.name, p.type, p.hp, p.attack, p.defense, p.moves));
    }
}

const controls = document.getElementById('controls');
initGame();
