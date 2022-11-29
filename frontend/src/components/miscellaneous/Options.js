import React, { useState, useContext, useEffect, useRef } from "react";
import { Input, Tooltip, message } from "antd";
import Phone from "../../assets/phone.gif";
import Teams from "../../assets/teams.mp3";
import * as classes from "./OptionsModule.css";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ChatState } from "../../Context/ChatProvider";
import Hang from "../../assets/hang.png";

import { PhoneOutlined, } from "@ant-design/icons";
import { socket } from "../../Context/ChatProvider";
import { Button, Center, IconButton, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import { PhoneIcon } from "@chakra-ui/icons";
import NotificationBadge from "react-notification-badge";
import { Effect } from "react-notification-badge";
var sId;
const Options = () => {

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isModalVisible, setIsModalVisible] = useState(false);
  const Audio1 = useRef();
  const { callNotification, call, callAccepted, setName, callEnded, me, callUser, leaveCall, answerCall, setOtherUser, leaveCall1 } = ChatState()


  let audio = new Audio(Teams)
  useEffect(() => {
    if (isModalVisible) {
      Audio1?.current?.play();
      // audio.play();
    } else{
      audio.pause();
       Audio1?.current?.pause()
      };

    sId = localStorage.getItem('socketId')
  }, [isModalVisible]);

  const showModal = (showVal) => {
    console.log("showVal ===", showVal)
    setIsModalVisible(showVal);
  };

  const handleCancel = () => {
    // audio.pause()
    setIsModalVisible(false);
    leaveCall1();
    window.location.reload();
  };

  useEffect(() => {
    if (call.isReceivingCall && !callAccepted) {
      setIsModalVisible(true);
      setOtherUser(call.from);
    } else setIsModalVisible(false);
  }, [call.isReceivingCall]);

  return (
    <>
      <div className={classes.options}>
        {console.log("callAccepted ",callAccepted,"callEnded =",callEnded)}
        <div style={{ marginBottom: "0.5rem" }}>
          {callAccepted && !callEnded ? (
            <Button
              onClick={leaveCall}
              className={classes.hang}
              tabIndex="0"
            >
              <img src={Hang} alt="hang up" style={{ height: "25px" }} />
              &nbsp; Hang up
            </Button>
          ) : (
            <>
              <NotificationBadge count={callNotification.length} effect={Effect.SCALE} />
              <IconButton d={{ base: "flex" }} icon={<PhoneIcon />} onClick={() => callUser(me)} className={classes.btn} />
              {console.log("notification length ",callNotification.length)}
              {callNotification.length === 0 ? ""
                : <>
                      <audio src={Teams} loop ref={Audio1} />
                      <Modal isOpen={() => showModal(false)} onClose={handleCancel}>
                        <ModalOverlay />
                        <ModalContent>
                          <ModalHeader>Incomming Call.....</ModalHeader>
                          <ModalBody>
                            <div style={{ display: "flex", justifyContent: "space-around" }}>
                              <img
                                src={Phone}
                                alt="phone ringing"
                                className={classes.phone}
                                style={{ display: "inline-block" }}
                              />
                            </div>
                          </ModalBody>
                          <Center>  
                            <ModalFooter>
                              <div className={classes.btnDiv}>
                                <Button
                                  className={classes.answer}
                                  colorScheme='green'
                                  icon={<PhoneOutlined />}
                                  onClick={() => {
                                    audio.pause();
                                    answerCall();
                                    Audio1.current.pause();
                                  }}
                                  tabIndex="0"
                                >
                                  Answer
                                </Button>
                                &nbsp;&nbsp;&nbsp;
                                <Button
                                  colorScheme='red'
                                  className={classes.decline}
                                  onClick={() => {  audio.pause();handleCancel(); setIsModalVisible(false); Audio1.current.pause(); }}
                                  onClose={onClose}
                                  tabIndex="0"
                                >
                                  Decline
                                </Button>
                              </div>
                            </ModalFooter>
                          </Center>
                        </ModalContent>
                      </Modal>
                    </>
                }
            </>
          )}
        </div>

        {/* {call.isReceivingCall && !callAccepted && (
          <>
            <audio src={Teams} loop ref={Audio} />
            <Modal isOpen={() => showModal(false)} onClose={handleCancel}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader> {call.name} is calling you:{" "}</ModalHeader>
                <ModalBody>
                  <div style={{ display: "flex", justifyContent: "space-around" }}>
                      <img
                        src={Phone}
                        alt="phone ringing"
                        className={classes.phone}
                        style={{ display: "inline-block" }}
                      />
                  </div>
                </ModalBody>
                <Center>
                <ModalFooter>
                  <div className={classes.btnDiv}>
                    <Button
                      className={classes.answer}
                      colorScheme='green'
                      icon={<PhoneOutlined />}
                      onClick={() => {
                        answerCall();
                        Audio.current.pause();
                      }}
                      tabIndex="0"
                    >
                      Answer
                    </Button>
                    &nbsp;&nbsp;&nbsp;
                    <Button
                      colorScheme='red'
                      className={classes.decline} 
                      onClick={() => {handleCancel(); setIsModalVisible(false); Audio.current.pause();}}
                      onClose={onClose}
                      tabIndex="0"
                       >
                      Decline
                    </Button>
                  </div>
                </ModalFooter>
                </Center>
              </ModalContent>
            </Modal>
          </>
        )} */}
      </div>

    </>
  );
};

export default Options;
