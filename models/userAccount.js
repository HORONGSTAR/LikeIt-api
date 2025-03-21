const Sequelize = require('sequelize')

module.exports = class UserAccount extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
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
            // 프로필 아이디
            profileId: {
               type: Sequelize.STRING(100),
            },
         },
         {
            sequelize,
            // 연동일, 해제일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'UserAccount',
            tableName: 'userAccounts',
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
