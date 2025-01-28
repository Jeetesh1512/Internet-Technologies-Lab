const socket = io("http://192.168.29.13:3000");
let loggedInUser = null;

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username && password) {
        socket.emit("login", { username, password });
    } else {
        document.getElementById("loginStatus").innerText = "Please enter both username and password.";
    }
}

socket.on("loginSuccess", (message) => {
    loggedInUser = document.getElementById("username").value;
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("chatContainer").classList.remove("hidden");
    alert(message);
});

socket.on("loginFailure", (message) => {
    document.getElementById("loginStatus").innerText = message;
});

socket.on("updateUserList", (users) => {
    const userList = document.getElementById("userList");
    userList.innerHTML = users
        .map((user) => {
            if (user === loggedInUser) {
                return `<li>${user} (You)</li>`;
            } else {
                return `<li class='flex justify-between items-center'>${user} <button onclick="requestPrivateChat('${user}')" class='text-blue-500 hover:underline'>Chat</button></li>`;
            }
        })
        .join("");
});

function sendGroupMessage() {
    const message = document.getElementById("groupMessage").value;
    if (message.trim()) {
        socket.emit("sendGroupMessage", message);
        document.getElementById("groupMessage").value = "";
    }
}

socket.on("groupMessage", (data) => {
    const groupChat = document.getElementById("groupChat");
    groupChat.innerHTML += `<p><strong>${data.from}:</strong> ${data.message}</p>`;
    groupChat.scrollTop = groupChat.scrollHeight;
});

function requestPrivateChat(toUsername) {
    const message = prompt("Enter your private message:");
    if (message) {
        socket.emit("requestPrivateChat", { toUsername, message });
    }
}

socket.on("privateChatRequest", (data) => {
    const privateChatBox = document.getElementById("privateChatBox");
    privateChatBox.innerHTML += `<p><strong>${data.fromUsername}:</strong> ${data.message}</p>`;
    privateChatBox.scrollTop = privateChatBox.scrollHeight;
});

socket.on("privateChatError", (message) => {
    alert(message);
});

function logout() {
    if (loggedInUser) {
        socket.emit("logout", { username: loggedInUser });
        loggedInUser = null;
        document.getElementById("chatContainer").classList.add("hidden");
        document.getElementById("loginContainer").classList.remove("hidden");
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        alert("You have been logged out.");
    }
}
