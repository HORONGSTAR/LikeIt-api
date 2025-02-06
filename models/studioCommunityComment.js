const Sequelize = require('sequelize')

module.exports = class StudioCommunityComment extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 내용
            comment: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
         },
         {
            sequelize,
            // 작성시간, 수정시간, 삭제시간
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'StudioCommunityComment',
            tableName: 'studioCommunityComments',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      StudioCommunityComment.belongsTo(db.StudioCommunity, {
         foreignKey: 'communityId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      StudioCommunityComment.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
