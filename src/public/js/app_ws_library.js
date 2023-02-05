const messageList = document.querySelector("ul");
const nicknameForm = document.querySelector("form#nickname");
const messageForm = document.querySelector("form#message");
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
    console.log("Connected to Server.");
})

socket.addEventListener("message", (message) => {
    console.log("Just got this from the Server:", message.data);
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
})

socket.addEventListener("close", () => {
    console.log("Disconnected from Server.");
})

function makeMessage(type, payload) {
    const message_json = {type, payload};
    return JSON.stringify(message_json);
}

function handleSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", input.value));
    input.value = "";
}

function handleNicknameSave(event) {
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
}

nicknameForm.addEventListener("submit", handleNicknameSave);
messageForm.addEventListener("submit", handleSubmit);
