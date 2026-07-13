const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('ooe_db', 'ooe', 'ooe_pwd', {
  host: 'ooe_psql',
  dialect: 'postgres',
  port: 5432,
  logging: false
});

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
  timestamps: true
});

const Message = sequelize.define('Message', {
  chatRoomId: {
    type: DataTypes.INTEGER,
    field: 'chat_room_id',
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id',
  },
  message: {
    type: DataTypes.TEXT,
    field: 'message',
  },
  readAt: {
    type: DataTypes.DATE,
    field: 'read_at',
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
}, {
  tableName: 'ooe_messages',
  timestamps: true,
  updatedAt: false,
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING(30),
    field: 'username',
  },
}, {
  tableName: 'ooe_users',
  timestamps: false,
});

// Associations
Message.belongsTo(ChatRoom, { foreignKey: 'chat_room_id' });
ChatRoom.hasMany(Message, { foreignKey: 'chat_room_id' });
Message.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { ChatRoom, Message, User, sequelize }