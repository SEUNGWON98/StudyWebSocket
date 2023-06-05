const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");
const FrontendSocket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload) {
  const msg = { type, payload };
  return JSON.stringify(msg);
}

FrontendSocket.addEventListener("open", () => {
  console.log("Connected to Server");
});

FrontendSocket.addEventListener("message", (message) => {});

FrontendSocket.addEventListener("close", () => {
  console.log("Disconnected Server");
});

// setTimeout(() => {
//   FrontendSocket.send("hello from the browser!");
// }, 5000);

function handleSubmit(event) {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  FrontendSocket.send(makeMessage("new_message", input.value));
  const li = document.createElement("li");
  li.innerText = `You: ${input.value}`;
  messageList.append(li);
  input.value = "";
}

function handleNickSubmit(event) {
  event.preventDefault();
  const input = nickForm.querySelector("input");
  FrontendSocket.send(makeMessage("nickname", input.value));
  input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);
