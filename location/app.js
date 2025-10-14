const express = require("express")
const { WebSocketServer } = require("ws")
const app = express()

// public 폴더에 html/js/css 두고 사용
app.use(express.static("public"))

app.listen(8000, () => {
  console.log(`Example app listening on port 8000`)
})

const wss = new WebSocketServer({ port: 8001 })

// 모든 클라이언트에게 메시지 뿌리기
wss.broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 연결된 상태
      client.send(message);
    }
  });
};

wss.on("connection", (ws, request) => {
  console.log(`새로운 유저 접속: ${request.socket.remoteAddress}`)

  ws.on("message", (data) => {
    // 받은 데이터를 그대로 모든 클라이언트에게 전송
    wss.broadcast(data.toString());
  });

  ws.on("close", () => {
    wss.broadcast(JSON.stringify({
      type: "system",
      message: `유저 한명이 떠났습니다. 현재 유저 ${wss.clients.size} 명`
    }));
  });

  wss.broadcast(JSON.stringify({
    type: "system",
    message: `새로운 유저가 접속했습니다. 현재 유저 ${wss.clients.size} 명`
  }));
})
