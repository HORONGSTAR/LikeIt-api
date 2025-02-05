const Sequelize = require('sequelize')

module.exports = class UserAccount extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 계정 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 계정주소
            accountEmail: {
               type: Sequelize.STRING(500),
               allowNull: false,
               unique: true,
            },
            // 계정타입
            accountType: {
               type: Sequelize.ENUM('GOOGLE', 'KAKAO'),
               allowNull: false,
            },
         },
         {
            sequelize,
            // 연동일, 해제일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'UserAccount',
            tableName: 'userAccount',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      UserAccount.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
