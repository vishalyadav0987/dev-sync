import { io } from "socket.io-client";

const url = "http://localhost:3000";

async function run() {
  console.log("Connecting sockets...");
  const s1 = io(url);
  const s2 = io(url);
  
  s1.on("connect", () => {
    s1.emit("chat:join", { uuid: "uuid-1" }, (res) => {
      console.log("s1 joined", res.onlineCount);
      
      s2.emit("chat:join", { uuid: "uuid-2" }, (res2) => {
        console.log("s2 joined", res2.onlineCount);
        
        s2.disconnect();
        
        // Wait to see if s1 receives a presence update
        s1.on("chat:presence", (data) => {
          console.log("s1 received presence:", data);
          s1.disconnect();
          process.exit(0);
        });
        
        setTimeout(() => {
          console.log("Timeout waiting for presence");
          process.exit(1);
        }, 2000);
      });
    });
  });
}

run();
