const fs = require("fs");
const { Client, Language, Settings, WordMode, GameState, Packets } = require("skribbler");

// Create the words.txt file if it does not yet exist
if(!fs.existsSync("./words.txt")) fs.writeFileSync("./words.txt", "");

// Load the words dumped from the previous session
const dumpedWords = new Set(fs.readFileSync("./words.txt", "utf8").split(/\r?\n/));

/**
 * @type {Client}
 */
let host
/**
 * @type {Client}
 */
let member;

function createClients() {
	host = new Client({
		name: "Host",
		// The language can be freely changed if you would like to dump the words in another language
		language: Language.ENGLISH,
		createPrivateRoom: true
	});

	host.on("connect", () => {
		console.log(`Host connected to the room\nLobby ID: ${host.lobbyId}`);
		/**
		 * Optimize settings to allow the most number of words to be dumped
		 *
		 * Set the max player count to 2
		 * Set the max draw time to 15 seconds, as a fallback incase the non-drawer was not able to guess the word for whatever reason
		 * Set the max amount of rounds to 14 to reduce how much we're delayed by the MATCH_END state
		 * Set the word count to 5 to be able to get five words to choose from when drawing
		 * Set the word mode to combination so the drawer recieves double the amount of words 
		 */
		host.updateSetting(Settings.MAX_PLAYER_COUNT, "2");
		host.updateSetting(Settings.MAX_DRAW_TIME, "15");
		host.updateSetting(Settings.MAX_ROUNDS, "14");
		host.updateSetting(Settings.WORD_COUNT, "5");
		host.updateSetting(Settings.WORD_MODE, WordMode.COMBINATION);

		// Once the host is connected and we set our prefered settings, we create the member client
		setTimeout(() => {
			member = new Client({
				name: "Member",
				lobbyCode: host.lobbyId
			});

			member.on("connect", () => {
				console.log("Member connected to the room, starting game");
				startEventListeners();

				host.startGame();
			});
		}, 500);
	});
}

function startEventListeners() {
	// @ts-expect-error
	host.on("stateUpdate", (data) => {
		switch(data.state) {
			// Select random words when we are given the opportunity to do so
			case GameState.USER_PICKING_WORD: {
				if(!host.canvas.canDraw) break;

				const words = data.words ?? [];
				console.log(`Host found words: ${words.join(", ")}`);

				for(const word of words) {
					if(dumpedWords.has(word)) continue;
					dumpedWords.add(word);

					fs.appendFile("./words.txt", `${word}\n`, () => {});
				}

				host.sendPacket(Packets.SELECT_WORD, [0, 0]);
				break;
			}

			// If we're the drawer, then make the other player guess the word that we're drawing
			case GameState.START_DRAW: {
				if(!host.canvas.canDraw) break;

				member.sendMessage(host.word);
				break;
			}

			// If the game ends and we are returned to the waiting room, then start the game again
			case GameState.IN_GAME_WAITING_ROOM: {
				console.log("Game has ended, starting another game");
				host.startGame();
			}
		}
	});

	// @ts-expect-error
	member.on("stateUpdate", (data) => {
		switch(data.state) {
			// Select random words when we are given the opportunity to do so
			case GameState.USER_PICKING_WORD: {
				if(!member.canvas.canDraw) break;

				const words = data.words ?? [];
				console.log(`Member found words: ${words.join(", ")}`);

				for(const word of words) {
					if(dumpedWords.has(word)) continue;
					dumpedWords.add(word);

					fs.appendFile("./words.txt", `${word}\n`, () => {});
				}

				member.sendPacket(Packets.SELECT_WORD, [0, 0]);
				break;
			}

			// If we're the drawer, then make the other player guess the word that we're drawing
			case GameState.START_DRAW: {
				if(!member.canvas.canDraw) break;

				host.sendMessage(member.word);
				break;
			}
		}
	});
}

createClients();