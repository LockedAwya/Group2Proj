
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Room', {
        // id is auto-generated
        roomname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        facilities: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.STRING
        },
        rating: {
            type: DataTypes.INTEGER,
            defaultValue: 10
        }
    }, {
        charset: "utf8",
        collate: "utf8_unicode_ci"
    });
};