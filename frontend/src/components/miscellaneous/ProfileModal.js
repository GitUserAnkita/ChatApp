import { PhoneIcon, ViewIcon } from "@chakra-ui/icons";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, useDisclosure, IconButton, Text, Image, Menu, MenuItem, Center, } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Phone from "../../assets/phone.gif";
import Teams from "../../assets/teams.mp3";
import Hang from "../../assets/hang.png";
import * as classes from "./OptionsModule.css";
import { ChatState } from "../../Context/ChatProvider";
import { PhoneOutlined } from "@ant-design/icons";
import axios from "axios";
import NotificationBadge from "react-notification-badge";
import { Effect } from "react-notification-badge";

import io from "socket.io-client";
const ENDPOINT = "http://localhost:3000";
var socket;
socket = io(ENDPOINT);

const userStatus = {
  microphone: true,
  mute: false,
  username: "user#" + Math.floor(Math.random() * 999999),
  online: true,
};

const ProfileModal = ({ children }) => {
  const { onOpen, onClose } = useDisclosure();
  const { user, selectedChat, callNotification, setCallNotification } = ChatState();
  const [callAlertRing, setCallAlertRing] = useState(false)
  const [isOpen, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  // =============================================  calling ===============================================================

  async function mainFunction(time) {

    const config = {
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    };

    const { data } = await axios.post(
      "http://localhost:3000/api/call",
      {
        content: "default",
        chatId: selectedChat,
      },
      config
    );


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
          // socket.emit("voice", base64String);
          socket.emit("voice", { base64String, selectedChat, loginUserId, data });

        };

        madiaRecorder.start();
        setTimeout(function () {
          madiaRecorder.stop();
        }, time);
      });

      setTimeout(function () {
        madiaRecorder.stop();
      }, time);
    });
    socket.on("send", function (data) {
      console.log("send data  =====", data)
      var audio = new Audio(data);
      audio.play();
    });
    emitUserInformation()
  }
  function toggleConnection(e) {
    userStatus.online = !userStatus.online;
    emitUserInformation();
  }
  function emitUserInformation() {
    socket.emit("userInformation", userStatus);
  }


  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <>
          {/* <NotificationBadge count={callNotification.length} effect={Effect.SCALE} /> */}
          {/* {callNotification.length === 0 ? "" : <Modal isOpen={isOpen}
            onClose={handleClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Incomming call ...</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <img src={Phone} alt={'phone'} />
              </ModalBody>
              <Center>
                <ModalFooter>
                  <Button colorScheme='green' mr={3} onClick={() => { audio.pause();handleClose(); }}>
                    Accept
                  </Button>
                  <Button colorScheme='red' onClick={reLoadfun}>Decline</Button>
                </ModalFooter>
              </Center>
            </ModalContent>
          </Modal>} */}

          <IconButton d={{ base: "flex" }} icon={<PhoneIcon />} onClick={() => mainFunction(1000)} />
          <IconButton d={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />

        </>
      )}
      <Modal size="lg" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent h="410px">
          <ModalHeader fontSize="40px" fontFamily="Work sans" d="flex" justifyContent="center">
            {user.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody d="flex" flexDir="column" alignItems="center" justifyContent="space-between">
            <Image borderRadius="full" boxSize="150px" src={user.pic} alt={user.name} />
            <Text fontSize={{ base: "28px", md: "30px" }} fontFamily="Work sans">
              Email: {user.email}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </>
  );
};

export default ProfileModal;