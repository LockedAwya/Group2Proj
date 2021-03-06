const Meeting = require('../models').Meeting;
const User = require('../models').User;
const Room = require('../models').Room;
const sequelize = require('../models').sequelize;
const validation = require('../validations/meeting.validation');
const email_util = require('../utilities/email');
const _ = require('lodash');


const createMeeting = async (req, res) => {
    const {error, value} = await validation.createSchema.validate(req.body);
    if (error) {
        res.status(403).send({error: error.message})
    } else {
        if (!req.user.isAdmin) {
            res.status(401).send({error: "User has no right to create meeting"})
        } else {
            try {
                let available_meetings = await Meeting.findAll({
                    where: {
                        reserveddate: value.reserveddate,
                        roomid: value.roomid
                    }
                });
                let check = true;
                if (value.startingtime + value.during > 23) {
                    check = false;
                }
                for (let meet of available_meetings) {
                    if (value.startingtime >= meet.startingtime && value.startingtime <= meet.startingtime + meet.during) {
                        check = false;
                        break;
                    }
                    if (value.startingtime <= meet.startingtime && value.startingtime + value.during >= meet.startingtime) {
                        check = false;
                        break;
                    }
                }
                if (check) {
                    if (!value.password) {
                        value.password = ""
                    }
                    let meeting = await Meeting.create(value);
                    res.send(_.pick(meeting, ['id', 'roomid']));
                } else {
                    res.status(400).send({error: "The time has been overlapped by another meeting"})
                }
            } catch (error) {
                res.status(400).send({error: error.message});
            }
        }
    }
};

const editMeeting = async (req, res) => {
    const {error, value} = await validation.editSchema.validate(req.body);
    if (error) {
        res.status(403).send({ error: error.message });
    } else {
        if (!req.user.isAdmin) {
            res.status(401).send({error: "User has no right to edit the meeting"})
        } else {
            try {
                let original = await Meeting.findOne({
                    where: {
                        id: value.id
                    }
                });
                if (!original) {
                    res.status(400).send({ error: "Meeting not found" });
                } else {
                    // Check if modifying is valid
                    let reserveddate = value.reserveddate;
                    let startingtime = value.startingtime;
                    let during = value.during;
                    if (reserveddate == null) {
                        reserveddate = original.reserveddate;
                    }
                    if (startingtime == null) {
                        startingtime = original.startingtime;
                    }
                    if (during == null) {
                        during = original.during;
                    }
                    let available_meetings = await Meeting.findAll({
                        where: {
                            reserveddate: value.reserveddate,
                            roomid: value.roomid
                        }
                    });
                    let check = true;
                    if (value.startingtime + value.during > 23) {
                        check = false;
                    }
                    for (let meet in available_meetings) {
                        if (value.startingtime >= meet.startingtime && value.startingtime <= meet.startingtime + meet.during) {
                            check = false;
                        }
                    }
                    if (check) {
                        await Meeting.update(_.omit(value, ['id']), {
                            where: {
                                id: value.id
                            }
                        });
                        res.send();
                    } else {
                        res.status(400).send({error: "The time has been overlapped by another meeting"})
                    }
                }
            } catch(error) {
                res.status(400).send({ error: error.message });
            }
        }
    }
};

const deleteMeeting = async (req, res) => {
    const {error, value} = await validation.deleteSchema.validate(req.body);
    if (error) {
        res.status(403).send({ error: error.message });
    } else {
        if (!req.user.isAdmin) {
            res.status(401).send({ error: "User has no right to delete meeting" });
        } else {
            try {
                let meeting = await Meeting.findOne({
                    where: {
                        id: value.id
                    }
                });
                if (!meeting) {
                    res.status(404).send({ error: "Meeting not found "});
                } else if (meeting.adminid != req.user.id) {
                    res.status(401).send({ error: "User has no right to delete this room" });
                } else {
                    await Meeting.destroy({
                        where: {
                            id: value.id
                        }
                    });
                    res.send();
                }
            } catch(error) {
                res.status(400).send({ error: error.message });
            }
        }
    }
};

const getMeetingInfo = async (req, res) => {
    const {error, value} = await validation.infoSchema.validate(req.body);
    if (error) {
        res.status(403).send({error: error.message});
    } else {
        try {
            let meeting = await Meeting.findOne({
                where: {
                    id: value.id
                }
            });
            if (!meeting) {
                res.status(404).send({error: "Meeting not found"});
            } else {
                res.send(_.pick(meeting, 
                    ['adminid', 'roomid', 'reserveddate', 'startingtime', 'during', 'title', 'content', 'status']));
            }
        } catch (error) {
            res.status(400).send({error: error.message});
        }
    }
};

const sendEmail = async (req, res) => {
    const {error, value} = await validation.sendEmailSchema.validate(req.body);
    if (error) {
        res.status(403).send({error: error.message});
    } else {
        let meeting = await Meeting.findOne({
            include: [{
                model: Room,
                as: "room"
            }],
            where: {
                id: value.id,
                adminid: req.user.id
            }
        });
        if (!meeting) {
            res.status(400).send({ error: "Meeting not found" });
        } else {
            let users = await User.findAll({
                attributes: ['email', 
                    [sequelize.fn('CONCAT', sequelize.col('firstname'), ' ', sequelize.col('lastname')), 'fullname']],
                include: [{
                    model: Meeting,
                    as: "meeting",
                    attributes: [],
                    where: {
                        id: value.id
                    }
                }],
                raw: true
            });
            res.send();
            // Sending email
            users.forEach(i => {
                let receiver = i['email'];
                let fullname = i['fullname'];
                let date = meeting['reserveddate'];
                let title = meeting['title'];
                let content = meeting['content'];
                let roomname = meeting['room']['roomname'];
                let during = meeting['during'];
                let startingtime = meeting['startingtime'];
                email_util.send_invite_email(receiver, fullname, roomname, date, startingtime, during, title, content);
            });
            console.log(`Invite email sent to ${users.length} people`);
        }
    }
};

module.exports = { createMeeting, editMeeting, deleteMeeting, getMeetingInfo, sendEmail };
