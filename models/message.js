const Sequelize = require('sequelize')

module.exports = class Message extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 알림 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 알림내용
            message: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
         },
         {
            sequelize,
            // 발송일, 삭제일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'Message',
            tableName: 'message',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Message.belongsTo(db.User, {
         foreignKey: 'sendUserId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      Message.belongsTo(db.User, {
         foreignKey: 'receiveUserId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
