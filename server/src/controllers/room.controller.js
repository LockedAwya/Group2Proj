const Room = require('../models').Room;
const Review = require('../models').Review;
const User = require('../models').User;
const sequelize = require('../models').sequelize;
const _ = require('lodash');
const validation = require('../validations/room.validation');


const createRoom = async (req, res) => {
    const { error, value } = await validation.createSchema.validate(req.body);
    if (error) {
        res.status(403).send({ error: error.message });
    } else {
        if (!req.user.isAdmin) {
            res.status(401).send({ error: "User has no right to create room" });
        } else {
            try {
                let room = await Room.create(value);
                res.send(_.pick(room, ['id', 'roomname']));
                console.log('Room created');
            } catch (error) {
                res.status(400).send({ error: error.message });
            }
        }
    }
};

const editRoom = async (req, res) => {
    const { error, value } = await validation.editSchema.validate(req.body);
    if (error) {
        res.status(403).send({ error: error.message });
    } else {
        if (!req.user.isAdmin) {
            res.status(401).send({ error: "User has no right to edit room" });
        } else {
            try {
                await Room.update(_.omit(value, ['id']), {
                    where: {
                        id: value.id
                    }
                });
                res.send();
            } catch (error) {
                res.status(400).send({ error: error.message });
            }
        }
    }
};

const deleteRoom = async (req, res) => {
    if (!req.user.isAdmin) {
        res.status(401).send({ error: "User has no right to edit room" });
    } else if (!req.body.id) {
        res.status(403).send({ error: "User ID required" });
    } else {
        try {
            await Room.destroy({
                where: {
                    id: req.body.id
                }
            });
            res.send();
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    }
}

const getRoomList = async (req, res) => {
    try {
        const rooms = await Room.findAll({
            attributes: ['id', 'roomname', 'capacity', 'facilities', 'status', 'rating']
        });
        res.send(rooms);
    } catch(error) {
        res.status(400).send({ error: error.message });
    }
};

const getReviewList = async (req, res) => {
    const {error, value} = await validation.getReviewSchema.validate(req.body);
    if (error) {
        res.status(403).send({ error: error.message });
    } else {
        let reviews = await Review.findAll({
            attributes: ['id', 'rating', 'message', 'time'],
            where: {
                roomid: value.id
            },
            include: [{
                model: Room,
                as: "room",
                attributes: ['id', 'roomname']
            }, {
                model: User,
                as: "user",
                attributes: ['id',
                    [sequelize.fn('CONCAT', sequelize.col('firstname'), ' ', sequelize.col('lastname')), 'fullname']
                ]
            }]
        });
        res.send(reviews);
    }
};

module.exports = { createRoom, getRoomList, editRoom, deleteRoom, getReviewList };
