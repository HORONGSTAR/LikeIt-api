const Sequelize = require('sequelize')

module.exports = class Message extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 알림내용
            message: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
            // 이미지 id
            imgId: {
               type: Sequelize.NUMBER,
            },
            // 이미지를 불러올 테이블 타입
            imgType: {
               type: Sequelize.ENUM('PROJECT', 'STUDIO', 'USER', 'REVIEW', 'NO_IMG'),
               defaultValue: 'NO_IMG',
            },
         },
         {
            sequelize,
            // 발송일, 삭제일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'Message',
            tableName: 'messages',
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
