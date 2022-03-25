import path, { join } from "path";
import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { generateMessage, generateLocationMessage } from "./utils/messages.js";
import { addUser, getUser, getUsersInRoom, removeUser } from "./utils/users.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const __dirname = path.resolve();
const publicDirectoryPath = join(__dirname, "./public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
    console.log(`New connection established, socket id :: ${socket.id}`);

    socket.on("join", (details, ackEvent) => {
        // add user to local DB
        const { error, user } = addUser({ id: socket.id, ...details });
        if (error) {
            return ackEvent(error);
        }

        socket.join(user.room);

        socket.emit(
            "message",
            generateMessage("Admin", `Welcome ${user.username}`)
        );
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                generateMessage("Admin", `${user.username} has joined!`)
            );
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room),
        });
        ackEvent();
    });

    socket.on("sendMessage", (message, ackEvent) => {
        const user = getUser(socket.id);
        if (!user) return ackEvent("No user");

        io.to(user.room).emit(
            "message",
            generateMessage(user.username, message)
        );
        ackEvent();
    });

    socket.on("sendLocation", (coords, ackEvent) => {
        const user = getUser(socket.id);
        if (!user) return ackEvent("No user");

        io.to(user.room).emit(
            "locationMessage",
            generateLocationMessage(
                user.username,
                `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
            )
        );
        ackEvent();
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessage("Admin", `${user.username} has left!`)
            );
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
});
