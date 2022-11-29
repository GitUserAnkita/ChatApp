const asyncHandler = require("express-async-handler");
const Call = require("../models/callModal");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

const voiceCall = asyncHandler(async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) {
      console.log("Invalid data passed into request");
      return res.sendStatus(400);
    }
    var newCall = {
      sender: req.user._id,
      // content: content,
      chat: chatId,
    };
    try {
      var calldata = await Call.create(newCall);
      calldata = await calldata.populate("sender", "name pic").execPopulate();
      calldata = await calldata.populate("chat").execPopulate();
      calldata = await User.populate(calldata, {
        path: "chat.users",
        select: "name pic email",
      });
      await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: calldata });
      res.json(calldata);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  });

  module.exports = { voiceCall };