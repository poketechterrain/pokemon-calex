// Pokémon Class
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

// Trainer Class
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

// Game Data
const starters = {
    "Tidezon": new Pokemon("Tidezon", "Water/Rock", 50, 50, 50, ["Water Gun", "Rock Throw"]),
    "Grasspel": new Pokemon("Grasspel", "Grass/Ground", 50, 45, 55, ["Absorb", "Tackle"]),
    "Firevox": new Pokemon("Firevox", "Fire/Psychic", 50, 55, 45, ["Ember", "Confusion"])
};

const evolutions = {
    "Tidezon": [
        new Pokemon("Waveklis", "Water/Rock", 70, 65, 65, ["Water Pulse", "Rock Slide"]),
        new Pokemon("Floodrux", "Water/Rock", 95, 85, 85, ["Hydro Pump", "Stone Edge"])
    ],
    "Grasspel": [
        new Pokemon("Leafzorn", "Grass/Ground", 70, 60, 70, ["Razor Leaf", "Mud Shot"]),
        new Pokemon("Earthquix", "Grass/Ground", 95, 80, 90, ["Leaf Blade", "Earthquake"])
    ],
    "Firevox": [
        new Pokemon("Flaresyx", "Fire/Psychic", 70, 70, 60, ["Flamethrower", "Psybeam"]),
        new Pokemon("Pyretlan", "Fire/Psychic", 95, 90, 80, ["Fire Blast", "Psychic"])
    ]
};

const wildPokemon = {
    "Grass": [
        new Pokemon("Pikachu", "Electric", 35, 55, 40, ["Thunderbolt", "Quick Attack"]),
        new Pokemon("Caterpie", "Bug", 45, 30, 35, ["Tackle", "String Shot"])
    ],
    "Forest": [
        new Pokemon("Treecko", "Grass", 40, 45, 35, ["Absorb", "Pound"]),
        new Pokemon("Shroomish", "Grass", 60, 40, 60, ["Tackle", "Stun Spore"])
    ]
};

const gymLeaders = {
    "Fogspire": new Pokemon("Zara's Electivire", "Electric", 60, 75, 60, ["Thunderbolt", "Shock Wave"])
};

const mapWidth = 20;
const mapHeight = 20;
const tileSize = 30;
let gameMap = Array(mapHeight).fill().map(() => Array(mapWidth).fill("Grass"));
let player = new Trainer("Player", 9, 9); // Start in Luxridge
const output = document.getElementById('message-box');
const mapDiv = document.getElementById('map');
const battleContainer = document.getElementById('battle-container');
const battleOutput = document.getElementById('battle-message');
const battleControls = document.getElementById('battle-controls');
const menu = document.getElementById('menu');
const pokemonList = document.getElementById('pokemon-list');
let inBattle = false;

// Initialize Map
function initializeMap() {
    gameMap[1][1] = "Mistwood";     gameMap[2][2] = "Veilcoast";   gameMap[3][3] = "Fogspire";
    gameMap[9][9] = "Luxridge";    gameMap[4][4] = "Gleamvale";   gameMap[5][5] = "Shorevine";
    gameMap[6][6] = "Starhaven";   gameMap[7][7] = "Mirthport";   gameMap[8][8] = "Tidegleam";
    gameMap[2][10] = "Rivermoor";  gameMap[3][11] = "Blazecliff"; gameMap[4][12] = "Sandreach";
    gameMap[4][13] = "Springpalm"; gameMap[1][18] = "Emberpeak";  gameMap[3][17] = "Frostpeak";
    gameMap[4][16] = "Stonevale";
}

// Game Logic
function initGame() {
    initializeMap();
    if (!localStorage.getItem('pokemonCalexSave')) {
        const choice = prompt("Choose your starter: Tidezon, Grasspel, Firevox");
        player.addPokemon(starters[choice] || starters["Tidezon"]);
        saveGame();
    } else {
        loadGame();
    }
    renderMap();
    document.addEventListener('keydown', handleKeyPress);
}

function renderMap() {
    mapDiv.innerHTML = '';
    const visibleWidth = 320 / tileSize;
    const visibleHeight = 240 / tileSize;
    const offsetX = Math.max(0, Math.min(player.x - Math.floor(visibleWidth / 2), mapWidth - visibleWidth));
    const offsetY = Math.max(0, Math.min(player.y - Math.floor(visibleHeight / 2), mapHeight - visibleHeight));

    for (let y = offsetY; y < offsetY + visibleHeight && y < mapHeight; y++) {
        for (let x = offsetX; x < offsetX + visibleWidth && x < mapWidth; x++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.left = `${(x - offsetX) * tileSize}px`;
            tile.style.top = `${(y - offsetY) * tileSize}px`;
            tile.style.backgroundColor = gameMap[y][x] === "Grass" ? "green" : "gray";
            mapDiv.appendChild(tile);
        }
    }

    const playerTile = document.createElement('div');
    playerTile.id = 'player';
    playerTile.style.left = `${(player.x - offsetX) * tileSize}px`;
    playerTile.style.top = `${(player.y - offsetY) * tileSize}px`;
    mapDiv.appendChild(playerTile);
}

function handleKeyPress(event) {
    if (!inBattle && !menu.style.display === 'block' && !pokemonList.style.display === 'block') {
        switch (event.key) {
            case 'ArrowUp': movePlayer(0, -1); break;
            case 'ArrowDown': movePlayer(0, 1); break;
            case 'ArrowLeft': movePlayer(-1, 0); break;
            case 'ArrowRight': movePlayer(1, 0); break;
            case 'Enter': openMenu(); break;
        }
    }
}

function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;
    if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
        player.move(dx, dy);
        renderMap();
        showMessage(`Moved to (${newX}, ${newY}) - ${gameMap[newY][newX]}`);
        if (Math.random() < 0.3 && gameMap[newY][newX] === "Grass") {
            const wildPokemon = wildPokemon["Grass"][Math.floor(Math.random() * wildPokemon["Grass"].length)];
            startBattle(wildPokemon);
        }
        saveGame();
    }
}

function openMenu() {
    menu.style.display = 'block';
    renderMap();
}

function closeMenu() {
    menu.style.display = 'none';
    renderMap();
}

function showPokemon() {
    menu.style.display = 'none';
    pokemonList.style.display = 'block';
    pokemonList.innerHTML = '';
    player.party.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.textContent = `${p.name} (HP: ${p.hp}/${p.maxHp})`;
        btn.onclick = () => closePokemonList();
        pokemonList.appendChild(btn);
    });
}

function closePokemonList() {
    pokemonList.style.display = 'none';
    renderMap();
}

function showBag() {
    showMessage("Bag not implemented yet.");
}

function showMessage(message) {
    output.style.display = 'block';
    output.textContent = message;
    setTimeout(() => output.style.display = 'none', 2000);
}

function startBattle(opponentPokemon, isGym = false) {
    inBattle = true;
    battleContainer.style.display = 'block';
    mapDiv.style.display = 'none';
    output.style.display = 'none';
    document.getElementById('controls').style.display = 'none';

    document.getElementById('player-pokemon').textContent = `${player.party[0].name} (HP: ${player.party[0].hp}/${player.party[0].maxHp})`;
    document.getElementById('opponent-pokemon').textContent = `${opponentPokemon.name} (HP: ${opponentPokemon.hp}/${opponentPokemon.maxHp})`;
    battleOutput.textContent = "Battle started!";
    battleControls.innerHTML = '';

    player.party[0].moves.forEach((move, i) => {
        const btn = document.createElement('button');
        btn.textContent = move;
        btn.onclick = () => performAttack(i, opponentPokemon, isGym);
        battleControls.appendChild(btn);
    });
    const runBtn = document.createElement('button');
    runBtn.textContent = "Run";
    runBtn.onclick = () => attemptRun(opponentPokemon);
    battleControls.appendChild(runBtn);
}

function performAttack(moveIndex, opponentPokemon, isGym) {
    const move = player.party[0].moves[moveIndex];
    const damage = calculateDamage(player.party[0], opponentPokemon, move);
    opponentPokemon.setHp(opponentPokemon.hp - damage);
    updateBattleText(opponentPokemon);
    if (opponentPokemon.hp <= 0) {
        endBattle(isGym ? "Gym Leader defeated! Badge earned." : "Wild Pokémon defeated! Added to party.", isGym, opponentPokemon);
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
    battleOutput.textContent = `Your ${player.party[0].name} (HP: ${player.party[0].hp}/${player.party[0].maxHp})\nOpponent ${opponentPokemon.name} (HP: ${opponentPokemon.hp}/${opponentPokemon.maxHp})`;
}

function endBattle(message, isGym, caughtPokemon) {
    battleOutput.textContent += `\n${message}`;
    if (isGym && message.includes("Badge")) player.badges++;
    if (caughtPokemon && !isGym) player.addPokemon(caughtPokemon);
    setTimeout(() => {
        battleContainer.style.display = 'none';
        mapDiv.style.display = 'block';
        document.getElementById('controls').style.display = 'flex';
        output.style.display = 'block';
        output.textContent = message;
        inBattle = false;
        saveGame();
    }, 2000);
}

function attemptRun(opponentPokemon) {
    if (Math.random() < 0.5) {
        endBattle("Got away safely!", false);
    } else {
        battleOutput.textContent += "\nCouldn't escape!";
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
        player.x = saveData.x;
        player.y = saveData.y;
        player.badges = saveData.badges;
        player.party = saveData.party.map(p => new Pokemon(p.name, p.type, p.hp, p.attack, p.defense, p.moves));
    }
}

function challengeGym() {
    const location = gameMap[player.y][player.x];
    if (location in gymLeaders) {
        const gymLeaderPokemon = gymLeaders[location];
        startBattle(gymLeaderPokemon, true);
    } else {
        showMessage("No gym here!");
    }
}

initGame();
