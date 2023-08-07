// @ts-check
const fs = require("fs");
const { Client } = require("skribbler");

const words = (fs.readFileSync("./words.txt", "utf8").split(/\r\n/));
if(words[0] === "") words.shift();

const host = new Client({
    name: "Host",
    createPrivateRoom: true
});
let member;

host.on("connected", () => {
    console.log("Host connected to the room");
    /**
     * Set the max player count to 2
     * Set the max draw time to 15
     * Set the total amount of rounds to 14
     * Set the total words the drawer can pick to 5
     */
    host.updateRoomSettings("1", "2");
    host.updateRoomSettings("2", "15");
    host.updateRoomSettings("3", "14");
    host.updateRoomSettings("4", "5");

    console.log(`Lobby ID: ${host.lobbyId}`);

    member = new Client({
        name: "Member",
        lobbyCode: host.lobbyId
    });

    member.on("connected", () => {
        console.log("Member connected to the room, starting game.");
        host.startGame();

        main();
    });
});

host.on("packet", ({id,data}) => {
    if(id !== 11 || data.id !== 7) return;

    console.log("Game over, starting a new game.");
    host.startGame();
});

function main() {
    host.on("chooseWord", (data) => {
        console.log(`Host found words: ${data.join(", ")}.`);

        for(const word of data) {
            if(words.includes(word)) continue;
            words.push(word);
        }

        host.selectWord(0);

        member.sendMessage(data[0]);
    });

    member.on("chooseWord", (data) => {
        console.log(`Member found words: ${data.join(", ")}.`);

        for(const word of data) {
            if(words.includes(word)) continue;
            words.push(word);
        }

        member.selectWord(0);

        host.sendMessage(data[0]);
    });
}

setInterval(() => {
    fs.writeFileSync("./words.txt", words.join("\n"));
}, 2500);