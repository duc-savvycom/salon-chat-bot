"use strict";
var SimpleFilter = require("./bot_filter/simpleFilter");
var SpamFilter = require("./bot_filter/spamFilter");
var ButtonFilter = require("./bot_filter/buttonFilter");
var EndFilter = require("./bot_filter/endFilter");

var async = require("asyncawait/async");
var await = require("asyncawait/await");

var BOT_REPLY_TYPE = require("./constants").BOT_REPLY_TYPE;
var BUTTON_TYPE = require("./constants").BUTTON_TYPE;
var PAYLOAD = require("./constants").PAYLOAD;

var fbAPI = require("./api/facebookAPI");
var faceRecAPI = require("./api/faceRecAPI");
var ulti = require("./utilities");


class BotAsync {
    constructor() {
        this._helloFilter = new ButtonFilter(["hi", "halo", "hế nhô", "he lo", "hello", "chào", "xin chào", "helo", "alo"],
            "Chào mừng bạn đến với Salon Đức Anh! Bạn muốn sử dụng dịch vụ nào:", [{
                title: "Đặt lịch",
                type: BUTTON_TYPE.POSTBACK,
                payload: PAYLOAD.BOOKING_POST
            }, {
                title: "Thông tin về Salon",
                type: BUTTON_TYPE.POSTBACK,
                payload: PAYLOAD.INFO_POST
            }]);
        
        var thankyouFilter = new SimpleFilter(["cảm ơn", "thank you", "thank", "nice"], "Salon Đức Anh rất hân hạnh được phục vụ bạn");
        
        this._goodbyeFilter = new SimpleFilter(["tạm biệt", "bye", "bai bai", "good bye"], "Tạm biệt, hẹn gặp lại");

        this._filters = [
            new SpamFilter(),
            thankyouFilter,
            this._goodbyeFilter, 
            this._helloFilter, 
            new EndFilter()
        ];
    }

    setSender(sender) {
        this._helloFilter.setOutput('Xin chào ${sender.first_name} đến với Salon Đức Anh, Bạn muốn sử dụng dịch vụ nào:');
        this._goodbyeFilter.setOutput('Tạm biệt ${sender.first_name}, hẹn gặp lại ;)');
    }

    chat(input) {
        for (var filter of this._filters) {
            if (filter.isMatch(input)) {
                filter.process(input);
                return filter.reply(input);
            }
        }
    }

    reply(senderId, textInput) {
        async(() => {
            var sender = await (fbAPI.getSenderName(senderId));
            this.setSender(sender);

            var botReply = await (this.chat(textInput));
            var output = botReply.output;
            switch (botReply.type) {
                case BOT_REPLY_TYPE.TEXT:
                    fbAPI.sendTextMessage(senderId, output);
                    break;
                case BOT_REPLY_TYPE.BUTTONS:
                    let buttons = botReply.buttons;
                    fbAPI.sendButtonMessage(senderId, output, buttons);
                    break;
                default:
            }
        })();
    }

    processPostback(senderId, payload) {
        async(() => {
            var sender = await (fbAPI.getSenderName(senderId));
            this.setSender(sender);
            switch (payload) {
                case PAYLOAD.BOOKING_POST:
                    this.reply(senderId, "{booking}");
                    break;
                case PAYLOAD.INFO_POST:
                    this.reply(senderId, "{info}");
                    break;
                case PAYLOAD.HELP:
                    this.reply(senderId, "-help");
                    break;
                default:
                    console.log("Unknown payload: " + payload);
            }
        })();
    }
}

module.exports = new BotAsync();