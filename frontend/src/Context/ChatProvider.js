import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import io from "socket.io-client";
import Peer from "simple-peer";
import axios from "axios";
const SERVER_URL = "http://localhost:3000/";
var sId;

export const socket = io(SERVER_URL);
const ChatContext = createContext();

const userStatus = {
  microphone: true,
  mute: false,
  username: "user#" + Math.floor(Math.random() * 999999),
  online: true,
};

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();

  const [user, setUser] = useState();
  const [notification, setNotification] = useState([]);
  const [callNotification, setCallNotification] = useState([]);
  const [chats, setChats] = useState();

  const history = useHistory();

  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [chat, setChat] = useState([]);
  const [name, setName] = useState("");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");
  const [userName, setUserName] = useState("");
  const [otherUser, setOtherUser] = useState("");
  const [myVdoStatus, setMyVdoStatus] = useState(true);
  const [userVdoStatus, setUserVdoStatus] = useState();
  const [myMicStatus, setMyMicStatus] = useState(true);
  const [userMicStatus, setUserMicStatus] = useState();
  const [msgRcv, setMsgRcv] = useState("");

  const myVideo = useRef();

  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUser(userInfo);
    if (!userInfo) history.push("/");

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      console.log("currentStreamcurrentStream", currentStream)
      setStream(currentStream);
      myVideo.current.srcObject = currentStream;

    });

    if (localStorage.getItem("userInfo")) {
      setName(userInfo.name);
    }
    socket.on("me", (id) => {
      localStorage.setItem("socketId", id)
      setMe(id)
    });

    socket.on("endCall", () => {
      window.location.reload();
    });

    socket.on("updateUserMedia", ({ type, currentMediaStatus }) => {
      console.log("updateUserMedia Type ===", type)
      if (currentMediaStatus !== null || currentMediaStatus !== []) {
        switch (type) {
          case "video":
            setUserVdoStatus(currentMediaStatus);
            break;
          case "mic":
            // setUserMicStatus(currentMediaStatus);
            setUserMicStatus(true);
            break;
          default:
            setUserMicStatus(currentMediaStatus[0]);
            setUserVdoStatus(currentMediaStatus[1]);
            break;
        }
      }
    });

    socket.on("callUser", ({ signal, from, name }) => {
      setCall({ isReceivingCall: true, signal, from, name });
    });

    socket.on("msgRcv", ({ name, msg: value, sender }) => {
      setMsgRcv({ value, sender });
      setTimeout(() => {
        setMsgRcv({});
      }, 1000);
    });
  }, [history]);
  console.log("kgjjgkfgfkjgkjk",call)

  //  ------------------------------------- callUser Function -----------------------------------------------------------

  const callUser = async (id) => {
    sId = localStorage.getItem('socketId')
    const config = {
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    };
    const data = await axios.post(
      "http://localhost:3000/api/call",
      {
        content: "default",
        chatId: selectedChat,
      },
      config
    );

    var callData = data.data
    const peer = new Peer({ initiator: true, trickle: false, stream });
    setOtherUser(id);
    peer.on("signal", (data) => {
      // console.log("userToCall =",sId,"signalData=",data,"name =",name)
      socket.emit("callUser", {
        userToCall: sId,
        signalData: data,
        from: sId,
        name,
        callData
      });
    });
    console.log("calldata -", callData)
    // peer.on("stream", (currentStream) => {
    //   userVideo.current.srcObject = currentStream;
    // });
    // socket.on("callAccepted", ({ signal, userName }) => {
    //   setCallAccepted(true);
    //   setUserName(userName);
    //   peer.signal(signal);
    //   socket.emit("updateMyMedia", {
    //     type: "both",
    //     currentMediaStatus: [myMicStatus, myVdoStatus],
    //   });
    // });
    // connectionRef.current = peer;
    // console.log(connectionRef.current);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      var madiaRecorder = new MediaRecorder(stream);
      madiaRecorder.start();
      var audioChunks = [];
      madiaRecorder.addEventListener("dataavailable", function (event) {
        audioChunks.push(event.data);
      });

      madiaRecorder.addEventListener("stop", function () {
        var audioBlob = new Blob(audioChunks);
        audioChunks = [];
        const userid = JSON.parse(localStorage.getItem('userInfo'));
        const loginUserId = userid._id
        var fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = function () {
          if (!userStatus.microphone || !userStatus.online) return;
          var base64String = fileReader.result;
          socket.emit("voice", base64String);
          // socket.emit("voice", { base64String, selectedChat, loginUserId, data });
        };
        madiaRecorder.start();
        setTimeout(function () {
          madiaRecorder.stop();
        }, 1000);
      });
      setTimeout(function () {
        madiaRecorder.stop();
      }, 1000);
    });
    socket.on("send", function (data) {
      console.log("callSendData =", data)
      var audio = new Audio(data);
      audio.play();
    });
    emitUserInformation()
  };
  //  ------------------------------------- answerCallFunction ---------------------------------------------------------
  const answerCall = async () => {
    setCallAccepted(true);
    setOtherUser(call.from);
    // const peer = new Peer({ initiator: false, trickle: false, stream });
    // peer.on("signal", (data) => {
    //   socket.emit("answerCall", {
    //     signal: data,
    //     to: call.from,
    //     userName: name,
    //     type: "both",
    //     myMediaStatus: [myMicStatus, myVdoStatus],
    //   });
    // });

    // peer.on("stream", (currentStream) => {
    //   userVideo.current.srcObject = currentStream;
    // });
    // peer.signal(call.signal);
    // connectionRef.current = peer;
    // console.log(connectionRef.current);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      var madiaRecorder = new MediaRecorder(stream);
      madiaRecorder.start();
      var audioChunks = [];
      madiaRecorder.addEventListener("dataavailable", function (event) {
        audioChunks.push(event.data);
      });

      madiaRecorder.addEventListener("stop", function () {
        var audioBlob = new Blob(audioChunks);
        audioChunks = [];
        const userid = JSON.parse(localStorage.getItem('userInfo'));
        const loginUserId = userid._id
        var fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = function () {
          if (!userStatus.microphone || !userStatus.online) return;
          var base64String = fileReader.result;
          socket.emit("voice", base64String);
          // socket.emit("voice", { base64String, selectedChat, loginUserId, data });

        };
        madiaRecorder.start();
        setTimeout(function () {
          madiaRecorder.stop();
        }, 1000);
      });
      setTimeout(function () {
        madiaRecorder.stop();
      }, 1000);
    });
    socket.on("send", function (data) {
      console.log("callSendData =", data)
      var audio = new Audio(data);
      audio.play();
    });
    emitUserInformation()

  };
  //  ------------------------------------- emitUserInformation Function -----------------------------------------------

  const emitUserInformation = () => {
    socket.emit("userInformation", userStatus);
  }
  //  ------------------------------------- updateVideo Function --------------------------------------------------------

  const updateVideo = () => {
    setMyVdoStatus((currentStatus) => {
      socket.emit("updateMyMedia", {
        type: "video",
        currentMediaStatus: !currentStatus,
      });
      stream.getVideoTracks()[0].enabled = !currentStatus;
      return !currentStatus;
    });
  };
  //  ------------------------------------- updateMic Function ---------------------------------------------------------

  const updateMic = () => {
    setMyMicStatus((currentStatus) => {
      socket.emit("updateMyMedia", {
        type: "mic",
        currentMediaStatus: !currentStatus,
      });
      stream.getAudioTracks()[0].enabled = !currentStatus;
      return !currentStatus;
    });
  };
  //  ------------------------------------- leaveCall Function ---------------------------------------------------------
  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();
    socket.emit("endCall", { id: otherUser });
    window.location.reload();
  };
  //  ------------------------------------- leaveCall1 Function --------------------------------------------------------
  const leaveCall1 = () => {
    socket.emit("endCall", { id: otherUser });
  };
  //  ------------------------------------- sendMsg Function ------------------------------------------------------------
  const sendMsg = (value) => {
    socket.emit("msgUser", { name, to: otherUser, msg: value, sender: name });
    let msg = {};
    msg.msg = value;
    msg.type = "sent";
    msg.timestamp = Date.now();
    msg.sender = name;
    setChat([...chat, msg]);
  };

  return (

    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
        me,
        setMe,
        callNotification,
        setCallNotification,


        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
        sendMsg,
        msgRcv,
        chat,
        setChat,
        setMsgRcv,
        setOtherUser,
        leaveCall1,
        userName,
        myVdoStatus,
        setMyVdoStatus,
        userVdoStatus,
        setUserVdoStatus,
        updateVideo,
        myMicStatus,
        userMicStatus,
        updateMic,
      }}
    >
      {children}
    </ChatContext.Provider>

  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
