import path, { join } from "path";
import http from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer); // only accepts raw HTTP server || port number

const __dirname = path.resolve();
const publicDirectoryPath = join(__dirname, "./public");

app.use(express.static(publicDirectoryPath));

//
//! :: Note ::
//* socket.emit           = sends data back to connected client
//* io.emit               = sends data to all the connected clients to the server
//* socket.broadcast.emit = broadcast the data to all the connected clients to the server except the current client

//* io.to().emit               = sends data to all the connected clients to a particular room
//* socket.broadcast.to().emit = broadcast the data to all the connected clients to a particular room except the current client
//

io.on("connection", (socket) => {
    console.log(`New connection established, socket id :: ${socket.id}`);

    //! emit this event to all the connected clients to this server
    // io.emit("to_all", `${socket.id} Welcome to the party!`);

    // test event
    socket.emit("test_event", "Test value");

    //! broadcast the message to all connections except the current connection
    socket.broadcast.emit("new_joinee", `${socket.id} joined the party!`);

    socket.on("sendLocation", (location, ackEvent) => {
        socket.broadcast.emit(
            "peer's location",
            `Location: https://google.com/maps?q=${location.latitude},${location.longitude}`
        );
        ackEvent();
    });

    socket.on("disconnect", (reason) => {
        console.log(`Disconnect ${socket.id} due to "${reason}"`);
    });
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
});

export default app;
