const socket = io();

//Elements
const chatForm = document.getElementById("message-form");
const chatFormBtn = chatForm.querySelector("button");
const chatFormInput = chatForm.querySelector("input");
const sendLocationBtn = document.getElementById("send-location");
const $messages = document.querySelector("#messages");
const $chatSidebar = document.querySelector(".chat__sidebar");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Query
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  //new message Height
  const $newMessage = $messages.lastElementChild;

  //Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  //visable height
  const viableHeight = $messages.offsetHeight;
  //height of messages container
  const containerHeight = $messages.scrollHeight;

  //How far have I scrolled?
  const scrollOffset = $messages.scrollTop + viableHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};
//chat message
socket.on("message", (messageObj) => {
  const html = Mustache.render(messageTemplate, {
    username: messageObj.username,
    message: messageObj.text,
    createdAt: moment(messageObj.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

//location message
socket.on("locationMessage", (locationObj) => {
  const html = Mustache.render(locationTemplate, {
    username: locationObj.username,
    locationUrl: locationObj.url,
    createdAt: moment(locationObj.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

//user list
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  console.log($chatSidebar);
  $chatSidebar.innerHTML = html;
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  //disable form submit
  chatFormBtn.setAttribute("disabled", true);
  const inputValue = e.target.elements.message.value;
  socket.emit("sendMessage", inputValue, (error) => {
    //enable form submit
    chatFormBtn.removeAttribute("disabled");
    e.target.elements.message.value = "";
    chatFormInput.focus();
    if (error) {
      alert(error);
      location.href = "/";
      return;
    }
    console.log("message is delivered");
  });
});

sendLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    //disable share location button
    sendLocationBtn.setAttribute("disabled", "disabled");
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      (error) => {
        //enable share location button
        sendLocationBtn.removeAttribute("disabled");
        if (error) {
          alert(error);
          location.href = "/";
          return;
        }
        console.log("Location shared");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
