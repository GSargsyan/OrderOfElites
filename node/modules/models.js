const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('ooe_db', 'ooe', 'ooe_pwd', {
  host: 'ooe_psql',
  dialect: 'postgres',
  port: 5432,
  logging: false // Set to console.log to see the generated SQL queries
});

// 2. Define the Model
const ChatRoom = sequelize.define('ChatRoom', {
  name: {
    type: DataTypes.STRING(30),
    field: 'name',
  },
  creatorUserId: {
    type: DataTypes.INTEGER,
    field: 'creator_user_id',
  },
  chatType: {
    type: DataTypes.ENUM('direct', 'group', 'city', 'syndicate'),
    field: 'chat_type',
  },
  cityId: {
    type: DataTypes.INTEGER,
    field: 'city_id',
  },
  // users: association defined later
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  }
}, {
  tableName: 'ooe_chat_rooms',
  timestamps: true // to handle createdAt and updatedAt
});

// Define associations if necessary
// ChatRoom.belongsTo(User, { foreignKey: 'creatorUserId' });
// ChatRoom.belongsTo(City, { foreignKey: 'cityId' });
// ChatRoom.belongsToMany(User, { through: 'ChatRoomUsers' });

module.exports = { ChatRoom, sequelize }