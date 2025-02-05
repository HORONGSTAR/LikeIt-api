const Sequelize = require('sequelize')

module.exports = class StudioCreator extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 스튜디오유저 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 대표여부
            role: {
               type: Sequelize.ENUM('LEADER', 'TEAMMATE'),
               allowNull: false,
            },
            // 게시물 관리권한
            communityAdmin: {
               type: Sequelize.ENUM('Y', 'N'),
            },
            // 스페이스 권한
            spaceAdmin: {
               type: Sequelize.ENUM('Y', 'N'),
            },
         },
         {
            sequelize,
            // 가입일, 갱신일, 탈퇴일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'StudioCreator',
            tableName: 'studioCreator',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      StudioCreator.hasMany(db.ProjectBudget, {
         foreignKey: 'studioCreatorId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      StudioCreator.belongsTo(db.Creator, {
         foreignKey: 'creatorId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      StudioCreator.belongsTo(db.Studio, {
         foreignKey: 'studioId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
