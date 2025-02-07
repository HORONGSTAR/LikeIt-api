const Sequelize = require('sequelize')

module.exports = class StudioCommunityImg extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 원본 이미지 이름
            oriImgName: {
               type: Sequelize.STRING(500),
               allowNull: false,
               unique: true,
            },
            // 이미지 경로
            imgUrl: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            paranoid: false,
            underscored: false,
            modelName: 'StudioCommunityImg',
            tableName: 'studioCommunityImgs',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      StudioCommunityImg.belongsTo(db.StudioCommunity, {
         foreignKey: 'communityId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
