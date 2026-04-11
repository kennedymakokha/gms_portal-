

let io: any = null;
let users: { [key: string]: string } = {};
export const setupSocket = (socketInstance: any) => {
    io = socketInstance;
    io.on("connection", (socket: any) => {
        console.log("SOCKET CONNECTION MADE:", socket.id);


        socket.on('join_room', (userId: string) => {
            socket.join(userId); // Joins a room named after userId
            console.log(`Socket ${socket.id} joined room: ${userId}`);
        });
       
       
        socket.on('send_message', ({ topic, message }: any) => {
            io.to(topic).emit('receive_message', {
                sender: socket.id,
                message,
            });
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

    });






};
export const getSocketIo = () => io;