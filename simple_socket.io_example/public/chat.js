const socketConnStatus = document.getElementById("status");
const messages = document.getElementById("messages");

// appending messages to ul
const appendMessage = (content, classNames = "") => {
    const item = document.createElement("li");
    item.textContent = content;
    item.className = classNames;
    messages.appendChild(item);
};

const socket = io({
    // Socket.IO options
});

socket.on("connect", () => {
    socketConnStatus.innerText = "Connected";
    appendMessage(`event: connect | session id: ${socket.id}`, "green");
});

document.querySelector("#send-location").addEventListener("click", (e) => {
    e.preventDefault();
    if (!navigator.geolocation) return alert("Geolocation is not supported");

    navigator.geolocation.getCurrentPosition((position) => {
        // send this to other peers connected to server
        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                console.log("Location shared to server!");
            }
        );
    });
});

socket.on("connect_error", (err) => {
    appendMessage(`event: connect_error | reason: ${err.message}`, "red");
});

socket.on("disconnect", (reason) => {
    socketConnStatus.innerText = "Disconnected";
    appendMessage(`event: disconnect | reason: ${reason}`);
});

// listen to any messages from server
socket.onAny((event, ...args) => {
    console.log(args);
    appendMessage(`event: ${event} | arguments: ${args}`);
});
