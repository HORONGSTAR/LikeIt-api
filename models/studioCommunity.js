const Sequelize = require('sequelize')

module.exports = class StudioCommunity extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 제목
            title: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
            // 게시물 내용
            contents: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            // 이미지 경로
            imgUrl: {
               type: Sequelize.STRING(200),
            },
            // 공지여부
            notice: {
               type: Sequelize.ENUM('Y', 'N'),
               defaultValue: 'N',
            },
         },
         {
            sequelize,
            // 작성일, 수정일, 삭제일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'StudioCommunity',
            tableName: 'studiocommunites',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      StudioCommunity.hasMany(db.StudioCommunityComment, {
         foreignKey: 'communityId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      StudioCommunity.belongsTo(db.Studio, {
         foreignKey: 'studioId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      StudioCommunity.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
